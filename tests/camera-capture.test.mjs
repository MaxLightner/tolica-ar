import test from 'node:test';
import assert from 'node:assert/strict';
import {cropRect,CAMERA_RATIOS,CAMERA_PHOTO_KIND,isCameraPhoto} from '../camera-capture.js';
import {InternalCaptureUnavailable,canCaptureCamera,rowsTopDown,captureInternalAR,readCameraPixels} from '../internal-camera-capture.js';

test('internal-camera ratios and private photo gallery',()=>{
 assert.deepEqual(Object.keys(CAMERA_RATIOS),['9:16','3:4','1:1','4:3','16:9']);
 assert.ok(isCameraPhoto({kind:CAMERA_PHOTO_KIND}));
 assert.equal(isCameraPhoto({kind:'imported'}),false);
});
test('center crop preserves frame aspect',()=>{
 assert.deepEqual(cropRect(1920,1080,1),{sx:420,sy:0,sw:1080,sh:1080});
 assert.deepEqual(cropRect(1080,1920,1),{sx:0,sy:420,sw:1080,sh:1080});
 assert.throws(()=>cropRect(0,100,1),RangeError);
});
test('pixels copied from bottom-left GL origin to top-left canvas origin',()=>{
 const rgba=new Uint8Array([11,0,0,255,12,0,0,255,21,0,0,255,22,0,0,255]);
 assert.deepEqual([...rowsTopDown(rgba,2,2)],[21,0,0,255,22,0,0,255,11,0,0,255,12,0,0,255]);
});
test('camera access is required before attempting internal AR capture',()=>{
 const disabled={enabledFeatures:['hit-test']},enabled={enabledFeatures:['hit-test','camera-access']};
 const binding={getCameraImage:()=>({})};
 assert.equal(canCaptureCamera(disabled,binding),false);
 assert.equal(canCaptureCamera(enabled,binding),true);
 assert.throws(()=>captureInternalAR({session:disabled,binding,frame:{},ratio:'4:3'}),InternalCaptureUnavailable);
});
test('camera texture readback frees framebuffer and restores renderer state',()=>{
 let current='old',deleted=0,resets=0;
 const gl={
  FRAMEBUFFER:1,FRAMEBUFFER_BINDING:2,COLOR_ATTACHMENT0:3,TEXTURE_2D:4,FRAMEBUFFER_COMPLETE:5,
  RGBA:6,UNSIGNED_BYTE:7,NO_ERROR:0,
  createFramebuffer:()=>({id:1}),
  getParameter:()=>current,
  bindFramebuffer:(target,fb)=>{current=fb;},
  framebufferTexture2D:()=>{},
  checkFramebufferStatus:()=>5,
  readPixels:(x,y,w,h,format,type,pixels)=>{pixels.fill(90);},
  getError:()=>0,
  deleteFramebuffer:()=>{deleted++;}
 };
 const renderer={getContext:()=>gl,resetState:()=>{resets++;}};
 const result=readCameraPixels(renderer,{getCameraImage:()=>({})},{camera:{width:16,height:16}});
 assert.equal(result.width,16);
 assert.equal(result.pixels[0],90);
 assert.equal(current,'old');assert.equal(deleted,1);assert.equal(resets,1);
});

test('driver zeroed frames are rejected rather than saved as photographs',()=>{
 let bound='main',deleted=0,resets=0;
 const gl={
  FRAMEBUFFER:1,FRAMEBUFFER_BINDING:2,COLOR_ATTACHMENT0:3,TEXTURE_2D:4,FRAMEBUFFER_COMPLETE:5,
  RGBA:6,UNSIGNED_BYTE:7,NO_ERROR:0,createFramebuffer:()=>({}),
  getParameter:()=>bound,bindFramebuffer:(_,fb)=>{bound=fb;},framebufferTexture2D:()=>{},
  checkFramebufferStatus:()=>5,readPixels:(_,__,___,____,_____,______,pixels)=>pixels.fill(0),
  getError:()=>0,deleteFramebuffer:()=>deleted++
 };
 assert.throws(()=>readCameraPixels({getContext:()=>gl,resetState:()=>resets++},{getCameraImage:()=>({})},{camera:{width:16,height:16}}),InternalCaptureUnavailable);
 assert.equal(bound,'main');assert.equal(deleted,1);assert.equal(resets,1);
});
