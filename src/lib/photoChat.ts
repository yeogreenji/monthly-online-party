/* 3단계 사진 채팅 — 사진은 DB가 아니라 Supabase Storage(private 버킷)에 올리고,
   메시지에는 객체 경로와 크기만 남긴다. 화면에는 짧은 signed URL로 보여 준다.
   (PHOTO_CHAT_SCALE_SPEC_V1: 본문에 base64를 싣지 않는다) */
import { supabase } from './supabase'

export const PHOTO_BUCKET = 'chat-photos'
/** 전송 이미지 장당 상한(정본 제안값 1MB). */
export const MAX_SEND_BYTES = 1_000_000
/** 원본 선택 상한. */
export const MAX_SOURCE_BYTES = 10_000_000
const MAX_EDGE = 1600
const THUMB_EDGE = 480
const SIGNED_SECONDS = 3600

export interface PreparedPhoto {
  full: Blob
  thumb: Blob
  width: number
  height: number
  bytes: number
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('파일을 읽지 못했어요.'))
    reader.readAsDataURL(file)
  })
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('이미지를 열지 못했어요. JPEG·PNG·WebP 사진을 골라 주세요.'))
    img.src = dataUrl
  })
}

function drawToBlob(image: HTMLImageElement, maxEdge: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('사진을 처리하지 못했어요.'))
  // EXIF·GPS 등 메타데이터가 남지 않도록 새 캔버스에 다시 그려 JPEG로만 저장한다.
  ctx.drawImage(image, 0, 0, width, height)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('사진을 처리하지 못했어요.'))), 'image/jpeg', quality)
  })
}

/** 고른 사진을 전송용(≤1MB, 긴 변 1600px)과 썸네일(480px)로 만든다. */
export async function prepareChatPhoto(file: File): Promise<PreparedPhoto> {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new Error('JPEG·PNG·WebP 사진만 올릴 수 있어요.')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('10MB 이하 사진만 고를 수 있어요.')
  const image = await loadImage(file)
  let quality = 0.82
  let full = await drawToBlob(image, MAX_EDGE, quality)
  while (full.size > MAX_SEND_BYTES && quality > 0.42) {
    quality -= 0.1
    full = await drawToBlob(image, MAX_EDGE, quality)
  }
  if (full.size > MAX_SEND_BYTES) throw new Error('사진을 1MB 아래로 줄이지 못했어요. 다른 사진을 골라 주세요.')
  const thumb = await drawToBlob(image, THUMB_EDGE, 0.7)
  return { full, thumb, width: image.width, height: image.height, bytes: full.size }
}

export function photoChatEnabled(): boolean {
  return supabase !== null
}

/** 로그인한 사용자 폴더에만 올린다(Storage 정책이 같은 규칙을 서버에서 강제한다). */
export async function uploadChatPhoto(topicId: string, photo: PreparedPhoto, userId: string): Promise<{ path: string; thumbPath: string }> {
  if (!supabase) throw new Error('서버 사진 저장소가 연결되지 않았어요.')
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const dir = `${userId}/${topicId}`
  const path = `${dir}/${id}.jpg`
  const thumbPath = `${dir}/${id}_thumb.jpg`
  const first = await supabase.storage.from(PHOTO_BUCKET).upload(path, photo.full, { contentType: 'image/jpeg', upsert: false })
  if (first.error) throw new Error(uploadError(first.error.message))
  const second = await supabase.storage.from(PHOTO_BUCKET).upload(thumbPath, photo.thumb, { contentType: 'image/jpeg', upsert: false })
  if (second.error) {
    // 썸네일이 실패하면 본문 사진도 지워 고아 객체를 남기지 않는다.
    await supabase.storage.from(PHOTO_BUCKET).remove([path])
    throw new Error(uploadError(second.error.message))
  }
  return { path, thumbPath }
}

function uploadError(message: string): string {
  if (/bucket/i.test(message)) return '사진 저장소가 아직 준비되지 않았어요. (chat-photos 버킷 필요)'
  if (/policy|row-level|permission|unauthorized/i.test(message)) return '사진을 올릴 권한이 없어요. 다시 로그인해 주세요.'
  if (/size|too large|exceeded/i.test(message)) return '사진이 너무 커요. 더 작은 사진을 골라 주세요.'
  return '사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요.'
}

export async function signedPhotoUrl(path: string | undefined): Promise<string | undefined> {
  if (!supabase || !path) return undefined
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, SIGNED_SECONDS)
  return error ? undefined : data?.signedUrl
}

export async function signedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (!supabase || paths.length === 0) return {}
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, SIGNED_SECONDS)
  if (error || !data) return {}
  const out: Record<string, string> = {}
  for (const item of data) if (item.path && item.signedUrl) out[item.path] = item.signedUrl
  return out
}

export async function deleteChatPhoto(path: string, thumbPath?: string): Promise<boolean> {
  if (!supabase || !path) return false
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path, ...(thumbPath ? [thumbPath] : [])])
  return !error
}
