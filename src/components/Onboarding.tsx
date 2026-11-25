import { useMemo, useState } from 'react'
import { ArrowRight, Check, Shuffle, Sparkles } from 'lucide-react'
import type { AgeBand, AvatarKey, Profile } from '../types'
import { AVATARS, Avatar } from './Avatar'

const AGE_BANDS: AgeBand[] = ['20대', '30대', '40대', '50대+', '비공개']

const TAGS = ['혼술', '논알콜', '독서', '영화·드라마', '재즈·플레이리스트', '요리', '반려동물', '전시', '여행', '산책']

const FIRST = ['밤의', '12월의', '느린', '조용한', '다정한', '골드', '윈터', '창가', '서재의', '한잔']
const SECOND = ['고양이', '여우', '부엉이', '토끼', '다람쥐', '펭귄', '곰돌이', '달빛', '재즈', '이불']

function suggestName(): string {
  const first = FIRST[Math.floor(Math.random() * FIRST.length)]
  const second = SECOND[Math.floor(Math.random() * SECOND.length)]
  return `${first} ${second}`
}

export function Onboarding({
  initial,
  editMode,
  onSave,
  onClose,
  onReset,
}: {
  initial: Profile | null
  editMode: boolean
  onSave: (profile: Profile) => void
  onClose: () => void
  onReset: () => void
}) {
  const [avatar, setAvatar] = useState<AvatarKey>(initial?.avatar ?? 'fox')
  const [nickname, setNickname] = useState(initial?.nickname ?? '')
  const [ageBand, setAgeBand] = useState<AgeBand>(initial?.ageBand ?? '비공개')
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [error, setError] = useState('')
  const suggestion = useMemo(() => suggestName(), [])

  const toggleTag = (tag: string) => {
    setTags((prev) => {
      if (prev.includes(tag)) return prev.filter((item) => item !== tag)
      if (prev.length >= 4) return prev
      return [...prev, tag]
    })
  }

  const submit = () => {
    const name = nickname.trim() || suggestion
    if (name.length < 2) {
      setError('닉네임은 두 글자 이상으로 지어주세요.')
      return
    }
    if (name.length > 12) {
      setError('닉네임은 12자까지 가능해요.')
      return
    }
    onSave({ nickname: name, avatar, ageBand, tags, joinedAt: initial?.joinedAt ?? new Date().toISOString() })
  }

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto"
      style={{ background: 'var(--overlay)', backdropFilter: 'blur(8px)' }}
    >
      <div className="mx-auto flex min-h-full max-w-5xl items-center px-4 py-8">
        <div
          className="animate-fade-up grid w-full overflow-hidden card md:grid-cols-[0.85fr_1.15fr]"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <aside className="relative hidden flex-col justify-between overflow-hidden p-9 md:flex" style={{ background: '#1B3B2B', color: '#F7F1E6' }}>
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 20%, #C59B48 0.6px, transparent 0.7px), radial-gradient(circle at 70% 60%, #C59B48 0.6px, transparent 0.7px)',
                backgroundSize: '26px 26px, 34px 34px',
              }}
            />
            <div className="relative">
              <p className="kicker" style={{ color: '#C59B48' }}>
                WELCOME TO DINGDONG
              </p>
              <h2 className="serif mt-5 text-[30px] leading-[1.45]">
                잘 차려입은 마음만
                <br />
                있으면 됩니다.
              </h2>
              <p className="mt-5 text-[12.5px] leading-[1.9]" style={{ color: 'rgba(247,241,230,0.72)' }}>
                회원가입도, 실명도 필요 없어요. 캐릭터 하나와 닉네임이면 오늘 밤의 자리가 준비됩니다.
              </p>
            </div>
            <div className="relative mt-10 space-y-4">
              {[
                ['01', '캐릭터를 고릅니다', '14종의 동물 캐릭터 중 하나'],
                ['02', '닉네임을 정합니다', '실명 대신 오늘의 이름'],
                ['03', '문을 엽니다', '딩동의 12개 공간'],
              ].map(([num, title, detail]) => (
                <div key={num} className="flex gap-4 border-t pt-3.5" style={{ borderColor: 'rgba(247,241,230,0.18)' }}>
                  <span className="serif text-[12px]" style={{ color: '#C59B48' }}>{num}</span>
                  <div>
                    <p className="text-[12.5px]">{title}</p>
                    <p className="mt-0.5 text-[11px]" style={{ color: 'rgba(247,241,230,0.55)' }}>{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section className="p-6 sm:p-9" style={{ background: 'var(--surface)' }}>
            <p className="kicker">{editMode ? 'My profile' : '3초 입장'}</p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <h1 className="serif text-[24px] leading-tight sm:text-[28px]">
                {editMode ? '프로필 바꾸기' : '어떤 캐릭터로 들어올까요?'}
              </h1>
              {editMode && (
                <button type="button" onClick={onClose} className="btn btn-ghost btn-sm" aria-label="닫기">
                  닫기
                </button>
              )}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="smallcaps" style={{ color: 'var(--muted)' }}>캐릭터</p>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {AVATARS.find((item) => item.key === avatar)?.label} · {AVATARS.find((item) => item.key === avatar)?.hint}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2.5">
                {AVATARS.map((item) => {
                  const selected = avatar === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setAvatar(item.key)}
                      aria-label={item.label}
                      aria-pressed={selected}
                      className="group relative flex flex-col items-center gap-1.5 rounded-md p-1.5 transition-all"
                      style={{
                        border: selected ? '1px solid var(--gold)' : '1px solid var(--line)',
                        background: selected ? 'color-mix(in srgb, var(--gold) 9%, transparent)' : 'transparent',
                      }}
                    >
                      <Avatar name={item.key} size={48} />
                      <span className="text-[10px]" style={{ color: selected ? 'var(--ink)' : 'var(--muted)' }}>
                        {item.label}
                      </span>
                      {selected && (
                        <span
                          className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full"
                          style={{ background: 'var(--gold)' }}
                        >
                          <Check size={8} color="#211804" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6">
              <label className="smallcaps block" htmlFor="nickname" style={{ color: 'var(--muted)' }}>
                닉네임
              </label>
              <div className="mt-1 flex items-end gap-2">
                <input
                  id="nickname"
                  className="input"
                  placeholder={suggestion}
                  value={nickname}
                  maxLength={12}
                  onChange={(event) => {
                    setNickname(event.target.value)
                    setError('')
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') submit()
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setNickname(suggestName())
                    setError('')
                  }}
                  className="btn btn-outline btn-sm mb-1 shrink-0"
                  title="닉네임 제안"
                >
                  <Shuffle size={13} />
                  제안
                </button>
              </div>
              {error && <p className="mt-2 text-[11.5px]" style={{ color: 'var(--burgundy)' }}>{error}</p>}
            </div>

            <div className="mt-6">
              <p className="smallcaps" style={{ color: 'var(--muted)' }}>연령대 <span className="normal-case tracking-normal opacity-70">(선택)</span></p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {AGE_BANDS.map((band) => (
                  <button
                    key={band}
                    type="button"
                    className="chip"
                    data-on={ageBand === band}
                    onClick={() => setAgeBand(band)}
                    aria-pressed={ageBand === band}
                  >
                    {band}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px]" style={{ color: 'var(--muted)' }}>
                방에서는 나이를 말하지 않아도 됩니다. 같은 연령대의 방을 찾을 때만 쓰여요.
              </p>
            </div>

            <div className="mt-5">
              <p className="smallcaps" style={{ color: 'var(--muted)' }}>관심사 <span className="normal-case tracking-normal opacity-70">(최대 4개)</span></p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="chip"
                    data-on={tags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                    aria-pressed={tags.includes(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" onClick={submit} className="btn btn-primary mt-7 w-full py-3.5">
              {editMode ? '프로필 저장' : '딩동 입장하기'}
              <ArrowRight size={16} />
            </button>

            <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              <Sparkles size={11} className="mt-0.5 shrink-0" />
              성인용 개발 체험판입니다. 연령 인증 및 실제 이용자 연결 전이며 정보는 브라우저에만 저장됩니다.
            </p>

            {editMode && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('이 브라우저에 저장된 프로필과 활동 기록을 지울까요?')) onReset()
                }}
                className="mt-4 text-[11px] underline underline-offset-2"
                style={{ color: 'var(--muted)' }}
              >
                이 브라우저의 프로필 지우기
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
