import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {createFurniture} from './furniture.js';
import {createDecor} from './decor.js';
import {CATALOG} from './spatial.js';
import {IMPORTED_MODELS,applySofaFabric} from './imported-models.js';

const thumbnails=new Map();
const loader=new GLTFLoader();
let renderer;
function getRenderer(){
 if(!renderer){renderer=new THREE.WebGLRenderer({alpha:false,antialias:true,preserveDrawingBuffer:true});renderer.setSize(144,144);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;}
 return renderer;
}
export function catalogThumbnail(index){
 if(thumbnails.has(index))return thumbnails.get(index);
 const task=(async()=>{
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
  scene.add(new THREE.HemisphereLight(0xffffff,0xd7d5d0,2));
  const key=new THREE.DirectionalLight(0xffffff,2.3);key.position.set(-3,6,5);scene.add(key);
  const size=CATALOG[index].size;
  let model;
  if(IMPORTED_MODELS[index]){
   const spec=IMPORTED_MODELS[index];
   const gltf=await loader.loadAsync(new URL('./assets/chido/'+spec.file,import.meta.url).href);
   model=gltf.scene;model.rotation.y=spec.yaw;
   if(index===22)applySofaFabric(model,'dark');
  }else model=index<4?createFurniture(index,size,'#a6ada8'):createDecor(index,size,'#bbb7b0');
  scene.add(model);model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model);
  const center=box.getCenter(new THREE.Vector3()),dims=box.getSize(new THREE.Vector3());
  model.position.sub(center);model.updateMatrixWorld(true);
  const span=Math.max(dims.x,dims.y,dims.z,.1);
  const camera=new THREE.PerspectiveCamera(35,1,.01,100);
  camera.position.set(span*1.6,span*1.25,span*1.8);camera.lookAt(0,0,0);
  getRenderer().render(scene,camera);
  return getRenderer().domElement.toDataURL('image/png');
 })().catch(()=>null);
 thumbnails.set(index,task);return task;
}
