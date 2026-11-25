export type AvatarKey =
  | 'cat'
  | 'bear'
  | 'fox'
  | 'rabbit'
  | 'santacat'
  | 'owl'
  | 'squirrel'
  | 'penguin'

export type AgeBand = '20대' | '30대' | '40대' | '50대+' | '비공개'

export interface Profile {
  nickname: string
  avatar: AvatarKey
  ageBand: AgeBand
  tags: string[]
  joinedAt: string
}

export type RoomId = 'wine' | 'book' | 'cinema' | 'music'

export interface Participant {
  id: string
  nickname: string
  avatar: AvatarKey
  ageBand: AgeBand
  tags: string[]
  line: string
  online: boolean
}

export interface ChatMessage {
  id: string
  author: 'me' | 'host' | 'guest'
  name: string
  avatar?: AvatarKey
  text: string
  at: string
  spoiler?: boolean
}

export interface RoomSeed {
  id: RoomId
  name: string
  en: string
  tagline: string
  hours: string
  host: string
  capacity: number
  live: number
  rules: string[]
  messages: ChatMessage[]
}

export interface PartyEvent {
  id: string
  month: number
  monthLabel: string
  en: string
  title: string
  subtitle: string
  dateISO: string
  dateLabel: string
  weekday: string
  timeLabel: string
  place: string
  dressCode: string
  description: string
  heroImg: string
  heroAlt: string
  accent: 'gold' | 'forest' | 'burgundy'
  program: { time: string; title: string; detail: string }[]
  menu: { name: string; detail: string; pairing: string }[]
  hosts: { name: string; role: string; line: string }[]
  sponsors: Sponsor[]
  book: { title: string; author: string; publisher: string; why: string }
  film: { title: string; year: string; runtime: string; why: string }
  playlist: { mood: string; title: string; detail: string }[]
  quote: string
}

export interface Sponsor {
  id: string
  brand: string
  category: string
  offer: string
  blurb: string
  tone: 'gold' | 'forest' | 'burgundy'
}

export interface FeedComment {
  id: string
  name: string
  avatar: AvatarKey
  text: string
  at: string
}

export type FeedFrame = 'polaroid' | 'magazine' | 'postcard'

export interface FeedPost {
  id: string
  name: string
  avatar: AvatarKey
  ageBand: AgeBand
  image: string
  caption: string
  frame: FeedFrame
  room: RoomId
  at: string
  likes: number
  liked: boolean
  mine?: boolean
  comments: FeedComment[]
}

export interface NoteMessage {
  id: string
  author: 'me' | 'peer'
  text: string
  at: string
}

export interface Peer {
  nickname: string
  avatar: AvatarKey
  ageBand: AgeBand
  tags: string[]
  context: string
}

export interface NoteRequest {
  id: string
  peer: Peer
  message: string
  at: string
  status: 'pending' | 'accepted' | 'declined'
}

export interface NoteThread {
  id: string
  peer: Peer
  messages: NoteMessage[]
}

export interface NotesState {
  incoming: NoteRequest[]
  outgoing: NoteRequest[]
  threads: NoteThread[]
}

export interface Coupon {
  code: string
  brand: string
  label: string
  issuedAt: string
}

export interface Inquiry {
  id: string
  company: string
  person: string
  email: string
  budget: string
  packages: string[]
  goal: string
  at: string
}

export interface ToastMessage {
  id: number
  text: string
  tone?: 'default' | 'success'
}
