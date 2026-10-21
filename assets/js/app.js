/* FIRST® Kazakhstan — отрисовка страницы.
 * Тексты и справочники — data.js. События — assets/data/sheet.js: снимок официальной Google-таблицы расписания,
 * его автоматически обновляет GitHub Action (tools/update_data.py). Посты Telegram с хэштегом #сайт — assets/data/news.js. */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const tt=k=>(T[L]&&T[L][k]!=null)?T[L][k]:(T.ru[k]!=null?T.ru[k]:"");
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
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
  const full=[...s.matchAll(/(\d{1,2})\.(\d{1,2})\.(\d{4})/g)].map(m=>new Date(+m[3],+m[2]-1,+m[1]));
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
/* категории и ссылки регистрации; закрытые формы и формы чужого события скрываются (их отмечает tools/update_data.py) */
const CAT_ORDER=["FLL-D","FLL-E","FLL-C","FE","FTC","FRC","F4A","SMC","SEM"];
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
  const st=url&&FORMS[url]?FORMS[url].s:"",bad=st==="closed"||st==="mismatch";
  return{code:code,label:label,url:url&&!bad?url:"",closed:st==="closed"};
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
    const cats=[];if(c.catStart>=0)for(let k=c.catStart;k<r.length&&k<c.catEnd;k++){const t=ctext(r[k]);if(t)cats.push(parseCat(t,curl(r[k])))}
    let v=null;for(const k of c.venue){const t=ctext(g(k));if(t){v={n:t,u:curl(g(k))};break}}
    const ses={d:parseDate(dRaw),v:v,cats:cats,st:ctext(g(c.status)),chg:ctext(g(c.chg))};
    if(!name){if(cur&&(dRaw||v||cats.length)){if(!dRaw){const f=cur.sessions[0];ses.d=f.d;if(!ses.st)ses.st=f.st}cur.sessions.push(ses)}return}
    cur={tab:tab,name:name,city:cityOf(ctext(g(c.city))),region:c.region>=0?regionOf(ctext(g(c.region))):null,
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
  e.vis=e.sessions.filter(s=>!isDone(s)&&!(s.d.end&&s.d.end<TODAY));
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
    vis:[{d:d,v:null,cats:[{code:"SMC",label:"SMC",url:SMC.url,closed:false}],st:"",chg:""}]})}}
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
  $("#gstats").innerHTML=`<span class="wlab">${esc(tt("gh"))}</span><p class="wtx">${esc(tt("gline"))}</p>`; /* мировые цифры FIRST – строкой текста */
  /* мировые цифры FIRST – одна строка под текстом (21.10.2026), а не второй блок цифр */
  countUp(); /* цифры Казахстана снова растут с нуля (вернули по просьбе USTEM 21.10.2026); цифры FIRST в мире статичные */
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
function renderWinners(){const i=I[L];
  $("#wins").innerHTML=W.map(w=>`<div class="wc"><div class="wim" style="background-image:${cu(w[13]||WI[w[3]])}"></div><span class="yr">${w[3]}</span><div class="wt"><b>${esc(w[i])}</b><small>${esc(w[10]?w[10+i]:"FIRST® Global Challenge")}, ${esc(w[4+i])}</small></div></div>`).join("");
}
/* FIRST түлектері: карточкалар — assets/js/alumni.js; бос мәтін басқа тілден алынады (қаз → рус → eng) */
function renderAlumni(){const box=$("#alums");if(!box)return;
  const A=typeof ALUMNI!=="undefined"?ALUMNI:[];
  $("#alumni").hidden=!A.length;box.parentElement.classList.toggle("few",A.length<=3);
  $("#alh").innerHTML=esc(tt("alh")).replace("FIRST®",'<span class="fi">FIRST</span>®');
  const pick=a=>{a=a||[];return a[I[L]]||a[1]||a[0]||a[2]||""};
  const ig=/^https:\/\/(www\.)?instagram\.com\//;
  box.innerHTML=A.map(a=>{const n=pick(a.name),pa=pick(a.path),tx=pick(a.text),u=ig.test(a.url||"")?a.url:"";
    const ph=a.photo?`<div class="alim" style="background-image:${cu(a.photo)};background-position:${esc(a.pos||"center 25%")}"></div>`
      :`<div class="alim ph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6"/></svg></div>`;
    const body=`${ph}<div class="alb">${n?`<b>${esc(n)}</b>`:""}${pa?`<span class="alpa">${esc(pa)}</span>`:""}${tx||!(n||pa)?`<p>${esc(tx||tt("alsoon"))}</p>`:""}${u?`<span class="alig">${esc(tt("alig"))} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>`:""}</div>`;
    return u?`<a class="alc" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${body}</a>`:`<article class="alc">${body}</article>`}).join("");
}
function renderValues(){const i=I[L];
  $("#valh").innerHTML=firstH(tt("valh"));
  $("#vals").innerHTML=V.map((v,k)=>{const c=CV[k];
    return `<div class="vl"><div class="ic" style="--c:${c[1]}"><img src="assets/img/cv-${c[0]}.svg" alt="" width="64" height="48"></div><div><h4>${esc(v[i])}</h4><p>${esc(v[3+i])}</p></div></div>`}).join("");
}
/* цитата: первая фраза — синим, как на firstrobotics.kz */
function renderQuote(){const q=tt("quote"),m=q.match(/^(.*?[.!?])\s+([\s\S]*)$/);
  $("#quote").innerHTML=m?`<span class="ql">${esc(m[1])}</span> ${esc(m[2])}`:esc(q)}
