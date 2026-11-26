export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
  past: boolean
}

export function countdownTo(iso: string, now: number = Date.now()): Countdown {
  const target = new Date(iso).getTime()
  const total = target - now
  const past = total <= 0
  const abs = Math.abs(total)
  const days = Math.floor(abs / 86_400_000)
  const hours = Math.floor((abs % 86_400_000) / 3_600_000)
  const minutes = Math.floor((abs % 3_600_000) / 60_000)
  const seconds = Math.floor((abs % 60_000) / 1000)
  return { days, hours, minutes, seconds, total, past }
}

export function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

export function koreanDate(iso: string): string {
  const date = new Date(iso)
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}요일`
}

export function stamp(at: Date = new Date()): string {
  return `${pad(at.getHours())}:${pad(at.getMinutes())}`
}

export function stampWithDay(iso: string): string {
  const date = new Date(iso)
  return `${date.getMonth() + 1}.${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function icsDate(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(
    date.getUTCMinutes(),
  )}${pad(date.getUTCSeconds())}Z`
}

export interface IcsEvent {
  id: string
  title: string
  dateISO: string
  durationHours?: number
  description: string
  location: string
}

export function buildICS(event: IcsEvent): string {
  const start = new Date(event.dateISO)
  const end = new Date(start.getTime() + (event.durationHours ?? 3) * 3_600_000)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DINGDONG//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@monthlysalon.kr`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, ' ')}`,
    `LOCATION:${event.location}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:딩동 파티 30분 전',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

export function downloadText(filename: string, text: string, mime = 'text/calendar'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function hash(input: string): number {
  let value = 0
  for (let i = 0; i < input.length; i += 1) {
    value = (value * 31 + input.charCodeAt(i)) % 1_000_000_007
  }
  return value
}
