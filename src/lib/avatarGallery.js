import * as T from 'three'
const colors={cat:[0xe6a051,0xffedc9],bear:[0xb67842,0xffdbab],fox:[0xf07827,0xffecd7],rabbit:[0xe8c7d6,0xfff4fa],santacat:[0xb6b0c8,0xfff4ee],owl:[0x9f6740,0xfad897],squirrel:[0xc76d34,0xffd6a0],penguin:[0x26354c,0xfff8ec],dog:[0xca9b68,0xffe0b9],hamster:[0xf2bb72,0xfff0ce],otter:[0x9b6744,0xffd5a4],raccoon:[0x9299b2,0xf6f3ed],deer:[0xc5834e,0xffe0ac],panda:[0xf7f6f2,0xfffaf0]}
const coat=[0xe52f59,0x19a86f,0x2467eb,0x913bcc,0xf5ad21,0x09adbb,0xff5b91]
export function createAvatarGallery(host,avatars,onSelect){
 const scene=new T.Scene();scene.background=new T.Color(0xc9e8f5);scene.fog=new T.Fog(0xc9e8f5,23,45)
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.domElement.dataset.design='sunlit-garden';renderer.domElement.setAttribute('aria-label','3D 캐릭터 선택실');renderer.domElement.tabIndex=0;host.appendChild(renderer.domElement)
 const camera=new T.PerspectiveCamera(42,1,.1,60);scene.add(new T.HemisphereLight(0xfff8eb,0xc3b6d0,1.65));const key=new T.DirectionalLight(0xffe5c5,2.2);key.position.set(4,8,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-10,right:10,top:9,bottom:-9,near:.5,far:30});key.shadow.bias=-.0005;scene.add(key);const fill=new T.DirectionalLight(0xe1f5ff,.7);fill.position.set(-5,4,-4);scene.add(fill)
 const sphere=new T.SphereGeometry(1,24,16),box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,32),cone=new T.ConeGeometry(1,1,24),materials=new Map()
 function mat(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.7,metalness:0}));return materials.get(c)}
 function mesh(p,g,c,x,y,z,sx,sy,sz){const m=new T.Mesh(g,mat(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
 const ell=(p,c,x,y,z,sx,sy,sz)=>mesh(p,sphere,c,x,y,z,sx,sy,sz)
 const cube=(p,c,x,y,z,sx,sy,sz)=>mesh(p,box,c,x,y,z,sx,sy,sz)
 const disc=(p,c,x,y,z,r,h)=>mesh(p,cylinder,c,x,y,z,r,h,r)
 // Open sunlit miniature welcome garden.
 cube(scene,0xb5dfb7,0,-.20,0,26,.35,20);disc(scene,0xe8bba1,0,-.005,0,5.35,.14);disc(scene,0xffead0,0,.07,0,5.15,.12);
 for(let n=0;n<32;n++){const a=n*Math.PI/16;const q=cube(scene,n%2?0xe9a6bd:0xf6cf88,Math.cos(a)*4.92,.15,Math.sin(a)*4.92,.72,.045,.24);q.rotation.y=-a+Math.PI/2}
 for(const x of [-5.9,5.9]){disc(scene,0xd5a077,x,.10,-1.4,.88,.22);disc(scene,0xf9d4a3,x,.25,-1.4,.78,.10);disc(scene,0xa77954,x,.8,-1.4,.12,1.2);for(let n=0;n<6;n++)ell(scene,n%2?0x79c3a4:0x4faf8b,x+Math.sin(n*2.4)*.43,1.6+n%3*.21,-1.4+Math.cos(n*2.4)*.35,.65,.57,.56);for(let n=0;n<7;n++)ell(scene,coat[n%7],x+Math.cos(n)*.63,.40,-1.4+Math.sin(n)*.63,.13,.12,.13)}
 for(const x of [-3.5,3.5]){cube(scene,0xf2c4aa,x,1.55,-3.1,.37,3.1,.48);cube(scene,0xffefcf,x,3.14,-3.1,.55,.15,.60);cube(scene,0xffefcf,x,.15,-3.1,.64,.26,.67)}
 for(let n=0;n<=14;n++){const a=n*Math.PI/14;ell(scene,n%2?0xe58bb4:0xf7d8a6,Math.cos(a)*3.5,3.1+Math.sin(a)*1.05,-3.1,.34,.25,.28)}
 for(let n=0;n<11;n++){const x=-3.25+n*.65,y=3.55-.45*(1-(x/3.5)**2);const b=mesh(scene,cone,coat[n%7],x,y,-2.82,.18,.42,.065);b.rotation.z=Math.PI}
 for(const [x,col] of [[-8,0xe9a5bd],[8,0x91cfc1]]){cube(scene,col,x,1.4,-5.8,3.2,2.8,2.6);for(const side of [-1,1]){const r=cube(scene,x<0?0xc86e93:0x548bb8,x+side*.8,3.16,-5.8,1.9,.19,3);r.rotation.z=-side*.40}cube(scene,0xfff0d5,x,1.05,-4.44,.95,2.1,.13);for(const dx of [-1,1]){cube(scene,0xfff0d5,x+dx,1.65,-4.44,.76,.86,.12);cube(scene,0x8dbfdc,x+dx,1.65,-4.35,.62,.70,.04)}}
 const stands=[];const groups=[];let selected=2,rotation=0,frame=0,disposed=false,drag=null
 for(let i=0;i<3;i++){const p=new T.Group();p.position.x=(i-1)*2.55;scene.add(p);disc(p,0xd8a9c4,0,.20,0,1.04,.22);disc(p,i===1?0xf6d4e6:0xf9e9d2,0,.34,0,.98,.13);stands.push(p)}
 function animal(id,index){const [fur,cream]=colors[id]||colors.cat;const g=new T.Group();const dark=0x2d2439;const c=coat[index%coat.length]
 ell(g,c,0,.77,0,.43,.43,.34);ell(g,cream,0,.88,.27,.27,.24,.12);for(const s of [-1,1]){ell(g,c,s*.42,.88,0,.15,.35,.16).rotation.z=s*.3;ell(g,fur,s*.48,.67,.03,.13,.13,.14);ell(g,dark,s*.22,.28,.13,.19,.13,.25)}
 if(['cat','santacat','fox','squirrel','raccoon','otter','dog'].includes(id))ell(g,fur,.38,.65,-.33,.22,.40,.19).rotation.z=-.7
 ell(g,fur,0,1.58,0,.68,.58,.51)
 for(const s of [-1,1]){if(['cat','santacat','fox','squirrel'].includes(id)){const ear=mesh(g,cone,fur,s*.4,2.15,0,.24,.55,.2);ear.rotation.z=-s*.22;ell(g,0xff9caa,s*.4,2.12,.14,.11,.16,.06)}
 else if(id==='rabbit'){ell(g,fur,s*.23,2.25,0,.16,.55,.14).rotation.z=-s*.10;ell(g,0xff91b7,s*.23,2.25,.1,.08,.4,.04)}
 else if(id==='dog'){ell(g,0x8e542b,s*.55,1.65,0,.19,.38,.20).rotation.z=s*.25}
 else if(id!=='penguin'){ell(g,id==='panda'?dark:fur,s*.45,2.02,0,.22,.22,.16);ell(g,cream,s*.45,2.02,.13,.11,.11,.04)}
 if(['panda','raccoon'].includes(id))ell(g,dark,s*.22,1.71,.41,.16,.18,.065)
 ell(g,['panda','raccoon'].includes(id)?0xffffff:dark,s*.22,1.73,.465,.085,.10,.05);ell(g,dark,s*.22,1.73,.498,.047,.062,.025);ell(g,0xffffff,s*.22-.014,1.76,.515,.025,.025,.012);ell(g,0xff9ba4,s*.35,1.56,.39,.09,.043,.035)}
 ell(g,cream,0,1.49,.4,.25,.17,.10);ell(g,id==='owl'||id==='penguin'?0xffae22:dark,0,1.55,.505,.09,.062,.055)
 if(id==='deer')for(const s of [-1,1]){ell(g,0x89582c,s*.34,2.24,0,.055,.34,.06).rotation.z=-s*.17;ell(g,0x89582c,s*.46,2.31,0,.045,.15,.05).rotation.z=-s*.55}
 if(id==='santacat'){mesh(g,cone,0xe72942,0,2.23,0,.36,.52,.35);ell(g,0xffffff,0,2.5,0,.09,.09,.09);ell(g,0xffffff,0,2.02,0,.37,.09,.35)}
 for(const y of [.79,.98])ell(g,0xffd54a,0,y,.36,.045,.045,.03);return g}
 function refresh(index){selected=(index+avatars.length)%avatars.length;rotation=0;for(let i=0;i<3;i++){if(groups[i])stands[i].remove(groups[i]);const n=(selected+i-1+avatars.length)%avatars.length;const g=animal(avatars[n],n);g.userData.index=n;g.position.y=.40;g.scale.setScalar(i===1?.88:.64);stands[i].add(g);groups[i]=g}renderer.domElement.dataset.selected=avatars[selected]}
 function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;const d=camera.aspect<.8?12:9.8;camera.position.set(0,4.2,d);camera.lookAt(0,1.42,0);camera.updateProjectionMatrix()}
 const observer=new ResizeObserver(resize);observer.observe(host);resize()
 function down(e){drag={x:e.clientX,y:e.clientY,r:rotation};renderer.domElement.setPointerCapture?.(e.pointerId)}
 function move(e){if(drag)rotation=drag.r+(e.clientX-drag.x)*.013}
 function up(e){if(!drag)return;const d=drag;drag=null;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>9)return;const rect=renderer.domElement.getBoundingClientRect();const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hits=ray.intersectObjects(groups,true);if(hits.length){let p=hits[0].object;while(p&&p.userData.index===undefined)p=p.parent;if(p)onSelect(avatars[p.userData.index])}}
 renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',()=>{drag=null})
 refresh(selected);function tick(){if(disposed)return;groups[1].rotation.y=rotation;renderer.render(scene,camera);frame=requestAnimationFrame(tick)}tick()
 return {select(id){const i=avatars.indexOf(id);if(i>=0)refresh(i)},dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();for(const m of materials.values())m.dispose();for(const g of [sphere,box,cylinder,cone])g.dispose();renderer.dispose();renderer.domElement.remove()}}
}
