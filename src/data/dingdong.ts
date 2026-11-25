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

export const SPACES: Space[] = [
  { id: 'season', name: '시즌 파티하우스', subtitle: '반짝이는 트리 아래 크리스마스 파티', icon: '🎄', wall: '#d44962', door: '#dc183d', topics: ['크리스마스 티파티', '비밀 산타', '트리 꾸미기', '캐럴 이야기'] },
  { id: 'jazz', name: '혼술 라운지 및 재즈바', subtitle: '조용한 재즈와 취향에 맞는 한 잔', icon: '🎷', wall: '#c9b9ab', door: '#493d54', topics: ['논알콜 한 잔', '재즈 감상', '오늘 하루'], legacy: ['wine', 'music'] },
  { id: 'cafe', name: '낮과 밤의 카페', subtitle: '커피, 차, 디저트 그리고 수다', icon: '☕', wall: '#ead9c1', door: '#966244', topics: ['오늘의 차', '디저트 추천', '카페 발견', '홈카페 레시피', '창가 독서회', '저녁 차 한 잔'] },
  { id: 'travel', name: '여행자 클럽', subtitle: '지도 위에 펼치는 다음 여행', icon: '🧳', wall: '#cbdce0', door: '#467889', topics: ['혼자 여행', '여행지 추천', '여행 사진', '주말 여행 계획', '기차 여행', '여행 엽서'] },
  { id: 'women', name: '여자들의 수다방', subtitle: '일상과 취향을 나누는 공간', icon: '🌷', wall: '#f0d3dd', door: '#a55d78', topics: ['일상 수다', '요즘 관심사'] },
  { id: 'men', name: '남자들의 아지트', subtitle: '편하게 앉아 나누는 이야기', icon: '🪑', wall: '#d0dbd3', door: '#526d65', topics: ['일상 수다', '취미 이야기'] },
  { id: 'single', name: '성인 싱글 살롱', subtitle: '서로의 경계를 존중하는 만남', icon: '💌', wall: '#e6ccd1', door: '#7c445a', topics: ['취향 소개', '주말 이야기'] },
  { id: 'games', name: '게임 라운지', subtitle: '가볍게 즐기는 놀이와 퀴즈', icon: '🎲', wall: '#ded7f0', door: '#78609a', topics: ['끝말잇기', '스무고개', 'OX 퀴즈', '보드게임 이야기', '그림 맞히기 모임'] },
  { id: 'hobby', name: '취미 클럽', subtitle: '책, 그림, 반려동물, 만들기', icon: '📚', wall: '#f0e3b9', door: '#8f7940', topics: ['독서 토론', '반려동물 이야기', '그림과 손작업', '뜨개질 모임', '책 추천', '사진 이야기'], legacy: ['book'] },
  { id: 'cinema', name: '영화·드라마관', subtitle: '좋아하는 장면과 작품 이야기', icon: '🎬', wall: '#d4cbdc', door: '#63536d', topics: ['오늘 본 영화', '드라마 이야기', '주말 영화제', '추억의 명장면'], legacy: ['cinema'] },
  { id: 'home', name: '나만의 미니룸', subtitle: '나를 닮은 작은 집과 미니홈피', icon: '🏡', wall: '#e6d7c8', door: '#b17c62', topics: [] },
  { id: 'plaza', name: '중앙 축제광장', subtitle: '계절마다 만나는 작은 축제', icon: '🎠', wall: '#d7e4ca', door: '#668453', topics: ['처음 왔어요', '오늘의 수다', '축제 이야기'] },
]

export const MONTHLY_IDEAS = [
  '새해 소원 · 복주머니', '밸런타인 · 설날과 정월대보름(해당 시기)', '화이트데이 · 봄맞이', '벚꽃 · 식목일 · 피크닉',
  '가정의 달 · 레트로 어른이날', '재즈 · 단오(해당 시기)', '여름휴가 · 영화제', '세계 여행 · 야시장',
  '가을 달빛 · 추석(해당 시기)', '한글날 · 핼러윈 · 가면무도회', '북페어 · 빼빼로데이 · 수험생 응원', '크리스마스 · 비밀 산타 · 송년회',
]

export const DINGDONG_STORAGE = ['dd.favorites.v1','dd.topics.v1','dd.messages.v1','dd.history.v1','dd.home.v1','dd.avatar.look.v1','dd.places.v1','dd.outfits.v1','dd.savedTopics.v1','dd.memories.v1'] as const

// 2027년 월력요항. 음력 명절은 해마다 날짜가 달라지므로 연도를 포함한다.
// https://www.kasa.go.kr/prog/bbsArticle/BBSMSTR_000000000018/view.do?nttId=B000000003234Li6nD2
export const LUNAR_FESTIVALS: Readonly<Record<string, { name: string; prompt: string; space: string }>> = {
  '2027-02-07': { name: '설날', prompt: '올해 꼭 이루고 싶은 소원 한 가지를 적어 보세요.', space: 'plaza' },
  '2027-02-21': { name: '정월대보름', prompt: '보름달에게 전하고 싶은 한마디를 남겨 보세요.', space: 'plaza' },
  '2027-06-09': { name: '단오', prompt: '초여름에 즐기고 싶은 놀이를 하나 골라 보세요.', space: 'games' },
  '2027-09-15': { name: '추석', prompt: '가을이 오면 떠오르는 맛이나 풍경을 기록해 보세요.', space: 'hobby' },
}
