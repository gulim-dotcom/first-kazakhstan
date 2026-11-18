/* FIRST® Kazakhstan — первый экран «по прокрутке».
 * Пока страница прокручивается первые ~90% высоты окна, первый экран стоит на месте (position:sticky внутри .hpin),
 * а прокрутка управляет сценой: фаза A – текст уходит, фото темнеет, слово Kazakhstan поднимается в центр;
 * фаза B – из темноты проявляется вторая сцена (FTC). Дальше экран отпускается и уезжает как обычный блок.
 * Скрипт только считает две доли 0…1 и пишет их в переменные --a и --b у .hero; всё движение описано в style.css (блок «первый экран по прокрутке»).
 * Режим включается классом scrub у <html> и только если первый экран целиком помещается в окно под шапкой и в системе
 * не отключена анимация; иначе первый экран работает как раньше – две сцены сменяются по времени. */
(function(){
"use strict";
var hero=document.getElementById("home"),pin=hero&&hero.parentNode;
if(!hero||!pin||!pin.classList||!pin.classList.contains("hpin"))return;
var root=document.documentElement,RM=window.matchMedia?matchMedia("(prefers-reduced-motion: reduce)"):{matches:false};
var on=false,start=0,dist=1,queued=false,lastW=-1,la=-1,lb=-1;
var clamp=function(x){return x<0?0:x>1?1:x};
var ease=function(x){return x*x*(3-2*x)};   /* плавный вход и выход у каждой фазы */
/* отступ, на котором экран «прилипает» под шапкой, задан в стилях: --ht */
function stickTop(){var v=parseFloat(getComputedStyle(root).getPropertyValue("--ht"));return isNaN(v)?88:v}
function apply(){queued=false;if(!on)return;
  var p=clamp((window.pageYOffset-start)/dist),a=ease(clamp(p/.5)),b=ease(clamp((p-.5)/.5));
  a=Math.round(a*1000)/1000;b=Math.round(b*1000)/1000;
  if(a!==la){hero.style.setProperty("--a",a);hero.classList.toggle("h-out",a>.6);la=a}   /* h-out: текст и кнопки уже не видны – убираются и из-под курсора */
  if(b!==lb){hero.style.setProperty("--b",b);lb=b}}
function onScroll(){if(on&&!queued){queued=true;requestAnimationFrame(apply)}}
/* force – пересчитать, включать ли режим (загрузка, смена ширины или поворот); иначе только обновить размеры.
 * На телефоне высота окна меняется вместе с адресной строкой браузера – от этого режим не переключается, чтобы страница не прыгала. */
function measure(force){
  if(force||!on){var ht=stickTop(),fits=!RM.matches&&hero.offsetHeight+ht<=window.innerHeight+2;
    if(fits!==on){on=fits;root.classList.toggle("scrub",on);
      if(!on){hero.classList.remove("h-out");hero.style.removeProperty("--a");hero.style.removeProperty("--b");hero.style.removeProperty("--hy");la=lb=-1}}}
  if(!on)return;
  var r=pin.getBoundingClientRect(),mt=parseFloat(getComputedStyle(hero).marginTop)||0;
  start=r.top+window.pageYOffset+mt-stickTop();
  dist=Math.max(1,pin.offsetHeight-hero.offsetHeight-mt);
  hero.style.setProperty("--hy",(hero.offsetHeight/2).toFixed(1)+"px");   /* половина высоты экрана: на столько (минус полслова) поднимается Kazakhstan */
  apply()}
function onResize(){var w=window.innerWidth,ch=w!==lastW;lastW=w;measure(ch)}
lastW=window.innerWidth;measure(true);
window.addEventListener("scroll",onScroll,{passive:true});
window.addEventListener("resize",onResize);
window.addEventListener("orientationchange",function(){setTimeout(function(){lastW=window.innerWidth;measure(true)},250)});
window.addEventListener("load",function(){measure(true)});
if(RM.addEventListener)RM.addEventListener("change",function(){measure(true)});
})();
