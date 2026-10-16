import * as THREE from './vendor/three.module.js';
import {requestARSession,xrError} from './xr.js?v=0.1.3';
import {horizontalHit} from './surfaces.js?v=0.1.3';
export const palette=['#b6bca2','#d5c4ad','#b9c4c6','#ba9380'];
export class Studio {
 constructor(host,changed){
  this.host=host;this.changed=changed;this.items=[];this.serial=0;this.selected=null;this.session=null;this.placed=false;this.moving=false;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#eeeee3');
  this.camera=new THREE.PerspectiveCamera(42,1,.01,100);this.camera.position.set(3.7,3.3,4.7);this.camera.lookAt(0,0,0);
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.xr.enabled=true;this.renderer.xr.setReferenceSpaceType('local');host.prepend(this.renderer.domElement);
  this.scene.add(new THREE.HemisphereLight(0xffffff,0x7e8069,3));const light=new THREE.DirectionalLight(0xfff8ec,3);light.position.set(3,6,2);this.scene.add(light);
  this.grid=new THREE.GridHelper(10,20,0xb7c0aa,0xd7dccd);this.scene.add(this.grid);
  this.root=new THREE.Group();this.scene.add(this.root);
  this.floorNet=new THREE.GridHelper(2.4,16,0xa2ffe1,0x56e8c1);this.floorNet.material.transparent=true;this.floorNet.material.opacity=.65;this.floorNet.material.depthWrite=false;this.floorNet.position.y=.006;this.floorNet.visible=false;this.scene.add(this.floorNet);
  this.reticle=new THREE.Mesh(new THREE.RingGeometry(.09,.115,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x6d8757,side:THREE.DoubleSide}));this.reticle.matrixAutoUpdate=false;this.reticle.visible=false;this.scene.add(this.reticle);
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.floor=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  this.events=new AbortController();const opts={signal:this.events.signal};
  host.addEventListener('pointerdown',e=>this.down(e),opts);host.addEventListener('pointermove',e=>this.drag(e),opts);host.addEventListener('pointerup',()=>this.dragging=false,opts);host.addEventListener('pointercancel',()=>this.dragging=false,opts);
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();
  this.frames=0;this.lastReport=performance.now();this.lastTracking=null;this.renderer.setAnimationLoop((time,frame)=>this.frame(time,frame));
 }
 resize(){if(this.session)return;const w=this.host.clientWidth,h=this.host.clientHeight;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);}
 add(index=this.serial%4,position){const id=++this.serial;const size=[[.8,.55,.55],[.52,.7,.5],[.55,.38,.55],[.4,.85,.38]][index%4];
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color:palette[index%4],roughness:.9}));
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:0x616b56,transparent:true,opacity:.65}));mesh.add(edges);
  mesh.userData={id,index:index%4,height:size[1],price:[4200000,2800000,1900000,2300000][index%4]};
  mesh.position.copy(position||new THREE.Vector3(((id-1)%3-1)*.95,size[1]/2,Math.floor((id-1)/3)*.85-.45));mesh.position.y=size[1]/2;this.root.add(mesh);this.items.push(mesh);this.select(mesh);return mesh;
 }
 seed(kind='calm'){this.clear();if(kind==='empty')return;for(let i=0;i<4;i++)this.add(i);if(kind==='social'){this.items[2].position.set(.1,this.items[2].userData.height/2,.65);this.items[3].position.set(-1.2,this.items[3].userData.height/2,.5);}this.select(this.items[0]);}
 select(mesh){this.selected=mesh;for(const m of this.items)m.children[0].material.color.set(m===mesh?'#e9a775':'#616b56');this.changed();}
 remove(){const m=this.selected;if(!m)return;this.items=this.items.filter(x=>x!==m);this.root.remove(m);this.disposeMesh(m);this.select(this.items[0]||null);}
 clear(){for(const m of this.items){this.root.remove(m);this.disposeMesh(m);}this.items=[];this.selected=null;this.serial=0;this.changed();}
 disposeMesh(m){m.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});}
 rotate(degrees){if(this.selected){this.selected.rotation.y=degrees===undefined?this.selected.rotation.y+Math.PI/12:degrees*Math.PI/180;this.changed();}}
 color(color){if(this.selected){this.selected.material.color.set(color);this.changed();}}
 setRay(e){const r=this.host.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);}
 down(e){if(this.session)return;this.setRay(e);const hit=this.ray.intersectObjects(this.items,false)[0];if(hit){this.select(hit.object);this.dragging=true;const p=this.ray.ray.intersectPlane(this.floor,new THREE.Vector3());this.dragOffset=p?hit.object.position.clone().sub(p):new THREE.Vector3();this.host.setPointerCapture(e.pointerId);}else this.select(null);}
 drag(e){if(!this.dragging||!this.selected||this.session)return;this.setRay(e);const p=this.ray.ray.intersectPlane(this.floor,new THREE.Vector3());if(p){p.add(this.dragOffset);this.selected.position.x=THREE.MathUtils.clamp(p.x,-4,4);this.selected.position.z=THREE.MathUtils.clamp(p.z,-4,4);}}
 async startAR(status,report,basic=false){
  // requestSession must happen directly in the user's click handler.
  const session=await requestARSession(navigator.xr,document.querySelector('#overlay'),basic);
  this.session=session;this.onStatus=status;this.onReport=report;this.frames=0;this.lastReport=performance.now();this.fps=0;this.lastReportState='';this.scanStarted=performance.now();this.lastTracking=null;this.lastStatus='';this.stableHits=0;this.lastFloorPoint=null;this.placed=false;this.root.visible=false;this.grid.visible=false;this.floorNet.visible=false;this.reticle.visible=false;this.scene.background=null;this.status('در حال شناسایی کف… تبلت را آرام رو به زمین حرکت بده.');
  session.addEventListener('end',()=>{this.hitSource?.cancel();this.hitSource=null;this.session=null;this.root.visible=true;this.root.position.set(0,0,0);this.grid.visible=true;this.floorNet.visible=false;this.reticle.visible=false;this.scene.background=new THREE.Color('#eeeee3');this.camera.position.set(3.7,3.3,4.7);this.camera.lookAt(0,0,0);this.resize();document.querySelector('#overlay').hidden=true;status('جلسه پایان یافت');},{once:true});
  let stage='renderer';
  try{await this.renderer.xr.setSession(session);stage='hit-test';const viewer=await session.requestReferenceSpace('viewer');this.hitSource=await session.requestHitTestSource({space:viewer});this.hasOverlay=!!session.domOverlayState;session.addEventListener('select',e=>{if(!this.hasOverlay&&!this.placed){this.place();return;}this.selectAR(e);});return {hasOverlay:this.hasOverlay};}
  catch(e){try{await session.end();}catch{}throw xrError(e,stage);}
 }
 selectAR(event){if(!this.placed||this.moving)return;const pose=event.frame.getPose(event.inputSource.targetRaySpace,this.renderer.xr.getReferenceSpace());if(!pose)return;const mat=new THREE.Matrix4().fromArray(pose.transform.matrix);this.ray.ray.origin.setFromMatrixPosition(mat);this.ray.ray.direction.set(0,0,-1).transformDirection(mat);const hit=this.ray.intersectObjects(this.items,false)[0];if(hit)this.select(hit.object);}
 status(message){if(this.lastStatus===message)return;this.lastStatus=message;this.onStatus(message);}
 place(){if(!this.reticle.visible)return false;this.root.position.setFromMatrixPosition(this.reticle.matrix);this.root.visible=true;this.placed=true;this.placedAt=performance.now();if(this.floorNet){this.floorNet.position.copy(this.root.position);this.floorNet.position.y+=.006;this.floorNet.visible=true;}this.status('کف شناسایی شد؛ باکس‌ها قرار گرفتند. کمی عقب برو تا همه را ببینی.');return true;}
 moveToReticle(){if(!this.selected||!this.reticle.visible||!this.placed)return false;const p=new THREE.Vector3().setFromMatrixPosition(this.reticle.matrix);this.root.worldToLocal(p);this.selected.position.x=p.x;this.selected.position.z=p.z;return true;}
 frame(time,frame){
  if(frame&&this.hitSource){const space=this.renderer.xr.getReferenceSpace();const pose=frame.getViewerPose(space);this.lastTracking=!!pose;
   const results=pose?frame.getHitTestResults(this.hitSource):[];this.updateFloor(results,space,!!pose,time);
   this.frames++;if(time-this.lastReport>1000){this.fps=Math.round(this.frames*1000/(time-this.lastReport));this.frames=0;this.lastReport=time;}
   const report={fps:this.fps,objects:this.items.length,visible:this.root.visible&&pose?this.items.length:0,placed:this.placed,hit:this.reticle.visible,tracking:!!pose,stable:this.stableHits};const state=JSON.stringify(report);if(state!==this.lastReportState){this.onReport(report);this.lastReportState=state;}
  }
  this.renderer.render(this.scene,this.camera);
 }
 updateFloor(results,space,tracking,time){
  const hit=tracking?horizontalHit(results,space):null;this.reticle.visible=!!hit;
  if(!tracking){this.stableHits=0;this.lastFloorPoint=null;this.floorNet.visible=false;this.status('ردیابی قطع شد؛ دوربین را آرام به سمت کف برگردان.');return;}
  if(hit){this.reticle.matrix.copy(hit);const point=new THREE.Vector3().setFromMatrixPosition(hit);
   if(!this.placed){this.stableHits=this.lastFloorPoint&&this.lastFloorPoint.distanceTo(point)<.18?this.stableHits+1:1;this.lastFloorPoint=point;
    this.floorNet.position.copy(point);this.floorNet.position.y+=.006;this.floorNet.visible=true;this.status('کف پیدا شد… چند لحظه تبلت را ثابت نگه دار.');
    if(this.stableHits>=4){if(!this.items.length)this.seed('calm');this.place();}
   }else{this.floorNet.visible=true;this.status(time-this.placedAt<6000?'کف شناسایی شد؛ باکس‌ها قرار گرفتند. کمی عقب برو تا همه را ببینی.':'باکس‌ها در محیط قرار دارند؛ انتخاب کن و با نشانگر جابجا کن.');}
  }else{this.stableHits=0;this.lastFloorPoint=null;this.floorNet.visible=this.placed;this.status(this.placed?'باکس‌ها ثابت‌اند؛ برای جابجایی دوباره نشانگر را روی کف پیدا کن.':time-this.scanStarted>10000?'هنوز کف پیدا نشده؛ نور بیشتر و کف با بافت مشخص کمک می‌کند. دوربین را کمی کج و آرام حرکت بده.':'در حال شناسایی کف… تبلت را آرام رو به زمین حرکت بده.');}
 }
 async snapshot(){if(this.session)throw new Error('برای عکس AR از اسکرین‌شات گوشی استفاده کن.');this.renderer.render(this.scene,this.camera);return new Promise((resolve,reject)=>this.renderer.domElement.toBlob(b=>b?resolve(b):reject(Error('ثبت تصویر ممکن نشد.')),'image/png'));}
 destroy(){this.resizeObserver.disconnect();this.events.abort();this.renderer.setAnimationLoop(null);this.clear();this.disposeMesh(this.reticle);this.floorNet.geometry.dispose();this.floorNet.material.dispose();this.grid.geometry.dispose();this.grid.material.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}

