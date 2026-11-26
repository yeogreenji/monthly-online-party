import { RESIDENTS } from './world'

/* 2단계: 공간별 세계관·주제방·시연 대화.
   모든 대화는 시연용 가상 주민이 쓴 문장이며 실제 이용자 글이 아닙니다.
   실시간 다중 사용자 채팅은 3단계(서버 연결) 이후에 제공됩니다. */

export type TopicKind = 'talk' | 'review' | 'photo' | 'play' | 'share'

export interface TopicSeed {
  title: string
  blurb: string
  kind: TopicKind
  /** who: 주민 id(RESIDENTS 키) 또는 이웃 이름 */
  seed: { who: string; text: string }[]
}

export interface SpaceWorld {
  story: string
  rules: string[]
  today: { title: string; question: string; kind: TopicKind }[]
  topics: TopicSeed[]
}

export const KIND_UI: Record<
  TopicKind,
  { label: string; placeholder: string; chips: { label: string; text: string }[]; photoHint?: string }
> = {
  talk: {
    label: '수다',
    placeholder: '편하게 이야기를 남겨 보세요',
    chips: [
      { label: '공감해요', text: '저도 그랬어요! ' },
      { label: '오늘 한 줄', text: '오늘은 ' },
      { label: '질문 있어요', text: '궁금한 게 있어요: ' },
    ],
  },
  review: {
    label: '후기',
    placeholder: '후기를 남겨 보세요',
    chips: [
      { label: '★ 한 줄 후기', text: '★★★★☆ 한 줄 후기: ' },
      { label: '스포일러 주의', text: '[스포일러 있음] ' },
      { label: '기억에 남는 장면', text: '기억에 남는 장면은 ' },
    ],
    photoHint: '티켓·포스터·책 표지 같은 인증 사진을 올릴 수 있어요.',
  },
  photo: {
    label: '사진',
    placeholder: '사진과 함께 한마디 남겨 보세요',
    chips: [
      { label: '오늘의 한 장', text: '오늘의 한 장: ' },
      { label: '여기 좋아요', text: '여기가 좋았어요: ' },
      { label: '찍은 곳', text: '찍은 곳은 ' },
    ],
    photoHint: '아래 사진 버튼으로 오늘의 한 장을 올려 보세요. 얼굴과 집 주소가 나오지 않게 주의해 주세요.',
  },
  play: {
    label: '놀이',
    placeholder: '정답이나 다음 문제를 적어 보세요',
    chips: [
      { label: '제 답은', text: '제 답은 ' },
      { label: '힌트 주세요', text: '힌트 하나만 주세요! ' },
      { label: '한 판 더', text: '한 판 더 해요! ' },
    ],
  },
  share: {
    label: '추천',
    placeholder: '추천하고 싶은 것을 알려 주세요',
    chips: [
      { label: '추천해요', text: '추천해요: ' },
      { label: '저는 이렇게', text: '저는 이렇게 해요: ' },
      { label: '이유는', text: '이유는 ' },
    ],
    photoHint: '사진을 함께 올리면 이야기가 더 잘 전달돼요.',
  },
}

/** 시연용 이웃 이름. 실제 이용자가 아닙니다. */
export const NEIGHBORS = ['하늘', '보리', '도토리', '솜이']

const REPLIES: Record<TopicKind, string[]> = {
  talk: ['오, 저도 비슷한 적 있어요. 더 이야기해 줄래요?', '좋은 이야기예요. 다른 분들은 어떠세요?', '편하게 얘기해 줘서 고마워요.'],
  review: ['그 장면 저도 좋았어요. 스포일러 없이 한 줄만 더 들려줄래요?', '별점 후하게 주셨네요. 다시 보면 또 다를 것 같아요.', '다음에 같이 볼 작품도 골라 볼까요?'],
  photo: ['사진 분위기가 따뜻해요. 어디서 찍었는지 궁금해요.', '오늘의 한 장으로 벽에 붙여 두고 싶어요.', '색감이 예뻐요. 다음 사진도 기다릴게요.'],
  play: ['게임은 게임 라운지의 미니게임에서 진행할 수 있어요.'],
  share: ['좋은 추천이에요. 저장해 둘게요.', '저도 해 보고 싶어요. 팁이 더 있나요?', '이유까지 알려 주니 도움이 돼요.'],
}

