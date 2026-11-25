import { Bell, BellRing, CalendarDays, Check, Download, Sparkles } from 'lucide-react'
import type { PartyEvent } from '../types'
import { CALENDAR } from '../data/themes'
import { countdownTo } from '../lib/dates'
import { SectionHead } from './ui'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function monthDays(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1)
  const total = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array.from({ length: first.getDay() }, () => null)
  for (let day = 1; day <= total; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function CalendarSection({
  parties,
  now,
  rsvps,
  alarms,
  onToggleAlarm,
  onRsvp,
  onDownload,
  onSelectParty,
}: {
  parties: PartyEvent[]
  now: number
  rsvps: Record<string, boolean>
  alarms: Record<string, boolean>
  onToggleAlarm: (id: string) => void
  onRsvp: (id: string) => void
  onDownload: (party: PartyEvent) => void
  onSelectParty: (id: string) => void
}) {
  const months = [
    { year: 2026, month: 11, label: '2026년 12월' },
    { year: 2027, month: 0, label: '2027년 1월' },
    { year: 2027, month: 1, label: '2027년 2월' },
  ]

  return (
    <section id="calendar" className="px-5 py-16 sm:px-8 sm:py-20" style={{ borderTop: '1px solid var(--line)' }}>
      <div className="mx-auto max-w-[1280px]">
        <SectionHead
          kicker="Party Calendar"
          title={
            <>
              다가오는 밤들을
              <br className="sm:hidden" /> 미리 달력에 적어둡니다
            </>
          }
          description="12월부터 2월까지. 메인 파티 세 번과 그 사이의 작은 밤들. 알림은 이 브라우저에 저장되고, 파티 당일 살롱 입장 화면에서 먼저 보여드려요."
        />

        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {months.map((item) => {
              const cells = monthDays(item.year, item.month)
              const marks = CALENDAR.filter((entry) => {
                const date = new Date(entry.dateISO)
                return date.getFullYear() === item.year && date.getMonth() === item.month && entry.kind !== 'weekly'
              })
              return (
                <div key={item.label} className="card p-4">
                  <p className="serif text-[14px]">{item.label}</p>
                  <div className="mt-3 grid grid-cols-7 gap-y-1.5 text-center">
                    {WEEKDAYS.map((day, index) => (
                      <span key={day} className="text-[9.5px]" style={{ color: index === 0 ? 'var(--burgundy)' : 'var(--muted)' }}>
                        {day}
                      </span>
                    ))}
                    {cells.map((day, index) => {
                      if (!day) return <span key={`empty-${index}`} />
                      const entry = marks.find((mark) => new Date(mark.dateISO).getDate() === day)
                      const isMain = entry?.kind === 'main'
                      const isSpecial = entry?.kind === 'special'
                      return (
                        <button
                          key={`${item.label}-${day}`}
                          type="button"
                          disabled={!entry?.partyId}
                          onClick={() => {
                            if (!entry?.partyId) return
                            onSelectParty(entry.partyId)
                          }}
                          className="relative mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px] transition-colors"
                          style={{
                            background: isMain ? 'var(--gold)' : 'transparent',
                            border: isSpecial ? '1px solid var(--gold)' : '1px solid transparent',
                            color: isMain ? '#211804' : 'var(--ink-soft)',
                            fontWeight: isMain ? 600 : 400,
                            cursor: entry?.partyId ? 'pointer' : 'default',
                          }}
                          title={entry ? `${entry.title} · ${entry.detail}` : undefined}
                          aria-label={entry ? `${day}일 ${entry.title}` : `${day}일`}
                        >
                          {day}
                          {entry && !isMain && (
                            <span className="absolute bottom-0 h-[2px] w-[2px] rounded-full" style={{ background: 'var(--gold)' }} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2.5 text-[8.5px]" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--gold)' }} />메인 파티</span>
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full border" style={{ borderColor: 'var(--gold)' }} />작은 밤</span>
                  </p>
                </div>
              )
            })}
          </div>

          <div className="card-soft mt-4 flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="kicker text-[8px]">Every night</p>
                <p className="serif mt-1 text-[14px]">파티가 없는 밤에도, 21시에 문을 엽니다</p>
              </div>
              <a href="#rooms" className="shrink-0 text-[10.5px] underline underline-offset-4" style={{ color: 'var(--muted)' }}>
                취향방 보기
              </a>
            </div>
            <p className="text-[10.5px] leading-[1.8]" style={{ color: 'var(--muted)' }}>
              혼술 타임 · 심야 독서 토론 · 같이 보는 영화관 · 플레이리스트 라운지. 네 개의 방은 매일 21:00부터 24:00까지 열려 있습니다.
            </p>
          </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="smallcaps" style={{ color: 'var(--muted)' }}>Upcoming</p>
              <span className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--muted)' }}>
                <CalendarDays size={11} />
                매일 21:00 취향방
              </span>
            </div>
            <ul className="mt-3">
              {CALENDAR.filter((entry) => entry.kind !== 'weekly').map((entry) => {
                const party = entry.partyId ? parties.find((item) => item.id === entry.partyId) : undefined
                const cd = countdownTo(entry.dateISO, now)
                const isPast = cd.past
                const rsvped = party ? rsvps[party.id] : false
                const alarmed = Boolean(alarms[entry.id])
                return (
                  <li key={entry.id} className="border-t py-4 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="serif text-[11.5px] tabular-nums" style={{ color: 'var(--burgundy)' }}>{entry.label}</span>
                          <span className="kicker text-[7.5px]">{entry.kind === 'main' ? 'Main' : 'Special'}</span>
                          {!isPast && (
                            <span className="text-[9.5px]" style={{ color: 'var(--muted)' }}>D-{cd.days}</span>
                          )}
                        </div>
                        <p className="serif mt-1 truncate text-[14.5px]">{entry.title}</p>
                        <p className="mt-0.5 text-[10.5px]" style={{ color: 'var(--muted)' }}>{entry.detail}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {party && (
                          <button
                            type="button"
                            onClick={() => onRsvp(party.id)}
                            className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9.5px]"
                            style={{
                              borderColor: rsvped ? 'var(--forest)' : 'var(--line-strong)',
                              background: rsvped ? 'var(--forest)' : 'transparent',
                              color: rsvped ? 'var(--forest-ink)' : 'var(--ink-soft)',
                            }}
                            aria-pressed={rsvped}
                          >
                            {rsvped ? <Check size={10} /> : <Sparkles size={10} />}
                            {rsvped ? '예약됨' : '초대장'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onToggleAlarm(entry.id)}
                          className="flex items-center gap-1 text-[9.5px]"
                          style={{ color: alarmed ? 'var(--burgundy)' : 'var(--muted)' }}
                          aria-pressed={alarmed}
                        >
                          {alarmed ? <BellRing size={10} /> : <Bell size={10} />}
                          {alarmed ? '알림 신청됨' : '알림 신청'}
                        </button>
                        {party && (
                          <button type="button" onClick={() => onDownload(party)} className="flex items-center gap-1 text-[9.5px]" style={{ color: 'var(--muted)' }}>
                            <Download size={10} />
                            캘린더
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="mt-2 text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              2027년 설날은 2월 6일(토)이라, 1월 파티와 별도로 ‘설날 떡국 파티’를 한 번 더 엽니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
