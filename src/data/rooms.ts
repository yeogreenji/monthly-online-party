import type { ChatMessage, Participant, RoomSeed } from '../types'

const msg = (
  id: string,
  author: ChatMessage['author'],
  name: string,
  text: string,
  at: string,
  extra: Partial<ChatMessage> = {},
): ChatMessage => ({ id, author, name, text, at, ...extra })

export const ROOMS: RoomSeed[] = [
  {
    id: 'wine',
    name: '오늘 밤 9시 혼술 타임',
    en: 'The 9PM Table',
    tagline: '집에서 마시는 한 잔을, 같은 시간에 듭니다',
    hours: '매일 21:00 – 24:00',
    host: '딩동지기',
    capacity: 20,
    live: 0,
    rules: [
      '과음은 이 딩동에서 가장 큰 매너 위반입니다. 잔은 천천히.',
      '미성년자는 논알콜 음료로 함께합니다. 술을 권하지 않습니다.',
      '집 구조·얼굴·문패가 담긴 사진은 올리지 않습니다.',
      '취한 사람에게 연락처를 묻지 않습니다. 쪽지는 서로 수락해야 열립니다.',
    ],
    messages: [
      msg('w1', 'host', '딩동지기', '21시가 됐어요. 잔부터 들어주세요. 오늘은 논알콜도 같은 잔에 따릅니다.', '21:00'),
      msg('w2', 'guest', '밤의 서재', '논알콜 스파클링으로 왔습니다. 내일 출근이라 오늘은 여기까지가 적당해요.', '21:01', { avatar: 'owl' }),
      msg('w3', 'guest', '골드문', '저는 냉장고에 있던 화이트 한 잔. 안주는 구운 치즈입니다.', '21:02', { avatar: 'fox' }),
      msg('w4', 'guest', '느린심장', '이 시간만 기다렸어요. 오늘 회의가 네 개였거든요.', '21:03', { avatar: 'rabbit' }),
      msg('w5', 'guest', '12월의고양이', '고양이가 무릎에 올라와서 일어날 수가 없습니다. 이대로 마실게요.', '21:04', { avatar: 'cat' }),
      msg('w6', 'host', '딩동지기', '오늘의 질문: 오늘 하루, 스스로에게 칭찬하고 싶은 일 하나.', '21:06'),
      msg('w7', 'guest', '샴페인문제', '12월 야근을 세 번 줄였어요. 그게 제일 큰 성과입니다.', '21:07', { avatar: 'penguin' }),
      msg('w8', 'guest', '책갈피', '올해 처음으로 혼자 여행 다녀온 것.', '21:08', { avatar: 'squirrel' }),
      msg('w9', 'guest', '느린심장', '짠! 소리 들리나요? ㅋㅋ', '21:09', { avatar: 'rabbit' }),
    ],
  },
  {
    id: 'book',
    name: '심야 독서 토론방',
    en: 'Midnight Reading',
    tagline: '이번 주 책 한 권, 오늘의 문장 하나',
    hours: '매일 21:00 – 24:00',
    host: '밤의 서재',
    capacity: 20,
    live: 0,
    rules: [
      '다 읽지 않아도 됩니다. 스포일러는 책 페이지로 표시해 주세요.',
      '문장을 그대로 옮기기보다, 내 말로 바꿔 적어봅니다.',
      '책을 싫어하는 사람의 취향도 존중합니다.',
    ],
    messages: [
      msg('b1', 'host', '밤의 서재', '이번 주 함께 읽는 책은 한강의 『작별하지 않는다』입니다. 다 읽지 않아도 괜찮아요. 오늘 마음에 남은 문장 하나면 충분합니다.', '21:00'),
      msg('b2', 'guest', '책갈피', '3장까지 읽었어요. 문장에서 계속 멈추게 됩니다.', '21:02', { avatar: 'squirrel' }),
      msg('b3', 'guest', '다정한부엉이', '저는 밑줄을 제 말로 옮겨 적는 편이에요. \'돌아온 사람은 설명하지 않는다\' 같은 식으로요.', '21:03', { avatar: 'owl' }),
      msg('b4', 'guest', '민트초코', '절반쯤 덮었는데, 인물들 사이의 침묵이 제일 무섭고 제일 다정해요.', '21:05', { avatar: 'bear' }),
      msg('b5', 'host', '밤의 서재', '오늘의 질문은 \'최근에 오래 바라본 것\'입니다. 책이 아니어도 좋아요.', '21:07'),
      msg('b6', 'guest', '골드문', '저는 창밖 가로등. 요즘 30분씩 봅니다.', '21:08', { avatar: 'fox' }),
      msg('b7', 'guest', '포근한이불', '저는 어머니가 보내준 사진 한 장을 오래 봤어요.', '21:09', { avatar: 'rabbit' }),
    ],
  },
  {
    id: 'cinema',
    name: '같이 보는 드라마 · 영화관',
    en: 'Same Scene, Same Night',
    tagline: '각자 집에서, 같은 장면에 도착합니다',
    hours: '매일 21:00 – 24:00',
    host: '골드문',
    capacity: 20,
    live: 0,
    rules: [
      '결말·반전 이야기는 스포일러 토글을 켠 뒤에 합니다.',
      '재생 시각은 각자 다를 수 있어요. 장면 번호를 함께 적어주세요.',
      '특정 배우·제작진에 대한 인신공격은 신고 대상입니다.',
    ],
    messages: [
      msg('c1', 'host', '골드문', '21:00 동시 재생 준비됐습니다. 스포일러 토글은 기본이 꺼짐이에요.', '21:00'),
      msg('c2', 'guest', '느린심장', '42분쯤 왔습니다. 아직 결말 얘기 없죠?', '21:01', { avatar: 'rabbit' }),
      msg('c3', 'guest', '샴페인문제', '저는 이 영화에서 대사보다 표정이 좋아요.', '21:03', { avatar: 'penguin' }),
      msg('c4', 'host', '골드문', '결말 이야기가 나오면 꼭 스포일러 토글을 켜주세요. 그게 유일한 규칙입니다.', '21:04'),
      msg('c5', 'guest', '샴페인문제', '마지막 장면에서 다들 우는 이유를 이제 알 것 같아요.', '21:06', { avatar: 'penguin', spoiler: true }),
      msg('c6', 'guest', '12월의고양이', '팝콘 소리가 제일 큰 배경음이네요 ㅋㅋ', '21:07', { avatar: 'cat' }),
      msg('c7', 'host', '골드문', '휴식 시간입니다. 지금까지 본 장면 중 하나만 골라 한 줄로 남겨주세요.', '21:20'),
    ],
  },
  {
    id: 'music',
    name: '댄스 · 플레이리스트 라운지',
    en: 'The Listening Lounge',
    tagline: '오늘 밤의 배경음은 우리가 고릅니다',
    hours: '매일 21:00 – 24:00',
    host: '재즈바11',
    capacity: 20,
    live: 0,
    rules: [
      '신청곡은 한 사람에 한 곡. 중복은 합쳐서 셉니다.',
      '스피커 볼륨은 이웃을 생각해 한 단계 낮게.',
      '춤은 각자의 거실에서. 영상은 올리지 않아도 됩니다.',
    ],
    messages: [
      msg('m1', 'host', '재즈바11', '라운지 오픈. 오늘은 세 가지 무드로 갑니다. 재생 버튼을 누르면 시작해요.', '21:00'),
      msg('m2', 'guest', '윈터송', '신청곡은 아래 투표에 올려주세요. 중복은 합쳐서 셉니다.', '21:01', { avatar: 'penguin' }),
      msg('m3', 'guest', '윈터송', '오늘은 어떤 무드로 갈까요? 저는 재즈 쪽입니다.', '21:02', { avatar: 'penguin' }),
      msg('m4', 'guest', '민트초코', '저는 비 오는 날 같은 로우파이가 좋아요. 오늘 창밖은 조용해요.', '21:04', { avatar: 'bear' }),
      msg('m5', 'host', '재즈바11', '지금 흐르는 곡은 딩동 오리지널 세션 \'벽난로 앞\'입니다. 21시에 어울리는 낮은 볼륨.', '21:06'),
      msg('m6', 'guest', '포근한이불', '발끝으로 박자 밟고 있어요.', '21:08', { avatar: 'rabbit' }),
    ],
  },
]

