import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,readSettings,saveSettings,displayDimension} from '../settings-store.js';
import {packProject,unpackProject,FEATURES} from '../project-services.js';
const store=()=>{const map=new Map();return {getItem:key=>map.get(key)??null,setItem:(key,v)=>map.set(key,v)};};
test('defaults, bounds and local persistence',()=>{
 const s=store();assert.equal(readSettings(s).brightness,1);
 saveSettings({brightness:9,gamma:0,units:'in',grid:false,occlusion:false},s);
 const r=readSettings(s);assert.equal(r.brightness,1.8);assert.equal(r.gamma,.75);assert.equal(r.grid,false);assert.equal(r.units,'in');
 assert.equal(typeof displayDimension(1,'cm'),'string');assert.match(displayDimension(1,'in'),/اینچ/);
});
test('projects round trip with scene state and reject malformed imports',()=>{
 const p={name:'آزمایش',room:'پذیرایی',scene:{spatial:{a:[0,0,0],b:[4,0,0]},items:[{index:0,id:1,position:[0,.4,0],rotation:0}]}};
 const out=unpackProject(packProject(p));assert.equal(out.name,p.name);assert.deepEqual(out.scene,p.scene);
 assert.throws(()=>unpackProject('{"hello":true}'));assert.throws(()=>unpackProject('{!'));
});
test('business-only capabilities stay isolated from free preview',()=>{assert.equal(FEATURES.free.customCatalog,false);assert.equal(FEATURES.business.customCatalog,true);});
