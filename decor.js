import * as THREE from './vendor/three.module.js';
import {applyRugStyle} from './rug-textures.js?v=0.3.0';

// Lightweight, self-contained decor: no remote assets, textures, or licensing dependencies.
// Like the furniture meshes, the main mesh origin sits at its geometric center.
// The Studio sets each object's Y to half its height.
const mat=(color,roughness=.88)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0});
const add=(parent,geometry,material,x=0,y=0,z=0)=>{
 const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);parent.add(part);return part;
};
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
 if(index===6){ // Floor lamp, warm shade and small light (no shadow mapping)
  const geometry=new THREE.CylinderGeometry(.16,.22,.32,14,1,true);
  geometry.translate(0,h/2-.20,0);
  const lamp=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.88,emissive:0x8b6941,emissiveIntensity:.15,side:THREE.DoubleSide}));
  const metal=mat('#56504b',.35);
  add(lamp,new THREE.CylinderGeometry(.025,.025,h-.25,8),metal,0,-.045,0);
  add(lamp,new THREE.CylinderGeometry(.22,.22,.035,14),metal,0,-h/2+.025,0);
  const warm=new THREE.PointLight(0xffd4a2,.32,1.8,2);warm.position.set(0,h/2-.32,0);lamp.add(warm);
  lamp.name='warm-floor-lamp';return lamp;
 }
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
 throw Error('Unknown decor index: '+index);
}
