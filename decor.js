import * as THREE from './vendor/three.module.js';

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
 if(index===7){ // Carpet geometry is only centimetres above the selected floor.
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2),mat(color,.99));
  const border=mat('#e5d9c8',1);
  for(const dir of [-1,1]){
   add(mesh,new THREE.PlaneGeometry(w-.07,.023).rotateX(-Math.PI/2),border,0,.003,dir*(d/2-.075));
   add(mesh,new THREE.PlaneGeometry(.023,d-.07).rotateX(-Math.PI/2),border,dir*(w/2-.075),.003,0);
  }
  const design=mat('#bba999');
  const diamond=add(mesh,new THREE.PlaneGeometry(.48,.48).rotateX(-Math.PI/2),design,0,.004,0);
  diamond.rotation.y=Math.PI/4;
  const smaller=add(mesh,new THREE.PlaneGeometry(.3,.3).rotateX(-Math.PI/2),mat(color),0,.006,0);smaller.rotation.y=Math.PI/4;
  mesh.name='flat-area-rug';return mesh;
 }
 throw Error('Unknown decor index: '+index);
}
