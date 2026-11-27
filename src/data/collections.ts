// 정본(content/dingdong/content-master-v1.json)의 옷장 컬렉션·미니룸 테마·감정/행동을
// 화면에서 쓸 수 있는 형태로 연결한다. 이름은 정본 그대로이고, 실제 3D/옷장 값으로 옮기는
// 매핑만 이 파일이 갖는다(새 3D 모델 없이 기존 옷장 필드로 표현).
import type { Look } from './avatarLook'
import type { HomeDecor } from './homeDecor'

export type CollectionItem = { label: string; patch: Partial<Look> }
export type WardrobeCollection = { name: string; items: CollectionItem[]; free: true }

/** 정본 8개 의상 컬렉션. 각 아이템은 기존 옷장 필드(style·hat·accessory·shoes·fabric·coat)로 적용된다. */
export const WARDROBE_COLLECTIONS: WardrobeCollection[] = [
  { name: '카페', free: true, items: [
    { label: '앞치마', patch: { style: 'overalls', coat: '#d8c7a8', fabric: 'plain' } },
    { label: '베레모', patch: { hat: 'beret' } },
    { label: '니트', patch: { style: 'knit', fabric: 'check' } },
    { label: '커피잔', patch: { accessory: 'tote' } },
  ] },
  { name: '덕질', free: true, items: [
    { label: '후드티', patch: { style: 'hoodie', fabric: 'stars' } },
    { label: '헤드폰', patch: { accessory: 'headphones' } },
    { label: '자체 응원봉', patch: { accessory: 'necklace', fabric: 'stars' } },
    { label: '팬덤 컬러', patch: { coat: '#8562d9' } },
  ] },
  { name: '여행', free: true, items: [
    { label: '여행 가방', patch: { accessory: 'backpack' } },
    { label: '카메라', patch: { accessory: 'camera' } },
    { label: '탐험가 모자', patch: { hat: 'bucket' } },
  ] },
  { name: '레트로', free: true, items: [
    { label: '멜빵', patch: { style: 'overalls', fabric: 'gingham' } },
    { label: '복고풍 안경', patch: { accessory: 'glasses' } },
    { label: '운동화', patch: { shoes: '#e2cfad' } },
  ] },
  { name: '영화제', free: true, items: [
    { label: '턱시도', patch: { style: 'tux', coat: '#171928' } },
    { label: '드레스', patch: { style: 'dress', fabric: 'plain' } },
    { label: '리본', patch: { accessory: 'bowtie' } },
    { label: '팝콘', patch: { accessory: 'tote', coat: '#f5ca73' } },
  ] },
  { name: '봄 소풍', free: true, items: [
    { label: '꽃무늬 의상', patch: { style: 'dress', fabric: 'flower' } },
    { label: '밀짚모자', patch: { hat: 'sunhat' } },
    { label: '꽃다발', patch: { accessory: 'flowerbag' } },
  ] },
  { name: '여름휴가', free: true, items: [
    { label: '하와이안 셔츠', patch: { style: 'blouse', fabric: 'flower', coat: '#ff6819' } },
    { label: '샌들', patch: { shoes: '#ef8fb5' } },
    { label: '선글라스', patch: { accessory: 'sunnies' } },
  ] },
  { name: '겨울', free: true, items: [
    { label: '산타 모자', patch: { hat: 'beanie', coat: '#c91636' } },
    { label: '루돌프 머리띠', patch: { hat: 'hairband' } },
    { label: '패딩', patch: { style: 'puffer', fabric: 'plain' } },
  ] },
]

/** 컬렉션 하나를 입으면 그 컬렉션의 모든 아이템이 차례로 적용된 모습이 된다. */
export function collectionLook(base: Look, collection: WardrobeCollection): Look {
  return collection.items.reduce<Look>((acc, item) => ({ ...acc, ...item.patch }), base)
}

export type MiniRoomTheme = { name: string; wallpaper: string; floor: string; rug: string; furnitureColor: string; furniture: string; note: string }
/** 정본 8개 미니룸 테마. 기존 집꾸미기 값(벽지·바닥·러그·가구)으로 옮긴 프리셋이다. */
export const MINIROOM_THEMES: MiniRoomTheme[] = [
  { name: '카페형', wallpaper: '#f3dfc8', floor: '#c89570', rug: '#efb5cf', furnitureColor: '#bd754c', furniture: 'table', note: '우드 카운터와 티 테이블' },
  { name: '북카페형', wallpaper: '#e8dcc6', floor: '#b69b86', rug: '#c5d9a6', furnitureColor: '#8e6a4f', furniture: '📚', note: '책장과 긴 테이블' },
  { name: '영화관형', wallpaper: '#3d3550', floor: '#2b2a3a', rug: '#bd465b', furnitureColor: '#374f79', furniture: 'loveseat', note: '어두운 벽과 붉은 좌석' },
  { name: '반려동물형', wallpaper: '#d7e4ca', floor: '#f3e1ca', rug: '#f5ca73', furnitureColor: '#4d9e93', furniture: 'pouf', note: '낮은 쿠션과 장난감' },
  { name: '여행자형', wallpaper: '#cddbe9', floor: '#a4b9ce', rug: '#f3b47c', furnitureColor: '#6d93cd', furniture: 'desk', note: '지도와 캐리어' },
  { name: '덕질형', wallpaper: '#d8c7f0', floor: '#d3c6e5', rug: '#bca1e4', furnitureColor: '#8562d9', furniture: 'shelf', note: '포스터와 응원봉 진열' },
  { name: '레트로형', wallpaper: '#ffe3a8', floor: '#c89570', rug: '#c96755', furnitureColor: '#c96755', furniture: 'cabinet', note: '체크 무늬와 오래된 라디오' },
  { name: '크리스마스형', wallpaper: '#c1e6df', floor: '#b2c5b5', rug: '#bd465b', furnitureColor: '#008756', furniture: 'daybed', note: '트리와 별 조명' },
]

export function applyTheme(home: HomeDecor, theme: MiniRoomTheme): HomeDecor {
  return {
    ...home,
    wallpaper: theme.wallpaper,
    floor: theme.floor,
    rug: theme.rug,
    furnitureColor: theme.furnitureColor,
    theme: theme.name,
  }
}

export type Emote = { label: string; emoji: string; note?: string }
/** 정본 16개 감정/행동. 누르면 3D 캐릭터 머리 위에 표정 말풍선이 뜨고 같은 공간의 친구에게도 보인다. */
export const EMOTES: Emote[] = [
  { label: '인사', emoji: '👋' },
  { label: '하트', emoji: '💗' },
  { label: '박수', emoji: '👏' },
  { label: '웃기', emoji: '😄' },
  { label: '울기', emoji: '😢' },
  { label: '부끄럼', emoji: '😳' },
  { label: '졸기', emoji: '😴' },
  { label: '춤추기', emoji: '💃' },
  { label: '감사', emoji: '🙏' },
  { label: '축하', emoji: '🎉' },
  { label: '차 마시기', emoji: '☕' },
  { label: '책 읽기', emoji: '📖' },
  { label: '선물 건네기', emoji: '🎁' },
  { label: '꽃 건네기', emoji: '🌷' },
  { label: '사진 찍기', emoji: '📸' },
  { label: '소파에 앉기', emoji: '🛋️' },
]

/** 우편함·방명록·쪽지 화면에서 쓰는 날짜 표기 */
export function shortTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}
