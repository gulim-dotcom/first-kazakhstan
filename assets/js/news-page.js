/* FIRST® Kazakhstan — страница «Новости»: все новости из вкладки «Новости» таблицы (assets/data/site.js),
 * посты Telegram с хэштегом #сайт (assets/data/news.js) и главные результаты (data.js), без ограничения по числу. */
(function(){
"use strict";
const $=s=>document.querySelector(s);
let L="kk";
const tt=k=>(T[L]&&T[L][k]!=null)?T[L][k]:(T.ru[k]!=null?T.ru[k]:"");
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const cu=v=>{const u=encodeURI(String(v==null?"":v)).replace(/[()"']/g,"");return u?`url('${u}')`:"none"};
const ndate=s=>{const m=String(s||"").match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);return m?(m[3]?`${m[3]}.${m[2]}.${m[1]}`:`${m[2]}.${m[1]}`):""};
function newsAll(){
  const nd=x=>String(x&&x.date||"");
  const tg=(window.FK_TG_NEWS||[]).filter(x=>x&&x.title&&/^https:\/\//.test(x.url)).map(x=>({src:tt("tgsrc"),date:x.date||"",url:x.url,img:x.img||GEN_IMG,pos:"50% 50%",t:[x.title,x.title,x.title],p:[x.text||"",x.text||"",x.text||""]}));
  const safeUrl=u=>/^https:\/\//.test(String(u||""))?String(u):"";
  const lg=(o,l)=>o?(o[l]||o.ru||""):"";
  const sh=(((window.FK_SITE||{}).news)||[]).filter(x=>x&&x.title&&(x.title.ru||x.title.kk||x.title.en)).map(x=>({src:tt("sheetsrc"),date:x.date||"",url:safeUrl(x.url),img:(x.img&&/^assets\//.test(x.img))?x.img:GEN_IMG,pos:"50% 50%",t:[lg(x.title,"ru"),lg(x.title,"kk"),lg(x.title,"en")],p:[lg(x.text,"ru"),lg(x.text,"kk"),lg(x.text,"en")]}));
  return[...sh,...tg,...N].sort((a,b)=>nd(b).localeCompare(nd(a)));
}
function render(){const i=I[L];
  document.documentElement.lang=L=="kk"?"kk":L;
  document.querySelectorAll("[data-t]").forEach(e=>{e.textContent=tt(e.dataset.t)});
  document.querySelectorAll("[data-ta]").forEach(e=>e.setAttribute("aria-label",tt(e.dataset.ta)));
  $("#lang").value=L;
  document.querySelectorAll(".lm button").forEach(b=>b.classList.toggle("on",b.dataset.l===L));
  document.title=`${tt("newsTitle")} – FIRST® Kazakhstan`;
  const md=document.querySelector("meta[name=description]");if(md&&tt("newsMeta"))md.content=tt("newsMeta");
  $("#nlist").innerHTML=newsAll().map(x=>{const body=`<div class="im" style="background-image:${cu(x.img)};background-position:${esc(x.pos||"50% 50%")}"></div><div class="cb"><small>${esc(x.src)}${x.date?" · "+ndate(x.date):""}</small><b>${esc(x.t[i])}</b><p>${esc(x.p[i])}</p>${x.url?`<span class="rd">${esc(tt("read"))}</span>`:""}</div>`;
    return x.url?`<a class="card" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${body}</a>`:`<div class="card">${body}</div>`}).join("");
}
function setLang(l){if(!T[l])return;L=l;try{localStorage.setItem("fk-lang",l)}catch(e){}render()}
try{const u=new URLSearchParams(location.search).get("lang");const s=localStorage.getItem("fk-lang");L=(u&&T[u])?u:(s&&T[s])?s:"kk"}catch(e){}
render();
$("#lang").addEventListener("change",e=>setLang(e.target.value));
const burger=$("#burger");
const closeNav=()=>{document.body.classList.remove("open");burger.setAttribute("aria-expanded",false)};
document.querySelectorAll(".lm button").forEach(b=>b.addEventListener("click",()=>{setLang(b.dataset.l);closeNav()}));
burger.addEventListener("click",()=>{const o=document.body.classList.toggle("open");burger.setAttribute("aria-expanded",o)});
document.querySelectorAll("#nav a").forEach(a=>a.addEventListener("click",closeNav));
document.addEventListener("click",e=>{if(document.body.classList.contains("open")&&!e.target.closest("#nav,#burger"))closeNav()});
addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("open")){closeNav();burger.focus()}});
})();
