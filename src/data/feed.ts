import type { FeedPost } from '../types'

/** 오픈 전 프리뷰용 예시 피드. 실제 참여자가 올린 글이 아니라 살롱 스태프가 준비한 예시입니다. */
export const SEED_FEED: FeedPost[] = [
  {
    id: 'f1',
    name: '밤의 서재',
    avatar: 'owl',
    ageBand: '30대',
    image: '/img/feed-wine.jpg',
    caption: '12월의 첫 잔. 논알콜 스파클링에 무화과 치즈. 내일 출근이지만 오늘은 여기까지가 적당해요.',
    frame: 'polaroid',
    room: 'wine',
    at: '2026-12-24T21:12:00+09:00',
    likes: 34,
    liked: false,
    comments: [
      { id: 'fc1', name: '느린심장', avatar: 'rabbit', text: '잔 색이 너무 예뻐요. 무슨 잔인가요?', at: '21:14' },
      { id: 'fc2', name: '밤의 서재', avatar: 'owl', text: '그냥 집에 있던 샴페인 잔이에요. 논알콜도 잔을 바꾸면 달라지더라고요.', at: '21:16' },
    ],
  },
  {
    id: 'f2',
    name: '책갈피',
    avatar: 'squirrel',
    ageBand: '20대',
    image: '/img/feed-book.jpg',
    caption: '30쪽 읽고 잠들기 직전. 오늘은 여기까지. 내일 아침에 이어 읽을 장면을 접어뒀어요.',
    frame: 'magazine',
    room: 'book',
    at: '2026-12-24T22:03:00+09:00',
    likes: 21,
    liked: false,
    comments: [
      { id: 'fc3', name: '민트초코', avatar: 'bear', text: '저도 그 책 오늘 시작했어요. 같이 느리게 가요.', at: '22:05' },
    ],
  },
  {
    id: 'f3',
    name: '골드문',
    avatar: 'fox',
    ageBand: '40대',
    image: '/img/feed-movie.jpg',
    caption: '혼자 보는 영화관. 팝콘은 소금만. 불 끄고 보면 집이 제일 좋은 극장이 됩니다.',
    frame: 'polaroid',
    room: 'cinema',
    at: '2026-12-24T22:41:00+09:00',
    likes: 47,
    liked: false,
    comments: [
      { id: 'fc4', name: '샴페인문제', avatar: 'penguin', text: '이 조명 완벽해요. 무드등인가요?', at: '22:44' },
      { id: 'fc5', name: '골드문', avatar: 'fox', text: '촛불 두 개입니다. 전기보다 따뜻해서요.', at: '22:46' },
    ],
  },
  {
    id: 'f4',
    name: '재즈바11',
    avatar: 'santacat',
    ageBand: '40대',
    image: '/img/feed-music.jpg',
    caption: '재즈 틀어두고 책상 정리. 이게 12월이지. 오늘의 신청곡은 Nat King Cole로 갑니다.',
    frame: 'postcard',
    room: 'music',
    at: '2026-12-24T23:05:00+09:00',
    likes: 29,
    liked: false,
    comments: [
      { id: 'fc6', name: '윈터송', avatar: 'penguin', text: 'LP 판 색까지 크리스마스네요.', at: '23:07' },
    ],
  },
]

export const FRAME_LABEL: Record<FeedPost['frame'], string> = {
  polaroid: '폴라로이드',
  magazine: '매거진',
  postcard: '살롱 엽서',
}
