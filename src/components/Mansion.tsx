import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Profile } from '../types'
import type { Space } from '../data/dingdong'
import { SPACES } from '../data/dingdong'
import { Avatar } from './Avatar'
import { RoomArtwork } from './MansionArt'
import { salonAudio } from '../lib/audio'
const WINGS=[
 {name:'크리스마스 중앙 홀',ids:['season','jazz','cafe','plaza'],note:'반짝이는 샹들리에 아래 오늘의 파티를 찾아보세요.'},
 {name:'취향의 복도',ids:['travel','hobby','cinema','games'],note:'책, 영화, 여행과 게임이 기다리는 복도입니다.'},
 {name:'친구들의 살롱',ids:['women','men','single','home'],note:'편하게 이야기하고 나의 작은 집에도 들러보세요.'}
]
const X=[14,38,62,86]
const clamp=(n:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,n))
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches
type Position={x:number;y:number}
function Walker({profile,position,moving=false}:{profile:Profile;position:Position;moving?:boolean}){
 return <div className={'dd-walker'+(moving?' dd-walking':'')} style={{left:position.x+'%',top:position.y+'%'}} aria-label={profile.nickname+' 캐릭터'}><div className="dd-body"><span className="dd-feet"><i/><i/></span><span className="dd-coat"/><span className="dd-head"><Avatar name={profile.avatar} size={44}/></span></div><span className="dd-nick">{profile.nickname}</span></div>
}
export function Mansion({profile,onEnter,favorites,onFavorite,onlyFavorites}:{profile:Profile;onEnter:(s:Space)=>void;favorites:string[];onFavorite:(id:string)=>void;onlyFavorites:boolean}){
 const [wing,setWing]=useState(0),[pos,setPos]=useState<Position>({x:50,y:88}),[moving,setMoving]=useState(false),[opening,setOpening]=useState<string|null>(null),[busy,setBusy]=useState(false),[sound,setSound]=useState(false),[status,setStatus]=useState('중앙 홀에 도착했어요.')
 const timer=useRef<number[]>([]),lock=useRef(false)
 useEffect(()=>()=>{timer.current.forEach(t=>window.clearTimeout(t))},[])
 function after(ms:number,fn:()=>void){timer.current.push(window.setTimeout(fn,reduced()?0:ms))}
 function walk(p:Position){setPos(p);setMoving(true)}
 function move(dx:number,dy:number){if(lock.current)return;walk({x:clamp(pos.x+dx,5,95),y:clamp(pos.y+dy,71,92)});after(450,()=>{if(!lock.current)setMoving(false)})}
 function changeWing(i:number){if(lock.current||i===wing)return;setWing(i);setPos({x:50,y:88});setStatus(WINGS[i].name+'에 도착했어요.')}
 function visit(s:Space,i:number){if(lock.current)return;lock.current=true;setBusy(true);setStatus(s.name+'으로 걸어가는 중');walk({x:X[i],y:72});if(sound){try{salonAudio.chime()}catch{/* optional */}}after(650,()=>{setMoving(false);setOpening(s.id);setStatus(s.name+'의 문을 열어요.');after(440,()=>{setOpening(null);setBusy(false);lock.current=false;setStatus(s.name+'에서 복도로 돌아왔어요.');onEnter(s)})})}
 function favorite(s:Space){const w=WINGS.findIndex(v=>v.ids.includes(s.id));if(w<0||lock.current)return;setWing(w);visit(s,WINGS[w].ids.indexOf(s.id))}
 const current=WINGS[wing]
 return <div className="dd-mansion">
  <div className="dd-mansion-top"><div><span>DINGDONG · THE MANSION</span><h3>{current.name}</h3><p>{current.note}</p></div><button className="dd-utility" type="button" aria-pressed={sound} onClick={()=>setSound(v=>!v)}>{sound?'♪ 효과음 켜짐':'♪ 효과음 꺼짐'}</button></div>
  <nav className="dd-wings" aria-label="저택 구역">{WINGS.map((w,i)=><button key={w.name} type="button" disabled={busy} aria-current={wing===i?'location':undefined} onClick={()=>changeWing(i)}>0{i+1} {w.name}</button>)}</nav>
  <div className="dd-hall" tabIndex={0} aria-label="저택 복도. 방향키로 캐릭터 이동" onKeyDown={e=>{if(e.target!==e.currentTarget)return;const ds:Record<string,[number,number]>={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-5],ArrowDown:[0,5]};const d=ds[e.key];if(d){e.preventDefault();move(...d)}}}>
  <div className="dd-cornice"/><div className="dd-window"/><div className="dd-chandelier"><i/><i/><i/></div><div className="dd-wainscot"/><div className="dd-floor"/><div className="dd-carpet"/>
  <div className="dd-floor-target" aria-hidden="true" onClick={e=>{if(lock.current)return;const r=e.currentTarget.parentElement?.getBoundingClientRect();if(r){walk({x:clamp((e.clientX-r.left)/r.width*100,5,95),y:clamp((e.clientY-r.top)/r.height*100,71,92)});after(450,()=>{if(!lock.current)setMoving(false)})}}}/>
  {current.ids.map((id,i)=>{const s=SPACES.find(v=>v.id===id)!;return <div key={id} className="dd-door-unit" style={{left:X[i]+'%','--dd-door':s.door,'--dd-wall':s.wall} as CSSProperties}><button type="button" disabled={busy} aria-label={s.name+' 문 열기'} className="dd-door-button" onClick={()=>visit(s,i)}><div className="dd-door-sign">{s.name}</div><div className={'dd-door-frame'+(opening===id?' dd-open':'')}><div className="dd-door-peek"><RoomArtwork space={s}/></div><div className="dd-door-leaf"><i/><i/><b/></div></div><span className="dd-door-step"/></button><button type="button" className="dd-star" aria-label={s.name+' 즐겨찾기'} aria-pressed={favorites.includes(id)} onClick={()=>onFavorite(id)}>{favorites.includes(id)?'★':'☆'}</button></div>})}
  <Walker profile={profile} position={pos} moving={moving}/>
  </div>
  <div className="dd-mansion-bottom"><p role="status">{status}</p><div className="dd-controls" aria-label="이동 조작">{([['←','왼쪽',-8,0],['↑','앞으로',0,-5],['↓','뒤로',0,5],['→','오른쪽',8,0]] as const).map(([sym,label,dx,dy])=><button type="button" disabled={busy} key={sym} aria-label={label+' 걷기'} onClick={()=>move(dx,dy)}>{sym}</button>)}</div></div>
  <p className="dd-hint">바닥이나 방향키로 걷고 문을 선택하세요. 내 캐릭터가 걸어가 문을 열어요.</p>
  {onlyFavorites&&<div className="dd-favorite-list"><strong>즐겨찾는 공간</strong>{favorites.length?SPACES.filter(s=>favorites.includes(s.id)).map(s=><button type="button" disabled={busy} key={s.id} onClick={()=>favorite(s)}>{s.name} →</button>):<span>아직 즐겨찾기가 없어요.</span>}</div>}
 </div>
}
export function RoomStage({profile,space}:{profile:Profile;space:Space}){
 const [pos,setPos]=useState<Position>({x:50,y:87}),[walking,setWalking]=useState(false),[night,setNight]=useState(false);const timer=useRef<number|undefined>(undefined)
 useEffect(()=>()=>window.clearTimeout(timer.current),[])
 return <div className="dd-room-stage"><div className="dd-room-art"><RoomArtwork space={space} night={night}/><button className="dd-room-walk-target" type="button" aria-label="방 안에서 걷기" onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setPos({x:e.detail===0?pos.x>=75?25:pos.x+12:clamp(9+(e.clientX-r.left)/r.width*82,12,88),y:87});setWalking(true);window.clearTimeout(timer.current);timer.current=window.setTimeout(()=>setWalking(false),reduced()?0:450)}}/><Walker profile={profile} position={pos} moving={walking}/></div><div className="dd-room-caption"><span>내 캐릭터 · 실제 이용자는 연결 전입니다.</span>{space.id==='cafe'&&<button type="button" className="dd-utility" onClick={()=>setNight(v=>!v)}>{night?'낮의 카페':'밤의 카페'}</button>}</div></div>
}
