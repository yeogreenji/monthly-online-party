/* 365일 이벤트 기획표.
   날짜만 정하면 항상 같은 이벤트가 나오는 계산식입니다.
   기획·시연 단계의 안내이며, 실제 진행자·참가 접수·상품은 연결되어 있지 않습니다. */

export interface DailyEvent {
  title: string
  blurb: string
  /** SPACES의 id */
  space: string
  special: boolean
  week: number
}

const RITUALS: { space: string; title: string; blurb: string }[] = [
  { space: 'women', title: '일요 수다 티타임', blurb: '한 주를 마무리하며 따뜻한 차 한 잔과 수다를 나눠요.' },
  { space: 'cafe', title: '월요일 모닝 한 잔', blurb: '월요일 아침을 한 잔으로 시작하고 이번 주 다짐을 나눠요.' },
  { space: 'hobby', title: '화요 책과 작업실', blurb: '읽고 있는 책이나 만들고 있는 작업을 한 장 사진으로 소개해요.' },
  { space: 'cinema', title: '수요 영화 이야기', blurb: '이번 주에 본 영화나 드라마를 별점과 함께 남겨요.' },
  { space: 'travel', title: '목요 여행 계획 회의', blurb: '가 보고 싶은 곳을 엽서 지도에 한 곳씩 붙여요.' },
  { space: 'games', title: '불금 게임 라운지', blurb: '끝말잇기와 스무고개로 한 주의 피로를 풀어요.' },
  { space: 'cafe', title: '토요 디저트 브런치', blurb: '오늘의 디저트 한 입을 사진으로 자랑해요.' },
]

/** 월별 다섯 주 미션: 해당 월의 테마를 따라 구성 */
const MISSIONS: string[][] = [
  ['새해 소원 한 줄 적기', '복주머니에 올해 목표 넣기', '작심삼일 탈출 팁 나누기', '겨울 간식 추천', '1월 마무리 회고'],
  ['정월대보름 소원 달', '설 연휴 안부 엽서', '밸런타인 감사 편지', '겨울 끝자락 사진 한 장', '2월 마무리 회고'],
  ['봄맞이 새 시작 선언', '화이트데이 달콤 메뉴', '봄 옷장 코디 자랑', '새 학기·새 일 응원', '3월 마무리 회고'],
  ['벚꽃 사진 전시회', '식목일 화분 자랑', '봄 피크닉 도시락', '봄나들이 코스 공유', '4월 마무리 회고'],
  ['어린이날 추억 소환', '어버이날 감사 한 줄', '레트로 놀이 한 판', '스승의 날 고마운 분께', '5월 마무리 회고'],
  ['재즈 한 곡 추천', '현충일 감사 한마디', '단오 수리취떡 이야기', '여름 장마 플레이리스트', '6월 마무리 회고'],
  ['여름휴가 계획 공유', '영화제 개막 소감', '시원한 간식 레시피', '바다와 계곡 사진전', '7월 마무리 회고'],
  ['세계 여행 엽서 쓰기', '야시장 먹거리 투어', '광복절 우리 동네 이야기', '여름 끝자락 추억', '8월 마무리 회고'],
  ['가을 달빛 소원', '추석 안부 인사', '가을 독서 챌린지', '단풍 기대 목록', '9월 마무리 회고'],
  ['한글날 예쁜 우리말', '핼러윈 가면 만들기', '가을 사진전', '가면무도회 준비', '10월 마무리 회고'],
  ['북페어 책 교환 소개', '빼빼로데이 응원 메시지', '수험생 응원 한 줄', '첫눈 기다리는 마음', '11월 마무리 회고'],
  ['크리스마스 트리 꾸미기', '비밀 산타 편지 쓰기', '송년 파티 준비', '올해의 한 장', '한 해 마무리 인사'],
]

/** 양력 고정 기념일 */
const SPECIAL: Record<string, { space: string; title: string; blurb: string }> = {
  '1-1': { space: 'cafe', title: '신정 새해 인사', blurb: '새해 첫날, 서로에게 새해 인사를 건네요.' },
  '2-14': { space: 'women', title: '밸런타인 감사 편지', blurb: '마음을 전하고 싶은 사람에게 편지 한 장을 써요.' },
  '3-1': { space: 'hobby', title: '삼일절 기억하기', blurb: '이날의 의미를 책과 이야기로 되새겨요.' },
  '3-14': { space: 'cafe', title: '화이트데이 달콤한 하루', blurb: '달콤한 디저트 사진으로 마음을 나눠요.' },
  '4-5': { space: 'hobby', title: '식목일 화분 자랑', blurb: '집 안 식물이나 화분 사진을 올려요.' },
  '5-5': { space: 'games', title: '어린이날 레트로 놀이터', blurb: '어릴 적 하던 놀이를 다시 해 봐요.' },
  '5-8': { space: 'women', title: '어버이날 감사 한 줄', blurb: '고마운 분께 전하고 싶은 말을 적어요.' },
  '5-15': { space: 'hobby', title: '스승의 날 고마운 분', blurb: '배움을 준 분을 떠올리며 사진과 글을 남겨요.' },
  '6-6': { space: 'cinema', title: '현충일 추모의 날', blurb: '조용히 마음을 모으는 날. 차분한 영화나 책을 추천해요.' },
  '7-17': { space: 'hobby', title: '제헌절 우리말 퀴즈', blurb: '법과 우리말에 관한 가벼운 퀴즈를 풀어요.' },
  '8-15': { space: 'travel', title: '광복절 동네 이야기', blurb: '내가 사는 동네의 이야기를 엽서로 남겨요.' },
  '10-3': { space: 'travel', title: '개천절 우리 땅 여행', blurb: '가 보고 싶은 우리나라 여행지를 공유해요.' },
  '10-9': { space: 'hobby', title: '한글날 예쁜 우리말', blurb: '좋아하는 우리말 한 단어를 소개해요.' },
  '10-31': { space: 'games', title: '핼러윈 가면무도회', blurb: '가면 쓴 캐릭터로 놀이를 즐겨요.' },
  '11-11': { space: 'cafe', title: '빼빼로데이 응원', blurb: '고마운 사람에게 간식 대신 응원 한 줄을 보내요.' },
  '12-24': { space: 'season', title: '크리스마스 이브 파티', blurb: '시즌 파티하우스에서 이브를 함께 보내요.' },
  '12-25': { space: 'season', title: '메리 크리스마스', blurb: '비밀 산타 편지를 열어 보는 날이에요.' },
  '12-31': { space: 'season', title: '송년 카운트다운', blurb: '올해의 한 장과 내년 소원을 남겨요.' },
}

export function dailyEvent(date: Date = new Date()): DailyEvent {
  const m = date.getMonth()
  const d = date.getDate()
  const week = Math.min(4, Math.floor((d - 1) / 7))
  const special = SPECIAL[`${m + 1}-${d}`]
  const mission = MISSIONS[m][week]
  if (special) return { ...special, special: true, week, blurb: `${special.blurb} (이번 주 미션: ${mission})` }
  const dow = date.getDay()
  const r = RITUALS[dow]
  const space = dow === 0 && Math.floor((d - 1) / 7) % 2 === 1 ? 'men' : r.space
  const title = dow === 0 && space === 'men' ? '일요 아지트 토크' : r.title
  return { space, title, blurb: `${r.blurb} 이번 주 미션: ${mission}`, special: false, week }
}

export function dateLabel(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${'일월화수목금토'[date.getDay()]}요일`
}
