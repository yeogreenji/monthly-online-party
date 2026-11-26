import { useState } from 'react'
import { CalendarHeart } from 'lucide-react'
import { SPACES } from '../data/dingdong'
import { dailyEvent, dateLabel } from '../data/dailyEvents'

const toInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function DailyEventCard({ onVisit, fixedDate }: { onVisit?: (spaceId: string) => void; fixedDate?: Date }) {
  const [value, setValue] = useState(toInput(fixedDate ?? new Date()))
  const date = fixedDate ?? new Date(`${value}T12:00:00`)
  const ev = dailyEvent(date)
  const space = SPACES.find(s => s.id === ev.space)
  return (
    <section className="dd-daily-card" aria-label="오늘의 딩동 이벤트">
      <div className="dd-daily-head">
        <CalendarHeart size={18} />
        <strong>{fixedDate ? '이날의 딩동 이벤트' : '365일 이벤트'}</strong>
        {!fixedDate && (
          <input type="date" aria-label="날짜 선택" value={value} onChange={e => e.target.value && setValue(e.target.value)} />
        )}
      </div>
      <small>{dateLabel(date)}{ev.special ? ' · 기념일' : ''} · 기획 안내(시연)</small>
      <h4>{ev.title}</h4>
      <p>{ev.blurb}</p>
      {onVisit && space && space.id !== 'single' && space.id !== 'jazz' && (
        <button type="button" onClick={() => onVisit(space.id)}>{space.name} 가 보기 →</button>
      )}
      {!onVisit && space && <span className="dd-daily-place">장소: {space.name}</span>}
    </section>
  )
}
