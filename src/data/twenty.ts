/* 스무고개 데이터 — 예/아니오 질문과 정답 후보. 모두 딩동 자체 제작. */

export const QUESTIONS = [
  ['animal', '동물인가요?'],
  ['object', '물건인가요?'],
  ['person', '사람인가요?'],
  ['pet', '반려동물로 키우기도 하나요?'],
  ['fur', '털이 있나요?'],
  ['wings', '날개가 있나요?'],
  ['wheels', '바퀴가 있나요?'],
  ['outdoors', '보통 야외에서 쓰나요?'],
  ['handheld', '한 손에 들고 쓸 수 있나요?'],
  ['electric', '전기가 필요한가요?'],
  ['sound', '소리를 내는 데 쓰나요?'],
  ['paper', '주로 종이로 만드나요?'],
  ['flies', '하늘을 날 수 있나요?'],
  ['rain', '비 오는 날에 쓰나요?'],
  ['light', '빛을 내나요?'],
  ['read', '읽을 수 있나요?'],
  ['write', '글씨를 쓰는 데 쓰나요?'],
  ['water', '물에서 사나요?'],
  ['tall', '목이 길어요?'],
  ['celebration', '연말 이야기에서 만날 수 있나요?'],
] as const

export type Trait = typeof QUESTIONS[number][0]

export interface Answer { name: string; traits: Trait[]; hint: string }

export const ANSWERS: Answer[] = [
  { name: '우산', traits: ['outdoors', 'handheld', 'rain'], hint: '비 오는 날의 단골' },
  { name: '고양이', traits: ['animal', 'pet', 'fur'], hint: '상자를 좋아하는 친구' },
  { name: '참새', traits: ['animal', 'wings', 'flies'], hint: '아침을 시끄럽게 여는 새' },
  { name: '책', traits: ['paper', 'handheld', 'read'], hint: '서랍에 쌓이는 지혜' },
  { name: '손전등', traits: ['electric', 'handheld', 'light'], hint: '정전 때의 영웅' },
  { name: '스피커', traits: ['electric', 'sound'], hint: '파티를 시작하는 물건' },
  { name: '자전거', traits: ['wheels', 'outdoors'], hint: '두 바퀴로 가는 산책' },
  { name: '호루라기', traits: ['handheld', 'sound'], hint: '입에 물면 시끄러움' },
  { name: '연필', traits: ['handheld', 'write'], hint: '지우개와 한 몸' },
  { name: '돌고래', traits: ['animal', 'water'], hint: '웃는 얼굴의 수영선수' },
  { name: '기린', traits: ['animal', 'fur', 'tall'], hint: '창문 2층으로 인사' },
  { name: '산타클로스', traits: ['person', 'celebration'], hint: '12월 24일의 대기업' },
  { name: '강아지', traits: ['animal', 'pet', 'fur'], hint: '현관에서 제일 먼저 반김' },
  { name: '펭귄', traits: ['animal', 'wings', 'water'], hint: '정장 입고 걷는 친구' },
  { name: '자동차', traits: ['wheels', 'outdoors'], hint: '주차가 제일 어려움' },
  { name: '공책', traits: ['paper', 'handheld', 'write'], hint: '새 학기마다 사는 것' },
  { name: '크리스마스트리', traits: ['object', 'celebration', 'light'], hint: '층층이 초록' },
  { name: '커피', traits: ['object', 'handheld', 'outdoors'], hint: '아침을 여는 쓴맛' },
]

export function answersYes(answer: Answer, trait: Trait): boolean {
  if (trait === 'object') return !answer.traits.includes('animal') && !answer.traits.includes('person')
  return answer.traits.includes(trait)
}

export const QUESTION_ALIASES: [RegExp, Trait][] = [
  [/^(사람|인간)(이)?(입니까|인가요|이에요|이야|인가|일까요)?$/, 'person'],
  [/^(동물|짐승)(이)?(입니까|인가요|이에요|이야|인가|일까요)?$/, 'animal'],
  [/^(반려동물|애완동물)(인가요|입니까|이에요|이야)?$/, 'pet'],
  [/^털(이)?(있나요|있습니까|있어요|있어)$/, 'fur'],
  [/^날개(가)?(있나요|있습니까|있어요|있어)$/, 'wings'],
  [/^(물건|사물)(인가요|입니까|이에요|이야)$/, 'object'],
  [/^(비올때|비오는날|비가올때)(쓰나요|쓰는건가요|써요|사용하나요)$/, 'rain'],
  [/^(하늘을)?(날수있나요|날아요|날아다니나요)$/, 'flies'],
  [/^(전기|배터리)(가|를)?(필요한가요|필요해요|쓰나요|사용하나요)$/, 'electric'],
  [/^(물속|물)(에서)?(사나요|살아요|살고있나요)$/, 'water'],
  [/^(빛|불)(을|이)?(내나요|나나요|켜지나요)$/, 'light'],
  [/^(한손에)?(들수있나요|들고다닐수있나요)$/, 'handheld'],
  [/^바퀴(가)?(있나요|있습니까|있어요|있어)$/, 'wheels'],
]

export const TWENTY_LIMIT = 20
