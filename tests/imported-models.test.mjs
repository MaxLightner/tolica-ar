import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {CATALOG} from '../spatial.js';
import {IMPORTED_MODELS,isImportedNoShadow,isImportedLight} from '../imported-models.js';
import {isFloorSolid} from '../collision.js';
import {isLamp,isRug,assetMetadata,categoryForIndex} from '../asset-metadata.js';

test('all ten uploaded GLBs are present, binary and embedded in the catalog',()=>{
 assert.equal(CATALOG.length,32);
 assert.equal(Object.keys(IMPORTED_MODELS).length,10);
 for(const [key,model] of Object.entries(IMPORTED_MODELS)){
  const index=Number(key);
  const url=new URL('../assets/chido/'+model.file,import.meta.url);
  const bytes=readFileSync(fileURLToPath(url));
  assert.equal(bytes.toString('ascii',0,4),'glTF',model.file);
  assert.equal(bytes.readUInt32LE(4),2,model.file);
  assert.equal(bytes.readUInt32LE(8),bytes.byteLength,model.file);
  const jsonLength=bytes.readUInt32LE(12);
  assert.equal(bytes.toString('ascii',16,20),'JSON',model.file);
  const document=JSON.parse(bytes.toString('utf8',20,20+jsonLength));
  assert.ok(document.meshes?.length>0,model.file);
  assert.ok(CATALOG[index].size.every(n=>n>0),model.file);
  assert.deepEqual(assetMetadata(index).collision.size,[...CATALOG[index].size]);
 }
});
test('imported lights and rug use existing app power and collision exemptions',()=>{
 assert.ok(isLamp(28)&&isLamp(29));
 assert.ok(isImportedLight(29));
 assert.equal(isFloorSolid(22),true);
 assert.equal(isFloorSolid(25),true);
 assert.equal(isFloorSolid(29),true);
 assert.equal(isFloorSolid(30),true);
 assert.equal(isFloorSolid(31),false);
 assert.ok(isRug(31));
 for(const index of [28,29,30,31])assert.equal(isImportedNoShadow(index),true);
 assert.equal(isImportedNoShadow(22),false);
 assert.equal(categoryForIndex(31),'rugs');
});