export function demoReply(spaceId: string, kind: TopicKind, serial: number): { by: string; text: string } {
  const pool = REPLIES[kind]
  const useResident = serial % 2 === 0 && RESIDENTS[spaceId]
  return { by: useResident ? RESIDENTS[spaceId].name : NEIGHBORS[serial % NEIGHBORS.length], text: pool[serial % pool.length] }
}

export function seoulDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date)
  return ['year','month','day'].map(k=>parts.find(p=>p.type===k)?.value??'').join('-')
}
export function todayPick<T>(list: T[], date = new Date()): T {
  const day = Math.floor(Date.parse(seoulDate(date)+'T00:00:00Z') / 86_400_000)
  return list[((day % list.length)+list.length)%list.length]
}

export function whoName(who: string): string {
  return RESIDENTS[who]?.name ?? who
}

const N = NEIGHBORS

export const SPACE_WORLD: Record<string, SpaceWorld> = {
  home: {story:'나의 취향과 추억을 모으는 작은 집이에요. 단추가 인테리어를 안내하지만 집은 기본적으로 나만의 공간입니다.',rules:['내 집 사진과 소개는 기본 비공개예요.','친구 초대와 편지는 실제 계정 연결 후 제공돼요.'],today:[{title:'오늘의 집 꾸미기',question:'오늘 마음에 드는 색과 가구를 골라 보세요.',kind:'photo'}],topics:[]},
  plaza: {
    story:
      '초인종이 울리면 동네가 깨어납니다. 중앙 광장은 처음 온 사람도 어색하지 않게 인사를 나누는 곳이고, 벨이 그날의 소식을 한 줄 알려 줘요. 음악지기 도레는 매주 새 노래 이야기를 가져옵니다.',
    rules: ['처음 온 분께 먼저 인사해 주세요.', '개인정보(연락처·주소)는 적지 않아요.', '불편한 말에는 답하지 않고 넘어가도 괜찮아요.'],
    today: [
      { title: '오늘의 인사 한 줄', question: '오늘 하루를 한 줄로 소개해 주세요. 이모지도 좋아요.', kind: 'talk' },
      { title: '요즘 듣는 노래', question: '요즘 반복 재생 중인 노래가 있나요? 좋아하는 가수의 컴백 소식도 환영이에요.', kind: 'share' },
      { title: '이번 주 소소한 행복', question: '이번 주에 기뻤던 작은 순간을 나눠 주세요.', kind: 'talk' },
    ],
    topics: [
      { title: '처음 왔어요', blurb: '새 이웃을 환영하는 방', kind: 'talk', seed: [{ who: 'plaza', text: '딩동! 처음 오신 분 환영해요. 닉네임과 오늘 기분만 알려 줘도 충분해요.' }, { who: N[0], text: '저도 이번 주에 왔어요. 반가워요!' }] },
      { title: '오늘의 수다', blurb: '무슨 얘기든 가볍게', kind: 'talk', seed: [{ who: 'plaza', text: '오늘 광장 분수대 앞이 따뜻해요. 점심은 드셨나요?' }, { who: N[1], text: '샌드위치 먹었어요. 다들 뭐 드셨어요?' }] },
      { title: '축제 이야기', blurb: '이번 달 파티 준비와 후기', kind: 'talk', seed: [{ who: 'plaza-music', text: '이번 달 파티 플레이리스트를 모으고 있어요. 신청곡 받아요.' }, { who: N[2], text: '저는 잔잔한 곡 하나 신청할게요.' }] },
    ],
  },
  season: {
    story:
      '노엘은 계절마다 파티하우스의 장식을 바꿉니다. 겨울에는 트리 아래에 비밀 산타 상자가 놓이고, 아직 이름이 적히지 않은 마지막 초대장이 남아 있어요. 크리스마스 장식은 이 공간 안에서만 만날 수 있어요.',
    rules: ['비밀 산타는 가상 선물 메시지만 주고받아요.', '실물 선물·주소 교환은 하지 않아요.', '장식 사진은 포토존에서 찍어 올려요.'],
    today: [
      { title: '트리에 달고 싶은 장식', question: '올해 트리에 꼭 달고 싶은 장식은 무엇인가요?', kind: 'talk' },
      { title: '나의 겨울 캐럴', question: '매년 이맘때 꼭 듣는 캐럴이 있나요?', kind: 'share' },
      { title: '비밀 산타 한 줄 편지', question: '이름 없는 이웃에게 따뜻한 한 줄을 남겨 주세요.', kind: 'talk' },
    ],
    topics: [
      { title: '크리스마스 티파티', blurb: '따뜻한 차와 함께하는 겨울 수다', kind: 'talk', seed: [{ who: 'season', text: '티파티 테이블이 준비됐어요. 오늘은 어떤 차로 시작할까요?' }, { who: N[0], text: '저는 시나몬 밀크티요!' }] },
      { title: '비밀 산타', blurb: '이름 없는 가상 선물 편지', kind: 'talk', seed: [{ who: 'season', text: '비밀 산타 상자에 마음을 담아 보세요. 받는 분 이름은 마지막까지 비밀이에요.' }] },
      { title: '트리 꾸미기', blurb: '장식 사진 자랑하는 방', kind: 'photo', seed: [{ who: 'season', text: '포토존에서 찍은 트리 사진을 올려 주세요. 오늘의 한 장을 벽에 걸어 둘게요.' }, { who: N[3], text: '이 별 장식이 제일 마음에 들어요.' }] },
      { title: '캐럴 이야기', blurb: '올겨울 캐럴 추천', kind: 'share', seed: [{ who: 'season', text: '올겨울 캐럴 한 곡만 추천한다면 어떤 곡인가요?' }] },
    ],
  },
  jazz: {
    story:
      '루이의 작은 무대에는 낮은 조명과 피아노가 있어요. 술이 없어도 한 잔의 여유면 충분하지만, 성인 이용자는 안주와 술 사진을 나누며 혼술 모임을 열 수 있어요. 연령·안전 확인이 끝나기 전까지는 공간 구경만 할 수 있고 채팅과 모임은 잠겨 있습니다.',
    rules: ['성인 확인 후에만 채팅과 모임에 참여해요.', '과음을 권하지 않아요.', '논알콜 메뉴도 언제나 환영해요.'],
    today: [
      { title: '오늘의 혼술 안주', question: '오늘 혼술 안주는 무엇인가요? 사진으로 보여 주세요.', kind: 'photo' },
      { title: '오늘의 재즈 한 곡', question: '퇴근길에 어울리는 재즈나 잔잔한 곡을 추천해 주세요.', kind: 'share' },
    ],
    topics: [
      { title: '논알콜 한 잔', blurb: '술 없이 즐기는 한 잔', kind: 'photo', seed: [{ who: 'jazz', text: '오늘은 무알콜 칵테일 한 잔 어때요? 컵 사진도 환영해요.' }] },
      { title: '재즈 감상', blurb: '오늘 들은 곡 이야기', kind: 'share', seed: [{ who: 'jazz', text: '오늘 밤 첫 곡은 피아노 트리오예요. 어떤 곡이 떠오르세요?' }] },
      { title: '오늘 하루', blurb: '하루를 정리하는 혼술 수다', kind: 'talk', seed: [{ who: 'jazz', text: '오늘 하루 수고했어요. 한 잔 놓고 천천히 얘기해요.' }] },
    ],
  },
  cafe: {
    story:
      '모카는 아침에는 커피, 저녁에는 차를 내려요. 창가 자리는 이야기가 필요한 사람을 위해 비워 두고, 디저트 사진이 올라오면 칠판에 오늘의 메뉴로 적어 둡니다.',
    rules: ['메뉴 사진은 가게 이름이 보여도 광고성 링크는 올리지 않아요.', '좋아하는 취향은 존중해요.', '음료 이야기만으로도 충분해요.'],
    today: [
      { title: '오늘의 한 잔', question: '오늘 마신 한 잔(커피·차·논알콜)을 소개해 주세요.', kind: 'photo' },
      { title: '디저트 한 입', question: '요즘 꽂힌 디저트가 있나요?', kind: 'photo' },
      { title: '홈카페 꿀팁', question: '집에서 더 맛있게 마시는 나만의 방법이 있나요?', kind: 'share' },
    ],
    topics: [
      { title: '오늘의 차', blurb: '오늘 마신 차 사진과 후기', kind: 'photo', seed: [{ who: 'cafe', text: '오늘의 차는 유자차예요. 여러분의 한 잔도 보여 주세요.' }, { who: N[0], text: '저는 보리차로 마무리하는 중이에요.' }] },
      { title: '디저트 추천', blurb: '맛있게 먹은 디저트 공유', kind: 'share', seed: [{ who: 'cafe', text: '딸기 케이크가 오늘의 가상 메뉴예요. 추천하는 디저트가 있나요?' }] },
      { title: '카페 발견', blurb: '동네 카페 탐방 후기', kind: 'review', seed: [{ who: N[1], text: '새로 생긴 카페에 다녀왔어요. 조용해서 책 읽기 좋았어요.' }] },
      { title: '홈카페 레시피', blurb: '집에서 만드는 한 잔', kind: 'share', seed: [{ who: 'cafe', text: '집에서 라떼 거품을 낼 때 우유 온도가 중요해요. 여러분의 비법은요?' }] },
      { title: '창가 독서회', blurb: '창가에서 책 한 권', kind: 'talk', seed: [{ who: 'cafe', text: '창가 자리에서 읽기 좋은 책을 서로 소개해 봐요.' }] },
      { title: '저녁 차 한 잔', blurb: '하루를 마무리하는 시간', kind: 'talk', seed: [{ who: 'cafe', text: '저녁에는 카페인 없는 차가 좋아요. 오늘 하루는 어땠나요?' }] },
    ],
  },
  travel: {
    story:
      '로드의 엽서 지도에는 아직 가 보지 않은 도시마다 핀이 꽂혀 있어요. 다녀온 사람은 엽서를 붙이고, 가려는 사람은 질문을 남깁니다. 이야기를 나누면 먼 곳도 조금 가까워져요.',
    rules: ['실시간 위치·숙소 주소는 올리지 않아요.', '광고성 링크는 올리지 않아요.', '후기에는 다녀온 시기를 함께 적어요.'],
    today: [
      { title: '이번 주말 가고 싶은 곳', question: '이번 주말에 가고 싶은 곳이 있나요?', kind: 'talk' },
      { title: '여행 사진 엽서', question: '가장 좋아하는 여행 사진 한 장을 엽서로 보내 주세요.', kind: 'photo' },
      { title: '혼자 여행 꿀팁', question: '혼자 여행할 때 나만의 규칙이 있나요?', kind: 'share' },
    ],
    topics: [
      { title: '혼자 여행', blurb: '혼행 팁과 후기', kind: 'share', seed: [{ who: 'travel', text: '혼자 떠나는 첫 여행이라면 숙소를 먼저 정하는 게 좋아요. 여러분의 팁은요?' }] },
      { title: '여행지 추천', blurb: '가 볼 만한 곳 추천', kind: 'share', seed: [{ who: N[2], text: '가을에는 강릉이 좋았어요. 바다 보며 걷기 좋아요.' }] },
      { title: '여행 사진', blurb: '다녀온 곳 사진 엽서', kind: 'photo', seed: [{ who: 'travel', text: '엽서 지도에 붙일 사진을 올려 주세요. 어디였는지도 한 줄로요.' }] },
      { title: '주말 여행 계획', blurb: '이번 주말 어디 갈까요', kind: 'talk', seed: [{ who: 'travel', text: '당일치기 코스를 같이 짜 봐요. 출발지가 어디인가요?' }] },
      { title: '기차 여행', blurb: '창밖 풍경과 함께', kind: 'talk', seed: [{ who: 'travel', text: '기차 여행은 창가 자리가 최고죠. 가 본 노선을 알려 주세요.' }] },
      { title: '여행 엽서', blurb: '짧은 글로 쓰는 엽서', kind: 'talk', seed: [{ who: 'travel', text: '여행지에서 보낸다는 마음으로 엽서 한 장을 써 봐요.' }] },
    ],
  },
  women: {
    story:
      '로지의 티타임은 서로의 이야기를 끝까지 들어 주는 것이 규칙의 전부예요. 일상, 취향, 요즘 관심사를 편하게 꺼내고, 조언이 필요하면 먼저 물어봐요.',
    rules: ['조언은 원할 때만 건네요.', '외모·나이 평가는 하지 않아요.', '대화 내용을 밖에 옮기지 않아요.'],
    today: [
      { title: '오늘의 소확행', question: '오늘 나를 웃게 한 작은 일은 무엇인가요?', kind: 'talk' },
      { title: '요즘 푹 빠진 것', question: '요즘 푹 빠진 취미나 콘텐츠를 알려 주세요.', kind: 'share' },
    ],
    topics: [
      { title: '일상 수다', blurb: '오늘 있었던 일', kind: 'talk', seed: [{ who: 'women', text: '오늘 하루 어땠어요? 소소한 이야기부터 꺼내 봐요.' }, { who: N[0], text: '퇴근길에 노을이 예뻐서 한참 봤어요.' }] },
      { title: '요즘 관심사', blurb: '요즘 꽂힌 것들', kind: 'share', seed: [{ who: 'women', text: '요즘 빠진 것이 있다면 하나만 알려 주세요.' }] },
    ],
  },
  men: {
    story:
      '테오의 아지트에는 낡은 소파와 작은 선반이 있어요. 일상과 취미를 부담 없이 이야기하고, 서로의 좋아하는 것을 하나씩 알려 주는 모임을 자주 열어요.',
    rules: ['비교하거나 놀리지 않아요.', '취미에 정답은 없어요.', '지나친 정치·혐오 발언은 하지 않아요.'],
    today: [
      { title: '요즘 즐기는 취미', question: '요즘 시간 가는 줄 모르고 하는 취미가 있나요?', kind: 'talk' },
      { title: '주말 계획', question: '이번 주말 계획을 한 줄로 알려 주세요.', kind: 'talk' },
    ],
    topics: [
      { title: '일상 수다', blurb: '편하게 앉아서', kind: 'talk', seed: [{ who: 'men', text: '편한 자리에 앉아요. 오늘은 어떤 하루였어요?' }] },
      { title: '취미 이야기', blurb: '좋아하는 것 하나', kind: 'share', seed: [{ who: 'men', text: '좋아하는 취미를 하나만 소개해 주세요. 처음 시작한 계기도요.' }, { who: N[1], text: '저는 러닝이요. 이번 달 5km 완주했어요.' }] },
    ],
  },
  single: {
    story:
      '레터는 서로의 취향과 경계를 존중하는 느린 편지를 준비해요. 연령·안전 확인이 끝나기 전에는 공간 구경만 할 수 있고, 실제 만남이나 개인 메시지 연결은 제공하지 않아요.',
    rules: ['성인 확인 후에만 채팅과 모임에 참여해요.', '연락처 교환·만남 강요는 금지예요.', '불쾌한 요청에는 답하지 않아도 괜찮아요.'],
    today: [{ title: '나를 소개하는 세 단어', question: '나를 소개하는 세 단어를 알려 주세요.', kind: 'talk' }],
    topics: [
      { title: '취향 소개', blurb: '좋아하는 것 소개', kind: 'talk', seed: [{ who: 'single', text: '좋아하는 음식이나 영화를 하나씩 소개해 봐요.' }] },
      { title: '주말 이야기', blurb: '주말에 하고 싶은 일', kind: 'talk', seed: [{ who: 'single', text: '이번 주말은 어떻게 보낼 계획인가요?' }] },
    ],
  },
  games: {
    story:
      '픽셀에게 게임은 이기는 것보다 함께 웃는 일이 중요해요. 끝말잇기, 스무고개, OX 퀴즈처럼 규칙이 간단한 놀이를 채팅으로 즐기고, 점수는 재미로만 세어요.',
    rules: ['이기려고 놀리지 않아요.', '정답 공개는 마지막에 해요.', '도박·내기는 하지 않아요.'],
    today: [
      { title: '오늘의 끝말잇기', question: '첫 단어는 “파티”예요. 이어 줄 사람?', kind: 'play' },
      { title: '오늘의 스무고개', question: '제가 생각한 물건을 맞혀 보세요. 예/아니오로만 답해요.', kind: 'play' },
      { title: '오늘의 OX 퀴즈', question: '문어는 심장이 세 개다. O일까요 X일까요?', kind: 'play' },
    ],
    topics: [
      { title: '끝말잇기', blurb: '단어로 잇는 한 판', kind: 'play', seed: [{ who: 'games', text: '시작할게요. 첫 단어는 “파티”!' }, { who: N[0], text: '티라미수!' }, { who: 'games', text: '수박! 이제 “박”으로 이어 줄 사람?' }] },
      { title: '스무고개', blurb: '예/아니오로 맞히기', kind: 'play', seed: [{ who: 'games', text: '제가 하나를 떠올렸어요. 스무 번 안에 맞혀 보세요.' }] },
      { title: 'OX 퀴즈', blurb: '상식 퀴즈 한 판', kind: 'play', seed: [{ who: 'games', text: '문어는 심장이 세 개다. O 또는 X로 답해 주세요.' }] },
      { title: '보드게임 이야기', blurb: '좋아하는 보드게임', kind: 'talk', seed: [{ who: 'games', text: '최근에 해 본 보드게임이 있나요?' }] },
      { title: '그림 맞히기 모임', blurb: '말로 그림 설명하기', kind: 'play', seed: [{ who: 'games', text: '그림을 말로만 설명해서 맞혀 보는 놀이예요. 제가 먼저 해 볼게요.' }] },
    ],
  },
  hobby: {
    story:
      '페이지의 작업실에는 책장, 이젤, 뜨개 바구니가 한 벽에 모여 있어요. 완성하지 못한 작업도 괜찮고, 사진 한 장과 한 줄 소개만 올려도 환영받아요.',
    rules: ['결과물보다 과정을 응원해요.', '타인의 작업물을 허락 없이 퍼 가지 않아요.', '판매·홍보 글은 올리지 않아요.'],
    today: [
      { title: '이번 주 읽은 책', question: '이번 주에 읽은 책이나 읽는 중인 책을 알려 주세요.', kind: 'review' },
      { title: '오늘의 작업 한 장', question: '오늘 만든 것이나 그린 것을 사진으로 보여 주세요.', kind: 'photo' },
      { title: '우리 집 반려동물', question: '반려동물 사진 한 장 자랑해 주세요.', kind: 'photo' },
    ],
    topics: [
      { title: '독서 토론', blurb: '책 한 권 이야기', kind: 'review', seed: [{ who: 'hobby', text: '이번 달 책은 가볍게 읽을 수 있는 소설이에요. 읽은 분은 후기를 남겨 주세요.' }, { who: N[0], text: '결말이 따뜻해서 좋았어요. 스포는 안 할게요.' }] },
      { title: '반려동물 이야기', blurb: '우리 집 동물 친구', kind: 'photo', seed: [{ who: 'hobby', text: '반려동물 사진을 올려 주세요. 이름과 매력 포인트도 함께요.' }] },
      { title: '그림과 손작업', blurb: '작업물 공유', kind: 'photo', seed: [{ who: 'hobby', text: '진행 중인 작업도 괜찮아요. 사진 한 장 올려 주세요.' }] },
      { title: '뜨개질 모임', blurb: '코를 세는 시간', kind: 'talk', seed: [{ who: 'hobby', text: '목도리를 뜨는 분 계신가요? 실 고르는 팁을 나눠 봐요.' }] },
      { title: '책 추천', blurb: '이번 주 추천 도서', kind: 'share', seed: [{ who: 'hobby', text: '누군가에게 선물하고 싶은 책을 한 권 추천해 주세요.' }] },
      { title: '사진 이야기', blurb: '찍고 고르는 이야기', kind: 'photo', seed: [{ who: 'hobby', text: '요즘 찍은 사진 중 가장 마음에 드는 한 장은요?' }] },
    ],
  },
  fandom: {
    story: '공연장에 가기 전, 컴백을 기다리는 밤, 처음 입덕한 날. 같은 마음으로 응원하는 팬들이 이곳에 모여요.',
    rules: ['공식 채널과 출처가 있는 소식을 공유해요.', '다른 팬과 아티스트를 존중해요.', '비공개 일정과 사적 위치는 공유하지 않아요.'],
    today: [
      { title: '입덕한 순간', question: '어떤 무대나 노래를 보고 입덕했나요?', kind: 'talk' },
      { title: '내 최애 무대', question: '다른 팬에게 추천하고 싶은 공식 영상은 무엇인가요?', kind: 'share' },
    ],
    topics: [
      { title: '컴백 같이 보기', blurb: '기대하는 신곡과 공식 공개 일정을 이야기해요.', kind: 'share', seed: [{ who: 'fandom', text: '다음에 같이 보고 싶은 컴백을 알려 주세요.' }] },
      { title: '공연 후기', blurb: '공연에서 가장 기억에 남은 순간을 나눠요.', kind: 'review', seed: [{ who: 'fandom', text: '어떤 무대가 가장 기억에 남았나요?' }] },
      { title: '입덕 이야기', blurb: '처음 좋아하게 된 순간을 나눠요.', kind: 'talk', seed: [{ who: 'fandom', text: '처음 마음을 뺏긴 곡이 궁금해요.' }] },
    ],
  },
  cinema: {
    story:
      '필름은 엔딩 크레딧이 끝나야 불을 켜요. 오늘의 상영작을 정해 두고, 본 사람은 스포일러 표시와 함께 후기를 남겨요. 같은 영화도 기억하는 장면이 다르다는 걸 확인하는 곳이에요.',
    rules: ['스포일러는 꼭 표시해요.', '배우·작품 비하는 하지 않아요.', '불법 영상 링크는 올리지 않아요.'],
    today: [
      { title: '오늘의 상영작', question: '오늘 본 영화나 드라마를 알려 주세요. 별점도 함께요.', kind: 'review' },
      { title: '인생 명장면', question: '다시 보고 싶은 인생 명장면이 있나요?', kind: 'talk' },
      { title: '주말에 볼 작품', question: '이번 주말에 볼 영화나 드라마를 추천해 주세요.', kind: 'share' },
    ],
    topics: [
      { title: '오늘 본 영화', blurb: '후기와 별점 남기기', kind: 'review', seed: [{ who: 'cinema', text: '오늘 상영작 후기를 받아요. 스포일러가 있으면 꼭 표시해 주세요.' }, { who: N[0], text: '★★★★☆ 잔잔하지만 오래 남는 영화였어요.' }] },
      { title: '드라마 이야기', blurb: '요즘 보는 드라마', kind: 'review', seed: [{ who: 'cinema', text: '이번 주 드라마는 몇 화까지 보셨나요? 스포 없이 이야기해요.' }] },
      { title: '주말 영화제', blurb: '같이 볼 작품 정하기', kind: 'share', seed: [{ who: 'cinema', text: '주말 영화제 후보를 모아요. 보고 싶은 영화를 댓글로 남겨 주세요.' }] },
      { title: '추억의 명장면', blurb: '다시 보고 싶은 장면', kind: 'talk', seed: [{ who: 'cinema', text: '다시 보고 싶은 장면 하나를 소개해 주세요. 이유도 함께요.' }] },
    ],
  },
}
