import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Shuffle, Sparkles } from 'lucide-react'
import type { AgeBand, AvatarKey, Profile } from '../types'
import { AVATARS, Avatar } from './Avatar'
import { createAvatarGallery } from '../lib/avatarGallery.js'

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
  const host=useRef<HTMLDivElement>(null),gallery=useRef<ReturnType<typeof createAvatarGallery>|null>(null)
  const [fallback,setFallback]=useState(false)
  useEffect(()=>{if(!host.current)return;try{const g=createAvatarGallery(host.current,AVATARS.map(a=>a.key),setAvatar);gallery.current=g;return()=>{g.dispose();gallery.current=null}}catch{setFallback(true)}},[])
  useEffect(()=>{gallery.current?.select(avatar)},[avatar])
  const choose=(delta:number)=>{const i=AVATARS.findIndex(a=>a.key===avatar);setAvatar(AVATARS[(i+delta+AVATARS.length)%AVATARS.length].key)}

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

  return <div className="dd-entry">
    <div ref={host} className="dd-entry-world" data-testid="avatar-gallery"/>
    {fallback&&<div className="dd-entry-fallback"><Avatar name={avatar} size={110}/><p>WebGL 미지원 · 2D 접근성 대체</p></div>}
    <header className="dd-entry-title"><span>WELCOME TO</span><h1>딩동 DINGDONG</h1><p>{editMode?'캐릭터 의상실':'우리 동네 온라인 파티 · 나의 캐릭터 만들기'}</p>{editMode&&<button className="dd3-btn" onClick={onClose}>닫기</button>}</header>
    <div className="dd-entry-controls">
      <div className="dd-entry-pick"><button className="dd3-btn" aria-label="이전 캐릭터" onClick={()=>choose(-1)}>‹</button><div><label htmlFor="dd-entry-avatar">내 캐릭터</label><select id="dd-entry-avatar" value={avatar} onChange={e=>setAvatar(e.target.value as AvatarKey)}>{AVATARS.map(a=><option key={a.key} value={a.key}>{a.label}</option>)}</select></div><button className="dd3-btn" aria-label="다음 캐릭터" onClick={()=>choose(1)}>›</button></div>
      <p className="dd-entry-tip">캐릭터를 터치해 선택 · 좌우 드래그로 회전</p>
      <div className="dd-entry-name"><label htmlFor="nickname">닉네임</label><input id="nickname" className="input" placeholder={suggestion} value={nickname} maxLength={12} onChange={e=>{setNickname(e.target.value);setError('')}} onKeyDown={e=>{if(e.key==='Enter')submit()}}/><button className="dd3-btn" onClick={()=>{setNickname(suggestName());setError('')}} aria-label="닉네임 제안"><Shuffle size={15}/></button></div>
      {error&&<p role="alert">{error}</p>}
      <details><summary>연령대·관심사 (선택)</summary><div className="dd-entry-tags">{AGE_BANDS.map(b=><button key={b} className="chip" data-on={ageBand===b} onClick={()=>setAgeBand(b)}>{b}</button>)}</div><div className="dd-entry-tags">{TAGS.map(t=><button key={t} className="chip" data-on={tags.includes(t)} onClick={()=>toggleTag(t)}>{t}</button>)}</div></details>
      <button className="dd-entry-enter" onClick={submit}>{editMode?'프로필 저장':'딩동 입장하기'} <ArrowRight size={18}/></button>
      <small><Sparkles size={12}/> 성인용 로컬 개발 체험 · 실제 회원/연령 인증 미연결</small>
      {editMode&&<button className="dd3-btn" onClick={()=>{if(window.confirm('이 브라우저에 저장된 프로필과 활동 기록을 지울까요?'))onReset()}}>로컬 프로필 초기화</button>}
    </div>
  </div>
}
