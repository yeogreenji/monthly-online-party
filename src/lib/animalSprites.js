// Original 2D illustration drawn locally onto transparent canvases.
// World position and movement remain 3D; only the avatar artwork is a billboard.
import * as T from 'three'
const colors={cat:['#c79763','#f5e3c8'],santacat:['#b9b0a4','#f3e9db'],bear:['#b68a61','#f1dec2'],fox:['#c7794c','#f7e4d0'],rabbit:['#e3d5c3','#fff0e2'],owl:['#9b7a56','#f1e3c9'],squirrel:['#b17a4e','#f3dfc3'],penguin:['#414e54','#f5eddf'],dog:['#d0a578','#f4e5d0'],hamster:['#e0b78a','#f9edd7'],otter:['#9f785c','#e8d2b6'],raccoon:['#a39f97','#f1e9db'],deer:['#bb8c64','#f4e2c8'],panda:['#f0e9df','#fffaf0']}
const ink='#70505b'
const paintColor=value=>new T.Color(value).getStyle()
function draw(key,coat,direction,frame,look={}){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=320
 const c=canvas.getContext('2d');if(!c)throw Error('2D character canvas unavailable')
 c.scale(2,2);c.lineJoin='round';c.lineCap='round';c.lineWidth=1.25
 const [natural,cream]=colors[key]||colors.cat;const fur=look.fur&&look.fur!=='natural'?look.fur:natural;const back=direction==='back';const side=direction==='left'||direction==='right';if(direction==='left'){c.translate(128,0);c.scale(-1,1)}
 const sitting=frame===3;const swing=frame===0||sitting?0:frame===1?-4:4
 function ellipse(x,y,rx,ry,fill,stroke=ink,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.stroke()}}
 function path(points,fill,stroke=ink){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.stroke()}}
 function line(points,stroke=ink,w=1.65){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.strokeStyle=stroke;c.lineWidth=w;c.stroke();c.lineWidth=1.65}
 function rect(x,y,w,h,r,fill,stroke=ink){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.stroke()}}
 // Round chibi silhouette: compact body, large head, soft illustrated shading.
 c.save();c.translate(0,49);c.scale(1,.69);
 if(['cat','santacat','fox','squirrel','otter','raccoon','dog'].includes(key)){ellipse(back?55:90,114,key==='squirrel'?15:11,key==='squirrel'?25:16,fur,ink,.55);if(key==='fox')ellipse(97,101,7,9,cream,null,.55)}
 for(const [x,off] of [[52,swing],[76,-swing]]){if(sitting){line([[x,125],[x+(x<64?-5:5),133]],fur,11);ellipse(x+(x<64?-5:5),138,12,7,look.shoes||'#6c574b')}else{line([[x,126],[x+off*.5,144+off*.4]],fur,11);ellipse(x+off*.5+2,147+off*.4,10,6,look.shoes||'#6c574b')}}
 ellipse(39,112+swing*.5,9,17,coat,ink,.28);ellipse(89,112-swing*.5,9,17,coat,ink,-.28)
 ellipse(39,125+swing*.5,7,7,fur);ellipse(89,125-swing*.5,7,7,fur)
 rect(43,94,42,41,15,coat)
 if(look.style==='dress')path([[49,111],[79,111],[92,136],[36,136]],coat)
 if(look.style==='knit'){for(const y of [111,117,123,129])line([[46,y],[82,y]],cream,.8)}
 if(look.style==='overalls'){rect(49,108,30,27,4,'#687c91');line([[51,95],[53,112]],'#687c91',5);line([[77,95],[75,112]],'#687c91',5);rect(58,116,12,9,2,coat)}
 if((!look.style||look.style==='coat')&&!back){path([[48,96],[64,108],[80,96],[77,105],[64,115],[51,105]],cream);line([[64,115],[64,132]],ink,1);for(const y of [117,126])ellipse(67,y,1.8,1.8,'#dec18c',null)}
 else if(back&&(!look.style||look.style==='coat')){line([[64,99],[64,130]],ink,1);line([[48,130],[80,130]],'#d9bd8e',1)}
 // Distinct garment patterns in a clipped patch inside the outfit; all directions and poses.
 if(look.fabric&&look.fabric!=='plain'){
  c.save();c.beginPath();c.roundRect(47,116,34,14,4);c.clip()
  if(look.fabric==='dots')for(let x=49;x<82;x+=8)for(let y=119;y<131;y+=7)ellipse(x,y,1.4,1.4,'#f0dfc3',null)
  else if(look.fabric==='check'){for(let x=49;x<82;x+=8)line([[x,116],[x,130]],'#dac3a4',1);for(let y=118;y<132;y+=6)line([[47,y],[81,y]],'#dac3a4',1)}
  else if(look.fabric==='stitch'){for(let x=48;x<79;x+=5)line([[x,127],[x+2,124]],'#f0dfc3',1.4)}
  c.restore()
 }
 c.restore();
 const hx=side?69:64,hy=68
 if(['cat','santacat','fox','squirrel'].includes(key)){path([[34,53],[33,24],[55,43]],fur);path([[94,53],[95,24],[73,43]],fur);path([[37,43],[37,31],[48,44]],'#d6a29b',null);path([[91,43],[91,31],[80,44]],'#d6a29b',null)}
 else if(key==='rabbit'){ellipse(49,33,10,25,fur,ink,-.13);ellipse(78,32,10,25,fur,ink,.13);ellipse(49,32,4,18,'#d6a29b',null,-.13);ellipse(78,31,4,18,'#d6a29b',null,.13)}
 else if(key==='dog'){ellipse(34,68,12,24,'#997153',ink,.25);ellipse(94,68,12,24,'#997153',ink,-.25)}
 else if(key==='deer'){ellipse(31,48,15,8,fur,ink,.45);ellipse(96,48,15,8,fur,ink,-.45);line([[48,46],[43,21],[34,13]],'#856244',4);line([[43,25],[53,15]],'#856244',3);line([[80,46],[85,21],[94,13]],'#856244',4);line([[85,25],[75,15]],'#856244',3)}
 else if(key!=='penguin'){for(const x of [34,94]){ellipse(x,44,12,12,key==='panda'?ink:fur);ellipse(x,44,6,6,cream,null)}}
 ellipse(hx,hy,42,37,fur);ellipse(hx-9,hy-15,22,12,'#ffffff25',null,-.18)
 if(look.pattern==='stripe'){for(const x of [hx-9,hx,hx+9])line([[x,hy-29],[x,hy-21]],ink,2.6)}
 else if(look.pattern==='blaze')ellipse(hx,hy-24,5,9,cream,null)
 else if(look.pattern==='spot')ellipse(hx+12,hy-23,8,6,'#997153',null,.25)
 if(!back){
  if(key==='owl'||key==='penguin'){ellipse(hx,hy+4,26,26,cream,null)}
  else{ellipse(hx+(side?8:0),hy+15,20,13,cream,null);if(key==='fox'){ellipse(hx-17,hy+13,12,10,cream,null);ellipse(hx+17,hy+13,12,10,cream,null)}}
  const eyes=side?[hx+13]:[hx-13,hx+13]
  for(const x of eyes){if(['raccoon','panda'].includes(key))ellipse(x,hy-1,9,8,ink);if(look.eyes==='smile'){c.beginPath();c.arc(x,hy+2,4,Math.PI,2*Math.PI);c.strokeStyle=['raccoon','panda'].includes(key)?cream:ink;c.stroke()}else{ellipse(x,hy-1,4.9,look.eyes==='sleepy'?2.1:6.2,['raccoon','panda'].includes(key)?cream:ink,null);if(!['raccoon','panda'].includes(key)&&look.eyes!=='sleepy')ellipse(x-1.6,hy-3.4,1.7,1.7,'#fff7e5',null)}}
  const mx=hx+(side?12:0)
  if(key==='penguin'||key==='owl'){path([[mx-5,hy+7],[mx+5,hy+7],[mx,hy+15]],'#d5a05e')}
  else{ellipse(mx,hy+7,3.7,2.6,ink,null);line([[mx,hy+10],[mx,hy+13],[mx-4,hy+15]],ink,1.2);line([[mx,hy+13],[mx+4,hy+15]],ink,1.2)}
  for(const x of side?[hx+24]:[hx-23,hx+23])ellipse(x,hy+10,6,3.7,'#ed9aa5',null)
  if(key==='cat'||key==='santacat'){line([[hx-32,hy+10],[hx-21,hy+12]],ink,1);line([[hx+21,hy+12],[hx+32,hy+10]],ink,1)}
 }else{line([[hx-15,hy-10],[hx,hy-14],[hx+15,hy-10]],cream,1.2)}
 if(key==='santacat'){path([[35,47],[54,14],[86,40],[94,48]],'#a45c60');rect(33,42,62,10,5,cream);ellipse(87,37,7,7,cream)}
 if(key==='owl'&&!back){for(const x of [hx-13,hx+13]){c.beginPath();c.arc(x,hy-1,10,0,Math.PI*2);c.strokeStyle='#b69862';c.stroke()}line([[hx-3,hy-1],[hx+3,hy-1]],'#b69862',1)}
 // Hats are independent from neck and hand accessories, placed over the head.
 if(look.hat==='beret'){ellipse(hx-6,hy-33,26,10,'#9c5d66',ink,-.12);line([[hx-5,hy-43],[hx-3,hy-47]],ink,2)}
 else if(look.hat==='ribbon'){path([[hx+12,hy-30],[hx+3,hy-38],[hx+1,hy-26],[hx+12,hy-29],[hx+24,hy-37],[hx+25,hy-26]],'#b7819b');ellipse(hx+12,hy-30,3,3,'#d9b27a')}
 else if(look.hat==='beanie'){ellipse(hx,hy-32,22,13,'#687e91');rect(hx-23,hy-33,46,9,4,'#c6bca4');ellipse(hx,hy-47,6,6,'#c6bca4')}
 else if(look.hat==='flower'){for(let i=0;i<5;i++){const angle=i*Math.PI*2/5;ellipse(hx+18+Math.cos(angle)*5,hy-27+Math.sin(angle)*5,4,4,'#f0d6a0',ink)}ellipse(hx+18,hy-27,3,3,'#a76f52')}
 c.save();c.translate(0,49);c.scale(1,.69);
 if(look.accessory==='scarf'){rect(43,96,42,9,4,'#b78170');rect(back?45:72,103,9,18,2,'#b78170')}
 if(look.accessory==='bow'){path([[64,102],[51,96],[51,108],[64,104],[77,96],[77,108]],'#b7819b');ellipse(64,103,3,3,'#d9b27a')}
 if(look.accessory==='glasses'&&!back){for(const x of side?[hx+13]:[hx-13,hx+13]){c.beginPath();c.arc(x,hy-1,9,0,Math.PI*2);c.strokeStyle='#6b5140';c.stroke()}if(!side)line([[hx-4,hy-1],[hx+4,hy-1]],'#6b5140',1.4)}
 if(look.accessory==='bag'){line([[45,97],[86,126]],'#896446',3);rect(78,120,21,19,4,'#b99773');line([[81,126],[96,126]],ink,1)}
 c.restore();
 return canvas
}
export function drawAvatarPreview(key,look){return draw(key,look.coat,'front',0,look)}
export function createSpriteFactory(){
 const textures=new Map(),characters=new Set();const shadowGeo=new T.CircleGeometry(1,24);const shadowMat=new T.MeshBasicMaterial({color:0x48372a,transparent:true,opacity:.17,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1})
 function texture(key,coat,dir,frame){const id=[key,coat,dir,frame].join(':');if(!textures.has(id)){const t=new T.CanvasTexture(draw(key,coat,dir,frame));t.colorSpace=T.SRGBColorSpace;t.minFilter=T.LinearFilter;t.magFilter=T.LinearFilter;textures.set(id,t)}return textures.get(id)}
 function create(parent,key,coat='#718675',look=null){
  const privateTextures=new Map();function getTexture(dir,frame){if(!look)return texture(key,coat,dir,frame);const id=dir+':'+frame;if(!privateTextures.has(id)){const t=new T.CanvasTexture(draw(key,coat,dir,frame,look));t.colorSpace=T.SRGBColorSpace;t.minFilter=T.LinearFilter;t.magFilter=T.LinearFilter;privateTextures.set(id,t)}return privateTextures.get(id)}
  coat=paintColor(coat);const g=new T.Group();g.userData.dynamic=true;parent.add(g)
  const m=new T.SpriteMaterial({map:getTexture('front',0),transparent:true,alphaTest:.08,depthWrite:true,depthTest:true,toneMapped:false})
  const sprite=new T.Sprite(m);sprite.center.set(.5,.04);sprite.scale.set(.91,1.16,1);sprite.position.y=.025;g.add(sprite);const shadow=new T.Mesh(shadowGeo,shadowMat);shadow.rotation.x=-Math.PI/2;shadow.scale.set(.33,.22,1);shadow.position.y=.025;g.add(shadow)
  const char={g,sprite,key,coat,m};characters.add(char)
  char.update=(heading,walking,clock,cameraAngle,reduced,seated=false)=>{const relative=heading-cameraAngle;const side=Math.abs(Math.sin(relative))>.65;const dir=side?(Math.sin(relative)<0?'left':'right'):Math.cos(relative)<0?'back':'front';const frame=seated?3:walking&&!reduced?1+Math.floor(clock*8)%2:0;const t=getTexture(dir,frame);if(m.map!==t)m.map=t;sprite.scale.set(.91,seated?1.02:1.16,1);sprite.position.y=seated?-.17:.025;shadow.visible=!seated}
  char.dispose=()=>{g.removeFromParent();m.dispose();for(const t of privateTextures.values())t.dispose();privateTextures.clear();characters.delete(char)}
  return char
 }
 return {create,dispose(){for(const ch of [...characters])ch.dispose();for(const t of textures.values())t.dispose();textures.clear();shadowGeo.dispose();shadowMat.dispose()}}
}
