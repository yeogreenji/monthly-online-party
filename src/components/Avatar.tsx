import { useId } from 'react'
import type { AvatarKey } from '../types'

export const AVATARS: { key: AvatarKey; label: string; hint: string }[] = [
  { key: 'cat', label: '고양이', hint: '조용한 관찰자' },
  { key: 'bear', label: '곰돌이', hint: '포근한 대화' },
  { key: 'fox', label: '여우', hint: '영리한 취향' },
  { key: 'rabbit', label: '토끼', hint: '느린 밤' },
  { key: 'santacat', label: '산타냥', hint: '12월 한정' },
  { key: 'owl', label: '부엉이', hint: '밤의 독서' },
  { key: 'squirrel', label: '다람쥐', hint: '수집하는 마음' },
  { key: 'penguin', label: '펭귄', hint: '겨울이 편한' },
]

const TONE: Record<AvatarKey, { bg: string; fur: string; light: string; deep: string }> = {
  cat: { bg: '#F1E4D1', fur: '#D8A05F', light: '#F8E7CC', deep: '#8D5B2C' },
  bear: { bg: '#EDE4D5', fur: '#B98757', light: '#F2E1C7', deep: '#7B5530' },
  fox: { bg: '#F3E1D6', fur: '#C4703C', light: '#F9EBDD', deep: '#8A4522' },
  rabbit: { bg: '#F1E9E1', fur: '#E7D6C6', light: '#FBF4EA', deep: '#A88B76' },
  santacat: { bg: '#E9E4DC', fur: '#B9B3A8', light: '#F6F1E7', deep: '#6E6A62' },
  owl: { bg: '#EDE6D6', fur: '#9B7A54', light: '#F1E5CE', deep: '#63492C' },
  squirrel: { bg: '#F0E2D2', fur: '#AA7448', light: '#F5E5CE', deep: '#744A28' },
  penguin: { bg: '#E3E8E6', fur: '#2F3D42', light: '#F8F2E7', deep: '#1B2428' },
}

interface AvatarProps {
  name: AvatarKey
  size?: number
  ring?: boolean
  className?: string
  title?: string
}

