import {CATALOG} from './spatial.js';
const categoryByIndex=index=>[0,1,3].includes(index)?'seating':[2,12,13].includes(index)?'low-tables':[9,10,11].includes(index)?'dining':index===9?'workspace':index>=16?'wall-art':'decor';
export const ASSET_CATEGORIES=Object.freeze([
 {id:'seating',label:'مبل و نشیمن',indexes:[1,0,3]},
 {id:'low-tables',label:'میز جلو مبلی و عسلی',indexes:[2,12,13]},
 {id:'dining',label:'میز ناهارخوری و صندلی',indexes:[10,11]},
 {id:'workspace',label:'میز کار و مطالعه',indexes:[9]},
 {id:'decor',label:'آباژور و دکور',indexes:[4,6,14,15,7,5]},
 {id:'wall-art',label:'تابلو و دیوارکوب',indexes:[16,17,18,19,20,21]}
]);
export function assetMetadata(index,size=CATALOG[index]?.size){
 if(!size)throw RangeError('Unknown asset');
 const category=categoryByIndex(index);
 const tables=[2,9,10,12,13],sofas=[0,1,3];
 const surfaces=tables.includes(index)?[{name:'tabletop',kind:'horizontal',height:size[1],width:size[0]*.84,depth:size[2]*.84}]:
 sofas.includes(index)?[{name:'sofa-seat',kind:'seat',height:.48,width:size[0]-.2,depth:.37,backAngle:80}]:[];
 return {
  index,category,variantGroup:sofas.includes(index)?'sofa':tables.includes(index)?'table':
   [6,14,15].includes(index)?'lamp':index>=16?'art':'decor',
  collision:{kind:'box',size:[...size]},
  footprint2D:{shape:index===7?'rug':index>=16?'wall-rect':'rect',width:size[0],depth:size[2]},
  placement:index>=16?'virtual-wall':index===5?'sofa':'floor',
  supportSurfaces:surfaces,
  features:{seats:sofas.includes(index),cushions:sofas.includes(index),
   capacity:index===10,power:[6,14,15].includes(index),material:true,
   variants:sofas.includes(index)||tables.includes(index)||[6,14,15].includes(index)||index>=16}
 };
}
export const isLamp=index=>[6,14,15].includes(index);
export const isSofa=index=>[0,1,3].includes(index);
export const isTable=index=>[2,9,10,12,13].includes(index);
export const isWallArt=index=>index>=16&&index<=21;
export function categoryForIndex(index){return ASSET_CATEGORIES.find(c=>c.indexes.includes(index))?.id||'decor';}
export function variantsFor(index){const category=categoryForIndex(index);if(category==='seating')return [1,0,3];if(category==='low-tables')return [2,12,13];if(category==='dining')return index===10?[10]:[10,11];if(isLamp(index))return [6,14,15];if(isWallArt(index))return [16,17,18,19,20,21];return [index];}
