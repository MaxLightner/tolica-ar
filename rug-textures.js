import * as THREE from './vendor/three.module.js';

// Six original, tiny procedural woven-rug designs. One 256x384 canvas per material,
// no remote downloads and no copyrighted photo assets.
export const RUG_STYLES=Object.freeze([
 {id:'laki',name:'ایرانی لاکی',base:'#8e2837',border:'#d4b978',accent:'#27464b'},
 {id:'cream',name:'کرم روشن',base:'#e5d8be',border:'#b19b7e',accent:'#918f76'},
 {id:'silk',name:'سبز ابریشمی',base:'#517e76',border:'#e2c89a',accent:'#b1d2be'},
 {id:'kilim',name:'گلیم رنگی',base:'#c06d50',border:'#f0d19d',accent:'#375b6a'},
 {id:'fantasy',name:'فانتزی هندسی',base:'#c8bac0',border:'#4f7378',accent:'#d7ad78'},
 {id:'neutral',name:'مدرن خنثی',base:'#b4a696',border:'#eee4d6',accent:'#69746c'}
]);
const styleById=id=>RUG_STYLES.find(s=>s.id===id)||RUG_STYLES[0];
const r=(ctx,x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
function diamond(ctx,x,y,rx,ry,fill,stroke){
 ctx.beginPath();ctx.moveTo(x,y-ry);ctx.lineTo(x+rx,y);ctx.lineTo(x,y+ry);ctx.lineTo(x-rx,y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}
function woven(ctx,s){
 const w=256,h=384;
 r(ctx,0,0,w,h,s.base);
 // Thread variation is deterministic and subtle, avoiding flat vector look.
 for(let y=0;y<h;y+=3){ctx.globalAlpha=.085;r(ctx,0,y,w,1,y%2?'#fff9e8':'#211e22');}ctx.globalAlpha=1;
 if(s.id==='fantasy'||s.id==='neutral'){
  for(let i=0;i<7;i++){
   const x=26+(i*47)%190,y=38+i*46;
   ctx.save();ctx.translate(x,y);ctx.rotate((i%3-1)*.45);r(ctx,-27,-6,65,14,i%2?s.border:s.accent);ctx.restore();
  }
  for(let i=0;i<5;i++){ctx.strokeStyle=i%2?s.border:s.accent;ctx.lineWidth=5;ctx.beginPath();ctx.arc(140,190,(i+1)*20,.18,Math.PI*1.28);ctx.stroke();}
  if(s.id==='neutral'){r(ctx,17,20,10,340,s.border);r(ctx,218,20,14,340,s.accent);}
 }else if(s.id==='kilim'){
  for(let row=0;row<6;row++)for(let col=0;col<3;col++){
   const x=54+col*74,y=52+row*55;
   diamond(ctx,x,y,30,22,(col+row)%2?s.border:s.accent,'#e7d4b6');
   diamond(ctx,x,y,11,9,s.base);
  }
 }else{
  r(ctx,9,10,w-18,h-20,s.border);
  r(ctx,17,18,w-34,h-36,s.base);
  r(ctx,23,24,w-46,h-48,s.accent);
  r(ctx,30,31,w-60,h-62,s.base);
  for(let i=0;i<15;i++){
   const x=29+i*14;
   diamond(ctx,x,25,5,5,i%2?s.border:s.accent);
   diamond(ctx,x,359,5,5,i%2?s.border:s.accent);
  }
  for(let i=0;i<20;i++){
   diamond(ctx,24,30+i*16,5,6,i%2?s.border:s.accent);
   diamond(ctx,232,30+i*16,5,6,i%2?s.border:s.accent);
  }
  diamond(ctx,128,190,76,123,s.border,s.accent);
  diamond(ctx,128,190,60,99,s.accent,s.base);
  diamond(ctx,128,190,44,74,s.base,s.border);
  diamond(ctx,128,190,23,43,s.border,s.accent);
  diamond(ctx,128,190,8,14,s.accent);
  for(const y of [78,302])for(const x of [62,194]){
   diamond(ctx,x,y,18,27,s.accent,s.border);diamond(ctx,x,y,8,13,s.border);
  }
 }
 // tiny stylised fringe on two short edges
 ctx.strokeStyle=s.border;ctx.lineWidth=1;
 for(let x=14;x<243;x+=5){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,7);ctx.moveTo(x,378);ctx.lineTo(x,384);ctx.stroke();}
}
export function makeRugTexture(id){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=384;
 woven(canvas.getContext('2d'),styleById(id));
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.anisotropy=2;texture.needsUpdate=true;return texture;
}
export function applyRugStyle(mesh,id){
 if(!mesh?.material)return;
 const style=styleById(id);
 mesh.material.map?.dispose();
 mesh.material.map=makeRugTexture(style.id);
 mesh.material.color.set('#ffffff');mesh.material.roughness=1;mesh.material.needsUpdate=true;
 mesh.userData.rugStyle=style.id;
}
