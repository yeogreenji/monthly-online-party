import {MemoryAlbum,MemoryComposer,type Memory} from './MemoryAlbum'
import {HomeEditor} from './HomeEditor'
import {GameCorner} from './GameCorner'
import {GameStage} from './games/GameStage'
import {GAMES} from '../data/minigames'
import type {GameId} from '../data/minigames'
import {HOME_DEFAULT,normalizeHome} from '../data/homeDecor'
import {FestivalArt} from './FestivalArt'
import {Paintbrush,PartyPopper,CalendarDays,Map,Home,Settings,Shirt,UserRound,Mail,Bell,Camera,MessageCircle,ImagePlus,Smile,MapPin,Send,MoreHorizontal,ChevronDown,ChevronLeft,Maximize2,Minimize2,Plus,Search,Star,ChevronRight,Info} from 'lucide-react'
import { access } from '../data/phase1'
import { DEFAULT_LOOK, normalizeLook } from '../data/avatarLook'
import { AvatarWardrobe } from './AvatarWardrobe'
import { useEffect, useState, useRef, useMemo } from 'react'
import type { Profile, RoomId } from '../types'
import { LUNAR_FESTIVALS, MONTHLY_IDEAS, SPACES } from '../data/dingdong'
import type { Space } from '../data/dingdong'
import { usePersistentState,saveJSON } from '../lib/storage'
import { ROOMS } from '../data/rooms'
import { CALENDAR } from '../data/themes'
import { resizeImageFile } from '../lib/image'
import { Mansion3D } from './Mansion3D'
import { RESIDENTS, PLACE_STORIES } from '../data/world'
import { dailyEvent } from '../data/dailyEvents'
import { checkChatText } from '../lib/safety'
import { serverEnabled, signOut } from '../lib/supabase'
import { createTransport, reportMessage, blockUser, listBlocks, removeMessage, createSharedTopic, listSharedTopics, subscribeSharedTopics, updateSharedTopic, removeSharedTopic } from '../lib/supabaseTransport'
import { useSpacePresence } from '../lib/presence'
import type { PresencePeer } from '../lib/presence'
import { AdminReports } from './AdminReports'
import type { TransportMessage } from '../lib/chatTransport'
import { useAuth, useProfileSync } from '../lib/useAuth'
import { AuthCard } from './AuthCard'
import { SPACE_WORLD, KIND_UI, demoReply, todayPick, whoName, seoulDate } from '../data/spaceWorld'
// 로렌(기획) 승인 정본: 덕질 존 개설 유형·제목 규칙을 JSON 정본에서 그대로 읽어 쓴다.
import CONTENT_MASTER from '../../content/dingdong/content-master-v1.json'
import type { TopicKind } from '../data/spaceWorld'

type Visibility = 'private' | 'friends' | 'public'
type Topic = { id: string; space: string; title: string; description: string; date: string; capacity: number; age: string; kind?: TopicKind; workTitle?: string; artist?: string; fanOccasion?: string; creatorId?: string }
type Place = {name:string;url:string}
type Message = { id: string; text: string; image?: string; place?:Place; at: string; by?: string; spoiler?: boolean; userId?: string }
const REPORT_REASONS = [{ id: 'contact', label: '연락처 요구' }, { id: 'abuse', label: '불쾌한 말' }, { id: 'ad', label: '광고·홍보' }, { id: 'privacy', label: '개인정보 노출' }, { id: 'other', label: '기타' }] as const
function safePlaceUrl(value:string){try{const u=new URL(value.trim());return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}}
type History = { id: string; title: string; at: string; visibility: Visibility }
const GAME_TOPIC: [RegExp, GameId][] = [
  [/밸런스/, 'balance'], [/ox|퀴즈/i, 'quiz'], [/끝말/, 'word'], [/힌트|수수께끼/, 'riddle'],
  [/그림/, 'picture'], [/보드게임|틱택토/, 'tictactoe'], [/스무고개/, 'twenty'], [/룰렛|뽑기/, 'roulette'],
  [/주사위/, 'dice'], [/빙고/, 'bingo'],
]
function gameForTopic(title: string): GameId | undefined {
  return GAME_TOPIC.find(([pattern]) => pattern.test(title))?.[1]
}
const VISIBILITY = { private: '비공개', friends: '친구 공개(설정만)', public: '전체 공개(설정만)' }
/** 덕질 존 개설 유형 — content-master-v1.json의 fandom.types(9종)를 그대로 쓴다. */
const FAN_SPEC = (CONTENT_MASTER as { fandom?: { types?: string[]; default_title_template?: string; title_template?: string } }).fandom ?? {}
const FAN_THEMES: readonly string[] = FAN_SPEC.types?.length ? FAN_SPEC.types : ['팬 모여라', '컴백 파티', '최애 생일 파티', '콘서트 후기', '뮤직비디오 감상회', '포토카드 자랑', '입덕 이야기', '데뷔 기념일', '자유 수다']
/** 정본 규칙: 유형이 '팬 모여라'면 '{artist} 팬 모여라', 그 밖에는 '{artist} {kind}'. */
function fanTitle(artist: string, kind: string) {
  const a = artist.trim()
  if (!a) return ''
  if (kind === '팬 모여라') return (FAN_SPEC.default_title_template ?? '{artist} 팬 모여라').replace('{artist}', a)
  return (FAN_SPEC.title_template ?? '{artist} {kind}').replace('{artist}', a).replace('{kind}', kind)
}
const INITIAL_HOME = HOME_DEFAULT
const FIELD = 'w-full rounded-xl border border-current/15 bg-transparent px-3 py-2 text-sm'
const uuid = () => globalThis.crypto?.randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2)
const CORNERS = {
  travelMap: { space: 'travel', title: '로드의 여행 지도', description: '가 보고 싶은 곳을 찾거나 장소 이름과 지도 링크를 나눠요.', topics: ['여행지 추천', '주말 여행 계획'] },
  travelPostcards: { space: 'travel', title: '로드의 엽서 진열대', description: '여행에서 찍은 사진 한 장이나 기억하고 싶은 순간을 남겨요.', topics: ['여행 사진', '여행 엽서'] },
  cafe: { space: 'cafe', title: '모카의 메뉴판', description: '카페라테 · 유자차 · 딸기 케이크. 딩동 카페의 가상 메뉴예요.', topics: ['오늘의 차', '디저트 추천', '홈카페 레시피'] },
  reading: { space: 'hobby', title: '독서 코너', description: '함께 읽은 책과 각자의 책장을 나눠요.', topics: ['독서 토론', '책 추천'] },
  pets: { space: 'hobby', title: '반려동물 코너', description: '동물 친구 이야기와 사진을 나눠요.', topics: ['반려동물 이야기'] },
  craft: { space: 'hobby', title: '공예 작업대', description: '지금 만들고 있는 것과 작업 팁을 나눠요.', topics: ['그림과 손작업', '뜨개질 모임'] },
} as const
type CornerId = keyof typeof CORNERS

