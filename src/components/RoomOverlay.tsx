import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Film,
  Hand,
  Heart,
  Lock,
  MessageCircle,
  Music2,
  Pause,
  Play,
  Plus,
  Send,
  ShieldAlert,
  Sparkles,
  Users,
  Wine,
  X,
} from 'lucide-react'
import type { ChatMessage, Participant, PartyEvent, Peer, Profile, RoomId } from '../types'
import { PARTICIPANTS, ROOMS, SONG_POLL } from '../data/rooms'
import { countdownTo, pad, stamp } from '../lib/dates'
import { requestHostReply } from '../lib/chat'
import { salonAudio } from '../lib/audio'
import type { Mood } from '../lib/audio'
import { usePersistentState } from '../lib/storage'
import { Avatar } from './Avatar'
import { Modal } from './ui'

const ROOM_ICON: Record<RoomId, typeof Wine> = { wine: Wine, book: BookOpen, cinema: Film, music: Music2 }
const ROOM_SHORT: Record<RoomId, string> = { wine: '혼술', book: '독서', cinema: '영화', music: '라운지' }

const MOODS: { id: Mood; title: string; detail: string }[] = [
  { id: 'lofi', title: '벽난로 앞', detail: '로우파이 · 낮은 볼륨' },
  { id: 'jazz', title: '12시의 피아노', detail: '재즈 트리오' },
  { id: 'party', title: '샴페인 타임', detail: '파티 비트' },
]

interface Song {
  id: string
  title: string
  artist: string
  votes: number
  mine?: boolean
}

interface Review {
  id: string
  name: string
  avatar: Profile['avatar']
  text: string
}

