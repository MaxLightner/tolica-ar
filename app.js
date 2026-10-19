import {explainXR} from './xr.js?v=0.3.1';
import {photos,savePhoto,removePhoto} from './storage.js';
import {captureARScreen,CAMERA_RATIOS,ScreenshotUnavailable} from './camera-capture.js?v=0.3.1';
import {RUG_STYLES,rugPreviewDataUrl} from './rug-textures.js?v=0.3.1';
const $=s=>document.querySelector(s),app=$('#app'),fa=n=>n.toLocaleString('fa-IR');
let studio,Scene,palette,space='پذیرایی',layout='calm',supported=false,routeVersion=0,photoURLs=[],savedItems=[],arReport=null,sceneMemory=null,arStarting=false,lastXRErrorReport='';
const themes=[
 {name:'کرم و چوب',colors:['#cfbeaa','#c9bdae','#aa9882','#d7c8b4']},
 {name:'آبی و کرم',colors:['#7a9196','#d7c5b2','#879fa2','#c3b7a9']},
 {name:'سبز زیتونی',colors:['#909c84','#d4c6b4','#adba9d','#b6a793']}
];
let themeIndex=0,styleChoice='مینیمال',previewEnabled=false,peopleCount=4;
const catalogImages=[
 ['کاناپه','<rect x="14" y="24" width="74" height="46" rx="10"/><path d="M16 38h70M32 42v25m37-25v25"/>'],
 ['تک‌نفره','<rect x="27" y="20" width="48" height="54" rx="10"/><path d="M28 40h46"/>'],
 ['میز جلو مبلی','<rect x="14" y="31" width="74" height="32" rx="6"/><path d="M27 31v32m48-32v32"/>'],
 ['صندلی','<rect x="27" y="20" width="48" height="54" rx="10"/><path d="M28 40h46"/>'],
 ['گلدان','<path d="M39 71h24l7-35H33zM51 35V12m0 23-15-14m15 9 18-13"/><path d="M33 22q15-20 18 9M70 17q-20-5-19 13"/>'],
 ['کوسن','<rect x="22" y="23" width="58" height="49" rx="14"/><path d="M29 30q23 12 44 0m-44 34q23-12 44 0"/>'],
 ['آباژور','<path d="M36 24h30l9 29H27zM51 53v25M33 79h36"/>'],
 ['فرش','<rect x="13" y="20" width="77" height="60" rx="3"/><path d="M22 26h59v48H22zM51 34l19 16-19 16-19-16z"/>'],
 ['تخت خواب','<rect x="20" y="12" width="60" height="76" rx="4"/><rect x="25" y="25" width="50" height="54" rx="5"/><rect x="27" y="30" width="21" height="15" rx="4"/><rect x="52" y="30" width="21" height="15" rx="4"/>'],
 ['میز کار','<rect x="13" y="25" width="74" height="40" rx="3"/><path d="M22 66v14m56-14v14M25 35h20v20H25z"/>'],
 ['میز ناهارخوری','<rect x="20" y="22" width="60" height="58" rx="8"/><path d="M31 13h38M31 88h38M11 36v30m78-30v30"/>'],
 ['صندلی ناهارخوری','<rect x="29" y="20" width="42" height="58" rx="5"/><path d="M29 36h42M36 68h28"/>']
];
function objectIcon(index){return `<svg viewBox="0 0 100 100" class="object-icon" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${catalogImages[index]?.[1]||''}</svg>`;}
function planSketch(kind){
 const sofa=(x,y,w=92,angle=0)=>`<g transform="translate(${x} ${y}) rotate(${angle})"><rect x="0" y="0" width="${w}" height="46" rx="9" fill="#d0bfae" stroke="#8a7e73"/><path d="M7 15h${w-14}M12 19v22M${w-12} 19v22" fill="none" stroke="#a79787"/><rect x="8" y="20" width="${w-16}" height="22" rx="6" fill="#e5dacf" stroke="#ab9a89"/></g>`;
 const table=(x,y)=>`<g transform="translate(${x} ${y})"><rect x="0" y="0" width="55" height="37" rx="6" fill="#a98e77" stroke="#87705d"/><path d="M10 10h35M10 19h35" stroke="#d7c0a9"/></g>`;
 const room=`<rect x="14" y="12" width="290" height="207" rx="9" fill="#f4efe8" stroke="#c6b9ad" stroke-width="5"/><path d="M28 12h82m76 0h60" stroke="#f4efe8" stroke-width="7"/><path d="M122 12h52" stroke="#87b4b0" stroke-width="5"/>`;
 let plan='';
 if(space==='اتاق خواب'){
  plan=`<rect x="67" y="39" width="186" height="170" rx="13" fill="#e6ded3"/><rect x="100" y="34" width="126" height="160" rx="9" fill="#a78d7b" stroke="#867262" stroke-width="2"/><rect x="105" y="54" width="116" height="134" rx="9" fill="#e7e0d7"/><rect x="114" y="66" width="45" height="34" rx="8" fill="#d0c1b2"/><rect x="168" y="66" width="45" height="34" rx="8" fill="#d0c1b2"/><rect x="45" y="60" width="38" height="45" rx="4" fill="#a98e77"/><rect x="246" y="60" width="38" height="45" rx="4" fill="#a98e77"/>`;
  return `<svg viewBox="0 0 318 231" role="img" aria-label="پلان اتاق خواب از بالا">${room}${plan}</svg>`;
 }
 if(space==='ناهارخوری'||space==='آشپزخانه'){
  const count=[2,4,6,8].includes(peopleCount)?peopleCount:4,perSide=count/2;
  const width={2:85,4:128,6:163,8:197}[count],left=159-width/2;
  const chair=(x,y)=>`<rect x="${x-14}" y="${y}" width="28" height="25" rx="5" fill="#cbb5a0" stroke="#917e6a"/>`;
  let seats='';
  for(let i=0;i<perSide;i++){const x=159+(i-(perSide-1)/2)*(width/perSide);seats+=chair(x,39)+chair(x,179);}
  plan=`<rect x="38" y="31" width="243" height="183" rx="11" fill="#e2dad0"/><rect x="${left}" y="72" width="${width}" height="100" rx="9" fill="#b9a18a" stroke="#897260"/>${seats}`;
  return `<svg viewBox="0 0 318 231" role="img" aria-label="پلان میز ${count} نفره از بالا">${room}${plan}</svg>`;
 }
 if(space==='فضای کار'){
  plan=`<rect x="56" y="52" width="215" height="139" rx="9" fill="#e4d9cb"/><rect x="79" y="35" width="162" height="63" rx="7" fill="#a89077" stroke="#85715c"/><rect x="131" y="120" width="65" height="55" rx="13" fill="#c4b19b" stroke="#8b7765"/><circle cx="59" cy="179" r="15" fill="#8c9d84"/>`;
  return `<svg viewBox="0 0 318 231" role="img" aria-label="پلان فضای کار از بالا">${room}${plan}</svg>`;
 }
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
async function loadScene(){if(!Scene){const m=await import('./scene.js?v=0.3.1');Scene=m.Studio;palette=m.palette;}}
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
 <div class="cards room-choice">${[['living','پذیرایی','برای کنار هم بودن'],['dining','ناهارخوری','دور یک میز، کنار هم'],['dining','آشپزخانه','میز غذاخوری و دورهمی'],['bedroom','اتاق خواب','گوشه‌ای برای آرامش'],['office','فضای کار','جایی برای ایده‌های تازه']].map(([key,title,sub])=>`<button class="card ${space===title?'selected':''}" data-space="${title}" aria-pressed="${space===title}">${svg(key)}<strong>${title}</strong><small>${sub}</small></button>`).join('')}</div>
 <section class="room-prefs"><div class="pref-heading">سبک چیدمان <small>اختیاری</small></div><div class="style-pills">${['مینیمال','مدرن','کلاسیک','همه'].map(n=>`<button data-style="${n}" class="${styleChoice===n?'selected':''}">${n}</button>`).join('')}</div>
 <div class="pref-heading">ظرفیت چیدمان <small>تعداد نفرات</small></div><div class="people-picks">${[2,4,6,8].map(n=>`<button data-people="${n}" class="${peopleCount===n?'selected':''}" aria-pressed="${peopleCount===n}">${fa(n)} نفر</button>`).join('')}</div>
 <div class="pref-heading">پالت رنگ <small>بعداً قابل تغییر است</small></div><div class="theme-picks">${themes.map((t,i)=>`<button data-theme="${i}" class="${themeIndex===i?'selected':''}" aria-label="${t.name}"><span class="theme-blocks">${t.colors.map(c=>`<i style="background:${c}"></i>`).join('')}</span><small>${t.name}</small></button>`).join('')}</div></section>
 <button class="primary continue-room" id="goLayouts">دیدن چیدمان‌ها ←</button></section>`;
 document.querySelectorAll('[data-space]').forEach(btn=>btn.onclick=()=>{space=btn.dataset.space;document.querySelectorAll('[data-space]').forEach(el=>{el.classList.toggle('selected',el===btn);el.setAttribute('aria-pressed',String(el===btn));});});
 document.querySelectorAll('[data-style]').forEach(btn=>btn.onclick=()=>{styleChoice=btn.dataset.style;document.querySelectorAll('[data-style]').forEach(el=>el.classList.toggle('selected',el===btn));});
 document.querySelectorAll('[data-people]').forEach(btn=>btn.onclick=()=>{peopleCount=Number(btn.dataset.people);document.querySelectorAll('[data-people]').forEach(el=>{el.classList.toggle('selected',el===btn);el.setAttribute('aria-pressed',String(el===btn));});});
 document.querySelectorAll('[data-theme]').forEach(btn=>btn.onclick=()=>{themeIndex=Number(btn.dataset.theme);document.querySelectorAll('[data-theme]').forEach(el=>el.classList.toggle('selected',el===btn));});
 $('#goLayouts').onclick=()=>location.hash='layouts';return;}
 if(route==='layouts'){app.innerHTML=`<section class="page layouts-page">${heading('۰۲ / چیدمان','یک پلان انتخاب کن','نمای بالا · ${fa(peopleCount)} نفر · سبک ${styleChoice} · ${themes[themeIndex].name}','spaces')}
 <div class="layout-feed">${[['calm','چیدمان متعادل','برای فضای خانوادگی'],['social','چیدمان گفتگو','نشستن روبه‌روی هم'],['light','چیدمان باز','فضای آزادتر برای رفت‌وآمد']].map(([id,title,sub],i)=>`<button class="layout-photo-card" data-layout="${id}"><div class="layout-image floor-plan-card">${planSketch(id)}<span class="layout-badge">${fa(i+1).padStart(2,'۰')}</span></div><div class="layout-caption"><strong>${title}</strong><small>${sub}</small><span>←</span></div></button>`).join('')}
 <button class="start-blank" data-layout="empty"><span>＋</span><strong>شروع با فضای خالی</strong><small>از ابتدا بچین</small></button></div></section>`;
 document.querySelectorAll('[data-layout]').forEach(btn=>btn.onclick=()=>{layout=btn.dataset.layout;sceneMemory=null;previewEnabled=false;location.hash='studio';});return;}
  if(route==='detail'){app.innerHTML=`<section class="page detail-page"><a class="back" href="#layouts">بازگشت ←</a><img class="detail-photo" src="assets/living.png" alt="چیدمان مبلمان کرم در فضای نشیمن"><div class="dots"><i></i><i></i><i></i></div><h1>${layout==='social'?'چیدمان صمیمی':layout==='light'?'چیدمان سبک و روشن':'چیدمان کلاسیک ۱'}</h1><p>یک ایده برای ${space}؛ با ترکیبی از حجم‌های متنوع و رنگ‌های طبیعی.</p><p class="prototype-note">در محیط آزمایشی مبلمان کم‌پلیگان با ابعاد واقعی جایگزین مدل مبلمان می‌شوند.</p><button id="continueLayout" class="primary">ادامهٔ چیدمان و ویرایش <span>→</span></button></section>`;$('#continueLayout').onclick=()=>location.hash='studio';return;}
 if(route==='entry'){app.innerHTML=`<section class="page">${heading('۰۳ / ورود به تجربه','حالا در خانه‌ات ببین.','چند قدم تا امتحان کردن چیدمان فاصله داری.','layouts')}<div class="entry"><div><h2>فضای واقعی، انتخاب تازه</h2><p>در محیطی روشن، گوشی را آرام به سمت کف بگیر. پس از نمایش کف پیشنهادی، «تثبیت این کف» را بزن و خط A–B را روی یک طول معلوم بگذار.</p><div id="support" class="notice">در حال بررسی سازگاری مرورگر…</div><div class="entry-actions"><button id="enterAR" class="primary" disabled>ورود به AR ↗</button><button id="preview">محیط آزمایشی</button></div><p>نیازمند Android Chrome، گوشی سازگار با ARCore، اتصال امن و اجازهٔ دسترسی به دوربین. ورود به AR فقط با لمس دکمه انجام می‌شود.</p></div><div class="entry-illustration">${svg('phone')}</div></div><div class="notice">برای ثبت تصویر ترکیبی AR از اسکرین‌شات خود گوشی استفاده کن، سپس آن را در گالری بارگذاری کن. ثبت مستقیم دوربین از بوم سه‌بعدی در این نسخه انجام نمی‌شود.</div></section>${footer()}`;$('#preview').onclick=()=>location.hash='studio';await support();if(version!==routeVersion)return;$('#support').textContent=supported?'AR در این مرورگر در دسترس است. مجوزها و ردیابی هنگام شروع بررسی می‌شوند.':'AR در این دستگاه یا مرورگر در دسترس نیست. محیط آزمایشی را باز کن، یا با Chrome روی Android سازگار امتحان کن.';$('#enterAR').disabled=!supported;$('#enterAR').onclick=()=>{location.hash='studio';toast('محیط آماده می‌شود؛ سپس «شروع AR» را بزن.');};return;}
 if(route==='studio'){app.innerHTML=`<section class="ar-launch">
 <div id="viewport" class="viewport ar-launch-stage"><div class="launch-placeholder onboarding"><div class="launch-mark">TOLICA · AR</div><div class="launch-plan">${planSketch(layout==='empty'?'light':layout)}</div><h2>سه حرکت تا دیدن چیدمان</h2>
 <div class="onboard-steps">
  <div><span>۱</span><p><strong>دوربین رو به کف</strong><small>فرش یا سطح زمین را داخل تصویر نگه دار.</small></p></div>
  <div><span>۲</span><p><strong>حرکت آرام چپ و راست</strong><small>تا دایره سبز روی کف ظاهر شود.</small></p></div>
  <div><span>۳</span><p><strong>تثبیت و تنظیم جهت</strong><small>کف را تأیید کن و خط A—B را هم‌راستا با اتاق بگذار.</small></p></div>
 </div></div></div>
 <div class="launch-actions"><button id="startAR" class="primary" disabled>در حال بررسی واقعیت افزوده…</button><div class="launch-alternatives"><a href="#layouts">تغییر چیدمان</a><button id="preview3D">پیش‌نمایش سه‌بعدی</button></div></div>
 </section>`;
 try{
  await loadScene();if(version!==routeVersion)return;
  studio=new Scene($('#viewport'),updateObjects);
  if(sceneMemory)studio.restoreState(sceneMemory);else{studio.seed(layout,space,peopleCount);const colors=themes[themeIndex].colors;studio.items.forEach((m,i)=>{if(m.userData.index!==7)m.material.color.set(colors[i%colors.length]);});}
  studio.onEnd=()=>{setPhotoMode(false);closeArSheet();$('#arDock').hidden=true;$('#objectQuick').hidden=true;$('#scanReadiness').hidden=true;$('#measureHint').hidden=true;};
  studio.onPhotoTap=()=>{};
  studio.onHint=toast;
  studio.onSelectionScreen=position=>{
   const quick=$('#objectQuick');if(!quick)return;
   if(!position||!studio?.selected||!studio?.session||studio.photoMode||!$('#arToolSheet').hidden||studio.placementEnabled){quick.hidden=true;return;}
   quick.hidden=false;
   const x=Math.max(50,Math.min(window.innerWidth-50,position.x+(position.x>window.innerWidth*.62?-76:76)));
   const y=Math.max(125,Math.min(window.innerHeight-132,position.y));
   quick.style.left=x+'px';quick.style.top=y+'px';
  };
  studio.debugView.onUpdate=()=>{if(debugEnabled)refreshDebugPanel();};
  studio.setMeasureHandler((m,awaitSecond)=>$('#measureReadout').textContent=awaitSecond?'نقطه دوم را روی کف لمس کن':m===null?'نقطه اول را روی کف لمس کن':m.toFixed(2)+' متر');
 }catch(error){$('#viewport').textContent='محیط سه‌بعدی آماده نشد.';console.error(error);return;}
 bindCalibration('ar');
 $('#preview3D').onclick=()=>{previewEnabled=!previewEnabled;$('#viewport').classList.toggle('show-preview',previewEnabled);$('#preview3D').textContent=previewEnabled?'بستن پیش‌نمایش':'پیش‌نمایش سه‌بعدی';};
 await support();if(version!==routeVersion)return;
 $('#startAR').textContent=supported?'شروع اسکن کف و ورود به AR ↗':'بررسی دسترسی به AR';
 $('#startAR').disabled=false;$('#startAR').onclick=()=>startAR(false);return;}
 if(route==='gallery'){app.innerHTML=`<section class="page">${heading('گالری شخصی','قاب‌هایی از خانهٔ تو','ایده‌هایی که دوست داری، اینجا نگه دار.','welcome')}<div class="no-print">${uploadControl()}</div><div class="notice">تصاویر فقط در همین مرورگر و همین نشانی، روی دستگاه تو ذخیره می‌شوند. با پاک کردن داده‌های سایت حذف می‌شوند؛ تصویرهای مهم را دانلود کن.</div><div id="images" class="images"></div></section>${footer()}`;$('#upload').onchange=uploadFiles;try{const list=(await photos()).sort((a,b)=>b.date-a.date);if(version!==routeVersion)return;if(!list.length){$('#images').className='empty-gallery';$('#images').innerHTML=`${svg('gallery')}<h2>اولین قاب، منتظر توست.</h2><p>از محیط آزمایشی عکس بگیر یا اسکرین‌شات AR را بارگذاری کن.</p><a href="#spaces" class="back">شروع یک چیدمان ←</a>`;}else for(const p of list){const url=URL.createObjectURL(p.blob);photoURLs.push(url);const el=document.createElement('article');el.className='image-card';el.innerHTML=`<a href="${url}" target="_blank" rel="noopener"><img src="${url}" alt="تصویر ذخیره‌شدهٔ چیدمان"></a><p>${p.kind}<br>${new Date(p.date).toLocaleString('fa-IR')}</p><a href="${url}" download="tulika-${p.id}.png">دانلود ↓</a><button>حذف</button>`;el.querySelector('button').onclick=async()=>{try{await removePhoto(p.id);render();}catch{toast('حذف تصویر انجام نشد.');}};$('#images').append(el);}}catch{$('#images').textContent='دسترسی به گالری ممکن نیست؛ ذخیره‌سازی مرورگر را فعال کن.';}updateCount();return;}
 if(route==='invoice'){const total=savedItems.reduce((s,m)=>s+m.price,0);app.innerHTML=`<section class="page">${heading('برآورد اولیه','پیش‌فاکتور آزمایشی','فقط برای بررسی تجربهٔ انتخاب؛ فاقد اعتبار خرید.','studio')}<div class="invoice"><div class="page-heading"><a class="brand" href="#welcome">TOLICA</a><span class="step">${new Date().toLocaleDateString('fa-IR')}<br>واحد: تومان</span></div><table><thead><tr><th>حجم نمونه</th><th>رنگ</th><th>تعداد</th><th>مبلغ فرضی</th></tr></thead><tbody>${savedItems.map(m=>`<tr><td>${m.name||'قطعه'} ${fa(m.id)}</td><td><span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${m.color}"></span></td><td>۱</td><td>${fa(m.price)}</td></tr>`).join('')||'<tr><td colspan="4">هنوز باکسی انتخاب نشده است.</td></tr>'}</tbody><tfoot><tr><td colspan="3">جمع آزمایشی</td><td>${fa(total)} تومان</td></tr></tfoot></table><p>قیمت‌ها کاملاً فرضی‌اند. مالیات، ارسال و خدمات محاسبه نشده است. این صفحه سفارش یا پرداخت ایجاد نمی‌کند.</p></div><button id="print" class="primary no-print" style="margin-top:20px">چاپ / دریافت PDF</button></section>${footer()}`;$('#print').onclick=()=>window.print();return;}
 location.hash='welcome';
}
let arSheetMode=null;
$('#arSettingsBin').append($('#arSettings'));
function closeArSheet(){
 const settings=$('#arSettings');if(settings.parentElement===$('#arSheetContent'))$('#arSettingsBin').append(settings);
 settings.open=false;settings.hidden=true;
 $('#arToolSheet').hidden=true;arSheetMode=null;
 studio?.setPlacementEnabled(false);
}
function showArSheet(mode){
 if(!studio||!studio.placed)return;
 if(arSheetMode===mode){closeArSheet();return;}
 closeArSheet();arSheetMode=mode;
 const body=$('#arSheetContent'),title=$('#arSheetTitle');body.innerHTML='';
 const selected=studio.selected;
 if(mode==='add'||mode==='replace'){
  const replacing=mode==='replace';
  title.textContent=replacing?'جایگزینی آبجکت انتخابی':'افزودن در نشانگر + روی کف';
  if(!replacing)studio.setPlacementEnabled(true);
  const indices=replacing&&selected?
    ([0,1,3].includes(selected.userData.index)?[0,1,3]:
     [2,9,10].includes(selected.userData.index)?[2,9,10]:
     [7,6,4,5,8,11].includes(selected.userData.index)?[selected.userData.index]:[selected.userData.index]):
    catalogImages.map((_,i)=>i);
  body.innerHTML=`<div class="ar-object-grid">${indices.map(i=>`<button data-add-object="${i}" class="catalog-tile">${objectIcon(i)}<span>${catalogImages[i][0]}</span></button>`).join('')}</div>
   <small class="sheet-tip">${replacing?'آبجکت جدید جای قبلی می‌نشیند و رنگ و جهت آن حفظ می‌شود.':'نشانگر + روی کف، جای ظهور آبجکت است؛ دوربین را آرام جابه‌جا کن تا روی جای دلخواه قرار بگیرد، سپس مدل را انتخاب کن.'}</small>`;
  body.querySelectorAll('[data-add-object]').forEach(btn=>btn.onclick=()=>{
   if(studio.items.length>=24&&!replacing){toast('برای سرعت AR، فعلاً حداکثر ۲۴ آبجکت مجاز است.');return;}
   const i=Number(btn.dataset.addObject);
   const mesh=replacing?studio.replaceSelected(i):studio.addAtMarker(i);
   if(!mesh){toast('آبجکت اضافه نشد.');return;}
   closeArSheet();toast('«'+catalogImages[i][0]+'» روی محل نشانگر قرار گرفت.');
  });
 }else if(mode==='colors'){
  if(selected?.userData.index===7){
   title.textContent='طرح و رنگ فرش';
   body.innerHTML=`<div class="rug-grid">${RUG_STYLES.map(r=>`<button data-rug="${r.id}" class="${selected.userData.rugStyle===r.id?'selected':''}"><img src="${rugPreviewDataUrl(r.id)}" alt="${r.name}"><span>${r.name}</span></button>`).join('')}</div>`;
   body.querySelectorAll('[data-rug]').forEach(btn=>btn.onclick=()=>{studio.setRugStyle(btn.dataset.rug);body.querySelectorAll('[data-rug]').forEach(b=>b.classList.toggle('selected',b===btn));});
  }else{
   title.textContent=selected?'رنگ و جنس · '+selected.userData.product.name:'ابتدا آبجکت را انتخاب کن';
   const colors=[...themes[themeIndex].colors,'#b6bca2','#70858b','#b79c85','#ae8574','#546356','#5f5753','#efe8df'];
   body.innerHTML=`<div class="ar-color-grid">${colors.map((c,i)=>`<button data-material="${c}" title="${c}" aria-label="رنگ ${i+1}" style="--swatch:${c}"><span></span></button>`).join('')}</div>`;
   body.querySelectorAll('[data-material]').forEach(btn=>btn.onclick=()=>{if(!studio.selected)return;studio.color(btn.dataset.material);});
  }
 }else if(mode==='objects'){
  title.textContent='اشیای داخل چیدمان · '+fa(studio.items.length);
  body.innerHTML=`<div class="ar-object-list">${studio.items.map(m=>`<div class="ar-list-row ${m===selected?'selected':''}">
    <button class="ar-list-select" data-select-id="${m.userData.id}">${objectIcon(m.userData.index)}<span>${m.userData.product.name}</span></button>
    <button data-show-id="${m.userData.id}" aria-label="${m.visible?'پنهان کردن':'نمایش دادن'}">${m.visible?'◉':'◌'}</button>
    <button data-delete-id="${m.userData.id}" aria-label="حذف">×</button>
   </div>`).join('')}</div><small class="sheet-tip">با ◉ نمایش را خاموش یا روشن کن؛ × آبجکت را حذف می‌کند.</small>`;
  const refresh=()=>{closeArSheet();showArSheet('objects');};
  body.querySelectorAll('[data-select-id]').forEach(btn=>btn.onclick=()=>{studio.select(studio.items.find(m=>m.userData.id===Number(btn.dataset.selectId)));refresh();});
  body.querySelectorAll('[data-show-id]').forEach(btn=>btn.onclick=()=>{const id=Number(btn.dataset.showId),mesh=studio.items.find(m=>m.userData.id===id);studio.setItemVisible(id,!mesh.visible);refresh();});
  body.querySelectorAll('[data-delete-id]').forEach(btn=>btn.onclick=()=>{const item=studio.items.find(m=>m.userData.id===Number(btn.dataset.deleteId));if(item){studio.select(item);studio.remove();}refresh();});
 }else if(mode==='features'){
  if(!selected){title.textContent='ابتدا یک آبجکت انتخاب کن';return;}
  const index=selected.userData.index;title.textContent='ویژگی‌های '+selected.userData.product.name;
  if(index===6){
   body.innerHTML=`<button class="feature-action" id="lampSwitch">${selected.userData.lampOn===false?'روشن کردن نور آباژور':'خاموش کردن نور آباژور'}</button><small class="sheet-tip">نور روی مدل‌های مجازی اطراف اثر می‌گذارد؛ نورپردازی فرش یا دیوار واقعی نیازمند بازسازی محیط است.</small>`;
   $('#lampSwitch').onclick=()=>{studio.setLampOn(selected.userData.lampOn===false);closeArSheet();showArSheet('features');};
  }else if(index===10){
   body.innerHTML='<p class="feature-caption">ظرفیت میز و تعداد صندلی‌ها</p><div class="feature-options">'+[2,4,6,8].map(n=>`<button data-seats="${n}" class="${(selected.userData.capacity||4)===n?'selected':''}">${fa(n)} نفر</button>`).join('')+'</div>';
   body.querySelectorAll('[data-seats]').forEach(btn=>btn.onclick=()=>{studio.setDiningCapacity(Number(btn.dataset.seats));closeArSheet();showArSheet('features');});
  }else if([0,1,3].includes(index)){
   body.innerHTML='<p class="feature-caption">تبدیل مدل مبل با حفظ موقعیت</p><div class="feature-options">'+[1,2,3].map(n=>`<button data-sofa-seats="${n}" class="${selected.userData.seats===n?'selected':''}">${fa(n)} نفره</button>`).join('')+'</div>';
   body.querySelectorAll('[data-sofa-seats]').forEach(btn=>btn.onclick=()=>{studio.setSofaSeats(Number(btn.dataset.sofaSeats));closeArSheet();showArSheet('features');});
  }else if(index===7){closeArSheet();showArSheet('colors');return;}
  else body.innerHTML='<p class="sheet-tip">برای این آبجکت می‌توانی رنگ، جایگاه و مدل را تغییر بدهی. قابلیت‌های بیشتر بعداً اضافه می‌شوند.</p>';
 }else if(mode==='settings'){
  title.textContent='تنظیمات AR و جهت چیدمان';
  const details=$('#arSettings');details.hidden=false;details.open=true;body.append(details);
  const status=document.createElement('p');status.className='xr-status';status.textContent='عمق: '+(arReport?.depth||'نامشخص')+' · نور: '+(arReport?.light||'نامشخص');body.append(status);
  const note=document.createElement('small');note.className='sheet-tip';note.textContent='تنظیمات عمق و نور بعد از شروع دوباره AR اعمال می‌شوند؛ A—B مستقل از خط‌کش مجازی است.';body.append(note);
 }
 $('#arToolSheet').hidden=false;
}
$('#arSheetClose').onclick=closeArSheet;
$('#arAddTool').onclick=()=>showArSheet('add');
$('#arMaterialTool').onclick=()=>showArSheet('colors');
$('#quickCopy').onclick=()=>{if(studio?.items.length>=24){toast('حد آبجکت‌ها ۲۴ است.');return;}const item=studio?.duplicateSelected();if(item)toast('نسخه دوم کنار آبجکت قبلی ساخته شد.');};
$('#quickChange').onclick=()=>showArSheet('replace');
$('#quickProps').onclick=()=>showArSheet('features');
$('#quickRotate').onclick=()=>studio?.rotate();
$('#quickDelete').onclick=()=>{studio?.remove();};
$('#arListTool').onclick=()=>showArSheet('objects');
$('#arSettingsTool').onclick=()=>showArSheet('settings');
$('#arPhotoTool').onclick=()=>setPhotoMode(true);
$('#arRulerTool').onclick=()=>{
 if(!studio||!studio.placed)return;
 closeArSheet();
 const active=studio.setMeasureActive(!studio.measureTool.active);
 $('#arRulerTool').setAttribute('aria-pressed',String(active));$('#measureHint').hidden=!active;
 $('#measureReadout').textContent=active?'نقطه اول را روی کف لمس کن':'';
 if(active)toast('روی دو نقطه از کف لمس کن؛ فاصله برحسب متر نمایش داده می‌شود.');
};
$('#measureClear').onclick=()=>{studio?.clearMeasure();$('#measureReadout').textContent='نقطه اول را روی کف لمس کن';};
function handleARReport(report){
 arReport=report;refreshDebugPanel();
 const scanBox=$('#scanReadiness');
 scanBox.hidden=report.placed;
 if(!report.placed){
  let progress=12,label='راه‌اندازی ردیابی…';
  if(report.tracking){progress=35;label='دوربین آماده است؛ آرام به سمت کف حرکت بده';}
  if(report.scanHits>0){progress=60;label='برخورد با سطح ثبت شد؛ بررسی نقاط کف';}
  if(report.validHits>0){progress=78;label='نقاط افقی دریافت شدند';}
  if(report.hit){progress=100;label='کف پیشنهادی آماده است؛ تثبیت را بزن';}
  $('#scanProgress').value=progress;
  $('#scanPercent').textContent=fa(progress)+'٪';
  $('#scanStage').textContent=label;
 }
 $('#objectQuick').hidden=!report.placed||!studio?.selected;

 const scanInfo=(!report.placed&&report.scanDrop!==null)?` · raw ${report.scanHits} · valid ${report.validHits} · cluster ${report.inlierHits} · vertical ${report.scanDrop.toFixed(2)}m · ray ${report.scanDistance.toFixed(2)}m`:'';
 $('#diagnostics').textContent=`${report.objects} objects · visible ${report.visible} · ${report.fps} FPS · tracking ${report.tracking?'OK':'LOST'} · hit ${report.placed?'LOCKED':report.hit?'READY':'SEARCH'} · placed ${report.placed?'YES':'NO'} · anchor ${report.anchor} · light ${report.light} · depth ${report.depth}${scanInfo}`;
 $('#confirmFloor').hidden=report.placed;$('#confirmFloor').disabled=!report.hit||!report.tracking;
 $('#confirmFloor').textContent=report.hit?'تثبیت کف و ورود به چیدمان':'در حال شناسایی کف…';
 $('#arEditControls').hidden=true;
 $('#arSettings').hidden=!(report.placed&&arSheetMode==='settings');
 $('#arDock').hidden=!report.placed;
 $('#arDock').classList.toggle('ready',report.placed);
 $('#overlay').classList.toggle('floor-ready',report.placed);
 if(!report.placed){closeArSheet();$('#measureHint').hidden=true;}
 updateMeasurements();
}
async function startAR(basic=false){if(!studio||studio.session||arStarting)return;arStarting=true;const button=$('#startAR');button.disabled=true;$('#arError').close();try{$('#overlay').hidden=false;$('#confirmFloor').hidden=false;$('#confirmFloor').disabled=true;$('#arEditControls').hidden=true;$('#arDock').hidden=true;$('#objectQuick').hidden=true;$('#scanReadiness').hidden=false;$('#scanProgress').value=12;$('#scanStage').textContent='راه‌اندازی AR…';$('#scanPercent').textContent='۱۲٪';closeArSheet();$('#arSettings').hidden=true;$('#arStatus').textContent='در حال شناسایی کف…';const result=await studio.startAR(message=>$('#arStatus').textContent=message,handleARReport,basic,{light:!basic&&$('#lightEnabled').checked,depth:!basic&&$('#depthEnabled').checked});if(!result.hasOverlay)$('#overlay').hidden=true;studio.setDebugVisible(debugEnabled);updateObjects();}catch(error){$('#overlay').hidden=true;$('#arDock').hidden=true;const failure=explainXR(error);lastXRErrorReport=JSON.stringify({version:'0.3.1',mode:basic?'basic':'full',stage:failure.stage,name:failure.name,message:failure.detail,secureContext:isSecureContext,webXR:!!navigator.xr,supportCheck:supported,userAgent:navigator.userAgent},null,2);$('#arErrorMessage').textContent=failure.message;$('#arErrorDetails').textContent=lastXRErrorReport;$('#arError').showModal();console.error(error);}finally{arStarting=false;button.disabled=false;}}
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
 const body=['## TOLICA AR diagnostic report','Version: v0.3.1','Started: '+(data.startedAt||'unknown'),'','### Latest readout','```',studio.debugView.summary(),'```','','### Events','```',JSON.stringify(data.events.slice(-12),null,2),'```','','### Device test notes','(Describe whether the floor was above or below the carpet.)','','The full time-series log is available via the Save JSON button. Attach it manually if needed.'].join('\\n');
 const url='https://github.com/MaxLightner/tolica-ar/issues/new?title='+encodeURIComponent('AR floor detection debug report')+'&body='+encodeURIComponent(body);
 window.open(url,'_blank','noopener');
}
$('#debugToggle').onclick=()=>setDebug(!debugEnabled);
$('#debugHide').onclick=()=>setDebug(false);
$('#debugSave').onclick=saveDebugJSON;
$('#debugGithub').onclick=openGitHubDebugIssue;
const CAMERA_KIND='tolica-camera';
let cameraObjectURLs=[],cameraBusy=false,cameraActive=false;
function cameraPhotoURL(blob){
 const url=URL.createObjectURL(blob);cameraObjectURLs.push(url);return url;
}
function clearCameraURLs(){cameraObjectURLs.forEach(URL.revokeObjectURL);cameraObjectURLs=[];}
async function cameraShots(){
 // Imported images, device gallery photos and earlier uploads are not shown here.
 return (await photos()).filter(photo=>photo.kind===CAMERA_KIND).sort((a,b)=>b.date-a.date);
}
async function updateCameraLast(){
 if(!cameraActive)return;
 try{
  const latest=(await cameraShots())[0],image=$('#cameraLastImage'),placeholder=$('#cameraLastPlaceholder');
  clearCameraURLs();
  image.hidden=!latest;placeholder.hidden=!!latest;
  if(latest)image.src=cameraPhotoURL(latest.blob);else image.removeAttribute('src');
 }catch{cameraNotice('دسترسی به عکس‌های تولیکا ممکن نیست.');}
}
function cameraNotice(message){
 const el=$('#cameraNotice');el.textContent=message;el.hidden=false;
}
function setPhotoMode(enabled){
 if(!studio)return;
 cameraActive=!!enabled;
 if(enabled){
  closeArSheet();
  $('#cameraGallery').hidden=true;
  $('#cameraMode').classList.remove('gallery-open','capturing');
  $('#cameraNotice').hidden=true;
  studio.setPlacementEnabled(false);
 }
 studio.setPhotoMode(enabled);
 $('#overlay').classList.toggle('photography',enabled);
 $('#cameraMode').hidden=!enabled;
 $('#objectQuick').hidden=true;
 if(enabled){updateCameraLast();setCameraRatio();}else{
  $('#cameraGallery').hidden=true;
  $('#cameraMode').classList.remove('gallery-open','capturing');
  clearCameraURLs();
 }
}
function setCameraRatio(){
 const ratio=CAMERA_RATIOS[$('#cameraRatio').value]||4/3;
 $('#cameraFraming').style.aspectRatio=ratio;
 $('#cameraFraming').style.setProperty('--frame-ratio',String(ratio));
}
$('#cameraRatio').onchange=setCameraRatio;
$('#cameraClose').onclick=()=>setPhotoMode(false);
$('#cameraGalleryBack').onclick=()=>{
 $('#cameraGallery').hidden=true;$('#cameraMode').classList.remove('gallery-open');
};
$('#cameraLast').onclick=()=>openCameraGallery();
async function openCameraGallery(){
 if(!cameraActive)return;
 $('#cameraGallery').hidden=false;$('#cameraMode').classList.add('gallery-open');
 const host=$('#cameraGalleryItems');host.replaceChildren();
 try{
  const shots=await cameraShots();
  if(!cameraActive||$('#cameraGallery').hidden)return;
  $('#cameraGalleryCount').textContent=fa(shots.length);
  if(!shots.length){
   host.textContent='هنوز عکسی با شاتر تولیکا ثبت نشده است.';
   return;
  }
  for(const record of shots){
   const card=document.createElement('article');card.className='camera-shot-card';
   const img=document.createElement('img');img.src=cameraPhotoURL(record.blob);img.alt='عکس تولیکا';
   const actions=document.createElement('div');actions.className='camera-shot-actions';
   const download=document.createElement('a');download.textContent='ذخیره در دستگاه';download.href=img.src;
   download.download='tolica-'+record.id+'.jpg';
   const del=document.createElement('button');del.textContent='حذف';del.onclick=async()=>{
    if(!confirm('این عکس از گالری تولیکا حذف شود؟'))return;
    await removePhoto(record.id);await updateCameraLast();await openCameraGallery();
   };
   actions.append(download,del);card.append(img,actions);host.append(card);
  }
 }catch{host.textContent='گالری تولیکا در این مرورگر در دسترس نیست.';}
}
$('#cameraShutter').onclick=async()=>{
 if(!studio?.session||!cameraActive||cameraBusy)return;
 cameraBusy=true;$('#cameraShutter').disabled=true;$('#cameraNotice').hidden=true;
 try{
  const blob=await captureARScreen({
   ratio:$('#cameraRatio').value,
   beforeFrame:async()=>{
    $('#cameraMode').classList.add('capturing');
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   },
   afterFrame:()=>$('#cameraMode').classList.remove('capturing')
  });
  if(!cameraActive)return;
  await savePhoto(blob,CAMERA_KIND);
  await updateCameraLast();
  $('#cameraShutter').classList.add('flash');
  setTimeout(()=>$('#cameraShutter').classList.remove('flash'),240);
  cameraNotice('عکس در گالری اختصاصی تولیکا ذخیره شد.');
 }catch(error){
  cameraNotice(error instanceof ScreenshotUnavailable?error.message:'ثبت عکس ممکن نشد. دسترسی به ضبط صفحه و فضای ذخیره‌سازی را بررسی کن.');
 }finally{
  $('#cameraMode').classList.remove('capturing');
  cameraBusy=false;$('#cameraShutter').disabled=false;
 }
};
$('#closeARError').onclick=()=>$('#arError').close();$('#basicAR').onclick=()=>startAR(true);$('#copyARError').onclick=async()=>{try{await navigator.clipboard.writeText(lastXRErrorReport);toast('گزارش کپی شد.');}catch{toast('از جزئیات خطا عکس بگیر.');}};
$('#overlay').addEventListener('beforexrselect',event=>event.preventDefault());$('#homeAR').onclick=async()=>{try{if(studio?.session)await studio.session.end();}catch{}sceneMemory=null;location.hash='welcome';};$('#resetAR').onclick=async()=>{try{await studio?.beginScan();$('#arSettings').open=false;$('#confirmFloor').hidden=false;$('#confirmFloor').disabled=true;$('#arEditControls').hidden=true;$('#arSettings').hidden=true;}catch(error){toast('اسکن دوباره اجرا نشد.');}};$('#leaveAR').onclick=async()=>{try{await studio?.session?.end();}catch{toast('دکمهٔ بازگشت گوشی را بزن.');}};$('#confirmFloor').onclick=()=>studio?.confirmFloor();$('#rescanFloor').onclick=async()=>{try{await studio?.beginScan();$('#arSettings').open=false;}catch(error){toast('اسکن دوباره راه‌اندازی نشد؛ از AR خارج شو و دوباره وارد شو.');}};
$('#rotateAR').onclick=()=>{if(studio?.selected)studio.rotate(studio.selected.rotation.y*180/Math.PI+15);};$('#deleteAR').onclick=()=>studio?.remove();$('#colorAR').onclick=()=>{if(studio?.selected){const current='#'+studio.selected.material.color.getHexString();studio.color(palette[(palette.indexOf(current)+1)%palette.length]);}};$('#addAR').onclick=()=>{if(studio.items.length>=16){toast('حد آزمون این نسخه ۱۶ قطعه است.');return;}studio.add(Number($('#arProduct').value));};$('#closePhoto').onclick=()=>$('#photoHelp').close();
async function updateCount(){try{$('#galleryCount').textContent=fa((await photos()).length);}catch{$('#galleryCount').textContent='—';}}
async function showModes(){$('#modeSheet').showModal();await support();$('#modeSupport').textContent=supported?'AR در مرورگر شما در دسترس است؛ مجوز دوربین هنگام شروع پرسیده می‌شود.':'AR در این دستگاه در دسترس نیست؛ مدل ساده را امتحان کنید.';$('#chooseAR').disabled=!supported;}
$('#closeMode').onclick=()=>$('#modeSheet').close();$('#chooseSimple').onclick=()=>{$('#modeSheet').close();location.hash='studio';};$('#chooseAR').onclick=()=>{$('#modeSheet').close();location.hash='studio';toast('برای ورود به دوربین، «شروع AR» را بزنید.');};
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});render();updateCount();
