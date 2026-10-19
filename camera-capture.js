// One-shot Screen Capture API, used only following a direct shutter tap.
// WebXR's canvas does not contain the real camera passthrough.
// The browser/device may decline screen capture while immersive AR is active.
export class ScreenshotUnavailable extends Error{
 constructor(message){super(message);this.name='ScreenshotUnavailable';}
}
export function cropRect(width,height,ratio){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||!Number.isFinite(ratio)||ratio<=0)throw RangeError('invalid screenshot dimensions');
 const sourceRatio=width/height;
 if(sourceRatio>ratio){const w=height*ratio;return {sx:(width-w)/2,sy:0,sw:w,sh:height};}
 const h=width/ratio;return {sx:0,sy:(height-h)/2,sw:width,sh:h};
}
export const CAMERA_PHOTO_KIND='tolica-camera';
export const isCameraPhoto=photo=>photo?.kind===CAMERA_PHOTO_KIND;
export const CAMERA_RATIOS=Object.freeze({'9:16':9/16,'3:4':3/4,'1:1':1,'4:3':4/3,'16:9':16/9});
export async function captureARScreen({ratio='4:3',getDisplayMedia=globalThis.navigator?.mediaDevices?.getDisplayMedia?.bind(globalThis.navigator.mediaDevices),doc=globalThis.document,beforeFrame=async()=>{},afterFrame=()=>{}}={}){
 const aspect=CAMERA_RATIOS[ratio];
 if(!aspect)throw RangeError('Invalid aspect ratio');
 if(typeof getDisplayMedia!=='function'||!doc?.createElement)throw new ScreenshotUnavailable('این مرورگر امکان ثبت مستقیم تصویر AR را ندارد.');
 let stream=null,video=null;
 try{
  // Must run in the user-activation chain of the shutter click.
  stream=await getDisplayMedia({video:true,audio:false});
  const track=stream.getVideoTracks()[0];
  if(!track||track.readyState==='ended')throw new ScreenshotUnavailable('منبع تصویر در دسترس نیست.');
  video=doc.createElement('video');video.muted=true;video.playsInline=true;video.autoplay=true;video.srcObject=stream;
  await video.play();
  if(!video.videoWidth||!video.videoHeight){
   await new Promise((resolve,reject)=>{
    let finished=false;
    const settle=err=>{if(finished)return;finished=true;video.removeEventListener('loadeddata',ready);video.removeEventListener('error',fail);err?reject(err):resolve();};
    const ready=()=>settle(),fail=()=>settle(new ScreenshotUnavailable('داده تصویری دریافت نشد.'));
    video.addEventListener('loadeddata',ready,{once:true});
    video.addEventListener('error',fail,{once:true});
    // Stream may end while capture is negotiating.
    track.addEventListener('ended',fail,{once:true});
    if(video.readyState>=2)ready();
   });
  }
  if(!video.videoWidth||!video.videoHeight)throw new ScreenshotUnavailable('وضوح تصویر مشخص نیست.');
  // Remove viewfinder chrome from the captured frame after screen-sharing permission.
  await beforeFrame();
  if(typeof video.requestVideoFrameCallback==='function'){
   await Promise.race([new Promise(resolve=>video.requestVideoFrameCallback(()=>resolve())),new Promise(resolve=>setTimeout(resolve,450))]);
  }else{
   await new Promise(resolve=>setTimeout(resolve,110));
  }
  if(track.readyState==='ended')throw new ScreenshotUnavailable('ضبط صفحه قبل از ثبت تصویر پایان یافت.');

  // Preserve whole scene dimensions as far as practical and avoid huge memory use.
  const {sx,sy,sw,sh}=cropRect(video.videoWidth,video.videoHeight,aspect);
  const outWidth=Math.max(1,Math.round(Math.min(sw,1600)));
  const outHeight=Math.max(1,Math.round(outWidth/aspect));
  const canvas=doc.createElement('canvas');canvas.width=outWidth;canvas.height=outHeight;
  const context=canvas.getContext('2d');
  if(!context)throw new ScreenshotUnavailable('بوم ثبت تصویر در دسترس نیست.');
  context.drawImage(video,sx,sy,sw,sh,0,0,outWidth,outHeight);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new ScreenshotUnavailable('ذخیره تصویر ممکن نشد.')),'image/jpeg',.86));
  return blob;
 }catch(error){
  if(error instanceof ScreenshotUnavailable)throw error;
  if(error?.name==='NotAllowedError'||error?.name==='AbortError')throw new ScreenshotUnavailable('مجوز ضبط صفحه داده نشد یا پنجره انتخاب بسته شد.');
  if(error?.name==='NotSupportedError'||error?.name==='TypeError')throw new ScreenshotUnavailable('ثبت مستقیم تصویر در این مرورگر یا حالت AR پشتیبانی نمی‌شود.');
  throw new ScreenshotUnavailable('ثبت تصویر AR انجام نشد؛ سازگاری ضبط صفحه دستگاه را بررسی کن.');
 }finally{
  try{afterFrame();}catch{}
  stream?.getTracks().forEach(track=>track.stop());
  if(video){video.pause();video.srcObject=null;video.remove();}
 }
}
