import { useEffect, useState } from 'react'
import { Menu, Moon, Sun, Mail, X } from 'lucide-react'
import type { Profile } from '../types'
import { Avatar } from './Avatar'

export type SalonView = 'home' | 'mediakit'

const NAV = [
  { id: 'party', label: '이번 달 파티' },
  { id: 'rooms', label: '취향방' },
  { id: 'wall', label: '포토월' },
  { id: 'calendar', label: '파티 캘린더' },
  { id: 'brand', label: '브랜드 협찬' },
]

export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="#1B3B2B" />
      <circle cx="20" cy="20" r="18.2" fill="none" stroke="#C59B48" strokeWidth="0.8" opacity="0.85" />
      <path d="M11 12h7.2l-1 5.4a2.6 2.6 0 0 1-5.2 0L11 12Z" fill="none" stroke="#E3C98F" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M14.6 20.6v5M11.8 25.8h5.6" stroke="#E3C98F" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M21.8 13.6h7.2l-1 5.4a2.6 2.6 0 0 1-5.2 0l-1-5.4Z" fill="none" stroke="#E3C98F" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M25.4 22.2v5M22.6 27.4h5.6" stroke="#E3C98F" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="20" cy="9.4" r="0.9" fill="#C59B48" />
    </svg>
  )
}

export function Header({
  view,
  section,
  profile,
  night,
  notesCount,
  onNavigate,
  onEditProfile,
  onToggleNight,
  onOpenNotes,
}: {
  view: SalonView
  section: string
  profile: Profile
  night: boolean
  notesCount: number
  onNavigate: (section: string) => void
  onEditProfile: () => void
  onToggleNight: () => void
  onOpenNotes: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [view, section])

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'var(--bg)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8">
        <button
          type="button"
          onClick={() => onNavigate('top')}
          className="flex items-center gap-2.5 text-left"
          aria-label="월간살롱 홈으로"
        >
          <BrandMark size={34} />
          <span className="flex flex-col leading-none">
            <span className="serif text-[17px] tracking-[-0.02em]">월간살롱</span>
            <span className="kicker mt-1 text-[8px] tracking-[0.3em]">Monthly Salon</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="주요 섹션">
          {NAV.map((item) => {
            const active = view === 'home' && section === item.id
            const isBrand = item.id === 'brand'
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className="relative rounded-full px-3.5 py-2 text-[12.5px] transition-colors hover:bg-black/[0.04]"
                style={{
                  color: active || (isBrand && view === 'mediakit') ? 'var(--ink)' : 'var(--muted)',
                  fontWeight: active || (isBrand && view === 'mediakit') ? 600 : 400,
                }}
              >
                {item.label}
                {(active || (isBrand && view === 'mediakit')) && (
                  <span
                    className="absolute inset-x-3.5 -bottom-[1px] h-[1.5px]"
                    style={{ background: 'var(--gold)' }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleNight}
            className="btn btn-ghost btn-icon"
            aria-label={night ? '낮 모드로 전환' : '나이트 파티 모드로 전환'}
            title={night ? '낮 모드' : '나이트 파티 모드'}
          >
            {night ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            onClick={onOpenNotes}
            className="btn btn-ghost btn-icon relative"
            aria-label={`쪽지함${notesCount > 0 ? ` (새 쪽지 ${notesCount}건)` : ''}`}
            title="쪽지함"
          >
            <Mail size={17} />
            {notesCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold"
                style={{ background: 'var(--burgundy)', color: '#FFF6EC' }}
              >
                {notesCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onEditProfile}
            className="ml-1 hidden items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-black/[0.04] sm:flex"
            aria-label="내 프로필 바꾸기"
          >
            <Avatar name={profile.avatar} size={30} ring />
            <span className="text-[12.5px]" style={{ color: 'var(--ink-soft)' }}>
              {profile.nickname}
            </span>
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon lg:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="메뉴"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="animate-fade-in border-t px-5 py-3 lg:hidden" style={{ borderColor: 'var(--line)', background: 'var(--bg)', boxShadow: 'var(--shadow)' }}>
          <div className="flex flex-col">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className="flex items-center justify-between py-3 text-left text-[13.5px]"
                style={{ borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)' }}
              >
                {item.label}
                <span className="kicker text-[8px]">0{NAV.indexOf(item) + 1}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={onEditProfile}
              className="flex items-center gap-2.5 py-3 text-left text-[13px] sm:hidden"
              style={{ color: 'var(--ink-soft)' }}
            >
              <Avatar name={profile.avatar} size={26} ring />
              {profile.nickname} · 프로필 바꾸기
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
