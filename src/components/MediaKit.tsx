import { useState } from 'react'
import { ArrowLeft, ArrowUpRight, Check, Copy, Mail, Send, Sparkles } from 'lucide-react'
import type { Inquiry } from '../types'
import { ADDONS, AUDIENCE, CONTACT_EMAIL, FORMATS, PACKAGES, PROCESS } from '../data/media'
import { inquiryId } from '../lib/coupons'
import { BrandMark } from './Header'
import { useCopy } from './ui'

const BUDGETS = ['500만원 미만', '500 – 1,000만원', '1,000 – 3,000만원', '3,000만원 이상', '미정']

export function MediaKit({
  onBack,
  onInquiry,
  onToast,
}: {
  onBack: () => void
  onInquiry: (inquiry: Inquiry) => void
  onToast: (text: string, tone?: 'default' | 'success') => void
}) {
  const [company, setCompany] = useState('')
  const [person, setPerson] = useState('')
  const [email, setEmail] = useState('')
  const [budget, setBudget] = useState(BUDGETS[1])
  const [picked, setPicked] = useState<string[]>([])
  const [goal, setGoal] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState<{ id: string; mailto: string; summary: string } | null>(null)
  const { copied, copy } = useCopy()

  const togglePackage = (name: string) => {
    setPicked((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]))
  }

  const submit = () => {
    if (!company.trim() || !person.trim()) {
      setError('브랜드명과 담당자 성함을 적어주세요.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('회신받을 이메일 주소를 확인해 주세요.')
      return
    }
    if (!consent) {
      setError('문의 회신을 위한 개인정보 수집에 동의해 주세요.')
      return
    }
    const id = inquiryId()
    const packages = picked.length > 0 ? picked : ['상담 후 결정']
    const inquiry: Inquiry = {
      id,
      company: company.trim(),
      person: person.trim(),
      email: email.trim(),
      budget,
      packages,
      goal: goal.trim(),
      at: new Date().toISOString(),
    }
    onInquiry(inquiry)
    const summary = [
      `[딩동 협찬 문의] ${id}`,
      `브랜드: ${inquiry.company}`,
      `담당자: ${inquiry.person}`,
      `회신: ${inquiry.email}`,
      `예산: ${inquiry.budget}`,
      `관심 패키지: ${packages.join(', ')}`,
      `캠페인 목표: ${inquiry.goal || '미작성'}`,
    ].join('\n')
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[딩동 협찬 문의] ${inquiry.company} · ${id}`)}&body=${encodeURIComponent(summary)}`
    setSubmitted({ id, mailto, summary })
    setError('')
    onToast('문의서가 준비됐어요. 복사하거나 메일로 보내주세요.', 'success')
  }

  return (
    <div style={{ background: 'var(--bg)' }}>
      <div className="sticky top-[68px] z-20 flex items-center justify-between gap-3 border-b px-5 py-2.5 sm:px-8" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--muted)' }}>
          <ArrowLeft size={13} />
          딩동으로 돌아가기
        </button>
        <p className="kicker text-[8px]">Media Kit · 2027 Season</p>
      </div>

      {/* 히어로 */}
      <section className="relative overflow-hidden px-5 pb-14 pt-12 sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="flex items-center gap-2.5">
                <BrandMark size={26} />
                <p className="kicker" style={{ color: 'var(--burgundy)' }}>Brand Partnership</p>
              </div>
              <h1 className="serif mt-5 text-[34px] leading-[1.3] tracking-[-0.04em] sm:text-[46px]">
                광고가 아니라,
                <br />
                그날 밤의 일부로.
              </h1>
              <p className="mt-5 max-w-[46ch] text-[13px] leading-[1.95]" style={{ color: 'var(--ink-soft)' }}>
                딩동은 매월 한 번의 큰 파티와 매일 밤 네 개의 취향방이 열리는 온라인 파티입니다. 브랜드는 배너 한 칸이 아니라, 상차림과 건배와 선물의 자리에 자연스럽게 놓입니다.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <a href="#packages" className="btn btn-primary">
                  협찬 패키지 보기
                  <ArrowUpRight size={15} />
                </a>
                <a href="#inquiry" className="btn btn-outline">
                  <Mail size={14} />
                  협찬 문의하기
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ['월 1회', '메인 시즌 파티'],
                ['매일', '21시 취향방 4개'],
                ['3040', '1인 가구 취향층'],
                ['3종', '협찬 패키지'],
              ].map(([value, label]) => (
                <div key={label} className="card p-4">
                  <p className="serif text-[24px]">{value}</p>
                  <p className="mt-1 text-[10.5px]" style={{ color: 'var(--muted)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-5 border-t pt-8 sm:grid-cols-3" style={{ borderColor: 'var(--line)' }}>
            {[
              [
                '매월 반복되는 자리',
                '한 번의 노출이 아니라, 매달 같은 시간에 다시 열리는 자리입니다. 캠페인을 한 달 동안 이어가기 좋습니다.',
              ],
              [
                '취향으로 모인 사람들',
                '술을 마시지 않는 사람도, 책만 읽는 사람도 있습니다. 구매를 재촉하지 않아도 관심사가 맞는 사람에게 닿습니다.',
              ],
              [
                '제품이 쓰이는 장면',
                '안주, 논알콜 한 잔, 이번 주의 책, 영화, 플레이리스트. 브랜드가 실제로 쓰이는 장면 안에 들어갑니다.',
              ],
            ].map(([title, detail], index) => (
              <div key={title}>
                <p className="serif text-[10px]" style={{ color: 'var(--gold)' }}>0{index + 1}</p>
                <h3 className="serif mt-1.5 text-[15px]">{title}</h3>
                <p className="mt-1.5 text-[11.5px] leading-[1.85]" style={{ color: 'var(--muted)' }}>{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 오디언스 */}
      <section className="px-5 py-14 sm:px-8" style={{ borderTop: '1px solid var(--line)', background: 'var(--bg-deep)' }}>
        <div className="mx-auto max-w-[1100px]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="kicker">Audience</p>
              <h2 className="serif mt-2 text-[24px] sm:text-[28px]">누가 이 밤에 있나요</h2>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              아래 수치는 2027 상반기 목표 지표입니다. 실제 성과는 캠페인 리포트로 제공됩니다.
            </p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCE.map((item) => (
              <div key={item.label} className="card p-5">
                <p className="kicker text-[8px]">{item.label}</p>
                <p className="serif mt-2 text-[26px]">{item.value}</p>
                <p className="mt-2 text-[10.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ['혼자 사는 직장인', '퇴근 후 21시에 가장 자주 접속합니다. 혼자여도 취향은 포기하지 않는 층.'],
              ['논알콜 · 건강 관심', '마시지 않는 사람도 같은 자리에 앉습니다. 논알콜 음료의 자연스러운 노출 지점.'],
              ['취향 소비', '책 · 영화 · 음악 · 안주. 광고보다 큐레이션에 반응합니다.'],
            ].map(([title, detail]) => (
              <div key={title} className="border-l pl-4" style={{ borderColor: 'var(--gold)' }}>
                <p className="text-[12px]">{title}</p>
                <p className="mt-1 text-[10.5px] leading-[1.8]" style={{ color: 'var(--muted)' }}>{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 패키지 */}
      <section id="packages" className="scroll-mt-[124px] px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-[1100px]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="kicker">Packages</p>
              <h2 className="serif mt-2 text-[24px] sm:text-[28px]">세 가지 협찬 패키지</h2>
            </div>
            <p className="text-[10.5px]" style={{ color: 'var(--muted)' }}>부가세 별도 · 첫 시즌 론칭 파트너 30% 할인</p>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {PACKAGES.map((pack) => (
              <article key={pack.id} className="card flex flex-col p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="kicker text-[8px]">{pack.en}</span>
                  <span className="rounded-full border px-2 py-0.5 text-[9px]" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>{pack.slots}</span>
                </div>
                <h3 className="serif mt-2.5 text-[19px] leading-snug">{pack.name}</h3>
                <p className="mt-2 text-[11px] leading-[1.8]" style={{ color: 'var(--muted)' }}>{pack.summary}</p>
                <div className="mt-4 flex items-end gap-1.5 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
                  <span className="serif text-[26px]" style={{ color: pack.color === 'gold' ? 'var(--gold)' : pack.color === 'burgundy' ? 'var(--burgundy)' : 'var(--ink)' }}>
                    {pack.price}
                  </span>
                  <span className="pb-1 text-[9.5px]" style={{ color: 'var(--muted)' }}>{pack.priceNote}</span>
                </div>
                <ul className="mt-4 flex-1 space-y-2">
                  {pack.included.map((item) => (
                    <li key={item} className="flex gap-2 text-[10.5px] leading-[1.7]" style={{ color: 'var(--ink-soft)' }}>
                      <Check size={11} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t pt-3 text-[9.5px] leading-relaxed" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                  추천 · {pack.bestFor}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPicked([pack.name])
                    document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className="btn btn-outline btn-sm mt-4"
                >
                  이 패키지로 문의
                  <ArrowUpRight size={12} />
                </button>
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
            <div className="card-soft p-5">
              <p className="kicker text-[8px]">Formats</p>
              <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {FORMATS.map((format) => (
                  <div key={format.name} className="flex items-start justify-between gap-3 p-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                    <div>
                      <p className="text-[11.5px]">{format.name}</p>
                      <p className="text-[9.5px]" style={{ color: 'var(--muted)' }}>{format.detail}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[8.5px]" style={{ color: 'var(--muted)' }}>{format.spec}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <p className="kicker text-[8px]">Add-on</p>
              <ul className="mt-3 space-y-2.5">
                {ADDONS.map((addon) => (
                  <li key={addon.name} className="flex items-center justify-between border-t pt-2.5 text-[11px] first:border-t-0 first:pt-0" style={{ borderColor: 'var(--line)' }}>
                    <span>{addon.name}</span>
                    <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{addon.price}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[9.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                소재는 파티 콘셉트와 어긋나지 않는 선에서 함께 다듬습니다. 주류 브랜드는 19세 이상 확인 문구를 함께 넣습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 프로세스 */}
      <section className="px-5 py-14 sm:px-8" style={{ borderTop: '1px solid var(--line)', background: 'var(--bg-deep)' }}>
        <div className="mx-auto max-w-[1100px]">
          <p className="kicker">Process</p>
          <h2 className="serif mt-2 text-[24px] sm:text-[28px]">문의부터 리포트까지</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((step) => (
              <div key={step.step} className="border-t pt-4" style={{ borderColor: 'var(--gold)' }}>
                <p className="serif text-[11px]" style={{ color: 'var(--gold)' }}>{step.step}</p>
                <h3 className="serif mt-1.5 text-[14.5px]">{step.title}</h3>
                <p className="mt-1.5 text-[10.5px] leading-[1.8]" style={{ color: 'var(--muted)' }}>{step.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 text-[10.5px]" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
            <span className="flex items-center gap-1.5"><Sparkles size={11} style={{ color: 'var(--gold)' }} />리포트 포함: 노출 수 · 방 참여 수 · 룰렛 응모 수 · 쿠폰 발급 수</span>
            <span>개인정보는 문의 회신 목적으로만 사용하고, 캠페인 종료 후 파기합니다.</span>
          </div>
        </div>
      </section>

      {/* 문의 */}
      <section id="inquiry" className="scroll-mt-[124px] px-5 py-14 sm:px-8">
        <div className="mx-auto grid max-w-[1100px] gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="kicker">Contact</p>
            <h2 className="serif mt-2 text-[26px] leading-snug sm:text-[30px]">
              한 달의 자리를
              <br />
              함께 준비해요
            </h2>
            <p className="mt-4 max-w-[38ch] text-[12px] leading-[1.95]" style={{ color: 'var(--ink-soft)' }}>
              브랜드와 캠페인 목표를 남겨주시면, 희망 월과 상품을 조합한 제안서와 견적을 영업일 2일 내 보내드립니다.
            </p>
            <div className="mt-6 space-y-3 text-[11.5px]">
              <p className="flex items-center gap-2">
                <Mail size={13} style={{ color: 'var(--gold)' }} />
                {CONTACT_EMAIL}
              </p>
              <p style={{ color: 'var(--muted)' }}>평일 10:00 – 18:00 · 주말 및 공휴일 휴무</p>
            </div>
            <div className="mt-7 border-l-2 pl-4" style={{ borderColor: 'var(--gold)' }}>
              <p className="serif text-[12.5px] leading-[1.8]" style={{ color: 'var(--ink-soft)' }}>
                “협찬은 파티의 흐름을 끊지 않을 때 오래 남습니다. 브랜드가 손님처럼 자연스럽게 앉는 자리를 만들겠습니다.”
              </p>
            </div>
          </div>

          <div className="card p-5 sm:p-7">
            {submitted ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: 'var(--forest)' }}>
                    <Check size={14} style={{ color: 'var(--forest-ink)' }} />
                  </span>
                  <p className="serif text-[17px]">문의서가 준비됐습니다</p>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  접수번호 <span className="font-mono" style={{ color: 'var(--ink)' }}>{submitted.id}</span> · 아래 내용을 복사해 메일로 보내거나, 메일 앱으로 바로 열 수 있어요.
                </p>
                <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap border p-3 text-[10.5px] leading-[1.8]" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)', color: 'var(--ink-soft)' }}>
                  {submitted.summary}
                </pre>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => void copy(submitted.summary, 'summary')}>
                    {copied === 'summary' ? <Check size={12} /> : <Copy size={12} />}
                    {copied === 'summary' ? '복사됨' : '내용 복사'}
                  </button>
                  <a className="btn btn-outline btn-sm" href={submitted.mailto}>
                    <Mail size={12} />
                    메일로 보내기
                  </a>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setSubmitted(null)
                      setCompany('')
                      setPerson('')
                      setEmail('')
                      setGoal('')
                      setPicked([])
                      setConsent(false)
                    }}
                  >
                    새 문의
                  </button>
                </div>
                <p className="mt-3 text-[9.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  이 브라우저에 접수 내역이 저장됩니다. 실제 회신은 위 메일 주소로 문의서를 보내주시면 처리됩니다.
                </p>
              </div>
            ) : (
              <div>
                <p className="serif text-[17px]">협찬 문의</p>
                <p className="mt-1 text-[10.5px]" style={{ color: 'var(--muted)' }}>* 표시는 필수 항목입니다.</p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="smallcaps" style={{ color: 'var(--muted)' }}>브랜드명 *</span>
                    <input className="input mt-1" value={company} maxLength={40} onChange={(event) => setCompany(event.target.value)} placeholder="예: 메종 그린우드" />
                  </label>
                  <label className="block">
                    <span className="smallcaps" style={{ color: 'var(--muted)' }}>담당자 *</span>
                    <input className="input mt-1" value={person} maxLength={30} onChange={(event) => setPerson(event.target.value)} placeholder="성함 또는 닉네임" />
                  </label>
                </div>

                <label className="mt-4 block">
                  <span className="smallcaps" style={{ color: 'var(--muted)' }}>회신 이메일 *</span>
                  <input className="input mt-1" type="email" value={email} maxLength={60} onChange={(event) => setEmail(event.target.value)} placeholder="name@brand.co.kr" />
                </label>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="smallcaps" style={{ color: 'var(--muted)' }}>예산</span>
                    <select className="input mt-1" value={budget} onChange={(event) => setBudget(event.target.value)}>
                      {BUDGETS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <div>
                    <span className="smallcaps" style={{ color: 'var(--muted)' }}>관심 패키지</span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {PACKAGES.map((pack) => (
                        <button key={pack.id} type="button" className="chip" data-on={picked.includes(pack.name)} onClick={() => togglePackage(pack.name)} aria-pressed={picked.includes(pack.name)}>
                          {pack.name.replace(' 스폰서', '').replace(' & 경품', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <label className="mt-4 block">
                  <span className="smallcaps" style={{ color: 'var(--muted)' }}>캠페인 목표</span>
                  <textarea
                    className="textarea mt-1"
                    rows={3}
                    maxLength={400}
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                    placeholder="예: 12월 신제품 논알콜 스파클링을 3040 1인 가구에 알리고, 샘플링 후기를 모으고 싶습니다."
                  />
                </label>

                <label className="mt-3 flex items-start gap-2 text-[10.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5" />
                  문의 회신을 위해 브랜드명·담당자·이메일 수집에 동의합니다. 회신 후 파기합니다. *
                </label>

                {error && <p className="mt-2 text-[10.5px]" style={{ color: 'var(--burgundy)' }}>{error}</p>}

                <button type="button" onClick={submit} className="btn btn-primary mt-5 w-full py-3.5">
                  문의서 만들기
                  <Send size={14} />
                </button>
                <p className="mt-2 text-[9px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  제출 즉시 서버로 전송되지는 않습니다. 문의서를 복사하거나 메일 앱으로 보내주세요.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="px-5 pb-14 sm:px-8">
        <div className="mx-auto max-w-[1100px] border-t pt-5 text-[9.5px] leading-relaxed" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
          딩동은 오픈 전 프리뷰 단계입니다. 본 미디어킷의 오디언스 수치는 목표치이며, 스폰서 예시는 실제 계약과 무관한 시연입니다. 주류 관련 협찬은 19세 이상 확인 및 건전 음주 문구를 포함합니다.
        </div>
      </div>
    </div>
  )
}
