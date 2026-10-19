import {CATALOG} from './spatial.js';
export function savedFootprints(scene){
 if(!scene||!Array.isArray(scene.items))return [];
 return scene.items.filter(m=>m&&m.hidden!==true&&CATALOG[m.index]&&Array.isArray(m.position)).map(m=>{
  const size=m.size||CATALOG[m.index].size;
  return {index:m.index,x:+m.position[0],z:+m.position[2],width:size[0],depth:size[2],rotation:m.rotation||0};
 });
}
export function savedPlanSvg(scene){
 const objects=savedFootprints(scene);
 const room='<rect x="8" y="8" width="304" height="218" rx="9" fill="#f3eee7" stroke="#c6baa9" stroke-width="3"/>';
 if(!objects.length)return '<svg viewBox="0 0 320 234" xmlns="http://www.w3.org/2000/svg">'+room+'</svg>';
 const extent=objects.reduce((e,o)=>({minX:Math.min(e.minX,o.x-o.width*.7),maxX:Math.max(e.maxX,o.x+o.width*.7),
  minZ:Math.min(e.minZ,o.z-o.depth*.7),maxZ:Math.max(e.maxZ,o.z+o.depth*.7)}),{minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity});
 const scale=Math.min(275/(extent.maxX-extent.minX||1),191/(extent.maxZ-extent.minZ||1),90);
 const cx=(extent.minX+extent.maxX)/2,cz=(extent.minZ+extent.maxZ)/2;
 const items=objects.map(o=>{
  const x=160+(o.x-cx)*scale,y=117+(o.z-cz)*scale;
  const w=o.width*scale,d=o.depth*scale;
  const fill=[0,1,3].includes(o.index)?'#cab8a4':o.index===7?'#dfcfb7':
    [10,2,12,13].includes(o.index)?'#a78d73':'#9ea792';
  return '<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+(o.rotation*180/Math.PI).toFixed(1)+')">'+
   '<rect x="'+(-w/2).toFixed(1)+'" y="'+(-d/2).toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+d.toFixed(1)+'" rx="4" fill="'+fill+'" stroke="#7b6a5a" stroke-width="1.5"/>'+
   ([0,1,3].includes(o.index)?'<path d="M'+(-w*.42).toFixed(1)+' 0h'+(w*.84).toFixed(1)+'" stroke="#998472"/>':'')+'</g>';
 }).join('');
 return '<svg viewBox="0 0 320 234" role="img" aria-label="پلان واقعی چیدمان ذخیره‌شده" xmlns="http://www.w3.org/2000/svg">'+room+items+'</svg>';
}
