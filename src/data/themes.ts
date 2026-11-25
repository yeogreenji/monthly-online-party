import type { PartyEvent } from '../types'

/**
 * 매월의 큰 파티. 12월 → 1월 → 2월 순서로 열립니다.
 * 날짜는 실제 달력 기준이며, 2027년 설날(2월 6일)은 별도 회차로 달력에 표시합니다.
 */
export const PARTIES: PartyEvent[] = [
  {
    id: 'dec',
    month: 12,
    monthLabel: '12월',
    en: 'December',
    title: '크리스마스 파티하우스',
    subtitle: '혼자여도, 둘이어도 — 같은 밤에 같은 잔을 듭니다',
    dateISO: '2026-12-24T21:00:00+09:00',
    dateLabel: '12.24',
    weekday: '목요일',
    timeLabel: '21:00 – 24:00',
    place: '온라인 · 딩동 파티홀',
    dressCode: '크림 니트에 골드 하나',
    description:
      '집을 나서지 않아도 괜찮은 크리스마스 이브. 각자 집에서 잔 하나를 준비해 21시에 문을 엽니다. 세 시간 동안 네 개의 방이 열리고, 자정 직전 모두가 각자의 창가에서 마지막 건배를 합니다.',
    heroImg: '/img/hero-december.jpg',
    heroAlt: '크리스마스 이브 홈파티 상차림',
    accent: 'gold',
    quote: '오늘 밤은 잘 차려입은 마음만 있으면 됩니다.',
    program: [
      { time: '20:30', title: '문 열림 · 웰컴 드링크', detail: '각자 집에서 잔을 준비해 들어옵니다. 술이 아니어도 같은 잔에 따릅니다.' },
      { time: '21:00', title: '오프닝 건배', detail: '딩동지기의 3분 인사, 그리고 모두가 동시에 \'짠\'.' },
      { time: '21:20', title: '네 개의 방', detail: '혼술 · 독서 · 영화 · 플레이리스트. 오늘의 기분대로 흩어집니다.' },
      { time: '22:00', title: '비밀 산타', detail: '크리스마스 인사와 따뜻한 메시지를 나눕니다.' },
      { time: '22:40', title: '쪽지 타임', detail: '오늘 대화에서 마음이 닿은 사람에게만 쪽지를 청합니다. 서로 수락해야 열립니다.' },
      { time: '23:30', title: '마지막 건배', detail: '각자의 집에서, 같은 창밖을 봅니다. 24시에 조용히 문을 닫습니다.' },
    ],
    menu: [
      { name: '무화과와 구운 캐머버트', detail: '팬에 3분, 꿀 한 줄', pairing: '샴페인 브뤼 · 논알콜 스파클링' },
      { name: '들깨 크림 뇨끼', detail: '냉동 뇨끼로 10분', pairing: '샤르도네' },
      { name: '편의점 초콜릿 케이크', detail: '접시에 옮기고 소금 한 꼬집', pairing: '버건디 한 잔' },
      { name: '대추차와 진저 티', detail: '논알콜 코스의 마무리', pairing: '논알콜' },
    ],
    hosts: [
      { name: '딩동지기', role: '호스트', line: '오늘은 아무것도 잘하지 않아도 됩니다. 들어와서 잔만 들면 돼요.' },
      { name: '밤의 서재', role: '독서방 지기', line: '오늘 읽은 문장 하나만 가져오세요. 그걸로 충분합니다.' },
      { name: '재즈바11', role: '라운지 지기', line: '노래 신청은 언제든. 오늘 밤은 배경음이 아니라 대화의 일부입니다.' },
    ],
    sponsors: [
      {
        id: 'dec-1',
        brand: '메종 그린우드',
        category: '논알콜 스파클링',
        offer: '첫 잔 쿠폰 3,000원',
        blurb: '샴페인 잔에 따르는 무알콜 스파클링. 다음 날 아침이 가벼운 쪽으로.',
        tone: 'gold',
      },
      {
        id: 'dec-2',
        brand: '델리 온도',
        category: '치즈 · 안주',
        offer: '홈파티 플래터 15% 할인',
        blurb: '3분이면 접시가 완성되는 겨울 플래터. 혼자 먹어도 남지 않는 양으로.',
        tone: 'forest',
      },
      {
        id: 'dec-3',
        brand: '서재의 밤',
        category: '독립출판',
        offer: '이번 달 책 10% + 엽서',
        blurb: '겨울에 오래 남는 문장을 고르는 출판사. 오늘의 밑줄을 대신 책갈피로.',
        tone: 'burgundy',
      },
    ],
    book: {
      title: '작별하지 않는다',
      author: '한강',
      publisher: '문학동네',
      why: '눈과 바다, 그리고 오래 남는 침묵. 겨울밤에 천천히 읽기 좋은 문장들.',
    },
    film: {
      title: '러브 액츄얼리',
      year: '2003',
      runtime: '135분',
      why: '결말을 아는 영화를 다시 보는 이유는, 함께 웃을 장면을 알기 때문입니다.',
    },
    playlist: [
      { mood: 'lofi', title: '벽난로 앞, 로우파이', detail: '말이 적어지는 21시의 배경' },
      { mood: 'jazz', title: '12시의 피아노', detail: '재즈 트리오, 낮은 볼륨' },
      { mood: 'party', title: '샴페인 타임', detail: '건배 직전에만 올리는 비트' },
    ],
  },
  {
    id: 'jan',
    month: 1,
    monthLabel: '1월',
    en: 'January',
    title: '새해 복주머니 & 떡국 파티',
    subtitle: '한 그릇의 떡국으로, 올해의 첫 인사를 나눕니다',
    dateISO: '2027-01-09T19:00:00+09:00',
    dateLabel: '1.09',
    weekday: '토요일',
    timeLabel: '19:00 – 22:00',
    place: '온라인 · 딩동 파티홀',
    dressCode: '따뜻한 색 한 가지',
    description:
      '새해 첫 파티는 조금 이릅니다. 각자 떡국 한 그릇을 끓여 들고 와서, 올해 하고 싶은 일 세 줄을 나눕니다. 복주머니에는 새해를 응원하는 작은 문장이 들어 있습니다.',
    heroImg: '/img/hero-january.jpg',
    heroAlt: '새해 떡국 상차림',
    accent: 'forest',
    quote: '올해의 첫 인사는, 가장 편한 사람에게 먼저.',
    program: [
      { time: '18:30', title: '문 열림 · 차 한 잔', detail: '떡국이 끓는 동안 대추차로 몸을 데웁니다.' },
      { time: '19:00', title: '복주머니 개봉', detail: '새해를 응원하는 문장 카드.' },
      { time: '19:30', title: '떡국 한 그릇', detail: '각자의 그릇을 화면에 놓고, 첫 숟가락을 함께 뜹니다.' },
      { time: '20:10', title: '올해의 세 줄', detail: '하고 싶은 일, 그만하고 싶은 일, 미뤄둔 일. 각 세 줄씩.' },
      { time: '21:00', title: '취향방 오픈', detail: '독서 · 영화 · 플레이리스트가 새해 첫 주제로 다시 열립니다.' },
      { time: '21:40', title: '스폰서 룰렛', detail: '새해 운세 대신, 오늘의 선물.' },
    ],
    menu: [
      { name: '떡국 한 그릇', detail: '사골 대신 멸치·다시마 육수로 가볍게', pairing: '식혜' },
      { name: '김치만두 세 알', detail: '찜기에 8분', pairing: '막걸리 한 사발 · 논알콜 탄산' },
      { name: '해물전 한 장', detail: '부침가루 없이 계란만', pairing: '동동주' },
      { name: '식혜와 유자차', detail: '논알콜 코스', pairing: '논알콜' },
    ],
    hosts: [
      { name: '딩동지기', role: '호스트', line: '새해 계획은 세 줄이면 충분해요. 네 줄부터는 부담이 됩니다.' },
      { name: '책갈피', role: '독서방 지기', line: '올해 첫 책은 얇은 걸로. 끝까지 읽는 경험이 필요하니까요.' },
      { name: '골드문', role: '영화방 지기', line: '새해 첫 영화는 후회 없는 걸로 고릅니다. 제가 후보를 준비했어요.' },
    ],
    sponsors: [
      {
        id: 'jan-1',
        brand: '온기떡집',
        category: '떡 · 한과',
        offer: '떡국떡 2인분 쿠폰',
        blurb: '쌀을 오래 불려 만든 떡. 끓여도 풀어지지 않아 첫 숟가락이 예쁩니다.',
        tone: 'forest',
      },
      {
        id: 'jan-2',
        brand: '카페 느린오후',
        category: '차 · 커피',
        offer: '대추차 티백 5입 샘플',
        blurb: '설탕 없이 달큰한 대추차. 손이 시린 밤에 두 잔.',
        tone: 'gold',
      },
      {
        id: 'jan-3',
        brand: '종이정원',
        category: '문구',
        offer: '새해 다이어리 20% 할인',
        blurb: '한 해를 세 줄씩 적을 수 있는 다이어리. 칸이 넓지 않은 게 장점입니다.',
        tone: 'burgundy',
      },
    ],
    book: {
      title: '지구 끝의 온실',
      author: '김초엽',
      publisher: '자이언트북스',
      why: '새해에 읽기 좋은, 끝나지 않은 세계에 대한 이야기. 밤에 한 챕터씩.',
    },
    film: {
      title: '소울',
      year: '2020',
      runtime: '106분',
      why: '올해의 목표를 세우기 전에, 이미 가진 것을 세어보게 되는 영화.',
    },
    playlist: [
      { mood: 'lofi', title: '새해의 첫 아침', detail: '낮은 현악과 피아노' },
      { mood: 'jazz', title: '조용한 다짐', detail: '스탠더드 재즈, 목소리 없이' },
      { mood: 'party', title: '복주머니 룰렛', detail: '룰렛이 돌 때만' },
    ],
  },
  {
    id: 'feb',
    month: 2,
    monthLabel: '2월',
    en: 'February',
    title: '발렌타인 심야 시네마',
    subtitle: '불을 끄고, 같은 영화의 같은 장면에서 웃습니다',
    dateISO: '2027-02-13T21:00:00+09:00',
    dateLabel: '2.13',
    weekday: '토요일',
    timeLabel: '21:00 – 24:00',
    place: '온라인 · 딩동 시네마',
    dressCode: '가장 편한 담요',
    description:
      '발렌타인의 전날 밤, 각자 집에서 같은 영화를 동시에 재생합니다. 누군가와 보는 게 아니어도 괜찮습니다. 채팅창에 장면이 하나씩 쌓이고, 자정에는 각자의 해석이 남습니다.',
    heroImg: '/img/hero-february.jpg',
    heroAlt: '심야 시네마 준비',
    accent: 'burgundy',
    quote: '같이 보지 않아도, 같은 장면에서 웃을 수 있습니다.',
    program: [
      { time: '20:40', title: '문 열림 · 스포일러 주의', detail: '스포일러 토글을 켜지 않으면 결말 관련 대화는 흐려집니다.' },
      { time: '21:00', title: '동시 재생', detail: '각자 준비한 영화를 같은 시각에 시작합니다.' },
      { time: '22:20', title: '중간 휴식', detail: '핫초코를 데우고, 지금까지의 장면을 한 줄로.' },
      { time: '23:30', title: '엔딩 토크', detail: '좋았던 장면 하나, 이해가 안 된 장면 하나.' },
      { time: '23:50', title: '마지막 쪽지', detail: '오늘 대화에서 마음이 닿은 사람에게 짧은 인사.' },
    ],
    menu: [
      { name: '핫초코 두 잔', detail: '다크 초콜릿 70%에 우유 반, 소금 한 꼬집', pairing: '논알콜' },
      { name: '소금 팝콘', detail: '버터 대신 올리브오일', pairing: '스파클링 워터' },
      { name: '딸기와 생크림', detail: '설탕 없이', pairing: '로제 한 잔' },
      { name: '캐모마일 티', detail: '영화가 끝난 뒤', pairing: '논알콜' },
    ],
    hosts: [
      { name: '딩동지기', role: '호스트', line: '오늘은 혼자인 게 티나지 않게, 조명만 낮추면 됩니다.' },
      { name: '골드문', role: '시네마 지기', line: '결말 이야기는 꼭 스포일러 토글을 켜고 해주세요. 그게 유일한 규칙입니다.' },
      { name: '재즈바11', role: '라운지 지기', line: '엔딩 크레딧에 어울리는 노래를 준비해뒀어요.' },
    ],
    sponsors: [
      {
        id: 'feb-1',
        brand: '코코아빈 스튜디오',
        category: '초콜릿',
        offer: '미니 초콜릿 박스 응모',
        blurb: '카카오 함량별로 나눈 다섯 조각. 두 조각씩 나눠 먹기 좋은 크기.',
        tone: 'burgundy',
      },
      {
        id: 'feb-2',
        brand: '문라이트 시네마 클럽',
        category: '영화 · 굿즈',
        offer: '클래식 영화 엽서 세트',
        blurb: '크레딧이 올라갈 때의 여운을 엽서로 남기는 클럽.',
        tone: 'forest',
      },
      {
        id: 'feb-3',
        brand: '아뜰리에 이파리',
        category: '플라워',
        offer: '겨울 가지 꽃다발 10% 할인',
        blurb: '장미 대신 가지와 열매. 일주일이 지나도 예쁜 쪽으로.',
        tone: 'gold',
      },
    ],
    book: {
      title: '밝은 밤',
      author: '최은영',
      publisher: '문학동네',
      why: '사랑보다 넓은 마음에 대한 소설. 영화가 끝난 뒤 한 챕터.',
    },
    film: {
      title: '이터널 선샤인',
      year: '2004',
      runtime: '108분',
      why: '잊는 것과 견디는 것 사이. 두 번 보면 다른 영화가 됩니다.',
    },
    playlist: [
      { mood: 'lofi', title: '크레딧이 오르는 동안', detail: '낮은 피아노, 긴 여백' },
      { mood: 'jazz', title: '자정의 재즈', detail: '엔딩 토크용' },
      { mood: 'party', title: '발렌타인 룰렛', detail: '선물을 돌릴 때만' },
    ],
  },
]

