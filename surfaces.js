import * as THREE from './vendor/three.module.js';
// A hit can describe a wall or have either normal direction. Check every result.
export function horizontalHit(results,space){
 for(const result of results){const pose=result.getPose(space);if(!pose)continue;const values=pose.transform.matrix;if(!values||values.length!==16||!Array.from(values).every(Number.isFinite))continue;
  const matrix=new THREE.Matrix4().fromArray(values);const normal=new THREE.Vector3(0,1,0).transformDirection(matrix);
  if(Math.abs(normal.y)>=.8)return matrix;
 }
 return null;
}
