import * as T from 'three'
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js'
const skins={cat:[0xe5a15b,0xffe6c5],santacat:[0xb5a7b9,0xfff0e8],bear:[0xb98356,0xffdcab],fox:[0xf08a43,0xffedda],rabbit:[0xe9c8dd,0xfff6f8],owl:[0xa9835e,0xf8dda6],squirrel:[0xcd8248,0xffdfa8],penguin:[0x3a4861,0xfff5e8],dog:[0xcfa16f,0xffe4bf],hamster:[0xf2b975,0xfff1cf],otter:[0xad7853,0xf6d5a8],raccoon:[0x9fa7b8,0xf5eee6],deer:[0xc8955e,0xffe4b6],panda:[0xf5eee9,0xfffaf2]}
const accent=0x4c344d
function shade(c,n){return new T.Color(c).multiplyScalar(n)}
export function createModelFactory(){
 const geo={sphere:new T.SphereGeometry(1,24,16),box:new T.BoxGeometry(1,1,1),cone:new T.ConeGeometry(1,1,24),cyl:new T.CylinderGeometry(1,1,1,24),torus:new T.TorusGeometry(1,.13,12,32)},mats=new Map(),characters=new Set()
 function material(c){const k=new T.Color(c).getHex();if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color:k,roughness:.68}));return mats.get(k)}
 function group(p,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g}
 function mesh(p,k,c,x,y,z,w,h,d){const m=new T.Mesh(geo[k],material(c));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
 const ell=(p,c,x,y,z,w,h,d)=>mesh(p,'sphere',c,x,y,z,w,h,d),box=(p,c,x,y,z,w,h,d)=>mesh(p,'box',c,x,y,z,w,h,d),cyl=(p,c,x,y,z,r,h)=>mesh(p,'cyl',c,x,y,z,r,h,r),cone=(p,c,x,y,z,r,h,d=r)=>mesh(p,'cone',c,x,y,z,r,h,d)
 function combine(p,owned){p.updateMatrixWorld(true);const batches=new Map(),inv=p.matrixWorld.clone().invert();p.traverse(m=>{if(!m.isMesh)return;const key=m.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(m)});for(const parts of batches.values()){if(parts.length<2)continue;const clones=parts.map(m=>m.geometry.clone().applyMatrix4(inv.clone().multiply(m.matrixWorld)));const geometry=mergeGeometries(clones,false);clones.forEach(g=>g.dispose());if(!geometry)continue;const m=new T.Mesh(geometry,parts[0].material);m.castShadow=true;m.receiveShadow=true;p.add(m);owned.push(geometry);parts.forEach(m=>m.removeFromParent())}}
 function create(parent,key,coat='#718675',look=null){const L=look||{},base=skins[key]||skins.cat,fur=L.fur&&L.fur!=='natural'?L.fur:base[0],cream=base[1],color=L.coat||coat,trim=shade(color,.72),light=shade(color,1.22),shoe=L.shoes||'#6c574b',style=L.style||'coat';
 const g=group(parent);g.userData.dynamic=true;const pose=group(g);pose.scale.setScalar(.66);const trunk=group(pose);const legs=[],arms=[],owned=[];
 // Seamless overlapping neck, torso and head. Original rounded animal proportions.
 ell(trunk,fur,0,1.18,0,.30,.28,.27);ell(trunk,color,0,.88,0,.47,.49,.37);
 if(style==='dress'||style==='skirt'){const skirt=cone(trunk,color,0,.64,0,.57,.54,.43);skirt.rotation.z=Math.PI;ell(trunk,light,0,.40,0,.56,.07,.43);ell(trunk,trim,0,.90,0,.43,.075,.37)}
 else if(style==='overalls'){ell(trunk,cream,0,1.05,.18,.35,.26,.19);ell(trunk,color,0,.73,.24,.32,.30,.17);for(const x of [-.22,.22]){box(trunk,color,x,1.05,.28,.12,.42,.10);ell(trunk,0xf5c264,x,.96,.385,.047,.047,.026)}}
 else if(style==='hoodie'){ell(trunk,trim,0,1.16,-.23,.38,.29,.18);ell(trunk,light,0,.67,.34,.28,.12,.07);for(const x of [-.10,.10])box(trunk,cream,x,1.02,.36,.027,.22,.03)}
 else if(style==='vest'){ell(trunk,cream,0,.96,.33,.19,.34,.11);for(const x of [-.20,.20])ell(trunk,color,x,.88,.29,.20,.39,.11)}
 else if(style==='tux'){ell(trunk,cream,0,.98,.34,.19,.32,.07);for(const x of [-.12,.12])ell(trunk,trim,x,1.00,.38,.11,.05,.04);ell(trunk,0xf2c7a6,0,1.02,.42,.055,.065,.03)}
 else if(style==='knit'){for(let i=0;i<5;i++)ell(trunk,light,0,.59+i*.13,.345,.31,.025,.047)}
 else{for(const x of [-.15,.15])ell(trunk,light,x,1.09,.33,.13,.16,.06);for(const y of [.68,.86,1.03])ell(trunk,0xffd37f,0,y,.38,.043,.045,.026)}
 if(L.fabric==='dots')for(let i=0;i<3;i++)for(let j=0;j<3;j++)ell(trunk,cream,-.19+j*.19,.66+i*.18,.37-Math.abs(j-1)*.025,.035,.035,.018);
 if(L.fabric==='check'){for(let i=0;i<3;i++){box(trunk,light,0,.65+i*.18,.374,.44,.032,.018);box(trunk,trim,-.16+i*.16,.84,.38,.032,.42,.018)}}
 if(L.fabric==='stitch')for(let i=0;i<6;i++)ell(trunk,cream,-.23+i*.09,.55,.34,.024,.015,.018);
 if(L.fabric==='stars')for(const [x,y] of [[-.20,.71],[.15,.82],[0,1.01]]){ell(trunk,0xffdc87,x,y,.38,.05,.05,.018);box(trunk,0xffdc87,x,y,.39,.12,.022,.018)}
 for(const x of [-1,1]){const leg=group(pose,x*.23,.47,0);ell(leg,style==='dress'||style==='skirt'?fur:trim,0,-.12,0,.17,.26,.20);ell(leg,shoe,0,-.32,.11,.19,.14,.26);ell(leg,shade(shoe,1.18),0,-.38,.13,.19,.045,.24);legs.push(leg);const arm=group(pose,x*.42,1.03,0);ell(arm,color,x*.07,-.15,0,.15,.26,.16).rotation.z=x*.22;ell(arm,fur,x*.11,-.34,.04,.14,.14,.15);arms.push(arm)}
 if(['cat','santacat','fox','squirrel','raccoon','otter','dog'].includes(key)){ell(trunk,fur,.40,.70,-.35,.23,.40,.20).rotation.z=-.8;if(key==='fox'||key==='squirrel')ell(trunk,cream,.58,.89,-.43,.18,.19,.15)}
 const head=group(trunk,0,1.57,0);ell(head,fur,0,0,0,.68,.59,.52);
 for(const side of [-1,1]){if(['cat','santacat','fox','squirrel'].includes(key)){const ear=cone(head,fur,side*.42,.57,-.02,.25,.56,.20);ear.rotation.z=-side*.20;ell(head,0xe99ab2,side*.42,.57,.12,.12,.18,.055)}
 else if(key==='rabbit'){ell(head,fur,side*.24,.72,-.02,.16,.55,.15).rotation.z=-side*.11;ell(head,0xf3a6c4,side*.24,.74,.105,.08,.39,.04)}
 else if(key==='dog')ell(head,shade(fur,.73),side*.55,.02,-.015,.20,.40,.20).rotation.z=side*.20
 else if(key!=='penguin'){ell(head,key==='panda'?accent:fur,side*.46,.43,-.01,.24,.25,.19);ell(head,cream,side*.46,.43,.15,.12,.13,.04)}
 if(key==='deer'){ell(head,0x966039,side*.34,.69,0,.06,.33,.06).rotation.z=-side*.2;ell(head,0x966039,side*.46,.76,0,.05,.16,.05).rotation.z=-side*.6}
 if(key==='panda'||key==='raccoon')ell(head,accent,side*.22,.04,.45,.17,.18,.055);const sleepy=L.eyes==='sleepy',smile=L.eyes==='smile';ell(head,accent,side*.22,.08,.494,.083,sleepy?.035:smile?.045:.105,.043);if(!sleepy&&!smile)ell(head,0xffffff,side*.22-.021,.118,.527,.025,.027,.012);ell(head,0xef9ba9,side*.37,-.08,.424,.103,.052,.035)}
 ell(head,cream,0,-.17,.395,.29,.18,.14);ell(head,key==='penguin'||key==='owl'?0xf2ad54:accent,0,-.10,.53,.079,.055,.048);for(const x of [-1,1])ell(head,0x966575,x*.047,-.19,.521,.05,.014,.018).rotation.z=x*.18
 if(L.pattern==='stripe')for(const x of [-.18,0,.18])ell(head,shade(fur,.67),x,.33,.43,.047,.11,.035);
 if(L.pattern==='blaze')ell(head,cream,0,.31,.46,.13,.19,.035);
 if(L.pattern==='spot')ell(head,shade(fur,.64),.17,.32,.43,.14,.11,.04);
 const hat=L.hat||(key==='santacat'?'beanie':'none');
 if(hat==='beret'){ell(head,color,.06,.57,.01,.50,.15,.37).rotation.z=-.16;ell(head,trim,.10,.72,.02,.045,.09,.05)}
 if(hat==='beanie'){ell(head,color,0,.52,-.04,.51,.27,.42);ell(head,light,0,.43,.01,.53,.10,.43);ell(head,cream,0,.79,-.04,.12,.12,.12)}
 if(hat==='ribbon'||hat==='flower'){for(let i=0;i<(hat==='flower'?5:2);i++){const a=i*Math.PI*2/(hat==='flower'?5:2);ell(head,hat==='flower'?0xf49abc:color,.34+Math.cos(a)*.13,.50+Math.sin(a)*.13,.34,.13,.075,.07).rotation.z=a}ell(head,0xffd581,.34,.5,.39,.072,.072,.055)}
 if(hat==='cap'){ell(head,color,0,.49,-.04,.50,.22,.43);ell(head,trim,0,.42,.41,.40,.045,.24)}
 if(hat==='crown'){cyl(head,0xffd05a,0,.56,.04,.30,.16);for(const x of [-.21,0,.21])cone(head,0xffd05a,x,.76,.04,.105,.29,.10);ell(head,0xf07fa2,0,.64,.32,.055,.055,.025)}
 if(L.accessory==='scarf'){ell(trunk,0xf5b86b,0,1.20,.03,.39,.105,.34);ell(trunk,0xf5b86b,.20,1.00,.34,.10,.27,.06)}
 if(L.accessory==='bow'){for(const x of [-.13,.13])ell(trunk,0xf3a1c5,x,1.15,.37,.15,.08,.055);ell(trunk,0xffd47d,0,1.15,.41,.06,.06,.05)}
 if(L.accessory==='glasses'){for(const x of [-.22,.22])mesh(head,'torus',0x714d79,x,.08,.53,.125,.135,.09);box(head,0x714d79,0,.08,.55,.19,.028,.03)}
 if(L.accessory==='bag'){ell(trunk,0xe6a365,.43,.67,.27,.20,.24,.13);box(trunk,0xf6db9a,.19,.94,.38,.06,.62,.035).rotation.z=.55;ell(trunk,0xffefd1,.43,.72,.40,.09,.06,.027)}
 if(L.accessory==='headphones'){for(const x of [-.59,.59])ell(head,0x8f77cc,x,.02,0,.14,.21,.17);const arch=mesh(head,'torus',0x8f77cc,0,.08,0,.59,.59,.11);arch.rotation.z=Math.PI}
 if(L.accessory==='camera'){box(trunk,0x688fbd,0,.81,.40,.42,.28,.14);cyl(trunk,0x503f68,0,.81,.52,.12,.14).rotation.x=Math.PI/2;ell(trunk,0xb5e5ed,0,.81,.60,.085,.085,.025)}
 if(L.accessory==='necklace'){for(let i=0;i<7;i++){const a=i*Math.PI/6;ell(trunk,0xffd97f,Math.cos(a)*.27,1.12-Math.sin(a)*.15,.35,.045,.045,.028)}}
 // Batch static pieces per articulated joint, while keeping legs/arms independent.
 combine(trunk,owned);legs.forEach(p=>combine(p,owned));arms.forEach(p=>combine(p,owned));
 const ch={g,key,coat:color,update(heading,walking,clock,cameraAngle,reduced,seated=false){g.rotation.y=heading;const lying=seated==='lying';pose.rotation.x=lying?-Math.PI/2:0;pose.position.set(0,lying?.14:seated?-.23:walking&&!reduced?Math.abs(Math.sin(clock*9))*.035:0,lying?-.65:0);for(let i=0;i<2;i++){const s=i?1:-1;legs[i].rotation.x=lying?0:seated?-1.35:walking&&!reduced?s*Math.sin(clock*10)*.48:0;arms[i].rotation.x=lying?0:seated?-.14:walking&&!reduced?-s*Math.sin(clock*10)*.34:0}},dispose(){g.removeFromParent();owned.forEach(x=>x.dispose());characters.delete(ch)}};characters.add(ch);return ch
 }
 return {create,dispose(){for(const c of [...characters])c.dispose();for(const g of Object.values(geo))g.dispose();for(const m of mats.values())m.dispose()}}
}
// One off-screen renderer for real 3D wardrobe thumbnails; no WebGL context per item.
let preview=null;
export function renderModelPreview(canvas,key,look,direction='front'){try{if(!preview){const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(256,320,false);renderer.outputColorSpace=T.SRGBColorSpace;const scene=new T.Scene();scene.add(new T.HemisphereLight(0xfff5e6,0xbca8d1,2));const light=new T.DirectionalLight(0xffedd6,2.8);light.position.set(3,5,5);scene.add(light);const fill=new T.DirectionalLight(0xc9e7ff,.65);fill.position.set(-3,2,-2);scene.add(fill);const camera=new T.PerspectiveCamera(32,.8,.1,20);camera.position.set(0,1.16,4.6);camera.lookAt(0,.77,0);preview={renderer,scene,camera,factory:createModelFactory()}}const {renderer,scene,camera,factory}=preview;const model=factory.create(scene,key,look.coat,look);const a={front:0,right:Math.PI/2,back:Math.PI,left:-Math.PI/2}[direction]||0;model.update(a,false,0,0,true);renderer.render(scene,camera);const ctx=canvas.getContext('2d');if(!ctx){model.dispose();return false}ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(renderer.domElement,0,0,canvas.width,canvas.height);canvas.dataset.renderMode='3d-model';model.dispose();return true}catch{return false}}
