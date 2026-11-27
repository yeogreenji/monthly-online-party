import { supabase, serverEnabled } from './supabase'
import { createLocalTransport, type ChatTransport, type TransportMessage } from './chatTransport'
import { signedPhotoUrl, signedPhotoUrls } from './photoChat'

type Row = {
  id: string
  user_id: string
  topic_id: string
  nickname: string
  body: string
  place_name: string | null
  place_url: string | null
  spoiler: boolean
  created_at: string
  image_path?: string | null
  image_thumb_path?: string | null
  image_width?: number | null
  image_height?: number | null
}

const MESSAGE_COLUMNS =
  'id,topic_id,user_id,nickname,body,place_name,place_url,spoiler,created_at,image_path,image_thumb_path,image_width,image_height'
const MESSAGE_COLUMNS_BASIC = 'id,topic_id,user_id,nickname,body,place_name,place_url,spoiler,created_at'

const fromRow = (r: Row, urls: Record<string, string> = {}): TransportMessage => ({
  id: r.id,
  topicId: r.topic_id,
  text: r.body,
  at: r.created_at,
  by: r.nickname,
  userId: r.user_id,
  image: r.image_path ? urls[r.image_path] : undefined,
  imagePath: r.image_path ?? undefined,
  imageThumbPath: r.image_thumb_path ?? undefined,
  imageWidth: r.image_width ?? undefined,
  imageHeight: r.image_height ?? undefined,
  place: r.place_name ? { name: r.place_name, url: r.place_url ?? undefined } : undefined,
  spoiler: r.spoiler,
})

/** 006 마이그레이션 전 서버(사진 열 없음)에서도 대화가 비지 않도록 한 번 더 시도한다. */
function missingPhotoColumns(message: string | undefined) {
  const text = (message ?? '').toLowerCase()
  return text.includes('image_path') || text.includes('image_thumb_path') || text.includes('column')
}

async function attachUrls(rows: Row[]): Promise<TransportMessage[]> {
  const paths = rows.map((r) => r.image_path).filter((p): p is string => Boolean(p))
  const urls = paths.length ? await signedPhotoUrls([...new Set(paths)]) : {}
  return rows.map((r) => fromRow(r, urls))
}

