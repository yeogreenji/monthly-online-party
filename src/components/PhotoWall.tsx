import { useRef, useState } from 'react'
import { Camera, Heart, ImagePlus, MessageCircle, Send, Trash2, Upload } from 'lucide-react'
import type { FeedComment, FeedFrame, FeedPost, Profile, RoomId } from '../types'
import { FRAME_LABEL } from '../data/feed'
import { resizeImageFile } from '../lib/image'
import { stamp } from '../lib/dates'
import { Avatar } from './Avatar'
import { Modal, SectionHead } from './ui'

const FRAMES: FeedFrame[] = ['polaroid', 'magazine', 'postcard']
const ROOM_LABEL: Record<RoomId, string> = { wine: '혼술 타임', book: '독서방', cinema: '영화관', music: '라운지' }

function Frame({ post, children }: { post: FeedPost; children: React.ReactNode }) {
  if (post.frame === 'magazine') {
    return (
      <div className="overflow-hidden" style={{ background: '#1C1A17', padding: '10px 10px 0', borderRadius: 2, boxShadow: 'var(--shadow)' }}>
        {children}
        <p className="serif px-1 py-3 text-[11px] leading-[1.6]" style={{ color: '#F3EDE2' }}>{post.caption}</p>
      </div>
    )
  }
  if (post.frame === 'postcard') {
    return (
      <div className="relative" style={{ background: '#FBF4E7', border: '1px solid #D9C7A6', borderRadius: 2, padding: 10, boxShadow: 'var(--shadow)' }}>
        <div style={{ border: '1px solid rgba(140,45,56,0.35)', padding: 6 }}>{children}</div>
        <div className="mt-2 flex items-start justify-between gap-3 px-1">
          <p className="serif text-[11px] leading-[1.6]" style={{ color: '#4A3B2A' }}>{post.caption}</p>
          <span className="mt-0.5 flex h-7 w-6 shrink-0 items-center justify-center border border-dashed text-[7px]" style={{ borderColor: '#B99B6B', color: '#8C6B3F' }}>
            살롱
          </span>
        </div>
      </div>
    )
  }
  return (
    <div style={{ background: '#FFFDF7', padding: '11px 11px 42px', borderRadius: 2, boxShadow: 'var(--shadow)' }}>
      {children}
      <p className="serif mt-3 px-0.5 text-[11.5px] leading-[1.6]" style={{ color: '#3A332A' }}>{post.caption}</p>
    </div>
  )
}

