// Single source of truth for the top-down preview and AR object placement.
// All lengths are metres; +Z faces the viewer, local scene floor is Y=0.
export const LIVING_CAPACITIES=Object.freeze([5,7,9,11,13]);
export const DINING_CAPACITIES=Object.freeze([2,4,6,8]);

export function allowedCapacities(room){
 return room==='پذیرایی'?LIVING_CAPACITIES:
  (room==='ناهارخوری'||room==='آشپزخانه')?DINING_CAPACITIES:[2,4,6,8];
}
export function layoutOptions(room){
 if(room==='پذیرایی')return [
  {id:'conversation',title:'گفت‌وگومحور',description:'نشستن رو به یکدیگر، دور میز'},
  {id:'tv',title:'روبه‌روی تلویزیون',description:'مبل اصلی مقابل نمایشگر'},
  {id:'u',title:'چیدمان U',description:'دو بال در طرفین میز'},
  {id:'l',title:'چیدمان L',description:'استفاده از کنج و فضای باز'},
  {id:'facing',title:'روبه‌رو و متقارن',description:'چیدمان رسمی برای پذیرایی'}
 ];
 if(room==='ناهارخوری'||room==='آشپزخانه')return [
  {id:'dining-center',title:'مرکزی',description:'میز در مرکز فضا'},
  {id:'dining-diagonal',title:'مورب',description:'چیدمانی پویا با میز چرخیده'},
  {id:'dining-side',title:'کنار دیوار',description:'آزاد شدن مسیر رفت‌وآمد'}
 ];
 if(room==='اتاق خواب')return [
  {id:'bed-center',title:'تخت مرکزی',description:'دسترسی از هر دو سمت'},
  {id:'bed-corner',title:'تخت گوشه‌ای',description:'فضای بیشتر برای رفت‌وآمد'},
  {id:'bed-open',title:'اتاق خواب باز',description:'تخت با فضای آزاد در کنار آن'}
 ];
 return [
  {id:'work-focus',title:'میز رو به دیوار',description:'مناسب تمرکز'},
  {id:'work-open',title:'میز مرکزی',description:'فضای بازتر'},
  {id:'work-corner',title:'کار در گوشه',description:'استفاده بهینه از فضا'}
 ];
}
export function livingSeats(capacity){
 const recipes={
  5:[3,1,1],
  7:[3,2,1,1],
  9:[3,3,2,1],
  11:[3,3,2,2,1],
  13:[3,3,3,2,2]
 };
 const result=recipes[capacity]||recipes[5];return [...result];
}
const vec=(x,z,rotation=0)=>({x,z,rotation});
const sofa=(seats,point)=>({index:seats===1?1:0,seats,options:{size:[seats===1?.9:seats===2?1.62:2.1,.85,.9],seats},...point});
const item=(index,point,options={})=>({index,...point,options});
const rotatePoint=(p,yaw,dx=0,dz=0)=>({...p,x:p.x*Math.cos(yaw)+p.z*Math.sin(yaw)+dx,z:-p.x*Math.sin(yaw)+p.z*Math.cos(yaw)+dz,rotation:(p.rotation||0)+yaw});
function seatingPositions(kind,n){
 // Coordinated furniture groups around a shared focal point, in metres.
 // Every template has a clear sightline and usable gaps beside the principal sofa.
 const positions={
  conversation:[vec(0,-3.55,0),vec(-2.4,-1.55,Math.PI/2),vec(2.4,-1.55,-Math.PI/2),vec(0,.55,Math.PI),vec(-3.0,-3.65,.35)],
  tv:[vec(0,-3.55,0),vec(-2.55,-2.35,.28),vec(2.55,-2.35,-.28),vec(-2.55,-4.40,.28),vec(2.55,-4.40,-.28)],
  u:[vec(0,-3.55,0),vec(-2.5,-1.65,Math.PI/2),vec(2.5,-1.65,-Math.PI/2),vec(0,.60,Math.PI),vec(-2.5,.45,Math.PI/2)],
  l:[vec(-1.35,-3.55,0),vec(1.4,-3.55,0),vec(2.8,-1.25,-Math.PI/2),vec(2.8,.75,-Math.PI/2),vec(-2.4,-1.55,Math.PI/2)],
  facing:[vec(-1.42,-3.55,0),vec(1.42,-3.55,0),vec(-1.42,.55,Math.PI),vec(1.42,.55,Math.PI),vec(-3.15,-1.5,Math.PI/2)]
 };
 return (positions[kind]||positions.conversation).slice(0,n);
}
function makeLiving(kind,capacity){
 const seats=livingSeats(capacity),points=seatingPositions(kind,seats.length);
 // A shared carpet gives the group an intentional visual centre.
 const result=seats.map((count,i)=>sofa(count,points[i]));
 result.push(item(7,vec(0,-1.65),{size:[3.2,.015,2.1]}));
 result.push(item(kind==='l'?13:2,vec(kind==='l'?.22:0,-1.65)));
 // Side table and floor lamp are positioned outside walking and seating footprints.
 result.push(item(12,vec(kind==='l'?-2.35:-1.55,-3.0)));
 result.push(item(6,vec(kind==='tv'?3.7:-3.55,-3.65)));
 if(capacity>=9)result.push(item(12,vec(1.55,.15)));
 return result;
}
function makeDining(kind,capacity){
 const count=DINING_CAPACITIES.includes(capacity)?capacity:4;
 const w={2:1.05,4:1.35,6:1.85,8:2.35}[count],points=[];
 const rotation=kind==='dining-diagonal'?.32:kind==='dining-side'?.0:0;
 const dx=kind==='dining-side'?-1.05:0,dz=-1.8;
 const table=item(10,vec(dx,dz,rotation),{size:[w,.75,.86],capacity:count});
 points.push(table);
 for(let i=0;i<count/2;i++)for(const side of [-1,1]){
  const x=(i-(count/2-1)/2)*.55,z=side*.78;
  const loc=rotatePoint(vec(x,z,side===1?Math.PI:0),rotation,dx,dz);
  points.push(item(11,loc));
 }
 // A lightweight accent plant does not change dining capacity.
 if(kind==='dining-center')points.push(item(4,vec(dx+.24,dz))); // surface-snapped on the table
 if(kind==='dining-side')points.push(item(6,vec(1.75,-2)));
 return points;
}
function makeBedroom(kind){
 const angle=kind==='bed-corner'?.17:kind==='bed-open'?-Math.PI/2:0;
 const dx=kind==='bed-corner'?-1.05:0,dz=-2;
 const plan=[item(7,vec(dx,dz,angle)),item(8,vec(dx,dz,angle)),
  item(6,vec(dx-1.35,dz-.6)),item(12,vec(dx+1.25,dz-.45))];
 if(kind==='bed-open')plan[3]=item(4,vec(dx+1.65,dz-.5));
 return plan;
}
function makeOffice(kind){
 const yaw=kind==='work-corner'?.82:kind==='work-open'?-Math.PI/2:0,dx=kind==='work-corner'?-.95:0,dz=-2;
 const plan=[item(9,vec(dx,dz,yaw)),item(11,vec(dx,-1.05,yaw)),
 item(6,vec(dx-1.05,dz-.2)),item(7,vec(dx,-1.4,yaw))];
 if(kind==='work-open')plan[2]=item(4,vec(1.8,-2.1));
 return plan;
}
export function buildLayout({room='پذیرایی',kind='conversation',capacity=5}={}){
 if(kind==='empty')return {room,kind,capacity,items:[]};
 const options=layoutOptions(room);
 const chosen=options.some(x=>x.id===kind)?kind:options[0].id;
 const items=room==='پذیرایی'?makeLiving(chosen,capacity):
 (room==='آشپزخانه'||room==='ناهارخوری')?makeDining(chosen,capacity):
 room==='اتاق خواب'?makeBedroom(chosen):makeOffice(chosen);
 return {room,kind:chosen,capacity,items};
}
export function layoutSummary(layout){
 const seats=layout.items.filter(x=>x.index===0||x.index===1).reduce((s,x)=>s+x.seats,0);
 const chairs=layout.items.filter(x=>x.index===11).length;
 const tables=layout.items.filter(x=>[2,10,12,13].includes(x.index)).length;
 return {seats,chairs,tables,objects:layout.items.length};
}
export function layoutPreviewSvg(layout){
 const room='<rect x="9" y="9" width="300" height="211" rx="9" fill="#f4efe9" stroke="#c6b9ad" stroke-width="4"/><path d="M113 9h89" stroke="#88b5ad" stroke-width="5"/>';
 if(!layout.items.length)return `<svg viewBox="0 0 318 231" xmlns="http://www.w3.org/2000/svg">${room}<text x="159" y="117" text-anchor="middle" font-size="13" fill="#887d70">فضای خالی برای چیدمان</text></svg>`;
 const fit=layout.items.reduce((a,x)=>{
  const [w,,d]=x.options?.size||(
   x.index===0?[x.seats===2?1.62:2.1,.85,.9]:
   x.index===1?[.9,.85,.9]:x.index===10?[1.7,.75,.86]:
   x.index===11?[.48,.9,.47]:x.index===8?[1.65,.95,2.08]:
   [x.index===7?2.4:x.index===9?1.4:x.index===13?1.15:.7,.5,x.index===7?1.7:.6]
  );
  a.minX=Math.min(a.minX,x.x-w*.65);a.maxX=Math.max(a.maxX,x.x+w*.65);
  a.minZ=Math.min(a.minZ,x.z-d*.65);a.maxZ=Math.max(a.maxZ,x.z+d*.65);return a;
 },{minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity});
 const spanX=fit.maxX-fit.minX,spanZ=fit.maxZ-fit.minZ;
 const scale=Math.min(266/spanX,179/spanZ,54);
 const xoffset=159-(fit.minX+fit.maxX)*scale/2,zoffset=115-(fit.minZ+fit.maxZ)*scale/2;
 const svgItems=layout.items.map(o=>{
  const getsize=()=>o.options?.size||
   (o.index===0?[o.seats===2?1.62:2.1,.85,.9]:
    o.index===1?[.9,.85,.9]:o.index===10?[1.7,.75,.86]:o.index===11?[.48,.9,.47]:
    o.index===8?[1.65,.95,2.08]:o.index===7?[2.4,.015,1.7]:
    o.index===12?[.48,.48,.48]:o.index===13?[1.15,.42,1.15]:[.75,.5,.6]);
  const [w,,d]=getsize(),px=xoffset+o.x*scale,py=zoffset+o.z*scale;
  const isSofa=[0,1,3].includes(o.index),isTable=[2,10,12,13,9].includes(o.index);
  const fill=o.index===7?'#ded0bd':isSofa?'#d8c7b6':isTable?'#ab9179':o.index===11?'#dac1ae':o.index===6?'#869987':o.index===4?'#789b7e':'#c9b9a8';
  const rect=`<rect x="${(-w*scale/2).toFixed(1)}" y="${(-d*scale/2).toFixed(1)}" width="${(w*scale).toFixed(1)}" height="${(d*scale).toFixed(1)}" rx="${isSofa?7:isTable?4:3}" fill="${fill}" stroke="#827267" stroke-width="1.4"/>`;
  const lines=isSofa?`<path d="M${-w*scale*.42} ${-d*scale*.28}h${w*scale*.84}M${-w*scale*.42} 0h${w*scale*.84}" stroke="#9c8a7c" stroke-width="1.2"/>`:o.index===11?`<path d="M${-w*scale*.4} ${-d*scale*.32}h${w*scale*.8}" stroke="#8c7e71" stroke-width="2"/>`:'';
  return `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${(o.rotation*180/Math.PI).toFixed(1)})">${rect}${lines}</g>`;
 }).join('');
 return `<svg viewBox="0 0 318 231" role="img" aria-label="پلان واقعی چیدمان ${layout.capacity} نفره" xmlns="http://www.w3.org/2000/svg">${room}${svgItems}</svg>`;
}
