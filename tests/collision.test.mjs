import test from 'node:test';
import assert from 'node:assert/strict';
import {footprint,footprintsOverlap,moveWithoutOverlap,rotateWithoutOverlap,nearestFreeFootprint,isFloorSolid} from '../collision.js';
const box=(x,z,w=2,d=1,a=0)=>footprint([w,.85,d],x,z,a);

test('rotated footprints detect real contact',()=>{
 assert.equal(footprintsOverlap(box(0,0),box(2.5,0)),false);
 assert.equal(footprintsOverlap(box(0,0),box(1,0)),true);
 assert.equal(footprintsOverlap(box(0,0),box(1.1,0,.9,.5)),true);
});

test('fast dragging cannot pass through a sofa',()=>{
 const start=box(-3,0),blocker=box(0,0);
 const p=moveWithoutOverlap(start,{x:4,z:0},[blocker]);
 assert.ok(p.x<-1.99&&p.x>-2.1,JSON.stringify(p));
 assert.equal(footprintsOverlap({...start,...p},blocker),false);
});

test('furniture slides tangentially along obstacles',()=>{
 const m=box(-2.5,-1),wall=box(0,0,1,3);
 const p=moveWithoutOverlap(m,{x:2,z:1},[wall]);
 assert.ok(p.x<-1.5&&p.z>-1,JSON.stringify(p));
 assert.equal(footprintsOverlap({...m,...p},wall),false);
});

test('rotation is truncated at first contact',()=>{
 const m=box(0,0,2,1),o=box(0,1.3,.5,.5);
 const angle=rotateWithoutOverlap(m,Math.PI/2,[o]);
 assert.ok(angle>=0&&angle<Math.PI/2);
 assert.equal(footprintsOverlap({...m,angle},o),false);
});

test('new furniture relocates to free space or fails cleanly',()=>{
 const blocker=box(0,0),found=nearestFreeFootprint(box(0,0),[blocker]);
 assert.ok(found);
 assert.equal(footprintsOverlap(box(found.x,found.z),blocker),false);
 assert.equal(nearestFreeFootprint(box(0,0),[blocker],.1),null);
});

test('rugs and small decor are intentionally nonblocking',()=>{
 for(const idx of [4,5,7,14,16,21])assert.equal(isFloorSolid(idx),false);
 for(const idx of [0,1,2,3,8,9,10,11,12,13])assert.equal(isFloorSolid(idx),true);
});

test('deterministic 2000-case collision stress',()=>{
 let seed=155,failures=0;
 const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 for(let k=0;k<2000;k++){
  const moving=footprint([.8+random()*2,.7,.3+random()],-3+random(),-3+random(),random()*6.28);
  const blockers=Array.from({length:24},()=>footprint([.4+random()*1.8,.9,.3+random()*1.2],-2+random()*5,-2+random()*5,random()*6.28));
  const active=blockers.filter(b=>!footprintsOverlap(moving,b));
  const goal={x:moving.x+7*(random()-.5),z:moving.z+7*(random()-.5)};
  const moved=moveWithoutOverlap(moving,goal,blockers);
  if(active.some(b=>footprintsOverlap({...moving,...moved},b)))failures++;
  const turned=rotateWithoutOverlap(moving,moving.angle+(random()-.5)*1.56,blockers);
  if(active.some(b=>footprintsOverlap({...moving,angle:turned},b)))failures++;
 }
 assert.equal(failures,0);
});
