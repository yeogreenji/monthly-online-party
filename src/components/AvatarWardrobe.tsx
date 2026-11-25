import { useEffect, useRef } from 'react'
import type { AvatarKey } from '../types'
import { DEFAULT_LOOK, LOOK_OPTIONS } from '../data/avatarLook'
import type { Look } from '../data/avatarLook'
import { drawAvatarPreview } from '../lib/animalSprites.js'
const labels={fur:'털색',coat:'옷 색상',style:'의상',shoes:'신발',accessory:'소품',eyes:'눈·표정'}
export function AvatarPreview({avatar,look}:{avatar:AvatarKey;look:Look}){
 const ref=useRef<HTMLCanvasElement>(null)
 useEffect(()=>{const c=ref.current?.getContext('2d');if(c){c.clearRect(0,0,256,320);c.drawImage(drawAvatarPreview(avatar,look),0,0)}},[avatar,look])
 return <canvas ref={ref} width={256} height={320} role="img" aria-label="내 캐릭터 전신 미리보기" className="dd-wardrobe-preview"/>
}
export function AvatarWardrobe({avatar,look,onChange}:{avatar:AvatarKey;look:Look;onChange:(v:Look)=>void}){
 return <details className="dd-wardrobe"><summary>내 캐릭터 꾸미기 · 무료 로컬 체험</summary><div className="dd-wardrobe-body"><AvatarPreview avatar={avatar} look={look}/><div className="dd-wardrobe-fields">{(Object.keys(LOOK_OPTIONS) as (keyof Look)[]).map(k=><label key={k}>{labels[k]}<select value={look[k]} onChange={e=>onChange({...look,[k]:e.target.value})}>{LOOK_OPTIONS[k].map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label>)}<button type="button" className="dd3-btn" onClick={()=>onChange({...DEFAULT_LOOK})}>기본 외형으로</button></div></div><p>변경 사항은 현재 브라우저에 저장되며 3D 공간의 내 캐릭터에 적용됩니다. 실제 계정 동기화는 아직 없습니다.</p></details>
}
