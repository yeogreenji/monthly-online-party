import {MemoryAlbum,MemoryComposer,type Memory} from './MemoryAlbum'
import {HomeEditor} from './HomeEditor'
import {GameCorner} from './GameCorner'
import {HOME_DEFAULT,normalizeHome} from '../data/homeDecor'
import {FestivalArt} from './FestivalArt'
import {Paintbrush,PartyPopper,CalendarDays,Map,Home,Settings,Shirt,UserRound,Mail,Bell,Camera,MessageCircle,ImagePlus,Smile,MapPin,Send,MoreHorizontal,ChevronDown,ChevronLeft,Maximize2,Minimize2,Plus,Search,Star,ChevronRight,Info} from 'lucide-react'
import { access } from '../data/phase1'
import { DEFAULT_LOOK, normalizeLook } from '../data/avatarLook'
import { AvatarWardrobe } from './AvatarWardrobe'
import { useEffect, useState, useRef, useMemo } from 'react'
import type { Profile, RoomId } from '../types'
import { MONTHLY_IDEAS, SPACES } from '../data/dingdong'
import type { Space } from '../data/dingdong'
import { usePersistentState,saveJSON } from '../lib/storage'
import { ROOMS } from '../data/rooms'
import { resizeImageFile } from '../lib/image'
import { Mansion3D } from './Mansion3D'
import { RESIDENTS, PLACE_STORIES } from '../data/world'
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
  const [chatCollapsed,setChatCollapsed]=useState(true),[chatFull,setChatFull]=useState(false),[selectedFurniture,setSelectedFurniture]=useState<string|null>(null),[attachOpen,setAttachOpen]=useState(false),[practice,setPractice]=useState(false),[quickOpen,setQuickOpen]=useState(false)
  const [chatExtras,setChatExtras]=useState(false),[emojiOpen,setEmojiOpen]=useState(false)
  const nearBottom=useRef(true),messageLog=useRef<HTMLDivElement>(null),fileInput=useRef<HTMLInputElement>(null),composer=useRef<HTMLInputElement>(null)
  const [wardrobe,setWardrobe]=useState(false)
  const [yearbook,setYearbook]=useState(false)
  const [toolsOpen,setToolsOpen]=useState(false),[mapOpen,setMapOpen]=useState(false),[mailOpen,setMailOpen]=useState(false)
  const [request,setRequest]=useState<{id:string;serial:number;direct?:boolean;preview?:boolean}|null>(null)
  function closePanels(){setWardrobe(false);setYearbook(false);setMapOpen(false);setMailOpen(false);setToolsOpen(false)}
  function showPanel(id:string){closePanels();setChatCollapsed(true);if(id==='wardrobe')setWardrobe(true);if(id==='events')setYearbook(true);if(id==='map')setMapOpen(true);if(id==='mail')setMailOpen(true)}
  function toggleTools(v:boolean){if(v){closePanels();setChatCollapsed(true)}setToolsOpen(v)}
  function visit(id:string,direct=false,preview=false){closePanels();setChatCollapsed(true);setRequest(p=>({id,serial:(p?.serial??0)+1,direct,preview}))}
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
  const [memories,setMemories]=usePersistentState<Memory[]>('dd.memories.v1',[])
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
  function saveMemory(note:string,photos:string[]){if(!topic)return false;const entry:Memory={id:uuid(),topicId:topic.id,title:topic.title,space:topic.space,date:new Date().toISOString(),note,photos:photos.filter(v=>v.startsWith('data:image/jpeg')).slice(0,3)};const next=[entry,...memories].slice(0,30);if(!saveJSON('dd.memories.v1',next))return false;setMemories(next);return true}
  function deleteMemory(id:string){const next=memories.filter(v=>v.id!==id);if(saveJSON('dd.memories.v1',next))setMemories(next)}
  function keepDraft(){if(topic)drafts.current[topic.id]={text:draft,image:picture,name:placeName,url:placeUrl,spoiler}}
  function rememberExit(){if(topic&&saveHistory)setHistory(prev=>[{id:uuid(),title:topic.title,at:new Date().toISOString(),visibility},...prev].slice(0,100))}
  function openSpace(next: Space) {setChatFull(false);setAttachOpen(false);setQuickOpen(false);setPractice(false);keepDraft();rememberExit();if(next.id!=='home')closePanels();setChatCollapsed(next.id==='home'||access(next.id)!=='open');setSpace(next);setTopic(null);setShowCreate(false);setNotice('');setAutoChat(false);setDraft('');setPicture('');clearPlace();setSpoiler(false);setSaveHistory(false);setVisibility('private');setRoomSearch('');setRoomFilter('all')}
  function enter(next:Topic){if(access(next.space)!=='open'||topic?.id===next.id)return;setAttachOpen(false);setQuickOpen(false);setPractice(false);nearBottom.current=true;keepDraft();rememberExit();const prev=drafts.current[next.id];setAutoChat(false);setTopic(next);setDraft(prev?.text??'');setPicture(prev?.image??'');setPlaceName(prev?.name??'');setPlaceUrl(prev?.url??'');setShowPlace(!!prev?.name||!!prev?.url);setSpoiler(prev?.spoiler??false);setNotice('');setSaveHistory(false);setVisibility('private');setChatExtras(false);setEmojiOpen(false);setChatCollapsed(false)}
  function leave(){setAttachOpen(false);setQuickOpen(false);setPractice(false);keepDraft();rememberExit();setAutoChat(false);setTopic(null);setDraft('');setPicture('');clearPlace();setSpoiler(false);setNotice('');setSaveHistory(false);setChatExtras(false)}
  const world=space?SPACE_WORLD[space.id]:undefined
  const seedFor=(t:Topic)=>{const w=SPACE_WORLD[t.space];const found=t.id.startsWith(t.space+'-')?w?.topics.find(x=>x.title===t.title):undefined;if(found)return found.seed;if(t.id.includes('-today-')||!w)return [{who:t.space,text:t.description||'새 방이 열렸어요. 첫 이야기를 남겨 주세요.'}];return [{who:t.space,text:t.description?t.description:'새 방이 열렸어요. 첫 이야기를 남겨 주세요.'}]}
  const kindOf=(t:Topic):TopicKind=>{if(t.kind)return t.kind;const w=SPACE_WORLD[t.space];const found=w?.topics.find(x=>x.title===t.title);if(found)return found.kind;const td=w?.today.find(x=>t.id.includes('-today-')&&x.title===t.title);return td?.kind??'talk'}
  const peer=(name:string,text:string,key:string)=><div key={key} className="dd-peer-message"><div className="dd-peer-avatar" aria-hidden="true">{name.slice(0,1)}</div><div><span className="dd-peer-name">{name}<em>시연</em></span><div className="dd-message-bubble dd-peer-bubble"><p>{text}</p></div></div></div>
  const replyTimers=useRef<Set<number>>(new Set())
  useEffect(()=>()=>{for(const timer of replyTimers.current)window.clearTimeout(timer);replyTimers.current.clear()},[])
  function openToday(){if(!space||!world)return;const pick=todayPick(world.today);enter({id:space.id+'-today-'+seoulDate(),space:space.id,title:pick.title,description:pick.question,date:'',capacity:20,age:'성인 전체',kind:pick.kind})}
  useEffect(()=>{
    if(!space||chatCollapsed)return
    const keep='.dd3-chat,.dd-world-nav,.dd-quick-links,.dd-room-actions,.dd-camera-control,.dd-world-pop,.dd3-title,.dd3-access-menu,.dd-app-panel,.dd-host-chat,.dd-home-actions,.dd-map-views,.dd3-story,.dd-bell-shortcut'
    const onDown=(e:PointerEvent)=>{const t=e.target as Element|null;if(t&&!t.closest(keep)){if(space?.id==='home'&&t.closest('.dd3-canvas'))return;(window as unknown as {__ddSwallowTap:number}).__ddSwallowTap=Date.now();setChatCollapsed(true)}}
    document.addEventListener('pointerdown',onDown,true)
    return()=>document.removeEventListener('pointerdown',onDown,true)
  },[space,chatCollapsed])
  useEffect(()=>{const esc=(e:KeyboardEvent)=>{if(e.key!=='Escape')return;if(wardrobe||yearbook||mapOpen||mailOpen||toolsOpen)closePanels();else if(!chatCollapsed)setChatCollapsed(true)};document.addEventListener('keydown',esc);return()=>document.removeEventListener('keydown',esc)},[wardrobe,yearbook,mapOpen,mailOpen,toolsOpen,chatCollapsed])
  useEffect(()=>{if(!chatCollapsed&&messageLog.current&&nearBottom.current)messageLog.current.scrollTop=messageLog.current.scrollHeight},[chatCollapsed,topic?.id,messages]);
  function send() {
    if (!topic || (!draft.trim() && !picture && !placeName.trim())) return
    const url=safePlaceUrl(placeUrl)
    if((placeName.trim()||placeUrl.trim())&&(!placeName.trim()||!url)){setNotice('장소 이름과 올바른 http 또는 https 링크를 입력해 주세요.');return}
    const place=placeName.trim()?{name:placeName.trim().slice(0,100),url}:undefined
    nearBottom.current=true;
    const item = {id: uuid(), text: draft.trim().slice(0,1000), image: picture || undefined, place, spoiler, at: new Date().toISOString()}
    setMessages(prev => ({...prev, [topic.id]: [...(prev[topic.id] ?? []), item].slice(-50)}))
    delete drafts.current[topic.id];setDraft(''); setPicture('');clearPlace();setSpoiler(false);setNotice('');setEmojiOpen(false);composer.current?.focus()
    setAttachOpen(false);setQuickOpen(false);if(!practice)return;
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
      {yearbook&&<div className="dd-world-pop" role="dialog" aria-label="연간 이벤트"><div className="dd-pop-title"><strong>딩동의 12개월 파티</strong><button className="dd3-btn" onClick={()=>setYearbook(false)}>닫기</button></div><p>월별 이벤트 기획 · 실제 날짜는 일정에서 확인</p><DailyFestival onVisit={id=>visit(id,true)}/><div className="dd-event-grid">{MONTHLY_IDEAS.map((idea,i)=><button key={i} onClick={()=>i===11?visit('season'):externalMenu('calendar')} style={{'--event-color':['#d6c5f8','#ffc8dc','#c6efdb','#f6cde1','#ffe2a6','#c5d8f6','#bde9ed','#e3caf5','#ffe0aa','#d8c2f1','#cee8d9','#f7c4d2'][i]} as React.CSSProperties}><FestivalArt month={i}/><strong>{i+1}월</strong><small>{idea}</small><span>{i===11?'시즌홀 입장':'일정 보기'}</span></button>)}</div></div>}
      {mapOpen&&<div className="dd-world-pop" role="dialog" aria-label="마을 지도"><div className="dd-pop-title"><strong>우리 동네 지도</strong><button className="dd3-btn" onClick={()=>setMapOpen(false)}>닫기</button></div><p>가게를 선택하면 바로 입장합니다. 잠긴 공간은 내부 구경만 가능합니다.</p><div className="dd-map-grid">{SPACES.map(s=><button key={s.id} onClick={()=>visit(s.id,true,access(s.id)==='locked')}><span>{s.icon}</span><strong>{s.name}</strong><small>{access(s.id)==='open'?'입장':access(s.id)==='locked'?'구경만 가능':'준비 중'}</small></button>)}</div><button className="dd3-btn" onClick={()=>setOnlyFavorites(v=>!v)}>{onlyFavorites?'전체 목적지':'즐겨찾기 목적지'}</button></div>}
      {mailOpen&&<div className="dd-world-pop" role="dialog" aria-label="나의 우편함"><div className="dd-pop-title"><strong>나의 우편함</strong><button className="dd3-btn" onClick={()=>setMailOpen(false)}>닫기</button></div><div className="dd-mail-empty"><Mail size={42}/><h3>친구의 편지가 도착하는 곳</h3><p>현재는 로컬 체험입니다. 친구 방문·편지 송수신은 실제 계정 및 권한 연결 후 제공합니다.</p></div></div>}
      <div className={'dd3-layout'+(space?' dd3-with-chat':'')+(space&&space.id!=='home'&&!chatCollapsed?' dd-chat-open':'')+(chatFull&&!chatCollapsed&&space?.id!=='home'?' dd-chat-full':'')}>
        <Mansion3D homeEditing={space?.id==='home'&&!chatCollapsed} onMenu={id=>{if(id.startsWith('home-select:')){setSelectedFurniture(id.slice(12));return}if(id==='home-wardrobe')showPanel('wardrobe');else if(id==='home-profile')onEditProfile();else if(id==='home-mailbox')showPanel('mail');else if(id==='home-decor'){closePanels();setChatCollapsed(false)}else externalMenu(id)}} profile={profile} look={look} home={home} active={space} request={request} toolsOpen={toolsOpen} onToolsChange={toggleTools} onEnter={openSpace} onLeave={()=>{leave();setSpace(null)}} onCapture={image=>{if(!topic){setNotice('모임에 입장한 뒤 촬영해 주세요.');return}setPicture(image);setChatCollapsed(false);setNotice('사진 첨부 완료 · 전송을 누르면 로컬 채팅에 저장됩니다.')}} favorites={favorites} onlyFavorites={onlyFavorites} onFavorite={id=>setFavorites(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])}/>
        {space&&access(space.id)==='open'&&<aside role="region" aria-label={space.name} className={"dd3-chat dd-chat-reveal"+(space.id!=="home"&&!chatCollapsed?" dd-messenger":space.id==="home"&&!chatCollapsed?" dd-home-panel":"")}>
      <div className="dd-chat-topbar"><button type="button" className="dd3-collapse" aria-expanded={!chatCollapsed} onClick={()=>{if(chatCollapsed)closePanels();setChatCollapsed(v=>!v)}}>{space.id!=='home'&&<MessageCircle size={18}/>}<span>{space.id==='home'?(chatCollapsed?'집 꾸미기':'집 꾸미기 닫기'):(chatCollapsed?'채팅 펼치기':'채팅 접기')}</span>{!chatCollapsed&&<ChevronDown size={16}/>}</button>{space.id!=='home'&&!chatCollapsed&&<button className="dd-chat-expand" aria-label={chatFull?'채팅 기본 보기':'채팅 전체 화면'} onClick={()=>setChatFull(v=>!v)}>{chatFull?<Minimize2 size={18}/>:<Maximize2 size={18}/>}</button>}</div>
      <div className={space.id!=='home'&&topic?'dd-chat-body':space.id!=='home'?'dd-lobby-scroll p-4 sm:p-5':'p-4 sm:p-5'} hidden={chatCollapsed}>
        <div className="dd-room-heading mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="serif text-2xl">{space.name}</h2><p className="text-xs" style={{color:'var(--muted)'}}>{space.subtitle}</p></div><button type="button" className="btn btn-outline btn-sm" onClick={()=>{leave();setSpace(null)}}>복도로 나가기</button></div>
        {!topic&&space.id!=='home'&&RESIDENTS[space.id]&&<div className="dd3-npc"><div className="dd-resident-name"><strong>{RESIDENTS[space.id].name}</strong><small>마을 안내 캐릭터 · 시연</small></div><p className="dd-resident-bubble">{RESIDENTS[space.id].greeting}</p></div>}
        {autoChat && <p role="status" className="text-sm py-3">공간에 도착했어요. 대화창을 준비합니다…</p>}
        {space.id==='home'&&world&&<div className="dd-lobby-story"><strong>{PLACE_STORIES.home.title}</strong><p>{world.story}</p></div>}
        {space.id==='season' && !topic && <button className="btn btn-outline mb-3" onClick={onParty}>크리스마스 파티 일정 보기</button>}
        {space.id==='home' ? <div className="space-y-4">
          <HomeEditor home={home} selected={selectedFurniture} onSelect={setSelectedFurniture} onChange={updateHome} onDone={doneHome} onClose={()=>setChatCollapsed(true)}/><details className="dd-home-profile"><summary>미니홈피와 프로필</summary><MiniHomeJournal/><button className="btn btn-outline" onClick={()=>{leave();setSpace(null);onEditProfile()}}>캐릭터·닉네임·취향 수정</button><label className="block text-sm">미니홈피 소개<textarea className={FIELD} maxLength={160} value={home.intro} onChange={e=>setHome(p=>({...p,intro:e.target.value}))}/></label></details>
          <label className="text-sm">미니홈피 공개 범위<select className={FIELD} value={home.visibility} onChange={e=>setHome(p=>({...p,visibility:e.target.value as Visibility}))}>{Object.entries(VISIBILITY).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
          <p className="text-xs" style={{color:'var(--muted)'}}>벽지·가구·반려동물은 내 3D 집에 적용되고 브라우저에 자동 저장됩니다. 공개 범위는 설정만 저장되며 실제 친구 방문·편지는 계정 연결 전 제공되지 않습니다.</p>
          <MemoryAlbum entries={memories} onDelete={deleteMemory}/><h3 className="serif text-lg">나의 모임 기록</h3>{history.length===0?<p className="text-sm">저장한 모임이 없어요.</p>:history.map(h=><div className="card flex flex-wrap items-center justify-between gap-2 p-3 text-sm" key={h.id}><span>{h.title} · {VISIBILITY[h.visibility]}</span><button className="btn btn-ghost btn-sm" onClick={()=>setHistory(p=>p.filter(x=>x.id!==h.id))}>삭제</button></div>)}
        </div> : autoChat ? null : topic ? <div className="dd-messenger-main">
          <header className="dd-message-header"><button className="dd-chat-icon" aria-label="모임 목록" onClick={leave}><ChevronLeft size={22}/></button><div><h3>{topic.title}</h3><p>{space.name} <span className="dd-header-dot"/> 로컬 연습</p></div><button className="dd-chat-icon" aria-label="채팅 설정" aria-expanded={chatExtras} onClick={()=>setChatExtras(v=>!v)}><MoreHorizontal size={22}/></button></header>
          {topic.space==='games'&&<GameCorner key={topic.id}/>}
          {chatExtras&&<div className="dd-chat-settings"><p>{topic.description}</p><label><input type="checkbox" checked={practice} onChange={e=>setPractice(e.target.checked)}/> 가상 주민 대화 연습</label><small>켜면 시연용 주민이 응답해요. 실제 이용자와의 대화는 아직 연결되지 않았어요.</small><label><input type="checkbox" checked={saveHistory} onChange={e=>setSaveHistory(e.target.checked)}/> 나갈 때 참여 기록 저장</label>{saveHistory&&<select className={FIELD} aria-label="참여 기록 공개 범위" value={visibility} onChange={e=>setVisibility(e.target.value as Visibility)}>{Object.entries(VISIBILITY).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>}<details className="dd-memory-details"><summary>사진첩·후기</summary><MemoryComposer key={topic.id} photos={(messages[topic.id]??[]).filter(m=>!m.by&&m.image&&(!m.spoiler||revealed.includes(m.id))).map(m=>({id:m.id,image:m.image!}))} onSave={saveMemory}/><MemoryAlbum entries={memories} topicId={topic.id} onDelete={deleteMemory}/></details><button className="dd3-btn" onClick={leave}>모임 나가기</button></div>}
          <div ref={messageLog} className="dd-message-log" role="log" aria-label="대화 기록" tabIndex={0} onScroll={e=>{const el=e.currentTarget;nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<48}}><div className="dd-chat-system"><Info size={14}/><span>아직 실제 이용자는 연결되지 않았어요.</span></div>{practice&&seedFor(topic).map((m,i)=>peer(whoName(m.who),m.text,'seed'+i))}{!practice&&!(messages[topic.id]??[]).length&&<div className="dd-chat-welcome"><span className="dd-chat-welcome-icon">{space.icon}</span><strong>이야기의 시작</strong><p>{topic.description||'첫 이야기를 남겨 보세요.'}</p><button onClick={()=>setPractice(true)}>주민과 대화 연습</button></div>}{(messages[topic.id]??[]).map(m=>m.by?peer(m.by,m.text,m.id):<div key={m.id} className="dd-own-message"><div className="dd-message-meta dd-own-label"><span>나</span></div><div className="dd-message-bubble">{m.spoiler&&!revealed.includes(m.id)?<button className="dd-spoiler" onClick={()=>setRevealed(v=>[...v,m.id])}>스포일러 보기</button>:<>{m.text&&<p>{m.text}</p>}{m.image&&<img src={m.image} alt="내가 올린 사진"/>}</>}{m.place&&safePlaceUrl(m.place.url)&&<div className="dd-place-card"><strong><MapPin size={14}/> {m.place.name}</strong><a href={safePlaceUrl(m.place.url)} target="_blank" rel="noopener noreferrer">장소 링크 열기</a><button type="button" className="btn btn-ghost btn-sm" onClick={()=>{const place=m.place!;setSavedPlaces(p=>p.some(x=>x.url===place.url&&x.name===place.name)?p:[place,...p].slice(0,100))}}>장소 저장</button></div>}</div><div className="dd-message-time"><time dateTime={m.at}>{new Date(m.at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</time><button onClick={()=>setMessages(p=>({...p,[topic.id]:(p[topic.id]??[]).filter(x=>x.id!==m.id)}))}>삭제</button></div></div>)}</div>
          <div className="dd-chat-compose" aria-label="메시지 작성 영역">
          {picture&&<div className="dd-chat-attachment"><img src={picture} alt="첨부 미리보기"/><button className="dd3-btn" onClick={()=>setPicture('')}>첨부 제거</button></div>}
          {showPlace&&<div className="dd-chat-place"><label>장소 이름<input aria-label="장소 이름" className={FIELD} value={placeName} maxLength={100} onChange={e=>setPlaceName(e.target.value)}/></label><label>장소 링크<input aria-label="장소 링크" className={FIELD} value={placeUrl} maxLength={2000} onChange={e=>setPlaceUrl(e.target.value)}/></label><small>운영 여부 미검증 · 로컬 추천</small></div>}
          {emojiOpen&&<div className="dd-emoji-tray">{['😊','💛','🎄','☕','👏','🎉','✨','🐾','❤️','😂','🙌','🌷'].map(e=><button key={e} aria-label={e} onClick={()=>setDraft(p=>(p+e).slice(0,1000))}>{e}</button>)}</div>}
          {notice&&<p role="status" className="dd-chat-notice">{notice}</p>}
          {quickOpen&&<div className="dd-chip-row" role="group" aria-label="빠른 문장">{KIND_UI[kindOf(topic)].chips.map(c=><button type="button" key={c.label} onClick={()=>{setDraft(p=>((p?p+(p.endsWith(' ')?'':' '):'')+c.text).slice(0,1000));composer.current?.focus()}}>{c.label}</button>)}</div>}
          {(kindOf(topic)==='review'||spoiler)&&<label className="dd-spoiler-option"><input type="checkbox" checked={spoiler} onChange={e=>setSpoiler(e.target.checked)}/> 스포일러 숨김</label>}
          <form className="dd-message-form" onSubmit={e=>{e.preventDefault();send()}}><button type="button" className="dd-attach-plus" aria-label="첨부 메뉴" aria-expanded={attachOpen} onClick={()=>{setAttachOpen(v=>!v);setEmojiOpen(false)}}><Plus size={23}/></button><input ref={composer} aria-label="메시지" maxLength={1000} value={draft} placeholder={KIND_UI[kindOf(topic)].placeholder} onChange={e=>setDraft(e.target.value)}/><button type="button" className="dd-inline-emoji" aria-label="이모티콘" aria-expanded={emojiOpen} onClick={()=>{setEmojiOpen(v=>!v);setAttachOpen(false)}}><Smile size={22}/></button><button className="dd-send" aria-label="전송" disabled={loading||(!draft.trim()&&!picture&&!placeName.trim())}><Send size={19}/></button></form>
          <div className="dd-compose-tools" hidden={!attachOpen}><button className="dd-chat-icon" aria-label="사진 첨부" title="사진 첨부" onClick={()=>fileInput.current?.click()}><ImagePlus size={21}/><small>사진</small></button><input ref={fileInput} hidden aria-label="사진 첨부 파일" type="file" accept="image/jpeg,image/png,image/webp" disabled={loading} className="block max-w-full text-xs" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>5_000_000){setNotice('5MB 이하 사진만 첨부할 수 있어요.');return}setLoading(true);try{const image=await resizeImageFile(file,320,0.5);if(image.length>90000||!image.startsWith('data:image/jpeg'))throw Error('image');setPicture(image);setNotice('')}catch{setNotice('사진을 처리할 수 없어요. 작은 사진을 선택해 주세요.')}finally{setLoading(false)}}}/><button className="dd-chat-icon" aria-label="빠른 문장" aria-expanded={quickOpen} onClick={()=>setQuickOpen(v=>!v)}><MessageCircle size={21}/><small>빠른 문장</small></button><button className="dd-chat-icon" aria-label={showPlace?'장소 추천 입력 접기':'장소 추천 첨부'} title="장소 추천" onClick={()=>setShowPlace(v=>!v)}><MapPin size={21}/><small>장소</small></button><details className="dd-chat-saved"><summary>저장한 장소 ({savedPlaces.length})</summary>{savedPlaces.filter(p=>safePlaceUrl(p.url)).map(p=><div key={p.name+p.url}><a href={safePlaceUrl(p.url)} target="_blank" rel="noopener noreferrer">{p.name}</a><button type="button" className="btn btn-ghost btn-sm" onClick={()=>setSavedPlaces(list=>list.filter(v=>v.url!==p.url||v.name!==p.name))}>삭제</button></div>)}</details></div>
          </div>
        </div> : <div className="space-y-4">
          {space.id==='single'&&<p className="text-xs">성인 인증 전이므로 실제 만남이나 DM 연결은 제공하지 않습니다.</p>}
          {world&&<div className="dd-lobby-story"><strong>{PLACE_STORIES[space.id]?.title??space.name}</strong><p>{world.story}</p><details><summary>이 공간의 매너</summary><ul>{world.rules.map(r=><li key={r}>{r}</li>)}</ul></details></div>}
          {world&&(()=>{const pick=todayPick(world.today);return <button type="button" className="dd-today-card" onClick={openToday}><small>TODAY · 오늘의 주제</small><strong>{pick.title}</strong><span>{pick.question}</span><em>이 주제로 방 열기 →</em></button>})()}
          <div className="flex items-center justify-between"><h3 className="serif text-lg">이 공간의 모임</h3><button className="btn btn-outline" onClick={()=>setShowCreate(v=>!v)}>{showCreate?'닫기':<><Plus size={16}/> 모임 만들기</>}</button></div>
          <div className="dd-room-discovery"><div className="dd-search-field"><Search size={18}/><input aria-label="모임 검색" placeholder="작품명·가수·모임 제목 검색" value={roomSearch} onChange={e=>setRoomSearch(e.target.value)}/></div><div className="dd-room-filters" role="group" aria-label="모임 유형">{(['all','saved',...Object.keys(KIND_UI)] as ('all'|'saved'|TopicKind)[]).map(k=><button key={k} aria-pressed={roomFilter===k} onClick={()=>setRoomFilter(k)}>{k==='all'?'전체':k==='saved'?'저장한 방':KIND_UI[k].label}</button>)}</div></div>
          {showCreate&&<form className="card space-y-3 p-4" onSubmit={e=>{e.preventDefault();if(!title.trim()||!Number.isInteger(capacity)||capacity<1||capacity>20)return;const next={id:uuid(),space:space.id,title:title.trim(),description:description.trim(),date,capacity,age,kind:createKind};setTopics(p=>[next,...p]);setTitle('');setDescription('');setDate('');setCapacity(20);setShowCreate(false);enter(next)}}>
            <label className="block text-sm">모임 유형<select aria-label="새 모임 유형" className={FIELD} value={createKind} onChange={e=>setCreateKind(e.target.value as TopicKind)}>{Object.entries(KIND_UI).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></label>
            <label className="block text-sm">제목<input className={FIELD} required maxLength={60} value={title} onChange={e=>setTitle(e.target.value)}/></label>
            <label className="block text-sm">설명<textarea className={FIELD} maxLength={300} value={description} onChange={e=>setDescription(e.target.value)}/></label>
            <label className="block text-sm">일정<input type="datetime-local" className={FIELD} value={date} onChange={e=>setDate(e.target.value)}/></label>
            <div className="grid grid-cols-2 gap-2"><label className="text-sm">목표 인원<input type="number" min={1} max={20} required className={FIELD} value={capacity} onChange={e=>setCapacity(Number(e.target.value))}/></label><label className="text-sm">연령 그룹<select className={FIELD} value={age} onChange={e=>setAge(e.target.value)}>{['성인 전체','20대','30대','40대','50대 이상'].map(v=><option key={v}>{v}</option>)}</select></label></div>
            <button className="btn btn-primary">로컬 모임 만들기</button>
          </form>}
          {(()=>{const seeds=Array.from(new Set([...space.topics,...(world?.topics.map(t=>t.title)??[])])).map((t,i):Topic=>({id:space.id+'-'+i,space:space.id,title:t,description:world?.topics.find(x=>x.title===t)?.blurb??'자유롭게 이야기를 나누는 시연 모임',date:'',capacity:20,age:'성인 전체'}));const q=roomSearch.trim().toLocaleLowerCase();const all=[...topics.filter(t=>t.space===space.id),...seeds];const filtered=all.filter(t=>(!q||[t.title,t.description].some(v=>v.toLocaleLowerCase().includes(q)))&&(roomFilter==='all'||(roomFilter==='saved'?savedTopics.includes(t.id):kindOf(t)===roomFilter)));return filtered.length?filtered.map(t=><div key={t.id} className="dd-room-list-item"><button className="dd-room-join" onClick={()=>enter(t)}><span><strong>{t.title}</strong><small>{t.description}{t.date?' · '+t.date.replace('T',' '):''} · 목표 {t.capacity}명</small></span><span className="dd-kind-badge">{KIND_UI[kindOf(t)].label}</span><ChevronRight size={18}/></button><button className="dd-room-save" aria-label={(savedTopics.includes(t.id)?'저장 해제 ':'모임 저장 ')+t.title} aria-pressed={savedTopics.includes(t.id)} onClick={()=>setSavedTopics(v=>v.includes(t.id)?v.filter(x=>x!==t.id):[...v,t.id])}><Star size={18} fill={savedTopics.includes(t.id)?'currentColor':'none'}/></button></div>):<p className="dd-room-empty">조건에 맞는 모임이 없어요. 검색 조건을 바꾸거나 새로운 방을 열어 보세요.</p>})()}
          {space.legacy?.map(id=><button key={id} className="card flex w-full justify-between gap-2 p-4 text-left" onClick={()=>{leave();setSpace(null);onLegacy(id)}}><span>{ROOMS.find(r=>r.id===id)?.name}</span><span className="text-xs">기존 시연방 →</span></button>)}
        </div>}
      </div>
        </aside>}
      </div>
  </section>
}

const dailyThemes=[
 ['새해 작은 약속','겨울 창가 사진','따뜻한 차','올해 읽을 책','새해 엽서'],
 ['마음 한 줄','좋아하는 색','친구에게 감사','겨울 간식','작은 응원'],
 ['봄 산책','새로운 취미','꽃 사진','봄 플레이리스트','새 출발'],
 ['꽃길 엽서','봄 소풍','창가 독서','비 오는 날','초록빛 사진'],
 ['감사 편지','가족 추억','동물 친구','나들이 계획','작은 선물'],
 ['초여름 산책','시원한 음료','여름 책','초록 정원','여행 준비'],
 ['여름 바다','아이스티','밤 산책','여름 영화','여행 사진'],
 ['여름 추억','별빛 이야기','휴가 엽서','시원한 간식','실내 취미'],
 ['가을 첫날','책갈피','가을 음악','산책 사진','추억의 간식'],
 ['단풍 엽서','가을 영화','따뜻한 차','작은 그림','가을 여행'],
 ['겨울 준비','올해의 책','감사 한 줄','따뜻한 방','추억 사진'],
 ['겨울 편지','올해의 추억','따뜻한 음료','연말 영화','새해 소망']
]
const dailyActions=['한 줄 소개','사진으로 기록','추천 하나','나만의 팁','추억 나누기','작은 계획','오늘의 선택']
const dailySpaces=['plaza','hobby','cafe','cinema','travel']
function DailyFestival({onVisit}:{onVisit:(id:string)=>void}){
 const today=seoulDate(),[selected,setSelected]=useState(today)
 const [notes,setNotes]=usePersistentState<Record<string,string>>('dd.dailyFestival.v1',{})
 const [draft,setDraft]=useState(notes[today]??''),[feedback,setFeedback]=useState('')
 const date=new Date(selected+'T00:00:00Z'),month=date.getUTCMonth(),day=date.getUTCDate(),index=day-1
 const theme=dailyThemes[month][index%dailyThemes[month].length],action=dailyActions[Math.floor(index/5)%dailyActions.length]
 function change(delta:number){const next=new Date(date);next.setUTCDate(next.getUTCDate()+delta);const key=next.toISOString().slice(0,10);setSelected(key);setDraft(notes[key]??'');setFeedback('')}
 return <section className="card space-y-3 p-4" aria-label="매일의 딩동 이벤트"><strong>365일 작은 축제</strong><p>서울 날짜 기준 · 윤년에는 366일 · 실제 공휴일 일정과 별개인 로컬 콘텐츠</p><div className="flex items-center justify-between"><button type="button" aria-label="전날 이벤트" onClick={()=>change(-1)}>‹</button><span>{selected}{selected===today?' · 오늘':''}</span><button type="button" aria-label="다음 날 이벤트" onClick={()=>change(1)}>›</button></div><h3>{theme} · {action}</h3><p>오늘의 주제를 나만의 기록으로 남겨 보세요.</p><textarea aria-label="오늘의 축제 기록" className={FIELD} maxLength={500} value={draft} onChange={e=>{setDraft(e.target.value);setFeedback('')}}/><button type="button" className="dd3-btn" onClick={()=>{const next={...notes,[selected]:draft.trim()};if(saveJSON('dd.dailyFestival.v1',next)){setNotes(next);setFeedback('이 기기에 저장했어요.')}else setFeedback('저장하지 못했어요. 다시 시도해 주세요.')}}>기록 저장</button><p role="status">{feedback}</p><button type="button" className="dd3-btn" onClick={()=>onVisit(dailySpaces[index%dailySpaces.length])}>관련 공간 방문</button></section>
}

function MiniHomeJournal(){
 const [saved,setSaved]=usePersistentState('dd.minihome.journal.v1',{title:'나의 작은 집',mood:'편안함',note:''})
 const [draft,setDraft]=useState(saved),[status,setStatus]=useState('')
 return <section className="card space-y-3 p-4" aria-label="나의 미니홈피"><h3>{saved.title}</h3><p>오늘의 기분 · {saved.mood}</p><p style={{whiteSpace:'pre-wrap'}}>{saved.note||'아직 남긴 일기가 없어요.'}</p><small>이 기기에만 저장되는 개인 공간입니다. 실제 방문자나 공개 기능은 연결되지 않았어요.</small><label className="block">홈피 제목<input className={FIELD} maxLength={40} value={draft.title} onChange={e=>{setDraft(v=>({...v,title:e.target.value}));setStatus('')}}/></label><label className="block">기분<select className={FIELD} value={draft.mood} onChange={e=>{setDraft(v=>({...v,mood:e.target.value}));setStatus('')}}>{['편안함','설렘','기쁨','차분함','휴식 필요'].map(m=><option key={m}>{m}</option>)}</select></label><label className="block">한 줄 일기<textarea className={FIELD} maxLength={500} value={draft.note} onChange={e=>{setDraft(v=>({...v,note:e.target.value}));setStatus('')}}/></label><button type="button" className="dd3-btn" onClick={()=>{const next={...draft,title:draft.title.trim()||'나의 작은 집'};if(saveJSON('dd.minihome.journal.v1',next)){setSaved(next);setDraft(next);setStatus('저장했어요.')}else setStatus('저장 실패. 다시 시도해 주세요.')}}>미니홈피 저장</button><p role="status">{status}</p></section>
}
