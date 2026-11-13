/* FIRST® Kazakhstan — отрисовка страницы.
 * Тексты и справочники — data.js. События — assets/data/sheet.js: снимок официальной Google-таблицы расписания,
 * его автоматически обновляет GitHub Action (tools/update_data.py). Посты Telegram с хэштегом #сайт — assets/data/news.js. */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const tt=k=>(T[L]&&T[L][k]!=null)?T[L][k]:(T.ru[k]!=null?T.ru[k]:"");
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* число + слово: в data.js подпись либо строка (kk), либо формы по числу (ru: 1, 2–4, 5+; en: 1, 2+) */
const pl=(k,n)=>{const v=tt(k);if(!Array.isArray(v))return v;if(L==="en")return v[n===1?0:1];const a=n%10,b=n%100;return v[(a===1&&b!==11)?0:(a>=2&&a<=4&&(b<12||b>14))?1:2]};
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
let TODAY=new Date();TODAY.setHours(0,0,0,0);
try{const p=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Almaty",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()).split("-");TODAY=new Date(+p[0],+p[1]-1,+p[2])}catch(e){}

/* ================= расписание из официальной таблицы ================= */
const SHEET=window.FK_SHEET||{tabs:{}},FORMS=SHEET.forms||{};
const ctext=c=>String(Array.isArray(c)?c[0]:(c==null?"":c)).replace(/\s+/g," ").trim();
const curl=c=>Array.isArray(c)&&/^https?:\/\//.test(c[1])?c[1]:"";
/* кнопка регистрации — только ссылка на Google Форму (forms.gle/… или docs.google.com/forms/…, как в tools/update_data.py → is_form_url);
 * любой другой адрес из таблицы (документ, таблица Google, чужой сайт) кнопкой не становится */
const formUrl=u=>{try{const x=new URL(u);return x.protocol==="https:"&&(x.hostname==="forms.gle"||(x.hostname==="docs.google.com"&&x.pathname.startsWith("/forms/")))?u:""}catch(e){return""}};
/* uSTEM Connect (data.js → CONNECT): регистрация команд на официальные турниры. Кнопка на сайте активна, только когда у турнира
 * есть страница в Connect: она находится сама (connMatch ниже) или задаётся гиперссылкой на connect.ustem.kz в строке события таблицы.
 * Страница есть, но регистрация там закрыта (общий список событий Connect, SHEET.connect_all) – кнопка всё равно ведёт на неё;
 * события нет в Connect совсем – кнопка серая, «регистрация ещё не открыта» */
const connUrl=u=>{try{const x=new URL(u);return x.protocol==="https:"&&x.hostname===CONNECT.host?u:""}catch(e){return""}};
/* регистрация через uSTEM Connect – скримиджи и командные турниры: Regional, Qualifier, национальный этап, Off-Season и чемпионаты из вкладки Big Events.
 * Пока скримиджа нет в Connect, кнопка серая и «регистрация ещё не открыта»; есть в Connect с закрытой регистрацией – кнопка ведёт на его страницу.
 * Google Формы его категорий кнопками не становятся, чтобы команды не путались.
 * Кик-офф – Google Формы из таблицы, но если у него есть страница в Connect, – тоже Connect (e.viaConn); прочие события Big Events (дедлайн и интервью FIRST Leadership Award, Digital Qazaqstan) –
 * как раньше, только ссылки из таблицы. Social Media Challenge (встроенная карточка SMC) тоже регистрируется в Connect, кнопка
 * «Условия и задания» при этом остаётся; FIRST4ALL – со своей ссылкой из data.js */
const viaConnect=e=>(/^(reg|scrim|qual|rep|off|smc)$/.test(e.stage)||(e.stage==="big"&&/championship/i.test(e.name)))&&e.tab!=="F4A";
/* страница турнира в uSTEM Connect – по названию: список страниц Connect собирает tools/update_data.py (sheet.js → connect).
 * Адрес страницы повторяет название события («IQanat FIRST Regional 2026» → /events/iqanat-first-regional-2026), поэтому сначала
 * ищется точное совпадение, затем единственная страница, адрес которой начинается так же (например, …-2026-k-e-r-n-school);
 * у названия без года – только страница «название + сезон» (…-2026 или …-2026-27), чтобы не попасть на чужое событие.
 * Пояснение в скобках в названии не учитывается: «Social Media Challenge (SMC)» → social-media-challenge-2026-27.
 * Ничего не нашлось – кнопка неактивна */
const slugOf=t=>lo(t).replace(/\([^)]*\)/g," ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const connList=l=>(l||[]).map(u=>connUrl(u)).filter(Boolean).map(u=>({u:u,k:(u.split("/events/")[1]||"").replace(/\/+$/,"")}));
const CONN_EV=connList(SHEET.connect),CONN_ALL=connList(SHEET.connect_all);   /* события с открытой регистрацией / все события Connect */
const connFind=(list,name)=>{const k=slugOf(name);if(!k)return"";
  const ex=list.find(x=>x.k===k);if(ex)return ex.u;
  let pre=list.filter(x=>x.k.startsWith(k+"-"));
  if(!/\d{4}/.test(k))pre=pre.filter(x=>/^\d{4}(-\d{2}|-\d{4})?$/.test(x.k.slice(k.length+1)));
  return pre.length===1?pre[0].u:""};
const connMatch=name=>connFind(CONN_EV,name),connAny=name=>connFind(CONN_ALL,name);
const cu=v=>{const u=encodeURI(String(v==null?"":v)).replace(/[()"']/g,"");return u?`url('${u}')`:"none"};   /* в атрибуте style — только одинарные кавычки */
const lo=s=>String(s||"").replace(/\s+/g," ").trim().toLowerCase();
const p2=n=>String(n).padStart(2,"0");
const MN={ru:["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"],
  kk:["қаңтар","ақпан","наурыз","сәуір","мамыр","маусым","шілде","тамыз","қыркүйек","қазан","қараша","желтоқсан"],
  en:["January","February","March","April","May","June","July","August","September","October","November","December"]};
const MRX=[/қаңтар|январ|jan/,/ақпан|феврал|feb/,/наурыз|март|mar(?!k)/,/сәуір|апрел|apr/,/мамыр|(^|[^а-яё])ма[йя]([^а-яё]|$)|may/,/маусым|июн|jun/,
  /шілде|июл|jul/,/тамыз|август|aug/,/қыркүйек|сентябр|sep/,/қазан|октябр|oct/,/қараша|ноябр|nov/,/желтоқсан|декабр|dec/];
function fmtRange(a,b){const d=x=>p2(x.getDate()),m=x=>p2(x.getMonth()+1),y=x=>x.getFullYear();
  if(+a===+b)return `${d(a)}.${m(a)}.${y(a)}`;
  if(y(a)===y(b)&&m(a)===m(b))return `${d(a)}–${d(b)}.${m(b)}.${y(b)}`;
  if(y(a)===y(b))return `${d(a)}.${m(a)} – ${d(b)}.${m(b)}.${y(b)}`;
  return `${d(a)}.${m(a)}.${y(a)} – ${d(b)}.${m(b)}.${y(b)}`}
/* «17.10.2026, сенбі», «1.10.2026 - 3.10.2026», «10-11.04.2027», «Ақпан 2027», «Ақпан-Наурыз 2027», пусто */
function parseDate(raw){
  const s=String(raw||"").trim();
  if(!s)return{tba:1,start:null,end:null};
  const full=[];for(let rx=/(\d{1,2})\.(\d{1,2})\.(\d{4})/g,m;(m=rx.exec(s));)full.push(new Date(+m[3],+m[2]-1,+m[1])); /* без matchAll – работает и на старых iPhone (iOS 12) */
  let a=null,b=null;
  if(full.length>=2){a=full[0];b=full[full.length-1]}
  else if(full.length===1){b=full[0];const m=s.match(/^\D*?(\d{1,2})\s*[-–—]\s*\d{1,2}\.\d{1,2}\.\d{4}/);a=m?new Date(b.getFullYear(),b.getMonth(),+m[1]):b}
  if(a){if(b<a)b=a;const t=fmtRange(a,b);return{start:a,end:b,txt:[t,t,t]}}
  const l=s.toLowerCase(),ms=[];MRX.forEach((r,k)=>{const m=r.exec(l);if(m)ms.push([m.index,k])});ms.sort((x,y)=>x[0]-y[0]);
  const y=s.match(/\d{4}/);
  if(ms.length&&y){const m1=ms[0][1],m2=ms[ms.length-1][1],yr=+y[0],cap=x=>x.charAt(0).toUpperCase()+x.slice(1);
    const txt=["ru","kk","en"].map(k=>{const n=MN[k];return(m1===m2?cap(n[m1]):cap(n[m1])+"–"+n[m2])+" "+yr});
    return{start:new Date(yr,m1,1),end:new Date(yr,m2+1,0),txt:txt}}
  return{start:null,end:null,txt:[s,s,s]};
}
const dTxt=(d,i)=>d.tba?tt("tba"):d.txt[i];
/* категории и ссылки регистрации. Закрытая форма (tools/update_data.py отмечает её как closed) остаётся ссылкой с пометкой
 * «регистрация закрыта» – все формы таблицы есть на сайте; скрывается только форма чужого события (mismatch) */
function parseCat(text,url){
  const t=lo(text);let code="OTHER",label=text;
  if(/семинар|seminar/.test(t)){code="SEM";label=""}
  else if(/future/.test(t)){code="FE";label=/k\s*[-–]?\s*2\b|5\s*[-–]\s*7/.test(t)?"Future Edition K–2":/3\s*[-–]\s*8|8\s*[-–]\s*16/.test(t)?"Future Edition 3–8":"Future Edition"}
  else if(/fll[\s-]*d/.test(t))code="FLL-D";
  else if(/fll[\s-]*e/.test(t))code="FLL-E";
  else if(/fll[\s-]*c/.test(t))code="FLL-C";
  else if(/ftc/.test(t))code="FTC";
  else if(/frc/.test(t))code="FRC";
  url=formUrl(url);
  const st=url&&FORMS[url]?FORMS[url].s:"";
  return{code:code,label:label,url:st==="mismatch"?"":url,closed:st==="closed"};
}
const catLabel=c=>c.code==="SEM"?tt("sem"):c.label;
const RGN_KK={};Object.keys(RGN).forEach(k=>{RGN_KK[lo(RGN[k][1])]=k});
function regionOf(raw){
  const s=lo(raw);if(!s||/қаласы|қ\.$|^online$|^онлайн$/.test(s))return null;
  if(RGN_KK[s])return RGN[RGN_KK[s]];
  const b=s.replace(/\s*облысы$/,"");
  if(REG_ALIAS[b])return RGN[REG_ALIAS[b]];
  if(RGN_KK[b+" облысы"])return RGN[RGN_KK[b+" облысы"]];
  const r=String(raw).trim();return[r,r,r];
}
function cityOf(raw){const r=String(raw||"").replace(/\s+/g," ").trim();if(!r)return{key:"",n:null};
  const key=CITY_ALIAS[lo(r)]||r;return{key:key,n:CITY[key]||[r,r,r]}}
function allowedOf(raw){
  const s=String(raw||"").trim();if(!s)return null;
  const parts=s.split(/\s*,\s*/).filter(Boolean).map(p=>{const l=lo(p);
    if(PHRASE[l])return PHRASE[l];
    const c=CITY[CITY_ALIAS[l]||p.trim()];if(c)return c;
    return regionOf(p)||[p,p,p]});
  return[0,1,2].map(i=>parts.map(x=>x[i]).join(", "));
}
function colsOf(head){
  const h=head.map(x=>lo(ctext(x))),f=re=>h.findIndex(x=>re.test(x));
  const c={name:f(/атау|название|name/),city:f(/^қала|город|city/),region:f(/облыс|область/),allowed:f(/қатыса|аймақ|регион/),
    date:f(/күн|дата|date/),chg:f(/өзгеріс|изменен/),status:f(/статус|status/),venue:[],catStart:f(/санат|категор/),catEnd:1e9};
  h.forEach((x,k)=>{if(/жер|место|venue/.test(x))c.venue.push(k)});
  if(c.catStart>=0)for(let k=c.catStart+1;k<h.length;k++)if(h[k]){c.catEnd=k;break}
  return c;
}
const stageOf=(tab,name)=>{const t=lo(tab);return/kick/.test(t)?"kick":/scrim/.test(t)?"scrim":/regional/.test(t)?"reg":/qualif/.test(t)?"qual":/off/.test(t)?"off":stg(name)};
const isDone=s=>/өтілді|өтті|өткізілді|прошл|проведен[оа]?(?![а-яё])|заверш|held|done/.test(lo(s.st)+" "+lo(s.chg));
const EVENTS=[];
Object.keys(SHEET.tabs||{}).forEach(tab=>{
  const rows=SHEET.tabs[tab];if(!rows||rows.length<2)return;
  const c=colsOf(rows[0]);if(c.name<0||c.date<0)return;
  let cur=null;
  rows.slice(1).forEach(r=>{
    const g=k=>k>=0&&k<r.length?r[k]:"";
    const name=ctext(g(c.name)),dRaw=ctext(g(c.date));
    const cats=[];if(c.catStart>=0)for(let k=c.catStart;k<r.length&&k<c.catEnd;k++){const t=ctext(r[k]);if(t&&!connUrl(curl(r[k])))cats.push(parseCat(t,curl(r[k])))}   /* ссылка на uSTEM Connect в ячейке категории – не категория */
    let v=null;for(const k of c.venue){const t=ctext(g(k));if(t){v={n:t,u:curl(g(k))};break}}
    const conn=r.map(x=>connUrl(curl(x))).find(Boolean)||"";   /* своя ссылка события в uSTEM Connect, если есть в строке */
    const ses={d:parseDate(dRaw),v:v,cats:cats,st:ctext(g(c.status)),chg:ctext(g(c.chg)),conn:conn};
    if(!name){if(cur&&(dRaw||v||cats.length)){if(!dRaw){const f=cur.sessions[0];ses.d=f.d;if(!ses.st)ses.st=f.st}cur.sessions.push(ses)}return}
    cur={tab:tab,name:name,city:cityOf(ctext(g(c.city))||(typeof CITY_DEFAULT!="undefined"&&CITY_DEFAULT[lo(name)])||""),region:c.region>=0?regionOf(ctext(g(c.region))):null,
      allowed:c.allowed>=0?allowedOf(ctext(g(c.allowed))):null,sessions:[ses]};
    EVENTS.push(cur);
  });
});
EVENTS.forEach(e=>{
  e.stage=stageOf(e.tab,e.name);
  if(!/[A-Za-z]/.test(e.name)){ /* в таблице вместо названия только город — название строится по образцу соседних строк */
    const w={reg:"Regional",scrim:"Scrimmage",qual:"Qualifier"}[e.stage],st=e.sessions[0].d.start;
    if(w&&e.city.n)e.name=`${e.city.n[2]} FIRST ${w}${st?" "+st.getFullYear():""}`;
  }
  /* страница в uSTEM Connect ищется у всех событий: кик-офф или другое событие, которое уже есть в Connect, тоже регистрируется только там
   * (Google Формы его категорий кнопками не становятся, чтобы не путать команды) */
  if(e.tab!=="F4A"){const m=connMatch(e.name),a=m||connAny(e.name);if(a)e.sessions.forEach(s=>{if(!s.conn){if(m)s.conn=m;else s.connClosed=a}})}   /* своя гиперссылка из таблицы важнее */
  e.viaConn=viaConnect(e)||e.sessions.some(s=>s.conn||s.connClosed);
  /* предстоящие: пока не прошла дата (пометка «Өтілді» в таблице раньше даты карточку не убирает); без даты – пока нет пометки «прошло» */
  e.vis=e.sessions.filter(s=>s.d.end?s.d.end>=TODAY:!isDone(s));
  e.codes=[...new Set(e.vis.reduce((a,s)=>a.concat(s.cats.map(x=>x.code)),[]))];
  const ds=e.vis.map(s=>s.d.start).filter(Boolean).sort((a,b)=>a-b);e.start=ds.length?ds[0]:null;
  const base=BASE[e.city.key]||e.city.key;e.cn=e.city.key?(CITY[base]||e.city.n):null;e.cc=e.cn?e.cn[1]:"";
  e.im=evim(e.name,e.city.key,e.codes);
});
/* только предстоящие события; прошедшие (по дате или со статусом «Өтілді») не показываются */
const UPC=EVENTS.filter(e=>e.vis.length).sort((a,b)=>(a.start?+a.start:9e15)-(b.start?+b.start:9e15));
/* Social Media Challenge – 4-й этап сезона (п. 5.2 и 5.7 регламента, приложение № 7): карточка из data.js (SMC) показывается до даты окончания,
 * пока в таблице нет собственной строки «Social Media Challenge» */
if(typeof SMC!="undefined"&&SMC.url&&!UPC.some(e=>/social media|\bsmc\b/i.test(e.name))){const d=parseDate(SMC.start+" – "+SMC.end);
  if(d.end&&d.end>=TODAY){const n=CITY.online||["Онлайн","Онлайн","Online"];UPC.unshift({tab:"SMC",name:SMC.name,city:{key:"online",n:n},region:null,allowed:null,stage:"smc",codes:["SMC"],start:d.start,cn:n,cc:n[1],im:SMC.img||"",
    vis:[{d:d,v:null,cats:[{code:"SMC",label:"SMC",url:SMC.url,closed:false}],st:"",chg:"",conn:connUrl(String(SMC.connect||""))||connMatch(SMC.name),connClosed:connAny(SMC.name)}]})}}
/* FIRST4ALL – карточка из data.js (F4A). Пока ссылки нет, вместо кнопки – пометка «регистрация скоро».
 * Ссылку вписать в F4A.url; если в таблице появится строка «FIRST4ALL», встроенная карточка скрывается, чтобы не было дубля. */
if(typeof F4A!="undefined"&&F4A.name&&!UPC.some(e=>/first\s*4\s*all/i.test(e.name))){
  const d=F4A.date?parseDate(F4A.date):{start:null,end:null,tba:true,txt:["","",""]};
  if(Array.isArray(F4A.dateTxt)&&F4A.dateTxt.length===3&&!d.tba){d.txt=F4A.dateTxt;d.own=1}   /* own – своя подпись даты («приём списков – до 25.12.2026»): в окне события показывается она */
  if(!d.end||d.end>=TODAY){const url=formUrl(String(F4A.url||""));
    UPC.unshift({tab:"F4A",name:F4A.name,city:{key:"",n:null},region:null,allowed:null,stage:"big",codes:["F4A"],start:d.start,cn:null,cc:"",noLoc:!!F4A.noLoc,im:F4A.img||GEN_IMG,
      vis:[{d:d,v:null,cats:[{code:"F4A",label:"FIRST4ALL",url:url,closed:false,soon:!url}],st:"",chg:""}]})}}

/* --- блоки --- */
const firstH=(word)=>L=="ru"?`${esc(word)} <span class="fi">FIRST</span>®`:`<span class="fi">FIRST</span>® ${esc(word)}`;
const fmt=n=>Math.round(n).toLocaleString(L=="en"?"en-US":"ru-RU");
const rulesUrl=()=>(L=="kk"?RULES.kk:RULES.ru)||RULES.kk;

/* статистика: цифры Казахстана растут с нуля, когда блок появляется на экране; цифры FIRST в мире стоят сразу */
function renderStats(){const i=I[L];
  const st=(pre,n,suf,lab,url)=>{const v=`${pre?esc(pre)+fmt(n):`<span class="num" data-n="${n}">${fmt(n)}</span>`}${suf}`;
    return `<div class="st"><b>${url?`<a class="law" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${v}</a>`:v}</b><span class="lb">${esc(lab)}</span></div>`};
  const law=KS.filter(k=>k[4]),nums=KS.filter(k=>!k[4]); /* документ (приказ № 514) – строкой с галочкой, а не цифрой: это не достижение */
  $("#stats").innerHTML=nums.map(k=>st(k[2],k[0],Array.isArray(k[1])?k[1][i]:k[1],k[3][i])).join("")+law.map(k=>`<p class="lawn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>${esc(k[3][i])} <a href="${esc(k[4][i])}" target="_blank" rel="noopener noreferrer">${esc(k[2])}${k[0]}</a></span></p>`).join(""); /* k[1] – суффикс (строка или по языкам), k[4] – ссылка на официальный документ (приказ № 514) */
  $("#stats").classList.toggle("three",nums.length>=2); /* три цифры – одной колонкой */
  $("#gstats").innerHTML=`<span class="wlab">${esc(tt("gh"))}</span><p class="wtx">${esc(tt("gline"))}</p>`; /* мировые цифры FIRST – одной строкой текста, без анимации */
  countUp();
}
function countUp(){
  const box=$("#stats");if(!box)return;
  const els=[...box.querySelectorAll(".num")];
  if(countUp.io)countUp.io.disconnect();
  /* уже показали один раз, reduced-motion или старый браузер — сразу итоговые цифры */
  if(box.dataset.done||RM||!("IntersectionObserver" in window))return;
  /* ширина числа фиксируется заранее, чтобы подпись рядом не сдвигалась во время счёта */
  els.forEach(e=>{const b=e.parentElement;b.style.minWidth=b.getBoundingClientRect().width+"px";e.textContent=fmt(0)});
  const run=()=>{box.dataset.done="1";const t0=performance.now(),D=1600;
    const step=now=>{const p=Math.min(1,(now-t0)/D),k=1-Math.pow(1-p,3);
      els.forEach(x=>{x.textContent=fmt(+x.dataset.n*k)});
      if(p<1)requestAnimationFrame(step);else els.forEach(x=>{x.parentElement.style.minWidth=""})};
    requestAnimationFrame(step)};
  const io=countUp.io=new IntersectionObserver(ens=>{if(ens.some(en=>en.isIntersecting)){io.disconnect();run()}},{threshold:.3});
  io.observe(box);
}
/* карта регионов в разделе «События» (assets/js/kzmap.js): регион события – по городу (CITY_UNIT), иначе по колонке «Облыс»;
 * в кружках все события сезона из таблицы, в том числе уже прошедшие. Онлайн-события без города и события за рубежом (CITY_ABROAD)
 * на карту не попадают – они в строке кнопок под картой (#gext) с ключами «x:online», «x:Ташкент»…; «Город + Онлайн» остаётся в своём регионе.
 * Выбранный регион или кнопка (GEO.sel) фильтрует список событий раздела (renderEvents). Кружки с числами – HTML поверх SVG, поэтому не мельчают на телефоне. */
const GEO={sel:""}; /* sel – выбранный регион: в сетке событий остаются только его события */
const RKEY=new Map(Object.keys(RGN).map(k=>[RGN[k],k]));
const CITY_KEY={ast:"Астана",alm:"Алматы",shm:"Шымкент"};
const isExt=k=>k.startsWith("x:");
const unitName=(k,i)=>(isExt(k)?CITY[k.slice(2)]:RGN[k]||CITY[CITY_KEY[k]]||["","",""])[i];
const unitOf=e=>{if(!e.city||!e.city.key)return"";if(e.city.key==="online")return"x:online";const ck=BASE[e.city.key]||e.city.key;
  if(typeof CITY_UNIT!="undefined"&&CITY_UNIT[ck])return CITY_UNIT[ck];if(typeof CITY_ABROAD!="undefined"&&CITY_ABROAD[ck]&&CITY[ck])return"x:"+ck;
  return(e.region&&RKEY.get(e.region))||""};
function renderGeo(){const i=I[L],box=$("#kzmap"),sec=$("#geo");if(!box||!sec)return;
  if(typeof KZMAP=="undefined"){sec.hidden=true;return}
  const cnt={},evs={};
  /* события таблицы и встроенные карточки (SMC, FIRST4ALL), которых в таблице нет */
  modeBase().forEach(e=>{const u=unitOf(e);if(!u)return;cnt[u]=(cnt[u]||0)+1;(evs[u]=evs[u]||[]).push(e)});   /* числа на карте – по выбранному режиму: предстоящие или прошедшие */
  const units=Object.keys(KZMAP.units),has=units.filter(k=>cnt[k]);
  if(!box.dataset.built){box.innerHTML=`<svg viewBox="0 0 ${KZMAP.w} ${KZMAP.h}" role="img">${units.map(k=>`<path class="rg" data-u="${k}" d="${KZMAP.units[k].d}" fill-rule="evenodd"/>`).join("")}</svg><div class="mks"></div>`;box.dataset.built="1"}
  box.querySelector("svg").setAttribute("aria-label",tt("a_map"));
  units.forEach(k=>{const p=box.querySelector(`.rg[data-u="${k}"]`),n=cnt[k]||0;p.classList.toggle("has",!!n);
    if(n){p.setAttribute("role","button");p.setAttribute("tabindex","0");p.setAttribute("aria-label",`${unitName(k,i)}: ${n} ${pl("geoEv",n)}`)}
    else{p.removeAttribute("role");p.removeAttribute("tabindex");p.setAttribute("aria-label",unitName(k,i))}});
  /* подпись у каждого региона; кружок с числом – только там, где есть события; у городов подпись справа от кружка */
  box.querySelector(".mks").innerHTML=units.map(k=>{const u=KZMAP.units[k],c=u.c,n=cnt[k]||0;
    return `<span class="mk${CITY_KEY[k]?" city":""}${n?"":" no"}" data-u="${k}" style="left:${(c[0]/KZMAP.w*100).toFixed(2)}%;top:${(c[1]/KZMAP.h*100).toFixed(2)}%">${n?`<b>${n}</b>`:""}<i>${esc(u.n?u.n[i]:"")}</i></span>`}).join("");
  /* онлайн и зарубежные события – кнопки под картой: сначала «Онлайн», затем города по алфавиту */
  const ext=Object.keys(cnt).filter(isExt).sort((a,b)=>(a==="x:online"?-1:b==="x:online"?1:unitName(a,i).localeCompare(unitName(b,i),L)));
  const gx=$("#gext");if(gx)gx.innerHTML=ext.length?`<span class="gxl">${esc(tt("geoExt"))}</span>`+ext.map(k=>`<button type="button" class="gch" data-u="${esc(k)}"><span>${esc(unitName(k,i))}</span><b>${cnt[k]}</b></button>`).join(""):"";
  /* телефон: вместо подписей на карте – список регионов (в конце – онлайн и зарубежные) */
  const opt=k=>`<option value="${esc(k)}">${esc(unitName(k,i))} · ${cnt[k]}</option>`;
  const sel=$("#gsel");if(sel){sel.innerHTML=`<option value="">${esc(tt("geoSel"))}</option>`+has.slice().sort((a,b)=>unitName(a,i).localeCompare(unitName(b,i),L)).map(opt).join("")+ext.map(opt).join("")}
  if(GEO.sel&&!cnt[GEO.sel])GEO.sel="";
  GEO.evs=evs;GEO.cnt=cnt;geoPanel();geoCap("");
}
/* подпись под картой: регион под курсором, число событий и города */
function geoCap(k){const i=I[L],c=$("#gcap");if(!c)return;if(!k){c.innerHTML="";return}
  const n=GEO.cnt[k]||0,cities=n&&!isExt(k)?[...new Set(GEO.evs[k].map(e=>e.cn?e.cn[i]:""))].filter(Boolean).join(", "):"";
  c.innerHTML=`<b>${esc(unitName(k,i))}</b> · ${n?`${n} ${esc(pl("geoEv",n))}${cities?` · ${esc(cities)}`:""}`:esc(tt("geoNone"))}`}
/* выбранный регион: подсветка на карте и в списке регионов (телефон) */
function geoPanel(){const k=GEO.sel;
  document.querySelectorAll("#kzmap .rg, #kzmap .mk, #gext .gch").forEach(e=>e.classList.toggle("on",e.dataset.u===k));
  const sel=$("#gsel");if(sel)sel.value=k||"";
}
/* этап события словами (Скримидж, Региональный этап…) – по ключам s_* в data.js */
const stageTxt=e=>{const k="s_"+e.stage;return T[L]&&T[L][k]?tt(k):""};
function renderWinners(){const i=I[L];
  $("#wins").innerHTML=W.map(w=>`<div class="wc"><div class="wim" data-bg="${esc(cu(w[13]||WI[w[3]]))}"></div><span class="yr">${w[3]}</span><div class="wt"><b>${esc(w[i])}</b><small>${esc(w[10]?w[10+i]:"FIRST® Global Challenge")}, ${esc(w[4+i])}</small></div></div>`).join("");
}
/* FIRST түлектері: карточкалар — assets/js/alumni.js; бос мәтін басқа тілден алынады (қаз → рус → eng) */
function renderAlumni(){const box=$("#alums");if(!box)return;
  const A=typeof ALUMNI!=="undefined"?ALUMNI:[];
  $("#alumni").hidden=!A.length;box.parentElement.classList.toggle("few",A.length<=3);
  $("#alh").innerHTML=esc(tt("alh")).replace("FIRST®",'<span class="fi">FIRST</span>®');
  const pick=a=>{a=a||[];return a[I[L]]||a[1]||a[0]||a[2]||""};
  const ig=/^https:\/\/(www\.)?instagram\.com\//;
  box.innerHTML=A.map(a=>{const n=pick(a.name),pa=pick(a.path),tx=pick(a.text),u=ig.test(a.url||"")?a.url:"";
    const ph=a.photo?`<div class="alim" data-bg="${esc(cu(a.photo))}" style="background-position:${esc(a.pos||"center")}"></div>`
      :`<div class="alim ph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6"/></svg></div>`;
    const body=`${ph}<div class="alb">${n?`<b>${esc(n)}</b>`:""}${pa?`<span class="alpa">${esc(pa)}</span>`:""}${tx||!(n||pa)?`<p>${esc(tx||tt("alsoon"))}</p>`:""}${u?`<span class="alig">${esc(tt("alig"))} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>`:""}</div>`;
    return u?`<a class="alc" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${body}</a>`:`<article class="alc">${body}</article>`}).join("");
}
function renderValues(){const i=I[L];
  $("#valh").innerHTML=firstH(tt("valh"));
  $("#vals").innerHTML=V.map((v,k)=>{const c=CV[k];
    return `<div class="vl"><div class="ic" style="--c:${c[1]}"><img src="assets/img/cv-${c[0]}.svg" alt="" width="64" height="48"></div><h4>${esc(v[i])}</h4></div>`}).join("");
}
/* цитата: первая фраза — синим */
function renderQuote(){const q=tt("quote"),m=q.match(/^(.*?[.!?])\s+([\s\S]*)$/);
  $("#quote").innerHTML=m?`<span class="ql">${esc(m[1])}</span> ${esc(m[2])}`:esc(q)}
/* программы: кратко — категория, возраст, состав, этапы; подробности — в правилах сезона */
function renderPrograms(){const i=I[L];
  $("#progh").innerHTML=firstH(tt("prog"));
  $("#progs").innerHTML=PROG.map((p,k)=>{
    const cat=Array.isArray(p.cat)?p.cat[i]:p.cat;
    const head=p.logo?`<img src="${esc(p.logo)}" alt="FIRST ${esc(p.name)}">`:`<span class="wm"><i>FIRST<sup>®</sup></i><b>${esc(p.wordmark[0])}</b><b>${esc(p.wordmark[1])}</b></span>`;
    const meta=[cat,p.ageTxt?p.ageTxt[i]:"",p.team[i]].filter(Boolean).join(" · ");
    return `<article class="card pc${p.wide?" wide":""}" id="program-${k}" style="--c:${esc(p.color)}">
      <div class="pi" data-bg="${esc(cu(p.photo))}" style="background-position:${esc(p.ppos||"center")}">${head}</div>
      <div class="cb">
        <span class="cat">${esc(p.age+" "+tt("yrs"))}</span>
        <p class="intro"><span class="pn"><span class="fi">FIRST</span>® ${esc(p.name)}</span>&nbsp;– ${esc(p.intro[i])}</p>
        <p class="meta">${esc(meta)}</p>
        ${p.teaser?`<div class="pl"><a class="lnk tz" href="${esc(p.teaser)}" target="_blank" rel="noopener noreferrer">${esc(tt("tz"))}</a></div>`:""}
      </div></article>`}).join("");
  /* телефон: показываем первые три программы, остальные – по кнопке */
  const pg=$("#progs");pg.classList.add("cut");
  const pm=$("#pmore");if(pm){pm.textContent=tt("allProg");pm.hidden=false}
  const rb=$("#rulesBtn");rb.href=rulesUrl();
  if(L!="kk"&&!RULES.ru)rb.querySelector("span").textContent=tt("docKk");
  else if(L=="en"&&RULES.ru)rb.querySelector("span").textContent=tt("docRu");
}
/* партнёры: бегущая строка — список повторён дважды, чтобы лента шла без разрыва (копия скрыта от экранных дикторов) */
function renderPartners(){
  const lg=(x,h)=>`<div class="lg"${h?' aria-hidden="true"':""}><img src="${LG[x[0]]}" alt="${h?"":esc((typeof PNAMES_L!="undefined"&&PNAMES_L[L]&&PNAMES_L[L][x[0]])||(typeof PNAMES!="undefined"&&PNAMES[x[0]])||tt("partner"))}" loading="lazy"></div>`;
  const mq=a=>`<div class="lgs">${a.map(x=>lg(x,0)).join("")}${a.map(x=>lg(x,1)).join("")}</div>`;
  $("#mr").innerHTML=mq(RP);
}

/* --- новости: главные результаты (data.js) + посты Telegram с хэштегом #сайт (assets/data/news.js) --- */
const ndate=s=>{const m=String(s||"").match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);return m?(m[3]?`${m[3]}.${m[2]}.${m[1]}`:`${m[2]}.${m[1]}`):""};
function newsList(){
  const nd=x=>String(x&&x.date||"");
  /* посты Telegram: не больше 8 последних (на главной всего 8 карточек) */
  const tg=(window.FK_TG_NEWS||[]).filter(x=>x&&x.title&&/^https:\/\//.test(x.url)).map(x=>({src:tt("tgsrc"),date:x.date||"",url:x.url,img:x.img||GEN_IMG,pos:"50% 50%",t:[x.title,x.title,x.title],p:[x.text||"",x.text||"",x.text||""]}))
    .sort((a,b)=>nd(b).localeCompare(nd(a))).slice(0,8);
  /* новости из вкладки «Новости» таблицы (assets/data/site.js): до 6 последних */
  const safeUrl=u=>/^https:\/\//.test(String(u||""))?String(u):"";
  const lg=(o,l)=>o?(o[l]||o.ru||""):"";
  const sh=(((window.FK_SITE||{}).news)||[]).filter(x=>x&&x.title&&(x.title.ru||x.title.kk||x.title.en)).map(x=>({src:tt("sheetsrc"),date:x.date||"",url:safeUrl(x.url),img:(x.img&&/^assets\//.test(x.img))?x.img:GEN_IMG,pos:"50% 50%",t:[lg(x.title,"ru"),lg(x.title,"kk"),lg(x.title,"en")],p:[lg(x.text,"ru"),lg(x.text,"kk"),lg(x.text,"en")]}))
    .sort((a,b)=>nd(b).localeCompare(nd(a))).slice(0,6);
  return[...sh,...tg,...N].sort((a,b)=>nd(b).localeCompare(nd(a))).slice(0,8);
}
function renderNews(){const i=I[L];
  $("#nws").innerHTML=newsList().map(x=>{const body=`<div class="im" data-bg="${esc(cu(x.img))}" style="background-position:${esc(x.pos||"50% 50%")}"></div><div class="cb"><small>${esc(x.src)}${x.date?" · "+ndate(x.date):""}</small><b>${esc(x.t[i])}</b><p>${esc(x.p[i])}</p>${x.url?`<span class="rd">${esc(tt("read"))}</span>`:""}</div>`;
    return x.url?`<a class="card" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${body}</a>`:`<div class="card">${body}</div>`}).join("");
}

/* --- события ---
 * Карточка (evCard) – фото города, на нём площадка, дата с днём недели, этап и город; подробности (категории, площадка, регионы, регистрация) –
 * в окне события (evModal) по нажатию на карточку. Над сеткой: «Алдағы / Өткен», поиск, сортировка, карта и фильтры-чипсы. */
const ICO={clk:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',pin:'<svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',bld:'<svg viewBox="0 0 24 24"><path d="M4 21V4.5A1.5 1.5 0 0 1 5.5 3h8A1.5 1.5 0 0 1 15 4.5V21M15 9h3.5A1.5 1.5 0 0 1 20 10.5V21M2 21h20M7.5 7h1.5M10.5 7H12M7.5 10.5h1.5M10.5 10.5H12M7.5 14h1.5M10.5 14H12M8.5 21v-4h2v4"/></svg>',cal:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  ext:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  chk:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  map:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10 21 3l-7 18-2.5-8.5z"/></svg>',
  dot:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 5.3 6.4 11.6 6.7 11.9a1.1 1.1 0 0 0 1.6 0c.3-.3 6.7-6.6 6.7-11.9A7.5 7.5 0 0 0 12 2zm0 10.3a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6z"/></svg>',
  none:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6M8.5 11h5"/></svg>'};
const vname=n=>{const v=typeof VENUE!="undefined"&&VENUE[lo(n)];return v?v[I[L]]:n};
const venueHtml=v=>v?(v.u?`<a href="${esc(v.u)}" target="_blank" rel="noopener noreferrer">${esc(vname(v.n))}</a>`:esc(vname(v.n))):esc(tt("vtba"));
/* «Актобе, Актюбинская область» → область не повторяется, если она названа по городу */
const sameStem=(city,region)=>{const a=String(city||"").toLowerCase().slice(0,4),b=String(region||"").toLowerCase().slice(0,4);return a.length>=4&&a===b};
function stamp(iso){const d=new Date(iso);if(isNaN(d))return"";try{return d.toLocaleDateString("ru-RU",{timeZone:"Asia/Almaty",day:"2-digit",month:"2-digit",year:"numeric"})}catch(e){return `${p2(d.getDate())}.${p2(d.getMonth()+1)}.${d.getFullYear()}`}}

/* дата словами: «21–22 қараша», «28 ноября – 2 декабря» (в окне события – с годом) и день недели «Сенбі – жексенбі» */
const WD={ru:["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"],kk:["жексенбі","дүйсенбі","сейсенбі","сәрсенбі","бейсенбі","жұма","сенбі"],en:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]};
const MG={ru:["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],kk:MN.kk,en:MN.en};
const cap1=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
const exact=d=>!!(d&&d.start&&d.txt&&/\d\.\d{2}\.\d{4}/.test(d.txt[0]));   /* точная дата, а не «Ақпан 2027» */
function dayTxt(d,yr){if(!d||d.tba)return tt("tba");if(!exact(d)||(yr&&d.own))return d.txt[I[L]];
  const a=d.start,b=d.end,m=x=>MG[L][x.getMonth()],y=x=>yr?" "+x.getFullYear():"";
  if(+a===+b)return `${a.getDate()} ${m(a)}${y(a)}`;
  if(a.getFullYear()===b.getFullYear())return a.getMonth()===b.getMonth()?`${a.getDate()}–${b.getDate()} ${m(b)}${y(b)}`:`${a.getDate()} ${m(a)} – ${b.getDate()} ${m(b)}${y(b)}`;
  return `${a.getDate()} ${m(a)}${y(a)} – ${b.getDate()} ${m(b)}${y(b)}`}
const wdTxt=d=>{if(!exact(d)||d.own||d.end-d.start>6*864e5)return"";const w=x=>WD[L][x.getDay()];return cap1(+d.start===+d.end?w(d.start):`${w(d.start)} – ${w(d.end)}`)};   /* у долгих событий (SMC: сентябрь – январь) день недели не пишется */

/* регистрация сессии: open – страница в uSTEM Connect, регистрация идёт (или открытая Google Форма у кик-оффа); closed – страница в Connect есть,
 * регистрация закрыта; wait – событие регистрируется в Connect, но его там ещё нет; forms – только закрытые формы; "" – ссылок нет */
const regKind=(e,s)=>{if(e.viaConn||viaConnect(e))return s.conn?"open":s.connClosed?"closed":"wait";
  return s.cats.some(c=>c.url&&!c.closed)?"open":s.cats.some(c=>c.url)?"forms":""};

/* все события раздела: предстоящие (UPC) и прошедшие (PAST). Для фильтров и сортировки у каждого считаются:
 * ses – показываемые сессии, t0/t1 – начало и конец, grp – этап для чипсов, prog – программы (FLL/FTC/FRC), score – «масштаб» (чемпионат > Qualifier > Regional…,
 * затем число дней и категорий), open – регистрация открыта, ph – фото города (assets/img/city, Wikimedia Commons; у города с двумя фото – по очереди) */
const PAST=EVENTS.filter(e=>!e.vis.length),ALL=UPC.concat(PAST);
const GW={champ:6,qual:5,reg:4,off:3,scrim:2,kick:2,other:1},PROGS=["FLL","FTC","FRC"],GRPS=["reg","qual","champ","scrim","kick","off","other"];
{const used={};ALL.forEach((e,k)=>{e.k=k;e.past=!e.vis.length;e.ses=e.past?e.sessions:e.vis;
  const st=e.ses.map(s=>s.d.start).filter(Boolean).map(Number),en=e.ses.map(s=>s.d.end).filter(Boolean).map(Number);
  e.t0=st.length?Math.min(...st):NaN;e.t1=en.length?Math.max(...en):e.t0;
  e.grp=(e.stage==="rep"||(e.stage==="big"&&/championship/i.test(e.name)))?"champ":/^(qual|reg|off|scrim|kick)$/.test(e.stage)?e.stage:"other";
  const codes=[...new Set([].concat(...e.ses.map(s=>s.cats.map(c=>c.code))))];
  e.prog=PROGS.filter(p=>codes.some(c=>p==="FLL"?/^(FLL|FE)/.test(c):c===p));
  const days=e.ses.reduce((n,s)=>n+(exact(s.d)?Math.min(5,Math.round((s.d.end-s.d.start)/864e5)+1):1),0);   /* «Ақпан 2027» – не 28 дней, а один */
  e.score=(e.stage==="rep"?7:GW[e.grp])*1000+days*30+codes.filter(c=>/^(FLL|FE|FTC|FRC)/.test(c)).length*10;   /* национальный чемпионат – выше зарубежных */
  e.open=!e.past&&e.ses.some(s=>regKind(e,s)==="open");
  const ck=e.city&&e.city.key&&e.city.key!=="online"?(BASE[e.city.key]||e.city.key):"",ph=ck&&typeof CITY_IMG!="undefined"&&CITY_IMG[ck];
  if(ph){const c=used[ck]=(used[ck]||0)+1,n=ph[(c-1)%ph.length];e.ph={s:`assets/img/city/${n}-640.webp`,l:`assets/img/city/${n}-1200.webp`,c:(typeof CITY_CRED!="undefined"&&CITY_CRED[n])||null}}
  else e.ph={s:e.im||GEN_IMG,l:e.im||GEN_IMG,c:null};
})}

/* карточка: сверху слева – площадка (или область), справа – дата и день недели; снизу – «регистрация открыта», название без года и город крупно */
const eyebrow=e=>e.cn?e.name.replace(/\s+20\d\d(?:[-–]\d{2,4})?$/,""):stageTxt(e);
const ttl=e=>e.cn?e.cn[I[L]]:e.name;
const tsz=t=>{const n=[...t].length;return n<=7?"":n<=10?" m":n<=13?" s":" xs"};   /* длинный город – мельче, чтобы влез в одну строку */
function evLoc(e){const i=I[L],s=e.ses[0]||{};if(e.city.key==="online")return"";
  if(s.v&&!/^(online|онлайн)$/i.test(s.v.n))return vname(s.v.n);
  return e.region&&!sameStem(e.cn?e.cn[i]:"",e.region[i])?e.region[i]:""}
function evCard(e,n){const d=(e.ses[0]||{}).d,loc=evLoc(e),t=ttl(e),wd=wdTxt(d),two=e.ph.s!==e.ph.l;
  return `<li class="evi${n!=null?" in":""}"${n!=null?` style="--n:${n}"`:""}><button type="button" class="evc${e.past?" past":""}" data-k="${e.k}" aria-haspopup="dialog">
<img class="evc-im" src="${esc(e.ph.s)}"${two?` srcset="${esc(e.ph.s)} 640w, ${esc(e.ph.l)} 1200w" sizes="(max-width:760px) 92vw, (max-width:1060px) 46vw, 400px"`:""} alt="" loading="lazy" decoding="async">
<span class="evc-top">${loc?`<span class="evc-loc">${ICO.dot}<span>${esc(loc)}</span></span>`:"<span></span>"}<span class="evc-when"><span class="evc-date">${esc(dayTxt(d))}</span>${wd?`<span class="evc-wd">${esc(wd)}</span>`:""}</span></span>
<span class="evc-bot">${e.open?`<span class="evc-open">${esc(tt("evOpen"))}</span>`:e.past?`<span class="evc-open done">${esc(tt("md_done"))}</span>`:""}<span class="evc-eb">${esc(eyebrow(e))}</span><span class="evc-t${tsz(t)}">${esc(t)}</span></span>
</button></li>`}

/* --- окно события --- */
const CATP={"FLL-D":0,"FLL-E":1,"FLL-C":2,FE:3,FTC:4,FRC:5};   /* код категории → программа в PROG (data.js): название, возраст, цвет */
function catRow(c){if(c.code==="SMC"||c.code==="F4A")return"";
  if(c.code==="SEM")return `<li><b>${esc(tt("sem"))}</b></li>`;
  const p=PROG[CATP[c.code]],info=p?[`FIRST ${p.name}`,p.age?`${p.age}\u00a0${tt("yrs")}`:""].filter(Boolean).join(" · "):"";
  const note=c.closed&&!c.url?tt("regclosed"):c.soon?tt("regsoon"):"";
  return `<li><b${p?` style="--c:${esc(p.color)}"`:""}>${esc(String(c.label||"").trim()||c.code)}</b>${info?`<span>${esc(info)}</span>`:""}${note?`<em>${esc(note)}</em>`:""}</li>`}
/* регистрация – как раньше в карточке: скримидж и официальный турнир (viaConnect), а также событие со страницей в Connect – одна кнопка uSTEM Connect
 * (открыта – оранжевая; страница есть, регистрация закрыта – белая пунктирная «Регистрация закрыта»; события в Connect нет – серая неактивная кнопка
 * и плашка «регистрация откроется в uSTEM Connect»); кик-офф без страницы в Connect – Google Формы из таблицы, по кнопке на категорию.
 * У турнира Connect без страницы из Google Форм остаётся только семинар для учителей, со страницей – ни одной; у SMC – ещё «Условия и задания» */
function regHtml(e,s){const cats=s.cats,conn=e.viaConn||viaConnect(e),page=!!(s.conn||s.connClosed);
  const btn=cats.filter(c=>c.url&&(!conn||(c.code==="SEM"&&!page)||c.code==="SMC"));
  const join=btn.filter(c=>!c.closed&&c.code!=="SEM"&&c.code!=="SMC");
  const bl=c=>c.closed?`${catLabel(c)} · ${tt("regclosed")}`:c.code==="SEM"?tt("joinSem"):c.code==="SMC"?tt("smcBtn"):btn.length>1?`${tt("join")} · ${catLabel(c)}`:tt("join");
  const fbs=btn.map(c=>`<a class="fb${c.closed?" off":!conn&&join.length===1&&join[0]===c?" pri":""}" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">${esc(bl(c))}${ICO.ext}</a>`).join("");
  const soon=cats.some(c=>c.soon)?`<p class="rn wait">${ICO.clk}<span>${esc(cap1(tt("regsoon")))}</span></p>`:"";   /* FIRST4ALL без ссылки – «регистрация скоро откроется» */
  if(!conn)return fbs||soon?`<div class="rb">${fbs}${soon}</div>`:"";
  const open=!!s.conn,url=s.conn||s.connClosed||"";
  return `<div class="rb">${open?`<a class="fb pri" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(tt("connBtn"))}${ICO.ext}</a>`
    :url?`<a class="fb off" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(tt("connClosed"))}${ICO.ext}</a>`
    :`<span class="fb dis" aria-disabled="true">${esc(tt("connBtn"))}${ICO.ext}</span>`}
    ${url?`<p class="rn">${esc(tt(open?"connNote":"connClosedNote"))}</p>`:`<p class="rn wait">${ICO.clk}<span>${esc(tt("connWait"))}</span></p>`}${fbs}</div>`}
function evModal(e){const i=I[L],multi=e.ses.length>1,online=e.city.key==="online";
  const city=e.cn?e.cn[i]+(e.region&&!sameStem(e.cn[i],e.region[i])?", "+e.region[i]:""):tt("ctba");
  const row=(ic,lb,v,sm)=>`<li><span class="ic">${ic}</span><div><span class="lb">${esc(lb)}</span><span class="v${sm?" sm":""}">${v}</span></div></li>`;
  const ses=s=>{const wd=wdTxt(s.d),cats=s.cats.map(catRow).join("");
    const place=online?esc(e.cn[i]):s.v?`${venueHtml(s.v)}<small>${esc(city)}</small>`:`${esc(city)}<small>${esc(tt("vtba"))}</small>`;
    return `<div class="evd-s"><ul class="evd-f">${row(ICO.cal,tt("md_date"),`${esc(dayTxt(s.d,1))}${wd?`<small>${esc(wd)}</small>`:""}`)}${e.noLoc?"":row(ICO.pin,tt("md_place"),place)}${e.allowed?row(ICO.bld,tt("regs"),esc(e.allowed[i]),1):""}</ul>
      ${s.chg?`<p class="evd-n"><b>${esc(tt("chg"))}:</b> ${esc(s.chg)}</p>`:""}${s.st&&!e.past?`<p class="evd-n"><b>${esc(tt("stt"))}:</b> ${esc(s.st)}</p>`:""}
      ${cats?`<h4 class="evd-h">${esc(tt("md_cats"))}</h4><ul class="evd-c">${cats}</ul>`:""}${multi&&!e.past?regHtml(e,s):""}</div>`};
  const reg=!multi&&!e.past?regHtml(e,e.ses[0]):"",c=e.ph.c;
  return `<div class="evd-sc"><div class="evd-hero"><img src="${esc(e.ph.l)}" alt="" decoding="async"><button type="button" class="evd-x" aria-label="${esc(tt("md_close"))}">${ICO.x}</button>
    <div class="evd-ht">${stageTxt(e)?`<span class="evd-stg">${esc(stageTxt(e))}</span>`:""}<h3 id="evdT">${esc(e.name)}</h3></div></div>
    <div class="evd-b">${e.ses.map(ses).join("")}
      ${e.past?`<p class="evd-done"><b>${esc(tt("md_done"))}</b><a href="https://t.me/firstroboticskz" target="_blank" rel="noopener">${esc(tt("md_res"))}</a></p>`:""}</div>
    ${reg?`<div class="evd-reg">${reg}</div>`:""}
    ${c&&/^https:\/\/commons\.wikimedia\.org\//.test(c.u)?`<p class="evd-cr">${esc(tt("md_photo"))}: <a href="${esc(c.u)}" target="_blank" rel="noopener noreferrer">${esc(c.a)}</a> · ${esc(c.l)}</p>`:""}</div>`}
let evFrom=null;
function openEv(k,from){const e=ALL[k],d=$("#evd");if(!e||!d)return;
  d.innerHTML=evModal(e);evFrom=from||null;
  if(typeof d.showModal==="function"){if(!d.open)d.showModal()}else d.setAttribute("open","");
  document.documentElement.classList.add("dlg");
  const x=d.querySelector(".evd-x");if(x)x.focus({preventScroll:true})}

/* --- поиск, фильтры, сортировка --- */
const EV={mode:"up",prog:"",grp:"",open:false,sort:"date",lim:0};
const STEP=()=>matchMedia("(max-width:760px)").matches?6:matchMedia("(max-width:1060px)").matches?8:9;   /* карточек за раз (полные ряды сетки); «Тағы көрсету» добавляет ещё столько же */
const modeBase=()=>EV.mode==="up"?UPC:PAST;
const qText=e=>[e.name,stageTxt(e),...(e.cn||[]),...(e.region||[]),...(e.allowed||[]),...e.prog,...[].concat(...e.ses.map(s=>s.cats.map(c=>c.code+" "+catLabel(c)))),...e.ses.map(s=>s.v?s.v.n+" "+vname(s.v.n):"")].join(" ").toLowerCase();
function evFilter(){const q=$("#fs").value.trim().toLowerCase();
  return modeBase().filter(e=>(!EV.prog||e.prog.includes(EV.prog))&&(!EV.grp||e.grp===EV.grp)&&(!EV.open||e.open)&&(!GEO.sel||unitOf(e)===GEO.sel)&&(!q||qText(e).includes(q)))}
/* «сначала ближайшие» у предстоящих – по дате начала, у прошедших – самые недавние сверху; «поздние» – наоборот; «крупные» – по score */
function evSort(l){const r=l.slice(),up=EV.mode==="up",a0=e=>isNaN(e.t0)?9e15:e.t0,b1=e=>isNaN(e.t1)?-9e15:e.t1;
  if(EV.sort==="big")r.sort((a,b)=>b.score-a.score||a0(a)-a0(b));
  else if(EV.sort==="az")r.sort((a,b)=>a.name.localeCompare(b.name,"en"));
  else r.sort(up===(EV.sort==="date")?(a,b)=>a0(a)-a0(b):(a,b)=>b1(b)-b1(a));
  return r}
const SORTS=["date","late","big","az"];
const soKey=s=>({date:EV.mode==="up"?"so_date":"so_dateP",late:EV.mode==="up"?"so_late":"so_lateP",big:"so_big",az:"so_az"})[s];
function renderSortMenu(){const m=$("#sortm");if(!m)return;
  m.innerHTML=SORTS.map(s=>`<button type="button" role="menuitemradio" aria-checked="${s===EV.sort}" data-s="${s}" tabindex="-1">${ICO.chk}<span>${esc(tt(soKey(s)))}</span></button>`).join("");
  $("#sortl").textContent=tt(soKey(EV.sort))}
const chip=(a,v,label,on,pre)=>`<button type="button" class="chip${on?" on":""}" data-a="${a}" data-v="${esc(v)}" aria-pressed="${on}">${pre||""}${esc(label)}</button>`;
function renderChips(){const base=modeBase(),none=!EV.prog&&!EV.grp&&!EV.open&&!GEO.sel,i=I[L];
  const ps=PROGS.filter(p=>base.some(e=>e.prog.includes(p))),gs=GRPS.filter(g=>base.some(e=>e.grp===g));
  let h=chip("all","",tt("evAll"),none);
  if(base.some(e=>e.open))h+=chip("open","",tt("evOpen"),EV.open);
  if(ps.length>1)h+='<span class="csep"></span>'+ps.map(p=>chip("prog",p,p,EV.prog===p)).join("");
  if(gs.length>1)h+='<span class="csep"></span>'+gs.map(g=>chip("grp",g,tt("g_"+g),EV.grp===g)).join("");
  if(GEO.sel)h+=`<span class="csep"></span><button type="button" class="chip on rgc" data-a="reg" aria-label="${esc(tt("evRegX"))}: ${esc(unitName(GEO.sel,i))}">${ICO.map}${esc(unitName(GEO.sel,i))}${ICO.x}</button>`;
  $("#chips").innerHTML=h}
/* how: "anim" – карточки появляются по очереди (смена фильтра, режима, сортировки), "more" – дописать следующую порцию, без – просто перерисовать (поиск) */
function renderEvents(how){const base=modeBase();
  document.querySelectorAll("#evseg button").forEach(b=>{const on=b.dataset.m===EV.mode;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);b.querySelector("b").textContent=(b.dataset.m==="up"?UPC:PAST).length});
  renderChips();renderSortMenu();
  const list=evSort(evFilter());if(!EV.lim)EV.lim=STEP();
  const ul=$("#evs .evg");
  if(how==="more"&&ul){const from=ul.children.length;ul.insertAdjacentHTML("beforeend",list.slice(from,EV.lim).map((e,n)=>evCard(e,n)).join(""))}
  else $("#evs").innerHTML=list.length?`<ul class="evg">${list.slice(0,EV.lim).map((e,n)=>evCard(e,how==="anim"?n:null)).join("")}</ul>`
    :`<div class="evempty">${ICO.none}<p>${esc(tt(base.length?"evNone":"noneAll"))}</p>${base.length?`<button type="button" class="evreset">${esc(tt("evReset"))}</button>`:""}</div>`;
  const mb=$("#evmore"),rest=list.length-EV.lim;mb.hidden=rest<=0;mb.innerHTML=`${esc(tt("evMore"))} <b>${Math.max(rest,0)}</b>`;
  $("#evcount").textContent=`${list.length} ${pl("geoEv",list.length)}`;
  /* «Обновлено» = дата, когда данные таблицы (или статус формы регистрации) действительно изменились, а не время последней проверки */
  const up=SHEET.updated,s=up?stamp(up):"";
  $("#evsrc").textContent=s?`${tt("evupd")} ${s}`:"";
}
/* --- вкладка «Сайт» таблицы (assets/data/site.js): сезон, тема, ссылки, названия тем программ --- */
const okUrl=u=>/^https:\/\/[^\s"'<>]+$/.test(String(u||""));
function applySite(){const S=(window.FK_SITE||{}).season;if(!S)return;
  if(S.rules){if(okUrl(S.rules.ru))RULES.ru=S.rules.ru;if(okUrl(S.rules.kk))RULES.kk=S.rules.kk}
  if(S.sub){const m={fll:["FLL-D","FLL-E","FLL-C"],ftc:["FTC"],frc:["FRC"]};Object.keys(m).forEach(k=>{const v=String(S.sub[k]||"").trim().slice(0,40);if(!v)return;
    PROG.forEach(p=>{const c=Array.isArray(p.cat)?p.cat[0]:p.cat;if(m[k].some(x=>c.startsWith(x+" ")))p.cat=c.split(" · ")[0]+" · "+v})})}
  if(S.name){const b=$(".bk");if(b)b.innerHTML=esc(String(S.name).slice(0,60)).replace(/^FIRST®?\s*/i,'<span class="fi">FIRST</span>® ').replace(/(\d{4}[–-]\d{4})$/,'<span class="nb">$1</span>')}
  if(S.theme)["ru","kk","en"].forEach(l=>{if(S.theme[l])T[l].bTheme=String(S.theme[l]).slice(0,300)});
  if(okUrl(S.video)&&/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(S.video)){const a=$('[data-t="bVideo"]');if(a)a.href=S.video}
  if(S.logo&&/^assets\/img\/[\w.-]+$/.test(S.logo)){const im=$(".sl img");if(im)im.src=S.logo}
  if(okUrl(S.letter)){const a=$("#letterLink");if(a)a.href=S.letter}
  if(okUrl(S.schedule)){const a=$("#schedLink");if(a)a.href=S.schedule}
  const ev=((window.FK_SITE||{}).stats||{}).events;if(ev>=10&&KS[3]&&Math.floor(ev/10)*10>KS[3][0])KS[3][0]=Math.floor(ev/10)*10; /* число мероприятий из расписания: если в таблице больше, цифра «80+» растёт сама (с округлением до десятков) */
}
applySite();
/* --- язык --- */
function render(){
  document.documentElement.lang=L=="kk"?"kk":L;
  document.querySelectorAll("[data-t]").forEach(e=>{e.textContent=tt(e.dataset.t)});
  document.querySelectorAll("[data-ta]").forEach(e=>e.setAttribute("aria-label",tt(e.dataset.ta)));
  document.querySelectorAll("[data-talt]").forEach(e=>{e.alt=tt(e.dataset.talt)});
  const md=document.querySelector("meta[name=description]");if(md&&tt("metaDesc"))md.content=tt("metaDesc");
  $("#lang").value=L;
  document.querySelectorAll(".lm button").forEach(b=>b.classList.toggle("on",b.dataset.l===L));
  renderStats();renderGeo();renderWinners();renderAlumni();renderValues();renderQuote();renderPrograms();renderNews();renderPartners();
  $("#fs").placeholder=tt("fs");renderEvents();
  const d=$("#evd");if(d&&d.open&&EV.cur!=null)d.innerHTML=evModal(ALL[EV.cur]);
}
/* выбранный язык держится только в пределах визита (главная ↔ новости); каждый новый заход — на казахском */
function setLang(l){if(!T[l])return;L=l;try{sessionStorage.setItem("fk-lang",l)}catch(e){}render()}

/* --- «FIRST» всегда курсивом (фирменное написание FIRST®) ---
 * После каждой отрисовки слово FIRST в любом тексте оборачивается в <span class="fir">. Слитные названия (FIRST4ALL) и уже
 * оформленные вручную фрагменты (.fi) не трогаются; <option> тоже – внутри него разметка не отображается. В flex/grid-контейнерах
 * (например, ссылки в подвале с gap) обёртка получает display:contents, чтобы между FIRST и соседним словом не появлялся зазор. */
const FW=/\b(FIRST)\b/;
function italicFirst(root){
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>FW.test(n.nodeValue)&&n.parentElement&&!n.parentElement.closest("script,style,option,.fi,.fir")?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
  const list=[];for(let n;(n=w.nextNode());)list.push(n);
  list.forEach(t=>{const f=document.createDocumentFragment(),fx=/flex|grid/.test(getComputedStyle(t.parentElement).display);
    t.nodeValue.split(FW).forEach((s,i)=>{if(!s)return;if(i%2){const e=document.createElement("span");e.className="fir";e.textContent=s;if(fx)e.style.display="contents";f.appendChild(e)}else f.appendChild(document.createTextNode(s))});
    t.parentNode.replaceChild(f,t)});
}
/* --- фото в каруселях и карточках грузятся, когда до блока остаётся ~1 экран: первый экран открывается быстрее,
 * телефон не тянет сразу 2 МБ картинок. Блок, который уже был на экране, после смены языка показывает фото сразу. --- */
const LZ=new Set();let lzio=null;
function bgNow(box){box.querySelectorAll("[data-bg]").forEach(e=>{e.style.backgroundImage=e.dataset.bg;e.removeAttribute("data-bg")})}
function lazyBg(){document.querySelectorAll("#wins,#alums,#progs,#nws").forEach(box=>{
  if(LZ.has(box)||!("IntersectionObserver" in window)){bgNow(box);return}
  if(!lzio)lzio=new IntersectionObserver(ens=>ens.forEach(en=>{if(en.isIntersecting){LZ.add(en.target);lzio.unobserve(en.target);bgNow(en.target)}}),{rootMargin:"900px 0px"});
  lzio.observe(box)})}
const fwo=new MutationObserver(()=>{italicFirst(document.body);lazyBg();fwo.takeRecords()});
fwo.observe(document.body,{childList:true,subtree:true,characterData:true});
italicFirst(document.body);
/* --- старт --- */
let start="kk";
try{localStorage.removeItem("fk-lang")}catch(e){}
try{const u=new URLSearchParams(location.search).get("lang");const s=sessionStorage.getItem("fk-lang");start=(u&&T[u])?u:(s&&T[s])?s:"kk";if(u&&T[u])sessionStorage.setItem("fk-lang",u)}catch(e){}
L=start;render();

$("#lang").addEventListener("change",e=>setLang(e.target.value));
/* карта в разделе событий (по кнопке «Карта»): наведение – подсказка, клик/Enter или список на телефоне – выбор региона,
 * в сетке остаются только его события; повторный клик или крестик на чипсе региона снимает выбор */
const setReg=k=>{GEO.sel=k;EV.lim=0;geoPanel();renderEvents("anim");
  /* если сетка оказалась ниже экрана (телефон), страница подъезжает к её началу, а карта остаётся видна */
  const r=$("#evs").getBoundingClientRect();if(k&&r.top>innerHeight*.75)scrollBy({top:Math.round(r.top-innerHeight*.4),behavior:RM?"auto":"smooth"})};
{const m=$("#kzmap");if(m){
  /* клик по контуру региона или по его кружку с подписью (кружки городов стоят поверх области) */
  const u=e=>{const p=e.target.closest(".rg.has, .mk:not(.no)");return p?p.dataset.u:""},any=e=>{const p=e.target.closest(".rg, .mk");return p?p.dataset.u:""};
  m.addEventListener("mouseover",e=>geoCap(any(e)));m.addEventListener("mouseout",()=>geoCap(""));
  m.addEventListener("focusin",e=>geoCap(u(e)));m.addEventListener("focusout",()=>geoCap(""));
  const pick=e=>{const k=u(e);if(!k)return;setReg(GEO.sel===k?"":k)};
  m.addEventListener("click",pick);
  m.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){if(u(e)){e.preventDefault();pick(e)}}});
  const gsel=$("#gsel");if(gsel)gsel.addEventListener("change",e=>setReg(e.target.value));
  /* кнопки «Онлайн», «Ташкент»… под картой работают как регионы: наведение – подсказка, клик – выбор или снятие выбора */
  const gx=$("#gext");if(gx){const ch=e=>{const b=e.target.closest(".gch");return b?b.dataset.u:""};
    gx.addEventListener("mouseover",e=>geoCap(ch(e)));gx.addEventListener("mouseout",()=>geoCap(""));
    gx.addEventListener("focusin",e=>geoCap(ch(e)));gx.addEventListener("focusout",()=>geoCap(""));
    gx.addEventListener("click",e=>{const k=ch(e);if(k)setReg(GEO.sel===k?"":k)})}
}}
/* панель событий: «Алдағы / Өткен», сортировка (меню), карта */
{const sb=$("#sortb"),sm=$("#sortm"),items=()=>[...sm.querySelectorAll("button")];
  const menu=open=>{sm.hidden=!open;sb.setAttribute("aria-expanded",open);if(open){const c=sm.querySelector('[aria-checked="true"]')||items()[0];if(c)c.focus()}};
  sb.addEventListener("click",()=>menu(sm.hidden));
  sm.addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(!b)return;EV.sort=b.dataset.s;EV.lim=0;menu(false);sb.focus();renderEvents("anim")});
  sm.addEventListener("keydown",e=>{const l=items(),i=l.indexOf(document.activeElement);
    if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();l[(i+(e.key==="ArrowDown"?1:l.length-1))%l.length].focus()}
    else if(e.key==="Escape"||e.key==="Tab"){if(e.key==="Escape"){e.preventDefault();sb.focus()}menu(false)}});
  document.addEventListener("click",e=>{if(!sm.hidden&&!e.target.closest(".sortw"))menu(false)});
  $("#evseg").addEventListener("click",e=>{const b=e.target.closest("[data-m]");if(!b||b.dataset.m===EV.mode)return;EV.mode=b.dataset.m;EV.lim=0;
    const base=modeBase();if(EV.grp&&!base.some(x=>x.grp===EV.grp))EV.grp="";if(EV.prog&&!base.some(x=>x.prog.includes(EV.prog)))EV.prog="";if(EV.mode==="past")EV.open=false;
    renderGeo();renderEvents("anim")});
  const mb=$("#mapb"),geo=$("#geo");mb.addEventListener("click",()=>{const o=geo.hidden;geo.hidden=!o;mb.setAttribute("aria-expanded",o)});
}
/* фильтры-чипсы: «Барлығы» сбрасывает всё, программа и этап – по одному, «Тіркеу ашық» – отдельный переключатель, чипса региона снимает выбор на карте */
$("#chips").addEventListener("click",e=>{const b=e.target.closest(".chip");if(!b)return;const a=b.dataset.a,v=b.dataset.v;
  if(a==="all"){EV.prog=EV.grp="";EV.open=false;GEO.sel="";geoPanel()}
  else if(a==="open")EV.open=!EV.open;else if(a==="prog")EV.prog=EV.prog===v?"":v;else if(a==="grp")EV.grp=EV.grp===v?"":v;else if(a==="reg"){GEO.sel="";geoPanel()}
  EV.lim=0;renderEvents("anim")});
$("#evs").addEventListener("click",e=>{const c=e.target.closest(".evc");if(c){EV.cur=+c.dataset.k;openEv(EV.cur,c);return}
  if(e.target.closest(".evreset")){EV.prog=EV.grp="";EV.open=false;GEO.sel="";$("#fs").value="";geoPanel();EV.lim=0;renderEvents("anim")}});
$("#evmore").addEventListener("click",()=>{EV.lim+=STEP();renderEvents("more")});
$("#fs").addEventListener("input",()=>{EV.lim=0;renderEvents()});
/* окно события: крестик, нажатие на затемнение вокруг, Escape; фокус возвращается на карточку */
{const d=$("#evd");if(d){
  d.addEventListener("click",e=>{if(e.target===d||e.target.closest(".evd-x"))d.close()});
  d.addEventListener("close",()=>{document.documentElement.classList.remove("dlg");EV.cur=null;if(evFrom&&document.contains(evFrom))evFrom.focus({preventScroll:true})});
}}
document.querySelectorAll(".lm button").forEach(b=>b.addEventListener("click",()=>{setLang(b.dataset.l);document.body.classList.remove("open");burger.setAttribute("aria-expanded",false)}));
$("#pmore").addEventListener("click",function(){$("#progs").classList.remove("cut");this.hidden=true});
document.querySelectorAll("[data-sc]").forEach(b=>b.addEventListener("click",()=>{const r=$(b.dataset.sc),f=r.firstElementChild;if(f)r.scrollBy({left:(+b.dataset.d)*(f.offsetWidth+22),behavior:"smooth"})}));
/* карусель новостей: стрелка «назад» появляется после прокрутки вправо */
{const r=$("#nws");if(r){const u=()=>r.parentElement.classList.toggle("sc",r.scrollLeft>8);r.addEventListener("scroll",u,{passive:true});u()}}
const burger=$("#burger");
burger.addEventListener("click",()=>{const o=document.body.classList.toggle("open");burger.setAttribute("aria-expanded",o)});
document.querySelectorAll("#nav a").forEach(a=>a.addEventListener("click",()=>{document.body.classList.remove("open");burger.setAttribute("aria-expanded",false)}));
/* меню закрывается по тапу вне него и по Escape */
const closeNav=()=>{document.body.classList.remove("open");burger.setAttribute("aria-expanded",false)};
document.addEventListener("click",e=>{if(document.body.classList.contains("open")&&!e.target.closest("#nav,#burger"))closeNav()});
addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("open")){closeNav();burger.focus()}});
/* подсветка текущего раздела в меню */
const links=[...document.querySelectorAll("#nav a")].filter(a=>/^#./.test(a.getAttribute("href")));
const spy=()=>{let cur="";links.forEach(a=>{const el=document.querySelector(a.getAttribute("href"));if(el&&el.getBoundingClientRect().top<innerHeight*.35)cur=a.getAttribute("href")});links.forEach(a=>a.classList.toggle("on",a.getAttribute("href")==cur))};
addEventListener("scroll",spy,{passive:true});spy();
/* переход по меню или кнопке к разделу прокручивает страницу, но не оставляет «#раздел» в адресе,
   поэтому перезагрузка не возвращает к разделу (сама перезагрузка – assets/js/top.js) */
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute("href").slice(1),el=id&&document.getElementById(id);if(!el)return;e.preventDefault();el.scrollIntoView({behavior:RM?"auto":"smooth",block:"start"})});
})();
