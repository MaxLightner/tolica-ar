import test from 'node:test';
import assert from 'node:assert/strict';
import {cropRect,CAMERA_RATIOS,CAMERA_PHOTO_KIND,isCameraPhoto,captureARScreen,ScreenshotUnavailable} from '../camera-capture.js';

test('ratio options and photo-gallery segregation',()=>{
 assert.deepEqual(Object.keys(CAMERA_RATIOS),['9:16','3:4','1:1','4:3','16:9']);
 assert.equal(CAMERA_RATIOS['1:1'],1);
 assert.equal(CAMERA_PHOTO_KIND,'tolica-camera');
 assert.ok(isCameraPhoto({kind:'tolica-camera'}));
 assert.ok(!isCameraPhoto({kind:'اسکرین‌شات تولیکا'}));
 assert.ok(!isCameraPhoto({kind:'upload'}));
});
test('center-crop keeps actual recorded pixels without inventing unseen sides',()=>{
 assert.deepEqual(cropRect(1920,1080,1),{sx:420,sy:0,sw:1080,sh:1080});
 assert.deepEqual(cropRect(1080,1920,1),{sx:0,sy:420,sw:1080,sh:1080});
 assert.deepEqual(cropRect(600,400,3/2),{sx:0,sy:0,sw:600,sh:400});
 assert.throws(()=>cropRect(0,200,1),RangeError);
});
test('unsupported immersive screen capture fails explicitly rather than recording an empty AR canvas',async()=>{
 await assert.rejects(captureARScreen({getDisplayMedia:null,doc:{createElement(){}}}),ScreenshotUnavailable);
});
