// 2단계 서버 기능: 계정별 미니룸·옷장·미니홈피 저장, 친구, 방명록, 우편함(편지·선물·초대),
// 상호 동의 1:1 쪽지. Supabase가 없거나 로그인 전이면 화면은 기존 기기 저장 체험으로 동작한다.
import { supabase, serverEnabled } from './supabase'
import type { Look } from '../data/avatarLook'
import type { HomeDecor } from '../data/homeDecor'
import type { MiniHome } from './socialTypes'
export type { MiniHome } from './socialTypes'
import { MINIHOME_DEFAULT } from './socialTypes'
import { signedPhotoUrls, signedPhotoUrl } from './photoChat'

export const socialEnabled = serverEnabled

export async function myId(): Promise<string | null> {
  return uid()
}

async function uid(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

/* ── 내 공간(캐릭터·옷장·미니룸·미니홈피) ───────────────────────────── */

export type MySpace = {
  look: Partial<Look>
  outfits: { id: string; look: Look }[]
  home: Partial<HomeDecor>
  minihome: MiniHome
  visibility: 'private' | 'friends' | 'public'
  updatedAt?: string
}

export async function loadMySpace(): Promise<MySpace | null> {
  if (!supabase) return null
  const me = await uid()
  if (!me) return null
  const { data, error } = await supabase
    .from('user_spaces')
    .select('look,outfits,home,minihome,visibility,updated_at')
    .eq('user_id', me)
    .maybeSingle()
  if (error || !data) return null
  const row = data as { look: Partial<Look>; outfits: MySpace['outfits']; home: Partial<HomeDecor>; minihome: Partial<MiniHome>; visibility: MySpace['visibility']; updated_at: string }
  return {
    look: row.look ?? {},
    outfits: Array.isArray(row.outfits) ? row.outfits.slice(0, 12) : [],
    home: row.home ?? {},
    minihome: { ...MINIHOME_DEFAULT, ...(row.minihome ?? {}) },
    visibility: row.visibility ?? 'private',
    updatedAt: row.updated_at,
  }
}

/** 내 공간 일부만 저장한다. 화면은 기기 저장을 먼저 하고, 로그인 상태면 서버에도 같은 값을 쓴다. */
export async function saveMySpace(patch: Partial<Omit<MySpace, 'updatedAt'>>): Promise<boolean> {
  if (!supabase) return false
  const me = await uid()
  if (!me) return false
  const { error } = await supabase
    .from('user_spaces')
    .upsert({ user_id: me, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  return !error
}

export type FriendSpace = {
  userId: string
  nickname: string
  look: Partial<Look>
  home: Partial<HomeDecor>
  minihome: MiniHome
  visibility: 'private' | 'friends' | 'public'
  status: 'online' | 'away' | 'dnd'
}

/** 친구(또는 전체 공개) 집을 연다. 공개 범위가 막으면 null. */
export async function loadFriendSpace(userId: string): Promise<FriendSpace | null> {
  if (!supabase) return null
  // user_spaces와 profiles 는 auth.users 를 통해서만 이어져 있어 조인 대신 두 번 읽는다.
  const [{ data: spaceRow }, { data: prof }] = await Promise.all([
    supabase.from('user_spaces').select('user_id,look,home,minihome,visibility').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('id,nickname,status').eq('id', userId).maybeSingle(),
  ])
  if (!prof) return null
  const p = prof as { id: string; nickname: string; status: FriendSpace['status'] }
  if (!spaceRow) {
    // 아직 자기 집을 저장한 적 없는 계정: 프로필만 있는 '빈 집'
    return { userId: p.id, nickname: p.nickname, look: {}, home: {}, minihome: { ...MINIHOME_DEFAULT }, visibility: 'private', status: p.status ?? 'online' }
  }
  const row = spaceRow as { user_id: string; look: Partial<Look>; home: Partial<HomeDecor>; minihome: Partial<MiniHome>; visibility: FriendSpace['visibility'] }
  return {
    userId: row.user_id,
    nickname: p.nickname,
    look: row.look ?? {},
    home: row.home ?? {},
    minihome: { ...MINIHOME_DEFAULT, ...(row.minihome ?? {}) },
    visibility: row.visibility ?? 'private',
    status: p.status ?? 'online',
  }
}

export async function setMyStatus(status: 'online' | 'away' | 'dnd'): Promise<boolean> {
  if (!supabase) return false
  const me = await uid()
  if (!me) return false
  const { error } = await supabase.from('profiles').update({ status }).eq('id', me)
  return !error
}

/* ── 친구 ───────────────────────────────────────────────────────────── */

export type FriendEntry = {
  id: string
  userId: string
  nickname: string
  status: 'pending' | 'accepted' | 'declined'
  direction: 'in' | 'out'
  peerStatus: 'online' | 'away' | 'dnd'
  since: string
}
type FriendRow = { id: string; requester: string; addressee: string; status: FriendEntry['status']; created_at: string; updated_at: string }

async function namesOf(ids: string[]): Promise<Map<string, { nickname: string; status: FriendEntry['peerStatus'] }>> {
  const map = new Map<string, { nickname: string; status: FriendEntry['peerStatus'] }>()
  if (!supabase || ids.length === 0) return map
  const { data } = await supabase.from('profiles').select('id,nickname,status').in('id', [...new Set(ids)])
  for (const r of (data ?? []) as { id: string; nickname: string; status: FriendEntry['peerStatus'] }[]) {
    map.set(r.id, { nickname: r.nickname, status: r.status ?? 'online' })
  }
  return map
}

export async function listFriends(): Promise<{ friends: FriendEntry[]; incoming: FriendEntry[]; outgoing: FriendEntry[] }> {
  const empty = { friends: [] as FriendEntry[], incoming: [] as FriendEntry[], outgoing: [] as FriendEntry[] }
  if (!supabase) return empty
  const me = await uid()
  if (!me) return empty
  const { data, error } = await supabase
    .from('friendships')
    .select('id,requester,addressee,status,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(200)
  if (error || !data) return empty
  const rows = data as FriendRow[]
  const names = await namesOf(rows.map((r) => (r.requester === me ? r.addressee : r.requester)))
  const make = (r: FriendRow): FriendEntry => {
    const peerId = r.requester === me ? r.addressee : r.requester
    const info = names.get(peerId)
    return { id: r.id, userId: peerId, nickname: info?.nickname ?? '이웃', status: r.status, direction: r.requester === me ? 'out' : 'in', peerStatus: info?.status ?? 'online', since: r.updated_at }
  }
  const out: typeof empty = { friends: [], incoming: [], outgoing: [] }
  for (const r of rows) {
    const e = make(r)
    if (r.status === 'accepted') out.friends.push(e)
    else if (r.status === 'pending') (e.direction === 'in' ? out.incoming : out.outgoing).push(e)
  }
  return out
}

export async function searchUsers(query: string): Promise<{ id: string; nickname: string; friend?: FriendEntry['status']; direction?: 'in' | 'out' }[]> {
  if (!supabase) return []
  const me = await uid()
  if (!me) return []
  const q = query.trim().replace(/[%_]/g, '')
  if (q.length < 1) return []
  const { data, error } = await supabase.from('profiles').select('id,nickname').ilike('nickname', `%${q}%`).neq('id', me).limit(8)
  if (error || !data) return []
  const found = data as { id: string; nickname: string }[]
  const { data: rel } = await supabase.from('friendships').select('requester,addressee,status').or(`requester.eq.${me},addressee.eq.${me}`)
  const relMap = new Map<string, { status: FriendEntry['status']; direction: 'in' | 'out' }>()
  for (const r of (rel ?? []) as { requester: string; addressee: string; status: FriendEntry['status'] }[]) {
    const peer = r.requester === me ? r.addressee : r.requester
    relMap.set(peer, { status: r.status, direction: r.requester === me ? 'out' : 'in' })
  }
  return found.map((p) => ({ ...p, friend: relMap.get(p.id)?.status, direction: relMap.get(p.id)?.direction }))
}

export async function sendFriendRequest(userId: string): Promise<string | null> {
  if (!supabase) return '서버에 연결되어 있지 않아요.'
  const me = await uid()
  if (!me) return '먼저 로그인해 주세요.'
  const { data: existing } = await supabase.from('friendships').select('id,requester,status').or(`and(requester.eq.${me},addressee.eq.${userId}),and(requester.eq.${userId},addressee.eq.${me})`).maybeSingle()
  if (existing) {
    const row = existing as { id: string; requester: string; status: FriendEntry['status'] }
    if (row.status === 'accepted') return '이미 친구예요.'
    if (row.status === 'pending') return row.requester === me ? '이미 신청을 보냈어요. 수락을 기다리는 중이에요.' : '상대가 보낸 신청이 있어요. 친구 목록에서 수락해 주세요.'
    const { error } = await supabase.from('friendships').update({ requester: me, addressee: userId, status: 'pending' }).eq('id', row.id)
    return error ? '다시 신청하지 못했어요.' : null
  }
  const { error } = await supabase.from('friendships').insert({ requester: me, addressee: userId })
  if (!error) return null
  if (error.message.includes('too_many_friend_requests')) return '친구 신청을 너무 많이 보냈어요. 잠시 후 다시 시도해 주세요.'
  return '친구 신청을 보내지 못했어요.'
}

export async function respondFriendRequest(id: string, accept: boolean): Promise<string | null> {
  if (!supabase) return '서버에 연결되어 있지 않아요.'
  const { error } = await supabase.from('friendships').update({ status: accept ? 'accepted' : 'declined' }).eq('id', id)
  return error ? '요청을 처리하지 못했어요.' : null
}

export async function removeFriend(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('friendships').delete().eq('id', id)
  return !error
}

/* ── 방명록 ─────────────────────────────────────────────────────────── */

export type GuestbookEntry = { id: string; body: string; createdAt: string; authorId: string; author: string; mine: boolean }

export async function listGuestbook(ownerId: string, limit = 20): Promise<GuestbookEntry[]> {
  if (!supabase) return []
  const me = await uid()
  const { data, error } = await supabase.from('guestbook').select('id,body,created_at,author_id').eq('owner_id', ownerId).order('created_at', { ascending: false }).limit(limit)
  if (error || !data) return []
  const rows = data as { id: string; body: string; created_at: string; author_id: string }[]
  const names = await namesOf(rows.map((r) => r.author_id))
  return rows.map((r) => ({ id: r.id, body: r.body, createdAt: r.created_at, authorId: r.author_id, author: names.get(r.author_id)?.nickname ?? '이웃', mine: r.author_id === me }))
}

export async function addGuestbook(ownerId: string, body: string): Promise<string | null> {
  if (!supabase) return '서버에 연결되어 있지 않아요.'
  const text = body.trim()
  if (!text) return '남길 글을 적어 주세요.'
  const { error } = await supabase.from('guestbook').insert({ owner_id: ownerId, body: text.slice(0, 300) })
  if (!error) return null
  if (error.message.includes('too_many_guestbook')) return '오늘은 이 집에 인사를 많이 남겼어요. 잠시 후 다시 남겨 주세요.'
  if (error.code === '42501') return '이 집 방명록에 글을 남길 수 없어요(친구만 가능).'
  return '방명록을 남기지 못했어요.'
}

export async function removeGuestbook(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('guestbook').delete().eq('id', id)
  return !error
}

/* ── 우편함(편지·무료 선물·모임 초대) ─────────────────────────────── */

export type MailKind = 'letter' | 'gift' | 'invite'
export type Mail = {
  id: string
  kind: MailKind
  gift: string | null
  body: string | null
  meta: { topicId?: string; title?: string; space?: string }
  readAt: string | null
  createdAt: string
  direction: 'in' | 'out'
  peerId: string
  peerName: string
}

export async function listMail(box: 'in' | 'out' = 'in', limit = 50): Promise<Mail[]> {
  if (!supabase) return []
  const me = await uid()
  if (!me) return []
  const column = box === 'in' ? 'recipient_id' : 'sender_id'
  const { data, error } = await supabase
    .from('letters')
    .select('id,kind,gift,body,meta,read_at,created_at,sender_id,recipient_id')
    .eq(column, me)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  const rows = data as { id: string; kind: MailKind; gift: string | null; body: string | null; meta: Mail['meta']; read_at: string | null; created_at: string; sender_id: string; recipient_id: string }[]
  const names = await namesOf(rows.map((r) => (box === 'in' ? r.sender_id : r.recipient_id)))
  return rows.map((r) => {
    const peerId = box === 'in' ? r.sender_id : r.recipient_id
    return { id: r.id, kind: r.kind, gift: r.gift, body: r.body, meta: r.meta ?? {}, readAt: r.read_at, createdAt: r.created_at, direction: box, peerId, peerName: names.get(peerId)?.nickname ?? '이웃' }
  })
}

async function sendMail(recipientId: string, kind: MailKind, payload: { gift?: string; body?: string; meta?: Mail['meta'] }): Promise<string | null> {
  if (!supabase) return '서버에 연결되어 있지 않아요.'
  const { error } = await supabase.from('letters').insert({ recipient_id: recipientId, kind, gift: payload.gift ?? null, body: payload.body?.slice(0, 500) ?? null, meta: payload.meta ?? {} })
  if (!error) return null
  if (error.message.includes('friends_only')) return '친구에게만 보낼 수 있어요.'
  if (error.message.includes('too_many_gifts')) return '같은 친구에게 선물을 너무 많이 보냈어요. 잠시 후 다시 보내 주세요.'
  if (error.message.includes('blocked')) return '지금은 이 사람에게 보낼 수 없어요.'
  return '보내지 못했어요. 잠시 후 다시 시도해 주세요.'
}

export function sendGift(recipientId: string, gift: string, note?: string) {
  return sendMail(recipientId, 'gift', { gift, body: note })
}
export function sendLetter(recipientId: string, body: string) {
  return sendMail(recipientId, 'letter', { body })
}
export function sendInvite(recipientId: string, topic: { id: string; title: string; space: string }) {
  return sendMail(recipientId, 'invite', { body: `'${topic.title}' 모임에 초대했어요.`, meta: { topicId: topic.id, title: topic.title, space: topic.space } })
}
export async function markMailRead(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('letters').update({ read_at: new Date().toISOString() }).eq('id', id)
  return !error
}
export async function deleteMail(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('letters').delete().eq('id', id)
  return !error
}

/* ── 상호 동의 1:1 쪽지 ────────────────────────────────────────────── */

export type NoteThread = { id: string; peerId: string; peerName: string; status: 'pending' | 'accepted' | 'declined' | 'closed'; mode: 'note' | 'chat'; direction: 'in' | 'out'; createdAt: string; lastAt: string | null }
export type NoteMessage = { id: string; body: string; createdAt: string; mine: boolean; image?: string }

export async function listNoteThreads(): Promise<{ threads: NoteThread[]; messages: Record<string, NoteMessage[]> }> {
  if (!supabase) return { threads: [], messages: {} }
  const me = await uid()
  if (!me) return { threads: [], messages: {} }
  const { data, error } = await supabase.from('note_threads').select('id,requester,addressee,status,mode,created_at,last_message_at').order('created_at', { ascending: false }).limit(50)
  if (error || !data) return { threads: [], messages: {} }
  const rows = data as { id: string; requester: string; addressee: string; status: NoteThread['status']; mode?: NoteThread['mode']; created_at: string; last_message_at: string | null }[]
  const names = await namesOf(rows.map((r) => (r.requester === me ? r.addressee : r.requester)))
  const threads: NoteThread[] = rows.map((r) => {
    const peerId = r.requester === me ? r.addressee : r.requester
    return { id: r.id, peerId, peerName: names.get(peerId)?.nickname ?? '이웃', status: r.status, mode: r.mode ?? 'note', direction: r.requester === me ? 'out' : 'in', createdAt: r.created_at, lastAt: r.last_message_at }
  })
  const messages: Record<string, NoteMessage[]> = {}
  if (threads.length) {
    const { data: msgs } = await supabase.from('note_messages').select('id,thread_id,sender_id,body,created_at,image_path').in('thread_id', threads.map((t) => t.id)).order('created_at').limit(400)
    const rowsM = (msgs ?? []) as { id: string; thread_id: string; sender_id: string; body: string; created_at: string; image_path: string | null }[]
    const photos = await signedPhotoUrls(rowsM.map((m) => m.image_path).filter((v): v is string => Boolean(v)))
    for (const m of rowsM) {
      ;(messages[m.thread_id] ??= []).push({ id: m.id, body: m.body, createdAt: m.created_at, mine: m.sender_id === me, image: m.image_path ? photos[m.image_path] : undefined })
    }
  }
  return { threads, messages }
}

export async function requestNote(peerId: string, message: string): Promise<string | null> {
  if (!supabase) return '서버에 연결되어 있지 않아요.'
  const text = message.trim()
  if (!text) return '첫 쪽지를 적어 주세요.'
  const { data, error } = await supabase.from('note_threads').insert({ addressee: peerId }).select('id').single()
  if (error || !data) {
    if (error?.code === '23505') return '이미 진행 중인 쪽지가 있어요.'
    return '쪽지를 보내지 못했어요. 친구만 쪽지를 주고받을 수 있어요.'
  }
  const threadId = (data as { id: string }).id
  const { error: msgError } = await supabase.from('note_messages').insert({ thread_id: threadId, body: text.slice(0, 500) })
  if (msgError) return '첫 쪽지를 저장하지 못했어요.'
  return null
}

export async function respondNote(threadId: string, accept: boolean): Promise<string | null> {
  if (!supabase) return '서버에 연결되어 있지 않아요.'
  const { error } = await supabase.from('note_threads').update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() }).eq('id', threadId)
  return error ? '쪽지 요청을 처리하지 못했어요.' : null
}

export async function sendNoteMessage(threadId: string, body: string): Promise<string | null> {
  if (!supabase) return '서버에 연결되어 있지 않아요.'
  const text = body.trim()
  if (!text) return '보낼 내용을 적어 주세요.'
  const { error } = await supabase.from('note_messages').insert({ thread_id: threadId, body: text.slice(0, 500) })
  if (!error) return null
  if (error.message.includes('too_many_notes')) return '너무 빨리 보냈어요. 잠시 후 다시 보내 주세요.'
  return '쪽지를 보내지 못했어요.'
}

/* ── 실시간 알림(초인종) ───────────────────────────────────────────── */

export type BellEvent = { kind: 'friend' | 'gift' | 'letter' | 'invite' | 'note'; text: string }

/** 내게 오는 새 소식(친구 신청·선물·편지·초대·쪽지)을 실시간으로 알려 준다. 반환값은 구독 해제. */
export function subscribeBells(onBell: (e: BellEvent) => void): () => void {
  if (!supabase) return () => {}
  const client = supabase
  const channel = client
    .channel('dd-bells')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'letters' }, (p) => {
      const row = p.new as { recipient_id: string; kind: MailKind }
      void uid().then((me) => {
        if (!me || row.recipient_id !== me) return
        onBell({ kind: row.kind, text: row.kind === 'gift' ? '딩동! 작은 선물이 도착했어요.' : row.kind === 'letter' ? '딩동! 새로운 편지가 왔어요.' : '딩동! 함께할 파티가 생겼어요.' })
      })
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'note_threads' }, (p) => {
      const row = p.new as { addressee: string }
      void uid().then((me) => {
        if (me && row.addressee === me) onBell({ kind: 'note', text: '쪽지 요청이 도착했어요. 수락하면 대화가 열려요.' })
      })
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friendships' }, (p) => {
      const row = p.new as { addressee: string }
      void uid().then((me) => {
        if (me && row.addressee === me) onBell({ kind: 'friend', text: '새 친구 신청이 도착했어요.' })
      })
    })
    .subscribe()
  return () => {
    void client.removeChannel(channel)
  }
}

