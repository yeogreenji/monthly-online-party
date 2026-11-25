import * as T from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { createSpriteFactory } from './animalSprites.js'
const palette={wood:0xa98260,cream:0xf1dfbd,brass:0xc2a16a,green:0x647b65,red:0x96565c,dark:0x51443d,blue:0x60778a}
const skin={cat:[0xc79763,0xf5e3c8],santacat:[0xb9b0a4,0xf3e9db],bear:[0xb68a61,0xf1dec2],fox:[0xc7794c,0xf7e4d0],rabbit:[0xe3d5c3,0xfff0e2],owl:[0x9b7a56,0xf1e3c9],squirrel:[0xb17a4e,0xf3dfc3],penguin:[0x414e54,0xf5eddf],dog:[0xd0a578,0xf4e5d0],hamster:[0xe0b78a,0xf9edd7],otter:[0x9f785c,0xe8d2b6],raccoon:[0xa39f97,0xf1e9db],deer:[0xbb8c64,0xf4e2c8],panda:[0xf0e9df,0xfffaf0]}
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v))
export function createWorld(host,opts){
 const scene=new T.Scene();scene.background=new T.Color('#dfd1bc')
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'})
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.domElement.setAttribute('aria-label','딩동 3D 저택');renderer.domElement.tabIndex=0;host.appendChild(renderer.domElement)
 const camera=new T.PerspectiveCamera(42,1,.1,100)
 scene.add(new T.HemisphereLight(0xfff2dc,0x8e796a,2.0))
 const sun=new T.DirectionalLight(0xffebce,2.6);sun.position.set(-10,18,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-23,right:23,top:18,bottom:-18,near:.5,far:55});sun.shadow.bias=-.0004;scene.add(sun)
 const mat=new Map(),geo=new Map()
 function material(color){if(!mat.has(color))mat.set(color,new T.MeshStandardMaterial({color,roughness:.8,metalness:0}));return mat.get(color)}
 function geometry(kind){if(!geo.has(kind))geo.set(kind,kind==='sphere'?new T.SphereGeometry(1,20,14):kind==='cone'?new T.ConeGeometry(1,1,18):kind==='cylinder'?new T.CylinderGeometry(1,1,1,18):new T.BoxGeometry(1,1,1));return geo.get(kind)}
 function shape(parent,kind,color,x,y,z,w,h,d,shadow=true){const m=new T.Mesh(geometry(kind),material(color));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m}
 const box=(p,c,x,y,z,w,h,d)=>shape(p,'box',c,x,y,z,w,h,d)
 const ball=(p,c,x,y,z,w,h,d)=>shape(p,'sphere',c,x,y,z,w,h,d)
 const cyl=(p,c,x,y,z,r,h)=>shape(p,'cylinder',c,x,y,z,r,h,r)
 const cone=(p,c,x,y,z,r,h)=>shape(p,'cone',c,x,y,z,r,h,r)
 function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g}
 const hit=[],rooms=new Map(),labels=[]
 function sign(parent,text,x,y,z){const c=document.createElement('canvas');c.width=512;c.height=112;const ctx=c.getContext('2d');if(!ctx)return;ctx.fillStyle='#473a32';ctx.fillRect(4,4,504,104);ctx.strokeStyle='#d6b77d';ctx.lineWidth=7;ctx.strokeRect(7,7,498,98);ctx.font='bold 38px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff1d7';ctx.fillText(text,256,56,470);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const m=new T.SpriteMaterial({map:texture,depthTest:true,transparent:true});const s=new T.Sprite(m);s.scale.set(2.7,.59,1);s.position.set(x,y,z);parent.add(s);labels.push(s);return s}
 function chair(p,x,z,color=palette.green){box(p,color,x,.44,z,.85,.25,.8);box(p,color,x,.83,z+.34,.85,.75,.23);for(const dx of [-.3,.3])for(const dz of [-.26,.26])box(p,palette.dark,x+dx,.19,z+dz,.11,.38,.11)}
 function couch(p,x,z,color){box(p,color,x,.42,z,1.65,.45,.76);box(p,color,x,.78,z+.31,1.65,.64,.22);for(const dx of [-.77,.77])box(p,color,x+dx,.65,z,.23,.52,.85);box(p,palette.cream,x-.42,.78,z+.12,.42,.42,.18);box(p,palette.brass,x+.36,.76,z+.12,.4,.4,.2)}
 function table(p,x,z,kind='tea'){cyl(p,palette.wood,x,.27,z,.1,.54);cyl(p,0xd1ab81,x,.56,z,.66,.16);if(kind==='tea'){cyl(p,palette.cream,x-.21,.68,z,.12,.14);cyl(p,0xb88478,x+.2,.67,z,.19,.15);cyl(p,palette.cream,x+.2,.76,z,.2,.04)}else if(kind==='party'){box(p,palette.red,x+.23,.74,z,.35,.25,.35);box(p,palette.brass,x+.23,.88,z,.09,.035,.35);cyl(p,palette.brass,x-.2,.78,z,.05,.33);ball(p,0xf4b56d,x-.2,.99,z,.06,.12,.06)}else{box(p,palette.cream,x,.66,z,.86,.035,.65);for(let j=0;j<4;j++)box(p,j%2?palette.green:palette.red,x-.3+j*.2,.7,z+(j%2?.15:-.15),.12,.09,.12)}}
 function shelf(p,x,z,kind='books'){box(p,palette.wood,x,1,z,1.25,1.95,.45);box(p,0xd7bc98,x,1,z-.245,1.05,1.8,.03);for(let i=0;i<3;i++){box(p,palette.dark,x,.25+i*.62,z-.16,1.15,.06,.49);for(let j=0;j<5;j++){const c=[palette.red,palette.green,palette.brass,palette.blue,0xae8e9c][j];if(kind==='records'){const r=cyl(p,palette.dark,x-.4+j*.2,.48+i*.62,z-.26,.16,.05);r.rotation.x=Math.PI/2}else box(p,c,x-.4+j*.2,.48+i*.62,z-.23,.13,.39,.27)}}}
 function tree(p,x,z){cyl(p,palette.wood,x,.26,z,.16,.52);for(let i=0;i<3;i++)cone(p,i%2?0x728e70:0x54735a,x,.7+i*.48,z,.8-i*.17,1.05);for(let i=0;i<9;i++){const a=i*2.4;ball(p,i%2?palette.brass:palette.red,x+Math.cos(a)*.42,1+(i%3)*.42,z+Math.sin(a)*.42,.075,.075,.075)}ball(p,palette.brass,x,2.28,z,.12,.19,.12)}
 function lamp(p,x,z){cyl(p,palette.brass,x,.08,z,.22,.12);cyl(p,palette.brass,x,.9,z,.035,1.7);cone(p,palette.cream,x,1.77,z,.32,.45)}
 function gift(p,x,z){box(p,palette.red,x,.18,z,.5,.36,.45);box(p,palette.cream,x,.37,z,.1,.03,.45);box(p,palette.cream,x,.37,z,.5,.03,.1)}
 function plant(p,x,z){cyl(p,palette.wood,x,.2,z,.21,.4);for(let i=0;i<5;i++){const a=i*1.8;const l=ball(p,palette.green,x+Math.sin(a)*.16,.53+(i%2)*.16,z+Math.cos(a)*.16,.12,.31,.08);l.rotation.z=Math.sin(a)*.6}}
 const spriteFactory=createSpriteFactory(),residentSprites=[]
 function animal(parent,key,coat=palette.green,look=null){return spriteFactory.create(parent,key,coat,look)}
 // A single connected floor plan: six rooms on either side of a continuous central corridor.
 box(scene,0xb49b81,0,-.18,0,38,.3,16.5);box(scene,0xc8aa83,0,.01,0,37,.08,3.7)
 for(let x=-17;x<=17;x+=1.3)box(scene,0x9d795d,x,.066,0,.028,.012,3.6)
 box(scene,palette.red,0,.08,0,35,.025,1.3);box(scene,palette.brass,0,.1,.68,35,.018,.035);box(scene,palette.brass,0,.1,-.68,35,.018,.035)
 for(const x of [-12,-6,0,6,12]){for(const z of [-1.7,1.7]){cyl(scene,palette.brass,x,.77,z,.055,1.5);ball(scene,0xffdca0,x,1.6,z,.14,.19,.14)}}
 const ordered=['season','jazz','cafe','plaza','travel','hobby','cinema','games','women','men','single','home']
 for(let i=0;i<ordered.length;i++){
  const s=opts.spaces.find(v=>v.id===ordered[i]);if(!s)continue;const side=i<6?-1:1, x=((i%6)-2.5)*6, centerZ=side*5.1
  const p=group(scene,x,0,centerZ);if(side<0)p.rotation.y=Math.PI
  box(p,s.wall,0,.03,0,5.55,.13,6.3)
  for(let k=-2.5;k<2.6;k+=.55)box(p,0xb79879,k,.105,0,.025,.01,6.15)
  box(p,s.door,0,.19,2.99,5.65,.36,.16);box(p,s.wall,0,.79,2.99,5.65,1.12,.14)
  for(const dx of [-2.75,2.75]){box(p,s.wall,dx,.61,0,.15,1.22,6.1);box(p,palette.wood,dx,1.24,0,.22,.09,6.18)}
  for(const dx of [-1.83,1.83]){box(p,s.wall,dx,.55,-3.02,1.83,1.1,.18);box(p,palette.wood,dx,1.12,-3.02,1.86,.08,.22)}
  box(p,palette.wood,0,.115,0,2.4,.035,2.8)
  box(p,palette.cream,0,.14,0,2.2,.025,2.6)
  // Hinged door: room local -z faces the shared hall.
  for(const dx of [-.9,.9])box(p,palette.wood,dx,1.05,-3.02,.16,2.1,.22)
  box(p,palette.wood,0,2.09,-3.02,1.96,.17,.22)
  const hinge=group(p,-.81,.06,-3.02);hinge.userData.dynamic=true;hinge.userData.target=0;const leaf=box(hinge,s.door,.81,1,0,1.62,2,.16);box(hinge,palette.brass,1.39,1.02,-.13,.1,.1,.12);box(hinge,palette.cream,.81,1.52,-.09,1.12,.035,.035);leaf.userData.room=s.id;hit.push(leaf)
  const label=sign(p,s.name+(opts.access?.(s.id)==='locked'?' · 잠금':opts.access?.(s.id)==='coming'?' · 준비중':''),0,2.53,-3.15);if(label){label.userData.room=s.id;hit.push(label)}
  // Each room has a distinct floor plan and movable visitor aisle.
  const k=s.id
  if(k==='plaza'){cyl(p,0xb6a58e,0,.21,1.85,.92,.36);cyl(p,0x89aeb7,0,.42,1.85,.75,.07);cyl(p,palette.cream,0,.65,1.85,.12,.53);ball(p,0x9dbec4,0,.98,1.85,.22,.08,.22);box(p,palette.wood,-1.8,.52,1.1,1.25,1.02,.6);sign(p,'벨의 안내소',-1.8,1.6,1.1);couch(p,1.7,.8,0x8b9d7d);plant(p,-2.1,2.3);plant(p,2.1,2.3)}
  else if(k==='season'){tree(p,-1.8,1.55);gift(p,-1.25,2.1);gift(p,-2.1,.75);table(p,1.6,1.25,'party');lamp(p,2.15,-.7);if(k==='season'){box(p,0x96766b,0,.55,2.75,1.5,1.1,.42);box(p,palette.dark,0,.38,2.5,.92,.58,.1);ball(p,0xe5a358,0,.39,2.42,.2,.27,.11);box(p,0xe7cfaa,0,1.18,2.66,1.8,.12,.6);box(p,0x647b65,0,1.42,2.66,.85,.14,.18);for(const x of [-.47,0,.47]){cyl(p,0xf0d8ae,x,1.42,2.53,.04,.28);ball(p,0xf7c16d,x,1.59,2.53,.04,.075,.04)}box(p,0x71695d,1.65,1.35,2.96,1.45,1.5,.08);box(p,0x7594aa,1.65,1.35,2.89,1.28,1.32,.04);for(const x of [1.65])box(p,0xe5d0ab,x,1.35,2.84,.07,1.32,.06);box(p,0xe5d0ab,1.65,1.35,2.84,1.28,.07,.06);for(let n=0;n<9;n++)ball(p,0xf1ede5,1.1+(n%3)*.47,.85+Math.floor(n/3)*.42,2.85,.035,.035,.02);box(p,0xd9c19f,1.65,.64,2.83,1.55,.13,.27);const warm=new T.PointLight(0xffb66c,5,7,2);warm.position.set(0,1.35,1.95);p.add(warm);const glow=new T.PointLight(0xffdb9b,2.3,6,2);glow.position.set(-1.8,2.3,1.55);p.add(glow)}}
  else if(k==='jazz'){shelf(p,-1.95,2.45,'records');couch(p,1.55,1.95,0x786674);table(p,1.5,.3);lamp(p,-2.1,-.7);box(p,palette.dark,-1.8,.7,1.1,1.15,1.4,.5)}
  else if(k==='cafe'){box(p,palette.wood,-1.9,.57,1.2,1.2,1.14,2.45);box(p,0xd7b48d,-1.9,1.18,1.2,1.35,.14,2.55);box(p,palette.blue,-1.9,1.44,1.95,.85,.45,.75);for(let j=0;j<3;j++)cyl(p,0xc99583,-1.9,1.36,.25+j*.43,.15,.19);table(p,1.7,.65);chair(p,1.7,1.65,0x9ca58d);plant(p,2.2,-.85)}
  else if(k==='travel'){shelf(p,-1.9,2.45);box(p,0xdcc7a5,0,1.25,2.91,2.3,.65,.06);for(let j=0;j<4;j++)box(p,0x839b7d,-.85+j*.55,1.22+(j%2)*.13,2.86,.4,.3,.07);table(p,1.7,1.25,'map');box(p,palette.red,-1.8,.3,.4,.78,.6,.45);plant(p,2.2,2.3)}
  else if(k==='women'||k==='single'){couch(p,-1.65,1.85,k==='women'?0xb5818b:0x9c737b);couch(p,1.65,1.85,k==='women'?0xbca892:0x9c737b);table(p,1.65,.1);lamp(p,-2.1,-.5);plant(p,2.2,-.6);if(k==='single')box(p,palette.cream,-1.7,.7,.2,.45,.035,.3)}
  else if(k==='games'||k==='men'){shelf(p,-1.9,2.5);table(p,1.6,1.3,'game');chair(p,1.6,2.4,k==='games'?0x9684a0:palette.green);chair(p,1.6,.2);couch(p,-1.7,.7,k==='games'?0x9684a0:palette.green)}
  else if(k==='hobby'){shelf(p,-1.9,2.48);shelf(p,1.9,2.48);table(p,1.7,.4,'craft');box(p,palette.wood,-1.7,.8,.8,.11,1.6,.11);box(p,palette.cream,-1.7,1.1,.8,.9,.7,.08);plant(p,2.15,-.75)}
  else if(k==='cinema'){box(p,palette.dark,0,1.34,2.85,3.8,1.55,.16);box(p,0xa6bdbe,0,1.34,2.75,3.48,1.25,.05);for(const x of [-1.65,1.65])for(const z of [.2,1.65])chair(p,x,z,palette.red);gift(p,-2.0,-1.3)}
  else if(k==='home'){box(p,palette.wood,-1.65,.34,1.5,1.4,.5,2);box(p,0x9da991,-1.65,.66,1.5,1.36,.23,1.98);box(p,palette.cream,-1.65,.82,2.2,1.1,.2,.48);shelf(p,1.85,2.45);table(p,1.65,.35);plant(p,-2.1,-.55)}
  const res=opts.residents[s.id];if(res){const npc=animal(p,res.avatar,res.coat);npc.g.position.set(-1.2,0,1.05);npc.g.rotation.y=Math.PI;residentSprites.push(npc);sign(p,res.name+' · NPC',-1.2,1.85,1.05)}
  rooms.set(s.id,{s,x,side,hinge,inside:centerZ,doorZ:side*2.08})
 }
 // Batch static geometry by material to reduce mobile draw calls. Doors, labels, and player stay independent.
 scene.updateMatrixWorld(true);const batches=new Map(),merged=[];scene.traverse(m=>{if(!m.isMesh)return;for(let p=m;p;p=p.parent)if(p.userData.dynamic)return;const key=m.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(m)});for(const meshes of batches.values()){if(meshes.length<2)continue;const parts=meshes.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld));const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());if(!g)continue;const m=new T.Mesh(g,meshes[0].material);m.castShadow=true;m.receiveShadow=true;scene.add(m);merged.push(g);meshes.forEach(v=>v.removeFromParent())}
 let currentLook=opts.look;let player=animal(scene,opts.avatar,currentLook?.coat||palette.green,currentLook);player.g.position.set(-12,.1,0)
 let angle=Math.PI/5,zoom=1,active=null,target=null,queue=[],busy=false,disposed=false,drag=null,frame=0,last=performance.now(),clock=0;
 const focus=new T.Vector3(-12,0,0),ray=new T.Raycaster(),ground=new T.Plane(new T.Vector3(0,1,0),-.1),point=new T.Vector3()
 const pos=player.g.position
 function setAvatar(key,look=currentLook){const x=player.g.position.clone(),rot=player.g.rotation.y;if(player.key===key&&JSON.stringify(look)===JSON.stringify(currentLook))return;currentLook=look;player.dispose();player=animal(scene,key,look?.coat||palette.green,look);player.g.position.copy(x);player.g.rotation.y=rot}
 function status(s){opts.onStatus(s)}
 function waypoint(x,z,done){return{x,z,done}}
 function enqueue(list){queue=list;target=null;busy=true}
 function leavePath(){if(!active)return[];const r=rooms.get(active);return[waypoint(r.x,r.side*3.0,()=>{r.hinge.userData.target=-Math.PI/2}),waypoint(r.x,r.side*1.35,()=>{r.hinge.userData.target=0;active=null;opts.onLeave();status('중앙 복도')})]}
 function visit(id){if(opts.access&&opts.access(id)!=='open'){status(opts.access(id)==='locked'?'연령·안전 확인 전 잠금':'개발 준비중');return}if(busy||id===active)return;const r=rooms.get(id);if(!r)return;const path=leavePath();if(!active)path.push(waypoint(player.g.position.x,0));path.push(waypoint(r.x,0),waypoint(r.x,r.side*1.35,()=>{r.hinge.userData.target=-Math.PI/2;status(r.s.name+' 문 열림')}),waypoint(r.x,r.side*3.55,()=>{active=id;r.hinge.userData.target=0;opts.onEnter(id);status(r.s.name)}));status(r.s.name+'으로 걸어가는 중');enqueue(path)}
 function exit(){if(busy||!active)return;enqueue(leavePath())}
 function walk(x,z){if(busy)return;const r=active?rooms.get(active):null;target=r?waypoint(clamp(x,r.x-.85,r.x+.85),clamp(z,Math.min(r.side*3.4,r.side*6.15),Math.max(r.side*3.4,r.side*6.15))):waypoint(clamp(x,-17.5,17.5),clamp(z,-1.35,1.35))}
 function move(dx,dz){const c=Math.cos(angle),s=Math.sin(angle),p=target||player.g.position;walk(p.x+dx*c+dz*s,p.z-dx*s+dz*c)}
 function orbit(a){angle+=a}
 function setNight(night){scene.background.set(night?'#6b707e':'#dfd1bc');sun.intensity=night?1.05:2.6;sun.color.set(night?'#e2b789':'#ffebce')}
 function zoomBy(a){zoom=clamp(zoom+a,.65,1.8)}
 function pointerDown(e){drag={x:e.clientX,y:e.clientY,a:angle};renderer.domElement.setPointerCapture?.(e.pointerId)}
 function pointerMove(e){if(!drag)return;if(Math.abs(e.clientX-drag.x)>8)angle=drag.a-(e.clientX-drag.x)*.012}
 function pointerUp(e){if(!drag)return;const d=drag;drag=null;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>9)return;if(busy)return;const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const h=ray.intersectObjects(hit,false)[0];if(h){visit(h.object.userData.room);return}if(ray.ray.intersectPlane(ground,point))walk(point.x,point.z)}
 function key(e){const dirs={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]};if(dirs[e.key]){e.preventDefault();move(...dirs[e.key])}else if(e.key==='q'||e.key==='e'){e.preventDefault();orbit(e.key==='q'?-.55:.55)}}
 const canvas=renderer.domElement;canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',()=>{drag=null});canvas.addEventListener('keydown',key)
 function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
 const ro=new ResizeObserver(resize);ro.observe(host);resize()
 function tick(now){if(disposed)return;const dt=Math.min(.05,(now-last)/1000);last=now;clock+=dt;if(!target&&queue.length)target=queue.shift();let walking=false;const p=player.g.position;
  if(target){const dx=target.x-p.x,dz=target.z-p.z,dist=Math.hypot(dx,dz),step=(busy?9:5)*dt;if(dist<=step+.01){p.x=target.x;p.z=target.z;const done=target.done;target=null;done?.();if(!queue.length)busy=false}else{p.x+=dx/dist*step;p.z+=dz/dist*step;player.g.rotation.y=Math.atan2(dx,dz);walking=true}}
  for(const r of rooms.values()){const h=r.hinge;h.rotation.y+=(h.userData.target-h.rotation.y)*Math.min(1,dt*16)}
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;player.update(player.g.rotation.y,walking,clock,angle,motion);for(const npc of residentSprites)npc.update(angle,false,clock,angle,motion)
  focus.lerp(new T.Vector3(p.x,0,p.z),motion?1:Math.min(1,dt*5));const rad=(active?7.5:11.8)*zoom;camera.position.set(focus.x+Math.sin(angle)*rad,rad*.88,focus.z+Math.cos(angle)*rad);camera.lookAt(focus.x,.45,focus.z)
  canvas.dataset.position=p.x.toFixed(2)+','+p.z.toFixed(2);canvas.dataset.room=active||'hall';canvas.dataset.camera=angle.toFixed(2);canvas.dataset.avatarMode='2d-billboard';canvas.dataset.avatarKey=player.key;canvas.dataset.avatarLook=JSON.stringify(currentLook||{});canvas.dataset.npcCount=String(residentSprites.length);renderer.render(scene,camera);frame=requestAnimationFrame(tick)
 }
 frame=requestAnimationFrame(tick)
 return {visit,exit,move,orbit,zoom:zoomBy,setAvatar,setNight,dispose(){disposed=true;cancelAnimationFrame(frame);ro.disconnect();spriteFactory.dispose();for(const m of mat.values())m.dispose();for(const g of geo.values())g.dispose();for(const g of merged)g.dispose();for(const s of labels){s.material.map?.dispose();s.material.dispose()}renderer.dispose();canvas.remove()}}
}
