import {ResidentConversation} from './ResidentConversation'
import {RotateCcw,RotateCw,ZoomIn,ZoomOut,Settings2,House,Map as MapIcon,BellRing} from 'lucide-react'
import PHASE_PROPS from '../data/phase1Props.json'
import { access, accessLabel } from '../data/phase1'
import type { Look } from '../data/avatarLook'
import { AvatarPreview } from './AvatarWardrobe'
import { RoomArtwork } from './MansionArt'
import { useEffect, useRef, useState } from 'react'
import type { Profile } from '../types'
import type { Space } from '../data/dingdong'
import { SPACES } from '../data/dingdong'
import { salonAudio } from '../lib/audio'
import { RESIDENTS, WORLD_INTRO, SEASON_STORY, PLACE_STORIES } from '../data/world'
import { createWorld } from '../lib/mansion3d.js'
import type { WorldController } from '../lib/mansion3d.js'
export function Mansion3D({profile,look,home,homeEditing,active,request,toolsOpen,onToolsChange,onEnter,onLeave,onCapture,onMenu,favorites,onFavorite,onlyFavorites}:{profile:Profile;look:Look;home:import('../data/homeDecor').HomeDecor;homeEditing:boolean;active:Space|null;request:{id:string;serial:number;direct?:boolean;preview?:boolean}|null;toolsOpen:boolean;onToolsChange:(v:boolean)=>void;onEnter:(s:Space)=>void;onLeave:()=>void;onCapture:(image:string)=>void;onMenu:(id:string)=>void;favorites:string[];onFavorite:(id:string)=>void;onlyFavorites:boolean}){
 const host=useRef<HTMLDivElement>(null),world=useRef<WorldController|null>(null),callbacks=useRef({onEnter,onLeave,onMenu});callbacks.current={onEnter,onLeave,onMenu}
 const [status,setStatus]=useState('중앙 축제광장'),[error,setError]=useState(false),[low,setLow]=useState(false),[destination,setDestination]=useState(''),[story,setStory]=useState(false),[timeMode,setTimeMode]=useState<'auto'|'day'|'sunset'|'night'>('auto'),[sound,setSound]=useState(false),[festive,setFestive]=useState(false),[bellBurst,setBellBurst]=useState(0)
 const [roofsOpen,setRoofsOpen]=useState(true),[overview,setOverview]=useState(false)
 const [resident,setResident]=useState<string|null>(null);
 const soundRef=useRef(sound);soundRef.current=sound
 useEffect(()=>{if(low||!host.current)return;try{const w=createWorld(host.current,{spaces:SPACES,residents:RESIDENTS,avatar:profile.avatar,look,access,onResident:id=>setResident(id),onBell:()=>{try{salonAudio.doorbell()}catch{/* audio unavailable */}setBellBurst(v=>v+1)},onMenu:id=>callbacks.current.onMenu(id),onEnter:id=>{const s=SPACES.find(v=>v.id===id);if(s)callbacks.current.onEnter(s)},onLeave:()=>callbacks.current.onLeave(),onStatus:s=>{setStatus(s);if(soundRef.current&&s.includes('문 열림')){try{salonAudio.chime()}catch{/* optional */}}}});world.current=w;return()=>{w.dispose();world.current=null}}catch(e){console.error('3D 초기화 실패',e);setError(true)}},[low])
 useEffect(()=>{world.current?.setAvatar(profile.avatar,look)},[profile.avatar,look,low])
 useEffect(()=>{world.current?.setFestive(festive)},[festive,low])
 useEffect(()=>{world.current?.setRoofs(roofsOpen)},[roofsOpen,low])
 useEffect(()=>{world.current?.setHome(home)},[home,low])
 useEffect(()=>{world.current?.setHomeEditing(homeEditing)},[homeEditing,low])
 useEffect(()=>{if(!bellBurst)return;const timer=window.setTimeout(()=>setBellBurst(0),2200);return()=>window.clearTimeout(timer)},[bellBurst])
 useEffect(()=>{if(active)setOverview(false)},[active])
 useEffect(()=>{if(!active)world.current?.exit();setResident(null)},[active])
 useEffect(()=>{world.current?.setTime(timeMode)},[timeMode,low])
 function returnHub(){
   setStory(false)
   setResident(null)
   if(error||low){
     callbacks.current.onLeave()
     setStatus('중앙 축제광장 · 2D 대체 모드')
   }else world.current?.returnHub()
 }
 function visit(id:string,direct=false,preview=false){if(id==='return-hub'){returnHub();return}if(access(id)!=='open'&&!preview){setStatus(accessLabel(id));return}if(direct&&!error&&!low){world.current?.enterDirect(id,preview);return}if(error||low){const s=SPACES.find(x=>x.id===id);if(s){callbacks.current.onLeave();callbacks.current.onEnter(s);setStatus(s.name+' · 2D 접근성 대체 모드')}}else world.current?.visit(id)}
 useEffect(()=>{if(request)visit(request.id,request.direct,request.preview)},[request])
 return <div className="dd3-shell">
  <div className="dd3-title"><div><p>{active&&access(active.id)==='locked'?'공간 구경 · 채팅 잠금':'DINGDONG · 로컬 체험'}</p><h3>{active?.name??'딩동 · 온라인 파티'}</h3>{status!==active?.name&&<span role="status">{status}</span>}</div><button type="button" onClick={()=>setStory(v=>!v)} className="dd3-btn">초대장 {story?'닫기':'열기'}</button></div>
  {story&&<div className="dd3-story"><strong>{active?PLACE_STORIES[active.id]?.title:'초인종이 울리는 동네'}</strong><p>{active?PLACE_STORIES[active.id]?.text:WORLD_INTRO}</p>{active&&<p>{PLACE_STORIES[active.id]?.activity}</p>}{active?.id==='season'&&<p>{SEASON_STORY}</p>}<button type="button" className="dd3-btn" onClick={()=>setStory(false)}>이야기 닫기</button></div>}
  {(!active||access(active.id)==='open')&&resident&&RESIDENTS[resident]&&<ResidentConversation key={resident} id={resident} onClose={()=>setResident(null)}/>}
  <div ref={host} className="dd3-canvas" data-testid="mansion-3d" hidden={error||low}/>
  {(error||low)&&<div className="dd3-fallback"><RoomArtwork space={active??SPACES.find(s=>s.id==='plaza')!}/><AvatarPreview avatar={profile.avatar} look={look}/><p>2D 대체 모드 · 공간 이동은 목적지 안내로 체험합니다.</p></div>}
  {!active&&<div className="dd-map-views"><button aria-pressed={overview} onClick={()=>{setOverview(v=>!v);world.current?.setOverview(!overview)}}><MapIcon size={19}/>{overview?"캐릭터 따라가기":"마을 전체 보기"}</button><button aria-pressed={roofsOpen} onClick={()=>setRoofsOpen(v=>!v)}><House size={19}/>{roofsOpen?"지붕 닫기":"지붕 열기"}</button></div>}
  {(!active||active.id==='plaza')&&!error&&!low&&<button className="dd-bell-shortcut" type="button" aria-label="초인종 찾아가기" onClick={()=>world.current?.interact('hub-bell')}><BellRing size={19}/><span>초인종 누르기</span><small>광장 분수 옆</small></button>}
  {!!bellBurst&&<div key={bellBurst} className="dd-bell-burst" role="status" aria-label="초인종 축하 효과"><span>딩동!</span>{Array.from({length:14},(_,i)=><i key={i} style={{'--dx':Math.cos(i*Math.PI/7)*68+'px','--dy':Math.sin(i*Math.PI/7)*52+'px',background:['#e75f91','#f4c364','#63bba5','#ad92d8'][i%4]} as React.CSSProperties}/>)}</div>}
  <div className="dd-camera-control">{[{I:RotateCcw,n:'왼쪽 회전',f:()=>world.current?.orbit(-Math.PI/4)},{I:RotateCw,n:'오른쪽 회전',f:()=>world.current?.orbit(Math.PI/4)},{I:ZoomIn,n:'화면 확대',f:()=>{setOverview(false);world.current?.zoom(-.25)}},{I:ZoomOut,n:'화면 축소',f:()=>{setOverview(false);world.current?.zoom(.35)}}].map(({I,n,f})=><button key={n} disabled={error||low} aria-label={n} onClick={f}><I size={19}/><small>{n.replace('화면 ','')}</small></button>)}</div>
  <details className="dd3-access-menu" open={toolsOpen} ><summary onClick={e=>{e.preventDefault();onToolsChange(!toolsOpen)}}><Settings2 size={17}/> 이동·공간 메뉴</summary>
  <button type="button" className="dd3-btn dd3-mode" onClick={()=>{callbacks.current.onLeave();setError(false);setLow(v=>!v)}}>{low?'3D 모드로':'가벼운 2D 모드'}</button>
  {!active&&!error&&!low&&<div className="dd3-season-welcome"><span>오늘의 시즌 이벤트</span><button className="dd3-btn" type="button" onClick={()=>visit('season')}>🎄 파티하우스로 걸어가기</button></div>}
  {error&&<p role="alert" className="dd3-story">이 브라우저에서 WebGL 3D를 시작하지 못했습니다. 아래 목적지 선택은 접근성 대체 모드이며 3D 이동이 아닙니다.</p>}
  <div className="dd3-tools dd-legacy-controls"><div className="dd3-pad" aria-label="캐릭터 이동">{([['←','왼쪽',-1,0],['↑','앞으로',0,-1],['↓','뒤로',0,1],['→','오른쪽',1,0]] as const).map(([sym,name,x,z])=><button disabled={error||low} type="button" key={sym} aria-label={name+' 걷기'} className="dd3-btn" onClick={()=>world.current?.move(x,z)}>{sym}</button>)}</div><div className="dd3-pad"><button type="button" disabled={error||low} className="dd3-btn" aria-label="카메라 왼쪽 회전" onClick={()=>world.current?.orbit(-Math.PI/4)}>↶</button><button type="button" disabled={error||low} className="dd3-btn" aria-label="카메라 오른쪽 회전" onClick={()=>world.current?.orbit(Math.PI/4)}>↷</button><button type="button" disabled={error||low} className="dd3-btn" aria-label="확대" onClick={()=>world.current?.zoom(-.2)}>＋</button><button type="button" disabled={error||low} className="dd3-btn" aria-label="축소" onClick={()=>world.current?.zoom(.2)}>－</button></div></div>
  <div className="dd3-route"><button type="button" className="dd3-btn" aria-pressed={sound} onClick={()=>{setSound(v=>!v);if(!sound){try{salonAudio.chime()}catch{/* optional */}}}}>{sound?'♪ 효과음 켜짐':'♪ 효과음 꺼짐'}</button><label htmlFor="dd-time">마을 시간</label><select id="dd-time" value={timeMode} onChange={e=>setTimeMode(e.target.value as typeof timeMode)}><option value="auto">실제 한국 시간</option><option value="day">낮</option><option value="sunset">노을</option><option value="night">밤</option></select><label htmlFor="dd3-dest">목적지 안내</label><select id="dd3-dest" value={destination} onChange={e=>setDestination(e.target.value)}><option value="">공간 선택</option>{SPACES.filter(s=>!onlyFavorites||favorites.includes(s.id)).map(s=><option value={s.id} key={s.id}>{s.name}{access(s.id)==='open'?'':' · '+accessLabel(s.id)}</option>)}</select><button type="button" className="dd3-btn" disabled={!destination} onClick={()=>visit(destination)}>걸어가기</button><button type="button" className="dd3-btn dd-direct-entry" disabled={!destination} onClick={()=>visit(destination,true,access(destination)==='locked')}>{destination&&access(destination)==='locked'?'공간 구경':'바로 입장'}</button><button type="button" className="dd3-btn" disabled={!destination} onClick={()=>onFavorite(destination)}>{favorites.includes(destination)?'★':'☆'}</button>{active&&<button type="button" className="dd3-btn" onClick={()=>(error||low)?callbacks.current.onLeave():world.current?.exit()}>복도로 걷기</button>}<button type="button" className="dd3-btn" onClick={returnHub}>광장으로 돌아가기</button></div>
  {(!active||access(active.id)==='open')&&PHASE_PROPS.filter(p=>p.room===(active?.id??'hall')).length>0&&<div className="dd3-props" aria-label="가까이 살펴볼 소품"><span>소품 살펴보기</span>{PHASE_PROPS.filter(p=>p.room===(active?.id??'hall')&&!p.id.startsWith('season-seat-')).map(p=><button type="button" key={p.id} className="dd3-btn" onClick={()=>{if(error||low){setStatus(p.message);if('menu' in p&&p.menu)callbacks.current.onMenu(p.menu)}else world.current?.interact(p.id)}}>{p.name}</button>)}</div>}
  {active?.id==='season'&&<details className="dd-seat-picker"><summary>파티 테이블 좌석 20개</summary><div className="dd3-props">{PHASE_PROPS.filter(p=>p.id.startsWith('season-seat-')).map(p=><button key={p.id} className="dd3-btn" onClick={()=>error||low?setStatus(p.message):world.current?.interact(p.id)}>{p.name}</button>)}</div></details>}
  {active?.id==='season'&&!error&&!low&&<div className="dd3-props"><button type="button" className="dd3-btn" onClick={()=>{const image=world.current?.capture();if(image){onToolsChange(false);onCapture(image);setStatus('포토존 사진을 채팅에 첨부했어요. 전송하기 전에는 게시되지 않아요.')}else setStatus('겨울 포토존 버튼으로 먼저 걸어가 도착한 뒤 촬영해 주세요.')}}>포토존 사진 촬영</button><span>내 3D 화면만 로컬 첨부</span></div>}
  {!error&&!low&&<div className="dd3-props"><button type="button" className="dd3-btn" onClick={()=>world.current?.stand()}>의자에서 일어나기</button><button type="button" className="dd3-btn" aria-pressed={festive} onClick={()=>setFestive(v=>!v)}>{festive?'시즌 장식 숨기기':'시즌 장식 보이기'}</button><span>크리스마스 장식 체험 · 기본 가구 유지</span></div>}
  <p className="dd3-hint">의자·소파를 직접 터치해 앉기 · 다시 터치하거나 이동해 일어나기 · 바닥 터치로 걷기 · 문 또는 간판을 터치해 입장 · 한 손가락 드래그로 걷기 · 회전 버튼으로 시점 변경 · 방향키/WASD 이동. 목적지 안내도 실제 캐릭터 이동 경로를 따라갑니다.</p>
  </details>
  {active&&access(active.id)==='locked'&&<div className="dd-preview-notice"><strong>공간 구경 중</strong><span>실제 모임·채팅은 연령 및 안전 확인 후 이용할 수 있어요.</span></div>}{active&&!error&&!low&&<div className="dd-room-actions"><button onClick={()=>world.current?.exit()}>거리로 나가기</button>{access(active.id)==='open'&&<><button onClick={()=>world.current?.stand()}>일어나기</button><button onClick={()=>world.current?.releaseItem()}>소품 놓기</button></>}</div>}
  <div className="dd3-world-hint">바닥을 터치해 걷기 · 문과 안내판을 터치 · 드래그로 걷기 · 주민을 클릭해 대화</div>
 </div>
}
