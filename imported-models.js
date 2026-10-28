import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

// All units are metres. Native Blender GLB dimensions are preserved; the
// quarter-turn only makes the long side of a sofa/table follow local X.
export const IMPORTED_MODELS=Object.freeze({
 22:{file:'sofaA1.glb',yaw:Math.PI/2,kind:'sofa'},
 23:{file:'SofaC1.glb',yaw:Math.PI/2,kind:'sofa'},
 24:{file:'sofab1.glb',yaw:Math.PI/2,kind:'sofa'},
 25:{file:'desks2.glb',yaw:Math.PI/2,kind:'table'},
 26:{file:'desks1.glb',yaw:0,kind:'table'},
 27:{file:'minidesk1.glb',yaw:Math.PI/2,kind:'glass-table'},
 28:{file:'lamp1.glb',yaw:0,kind:'table-lamp'},
 29:{file:'Lamp2.glb',yaw:0,kind:'floor-lamp'},
 30:{file:'decor1.glb',yaw:Math.PI/2,kind:'candles'},
 31:{file:'rug.glb',yaw:0,kind:'rug'}
});
const loader=new GLTFLoader();
const cache=new Map();
export const isImportedModel=index=>Object.hasOwn(IMPORTED_MODELS,index);
export const isImportedLight=index=>index===28||index===29;
export const isImportedNoShadow=index=>[28,29,30,31].includes(index);
const source=(file)=>{
 if(!cache.has(file)){
  const url=new URL('./assets/chido/'+file,import.meta.url).href;
  cache.set(file,loader.loadAsync(url).catch(error=>{cache.delete(file);throw error;}));
 }
 return cache.get(file);
};
function configureMeshes(model){
 model.traverse(object=>{
  if(!object.isMesh)return;
  // The original material maps, transmission, alpha and PBR values remain intact.
  object.castShadow=false;object.receiveShadow=false;
  object.geometry=object.geometry.clone();
  if(Array.isArray(object.material))object.material=object.material.map(m=>m.clone());
  else if(object.material)object.material=object.material.clone();
  const materials=Array.isArray(object.material)?object.material:[object.material];
  for(const material of materials){
   if(!material)continue;
   material.userData.nativeEmissive=material.emissive?.clone();
   material.userData.nativeEmissiveIntensity=material.emissiveIntensity??0;
   if(material.transparent || (material.transmission??0)>0){
    material.depthWrite=false;
    material.needsUpdate=true;
   }
  }
 });
}
function addLampLight(model,index,size){
 const light=new THREE.PointLight(0xffd5a3,0,3.6,2);
 light.name='chido-imported-point-light';
 light.position.set(0,index===29?size[1]*.33:size[1]*.17,0);
 light.castShadow=false;
 model.add(light);
 // Lamp2 contains a separate spherical bulb; only that material should emit.
 if(index===29){
  model.traverse(object=>{
   if(!object.isMesh||!/sphere/i.test(object.name))return;
   for(const material of Array.isArray(object.material)?object.material:[object.material]){
    if(!material?.emissive)continue;
    material.userData.nativeEmissive=new THREE.Color(0xffd5a3);
    material.userData.nativeEmissiveIntensity=1.5;
   }
  });
 }
}
export function createImportedModel(index,size){
 const spec=IMPORTED_MODELS[index];
 if(!spec)throw Error('Unknown GLB catalog index '+index);
 // Invisible 12-triangle mesh also serves as the simple collision/picking proxy.
 const proxy=new THREE.Mesh(new THREE.BoxGeometry(...size),
  new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));
 proxy.name='chido-model-'+spec.file;
 proxy.userData.imported=true;
 proxy.userData.collisionProxy=proxy;
 proxy.userData.assetSource=spec.file;
 proxy.userData.loadPromise=source(spec.file).then(gltf=>{
  if(proxy.userData.disposed)return;
  const visual=gltf.scene.clone(true);
  configureMeshes(visual);
  visual.rotation.y=spec.yaw;
  visual.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(visual);
  const center=box.getCenter(new THREE.Vector3());
  visual.position.x-=center.x;
  visual.position.z-=center.z;
  visual.position.y-=box.min.y+size[1]/2;
  visual.name='imported-visual';
  proxy.add(visual);
  if(isImportedLight(index))addLampLight(proxy,index,size);
  proxy.userData.modelLoaded=true;
  proxy.userData.onModelReady?.();
 }).catch(error=>{
  if(proxy.userData.disposed)return;
  proxy.userData.loadError=String(error?.message||error);
  proxy.material.opacity=.2;
  proxy.material.color.set('#cf654b');
  proxy.userData.onModelError?.(error);
 });
 return proxy;
}