export function DingdongSpaces({ profile, onLegacy, onParty, onEditProfile, onMenu }: { profile: Profile; onLegacy: (id: RoomId) => void; onParty: () => void; onEditProfile: () => void; onMenu:(id:string)=>void }) {
  // 첫 화면은 중앙 축제광장에서 시작한다 — 거리에서도 바로 채팅 콘솔을 열 수 있게.
  const [space, setSpace] = useState<Space | null>(() => SPACES.find(s => s.id === 'plaza') ?? null)
  const [savedLook,setLook]=usePersistentState('dd.avatar.look.v1',DEFAULT_LOOK)
  const look=normalizeLook(savedLook)
  const [homeMove,setHomeMove]=useState<{x:number;z:number;nonce:number}|null>(null)
  const [chatCollapsed,setChatCollapsed]=useState(true),[chatFull,setChatFull]=useState(false),[selectedFurniture,setSelectedFurniture]=useState<string|null>(null),[attachOpen,setAttachOpen]=useState(false),[practice,setPractice]=useState(false),[quickOpen,setQuickOpen]=useState(false)
  const [chatExtras,setChatExtras]=useState(false),[emojiOpen,setEmojiOpen]=useState(false)
  const nearBottom=useRef(true),messageLog=useRef<HTMLDivElement>(null),fileInput=useRef<HTMLInputElement>(null),composer=useRef<HTMLInputElement>(null)
  const [cornerId,setCornerId]=useState<CornerId|null>(null)
  const [wardrobe,setWardrobe]=useState(false)
  const [yearbook,setYearbook]=useState(false)
  const [toolsOpen,setToolsOpen]=useState(false),[mapOpen,setMapOpen]=useState(false),[mailOpen,setMailOpen]=useState(false)
  const [game,setGame]=useState<GameId|null>(null)
  const [lastGame,setLastGame]=useState<GameId>('balance')
  function openGame(id?:GameId){const next=id??lastGame;setLastGame(next);setGame(next);setChatCollapsed(true);closePanels()}
  const [request,setRequest]=useState<{id:string;serial:number;direct?:boolean;preview?:boolean}|null>(null)
  const [homeExpanded,setHomeExpanded]=useState(false)
  const [memoriesOpen,setMemoriesOpen]=useState(false)
  const [historyStatus,setHistoryStatus]=useState('')
  function closePanels(){setMemoriesOpen(false);setCornerId(null);setWardrobe(false);setYearbook(false);setMapOpen(false);setMailOpen(false);setToolsOpen(false)}
  function showPanel(id:string){closePanels();setChatCollapsed(true);if(id==='wardrobe')setWardrobe(true);if(id==='events')setYearbook(true);if(id==='map')setMapOpen(true);if(id==='mail')setMailOpen(true);if(id==='memories'){setHistoryStatus('');setMemoriesOpen(true)}}
  function toggleTools(v:boolean){if(v){closePanels();setChatCollapsed(true)}setToolsOpen(v)}
  function visit(id:string,direct=false,preview=false){closePanels();setChatFull(false);setChatCollapsed(true);setRequest(p=>({id,serial:(p?.serial??0)+1,direct,preview}))}
  function externalMenu(id:string){closePanels();setChatCollapsed(true);onMenu(id)}
  const [autoChat, setAutoChat] = useState(false)
  const [roomSearch,setRoomSearch]=useState(''),[roomFilter,setRoomFilter]=useState<TopicKind|'all'|'saved'>('all')
  const [savedTopics,setSavedTopics]=usePersistentState<string[]>('dd.savedTopics.v1',[])
  const [createKind,setCreateKind]=useState<TopicKind>('talk')
  const [artist,setArtist]=useState(''),[fanOccasion,setFanOccasion]=useState<string>(FAN_THEMES[0])
  const [fullRoom,setFullRoom]=useState<Topic|null>(null)
  const [editTopic,setEditTopic]=useState<Topic|null>(null)
  const [editTitle,setEditTitle]=useState(''),[editDescription,setEditDescription]=useState(''),[editDate,setEditDate]=useState(''),[editCapacity,setEditCapacity]=useState(20),[editArtist,setEditArtist]=useState(''),[editFan,setEditFan]=useState<string>(FAN_THEMES[0])
  const [manageMsg,setManageMsg]=useState('')
  const drafts=useRef<Record<string,{text:string;image:string;name:string;url:string;spoiler:boolean}>>({})
  const [spoiler,setSpoiler]=useState(false),[revealed,setRevealed]=useState<string[]>([])
  const [topic, setTopic] = useState<Topic | null>(null)
  const [favorites, setFavorites] = usePersistentState<string[]>('dd.favorites.v1', [])
  const [topics, setTopics] = usePersistentState<Topic[]>('dd.topics.v1', [])
  const [sharedTopics, setSharedTopics] = useState<Topic[]>([])
  const [createErr, setCreateErr] = useState('')
  const [messages, setMessages] = usePersistentState<Record<string, Message[]>>('dd.messages.v1', {})
  // 서버 채팅: 서버가 설정되어 있고 로그인·프로필 동기화가 끝났을 때만 켜진다. 아니면 위의 기기 저장 대화를 쓴다.
  const { user: authUser } = useAuth()
  const sync = useProfileSync(authUser, profile.nickname, profile.ageBand)
  const online = serverEnabled && !!authUser && sync === 'ok'
  const remote = useMemo(() => (serverEnabled ? createTransport() : null), [])
  // 실시간 접속: 로그인한 이용자가 같은 공간에 있으면 서버 Presence로 서로의 캐릭터·들어간 모임·말풍선을 주고받는다.
  const poseRef = useRef<(() => { x: number; z: number; pose: 'standing' | 'seated' | 'lying' }) | null>(null)
  const presenceBase = online && authUser && space ? { id: authUser.id, nickname: profile.nickname, avatar: profile.avatar, look, space: space.id } : null
  const presence = useSpacePresence(presenceBase, topic?.id ?? null, () => poseRef.current?.() ?? { x: 0, z: 0, pose: 'standing' })
  const peers: PresencePeer[] = presence.peers
  const [peerBubble, setPeerBubble] = useState<{ id: string; text: string; nonce: number } | null>(null)
  const [remoteMsgs, setRemoteMsgs] = useState<Record<string, Message[]>>({})
  const [blocked, setBlocked] = useState<string[]>([])
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [reportFor, setReportFor] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [connState, setConnState] = useState<'idle' | 'loading' | 'error'>('idle')
  const toMsg = (m: TransportMessage): Message => ({ id: m.id, text: m.text, at: m.at, by: m.by, userId: m.userId, spoiler: m.spoiler, place: m.place ? { name: m.place.name, url: m.place.url ?? '' } : undefined })
  const addRemote = (tid: string, m: Message) => {setRemoteMsgs(p => { const cur = p[tid] ?? []; return cur.some(x => x.id === m.id) ? p : { ...p, [tid]: [...cur, m].slice(-50) } });if(m.userId&&m.userId!==authUser?.id&&m.text)setPeerBubble({id:m.userId,text:m.text,nonce:Date.now()})}
  const shown = (tid: string) => online ? (remoteMsgs[tid] ?? []).filter(m => !hiddenIds.includes(m.id) && !(m.userId && blocked.includes(m.userId))) : (messages[tid] ?? [])
  const isMine = (m: Message) => online ? m.userId === authUser?.id : !m.by
  useEffect(() => { if (!online) { setBlocked([]); return } let alive = true; void listBlocks().then(ids => { if (alive) setBlocked(ids) }); return () => { alive = false } }, [online])
  useEffect(() => {
    if (!online || !remote || !topic) return
    const tid = topic.id
    let alive = true
    setConnState('loading')
    remote.load(tid, 50).then(list => { if (!alive) return; setRemoteMsgs(p => ({ ...p, [tid]: list.map(toMsg) })); setConnState('idle') }).catch(() => { if (alive) setConnState('error') })
    const off = remote.subscribe(tid, m => { if (alive) addRemote(tid, toMsg(m)) })
    return () => { alive = false; off() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, topic?.id])
  function reportPeer(m: Message, reason: typeof REPORT_REASONS[number]['id']) {
    void reportMessage(m.id, reason).then(ok => { if (ok) { setHiddenIds(v => [...v, m.id]); setNotice('신고를 저장했어요. 이 메시지는 이 화면에서 가려요.') } else setNotice('신고를 보내지 못했어요. 잠시 후 다시 시도해 주세요.'); setReportFor(null) })
  }
  function blockPeer(m: Message) {
    if (!m.userId || !window.confirm(`${m.by ?? '이 이용자'}님을 차단할까요? 이 이용자의 메시지가 보이지 않아요.`)) return
    void blockUser(m.userId).then(ok => { if (ok) setBlocked(v => [...v, m.userId!]); setNotice(ok ? `${m.by ?? '이용자'}님을 차단했어요.` : '차단하지 못했어요. 잠시 후 다시 시도해 주세요.') })
  }
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
  const photoRequest = useRef(0)
  function cancelPhotoRequest() {
    photoRequest.current += 1
    setLoading(false)
  }
  async function attachPhoto(file: File) {
    cancelPhotoRequest()
    const requestId = photoRequest.current
    if (file.size > 5_000_000) {
      setNotice('5MB 이하 사진만 첨부할 수 있어요.')
      return
    }
    setLoading(true)
    try {
      const image = await resizeImageFile(file, 320, 0.5)
      if (requestId !== photoRequest.current) return
      if (image.length > 90000 || !image.startsWith('data:image/jpeg')) throw Error('image')
      setPicture(image)
      setNotice('')
    } catch {
      if (requestId === photoRequest.current) setNotice('사진을 처리할 수 없어요. 작은 사진을 선택해 주세요.')
    } finally {
      if (requestId === photoRequest.current) setLoading(false)
    }
  }
  const [showCreate, setShowCreate] = useState(false)
  const addShared=(t:Topic)=>setSharedTopics(p=>p.some(x=>x.id===t.id)?p.map(x=>x.id===t.id?{...x,...t}:x):[t,...p])
  useEffect(()=>{setSharedTopics([]);if(!online||!space)return;let live=true;const sid=space.id;void listSharedTopics(sid).then(list=>{if(live)setSharedTopics(list)});const off=subscribeSharedTopics(sid,t=>{if(live)addShared(t)},id=>{if(live)setSharedTopics(p=>p.filter(x=>x.id!==id))});return()=>{live=false;off()}},[online,space?.id])
  const [title, setTitle] = useState('')
  const [workTitle, setWorkTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [capacity, setCapacity] = useState(20)
  const [age, setAge] = useState('성인 전체')
  const [saveHistory, setSaveHistory] = useState(false)
  const [visibility, setVisibility] = useState<Visibility>('private')
  function saveMemory(note:string,photos:string[]){if(!topic)return false;const entry:Memory={id:uuid(),topicId:topic.id,title:topic.title,space:topic.space,date:new Date().toISOString(),note,photos:photos.filter(v=>v.startsWith('data:image/jpeg')).slice(0,3)};if(!entry.note&&!entry.photos.length)return false;const next=[entry,...memories].slice(0,30);if(!saveJSON('dd.memories.v1',next))return false;setMemories(next);return true}
  function deleteMemory(id:string){const next=memories.filter(v=>v.id!==id);if(!saveJSON('dd.memories.v1',next))return false;setMemories(next);return true}
  function keepDraft(){if(topic)drafts.current[topic.id]={text:draft,image:picture,name:placeName,url:placeUrl,spoiler}}
  function rememberExit(){if(topic&&saveHistory)setHistory(prev=>[{id:uuid(),title:topic.title,at:new Date().toISOString(),visibility},...prev].slice(0,100))}
  function openSpace(next: Space) {cancelPhotoRequest();setChatFull(false);setAttachOpen(false);setQuickOpen(false);setPractice(false);keepDraft();rememberExit();closePanels();setHomeExpanded(false);setSelectedFurniture(null);setChatCollapsed(next.id==='home'||access(next.id)!=='open');setSpace(next);setTopic(null);setShowCreate(false);setWorkTitle('');setNotice('');setAutoChat(false);setDraft('');setPicture('');clearPlace();setSpoiler(false);setSaveHistory(false);setVisibility('private');setRoomSearch('');setRoomFilter('all')}
  function enter(next:Topic){if(access(next.space)!=='open'||topic?.id===next.id)return;if(online&&roomIsFull(next)){setFullRoom(next);setChatCollapsed(false);return}cancelPhotoRequest();setAttachOpen(false);setQuickOpen(false);setPractice(false);nearBottom.current=true;keepDraft();rememberExit();const prev=drafts.current[next.id];setAutoChat(false);setTopic(next);setDraft(prev?.text??'');setPicture(prev?.image??'');setPlaceName(prev?.name??'');setPlaceUrl(prev?.url??'');setShowPlace(!!prev?.name||!!prev?.url);setSpoiler(prev?.spoiler??false);setNotice('');setSaveHistory(false);setVisibility('private');setChatExtras(false);setEmojiOpen(false);setChatCollapsed(false)}
  function leave(){cancelPhotoRequest();setAttachOpen(false);setQuickOpen(false);setPractice(false);keepDraft();rememberExit();setAutoChat(false);setTopic(null);setDraft('');setPicture('');clearPlace();setSpoiler(false);setNotice('');setSaveHistory(false);setChatExtras(false)}
  const world=space?SPACE_WORLD[space.id]:undefined
  const corner=cornerId&&CORNERS[cornerId].space===space?.id?CORNERS[cornerId]:null
  const seedTopics: Topic[] = space
    ? Array.from(new Set([...space.topics,...(world?.topics.map(topic=>topic.title)??[])]))
      .map((title,index)=>({id:space.id+'-'+index,space:space.id,title,description:world?.topics.find(topic=>topic.title===title)?.blurb??'자유롭게 이야기를 나누는 시연 모임',date:'',capacity:20,age:'성인 전체'}))
    : []
  function openCorner(id:CornerId){
    if(CORNERS[id].space!==space?.id)return
    closePanels()
    setChatCollapsed(true)
    setCornerId(id)
  }
  const seedFor=(t:Topic)=>{const w=SPACE_WORLD[t.space];const found=t.id.startsWith(t.space+'-')?w?.topics.find(x=>x.title===t.title):undefined;if(found)return found.seed;if(t.id.includes('-today-')||!w)return [{who:t.space,text:t.description||'새 방이 열렸어요. 첫 이야기를 남겨 주세요.'}];return [{who:t.space,text:t.description?t.description:'새 방이 열렸어요. 첫 이야기를 남겨 주세요.'}]}
  function demoMembers(t:Topic){return new Set(seedFor(t).map(m=>m.who)).size}
  const roomBaseTitle=(t:Topic)=>t.title.replace(/\s*\d+호실$/,'').trim()
  function allSpaceTopics(){const map=new globalThis.Map<string,Topic>();for(const t of [...topics,...sharedTopics])if(!map.has(t.id))map.set(t.id,t);return [...map.values()]}
  // 서버에 로그인해 있으면 실제 접속 인원을 센다. 한가한 화면(로컬 체험)에서는 기존 시연 인원을 쓴다.
  function roomCount(t:Topic){if(online)return peers.filter(p=>p.topicId===t.id).length+(topic?.id===t.id?1:0);return 1+(practice?demoMembers(t):0)}
  function roomIsFull(t:Topic){return roomCount(t)>=Math.max(1,t.capacity)}
  function nextRoomTitle(t:Topic){const base=roomBaseTitle(t);const count=allSpaceTopics().filter(x=>x.space===t.space&&roomBaseTitle(x)===base&&!x.id.includes('-today-')).length;return base+' '+Math.max(2,count+1)+'호실'}
  async function openNextRoom(t:Topic){
    const next:Topic={...t,id:uuid(),creatorId:online&&authUser?authUser.id:t.creatorId,title:nextRoomTitle(t),description:t.description}
    setFullRoom(null)
    if(online&&authUser){
      const err=await createSharedTopic({id:next.id,space:next.space,title:next.title,description:next.description,date:next.date,capacity:next.capacity,age:next.age,kind:kindOf(next),workTitle:next.workTitle,artist:next.artist,fanOccasion:next.fanOccasion})
      if(err){setNotice(err);return}
      addShared({...next,creatorId:authUser.id})
    } else setTopics(p=>[next,...p])
    setRoomFilter('all');setRoomSearch('');enter(next)
  }
  function isOwner(t:Topic){return online?!!authUser&&t.creatorId===authUser.id:topics.some(x=>x.id===t.id&&!x.id.includes('-today-'))}
  function openEdit(t:Topic){closePanels();setManageMsg('');setEditTopic(t);setEditTitle(t.title);setEditDescription(t.description);setEditDate(t.date||'');setEditCapacity(t.capacity);setEditArtist(t.artist||'');setEditFan(t.fanOccasion||FAN_THEMES[0])}
  async function saveEdit(){
    const t=editTopic;if(!t)return
    const titleNext=editTitle.trim();if(!titleNext){setManageMsg('모임 이름을 적어 주세요.');return}
    if(!Number.isInteger(editCapacity)||editCapacity<1||editCapacity>20){setManageMsg('정원은 1~20명 사이로 정해 주세요.');return}
    const patch={title:titleNext,description:editDescription.trim(),date:editDate,capacity:editCapacity,artist:editArtist.trim()||undefined,fanOccasion:editFan}
    if(online&&authUser&&t.creatorId){
      const err=await updateSharedTopic(t.id,patch)
      if(err){setManageMsg(err);return}
      setSharedTopics(p=>p.map(x=>x.id===t.id?{...x,...patch}:x))
    } else {
      setTopics(p=>p.map(x=>x.id===t.id?{...x,...patch}:x))
    }
    if(topic?.id===t.id)setTopic(prev=>prev?{...prev,...patch}:prev)
    setEditTopic(null);setManageMsg('');setNotice('모임 정보를 고쳤어요.')
  }
  async function deleteRoom(t:Topic){
    if(!window.confirm(`'${t.title}' 모임을 지울까요? 지운 모임은 되살릴 수 없어요.`))return
    if(online&&authUser&&t.creatorId){
      const ok=await removeSharedTopic(t.id)
      if(!ok){setManageMsg('모임을 지우지 못했어요. 잠시 후 다시 시도해 주세요.');return}
      setSharedTopics(p=>p.filter(x=>x.id!==t.id))
    } else setTopics(p=>p.filter(x=>x.id!==t.id))
    if(topic?.id===t.id){leave();setNotice('모임을 지웠어요.')}
    setEditTopic(null);setManageMsg('')
  }
  const kindOf=(t:Topic):TopicKind=>{if(t.kind)return t.kind;const w=SPACE_WORLD[t.space];const found=w?.topics.find(x=>x.title===t.title);if(found)return found.kind;const td=w?.today.find(x=>t.id.includes('-today-')&&x.title===t.title);return td?.kind??'talk'}
  const peer=(name:string,text:string,key:string,real?:Message)=>{const hidden=!!real?.spoiler&&!revealed.includes(real.id);return <div key={key} className="dd-peer-message"><div className="dd-peer-avatar" aria-hidden="true">{name.slice(0,1)}</div><div><span className="dd-peer-name">{name}{!real&&<em>시연</em>}</span><div className="dd-message-bubble dd-peer-bubble">{hidden?<button className="dd-spoiler" onClick={()=>setRevealed(v=>[...v,real!.id])}>스포일러 보기</button>:<p>{text}</p>}{!hidden&&real?.place&&safePlaceUrl(real.place.url)&&<div className="dd-place-card"><strong><MapPin size={14}/> {real.place.name}</strong><a href={safePlaceUrl(real.place.url)} target="_blank" rel="noopener noreferrer">장소 링크 열기</a></div>}</div>{real&&<div className="dd-peer-actions"><button type="button" aria-expanded={reportFor===real.id} onClick={()=>setReportFor(v=>v===real.id?null:real.id)}>신고</button>{real.userId&&<button type="button" onClick={()=>blockPeer(real)}>차단</button>}</div>}{real&&reportFor===real.id&&<div className="dd-chip-row" role="group" aria-label="신고 사유">{REPORT_REASONS.map(r=><button type="button" key={r.id} onClick={()=>reportPeer(real,r.id)}>{r.label}</button>)}</div>}</div></div>}
  const replyTimers=useRef<Set<number>>(new Set())
  useEffect(()=>()=>{for(const timer of replyTimers.current)window.clearTimeout(timer);replyTimers.current.clear()},[])
  function openToday(){if(!space||!world)return;const pick=todayPick(world.today);enter({id:space.id+'-today-'+seoulDate(),space:space.id,title:pick.title,description:pick.question,date:'',capacity:20,age:'성인 전체',kind:pick.kind})}
  useEffect(()=>{
    if(!space||chatCollapsed)return
    const keep='.dd3-chat,.dd-world-nav,.dd-quick-links,.dd-room-actions,.dd-camera-control,.dd-world-pop,.dd3-title,.dd3-access-menu,.dd-app-panel,.dd-host-chat,.dd-home-actions,.dd-map-views,.dd3-story,.dd-bell-shortcut,.ddg-stage,.ddg-float-launch'
    const onDown=(e:PointerEvent)=>{const t=e.target as Element|null;if(t&&!t.closest(keep)){if(space?.id==='home'&&t.closest('.dd3-canvas'))return;(window as unknown as {__ddSwallowTap:number}).__ddSwallowTap=Date.now();setChatCollapsed(true)}}
    document.addEventListener('pointerdown',onDown,true)
    return()=>document.removeEventListener('pointerdown',onDown,true)
  },[space,chatCollapsed])
  useEffect(()=>{const esc=(e:KeyboardEvent)=>{if(e.key!=='Escape')return;if(memoriesOpen||cornerId||wardrobe||yearbook||mapOpen||mailOpen||toolsOpen)closePanels();else if(!chatCollapsed)setChatCollapsed(true)};document.addEventListener('keydown',esc);return()=>document.removeEventListener('keydown',esc)},[memoriesOpen,cornerId,wardrobe,yearbook,mapOpen,mailOpen,toolsOpen,chatCollapsed])
  useEffect(()=>{if(!chatCollapsed&&messageLog.current&&nearBottom.current)messageLog.current.scrollTop=messageLog.current.scrollHeight},[chatCollapsed,topic?.id,messages]);
  function send() {
    if (!topic || (!draft.trim() && !picture && !placeName.trim())) return
    const safe=checkChatText(`${draft} ${placeName}`)
    if(!safe.ok){setNotice(safe.reason);return}
    const url=safePlaceUrl(placeUrl)
    if((placeName.trim()||placeUrl.trim())&&(!placeName.trim()||!url)){setNotice('장소 이름과 올바른 http 또는 https 링크를 입력해 주세요.');return}
    const place=placeName.trim()?{name:placeName.trim().slice(0,100),url}:undefined
    if(online&&remote){
      if(picture){setNotice('서버 채팅에는 사진을 올릴 수 없어요. 사진은 후기 사진첩에 저장해 주세요.');return}
      if(sending)return
      const tid=topic.id,text=(draft.trim()||place?.name||'').slice(0,1000)
      setSending(true);setNotice('')
      remote.send({topicId:tid,text,by:profile.nickname,place,spoiler}).then(saved=>{nearBottom.current=true;addRemote(tid,toMsg(saved));presence.bubble(text);delete drafts.current[tid];setDraft('');clearPlace();setSpoiler(false);setEmojiOpen(false);setAttachOpen(false);setQuickOpen(false);composer.current?.focus()}).catch((e:unknown)=>setNotice(e instanceof Error?e.message:'메시지를 보내지 못했어요.')).finally(()=>setSending(false))
      return
    }
    nearBottom.current=true;
    const item = {id: uuid(), text: draft.trim().slice(0,1000), image: picture || undefined, place, spoiler, at: new Date().toISOString()}
    setMessages(prev => ({...prev, [topic.id]: [...(prev[topic.id] ?? []), item].slice(-50)}))
    delete drafts.current[topic.id];setDraft(''); setPicture('');clearPlace();setSpoiler(false);setNotice('');setEmojiOpen(false);composer.current?.focus()
    setAttachOpen(false);setQuickOpen(false);if(!practice||topic.space==='games')return;
    const tid=topic.id,sid=topic.space,kind=kindOf(topic),serial=(messages[tid]??[]).filter(m=>!m.by).length
    const timer=window.setTimeout(()=>{replyTimers.current.delete(timer);const r=demoReply(sid,kind,serial);setMessages(prev=>({...prev,[tid]:[...(prev[tid]??[]),{id:uuid(),text:r.text,by:r.by,at:new Date().toISOString()}].slice(-50)}))},1100);replyTimers.current.add(timer)
  }
  return <section id="rooms" className="dd-world-app" data-presence={presence.connected?'on':'off'} data-peers={String(peers.length)} data-room={topic?.id??''}>
      <nav className="dd-world-nav" aria-label="딩동 메뉴">{[{I:PartyPopper,n:'이벤트',f:()=>showPanel('events')},{I:CalendarDays,n:'일정',f:()=>externalMenu('calendar')},{I:Map,n:'지도',f:()=>showPanel('map')},{I:Home,n:'내 집',f:()=>visit('home')},{I:Settings,n:'설정',f:()=>toggleTools(!toolsOpen)}].map(({I,n,f})=><button key={n} aria-label={n} onClick={f}><I size={22}/><span>{n}</span></button>)}</nav>
      <div className="dd-quick-links"><button aria-label="공지" onClick={()=>externalMenu('etiquette')}><Bell size={20}/></button><button aria-label="포토월" onClick={()=>externalMenu('wall')}><Camera size={20}/></button></div>
      {homeFeedback&&<div role="status" className="dd-save-toast">{homeFeedback}</div>}
      {space?.id==='games'&&access(space.id)==='open'&&!game&&<button type="button" className="ddg-float-launch" aria-label="게임 탁자 열기" onClick={()=>openGame()}><span aria-hidden="true">🎲</span><small>게임 탁자<em>{GAMES.length}가지</em></small></button>}
      {space?.id==='home'&&<div className="dd-home-actions"><button onClick={()=>{closePanels();setChatCollapsed(false)}}><Paintbrush size={19}/>집 꾸미기 열기</button><button onClick={()=>showPanel('wardrobe')}><Shirt size={19}/>옷장</button><button onClick={onEditProfile}><UserRound size={19}/>프로필</button><button onClick={()=>showPanel('mail')}><Mail size={19}/>우편함</button></div>}
      {(memoriesOpen||corner||wardrobe||yearbook||mapOpen||mailOpen)&&<div aria-hidden="true" data-testid="dd-pop-backdrop" onClick={closePanels} style={{position:'fixed',inset:0,zIndex:22,background:'#211a4333'}}/>}
      {corner&&<div className="dd-world-pop" role="dialog" aria-label={corner.title}>
        <div className="dd-pop-title"><strong>{corner.title}</strong><button className="dd3-btn" onClick={()=>setCornerId(null)}>닫기</button></div>
        <p>{corner.description}</p>
        <ul className="space-y-2">
          {seedTopics.filter(topic=>corner.topics.some(title=>title===topic.title)).map(topic=><li key={topic.id}>
            <button className="dd3-btn" onClick={()=>{setCornerId(null);setChatCollapsed(false);enter(topic)}}>{topic.title}</button>
          </li>)}
        </ul>
      </div>}
      {wardrobe&&<div className="dd-world-pop dd-world-wardrobe" role="dialog" aria-label="나의 옷장"><div className="dd-pop-title"><strong>나의 작은 옷장</strong><button className="dd3-btn" onClick={()=>setWardrobe(false)}>옷장 닫기</button></div><AvatarWardrobe avatar={profile.avatar} look={look} onChange={v=>{setLook(v);saveJSON('dd.avatar.look.v1',v)}} onDone={()=>setWardrobe(false)}/></div>}
      {yearbook&&<div className="dd-world-pop" role="dialog" aria-label="연간 이벤트"><div className="dd-pop-title"><strong>딩동의 12개월 파티</strong><button className="dd3-btn" onClick={()=>setYearbook(false)}>닫기</button></div><p>월별 이벤트 기획 · 실제 날짜는 일정에서 확인</p><DailyFestival onVisit={id=>visit(id,true)} onCalendar={()=>externalMenu('calendar')}/><div className="dd-event-grid">{MONTHLY_IDEAS.map((idea,i)=><button key={i} onClick={()=>i===11?visit('season'):externalMenu('calendar')} style={{'--event-color':['#d6c5f8','#ffc8dc','#c6efdb','#f6cde1','#ffe2a6','#c5d8f6','#bde9ed','#e3caf5','#ffe0aa','#d8c2f1','#cee8d9','#f7c4d2'][i]} as React.CSSProperties}><FestivalArt month={i}/><strong>{i+1}월</strong><small>{idea}</small><span>{i===11?'시즌홀 입장':'일정 보기'}</span></button>)}</div></div>}
      {mapOpen&&<div className="dd-world-pop" role="dialog" aria-label="마을 지도"><div className="dd-pop-title"><strong>우리 동네 지도</strong><button className="dd3-btn" onClick={()=>setMapOpen(false)}>닫기</button></div><p>가게를 선택하면 바로 입장합니다. 잠긴 공간은 내부 구경만 가능합니다.</p><div className="dd-map-grid">{SPACES.filter(s=>!onlyFavorites||favorites.includes(s.id)).map(s=><button key={s.id} onClick={()=>visit(s.id,true,access(s.id)==='locked')}><span>{s.icon}</span><strong>{s.name}</strong><small>{access(s.id)==='open'?'입장':access(s.id)==='locked'?'구경만 가능':'준비 중'}</small></button>)}</div>{onlyFavorites&&!favorites.length&&<p>즐겨찾는 공간이 아직 없어요.</p>}<button className="dd3-btn" aria-pressed={onlyFavorites} onClick={()=>setOnlyFavorites(v=>!v)}>{onlyFavorites?'전체 목적지':'즐겨찾기 목적지'}</button></div>}
      {memoriesOpen&&space?.id==='home'&&<div className="dd-world-pop" role="dialog" aria-label="사진첩과 참여 기록">
        <div className="dd-pop-title"><strong>사진첩과 참여 기록</strong><button className="dd3-btn" onClick={()=>setMemoriesOpen(false)}>닫기</button></div>
        <MemoryAlbum entries={memories} onDelete={deleteMemory}/>
        <section aria-label="나의 모임 기록" className="space-y-2">
          <h3 className="serif text-lg">나의 모임 기록</h3>
          <p role="status">{historyStatus}</p>
          {history.length===0?<p>저장한 모임이 없어요.</p>:history.map(entry=><div className="card flex flex-wrap items-center justify-between gap-2 p-3 text-sm" key={entry.id}>
            <span>{entry.title} · {VISIBILITY[entry.visibility]}</span>
            <button type="button" className="btn btn-outline" aria-label={entry.title+' 참여 기록 삭제'} onClick={()=>{
              const next=history.filter(record=>record.id!==entry.id)
              if(!saveJSON('dd.history.v1',next)){setHistoryStatus('기록을 삭제하지 못했어요. 다시 시도해 주세요.');return}
              setHistory(next)
              setHistoryStatus('참여 기록을 삭제했어요.')
            }}>삭제</button>
          </div>)}
        </section>
      </div>}
      {mailOpen&&<div className="dd-world-pop" role="dialog" aria-label="나의 우편함"><div className="dd-pop-title"><strong>나의 우편함</strong><button className="dd3-btn" onClick={()=>setMailOpen(false)}>닫기</button></div><div className="dd-mail-empty"><Mail size={42}/><h3>친구의 편지가 도착하는 곳</h3><p>현재는 로컬 체험입니다. 친구 방문·편지 송수신은 실제 계정 및 권한 연결 후 제공합니다.</p></div></div>}
          {fullRoom&&<div className="dd-world-pop dd-room-full-dialog" role="dialog" aria-label="모임 정원 안내">
            <div className="dd-pop-title"><strong>정원이 가득 찼어요</strong><button className="dd3-btn" onClick={()=>setFullRoom(null)}>닫기</button></div>
            <p><strong>{fullRoom.title}</strong> · 지금 {roomCount(fullRoom)}명 / 정원 {fullRoom.capacity}명</p>
            <p>같은 주제로 다음 호실을 열면 대화가 이어집니다. 새 호실로 바로 들어갑니다.</p>
            <div className="dd-cal-actions"><button type="button" onClick={()=>void openNextRoom(fullRoom)}>{nextRoomTitle(fullRoom)} 열고 입장 →</button><button type="button" onClick={()=>setFullRoom(null)}>다른 모임 보기</button></div>
          </div>}
          {editTopic&&<div className="dd-world-pop dd-edit-dialog" role="dialog" aria-label="내 모임 관리">
            <div className="dd-pop-title"><strong>내 모임 관리</strong><button className="dd3-btn" onClick={()=>setEditTopic(null)}>닫기</button></div>
            <p className="dd-edit-sub">{editTopic.title}</p>
            <div className="dd-edit-body">
              <label className="dd-field"><span>모임 이름</span><input aria-label="모임 이름 수정" maxLength={60} value={editTitle} onChange={e=>setEditTitle(e.target.value)}/></label>
              <label className="dd-field"><span>소개</span><textarea aria-label="모임 소개 수정" maxLength={300} value={editDescription} onChange={e=>setEditDescription(e.target.value)}/></label>
              {editTopic.space==='fandom'&&<div className="dd-fan-fields"><label className="dd-field"><span>아티스트 이름</span><input aria-label="아티스트 이름 수정" maxLength={40} value={editArtist} onChange={e=>setEditArtist(e.target.value)}/></label><label className="dd-field"><span>테마</span><select aria-label="덕질 테마 수정" value={editFan} onChange={e=>setEditFan(e.target.value)}>{FAN_THEMES.map(v=><option key={v} value={v}>{v}</option>)}</select></label></div>}
              <label className="dd-field"><span>일정 (선택)</span><input type="datetime-local" aria-label="모임 일정 수정" value={editDate} onChange={e=>setEditDate(e.target.value)}/></label>
              <label className="dd-field"><span>정원</span><input type="number" min={1} max={20} aria-label="모임 정원 수정" value={editCapacity} onChange={e=>setEditCapacity(Number(e.target.value))}/></label>
              {manageMsg&&<p role="alert" className="dd-create-err">{manageMsg}</p>}
              <footer className="dd-create-foot"><button type="button" className="dd-x" onClick={()=>void deleteRoom(editTopic)}>모임 삭제</button><button type="button" className="dd-go" onClick={()=>void saveEdit()}>수정 저장</button></footer>
            </div>
          </div>}
      <div className={'dd3-layout'+(space?' dd3-with-chat':'')+(space&&space.id!=='home'&&!chatCollapsed?' dd-chat-open':'')+(chatFull&&!chatCollapsed&&space?.id!=='home'?' dd-chat-full':'')}>
        <Mansion3D homeEditing={space?.id==='home'&&!chatCollapsed} homeSelected={space?.id==='home'&&!chatCollapsed?selectedFurniture:null} onMenu={id=>{if(id==='games-hub'||id==='games-table'){openGame();return}const key=id.slice(7);if(id.startsWith('corner-')&&Object.prototype.hasOwnProperty.call(CORNERS,key)){openCorner(key as CornerId);return}if(id.startsWith('home-select:')){setSelectedFurniture(id.slice(12));return}if(id.startsWith('home-move:')){const [mx,mz]=id.slice(10).split(',').map(Number);if(Number.isFinite(mx)&&Number.isFinite(mz))setHomeMove({x:mx,z:mz,nonce:Date.now()});return}if(id==='home-wardrobe')showPanel('wardrobe');else if(id==='home-profile')onEditProfile();else if(id==='home-mailbox')showPanel('mail');else if(id==='home-decor'){closePanels();setChatCollapsed(false)}else externalMenu(id)}} profile={profile} look={look} home={home} active={space} request={request} toolsOpen={toolsOpen} onToolsChange={toggleTools} onEnter={openSpace} onLeave={()=>{leave();setSpace(null)}} onCapture={image=>{if(!topic){setNotice('모임에 입장한 뒤 촬영해 주세요.');return}cancelPhotoRequest();setPicture(image);setChatCollapsed(false);setNotice('사진 첨부 완료 · 전송을 누르면 로컬 채팅에 저장됩니다.')}} paused={Boolean(game)} peers={peers} peerPositions={presence.positions} poseRef={poseRef} bubble={peerBubble} favorites={favorites} onlyFavorites={onlyFavorites} onFavorite={id=>setFavorites(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])}/>
        {space&&access(space.id)==='open'&&<aside role="region" aria-label={space.name} className={"dd3-chat dd-chat-reveal"+(space.id!=="home"&&!chatCollapsed?" dd-messenger":space.id==="home"&&!chatCollapsed?" dd-home-panel"+(homeExpanded?" dd-home-expanded":""):"")}>
      <div className="dd-chat-topbar"><button type="button" className="dd3-collapse" aria-expanded={!chatCollapsed} onClick={()=>{if(chatCollapsed)closePanels();setChatCollapsed(v=>!v)}}>{space.id!=='home'&&<MessageCircle size={18}/>}<span>{space.id==='home'?(chatCollapsed?'집 꾸미기':'집 꾸미기 닫기'):(chatCollapsed?'채팅 펼치기':'채팅 접기')}</span>{!chatCollapsed&&<ChevronDown size={16}/>}</button>{space.id==='home'&&!chatCollapsed&&<button type="button" className="dd-chat-expand" aria-label={homeExpanded?'방 미리보기':'꾸미기 화면 크게'} onClick={()=>setHomeExpanded(v=>!v)}>{homeExpanded?<Minimize2 size={18}/>:<Maximize2 size={18}/>}</button>}{space.id!=='plaza'&&!chatCollapsed&&<button type="button" className="dd-chat-expand" aria-label="채팅에서 광장으로 돌아가기" title="광장으로 돌아가기" onClick={()=>visit('return-hub')}><Map size={18}/></button>}{space.id!=='home'&&!chatCollapsed&&<button className="dd-chat-expand" aria-label={chatFull?'채팅 기본 보기':'채팅 전체 화면'} onClick={()=>setChatFull(v=>!v)}>{chatFull?<Minimize2 size={18}/>:<Maximize2 size={18}/>}</button>}</div>
      <div className={space.id!=='home'&&topic?'dd-chat-body':space.id!=='home'?'dd-lobby-scroll p-4 sm:p-5':'p-4 sm:p-5'} hidden={chatCollapsed}>
        <div className="dd-room-heading mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="serif text-2xl">{space.name}</h2><p className="text-xs" style={{color:'var(--muted)'}}>{space.subtitle}</p></div><button type="button" className="btn btn-outline btn-sm" onClick={()=>{leave();setSpace(null)}}>복도로 나가기</button></div>
        {!topic&&space.id!=='home'&&RESIDENTS[space.id]&&<div className="dd3-npc"><div className="dd-resident-name"><strong>{RESIDENTS[space.id].name}</strong><small>마을 안내 캐릭터 · 시연</small></div><p className="dd-resident-bubble">{RESIDENTS[space.id].greeting}</p></div>}
        {autoChat && <p role="status" className="text-sm py-3">공간에 도착했어요. 대화창을 준비합니다…</p>}
        {space.id==='home'&&world&&<div className="dd-lobby-story"><strong>{PLACE_STORIES.home.title}</strong><p>{world.story}</p></div>}
        {space.id==='season' && !topic && <button className="btn btn-outline mb-3" onClick={onParty}>크리스마스 파티 일정 보기</button>}
        {space.id==='home' ? <div className="space-y-4">
          <HomeEditor home={home} selected={selectedFurniture} onSelect={setSelectedFurniture} onChange={updateHome} onDone={doneHome} onClose={()=>setChatCollapsed(true)} moveTo={homeMove}/><details className="dd-home-profile"><summary>미니홈피와 프로필</summary><MiniHomeJournal/><button className="btn btn-outline" onClick={()=>{leave();setSpace(null);onEditProfile()}}>캐릭터·닉네임·취향 수정</button><label className="block text-sm">미니홈피 소개<textarea className={FIELD} maxLength={160} value={home.intro} onChange={e=>setHome(p=>({...p,intro:e.target.value}))}/></label></details>
          <label className="text-sm">미니홈피 공개 범위<select className={FIELD} value={home.visibility} onChange={e=>setHome(p=>({...p,visibility:e.target.value as Visibility}))}>{Object.entries(VISIBILITY).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
          <p className="text-xs" style={{color:'var(--muted)'}}>벽지·가구·반려동물은 내 3D 집에 적용되고 브라우저에 자동 저장됩니다. 공개 범위는 설정만 저장되며 실제 친구 방문·편지는 계정 연결 전 제공되지 않습니다.</p>
          <button type="button" className="btn btn-outline" onClick={()=>showPanel('memories')}>사진첩·참여 기록</button>
        </div> : autoChat ? null : topic ? <div className="dd-messenger-main">
          <header className="dd-message-header" data-topic-id={topic.id}><button className="dd-chat-icon" aria-label="모임 목록" onClick={leave}><ChevronLeft size={22}/></button><div><h3>{topic.title}</h3><p>{topic.artist&&<>{topic.artist}{topic.fanOccasion?' · '+topic.fanOccasion:''} · </>}{topic.workTitle&&<>{topic.workTitle} · </>}{space.name}{topic.fanOccasion&&!topic.artist&&' · '+topic.fanOccasion}{topic.date&&<> · <span className="dd-user-schedule">이용자 등록 일정</span></>} <span className="dd-header-dot"/> {online?(presence.connected?'실시간 대화':'연결 중'):'로컬 연습'}</p><span className={`dd-topic-meter${roomIsFull(topic)?' is-full':''}`} style={{['--p' as string]:Math.min(100,Math.round((roomCount(topic)/Math.max(1,topic.capacity))*100))+'%'}} aria-label={`참여 ${roomCount(topic)}명, 정원 ${topic.capacity}명`}><em>{roomCount(topic)}/{topic.capacity}명{practice?' · 시연':''}</em></span></div><button className="dd-chat-icon" aria-label="채팅 설정" aria-expanded={chatExtras} onClick={()=>setChatExtras(v=>!v)}><MoreHorizontal size={22}/></button></header>
          {isOwner(topic)&&<div className="dd-owner-bar" role="group" aria-label="내 모임 관리"><span>내가 연 모임 · 지금 {roomCount(topic)}명 / 정원 {topic.capacity}명</span><button type="button" onClick={()=>openEdit(topic)}>모임 수정</button><button type="button" onClick={()=>void deleteRoom(topic)}>모임 삭제</button></div>}
          {topic.space==='games'&&<details className="ddg-tray" key={topic.id}><summary><span aria-hidden="true">🎲</span> 게임 탁자<small>{GAMES.length}가지 · 눌러서 펼치기</small></summary><GameCorner highlight={gameForTopic(topic.title)} onOpen={id=>openGame(id)}/></details>}
          {chatExtras&&<div className="dd-chat-settings"><p>{topic.description}</p>{topic.space==='games'?<small>게임 질문과 정답은 위의 미니게임에서 입력해 주세요.</small>:<><label><input type="checkbox" checked={practice} onChange={e=>setPractice(e.target.checked)}/> 가상 주민 대화 연습</label><small>켜면 시연용 주민이 응답해요.{online?'':' 실제 이용자와의 대화는 로그인하면 연결돼요.'}</small></>}<label><input type="checkbox" checked={saveHistory} onChange={e=>setSaveHistory(e.target.checked)}/> 나갈 때 참여 기록 저장</label>{saveHistory&&<select className={FIELD} aria-label="참여 기록 공개 범위" value={visibility} onChange={e=>setVisibility(e.target.value as Visibility)}>{Object.entries(VISIBILITY).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>}<details className="dd-memory-details"><summary>사진첩·후기</summary><MemoryComposer key={topic.id} photos={(messages[topic.id]??[]).filter(m=>!m.by&&m.image&&(!m.spoiler||revealed.includes(m.id))).map(m=>({id:m.id,image:m.image!}))} onSave={saveMemory}/><MemoryAlbum key={topic.id} entries={memories} topicId={topic.id} onDelete={deleteMemory}/></details><button className="dd3-btn" onClick={leave}>모임 나가기</button>{authUser&&<button className="dd3-btn" onClick={()=>void signOut()}>로그아웃</button>}<AdminReports signedIn={!!authUser}/></div>}
          {roomIsFull(topic)&&<div className="dd-room-full" role="status"><div><strong>정원 {topic.capacity}명이 가득 찼어요</strong><span>같은 주제로 새 호실을 열면 대화가 이어집니다.</span></div><button type="button" onClick={()=>openNextRoom(topic)}>{nextRoomTitle(topic)} 열기 →</button></div>}
          <div ref={messageLog} className="dd-message-log" role="log" aria-label="대화 기록" tabIndex={0} onScroll={e=>{const el=e.currentTarget;nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<48}}><div className="dd-chat-system"><Info size={14}/><span>{online?(connState==='error'?'대화를 불러오지 못했어요. 잠시 후 다시 열어 주세요.':'실제 이용자와 연결됐어요. 연락처·외부 연락 요청은 보낼 수 없어요.'):'아직 실제 이용자는 연결되지 않았어요.'}</span></div>{serverEnabled&&!online&&<AuthCard signedIn={!!authUser} sync={sync} onEditProfile={onEditProfile}/>}{practice&&seedFor(topic).map((m,i)=>peer(whoName(m.who),m.text,'seed'+i))}{!practice&&!shown(topic.id).length&&<div className="dd-chat-welcome"><span className="dd-chat-welcome-icon">{space.icon}</span><strong>이야기의 시작</strong><p>{topic.description||'첫 이야기를 남겨 보세요.'}</p>{topic.space==='games'?<button onClick={()=>openGame(gameForTopic(topic.title)??'balance')}>게임 탁자 열기</button>:<button onClick={()=>setPractice(true)}>주민과 대화 연습</button>}</div>}{shown(topic.id).map(m=>!isMine(m)?peer(m.by??'이웃',m.text,m.id,online?m:undefined):<div key={m.id} className="dd-own-message"><div className="dd-message-meta dd-own-label"><span>나</span></div><div className="dd-message-bubble">{m.spoiler&&!revealed.includes(m.id)?<button className="dd-spoiler" onClick={()=>setRevealed(v=>[...v,m.id])}>스포일러 보기</button>:<>{m.spoiler&&<button className="dd-spoiler" onClick={()=>setRevealed(v=>v.filter(id=>id!==m.id))}>다시 숨기기</button>}{m.text&&<p>{m.text}</p>}{m.image&&<img src={m.image} alt="내가 올린 사진"/>}</>}{(!m.spoiler||revealed.includes(m.id))&&m.place&&safePlaceUrl(m.place.url)&&<div className="dd-place-card"><strong><MapPin size={14}/> {m.place.name}</strong><a href={safePlaceUrl(m.place.url)} target="_blank" rel="noopener noreferrer">장소 링크 열기</a><button type="button" className="btn btn-ghost btn-sm" onClick={()=>{const place=m.place!;setSavedPlaces(p=>p.some(x=>x.url===place.url&&x.name===place.name)?p:[place,...p].slice(0,100))}}>장소 저장</button></div>}</div><div className="dd-message-time"><time dateTime={m.at}>{new Date(m.at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</time><button onClick={()=>{if(online){void removeMessage(m.id).then(ok=>{if(ok)setRemoteMsgs(p=>({...p,[topic.id]:(p[topic.id]??[]).filter(x=>x.id!==m.id)}));else setNotice('메시지를 지우지 못했어요.')})}else setMessages(p=>({...p,[topic.id]:(p[topic.id]??[]).filter(x=>x.id!==m.id)}))}}>삭제</button></div></div>)}</div>
          <div className="dd-chat-compose" aria-label="메시지 작성 영역">
          {picture&&<div className="dd-chat-attachment"><img src={picture} alt="첨부 미리보기"/><button className="dd3-btn" onClick={()=>{cancelPhotoRequest();setPicture('')}}>첨부 제거</button></div>}
          {showPlace&&<div className="dd-chat-place"><label>장소 이름<input aria-label="장소 이름" className={FIELD} value={placeName} maxLength={100} onChange={e=>setPlaceName(e.target.value)}/></label><label>장소 링크<input aria-label="장소 링크" className={FIELD} value={placeUrl} maxLength={2000} onChange={e=>setPlaceUrl(e.target.value)}/></label><small>운영 여부 미검증 · 로컬 추천</small></div>}
          {emojiOpen&&<div className="dd-emoji-tray">{['😊','💛','🎄','☕','👏','🎉','✨','🐾','❤️','😂','🙌','🌷'].map(e=><button key={e} aria-label={e} onClick={()=>setDraft(p=>(p+e).slice(0,1000))}>{e}</button>)}</div>}
          {notice&&<p role="status" className="dd-chat-notice">{notice}</p>}
          {quickOpen&&<div className="dd-chip-row" role="group" aria-label="빠른 문장">{KIND_UI[kindOf(topic)].chips.map(c=><button type="button" key={c.label} onClick={()=>{setDraft(p=>((p?p+(p.endsWith(' ')?'':' '):'')+c.text).slice(0,1000));composer.current?.focus()}}>{c.label}</button>)}</div>}
          {(topic.space==='cinema'||kindOf(topic)==='review'||spoiler)&&<label className="dd-spoiler-option"><input type="checkbox" checked={spoiler} onChange={e=>setSpoiler(e.target.checked)}/> 스포일러 숨김</label>}
          <form className="dd-message-form" onSubmit={e=>{e.preventDefault();send()}}><button type="button" className="dd-attach-plus" aria-label="첨부 메뉴" aria-expanded={attachOpen} onClick={()=>{setAttachOpen(v=>!v);setEmojiOpen(false)}}><Plus size={23}/></button><input ref={composer} aria-label="메시지" maxLength={1000} value={draft} placeholder={KIND_UI[kindOf(topic)].placeholder} onChange={e=>setDraft(e.target.value)}/><button type="button" className="dd-inline-emoji" aria-label="이모티콘" aria-expanded={emojiOpen} onClick={()=>{setEmojiOpen(v=>!v);setAttachOpen(false)}}><Smile size={22}/></button><button className="dd-send" aria-label="전송" disabled={loading||sending||(!draft.trim()&&!picture&&!placeName.trim())}><Send size={19}/></button></form>
          <div className="dd-compose-tools" hidden={!attachOpen}><button className="dd-chat-icon" aria-label="사진 첨부" title="사진 첨부" onClick={()=>fileInput.current?.click()}><ImagePlus size={21}/><small>사진</small></button><input ref={fileInput} hidden aria-label="사진 첨부 파일" type="file" accept="image/jpeg,image/png,image/webp" disabled={loading} className="block max-w-full text-xs" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void attachPhoto(file)}}/><button className="dd-chat-icon" aria-label="빠른 문장" aria-expanded={quickOpen} onClick={()=>setQuickOpen(v=>!v)}><MessageCircle size={21}/><small>빠른 문장</small></button><button className="dd-chat-icon" aria-label={showPlace?'장소 추천 입력 접기':'장소 추천 첨부'} title="장소 추천" onClick={()=>setShowPlace(v=>!v)}><MapPin size={21}/><small>장소</small></button><details className="dd-chat-saved"><summary>저장한 장소 ({savedPlaces.length})</summary>{savedPlaces.filter(p=>safePlaceUrl(p.url)).map(p=><div key={p.name+p.url}><a href={safePlaceUrl(p.url)} target="_blank" rel="noopener noreferrer">{p.name}</a><button type="button" className="btn btn-ghost btn-sm" onClick={()=>setSavedPlaces(list=>list.filter(v=>v.url!==p.url||v.name!==p.name))}>삭제</button></div>)}</details></div>
          </div>
        </div> : <div className="space-y-4">
          {space.id==='games'&&access(space.id)==='open'&&<>
            <button type="button" className="ddg-launch" onClick={()=>openGame()}><span aria-hidden="true">🎲</span> 게임 탁자 열기 <small>· {GAMES.length}가지</small></button>
            <GameCorner onOpen={id=>openGame(id)}/>
          </>}
          {space.id==='single'&&<p className="text-xs">성인 인증 전이므로 실제 만남이나 DM 연결은 제공하지 않습니다.</p>}
          {world&&<div className="dd-lobby-story"><strong>{PLACE_STORIES[space.id]?.title??space.name}</strong><p>{world.story}</p><details><summary>이 공간의 매너</summary><ul>{world.rules.map(r=><li key={r}>{r}</li>)}</ul></details></div>}
          {world&&(()=>{const pick=todayPick(world.today);return <button type="button" className="dd-today-card" onClick={openToday}><small>TODAY · 오늘의 주제</small><strong>{pick.title}</strong><span>{pick.question}</span><em>이 주제로 방 열기 →</em></button>})()}
          {online&&<p className="dd-live-strip" role="status"><span className="dd-live-dot" aria-hidden="true"/>{presence.connected?`실시간 접속 ${peers.length+1}명`:'실시간 연결 중…'}<small>같은 공간에 있는 사람의 캐릭터와 말풍선이 3D 화면에 함께 보여요.</small></p>}
          {space.id==='fandom'&&<div className="dd-fan-banner"><span aria-hidden="true">🎧</span><div><strong>좋아하는 아티스트로 팬 모임 열기</strong><p>아티스트 이름을 적고 9가지 유형(팬 모여라·컴백 파티·최애 생일 파티·콘서트 후기·뮤직비디오 감상회·포토카드 자랑·입덕 이야기·데뷔 기념일·자유 수다) 중 하나를 고르면 그 이름으로 모임이 열립니다. 정원 20명이 차면 다음 호실을 안내합니다.</p></div><button type="button" onClick={()=>{setShowCreate(true);setCreateKind('share')}}>아티스트 입력하기</button></div>}
          <div className="dd-room-section-head"><h3 className="serif text-lg">이 공간의 모임</h3><button type="button" className={showCreate?'dd-room-new is-open':'dd-room-new'} onClick={()=>setShowCreate(v=>!v)}>{showCreate?'닫기':<><Plus size={16}/> 모임 열기</>}</button></div>
          <div className="dd-room-discovery"><div className="dd-search-field"><Search size={18}/><input aria-label="모임 검색" placeholder="작품명·가수·모임 제목 검색" value={roomSearch} onChange={e=>setRoomSearch(e.target.value)}/></div><div className="dd-room-filters" role="group" aria-label="모임 유형">{(['all','saved',...Object.keys(KIND_UI)] as ('all'|'saved'|TopicKind)[]).map(k=><button key={k} aria-pressed={roomFilter===k} onClick={()=>setRoomFilter(k)}>{k==='all'?'전체':k==='saved'?'저장한 방':KIND_UI[k].label}</button>)}</div></div>
          {showCreate&&<form className="dd-create-meeting" aria-label="모임 개설" onSubmit={e=>{e.preventDefault();const artistNext=artist.trim();const titleNext=title.trim()||(space.id==='fandom'&&artistNext?fanTitle(artistNext,fanOccasion):'');if(!titleNext.trim()||!Number.isInteger(capacity)||capacity<1||capacity>20)return;const base=titleNext.replace(/\s*\d+호실$/,'').trim();const sameName=allSpaceTopics().filter(t=>t.space===space.id&&roomBaseTitle(t)===base&&!t.id.includes('-today-')).length;const finalTitle=sameName?`${base} ${Math.max(2,sameName+1)}호실`:titleNext.trim();const next:Topic={id:uuid(),space:space.id,creatorId:online&&authUser?authUser.id:undefined,title:finalTitle,description:description.trim()||(space.id==='fandom'&&artistNext?`${artistNext} · ${fanOccasion} 이야기를 나눠요.`:''),date,capacity,age,kind:createKind,workTitle:space.id==='cinema'?workTitle.trim()||undefined:undefined,artist:space.id==='fandom'?artistNext||undefined:undefined,fanOccasion:space.id==='fandom'?fanOccasion:undefined};const reset=()=>{setCreateErr('');setRoomFilter('all');setRoomSearch('');setTitle('');setWorkTitle('');setArtist('');setFanOccasion(FAN_THEMES[0]);setDescription('');setDate('');setCapacity(20);setShowCreate(false)};if(online&&authUser){void createSharedTopic({id:next.id,space:next.space,title:next.title,description:next.description,date:next.date,capacity:next.capacity,age:next.age,kind:createKind,workTitle:next.workTitle,artist:next.artist,fanOccasion:next.fanOccasion}).then(err=>{if(err){setCreateErr(err);return}addShared({...next,creatorId:authUser.id});reset();enter(next)});return}setTopics(p=>[next,...p]);reset();enter(next)}}>
            <header className="dd-create-head"><span className="dd-create-lamp" aria-hidden="true"/><div><small className="dd-create-kicker">NEW ROOM · {space.name}</small><h4>새 모임 열기</h4><p>{online?'모든 이용자에게 공개 · ':''}정원이 차면 같은 주제로 다음 호실을 열 수 있어요.</p></div><button type="button" className="dd-create-x" aria-label="모임 만들기 닫기" onClick={()=>setShowCreate(false)}>×</button></header>
            <div className="dd-create-body">
              <label className="dd-field"><span>모임 유형</span><select aria-label="새 모임 유형" value={createKind} onChange={e=>setCreateKind(e.target.value as TopicKind)}>{Object.entries(KIND_UI).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></label>
              {space.id==='cinema'&&<label className="dd-field"><span>작품명 (선택)</span><input maxLength={80} value={workTitle} onChange={e=>setWorkTitle(e.target.value)}/></label>}
              {space.id==='fandom'&&<div className="dd-fan-fields">
                <label className="dd-field"><span>아티스트 이름</span><input aria-label="아티스트 이름" placeholder="예: ○○ (자유롭게 입력)" maxLength={40} value={artist} onChange={e=>setArtist(e.target.value)}/></label>
                <label className="dd-field"><span>테마</span><select aria-label="덕질 테마" value={fanOccasion} onChange={e=>setFanOccasion(e.target.value)}>{FAN_THEMES.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
                <p className="dd-fan-hint">이름을 비우면 모임 이름만으로 방을 열 수 있어요. 아티스트를 적으면 제목을 비워도 <strong>{fanTitle(artist.trim()||'○○',fanOccasion)||'○○ 팬 모여라'}</strong>로 만들어집니다.</p>
                <div className="dd-fan-chips" role="group" aria-label="정본 덕질 활동">{(((CONTENT_MASTER as { fandom?: { groups?: { category: string; items: string[] }[] } }).fandom?.groups) ?? []).flatMap(g => g.items.map(item => ({ category: g.category, item }))).map(({ category, item }) => <button type="button" key={category + item} aria-label={category + ' ' + item} onClick={() => setTitle(item)}>{item}</button>)}</div>
              </div>}
              <label className="dd-field"><span>모임 이름</span><input autoFocus placeholder={space.id==='fandom'?'예: ○○ 팬 모여라':'예: 금요일 저녁 영화 수다'} maxLength={60} value={title} onChange={e=>setTitle(e.target.value)}/></label>
              <label className="dd-field"><span>어떤 이야기를 나눌까요</span><textarea placeholder="함께 나누고 싶은 이야기를 적어 주세요." maxLength={300} value={description} onChange={e=>setDescription(e.target.value)}/></label>
              <label className="dd-field"><span>일정 (선택)</span><input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)}/></label>
              <div className="dd-create-row"><label className="dd-field"><span>목표 인원</span><input type="number" min={1} max={20} required value={capacity} onChange={e=>setCapacity(Number(e.target.value))}/></label><label className="dd-field"><span>연령 그룹</span><select value={age} onChange={e=>setAge(e.target.value)}>{['성인 전체','20대','30대','40대','50대 이상'].map(v=><option key={v}>{v}</option>)}</select></label></div>
              {createErr&&<p role="alert" className="dd-create-err">{createErr}</p>}
              <footer className="dd-create-foot"><button type="button" className="dd-x" onClick={()=>setShowCreate(false)}>취소</button><button type="submit" className="dd-go" disabled={!title.trim()&&!(space.id==='fandom'&&artist.trim())}>{online?'모임 만들기':'모임 열기'}</button></footer>
            </div>
          </form>}
          {(()=>{const q=roomSearch.trim().toLocaleLowerCase();const all=[...sharedTopics.filter(t=>t.space===space.id),...topics.filter(t=>t.space===space.id&&!sharedTopics.some(x=>x.id===t.id)),...seedTopics];const filtered=all.filter(t=>(!q||[t.title,t.description,t.workTitle??'',t.artist??''].some(v=>v.toLocaleLowerCase().includes(q)))&&(roomFilter==='all'||(roomFilter==='saved'?savedTopics.includes(t.id):kindOf(t)===roomFilter)));return filtered.length?filtered.map(t=>{const live=roomCount(t);const full=online&&roomIsFull(t);return <div key={t.id} className="dd-room-list-item" data-topic-id={t.id}><button className="dd-room-join" onClick={()=>enter(t)}><span><strong>{t.title}{isOwner(t)&&<em className="dd-room-mine">내 모임</em>}</strong><small>{t.artist&&<>{t.artist}{t.fanOccasion?` · ${t.fanOccasion}`:''} · </>}{t.workTitle&&<>{t.workTitle} · </>}{t.description}{t.date?' · 이용자 등록 일정 '+t.date.replace('T',' '):''} · {online?`지금 ${live}명 / 정원 ${t.capacity}명`:`정원 ${t.capacity}명`}</small></span><span className={full?'dd-kind-badge is-full':'dd-kind-badge'}>{full?'정원 참':KIND_UI[kindOf(t)].label}</span><ChevronRight size={18}/></button>{isOwner(t)&&<span className="dd-room-owner"><button type="button" aria-label={t.title+' 모임 수정'} title="모임 수정" onClick={()=>openEdit(t)}>✎</button><button type="button" aria-label={t.title+' 모임 삭제'} title="모임 삭제" onClick={()=>void deleteRoom(t)}>🗑</button></span>}<button className="dd-room-save" aria-label={(savedTopics.includes(t.id)?'저장 해제 ':'모임 저장 ')+t.title} aria-pressed={savedTopics.includes(t.id)} onClick={()=>setSavedTopics(v=>v.includes(t.id)?v.filter(x=>x!==t.id):[...v,t.id])}><Star size={18} fill={savedTopics.includes(t.id)?'currentColor':'none'}/></button></div>}):<p className="dd-room-empty">조건에 맞는 모임이 없어요. 검색 조건을 바꾸거나 새로운 방을 열어 보세요.</p>})()}
          {space.legacy?.map(id=><button key={id} className="card flex w-full justify-between gap-2 p-4 text-left" onClick={()=>{leave();setSpace(null);onLegacy(id)}}><span>{ROOMS.find(r=>r.id===id)?.name}</span><span className="text-xs">기존 시연방 →</span></button>)}
        </div>}
      </div>
        </aside>}
      </div>
      {game&&<GameStage game={game} roomLabel={space?.name??'게임 라운지'} onChange={id=>openGame(id)} onClose={()=>setGame(null)}/>}
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
function DailyFestival({onVisit,onCalendar}:{onVisit:(id:string)=>void;onCalendar:()=>void}){
 const today=seoulDate(),[selected,setSelected]=useState(today)
 const [notes,setNotes]=usePersistentState<Record<string,string>>('dd.dailyFestival.v1',{})
 const [draft,setDraft]=useState(notes[today]??''),[feedback,setFeedback]=useState('')
 const date=new Date(selected+'T00:00:00Z'),month=date.getUTCMonth(),day=date.getUTCDate(),index=day-1
 const theme=dailyThemes[month][index%dailyThemes[month].length],ev=dailyEvent(new Date(date.getUTCFullYear(),month,day,12))
 const festival=LUNAR_FESTIVALS[selected]
 const scheduled=CALENDAR.filter(event=>event.kind!=='weekly'&&event.dateISO.slice(0,10)===selected)
 function selectDate(key:string){
   setSelected(key)
   setDraft(notes[key]??'')
   setFeedback('')
 }
 function change(delta:number){
   const next=new Date(date)
   next.setUTCDate(next.getUTCDate()+delta)
   const key=next.toISOString().slice(0,10)
   if(key.length===10)selectDate(key)
 }
 function saveNote(){
   const next={...notes}
   if(draft.trim())next[selected]=draft.trim()
   else delete next[selected]
   if(!saveJSON('dd.dailyFestival.v1',next)){
     setFeedback('저장하지 못했어요. 다시 시도해 주세요.')
     return
   }
   setNotes(next)
   setFeedback('이 기기에 저장했어요.')
 }
 return <section className="card space-y-3 p-4" aria-label="매일의 딩동 이벤트">
   <strong>365일 작은 축제</strong>
   <p>서울 날짜 기준 · 매일 바뀌는 로컬 콘텐츠</p>
   <div className="flex flex-wrap items-center justify-between gap-2">
     <button type="button" aria-label="전날 이벤트" onClick={()=>change(-1)}>‹</button>
     <input type="date" aria-label="축제 날짜" value={selected} min="0001-01-01" max="9999-12-31" onChange={e=>{
       const value=e.target.value
       if(/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(e.target.valueAsNumber))selectDate(value)
     }}/>
     <button type="button" aria-label="다음 날 이벤트" onClick={()=>change(1)}>›</button>
     <button type="button" className="dd3-btn" disabled={selected===today} onClick={()=>selectDate(today)}>오늘로</button>
   </div>
   {scheduled.length>0&&<div>
     {scheduled.map(event=><p key={event.id}>{event.title}</p>)}
     <button type="button" className="dd3-btn" onClick={onCalendar}>파티 일정 보기</button>
   </div>}
   <h3>{festival?.name ?? ev.title}</h3>
   {!festival&&<small>오늘의 키워드 · {theme}</small>}
   <p>{festival?.prompt ?? ev.blurb}</p>
   <textarea aria-label="오늘의 축제 기록" className={FIELD} maxLength={500} value={draft} onChange={e=>{setDraft(e.target.value);setFeedback('')}}/>
   <button type="button" className="dd3-btn" onClick={saveNote}>기록 저장</button>
   <p role="status">{feedback}</p>
   <button type="button" className="dd3-btn" onClick={()=>onVisit(festival?.space ?? ev.space)}>관련 공간 방문</button>
 </section>
}

function MiniHomeJournal(){
 const [saved,setSaved]=usePersistentState('dd.minihome.journal.v1',{title:'나의 작은 집',mood:'편안함',note:''})
 const [draft,setDraft]=useState(saved),[status,setStatus]=useState('')
 return <section className="card space-y-3 p-4" aria-label="나의 미니홈피"><h3>{saved.title}</h3><p>오늘의 기분 · {saved.mood}</p><p style={{whiteSpace:'pre-wrap'}}>{saved.note||'아직 남긴 일기가 없어요.'}</p><small>이 기기에만 저장되는 개인 공간입니다. 실제 방문자나 공개 기능은 연결되지 않았어요.</small><label className="block">홈피 제목<input className={FIELD} maxLength={40} value={draft.title} onChange={e=>{setDraft(v=>({...v,title:e.target.value}));setStatus('')}}/></label><label className="block">기분<select className={FIELD} value={draft.mood} onChange={e=>{setDraft(v=>({...v,mood:e.target.value}));setStatus('')}}>{['편안함','설렘','기쁨','차분함','휴식 필요'].map(m=><option key={m}>{m}</option>)}</select></label><label className="block">한 줄 일기<textarea className={FIELD} maxLength={500} value={draft.note} onChange={e=>{setDraft(v=>({...v,note:e.target.value}));setStatus('')}}/></label><button type="button" className="dd3-btn" onClick={()=>{const next={...draft,title:draft.title.trim()||'나의 작은 집'};if(saveJSON('dd.minihome.journal.v1',next)){setSaved(next);setDraft(next);setStatus('저장했어요.')}else setStatus('저장 실패. 다시 시도해 주세요.')}}>미니홈피 저장</button><p role="status">{status}</p></section>
}
