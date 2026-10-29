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
  if(Array.isArray(F4A.dateTxt)&&F4A.dateTxt.length===3&&!d.tba)d.txt=F4A.dateTxt;
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
  $("#stats").innerHTML=KS.map(k=>st(k[2],k[0],Array.isArray(k[1])?k[1][i]:k[1],k[3][i],k[4]&&k[4][i])).join(""); /* k[1] – суффикс (строка или по языкам), k[4] – ссылка на официальный документ (приказ № 514) */
  $("#stats").classList.toggle("three",KS.length===3); /* три цифры – одной колонкой */
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
const GEO={sel:"",open:false}; /* sel – выбранный регион, open – список событий раскрыт (по клику на регион или «Показать все события») */
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
  EVENTS.concat(UPC.filter(e=>!EVENTS.includes(e))).forEach(e=>{const u=unitOf(e);if(!u)return;cnt[u]=(cnt[u]||0)+1;(evs[u]=evs[u]||[]).push(e)});
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
/* выбранный регион: подсветка на карте, список на телефоне, строка над картой и видимость списка событий.
 * Пока регион не выбран, список скрыт – на странице только карта с подсказкой, ссылка «Показать все события» и последние прошедшие события */
function geoPanel(){const i=I[L],k=GEO.sel,pk=$("#gpick"),open=GEO.open||!!k;
  document.querySelectorAll("#kzmap .rg, #kzmap .mk, #gext .gch").forEach(e=>e.classList.toggle("on",e.dataset.u===k));
  const sel=$("#gsel");if(sel)sel.value=k||"";
  ["#evs","#evsrc"].forEach(s=>{const e=$(s);if(e)e.hidden=!open});
  const f=$("#events .flt");if(f)f.hidden=!open||!!k; /* строка поиска – только в полном списке */
  if(!pk)return;
  const btn=(act,key)=>`<button type="button" class="gcl" data-act="${act}">${esc(tt(key))}</button>`;
  if(k&&GEO.cnt&&GEO.cnt[k]){const n=GEO.cnt[k];pk.innerHTML=`<b>${esc(unitName(k,i))}</b><span>${n} ${esc(pl("geoEv",n))}</span>${btn("all","geoAllE")}`}
  else if(open)pk.innerHTML=`<b>${esc(tt("geoAllE"))}</b>${btn("close","geoHide")}`;
  else pk.innerHTML=btn("all","geoShow");
}
/* этап события словами (Скримидж, Региональный этап…) – по ключам s_* в data.js */
const stageTxt=e=>{const k="s_"+e.stage;return T[L]&&T[L][k]?tt(k):""};
/* последние прошедшие события – короткой строкой под картой и списком (#past): название, этап, город, дата.
 * Выбран регион – его прошедшие события, иначе по всей стране; не больше трёх, самые свежие сверху */
function pastHtml(){const i=I[L],k=GEO.sel;
  const end=e=>Math.max(0,...e.sessions.map(s=>s.d.end?+s.d.end:0));
  const past=EVENTS.filter(e=>!e.vis.length&&(!k||unitOf(e)===k)).sort((a,b)=>end(b)-end(a)).slice(0,3);
  if(!past.length)return"";
  const dts=e=>[...new Set(e.sessions.map(s=>dTxt(s.d,i)))].join(", ");
  return `<h5>${esc(tt("geoPast"))}</h5><ul>${past.map(e=>`<li><b>${esc(e.name)}</b><span>${esc([stageTxt(e),e.cn?e.cn[i]:"",dts(e)].filter(Boolean).join(" · "))}</span></li>`).join("")}</ul>`}
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
    return `<div class="vl"><div class="ic" style="--c:${c[1]}"><img src="assets/img/cv-${c[0]}.svg" alt="" width="64" height="48"></div><div><h4>${esc(v[i])}</h4><p>${esc(v[3+i])}</p></div></div>`}).join("");
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