export function RoomOverlay({
  roomId,
  party,
  profile,
  messages,
  onAppend,
  onClose,
  onSwitchRoom,
  onRequestNote,
  onReport,
  onOpenNotes,
  onToast,
  notesCount,
}: {
  roomId: RoomId
  party: PartyEvent
  profile: Profile
  messages: ChatMessage[]
  onAppend: (roomId: RoomId, message: ChatMessage) => void
  onClose: () => void
  onSwitchRoom: (roomId: RoomId) => void
  onRequestNote: (peer: Peer, message: string) => void
  onReport: (target: string, reason: string, detail: string) => void
  onOpenNotes: () => void
  onToast: (text: string, tone?: 'default' | 'success') => void
  notesCount: number
}) {
  const room = ROOMS.find((item) => item.id === roomId) ?? ROOMS[0]
  const Icon = ROOM_ICON[roomId]
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [spoilerOn, setSpoilerOn] = useState(false)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number; drift: number }[]>([])
  const [clinks, setClinks] = usePersistentState<number>('ms.clinks.v1', 128)
  const [peerCard, setPeerCard] = useState<Participant | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [noteSent, setNoteSent] = useState(false)
  const [reportTarget, setReportTarget] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('불쾌한 언행 · 비하')
  const [reportDetail, setReportDetail] = useState('')
  const [rulesOpen, setRulesOpen] = useState(false)
  const [peersOpen, setPeersOpen] = useState(false)
  const [playing, setPlaying] = useState<Mood | null>(null)
  const [songs, setSongs] = usePersistentState<Song[]>(`ms.songs.${party.id}.v1`, SONG_POLL[party.id] ?? [])
  const [songDraft, setSongDraft] = useState({ title: '', artist: '' })
  const [reviews, setReviews] = useState<Review[]>([
    { id: 'r1', name: '책갈피', avatar: 'squirrel', text: '3장까지. 문장에서 계속 멈추게 됩니다.' },
    { id: 'r2', name: '민트초코', avatar: 'bear', text: '인물들 사이의 침묵이 제일 무섭고 제일 다정해요.' },
    { id: 'r3', name: '밤의 서재', avatar: 'owl', text: '읽는 속도보다 멈추는 자리가 중요한 책.' },
  ])
  const [reviewDraft, setReviewDraft] = useState('')
  const [syncStart, setSyncStart] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const reactionId = useRef(0)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  const cd = countdownTo(party.dateISO)

  useEffect(() => {
    if (!syncStart) return
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - syncStart) / 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [syncStart])

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages.length, pending])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.body.dataset.modalOpen !== 'true') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
      salonAudio.stop()
    }
  }, [])

  useEffect(() => {
    setRulesOpen(false)
    setPeerCard(null)
  }, [roomId])

  const peers = useMemo(() => PARTICIPANTS.slice(0, roomId === 'music' ? 10 : 9), [roomId])
  const lastGuestId = useMemo(() => [...messages].reverse().find((item) => item.author === 'guest')?.id, [messages])

  const fireReaction = (emoji: string, sound: 'clink' | 'applause' | 'chime') => {
    if (sound === 'clink') salonAudio.clink()
    if (sound === 'applause') salonAudio.applause()
    if (sound === 'chime') salonAudio.chime()
    reactionId.current += 1
    const id = reactionId.current
    setReactions((prev) => [...prev.slice(-8), { id, emoji, x: 18 + Math.random() * 64, drift: Math.random() * 60 - 30 }])
    window.setTimeout(() => setReactions((prev) => prev.filter((item) => item.id !== id)), 1900)
    if (emoji === '🥂') setClinks((prev) => prev + 1)
  }

  const send = async () => {
    const text = draft.trim()
    if (!text || pending) return
    setDraft('')
    onAppend(roomId, {
      id: `m-${Date.now()}`,
      author: 'me',
      name: profile.nickname,
      avatar: profile.avatar,
      text,
      at: stamp(),
    })
    setPending(true)
    const history = [...messages, { id: 'tmp', author: 'me' as const, name: profile.nickname, text, at: stamp() }]
      .slice(-8)
      .map((item) => ({ role: item.author === 'me' ? ('me' as const) : item.author === 'host' ? ('host' as const) : ('guest' as const), name: item.name, text: item.text }))

    const reply = await requestHostReply({
      mode: 'room',
      roomId,
      roomName: room.name,
      roomTopic: room.tagline,
      topicDetail:
        roomId === 'book'
          ? `${party.book.title} · ${party.book.author} — ${party.book.why}`
          : roomId === 'cinema'
            ? `${party.film.title} (${party.film.year}) — ${party.film.why}`
            : roomId === 'music'
              ? `${party.playlist.map((item) => item.title).join(' / ')}`
              : '오늘의 질문: 오늘 하루, 스스로에게 칭찬하고 싶은 일 하나.',
      host: room.host,
      profile: { nickname: profile.nickname, ageBand: profile.ageBand, tags: profile.tags },
      message: text,
      history,
    })

    onAppend(roomId, {
      id: `h-${Date.now()}`,
      author: 'host',
      name: room.host,
      text: reply.reply,
      at: stamp(),
    })
    setPending(false)
  }

  const toggleMood = (mood: Mood) => {
    const nowPlaying = salonAudio.toggle(mood)
    setPlaying(nowPlaying ? mood : null)
  }

  const vote = (id: string) => {
    setSongs((prev) =>
      prev.map((song) =>
        song.id === id ? { ...song, votes: song.votes + (song.mine ? -1 : 1), mine: !song.mine } : song,
      ),
    )
    salonAudio.chime()
  }

  const addSong = () => {
    if (!songDraft.title.trim()) return
    setSongs((prev) => [
      ...prev,
      { id: `mine-${Date.now()}`, title: songDraft.title.trim(), artist: songDraft.artist.trim() || '신청곡', votes: 1, mine: true },
    ])
    setSongDraft({ title: '', artist: '' })
    salonAudio.chime()
    onToast('신청곡을 올렸어요.', 'success')
  }

  const addReview = () => {
    if (!reviewDraft.trim()) return
    setReviews((prev) => [...prev, { id: `rv-${Date.now()}`, name: profile.nickname, avatar: profile.avatar, text: reviewDraft.trim() }])
    setReviewDraft('')
    salonAudio.chime()
  }

  const requestNote = () => {
    if (!peerCard) return
    const text = noteDraft.trim() || '오늘 방에서 나눈 이야기가 좋았어요. 조금 더 이야기하고 싶습니다.'
    onRequestNote(
      {
        nickname: peerCard.nickname,
        avatar: peerCard.avatar,
        ageBand: peerCard.ageBand,
        tags: peerCard.tags,
        context: `${room.name} · ${party.dateLabel} ${stamp()}에 함께한 대화`,
      },
      text,
    )
    setNoteSent(true)
  }

  const submitReport = () => {
    if (!reportTarget) return
    onReport(reportTarget, reportReason, reportDetail)
    setReportTarget(null)
    setReportDetail('')
    setReportReason('불쾌한 언행 · 비하')
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6" style={{ borderColor: 'var(--line)' }}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="딩동으로 돌아가기">
            <ArrowLeft size={18} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
              <Icon size={14} style={{ color: 'var(--gold)' }} />
            </span>
            <div className="min-w-0">
              <p className="serif truncate text-[13.5px] leading-tight">{room.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[9.5px]" style={{ color: 'var(--muted)' }}>
                <span className="live-dot shrink-0" style={{ width: 5, height: 5 }} />
                시연방
                <span className="hidden sm:inline">· {room.hours}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setRulesOpen(true)} className="btn btn-ghost btn-sm hidden sm:inline-flex">
            <Lock size={13} />
            방 규칙
          </button>
          <button type="button" onClick={() => setPeersOpen(true)} className="btn btn-ghost btn-icon lg:hidden" aria-label="함께 있는 사람들 보기">
            <Users size={16} />
          </button>
          <button type="button" onClick={onOpenNotes} className="btn btn-outline btn-sm relative" aria-label="쪽지함 열기">
            <MessageCircle size={13} />
            <span className="hidden sm:inline">쪽지함</span>
            {notesCount > 0 && (
              <span className="ml-0.5 rounded-full px-1.5 py-0.5 text-[9px]" style={{ background: 'var(--burgundy)', color: '#FFF6EC' }}>
                {notesCount}
              </span>
            )}
          </button>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="닫기">
            <X size={17} />
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[208px_minmax(0,1fr)_252px]">
        {/* 방 목록 */}
        <aside className="hidden flex-col border-r lg:flex" style={{ borderColor: 'var(--line)', background: 'var(--bg-deep)' }}>
          <p className="kicker px-4 pb-2 pt-4">Rooms</p>
          {ROOMS.map((item) => {
            const ItemIcon = ROOM_ICON[item.id]
            const active = item.id === roomId
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSwitchRoom(item.id)}
                className="flex items-start gap-2.5 border-l-2 px-4 py-3 text-left transition-colors hover:bg-black/[0.03]"
                style={{
                  borderColor: active ? 'var(--gold)' : 'transparent',
                  background: active ? 'var(--surface)' : 'transparent',
                }}
              >
                <ItemIcon size={14} className="mt-0.5 shrink-0" style={{ color: active ? 'var(--gold)' : 'var(--muted)' }} />
                <span className="min-w-0">
                  <span className="block truncate text-[11.5px]" style={{ color: active ? 'var(--ink)' : 'var(--ink-soft)' }}>{item.name}</span>
                  <span className="mt-0.5 block text-[9px]" style={{ color: 'var(--muted)' }}>시연방 · {item.host}</span>
                </span>
              </button>
            )
          })}
          <div className="mt-auto p-4">
            <div className="border p-3" style={{ borderColor: 'var(--line)' }}>
              <p className="kicker text-[7.5px]">Preview</p>
              <p className="mt-1.5 text-[10px] leading-[1.7]" style={{ color: 'var(--muted)' }}>
                로컬 시연입니다. 다른 실제 이용자는 연결되지 않으며, 호스트의 답변은 자동 생성 예시입니다.
              </p>
            </div>
          </div>
        </aside>

        {/* 본문 */}
        <main className="relative flex min-h-0 flex-col">
          <div className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b px-3 py-2 lg:hidden" style={{ borderColor: 'var(--line)' }}>
            {ROOMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSwitchRoom(item.id)}
                className="chip shrink-0"
                data-on={item.id === roomId}
                aria-pressed={item.id === roomId}
              >
                {ROOM_SHORT[item.id]}
              </button>
            ))}
          </div>

          {/* 무대 */}
          <section className="relative shrink-0 border-b px-4 py-4 sm:px-6" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
            <div className="mx-auto w-full max-w-3xl">
            {roomId === 'wine' && (
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="kicker" style={{ color: 'var(--burgundy)' }}>Tonight's toast</p>
                  <h3 className="serif mt-1.5 text-[19px] leading-snug sm:text-[22px]">한 잔을 들고, 오늘의 질문 하나</h3>
                  <p className="mt-1.5 max-w-[42ch] text-[11.5px] leading-[1.7]" style={{ color: 'var(--muted)' }}>
                    오늘 하루, 스스로에게 칭찬하고 싶은 일 하나. 술이 아니어도 같은 잔에 따르면 같은 건배입니다.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p id="room-clinks" className="serif text-[22px] tabular-nums">{clinks.toLocaleString()}</p>
                    <p className="kicker text-[7.5px]">clinks tonight</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fireReaction('🥂', 'clink')}
                    className="btn btn-gold"
                  >
                    짠!
                    <Wine size={15} />
                  </button>
                </div>
              </div>
            )}

            {roomId === 'book' && (
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
                <div>
                  <p className="kicker" style={{ color: 'var(--burgundy)' }}>This week's reading</p>
                  <h3 className="serif mt-1.5 text-[19px] leading-snug">{party.book.title}</h3>
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--muted)' }}>{party.book.author} · {party.book.publisher}</p>
                  <p className="mt-2 max-w-[40ch] text-[11.5px] leading-[1.7]" style={{ color: 'var(--ink-soft)' }}>{party.book.why}</p>
                </div>
                <div className="border-t pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-center justify-between">
                    <p className="kicker text-[7.5px]">한 줄 평</p>
                    <span className="text-[9.5px]" style={{ color: 'var(--muted)' }}>{reviews.length}개</span>
                  </div>
                  <ul className="scroll-thin mt-2 max-h-[86px] space-y-1.5 overflow-y-auto pr-1">
                    {reviews.slice(-3).map((review) => (
                      <li key={review.id} className="flex gap-1.5 text-[10.5px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                        <span style={{ color: 'var(--ink)' }}>{review.name}</span>
                        {review.text}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex items-center gap-1.5">
                    <input
                      className="input !py-1 text-[10.5px]"
                      placeholder="내 한 줄 평"
                      maxLength={70}
                      value={reviewDraft}
                      onChange={(event) => setReviewDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') addReview()
                      }}
                      aria-label="한 줄 평"
                    />
                    <button type="button" onClick={addReview} className="btn btn-ghost btn-icon shrink-0 !h-7 !w-7" aria-label="한 줄 평 남기기">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {roomId === 'cinema' && (
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="kicker" style={{ color: 'var(--burgundy)' }}>Now watching</p>
                  <h3 className="serif mt-1.5 text-[19px] leading-snug">{party.film.title} <span className="text-[13px]" style={{ color: 'var(--muted)' }}>({party.film.year})</span></h3>
                  <p className="mt-1 max-w-[44ch] text-[11.5px] leading-[1.7]" style={{ color: 'var(--muted)' }}>{party.film.why}</p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (syncStart) {
                        setSyncStart(null)
                        setElapsed(0)
                      } else {
                        setSyncStart(Date.now())
                        salonAudio.chime()
                      }
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    {syncStart ? <Pause size={13} /> : <Play size={13} />}
                    {syncStart ? `재생 중 ${pad(Math.floor(elapsed / 60))}:${pad(elapsed % 60)}` : '동시 재생 시작'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpoilerOn((prev) => !prev)}
                    className="flex items-center gap-1.5 text-[10px]"
                    style={{ color: spoilerOn ? 'var(--burgundy)' : 'var(--muted)' }}
                    aria-pressed={spoilerOn}
                  >
                    <ShieldAlert size={11} />
                    스포일러 {spoilerOn ? '보이는 중' : '가려둠'}
                  </button>
                </div>
              </div>
            )}

            {roomId === 'music' && (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="kicker" style={{ color: 'var(--burgundy)' }}>Listening lounge</p>
                  <h3 className="serif mt-1.5 text-[19px] leading-snug">
                    {playing ? MOODS.find((mood) => mood.id === playing)?.title : '오늘 밤의 배경음'}
                  </h3>
                  <p className="mt-1 text-[11px] leading-[1.7]" style={{ color: 'var(--muted)' }}>
                    {playing ? '딩동 오리지널 세션을 합성해 재생합니다. 볼륨은 낮게.' : '세 가지 무드 중 하나를 골라 재생해보세요.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {MOODS.map((mood) => (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => toggleMood(mood.id)}
                      className="chip"
                      data-on={playing === mood.id}
                      aria-pressed={playing === mood.id}
                    >
                      {playing === mood.id ? <Pause size={10} /> : <Play size={10} />}
                      {mood.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>
          </section>

          {/* 채팅 */}
          <div className="relative min-h-0 flex-1">
            <div ref={scrollRef} className="scroll-thin h-full overflow-y-auto px-4 py-4 sm:px-6">
            <div className="mx-auto max-w-3xl space-y-3.5">
              <div className="flex items-center gap-2 pb-1">
                <span className="h-px flex-1" style={{ background: 'var(--line)' }} />
                <span className="kicker text-[7.5px]">오늘의 대화</span>
                <span className="h-px flex-1" style={{ background: 'var(--line)' }} />
              </div>

              {messages.map((message) => {
                const mine = message.author === 'me'
                const host = message.author === 'host'
                const hidden = Boolean(message.spoiler) && !spoilerOn && !revealed[message.id]
                return (
                  <div key={message.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                    {!mine && message.avatar && <Avatar name={message.avatar} size={30} />}
                    {!mine && !message.avatar && (
                      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--forest)' }}>
                        <Sparkles size={12} style={{ color: 'var(--gold-soft)' }} />
                      </span>
                    )}
                    <div className={`max-w-[78%] ${mine ? 'items-end text-right' : ''}`}>
                      <div className={`flex items-center gap-1.5 text-[9.5px] ${mine ? 'justify-end' : ''}`} style={{ color: 'var(--muted)' }}>
                        <span style={{ color: host ? 'var(--burgundy)' : 'var(--ink-soft)' }}>{mine ? '나' : '예시 · ' + message.name}</span>
                        {host && <span className="kicker text-[7px]">자동 응답</span>}
                        <span>{message.at}</span>
                      </div>
                      <div
                        className="relative mt-1 inline-block px-3.5 py-2.5 text-left text-[12.5px] leading-[1.75]"
                        style={{
                          background: mine ? 'var(--forest)' : host ? 'var(--surface-2)' : 'var(--surface)',
                          color: mine ? 'var(--forest-ink)' : 'var(--ink)',
                          border: mine ? '1px solid transparent' : '1px solid var(--line)',
                          borderRadius: mine ? '12px 12px 3px 12px' : '3px 12px 12px 12px',
                        }}
                      >
                        {hidden ? (
                          <button
                            type="button"
                            onClick={() => setRevealed((prev) => ({ ...prev, [message.id]: true }))}
                            className="flex items-center gap-1.5 text-[11px]"
                            style={{ color: 'var(--muted)' }}
                          >
                            <Lock size={11} />
                            스포일러 · 눌러서 보기
                          </button>
                        ) : (
                          message.text
                        )}
                      </div>
                      {!mine && message.author === 'guest' && message.id === lastGuestId && (
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const peer = PARTICIPANTS.find((item) => item.nickname === message.name)
                              if (peer) {
                                setPeerCard(peer)
                                setNoteDraft('')
                                setNoteSent(false)
                              }
                            }}
                            className="text-[9px]"
                            style={{ color: 'var(--muted)' }}
                          >
                            쪽지 청하기
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportTarget(message.name)}
                            className="text-[9px]"
                            style={{ color: 'var(--muted)' }}
                          >
                            신고
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {pending && (
                <div className="flex items-center gap-2">
                  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full" style={{ background: 'var(--forest)' }}>
                    <Sparkles size={12} style={{ color: 'var(--gold-soft)' }} />
                  </span>
                  <span className="flex items-center gap-1 rounded-full border px-3 py-1.5" style={{ borderColor: 'var(--line)' }}>
                    <span className="dot h-1 w-1 animate-pulse rounded-full" style={{ background: 'var(--muted)' }} />
                    <span className="dot h-1 w-1 animate-pulse rounded-full" style={{ background: 'var(--muted)', animationDelay: '0.2s' }} />
                    <span className="dot h-1 w-1 animate-pulse rounded-full" style={{ background: 'var(--muted)', animationDelay: '0.4s' }} />
                    <span className="ml-1 text-[9.5px]" style={{ color: 'var(--muted)' }}>{room.host}가 답하는 중</span>
                  </span>
                </div>
              )}
            </div>
            </div>
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12"
              style={{ background: 'linear-gradient(to bottom, var(--bg) 0%, var(--bg) 45%, transparent 100%)' }}
              aria-hidden="true"
            />
          </div>

      {/* 신청곡 투표 (라운지) */}
      {roomId === 'music' && (
        <div className="shrink-0 border-t px-4 py-2.5 sm:px-6" style={{ borderColor: 'var(--line)', background: 'var(--bg-deep)' }}>
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2">
            <p className="kicker text-[7.5px]">신청곡 투표</p>
            <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
              {songs.slice(0, 6).map((song) => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => vote(song.id)}
                  className="chip shrink-0"
                  data-on={Boolean(song.mine)}
                  aria-pressed={Boolean(song.mine)}
                  title={`${song.title} · ${song.artist}`}
                >
                  {song.title}
                  <span style={{ opacity: 0.65 }}>{song.votes}</span>
                </button>
              ))}
            </div>
            <div className="flex w-full items-center gap-1.5 sm:w-auto">
              <input
                className="input flex-1 !py-1 text-[10.5px] sm:w-[120px] sm:flex-none"
                placeholder="곡 제목"
                value={songDraft.title}
                onChange={(event) => setSongDraft((prev) => ({ ...prev, title: event.target.value }))}
                aria-label="신청곡 제목"
              />
              <button type="button" onClick={addSong} className="btn btn-outline btn-sm" aria-label="신청곡 올리기">
                <Plus size={11} />
              </button>
            </div>
          </div>
        </div>
      )}

      {peersOpen && (
        <Modal onClose={() => setPeersOpen(false)} label="함께 있는 사람들" size="sm">
          <div className="p-6">
            <p className="kicker">Here tonight</p>
            <h3 className="serif mt-2 text-[20px]">함께 있는 사람들</h3>
            <ul className="mt-4 max-h-[50vh] overflow-y-auto">
              {peers.map((peer) => (
                <li key={peer.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPeerCard(peer)
                      setNoteDraft('')
                      setNoteSent(false)
                      setPeersOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 border-t py-2.5 text-left first:border-t-0"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <Avatar name={peer.avatar} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px]" style={{ color: 'var(--ink-soft)' }}>{peer.nickname}</span>
                      <span className="block truncate text-[9.5px]" style={{ color: 'var(--muted)' }}>{peer.tags.join(' · ')}</span>
                    </span>
                    <ChevronRight size={13} style={{ color: 'var(--muted)' }} />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setPeersOpen(false)
                setRulesOpen(true)
              }}
              className="mt-3 flex w-full items-center justify-between border-t pt-3 text-[11px]"
              style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}
            >
              <span className="flex items-center gap-1.5">
                <Lock size={11} />
                방 규칙 {room.rules.length}가지 보기
              </span>
              <ChevronRight size={12} />
            </button>
          </div>
        </Modal>
      )}

          {/* 입력 */}
          <div className="shrink-0 border-t px-3 py-2.5 sm:px-6" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
            <div className="mx-auto flex max-w-3xl items-center gap-1.5">
              <button type="button" onClick={() => fireReaction('🥂', 'clink')} className="btn btn-ghost btn-icon" aria-label="건배 소리와 함께 짠 보내기" title="짠">
                <Wine size={16} />
              </button>
              <button type="button" onClick={() => fireReaction('👏', 'applause')} className="btn btn-ghost btn-icon" aria-label="박수 보내기" title="박수">
                <Hand size={16} />
              </button>
              <button type="button" onClick={() => fireReaction('♥', 'chime')} className="btn btn-ghost btn-icon" aria-label="하트 보내기" title="하트">
                <Heart size={16} />
              </button>
              <input
                className="input flex-1 !py-2"
                placeholder={`${room.host}에게 말 걸기`}
                value={draft}
                maxLength={300}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing) void send()
                }}
                aria-label="메시지 입력"
              />
              <button type="button" onClick={() => void send()} disabled={pending || !draft.trim()} className="btn btn-primary btn-icon" aria-label="보내기">
                <Send size={15} />
              </button>
            </div>
            <p className="mx-auto mt-1 max-w-3xl text-[9px]" style={{ color: 'var(--muted)' }}>
              {room.rules[0]}
            </p>
          </div>

          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
            {reactions.map((reaction) => (
              <span
                key={reaction.id}
                className="absolute bottom-28 text-[26px]"
                style={{
                  left: `${reaction.x}%`,
                  animation: 'float-up 1.9s ease-out forwards',
                  '--drift': `${reaction.drift}px`,
                } as CSSProperties}
              >
                {reaction.emoji}
              </span>
            ))}
          </div>
        </main>

        {/* 참여자 */}
        <aside className="hidden min-h-0 flex-col border-l lg:flex" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <p className="kicker">Here tonight</p>
            <span className="flex items-center gap-1 text-[9.5px]" style={{ color: 'var(--muted)' }}>
              <Users size={10} />
              예시
            </span>
          </div>
          <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto px-2">
            {peers.map((peer) => (
              <li key={peer.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPeerCard(peer)
                    setNoteDraft('')
                    setNoteSent(false)
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-2 text-left transition-colors hover:bg-black/[0.03]"
                >
                  <span className="relative">
                    <Avatar name={peer.avatar} size={28} />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border"
                      style={{ background: peer.online ? '#7A9E7E' : 'var(--line-strong)', borderColor: 'var(--bg)' }}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px]" style={{ color: 'var(--ink-soft)' }}>{peer.nickname}</span>
                    <span className="block truncate text-[9px]" style={{ color: 'var(--muted)' }}>{peer.tags.slice(0, 2).join(' · ')}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t p-3" style={{ borderColor: 'var(--line)' }}>
            <button type="button" onClick={() => setRulesOpen(true)} className="flex w-full items-center justify-between text-[10px]" style={{ color: 'var(--muted)' }}>
              <span className="flex items-center gap-1.5">
                <Lock size={10} />
                방 규칙 {room.rules.length}가지
              </span>
              <ChevronRight size={11} />
            </button>
          </div>
        </aside>
      </div>

      {rulesOpen && (
        <Modal onClose={() => setRulesOpen(false)} label={`${room.name} 방 규칙`} size="sm">
          <div className="p-6">
            <p className="kicker">House rules</p>
            <h3 className="serif mt-2 text-[20px]">{room.name}</h3>
            <p className="mt-1 text-[11px]" style={{ color: 'var(--muted)' }}>{room.tagline} · {room.hours}</p>
            <ul className="mt-4 space-y-3">
              {room.rules.map((rule, index) => (
                <li key={rule} className="flex gap-2.5 text-[11.5px] leading-[1.75]" style={{ color: 'var(--ink-soft)' }}>
                  <span className="serif text-[9px]" style={{ color: 'var(--gold)' }}>0{index + 1}</span>
                  {rule}
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t pt-3 text-[10px] leading-relaxed" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
              신고는 로컬 기록만 저장됩니다. 참여자와 지난 대화는 예시입니다.
            </div>
            <button type="button" className="btn btn-primary mt-5 w-full" onClick={() => setRulesOpen(false)}>알겠습니다</button>
          </div>
        </Modal>
      )}

      {/* 참여자 카드 */}
      {peerCard && (
        <Modal onClose={() => setPeerCard(null)} label={`${peerCard.nickname} 프로필`} size="sm">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <Avatar name={peerCard.avatar} size={54} ring />
              <div>
                <p className="flex items-center gap-2 text-[16px]">
                  {peerCard.nickname}
                  <span className="kicker text-[8px]">{peerCard.ageBand}</span>
                </p>
                <p className="mt-0.5 text-[10.5px]" style={{ color: 'var(--muted)' }}>{peerCard.tags.join(' · ')}</p>
              </div>
            </div>
            <p className="serif mt-4 border-l-2 pl-3 text-[12px] leading-relaxed" style={{ borderColor: 'var(--gold)', color: 'var(--ink-soft)' }}>
              “{peerCard.line}”
            </p>

            {noteSent ? (
              <div className="mt-5 border p-3.5" style={{ borderColor: 'var(--gold)', background: 'color-mix(in srgb, var(--gold) 8%, transparent)' }}>
                <p className="flex items-center gap-1.5 text-[11.5px]">
                  <Check size={12} style={{ color: 'var(--gold)' }} />
                  쪽지 요청을 보냈어요
                </p>
                <p className="mt-1 text-[10.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  상대가 수락하면 쪽지함에 대화가 열립니다. 무작위 쪽지는 가지 않아요.
                </p>
              </div>
            ) : (
              <>
                <label className="smallcaps mt-5 block" htmlFor="note-draft" style={{ color: 'var(--muted)' }}>쪽지 요청 한마디</label>
                <input
                  id="note-draft"
                  className="input mt-1"
                  maxLength={80}
                  placeholder="오늘 대화가 좋았어요. 더 이야기하고 싶습니다."
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                />
                <button type="button" onClick={requestNote} className="btn btn-primary mt-4 w-full">
                  <Lock size={13} />
                  쪽지 열기 요청
                </button>
                <p className="mt-2 text-[9.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  서로 수락해야 열립니다. 연락처·SNS·주소는 이 딩동에서 주고받지 않아요.
                </p>
              </>
            )}
            <button type="button" onClick={() => setReportTarget(peerCard.nickname)} className="mt-4 w-full text-[10px]" style={{ color: 'var(--muted)' }}>
              이 참여자 신고하기
            </button>
          </div>
        </Modal>
      )}

      {/* 신고 */}
      {reportTarget && (
        <Modal onClose={() => setReportTarget(null)} label="신고하기" size="sm">
          <div className="p-6">
            <p className="kicker">Report</p>
            <h3 className="serif mt-2 text-[20px]">{reportTarget}님 신고</h3>
            <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              신고는 이 브라우저에만 저장되며 실제 운영자에게 전송되지 않습니다.
            </p>
            <div className="mt-4 space-y-2">
              {['불쾌한 언행 · 비하', '성적 접근 · 원치 않는 연락', '광고 · 홍보 목적', '연락처 · 개인정보 요구', '기타'].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setReportReason(reason)}
                  className="flex items-center gap-2.5 text-[11.5px]"
                  style={{ color: 'var(--ink-soft)' }}
                  aria-pressed={reportReason === reason}
                >
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border" style={{ borderColor: reportReason === reason ? 'var(--burgundy)' : 'var(--line-strong)' }}>
                    {reportReason === reason && <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--burgundy)' }} />}
                  </span>
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              className="textarea mt-3"
              rows={3}
              placeholder="상황을 적어주세요 (선택)"
              value={reportDetail}
              maxLength={300}
              onChange={(event) => setReportDetail(event.target.value)}
            />
            <button type="button" onClick={submitReport} className="btn btn-burgundy mt-4 w-full">신고 접수</button>
          </div>
        </Modal>
      )}

      {/* 모바일 하단 정보 */}
      <div className="flex items-center justify-between border-t px-4 py-2 text-[9.5px] lg:hidden" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
        <span>{room.hours}</span>
        <span>D-{Math.max(cd.days, 0)} · {party.title}</span>
      </div>
    </div>
  )
}
