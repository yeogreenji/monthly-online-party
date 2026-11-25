import { BookOpen, Film, Music2, Sparkles, Utensils } from 'lucide-react'
import type { PartyEvent } from '../types'
import { Avatar } from './Avatar'
import { SectionHead } from './ui'

export function Program({ party }: { party: PartyEvent }) {
  return (
    <section id="program" className="px-5 py-16 sm:px-8 sm:py-20" style={{ borderTop: '1px solid var(--line)' }}>
      <div className="mx-auto max-w-[1280px]">
        <SectionHead
          kicker={`${party.en} Programme`}
          title={
            <>
              {party.monthLabel}의 밤은
              <br className="sm:hidden" /> 이렇게 흘러갑니다
            </>
          }
          description="세 시간 남짓. 오프닝 건배부터 마지막 인사까지, 빠지고 싶은 순서는 빠져도 괜찮습니다."
        />

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <ol className="relative">
            <span className="absolute bottom-2 left-[47px] top-2 w-px" style={{ background: 'var(--line)' }} aria-hidden="true" />
            {party.program.map((item, index) => (
              <li key={item.time} className="reveal relative flex gap-5 pb-7 last:pb-0">
                <span className="serif z-10 w-[52px] shrink-0 pt-0.5 text-right text-[13px] tabular-nums" style={{ color: index === 0 ? 'var(--burgundy)' : 'var(--muted)' }}>
                  {item.time}
                </span>
                <span
                  className="z-10 mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full"
                  style={{ background: index === 0 ? 'var(--burgundy)' : 'var(--gold)', boxShadow: '0 0 0 4px var(--bg)' }}
                />
                <div className="pb-1">
                  <h3 className="serif text-[16px] leading-snug sm:text-[17px]">{item.title}</h3>
                  <p className="mt-1.5 max-w-[46ch] text-[12.5px] leading-[1.8]" style={{ color: 'var(--muted)' }}>
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="space-y-6">
            <div className="card p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <p className="kicker">Table</p>
                <Utensils size={14} style={{ color: 'var(--gold)' }} />
              </div>
              <h3 className="serif mt-2 text-[19px]">이번 달의 상차림</h3>
              <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--muted)' }}>
                각자 집에서 만드는 메뉴예요. 재료는 가까운 마트에서 구할 수 있는 것으로 골랐습니다.
              </p>
              <ul className="mt-4 space-y-3">
                {party.menu.map((menu, index) => (
                  <li key={menu.name} className="flex gap-3 border-t pt-3 first:border-t-0 first:pt-0" style={{ borderColor: 'var(--line)' }}>
                    <span className="serif w-4 shrink-0 text-[11px]" style={{ color: 'var(--gold)' }}>{String(index + 1).padStart(2, '0')}</span>
                    <div className="flex-1">
                      <p className="text-[13px]">{menu.name}</p>
                      <p className="mt-0.5 text-[11px]" style={{ color: 'var(--muted)' }}>{menu.detail}</p>
                    </div>
                    <span className="shrink-0 self-start rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'var(--surface-2)', color: 'var(--ink-soft)', border: '1px solid var(--line)' }}>
                      {menu.pairing}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-5 sm:p-6">
              <p className="kicker">Hosts</p>
              <div className="mt-3 space-y-4">
                {party.hosts.map((host) => (
                  <div key={host.name} className="flex gap-3">
                    <Avatar name={host.name === '밤의 서재' ? 'owl' : host.name === '골드문' ? 'fox' : host.name === '재즈바11' ? 'santacat' : 'bear'} size={38} />
                    <div>
                      <p className="flex items-center gap-2 text-[12.5px]">
                        {host.name}
                        <span className="kicker text-[8px]">{host.role}</span>
                      </p>
                      <p className="serif mt-1 text-[12px] leading-[1.7]" style={{ color: 'var(--ink-soft)' }}>
                        “{host.line}”
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 border-t pt-4 text-[11px]" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                <Sparkles size={12} style={{ color: 'var(--gold)' }} />
                드레스 코드 · {party.dressCode}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: BookOpen, label: '이번 달 책', value: party.book.title },
                { icon: Film, label: '같이 보는 영화', value: party.film.title },
                { icon: Music2, label: '플레이리스트', value: `${party.playlist.length}가지 무드` },
              ].map((item) => (
                <div key={item.label} className="card-soft flex flex-col gap-2 p-3.5">
                  <item.icon size={14} style={{ color: 'var(--gold)' }} />
                  <p className="kicker text-[8px] leading-tight">{item.label}</p>
                  <p className="serif text-[12px] leading-tight">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
