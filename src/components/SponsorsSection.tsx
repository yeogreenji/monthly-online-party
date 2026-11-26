import { useState } from 'react'
import { ArrowUpRight, Check, Copy, Gift, Sparkles, Ticket } from 'lucide-react'
import type { Coupon, PartyEvent } from '../types'
import { PACKAGES } from '../data/media'
import { couponCode } from '../lib/coupons'
import { Modal, useCopy } from './ui'

const TONE: Record<'gold' | 'forest' | 'burgundy', string> = {
  gold: '#C59B48',
  forest: '#2C5540',
  burgundy: '#8C2D38',
}

export function SponsorsSection({
  party,
  coupons,
  onIssue,
  onOpenKit,
  onToast,
}: {
  party: PartyEvent
  coupons: Coupon[]
  onIssue: (coupon: Coupon) => void
  onOpenKit: () => void
  onToast: (text: string, tone?: 'default' | 'success') => void
}) {
  const [rouletteOpen, setRouletteOpen] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<{ brand: string; label: string; code: string } | null>(null)
  const { copied, copy } = useCopy()

  const issue = (brand: string, offer: string) => {
    const code = couponCode('SALON')
    onIssue({ code, brand, label: offer, issuedAt: new Date().toISOString() })
    onToast(`${brand} 쿠폰을 받았어요 · ${code}`, 'success')
  }

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    setResult(null)
    const count = party.sponsors.length
    const index = Math.floor(Math.random() * count)
    const winner = party.sponsors[index]
    const segment = 360 / count
    const center = index * segment + segment / 2
    const base = rotation - (rotation % 360)
    const target = base + 1440 + ((360 - center) % 360)
    setRotation(target)
    window.setTimeout(() => {
      setSpinning(false)
      setResult({ brand: winner.brand, label: winner.offer, code: couponCode('ROULETTE') })
    }, 3400)
  }

  return (
    <section id="brand" className="px-5 py-16 sm:px-8 sm:py-20" style={{ background: '#1B3B2B', color: '#F7F1E6' }}>
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="kicker" style={{ color: '#C59B48' }}>Brand Salon</p>
            <h2 className="serif mt-3 text-[26px] leading-[1.35] sm:text-[32px]">
              이번 달의 밤은{' '}
              <br className="hidden sm:block" />
              함께 준비한 브랜드가 있습니다
            </h2>
            <p className="mt-3 text-[12.5px] leading-[1.9]" style={{ color: 'rgba(247,241,230,0.7)' }}>
              파티의 상차림, 포토월의 프레임, 룰렛의 선물까지. 광고가 아니라 오늘 밤의 일부로 소개합니다.
            </p>
          </div>
          <button type="button" onClick={onOpenKit} className="btn shrink-0 self-start border" style={{ borderColor: 'rgba(247,241,230,0.3)', color: '#F7F1E6' }}>
            브랜드 협찬 안내 · Media Kit
            <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {party.sponsors.map((sponsor) => (
            <article
              key={sponsor.id}
              className="flex flex-col justify-between gap-5 p-5"
              style={{ border: '1px solid rgba(247,241,230,0.18)', background: 'rgba(247,241,230,0.03)' }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="kicker text-[8.5px]" style={{ color: TONE[sponsor.tone] === '#C59B48' ? '#E3C98F' : 'rgba(247,241,230,0.55)' }}>
                    {sponsor.category}
                  </span>
                  <span className="h-2 w-2 rounded-full" style={{ background: TONE[sponsor.tone] }} />
                </div>
                <h3 className="serif mt-2.5 text-[21px]">{sponsor.brand}</h3>
                <p className="mt-2.5 text-[12px] leading-[1.8]" style={{ color: 'rgba(247,241,230,0.72)' }}>
                  {sponsor.blurb}
                </p>
                <p className="mt-4 inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10.5px]" style={{ borderColor: 'rgba(227,201,143,0.4)', color: '#E3C98F' }}>
                  <Gift size={11} />
                  {sponsor.offer}
                </p>
              </div>
              <button
                type="button"
                onClick={() => issue(sponsor.brand, sponsor.offer)}
                className="flex items-center justify-between border-t pt-3.5 text-[11.5px]"
                style={{ borderColor: 'rgba(247,241,230,0.18)', color: '#F7F1E6' }}
              >
                쿠폰 받기
                <Ticket size={13} />
              </button>
            </article>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between gap-4 p-5" style={{ border: '1px solid rgba(227,201,143,0.35)', background: 'rgba(197,155,72,0.08)' }}>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: '#E3C98F' }} />
                <p className="kicker" style={{ color: '#E3C98F' }}>Roulette</p>
              </div>
              <h3 className="serif mt-2 text-[19px]">이번 달의 룰렛</h3>
              <p className="mt-1.5 text-[11.5px] leading-[1.8]" style={{ color: 'rgba(247,241,230,0.7)' }}>
                파티 중반, 함께한 브랜드의 선물을 돌립니다. 지금 미리 돌려보고 쿠폰을 받아두세요.
              </p>
            </div>
            <button type="button" onClick={() => setRouletteOpen(true)} className="btn btn-gold self-start">
              룰렛 돌리기
              <Gift size={14} />
            </button>
          </div>

          <div className="p-5" style={{ border: '1px solid rgba(247,241,230,0.18)' }}>
            <div className="flex items-baseline justify-between">
              <p className="kicker" style={{ color: 'rgba(247,241,230,0.55)' }}>My coupons</p>
              <span className="text-[10px]" style={{ color: 'rgba(247,241,230,0.5)' }}>{coupons.length}장</span>
            </div>
            {coupons.length === 0 ? (
              <p className="mt-3 text-[11.5px]" style={{ color: 'rgba(247,241,230,0.55)' }}>
                받은 쿠폰이 여기에 모입니다. 이 브라우저에만 저장돼요.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {coupons.slice(0, 3).map((coupon) => (
                  <li key={coupon.code} className="flex items-center justify-between gap-2 border-t pt-2 first:border-t-0 first:pt-0" style={{ borderColor: 'rgba(247,241,230,0.14)' }}>
                    <div className="min-w-0">
                      <p className="truncate text-[11px]">{coupon.brand} · {coupon.label}</p>
                      <p className="font-mono text-[10px]" style={{ color: '#E3C98F' }}>{coupon.code}</p>
                    </div>
                    <button type="button" onClick={() => void copy(coupon.code, coupon.code)} aria-label="쿠폰 코드 복사" className="shrink-0 p-1" style={{ color: '#E3C98F' }}>
                      {copied === coupon.code ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t pt-6 sm:flex-row sm:items-center" style={{ borderColor: 'rgba(247,241,230,0.18)' }}>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {PACKAGES.map((pack) => (
              <span key={pack.id} className="text-[10.5px]" style={{ color: 'rgba(247,241,230,0.62)' }}>
                {pack.name} · {pack.price}
              </span>
            ))}
          </div>
          <button type="button" onClick={onOpenKit} className="text-[11px] underline underline-offset-4" style={{ color: '#E3C98F' }}>
            협찬 제안서와 문의 폼 보기
          </button>
        </div>
        <p className="mt-4 text-[10px]" style={{ color: 'rgba(247,241,230,0.4)' }}>
          스폰서 존은 예시 브랜드로 구성된 오픈 전 시연입니다. 실제 협찬 계약과 무관합니다.
        </p>
      </div>

      {rouletteOpen && (
        <Modal onClose={() => setRouletteOpen(false)} label="스폰서 룰렛" size="sm">
          <div className="p-6 text-center" style={{ color: 'var(--ink)' }}>
            <p className="kicker">Dingdong Roulette</p>
            <h3 className="serif mt-2 text-[21px]">{party.monthLabel}의 선물</h3>
            <div className="relative mx-auto mt-6 h-[230px] w-[230px]">
              <div
                className="h-full w-full rounded-full"
                style={{
                  background: `conic-gradient(${party.sponsors
                    .map((_sponsor, index) => {
                      const start = (index / party.sponsors.length) * 100
                      const end = ((index + 1) / party.sponsors.length) * 100
                      return `${['#C59B48', '#2C5540', '#8C2D38'][index % 3]} ${start}% ${end}%`
                    })
                    .join(', ')})`,
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 3.2s cubic-bezier(0.15, 0.85, 0.12, 1)',
                  border: '6px solid var(--surface)',
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)',
                }}
              />
              {party.sponsors.map((sponsor, index) => {
                const angle = (360 / party.sponsors.length) * index + 360 / party.sponsors.length / 2
                return (
                  <span
                    key={sponsor.id}
                    className="pointer-events-none absolute left-1/2 top-1/2 text-[9.5px]"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle + rotation}deg) translateY(-74px)`,
                      transformOrigin: 'center',
                      transition: 'transform 3.2s cubic-bezier(0.15, 0.85, 0.12, 1)',
                      color: '#FFF9ED',
                      width: 78,
                      textAlign: 'center',
                      textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                    }}
                  >
                    <span style={{ display: 'inline-block', transform: `rotate(${-angle - rotation}deg)`, transition: 'transform 3.2s cubic-bezier(0.15, 0.85, 0.12, 1)' }}>{sponsor.brand}</span>
                  </span>
                )
              })}
              <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <Gift size={15} style={{ color: 'var(--gold)' }} />
              </span>
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-[-4px] z-10 -translate-x-1/2"
                style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '16px solid var(--gold)' }}
              />
            </div>

            {!result ? (
              <button type="button" onClick={spin} disabled={spinning} className="btn btn-primary mt-6 w-full">
                {spinning ? '룰렛이 도는 중…' : '돌리기'}
              </button>
            ) : (
              <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>오늘의 선물</p>
                <p className="serif mt-1 text-[18px]">{result.brand}</p>
                <p className="mt-0.5 text-[11.5px]" style={{ color: 'var(--ink-soft)' }}>{result.label}</p>
                <div className="mt-3 flex items-center justify-center gap-2 border px-3 py-2" style={{ borderColor: 'var(--line-strong)' }}>
                  <span className="font-mono text-[12px]" style={{ color: 'var(--burgundy)' }}>{result.code}</span>
                  <button type="button" onClick={() => void copy(result.code, 'roulette')} aria-label="쿠폰 코드 복사" style={{ color: 'var(--muted)' }}>
                    {copied === 'roulette' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline flex-1"
                    onClick={() => {
                      onIssue({ code: result.code, brand: result.brand, label: result.label, issuedAt: new Date().toISOString() })
                      onToast('쿠폰함에 담았어요.', 'success')
                    }}
                  >
                    쿠폰함에 담기
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={spin}>
                    다시
                  </button>
                </div>
                <p className="mt-2 text-[9.5px]" style={{ color: 'var(--muted)' }}>
                  시연용 쿠폰입니다. 실제 결제에는 쓰이지 않아요.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </section>
  )
}
