import { useEffect, useState, type FormEvent } from 'react'
import { resizeImageFile } from '../lib/image'

const url = import.meta.env.VITE_DD_DEV_URL as string | undefined
const key = import.meta.env.VITE_DD_DEV_KEY as string | undefined
type Session = { access_token: string; user: { id: string } }
type Room = { id: string; title: string }
type Message = { id: string; author_id: string; body: string; photo_path: string | null }

async function request(path: string, token?: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('apikey', key!)
  if (token) headers.set('Authorization', 'Bearer ' + token)
  const response = await fetch(url + path, { ...init, headers })
  if (!response.ok) throw new Error(String(response.status))
  return response
}
const json = (body: unknown): RequestInit => ({
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})

function Photo({ path, token }: { path: string; token: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let active = true
    let objectUrl = ''
    request('/storage/v1/object/authenticated/meeting-photos/' + path, token)
      .then(response => response.blob()).then(blob => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      }).catch(() => {})
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [path, token])
  return src ? <img src={src} alt="모임 사진" className="max-w-full rounded-lg" /> : null
}

function Conversations({ session }: { session: Session }) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [room, setRoom] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    request('/rest/v1/meeting_rooms?select=id,title&order=title', session.access_token)
      .then(response => response.json()).then((data: Room[]) => {
        if (active) { setRooms(data); setRoom(data[0]?.id ?? '') }
      }).catch(() => { if (active) setError('모임 목록을 불러오지 못했어요.') })
    return () => { active = false }
  }, [session])
  return <>
    {error && <p role="alert">{error}</p>}
    {rooms.length > 0 && <label className="block">모임 <select value={room} onChange={event => setRoom(event.target.value)}>
      {rooms.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
    </select></label>}
    {!room && !error && <p>초대받은 모임이 여기에 표시됩니다.</p>}
    {room && <RoomChat key={room} room={room} session={session} />}
  </>
}

function RoomChat({ room, session }: { room: string; session: Session }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const token = session.access_token
  useEffect(() => {
    let active = true
    let timer: number
    async function refresh() {
      try {
        const response = await request('/rest/v1/meeting_messages?select=id,author_id,body,photo_path&room_id=eq.' + room + '&order=created_at.desc,id.desc&limit=50', token)
        const data: Message[] = await response.json()
        if (active) setMessages(data.reverse())
      } catch {
        if (active) setNotice('채팅을 불러오지 못했어요. 세션이 만료됐다면 다시 로그인해 주세요.')
      }
      if (active) timer = window.setTimeout(refresh, 2500)
    }
    void refresh()
    return () => { active = false; window.clearTimeout(timer) }
  }, [room, token])

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const file = new FormData(form).get('photo')
    const hasPhoto = file instanceof File && file.size > 0
    if (!body.trim() && !hasPhoto) return
    setBusy(true)
    setNotice('')
    try {
      let photoPath: string | null = null
      if (hasPhoto) {
        if (file.size > 5_000_000) throw new Error('size')
        const data = await resizeImageFile(file, 480, .75)
        const jpeg = await fetch(data).then(response => response.blob())
        if (jpeg.type !== 'image/jpeg') throw new Error('photo')
        photoPath = room + '/' + session.user.id + '/' + crypto.randomUUID() + '.jpg'
        await request('/storage/v1/object/meeting-photos/' + photoPath, token, {
          method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: jpeg,
        })
      }
      await request('/rest/v1/meeting_messages', token, json({ room_id: room, body: body.trim(), photo_path: photoPath }))
      setBody('')
      form.reset()
    } catch { setNotice('전송하지 못했어요. 로그인 상태와 사진 크기(5MB 이하)를 확인해 주세요.') }
    finally { setBusy(false) }
  }

  return <>
    <div role="log" aria-label="모임 메시지" className="max-h-60 overflow-auto">
      {messages.map(message => <article key={message.id} className="my-2 rounded-lg bg-white p-2">
        <small>{message.author_id === session.user.id ? '나' : '모임 참여자'}</small>
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        {message.photo_path && <Photo path={message.photo_path} token={token} />}
      </article>)}
    </div>
    <form className="grid gap-2" onSubmit={send}>
      <label>메시지<textarea className="input w-full" value={body} disabled={busy} maxLength={1000} onChange={event => setBody(event.target.value)} /></label>
      <label>사진 <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} /></label>
      <button className="btn btn-primary" disabled={busy}>보내기</button>
    </form>
    <p role="status">{notice}</p>
  </>
}

export default function OnlineMeetingPreview() {
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!url || !key) return null

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const fields = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const response = await request('/auth/v1/token?grant_type=password', undefined, json({ email: fields.get('email'), password: fields.get('password') }))
      setSession(await response.json())
    } catch { setError('로그인하지 못했어요. 개발 계정 정보를 확인해 주세요.') }
    finally { setBusy(false) }
  }

  return <aside className="fixed right-2 top-2 z-[80] text-sm">
    <button className="btn btn-outline bg-white" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '온라인 모임 닫기' : '개발용 온라인 모임'}</button>
    {open && <section aria-label="개발용 온라인 모임" className="mt-2 grid max-h-[75dvh] w-[min(22rem,calc(100vw-1rem))] gap-3 overflow-auto rounded-xl border bg-emerald-50 p-3">
      {session ? <><button className="btn btn-outline" onClick={() => { setSession(null); void request('/auth/v1/logout?scope=local', session.access_token, { method: 'POST' }).catch(() => {}) }}>로그아웃</button><Conversations session={session} /></> :
        <form className="grid gap-2" onSubmit={signIn}>
          <label>개발 계정 이메일<input className="input w-full" name="email" type="email" autoComplete="username" required /></label>
          <label>비밀번호<input className="input w-full" name="password" type="password" autoComplete="current-password" required /></label>
          <button className="btn btn-primary" disabled={busy}>로그인</button>
          {error && <p role="alert">{error}</p>}
        </form>}
    </section>}
  </aside>
}
