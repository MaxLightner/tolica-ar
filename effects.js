import * as THREE from './vendor/three.module.js';
export class EnvironmentEffects{
 constructor(scene,renderer){this.scene=scene;this.renderer=renderer;this.occlusionMesh=null;this.hemi=new THREE.HemisphereLight(0xffffff,0x817362,2.2);this.sun=new THREE.DirectionalLight(0xfff7e8,2.5);this.sun.position.set(2,4,3);scene.add(this.hemi,this.sun);this.reset();}
 reset(){if(this.occlusionMesh){this.scene.remove(this.occlusionMesh);this.occlusionMesh.visible=false;this.occlusionMesh=null;}this.session=null;this.probe=null;this.lightState='ثابت';this.depthState='خاموش';this.lastLight=0;this.slowSince=null;this.depthDisabled=false;this.hemi.intensity=2.2;this.sun.intensity=2.5;this.sun.color.set(0xfff7e8);}
 async start(session,options){this.reset();this.session=session;this.options=options;if(options.depth)this.depthState=session.enabledFeatures?.includes('depth-sensing')?'در انتظار داده':'پشتیبانی نشد';
  if(options.light&&session.requestLightProbe){try{const probe=await session.requestLightProbe();if(this.session!==session)return;this.probe=probe;this.lightState='در انتظار نور';}catch{if(this.session===session)this.lightState='ثابت (fallback)';}}
 }
 update(frame,time,fps){
  if(this.probe&&time-this.lastLight>120){this.lastLight=time;try{const estimate=frame.getLightEstimate(this.probe);if(estimate){const i=estimate.primaryLightIntensity,max=Math.max(i.x,i.y,i.z,1);this.sun.color.setRGB(i.x/max,i.y/max,i.z/max);this.sun.intensity=THREE.MathUtils.clamp(max,.3,4);const d=estimate.primaryLightDirection;this.sun.position.set(d.x,d.y,d.z);this.hemi.intensity=1.5;this.lightState='تخمین محیط';}}catch{this.probe=null;this.lightState='ثابت (fallback)';}}
  if(this.options?.depth&&this.session?.enabledFeatures?.includes('depth-sensing')){
   try{
    const hasDepth=this.renderer.xr.hasDepthSensing?.();
    const mesh=hasDepth?this.renderer.xr.getDepthSensingMesh?.():null;
    if(mesh){
     if(fps>0&&fps<24){this.slowSince??=time;if(time-this.slowSince>3000)this.depthDisabled=true;}else this.slowSince=null;
     if(this.occlusionMesh!==mesh){if(this.occlusionMesh)this.scene.remove(this.occlusionMesh);this.occlusionMesh=mesh;this.scene.add(mesh);}
     mesh.renderOrder=-100;mesh.material.depthTest=true;mesh.material.depthWrite=true;mesh.material.colorWrite=false;
     mesh.visible=!this.depthDisabled;
     this.depthState=this.depthDisabled?'خاموش (افت سرعت)':'عمق فعال (در انتظار آزمون پوشانندگی)';
    }else this.depthState='در انتظار داده عمق';
   }catch{this.depthState='پشتیبانی یا اجرا ناموفق';}
  }
 }
}
