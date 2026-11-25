import type { RoomId } from '../types'

export interface Space {
  id: string
  name: string
  subtitle: string
  icon: string
  wall: string
  door: string
  topics: string[]
  legacy?: RoomId[]
}

export const SEASON_THEMES = [
  {
    "month": 1,
    "title": "새해 편지 살롱",
    "description": "새해 소원과 따뜻한 첫 인사",
    "topics": [
      "새해 소원",
      "복주머니 이야기",
      "새해 첫 모임"
    ]
  },
  {
    "month": 2,
    "title": "달콤한 초대장",
    "description": "달콤한 디저트와 마음을 나누는 시간",
    "topics": [
      "초콜릿 이야기",
      "우정 편지",
      "디저트 파티"
    ]
  },
  {
    "month": 3,
    "title": "봄맞이 티파티",
    "description": "새로운 계절과 친구를 맞이하는 시간",
    "topics": [
      "봄맞이",
      "화이트데이 이야기",
      "새 친구"
    ]
  },
  {
    "month": 4,
    "title": "벚꽃 피크닉",
    "description": "꽃이 피는 계절의 작은 피크닉",
    "topics": [
      "벚꽃 사진",
      "봄 산책",
      "식물 이야기"
    ]
  },
  {
    "month": 5,
    "title": "어른이날 레트로 파티",
    "description": "어린 시절의 추억과 감사 인사",
    "topics": [
      "추억의 놀이",
      "감사 편지",
      "레트로 수다"
    ]
  },
  {
    "month": 6,
    "title": "초여름 재즈 축제",
    "description": "음악이 흐르는 초여름 밤",
    "topics": [
      "재즈 감상",
      "초여름 음악",
      "음악 친구"
    ]
  },
  {
    "month": 7,
    "title": "여름 휴가 파티",
    "description": "시원한 휴가와 여름 영화",
    "topics": [
      "여름휴가",
      "아이스크림",
      "여름 영화제"
    ]
  },
  {
    "month": 8,
    "title": "세계 여행 야시장",
    "description": "여행과 먹거리 이야기가 모이는 밤",
    "topics": [
      "세계 여행",
      "야시장 이야기",
      "여행 사진"
    ]
  },
  {
    "month": 9,
    "title": "가을 달빛 살롱",
    "description": "달빛과 가을 풍경을 나누는 모임",
    "topics": [
      "가을 풍경",
      "달빛 이야기",
      "가을 독서"
    ]
  },
  {
    "month": 10,
    "title": "가면무도회",
    "description": "가을 밤의 가면과 특별한 이야기",
    "topics": [
      "가면무도회",
      "핼러윈 이야기",
      "가을 취향"
    ]
  },
  {
    "month": 11,
    "title": "가을 북페어",
    "description": "책장 사이에서 취향을 발견하는 계절",
    "topics": [
      "가을 독서",
      "책 추천",
      "수험생 응원"
    ]
  },
  {
    "month": 12,
    "title": "크리스마스 파티하우스",
    "description": "트리와 벽난로 아래 만나는 연말 파티",
    "topics": [
      "크리스마스 티파티",
      "비밀 산타",
      "트리 꾸미기",
      "캐럴 이야기",
      "송년회"
    ]
  }
]
export function getSeasonTheme(date=new Date()){
  const month=Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',month:'numeric'}).format(date))
  return SEASON_THEMES[month-1] ?? SEASON_THEMES[0]
}
// Monthly decorative theme; not an assertion that a dated live event is currently operating.
export const CURRENT_SEASON=getSeasonTheme()
export function defaultTopicId(spaceId:string,index:number){
  return spaceId==='season'&&CURRENT_SEASON.month!==12 ? 'season-'+CURRENT_SEASON.month+'-'+index : spaceId+'-'+index
}
export const SPACES: Space[] = [
  { id: 'season', name: '시즌 파티하우스', subtitle: CURRENT_SEASON.description, icon: '🎉', wall: '#e8d3bb', door: '#8b353c', topics: CURRENT_SEASON.topics },
  { id: 'jazz', name: '혼술 라운지 및 재즈바', subtitle: '조용한 재즈와 취향에 맞는 한 잔', icon: '🎷', wall: '#c9b9ab', door: '#493d54', topics: ['논알콜 한 잔', '재즈 감상', '오늘 하루'], legacy: ['wine', 'music'] },
  { id: 'cafe', name: '낮과 밤의 카페', subtitle: '커피, 차, 디저트 그리고 수다', icon: '☕', wall: '#ead9c1', door: '#966244', topics: ['오늘의 차', '디저트 추천', '카페 발견'] },
  { id: 'travel', name: '여행자 클럽', subtitle: '지도 위에 펼치는 다음 여행', icon: '🧳', wall: '#cbdce0', door: '#467889', topics: ['혼자 여행', '여행지 추천', '여행 사진'] },
  { id: 'women', name: '여자들의 수다방', subtitle: '일상과 취향을 나누는 공간', icon: '🌷', wall: '#f0d3dd', door: '#a55d78', topics: ['일상 수다', '요즘 관심사'] },
  { id: 'men', name: '남자들의 아지트', subtitle: '편하게 앉아 나누는 이야기', icon: '🪑', wall: '#d0dbd3', door: '#526d65', topics: ['일상 수다', '취미 이야기'] },
  { id: 'single', name: '성인 싱글 살롱', subtitle: '서로의 경계를 존중하는 만남', icon: '💌', wall: '#e6ccd1', door: '#7c445a', topics: ['취향 소개', '주말 이야기'] },
  { id: 'games', name: '게임 라운지', subtitle: '가볍게 즐기는 놀이와 퀴즈', icon: '🎲', wall: '#ded7f0', door: '#78609a', topics: ['끝말잇기', '스무고개', 'OX 퀴즈'] },
  { id: 'hobby', name: '취미 클럽', subtitle: '책, 그림, 반려동물, 만들기', icon: '📚', wall: '#f0e3b9', door: '#8f7940', topics: ['독서 토론', '반려동물 이야기', '그림과 손작업'], legacy: ['book'] },
  { id: 'cinema', name: '영화·드라마관', subtitle: '좋아하는 장면과 작품 이야기', icon: '🎬', wall: '#d4cbdc', door: '#63536d', topics: ['오늘 본 영화', '드라마 이야기'], legacy: ['cinema'] },
  { id: 'home', name: '나만의 미니룸', subtitle: '나를 닮은 작은 집과 미니홈피', icon: '🏡', wall: '#e6d7c8', door: '#b17c62', topics: [] },
  { id: 'plaza', name: '중앙 축제광장', subtitle: '365일 열려 있는 만남과 안내의 중심', icon: '🎠', wall: '#d7e4ca', door: '#668453', topics: ['처음 왔어요', '오늘의 수다', '축제 이야기'] },
  {"id":"book","name":"책과 문장 서재","subtitle":"책 한 권으로 이어지는 독서 모임","icon":"📖","wall":"#d8d6b8","door":"#726e50","topics":["오늘 읽은 책","독서 토론","문장 나눔","책 추천"]},
  {"id":"pets","name":"반려동물 살롱","subtitle":"우리 집 동물 친구의 하루를 나누는 곳","icon":"🐾","wall":"#e4d7c4","door":"#8c7560","topics":["고양이 이야기","강아지 이야기","사진 자랑","반려생활 정보"]},
  {"id":"music","name":"음악 감상실","subtitle":"한 곡의 추억과 플레이리스트","icon":"🎵","wall":"#d1d4df","door":"#596779","topics":["8090 음악","오늘의 한 곡","플레이리스트","장르별 감상"]},
  {"id":"drama","name":"드라마 거실","subtitle":"좋아하는 드라마와 이야기 속 인물","icon":"📺","wall":"#e5d4d2","door":"#896b73","topics":["오늘 본 드라마","정주행 모임","명장면","스포일러 허용 토론"]},
  {"id":"craft","name":"작은 창작 공방","subtitle":"손으로 만드는 취향의 작업실","icon":"🧵","wall":"#dcd1c0","door":"#897451","topics":["그림과 손작업","뜨개와 자수","문구·다꾸","작품 사진"]},
  {"id":"kitchen","name":"맛있는 부엌","subtitle":"요리와 디저트, 함께 먹는 이야기","icon":"🍰","wall":"#ead8bc","door":"#b48a5d","topics":["오늘 뭐 먹지","홈베이킹","레시피 공유","맛집 이야기"]},
  {"id":"garden","name":"온실 정원","subtitle":"식물과 꽃을 좋아하는 친구들의 온실","icon":"🌿","wall":"#d3e0cc","door":"#6f886e","topics":["식물 이야기","꽃과 정원","산책 사진","계절 풍경"]},
  {"id":"photo","name":"추억 사진관","subtitle":"사진과 작은 일상을 남기는 공간","icon":"📷","wall":"#d5d0df","door":"#84738d","topics":["오늘의 사진","필름 카메라","추억 나누기","사진 산책"]}
]

export const MONTHLY_IDEAS = [
  '새해 소원 · 복주머니', '설날(해당 시기) · 밸런타인 · 정월대보름', '화이트데이 · 봄맞이', '벚꽃 · 식목일 · 피크닉',
  '가정의 달 · 레트로 어른이날', '재즈 · 단오(해당 시기)', '여름휴가 · 영화제', '세계 여행 · 야시장',
  '가을 달빛 · 추석(해당 시기)', '한글날 · 핼러윈 · 가면무도회', '북페어 · 빼빼로데이 · 수험생 응원', '크리스마스 · 비밀 산타 · 송년회',
]

export const DINGDONG_STORAGE = ['dd.favorites.v1','dd.topics.v1','dd.messages.v1','dd.history.v1','dd.home.v1'] as const