/* программы: кратко — категория, возраст, состав, этапы; подробности — в правилах сезона */
const PIC={cat:'<svg viewBox="0 0 24 24"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
  age:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  team:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 4a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-5-6.7"/></svg>',
  stg:'<svg viewBox="0 0 24 24"><path d="M4 21V4M4 4h12l-2 4 2 4H4"/></svg>'};
function renderPrograms(){const i=I[L];
  $("#progh").innerHTML=firstH(tt("prog"));
  $("#progs").innerHTML=PROG.map((p,k)=>{
    const cat=Array.isArray(p.cat)?p.cat[i]:p.cat;
    const head=p.logo?`<img src="${esc(p.logo)}" alt="FIRST ${esc(p.name)}">`:`<span class="wm"><i>FIRST<sup>®</sup></i><b>${esc(p.wordmark[0])}</b><b>${esc(p.wordmark[1])}</b></span>`;
    const meta=[cat,p.ageTxt?p.ageTxt[i]:"",p.team[i]].filter(Boolean).join(" · ");
    return `<article class="card pc${p.wide?" wide":""}" id="program-${k}" style="--c:${esc(p.color)}">
      <div class="pi" style="background-image:${cu(p.photo)};background-position:${esc(p.ppos||"center")}">${head}</div>
      <div class="cb">
        <span class="cat">${esc(p.age+" "+tt("yrs"))}</span>
        <p class="intro"><span class="pn"><span class="fi">FIRST</span>® ${esc(p.name)}</span>&nbsp;– ${esc(p.intro[i])}</p>
        <p class="meta">${esc(meta)}</p>
        ${p.teaser?`<div class="pl"><a class="lnk tz" href="${esc(p.teaser)}" target="_blank" rel="noopener noreferrer">${esc(tt("tz"))}</a></div>`:""}
      </div></article>`}).join("");
  /* телефон: показываем первые три программы, остальные – по кнопке (21.10.2026) */
  const pg=$("#progs");pg.classList.add("cut");
  const pm=$("#pmore");if(pm){pm.textContent=tt("allProg");pm.hidden=false}
  const rb=$("#rulesBtn");rb.href=rulesUrl();
  if(L!="kk"&&!RULES.ru)rb.querySelector("span").textContent=tt("docKk");
}
/* партнёры: бегущая строка — список повторён дважды, чтобы лента шла без разрыва (копия скрыта от экранных дикторов) */
function renderPartners(){
  const lg=(x,h)=>`<div class="lg"${h?' aria-hidden="true"':""}><img src="${LG[x[0]]}" alt="${h?"":esc((typeof PNAMES_L!="undefined"&&PNAMES_L[L]&&PNAMES_L[L][x[0]])||(typeof PNAMES!="undefined"&&PNAMES[x[0]])||tt("partner"))}" loading="lazy"></div>`;
  const mq=a=>`<div class="lgs">${a.map(x=>lg(x,0)).join("")}${a.map(x=>lg(x,1)).join("")}</div>`;
  $("#mr").innerHTML=mq(RP);const mi=$("#mi");if(mi)mi.innerHTML=mq(IP);
}

