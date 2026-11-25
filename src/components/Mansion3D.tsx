import { useEffect, useRef, useState } from 'react'
import type { Profile } from '../types'
import type { Space } from '../data/dingdong'
import { SPACES } from '../data/dingdong'
import { salonAudio } from '../lib/audio'
import { RESIDENTS, WORLD_INTRO, SEASON_STORY } from '../data/world'
import { createWorld } from '../lib/mansion3d.js'
import type { WorldController } from '../lib/mansion3d.js'
export function Mansion3D({profile,active,onEnter,onLeave,favorites,onFavorite,onlyFavorites}:{profile:Profile;active:Space|null;onEnter:(s:Space)=>void;onLeave:()=>void;favorites:string[];onFavorite:(id:string)=>void;onlyFavorites:boolean}){
 const host=useRef<HTMLDivElement>(null),world=useRef<WorldController|null>(null),callbacks=useRef({onEnter,onLeave});callbacks.current={onEnter,onLeave}
 const [status,setStatus]=useState('중앙 복도'),[error,setError]=useState(false),[destination,setDestination]=useState(''),[story,setStory]=useState(false),[night,setNight]=useState(false),[sound,setSound]=useState(false)
 const soundRef=useRef(sound);soundRef.current=sound
 useEffect(()=>{if(!host.current)return;try{const w=createWorld(host.current,{spaces:SPACES,residents:RESIDENTS,avatar:profile.avatar,onEnter:id=>{const s=SPACES.find(v=>v.id===id);if(s)callbacks.current.onEnter(s)},onLeave:()=>callbacks.current.onLeave(),onStatus:s=>{setStatus(s);if(soundRef.current&&s.includes('문 열림')){try{salonAudio.chime()}catch{/* optional */}}}});world.current=w;return()=>{w.dispose();world.current=null}}catch(e){console.error('3D 초기화 실패',e);setError(true)}},[])
 useEffect(()=>{world.current?.setAvatar(profile.avatar)},[profile.avatar])
 useEffect(()=>{if(!active)world.current?.exit();if(active?.id!=='cafe'){setNight(false);world.current?.setNight(false)}},[active])
 function visit(id:string){if(error){const s=SPACES.find(x=>x.id===id);if(s){callbacks.current.onLeave();callbacks.current.onEnter(s);setStatus(s.name+' · 2D 접근성 대체 모드')}}else world.current?.visit(id)}
 return <div className="dd3-shell">
  <div className="dd3-title"><div><p>THE DINGDONG MANSION · 3D 공간 × 2D 캐릭터</p><h3>딩동 맨션</h3><span role="status">{status}</span></div><button type="button" onClick={()=>setStory(v=>!v)} className="dd3-btn">초대장 {story?'닫기':'열기'}</button></div>
  {story&&<div className="dd3-story"><strong>열두 번째 초대장</strong><p>{WORLD_INTRO}</p><p>{SEASON_STORY}</p></div>}
  <div ref={host} className="dd3-canvas" data-testid="mansion-3d"/>
  {!active&&!error&&<div className="dd3-season-welcome"><span>첫 번째 시즌 · 크리스마스 파티하우스</span><button className="dd3-btn" type="button" onClick={()=>visit('season')}>🎄 파티하우스로 걸어가기</button></div>}
  {error&&<p role="alert" className="dd3-story">이 브라우저에서 WebGL 3D를 시작하지 못했습니다. 아래 목적지 선택은 접근성 대체 모드이며 3D 이동이 아닙니다.</p>}
  <div className="dd3-tools"><div className="dd3-pad" aria-label="캐릭터 이동">{([['←','왼쪽',-1,0],['↑','앞으로',0,-1],['↓','뒤로',0,1],['→','오른쪽',1,0]] as const).map(([sym,name,x,z])=><button disabled={error} type="button" key={sym} aria-label={name+' 걷기'} className="dd3-btn" onClick={()=>world.current?.move(x,z)}>{sym}</button>)}</div><div className="dd3-pad"><button type="button" disabled={error} className="dd3-btn" aria-label="카메라 왼쪽 회전" onClick={()=>world.current?.orbit(-Math.PI/4)}>↶</button><button type="button" disabled={error} className="dd3-btn" aria-label="카메라 오른쪽 회전" onClick={()=>world.current?.orbit(Math.PI/4)}>↷</button><button type="button" disabled={error} className="dd3-btn" aria-label="확대" onClick={()=>world.current?.zoom(-.2)}>＋</button><button type="button" disabled={error} className="dd3-btn" aria-label="축소" onClick={()=>world.current?.zoom(.2)}>－</button></div></div>
  <div className="dd3-route"><button type="button" className="dd3-btn" aria-pressed={sound} onClick={()=>{setSound(v=>!v);if(!sound){try{salonAudio.chime()}catch{/* optional */}}}}>{sound?'♪ 효과음 켜짐':'♪ 효과음 꺼짐'}</button>{active?.id==='cafe'&&<button type="button" className="dd3-btn" onClick={()=>{setNight(v=>!v);world.current?.setNight(!night)}}>{night?'낮의 카페':'밤의 카페'}</button>}<label htmlFor="dd3-dest">목적지 안내</label><select id="dd3-dest" value={destination} onChange={e=>setDestination(e.target.value)}><option value="">공간 선택</option>{SPACES.filter(s=>!onlyFavorites||favorites.includes(s.id)).map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select><button type="button" className="dd3-btn" disabled={!destination} onClick={()=>visit(destination)}>걸어가기</button><button type="button" className="dd3-btn" disabled={!destination} onClick={()=>onFavorite(destination)}>{favorites.includes(destination)?'★':'☆'}</button>{active&&<button type="button" className="dd3-btn" onClick={()=>error?callbacks.current.onLeave():world.current?.exit()}>복도로 걷기</button>}</div>
  <p className="dd3-hint">바닥 터치로 걷기 · 문 또는 간판을 터치해 입장 · 화면 좌우 드래그로 시점 회전 · 방향키/WASD 이동. 목적지 안내도 실제 캐릭터 이동 경로를 따라갑니다.</p>
 </div>
}
