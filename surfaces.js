import * as THREE from './vendor/three.module.js';
export function floorCandidates(results,space,viewerPosition=null){
 const found=[];
 for(const result of results){const pose=result.getPose(space);if(!pose)continue;const values=pose.transform.matrix;if(!values||values.length!==16||!Array.from(values).every(Number.isFinite))continue;
  const matrix=new THREE.Matrix4().fromArray(values),normal=new THREE.Vector3(0,1,0).transformDirection(matrix),point=new THREE.Vector3().setFromMatrixPosition(matrix);
  if(Math.abs(normal.y)<.94)continue;
  // Never reject a real floor because of a hardcoded camera-to-floor distance.
  if(viewerPosition&&point.y>=viewerPosition.y)continue;
  found.push({matrix,point,result});
 }
 return found.sort((a,b)=>a.point.y-b.point.y);
}
export function horizontalHit(results,space){return floorCandidates(results,space)[0]?.matrix||null;}
export class FloorScanner{
 constructor(){this.reset();}
 reset(){this.point=null;this.firstTime=null;this.samples=0;this.candidate=null;this.ready=false;this.height=null;this.lastSeen=0;this.observations=[];}
 update(results,space,viewer,time){
  const found=floorCandidates(results,space,viewer);
  // A reticle must reflect the CURRENT hit; never keep a stale position on screen.
  if(!found.length){
   this.point=null;this.candidate=null;this.ready=false;this.samples=0;
   return null;
  }
  const candidate=found[0],point=candidate.point;
  if(this.height===null||Math.abs(point.y-this.height)>.07){
   this.observations=[];this.firstTime=time;
  }
  this.height=point.y;
  this.samples++;this.lastSeen=time;this.candidate=candidate;
  this.point=point.clone();this.ready=true;
  for(const item of found){
   if(Math.abs(item.point.y-this.height)>.06)continue;
   if(this.observations.every(prev=>prev.distanceTo(item.point)>.42)){
    this.observations.push(item.point.clone());
    if(this.observations.length>12)this.observations.shift();
   }
  }
  return this.point.clone();
 }
}
