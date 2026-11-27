/* 로렌 정본(content-master-v1.json)을 화면에서 읽는 어댑터.
   13개 공간의 활동 130개와 공간별 고유 메뉴 48개를 그대로 노출한다.
   데이터는 콘텐츠 정본이며, 이 파일은 문구·순서를 바꾸지 않는다. */
import MASTER from '../../content/dingdong/content-master-v1.json'

export type MenuAction =
  | 'party'
  | 'calendar'
  | 'photoWall'
  | 'activities'
  | 'create'
  | 'map'
  | 'bell'
  | 'wardrobe'
  | 'minihome'
  | 'mail'
  | 'games'
  | 'radio'
  | 'safety'
  | 'menuCard'
  | 'decor'

export interface SpaceMenu {
  label: string
  action: MenuAction
}

export interface SpaceContent {
  id: string
  name: string
  concept: string
  residents: string[]
  activities: string[]
  menu: SpaceMenu[]
}

/** 공간별 고유 메뉴판 → 실제 동작. 정본의 메뉴 이름은 그대로 두고 동작만 잇는다. */
const MENU_ACTIONS: Record<string, Record<string, MenuAction>> = {
  season: { '오늘의 초대장': 'party', '파티 일정': 'calendar', '포토존': 'photoWall', '파티 개설': 'create' },
  jazz: { '신청곡': 'radio', '오늘의 음료': 'menuCard', '라운지': 'activities', '음악 이야기': 'activities' },
  cafe: { '음료 메뉴': 'menuCard', '빈 테이블': 'activities', '오늘의 수다': 'activities', '추천 카페': 'activities' },
  travel: { '세계지도': 'map', '여행 엽서': 'photoWall', '여행 모임': 'activities', '추천 장소': 'activities' },
  women: { '오늘의 이야기': 'activities', '상시 수다방': 'activities', '모임 열기': 'create' },
  men: { '오늘의 이야기': 'activities', '상시 수다방': 'activities', '모임 열기': 'create' },
  single: { '취향 카드': 'menuCard', '대화 주제': 'activities', '모임': 'create', '안전 안내': 'safety' },
  games: { '게임 선택': 'games', '같이 할 사람': 'activities', '게임 파티': 'create' },
  hobby: { '취미별 코너': 'activities', '작품 자랑': 'photoWall', '취미 모임': 'create' },
  fandom: { '아티스트 찾기': 'create', '팬 모임': 'activities', '컴백 일정': 'calendar', '모임 만들기': 'create' },
  cinema: { '작품 검색': 'activities', '감상회': 'activities', '후기': 'photoWall', '추천 작품': 'activities' },
  home: { '집 꾸미기': 'decor', '옷장': 'wardrobe', '미니홈피': 'minihome', '우편함': 'mail' },
  plaza: { '오늘의 축제': 'party', '지도': 'map', '초인종': 'bell', '모임 안내': 'activities' },
}

interface MasterSpace {
  id: string
  name: string
  concept: string
  residents: string[]
  topics: string[]
  menu: string[]
}

const masterSpaces = (MASTER as { spaces: MasterSpace[] }).spaces

export const SPACE_CONTENT: Record<string, SpaceContent> = Object.fromEntries(
  masterSpaces.map((space) => [
    space.id,
    {
      id: space.id,
      name: space.name,
      concept: space.concept,
      residents: space.residents ?? [],
      activities: space.topics,
      menu: space.menu.map((label) => ({ label, action: MENU_ACTIONS[space.id]?.[label] ?? 'activities' })),
    },
  ]),
)

export const ACTIVITY_TOTAL = masterSpaces.reduce((sum, space) => sum + space.topics.length, 0)
export const MENU_TOTAL = masterSpaces.reduce((sum, space) => sum + space.menu.length, 0)

export function spaceContent(id: string): SpaceContent | undefined {
  return SPACE_CONTENT[id]
}

/** 정본 활동 이름 → 방을 열 때 보여 줄 한 줄 소개. 정본에 없는 문장은 만들지 않는다. */
export function activityBlurb(spaceId: string, title: string): string {
  const space = SPACE_CONTENT[spaceId]
  return space ? `${space.name} · ${title}` : title
}

/** 정본 덕질 존 개설 유형(9종). */
export const FANDOM_TYPES: string[] = (MASTER as { fandom?: { types?: string[] } }).fandom?.types ?? []
