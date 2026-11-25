import {HomeEditor} from './HomeEditor'
import {HOME_DEFAULT,normalizeHome} from '../data/homeDecor'
import {FestivalArt} from './FestivalArt'
import {Paintbrush,PartyPopper,CalendarDays,Map,Home,Settings,Shirt,UserRound,Mail,Bell,Camera,MessageCircle,ImagePlus,Smile,MapPin,Send,MoreHorizontal,ChevronDown,ChevronLeft} from 'lucide-react'
import { access } from '../data/phase1'
import { DEFAULT_LOOK, normalizeLook } from '../data/avatarLook'
import { AvatarWardrobe, AvatarPreview } from './AvatarWardrobe'
import { useEffect, useState, useRef, useMemo } from 'react'
import type { Profile, RoomId } from '../types'
import { MONTHLY_IDEAS, SPACES } from '../data/dingdong'
import type { Space } from '../data/dingdong'
import { usePersistentState,saveJSON } from '../lib/storage'
import { ROOMS } from '../data/rooms'
import { resizeImageFile } from '../lib/image'
import { Mansion3D } from './Mansion3D'
import { RESIDENTS, PLACE_STORIES } from '../data/world'
import { DailyEventCard } from './DailyEventCard'
import { SPACE_WORLD, KIND_UI, demoReply, todayPick, whoName, seoulDate } from '../data/spaceWorld'
import type { TopicKind } from '../data/spaceWorld'

