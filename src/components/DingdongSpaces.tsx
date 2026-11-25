import {FestivalArt} from './FestivalArt'
import {PartyPopper,CalendarDays,Map,Home,Settings,Shirt,UserRound,Mail,Bell,Camera,MessageCircle,ImagePlus,Smile,MapPin,Send,MoreHorizontal,ChevronDown,ChevronLeft} from 'lucide-react'
import { access } from '../data/phase1'
import { DEFAULT_LOOK, normalizeLook } from '../data/avatarLook'
import { AvatarWardrobe, AvatarPreview } from './AvatarWardrobe'
import { useEffect, useState, useRef } from 'react'
import type { Profile, RoomId } from '../types'
import { MONTHLY_IDEAS, SPACES } from '../data/dingdong'
import type { Space } from '../data/dingdong'
import { usePersistentState } from '../lib/storage'
import { ROOMS } from '../data/rooms'
import { resizeImageFile } from '../lib/image'
import { Mansion3D } from './Mansion3D'
import { RESIDENTS } from '../data/world'

type Visibility = 'private' | 'friends' | 'public'
type Topic = { id: string; space: string; title: string; description: string; date: string; capacity: number; age: string }
type Place = {name:string;url:string}
type Message = { id: string; text: string; image?: string; place?:Place; at: string }
function safePlaceUrl(value:string){try{const u=new URL(value.trim());return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}}
type History = { id: string; title: string; at: string; visibility: Visibility }
const VISIBILITY = { private: '비공개', friends: '친구 공개(설정만)', public: '전체 공개(설정만)' }
const INITIAL_HOME = { intro: '', wallpaper: '#f3dfc8', furniture: '🛋️', pet: '🐈', accessory: '🎀', visibility: 'private' as Visibility }
const FIELD = 'w-full rounded-xl border border-current/15 bg-transparent px-3 py-2 text-sm'
const uuid = () => globalThis.crypto?.randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2)
export function DingdongSpaces({ profile, onLegacy, onParty, onEditProfile, onMenu }: { profile: Profile; onLegacy: (id: RoomId) => void; onParty: () => void; onEditProfile: () => void; onMenu:(id:string)=>void }) {
  const [space, setSpace] = useState<Space | null>(null)
  const [savedLook,setLook]=usePersistentState('dd.avatar.look.v1',DEFAULT_LOOK)
  const look=normalizeLook(savedLook)
  const [chatCollapsed,setChatCollapsed]=useState(true)
  const [chatExtras,setChatExtras]=useState(false),[emojiOpen,setEmojiOpen]=useState(false)
  const messageLog=useRef<HTMLDivElement>(null),fileInput=useRef<HTMLInputElement>(null),composer=useRef<HTMLInputElement>(null)
  const [wardrobe,setWardrobe]=useState(false)
  const [yearbook,setYearbook]=useState(false)
  const [toolsOpen,setToolsOpen]=useState(false),[mapOpen,setMapOpen]=useState(false),[mailOpen,setMailOpen]=useState(false)
  const [request,setRequest]=useState<{id:string;serial:number}|null>(null)
  function closePanels(){setWardrobe(false);setYearbook(false);setMapOpen(false);setMailOpen(false);setToolsOpen(false)}
  function showPanel(id:string){closePanels();setChatCollapsed(true);if(id==='wardrobe')setWardrobe(true);if(id==='events')setYearbook(true);if(id==='map')setMapOpen(true);if(id==='mail')setMailOpen(true)}
  function toggleTools(v:boolean){if(v){closePanels();setChatCollapsed(true)}setToolsOpen(v)}
  function visit(id:string){closePanels();setChatCollapsed(true);setRequest(p=>({id,serial:(p?.serial??0)+1}))}
  function externalMenu(id:string){closePanels();setChatCollapsed(true);onMenu(id)}
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
  const [placeName,setPlaceName]=useState('')
  const [placeUrl,setPlaceUrl]=useState('')
  const [showPlace,setShowPlace]=useState(false)
  const [savedPlaces,setSavedPlaces]=usePersistentState<Place[]>('dd.places.v1',[])
  function clearPlace(){setPlaceName('');setPlaceUrl('');setShowPlace(false)}
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
  function openSpace(next: Space) { if(access(next.id)!=='open')return;setChatCollapsed(true);setSpace(next); setTopic(null); setShowCreate(false); setNotice(''); setAutoChat(next.id!=='home'); setDraft(''); setPicture(''); clearPlace(); setSaveHistory(false); setVisibility('private') }
  function enter(next: Topic) { setAutoChat(false); setTopic(next); setDraft(''); setPicture(''); clearPlace(); setNotice(''); setSaveHistory(false); setVisibility('private') }
  function leave() {
    if (topic && saveHistory) setHistory(prev => [{id: uuid(), title: topic.title, at: new Date().toISOString(), visibility}, ...prev].slice(0,100))
    setAutoChat(false); setTopic(null); setDraft(''); setPicture(''); clearPlace(); setNotice('')
  }
  useEffect(()=>{if(!chatCollapsed&&messageLog.current)messageLog.current.scrollTop=messageLog.current.scrollHeight},[chatCollapsed,topic?.id,messages,picture])
  function send() {
    if (!topic || (!draft.trim() && !picture && !placeName.trim())) return
    const url=safePlaceUrl(placeUrl)
    if((placeName.trim()||placeUrl.trim())&&(!placeName.trim()||!url)){setNotice('장소 이름과 올바른 http 또는 https 링크를 입력해 주세요.');return}
    const place=placeName.trim()?{name:placeName.trim().slice(0,100),url}:undefined
    const item = {id: uuid(), text: draft.trim().slice(0,1000), image: picture || undefined, place, at: new Date().toISOString()}
    setMessages(prev => ({...prev, [topic.id]: [...(prev[topic.id] ?? []), item].slice(-50)}))
    setDraft(''); setPicture('');clearPlace();setNotice('');setEmojiOpen(false);composer.current?.focus()
  }
  return <section id="rooms" className="dd-world-app">
      <nav className="dd-world-nav" aria-label="딩동 메뉴">{[{I:PartyPopper,n:'이벤트',f:()=>showPanel('events')},{I:CalendarDays,n:'일정',f:()=>externalMenu('calendar')},{I:Map,n:'지도',f:()=>showPanel('map')},{I:Home,n:'내 집',f:()=>visit('home')},{I:Settings,n:'설정',f:()=>toggleTools(!toolsOpen)}].map(({I,n,f})=><button key={n} onClick={f}><I size={22}/><span>{n}</span></button>)}</nav>
      <div className="dd-quick-links"><button aria-label="공지" onClick={()=>externalMenu('etiquette')}><Bell size={20}/></button><button aria-label="포토월" onClick={()=>externalMenu('wall')}><Camera size={20}/></button></div>
      {space?.id==='home'&&<div className="dd-home-actions"><button onClick={()=>showPanel('wardrobe')}><Shirt size={19}/>옷장</button><button onClick={onEditProfile}><UserRound size={19}/>프로필</button><button onClick={()=>showPanel('mail')}><Mail size={19}/>우편함</button></div>}
      {wardrobe&&<div className="dd-world-pop dd-world-wardrobe" role="dialog" aria-label="나의 옷장"><div className="dd-pop-title"><strong>나의 작은 옷장</strong><button className="dd3-btn" onClick={()=>setWardrobe(false)}>옷장 닫기</button></div><AvatarWardrobe avatar={profile.avatar} look={look} onChange={setLook}/></div>}
      {yearbook&&<div className="dd-world-pop" role="dialog" aria-label="연간 이벤트"><div className="dd-pop-title"><strong>딩동의 12개월 파티</strong><button className="dd3-btn" onClick={()=>setYearbook(false)}>닫기</button></div><p>월별 이벤트 기획 · 실제 날짜는 일정에서 확인</p><div className="dd-event-grid">{MONTHLY_IDEAS.map((idea,i)=><button key={i} onClick={()=>i===11?visit('season'):externalMenu('calendar')} style={{'--event-color':['#d6c5f8','#ffc8dc','#c6efdb','#f6cde1','#ffe2a6','#c5d8f6','#bde9ed','#e3caf5','#ffe0aa','#d8c2f1','#cee8d9','#f7c4d2'][i]} as React.CSSProperties}><FestivalArt month={i}/><strong>{i+1}월</strong><small>{idea}</small><span>{i===11?'시즌홀 입장':'일정 보기'}</span></button>)}</div></div>}
      {mapOpen&&<div className="dd-world-pop" role="dialog" aria-label="마을 지도"><div className="dd-pop-title"><strong>우리 동네 지도</strong><button className="dd3-btn" onClick={()=>setMapOpen(false)}>닫기</button></div><p>가게를 선택해 걸어가세요.</p><div className="dd-map-grid">{SPACES.map(s=><button key={s.id} onClick={()=>visit(s.id)}><span>{s.icon}</span><strong>{s.name}</strong><small>{access(s.id)==='open'?'방문':access(s.id)==='locked'?'잠금':'준비 중'}</small></button>)}</div><button className="dd3-btn" onClick={()=>setOnlyFavorites(v=>!v)}>{onlyFavorites?'전체 목적지':'즐겨찾기 목적지'}</button></div>}
      {mailOpen&&<div className="dd-world-pop" role="dialog" aria-label="나의 우편함"><div className="dd-pop-title"><strong>나의 우편함</strong><button className="dd3-btn" onClick={()=>setMailOpen(false)}>닫기</button></div><div className="dd-mail-empty"><Mail size={42}/><h3>친구의 편지가 도착하는 곳</h3><p>현재는 로컬 체험입니다. 친구 방문·편지 송수신은 실제 계정 및 권한 연결 후 제공합니다.</p></div></div>}
      <div className={'dd3-layout'+(space?' dd3-with-chat':'')+(space&&space.id!=='home'&&!chatCollapsed?' dd-chat-open':'')}>
        <Mansion3D onMenu={id=>{if(id==='home-wardrobe')showPanel('wardrobe');else if(id==='home-profile')onEditProfile();else if(id==='home-mailbox')showPanel('mail');else if(id==='home-decor'){closePanels();setChatCollapsed(false)}else externalMenu(id)}} profile={profile} look={look} home={home} active={space} request={request} toolsOpen={toolsOpen} onToolsChange={toggleTools} onEnter={openSpace} onLeave={()=>{leave();setSpace(null)}} onCapture={image=>{if(!topic){setNotice('모임에 입장한 뒤 촬영해 주세요.');return}setPicture(image);setChatCollapsed(false);setNotice('사진 첨부 완료 · 전송을 누르면 로컬 채팅에 저장됩니다.')}} favorites={favorites} onlyFavorites={onlyFavorites} onFavorite={id=>setFavorites(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])}/>
        {space&&<aside role="region" aria-label={space.name} className={"dd3-chat dd-chat-reveal"+(space.id!=="home"&&!chatCollapsed?" dd-messenger":"")}>
      <button type="button" className="dd3-collapse" aria-expanded={!chatCollapsed} onClick={()=>{if(chatCollapsed)closePanels();setChatCollapsed(v=>!v)}}>{space.id!=='home'&&<MessageCircle size={18}/>}<span>{space.id==='home'?(chatCollapsed?'집 꾸미기':'집 꾸미기 닫기'):(chatCollapsed?'채팅 펼치기':'채팅 접기')}</span>{!chatCollapsed&&<ChevronDown size={16}/>}</button>
      <div className={space.id!=='home'&&topic?'dd-chat-body':'p-4 sm:p-5'} hidden={chatCollapsed}>
        <div className="dd-room-heading mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="serif text-2xl">{space.name}</h2><p className="text-xs" style={{color:'var(--muted)'}}>{space.subtitle}</p></div><button type="button" className="btn btn-outline btn-sm" onClick={()=>{leave();setSpace(null)}}>복도로 나가기</button></div>
        {(!topic||space.id==='home')&&RESIDENTS[space.id]&&<div className="dd3-npc"><strong>{RESIDENTS[space.id].name} · 안내용 NPC</strong><p>{RESIDENTS[space.id].greeting}</p></div>}
        {autoChat && <p role="status" className="text-sm py-3">공간에 도착했어요. 대화창을 준비합니다…</p>}
        {space.id==='season' && !topic && <button className="btn btn-outline mb-3" onClick={onParty}>크리스마스 파티 일정 보기</button>}
        {space.id==='home' ? <div className="space-y-4">
          <div className="rounded-2xl p-5 text-center" style={{background:home.wallpaper,color:'#48382e'}}><div className="flex justify-center"><AvatarPreview avatar={profile.avatar} look={look}/></div><p className="mt-1 text-lg">{home.accessory} {profile.nickname}</p><div className="mt-6 flex justify-center gap-6 text-5xl">{home.furniture} {home.pet}</div><p className="mt-4 text-sm">{home.intro||'나의 작은 집에 오신 것을 환영해요.'}</p></div>
          <button className="btn btn-outline" onClick={()=>{leave();setSpace(null);onEditProfile()}}>캐릭터·닉네임·취향 수정</button>
          <label className="block text-sm">미니홈피 소개<textarea className={FIELD} maxLength={160} value={home.intro} onChange={e=>setHome(p=>({...p,intro:e.target.value}))}/></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">벽지<select className={FIELD} value={home.wallpaper} onChange={e=>setHome(p=>({...p,wallpaper:e.target.value}))}>{[['#f3dfc8','크림'],['#d7e4ca','숲'],['#ead1de','분홍'],['#cddbe9','하늘']].map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label>
            <label className="text-sm">가구<select className={FIELD} value={home.furniture} onChange={e=>setHome(p=>({...p,furniture:e.target.value}))}>{['🛋️','🛏️','🪑','📚'].map(v=><option key={v}>{v}</option>)}</select></label>
            <label className="text-sm">반려동물<select className={FIELD} value={home.pet} onChange={e=>setHome(p=>({...p,pet:e.target.value}))}>{['🐈','🐕','🐇','🐹','없음'].map(v=><option key={v}>{v}</option>)}</select></label>
            <label className="text-sm">소품<select className={FIELD} value={home.accessory} onChange={e=>setHome(p=>({...p,accessory:e.target.value}))}>{['🎀','🎩','🧣','🌷','없음'].map(v=><option key={v}>{v}</option>)}</select></label>
          </div>
          <label className="text-sm">미니홈피 공개 범위<select className={FIELD} value={home.visibility} onChange={e=>setHome(p=>({...p,visibility:e.target.value as Visibility}))}>{Object.entries(VISIBILITY).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
          <p className="text-xs" style={{color:'var(--muted)'}}>벽지·가구·반려동물은 내 3D 집에 적용되고 브라우저에 자동 저장됩니다. 공개 범위는 설정만 저장되며 실제 친구 방문·편지는 계정 연결 전 제공되지 않습니다.</p>
          <h3 className="serif text-lg">나의 모임 기록</h3>{history.length===0?<p className="text-sm">저장한 모임이 없어요.</p>:history.map(h=><div className="card flex flex-wrap items-center justify-between gap-2 p-3 text-sm" key={h.id}><span>{h.title} · {VISIBILITY[h.visibility]}</span><button className="btn btn-ghost btn-sm" onClick={()=>setHistory(p=>p.filter(x=>x.id!==h.id))}>삭제</button></div>)}
        </div> : autoChat ? null : topic ? <div className="dd-messenger-main">
          <header className="dd-message-header"><button className="dd-chat-icon" aria-label="모임 목록" onClick={leave}><ChevronLeft size={22}/></button><div><h3>{topic.title}</h3><p>로컬 체험 · 목표 정원 {topic.capacity}명</p></div><button className="dd-chat-icon" aria-label="채팅 설정" aria-expanded={chatExtras} onClick={()=>setChatExtras(v=>!v)}><MoreHorizontal size={22}/></button></header>
          {chatExtras&&<div className="dd-chat-settings"><p>{topic.description}</p><label><input type="checkbox" checked={saveHistory} onChange={e=>setSaveHistory(e.target.checked)}/> 나갈 때 참여 기록 저장</label>{saveHistory&&<select className={FIELD} aria-label="참여 기록 공개 범위" value={visibility} onChange={e=>setVisibility(e.target.value as Visibility)}>{Object.entries(VISIBILITY).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>}<button className="dd3-btn" onClick={leave}>모임 나가기</button></div>}
          <div ref={messageLog} className="dd-message-log" role="log" aria-label="대화 기록"><p className="dd-chat-system">로컬 채팅 체험 · 다른 실제 이용자는 연결되지 않습니다.</p>{(messages[topic.id]??[]).length===0&&<div className="dd-chat-empty"><MessageCircle size={34}/><strong>첫 이야기를 남겨보세요</strong><p>사진이나 장소도 함께 나눌 수 있어요.</p></div>}{(messages[topic.id]??[]).map(m=><div key={m.id} className="dd-own-message"><div className="dd-message-meta"><span>{profile.nickname}</span><div className="dd-chat-avatar"><AvatarPreview avatar={profile.avatar} look={look}/></div></div><div className="dd-message-bubble">{m.text&&<p>{m.text}</p>}{m.image&&<img src={m.image} alt="내가 올린 사진"/>}{m.place&&safePlaceUrl(m.place.url)&&<div className="dd-place-card"><strong><MapPin size={14}/> {m.place.name}</strong><a href={safePlaceUrl(m.place.url)} target="_blank" rel="noopener noreferrer">장소 링크 열기</a><button type="button" className="btn btn-ghost btn-sm" onClick={()=>{const place=m.place!;setSavedPlaces(p=>p.some(x=>x.url===place.url&&x.name===place.name)?p:[place,...p].slice(0,100))}}>장소 저장</button></div>}</div><div className="dd-message-time"><time dateTime={m.at}>{new Date(m.at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</time><button onClick={()=>setMessages(p=>({...p,[topic.id]:(p[topic.id]??[]).filter(x=>x.id!==m.id)}))}>삭제</button></div></div>)}</div>
          <div className="dd-chat-compose">
          {picture&&<div className="dd-chat-attachment"><img src={picture} alt="첨부 미리보기"/><button className="dd3-btn" onClick={()=>setPicture('')}>첨부 제거</button></div>}
          {showPlace&&<div className="dd-chat-place"><label>장소 이름<input aria-label="장소 이름" className={FIELD} value={placeName} maxLength={100} onChange={e=>setPlaceName(e.target.value)}/></label><label>장소 링크<input aria-label="장소 링크" className={FIELD} value={placeUrl} maxLength={2000} onChange={e=>setPlaceUrl(e.target.value)}/></label><small>운영 여부 미검증 · 로컬 추천</small></div>}
          {emojiOpen&&<div className="dd-emoji-tray">{['😊','💛','🎄','☕','👏','🎉','✨','🐾','❤️','😂','🙌','🌷'].map(e=><button key={e} aria-label={e} onClick={()=>setDraft(p=>(p+e).slice(0,1000))}>{e}</button>)}</div>}
          {notice&&<p role="status" className="dd-chat-notice">{notice}</p>}
          <form className="dd-message-form" onSubmit={e=>{e.preventDefault();send()}}><input ref={composer} aria-label="메시지" maxLength={1000} value={draft} placeholder="메시지를 입력하세요" onChange={e=>setDraft(e.target.value)}/><button className="dd-send" aria-label="전송" disabled={loading||(!draft.trim()&&!picture&&!placeName.trim())}><Send size={19}/></button></form>
          <div className="dd-compose-tools"><button className="dd-chat-icon" aria-label="사진 첨부" title="사진 첨부" onClick={()=>fileInput.current?.click()}><ImagePlus size={21}/></button><input ref={fileInput} hidden aria-label="사진 첨부 파일" type="file" accept="image/jpeg,image/png,image/webp" disabled={loading} className="block max-w-full text-xs" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>5_000_000){setNotice('5MB 이하 사진만 첨부할 수 있어요.');return}setLoading(true);try{const image=await resizeImageFile(file,320,0.5);if(image.length>90000||!image.startsWith('data:image/jpeg'))throw Error('image');setPicture(image);setNotice('')}catch{setNotice('사진을 처리할 수 없어요. 작은 사진을 선택해 주세요.')}finally{setLoading(false)}}}/><button className="dd-chat-icon" aria-label="이모티콘" title="이모티콘" aria-expanded={emojiOpen} onClick={()=>setEmojiOpen(v=>!v)}><Smile size={21}/></button><button className="dd-chat-icon" aria-label={showPlace?'장소 추천 입력 접기':'장소 추천 첨부'} title="장소 추천" onClick={()=>setShowPlace(v=>!v)}><MapPin size={21}/></button><details className="dd-chat-saved"><summary>저장한 장소 ({savedPlaces.length})</summary>{savedPlaces.filter(p=>safePlaceUrl(p.url)).map(p=><div key={p.name+p.url}><a href={safePlaceUrl(p.url)} target="_blank" rel="noopener noreferrer">{p.name}</a><button type="button" className="btn btn-ghost btn-sm" onClick={()=>setSavedPlaces(list=>list.filter(v=>v.url!==p.url||v.name!==p.name))}>삭제</button></div>)}</details></div>
          </div>
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
  </section>
}
