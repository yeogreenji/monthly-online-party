import { useEffect, useState } from 'react'
import type { Profile, RoomId } from '../types'
import { MONTHLY_IDEAS } from '../data/dingdong'
import type { Space } from '../data/dingdong'
import { usePersistentState } from '../lib/storage'
import { Avatar } from './Avatar'
import { SectionHead } from './ui'
import { ROOMS } from '../data/rooms'
import { resizeImageFile } from '../lib/image'
import { Mansion3D } from './Mansion3D'
import { RESIDENTS } from '../data/world'

type Visibility = 'private' | 'friends' | 'public'
type Topic = { id: string; space: string; title: string; description: string; date: string; capacity: number; age: string }
type Message = { id: string; text: string; image?: string; at: string }
type History = { id: string; title: string; at: string; visibility: Visibility }
const VISIBILITY = { private: '비공개', friends: '친구 공개(설정만)', public: '전체 공개(설정만)' }
const INITIAL_HOME = { intro: '', wallpaper: '#f3dfc8', furniture: '🛋️', pet: '🐈', accessory: '🎀', visibility: 'private' as Visibility }
const FIELD = 'w-full rounded-xl border border-current/15 bg-transparent px-3 py-2 text-sm'
const uuid = () => globalThis.crypto?.randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2)
export function DingdongSpaces({ profile, onLegacy, onParty, onEditProfile }: { profile: Profile; onLegacy: (id: RoomId) => void; onParty: () => void; onEditProfile: () => void }) {
  const [space, setSpace] = useState<Space | null>(null)
  const [autoChat, setAutoChat] = useState(false)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [favorites, setFavorites] = usePersistentState<string[]>('dd.favorites.v1', [])
  const [topics, setTopics] = usePersistentState<Topic[]>('dd.topics.v1', [])
  const [messages, setMessages] = usePersistentState<Record<string, Message[]>>('dd.messages.v1', {})
  const [history, setHistory] = usePersistentState<History[]>('dd.history.v1', [])
  const [home, setHome] = usePersistentState('dd.home.v1', INITIAL_HOME)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [draft, setDraft] = useState('')
  const [picture, setPicture] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [capacity, setCapacity] = useState(20)
  const [age, setAge] = useState('성인 전체')
  const [saveHistory, setSaveHistory] = useState(false)
  const [visibility, setVisibility] = useState<Visibility>('private')
  useEffect(()=>{if(!space || !autoChat || space.id==='home')return;const first=space.topics[0];if(!first)return;const timer=window.setTimeout(()=>{setTopic({id:space.id+'-0',space:space.id,title:first,description:'자유롭게 이야기를 나누는 시연 모임',date:'',capacity:20,age:'성인 전체'});setAutoChat(false)},window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:680);return()=>window.clearTimeout(timer)},[space,autoChat])
  function openSpace(next: Space) { setSpace(next); setTopic(null); setShowCreate(false); setNotice(''); setAutoChat(next.id!=='home'); setDraft(''); setPicture(''); setSaveHistory(false); setVisibility('private') }
  function enter(next: Topic) { setAutoChat(false); setTopic(next); setDraft(''); setPicture(''); setNotice(''); setSaveHistory(false); setVisibility('private') }
  function leave() {
    if (topic && saveHistory) setHistory(prev => [{id: uuid(), title: topic.title, at: new Date().toISOString(), visibility}, ...prev].slice(0,100))
    setAutoChat(false); setTopic(null); setDraft(''); setPicture(''); setNotice('')
  }
  function send() {
    if (!topic || (!draft.trim() && !picture)) return
    const item = {id: uuid(), text: draft.trim().slice(0,1000), image: picture || undefined, at: new Date().toISOString()}
    setMessages(prev => ({...prev, [topic.id]: [...(prev[topic.id] ?? []), item].slice(-50)}))
    setDraft(''); setPicture('')
  }
  return <section id="rooms" className="px-5 py-14 sm:px-8" style={{background:'var(--bg-deep)'}}>
    <div className="mx-auto max-w-[1280px]">
      <SectionHead kicker="DINGDONG · OPEN THE DOOR" title="오늘은 어느 문을 열어볼까요?" description="차 한 잔도, 책 한 권도, 소소한 이야기 하나도 파티가 됩니다. 12개의 공간을 둘러보세요. 현재는 성인용 로컬 개발 체험판입니다." action={<button type="button" className="btn btn-outline" aria-pressed={onlyFavorites} onClick={()=>setOnlyFavorites(v=>!v)}>{onlyFavorites?'전체 공간':'★ 즐겨찾기만'}</button>}/>
      <div className="mb-5 rounded-xl border p-4 text-xs leading-relaxed" style={{borderColor:'var(--line)',background:'var(--surface)'}}>개발 체험판 · 실제 접속자, 다중 사용자 채팅, 연령 인증 및 서버 정원 검증은 아직 연결되지 않았습니다. 입력 내용은 이 브라우저에만 저장됩니다.</div>
      <div className={'dd3-layout'+(space?' dd3-with-chat':'')}>
        <Mansion3D profile={profile} active={space} onEnter={openSpace} onLeave={()=>{leave();setSpace(null)}} favorites={favorites} onlyFavorites={onlyFavorites} onFavorite={id=>setFavorites(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])}/>
        {space&&<aside role="region" aria-label={space.name} className="dd3-chat dd-chat-reveal">
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="serif text-2xl">{space.name}</h2><p className="text-xs" style={{color:'var(--muted)'}}>{space.subtitle}</p></div><button type="button" className="btn btn-outline btn-sm" onClick={()=>{leave();setSpace(null)}}>복도로 나가기</button></div>
        {RESIDENTS[space.id]&&<div className="dd3-npc"><strong>{RESIDENTS[space.id].name} · 안내용 NPC</strong><p>{RESIDENTS[space.id].greeting}</p></div>}
        {autoChat && <p role="status" className="text-sm py-3">공간에 도착했어요. 대화창을 준비합니다…</p>}
        {space.id==='season' && <button className="btn btn-outline mb-3" onClick={()=>{leave();setSpace(null);onParty()}}>크리스마스 파티 일정 보기</button>}
        {space.id==='home' ? <div className="space-y-4">
          <div className="rounded-2xl p-5 text-center" style={{background:home.wallpaper,color:'#48382e'}}><div className="flex justify-center"><Avatar name={profile.avatar} size={75}/></div><p className="mt-1 text-lg">{home.accessory} {profile.nickname}</p><div className="mt-6 flex justify-center gap-6 text-5xl">{home.furniture} {home.pet}</div><p className="mt-4 text-sm">{home.intro||'나의 작은 집에 오신 것을 환영해요.'}</p></div>
          <button className="btn btn-outline" onClick={()=>{leave();setSpace(null);onEditProfile()}}>캐릭터·닉네임·취향 수정</button>
          <label className="block text-sm">미니홈피 소개<textarea className={FIELD} maxLength={160} value={home.intro} onChange={e=>setHome(p=>({...p,intro:e.target.value}))}/></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">벽지<select className={FIELD} value={home.wallpaper} onChange={e=>setHome(p=>({...p,wallpaper:e.target.value}))}>{[['#f3dfc8','크림'],['#d7e4ca','숲'],['#ead1de','분홍'],['#cddbe9','하늘']].map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label>
            <label className="text-sm">가구<select className={FIELD} value={home.furniture} onChange={e=>setHome(p=>({...p,furniture:e.target.value}))}>{['🛋️','🛏️','🪑','📚'].map(v=><option key={v}>{v}</option>)}</select></label>
            <label className="text-sm">반려동물<select className={FIELD} value={home.pet} onChange={e=>setHome(p=>({...p,pet:e.target.value}))}>{['🐈','🐕','🐇','🐹','없음'].map(v=><option key={v}>{v}</option>)}</select></label>
            <label className="text-sm">소품<select className={FIELD} value={home.accessory} onChange={e=>setHome(p=>({...p,accessory:e.target.value}))}>{['🎀','🎩','🧣','🌷','없음'].map(v=><option key={v}>{v}</option>)}</select></label>
          </div>
          <label className="text-sm">미니홈피 공개 범위<select className={FIELD} value={home.visibility} onChange={e=>setHome(p=>({...p,visibility:e.target.value as Visibility}))}>{Object.entries(VISIBILITY).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
          <p className="text-xs" style={{color:'var(--muted)'}}>자동 로컬 저장 · 공개 범위 설정은 실제 공개되지 않습니다. 친구 방문, 방명록, 초인종, 선물 및 전체 의상 꾸미기는 후속 연결 대상입니다.</p>
          <h3 className="serif text-lg">나의 모임 기록</h3>{history.length===0?<p className="text-sm">저장한 모임이 없어요.</p>:history.map(h=><div className="card flex flex-wrap items-center justify-between gap-2 p-3 text-sm" key={h.id}><span>{h.title} · {VISIBILITY[h.visibility]}</span><button className="btn btn-ghost btn-sm" onClick={()=>setHistory(p=>p.filter(x=>x.id!==h.id))}>삭제</button></div>)}
        </div> : autoChat ? null : topic ? <div className="space-y-3 dd-chat-reveal">
          <div className="flex flex-wrap items-center justify-between gap-2"><button className="btn btn-ghost" onClick={leave}>← 모임 목록</button><span className="text-xs">로컬 체험 · 목표 정원 {topic.capacity}명</span></div>
          <h3 className="serif text-xl">{topic.title}</h3><p className="text-sm">{topic.description}</p>
          <div className="max-h-80 min-h-40 space-y-3 overflow-auto rounded-xl p-3" style={{background:'var(--bg-deep)'}}><p className="text-xs" style={{color:'var(--muted)'}}>시연 안내: 다른 실제 이용자는 연결되지 않습니다. 메시지와 사진을 저장하는 체험입니다.</p>{(messages[topic.id]??[]).map(m=><div key={m.id} className="ml-auto max-w-[85%] rounded-xl p-3" style={{background:'var(--surface)'}}><p className="text-xs">{profile.nickname}</p><p className="whitespace-pre-wrap break-all text-sm">{m.text}</p>{m.image && <img src={m.image} alt="내가 올린 사진" className="mt-2 max-h-48 rounded-lg"/>}<button className="mt-1 text-xs underline" onClick={()=>setMessages(p=>({...p,[topic.id]:(p[topic.id]??[]).filter(x=>x.id!==m.id)}))}>삭제</button></div>)}</div>
          {picture&&<div className="flex items-center gap-2"><img src={picture} alt="첨부 미리보기" className="h-16 rounded"/><button className="btn btn-ghost btn-sm" onClick={()=>setPicture('')}>첨부 제거</button></div>}
          <div className="flex flex-wrap gap-2">{['😊','💛','🎄','☕','👏'].map(e=><button key={e} className="btn btn-ghost btn-sm" onClick={()=>setDraft(p=>(p+e).slice(0,1000))}>{e}</button>)}</div>
          <form className="flex gap-2" onSubmit={e=>{e.preventDefault();send()}}><input className={FIELD+' min-w-0 flex-1'} aria-label="메시지" maxLength={1000} value={draft} placeholder="이야기를 나눠보세요" onChange={e=>setDraft(e.target.value)}/><button className="btn btn-primary" disabled={loading||(!draft.trim()&&!picture)}>전송</button></form>
          <label className="block text-xs">사진 첨부(로컬, JPEG/PNG/WebP)<input type="file" accept="image/jpeg,image/png,image/webp" disabled={loading} className="block max-w-full text-xs" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>5_000_000){setNotice('5MB 이하 사진만 첨부할 수 있어요.');return}setLoading(true);try{const image=await resizeImageFile(file,320,0.5);if(image.length>90000||!image.startsWith('data:image/jpeg'))throw Error('image');setPicture(image);setNotice('')}catch{setNotice('사진을 처리할 수 없어요. 작은 사진을 선택해 주세요.')}finally{setLoading(false)}}}/></label>
          {notice&&<p role="status" className="text-xs">{notice}</p>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={saveHistory} onChange={e=>setSaveHistory(e.target.checked)}/> 나갈 때 참여 기록 저장</label>
          {saveHistory&&<select className={FIELD} aria-label="참여 기록 공개 범위" value={visibility} onChange={e=>setVisibility(e.target.value as Visibility)}>{Object.entries(VISIBILITY).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>}
          <button className="btn btn-outline" onClick={leave}>모임 나가기</button>
        </div> : <div className="space-y-4">
          {space.id==='single'&&<p className="text-xs">성인 인증 전이므로 실제 만남이나 DM 연결은 제공하지 않습니다.</p>}
          <div className="flex items-center justify-between"><h3 className="serif text-lg">이 공간의 모임</h3><button className="btn btn-outline" onClick={()=>setShowCreate(v=>!v)}>{showCreate?'닫기':'+ 모임 만들기'}</button></div>
          {showCreate&&<form className="card space-y-3 p-4" onSubmit={e=>{e.preventDefault();if(!title.trim()||!Number.isInteger(capacity)||capacity<1||capacity>20)return;const next={id:uuid(),space:space.id,title:title.trim(),description:description.trim(),date,capacity,age};setTopics(p=>[next,...p]);setTitle('');setDescription('');setDate('');setCapacity(20);setShowCreate(false);enter(next)}}>
            <label className="block text-sm">제목<input className={FIELD} required maxLength={60} value={title} onChange={e=>setTitle(e.target.value)}/></label>
            <label className="block text-sm">설명<textarea className={FIELD} maxLength={300} value={description} onChange={e=>setDescription(e.target.value)}/></label>
            <label className="block text-sm">일정<input type="datetime-local" className={FIELD} value={date} onChange={e=>setDate(e.target.value)}/></label>
            <div className="grid grid-cols-2 gap-2"><label className="text-sm">목표 인원<input type="number" min={1} max={20} required className={FIELD} value={capacity} onChange={e=>setCapacity(Number(e.target.value))}/></label><label className="text-sm">연령 그룹<select className={FIELD} value={age} onChange={e=>setAge(e.target.value)}>{['성인 전체','20대','30대','40대','50대 이상'].map(v=><option key={v}>{v}</option>)}</select></label></div>
            <button className="btn btn-primary">로컬 모임 만들기</button>
          </form>}
          {[...topics.filter(t=>t.space===space.id),...space.topics.map((t,i)=>({id:space.id+'-'+i,space:space.id,title:t,description:'자유롭게 이야기를 나누는 시연 모임',date:'',capacity:20,age:'성인 전체'}))].map(t=><button key={t.id} className="card flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left" onClick={()=>enter(t)}><span><strong className="text-sm">{t.title}</strong><span className="block text-xs" style={{color:'var(--muted)'}}>{t.date.replace('T',' ')} · {t.age} · 목표 {t.capacity}명</span></span><span className="text-xs">체험 입장 →</span></button>)}
          {space.legacy?.map(id=><button key={id} className="card flex w-full justify-between gap-2 p-4 text-left" onClick={()=>{leave();setSpace(null);onLegacy(id)}}><span>{ROOMS.find(r=>r.id===id)?.name}</span><span className="text-xs">기존 시연방 →</span></button>)}
        </div>}
      </div>
        </aside>}
      </div>
      <div className="mt-10"><h3 className="serif text-xl">365일, 작은 파티의 계절</h3><p className="my-2 text-xs" style={{color:'var(--muted)'}}>연간 테마 기획 · 음력 명절의 정확한 날짜와 매일 모임 자동 편성은 추후 연결합니다.</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{MONTHLY_IDEAS.map((idea,i)=><div className="card p-3" key={i}><strong className="text-sm">{i+1}월</strong><p className="mt-1 text-xs leading-relaxed">{idea}</p></div>)}</div></div>
    </div>
  </section>
}
