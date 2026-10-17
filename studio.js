import * as THREE from './vendor/three.module.js';
import {requestARSession,xrError} from './xr.js?v=0.2.4';
import {SpatialState,CATALOG,pairAngle,wrappedAngle} from './spatial.js?v=0.2.4';
import {FloorScanner,floorCandidates} from './surfaces.js?v=0.2.4';
import {EnvironmentEffects} from './effects.js?v=0.2.4';
import {AnchorStabilizer,transformPoint} from './anchor-rig.js?v=0.2.4';
import {ARDebugView} from './ar-debug.js?v=0.2.6';
export const palette=['#b6bca2','#d5c4ad','#b9c4c6','#ba9380'];
const fa=n=>n.toLocaleString('fa-IR',{maximumFractionDigits:1});
export class Studio{
 constructor(host,changed){
  Object.assign(this,{host,changed,items:[],serial:0,selected:null,session:null,photoMode:false,tracking:true,anchor:null,anchorGeneration:0,anchorPending:false,anchorState:'بدون Anchor',lastStatus:'',lastReport:0,frames:0,fps:0,points:new Map(),gesture:null,needsAnchor:false});
  this.model=new SpatialState();this.scanner=new FloorScanner();this.anchorRig=new AnchorStabilizer();this.anchorNodes=[];this.anchorCandidates=[];this.anchorActive=false;this.anchorLastTime=0;this.extraHitSources=[];this.scanHits=0;this.scanDrop=null;this.scanDistance=null;this.revealStart=null;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#eeeee3');this.debugView=new ARDebugView(this.scene);this.debugView.setVisible(false);
  this.camera=new THREE.PerspectiveCamera(48,1,.03,40);this.camera.position.set(5.2,4.4,6);this.camera.lookAt(.6,0,-.5);
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.xr.enabled=true;this.renderer.xr.setReferenceSpaceType('local');host.prepend(this.renderer.domElement);
  this.effects=new EnvironmentEffects(this.scene,this.renderer);
  this.floorFrame=new THREE.Group();this.scene.add(this.floorFrame);this.root=new THREE.Group();this.floorFrame.add(this.root);
  // WebGL lineWidth is usually fixed on mobile: a shader gives a visible, soft grid.
   this.floorNet=new THREE.Mesh(
    new THREE.PlaneGeometry(6,6),
    new THREE.ShaderMaterial({
     transparent:true,depthWrite:false,side:THREE.DoubleSide,
     extensions:{derivatives:true},
     uniforms:{opacity:{value:.85},reveal:{value:1},pulse:{value:0}},
     vertexShader:`varying vec2 gridUv;void main(){gridUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
     fragmentShader:`precision highp float;
varying vec2 gridUv;
uniform float opacity;
uniform float reveal;
uniform float pulse;
void main(){
 vec2 cells=gridUv*24.0;
 vec2 dx=max(fwidth(cells),vec2(0.0001));
 vec2 line=abs(fract(cells+0.5)-0.5)/dx;
 float px=min(line.x,line.y);
 float core=1.0-smoothstep(0.7,1.65,px);
 float glow=1.0-smoothstep(1.2,5.2,px);
 float radius=length((gridUv-0.5)*6.0);
 float edge=1.0-smoothstep(reveal-0.06,reveal+0.06,radius);
 float rim=(1.0-smoothstep(0.025,0.11,abs(radius-reveal)))*(1.0-step(2.95,reveal));
 float alpha=clamp((0.72*core+0.32*glow)*opacity*edge+rim*0.65*pulse,0.0,0.95);
 gl_FragColor=vec4(mix(vec3(0.20,0.57,0.52),vec3(0.55,0.97,0.83),max(core,rim)),alpha);
}`
    })
   );
   this.floorNet.rotation.x=-Math.PI/2;
   this.floorNet.position.y=.004;
   this.floorFrame.add(this.floorNet);
   // Crosses represent sampled WebXR hits, NOT ARCore's raw feature point cloud.
   this.scanMarkers=new THREE.Group();this.scene.add(this.scanMarkers);
   const crossGeometry=new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-.016,0,-.016),new THREE.Vector3(.016,0,.016),
    new THREE.Vector3(-.016,0,.016),new THREE.Vector3(.016,0,-.016)
   ]);
   this.scanCrosses=Array.from({length:20},()=>{
    const marker=new THREE.LineSegments(crossGeometry,new THREE.LineBasicMaterial({color:0x83ffe3,transparent:true,opacity:.94,depthTest:false}));
    marker.renderOrder=10;marker.visible=false;this.scanMarkers.add(marker);return marker;
   });
  this.ruler=new THREE.Group();this.floorFrame.add(this.ruler);
  this.rulerLine=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,1,10),new THREE.MeshBasicMaterial({color:0xffae52,depthTest:false}));this.rulerLine.renderOrder=5;this.ruler.add(this.rulerLine);
  this.handleA=this.makeHandle('A',0xc47642);this.handleB=this.makeHandle('B',0x5a8a84);this.ruler.add(this.handleA,this.handleB);this.rulerLabel=this.makeLabel('A — B');this.ruler.add(this.rulerLabel);
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.events=new AbortController();const opts={signal:this.events.signal};
  this.attachInput(host,opts);const surface=document.querySelector('#arSurface');if(surface)this.attachInput(surface,opts);
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.syncSpatial();this.resize();this.renderer.setAnimationLoop((time,frame)=>this.frame(time,frame));
 }
 get placed(){return this.model.locked;}
 setDebugVisible(value){this.debugView.setVisible(value);}
 debugExport(){return this.debugView.exportLog();}
 resize(){if(this.session)return;const w=this.host.clientWidth,h=this.host.clientHeight;this.camera.aspect=w/Math.max(h,1);this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);}
 makeLabel(text){const canvas=document.createElement('canvas');let context=canvas.getContext('2d');context.font='42px Tahoma, sans-serif';canvas.width=Math.ceil(Math.max(90,context.measureText(text).width+44));canvas.height=100;context=canvas.getContext('2d');context.fillStyle='#fff9e9ee';context.beginPath();context.roundRect(2,2,canvas.width-4,96,16);context.fill();context.font='42px Tahoma, sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillStyle='#423c31';context.fillText(text,canvas.width/2,50);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.scale.set(canvas.width/500,.2,1);sprite.renderOrder=8;sprite.userData.text=text;return sprite;}
 setLabel(sprite,text){if(sprite.userData.text===text)return;const previous=sprite.material.map;const replacement=this.makeLabel(text);sprite.material.map=replacement.material.map;sprite.material.needsUpdate=true;sprite.userData.text=text;previous.dispose();replacement.material.dispose();}
 makeHandle(name,color){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.055,20,16),new THREE.MeshBasicMaterial({color,depthTest:false}));mesh.renderOrder=6;mesh.userData.handle=name;const label=this.makeLabel(name);label.scale.set(.27,.085,1);label.position.y=.19;mesh.add(label);return mesh;}
 syncSpatial(){this.model.apply(this.floorFrame,this.root);this.handleA.position.copy(this.model.a);this.handleA.position.y=.04;this.handleB.position.copy(this.model.b);this.handleB.position.y=.04;
  const mid=this.model.a.clone().add(this.model.b).multiplyScalar(.5);this.rulerLine.position.set(mid.x,.036,mid.z);this.rulerLine.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),this.model.b.clone().sub(this.model.a).normalize());this.rulerLine.scale.set(1,this.model.length,1);
  this.rulerLabel.position.copy(this.model.a).lerp(this.model.b,.5);this.rulerLabel.position.y=.15;this.setLabel(this.rulerLabel,`${fa(this.model.length/this.model.correction*100)} cm · A—B`);this.floorFrame.updateMatrixWorld(true);
 }
 add(index=this.serial%4,position){index=index%4;const product=CATALOG[index],id=++this.serial,[w,h,d]=product.size;const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:palette[index],roughness:.88}));
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:0x645748,transparent:true,opacity:.7}));mesh.add(edges);
  const dimensions=`${product.name} · ${product.size.map(v=>fa(v*100)).join(' × ')} cm`;const label=this.makeLabel(dimensions);label.position.y=h/2+.18;label.scale.set(1.5,.22,1);mesh.add(label);
  mesh.userData={id,index,height:h,price:product.price,product,edges,label};const defaults=[[0,h/2,-2.1],[2,h/2,-2.1],[.6,h/2,-.9],[2,h/2,-.6]];mesh.position.fromArray(defaults[index]);if(position)mesh.position.copy(position);mesh.position.y=h/2;this.root.add(mesh);this.items.push(mesh);this.select(mesh);this.setGuides();return mesh;
 }
 seed(kind='calm'){this.clear();if(kind==='empty')return;for(let i=0;i<4;i++)this.add(i);if(kind==='social'){this.items[3].position.set(-1.8,this.items[3].userData.height/2,.2);this.items[3].rotation.y=-Math.PI/3;}this.select(this.items[0]);}
 select(mesh){this.selected=mesh;for(const m of this.items)m.userData.edges.material.color.set(m===mesh?'#c3753c':'#645748');this.changed();}
 remove(){const m=this.selected;if(!m)return;this.items=this.items.filter(x=>x!==m);this.root.remove(m);this.disposeObject(m);this.select(this.items[0]||null);}
 clear(){for(const m of this.items){this.root.remove(m);this.disposeObject(m);}this.items=[];this.selected=null;this.serial=0;this.changed();}
 disposeObject(object){object.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});}
 rotate(degrees){if(!this.selected)return;this.selected.rotation.y=degrees===undefined?this.selected.rotation.y+Math.PI/12:degrees*Math.PI/180;this.keepOnFloor(this.selected);this.changed();}
 color(color){if(this.selected){this.selected.material.color.set(color);this.changed();}}
 calibrate(cm){this.model.calibrate(Number(cm)/100);this.syncSpatial();this.changed();return this.measurement();}
 resetCalibration(){this.model.resetCalibration();this.syncSpatial();this.changed();}
 setHeight(){throw Error('ارتفاع کف فقط از شناسایی واقعی تعیین می‌شود.');}
 measurement(){return {measuredCm:this.model.length*100,correctedCm:this.model.length/this.model.correction*100,scale:this.model.correction,actualCm:this.model.actualLength===null?null:this.model.actualLength*100,heightCm:this.model.heightOffset*100};}
 exportState(){return {spatial:this.model.snapshot(),items:this.items.map(m=>({index:m.userData.index,id:m.userData.id,position:m.position.toArray(),rotation:m.rotation.y,color:'#'+m.material.color.getHexString()}))};}
 restoreState(state){this.model.restore(state.spatial);for(const x of state.items){const mesh=this.add(x.index);mesh.userData.id=x.id;mesh.position.fromArray(x.position);mesh.position.y=mesh.userData.height/2;mesh.rotation.y=x.rotation;mesh.material.color.set(x.color);}this.serial=Math.max(0,...state.items.map(x=>x.id));this.syncSpatial();this.select(this.items[0]||null);}
 attachInput(target,opts){target.addEventListener('pointerdown',e=>this.down(e,target),opts);target.addEventListener('pointermove',e=>this.drag(e,target),opts);target.addEventListener('pointerup',e=>this.up(e,target),opts);target.addEventListener('pointercancel',()=>this.cancelGesture(),opts);target.addEventListener('lostpointercapture',e=>{if(this.points.has(e.pointerId))this.up(e,target);},opts);}
 activeCamera(){if(this.session)return this.renderer.xr.getCamera().cameras[0]||this.renderer.xr.getCamera();return this.camera;}
 setRay(e,target){const r=target.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.floorFrame.updateMatrixWorld(true);this.ray.setFromCamera(this.pointer,this.activeCamera());}
 pointOnFloor(e,target){this.setRay(e,target);return this.ray.ray.intersectPlane(this.model.plane,new THREE.Vector3());}
 floorLocal(point){return this.floorFrame.worldToLocal(point.clone());}
 rootLocal(point){return this.root.worldToLocal(point.clone());}
 keepOnFloor(mesh){if(mesh)mesh.position.y=mesh.userData.height/2;}
 hitHandle(e,target){const bounds=target.getBoundingClientRect();let best=null,distance=36;for(const h of [this.handleA,this.handleB]){const p=h.getWorldPosition(new THREE.Vector3()).project(this.activeCamera());if(p.z>1||p.z< -1)continue;const d=Math.hypot((p.x+1)*bounds.width/2+bounds.left-e.clientX,(1-p.y)*bounds.height/2+bounds.top-e.clientY);if(d<distance){distance=d;best=h.userData.handle;}}return best;}
 down(e,target){if(this.photoMode){this.onPhotoTap?.();return;}if(!this.model.locked||(this.session&&!this.tracking)||this.points.size>=2||(this.points.size===1&&['A','B'].includes(this.gesture?.kind)))return;e.preventDefault();target.setPointerCapture(e.pointerId);this.points.set(e.pointerId,{clientX:e.clientX,clientY:e.clientY});
  if(this.points.size===1){const p=this.pointOnFloor(e,target);if(!p){this.cancelGesture();return;}const handle=this.hitHandle(e,target);if(handle){this.gesture={kind:handle,offset:this.model[handle.toLowerCase()].clone().sub(this.floorLocal(p))};return;}
   this.setRay(e,target);const hit=this.ray.intersectObjects(this.items,false)[0];if(!hit){this.select(null);this.gesture=null;return;}this.select(hit.object);this.gesture={kind:'object',offset:hit.object.position.clone().sub(this.rootLocal(p))};
  }else if(this.points.size===2&&this.selected&&this.gesture?.kind==='object'){this.startTwist(target);}
 }
 twistAngle(target){const [a,b]=[...this.points.values()];if(!a||!b)return null;const dx=b.clientX-a.clientX,dy=b.clientY-a.clientY;if(Math.hypot(dx,dy)<.5)return null;return Math.atan2(-dy,dx);}
 startTwist(target){const angle=this.twistAngle(target);if(angle!==null)this.gesture={kind:'twist',start:angle,rotation:this.selected.rotation.y};}
 drag(e,target){if(!this.points.has(e.pointerId)||this.photoMode||(this.session&&!this.tracking))return;e.preventDefault();this.points.set(e.pointerId,{clientX:e.clientX,clientY:e.clientY});const g=this.gesture;if(!g)return;
  if(this.points.size===2&&this.selected){if(g.kind!=='twist'){this.startTwist(target);return;}const angle=this.twistAngle(target);if(angle!==null)this.selected.rotation.y=g.rotation+wrappedAngle(angle-g.start);this.keepOnFloor(this.selected);return;}
  if(this.points.size!==1||g.kind==='twist')return;const p=this.pointOnFloor(e,target);if(!p)return;
  if(g.kind==='object'&&this.selected){const local=this.rootLocal(p).add(g.offset);this.selected.position.x=local.x;this.selected.position.z=local.z;this.keepOnFloor(this.selected);}
  else if(g.kind==='A'){this.model.moveA(this.floorLocal(p).add(g.offset));this.syncSpatial();}
  else if(g.kind==='B'){this.model.moveB(this.floorLocal(p).add(g.offset));this.syncSpatial();}
 }
 up(e,target){this.points.delete(e.pointerId);if(this.points.size===1&&this.selected){const remaining=[...this.points.values()][0],p=this.pointOnFloor(remaining,target);this.gesture=p?{kind:'object',offset:this.selected.position.clone().sub(this.rootLocal(p))}:null;}else if(!this.points.size){this.gesture=null;this.changed();}}
 cancelGesture(){this.points.clear();this.gesture=null;}
 setGuides(){const show=!this.photoMode;this.floorNet.visible=show&&(this.model.locked||this.scanner.ready);this.ruler.visible=show&&this.model.locked;for(const m of this.items){m.userData.edges.visible=show;m.userData.label.visible=show;}}
 setPhotoMode(enabled){this.cancelGesture();this.photoMode=enabled;this.setGuides();this.changed();}
 status(message){if(this.lastStatus!==message){this.lastStatus=message;this.onStatus?.(message);}}
 dropAnchor(){this.anchorGeneration++;for(const item of this.anchorNodes)try{item.anchor.delete();}catch{}this.anchorNodes=[];this.anchorCandidates=[];this.anchorActive=false;this.anchorRig=new AnchorStabilizer();this.needsAnchor=false;this.anchorPending=false;this.anchorState='مختصات ثابت';}
 async startAR(status,report,basic=false,options={}){
  const session=await requestARSession(navigator.xr,document.querySelector('#overlay'),basic,options);this.session=session;this.onStatus=status;this.onReport=report;this.tracking=false;this.frames=0;this.fps=0;this.lastReport=performance.now();this.lastReportState='';this.lastStatus='';this.debugView.start();this.model.locked=false;this.model.heightOffset=0;this.model.resetCalibration();this.anchorRig=new AnchorStabilizer();this.scanMarkers.visible=true;this.scanHits=0;this.scanDrop=null;this.scanDistance=null;this.floorNet.material.uniforms.opacity.value=.85;this.syncSpatial();this.scanner.reset();this.debugView.note('scan started');this.root.visible=false;this.floorNet.visible=false;this.ruler.visible=false;this.scene.background=null;this.status('کف را اسکن کن؛ دوربین را آرام رو به پایین حرکت بده.');
  session.addEventListener('end',()=>this.endSession(),{once:true});let stage='renderer';
  try{await this.renderer.xr.setSession(session);stage='hit-test';await this.beginScan();this.hasOverlay=!!session.domOverlayState;this.effects.start(session,options);session.addEventListener('select',e=>{if(this.hasOverlay||!this.tracking||this.photoMode)return;if(!this.placed&&this.scanner.ready)this.confirmFloor();else this.selectAR(e);});return {hasOverlay:this.hasOverlay};}
  catch(error){try{await session.end();}catch{}throw xrError(error,stage);}
 }
 async beginScan(){const session=this.session;if(!session)return;this.dropAnchor();const generation=this.anchorGeneration;this.hitSource?.cancel();this.hitSource=null;for(const s of this.extraHitSources)try{s.cancel();}catch{}this.extraHitSources=[];this.revealStart=null;this.scanMarkers.visible=true;this.floorNet.material.uniforms.reveal.value=.65;this.floorNet.material.uniforms.pulse.value=1;this.scanCrosses.forEach(m=>m.visible=false);this.model.locked=false;this.scanner.reset();this.root.visible=false;this.ruler.visible=false;this.floorNet.visible=false;this.floorNet.material.uniforms.opacity.value=.85;this.cancelGesture();this.status('کف را پیدا کن؛ سطح پایین‌تر معمولاً کف است. سپس «تثبیت کف» را بزن.');const viewer=await session.requestReferenceSpace('viewer');const source=await session.requestHitTestSource({space:viewer,entityTypes:['plane']});if(this.session!==session||this.anchorGeneration!==generation){source.cancel();return;}this.hitSource=source;
  // Request auxiliary directions around the center; unsupported devices retain the central reticle.
  if(globalThis.XRRigidTransform){
   const offsets=[[-.24,0],[.24,0],[0,-.24],[0,.24],[-.18,-.18],[.18,-.18],[-.18,.18],[.18,.18]];
   for(const [x,y] of offsets){
    try{
     const direction=new THREE.Vector3(x,y,-1).normalize();
     const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,-1),direction);
     const transformed=await session.requestReferenceSpace('viewer');
     const raySpace=transformed.getOffsetReferenceSpace(new XRRigidTransform({}, {x:rotation.x,y:rotation.y,z:rotation.z,w:rotation.w}));
     const hit=await session.requestHitTestSource({space:raySpace,entityTypes:['plane']});
     if(this.session!==session||this.anchorGeneration!==generation){hit.cancel();break;}
     this.extraHitSources.push(hit);
    }catch(error){console.debug('Auxiliary WebXR hit test unavailable',error?.name||error);break;}
   }
  }}
 confirmFloor(){if(this.model.locked||!this.scanner.ready||!this.scanner.point)return false;this.model.lock(this.scanner.point);this.debugView.note('floor confirmed',{origin:this.model.origin.toArray()});this.model.heightOffset=0;this.syncSpatial();this.root.visible=false;this.revealStart=performance.now();this.scanMarkers.visible=false;this.setGuides();this.needsAnchor=true;this.initialFloorOrigin=this.model.origin.toArray();this.anchorCandidates=[...this.scanner.observations];this.anchorCandidates.unshift(this.scanner.point.clone());this.status('کف ثابت شد. A و B را روی مرجع معلوم بگذار؛ سپس طول واقعی را وارد کن.');this.changed();return true;}
 updateAnchor(frame,space,time){
  if(this.needsAnchor){
   this.needsAnchor=false;
   if(frame.createAnchor&&globalThis.XRRigidTransform)this.anchorActive=true;
   else{this.anchorState='مختصات ثابت (بدون Anchors API)';this.hitSource?.cancel();this.hitSource=null;}
  }
  if(this.anchorActive&&this.hitSource&&this.anchorNodes.length+Number(this.anchorPending)<5){
   const results=frame.getHitTestResults(this.hitSource);
   const viewerPose=frame.getViewerPose(space);
   const viewer=viewerPose?.transform.position;
   const candidates=floorCandidates(results,space,viewer?new THREE.Vector3(viewer.x,viewer.y,viewer.z):null);
   for(const c of candidates){
    if(Math.abs(c.point.y-this.initialFloorOrigin[1])>.055)continue;
    if(this.anchorCandidates.every(p=>p.distanceTo(c.point)>.42))this.anchorCandidates.push(c.point.clone());
   }
  }
  if(this.anchorActive&&!this.anchorPending&&this.anchorNodes.length<5){
   const next=this.anchorCandidates.find(p=>this.anchorNodes.every(item=>item.requested.distanceTo(p)>.42));
   if(next){
    const generation=this.anchorGeneration,session=this.session;
    this.anchorPending=true;
    try{
     Promise.resolve(frame.createAnchor(new XRRigidTransform({x:next.x,y:next.y,z:next.z}),space)).then(anchor=>{
      if(this.anchorGeneration!==generation||this.session!==session){anchor.delete();return;}
      this.anchorNodes.push({anchor,requested:next.clone(),reference:null,id:this.anchorNodes.length+1});
      this.anchorPending=false;
     },()=>{if(this.anchorGeneration===generation){this.anchorPending=false;this.anchorCandidates=this.anchorCandidates.filter(p=>p!==next);}});
    }catch{this.anchorPending=false;this.anchorCandidates=this.anchorCandidates.filter(p=>p!==next);}
   }
  }
  const samples=[];
  for(const item of this.anchorNodes){
   let pose;try{pose=frame.getPose(item.anchor.anchorSpace,space);}catch{}
   if(!pose)continue;
   const pos=pose.transform.position,point=[pos.x,pos.y,pos.z];
   if(!item.reference)item.reference=[...point];
   samples.push({id:item.id,reference:item.reference,observed:point});
  }
  if(samples.length>=3){
   const elapsed=this.anchorLastTime?Math.max(.001,(time-this.anchorLastTime)/1000):.016;
   this.anchorLastTime=time;
   const state=this.anchorRig.update(samples,elapsed);
   if(state.status!=='insufficient'){
    const point=transformPoint(this.initialFloorOrigin,state.pose);
    this.model.setAnchorTranslation(new THREE.Vector3(...point),state.pose.yaw);
    this.syncSpatial();
   }
   this.anchorState=`${state.inliers.length}/${this.anchorNodes.length} نقاط · ${state.status}`;
  }else this.anchorState=`${this.anchorNodes.length}/۵ نقطه · آماده‌سازی`;
  if(this.anchorNodes.length>=5){this.hitSource?.cancel();this.hitSource=null;}
 }
 selectAR(event){if(!this.model.locked)return;const pose=event.frame.getPose(event.inputSource.targetRaySpace,this.renderer.xr.getReferenceSpace());if(!pose)return;const matrix=new THREE.Matrix4().fromArray(pose.transform.matrix);this.ray.ray.origin.setFromMatrixPosition(matrix);this.ray.ray.direction.set(0,0,-1).transformDirection(matrix);this.floorFrame.updateMatrixWorld(true);const hit=this.ray.intersectObjects(this.items,false)[0];if(hit)this.select(hit.object);}
 endSession(){try{this.hitSource?.cancel();}catch{}for(const s of this.extraHitSources)try{s.cancel();}catch{}this.extraHitSources=[];this.hitSource=null;this.debugView.note('AR session ended');this.dropAnchor();this.needsAnchor=false;this.session=null;this.model.origin.set(0,0,0);this.model.anchorYaw=0;this.model.heightOffset=0;this.model.locked=true;this.tracking=true;this.root.visible=true;this.photoMode=false;this.scanMarkers.visible=false;this.syncSpatial();this.setGuides();this.effects.reset();this.scene.background=new THREE.Color('#eeeee3');this.camera.position.set(5.2,4.4,6);this.camera.lookAt(.6,0,-.5);this.cancelGesture();this.resize();document.querySelector('#overlay').hidden=true;this.onEnd?.();this.changed();}
 frame(time,frame){
  if(frame&&this.session){const space=this.renderer.xr.getReferenceSpace(),pose=frame.getViewerPose(space);this.tracking=!!pose;
   if(!pose){this.cancelGesture();this.status('ردیابی قطع شد؛ چیدمان جابجا نمی‌شود. دوربین را آرام به محیط برگردان.');}
   else if(!this.model.locked&&this.hitSource){const viewer=new THREE.Vector3(pose.transform.position.x,pose.transform.position.y,pose.transform.position.z);const centralResults=frame.getHitTestResults(this.hitSource);
     const additional=[];
     for(const source of this.extraHitSources){try{additional.push(...frame.getHitTestResults(source));}catch{}}
     const forward=new THREE.Vector3(0,0,-1).applyQuaternion(new THREE.Quaternion(pose.transform.orientation.x,pose.transform.orientation.y,pose.transform.orientation.z,pose.transform.orientation.w));
     const point=this.scanner.update(centralResults,additional,space,viewer,time,forward);
     this.scanHits=this.scanner.rawHits;
     this.scanCrosses.forEach((marker,i)=>{
      const c=this.scanner.currentHits[i];marker.visible=!!c;
      if(c){marker.position.copy(c.point);marker.position.y+=.009;marker.rotation.y=i*1.4;marker.material.color.setHex(c.accepted?0x83ffe3:0xff6b61);}
     });
     if(point){
      this.scanDrop=viewer.y-point.y;this.scanDistance=viewer.distanceTo(point);
      this.floorFrame.position.copy(point);this.floorFrame.rotation.set(0,0,0);
      const dist=viewer.distanceTo(point);
      const camera=this.activeCamera();const fov=camera.isPerspectiveCamera?camera.fov:48;
      const radius=THREE.MathUtils.clamp(dist*Math.tan(THREE.MathUtils.degToRad(fov/2))/3,.28,.95);
      this.floorNet.material.uniforms.reveal.value=radius;
      this.floorNet.material.uniforms.pulse.value=1;
      this.root.visible=false;this.floorNet.visible=!this.photoMode;this.ruler.visible=false;
      this.status('دایره را روی کف قرار بده و «تثبیت این کف» را بزن.');
      if(!this.hasOverlay)this.confirmFloor();
     }else{
      this.scanDrop=null;this.scanDistance=null;this.root.visible=false;this.floorNet.visible=false;
      this.status('سطحی در مرکز دید پیدا نشد؛ گوشی را آرام حرکت بده.');
     }}
   else if(this.model.locked){
     if(this.revealStart!==null){
      const t=Math.min(1,(performance.now()-this.revealStart)/750);
      const eased=1-Math.pow(1-t,3);
      this.floorNet.material.uniforms.reveal.value=.65+3.6*eased;
      this.floorNet.material.uniforms.pulse.value=1-eased;
      this.floorNet.material.uniforms.opacity.value=.85-.46*eased;
      this.root.visible=t>.68;
      if(t>=1)this.revealStart=null;
     }
     this.updateAnchor(frame,space,time);if(!this.photoMode)this.status('A: انتقال ست · B: جهت ست · یک انگشت: حرکت · دو انگشت: چرخش');}
   this.debugView.tick(frame,space,this,time);this.effects.update(frame,time,this.fps);this.frames++;if(time-this.lastReport>=750){this.fps=Math.round(this.frames*1000/(time-this.lastReport));this.frames=0;this.lastReport=time;}
   const report={fps:this.fps,objects:this.items.length,visible:this.root.visible&&pose?this.items.length:0,placed:this.model.locked,hit:this.scanner.ready,scanHits:this.scanHits,validHits:this.scanner.validHits,inlierHits:this.scanner.inlierHits,scanDrop:this.scanDrop,scanDistance:this.scanDistance,tracking:!!pose,anchor:this.anchorState,light:this.effects.lightState,depth:this.effects.depthState,photo:this.photoMode,...this.measurement()};const state=JSON.stringify(report);if(state!==this.lastReportState){this.onReport?.(report);this.lastReportState=state;}
  }
  this.scaleLabels();this.renderer.render(this.scene,this.camera);
 }
 scaleLabels(){if(this.photoMode)return;const camera=this.activeCamera(),eye=camera.getWorldPosition(new THREE.Vector3()),height=this.session?document.querySelector('#arSurface').clientHeight:this.host.clientHeight;
  const labels=[this.rulerLabel,this.handleA.children[0],this.handleB.children[0],...this.items.map(m=>m.userData.label)];
  for(const label of labels){if(!label.visible||!label.material.map)continue;const distance=eye.distanceTo(label.getWorldPosition(new THREE.Vector3())),pixels=label===this.selected?.userData.label?34:label===this.rulerLabel?32:label.parent===this.handleA||label.parent===this.handleB?34:24;
   const parentScale=label.parent.getWorldScale(new THREE.Vector3()),worldHeight=2*distance*pixels/(Math.max(height,1)*camera.projectionMatrix.elements[5]);const image=label.material.map.image;label.scale.set(worldHeight*(image.width/image.height)/parentScale.x,worldHeight/parentScale.y,1);
  }
 }
 async snapshot(){if(this.session)throw Error('در AR از اسکرین‌شات گوشی استفاده کن.');const before=this.photoMode;this.setPhotoMode(true);this.renderer.render(this.scene,this.camera);try{return await new Promise((resolve,reject)=>this.renderer.domElement.toBlob(blob=>blob?resolve(blob):reject(Error('ثبت نشد')),'image/png'));}finally{this.setPhotoMode(before);}}
 destroy(){this.resizeObserver.disconnect();this.events.abort();this.renderer.setAnimationLoop(null);this.dropAnchor();this.clear();this.disposeObject(this.ruler);this.scanCrosses[0]?.geometry.dispose();for(const m of this.scanCrosses)m.material.dispose();this.debugView.dispose();this.floorNet.geometry.dispose();this.floorNet.material.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}


