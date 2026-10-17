import * as THREE from './vendor/three.module.js';

// A chamfered cuboid has only 68 triangles, with no textures or subdivisions.
function cushion(w,h,d,r){
 const half=[w/2,h/2,d/2],vertices=[];
 function face(points){for(let i=1;i<points.length-1;i++)vertices.push(...points[0],...points[i],...points[i+1]);}
 for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
  const u=(axis+1)%3,v=(axis+2)%3,a=half[u],b=half[v];
  const ring=[[-a+r,-b],[a-r,-b],[a,-b+r],[a,b-r],[a-r,b],[-a+r,b],[-a,b-r],[-a,-b+r]];
  const points=ring.map(([x,y])=>{const p=[0,0,0];p[axis]=sign*half[axis];p[u]=x;p[v]=y;return p;});
  face(sign>0?points:points.reverse());
 }
 for(let axis=0;axis<3;axis++)for(const su of [-1,1])for(const sv of [-1,1]){
  const u=(axis+1)%3,v=(axis+2)%3;
  const point=(s,du,dv)=>{const p=[0,0,0];p[axis]=s*(half[axis]-r);p[u]=su*(half[u]-du);p[v]=sv*(half[v]-dv);return p;};
  const points=[point(-1,0,r),point(1,0,r),point(1,r,0),point(-1,r,0)];
  face(su*sv>0?points.reverse():points);
 }
 for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
  const points=[[x*half[0],y*(half[1]-r),z*(half[2]-r)],[x*(half[0]-r),y*half[1],z*(half[2]-r)],[x*(half[0]-r),y*(half[1]-r),z*half[2]]];
  face(x*y*z>0?points:points.reverse());
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();return geometry;
}
function join(parts){
 const values=[];for(const geometry of parts){const g=geometry.index?geometry.toNonIndexed():geometry;values.push(...g.attributes.position.array);if(g!==geometry)g.dispose();geometry.dispose();}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(values,3));geometry.computeVertexNormals();return geometry;
}
export function createFurniture(index,size,color){
 const [w,h,d]=size,body=[],legs=[];
 const add=(collection,name,width,height,depth,x,y,z,bevel=0)=>{
  const geometry=bevel?cushion(width,height,depth,bevel):new THREE.BoxGeometry(width,height,depth);
  geometry.translate(x,y-h/2,z);collection.push(geometry);return {name};
 };
 const names=[];
 if(index===2){
  names.push(add(body,'tabletop',w,.065,d,0,h-.0325,0,.018));
  for(const x of [-1,1])for(const z of [-1,1])names.push(add(legs,'leg',.055,h-.065,.055,x*(w/2-.10),(h-.065)/2,z*(d/2-.10)));
 }else{
  const arm=.115,back=.16,seatCount=index===0?3:1,inside=w-2*arm;
  names.push(add(body,'base',w-.04,.18,d-.04,0,.29,0,.018));
  for(const x of [-1,1])names.push(add(body,'arm',arm,.39,d,x*(w-arm)/2,.435,0,.026));
  const seatDepth=d-back-.025;
  for(let i=0;i<seatCount;i++){
   const width=inside/seatCount-.012,x=-inside/2+(i+.5)*inside/seatCount;
   names.push(add(body,'seat',width,.13,seatDepth,x,.435,back/2,.023));
   names.push(add(body,'back',width,h-.48,back,x,(h+.48)/2,-(d-back)/2,.024));
  }
  for(const x of [-1,1])for(const z of [-1,1])names.push(add(legs,'leg',.065,.20,.065,x*(w/2-.13),.10,z*(d/2-.12)));
 }
 const geometry=join(body);geometry.parameters={width:w,height:h,depth:d};
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.94}));
 mesh.name=index===2?'low-poly-table':index===0?'low-poly-sofa':'low-poly-armchair';
 const feet=new THREE.Mesh(join(legs),new THREE.MeshStandardMaterial({color:'#71523b',roughness:.8}));feet.name='wooden-legs';mesh.add(feet);
 mesh.userData.parts=names.map(part=>part.name);
 return mesh;
}

// Child legs are selectable; guide labels/lines do not intercept object picking.
export function furnitureHit(ray,items){
 for(const hit of ray.intersectObjects(items,true)){
  if(!hit.object.isMesh)continue;
  let item=hit.object;while(item&&!items.includes(item))item=item.parent;
  if(item)return {...hit,object:item};
 }
 return null;
}