/* ── 친구 1:1 실시간 채팅 ──────────────────────────────────────────────
   친구(accepted)면 수락 절차 없이 open_friend_chat RPC로 방을 열고,
   note_messages의 Realtime INSERT를 구독해 두 화면에 바로 나타나게 한다.
   친구가 아닌 사람은 이 경로를 쓸 수 없고, 기존 수락제 쪽지만 쓸 수 있다. */

export async function openFriendChat(peerId: string): Promise<{ threadId: string } | { error: string }> {
  if (!supabase) return { error: '서버에 연결되어 있지 않아요.' }
  const { data, error } = await supabase.rpc('open_friend_chat', { peer: peerId })
  if (error || !data) {
    const msg = error?.message ?? ''
    if (/friends_only/.test(msg)) return { error: '친구가 된 뒤에 1:1 채팅을 열 수 있어요.' }
    if (/blocked/.test(msg)) return { error: '지금은 이 사람과 대화할 수 없어요.' }
    if (/auth_required/.test(msg)) return { error: '먼저 로그인해 주세요.' }
    return { error: '채팅방을 열지 못했어요. 잠시 후 다시 시도해 주세요.' }
  }
  return { threadId: String(data) }
}

export async function listChatMessages(threadId: string): Promise<NoteMessage[]> {
  if (!supabase) return []
  const me = await uid()
  const { data, error } = await supabase
    .from('note_messages')
    .select('id,thread_id,sender_id,body,created_at,image_path')
    .eq('thread_id', threadId)
    .order('created_at')
    .limit(200)
  if (error || !data) return []
  const rows = data as { id: string; sender_id: string; body: string; created_at: string; image_path: string | null }[]
  const photos = await signedPhotoUrls(rows.map((r) => r.image_path).filter((v): v is string => Boolean(v)))
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.created_at,
    mine: r.sender_id === me,
    image: r.image_path ? photos[r.image_path] : undefined,
  }))
}

