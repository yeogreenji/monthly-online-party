// 2단계 소셜 화면: 친구 · 우편함 · 미니홈피(내 것/친구 집 방문).
// 로그인 전에는 '기기 체험' 안내만 보여 주고, 로그인 후에는 서버 저장값을 그대로 읽고 쓴다.
import { useEffect, useMemo, useState } from 'react'
import { Gift, Heart, Home, Mail, MessageCircle, Search, Send, Trash2, UserPlus, Users, X, Check, Bell } from 'lucide-react'
import type { MySpace, FriendSpace, Mail as MailItem, FriendEntry } from '../lib/social'
import {
  addGuestbook, deleteMail, listFriends, listGuestbook, listMail, listNoteThreads, markMailRead,
  removeFriend, removeGuestbook, requestNote, respondFriendRequest, respondNote, searchUsers, sendGift,
  sendLetter, sendNoteMessage, sendFriendRequest, myId, type GuestbookEntry, type NoteMessage, type NoteThread,
} from '../lib/social'
import { MINIROOM_THEMES, shortTime } from '../data/collections'
import { MINIHOME_DEFAULT, MOODS } from '../lib/socialTypes'
import type { MiniHome } from '../lib/socialTypes'

export const FREE_GIFTS: { name: string; emoji: string }[] = [
  { name: '튤립', emoji: '🌷' }, { name: '해바라기', emoji: '🌻' }, { name: '장미', emoji: '🌹' }, { name: '꽃다발', emoji: '💐' },
  { name: '커피', emoji: '☕' }, { name: '차', emoji: '🍵' }, { name: '밀크티', emoji: '🧋' }, { name: '초콜릿', emoji: '🍫' },
  { name: '케이크', emoji: '🍰' }, { name: '쿠키', emoji: '🍪' }, { name: '도넛', emoji: '🍩' }, { name: '딸기', emoji: '🍓' },
  { name: '곰 인형', emoji: '🧸' }, { name: '풍선', emoji: '🎈' }, { name: '편지', emoji: '✉️' }, { name: '선물상자', emoji: '🎁' },
  { name: '생일 케이크', emoji: '🎂' }, { name: '별 조명', emoji: '✨' }, { name: '화분', emoji: '🪴' }, { name: '미니 트리', emoji: '🎄' },
]
const giftEmoji = (name: string) => FREE_GIFTS.find((g) => g.name === name)?.emoji ?? '🎁'
const STATUS_LABEL = { online: '접속 중', away: '자리비움', dnd: '방해금지' } as const
const STATUS_DOT = { online: '🟢', away: '🟡', dnd: '🔴' } as const

function PanelShell({ title, icon, onClose, children, wide }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return <div className={'dd-world-pop ddm-panel' + (wide ? ' ddm-wide' : '')} role="dialog" aria-label={title}>
    <div className="dd-pop-title"><strong>{icon}{title}</strong><button className="dd3-btn" onClick={onClose} aria-label={title + ' 닫기'}><X size={16}/></button></div>
    {children}
  </div>
}

function LoginHint() {
  return <p className="ddm-hint">로그인하면 친구·방명록·선물·미니홈피가 계정에 저장되고 다른 기기에서도 이어집니다. 지금은 이 기기 체험만 가능해요.</p>
}

/* ── 친구 ───────────────────────────────────────────────────────────── */

