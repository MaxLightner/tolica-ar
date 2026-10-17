import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateFloorPose,AnchorStabilizer,transformPoint} from '../anchor-rig.js';
const base=[[0,0,0],[2,0,0],[0,0,2],[2,0,2],[1,0,1]];
const observations=(pose={x:0,y:0,z:0,yaw:0})=>base.map((p,i)=>({id:i,reference:p,observed:transformPoint(p,pose)}));
test('five stable anchors preserve a horizontal floor',()=>{
 const fit=estimateFloorPose(observations());
 assert.equal(fit.inliers.length,5);
 assert.ok(Math.abs(fit.pose.yaw)<1e-9);
});
test('reject one independent noisy anchor while retaining the other four',()=>{
 const data=observations({x:.08,y:.01,z:-.03,yaw:.025});
 data[4].observed=[10,2,-3];
 const fit=estimateFloorPose(data);
 assert.ok(fit);
 assert.deepEqual(fit.outliers,[4]);
 assert.equal(fit.inliers.length,4);
 assert.ok(Math.abs(fit.pose.x-.08)<.002);
 assert.ok(Math.abs(fit.pose.yaw-.025)<.002);
});
test('two bad anchors retain a stable non-collinear triple',()=>{
 const data=observations({x:.03,y:0,z:.02,yaw:.02});
 data[3].observed=[9,1,-2];data[4].observed=[-5,0,6];
 const fit=estimateFloorPose(data);
 assert.ok(fit&&fit.inliers.length>=3);
 assert.ok(fit.outliers.includes(3)&&fit.outliers.includes(4));
});
test('temporary tracking loss preserves last stabilized pose',()=>{
 const stabilizer=new AnchorStabilizer();
 for(let i=0;i<20;i++)stabilizer.update(observations({x:.04,y:0,z:0,yaw:.02}),.016);
 const before=stabilizer.snapshot();
 const after=stabilizer.update([],0.016);
 assert.deepEqual(after.pose,before.pose);
});
test('changing active anchor subset does not cause a large pose jump',()=>{
 const stabilizer=new AnchorStabilizer();
 const pose={x:.06,y:0,z:.01,yaw:.01};
 for(let i=0;i<30;i++)stabilizer.update(observations(pose),.016);
 const previous=stabilizer.snapshot().pose;
 const data=observations(pose);
 data[2].observed=[7,0,2];
 const next=stabilizer.update(data,.016).pose;
 assert.ok(Math.hypot(next.x-previous.x,next.z-previous.z)<.015);
});