/** 서버 채팅. 사진은 private Storage에 올리고 메시지에는 경로만 저장한다(006_photo_chat.sql). */
export function createSupabaseTransport(): ChatTransport {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  return {
    async load(topicId, limit = 50) {
      const query = (cols: string) =>
        client
          .from('messages')
          .select(cols)
          .eq('topic_id', topicId)
          .order('created_at', { ascending: false })
          .limit(limit)
      let { data, error } = await query(MESSAGE_COLUMNS)
      if (error && missingPhotoColumns(error.message)) ({ data, error } = await query(MESSAGE_COLUMNS_BASIC))
      if (error) throw new Error(error.message)
      const rows = (data as unknown as Row[]).reverse()
      return attachUrls(rows)
    },
    async send(message) {
      const base = {
        topic_id: message.topicId,
        body: message.text,
        nickname: message.by ?? '',
        place_name: message.place?.name ?? null,
        place_url: message.place?.url ?? null,
        spoiler: message.spoiler ?? false,
      }
      const withPhoto = message.imagePath
        ? {
            ...base,
            image_path: message.imagePath,
            image_thumb_path: message.imageThumbPath ?? null,
            image_width: message.imageWidth ?? null,
            image_height: message.imageHeight ?? null,
          }
        : base
      let { data, error } = await client.from('messages').insert(withPhoto).select(MESSAGE_COLUMNS).single()
      if (error && missingPhotoColumns(error.message)) {
        if (message.imagePath) throw new Error('사진 채팅 저장소가 아직 준비되지 않았어요. (006_photo_chat.sql 필요)')
        ;({ data, error } = await client.from('messages').insert(base).select(MESSAGE_COLUMNS_BASIC).single())
      }
      if (error) {
        if (error.message.includes('too_many_messages')) throw new Error('너무 빨리 보내고 있어요. 잠시 후 다시 보내 주세요.')
        if (error.message.includes('profile_required')) throw new Error('닉네임을 먼저 정해 주세요.')
        if (error.code === '23514') throw new Error('보낼 수 없는 내용이에요. 연락처나 외부 연락 요청은 보낼 수 없어요.')
        throw new Error('메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.')
      }
      const row = data as unknown as Row
      const url = row.image_path ? await signedPhotoUrl(row.image_path) : undefined
      return fromRow(row, url && row.image_path ? { [row.image_path]: url } : {})
    },
    subscribe(topicId, onMessage) {
      const channel = client
        .channel(`topic:${topicId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `topic_id=eq.${topicId}` }, (payload) => {
          const row = payload.new as Row
          if (row.image_path) {
            void signedPhotoUrl(row.image_path).then((url) => onMessage(fromRow(row, url ? { [row.image_path as string]: url } : {})))
            return
          }
          onMessage(fromRow(row))
        })
        .subscribe()
      return () => {
        void client.removeChannel(channel)
      }
    },
  }
}

/** 방 사진첩: 이 방의 사진 메시지만 모아 최근 순으로 돌려준다. */
export interface RoomPhoto {
  id: string
  url: string
  thumbUrl: string
  at: string
  by: string
  text: string
  mine: boolean
}

export async function listRoomPhotos(topicId: string, myId: string | undefined, limit = 60): Promise<RoomPhoto[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_COLUMNS)
    .eq('topic_id', topicId)
    .not('image_path', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !Array.isArray(data)) return []
  const rows = data as unknown as Row[]
  const paths = rows.flatMap((r) => [r.image_path, r.image_thumb_path].filter((p): p is string => Boolean(p)))
  const urls = await signedPhotoUrls([...new Set(paths)])
  return rows.flatMap((r) => {
    const url = r.image_path ? urls[r.image_path] : undefined
    if (!url) return []
    return [
      {
        id: r.id,
        url,
        thumbUrl: (r.image_thumb_path && urls[r.image_thumb_path]) || url,
        at: r.created_at,
        by: r.nickname,
        text: r.body,
        mine: Boolean(myId && r.user_id === myId),
      },
    ]
  })
}

/** 환경변수가 있으면 서버 채팅, 없으면 기기 안 저장. 화면 코드는 이 함수만 부른다. */
export function createTransport(): ChatTransport {
  return serverEnabled ? createSupabaseTransport() : createLocalTransport()
}

export async function reportMessage(messageId: string, reason: 'contact' | 'abuse' | 'ad' | 'privacy' | 'other', note?: string) {
  if (!supabase) return false
  const { error } = await supabase.from('reports').insert({ message_id: messageId, reason, note: note?.slice(0, 300) ?? null })
  return !error
}

export async function blockUser(blockedId: string) {
  if (!supabase) return false
  const { error } = await supabase.from('blocks').upsert({ blocked_id: blockedId })
  return !error
}

/** 내가 보낸 메시지를 서버에서 지운다(RLS가 본인 메시지만 허용). 사진은 Storage에서도 지운다. */
export async function removeMessage(messageId: string, photo?: { path?: string; thumbPath?: string }) {
  if (!supabase) return false
  const { error } = await supabase.from('messages').delete().eq('id', messageId)
  if (error) return false
  if (photo?.path) {
    const { deleteChatPhoto } = await import('./photoChat')
    await deleteChatPhoto(photo.path, photo.thumbPath)
  }
  return true
}

/** 내가 차단한 사용자 id 목록. */
export async function listBlocks(): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('blocks').select('blocked_id')
  return error || !data ? [] : (data as { blocked_id: string }[]).map((r) => r.blocked_id)
}

export async function unblockUser(blockedId: string) {
  if (!supabase) return false
  const { error } = await supabase.from('blocks').delete().eq('blocked_id', blockedId)
  return !error
}

/* ───────── 사용자 모임 공유(topics) ───────── */

export type SharedTopic = {
  id: string
  space: string
  title: string
  description: string
  date: string
  capacity: number
  age: string
  kind: 'talk' | 'review' | 'photo' | 'play' | 'share'
  workTitle?: string
  artist?: string
  fanOccasion?: string
  creatorId: string
}

type TopicRow = {
  id: string
  space_id: string
  creator_id: string
  title: string
  description: string
  kind: SharedTopic['kind']
  work_title: string | null
  artist?: string | null
  fan_occasion?: string | null
  scheduled_at: string | null
  capacity: number
  age_group: string
}

const TOPIC_COLUMNS = 'id,space_id,creator_id,title,description,kind,work_title,artist,fan_occasion,scheduled_at,capacity,age_group'
const TOPIC_COLUMNS_BASIC = 'id,space_id,creator_id,title,description,kind,work_title,scheduled_at,capacity,age_group'

const fromTopicRow = (r: TopicRow): SharedTopic => ({
  id: r.id,
  space: r.space_id,
  title: r.title,
  description: r.description,
  date: r.scheduled_at ?? '',
  capacity: r.capacity,
  age: r.age_group,
  kind: r.kind,
  workTitle: r.work_title ?? undefined,
  artist: r.artist ?? undefined,
  fanOccasion: r.fan_occasion ?? undefined,
  creatorId: r.creator_id,
})

/** 004 마이그레이션 전 서버(artist 열 없음)에서도 모임 목록이 비지 않도록 한 번 더 시도한다. */
function isMissingColumn(message: string | undefined) {
  const text = (message ?? '').toLowerCase()
  return text.includes('artist') || text.includes('fan_occasion') || text.includes('column') || text.includes('schema cache')
}

export async function listSharedTopics(spaceId: string): Promise<SharedTopic[]> {
  if (!supabase) return []
  const client = supabase
  const query = (cols: string) =>
    client
      .from('topics')
      .select(cols)
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
      .limit(50)
  let { data, error } = await query(TOPIC_COLUMNS)
  if (error && isMissingColumn(error.message)) ({ data, error } = await query(TOPIC_COLUMNS_BASIC))
  return error || !Array.isArray(data) ? [] : (data as unknown as TopicRow[]).map(fromTopicRow)
}

/** 성공하면 null, 실패하면 사용자에게 보여 줄 문장. */
export async function createSharedTopic(t: Omit<SharedTopic, 'creatorId'>): Promise<string | null> {
  if (!supabase) return '서버에 연결되어 있지 않아요.'
  const client = supabase
  const base = {
    id: t.id,
    space_id: t.space,
    title: t.title,
    description: t.description,
    kind: t.kind,
    work_title: t.workTitle ?? null,
    scheduled_at: t.date || null,
    capacity: t.capacity,
    age_group: t.age,
  }
  const full = { ...base, artist: t.artist?.trim() || null, fan_occasion: t.fanOccasion || null }
  let { error } = await client.from('topics').insert(full)
  if (error && isMissingColumn(error.message)) ({ error } = await client.from('topics').insert(base))
  if (!error) return null
  if (error.message.includes('too_many_topics')) return '모임을 너무 빨리 만들고 있어요. 잠시 후 다시 시도해 주세요.'
  if (error.code === '23514') {
    if (error.message.includes('space_id')) return '이 공간에는 아직 서버 모임을 열 수 없어요. (덕질 존 서버 설정 필요)'
    return '제목이나 설명에 연락처 교환이 의심되는 내용이 있어요. 수정해 주세요.'
  }
  return '모임을 서버에 저장하지 못했어요. 잠시 후 다시 시도해 주세요.'
}

/** 내가 연 모임 고치기. 성공하면 null, 실패하면 보여 줄 문장. */
export async function updateSharedTopic(
  id: string,
  patch: { title: string; description: string; date: string; capacity: number; artist?: string; fanOccasion?: string },
): Promise<string | null> {
  if (!supabase) return '서버에 연결되어 있지 않아요.'
  const client = supabase
  const base = {
    title: patch.title,
    description: patch.description,
    scheduled_at: patch.date || null,
    capacity: patch.capacity,
  }
  const full = { ...base, artist: patch.artist?.trim() || null, fan_occasion: patch.fanOccasion || null }
  let { error } = await client.from('topics').update(full).eq('id', id)
  if (error && isMissingColumn(error.message)) ({ error } = await client.from('topics').update(base).eq('id', id))
  if (!error) return null
  if (error.code === '23514') return '제목이나 설명에 연락처 교환이 의심되는 내용이 있어요. 수정해 주세요.'
  if (error.code === '42501' || error.message.toLowerCase().includes('policy')) return '이 모임을 고칠 권한이 없어요. 내가 연 모임만 고칠 수 있습니다.'
  return '모임을 고치지 못했어요. 잠시 후 다시 시도해 주세요.'
}

export async function removeSharedTopic(id: string) {
  if (!supabase) return false
  const { error } = await supabase.from('topics').delete().eq('id', id)
  return !error
}

export function subscribeSharedTopics(spaceId: string, onTopic: (t: SharedTopic) => void, onRemove: (id: string) => void) {
  if (!supabase) return () => {}
  const client = supabase
  const channel = client
    .channel(`topics:${spaceId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'topics', filter: `space_id=eq.${spaceId}` }, (p) => onTopic(fromTopicRow(p.new as TopicRow)))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'topics', filter: `space_id=eq.${spaceId}` }, (p) => onTopic(fromTopicRow(p.new as TopicRow)))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'topics' }, (p) => onRemove((p.old as { id: string }).id))
    .subscribe()
  return () => {
    void client.removeChannel(channel)
  }
}

