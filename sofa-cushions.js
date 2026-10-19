import * as THREE from './vendor/three.module.js';
const cloth=color=>new THREE.MeshStandardMaterial({color,roughness:.96,side:THREE.DoubleSide});
export const CUSHION_PRESETS=Object.freeze([
 {id:'none',name:'بدون کوسن'}, {id:'square',name:'مربعی'}, {id:'bolster',name:'استوانه‌ای'},
 {id:'mixed',name:'ترکیبی'}, {id:'luxury',name:'چند کوسن'}
]);
export function installSofaCushions(sofa,preset='none'){
 if(!sofa?.userData||![0,1,3].includes(sofa.userData.index))return false;
 const previous=sofa.userData.cushionGroup;
 if(previous){sofa.remove(previous);previous.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.();});}
 sofa.userData.cushionPreset=preset;
 const group=new THREE.Group();group.name='sofa-decorative-cushions';sofa.add(group);sofa.userData.cushionGroup=group;
 if(preset==='none')return true;
 const seats=sofa.userData.seats||1,[w,,d]=sofa.userData.product.size;
 const max=seats===1?1:seats===2?2:preset==='luxury'?3:2;
 for(let i=0;i<max;i++){
  const mode=preset==='mixed'?(i%2?'bolster':'square'):preset==='luxury'?(i%3===2?'bolster':'square'):preset;
  const x=(i-(max-1)/2)*Math.min(.64,(w-.33)/Math.max(max,1));
  const g=mode==='bolster'?new THREE.CylinderGeometry(.085,.085,.40,10):new THREE.BoxGeometry(.32,.34,.105);
  const mesh=new THREE.Mesh(g,cloth(i%2?'#9d8c78':'#d6c2a9'));
  // Near-vertical pillows: front face 80° relative to seat.
  mesh.position.set(x,-sofa.userData.height/2+.64,-d*.21);
  mesh.rotation.x=-Math.PI/18;
  if(mode==='bolster'){mesh.rotation.z=Math.PI/2;mesh.position.y-=.08;}
  mesh.name='cushion-'+mode;group.add(mesh);
 }
 return true;
}
