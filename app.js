import {explainXR} from './xr.js?v=0.2.8';
import {photos,savePhoto,removePhoto} from './storage.js';
const $=s=>document.querySelector(s),app=$('#app'),fa=n=>n.toLocaleString('fa-IR');
let studio,Scene,palette,space='پذیرایی',layout='calm',supported=false,routeVersion=0,photoURLs=[],savedItems=[],arReport=null,sceneMemory=null,arStarting=false,lastXRErrorReport='';
const themes=[
 {name:'کرم و چوب',colors:['#cfbeaa','#c9bdae','#aa9882','#d7c8b4']},
 {name:'آبی و کرم',colors:['#7a9196','#d7c5b2','#879fa2','#c3b7a9']},
 {name:'سبز زیتونی',colors:['#909c84','#d4c6b4','#adba9d','#b6a793']}
];
let themeIndex=0,styleChoice='مینیمال',previewEnabled=false;
const catalogImages=[
 ['کاناپه','<rect x="14" y="24" width="74" height="46" rx="10"/><path d="M16 38h70M32 42v25m37-25v25"/>'],
 ['تک‌نفره','<rect x="27" y="20" width="48" height="54" rx="10"/><path d="M28 40h46"/>'],
 ['میز جلو مبلی','<rect x="14" y="31" width="74" height="32" rx="6"/><path d="M27 31v32m48-32v32"/>'],
 ['صندلی','<rect x="27" y="20" width="48" height="54" rx="10"/><path d="M28 40h46"/>'],
 ['گلدان','<path d="M39 71h24l7-35H33zM51 35V12m0 23-15-14m15 9 18-13"/><path d="M33 22q15-20 18 9M70 17q-20-5-19 13"/>'],
 ['کوسن','<rect x="22" y="23" width="58" height="49" rx="14"/><path d="M29 30q23 12 44 0m-44 34q23-12 44 0"/>'],
 ['آباژور','<path d="M36 24h30l9 29H27zM51 53v25M33 79h36"/>'],
 ['فرش','<rect x="13" y="20" width="77" height="60" rx="3"/><path d="M22 26h59v48H22zM51 34l19 16-19 16-19-16z"/>']
];
function objectIcon(index){return `<svg viewBox="0 0 100 100" class="object-icon" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${catalogImages[index]?.[1]||''}</svg>`;}
function planSketch(kind){
 const sofa=(x,y,w=92,angle=0)=>`<g transform="translate(${x} ${y}) rotate(${angle})"><rect x="0" y="0" width="${w}" height="46" rx="9" fill="#d0bfae" stroke="#8a7e73"/><path d="M7 15h${w-14}M12 19v22M${w-12} 19v22" fill="none" stroke="#a79787"/><rect x="8" y="20" width="${w-16}" height="22" rx="6" fill="#e5dacf" stroke="#ab9a89"/></g>`;
 const table=(x,y)=>`<g transform="translate(${x} ${y})"><rect x="0" y="0" width="55" height="37" rx="6" fill="#a98e77" stroke="#87705d"/><path d="M10 10h35M10 19h35" stroke="#d7c0a9"/></g>`;
 const room=`<rect x="14" y="12" width="290" height="207" rx="9" fill="#f4efe8" stroke="#c6b9ad" stroke-width="5"/><path d="M28 12h82m76 0h60" stroke="#f4efe8" stroke-width="7"/><path d="M122 12h52" stroke="#87b4b0" stroke-width="5"/>`;
 let plan='';
 if(kind==='social')plan=`<rect x="60" y="64" width="186" height="113" rx="12" fill="#e5ded3"/>${sofa(96,43,126)}${sofa(47,176,90,-90)}${sofa(263,90,90,90)}${table(134,107)}`;
 else if(kind==='light')plan=`<rect x="78" y="48" width="172" height="144" rx="13" fill="#e4ded4"/>${sofa(64,63,99)}${sofa(264,63,80,90)}${table(153,112)}<circle cx="52" cy="188" r="14" fill="#849b86"/>`;
 else plan=`<rect x="51" y="70" width="216" height="122" rx="13" fill="#dfd5c7"/>${sofa(77,42,132)}${sofa(66,156,82)}${sofa(255,70,85,90)}${table(144,112)}<circle cx="271" cy="191" r="14" fill="#8ca28c"/>`;
 return `<svg viewBox="0 0 318 231" role="img" aria-label="نقشه چیدمان مبلمان از نمای بالا" xmlns="http://www.w3.org/2000/svg">${room}${plan}</svg>`;
}
const sofa=`<path d="M83 184V143q0-15 17-15h123q17 0 17 15v41M83 158H64q-11 0-11 12v51h215v-51q0-12-12-12h-16M78 183h165v24H78zM64 221v15m192-15v15M159 133v46M79 190l-17-22m184 22 13-22"/>`;
const sketches={
 living:sofa+`<path d="M285 221v-99m-26 0h52l-12-39h-29zM282 221h27M77 261h183l28-20H105z"/>`,
 dining:`<path d="M67 151h209l-22 24H47zM65 177v78m192-78v78M91 150v-55h49v55m-44-27h38M188 150V95h49v55m-43-27h38M103 196v61m-38-72h55v25H65m135-25h55v25h-55m2 0v47m49-47v47"/>`,
 bedroom:`<path d="M62 215v-92q0-13 14-13h179q13 0 13 13v92M60 167h211l19 50H42zM42 217v24m248-24v24M79 152v-25h68v25zm95 0v-25h68v25zM47 228h237M80 168l-6 41m171-41 9 41"/>`,
 office:`<path d="M54 160h225v13H54zM70 174v78m190-78v78M111 157V98h105v59m-57-2v-18m-18 18h36M143 190h56v27h-56zM171 218v28m-26 9 26-9 27 9M145 188v-30m51 30v-30"/>`,
 phone:`<rect x="103" y="45" width="128" height="228" rx="19"/><path d="M146 59h43M144 256h44M120 115v-20h20m55 0h20v20m0 87v20h-20m-55 0h-20v-20M147 150l21-12 24 12v29l-24 13-21-13zm0 0 21 14 24-14m-24 14v28"/>`,
 gallery:`<rect x="55" y="70" width="220" height="170" rx="4"/><path d="m65 222 58-68 47 45 34-33 61 56M76 54h213v167"/><circle cx="220" cy="117" r="15"/>`
};
function svg(kind='living'){return `<svg viewBox="0 0 330 300" class="sketch" aria-hidden="true">${sketches[kind]||sketches.living}</svg>`;}
function heroArt(){return `<svg viewBox="0 0 600 520" class="sketch" aria-hidden="true"><g stroke="#c4c8b8" stroke-width=".8"><path d="M60 380l260 86 236-106-234-85zM60 380V133l262-67 234 68v226M322 66v209M77 374l245 79 218-98"/><path d="M91 153l119-30v119L91 272zM151 138v118m-60-48 119-34"/></g><g transform="translate(57 110)"><path d="M73 215v-81q0-18 18-16l157 19q19 2 19 18v78M73 157l-35-5q-13-2-13 14v73l244 43 94-45v-68q0-12-11-9l-36 16M25 194l242 39 96-44M44 198v25l222 39 76-36v-28M267 233v49M52 244v23m194 12v22m95-54v21M75 164l190 30 48-18M171 133v45"/><path stroke="#9aa18d" d="M26 191l241 38 94-44m-286-25 189 30 45-17"/></g><path d="M328 389l76-33 75 23-77 36zM328 389v12l74 28 77-35v-15M338 403v25m126-26v25M401 429v14"/><path d="M443 286v-109m-35 0h70l-17-55h-39zM427 293l17-7 18 7M443 122v-12"/><path d="M499 332v-49m-17 41q-30-8-26-34 27-3 43 33m1-18q-3-30 21-41 18 24-21 41M481 331h38l-6 38h-25z"/><path stroke="#c2c6b7" d="m100 411 218 66 210-96M90 422l227 69m49-31 143-64"/><path stroke="#9da58f" d="M281 77l10 10m-15 4 11-2M75 310l-15 7m13-16-4 12"/></svg>`;}
function toast(message){$('#toast').textContent=message;$('#toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.display='none',4500);}
function footer(){return `<footer class="foot"><span>خانه، به سلیقهٔ تو.</span><span dir="ltr">TOLICA · PROTOTYPE 0.2</span></footer>`;}
function heading(step,title,sub,back){return `<div class="page-heading"><div><span class="eyebrow">${step}</span><h1>${title}</h1><p>${sub}</p></div>${back?`<a class="back" href="#${back}">بازگشت ←</a>`:''}</div>`;}
async function full(){if(document.fullscreenElement){await document.exitFullscreen();return;}if(!document.documentElement.requestFullscreen){toast('مرورگر شما تمام‌صفحه را پشتیبانی نمی‌کند.');return;}try{await document.documentElement.requestFullscreen();}catch{toast('ورود به تمام‌صفحه ممکن نشد؛ می‌توانی ادامه بدهی.');}}
$('#fullscreen').onclick=full;document.addEventListener('fullscreenchange',()=>$('#fullscreen').textContent=document.fullscreenElement?'خروج از تمام‌صفحه ↙':'تمام‌صفحه ⛶');
async function support(){try{supported=!!(isSecureContext&&navigator.xr&&await navigator.xr.isSessionSupported('immersive-ar'));}catch{supported=false;}return supported;}
async function loadScene(){if(!Scene){const m=await import('./scene.js?v=0.2.8');Scene=m.Studio;palette=m.palette;}}
function updateObjects(){if(!studio)return;const buttons=studio.items.map(m=>`<button data-object="${m.userData.id}" class="${m===studio.selected?'selected':''}">${m.userData.product.name}</button>`).join('');for(const selector of ['#objects']){const el=$(selector);if(el){el.innerHTML=buttons||'<small>یک قطعه اضافه کن.</small>';el.querySelectorAll('[data-object]').forEach(b=>b.onclick=()=>studio.select(studio.items.find(m=>m.userData.id===+b.dataset.object)));}}
 const mesh=studio.selected,label=mesh?mesh.userData.product.name+' · '+mesh.userData.product.size.map(v=>fa(Math.round(v*100))).join(' × ')+' سانتی‌متر':'یک قطعه را لمس کن';for(const id of ['selection','arSelection']){const el=$('#'+id);if(el)el.textContent=label;}
 const rotation=$('#rotation');if(rotation)rotation.value=mesh?Math.round(mesh.rotation.y*180/Math.PI)%360:0;
 for(const id of ['rotate','delete','rotation']){const el=$('#'+id);if(el)el.disabled=!mesh;}for(const id of ['selectedARTools']){const el=$('#'+id);if(el)el.hidden=!mesh;}
 updateMeasurements();}
function updateMeasurements(){if(!studio)return;const m=studio.measurement();for(const id of ['measurement','arMeasurement']){const el=$('#'+id);if(el)el.textContent=`A—B: ${fa(m.measuredCm)} سانتی‌متر اندازه‌گیری‌شده · ضریب ${fa(m.scale)} · طول اصلاح‌شده ${fa(m.correctedCm)} سانتی‌متر`;}}
function calibrationControls(prefix=''){return `<div class="calibration-controls"><p class="measurement" id="${prefix?'arMeasurement':'measurement'}"></p><label for="${prefix}actual">طول واقعی A—B (۱۰۰ تا ۱۰۰۰ سانتی‌متر)</label><div class="input-row"><input id="${prefix}actual" type="number" inputmode="decimal" min="100" max="1000" step="0.1" placeholder="مثلاً ۱۰۰"><button id="${prefix}calibrate">کالیبره کن</button><button id="${prefix}resetScale">۱:۱</button></div><small>A کل ست را منتقل می‌کند؛ B جهت ست را تغییر می‌دهد. برای کالیبراسیون، نقطه‌ها را روی دو سر یک طول معلوم بگذار.</small></div>`;}
function bindCalibration(prefix=''){const initial=studio.measurement();if(initial.actualCm!==null)$('#'+prefix+'actual').value=initial.actualCm;const fail=fn=>()=>{try{fn();}catch(error){toast(error.message);}};$('#'+prefix+'calibrate').onclick=fail(()=>{studio.calibrate($('#'+prefix+'actual').value);toast('اندازه و فاصلهٔ همهٔ قطعات با هم اصلاح شد.');});$('#'+prefix+'resetScale').onclick=()=>studio.resetCalibration();}
function snapshotItems(){savedItems=studio?studio.items.map(m=>({id:m.userData.id,name:m.userData.product.name,price:m.userData.price,color:'#'+m.material.color.getHexString()})):savedItems;}
function uploadControl(){return `<label class="upload">بارگذاری تصویر +<input id="upload" type="file" accept="image/png,image/jpeg,image/webp" multiple></label>`;}
async function uploadFiles(e){const files=[...e.target.files];if(files.length>20){toast('هر بار حداکثر ۲۰ تصویر بارگذاری کن.');return;}let count=0;for(const f of files){if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>15*1024*1024){toast('فقط PNG، JPEG و WebP تا ۱۵ مگابایت پذیرفته می‌شود.');continue;}try{const img=await createImageBitmap(f);img.close();await savePhoto(f,'تصویر بارگذاری‌شده');count++;}catch{toast('تصویر خوانده یا ذخیره نشد؛ فضای مرورگر را بررسی کن.');}}if(count){toast(`${fa(count)} تصویر به گالری اضافه شد.`);await render();}e.target.value='';}
async function render(){const version=++routeVersion;const route=location.hash.slice(1)||'welcome';document.body.dataset.route=route;if(studio?.session){location.hash='studio';return;}if(studio){snapshotItems();sceneMemory=studio.exportState();studio.destroy();studio=null;}photoURLs.forEach(URL.revokeObjectURL);photoURLs=[];
 if(route==='welcome'){app.innerHTML=`<section class="welcome-screen"><div class="welcome-title"><h1>TOLICA</h1><p>خانه را جور دیگری ببینید</p></div><img class="welcome-photo" src="assets/welcome.png" alt="صندلی کرم و گلدان در فضایی آرام"><div class="welcome-bottom"><button class="primary" id="welcome">ورود به نمایشگاه <span>→</span></button><button class="quick-ar" id="quickAR">ورود سریع به AR ↗</button><span class="welcome-wordmark">TOLICA</span></div></section>`;$('#welcome').onclick=()=>{full();location.hash='spaces';};$('#quickAR').onclick=()=>{layout='calm';sceneMemory=null;location.hash='studio';};return;}
 if(route==='spaces'){app.innerHTML=`<section class="page rooms-page">${heading('۰۱ / فضای شما','کدام فضا را می‌خواهی بچینی؟','فضا، سبک و رنگ دلخواهت را انتخاب کن.','welcome')}
 <div class="cards room-choice">${[['living','پذیرایی','برای کنار هم بودن'],['dining','ناهارخوری','دور یک میز، کنار هم'],['bedroom','اتاق خواب','گوشه‌ای برای آرامش'],['office','فضای کار','جایی برای ایده‌های تازه']].map(([key,title,sub])=>`<button class="card ${space===title?'selected':''}" data-space="${title}" aria-pressed="${space===title}">${svg(key)}<strong>${title}</strong><small>${sub}</small></button>`).join('')}</div>
 <section class="room-prefs"><div class="pref-heading">سبک چیدمان <small>اختیاری</small></div><div class="style-pills">${['مینیمال','مدرن','کلاسیک','همه'].map(n=>`<button data-style="${n}" class="${styleChoice===n?'selected':''}">${n}</button>`).join('')}</div>
 <div class="pref-heading">پالت رنگ <small>بعداً قابل تغییر است</small></div><div class="theme-picks">${themes.map((t,i)=>`<button data-theme="${i}" class="${themeIndex===i?'selected':''}" aria-label="${t.name}"><span class="theme-blocks">${t.colors.map(c=>`<i style="background:${c}"></i>`).join('')}</span><small>${t.name}</small></button>`).join('')}</div></section>
 <button class="primary continue-room" id="goLayouts">دیدن چیدمان‌ها ←</button></section>`;
 document.querySelectorAll('[data-space]').forEach(btn=>btn.onclick=()=>{space=btn.dataset.space;document.querySelectorAll('[data-space]').forEach(el=>{el.classList.toggle('selected',el===btn);el.setAttribute('aria-pressed',String(el===btn));});});
 document.querySelectorAll('[data-style]').forEach(btn=>btn.onclick=()=>{styleChoice=btn.dataset.style;document.querySelectorAll('[data-style]').forEach(el=>el.classList.toggle('selected',el===btn));});
 document.querySelectorAll('[data-theme]').forEach(btn=>btn.onclick=()=>{themeIndex=Number(btn.dataset.theme);document.querySelectorAll('[data-theme]').forEach(el=>el.classList.toggle('selected',el===btn));});
 $('#goLayouts').onclick=()=>location.hash='layouts';return;}
 if(route==='layouts'){app.innerHTML=`<section class="page layouts-page">${heading('۰۲ / چیدمان','یک پلان انتخاب کن','نمای بالا · سبک ${styleChoice} · ${themes[themeIndex].name}','spaces')}
 <div class="layout-feed">${[['calm','چیدمان متعادل','برای فضای خانوادگی'],['social','چیدمان گفتگو','نشستن روبه‌روی هم'],['light','چیدمان باز','فضای آزادتر برای رفت‌وآمد']].map(([id,title,sub],i)=>`<button class="layout-photo-card" data-layout="${id}"><div class="layout-image floor-plan-card">${planSketch(id)}<span class="layout-badge">${fa(i+1).padStart(2,'۰')}</span></div><div class="layout-caption"><strong>${title}</strong><small>${sub}</small><span>←</span></div></button>`).join('')}
 <button class="start-blank" data-layout="empty"><span>＋</span><strong>شروع با فضای خالی</strong><small>از ابتدا بچین</small></button></div></section>`;
 document.querySelectorAll('[data-layout]').forEach(btn=>btn.onclick=()=>{layout=btn.dataset.layout;sceneMemory=null;previewEnabled=false;location.hash='studio';});return;}
  if(route==='detail'){app.innerHTML=`<section class="page detail-page"><a class="back" href="#layouts">بازگشت ←</a><img class="detail-photo" src="assets/living.png" alt="چیدمان مبلمان کرم در فضای نشیمن"><div class="dots"><i></i><i></i><i></i></div><h1>${layout==='social'?'چیدمان صمیمی':layout==='light'?'چیدمان سبک و روشن':'چیدمان کلاسیک ۱'}</h1><p>یک ایده برای ${space}؛ با ترکیبی از حجم‌های متنوع و رنگ‌های طبیعی.</p><p class="prototype-note">در محیط آزمایشی مبلمان کم‌پلیگان با ابعاد واقعی جایگزین مدل مبلمان می‌شوند.</p><button id="continueLayout" class="primary">ادامهٔ چیدمان و ویرایش <span>→</span></button></section>`;$('#continueLayout').onclick=()=>location.hash='studio';return;}
 if(route==='entry'){app.innerHTML=`<section class="page">${heading('۰۳ / ورود به تجربه','حالا در خانه‌ات ببین.','چند قدم تا امتحان کردن چیدمان فاصله داری.','layouts')}<div class="entry"><div><h2>فضای واقعی، انتخاب تازه</h2><p>در محیطی روشن، گوشی را آرام به سمت کف بگیر. پس از نمایش کف پیشنهادی، «تثبیت این کف» را بزن و خط A–B را روی یک طول معلوم بگذار.</p><div id="support" class="notice">در حال بررسی سازگاری مرورگر…</div><div class="entry-actions"><button id="enterAR" class="primary" disabled>ورود به AR ↗</button><button id="preview">محیط آزمایشی</button></div><p>نیازمند Android Chrome، گوشی سازگار با ARCore، اتصال امن و اجازهٔ دسترسی به دوربین. ورود به AR فقط با لمس دکمه انجام می‌شود.</p></div><div class="entry-illustration">${svg('phone')}</div></div><div class="notice">برای ثبت تصویر ترکیبی AR از اسکرین‌شات خود گوشی استفاده کن، سپس آن را در گالری بارگذاری کن. ثبت مستقیم دوربین از بوم سه‌بعدی در این نسخه انجام نمی‌شود.</div></section>${footer()}`;$('#preview').onclick=()=>location.hash='studio';await support();if(version!==routeVersion)return;$('#support').textContent=supported?'AR در این مرورگر در دسترس است. مجوزها و ردیابی هنگام شروع بررسی می‌شوند.':'AR در این دستگاه یا مرورگر در دسترس نیست. محیط آزمایشی را باز کن، یا با Chrome روی Android سازگار امتحان کن.';$('#enterAR').disabled=!supported;$('#enterAR').onclick=()=>{location.hash='studio';toast('محیط آماده می‌شود؛ سپس «شروع AR» را بزن.');};return;}
 if(route==='studio'){app.innerHTML=`<section class="ar-launch">
 <div id="viewport" class="viewport ar-launch-stage"><div class="launch-placeholder"><div class="launch-mark">TOLICA</div><div class="launch-plan">${planSketch(layout==='empty'?'light':layout)}</div><h2>چیدمان ${space} آماده است</h2><p>بعد از شروع AR، کف را تثبیت کن و چیدمان را در اتاق جابه‌جا کن.</p></div></div>
 <div class="launch-actions"><button id="startAR" class="primary" disabled>در حال بررسی واقعیت افزوده…</button><div class="launch-alternatives"><a href="#layouts">تغییر چیدمان</a><button id="preview3D">پیش‌نمایش سه‌بعدی</button></div></div>
 </section>`;
 try{
  await loadScene();if(version!==routeVersion)return;
  studio=new Scene($('#viewport'),updateObjects);
  if(sceneMemory)studio.restoreState(sceneMemory);else{studio.seed(layout);const colors=themes[themeIndex].colors;studio.items.forEach((m,i)=>m.material.color.set(colors[i%colors.length]));}
  studio.onEnd=()=>{setPhotoMode(false);closeArSheet();$('#arDock').hidden=true;$('#measureHint').hidden=true;};
  studio.onPhotoTap=revealPhotoExit;
  studio.debugView.onUpdate=()=>{if(debugEnabled)refreshDebugPanel();};
  studio.setMeasureHandler(m=>$('#measureReadout').textContent=m===null?'نقطه اول را روی کف لمس کن':m===undefined?'نقطه دوم را لمس کن':m.toFixed(2)+' متر');
 }catch(error){$('#viewport').textContent='محیط سه‌بعدی آماده نشد.';console.error(error);return;}
 bindCalibration('ar');
 $('#preview3D').onclick=()=>{previewEnabled=!previewEnabled;$('#viewport').classList.toggle('show-preview',previewEnabled);$('#preview3D').textContent=previewEnabled?'بستن پیش‌نمایش':'پیش‌نمایش سه‌بعدی';};
 await support();if(version!==routeVersion)return;
 $('#startAR').textContent=supported?'دیدن در اتاق من · شروع AR ↗':'تلاش برای شروع AR / بررسی سازگاری';
 $('#startAR').disabled=false;$('#startAR').onclick=()=>startAR(false);return;}
 if(route==='gallery'){app.innerHTML=`<section class="page">${heading('گالری شخصی','قاب‌هایی از خانهٔ تو','ایده‌هایی که دوست داری، اینجا نگه دار.','welcome')}<div class="no-print">${uploadControl()}</div><div class="notice">تصاویر فقط در همین مرورگر و همین نشانی، روی دستگاه تو ذخیره می‌شوند. با پاک کردن داده‌های سایت حذف می‌شوند؛ تصویرهای مهم را دانلود کن.</div><div id="images" class="images"></div></section>${footer()}`;$('#upload').onchange=uploadFiles;try{const list=(await photos()).sort((a,b)=>b.date-a.date);if(version!==routeVersion)return;if(!list.length){$('#images').className='empty-gallery';$('#images').innerHTML=`${svg('gallery')}<h2>اولین قاب، منتظر توست.</h2><p>از محیط آزمایشی عکس بگیر یا اسکرین‌شات AR را بارگذاری کن.</p><a href="#spaces" class="back">شروع یک چیدمان ←</a>`;}else for(const p of list){const url=URL.createObjectURL(p.blob);photoURLs.push(url);const el=document.createElement('article');el.className='image-card';el.innerHTML=`<a href="${url}" target="_blank" rel="noopener"><img src="${url}" alt="تصویر ذخیره‌شدهٔ چیدمان"></a><p>${p.kind}<br>${new Date(p.date).toLocaleString('fa-IR')}</p><a href="${url}" download="tulika-${p.id}.png">دانلود ↓</a><button>حذف</button>`;el.querySelector('button').onclick=async()=>{try{await removePhoto(p.id);render();}catch{toast('حذف تصویر انجام نشد.');}};$('#images').append(el);}}catch{$('#images').textContent='دسترسی به گالری ممکن نیست؛ ذخیره‌سازی مرورگر را فعال کن.';}updateCount();return;}
 if(route==='invoice'){const total=savedItems.reduce((s,m)=>s+m.price,0);app.innerHTML=`<section class="page">${heading('برآورد اولیه','پیش‌فاکتور آزمایشی','فقط برای بررسی تجربهٔ انتخاب؛ فاقد اعتبار خرید.','studio')}<div class="invoice"><div class="page-heading"><a class="brand" href="#welcome">TOLICA</a><span class="step">${new Date().toLocaleDateString('fa-IR')}<br>واحد: تومان</span></div><table><thead><tr><th>حجم نمونه</th><th>رنگ</th><th>تعداد</th><th>مبلغ فرضی</th></tr></thead><tbody>${savedItems.map(m=>`<tr><td>${m.name||'قطعه'} ${fa(m.id)}</td><td><span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${m.color}"></span></td><td>۱</td><td>${fa(m.price)}</td></tr>`).join('')||'<tr><td colspan="4">هنوز باکسی انتخاب نشده است.</td></tr>'}</tbody><tfoot><tr><td colspan="3">جمع آزمایشی</td><td>${fa(total)} تومان</td></tr></tfoot></table><p>قیمت‌ها کاملاً فرضی‌اند. مالیات، ارسال و خدمات محاسبه نشده است. این صفحه سفارش یا پرداخت ایجاد نمی‌کند.</p></div><button id="print" class="primary no-print" style="margin-top:20px">چاپ / دریافت PDF</button></section>${footer()}`;$('#print').onclick=()=>window.print();return;}
 location.hash='welcome';
}
function handleARReport(report){arReport=report;refreshDebugPanel();const scanInfo=(!report.placed&&report.scanDrop!==null)?` · raw ${report.scanHits} · valid ${report.validHits} · cluster ${report.inlierHits} · vertical ${report.scanDrop.toFixed(2)}m · ray ${report.scanDistance.toFixed(2)}m`:'';$('#diagnostics').textContent=`${report.objects} objects · visible ${report.visible} · ${report.fps} FPS · tracking ${report.tracking?'OK':'LOST'} · hit ${report.placed?'LOCKED':report.hit?'READY':'SEARCH'} · placed ${report.placed?'YES':'NO'} · anchor ${report.anchor} · light ${report.light} · depth ${report.depth}${scanInfo}`;$('#confirmFloor').hidden=report.placed;$('#confirmFloor').disabled=!report.hit||!report.tracking;$('#arEditControls').hidden=!report.placed;$('#arSettings').hidden=!report.placed;updateMeasurements();}
async function startAR(basic=false){if(!studio||studio.session||arStarting)return;arStarting=true;const button=$('#startAR');button.disabled=true;$('#arError').close();try{$('#overlay').hidden=false;$('#confirmFloor').hidden=false;$('#confirmFloor').disabled=true;$('#arEditControls').hidden=true;$('#arSettings').hidden=true;$('#arStatus').textContent='در حال شناسایی کف…';const result=await studio.startAR(message=>$('#arStatus').textContent=message,handleARReport,basic,{light:!basic&&$('#lightEnabled').checked,depth:!basic&&$('#depthEnabled').checked});if(!result.hasOverlay)$('#overlay').hidden=true;studio.setDebugVisible(debugEnabled);updateObjects();}catch(error){$('#overlay').hidden=true;const failure=explainXR(error);lastXRErrorReport=JSON.stringify({version:'0.2.8',mode:basic?'basic':'full',stage:failure.stage,name:failure.name,message:failure.detail,secureContext:isSecureContext,webXR:!!navigator.xr,supportCheck:supported,userAgent:navigator.userAgent},null,2);$('#arErrorMessage').textContent=failure.message;$('#arErrorDetails').textContent=lastXRErrorReport;$('#arError').showModal();console.error(error);}finally{arStarting=false;button.disabled=false;}}
let debugEnabled=false;
function refreshDebugPanel(){
 const panel=$('#arDebugPanel');if(!panel||panel.hidden||!studio)return;
 $('#debugReadout').textContent=studio.debugView.summary();
}
function setDebug(enabled){
 debugEnabled=!!enabled;
 $('#arDebugPanel').hidden=!debugEnabled;
 $('#debugToggle').setAttribute('aria-pressed',String(debugEnabled));
 studio?.setDebugVisible(debugEnabled);
 if(debugEnabled)refreshDebugPanel();
}
function saveDebugJSON(){
 if(!studio)return;
 const data=studio.debugExport();
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;
 a.download='tolica-ar-diagnostics-'+Date.now()+'.json';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),5000);
 toast('گزارش JSON ذخیره شد؛ آن را در گفتگو بفرست.');
}
function openGitHubDebugIssue(){
 if(!studio)return;
 const data=studio.debugExport(),last=studio.debugView.lastState;
 const body=['## TOLICA AR diagnostic report','Version: v0.2.8','Started: '+(data.startedAt||'unknown'),'','### Latest readout','```',studio.debugView.summary(),'```','','### Events','```',JSON.stringify(data.events.slice(-12),null,2),'```','','### Device test notes','(Describe whether the floor was above or below the carpet.)','','The full time-series log is available via the Save JSON button. Attach it manually if needed.'].join('\\n');
 const url='https://github.com/MaxLightner/tolica-ar/issues/new?title='+encodeURIComponent('AR floor detection debug report')+'&body='+encodeURIComponent(body);
 window.open(url,'_blank','noopener');
}
$('#debugToggle').onclick=()=>setDebug(!debugEnabled);
$('#debugHide').onclick=()=>setDebug(false);
$('#debugSave').onclick=saveDebugJSON;
$('#debugGithub').onclick=openGitHubDebugIssue;
let photoTimer;
function revealPhotoExit(){$('#photoReturn').classList.add('revealed');clearTimeout(photoTimer);photoTimer=setTimeout(()=>$('#photoReturn').classList.remove('revealed'),3000);}
function setPhotoMode(enabled){if(!studio)return;studio.setPhotoMode(enabled);$('#overlay').classList.toggle('photography',enabled);$('#photoReturn').hidden=!enabled;if(enabled){revealPhotoExit();toast('پس از ۳ ثانیه ابزارها مخفی می‌شوند؛ اسکرین‌شات گوشی بگیر. برای بازگشت صفحه را لمس کن.');}else{clearTimeout(photoTimer);$('#photoReturn').classList.remove('revealed');}}
$('#photoReturn').onclick=()=>setPhotoMode(false);$('#photoAR').onclick=()=>setPhotoMode(true);
$('#closeARError').onclick=()=>$('#arError').close();$('#basicAR').onclick=()=>startAR(true);$('#copyARError').onclick=async()=>{try{await navigator.clipboard.writeText(lastXRErrorReport);toast('گزارش کپی شد.');}catch{toast('از جزئیات خطا عکس بگیر.');}};
$('#overlay').addEventListener('beforexrselect',event=>event.preventDefault());$('#homeAR').onclick=async()=>{try{if(studio?.session)await studio.session.end();}catch{}sceneMemory=null;location.hash='welcome';};$('#resetAR').onclick=async()=>{try{await studio?.beginScan();$('#arSettings').open=false;$('#confirmFloor').hidden=false;$('#confirmFloor').disabled=true;$('#arEditControls').hidden=true;$('#arSettings').hidden=true;}catch(error){toast('اسکن دوباره اجرا نشد.');}};$('#leaveAR').onclick=async()=>{try{await studio?.session?.end();}catch{toast('دکمهٔ بازگشت گوشی را بزن.');}};$('#confirmFloor').onclick=()=>studio?.confirmFloor();$('#rescanFloor').onclick=async()=>{try{await studio?.beginScan();$('#arSettings').open=false;}catch(error){toast('اسکن دوباره راه‌اندازی نشد؛ از AR خارج شو و دوباره وارد شو.');}};
$('#rotateAR').onclick=()=>{if(studio?.selected)studio.rotate(studio.selected.rotation.y*180/Math.PI+15);};$('#deleteAR').onclick=()=>studio?.remove();$('#colorAR').onclick=()=>{if(studio?.selected){const current='#'+studio.selected.material.color.getHexString();studio.color(palette[(palette.indexOf(current)+1)%palette.length]);}};$('#addAR').onclick=()=>{if(studio.items.length>=16){toast('حد آزمون این نسخه ۱۶ قطعه است.');return;}studio.add(Number($('#arProduct').value));};$('#closePhoto').onclick=()=>$('#photoHelp').close();
async function updateCount(){try{$('#galleryCount').textContent=fa((await photos()).length);}catch{$('#galleryCount').textContent='—';}}
async function showModes(){$('#modeSheet').showModal();await support();$('#modeSupport').textContent=supported?'AR در مرورگر شما در دسترس است؛ مجوز دوربین هنگام شروع پرسیده می‌شود.':'AR در این دستگاه در دسترس نیست؛ مدل ساده را امتحان کنید.';$('#chooseAR').disabled=!supported;}
$('#closeMode').onclick=()=>$('#modeSheet').close();$('#chooseSimple').onclick=()=>{$('#modeSheet').close();location.hash='studio';};$('#chooseAR').onclick=()=>{$('#modeSheet').close();location.hash='studio';toast('برای ورود به دوربین، «شروع AR» را بزنید.');};
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});render();updateCount();
