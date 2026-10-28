import * as THREE from './vendor/three.module.js';
import {CATALOG} from './spatial.js';
import {createFurniture} from './furniture.js';
import {createDecor} from './decor.js';

const models={};
for(let index=0;index<22;index++){
 const size=CATALOG[index].size;
 const color='#b4ada1';
 const model=index<4?createFurniture(index,size,color):index===7?
  new THREE.Mesh(new THREE.BoxGeometry(size[0],size[1],size[2]),new THREE.MeshStandardMaterial({color:'#a3a4a2'})):
  createDecor(index,size,color);
 model.updateMatrixWorld(true);
 const parts=[];
 model.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;
  const geometry=mesh.geometry;
  const positions=geometry.attributes.position;
  const indices=geometry.index?.array||Array.from({length:positions.count},(_,i)=>i);
  const world=mesh.matrixWorld;
  const points=[];
  const p=new THREE.Vector3();
  for(let i=0;i<positions.count;i++){
   p.fromBufferAttribute(positions,i).applyMatrix4(world);
   points.push(+p.x.toFixed(5),+p.y.toFixed(5),+p.z.toFixed(5));
  }
  const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
  parts.push({positions:points,indices:Array.from(indices),color:'#'+(material?.color?.getHexString()||'b4ada1')});
 });
 models[index]=parts;
}
process.stdout.write(JSON.stringify(models));
