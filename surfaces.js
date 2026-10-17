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
 reset(){this.point=null;this.firstTime=null;this.samples=0;this.candidate=null;this.ready=false;}
 update(results,space,viewer,time){
  const candidate=floorCandidates(results,space,viewer)[0];if(!candidate){this.reset();return null;}
  if(!this.point||Math.abs(candidate.point.y-this.point.y)>.035||candidate.point.distanceTo(this.point)>.2){this.firstTime=time;this.samples=0;this.point=candidate.point.clone();}
  else this.point.lerp(candidate.point,.15);
  this.samples++;this.candidate=candidate;this.ready=this.samples>=8&&time-this.firstTime>=350;return this.point.clone();
 }
}