export async function sendChatMessage(
  threadId: string,
  text: string,
  photo?: { path: string; thumbPath: string; width: number; height: number; bytes: number },
): Promise<string | null> {
  if (!supabase) return '서버에 연결되어 있지 않아요.'
  const body = text.trim().slice(0, 500)
  if (!body && !photo) return '보낼 내용을 적어 주세요.'
  const { error } = await supabase.from('note_messages').insert({
    thread_id: threadId,
    body,
    image_path: photo?.path,
    image_thumb_path: photo?.thumbPath,
    image_width: photo?.width,
    image_height: photo?.height,
    image_bytes: photo?.bytes,
  })
  if (!error) return null
  if (error.message.includes('too_many_notes')) return '너무 빨리 보냈어요. 잠시만 쉬었다 보내 주세요.'
  if (error.message.includes('friends_only')) return '친구 사이에서만 채팅할 수 있어요.'
  if (error.message.includes('blocked')) return '지금은 이 사람에게 보낼 수 없어요.'
  if (error.message.includes('note_intro_limit')) return '쪽지는 상대가 수락한 뒤에 더 보낼 수 있어요.'
  return '메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.'
}

/** 친구 채팅방의 새 메시지를 실시간으로 받는다. 반환값은 구독 해제. */
export function subscribeFriendChat(threadId: string, meId: string, onMessage: (m: NoteMessage) => void): () => void {
  if (!supabase) return () => {}
  const client = supabase
  const channel = client
    .channel(`dd-friend-chat-${threadId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'note_messages', filter: `thread_id=eq.${threadId}` },
      (payload) => {
        const row = payload.new as { id: string; thread_id: string; sender_id: string; body: string; created_at: string; image_path: string | null }
        if (row.thread_id !== threadId) return
        const base: NoteMessage = { id: row.id, body: row.body, createdAt: row.created_at, mine: row.sender_id === meId }
        if (row.image_path) {
          void signedPhotoUrl(row.image_path).then((url) => onMessage({ ...base, image: url }))
          return
        }
        onMessage(base)
      },
    )
    .subscribe()
  return () => {
    void client.removeChannel(channel)
  }
}