/* ───────── 운영자 신고 확인 ───────── */

export type AdminReport = {
  id: string
  messageId: string | null
  reason: string
  note: string | null
  status: 'open' | 'actioned' | 'dismissed'
  createdAt: string
  snapshot: string | null
  snapshotNickname: string | null
}

/** 내가 운영자인지(admins 테이블 본인 행 존재 여부). */
export async function checkAdmin(): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.from('admins').select('user_id').limit(1)
  return !error && Array.isArray(data) && data.length > 0
}

export async function listReports(status: AdminReport['status'] | 'all' = 'open'): Promise<AdminReport[]> {
  if (!supabase) return []
  let q = supabase
    .from('reports')
    .select('id,message_id,reason,note,status,created_at,snapshot,snapshot_nickname')
    .order('created_at', { ascending: false })
    .limit(100)
  if (status !== 'all') q = q.eq('status', status)
  const { data, error } = await q
  if (error || !Array.isArray(data)) return []
  return (data as { id: string; message_id: string | null; reason: string; note: string | null; status: AdminReport['status']; created_at: string; snapshot: string | null; snapshot_nickname: string | null }[]).map((r) => ({
    id: r.id,
    messageId: r.message_id,
    reason: r.reason,
    note: r.note,
    status: r.status,
    createdAt: r.created_at,
    snapshot: r.snapshot,
    snapshotNickname: r.snapshot_nickname,
  }))
}

export async function setReportStatus(id: string, status: AdminReport['status']) {
  if (!supabase) return false
  const { error } = await supabase.from('reports').update({ status }).eq('id', id)
  return !error
}
