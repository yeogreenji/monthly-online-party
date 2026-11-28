// 친구 1:1 실시간 채팅 — 친구(accepted)끼리는 수락 절차 없이 바로 열리고,
// 새 메시지는 Supabase Realtime으로 두 화면에 동시에 도착한다.
import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, Send, Smile, X } from 'lucide-react'
import { prepareChatPhoto, uploadChatPhoto, removeChatPhotos, type PreparedPhoto } from '../lib/photoChat'
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
  const [photos, setPhotos] = useState<PreparedPhoto[]>([])
  const [photoNote, setPhotoNote] = useState('')
  const [photoError, setPhotoError] = useState(false)
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
    if (!threadId || (!text && photos.length === 0)) return
    if (sending) return
    setSending(true)
    setPhotoError(false)
    const uploaded: string[] = []
    const kept = new Set<string>()
    try {
      const queue = photos.slice(0, 4)
      const prepared: { path: string; thumbPath: string; width: number; height: number; bytes: number }[] = []
      for (const item of queue) {
        const up = await uploadChatPhoto(`friend-${threadId}`, item, meRef.current)
        uploaded.push(up.path, up.thumbPath)
        prepared.push({ ...up, width: item.width, height: item.height, bytes: item.bytes })
      }
      const count = Math.max(1, prepared.length)
      for (let i = 0; i < count; i++) {
        const err = await sendChatMessage(threadId, i === 0 ? text : '', prepared[i])
        if (err) {
          onToast?.(err)
          if (/친구가 된 뒤에|로그인/.test(err)) setError(err)
          break
        }
        if (prepared[i]) kept.add(prepared[i].path).add(prepared[i].thumbPath)
      }
      setDraft('')
      setPhotos([])
      setPhotoNote('')
      setEmojiOpen(false)
      const fresh = await listChatMessages(threadId)
      setMessages(fresh)
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : '사진을 보내지 못했어요.')
      setPhotoError(true)
    } finally {
      // 저장되지 않은 사진은 즉시 지워 고아 파일을 남기지 않는다.
      const orphans = uploaded.filter((path) => !kept.has(path))
      if (orphans.length) void removeChatPhotos(orphans)
      setSending(false)
    }
  }

  async function pickPhotos(files: File[]) {
    if (files.length === 0) return
    const picked = files.slice(0, 4)
    const prepared: PreparedPhoto[] = []
    for (const file of picked) {
      try {
        prepared.push(await prepareChatPhoto(file))
      } catch (e) {
        onToast?.(e instanceof Error ? e.message : '사진을 열지 못했어요.')
      }
    }
    if (!prepared.length) return
    setPhotos(prepared)
    const total = prepared.reduce((sum, p) => sum + p.full.size, 0)
    setPhotoNote(`${prepared.length}장 · ${Math.max(1, Math.round(total / 1024))}KB 준비됨`)
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

      {photos.length > 0 && (
        <div className="dd-fc-photo-preview">
          <span>{photoNote}</span>
          <button type="button" onClick={() => { setPhotos([]); setPhotoNote('') }}>사진 빼기</button>
        </div>
      )}
      {photoError && <p className="dd-fc-photo-error" role="alert">사진을 보내지 못했어요. 준비한 사진은 지웠어요. 다시 골라 주세요.</p>}

      <form className="dd-fc-form" aria-label="친구에게 메시지 보내기" onSubmit={(e) => { e.preventDefault(); void send() }} onPaste={(e) => { const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/')); if (files.length) { e.preventDefault(); void pickPhotos(files) } }}>
        <button type="button" className="dd-fc-tool" aria-label="사진 고르기" disabled={state !== 'ready'} onClick={() => fileInput.current?.click()}><ImagePlus size={19} /></button>
        <button type="button" className="dd-fc-tool" aria-label="카메라로 촬영" disabled={state !== 'ready'} onClick={() => fileInput.current?.click()}><Camera size={19} /></button>
        <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp" hidden aria-label="채팅 사진 고르기" onChange={(e) => { const files = Array.from(e.target.files ?? []); e.target.value = ''; if (files.length) void pickPhotos(files) }} />
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
        <button type="submit" className="dd-fc-go" aria-label="보내기" disabled={state !== 'ready' || sending || (!draft.trim() && photos.length === 0)}><Send size={18} /></button>
      </form>
    </div>
  )
}