export function FriendsPanel({ online, onClose, onVisit, onInvite, onToast }: {
  online: boolean
  onClose: () => void
  onVisit: (userId: string) => void
  onInvite: (friend: FriendEntry) => void
  onToast: (text: string, tone?: 'default' | 'success') => void
}) {
  const [data, setData] = useState<{ friends: FriendEntry[]; incoming: FriendEntry[]; outgoing: FriendEntry[] }>({ friends: [], incoming: [], outgoing: [] })
  const [q, setQ] = useState('')
  const [found, setFound] = useState<{ id: string; nickname: string; friend?: string; direction?: 'in' | 'out' }[]>([])
  const [busy, setBusy] = useState('')
  const [notes, setNotes] = useState<{ threads: NoteThread[]; messages: Record<string, NoteMessage[]> }>({ threads: [], messages: {} })
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<'friends' | 'notes'>('friends')

  const refresh = async () => {
    if (!online) return
    const [friends, threads] = await Promise.all([listFriends(), listNoteThreads()])
    setData(friends)
    setNotes(threads)
  }
  useEffect(() => { void refresh() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [online])

  const search = async () => {
    if (!online) return
    setFound(await searchUsers(q))
  }
  const request = async (id: string) => {
    setBusy(id)
    const err = await sendFriendRequest(id)
    setBusy('')
    onToast(err ?? '친구 신청을 보냈어요. 상대가 수락하면 친구가 돼요.', err ? 'default' : 'success')
    await refresh()
    await search()
  }
  const respond = async (id: string, accept: boolean) => {
    const err = await respondFriendRequest(id, accept)
    onToast(err ?? (accept ? '친구가 됐어요! 이제 집에 놀러 갈 수 있어요.' : '요청을 정중히 거절했어요.'), err ? 'default' : 'success')
    await refresh()
  }
  const drop = async (entry: FriendEntry) => {
    if (!window.confirm(`${entry.nickname}님과 친구를 끊을까요?`)) return
    const ok = await removeFriend(entry.id)
    onToast(ok ? '친구 목록에서 지웠어요.' : '잠시 후 다시 시도해 주세요.')
    await refresh()
  }
  const askNote = async (friend: FriendEntry) => {
    const text = window.prompt(`${friend.nickname}님에게 보낼 첫 쪽지를 적어 주세요. 상대가 수락하면 대화가 열립니다.`)
    if (!text?.trim()) return
    const err = await requestNote(friend.userId, text)
    onToast(err ?? '쪽지 요청을 보냈어요. 수락하면 대화가 열립니다.', err ? 'default' : 'success')
    await refresh()
    setTab('notes')
  }
  const answerNote = async (id: string, accept: boolean) => {
    const err = await respondNote(id, accept)
    onToast(err ?? (accept ? '쪽지 대화가 열렸어요.' : '쪽지 요청을 거절했어요.'))
    await refresh()
  }
  const sendNote = async (thread: NoteThread) => {
    const text = (noteDraft[thread.id] ?? '').trim()
    if (!text) return
    const err = await sendNoteMessage(thread.id, text)
    if (err) { onToast(err); return }
    setNoteDraft((prev) => ({ ...prev, [thread.id]: '' }))
    await refresh()
  }

  const pendingInNotes = notes.threads.filter((t) => t.status === 'pending' && t.direction === 'in').length
  return <PanelShell title="친구" icon={<Users size={17}/>} onClose={onClose} wide>
    {!online && <LoginHint/>}
    <div className="ddm-tabs" role="tablist">
      <button role="tab" aria-selected={tab === 'friends'} onClick={() => setTab('friends')}>친구 {data.friends.length}</button>
      <button role="tab" aria-selected={tab === 'notes'} onClick={() => setTab('notes')}>쪽지 {pendingInNotes ? `· 새 요청 ${pendingInNotes}` : ''}</button>
    </div>

    {tab === 'friends' ? <>
      <div className="ddm-search">
        <Search size={16}/>
        <input aria-label="친구 검색" placeholder="닉네임으로 친구 찾기" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void search() }}/>
        <button type="button" onClick={() => void search()} disabled={!online || !q.trim()}>찾기</button>
      </div>
      {found.length > 0 && <ul className="ddm-list">
        {found.map((u) => <li key={u.id}>
          <span className="ddm-name">{u.nickname}<small>{u.friend === 'accepted' ? '친구' : u.friend === 'pending' ? (u.direction === 'out' ? '신청 보냄' : '수락 대기') : '새 이웃'}</small></span>
          {u.friend === 'accepted'
            ? <button type="button" onClick={() => onVisit(u.id)}>집 놀러가기</button>
            : u.friend === 'pending'
              ? <span className="ddm-muted">{u.direction === 'out' ? '수락 기다리는 중' : '친구 탭에서 수락'}</span>
              : <button type="button" disabled={busy === u.id} onClick={() => void request(u.id)}><UserPlus size={14}/> 친구 신청</button>}
        </li>)}
      </ul>}

      {data.incoming.length > 0 && <section className="ddm-section">
        <h4>받은 신청 {data.incoming.length}</h4>
        <ul className="ddm-list">
          {data.incoming.map((f) => <li key={f.id}>
            <span className="ddm-name">{f.nickname}<small>{STATUS_DOT[f.peerStatus]} {STATUS_LABEL[f.peerStatus]}</small></span>
            <span className="ddm-row">
              <button type="button" className="is-primary" onClick={() => void respond(f.id, true)}><Check size={14}/> 수락</button>
              <button type="button" onClick={() => void respond(f.id, false)}>거절</button>
            </span>
          </li>)}
        </ul>
      </section>}

      {data.outgoing.length > 0 && <section className="ddm-section">
        <h4>보낸 신청</h4>
        <ul className="ddm-list">{data.outgoing.map((f) => <li key={f.id}><span className="ddm-name">{f.nickname}<small>수락을 기다리는 중</small></span><button type="button" onClick={() => void drop(f)}>취소</button></li>)}</ul>
      </section>}

      <section className="ddm-section">
        <h4>내 친구 {data.friends.length}</h4>
        {data.friends.length === 0 ? <p className="ddm-hint">아직 친구가 없어요. 닉네임으로 찾아 신청해 보세요.</p> : <ul className="ddm-list">
          {data.friends.map((f) => <li key={f.id} className="ddm-friend">
            <span className="ddm-name">{STATUS_DOT[f.peerStatus]} {f.nickname}<small>{STATUS_LABEL[f.peerStatus]}</small></span>
            <span className="ddm-row ddm-actions">
              <button type="button" onClick={() => onVisit(f.userId)}><Home size={14}/> 집</button>
              <button type="button" onClick={() => void askNote(f)}><MessageCircle size={14}/> 쪽지</button>
              <button type="button" onClick={() => onInvite(f)}><Send size={14}/> 모임 초대</button>
              <button type="button" aria-label={f.nickname + ' 친구 끊기'} onClick={() => void drop(f)}><Trash2 size={14}/></button>
            </span>
          </li>)}
        </ul>}
      </section>
    </> : <section className="ddm-section ddm-notes">
      {notes.threads.length === 0 && <p className="ddm-hint">쪽지는 친구와만, 서로 수락해야 열립니다. 친구 탭에서 '쪽지'를 눌러 시작해 보세요.</p>}
      {notes.threads.map((t) => <article key={t.id} className="ddm-thread">
        <header><strong>{t.peerName}</strong><small>{t.status === 'pending' ? (t.direction === 'in' ? '받은 요청' : '수락 대기') : t.status === 'accepted' ? '대화 중' : t.status === 'declined' ? '거절됨' : '종료'}{t.lastAt ? ' · ' + shortTime(t.lastAt) : ''}</small></header>
        {t.status === 'pending' && t.direction === 'in' && <div className="ddm-row"><button type="button" className="is-primary" onClick={() => void answerNote(t.id, true)}>수락</button><button type="button" onClick={() => void answerNote(t.id, false)}>거절</button></div>}
        {t.status === 'accepted' && <>
          <div className="ddm-messages" role="log" aria-label={t.peerName + ' 쪽지'}>
            {(notes.messages[t.id] ?? []).map((m) => <p key={m.id} className={m.mine ? 'is-mine' : ''}>{m.body}<time>{shortTime(m.createdAt)}</time></p>)}
          </div>
          <div className="ddm-search">
            <input aria-label="쪽지 입력" placeholder="쪽지 보내기" value={noteDraft[t.id] ?? ''} onChange={(e) => setNoteDraft((p) => ({ ...p, [t.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') void sendNote(t) }}/>
            <button type="button" onClick={() => void sendNote(t)}><Send size={14}/></button>
          </div>
        </>}
      </article>)}
    </section>}
  </PanelShell>
}

/* ── 우편함 ─────────────────────────────────────────────────────────── */

export function MailboxPanel({ online, onClose, onToast, onOpenInvite }: { online: boolean; onClose: () => void; onToast: (text: string, tone?: 'default' | 'success') => void; onOpenInvite: (space: string, topicId: string) => void }) {
  const [box, setBox] = useState<'in' | 'out'>('in')
  const [items, setItems] = useState<MailItem[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const load = async (which: 'in' | 'out') => { if (online) setItems(await listMail(which)) }
  useEffect(() => { void load(box) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [box, online])
  const openMail = async (m: MailItem) => {
    setOpen(open === m.id ? null : m.id)
    if (m.direction === 'in' && !m.readAt) { if (await markMailRead(m.id)) setItems((prev) => prev.map((x) => x.id === m.id ? { ...x, readAt: new Date().toISOString() } : x)) }
  }
  const remove = async (m: MailItem) => {
    if (!window.confirm('이 우편을 지울까요?')) return
    if (await deleteMail(m.id)) { setItems((prev) => prev.filter((x) => x.id !== m.id)); onToast('우편을 지웠어요.') }
  }
  const unread = items.filter((m) => m.direction === 'in' && !m.readAt).length
  return <PanelShell title="우편함" icon={<Mail size={17}/>} onClose={onClose}>
    {!online && <LoginHint/>}
    <div className="ddm-tabs" role="tablist">
      <button role="tab" aria-selected={box === 'in'} onClick={() => setBox('in')}>받은 우편 {unread ? `· ${unread}` : ''}</button>
      <button role="tab" aria-selected={box === 'out'} onClick={() => setBox('out')}>보낸 우편</button>
    </div>
    {items.length === 0 ? <p className="ddm-hint">{box === 'in' ? '아직 도착한 우편이 없어요. 친구에게 편지나 작은 선물을 보내 보세요.' : '보낸 우편이 없어요.'}</p> : <ul className="ddm-mail">
      {items.map((m) => <li key={m.id} className={!m.readAt && m.direction === 'in' ? 'is-unread' : ''}>
        <button type="button" className="ddm-mail-head" onClick={() => void openMail(m)} aria-expanded={open === m.id}>
          <span aria-hidden="true">{m.kind === 'gift' ? giftEmoji(m.gift ?? '') : m.kind === 'letter' ? '✉️' : '🎪'}</span>
          <span className="ddm-name">{m.direction === 'in' ? m.peerName + '님' : m.peerName + '님께'}<small>{m.kind === 'gift' ? `무료 선물 · ${m.gift}` : m.kind === 'letter' ? '편지' : '모임 초대'} · {shortTime(m.createdAt)}</small></span>
          {!m.readAt && m.direction === 'in' && <em className="ddm-new">새 우편</em>}
        </button>
        {open === m.id && <div className="ddm-mail-body">
          {m.body && <p>{m.body}</p>}
          {m.kind === 'invite' && m.meta?.topicId && m.meta?.space && <button type="button" className="is-primary" onClick={() => { onOpenInvite(m.meta.space!, m.meta.topicId!); onClose() }}>초대받은 모임 보기</button>}
          {m.kind === 'gift' && <p className="ddm-gift-big" aria-label={m.gift + ' 선물'}>{giftEmoji(m.gift ?? '')} <strong>{m.gift}</strong></p>}
          <button type="button" className="ddm-link" onClick={() => void remove(m)}>우편 지우기</button>
        </div>}
      </li>)}
    </ul>}
    <p className="ddm-note">선물과 편지는 서로 수락한 친구에게만 보낼 수 있어요. 같은 친구에게는 1시간에 5개까지.</p>
  </PanelShell>
}

/* ── 미니홈피 · 미니룸 방문 ─────────────────────────────────────────── */

function RoomPreview({ home, label }: { home: Partial<import('../data/homeDecor').HomeDecor>; label: string }) {
  const items = Array.isArray(home.items) ? home.items : []
  const NON_EMOJI: Record<string, string> = { table: '🪵', plant: '🪴', desk: '🗄️', loveseat: '🛋️', daybed: '🛏️', cabinet: '🗄️', vanity: '🪞', floorlamp: '💡', pouf: '🟠', dresser: '🗄️', piano: '🎹', mirror: '🪞', sidetable: '🪑', teaset: '🫖', clock: '🕰️', easel: '🎨', rug: '🟫', cushion: '🟡', screen: '🪭', stool: '🪑', shelf: '🗂️' }
  const emojiOf = (kind: string) => (/^\p{Extended_Pictographic}/u.test(kind) ? kind : (NON_EMOJI[kind] ?? '🪑'))
  return <div className="ddm-room" style={{ background: home.wallpaper ?? '#f3dfc8' }} role="img" aria-label={label}>
    <div className="ddm-room-floor" style={{ background: home.floor ?? '#e8b98a' }}>
      {items.slice(0, 10).map((item) => <span key={item.id} style={{ left: `${50 + (item.x / 5) * 42}%`, top: `${58 + (item.z / 4.5) * 30}%`, background: item.color }} aria-hidden="true">{emojiOf(item.kind)}</span>)}
      {items.length === 0 && <small>아직 가구를 놓지 않은 빈 방이에요.</small>}
    </div>
    {home.pet && home.pet !== '없음' && <b className="ddm-pet" aria-hidden="true">{home.pet}</b>}
  </div>
}

function GiftPicker({ onSend, onClose }: { onSend: (gift: string, note: string) => void; onClose: () => void }) {
  const [gift, setGift] = useState(FREE_GIFTS[0].name)
  const [note, setNote] = useState('')
  return <div className="ddm-giftbox" role="dialog" aria-label="무료 선물 고르기">
    <header><strong><Gift size={16}/> 무료 선물 20종</strong><button type="button" onClick={onClose} aria-label="선물 고르기 닫기"><X size={15}/></button></header>
    <div className="ddm-gift-grid">{FREE_GIFTS.map((g) => <button type="button" key={g.name} aria-pressed={gift === g.name} onClick={() => setGift(g.name)}><span aria-hidden="true">{g.emoji}</span><small>{g.name}</small></button>)}</div>
    <input aria-label="선물 한마디" placeholder="짧은 한마디 (선택)" maxLength={120} value={note} onChange={(e) => setNote(e.target.value)}/>
    <button type="button" className="is-primary" onClick={() => onSend(gift, note)}>{giftEmoji(gift)} {gift} 보내기</button>
  </div>
}

export function MiniHomePanel({ online, me, space, visiting, onClose, onVisitClose, onChange, onToast }: {
  online: boolean
  me: { nickname: string } | null
  space: MySpace | null
  visiting: FriendSpace | null
  onClose: () => void
  onVisitClose: () => void
  onChange: (patch: Partial<MySpace>) => void
  onToast: (text: string, tone?: 'default' | 'success') => void
}) {
  const home = useMemo(() => space?.home ?? {}, [space])
  const mini = useMemo<MiniHome>(() => ({ ...MINIHOME_DEFAULT, ...(space?.minihome ?? {}) }), [space])
  const friends = visiting
  const [tab, setTab] = useState<'home' | 'guest' | 'mail'>('home')
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([])
  const [draft, setDraft] = useState('')
  const [mails, setMails] = useState<MailItem[]>([])
  const [giftOpen, setGiftOpen] = useState(false)
  const [letterOpen, setLetterOpen] = useState(false)
  const [letter, setLetter] = useState('')
  const [bell, setBell] = useState('')
  const ownerId = friends?.userId ?? 'me'
  const loadGuest = async () => {
    if (!online) return
    if (friends) setGuestbook(await listGuestbook(friends.userId))
    else {
      const id = await myId()
      if (id) setGuestbook(await listGuestbook(id))
    }
  }
  useEffect(() => { void loadGuest() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ownerId, online])
  useEffect(() => {
    if (!online) return
    void listMail('in').then((list) => setMails(list.filter((m) => m.kind !== 'invite')))
  }, [online])

  const writeGuest = async () => {
    if (!friends) return
    const err = await addGuestbook(friends.userId, draft)
    if (err) { onToast(err); return }
    setDraft('')
    onToast('방명록에 인사를 남겼어요.', 'success')
    await loadGuest()
  }
  const sendFreeGift = async (gift: string, note: string) => {
    if (!friends) return
    const err = await sendGift(friends.userId, gift, note)
    if (err) { onToast(err); return }
    setGiftOpen(false)
    setBell('딩동! 작은 선물이 도착했어요.')
    onToast(`${friends.nickname}님에게 ${gift}을(를) 보냈어요.`, 'success')
  }
  const sendLetterNow = async () => {
    if (!friends || !letter.trim()) return
    const err = await sendLetter(friends.userId, letter)
    if (err) { onToast(err); return }
    setLetter('')
    setLetterOpen(false)
    setBell('딩동! 새로운 편지가 왔어요.')
    onToast('편지를 보냈어요.', 'success')
  }

  if (friends) {
    const fm = friends.minihome
    return <PanelShell title={`${friends.nickname}님의 미니홈피`} icon={<Home size={17}/>} onClose={onVisitClose} wide>
      {bell && <p className="ddm-bell" role="status">🔔 {bell}</p>}
      <div className="ddm-home-head">
        <div><h3>{fm.title}</h3><p>오늘의 기분 · {fm.mood}</p></div>
        <span className="ddm-status">{STATUS_DOT[friends.status]} {STATUS_LABEL[friends.status]}</span>
      </div>
      {fm.intro && <p className="ddm-intro">{fm.intro}</p>}
      {fm.tags.length > 0 && <div className="ddm-tags">{fm.tags.map((t) => <span key={t}>#{t}</span>)}</div>}
      <RoomPreview home={friends.home} label={`${friends.nickname}님의 미니룸`}/>
      <p className="ddm-theme">미니룸 테마 · {friends.home.theme ?? fm.theme ?? '카페형'}</p>
      <div className="ddm-row ddm-visit-actions">
        <button type="button" className="is-primary" onClick={() => setGiftOpen(true)}><Gift size={15}/> 선물 보내기</button>
        <button type="button" onClick={() => setLetterOpen(true)}><Mail size={15}/> 편지 쓰기</button>
        <button type="button" onClick={() => onToast('초인종을 눌렀어요. 딩동! 친구가 놀러 왔어요.', 'success')}><Bell size={15}/> 초인종</button>
      </div>
      {giftOpen && <GiftPicker onSend={sendFreeGift} onClose={() => setGiftOpen(false)}/>}
      {letterOpen && <div className="ddm-letter">
        <textarea aria-label="편지 내용" maxLength={500} placeholder="짧아도 좋아요. 전하고 싶은 말을 적어 주세요." value={letter} onChange={(e) => setLetter(e.target.value)}/>
        <div className="ddm-row"><button type="button" onClick={() => setLetterOpen(false)}>취소</button><button type="button" className="is-primary" onClick={() => void sendLetterNow()}>편지 보내기</button></div>
      </div>}
      <section className="ddm-section">
        <h4><MessageCircle size={15}/> 방명록 {guestbook.length}</h4>
        <div className="ddm-guest-form">
          <input aria-label="방명록 글" maxLength={300} placeholder={`${friends.nickname}님께 인사를 남겨 보세요`} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void writeGuest() }}/>
          <button type="button" onClick={() => void writeGuest()} disabled={!draft.trim()}>남기기</button>
        </div>
        {guestbook.length === 0 ? <p className="ddm-hint">첫 방명록을 남겨 보세요. 친구만 글을 쓸 수 있어요.</p> : <ul className="ddm-guest">{guestbook.map((g) => <li key={g.id}><span>{g.author}</span><p>{g.body}</p><time>{shortTime(g.createdAt)}</time>{g.mine && <button type="button" onClick={async () => { if (await removeGuestbook(g.id)) { onToast('방명록 글을 지웠어요.'); await loadGuest() } }}>삭제</button>}</li>)}</ul>}
      </section>
      {fm.song && <a className="ddm-song" href={fm.song} target="_blank" rel="noopener noreferrer">🎵 오늘의 추천곡 공식 링크 열기</a>}
      {fm.note && <p className="ddm-note">오늘의 한마디 · {fm.note}</p>}
    </PanelShell>
  }

  const saveMini = (patch: Partial<MiniHome>) => onChange({ minihome: { ...mini, ...patch } })
  return <PanelShell title="나의 미니홈피" icon={<Home size={17}/>} onClose={onClose} wide>
    {!online && <LoginHint/>}
    <div className="ddm-tabs" role="tablist">
      <button role="tab" aria-selected={tab === 'home'} onClick={() => setTab('home')}>미니홈</button>
      <button role="tab" aria-selected={tab === 'guest'} onClick={() => setTab('guest')}>방명록 {guestbook.length}</button>
      <button role="tab" aria-selected={tab === 'mail'} onClick={() => setTab('mail')}>우편함 {mails.length}</button>
    </div>
    {tab === 'home' ? <>
      <RoomPreview home={home} label="내 미니룸 미리보기"/>
      <div className="ddm-field"><label>홈피 제목<input maxLength={40} value={mini.title} onChange={(e) => saveMini({ title: e.target.value })}/></label></div>
      <div className="ddm-grid2">
        <label className="ddm-field">오늘의 기분<select value={mini.mood} onChange={(e) => saveMini({ mood: e.target.value })}>{MOODS.map((m) => <option key={m}>{m}</option>)}</select></label>
        <label className="ddm-field">공개 범위<select aria-label="미니홈피 공개 범위" value={space?.visibility ?? 'private'} onChange={(e) => onChange({ visibility: e.target.value as MySpace['visibility'] })}><option value="private">비공개 (나만)</option><option value="friends">친구 공개</option><option value="public">전체 공개</option></select></label>
      </div>
      <label className="ddm-field">소개<textarea maxLength={160} value={mini.intro} onChange={(e) => saveMini({ intro: e.target.value })} placeholder="어떤 집인지 한두 문장으로 소개해 주세요."/></label>
      <label className="ddm-field">취향 태그 (쉼표로 구분, 최대 5개)<input maxLength={80} value={mini.tags.join(', ')} onChange={(e) => saveMini({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 5) })} placeholder="카페, 재즈, 고양이"/></label>
      <label className="ddm-field">오늘의 추천곡 공식 링크<input type="url" maxLength={300} value={mini.song} onChange={(e) => saveMini({ song: e.target.value })} placeholder="https:// (공식 링크만)"/></label>
      <label className="ddm-field">오늘의 한마디<input maxLength={120} value={mini.note} onChange={(e) => saveMini({ note: e.target.value })}/></label>
      <section className="ddm-section">
        <h4>미니룸 테마 8종</h4>
        <div className="ddm-themes">{MINIROOM_THEMES.map((t) => <button type="button" key={t.name} aria-pressed={home.theme === t.name} onClick={() => { onChange({ home: { ...home, wallpaper: t.wallpaper, floor: t.floor, rug: t.rug, furnitureColor: t.furnitureColor, theme: t.name } }); onToast(`${t.name} 테마를 입혔어요. 3D 집에도 바로 적용됩니다.`, 'success') }}>
          <span style={{ background: t.wallpaper, borderColor: t.floor }}/><strong>{t.name}</strong><small>{t.note}</small>
        </button>)}</div>
      </section>
      <p className="ddm-note">저장은 자동이에요. 로그인 상태면 계정에 저장되어 다른 기기에서도 같은 집이 열립니다{me ? ` · ${me.nickname}` : ''}.</p>
    </> : tab === 'guest' ? <section className="ddm-section">
      <h4>내 방명록 {guestbook.length}</h4>
      {guestbook.length === 0 ? <p className="ddm-hint">친구가 방명록을 남기면 여기에 쌓여요.</p> : <ul className="ddm-guest">{guestbook.map((g) => <li key={g.id}><span>{g.author}</span><p>{g.body}</p><time>{shortTime(g.createdAt)}</time><button type="button" onClick={async () => { if (await removeGuestbook(g.id)) { onToast('방명록 글을 지웠어요.'); await loadGuest() } }}>삭제</button></li>)}</ul>}
    </section> : <section className="ddm-section">
      <h4>내 우편함</h4>
      {mails.length === 0 ? <p className="ddm-hint">도착한 편지와 선물이 없어요.</p> : <ul className="ddm-mail">{mails.map((m) => <li key={m.id}><span aria-hidden="true">{m.kind === 'gift' ? giftEmoji(m.gift ?? '') : '✉️'}</span><span className="ddm-name">{m.peerName}님<small>{m.kind === 'gift' ? m.gift : '편지'} · {shortTime(m.createdAt)}</small></span></li>)}</ul>}
      <p className="ddm-note">전체 우편은 상단 우편함에서 볼 수 있어요.</p>
    </section>}
  </PanelShell>
}

export function NoteBadge({ count }: { count: number }) {
  return count > 0 ? <span className="ddm-badge" aria-label={`새 소식 ${count}건`}>{count > 9 ? '9+' : count}</span> : null
}

export function HeartHint() {
  return <span className="ddm-heart" aria-hidden="true"><Heart size={12}/></span>
}
