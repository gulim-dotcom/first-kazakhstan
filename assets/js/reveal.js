/* FIRST® Kazakhstan — появление блоков при прокрутке (главная и «Новости»).
 * Блок, который ещё ниже экрана, скрывается (класс rv) и один раз плавно появляется, когда доезжает до экрана (класс in);
 * после появления оба класса снимаются, и блок больше никогда не прячется. Так блок не может «зависнуть» полупрозрачным,
 * как было с анимацией, привязанной к положению прокрутки: остановились посреди страницы – нижний блок оставался бледным.
 * Прячет блоки только этот скрипт: не загрузился, старый браузер или в системе отключена анимация – всё видно сразу.
 * Блоки, которые app.js перерисовывает при смене языка (цифры, карточки программ), подхватываются заново. */
(function(){
"use strict";
if(!("IntersectionObserver" in window)||!("MutationObserver" in window))return;
if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var SEL=".panel,.sh,.sp,.ab .col,.ab .ax,.proof,.st,.lawn,.grid>.pc,.docs,.mp,.mq,.sup,.fmark";
var done=function(el){el.classList.remove("rv","in");el.style.removeProperty("--d")};
var show=function(el,i){
  el.style.setProperty("--d",Math.min(i,5)*70+"ms");   /* соседние блоки появляются по очереди */
  el.classList.add("in");
  setTimeout(function(){done(el)},1400+i*70)};
var alive=false,off=false;   /* alive – наблюдатель браузера хоть раз ответил; off – появление выключено, всё видно */
var io=new IntersectionObserver(function(ens){var i=0;alive=true;
  ens.forEach(function(en){if(!en.isIntersecting)return;io.unobserve(en.target);show(en.target,i++)})},{rootMargin:"0px 0px -6% 0px"});
/* прятать только то, что целиком ниже экрана: видимое и уже пройденное не трогаем */
function take(el){if(off||el.classList.contains("rv")||el.closest("[hidden],dialog"))return;
  if(el.getBoundingClientRect().top<window.innerHeight)return;
  el.classList.add("rv");io.observe(el)}
function scan(root){if(root.nodeType!==1)return;
  if(root.matches(SEL))take(root);
  var l=root.querySelectorAll(SEL);for(var k=0;k<l.length;k++)take(l[k])}
scan(document.body);
new MutationObserver(function(ms){ms.forEach(function(m){for(var k=0;k<m.addedNodes.length;k++)scan(m.addedNodes[k])})}).observe(document.body,{childList:true,subtree:true});
/* страховка 1: при прокрутке блоки проверяются ещё и напрямую (не чаще раза в 120 мс и ещё раз после остановки) – если наблюдатель браузера
 * опоздал, вкладка была в фоне или страницу прокрутили прыжком (переход по меню), всё, что оказалось выше низа экрана, показывается */
function sweep(){var l=document.querySelectorAll(".rv:not(.in)"),h=window.innerHeight,i=0;
  for(var k=0;k<l.length;k++)if(l[k].getBoundingClientRect().top<h*.94){io.unobserve(l[k]);show(l[k],i++)}}
var t=0,last=0;
window.addEventListener("scroll",function(){var n=Date.now();if(n-last>120){last=n;sweep()}clearTimeout(t);t=setTimeout(sweep,160)},{passive:true});
document.addEventListener("visibilitychange",function(){if(!document.hidden)sweep()});
window.addEventListener("pageshow",sweep);
window.addEventListener("resize",sweep);
/* страховка 2: наблюдатель так и не ответил (встроенный браузер приложения с урезанными возможностями) – появление выключается, все блоки видны */
setTimeout(function(){if(alive||document.hidden)return;off=true;
  var l=document.querySelectorAll(".rv");for(var k=0;k<l.length;k++){io.unobserve(l[k]);done(l[k])}},2500);
})();
