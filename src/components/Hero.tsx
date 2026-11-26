import { RoomArtwork } from './MansionArt'
import { SPACES } from '../data/dingdong'
import { CalendarPlus, Check, ChevronRight, Clock3, MapPin, Sparkles } from 'lucide-react'
import type { PartyEvent, Profile } from '../types'
import { countdownTo, pad } from '../lib/dates'
import { Avatar } from './Avatar'
import { MONTH_TABS } from '../data/themes'

export function Hero({
  party,
  now,
  profile,
  rsvp,
  onMonthChange,
  onRsvp,
  onDownload,
  onExploreRooms,
  onBrandKit,
  showCommercial = false,
}: {
  party: PartyEvent
  now: number
  profile: Profile
  rsvp: boolean
  onMonthChange: (id: string) => void
  onRsvp: () => void
  onDownload: () => void
  onExploreRooms: () => void
  onBrandKit: () => void
  showCommercial?: boolean
}) {
  const cd = countdownTo(party.dateISO, now)
  const dday = cd.past ? `D+${cd.days}` : `D-${cd.days}`

  return (
    <section id="party" className="relative overflow-hidden px-5 pt-8 sm:px-8 sm:pt-12">
      <div className="mx-auto max-w-[1280px]">
        {/* 월 전환 */}
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b pb-0" style={{ borderColor: 'var(--line)' }}>
          {MONTH_TABS.map((tab) => {
            const active = tab.id === party.id
            const tabCd = countdownTo(tab.dateISO, now)
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onMonthChange(tab.id)}
                aria-pressed={active}
                className="group relative flex min-w-[86px] flex-1 items-end justify-between gap-3 px-2.5 pb-3.5 pt-2 text-left transition-colors sm:min-w-[150px] sm:px-4"
                style={{ color: active ? 'var(--ink)' : 'var(--muted)' }}
              >
                <span className="flex items-baseline gap-2.5">
                  <span className="serif text-[26px] leading-none sm:text-[30px]" style={{ color: active ? 'var(--gold)' : 'inherit' }}>
                    {String(tab.monthLabel).replace('월', '')}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="kicker hidden text-[8.5px] tracking-[0.22em] sm:block">{tab.en}</span>
                    <span className="text-[12px] sm:text-[12.5px]" style={{ fontWeight: active ? 600 : 400 }}>
                      <span className="sm:hidden">{tab.monthLabel}</span>
                      <span className="hidden sm:inline">{tab.title}</span>
                    </span>
                  </span>
                </span>
                <span className="hidden text-[10px] sm:block" style={{ opacity: 0.7 }}>
                  {tabCd.past ? '지난 파티' : `D-${tabCd.days}`}
                </span>
                <span
                  className="absolute inset-x-0 bottom-[-1px] h-[2px] transition-opacity"
                  style={{ background: 'var(--gold)', opacity: active ? 1 : 0 }}
                />
              </button>
            )
          })}
          <span className="ml-auto hidden shrink-0 items-center gap-1.5 pb-3.5 pl-4 text-[10.5px] sm:flex" style={{ color: 'var(--muted)' }}>
            <span className="live-dot" />
            12개 공간 · 개발 체험판
          </span>
        </div>

        <div className="grid gap-10 pt-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-12">
          <div className="animate-fade-up">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="kicker" style={{ color: 'var(--burgundy)' }}>
                {party.en} · DINGDONG PARTY
              </span>
              <span className="h-3 w-px" style={{ background: 'var(--line-strong)' }} />
              <span className="text-[10.5px]" style={{ color: 'var(--muted)' }}>
                온라인 · 오픈 전 프리뷰
              </span>
            </div>

            <h1 className="serif mt-4 text-[34px] leading-[1.28] tracking-[-0.04em] sm:text-[46px] lg:text-[54px]">
              {party.title}
            </h1>
            <p className="serif mt-3 text-[15px] leading-[1.7] sm:text-[17px]" style={{ color: 'var(--ink-soft)' }}>
              {party.subtitle}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]" style={{ color: 'var(--muted)' }}>
              <span className="flex items-center gap-1.5">
                <Clock3 size={13} />
                {party.dateLabel} {party.weekday} · {party.timeLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {party.place}
              </span>
            </div>

            <p className="mt-5 max-w-[46ch] text-[13.5px] leading-[1.9]" style={{ color: 'var(--ink-soft)' }}>
              {party.description}
            </p>

            {/* 카운트다운 */}
            <div className="mt-7">
              <div className="flex items-center gap-3">
                <span
                  className="serif flex h-[46px] min-w-[46px] items-center justify-center rounded-full px-3 text-[15px]"
                  style={{ background: 'var(--forest)', color: 'var(--forest-ink)' }}
                >
                  {dday}
                </span>
                <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {cd.past ? '파티가 열렸어요. 지금 입장할 수 있습니다.' : '다음 파티까지'}
                </span>
              </div>
              <div className="mt-3 grid max-w-md grid-cols-4 gap-2">
                {[
                  { value: cd.days, label: '일' },
                  { value: cd.hours, label: '시간' },
                  { value: cd.minutes, label: '분' },
                  { value: cd.seconds, label: '초' },
                ].map((cell) => (
                  <div
                    key={cell.label}
                    className="card flex flex-col items-center justify-center py-3"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    <span className="serif text-[24px] leading-none tabular-nums sm:text-[27px]">{pad(cell.value)}</span>
                    <span className="kicker mt-1.5 text-[8px] tracking-[0.18em]">{cell.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <button type="button" onClick={onRsvp} className="btn btn-primary">
                {rsvp ? <Check size={15} /> : <Sparkles size={15} />}
                {rsvp ? '초대장을 예약했어요' : '초대장 예약하기'}
              </button>
              <button type="button" onClick={onDownload} className="btn btn-outline">
                <CalendarPlus size={15} />
                캘린더에 저장
              </button>
              <button type="button" onClick={onExploreRooms} className="btn btn-ghost">
                12개 공간 둘러보기
                <ChevronRight size={15} />
              </button>
            </div>
            <p className="mt-3 text-[10.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {rsvp
                ? `${party.dateLabel} ${party.weekday} 20:30, 딩동에 들어오면 예약한 초대장이 먼저 보여요. (이 브라우저에 저장)`
                : '예약은 이 브라우저에 저장됩니다. 회원가입도 결제도 없어요.'}
            </p>

            <div className="mt-8 flex items-start gap-3 border-l-2 pl-4" style={{ borderColor: 'var(--gold)' }}>
              <p className="serif text-[14px] leading-[1.8]" style={{ color: 'var(--ink-soft)' }}>
                “{party.quote}”
              </p>
            </div>
          </div>

          {/* 이미지 */}
          <div className="relative animate-fade-up">
            <div className="relative overflow-hidden" style={{ borderRadius: 2, boxShadow: 'var(--shadow)' }}>
              <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(180deg, rgba(20,26,22,0) 45%, rgba(20,26,22,0.55) 100%)' }} />
              <div className="aspect-[4/5] flex items-center justify-center bg-[#e5d6c3] sm:aspect-[5/5.4] lg:aspect-[4/4.7]"><RoomArtwork space={SPACES.find(s=>s.id===(party.id==='dec'?'season':party.id==='feb'?'cinema':'plaza'))!} className="w-full" /></div>
              <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] tracking-[0.14em] uppercase" style={{ background: 'rgba(20,26,22,0.55)', color: '#F7F1E6', backdropFilter: 'blur(6px)' }}>
                <span className="live-dot" style={{ background: '#E3C98F' }} />
                {party.monthLabel}의 밤
              </div>

              <div className="absolute inset-x-4 bottom-4 z-20 sm:inset-x-5 sm:bottom-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="kicker text-[8.5px]" style={{ color: '#E3C98F' }}>Dress code</p>
                    <p className="serif mt-1 text-[15px]" style={{ color: '#F7F1E6' }}>{party.dressCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="kicker text-[8.5px]" style={{ color: 'rgba(247,241,230,0.65)' }}>Host</p>
                    <p className="mt-1 text-[12px]" style={{ color: '#F7F1E6' }}>{party.hosts[0].name}</p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="absolute -left-3 top-[52%] z-20 hidden w-[218px] p-3.5 sm:block"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--shadow)', borderRadius: 2 }}
            >
              <p className="kicker text-[8px]">이번 달의 상차림</p>
              <p className="serif mt-1.5 text-[13px] leading-snug">{party.menu[0].name}</p>
              <p className="mt-1 text-[10.5px]" style={{ color: 'var(--muted)' }}>{party.menu[0].pairing}</p>
              <div className="mt-2.5 flex items-center gap-1.5 border-t pt-2.5" style={{ borderColor: 'var(--line)' }}>
                <Avatar name={profile.avatar} size={20} ring />
                <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                  {profile.nickname}님의 자리가 준비돼 있어요
                </span>
              </div>
            </div>

            {showCommercial && <button
              type="button"
              onClick={onBrandKit}
              className="mt-4 flex w-full items-center justify-between gap-4 border px-4 py-3 text-left transition-colors hover:bg-black/[0.02]"
              style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}
            >
              <span className="flex items-center gap-2.5">
                <span className="kicker text-[8.5px]">Sponsored by</span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]" style={{ color: 'var(--ink-soft)' }}>
                  {party.sponsors.map((sponsor) => (
                    <span key={sponsor.id} className="after:ml-2 after:content-['·'] last:after:content-['']">
                      {sponsor.brand}
                    </span>
                  ))}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[10.5px]" style={{ color: 'var(--muted)' }}>
                협찬 안내
                <ChevronRight size={12} />
              </span>
            </button>}
          </div>
        </div>
      </div>
    </section>
  )
}