export function Avatar({ name, size = 44, ring = false, className = '', title }: AvatarProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const tone = TONE[name] ?? TONE.cat
  const shadeId = `shade-${uid}`
  const glowId = `glow-${uid}`
  const label = AVATARS.find((item) => item.key === name)?.label ?? '캐릭터'

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={title ?? `${label} 캐릭터`}
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <radialGradient id={shadeId} cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor={tone.deep} stopOpacity="0.12" />
        </radialGradient>
        <linearGradient id={glowId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone.light} stopOpacity="0.55" />
          <stop offset="100%" stopColor={tone.bg} stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r={ring ? 47 : 50} fill={tone.bg} />
      {ring && <circle cx="50" cy="50" r="47" fill="none" stroke="#C59B48" strokeWidth="1.2" opacity="0.8" />}
      <circle cx="50" cy="42" r="34" fill={`url(#${glowId})`} />

      {name === 'rabbit' && (
        <>
          <ellipse cx="36" cy="22" rx="7.5" ry="17" fill={tone.fur} transform="rotate(-9 36 22)" />
          <ellipse cx="64" cy="22" rx="7.5" ry="17" fill={tone.fur} transform="rotate(9 64 22)" />
          <ellipse cx="36" cy="23" rx="3.6" ry="12" fill="#E7B5B0" opacity="0.85" transform="rotate(-9 36 23)" />
          <ellipse cx="64" cy="23" rx="3.6" ry="12" fill="#E7B5B0" opacity="0.85" transform="rotate(9 64 23)" />
        </>
      )}

      {(name === 'cat' || name === 'santacat') && (
        <>
          <path d="M27 38 L31 17 L46 31 Z" fill={tone.fur} />
          <path d="M73 38 L69 17 L54 31 Z" fill={tone.fur} />
          <path d="M31.5 34 L33.5 23 L41 31 Z" fill="#E7B5B0" opacity="0.75" />
          <path d="M68.5 34 L66.5 23 L59 31 Z" fill="#E7B5B0" opacity="0.75" />
        </>
      )}

      {(name === 'fox' || name === 'squirrel') && (
        <>
          <path d="M26 40 L28 16 L45 30 Z" fill={tone.fur} />
          <path d="M74 40 L72 16 L55 30 Z" fill={tone.fur} />
          <path d="M30 35 L31 23 L40 31 Z" fill={tone.light} opacity="0.7" />
          <path d="M70 35 L69 23 L60 31 Z" fill={tone.light} opacity="0.7" />
        </>
      )}

      {name === 'bear' && (
        <>
          <circle cx="28" cy="32" r="11" fill={tone.fur} />
          <circle cx="72" cy="32" r="11" fill={tone.fur} />
          <circle cx="28" cy="32" r="5.5" fill={tone.deep} opacity="0.4" />
          <circle cx="72" cy="32" r="5.5" fill={tone.deep} opacity="0.4" />
        </>
      )}

      {name === 'owl' && (
        <>
          <path d="M27 33 L24 19 L38 25 Z" fill={tone.fur} />
          <path d="M73 33 L76 19 L62 25 Z" fill={tone.fur} />
        </>
      )}

      {name === 'penguin' && (
        <>
          <ellipse cx="32" cy="36" rx="9" ry="12" fill={tone.fur} opacity="0.9" />
          <ellipse cx="68" cy="36" rx="9" ry="12" fill={tone.fur} opacity="0.9" />
        </>
      )}

      {/* 얼굴 */}
      <ellipse cx="50" cy="55" rx="31" ry="30" fill={tone.fur} />
      <ellipse cx="50" cy="55" rx="31" ry="30" fill={`url(#${shadeId})`} />
      <ellipse cx="50" cy="55" rx="31" ry="30" fill="none" stroke={tone.deep} strokeOpacity="0.16" strokeWidth="1" />

      {name === 'fox' && (
        <>
          <ellipse cx="37" cy="67" rx="11" ry="9" fill={tone.light} opacity="0.95" />
          <ellipse cx="63" cy="67" rx="11" ry="9" fill={tone.light} opacity="0.95" />
        </>
      )}

      {name === 'penguin' && (
        <>
          <path d="M50 30 C63 30 72 42 72 56 C72 74 62 85 50 85 C38 85 28 74 28 56 C28 42 37 30 50 30 Z" fill={tone.light} />
          <path d="M50 30 C63 30 72 42 72 56 C72 74 62 85 50 85 C38 85 28 74 28 56 C28 42 37 30 50 30 Z" fill={`url(#${shadeId})`} />
        </>
      )}

      {(name === 'bear' || name === 'rabbit' || name === 'squirrel' || name === 'cat' || name === 'santacat') && (
        <ellipse cx="50" cy="69" rx="15" ry="11" fill={tone.light} opacity="0.9" />
      )}

      {name === 'owl' && (
        <>
          <circle cx="38" cy="53" r="12" fill={tone.light} />
          <circle cx="62" cy="53" r="12" fill={tone.light} />
        </>
      )}

      {/* 눈 */}
      {name === 'owl' ? (
        <>
          <circle cx="38" cy="53" r="6" fill={tone.deep} />
          <circle cx="62" cy="53" r="6" fill={tone.deep} />
          <circle cx="36" cy="51" r="2" fill="#FFF8EC" />
          <circle cx="60" cy="51" r="2" fill="#FFF8EC" />
          <circle cx="38" cy="53" r="12" fill="none" stroke="#C59B48" strokeWidth="1.4" opacity="0.85" />
          <circle cx="62" cy="53" r="12" fill="none" stroke="#C59B48" strokeWidth="1.4" opacity="0.85" />
          <path d="M50 53 L50 55" stroke="#C59B48" strokeWidth="1.2" />
        </>
      ) : (
        <>
          <ellipse cx="39" cy="57" rx="4" ry="4.9" fill={tone.deep} />
          <ellipse cx="61" cy="57" rx="4" ry="4.9" fill={tone.deep} />
          <circle cx="37.6" cy="55.3" r="1.35" fill="#FFFBF2" />
          <circle cx="59.6" cy="55.3" r="1.35" fill="#FFFBF2" />
        </>
      )}

      {/* 코 · 입 */}
      {name === 'penguin' ? (
        <>
          <path d="M50 60 L57 66 L50 69 L43 66 Z" fill="#E39A4B" />
        </>
      ) : name === 'owl' ? (
        <>
          <path d="M50 60 L55 68 L50 71 L45 68 Z" fill="#D99A54" />
        </>
      ) : (
        <>
          <path d="M47 63 Q50 61 53 63 Q50 66 47 63 Z" fill={tone.deep} opacity="0.85" />
          <path d="M50 66 Q50 69 46.5 69" stroke={tone.deep} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M50 66 Q50 69 53.5 69" stroke={tone.deep} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
        </>
      )}

      {/* 볼 */}
      <ellipse cx="31" cy="66" rx="5" ry="3" fill="#D98A80" opacity="0.32" />
      <ellipse cx="69" cy="66" rx="5" ry="3" fill="#D98A80" opacity="0.32" />

      {/* 수염 */}
      {(name === 'cat' || name === 'santacat') && (
        <>
          <path d="M24 62 L36 63 M24 68 L36 67" stroke={tone.deep} strokeWidth="0.9" opacity="0.5" strokeLinecap="round" />
          <path d="M76 62 L64 63 M76 68 L64 67" stroke={tone.deep} strokeWidth="0.9" opacity="0.5" strokeLinecap="round" />
        </>
      )}

      {name === 'squirrel' && (
        <>
          <path d="M45 73 L45 78 M50 73 L50 78" stroke="#FFFCF4" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="79" cy="76" r="6" fill="#C08A4E" />
          <path d="M79 72 Q82 76 79 80" stroke="#8A5A2B" strokeWidth="1.6" fill="none" />
        </>
      )}

      {name === 'santacat' && (
        <>
          <path d="M24 34 Q50 8 76 34 Q50 26 24 34 Z" fill="#8C2D38" />
          <path d="M22 33 Q50 24 78 33 L78 40 Q50 31 22 40 Z" fill="#F8F3E9" />
          <circle cx="76" cy="26" r="6" fill="#F8F3E9" />
          <path d="M28 80 Q50 74 72 80 L72 88 Q50 82 28 88 Z" fill="#1B3B2B" opacity="0.85" />
        </>
      )}

      {name === 'penguin' && (
        <>
          <path d="M22 80 Q50 72 78 80 L78 88 Q50 80 22 88 Z" fill="#8C2D38" />
          <path d="M70 84 L76 96 L68 94 Z" fill="#8C2D38" />
        </>
      )}

      {name === 'bear' && (
        <path d="M34 82 Q50 76 66 82" stroke="#C59B48" strokeWidth="2" fill="none" opacity="0.85" />
      )}
    </svg>
  )
}
