import * as THREE from './vendor/three.module.js';
import {applyRugStyle} from './rug-textures.js?v=0.3.0';

// Lightweight, self-contained decor: no remote assets, textures, or licensing dependencies.
// Like the furniture meshes, the main mesh origin sits at its geometric center.
// The Studio sets each object's Y to half its height.
const mat=(color,roughness=.88)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0});
const add=(parent,geometry,material,x=0,y=0,z=0)=>{
 const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);parent.add(part);return part;
};

function buildLamp(index,[w,h,d],color){
 const isDesk=index===14,isTripod=index===15;
 const shadeH=isDesk?.24:isTripod?.42:.39;
 const radius=isDesk?.155:isTripod?.24:.20;
 const shade=new THREE.Mesh(new THREE.CylinderGeometry(radius*.84,radius,shadeH,16,1,true),
   new THREE.MeshStandardMaterial({color,roughness:.8,side:THREE.DoubleSide,emissive:'#ffd095',emissiveIntensity:0}));
 shade.geometry.translate(0,h/2-shadeH*.75,0);
 const trim=mat('#72685b',.55),poleHeight=h-shadeH*.95;
 if(isTripod){
  for(let i=0;i<3;i++){
   const a=i*Math.PI*2/3,leg=new THREE.Mesh(new THREE.CylinderGeometry(.016,.020,poleHeight,6),trim);
   leg.position.set(Math.cos(a)*.12,-h/2+poleHeight*.5,Math.sin(a)*.12);
   leg.rotation.z=Math.cos(a)*.20;leg.rotation.x=Math.sin(a)*.20;shade.add(leg);
  }
 }else{
  add(shade,new THREE.CylinderGeometry(.017,.021,poleHeight,7),trim,0,-h/2+poleHeight/2,0);
  add(shade,new THREE.CylinderGeometry(isDesk?.13:.19,isDesk?.13:.19,.026,12),trim,0,-h/2+.020,0);
 }
 const light=new THREE.PointLight(0xffcf8e,0,3.6,2);light.name='lamp-bulb';
 light.position.set(0,h/2-shadeH*.90,0);light.castShadow=false;shade.add(light);
 const glow=new THREE.Mesh(new THREE.SphereGeometry(radius*.78,10,8),
  new THREE.MeshBasicMaterial({color:0xffdfb4,transparent:true,opacity:0,depthWrite:false}));
 glow.name='lamp-visible-glow';glow.position.copy(light.position);glow.scale.y=.65;shade.add(glow);
 shade.userData.lampKind=index===14?'table':index===15?'tripod':'cylinder';
 return shade;
}
function artTexture(index){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=256;c.height=192;
 const ctx=c.getContext('2d');
 const palettes=[
  ['#e5dbce','#a56d5f','#67887c'],['#dfd6c8','#627d8a','#bda47e'],
  ['#ead8bd','#5b8574','#d0a66c'],['#ded6da','#8f6d77','#576c79'],
  ['#e9dfd2','#916f56','#a1a89a'],['#e1d8c6','#597d7d','#c99775']
 ];
 const p=palettes[(index-16)%palettes.length];
 ctx.fillStyle=p[0];ctx.fillRect(0,0,256,192);
 ctx.fillStyle=p[1];
 ctx.beginPath();ctx.ellipse(130,112,70,75,Math.PI/9,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=p[2];
 ctx.beginPath();ctx.moveTo(0,170);ctx.quadraticCurveTo(76,45,150,145);ctx.quadraticCurveTo(203,210,256,81);ctx.lineTo(256,192);ctx.lineTo(0,192);ctx.fill();
 ctx.strokeStyle='#faf4e580';ctx.lineWidth=3;
 for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(110+i*14,90+i*12,30+i*12,.6,2.3);ctx.stroke();}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=2;return t;
}
function buildWallArt(index,[w,h,d]){
 const image=new THREE.Mesh(new THREE.BoxGeometry(w*.93,h*.93,.015),
  new THREE.MeshStandardMaterial({color:'#fff',roughness:1,map:artTexture(index)}));
 const wood=mat(index%2?'#3d4448':'#936e50',.7);
 const frame=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wood);
 image.position.z=d/2+.009;frame.add(image);
 if(index===21){
  for(let i=0;i<3;i++){
   const panel=new THREE.Mesh(new THREE.BoxGeometry(w*.30,h*.90,d),
    new THREE.MeshStandardMaterial({color: i%2?'#9f897d':'#627e83',roughness:.85}));
   panel.position.set((i-1)*w*.34,0,.010);frame.add(panel);
  }
 }
 frame.name='framed-art-'+index;return frame;
}
export function createDecor(index,size,color){
 const [w,h,d]=size;
 if(index===4){ // Ceramic vase, separate neck, four green branches
  const outline=[[0,0],[.062,.015],[.098,.060],[.120,.130],[.111,.215],[.068,.29],[.057,.34],[.075,.365],[.075,.39],[0,.39]];
  const geometry=new THREE.LatheGeometry(outline.map(p=>new THREE.Vector2(...p)),16);
  geometry.translate(0,-h/2,0);
  const vase=new THREE.Mesh(geometry,mat(color,.45));
  const stems=mat('#637866');const leaf=mat('#849985');
  for(let i=0;i<4;i++){
   const a=i*Math.PI*.58,x=Math.cos(a)*.055,z=Math.sin(a)*.055;
   const branch=add(vase,new THREE.CylinderGeometry(.006,.008,.29,5),stems,x,.24,z);
   branch.rotation.z=Math.sin(a)*.23;branch.rotation.x=Math.cos(a)*.23;
   const blade=add(vase,new THREE.SphereGeometry(.052,6,4),leaf,x*2.1,.33+(i%2)*.045,z*2.1);
   blade.scale.set(.55,1.9,.48);blade.rotation.z=Math.sin(a)*.6;
  }
  vase.name='ceramic-vase';return vase;
 }
 if(index===5){ // Throw pillow, rounded silhouette with piped seams
  const geometry=new THREE.SphereGeometry(1,12,8);
  geometry.scale(w*.53,h*.6,d*.53);
  const pillow=new THREE.Mesh(geometry,mat(color,.95));
  const seam=new THREE.Mesh(new THREE.TorusGeometry(w*.42,.006,4,24),mat('#ece0d1'));
  seam.rotation.x=Math.PI/2;seam.scale.set(1,d/w,1);pillow.add(seam);
  pillow.name='throw-pillow';return pillow;
 }
 if(index===6||index===14||index===15)return buildLamp(index,size,color);
 if(index===7){
  // Flat textured rug. The textile image is generated once as a tiny canvas,
  // and is rendered with alpha-free color so camera-floor shadows stay visible.
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2),
   new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide}));
  applyRugStyle(mesh,'laki');
  mesh.name='woven-area-rug';return mesh;
 }
 if(index===8){ // Bed: mattress, frame, headboard, pillows.
  const geometry=new THREE.BoxGeometry(w-.06,.24,d-.11);
  geometry.translate(0,-h/2+.47,.03);
  const bed=new THREE.Mesh(geometry,mat(color,.97));
  const wood=mat('#846c58',.76);
  add(bed,new THREE.BoxGeometry(w,.21,d),wood,0,-h/2+.24,0);
  add(bed,new THREE.BoxGeometry(w,.60,.13),mat('#99897c'),0,-h/2+.61,-d/2+.055);
  const linen=mat('#ece6dc',1);
  for(const x of [-.37,.37])add(bed,new THREE.BoxGeometry(.53,.09,.36),linen,x,-h/2+.65,-d/2+.38);
  bed.name='minimal-double-bed';return bed;
 }
 if(index===9||index===10){ // Work desk / dining table, solid geometry with real scale.
  const geometry=new THREE.BoxGeometry(w,.07,d);
  geometry.translate(0,h/2-.035,0);
  const table=new THREE.Mesh(geometry,mat(color,.7));
  const legs=mat('#716257',.72);
  for(const x of [-1,1])for(const z of [-1,1])add(table,new THREE.CylinderGeometry(.025,.035,h-.08,7),legs,x*(w/2-.11),-.04,z*(d/2-.11));
  if(index===9)add(table,new THREE.BoxGeometry(w*.54,.12,d*.67),mat('#a6917c'),0,h/2-.16,-d*.1);
  table.name=index===9?'simple-writing-desk':'modern-dining-table';return table;
 }
 if(index===11){ // Slim dining/desk chair.
  const geometry=new THREE.BoxGeometry(w,.085,d);
  geometry.translate(0,-h/2+.48,0);
  const chair=new THREE.Mesh(geometry,mat(color,.88));
  add(chair,new THREE.BoxGeometry(w,.49,.065),mat(color,.84),0,-h/2+.71,-d/2+.027);
  const legs=mat('#675a4e',.8);
  for(const x of [-1,1])for(const z of [-1,1])add(chair,new THREE.CylinderGeometry(.020,.023,.45,6),legs,x*(w/2-.08),-h/2+.225,z*(d/2-.08));
  chair.name='minimal-dining-chair';return chair;
 }
 if(index===12||index===13){
  const g=new THREE.BoxGeometry(w,.055,d);
  g.translate(0,h/2-.0275,0);
  const table=new THREE.Mesh(g,mat(index===12?'#a9927b':'#ad9279',.65));
  const legMaterial=mat('#756456',.74);
  for(const x of [-1,1])for(const z of [-1,1]){
   add(table,new THREE.CylinderGeometry(.023,.026,h-.07,6),legMaterial,
    x*(w/2-.085),-.035,z*(d/2-.085));
  }
  table.name=index===12?'square-side-table':'large-square-coffee-table';return table;
 }
 if(index>=16&&index<=21)return buildWallArt(index,size);
 throw Error('Unknown decor index: '+index);
}