/* --- события --- */
const ICO={clk:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',pin:'<svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',bld:'<svg viewBox="0 0 24 24"><path d="M4 21V4.5A1.5 1.5 0 0 1 5.5 3h8A1.5 1.5 0 0 1 15 4.5V21M15 9h3.5A1.5 1.5 0 0 1 20 10.5V21M2 21h20M7.5 7h1.5M10.5 7H12M7.5 10.5h1.5M10.5 10.5H12M7.5 14h1.5M10.5 14H12M8.5 21v-4h2v4"/></svg>',cal:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  ext:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>'};
const vname=n=>{const v=typeof VENUE!="undefined"&&VENUE[lo(n)];return v?v[I[L]]:n};
const venueHtml=v=>v?(v.u?`<a href="${esc(v.u)}" target="_blank" rel="noopener noreferrer">${esc(vname(v.n))}</a>`:esc(vname(v.n))):esc(tt("vtba"));
function evCard(e){const i=I[L],online=e.city.key==="online";
  const vis=e.vis,multi=vis.length>1;
  /* порядок строк: город → площадка → дата → категории → регистрация.
   * Регистрация: скримидж и официальный турнир (viaConnect), а также любое событие со страницей в Connect (e.viaConn), – одна кнопка uSTEM Connect;
   * кик-офф, которого в Connect нет, – Google Формы из таблицы, по кнопке на категорию. У события uSTEM Connect:
   * у турнира есть страница в Connect (s.conn: найдена по названию или ссылка из таблицы) – регистрация открыта: синяя кнопка ведёт на неё;
   * страница есть, но регистрация закрыта (s.connClosed) – белая пунктирная кнопка «Регистрация закрыта · страница события», ведёт на неё;
   * турнира в Connect нет совсем – серая неактивная кнопка и плашка «регистрация откроется в uSTEM Connect». Google Формы категорий из строк таких
   * турниров кнопками не становятся. У турнира со страницей в Connect не показывается ни одна Google Форма (семинар для учителей
   * тоже регистрируется через Connect) – чтобы люди не путались, через что записываться; пока страницы нет, из форм остаётся только
   * семинар для учителей */
  const ses=s=>{
    const cats=s.cats,conn=e.viaConn||viaConnect(e);
    const page=!!(s.conn||s.connClosed);   /* у события есть своя страница в Connect */
    const btn=cats.filter(c=>c.url&&(!conn||(c.code==="SEM"&&!page)||c.code==="SMC"));   /* у турниров Connect без страницы из Google Форм остаётся семинар; со страницей – ни одной; у SMC – «Условия и задания» */
    const showV=!(online&&(!s.v||/^(online|онлайн)$/i.test(s.v.n)))&&!!(s.v||e.cn);   /* место проведения из таблицы – у всех событий, и у турниров uSTEM Connect тоже */
    const one=cats.length===1&&btn.length===1;
    const bl=c=>c.closed?`${catLabel(c)} · ${tt("regclosed")}`:c.code==="SEM"?tt("joinSem"):c.code==="SMC"?tt("smcBtn"):btn.length>1?`${tt("join")} · ${catLabel(c)}`:tt("join");
    const fbs=btn.length?`<div class="fbs">${btn.map(c=>`<a class="fb${c.code==="SEM"?" sem":""}${c.closed?" off":""}" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer" title="${esc(catLabel(c))}">${esc(bl(c))}</a>`).join("")}</div>`:"";
    let reg=fbs;
    if(conn){const open=!!s.conn,url=s.conn||s.connClosed||"";
      reg=`<div class="rb${open?" open":url?" closed":""}"><div class="fbs">${open?`<a class="fb cn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(tt("connBtn"))}${ICO.ext}</a>`
          :url?`<a class="fb cn off" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(tt("connClosed"))}${ICO.ext}</a>`
          :`<span class="fb cn dis" aria-disabled="true">${esc(tt("connBtn"))}${ICO.ext}</span>`}</div>
        ${open?`<p class="rn">${esc(tt("connNote"))}</p>`:url?"":`<p class="rn wait">${ICO.clk}<span>${esc(tt("connWait"))}</span></p>`}${fbs}</div>`}
    else if(btn.length&&e.stage==="scrim")reg=`<div class="rb form"><span class="rs">${esc(tt("rsForm"))}</span>${fbs}</div>`;
    return `<div class="${multi?"ses":"one"}">
      ${showV?`<p>${ICO.pin}<span>${venueHtml(s.v)}</span></p>`:""}
      <p class="dt">${ICO.cal}<span>${esc(dTxt(s.d,i))}</span></p>
      ${s.chg?`<p class="chg"><b>${esc(tt("chg"))}:</b> ${esc(s.chg)}</p>`:""}
      ${s.st?`<p class="chg"><b>${esc(tt("stt"))}:</b> ${esc(s.st)}</p>`:""}
      ${cats.length&&!(one&&cats[0].code==="SEM")?`<div class="tg">${cats.map(c=>`<span${c.closed&&!c.url?' class="closed"':""}>${esc(catLabel(c))}${c.closed&&!c.url?` · ${esc(tt("regclosed"))}`:c.soon?` · ${esc(tt("regsoon"))}`:""}</span>`).join("")}</div>`:""}
      ${reg}
    </div>`};
  return `<div class="cell"><div class="ec"><div>
    <h4>${esc(e.name)}</h4>
    ${stageTxt(e)?`<span class="stg">${esc(stageTxt(e))}</span>`:""}
    ${e.noLoc?"":`<p>${ICO.bld}<span>${esc(e.cn?e.cn[i]:tt("ctba"))}${e.region&&!sameStem(e.cn?e.cn[i]:"",e.region[i])?`, ${esc(e.region[i])}`:""}</span></p>`}
    ${e.allowed?`<p class="rgl">${ICO.pin}<span title="${esc(e.allowed[i])}"><b>${esc(tt("regs"))}:</b> ${esc(e.allowed[i])}</span></p>`:""}
    ${vis.map(ses).join("")}
  </div><div class="eim" data-bg="${esc(cu(e.im))}"></div></div></div>`;
}
/* «Актобе, Актюбинская область» → область не повторяется, если она названа по городу */
const sameStem=(city,region)=>{const a=String(city||"").toLowerCase().slice(0,4),b=String(region||"").toLowerCase().slice(0,4);return a.length>=4&&a===b};
function stamp(iso){const d=new Date(iso);if(isNaN(d))return"";try{return d.toLocaleDateString("ru-RU",{timeZone:"Asia/Almaty",day:"2-digit",month:"2-digit",year:"numeric"})}catch(e){return `${p2(d.getDate())}.${p2(d.getMonth()+1)}.${d.getFullYear()}`}}
function renderEvents(){
  const q=$("#fs").value.trim().toLowerCase();
  const ok=e=>(!GEO.sel||unitOf(e)===GEO.sel)&&
    (!q||[e.name,...(e.cn||[]),...(e.region||[]),...(e.allowed||[]),...(e.codes||[]),...[].concat(...e.vis.map(s=>s.cats.map(catLabel))),...e.vis.map(s=>s.v?s.v.n+" "+vname(s.v.n):"")].join(" ").toLowerCase().includes(q));
  const u=UPC.filter(ok);
  /* все события в одной прокручиваемой сетке; стрелка внизу листает её */
  const more=`<div class="morew"><button class="more" type="button" aria-label="${esc(tt("more"))}" title="${esc(tt("more"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l6 6 6-6M6 13l6 6 6-6"/></svg></button></div>`;
  $("#evs").innerHTML=u.length?`<div class="eg">${u.map(e=>evCard(e)).join("")}</div>${more}`:`<p class="empty">${esc(tt(UPC.length?"none":"noneAll"))}</p>`;
  $("#past").innerHTML=pastHtml();
  const eg=$("#evs .eg"),mw=$("#evs .morew");
  if(eg){const upd=()=>mw.classList.toggle("end",eg.scrollHeight-eg.clientHeight-eg.scrollTop<8);eg.addEventListener("scroll",upd,{passive:true});upd();setTimeout(upd,400)}
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
  const ev=((window.FK_SITE||{}).stats||{}).events;if(ev>=10&&KS[2]&&Math.floor(ev/10)*10>KS[2][0])KS[2][0]=Math.floor(ev/10)*10;
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
function lazyBg(){document.querySelectorAll("#wins,#alums,#progs,#nws,#evs,#past").forEach(box=>{
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
/* карта в разделе событий: наведение – подсказка, клик/Enter или список на телефоне – выбор региона, список событий фильтруется;
 * «Все события» снимает выбор региона, «Скрыть список» прячет список */
{const m=$("#kzmap");if(m){
  /* клик по контуру региона или по его кружку с подписью (кружки городов стоят поверх области) */
  const u=e=>{const p=e.target.closest(".rg.has, .mk:not(.no)");return p?p.dataset.u:""},any=e=>{const p=e.target.closest(".rg, .mk");return p?p.dataset.u:""};
  m.addEventListener("mouseover",e=>geoCap(any(e)));m.addEventListener("mouseout",()=>geoCap(""));
  m.addEventListener("focusin",e=>geoCap(u(e)));m.addEventListener("focusout",()=>geoCap(""));
  const setReg=k=>{GEO.sel=k;GEO.open=true;geoPanel();renderEvents();
    /* если список оказался ниже экрана (телефон), страница подъезжает так, чтобы его начало было в середине экрана, а карта осталась видна */
    const r=$("#evs").getBoundingClientRect();if(k&&r.top>innerHeight*.75)scrollBy({top:Math.round(r.top-innerHeight*.45),behavior:RM?"auto":"smooth"})};
  const pick=e=>{const k=u(e);if(!k)return;setReg(GEO.sel===k?"":k)};
  m.addEventListener("click",pick);
  m.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){if(u(e)){e.preventDefault();pick(e)}}});
  const gsel=$("#gsel");if(gsel)gsel.addEventListener("change",e=>setReg(e.target.value));
  /* кнопки «Онлайн», «Ташкент»… под картой работают как регионы: наведение – подсказка, клик – выбор или снятие выбора */
  const gx=$("#gext");if(gx){const ch=e=>{const b=e.target.closest(".gch");return b?b.dataset.u:""};
    gx.addEventListener("mouseover",e=>geoCap(ch(e)));gx.addEventListener("mouseout",()=>geoCap(""));
    gx.addEventListener("focusin",e=>geoCap(ch(e)));gx.addEventListener("focusout",()=>geoCap(""));
    gx.addEventListener("click",e=>{const k=ch(e);if(k)setReg(GEO.sel===k?"":k)})}
  const pk=$("#gpick");if(pk)pk.addEventListener("click",e=>{const b=e.target.closest(".gcl");if(!b)return;if(b.dataset.act==="close"){GEO.sel="";GEO.open=false;geoPanel()}else setReg("")});
}}
document.querySelectorAll(".lm button").forEach(b=>b.addEventListener("click",()=>{setLang(b.dataset.l);document.body.classList.remove("open");burger.setAttribute("aria-expanded",false)}));
$("#fs").addEventListener("input",renderEvents);
$("#pmore").addEventListener("click",function(){$("#progs").classList.remove("cut");this.hidden=true});
$("#evs").addEventListener("click",e=>{const rg=e.target.closest(".rgl span");if(rg)rg.classList.toggle("x");if(e.target.closest(".more")){const eg=$("#evs .eg");if(eg)eg.scrollBy({top:Math.round(eg.clientHeight*.85),behavior:RM?"auto":"smooth"})}});
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
