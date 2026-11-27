import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

const WEEK = ['일', '월', '화', '수', '목', '금', '토']
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`
const todayISO = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })

function label(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  const day = WEEK[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${m}월 ${d}일 (${day})`
}

/** 브라우저 기본 검은 날짜칸 대신 딩동 종이 달력. */
export function CraftDatePicker({ value, onChange, label: ariaLabel }: { value: string; onChange: (next: string) => void; label: string }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(value.slice(0, 7))
  const [y, m] = view.split('-').map(Number)
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay()
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const today = todayISO()

  function shift(delta: number) {
    const next = new Date(Date.UTC(y, m - 1 + delta, 1))
    setView(`${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}`)
  }

  return (
    <div className="dd-datepicker">
      <button
        type="button"
        className="dd-datepicker-field"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => { setView(value.slice(0, 7)); setOpen((v) => !v) }}
      >
        <CalendarDays size={15} />
        <span>{label(value)}</span>
      </button>
      {open && (
        <div className="dd-datepicker-pop" role="dialog" aria-label="날짜 고르기">
          <header>
            <button type="button" aria-label="이전 달" onClick={() => shift(-1)}><ChevronLeft size={16} /></button>
            <strong>{y}년 {m}월</strong>
            <button type="button" aria-label="다음 달" onClick={() => shift(1)}><ChevronRight size={16} /></button>
          </header>
          <div className="dd-datepicker-week" aria-hidden="true">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
          <div className="dd-datepicker-grid" role="group" aria-label={`${y}년 ${m}월`}>
            {Array.from({ length: first }, (_, i) => <span key={'e' + i} />)}
            {Array.from({ length: last }, (_, i) => {
              const day = i + 1
              const date = iso(y, m, day)
              return (
                <button
                  key={date}
                  type="button"
                  data-date={date}
                  aria-pressed={date === value}
                  aria-label={`${m}월 ${day}일`}
                  className={date === today ? 'is-today' : undefined}
                  onClick={() => { onChange(date); setOpen(false) }}
                >
                  {day}
                </button>
              )
            })}
          </div>
          <footer>
            <button type="button" onClick={() => { onChange(today); setOpen(false) }}>오늘로</button>
            <button type="button" onClick={() => setOpen(false)}>닫기</button>
          </footer>
        </div>
      )}
    </div>
  )
}
