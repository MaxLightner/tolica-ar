import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createFurniture,furnitureHit} from '../furniture.js';
import {CATALOG} from '../spatial.js';

for(const [index,product] of CATALOG.slice(0,4).entries()){
 test(`${product.name}: real dimensions, feet on floor and fewer than 1000 triangles`,()=>{
  const model=createFurniture(index,product.size,'#d5c4ad');model.position.y=product.size[1]/2;model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
  for(let i=0;i<3;i++)assert.ok(Math.abs(size.getComponent(i)-product.size[i])<1e-6);
  assert.ok(Math.abs(bounds.min.y)<1e-6);let triangles=0;
  model.traverse(m=>{if(m.isMesh){triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;assert.ok([...m.geometry.attributes.normal.array].every(Number.isFinite));}});
  assert.ok(triangles<1000);assert.equal(model.userData.parts.filter(n=>n==='leg').length,4);
  if(index!==2){for(const name of ['seat','back','arm'])assert.ok(model.userData.parts.includes(name));}
  const wood=model.children[0].material.color.getHex();model.material.color.set('#ba9380');assert.equal(model.children[0].material.color.getHex(),wood);
 });
}
test('a tap on a wooden leg resolves to the entire chair',()=>{
 const chair=createFurniture(1,CATALOG[1].size,'#d5c4ad');chair.position.y=.425;chair.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(new THREE.Vector3(.32,.10,2),new THREE.Vector3(0,0,-1));
 const hit=furnitureHit(ray,[chair]);assert.ok(hit);assert.equal(hit.object,chair);
});
test('ray through the open space under a seat does not hit an invisible box',()=>{
 const chair=createFurniture(1,CATALOG[1].size,'#d5c4ad');chair.position.y=.425;chair.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(new THREE.Vector3(0,.10,2),new THREE.Vector3(0,0,-1));assert.equal(furnitureHit(ray,[chair]),null);
});
test('seat front faces point toward an approaching selection ray',()=>{
 const chair=createFurniture(1,CATALOG[1].size,'#d5c4ad');
 // A front-on ray must hit the seat front, not the far side of a reversed bevel.
 chair.position.y=.425;chair.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(new THREE.Vector3(0,.435,2),new THREE.Vector3(0,0,-1));
 const hit=furnitureHit(ray,[chair]);assert.ok(hit.point.z>.40);assert.ok(hit.face.normal.z>.9);
});
