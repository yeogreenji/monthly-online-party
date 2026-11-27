/* 로렌 정본 16주민 대화(phase4-5/02-resident-dialogue.json) 연결.
   - 주제 6개 × 질문·후속 대사, 공통 상황(첫 방문·재방문·종료·미지원) 대사를 그대로 쓴다.
   - 생성형 AI가 아니다. 서버·날짜·날씨를 확인하지 않은 사실은 말하지 않는다.
   - 기억 동의는 기본 해제이며, 켠 경우에만 주제를 이 기기에 저장한다. */
import DIALOGUE from '../../content/dingdong/phase4-5/02-resident-dialogue.json'

export type Turn = { speaker: 'me' | 'resident'; text: string }

export interface DialogueTopic {
  intent: string
  question: string
  follow_up: string
}

export interface DialogueResident {
  id: string
  name: string
  personality: string
  utterances: {
    greeting: string
    revisit: string
    farewell: string
    unknown: string
    topics: DialogueTopic[]
  }
}

const RESIDENTS_RAW = (DIALOGUE as { residents: DialogueResident[] }).residents
export const DIALOGUE_RESIDENTS: Record<string, DialogueResident> = Object.fromEntries(
  RESIDENTS_RAW.map((r) => [r.id, r]),
)

export type ReplyTone = 'greeting' | 'question' | 'follow' | 'unknown' | 'farewell' | 'safety'

export interface ReplyResult {
  text: string
  tone: ReplyTone
  intent?: string
}

/** 주제어 → 입력에서 찾을 단어. 정본의 intent 이름을 그대로 쓰고, 자연스러운 말만 더한다. */
const SYNONYMS: Record<string, string[]> = {
  '첫 방문': ['처음', '첫 방문', '신규'],
  친구: ['친구', '친해'],
  초인종: ['초인종', '벨', '딩동'],
  파티: ['파티', '모임', '축제'],
  길: ['길', '지도', '가게', '어디', '위치'],
  사진: ['사진', '포토', '찍'],
  크리스마스: ['크리스마스', '산타', '트리', '캐럴'],
  생일: ['생일', '축하'],
  계절: ['계절', '봄', '여름', '가을', '겨울'],
  선물: ['선물', '꽃다발'],
  초대: ['초대', '초대장'],
  소원: ['소원', '바람', '소망'],
  음료: ['음료', '커피', '차', '라떼', '코코아', '마시'],
  피곤: ['피곤', '힘들', '지쳐', '야근'],
  고양이: ['고양이', '냥', '집사'],
  디저트: ['디저트', '케이크', '쿠키', '빵'],
  책: ['책', '독서', '소설', '읽'],
  밤: ['밤', '새벽', '늦게'],
  음악: ['음악', '노래', '곡', '플레이리스트'],
  재즈: ['재즈', '피아노', '색소폰'],
  추억: ['추억', '옛날', '기억'],
  조용: ['조용', '말없이', '가만히'],
  입장: ['입장', '들어가', '잠금', '성인'],
  여행: ['여행', '떠나', '휴가'],
  혼자: ['혼자', '혼행', '1인'],
  기차: ['기차', '열차', 'ktx'],
  음식: ['음식', '먹', '맛집'],
  운전: ['운전', '드라이브'],
  일상: ['일상', '하루', '오늘'],
  직장: ['직장', '회사', '상사', '동료', '퇴근'],
  취향: ['취향', '좋아하', '덕질'],
  주말: ['주말', '토요일', '일요일'],
  관계: ['관계', '사이', '서먹'],
  칭찬: ['칭찬', '예쁘', '멋지', '잘했'],
  취미: ['취미', '배우', '시작'],
  게임: ['게임', '놀이', '한 판'],
  영화: ['영화', '드라마', '작품'],
  경계: ['경계', '선을', '불편', '거절'],
  연락처: ['연락처', '번호', '카톡', '연락'],
  편지: ['편지', '쪽지'],
  퀴즈: ['퀴즈', '문제', 'ox'],
  스무고개: ['스무고개', '맞혀'],
  끝말잇기: ['끝말잇기', '단어'],
  승리: ['이기', '승리', '이겼'],
  패배: ['패배', '졌', '지면'],
  독서: ['독서', '책'],
  반려동물: ['반려', '강아지', '고양이', '동물'],
  뜨개질: ['뜨개', '코바늘', '목도리'],
  그림: ['그림', '그리', '드로잉'],
  '새 취미': ['새 취미', '새로', '도전'],
  입덕: ['입덕', '빠져', '좋아하게'],
  컴백: ['컴백', '신곡', '앨범'],
  공연: ['공연', '콘서트', '무대'],
  굿즈: ['굿즈', '포토카드', '응원봉'],
  최애곡: ['최애곡', '좋아하는 곡'],
  '팬 모임': ['팬', '팬덤'],
  결말: ['결말', '반전', '엔딩'],
  OST: ['ost', '사운드트랙'],
  명작: ['명작', '고전'],
  감상회: ['감상회', '같이 보'],
  가구: ['가구', '소파', '책상'],
  벽지: ['벽지', '페인트', '색'],
  옷장: ['옷장', '코디', '옷'],
  '친구 방문': ['방문', '놀러', '집들이'],
  정리: ['정리', '청소', '수납'],
  꽃: ['꽃', '꽃다발'],
  정원: ['정원', '가드닝', '화단'],
  화분: ['화분', '식물'],
  엽서: ['엽서'],
  감사: ['고마', '감사'],
  '미래 편지': ['미래', '몇 년 뒤', '나중에'],
  우편함: ['우편함', '편지함'],
  노래: ['노래', '곡'],
  춤: ['춤', '댄스'],
  라디오: ['라디오', '사연'],
  악기: ['악기', '기타', '피아노'],
}