export interface CalendarEntry {
  id: string
  dateISO: string
  label: string
  title: string
  detail: string
  kind: 'main' | 'special' | 'weekly'
  partyId?: string
}

export const CALENDAR: CalendarEntry[] = [
  {
    id: 'c-dec24',
    dateISO: '2026-12-24T21:00:00+09:00',
    label: '12.24 목',
    title: '크리스마스 이브 홈파티',
    detail: '21:00 · 네 개의 방 + 스폰서 룰렛',
    kind: 'main',
    partyId: 'dec',
  },
  {
    id: 'c-dec31',
    dateISO: '2026-12-31T23:00:00+09:00',
    label: '12.31 목',
    title: '송년의 밤 · 카운트다운',
    detail: '23:00 · 올해의 마지막 잔과 세 줄',
    kind: 'special',
  },
  {
    id: 'c-jan9',
    dateISO: '2027-01-09T19:00:00+09:00',
    label: '1.09 토',
    title: '새해 복주머니 & 떡국 파티',
    detail: '19:00 · 떡국 한 그릇 + 올해의 세 줄',
    kind: 'main',
    partyId: 'jan',
  },
  {
    id: 'c-feb6',
    dateISO: '2027-02-06T19:00:00+09:00',
    label: '2.06 토',
    title: '설날 떡국 파티 (추가 회차)',
    detail: '19:00 · 설 당일, 가족 대신 딩동과',
    kind: 'special',
  },
  {
    id: 'c-feb13',
    dateISO: '2027-02-13T21:00:00+09:00',
    label: '2.13 토',
    title: '발렌타인 심야 시네마',
    detail: '21:00 · 동시 재생 + 엔딩 토크',
    kind: 'main',
    partyId: 'feb',
  },
  {
    id: 'c-weekly',
    dateISO: '2026-11-25T21:00:00+09:00',
    label: '매일',
    title: '21시 혼술 타임 · 취향방',
    detail: '매일 21:00 – 24:00 · 네 개의 방 상시 오픈',
    kind: 'weekly',
  },
]

export const MONTH_TABS = PARTIES.map((party) => ({
  id: party.id,
  monthLabel: party.monthLabel,
  en: party.en,
  title: party.title,
  dateISO: party.dateISO,
}))
