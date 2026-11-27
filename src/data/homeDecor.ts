export type HomeItem={id:string;kind:string;color:string;x:number;z:number;rotation:number}
export type HomeDecor={intro:string;wallpaper:string;furniture:string;pet:string;accessory:string;visibility:'private'|'friends'|'public';floor:string;furnitureColor:string;slotX:number;slotZ:number;slotRotation:number;rug:string;lamp:boolean;items:HomeItem[];itemsVersion?:number}
export const HOME_DEFAULT:HomeDecor={intro:'',wallpaper:'#f3dfc8',furniture:'🛋️',pet:'🐈',accessory:'🎀',visibility:'private',floor:'#e8b98a',furnitureColor:'#ef97b5',slotX:-3.4,slotZ:-.2,slotRotation:0,rug:'#efb5cf',lamp:true,items:[]}
export const WALLS=[['#f3dfc8','크림'],['#d7e4ca','숲'],['#ead1de','분홍'],['#cddbe9','하늘'],['#d8c7f0','라벤더'],['#ffe3a8','레몬'],['#c1e6df','민트'],['#e8baa9','피치'],['#aabbd9','블루'],['#f3efe8','아이보리'],['#bcd8c9','유칼립투스'],['#f3b9c6','딸기'],['#ded1c0','샌드'],['#a9cde9','소다'],['#d9bde2','모브'],['#efc69e','살구']]
export const FLOORS=[['#e8b98a','허니 우드'],['#c89570','월넛'],['#f3e1ca','화이트 오크'],['#b2c5b5','세이지'],['#d3c6e5','라일락'],['#b69b86','스모크 오크'],['#e8c5c8','로즈 타일'],['#a4b9ce','블루 그레이']]
export const FABRICS=[['#ef97b5','로즈'],['#4d9e93','청록'],['#bca1e4','라일락'],['#f5ca73','버터'],['#6d93cd','블루'],['#fbefe0','크림'],['#c96755','테라코타'],['#bd465b','체리'],['#374f79','잉크 블루'],['#f3b47c','피치'],['#c5d9a6','피스타치오'],['#9e718e','베리']]
export const FURNITURE=[['🛋️','소파'],['🛏️','낮잠 침대'],['🪑','암체어'],['📚','책장'],['table','티 테이블'],['plant','식물 선반'],['desk','작업 책상'],['loveseat','러브시트'],['daybed','데이베드'],['cabinet','유리 장식장'],['vanity','화장대'],['floorlamp','스탠드 조명'],['pouf','원형 푸프'],['dresser','서랍장'],['piano','그랜드 피아노'],['mirror','전신 거울'],['sidetable','사이드 테이블'],['teaset','다과 테이블'],['clock','괘종시계'],['easel','그림 이젤'],['rug','러그'],['cushion','쿠션'],['screen','병풍'],['stool','스툴'],['shelf','벽 선반'],['none','비우기']]
export function normalizeHome(v:unknown):HomeDecor{const d=v&&typeof v==='object'?v as Partial<HomeDecor>:{};const color=(s:unknown,f:string)=>typeof s==='string'&&/^#[0-9a-f]{6}$/i.test(s)?s:f;const num=(x:unknown,f:number,min:number,max:number)=>typeof x==='number'&&Number.isFinite(x)?Math.min(max,Math.max(min,x)):f;return {...HOME_DEFAULT,...d,intro:typeof d.intro==='string'?d.intro.slice(0,160):'',wallpaper:color(d.wallpaper,HOME_DEFAULT.wallpaper),floor:color(d.floor,HOME_DEFAULT.floor),rug:color(d.rug,HOME_DEFAULT.rug),furnitureColor:color(d.furnitureColor,HOME_DEFAULT.furnitureColor),furniture:FURNITURE.some(([id])=>id===d.furniture)?d.furniture!:HOME_DEFAULT.furniture,slotX:num(d.slotX,-3.4,-4.1,-1.7),slotZ:num(d.slotZ,-.2,-1.05,.55),slotRotation:num(d.slotRotation,0,0,270),lamp:d.lamp!==false,items:normalizeItems(d),itemsVersion:1}}

const BASE_ITEMS:HomeItem[]=[{id:'home-bed',kind:'🛏️',color:'#ef97b5',x:-3.30,z:2.30,rotation:0},{id:'home-sofa',kind:'🛋️',color:'#bca1e4',x:3.10,z:2.70,rotation:0},{id:'home-table',kind:'table',color:'#f5ca73',x:2.70,z:.40,rotation:0},{id:'home-shelf',kind:'📚',color:'#c96755',x:-3.90,z:-.60,rotation:0}]
export function normalizeItems(d:Partial<HomeDecor>):HomeItem[]{if(!Array.isArray(d.items)||d.items.length===0&&!(d as unknown as {itemsVersion?:number}).itemsVersion){const legacy=d.furniture==='none'?[]:[{id:'home-legacy',kind:FURNITURE.some(([id])=>id===d.furniture)?d.furniture!:'🛋️',color:d.furnitureColor||'#ef97b5',x:d.slotX??-3.4,z:d.slotZ??-.2,rotation:d.slotRotation??0}];return [...BASE_ITEMS,...legacy]}const ids=new Set<string>();return d.items.slice(0,18).filter(i=>i&&typeof i.id==='string'&&!ids.has(i.id)&&ids.add(i.id)&&FURNITURE.some(([id])=>id===i.kind&&id!=='none')).map(i=>({...i,color:/^#[0-9a-f]{6}$/i.test(i.color)?i.color:'#ef97b5',x:Number.isFinite(i.x)?Math.max(-4.3,Math.min(4.3,i.x)):0,z:Number.isFinite(i.z)?Math.max(-3.8,Math.min(3.8,i.z)):0,rotation:[0,90,180,270].includes(i.rotation)?i.rotation:0}))}
const FOOTPRINTS:Record<string,[number,number]>={'🛏️':[.78,1.05],'daybed':[.78,1.05],'🛋️':[.98,.55],'loveseat':[.76,.52],'🪑':[.50,.52],'📚':[.68,.38],'cabinet':[.66,.36],'plant':[.66,.36],'dresser':[.70,.38],'desk':[.78,.40],'vanity':[.80,.40],'table':[.64,.64],'piano':[1.02,.56],'mirror':[.54,.20],'sidetable':[.34,.34],'teaset':[.58,.44],'clock':[.30,.26],'easel':[.48,.32],'rug':[1.30,1.30],'cushion':[.42,.42],'screen':[.94,.20],'stool':[.32,.32],'shelf':[.72,.22]}
export function footprint(i:HomeItem):[number,number]{const [w,z]=FOOTPRINTS[i.kind]??[.50,.50];return i.rotation%180===0?[w,z]:[z,w]}
export function isFlat(i:HomeItem){return i.kind==='rug'}
export function canPlace(item:HomeItem,items:HomeItem[]){const [w,z]=footprint(item);if(Math.abs(item.x)+w*.72>5.02||Math.abs(item.z)+z*.72>4.55)return false;if(isFlat(item))return true;const fixed=[{x:3.65,z:-2.1,w:.8,d:.5},{x:-3.7,z:-2.3,w:.6,d:.35},{x:3.75,z:-3.6,w:.5,d:.4},{x:0,z:3.8,w:.7,d:.35},{x:4.3,z:3.4,w:.3,d:.3},{x:1.15,z:3.65,w:.3,d:.3},{x:0,z:-3.9,w:1,d:.55}];const hit=(ax:number,az:number,aw:number,ad:number,bx:number,bz:number,bw:number,bd:number)=>Math.abs(ax-bx)<(aw+bw)*.52+.06&&Math.abs(az-bz)<(ad+bd)*.52+.06;return !fixed.some(v=>hit(v.x,v.z,v.w*1.3,v.d*1.3,item.x,item.z,w,z))&&!items.some(v=>{if(v.id===item.id||isFlat(v))return false;const [vw,vz]=footprint(v);return hit(v.x,v.z,vw,vz,item.x,item.z,w,z)})}
export function newHomeItem(kind:string,color:string,items:HomeItem[]):HomeItem|null{const id='home-item-'+(globalThis.crypto?.randomUUID?.()??Date.now().toString(36));for(const z of [-1.9,-.4,1.1,2.6,3.6])for(const x of [-2.0,0,2.0,-3.6,3.6])for(const rotation of [0,90]){const item={id,kind,color,x,z,rotation};if(canPlace(item,items))return item}return null}

export function fitReplacement(item: HomeItem, items: HomeItem[]): HomeItem | null {
  if (canPlace(item, items)) return item
  let best: HomeItem | null = null
  let bestDistance = Infinity
  for (let z = -3.75; z <= 3.75; z += .25) {
    for (let x = -4.25; x <= 4.25; x += .25) {
      const distance = (x - item.x) ** 2 + (z - item.z) ** 2
      if (distance >= bestDistance) continue
      const next = { ...item, x, z }
      if (canPlace(next, items)) {
        best = next
        bestDistance = distance
      }
    }
  }
  return best
}
