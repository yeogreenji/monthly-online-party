import { AlertCircle, BookLock, GlassWater, HeartHandshake, Mail, ShieldCheck } from 'lucide-react'
import { CONTACT_EMAIL } from '../data/media'
import { BrandMark } from './Header'
import { SectionHead } from './ui'

const PROMISES = [
  {
    icon: BookLock,
    title: '실명 대신 닉네임',
    detail: '서로의 이름, 직장, 나이를 묻지 않습니다. 캐릭터와 닉네임만으로 충분한 밤입니다.',
  },
  {
    icon: HeartHandshake,
    title: '먼저 수락, 그다음 쪽지',
    detail: '무작위 쪽지는 오지 않습니다. 방에서 대화를 나눈 뒤 서로 수락해야 1:1 쪽지가 열립니다.',
  },
  {
    icon: GlassWater,
    title: '권하지 않는 한 잔',
    detail: '과음은 매너 위반입니다. 논알콜도 같은 잔에 따르고, 현재 체험판은 성인용이며 연령 인증은 아직 연결되지 않았습니다.',
  },
  {
    icon: ShieldCheck,
    title: '사생활은 사생활로',
    detail: '얼굴·집 구조·문패가 담긴 사진은 올리지 않습니다. 스포일러는 토글을 먼저 켭니다.',
  },
]

export function EtiquetteSection() {
  return (
    <section id="etiquette" className="px-5 py-16 sm:px-8 sm:py-20" style={{ borderTop: '1px solid var(--line)', background: 'var(--bg-deep)' }}>
      <div className="mx-auto max-w-[1280px]">
        <SectionHead
          kicker="House Rules"
          title={
            <>
              편안한 밤을 위해
              <br className="sm:hidden" /> 네 가지만 약속합니다
            </>
          }
          description="딩동이 오래 열려 있으려면, 서로의 선을 지키는 일이 먼저입니다. 어길 경우 신고 후 이용이 제한될 수 있어요."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((promise, index) => (
            <article key={promise.title} className="reveal card flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <promise.icon size={18} style={{ color: 'var(--gold)' }} />
                <span className="serif text-[10px]" style={{ color: 'var(--muted)' }}>0{index + 1}</span>
              </div>
              <h3 className="serif text-[15.5px]">{promise.title}</h3>
              <p className="text-[11.5px] leading-[1.8]" style={{ color: 'var(--muted)' }}>{promise.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--burgundy)' }} />
            신고 기능은 로컬 체험입니다. 실제 운영자에게 전송되거나 계정이 제한되는 기능은 연결되지 않았습니다.
          </p>
          <span className="text-[10.5px]" style={{ color: 'var(--muted)' }}>
            이 브라우저에 저장되는 것: 프로필 · 초대장 · 알림 · 포토월 · 쪽지 · 쿠폰
          </span>
        </div>
      </div>
    </section>
  )
}

export function Footer({ onBrandKit, onNavigate, showCommercial = false }: { onBrandKit: () => void; onNavigate: (section: string) => void; showCommercial?: boolean }) {
  return (
    <footer className="px-5 pb-10 pt-14 sm:px-8" style={{ borderTop: '1px solid var(--line)' }}>
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark size={32} />
              <div>
                <p className="serif text-[16px]">딩동</p>
                <p className="kicker mt-0.5 text-[7.5px]">DINGDONG</p>
              </div>
            </div>
            <p className="serif mt-4 max-w-[28ch] text-[13px] leading-[1.8]" style={{ color: 'var(--ink-soft)' }}>
              매월의 큰 파티와 매일 밤의 작은 취향방.
              <br />
              같은 밤을 보내는 사람들끼리의 온라인 파티.
            </p>
          </div>

          <div>
            <p className="kicker mb-3">딩동</p>
            <ul className="space-y-2 text-[11.5px]" style={{ color: 'var(--muted)' }}>
              <li><button type="button" onClick={() => onNavigate('party')} className="hover:underline">이번 달 파티</button></li>
              <li><button type="button" onClick={() => onNavigate('rooms')} className="hover:underline">12개 공간</button></li>
              <li><button type="button" onClick={() => onNavigate('wall')} className="hover:underline">포토월</button></li>
              <li><button type="button" onClick={() => onNavigate('calendar')} className="hover:underline">파티 캘린더</button></li>
            </ul>
          </div>

          {showCommercial && <div>
            <p className="kicker mb-3">브랜드</p>
            <ul className="space-y-2 text-[11.5px]" style={{ color: 'var(--muted)' }}>
              <li>
                <button type="button" onClick={onBrandKit} className="hover:underline">미디어킷 · 협찬 안내</button>
              </li>
              <li><button type="button" onClick={() => onNavigate('sponsor-zone')} className="hover:underline">이번 달 스폰서</button></li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">{CONTACT_EMAIL}</a>
              </li>
            </ul>
          </div>}

          <div>
            <p className="kicker mb-3">약속</p>
            <ul className="space-y-2 text-[11.5px]" style={{ color: 'var(--muted)' }}>
              <li><button type="button" onClick={() => onNavigate('etiquette')} className="hover:underline">딩동 에티켓</button></li>
              <li><span>신고 · 차단 안내</span></li>
              <li><span>개인정보는 브라우저에만</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--line)' }}>
          <p className="flex items-center gap-2 text-[10.5px]" style={{ color: 'var(--muted)' }}>
            <Mail size={11} />
            개발 체험판 · 실제 운영 전
          </p>
          <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
            © 2026 DINGDONG. 참여자 대화는 예시로 구성된 로컬 체험입니다.
          </p>
        </div>
      </div>
    </footer>
  )
}
