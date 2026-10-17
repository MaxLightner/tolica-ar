import * as THREE from './vendor/three.module.js';
export function floorCandidates(results,space,viewerPosition=null){
 const found=[];
 for(const result of results){const pose=result.getPose(space);if(!pose)continue;const values=pose.transform.matrix;if(!values||values.length!==16||!Array.from(values).every(Number.isFinite))continue;
  const matrix=new THREE.Matrix4().fromArray(values),normal=new THREE.Vector3(0,1,0).transformDirection(matrix),point=new THREE.Vector3().setFromMatrixPosition(matrix);
  if(Math.abs(normal.y)<.94)continue;
  if(viewerPosition){const distance=point.distanceTo(viewerPosition),drop=viewerPosition.y-point.y;if(distance>5||distance<.25||drop<.25||drop>2.5)continue;}
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
  if(!found.length){
   if(time-this.lastSeen>700){this.samples=0;this.ready=false;}
   return this.point?.clone()||null;
  }
  const candidate=found[0],point=candidate.point;
  // Compare plane elevation, not ray hit position: the ray naturally sweeps over the floor.
  if(this.height===null||Math.abs(point.y-this.height)>.07){
   this.height=point.y;this.firstTime=time;this.samples=0;this.observations=[];
  }else this.height=this.height*.8+point.y*.2;
  this.samples++;this.lastSeen=time;this.candidate=candidate;
  this.point=new THREE.Vector3(point.x,this.height,point.z);
  for(const item of found){
   if(Math.abs(item.point.y-this.height)>.06)continue;
   if(this.observations.every(prev=>prev.distanceTo(item.point)>.42)){
    this.observations.push(item.point.clone());
    if(this.observations.length>12)this.observations.shift();
   }
  }
  this.ready=this.samples>=3&&time-this.firstTime>=120;
  return this.point.clone();
 }
}