export function PhotoWall({
  feed,
  profile,
  onPublish,
  onLike,
  onComment,
  onRemove,
  onToast,
}: {
  feed: FeedPost[]
  profile: Profile
  onPublish: (post: FeedPost) => void
  onLike: (id: string) => void
  onComment: (id: string, comment: FeedComment) => void
  onRemove: (id: string) => void
  onToast: (text: string, tone?: 'default' | 'success') => void
}) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [frame, setFrame] = useState<FeedFrame>('polaroid')
  const [caption, setCaption] = useState('')
  const [room, setRoom] = useState<RoomId>('wine')
  const [error, setError] = useState('')
  const [openComments, setOpenComments] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있어요.')
      return
    }
    setBusy(true)
    setError('')
    try {
      setImage(await resizeImageFile(file))
    } catch {
      setError('사진을 불러오지 못했어요. 다른 파일로 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  const publish = () => {
    if (!image) {
      setError('사진을 먼저 골라주세요.')
      return
    }
    if (caption.trim().length < 2) {
      setError('한 줄 설명을 적어주세요.')
      return
    }
    onPublish({
      id: `me-${Date.now()}`,
      name: profile.nickname,
      avatar: profile.avatar,
      ageBand: profile.ageBand,
      image,
      caption: caption.trim(),
      frame,
      room,
      at: new Date().toISOString(),
      likes: 0,
      liked: false,
      mine: true,
      comments: [],
    })
    setEditorOpen(false)
    setImage(null)
    setCaption('')
    setFrame('polaroid')
    setError('')
    onToast('포토월에 게시했어요. 취향이 통하는 사람이 하트를 남길 거예요.', 'success')
  }

  const addComment = (id: string) => {
    if (draft.trim().length < 1) return
    onComment(id, {
      id: `c-${Date.now()}`,
      name: profile.nickname,
      avatar: profile.avatar,
      text: draft.trim(),
      at: stamp(),
    })
    setDraft('')
  }

  return (
    <section id="wall" className="px-5 py-16 sm:px-8 sm:py-20" style={{ borderTop: '1px solid var(--line)' }}>
      <div className="mx-auto max-w-[1280px]">
        <SectionHead
          kicker="Polaroid Wall"
          title={
            <>
              오늘의 한 장을
              <br className="sm:hidden" /> 벽에 붙여둡니다
            </>
          }
          description="집에서 마신 한 잔, 읽다 만 책, 보고 있는 영화. 사진 한 장과 한 줄이면 충분합니다. 얼굴과 집 구조는 올리지 않아요."
          action={
            <button type="button" onClick={() => setEditorOpen(true)} className="btn btn-outline shrink-0 self-start md:self-auto">
              <ImagePlus size={15} />
              내 사진 올리기
            </button>
          }
        />

        <div className="columns-1 gap-5 sm:columns-2 lg:columns-4">
          {feed.map((post) => {
            const commentsOpen = openComments === post.id
            return (
              <article key={post.id} className="mb-5 break-inside-avoid">
                <Frame post={post}>
                  <div className="relative overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                    <img src={post.image} alt={post.caption} className="w-full object-cover" loading="lazy" style={{ aspectRatio: post.frame === 'magazine' ? '4/5' : '4/4.4' }} />
                    <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px]" style={{ background: 'rgba(20,26,22,0.55)', color: '#F7F1E6' }}>
                      {ROOM_LABEL[post.room]}
                    </span>
                    {post.mine && (
                      <span className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[9px]" style={{ background: 'var(--gold)', color: '#211804' }}>
                        내 사진
                      </span>
                    )}
                  </div>
                </Frame>

                <div className="mt-2 flex items-center justify-between gap-2 px-0.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Avatar name={post.avatar} size={22} />
                    <span className="truncate text-[11px]" style={{ color: 'var(--ink-soft)' }}>{post.name}</span>
                    <span className="shrink-0 text-[10px]" style={{ color: 'var(--muted)' }}>· {post.at.slice(11, 16)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onLike(post.id)}
                      className="flex items-center gap-1 text-[10.5px] transition-colors"
                      style={{ color: post.liked ? 'var(--burgundy)' : 'var(--muted)' }}
                      aria-label={post.liked ? '좋아요 취소' : '좋아요'}
                      aria-pressed={post.liked}
                    >
                      <Heart size={13} fill={post.liked ? 'var(--burgundy)' : 'none'} />
                      {post.likes}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenComments(commentsOpen ? null : post.id)
                        setDraft('')
                      }}
                      className="flex items-center gap-1 text-[10.5px]"
                      style={{ color: 'var(--muted)' }}
                      aria-expanded={commentsOpen}
                    >
                      <MessageCircle size={13} />
                      {post.comments.length}
                    </button>
                    {post.mine && (
                      <button
                        type="button"
                        onClick={() => onRemove(post.id)}
                        className="text-[10.5px]"
                        style={{ color: 'var(--muted)' }}
                        aria-label="내 사진 삭제"
                      >
                        <Trash2 size={12.5} />
                      </button>
                    )}
                  </div>
                </div>

                {commentsOpen && (
                  <div className="mt-2 space-y-2 border-t pt-2.5" style={{ borderColor: 'var(--line)' }}>
                    {post.comments.length === 0 && (
                      <p className="text-[10.5px]" style={{ color: 'var(--muted)' }}>첫 댓글을 남겨보세요.</p>
                    )}
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-1.5">
                        <Avatar name={comment.avatar} size={18} />
                        <p className="text-[10.5px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                          <span style={{ color: 'var(--ink)' }}>{comment.name}</span> {comment.text}
                        </p>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        className="input !py-1.5 text-[11px]"
                        placeholder="한마디 남기기"
                        value={draft}
                        maxLength={80}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') addComment(post.id)
                        }}
                        aria-label="댓글 입력"
                      />
                      <button type="button" className="btn btn-ghost btn-icon" onClick={() => addComment(post.id)} aria-label="댓글 등록">
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>

        <p className="mt-2 text-[10.5px]" style={{ color: 'var(--muted)' }}>
          앞의 네 장은 오픈 전 예시 피드입니다. 내가 올린 사진은 이 브라우저에만 저장되고, 서버로 보내지 않아요.
        </p>
      </div>

      {editorOpen && (
        <Modal onClose={() => setEditorOpen(false)} label="포토월에 사진 올리기" size="lg">
          <div className="p-6 sm:p-8">
            <p className="kicker">Add a photo</p>
            <h3 className="serif mt-2 text-[22px]">오늘의 한 장</h3>
            <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--muted)' }}>
              사진은 자동으로 줄여서 이 브라우저에만 저장합니다. 얼굴·집 구조·문패는 가려주세요.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_0.9fr]">
              <div>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    void handleFile(event.dataTransfer.files[0])
                  }}
                  className="flex w-full items-center justify-center overflow-hidden border border-dashed transition-colors hover:bg-black/[0.02]"
                  style={{ borderColor: 'var(--line-strong)', minHeight: 260, background: 'var(--surface-2)' }}
                  aria-label="사진 선택"
                >
                  {image ? (
                    <img src={image} alt="업로드한 사진 미리보기" className="max-h-[320px] w-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-2 py-10 text-[12px]" style={{ color: 'var(--muted)' }}>
                      <Upload size={22} />
                      {busy ? '사진을 준비하는 중…' : '사진을 끌어다 놓거나 눌러서 선택'}
                      <span className="text-[10px]">JPG · PNG · HEIC 변환본</span>
                    </span>
                  )}
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void handleFile(event.target.files?.[0])}
                />
              </div>

              <div>
                <p className="smallcaps" style={{ color: 'var(--muted)' }}>프레임</p>
                <div className="mt-2 flex gap-1.5">
                  {FRAMES.map((item) => (
                    <button key={item} type="button" className="chip" data-on={frame === item} onClick={() => setFrame(item)} aria-pressed={frame === item}>
                      {FRAME_LABEL[item]}
                    </button>
                  ))}
                </div>

                <p className="smallcaps mt-5" style={{ color: 'var(--muted)' }}>방</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(Object.keys(ROOM_LABEL) as RoomId[]).map((item) => (
                    <button key={item} type="button" className="chip" data-on={room === item} onClick={() => setRoom(item)} aria-pressed={room === item}>
                      {ROOM_LABEL[item]}
                    </button>
                  ))}
                </div>

                <p className="smallcaps mt-5" style={{ color: 'var(--muted)' }}>한 줄</p>
                <textarea
                  className="textarea mt-2"
                  rows={4}
                  maxLength={110}
                  placeholder="예: 오늘은 논알콜 스파클링으로. 무화과가 잘 어울렸어요."
                  value={caption}
                  onChange={(event) => {
                    setCaption(event.target.value)
                    setError('')
                  }}
                  aria-label="사진 설명"
                />
                <div className="mt-1 flex justify-between text-[10px]" style={{ color: 'var(--muted)' }}>
                  <span>{error && <span style={{ color: 'var(--burgundy)' }}>{error}</span>}</span>
                  <span>{caption.length}/110</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-[10.5px]" style={{ color: 'var(--muted)' }}>
                <Camera size={12} />
                예시 피드에는 스태프 사진이 함께 있어요
              </p>
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost" onClick={() => setEditorOpen(false)}>취소</button>
                <button type="button" className="btn btn-primary" onClick={publish} disabled={busy}>
                  포토월에 게시
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}