export const PARTICIPANTS: Participant[] = [
  { id: 'p1', nickname: '밤의 서재', avatar: 'owl', ageBand: '30대', tags: ['독서', '논알콜', '재즈'], line: '오늘 읽은 문장 하나만 가져왔어요.', online: true },
  { id: 'p2', nickname: '골드문', avatar: 'fox', ageBand: '40대', tags: ['영화', '와인', '사진'], line: '영화는 엔딩 크레딧까지가 본편이에요.', online: true },
  { id: 'p3', nickname: '느린심장', avatar: 'rabbit', ageBand: '30대', tags: ['혼술', '산책', '플레이리스트'], line: '오늘은 천천히 마시는 날.', online: true },
  { id: 'p4', nickname: '12월의고양이', avatar: 'cat', ageBand: '20대', tags: ['반려묘', '홈파티', '베이킹'], line: '고양이 두 마리와 살아요.', online: true },
  { id: 'p5', nickname: '샴페인문제', avatar: 'penguin', ageBand: '30대', tags: ['샴페인', '전시', '여행'], line: '건배사는 짧게, 잔은 길게.', online: true },
  { id: 'p6', nickname: '책갈피', avatar: 'squirrel', ageBand: '20대', tags: ['독서', '문구', '카페'], line: '한 해에 50권이 목표예요.', online: true },
  { id: 'p7', nickname: '민트초코', avatar: 'bear', ageBand: '20대', tags: ['드라마', '로우파이', '디저트'], line: '민트초코는 취향이 아니라 신념입니다.', online: true },
  { id: 'p8', nickname: '포근한이불', avatar: 'rabbit', ageBand: '40대', tags: ['차', '뜨개', '산책'], line: '오늘은 집이 제일 좋은 곳.', online: false },
  { id: 'p9', nickname: '재즈바11', avatar: 'santacat', ageBand: '40대', tags: ['재즈', 'LP', '위스키'], line: '노래는 대화의 일부입니다.', online: true },
  { id: 'p10', nickname: '윈터송', avatar: 'penguin', ageBand: '30대', tags: ['캐럴', '피아노', '겨울'], line: '12월만 기다리며 살아요.', online: true },
  { id: 'p11', nickname: '다정한부엉이', avatar: 'owl', ageBand: '50대+', tags: ['고전', '정원', '클래식'], line: '조용한 대화를 좋아합니다.', online: false },
  { id: 'p12', nickname: '한잔할까', avatar: 'bear', ageBand: '비공개', tags: ['혼술', '야구', '치킨'], line: '오늘도 한 잔은 합니다.', online: true },
]