/* --- новости: главные результаты (data.js) + посты Telegram с хэштегом #сайт (assets/data/news.js) --- */
const ndate=s=>{const m=String(s||"").match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);return m?(m[3]?`${m[3]}.${m[2]}.${m[1]}`:`${m[2]}.${m[1]}`):""};
function newsList(){
  const nd=x=>String(x&&x.date||"");
  /* не больше 4 постов Telegram, чтобы они не вытесняли главные результаты из data.js */
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
  $("#nws").innerHTML=newsList().map(x=>{const body=`<div class="im" style="background-image:${cu(x.img)};background-position:${esc(x.pos||"50% 50%")}"></div><div class="cb"><small>${esc(x.src)}${x.date?" · "+ndate(x.date):""}</small><b>${esc(x.t[i])}</b><p>${esc(x.p[i])}</p>${x.url?`<span class="rd">${esc(tt("read"))}</span>`:""}</div>`;
    return x.url?`<a class="card" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${body}</a>`:`<div class="card">${body}</div>`}).join("");
}

/* --- события --- */
const ICO={pin:'<svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',bld:'<svg viewBox="0 0 24 24"><path d="M4 21V4.5A1.5 1.5 0 0 1 5.5 3h8A1.5 1.5 0 0 1 15 4.5V21M15 9h3.5A1.5 1.5 0 0 1 20 10.5V21M2 21h20M7.5 7h1.5M10.5 7H12M7.5 10.5h1.5M10.5 10.5H12M7.5 14h1.5M10.5 14H12M8.5 21v-4h2v4"/></svg>',cal:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'};
const vname=n=>{const v=typeof VENUE!="undefined"&&VENUE[lo(n)];return v?v[I[L]]:n};
const venueHtml=v=>v?(v.u?`<a href="${esc(v.u)}" target="_blank" rel="noopener noreferrer">${esc(vname(v.n))}</a>`:esc(vname(v.n))):esc(tt("vtba"));
function evCard(e,t){const i=I[L],online=e.city.key==="online";
  /* при выбранной категории в карточке остаются только её сессии, метки и кнопка */
  const vis=t?e.vis.filter(s=>s.cats.some(c=>c.code===t)):e.vis,multi=vis.length>1;
  /* порядок строк как на firstrobotics.kz: город → площадка → дата → категории → кнопка «Участвовать» */
  const ses=s=>{
    const cats=t?s.cats.filter(c=>c.code===t):s.cats;
    const btn=cats.filter(c=>c.url);
    const showV=!(online&&(!s.v||/^(online|онлайн)$/i.test(s.v.n)))&&!!(s.v||e.cn);
    const one=cats.length===1&&btn.length===1;
    const bl=c=>c.code==="SEM"?tt("joinSem"):c.code==="SMC"?tt("smcBtn"):btn.length>1?`${tt("join")} · ${catLabel(c)}`:tt("join");
    return `<div class="${multi?"ses":"one"}">
      ${showV?`<p>${ICO.pin}<span>${venueHtml(s.v)}</span></p>`:""}
      <p class="dt">${ICO.cal}<span>${esc(dTxt(s.d,i))}</span></p>
      ${s.chg?`<p class="chg"><b>${esc(tt("chg"))}:</b> ${esc(s.chg)}</p>`:""}
      ${s.st?`<p class="chg"><b>${esc(tt("stt"))}:</b> ${esc(s.st)}</p>`:""}
      ${cats.length&&!(one&&cats[0].code==="SEM")?`<div class="tg">${cats.map(c=>`<span${c.closed?' class="closed"':""}>${esc(catLabel(c))}${c.closed?` · ${esc(tt("regclosed"))}`:c.soon?` · ${esc(tt("regsoon"))}`:""}</span>`).join("")}</div>`:""}
      ${btn.length?`<div class="fbs">${btn.map(c=>`<a class="fb${c.code==="SEM"?" sem":""}" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer" title="${esc(catLabel(c))}">${esc(bl(c))}</a>`).join("")}</div>`:""}
    </div>`};
  return `<div class="cell"><div class="ec"><div>
    <h4>${esc(e.name)}</h4>
    ${e.noLoc?"":`<p>${ICO.bld}<span>${esc(e.cn?e.cn[i]:tt("ctba"))}${e.region&&!sameStem(e.cn?e.cn[i]:"",e.region[i])?`, ${esc(e.region[i])}`:""}</span></p>`}
    ${e.allowed?`<p class="rgl">${ICO.pin}<span title="${esc(e.allowed[i])}"><b>${esc(tt("regs"))}:</b> ${esc(e.allowed[i])}</span></p>`:""}
    ${vis.map(ses).join("")}
  </div><div class="eim" style="background-image:${cu(e.im)}"></div></div></div>`;
}
/* «Актобе, Актюбинская область» → область не повторяется, если она названа по городу */
const sameStem=(city,region)=>{const a=String(city||"").toLowerCase().slice(0,4),b=String(region||"").toLowerCase().slice(0,4);return a.length>=4&&a===b};
function stamp(iso){const d=new Date(iso);if(isNaN(d))return"";try{return d.toLocaleDateString("ru-RU",{timeZone:"Asia/Almaty",day:"2-digit",month:"2-digit",year:"numeric"})}catch(e){return `${p2(d.getDate())}.${p2(d.getMonth()+1)}.${d.getFullYear()}`}}
function renderEvents(){
  const c=$("#fc").value,t=$("#ft").value,sg=$("#fst").value,q=$("#fs").value.trim().toLowerCase();
  const ok=e=>(!c||e.cc===c)&&(!sg||e.stage===sg)&&(!t||e.codes.includes(t))&&
    (!q||[e.name,...(e.cn||[]),...(e.region||[]),...(e.allowed||[]),...(e.codes||[]),...e.vis.flatMap(s=>s.cats.map(catLabel)),...e.vis.map(s=>s.v?s.v.n+" "+vname(s.v.n):"")].join(" ").toLowerCase().includes(q));
  const u=UPC.filter(ok);
  /* все события в одной прокручиваемой сетке, как на firstrobotics.kz; стрелка внизу листает её */
  const more=`<div class="morew"><button class="more" type="button" aria-label="${esc(tt("more"))}" title="${esc(tt("more"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l6 6 6-6M6 13l6 6 6-6"/></svg></button></div>`;
  $("#evs").innerHTML=u.length?`<div class="eg">${u.map(e=>evCard(e,t)).join("")}</div>${more}`:`<p class="empty">${esc(tt(UPC.length?"none":"noneAll"))}</p>`;
  const eg=$("#evs .eg"),mw=$("#evs .morew");
  if(eg){const upd=()=>mw.classList.toggle("end",eg.scrollHeight-eg.clientHeight-eg.scrollTop<8);eg.addEventListener("scroll",upd,{passive:true});upd();setTimeout(upd,400)}
  const up=(window.FK_STATUS&&window.FK_STATUS.checked)||SHEET.updated,s=up?stamp(up):"";
  $("#evsrc").textContent=s?`${tt("evupd")} ${s}`:"";
}
function fillFilters(){const i=I[L];
  const sel=(id,h,arr)=>{const e=$(id),v=e.value;e.innerHTML=`<option value="">${esc(h)}</option>`+arr.map(a=>`<option value="${esc(a[0])}">${esc(a[1])}</option>`).join("");e.value=arr.some(a=>a[0]===v)?v:""};
  const cities={};UPC.forEach(e=>{if(e.cn)cities[e.cc]=e.cn});
  sel("#fc",tt("fa"),Object.values(cities).sort((a,b)=>a[i].localeCompare(b[i],L)).map(n=>[n[1],n[i]]));
  sel("#ft",tt("fc"),CAT_ORDER.filter(k=>UPC.some(e=>e.codes.includes(k))).map(k=>[k,k==="SEM"?tt("semSel"):k==="FE"?tt("fe0"):k]));
  sel("#fst",tt("fstg"),["kick","scrim","reg","qual","rep","big","off"].filter(s=>UPC.some(e=>e.stage===s)).map(k=>[k,tt("s_"+k)]));
  $("#fs").placeholder=tt("fs");
}

/* --- путь сезона над расписанием (21.10.2026, пример): месяцы скримиджей, региональных и Qualifier считаются по таблице,
 * чемпионат Центральной Азии – строка «Central Asia … Championship» вкладки Big Events, мировой финал – SMAP в data.js --- */
function mrange(a,b,l){const n=MN[l],cap=x=>x.charAt(0).toUpperCase()+x.slice(1),m1=a.getMonth(),m2=b.getMonth(),y1=a.getFullYear(),y2=b.getFullYear();
  if(y1===y2)return cap(m1===m2?n[m1]:n[m1]+"–"+n[m2])+" "+y1;
  return cap(n[m1])+" "+y1+" – "+n[m2]+" "+y2}
const evWord=(n,l)=>l==="kk"?"іс-шара":l==="en"?(n===1?"event":"events"):(n%10===1&&n%100!==11?"событие":n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?"события":"событий");
function renderMap(){const box=$("#smap");if(!box)return;const i=I[L];
  const rng=re=>{const ev=EVENTS.filter(e=>re.test(e.name));let a=null,b=null;
    ev.forEach(e=>e.sessions.forEach(s=>{if(!s.d.start)return;if(!a||s.d.start<a)a=s.d.start;const z=s.d.end||s.d.start;if(!b||z>b)b=z}));
    return{n:ev.length,txt:a?mrange(a,b,L):""}};
  const ch=EVENTS.find(e=>/central asia/i.test(e.name)&&/championship/i.test(e.name));
  const rows=[["sm1",rng(/scrimmage/i)],["sm2",rng(/regional/i)],["sm3",rng(/qualifier/i)],
    ["sm4",{txt:ch?[ch.cn?ch.cn[i]:"",dTxt(ch.sessions[0].d,i)].filter(Boolean).join(", "):"",sub:tt("sm4s")}],
    ["sm5",{txt:typeof SMAP!="undefined"?`${SMAP.city[i]}, ${SMAP.date}`:"",sub:tt("sm5s")}]];
  box.innerHTML=rows.map(([k,r])=>`<div class="sm"><b>${esc(tt(k))}</b>${r.txt?`<span class="d">${esc(r.txt)}</span>`:""}${r.n?`<small>${r.n} ${esc(evWord(r.n,L))}</small>`:r.sub?`<small>${esc(r.sub)}</small>`:""}</div>`).join("");
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
  renderStats();renderWinners();renderAlumni();renderValues();renderQuote();renderPrograms();renderNews();renderPartners();
  fillFilters();renderEvents();renderMap();
  /* «FIRST Қазақстанда» и подпись в подвале: английский оригинал девиза остаётся второй строкой, кроме английской версии */
  const ab=$("#abh");if(ab)ab.innerHTML=esc(tt("abh")).replace("FIRST®",'<span class="fi">FIRST</span>®');
  const og=$("#orig");if(og)og.hidden=(L==="en");
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
const fwo=new MutationObserver(()=>{italicFirst(document.body);fwo.takeRecords()});
fwo.observe(document.body,{childList:true,subtree:true,characterData:true});
italicFirst(document.body);
/* --- старт --- */
let start="kk";
try{localStorage.removeItem("fk-lang")}catch(e){}
try{const u=new URLSearchParams(location.search).get("lang");const s=sessionStorage.getItem("fk-lang");start=(u&&T[u])?u:(s&&T[s])?s:"kk";if(u&&T[u])sessionStorage.setItem("fk-lang",u)}catch(e){}
L=start;render();

$("#lang").addEventListener("change",e=>setLang(e.target.value));
document.querySelectorAll(".lm button").forEach(b=>b.addEventListener("click",()=>{setLang(b.dataset.l);document.body.classList.remove("open");burger.setAttribute("aria-expanded",false)}));
const refilter=()=>renderEvents();
["#fc","#ft","#fst"].forEach(s=>$(s).addEventListener("change",refilter));
$("#fs").addEventListener("input",refilter);
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
})();
