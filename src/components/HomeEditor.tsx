import {useState,useEffect,useRef} from 'react'
import {furniturePreview} from '../lib/furnitureModels.js'
import {Check,Save,RotateCw,Armchair,PaintRoller,Flower2,X,Trash2} from 'lucide-react'
import {WALLS,FLOORS,FABRICS,FURNITURE,HOME_DEFAULT,normalizeHome,newHomeItem,canPlace,fitReplacement,type HomeItem,type HomeDecor} from '../data/homeDecor'
import {saveJSON} from '../lib/storage'
function Swatches({title,options,value,onChange}:{title:string;options:string[][];value:string;onChange:(v:string)=>void}){return <section><h4>{title}</h4><div className="dd-home-swatches">{options.map(([c,n])=><button key={c} title={n} aria-label={title+' '+n} aria-pressed={value===c} onClick={()=>onChange(c)}><span style={{background:c}}>{value===c&&<Check size={16}/>}</span><small>{n}</small></button>)}</div></section>}
function FurnitureTile({id,color}:{id:string;color:string}){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{if(ref.current&&id!=='none')furniturePreview(ref.current,id,color)},[id,color]);return id==='none'?<span className="dd-empty-furniture">＋</span>:<canvas ref={ref} width={160} height={128} aria-hidden="true"/>}
const nameOf=(kind:string)=>FURNITURE.find(([id])=>id===kind)?.[1]??kind
export function HomeEditor({home,onChange,onDone,onClose,selected,onSelect,moveTo}:{home:HomeDecor;onChange:(v:HomeDecor)=>boolean;onDone:()=>void;onClose:()=>void;selected:string|null;onSelect:(id:string|null)=>void;moveTo?:{x:number;z:number;nonce:number}|null}){
 const [tab,setTab]=useState('room'),[status,setStatus]=useState('')
 const item=home.items.find(v=>v.id===selected)
 useEffect(()=>{if(selected)setTab('furniture')},[selected])
 function set<K extends keyof HomeDecor>(k:K,v:HomeDecor[K]){const ok=onChange({...home,[k]:v});setStatus(ok?'자동 저장됨':'저장 실패 · 저장 공간을 확인해 주세요.');return ok}
 function changeItem(patch:Partial<HomeItem>){if(!item)return;const next={...item,...patch};if((patch.kind!==undefined||patch.x!==undefined||patch.z!==undefined||patch.rotation!==undefined)&&!canPlace(next,home.items)){setStatus('다른 가구 또는 벽과 조금 겹쳐요. 조금만 옮겨 주세요.');return}const ok=set('items',home.items.map(v=>v.id===item.id?next:v));return ok}
 useEffect(()=>{if(moveTo&&home.items.some(v=>v.id===selected))changeItem({x:Math.max(-4.3,Math.min(4.3,moveTo.x)),z:Math.max(-3.8,Math.min(3.8,moveTo.z))})},[moveTo?.nonce])
 function add(kind:string){if(home.items.length>=18){setStatus('가구는 최대 18개까지 배치할 수 있어요.');return}const next=newHomeItem(kind,home.furnitureColor,home.items);if(!next){setStatus('빈 공간이 부족해요. 가구를 옮기거나 지워 주세요.');return}set('items',[...home.items,next]);onSelect(next.id);setStatus(nameOf(kind)+'을(를) 놓았어요. 색·위치를 바로 조절할 수 있어요.')}
 function replace(kind:string){if(!item)return;const next=fitReplacement({...item,kind},home.items);if(!next){setStatus('이 가구가 들어갈 자리가 없어요. 작은 가구를 골라 주세요.');return}set('items',home.items.map(v=>v.id===item.id?next:v));onSelect(next.id);setStatus(nameOf(item.kind)+' → '+nameOf(kind)+' 로 바꿨어요.')}
 function remove(){if(!item)return;set('items',home.items.filter(v=>v.id!==item.id));onSelect(null);setStatus(nameOf(item.kind)+'을(를) 지웠어요.')}
 const tiles=(onPick:(id:string)=>void)=><div className="dd-home-items">{FURNITURE.filter(([id])=>id!=='none').map(([id,n])=><button key={id} aria-label={n} aria-pressed={item?.kind===id} onClick={()=>onPick(id)}><FurnitureTile id={id} color={item?.color??home.furnitureColor}/><small>{n}</small>{item?.kind===id&&<i className="dd-home-check"><Check size={12}/></i>}</button>)}</div>
 return <div className="dd-home-editor">
  <header><div><span className="dd-editor-kicker">MY LITTLE HOME</span><h3>나의 인테리어 스튜디오</h3><p>가구를 고르면 3D 방에 바로 반영됩니다.</p></div><button className="dd-panel-x" aria-label="인테리어 닫기" onClick={onClose}><X size={21}/></button></header>
  <nav>{[{id:'room',name:'벽·바닥',I:PaintRoller},{id:'furniture',name:'가구·배치',I:Armchair},{id:'decor',name:'장식·반려동물',I:Flower2}].map(({id,name,I})=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}><I size={19}/>{name}</button>)}</nav>
  {tab==='room'?<>
   <Swatches title="벽지" options={WALLS} value={home.wallpaper} onChange={v=>set('wallpaper',v)}/>
   <Swatches title="바닥" options={FLOORS} value={home.floor} onChange={v=>set('floor',v)}/>
   <Swatches title="러그" options={FABRICS} value={home.rug} onChange={v=>set('rug',v)}/>
   <label className="dd-home-access">벽지 선택<select aria-label="벽지" value={home.wallpaper} onChange={e=>set('wallpaper',e.target.value)}>{WALLS.map(([c,n])=><option key={c} value={c}>{n}</option>)}</select></label>
  </>:tab==='furniture'?<>
   <section>
    <h4>배치된 가구 ({home.items.length}/18)</h4>
    <p>방 안 가구를 직접 눌러도 선택돼요. 아래에서 골라 위치·색·모양을 바꿔 보세요.</p>
    <div className="dd-home-items dd-placed-items">{home.items.map((v,n)=><button key={v.id} aria-label={'배치 가구 '+nameOf(v.kind)+' '+(n+1)} aria-pressed={selected===v.id} onClick={()=>onSelect(selected===v.id?null:v.id)}><FurnitureTile id={v.kind} color={v.color}/><small>{nameOf(v.kind)}</small>{selected===v.id&&<i className="dd-home-check"><Check size={12}/></i>}</button>)}</div>
   </section>
   {item?<>
    <section className="dd-home-selected">
     <h4>선택한 가구 · <strong>{nameOf(item.kind)}</strong></h4>
     <div className="dd-home-quick">
      <button type="button" className="dd-home-rotate" onClick={()=>changeItem({rotation:(item.rotation+90)%360})}><RotateCw size={17}/> 90° 회전</button>
      <button type="button" className="dd-home-remove" onClick={remove}><Trash2 size={16}/> 이 가구 삭제</button>
     </div>
     <label>좌우 <input aria-label="가구 좌우" type="range" min="-4.3" max="4.3" step=".1" value={item.x} onChange={e=>changeItem({x:+e.target.value})}/></label>
     <label>앞뒤 <input aria-label="가구 앞뒤" type="range" min="-3.8" max="3.8" step=".1" value={item.z} onChange={e=>changeItem({z:+e.target.value})}/></label>
     <Swatches title="가구 색상" options={FABRICS} value={item.color} onChange={v=>changeItem({color:v})}/>
     <p className="dd-home-tip">3D 방 바닥을 누르면 선택한 가구가 그 자리로 옮겨져요.</p>
    </section>
    <section>
     <div className="dd-home-section-head"><h4>다른 가구로 바꾸기</h4><button type="button" className="dd-home-new" onClick={()=>onSelect(null)}>＋ 새 가구 놓기</button></div>
     <p>아래에서 고르면 지금 선택한 가구가 그 자리에서 교체돼요.</p>
     {tiles(replace)}
    </section>
   </>:<>
    <section>
     <h4>새 가구 추가</h4>
     <p>가구를 고르면 방의 빈자리에 놓이고, 바로 색·위치를 조절할 수 있어요.</p>
     {tiles(add)}
    </section>
   </>}
  </>:<section>
   <h4>반려동물</h4>
   <div className="dd-home-pets">{['🐈','🐕','🐇','🐹','없음'].map(v=><button key={v} aria-pressed={home.pet===v} onClick={()=>set('pet',v)}>{v}</button>)}</div>
   <h4>장식</h4>
   <label><input type="checkbox" checked={home.lamp} onChange={e=>set('lamp',e.target.checked)}/> 장식 조명</label>
   <div className="dd-home-pets">{['🎀','🎩','🧣','🌷','없음'].map(v=><button key={v} aria-pressed={home.accessory===v} onClick={()=>set('accessory',v)}>{v}</button>)}</div>
  </section>}
  <div className="dd-home-save">
   <button onClick={()=>{const next=normalizeHome({...HOME_DEFAULT,intro:home.intro,visibility:home.visibility});const ok=onChange(next);onSelect(null);setStatus(ok?'기본 인테리어로 되돌렸어요.':'저장 실패 · 저장 공간을 확인해 주세요.')}}>기본값</button>
   <button onClick={()=>{const ok=saveJSON('dd.home.v1',home);if(ok)onDone();else setStatus('저장 실패 · 브라우저 저장 공간을 확인해 주세요.')}}><Save size={17}/> 집 꾸미기 저장</button>
   <p className="dd-home-save-status" role="status">{status||'이 브라우저에 저장됩니다.'}</p>
  </div>
 </div>}
