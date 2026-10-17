import * as THREE from './vendor/three.module.js';

// Placement flow adapted from the official Three.js WebXR AR Hit Test example:
// https://threejs.org/examples/webxr_ar_hittest.html
// The browser supplies already-sorted hits. Use the FIRST plausible horizontal
// pose in the CURRENT frame, not a reconstructed plane based on distant samples.
const MIN_UP=Math.cos(THREE.MathUtils.degToRad(12));
export function floorCandidates(results,space,viewerPosition=null){
 const found=[];
 for(const result of results){
  const pose=result.getPose(space);
  if(!pose)continue;
  const data=pose.transform.matrix;
  if(!data||data.length!==16||!Array.from(data).every(Number.isFinite))continue;
  const matrix=new THREE.Matrix4().fromArray(data);
  const point=new THREE.Vector3().setFromMatrixPosition(matrix);
  const normal=new THREE.Vector3(0,1,0).transformDirection(matrix);
  // Ignore walls and ceilings; do NOT assume any particular camera height.
  if(normal.y<MIN_UP)continue;
  if(viewerPosition&&point.y>=viewerPosition.y)continue;
  found.push({matrix,point,result,normal});
 }
 return found; // preserve native WebXR hit ordering, normally nearest first
}
export function horizontalHit(results,space){return floorCandidates(results,space)[0]?.matrix||null;}

export class FloorScanner{
 constructor(){this.reset();}
 reset(){
  this.point=null;this.candidate=null;this.ready=false;this.observations=[];
  this.rawHits=0;this.validHits=0;this.inlierHits=0;this.currentHits=[];
 }
 update(results,space,viewer){
  this.rawHits=results.length;
  const hits=floorCandidates(results,space,viewer);
  this.validHits=hits.length;this.inlierHits=hits.length?1:0;
  this.currentHits=hits;
  const selected=hits[0];
  if(!selected){
   // Never display the previous frame's pose when the ray loses the surface.
   this.point=null;this.candidate=null;this.ready=false;
   return null;
  }
  this.point=selected.point.clone();
  this.candidate=selected;
  this.ready=true; // the user decides visually when to lock the reticle
  if(this.observations.every(p=>p.distanceTo(selected.point)>.35)){
   this.observations.push(selected.point.clone());
   if(this.observations.length>15)this.observations.shift();
  }
  return this.point.clone();
 }
}
