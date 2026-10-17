import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {EnvironmentEffects} from '../effects.js';
import {requestARSession} from '../xr.js';
test('light and depth are optional; depth is never requested by default',async()=>{let options;await requestARSession({requestSession:async(mode,o)=>{options=o;}},{},false,{light:true,depth:false});assert.ok(options.optionalFeatures.includes('light-estimation'));assert.ok(!options.optionalFeatures.includes('depth-sensing'));assert.equal(options.depthSensing,undefined);assert.deepEqual(options.requiredFeatures,['hit-test','dom-overlay']);});
test('depth experiment requests only the GPU path supported by the bundled renderer',async()=>{let options;await requestARSession({requestSession:async(mode,o)=>{options=o;}},{},false,{depth:true});assert.ok(options.optionalFeatures.includes('depth-sensing'));assert.deepEqual(options.depthSensing.usagePreference,['gpu-optimized']);});
test('missing lighting support retains usable fixed lighting',async()=>{const effects=new EnvironmentEffects(new THREE.Scene(),{xr:{getDepthSensingMesh:()=>null}});await effects.start({requestLightProbe:()=>Promise.reject(Error('not supported'))},{light:true,depth:false});assert.match(effects.lightState,/fallback/);assert.ok(effects.hemi.intensity>0);assert.ok(effects.sun.intensity>0);});
test('sustained low frame rate disables occlusion drawing',async()=>{const mesh={visible:true},effects=new EnvironmentEffects(new THREE.Scene(),{xr:{getDepthSensingMesh:()=>mesh}});await effects.start({enabledFeatures:['depth-sensing']},{depth:true});effects.update({},0,20);effects.update({},3100,20);assert.equal(mesh.visible,false);assert.equal(effects.depthDisabled,true);});
test('a late lighting probe cannot attach itself to an ended session',async()=>{let resolveProbe;const effects=new EnvironmentEffects(new THREE.Scene(),{}),pending=effects.start({requestLightProbe:()=>new Promise(resolve=>resolveProbe=resolve)},{light:true});effects.reset();resolveProbe({});await pending;assert.equal(effects.probe,null);});

