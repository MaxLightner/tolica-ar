import * as THREE from './vendor/three.module.js';
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
 async startAR(status,report){
  // requestSession must happen directly in the user's click handler.
  const session=await navigator.xr.requestSession('immersive-ar',{requiredFeatures:['hit-test','dom-overlay'],optionalFeatures:['local-floor'],domOverlay:{root:document.querySelector('#overlay')}});
  this.session=session;this.onStatus=status;this.onReport=report;this.frames=0;this.lastReport=performance.now();this.lastTracking=null;this.placed=false;this.root.visible=false;this.grid.visible=false;this.scene.background=null;
  session.addEventListener('end',()=>{this.hitSource?.cancel();this.hitSource=null;this.session=null;this.root.visible=true;this.root.position.set(0,0,0);this.grid.visible=true;this.reticle.visible=false;this.scene.background=new THREE.Color('#eeeee3');this.camera.position.set(3.7,3.3,4.7);this.camera.lookAt(0,0,0);this.resize();document.querySelector('#overlay').hidden=true;status('جلسه پایان یافت');},{once:true});
  try{await this.renderer.xr.setSession(session);const viewer=await session.requestReferenceSpace('viewer');this.hitSource=await session.requestHitTestSource({space:viewer});session.addEventListener('select',e=>this.selectAR(e));}
  catch(e){await session.end();throw e;}
 }
 selectAR(event){if(!this.placed||this.moving)return;const pose=event.frame.getPose(event.inputSource.targetRaySpace,this.renderer.xr.getReferenceSpace());if(!pose)return;const mat=new THREE.Matrix4().fromArray(pose.transform.matrix);this.ray.ray.origin.setFromMatrixPosition(mat);this.ray.ray.direction.set(0,0,-1).transformDirection(mat);const hit=this.ray.intersectObjects(this.items,false)[0];if(hit)this.select(hit.object);}
 place(){if(!this.reticle.visible)return false;this.root.position.setFromMatrixPosition(this.reticle.matrix);this.root.visible=true;this.placed=true;this.onStatus('چهار باکس در یک جلسهٔ AR · یک باکس را انتخاب کن');return true;}
 moveToReticle(){if(!this.selected||!this.reticle.visible||!this.placed)return false;const p=new THREE.Vector3().setFromMatrixPosition(this.reticle.matrix);this.root.worldToLocal(p);this.selected.position.x=p.x;this.selected.position.z=p.z;return true;}
 frame(time,frame){
  if(frame&&this.hitSource){const space=this.renderer.xr.getReferenceSpace();const pose=frame.getViewerPose(space);if(!!pose!==this.lastTracking){this.lastTracking=!!pose;this.onStatus(pose?'کف را پیدا کن؛ نشانگر سبز محل قرارگیری است.':'ردیابی قطع شد؛ گوشی را آرام حرکت بده.');}
   const results=frame.getHitTestResults(this.hitSource);this.reticle.visible=false;if(pose&&results.length){const hit=results[0].getPose(space);if(hit){const m=new THREE.Matrix4().fromArray(hit.transform.matrix);const up=new THREE.Vector3(0,1,0).transformDirection(m);if(up.y>.85){this.reticle.matrix.copy(m);this.reticle.visible=true;}}}
   this.frames++;if(time-this.lastReport>1000){this.onReport({fps:Math.round(this.frames*1000/(time-this.lastReport)),objects:this.items.length,placed:this.placed,hit:this.reticle.visible,tracking:!!pose});this.frames=0;this.lastReport=time;}
  }
  this.renderer.render(this.scene,this.camera);
 }
 async snapshot(){if(this.session)throw new Error('برای عکس AR از اسکرین‌شات گوشی استفاده کن.');this.renderer.render(this.scene,this.camera);return new Promise((resolve,reject)=>this.renderer.domElement.toBlob(b=>b?resolve(b):reject(Error('ثبت تصویر ممکن نشد.')),'image/png'));}
 destroy(){this.resizeObserver.disconnect();this.events.abort();this.renderer.setAnimationLoop(null);this.clear();this.disposeMesh(this.reticle);this.grid.geometry.dispose();this.grid.material.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}
