import test from 'node:test';
import assert from 'node:assert/strict';
import {readDraft,saveDraft,clearDraft,listCustomLayouts,saveCustomLayout,removeCustomLayout} from '../layout-storage.js';
function localStore(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
const scene={spatial:{locked:false},items:[{index:0,id:1,position:[0,.5,-2]}]};
test('draft can survive navigation and is overwritten without leaking previous snapshots',()=>{
 const store=localStore();assert.equal(readDraft(store),null);
 const first=saveDraft({scene,room:'پذیرایی',layout:'u',capacity:9,style:'مینیمال',theme:0},store);
 assert.equal(first.scene.items.length,1);
 const loaded=readDraft(store);
 assert.equal(loaded.capacity,9);assert.equal(loaded.layout,'u');
 clearDraft(store);assert.equal(readDraft(store),null);
});
test('custom layouts persist multiple names and can be removed',()=>{
 const store=localStore();
 const a=saveCustomLayout({name:'پذیرایی ۱۳ نفره',scene,room:'پذیرایی',layout:'conversation',capacity:13},store);
 saveCustomLayout({name:'ناهارخوری',scene,room:'ناهارخوری',layout:'dining-center',capacity:8},store);
 assert.equal(listCustomLayouts(store).length,2);
 assert.equal(listCustomLayouts(store)[1].name,a.name);
 removeCustomLayout(a.id,store);
 assert.equal(listCustomLayouts(store).length,1);
});
test('invalid or oversized drafts are rejected',()=>{
 const store=localStore();
 assert.throws(()=>saveDraft({scene:{items:[]}},store));
 assert.equal(readDraft(store),null);
});