type Visibility = 'private' | 'friends' | 'public'
type Topic = { id: string; space: string; title: string; description: string; date: string; capacity: number; age: string; kind?: TopicKind }
type Place = {name:string;url:string}
type Message = { id: string; text: string; image?: string; place?:Place; at: string; by?: string; spoiler?: boolean }
function safePlaceUrl(value:string){try{const u=new URL(value.trim());return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}}
type History = { id: string; title: string; at: string; visibility: Visibility }
const VISIBILITY = { private: '비공개', friends: '친구 공개(설정만)', public: '전체 공개(설정만)' }
const INITIAL_HOME = HOME_DEFAULT
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
  const [roomSearch,setRoomSearch]=useState(''),[roomFilter,setRoomFilter]=useState<TopicKind|'all'|'saved'>('all')
  const [savedTopics,setSavedTopics]=usePersistentState<string[]>('dd.savedTopics.v1',[])
  const [createKind,setCreateKind]=useState<TopicKind>('talk')
  const drafts=useRef<Record<string,{text:string;image:string;name:string;url:string;spoiler:boolean}>>({})
  const [spoiler,setSpoiler]=useState(false),[revealed,setRevealed]=useState<string[]>([])
  const [topic, setTopic] = useState<Topic | null>(null)
  const [favorites, setFavorites] = usePersistentState<string[]>('dd.favorites.v1', [])
  const [topics, setTopics] = usePersistentState<Topic[]>('dd.topics.v1', [])
  const [messages, setMessages] = usePersistentState<Record<string, Message[]>>('dd.messages.v1', {})
  const [history, setHistory] = usePersistentState<History[]>('dd.history.v1', [])
  const [storedHome, setHome] = usePersistentState('dd.home.v1', INITIAL_HOME)
  const home=useMemo(()=>normalizeHome(storedHome),[storedHome])
  const [homeFeedback,setHomeFeedback]=useState('')
  function updateHome(next:typeof home){setHome(next);return saveJSON('dd.home.v1',next)}
  function doneHome(){setChatCollapsed(true);setHomeFeedback('집 꾸미기를 저장했어요.');window.setTimeout(()=>setHomeFeedback(''),3500)}
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
  function keepDraft(){if(topic)drafts.current[topic.id]={text:draft,image:picture,name:placeName,url:placeUrl,spoiler}}
  function rememberExit(){if(topic&&saveHistory)setHistory(prev=>[{id:uuid(),title:topic.title,at:new Date().toISOString(),visibility},...prev].slice(0,100))}
  function openSpace(next: Space) {if(access(next.id)!=='open')return;keepDraft();rememberExit();if(next.id!=='home')closePanels();setChatCollapsed(next.id==='home');setSpace(next);setTopic(null);setShowCreate(false);setNotice('');setAutoChat(false);setDraft('');setPicture('');clearPlace();setSpoiler(false);setSaveHistory(false);setVisibility('private');setRoomSearch('');setRoomFilter('all')}
  function enter(next:Topic){if(topic?.id===next.id)return;keepDraft();rememberExit();const prev=drafts.current[next.id];setAutoChat(false);setTopic(next);setDraft(prev?.text??'');setPicture(prev?.image??'');setPlaceName(prev?.name??'');setPlaceUrl(prev?.url??'');setShowPlace(!!prev?.name||!!prev?.url);setSpoiler(prev?.spoiler??false);setNotice('');setSaveHistory(false);setVisibility('private');setChatExtras(false);setEmojiOpen(false);setChatCollapsed(false)}
  function leave(){keepDraft();rememberExit();setAutoChat(false);setTopic(null);setDraft('');setPicture('');clearPlace();setSpoiler(false);setNotice('');setSaveHistory(false);setChatExtras(false)}
  const world=space?SPACE_WORLD[space.id]:undefined
  const seedFor=(t:Topic)=>{const w=SPACE_WORLD[t.space];const found=t.id.startsWith(t.space+'-')?w?.topics.find(x=>x.title===t.title):undefined;if(found)return found.seed;if(t.id.includes('-today-')||!w)return [{who:t.space,text:t.description||'새 방이 열렸어요. 첫 이야기를 남겨 주세요.'}];return [{who:t.space,text:t.description?t.description:'새 방이 열렸어요. 첫 이야기를 남겨 주세요.'}]}
  const kindOf=(t:Topic):TopicKind=>{if(t.kind)return t.kind;const w=SPACE_WORLD[t.space];const found=w?.topics.find(x=>x.title===t.title);if(found)return found.kind;const td=w?.today.find(x=>t.id.includes('-today-')&&x.title===t.title);return td?.kind??'talk'}
  const peer=(name:string,text:string,key:string)=><div key={key} className="dd-peer-message"><div className="dd-peer-avatar" aria-hidden="true">{name.slice(0,1)}</div><div><span className="dd-peer-name">{name}<em>시연</em></span><div className="dd-message-bubble dd-peer-bubble"><p>{text}</p></div></div></div>
  const replyTimers=useRef<Set<number>>(new Set())
  useEffect(()=>()=>{for(const timer of replyTimers.current)window.clearTimeout(timer);replyTimers.current.clear()},[])
  function openToday(){if(!space||!world)return;const pick=todayPick(world.today);enter({id:space.id+'-today-'+seoulDate(),space:space.id,title:pick.title,description:pick.question,date:'',capacity:20,age:'성인 전체',kind:pick.kind})}
  useEffect(()=>{
    if(!space||chatCollapsed)return
    const keep='.dd3-chat,.dd-world-nav,.dd-quick-links,.dd-room-actions,.dd-camera-control,.dd-world-pop,.dd3-title,.dd3-access-menu,.dd-app-panel,.dd-host-chat,.dd-home-actions,.dd-map-views,.dd3-story'
    const onDown=(e:PointerEvent)=>{const t=e.target as Element|null;if(t&&!t.closest(keep)){(window as unknown as {__ddSwallowTap:number}).__ddSwallowTap=Date.now();setChatCollapsed(true)}}
    document.addEventListener('pointerdown',onDown,true)
    return()=>document.removeEventListener('pointerdown',onDown,true)
  },[space,chatCollapsed])
  useEffect(()=>{const esc=(e:KeyboardEvent)=>{if(e.key!=='Escape')return;if(wardrobe||yearbook||mapOpen||mailOpen||toolsOpen)closePanels();else if(!chatCollapsed)setChatCollapsed(true)};document.addEventListener('keydown',esc);return()=>document.removeEventListener('keydown',esc)},[wardrobe,yearbook,mapOpen,mailOpen,toolsOpen,chatCollapsed])
  useEffect(()=>{if(!chatCollapsed&&messageLog.current)messageLog.current.scrollTop=messageLog.current.scrollHeight},[chatCollapsed,topic?.id,messages,picture])
  function send() {
    if (!topic || (!draft.trim() && !picture && !placeName.trim())) return
    const url=safePlaceUrl(placeUrl)
    if((placeName.trim()||placeUrl.trim())&&(!placeName.trim()||!url)){setNotice('장소 이름과 올바른 http 또는 https 링크를 입력해 주세요.');return}
    const place=placeName.trim()?{name:placeName.trim().slice(0,100),url}:undefined
    const item = {id: uuid(), text: draft.trim().slice(0,1000), image: picture || undefined, place, spoiler, at: new Date().toISOString()}
    setMessages(prev => ({...prev, [topic.id]: [...(prev[topic.id] ?? []), item].slice(-50)}))
    delete drafts.current[topic.id];setDraft(''); setPicture('');clearPlace();setSpoiler(false);setNotice('');setEmojiOpen(false);composer.current?.focus()
    const tid=topic.id,sid=topic.space,kind=kindOf(topic),serial=(messages[tid]??[]).filter(m=>!m.by).length
    const timer=window.setTimeout(()=>{replyTimers.current.delete(timer);const r=demoReply(sid,kind,serial);setMessages(prev=>({...prev,[tid]:[...(prev[tid]??[]),{id:uuid(),text:r.text,by:r.by,at:new Date().toISOString()}].slice(-50)}))},1100);replyTimers.current.add(timer)
  }
  return <section id="rooms" className="dd-world-app">
      <nav className="dd-world-nav" aria-label="딩동 메뉴">{[{I:PartyPopper,n:'이벤트',f:()=>showPanel('events')},{I:CalendarDays,n:'일정',f:()=>externalMenu('calendar')},{I:Map,n:'지도',f:()=>showPanel('map')},{I:Home,n:'내 집',f:()=>visit('home')},{I:Settings,n:'설정',f:()=>toggleTools(!toolsOpen)}].map(({I,n,f})=><button key={n} onClick={f}><I size={22}/><span>{n}</span></button>)}</nav>
      <div className="dd-quick-links"><button aria-label="공지" onClick={()=>externalMenu('etiquette')}><Bell size={20}/></button><button aria-label="포토월" onClick={()=>externalMenu('wall')}><Camera size={20}/></button></div>
      {homeFeedback&&<div role="status" className="dd-save-toast">{homeFeedback}</div>}
      {space?.id==='home'&&<div className="dd-home-actions"><button onClick={()=>{closePanels();setChatCollapsed(false)}}><Paintbrush size={19}/>집 꾸미기 열기</button><button onClick={()=>showPanel('wardrobe')}><Shirt size={19}/>옷장</button><button onClick={onEditProfile}><UserRound size={19}/>프로필</button><button onClick={()=>showPanel('mail')}><Mail size={19}/>우편함</button></div>}
      {(wardrobe||yearbook||mapOpen||mailOpen)&&<div aria-hidden="true" data-testid="dd-pop-backdrop" onClick={closePanels} style={{position:'fixed',inset:0,zIndex:22,background:'#211a4333'}}/>}
      {wardrobe&&<div className="dd-world-pop dd-world-wardrobe" role="dialog" aria-label="나의 옷장"><div className="dd-pop-title"><strong>나의 작은 옷장</strong><button className="dd3-btn" onClick={()=>setWardrobe(false)}>옷장 닫기</button></div><AvatarWardrobe avatar={profile.avatar} look={look} onChange={v=>{setLook(v);saveJSON('dd.avatar.look.v1',v)}} onDone={()=>setWardrobe(false)}/></div>}
      {yearbook&&<div className="dd-world-pop" role="dialog" aria-label="연간 이벤트"><div className="dd-pop-title"><strong>딩동의 12개월 파티</strong><button className="dd3-btn" onClick={()=>setYearbook(false)}>닫기</button></div><DailyEventCard onVisit={visit}/><p>월별 이벤트 기획 · 실제 날짜는 일정에서 확인</p><div className="dd-event-grid">{MONTHLY_IDEAS.map((idea,i)=><button key={i} onClick={()=>i===11?visit('season'):externalMenu('calendar')} style={{'--event-color':['#d6c5f8','#ffc8dc','#c6efdb','#f6cde1','#ffe2a6','#c5d8f6','#bde9ed','#e3caf5','#ffe0aa','#d8c2f1','#cee8d9','#f7c4d2'][i]} as React.CSSProperties}><FestivalArt month={i}/><strong>{i+1}월</strong><small>{idea}</small><span>{i===11?'시즌홀 입장':'일정 보기'}</span></button>)}</div></div>}
      {mapOpen&&<div className="dd-world-pop" role="dialog" aria-label="마을 지도"><div className="dd-pop-title"><strong>우리 동네 지도</strong><button className="dd3-btn" onClick={()=>setMapOpen(false)}>닫기</button></div><p>가게를 선택해 걸어가세요.</p><div className="dd-map-grid">{SPACES.map(s=><button key={s.id} onClick={()=>visit(s.id)}><span>{s.icon}</span><strong>{s.name}</strong><small>{access(s.id)==='open'?'방문':access(s.id)==='locked'?'잠금':'준비 중'}</small></button>)}</div><button className="dd3-btn" onClick={()=>setOnlyFavorites(v=>!v)}>{onlyFavorites?'전체 목적지':'즐겨찾기 목적지'}</button></div>}
      {mailOpen&&<div className="dd-world-pop" role="dialog" aria-label="나의 우편함"><div className="dd-pop-title"><strong>나의 우편함</strong><button className="dd3-btn" onClick={()=>setMailOpen(false)}>닫기</button></div><div className="dd-mail-empty"><Mail size={42}/><h3>친구의 편지가 도착하는 곳</h3><p>현재는 로컬 체험입니다. 친구 방문·편지 송수신은 실제 계정 및 권한 연결 후 제공합니다.</p></div></div>}
      <div className={'dd3-layout'+(space?' dd3-with-chat':'')+(space&&space.id!=='home'&&!chatCollapsed?' dd-chat-open':'')}>
        <Mansion3D onMenu={id=>{if(id==='home-wardrobe')showPanel('wardrobe');else if(id==='home-profile')onEditProfile();else if(id==='home-mailbox')showPanel('mail');else if(id==='home-decor'){closePanels();setChatCollapsed(false)}else externalMenu(id)}} profile={profile} look={look} home={home} active={space} request={request} toolsOpen={toolsOpen} onToolsChange={toggleTools} onEnter={openSpace} onLeave={()=>{leave();setSpace(null)}} onCapture={image=>{if(!topic){setNotice('모임에 입장한 뒤 촬영해 주세요.');return}setPicture(image);setChatCollapsed(false);setNotice('사진 첨부 완료 · 전송을 누르면 로컬 채팅에 저장됩니다.')}} favorites={favorites} onlyFavorites={onlyFavorites} onFavorite={id=>setFavorites(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])}/>
        {space&&<aside role="region" aria-label={space.name} className={"dd3-chat dd-chat-reveal"+(space.id!=="home"&&!chatCollapsed?" dd-messenger":space.id==="home"&&!chatCollapsed?" dd-home-panel":"")}>
      <button type="button" className="dd3-collapse" aria-expanded={!chatCollapsed} onClick={()=>{if(chatCollapsed)closePanels();setChatCollapsed(v=>!v)}}>{space.id!=='home'&&<MessageCircle size={18}/>}<span>{space.id==='home'?(chatCollapsed?'집 꾸미기':'집 꾸미기 닫기'):(chatCollapsed?'채팅 펼치기':'채팅 접기')}</span>{!chatCollapsed&&<ChevronDown size={16}/>}</button>
      <div className={space.id!=='home'&&topic?'dd-chat-body':'p-4 sm:p-5'} hidden={chatCollapsed}>
        <div className="dd-room-heading mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="serif text-2xl">{space.name}</h2><p className="text-xs" style={{color:'var(--muted)'}}>{space.subtitle}</p></div><button type="button" className="btn btn-outline btn-sm" onClick={()=>{leave();setSpace(null)}}>복도로 나가기</button></div>
        {!topic&&space.id!=='home'&&RESIDENTS[space.id]&&<div className="dd3-npc"><div className="dd-resident-name"><strong>{RESIDENTS[space.id].name}</strong><small>마을 안내 캐릭터 · 시연</small></div><p className="dd-resident-bubble">{RESIDENTS[space.id].greeting}</p></div>}
        {autoChat && <p role="status" className="text-sm py-3">공간에 도착했어요. 대화창을 준비합니다…</p>}
        {space.id==='home'&&world&&<div className="dd-lobby-story"><strong>{PLACE_STORIES.home.title}</strong><p>{world.story}</p></div>}
        {space.id==='season' && !topic && <button className="btn btn-outline mb-3" onClick={onParty}>크리스마스 파티 일정 보기</button>}
        {space.id==='home' ? <div className="space-y-4">
          <HomeEditor home={home} onChange={updateHome} onDone={doneHome} onClose={()=>setChatCollapsed(true)}/><details className="dd-home-profile"><summary>미니홈피와 프로필</summary><button className="btn btn-outline" onClick={()=>{leave();setSpace(null);onEditProfile()}}>캐릭터·닉네임·취향 수정</button><label className="block text-sm">미니홈피 소개<textarea className={FIELD} maxLength={160} value={home.intro} onChange={e=>setHome(p=>({...p,intro:e.target.value}))}/></label></details>
          <label className="text-sm">미니홈피 공개 범위<select className={FIELD} value={home.visibility} onChange={e=>setHome(p=>({...p,visibility:e.target.value as Visibility}))}>{Object.entries(VISIBILITY).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
          <p className="text-xs" style={{color:'var(--muted)'}}>벽지·가구·반려동물은 내 3D 집에 적용되고 브라우저에 자동 저장됩니다. 공개 범위는 설정만 저장되며 실제 친구 방문·편지는 계정 연결 전 제공되지 않습니다.</p>
          <h3 className="serif text-lg">나의 모임 기록</h3>{history.length===0?<p className="text-sm">저장한 모임이 없어요.</p>:history.map(h=><div className="card flex flex-wrap items-center justify-between gap-2 p-3 text-sm" key={h.id}><span>{h.title} · {VISIBILITY[h.visibility]}</span><button className="btn btn-ghost btn-sm" onClick={()=>setHistory(p=>p.filter(x=>x.id!==h.id))}>삭제</button></div>)}
        </div> : autoChat ? null : topic ? <div className="dd-messenger-main">
          <header className="dd-message-header"><button className="dd-chat-icon" aria-label="모임 목록" onClick={leave}><ChevronLeft size={22}/></button><div><h3>{topic.title}</h3><p>{KIND_UI[kindOf(topic)].label}방 · 로컬 체험 · 목표 정원 {topic.capacity}명</p></div><button className="dd-chat-icon" aria-label="채팅 설정" aria-expanded={chatExtras} onClick={()=>setChatExtras(v=>!v)}><MoreHorizontal size={22}/></button></header>
          {chatExtras&&<div className="dd-chat-settings"><p>{topic.description}</p><label><input type="checkbox" checked={saveHistory} onChange={e=>setSaveHistory(e.target.checked)}/> 나갈 때 참여 기록 저장</label>{saveHistory&&<select className={FIELD} aria-label="참여 기록 공개 범위" value={visibility} onChange={e=>setVisibility(e.target.value as Visibility)}>{Object.entries(VISIBILITY).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>}<button className="dd3-btn" onClick={leave}>모임 나가기</button></div>}
          <div ref={messageLog} className="dd-message-log" role="log" aria-label="대화 기록"><p className="dd-chat-system">로컬 채팅 체험 · 대화 상대는 시연용 가상 주민이며 실제 이용자는 연결되지 않습니다.</p>{seedFor(topic).map((m,i)=>peer(whoName(m.who),m.text,'seed'+i))}{(messages[topic.id]??[]).map(m=>m.by?peer(m.by,m.text,m.id):<div key={m.id} className="dd-own-message"><div className="dd-message-meta"><span>{profile.nickname}</span><div className="dd-chat-avatar"><AvatarPreview avatar={profile.avatar} look={look}/></div></div><div className="dd-message-bubble">{m.spoiler&&!revealed.includes(m.id)?<button className="dd-spoiler" onClick={()=>setRevealed(v=>[...v,m.id])}>스포일러 보기</button>:<>{m.text&&<p>{m.text}</p>}{m.image&&<img src={m.image} alt="내가 올린 사진"/>}</>}{m.place&&safePlaceUrl(m.place.url)&&<div className="dd-place-card"><strong><MapPin size={14}/> {m.place.name}</strong><a href={safePlaceUrl(m.place.url)} target="_blank" rel="noopener noreferrer">장소 링크 열기</a><button type="button" className="btn btn-ghost btn-sm" onClick={()=>{const place=m.place!;setSavedPlaces(p=>p.some(x=>x.url===place.url&&x.name===place.name)?p:[place,...p].slice(0,100))}}>장소 저장</button></div>}</div><div className="dd-message-time"><time dateTime={m.at}>{new Date(m.at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</time><button onClick={()=>setMessages(p=>({...p,[topic.id]:(p[topic.id]??[]).filter(x=>x.id!==m.id)}))}>삭제</button></div></div>)}</div>
          <div className="dd-chat-compose">
          {picture&&<div className="dd-chat-attachment"><img src={picture} alt="첨부 미리보기"/><button className="dd3-btn" onClick={()=>setPicture('')}>첨부 제거</button></div>}
          {showPlace&&<div className="dd-chat-place"><label>장소 이름<input aria-label="장소 이름" className={FIELD} value={placeName} maxLength={100} onChange={e=>setPlaceName(e.target.value)}/></label><label>장소 링크<input aria-label="장소 링크" className={FIELD} value={placeUrl} maxLength={2000} onChange={e=>setPlaceUrl(e.target.value)}/></label><small>운영 여부 미검증 · 로컬 추천</small></div>}
          {emojiOpen&&<div className="dd-emoji-tray">{['😊','💛','🎄','☕','👏','🎉','✨','🐾','❤️','😂','🙌','🌷'].map(e=><button key={e} aria-label={e} onClick={()=>setDraft(p=>(p+e).slice(0,1000))}>{e}</button>)}</div>}
          {notice&&<p role="status" className="dd-chat-notice">{notice}</p>}
          <div className="dd-chip-row" role="group" aria-label="빠른 문장">{KIND_UI[kindOf(topic)].chips.map(c=><button type="button" key={c.label} onClick={()=>{setDraft(p=>((p?p+(p.endsWith(' ')?'':' '):'')+c.text).slice(0,1000));composer.current?.focus()}}>{c.label}</button>)}</div>{KIND_UI[kindOf(topic)].photoHint&&<p className="dd-photo-hint"><ImagePlus size={14}/> {KIND_UI[kindOf(topic)].photoHint}</p>}
          {(kindOf(topic)==='review'||spoiler)&&<label className="dd-spoiler-option"><input type="checkbox" checked={spoiler} onChange={e=>setSpoiler(e.target.checked)}/> 스포일러 숨김</label>}
          <form className="dd-message-form" onSubmit={e=>{e.preventDefault();send()}}><input ref={composer} aria-label="메시지" maxLength={1000} value={draft} placeholder={KIND_UI[kindOf(topic)].placeholder} onChange={e=>setDraft(e.target.value)}/><button className="dd-send" aria-label="전송" disabled={loading||(!draft.trim()&&!picture&&!placeName.trim())}><Send size={19}/></button></form>
          <div className="dd-compose-tools"><button className="dd-chat-icon" aria-label="사진 첨부" title="사진 첨부" onClick={()=>fileInput.current?.click()}><ImagePlus size={21}/></button><input ref={fileInput} hidden aria-label="사진 첨부 파일" type="file" accept="image/jpeg,image/png,image/webp" disabled={loading} className="block max-w-full text-xs" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>5_000_000){setNotice('5MB 이하 사진만 첨부할 수 있어요.');return}setLoading(true);try{const image=await resizeImageFile(file,320,0.5);if(image.length>90000||!image.startsWith('data:image/jpeg'))throw Error('image');setPicture(image);setNotice('')}catch{setNotice('사진을 처리할 수 없어요. 작은 사진을 선택해 주세요.')}finally{setLoading(false)}}}/><button className="dd-chat-icon" aria-label="이모티콘" title="이모티콘" aria-expanded={emojiOpen} onClick={()=>setEmojiOpen(v=>!v)}><Smile size={21}/></button><button className="dd-chat-icon" aria-label={showPlace?'장소 추천 입력 접기':'장소 추천 첨부'} title="장소 추천" onClick={()=>setShowPlace(v=>!v)}><MapPin size={21}/></button><details className="dd-chat-saved"><summary>저장한 장소 ({savedPlaces.length})</summary>{savedPlaces.filter(p=>safePlaceUrl(p.url)).map(p=><div key={p.name+p.url}><a href={safePlaceUrl(p.url)} target="_blank" rel="noopener noreferrer">{p.name}</a><button type="button" className="btn btn-ghost btn-sm" onClick={()=>setSavedPlaces(list=>list.filter(v=>v.url!==p.url||v.name!==p.name))}>삭제</button></div>)}</details></div>
          </div>
        </div> : <div className="space-y-4">
          {space.id==='single'&&<p className="text-xs">성인 인증 전이므로 실제 만남이나 DM 연결은 제공하지 않습니다.</p>}
          {world&&<div className="dd-lobby-story"><strong>{PLACE_STORIES[space.id]?.title??space.name}</strong><p>{world.story}</p><details><summary>이 공간의 매너</summary><ul>{world.rules.map(r=><li key={r}>{r}</li>)}</ul></details></div>}
          {world&&(()=>{const pick=todayPick(world.today);return <button type="button" className="dd-today-card" onClick={openToday}><small>TODAY · 오늘의 주제</small><strong>{pick.title}</strong><span>{pick.question}</span><em>이 주제로 방 열기 →</em></button>})()}
          <div className="flex items-center justify-between"><h3 className="serif text-lg">이 공간의 모임</h3><button className="btn btn-outline" onClick={()=>setShowCreate(v=>!v)}>{showCreate?'닫기':'+ 모임 만들기'}</button></div>
          <div className="dd-room-discovery"><input aria-label="모임 검색" placeholder="작품명·가수·모임 제목 검색" value={roomSearch} onChange={e=>setRoomSearch(e.target.value)}/><div className="dd-room-filters" role="group" aria-label="모임 유형">{(['all','saved',...Object.keys(KIND_UI)] as ('all'|'saved'|TopicKind)[]).map(k=><button key={k} aria-pressed={roomFilter===k} onClick={()=>setRoomFilter(k)}>{k==='all'?'전체':k==='saved'?'저장한 방':KIND_UI[k].label}</button>)}</div></div>
          {showCreate&&<form className="card space-y-3 p-4" onSubmit={e=>{e.preventDefault();if(!title.trim()||!Number.isInteger(capacity)||capacity<1||capacity>20)return;const next={id:uuid(),space:space.id,title:title.trim(),description:description.trim(),date,capacity,age,kind:createKind};setTopics(p=>[next,...p]);setTitle('');setDescription('');setDate('');setCapacity(20);setShowCreate(false);enter(next)}}>
            <label className="block text-sm">모임 유형<select aria-label="새 모임 유형" className={FIELD} value={createKind} onChange={e=>setCreateKind(e.target.value as TopicKind)}>{Object.entries(KIND_UI).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></label>
            <label className="block text-sm">제목<input className={FIELD} required maxLength={60} value={title} onChange={e=>setTitle(e.target.value)}/></label>
            <label className="block text-sm">설명<textarea className={FIELD} maxLength={300} value={description} onChange={e=>setDescription(e.target.value)}/></label>
            <label className="block text-sm">일정<input type="datetime-local" className={FIELD} value={date} onChange={e=>setDate(e.target.value)}/></label>
            <div className="grid grid-cols-2 gap-2"><label className="text-sm">목표 인원<input type="number" min={1} max={20} required className={FIELD} value={capacity} onChange={e=>setCapacity(Number(e.target.value))}/></label><label className="text-sm">연령 그룹<select className={FIELD} value={age} onChange={e=>setAge(e.target.value)}>{['성인 전체','20대','30대','40대','50대 이상'].map(v=><option key={v}>{v}</option>)}</select></label></div>
            <button className="btn btn-primary">로컬 모임 만들기</button>
          </form>}
          {(()=>{const seeds=Array.from(new Set([...space.topics,...(world?.topics.map(t=>t.title)??[])])).map((t,i):Topic=>({id:space.id+'-'+i,space:space.id,title:t,description:world?.topics.find(x=>x.title===t)?.blurb??'자유롭게 이야기를 나누는 시연 모임',date:'',capacity:20,age:'성인 전체'}));const q=roomSearch.trim().toLocaleLowerCase();const all=[...topics.filter(t=>t.space===space.id),...seeds];const filtered=all.filter(t=>(!q||[t.title,t.description].some(v=>v.toLocaleLowerCase().includes(q)))&&(roomFilter==='all'||(roomFilter==='saved'?savedTopics.includes(t.id):kindOf(t)===roomFilter)));return filtered.length?filtered.map(t=><div key={t.id} className="dd-room-list-item"><button className="dd-room-join" onClick={()=>enter(t)}><span><strong>{t.title}</strong><small>{t.description}{t.date?' · '+t.date.replace('T',' '):''} · 목표 {t.capacity}명</small></span><span className="dd-kind-badge">{KIND_UI[kindOf(t)].label}</span></button><button className="dd-room-save" aria-label={(savedTopics.includes(t.id)?'저장 해제 ':'모임 저장 ')+t.title} aria-pressed={savedTopics.includes(t.id)} onClick={()=>setSavedTopics(v=>v.includes(t.id)?v.filter(x=>x!==t.id):[...v,t.id])}>{savedTopics.includes(t.id)?'★':'☆'}</button></div>):<p className="dd-room-empty">조건에 맞는 모임이 없어요. 검색 조건을 바꾸거나 새로운 방을 열어 보세요.</p>})()}
          {space.legacy?.map(id=><button key={id} className="card flex w-full justify-between gap-2 p-4 text-left" onClick={()=>{leave();setSpace(null);onLegacy(id)}}><span>{ROOMS.find(r=>r.id===id)?.name}</span><span className="text-xs">기존 시연방 →</span></button>)}
        </div>}
      </div>
        </aside>}
      </div>
  </section>
}