export interface SongRequest {
  id: string
  title: string
  artist: string
  votes: number
  mine?: boolean
}

export const SONG_POLL: Record<string, SongRequest[]> = {
  dec: [
    { id: 's1', title: 'Christmas Time Is Here', artist: 'Vince Guaraldi Trio', votes: 12 },
    { id: 's2', title: 'The Christmas Song', artist: 'Nat King Cole', votes: 9 },
    { id: 's3', title: 'Winter Wonderland', artist: 'Ella Fitzgerald', votes: 6 },
    { id: 's4', title: 'River', artist: 'Joni Mitchell', votes: 5 },
  ],
  jan: [
    { id: 's1', title: 'The Nearness of You', artist: 'Norah Jones', votes: 8 },
    { id: 's2', title: 'January Stars', artist: 'George Winston', votes: 7 },
    { id: 's3', title: 'Blue in Green', artist: 'Miles Davis', votes: 6 },
    { id: 's4', title: '새해', artist: '딩동 오리지널 세션', votes: 4 },
  ],
  feb: [
    { id: 's1', title: 'Moon River', artist: 'Audrey Hepburn', votes: 11 },
    { id: 's2', title: 'My Funny Valentine', artist: 'Chet Baker', votes: 10 },
    { id: 's3', title: 'La Valse d\'Amélie', artist: 'Yann Tiersen', votes: 7 },
    { id: 's4', title: '자정의 재즈', artist: '딩동 오리지널 세션', votes: 3 },
  ],
}
