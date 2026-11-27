// 친구 1:1 실시간 채팅 — 친구(accepted)끼리는 수락 절차 없이 바로 열리고,
// 새 메시지는 Supabase Realtime으로 두 화면에 동시에 도착한다.
import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, Send, Smile, X } from 'lucide-react'
import { prepareChatPhoto, uploadChatPhoto, type PreparedPhoto } from '../lib/photoChat'
import {
  listChatMessages,
  myId,
  openFriendChat,
  sendChatMessage,
  subscribeFriendChat,
  type NoteMessage,
} from '../lib/social'

const EMOJI = ['😊', '💛', '🎄', '☕', '👏', '🎉', '✨', '🐾', '❤️', '😂', '🙌', '🌷', '🎂', '🍰', '🌙', '🍂']

function clock(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export type ChatPeer = { userId: string; nickname: string; status?: 'online' | 'away' | 'dnd' }

/** 친구와의 1:1 채팅 창. 열리는 순간 서버가 대화방을 만들거나 기존 방을 이어 준다. */
export function FriendChatPanel({
  peer,
  onClose,
  onToast,
  onNeedAuth,
}: {
  peer: ChatPeer
  onClose: () => void
  onToast?: (text: string) => void
  onNeedAuth?: (reason: string) => void
}) {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<NoteMessage[]>([])
  const [draft, setDraft] = useState('')
  const [state, setState] = useState<'opening' | 'ready' | 'error'>('opening')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null)
  const [photoNote, setPhotoNote] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const log = useRef<HTMLDivElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const meRef = useRef<string>('')

  useEffect(() => {
    let alive = true
    setState('opening')
    setError('')
    void (async () => {
      const me = (await myId()) ?? ''
      if (!alive) return
      meRef.current = me
      if (!me) {
        setState('error')
        setError('로그인하면 친구와 바로 이야기할 수 있어요.')
        return
      }
      const result = await openFriendChat(peer.userId)
      if (!alive) return
      if ('error' in result) {
        setState('error')
        setError(result.error)
        return
      }
      setThreadId(result.threadId)
      const list = await listChatMessages(result.threadId)
      if (!alive) return
      setMessages(list)
      setState('ready')
    })()
    return () => { alive = false }
  }, [peer.userId])

  useEffect(() => {
    if (!threadId) return
    const off = subscribeFriendChat(threadId, meRef.current, (m) => {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
    })
    return off
  }, [threadId])

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight
  }, [messages])

  async function send() {
    const text = draft.trim()
    if (!threadId || (!text && !photo)) return
    if (sending) return
    setSending(true)
    try {
      let uploaded: { path: string; thumbPath: string } | undefined
      if (photo) uploaded = await uploadChatPhoto(`friend-${threadId}`, photo, meRef.current)
      const err = await sendChatMessage(threadId, text, photo && uploaded ? { ...uploaded, width: photo.width, height: photo.height, bytes: photo.bytes } : undefined)
      if (err) {
        onToast?.(err)
        if (/친구가 된 뒤에|로그인/.test(err)) setError(err)
        return
      }
      setDraft('')
      setPhoto(null)
      setPhotoNote('')
      setEmojiOpen(false)
      const fresh = await listChatMessages(threadId)
      setMessages(fresh)
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : '사진을 보내지 못했어요.')
    } finally {
      setSending(false)
    }
  }

  async function pickPhoto(file: File) {
    try {
      const prepared = await prepareChatPhoto(file)
      setPhoto(prepared)
      setPhotoNote(`${Math.max(1, Math.round(prepared.full.size / 1024))}KB 사진 준비됨`)
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : '사진을 열지 못했어요.')
    }
  }

  const statusText = peer.status === 'away' ? '자리비움' : peer.status === 'dnd' ? '방해금지' : '접속 중'

  return (
    <div className="dd-world-pop dd-friend-chat" role="dialog" aria-label={`${peer.nickname}님과 1:1 채팅`} data-friend-chat={peer.userId}>
      <header className="dd-fc-head">
        <span className="dd-fc-avatar" aria-hidden="true">{peer.nickname.slice(0, 1)}</span>
        <div className="dd-fc-who">
          <strong>{peer.nickname}</strong>
          <small>{statusText} · 친구 1:1 채팅</small>
        </div>
        <button type="button" className="dd-fc-x" aria-label="채팅 닫기" onClick={onClose}><X size={18} /></button>
      </header>

      <div className="dd-fc-log" role="log" aria-label={`${peer.nickname}님과의 대화`} ref={log} data-thread={threadId ?? ''}>
        {state === 'opening' && <p className="dd-fc-note">대화방을 여는 중이에요…</p>}
        {state === 'error' && (
          <div className="dd-fc-blocked">
            <strong>지금은 대화방을 열 수 없어요</strong>
            <p>{error}</p>
            {onNeedAuth && <button type="button" onClick={() => onNeedAuth('친구와 1:1 채팅을 하려면 딩동 계정이 필요해요.')}>이메일로 로그인</button>}
          </div>
        )}
        {state === 'ready' && messages.length === 0 && (
          <p className="dd-fc-note">첫 인사를 남겨 보세요. 메시지는 두 사람에게 바로 도착해요.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={'dd-fc-turn' + (m.mine ? ' is-mine' : '')}>
            {!m.mine && <span className="dd-fc-name">{peer.nickname}</span>}
            <div className="dd-fc-bubble">
              {m.body && <p>{m.body}</p>}
              {m.image && <img src={m.image} alt={`${peer.nickname}님이 보낸 사진`} loading="lazy" />}
            </div>
            <time>{clock(m.createdAt)}</time>
          </div>
        ))}
      </div>

      {emojiOpen && (
        <div className="dd-fc-emoji" role="group" aria-label="이모티콘">
          {EMOJI.map((e) => (
            <button key={e} type="button" onClick={() => setDraft((prev) => (prev + e).slice(0, 500))} aria-label={e}>{e}</button>
          ))}
        </div>
      )}

      {photo && (
        <div className="dd-fc-photo-preview">
          <span>{photoNote}</span>
          <button type="button" onClick={() => setPhoto(null)}>사진 빼기</button>
        </div>
      )}

      <form className="dd-fc-form" aria-label="친구에게 메시지 보내기" onSubmit={(e) => { e.preventDefault(); void send() }}>
        <button type="button" className="dd-fc-tool" aria-label="사진 고르기" disabled={state !== 'ready'} onClick={() => fileInput.current?.click()}><ImagePlus size={19} /></button>
        <button type="button" className="dd-fc-tool" aria-label="카메라로 촬영" disabled={state !== 'ready'} onClick={() => fileInput.current?.click()}><Camera size={19} /></button>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden aria-label="채팅 사진 고르기" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void pickPhoto(file) }} />
        <input
          className="dd-fc-input"
          aria-label="메시지"
          value={draft}
          maxLength={500}
          placeholder={state === 'ready' ? `${peer.nickname}님에게 남길 말` : '대화방을 여는 중…'}
          disabled={state !== 'ready'}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="button" className="dd-fc-tool" aria-label="이모티콘" aria-expanded={emojiOpen} onClick={() => setEmojiOpen((v) => !v)}><Smile size={19} /></button>
        <button type="submit" className="dd-fc-go" aria-label="보내기" disabled={state !== 'ready' || sending || (!draft.trim() && !photo)}><Send size={18} /></button>
      </form>
    </div>
  )
}
