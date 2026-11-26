import type { NotesState } from '../types'

/** 받은 쪽지 요청 2건은 오픈 전 프리뷰용 예시입니다. 수락하면 대화가 열리고 AI가 상대 역으로 답합니다. */
export const SEED_NOTES: NotesState = {
  incoming: [
    {
      id: 'n1',
      peer: {
        nickname: '밤의 서재',
        avatar: 'owl',
        ageBand: '30대',
        tags: ['독서', '논알콜', '재즈'],
        context: '오늘의 혼술 타임 · 21:40에 함께한 대화',
      },
      message: '아까 말한 논알콜 스파클링, 어디 브랜드인지 여쭤봐도 될까요? 다음 파티에 저도 준비해 가고 싶어서요.',
      at: '2026-11-25T22:35:00+09:00',
      status: 'pending',
    },
    {
      id: 'n2',
      peer: {
        nickname: '골드문',
        avatar: 'fox',
        ageBand: '40대',
        tags: ['영화', '와인', '사진'],
        context: '오늘의 영화관 · 22:30에 함께한 대화',
      },
      message: '영화 추천 감사했어요. 다음 주에 볼 작품 하나만 더 여쭤봐도 될까요? 스포일러는 없이요.',
      at: '2026-11-25T22:38:00+09:00',
      status: 'pending',
    },
  ],
  outgoing: [],
  threads: [],
}

export const NOTE_REASONS = [
  '불쾌한 언행 · 비하',
  '성적 접근 · 원치 않는 연락',
  '광고 · 홍보 목적',
  '연락처 · 개인정보 요구',
  '기타',
]

export interface Package {
  id: string
  name: string
  en: string
  price: string
  priceNote: string
  slots: string
  color: 'forest' | 'gold' | 'burgundy'
  summary: string
  included: string[]
  bestFor: string
}

export const PACKAGES: Package[] = [
  {
    id: 'main',
    name: '월간 메인 네이밍 스폰서',
    en: 'Main Naming Sponsor',
    price: '300만원',
    priceNote: '/ 월 · 부가세 별도',
    slots: '월 1개 브랜드',
    color: 'forest',
    summary: '그 달의 파티 이름 앞에 브랜드가 섭니다. 초대장부터 포토월까지 한 달 동안 같은 자리에서 보입니다.',
    included: [
      '파티 공식 명칭 병기 — "OO이 함께하는 12월 크리스마스 이브 홈파티"',
      '메인 히어로 배너 + 초대장 카드 로고',
      '파티 오프닝 15초 인사 (딩동지기 진행)',
      '포토월 프레임 브랜딩 + 해시태그',
      '네 개 취향방 상단 스폰서 카드 노출',
      '캠페인 종료 후 노출·참여 리포트 (PDF)',
    ],
    bestFor: '시즌 캠페인을 한 달 동안 한 자리에서 가져가고 싶은 브랜드',
  },
  {
    id: 'nine',
    name: '21시 타임 스폰서',
    en: '9PM Hour Sponsor',
    price: '100만원',
    priceNote: '/ 월 · 부가세 별도',
    slots: '월 2개 브랜드',
    color: 'gold',
    summary: '매일 밤 21시, 혼술 타임이 열리는 순간의 첫 화면. 반복 노출이 목적인 패키지입니다.',
    included: [
      '21시 혼술 타임 오프닝 5초 멘션 (주 5회)',
      '혼술방 상단 스폰서 카드 + 안주 페어링 큐레이션 1회',
      '쿠폰 코드 발급 (발급 수 실시간 집계)',
      '신청곡 투표 하단 브랜드 한 줄',
      '주간 노출 리포트',
    ],
    bestFor: '편의점·주류·논알콜·안주·커피처럼 매일 소비되는 카테고리',
  },
  {
    id: 'roulette',
    name: '샘플링 & 경품 룰렛',
    en: 'Sampling & Roulette',
    price: '60만원',
    priceNote: '/ 회 · 부가세 별도',
    slots: '회차당 3개 브랜드',
    color: 'burgundy',
    summary: '파티 중반, 모두가 기다리는 룰렛 시간. 제품을 직접 써보게 하는 패키지입니다.',
    included: [
      '파티 룰렛 경품 1종 (브랜드 제공)',
      '응모 폼 + 당첨 안내 화면',
      '샘플링 후기 카드 포토월 노출',
      '당첨자 배송 정보는 브랜드가 직접 수령 (딩동 미보관)',
      '룰렛 참여 수·응모 전환 리포트',
    ],
    bestFor: '신제품을 써보게 하고 후기를 모으고 싶은 브랜드',
  },
]

export const AUDIENCE = [
  { label: '핵심 참여층', value: '3040 1인 가구', detail: '혼자 사는 직장인, 취향 소비에 지갑을 여는 층' },
  { label: '목표 월 참여자', value: '30,000명', detail: '2027 상반기 목표 · 오픈 전 지표' },
  { label: '목표 재방문율', value: '48%', detail: '주 2회 이상 재방문 기준' },
  { label: '목표 평균 체류', value: '34분', detail: '파티 회차 기준' },
]

export const FORMATS = [
  { name: '파티 메인 배너', detail: '홈 히어로 · 초대장 카드', spec: '1440×900 / 390×520' },
  { name: '취향방 스폰서 카드', detail: '네 개 방 상단 고정', spec: '640×200' },
  { name: '경품 룰렛', detail: '파티 중반 10분', spec: '룰렛·당첨 화면' },
  { name: '포토월 프레임', detail: '인증 사진 테두리 각인', spec: '1080×1080' },
  { name: '쪽지 에티켓 카드', detail: '첫 쪽지 발송 전 1회', spec: '480×320' },
  { name: '취향 큐레이션', detail: '안주·책·영화·플레이리스트', spec: '에디토리얼 1편' },
]

export const PROCESS = [
  { step: '01', title: '문의 접수', detail: '브랜드와 캠페인 목표를 남겨주시면 영업일 2일 내 회신합니다.' },
  { step: '02', title: '제안 · 일정 확정', detail: '희망 월과 상품을 조합한 제안서와 견적을 보내드립니다.' },
  { step: '03', title: '소재 검수', detail: '파티 콘셉트와 어긋나지 않는 선에서 소재를 함께 다듬습니다.' },
  { step: '04', title: '노출 · 리포트', detail: '캠페인 종료 후 노출·참여·쿠폰 사용 리포트를 전달합니다.' },
]

export const ADDONS = [
  { name: '포토월 프레임 브랜딩', price: '30만원 / 월' },
  { name: '쪽지 에티켓 카드', price: '20만원 / 월' },
  { name: '취향 큐레이션 콘텐츠', price: '40만원 / 편' },
]

export const CONTACT_EMAIL = 'partners@monthlysalon.kr'