const CRISIS =
  '지금 많이 힘들다면 혼자 견디지 않아도 돼요. 믿을 만한 사람이나 전문 상담기관에 도움을 요청해 주세요. 긴급한 위험이면 119 또는 112에 연락해 주세요.'
const MONEY = '지금은 모든 체험이 무료예요. 코인 상점과 결제는 아직 열리지 않았어요. 대신 오늘의 모임을 둘러볼까요?'

function keywords(intent: string): string[] {
  return [intent, ...(SYNONYMS[intent] ?? [])].map((k) => k.toLowerCase())
}

function score(topic: DialogueTopic, text: string): number {
  // 주제 이름을 그대로 말하면 그 주제를 가장 먼저 고른다(예: '영화'의 동의어 '드라마'와
  // 실제 '드라마' 주제가 겹칠 때 정확한 쪽이 이긴다).
  const exact = text.includes(topic.intent.toLowerCase()) ? 100 : 0
  return exact + keywords(topic.intent).reduce((sum, key) => (text.includes(key) ? sum + key.length : sum), 0)
}

const SAFETY = /(죽고 싶|자살|자해|사라지고 싶)/
const HELLO = /(안녕|반가|하이|hello|처음 왔|왔어요|왔습니다)/
const BYE = /(잘 가|안녕히|나갈|이만|다음에 봐|끝낼)/
const MONEY_RE = /(코인|결제|가격|구매|유료)/

/** 짧은 대답은 직전 질문의 후속 대사로 잇는다. */
function isShortAnswer(text: string): boolean {
  return text.replace(/\s/g, '').length <= 10
}

export interface ReplyOptions {
  /** 이미 물어본 주제(intent) 목록 — 반복 질문을 피한다. */
  asked: string[]
  /** 마지막으로 물어본 주제. 짧은 대답을 후속 대사로 잇는다. */
  lastIntent?: string
  /** 재방문 인사 사용 여부 */
  revisit?: boolean
  /** 직전 주민 대사. 같은 문장을 연달아 쓰지 않는다. */
  lastText?: string
}

export function replyFor(id: string, input: string, options: ReplyOptions): ReplyResult {
  const resident = DIALOGUE_RESIDENTS[id]
  const text = input.trim()
  const lower = text.toLowerCase()
  const asked = options.asked ?? []
  const lastText = options.lastText ?? ''
  if (!resident) return { text: '지금은 이 주민과 이야기할 수 없어요.', tone: 'unknown' }

  /** 같은 문장 반복을 피한다. 이미 쓴 대사면 아직 안 물어본 주제로 넘어간다. */
  const avoidRepeat = (result: ReplyResult): ReplyResult => {
    if (result.text !== lastText) return result
    const nextTopic = resident.utterances.topics.find((topic) => !asked.includes(topic.intent))
    if (nextTopic) return { text: nextTopic.question, tone: 'question', intent: nextTopic.intent }
    return { text: resident.utterances.farewell, tone: 'farewell' }
  }

  if (SAFETY.test(lower)) return { text: CRISIS, tone: 'safety' }
  if (MONEY_RE.test(lower)) return { text: MONEY, tone: 'unknown' }
  if (BYE.test(lower)) return { text: resident.utterances.farewell, tone: 'farewell' }

  const topics = resident.utterances.topics
  const matched = topics
    .map((topic) => ({ topic, s: score(topic, lower) }))
    .filter((item) => item.s > 0)
    .sort((a, b) => b.s - a.s)[0]?.topic

  if (HELLO.test(lower) && !matched) {
    const line = options.revisit ? resident.utterances.revisit : resident.utterances.greeting
    return { text: line, tone: 'greeting' }
  }

  if (matched) {
    // 같은 주제를 다시 물으면 후속 대사로 대답한다(연속 같은 질문 방지).
    if (asked.includes(matched.intent)) return avoidRepeat({ text: matched.follow_up, tone: 'follow', intent: matched.intent })
    return avoidRepeat({ text: matched.question, tone: 'question', intent: matched.intent })
  }

  const last = options.lastIntent ? topics.find((topic) => topic.intent === options.lastIntent) : undefined
  if (last && isShortAnswer(lower)) return avoidRepeat({ text: last.follow_up, tone: 'follow', intent: last.intent })

  const next = topics.find((topic) => !asked.includes(topic.intent))
  if (next) {
    // 새 의도를 찾지 못하면 확인 질문을 하되, 아직 안 물어본 주제로 넘긴다.
    return avoidRepeat({ text: `${resident.utterances.unknown} ${next.question}`, tone: 'unknown', intent: next.intent })
  }

  return { text: resident.utterances.farewell, tone: 'farewell' }
}

/** 잠금 공간(혼술 라운지·싱글 살롱) 주민은 일반 대화 대신 잠금 안내만 준다. */
export function lockedNotice(id: string): string | undefined {
  if (id === 'jazz') return '혼술 라운지는 연령·안전 확인 전이라 대화를 열지 않아요. 루이의 안내만 들을 수 있어요.'
  if (id === 'single') return '싱글 살롱은 연령·안전 확인 전이라 대화를 열지 않아요. 레터의 안내만 들을 수 있어요.'
  return undefined
}

/** 기억 동의를 켠 사람만 이 기기에 주제를 저장한다(기본 해제). */
export const MEMORY_CONSENT_KEY = 'dd.resident.memory.consent.v1'
export const MEMORY_KEY = 'dd.resident.memory.v1'
export type ResidentMemory = Record<string, { intents: string[]; updatedAt: string }>
