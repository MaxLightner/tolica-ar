import * as THREE from './vendor/three.module.js';
export const CATALOG=Object.freeze([
 Object.freeze({name:'کاناپه',size:Object.freeze([2.1,.85,.9]),price:4200000}),
 Object.freeze({name:'تک‌نفره',size:Object.freeze([.9,.85,.9]),price:2800000}),
 Object.freeze({name:'میز',size:Object.freeze([1.1,.4,.6]),price:1900000}),
 Object.freeze({name:'تک‌نفره دوم',size:Object.freeze([.9,.85,.9]),price:2800000})
]);
export const wrappedAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function pairAngle(a,b){return Math.atan2(-(b.z-a.z),b.x-a.x);}
export class SpatialState{
 constructor(){this.origin=new THREE.Vector3();this.anchorYaw=0;this.heightOffset=0;this.locked=true;this.a=new THREE.Vector3(0,0,.7);this.b=new THREE.Vector3(4,0,.7);this.correction=1;this.actualLength=null;}
 get length(){return this.a.distanceTo(this.b);}
 get yaw(){return pairAngle(this.a,this.b);}
 get height(){return this.origin.y+this.heightOffset;}
 get plane(){return new THREE.Plane(new THREE.Vector3(0,1,0),-this.height);}
 lock(point){this.origin.copy(point);this.anchorYaw=0;this.locked=true;}
 setAnchorTranslation(point,yaw=this.anchorYaw){if(this.locked){this.origin.copy(point);if(Number.isFinite(yaw))this.anchorYaw=yaw;}}
 setHeight(meters){if(!Number.isFinite(meters)||Math.abs(meters)>2)throw Error('اصلاح ارتفاع باید بین ۲۰۰− و ۲۰۰ سانتی‌متر باشد.');this.heightOffset=meters;}
 moveA(point){const delta=point.clone().sub(this.a);delta.y=0;this.a.add(delta);this.b.add(delta);}
 moveB(point){const next=point.clone();next.y=0;if(next.distanceTo(this.a)<1||next.distanceTo(this.a)>10)return false;this.b.copy(next);return true;}
 calibrate(actualMeters){if(!Number.isFinite(actualMeters)||actualMeters<1||actualMeters>10)throw Error('طول واقعی را بین ۱۰۰ و ۱۰۰۰ سانتی‌متر وارد کن.');
  // If XR reports m units for a real r-meter span, a nominal P-meter product needs P*m/r XR units.
  const scale=this.length/actualMeters;if(!Number.isFinite(scale)||scale<=0)throw Error('ضریب اندازه معتبر نیست.');this.correction=scale;this.actualLength=actualMeters;return scale;
 }
 resetCalibration(){this.correction=1;this.actualLength=null;}
 apply(floorFrame,layout){floorFrame.position.copy(this.origin);floorFrame.position.y+=this.heightOffset;floorFrame.rotation.set(0,this.anchorYaw,0);layout.position.copy(this.a);layout.rotation.set(0,this.yaw,0);layout.scale.setScalar(this.correction);floorFrame.updateMatrixWorld(true);}
 snapshot(){return {a:this.a.toArray(),b:this.b.toArray(),correction:this.correction,actualLength:this.actualLength,heightOffset:this.heightOffset};}
 restore(state){if(!state)return;this.a.fromArray(state.a);this.b.fromArray(state.b);this.correction=state.correction;this.actualLength=state.actualLength;this.heightOffset=state.heightOffset;}
}
