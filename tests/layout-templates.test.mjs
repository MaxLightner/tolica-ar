import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedCapacities,layoutOptions,buildLayout,layoutSummary,layoutPreviewSvg,livingSeats} from '../layout-templates.js';
test('living capacities 5 to 13 match exactly, for every real layout shape',()=>{
 for(const count of [5,7,9,11,13]){
  assert.equal(livingSeats(count).reduce((a,b)=>a+b,0),count);
  const signatures=new Set();
  for(const option of layoutOptions('پذیرایی')){
   const recipe=buildLayout({room:'پذیرایی',kind:option.id,capacity:count});
   assert.equal(layoutSummary(recipe).seats,count);
   assert.ok(recipe.items.some(x=>x.index===2||x.index===13),'table must be present');
   assert.ok(recipe.items.length<=24,'avoid XR scene overload');
   assert.match(layoutPreviewSvg(recipe),/<svg/);
   const signature=recipe.items.filter(x=>x.seats).map(x=>[x.x.toFixed(2),x.z.toFixed(2),x.rotation.toFixed(2)].join(':')).join('|');
   assert.ok(!signatures.has(signature),'each layout type must have distinct positions');
   signatures.add(signature);
  }
 }
});
test('table seating count and matching preview for every dining option',()=>{
 for(const room of ['آشپزخانه','ناهارخوری'])for(const count of [2,4,6,8])for(const option of layoutOptions(room)){
  const recipe=buildLayout({room,kind:option.id,capacity:count});
  const table=recipe.items.find(x=>x.index===10);
  assert.ok(table);
  assert.equal(table.options.capacity,count);
  assert.equal(layoutSummary(recipe).chairs,count);
  assert.match(layoutPreviewSvg(recipe),/<svg/);
 }
});
test('bedrooms and office have distinct presets and can start empty',()=>{
 for(const room of ['اتاق خواب','فضای کار']){
  assert.ok(layoutOptions(room).length>=3);
  const plans=layoutOptions(room).map(x=>buildLayout({room,kind:x.id,capacity:4}));
  assert.ok(plans.every(x=>x.items.length>=3));
  assert.equal(new Set(plans.map(p=>p.items.map(x=>x.rotation+'-'+x.x).join(','))).size,plans.length);
 }
 assert.equal(buildLayout({kind:'empty'}).items.length,0);
});
test('room capacity choices are constrained to their proper furniture family',()=>{
 assert.deepEqual(allowedCapacities('پذیرایی'),[5,7,9,11,13]);
 assert.deepEqual(allowedCapacities('ناهارخوری'),[2,4,6,8]);
});
