/* 로렌 정본 365일 편성(content/dingdong/365-events-v1.json)과
   월별 축제·주간 편성·크리스마스 상세(content-master-v1.json)을 화면에 잇는 어댑터.

   365일 파일의 mode='content_proposal'은 '아직 개설 접수 중이 아니다'라는 정본 표시를
   그대로 보존한다. 화면에서도 실제 참가자·진행 여부를 표시하지 않는다.
   실제 음력 명절은 data/dingdong.ts의 연도별 검증 날짜로 덮어쓴다. */
import EVENTS from '../../content/dingdong/365-events-v1.json'
import MASTER from '../../content/dingdong/content-master-v1.json'
import { LUNAR_FESTIVALS } from './dingdong'

export interface DayEvent {
  id: string
  month: number
  day: number
  title: string
  space: string
  activity: string
  /** 정본 표시: content_proposal = 콘텐츠 제안(개설 접수 아님) */
  mode: string
  source: '365' | 'lunar' | 'leap'
}

interface RawEvent {
  id: string
  month: number
  day: number
  title: string
  space: string
  activity: string
  mode: string
}

const RAW: RawEvent[] = (EVENTS as { events: RawEvent[] }).events
const LEAP = (EVENTS as { leap_day: { title: string; space: string; activity: string } }).leap_day

export const MONTHS: { month: number; title: string; events: string[]; free_items: string[] }[] = (
  MASTER as { months: { month: number; title: string; events: string[]; free_items: string[] }[] }
).months

export const WEEKLY: { day: string; daytime: string; evening: string }[] = (
  MASTER as { weekly: { day: string; daytime: string; evening: string }[] }
).weekly

export const CHRISTMAS = (MASTER as {
  christmas: { title: string; story: string; schedule: { period: string; program: string }[]; activities: string[] }
}).christmas

/** 서울 날짜(YYYY-MM-DD). 브라우저 시간대와 무관하게 같은 날짜를 쓴다. */
export function seoulDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  return ['year', 'month', 'day'].map((k) => parts.find((p) => p.type === k)?.value ?? '').join('-')
}

export function seoulParts(date = new Date()): { year: number; month: number; day: number; weekday: number } {
  const [year, month, day] = seoulDate(date).split('-').map(Number)
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return { year, month, day, weekday }
}

/** 서울 날짜의 365일 행사. 윤년 2/29와 검증된 음력 명절이 우선한다. */
export function dayEvent(date = new Date()): DayEvent {
  const { year, month, day } = seoulParts(date)
  const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const lunar = LUNAR_FESTIVALS[key]
  if (lunar) {
    return {
      id: `lunar-${key}`,
      month,
      day,
      title: lunar.name,
      space: lunar.space,
      activity: lunar.prompt,
      mode: 'official_calendar',
      source: 'lunar',
    }
  }
  if (month === 2 && day === 29) {
    return { id: `leap-${year}`, month, day, title: LEAP.title, space: LEAP.space, activity: LEAP.activity, mode: 'content_proposal', source: 'leap' }
  }
  const found = RAW.find((e) => e.month === month && e.day === day)
  if (found) {
    return {
      id: found.id,
      month: found.month,
      day: found.day,
      title: found.title,
      space: found.space,
      activity: found.activity,
      mode: found.mode,
      source: '365',
    }
  }
  // 365일 파일은 평년 365개다. 값이 비면 날짜만 알려 주고 행사를 만들지 않는다.
  return { id: `none-${key}`, month, day, title: '', space: 'plaza', activity: '', mode: 'none', source: '365' }
}

/** 앞으로 n일의 365일 행사(오늘 포함). */
export function upcomingEvents(days = 7, from = new Date()): DayEvent[] {
  const out: DayEvent[] = []
  for (let i = 0; i < days; i += 1) {
    const next = new Date(from.getTime() + i * 86_400_000)
    out.push(dayEvent(next))
  }
  return out
}

export function monthlyFestival(month: number) {
  return MONTHS.find((m) => m.month === month)
}

export function weeklyPlan(weekday: number) {
  return WEEKLY[weekday] ?? WEEKLY[0]
}

/** 12월 크리스마스 상세 편성(정본 christmas.schedule). period는 '12/1~6' 형식이다. */
export function christmasPeriod(day: number): { period: string; program: string } | undefined {
  return CHRISTMAS.schedule.find((slot) => {
    const match = slot.period.match(/^12\/(\d+)(?:~(\d+))?$/)
    if (!match) return false
    const start = Number(match[1])
    const end = match[2] ? Number(match[2]) : start
    return day >= start && day <= end
  })
}

export function isChristmasSeason(date = new Date()): boolean {
  return seoulParts(date).month === 12
}

/** 생일 축하: 'MM-DD' 형식. 오늘과 같으면 true. */
export function isBirthdayToday(birthday: string | undefined, date = new Date()): boolean {
  if (!birthday) return false
  const match = birthday.match(/(\d{2})-(\d{2})$/)
  if (!match) return false
  const { month, day } = seoulParts(date)
  return Number(match[1]) === month && Number(match[2]) === day
}

/** 12월 25일 '비밀 산타 선물 공개' 등 오늘의 크리스마스 활동. */
export function christmasToday(day: number): string | undefined {
  return christmasPeriod(day)?.program
}
