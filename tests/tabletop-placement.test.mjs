import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {Studio} from '../studio.js';
import {CATALOG} from '../spatial.js';
import {assetMetadata,isTable} from '../asset-metadata.js';
import {isFloorSolid} from '../collision.js';

function mockObject(index,id,x=0,z=0,y=null){
 const height=CATALOG[index].size[1];
 const object=new THREE.Object3D();
 object.position.set(x,y??height/2,z);
 object.userData={id,index,height,product:CATALOG[index],asset:assetMetadata(index)};
 return object;
}

test('crystal lamp and vase can rest on each original and imported tabletop',()=>{
 assert.equal(isFloorSolid(28),false);
 for(const index of [2,9,10,12,13,25,26,27]){
  assert.ok(isTable(index));
  const studio=Object.create(Studio.prototype);
  const table=mockObject(index,1,1,-1);
  table.rotation.y=Math.PI/4;
  const lamp=mockObject(28,2,1,-1);
  const vase=mockObject(4,3,1,-1);
  studio.items=[table,lamp,vase];
  assert.equal(studio.snapToSupport(lamp),table,`lamp on table ${index}`);
  assert.equal(studio.snapToSupport(vase),table,`vase on table ${index}`);
  assert.equal(lamp.userData.attachment.id,1);
  assert.ok(Math.abs(lamp.position.y-(table.userData.height+lamp.userData.height/2))<1e-8);
  assert.ok(Math.abs(vase.position.y-(table.userData.height+vase.userData.height/2))<1e-8);
  table.position.x+=.36;
  studio.refreshAttachments();
  assert.ok(Math.abs(lamp.position.x-(table.position.x))<1e-8,'lamp follows table');
  lamp.position.x=4;lamp.position.z=4;
  assert.equal(studio.snapToSupport(lamp),null,'lamp detaches when moved off tabletop');
  assert.equal(lamp.userData.attachment,null);
  assert.equal(lamp.position.y,lamp.userData.height/2);
 }
});

test('small tabletops constrain the lamp to their usable bounds',()=>{
 const studio=Object.create(Studio.prototype),table=mockObject(26,1,0,0);
 const lamp=mockObject(28,2,.2,0);
 studio.items=[table,lamp];
 assert.equal(studio.snapToSupport(lamp),table);
 const half=(table.userData.asset.supportSurfaces[0].width-lamp.userData.product.size[0])/2;
 assert.ok(Math.abs(lamp.position.x)<=half+1e-9);
});
