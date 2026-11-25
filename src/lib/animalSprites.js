// Original 2D illustration drawn locally onto transparent canvases.
// World position and movement remain 3D; only the avatar artwork is a billboard.
import * as T from 'three'
const colors={cat:['#c79763','#f5e3c8'],santacat:['#b9b0a4','#f3e9db'],bear:['#b68a61','#f1dec2'],fox:['#c7794c','#f7e4d0'],rabbit:['#e3d5c3','#fff0e2'],owl:['#9b7a56','#f1e3c9'],squirrel:['#b17a4e','#f3dfc3'],penguin:['#414e54','#f5eddf'],dog:['#d0a578','#f4e5d0'],hamster:['#e0b78a','#f9edd7'],otter:['#9f785c','#e8d2b6'],raccoon:['#a39f97','#f1e9db'],deer:['#bb8c64','#f4e2c8'],panda:['#f0e9df','#fffaf0']}
const ink='#56463d'
const paintColor=value=>new T.Color(value).getStyle()
function draw(key,coat,direction,frame){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=320
 const c=canvas.getContext('2d');if(!c)throw Error('2D character canvas unavailable')
 c.scale(2,2);c.lineJoin='round';c.lineCap='round';c.lineWidth=1.65
 const [fur,cream]=colors[key]||colors.cat;const back=direction==='back';const side=direction==='left'||direction==='right';if(direction==='left'){c.translate(128,0);c.scale(-1,1)}
 const swing=frame===0?0:frame===1?-4:4
 function ellipse(x,y,rx,ry,fill,stroke=ink,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.stroke()}}
 function path(points,fill,stroke=ink){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.stroke()}}
 function line(points,stroke=ink,w=1.65){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.strokeStyle=stroke;c.lineWidth=w;c.stroke();c.lineWidth=1.65}
 function rect(x,y,w,h,r,fill,stroke=ink){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.stroke()}}
 // Feet, tail, clothes and paws. Each frame moves the legs, not just the full image.
 if(['cat','santacat','fox','squirrel','otter','raccoon','dog'].includes(key)){ellipse(back?55:90,114,key==='squirrel'?15:11,key==='squirrel'?25:16,fur,ink,.55);if(key==='fox')ellipse(97,101,7,9,cream,null,.55)}
 for(const [x,off] of [[52,swing],[76,-swing]]){line([[x,126],[x+off*.5,144+off*.4]],fur,11);ellipse(x+off*.5+2,147+off*.4,10,6,'#6c574b')}
 ellipse(39,112+swing*.5,9,17,coat,ink,.28);ellipse(89,112-swing*.5,9,17,coat,ink,-.28)
 ellipse(39,125+swing*.5,7,7,fur);ellipse(89,125-swing*.5,7,7,fur)
 rect(43,94,42,41,15,coat)
 if(!back){path([[48,96],[64,108],[80,96],[77,105],[64,115],[51,105]],cream);line([[64,115],[64,132]],ink,1);for(const y of [117,126])ellipse(67,y,1.8,1.8,'#dec18c',null)}
 else{line([[64,99],[64,130]],ink,1);line([[48,130],[80,130]],'#d9bd8e',1)}
 const hx=side?69:64,hy=69
 if(['cat','santacat','fox','squirrel'].includes(key)){path([[34,53],[33,24],[55,43]],fur);path([[94,53],[95,24],[73,43]],fur);path([[37,43],[37,31],[48,44]],'#d6a29b',null);path([[91,43],[91,31],[80,44]],'#d6a29b',null)}
 else if(key==='rabbit'){ellipse(49,33,10,25,fur,ink,-.13);ellipse(78,32,10,25,fur,ink,.13);ellipse(49,32,4,18,'#d6a29b',null,-.13);ellipse(78,31,4,18,'#d6a29b',null,.13)}
 else if(key==='dog'){ellipse(34,68,12,24,'#997153',ink,.25);ellipse(94,68,12,24,'#997153',ink,-.25)}
 else if(key==='deer'){ellipse(31,48,15,8,fur,ink,.45);ellipse(96,48,15,8,fur,ink,-.45);line([[48,46],[43,21],[34,13]],'#856244',4);line([[43,25],[53,15]],'#856244',3);line([[80,46],[85,21],[94,13]],'#856244',4);line([[85,25],[75,15]],'#856244',3)}
 else if(key!=='penguin'){for(const x of [34,94]){ellipse(x,44,12,12,key==='panda'?ink:fur);ellipse(x,44,6,6,cream,null)}}
 ellipse(hx,hy,35,33,fur)
 if(!back){
  if(key==='owl'||key==='penguin'){ellipse(hx,hy+4,26,26,cream,null)}
  else{ellipse(hx+(side?8:0),hy+15,20,13,cream,null);if(key==='fox'){ellipse(hx-17,hy+13,12,10,cream,null);ellipse(hx+17,hy+13,12,10,cream,null)}}
  const eyes=side?[hx+13]:[hx-13,hx+13]
  for(const x of eyes){if(['raccoon','panda'].includes(key))ellipse(x,hy-1,9,8,ink);ellipse(x,hy-1,3.7,4.7,['raccoon','panda'].includes(key)?cream:ink,null);if(!['raccoon','panda'].includes(key))ellipse(x-1,hy-3,1.1,1.1,'#fff7e5',null)}
  const mx=hx+(side?12:0)
  if(key==='penguin'||key==='owl'){path([[mx-5,hy+7],[mx+5,hy+7],[mx,hy+15]],'#d5a05e')}
  else{ellipse(mx,hy+7,4.3,3,ink,null);line([[mx,hy+10],[mx,hy+13],[mx-4,hy+15]],ink,1.2);line([[mx,hy+13],[mx+4,hy+15]],ink,1.2)}
  for(const x of side?[hx+24]:[hx-23,hx+23])ellipse(x,hy+8,5,3,'#d59c94',null)
  if(key==='cat'||key==='santacat'){line([[hx-32,hy+10],[hx-21,hy+12]],ink,1);line([[hx+21,hy+12],[hx+32,hy+10]],ink,1)}
 }else{line([[hx-15,hy-10],[hx,hy-14],[hx+15,hy-10]],cream,1.2)}
 if(key==='santacat'){path([[35,47],[54,14],[86,40],[94,48]],'#a45c60');rect(33,42,62,10,5,cream);ellipse(87,37,7,7,cream)}
 if(key==='owl'&&!back){for(const x of [hx-13,hx+13]){c.beginPath();c.arc(x,hy-1,10,0,Math.PI*2);c.strokeStyle='#b69862';c.stroke()}line([[hx-3,hy-1],[hx+3,hy-1]],'#b69862',1)}
 return canvas
}
export function createSpriteFactory(){
 const textures=new Map(),characters=new Set();const shadowGeo=new T.CircleGeometry(1,24);const shadowMat=new T.MeshBasicMaterial({color:0x48372a,transparent:true,opacity:.17,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1})
 function texture(key,coat,dir,frame){const id=[key,coat,dir,frame].join(':');if(!textures.has(id)){const t=new T.CanvasTexture(draw(key,coat,dir,frame));t.colorSpace=T.SRGBColorSpace;t.minFilter=T.LinearFilter;t.magFilter=T.LinearFilter;textures.set(id,t)}return textures.get(id)}
 function create(parent,key,coat='#718675'){
  coat=paintColor(coat);const g=new T.Group();g.userData.dynamic=true;parent.add(g)
  const m=new T.SpriteMaterial({map:texture(key,coat,'front',0),transparent:true,alphaTest:.08,depthWrite:true,depthTest:true,toneMapped:false})
  const sprite=new T.Sprite(m);sprite.center.set(.5,.04);sprite.scale.set(1.18,1.475,1);sprite.position.y=.025;g.add(sprite);const shadow=new T.Mesh(shadowGeo,shadowMat);shadow.rotation.x=-Math.PI/2;shadow.scale.set(.33,.22,1);shadow.position.y=.025;g.add(shadow)
  const char={g,sprite,key,coat,m};characters.add(char)
  char.update=(heading,walking,clock,cameraAngle,reduced)=>{const relative=heading-cameraAngle;const side=Math.abs(Math.sin(relative))>.65;const dir=side?(Math.sin(relative)<0?'left':'right'):Math.cos(relative)<0?'back':'front';const frame=walking&&!reduced?1+Math.floor(clock*8)%2:0;const t=texture(key,coat,dir,frame);if(m.map!==t)m.map=t;sprite.scale.x=1.18;sprite.position.y=.025}
  char.dispose=()=>{g.removeFromParent();m.dispose();characters.delete(char)}
  return char
 }
 return {create,dispose(){for(const ch of [...characters])ch.dispose();for(const t of textures.values())t.dispose();textures.clear();shadowGeo.dispose();shadowMat.dispose()}}
}
