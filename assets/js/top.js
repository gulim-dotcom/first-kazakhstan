/* Заставка при открытии главной (index.html → .splash): эмблема, затем надпись FIRST Kazakhstan, около секунды, потом страница.
   Исчезает по CSS-анимации (style.css → .splash), поэтому пропадает даже без JS; здесь она лишь убирается из разметки после
   анимации и не показывается при возврате кнопками «назад/вперёд».
   Перезагрузка страницы всегда открывает сайт сверху (просьба USTEM, 21.10.2026).
   Выполняется в <head>, до первой отрисовки. Браузеру запрещено само восстановление позиции
   прокрутки (иначе перезагрузка возвращает к прежнему месту), «#раздел» из адреса при
   перезагрузке убирается. Кнопка «назад» по-прежнему возвращает на прежнее место: позиция
   сохраняется в sessionStorage при уходе со страницы. Прямая ссылка вида /#alumni при первом
   открытии работает как раньше. Переходы по меню и кнопкам – в app.js. */
(function(){
  try{
    if("scrollRestoration" in history)history.scrollRestoration="manual";
    var n=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];
    var t=n?n.type:(performance.navigation&&performance.navigation.type===1?"reload":performance.navigation&&performance.navigation.type===2?"back_forward":"navigate");
    var key="fk-y:"+location.pathname;
    var go=function(y){try{scrollTo({top:y,left:0,behavior:"instant"})}catch(e){scrollTo(0,y)}};
    if(t==="back_forward")document.documentElement.classList.add("nosplash");
    addEventListener("DOMContentLoaded",function(){var s=document.getElementById("splash");if(!s)return;
      var off=function(){if(s.parentNode)s.parentNode.removeChild(s)};
      s.addEventListener("animationend",function(e){if(e.target===s)off()});
      setTimeout(off,2000);
    });
    if(t==="reload"){
      if(location.hash)history.replaceState(null,"",location.pathname+location.search);
      addEventListener("DOMContentLoaded",function(){go(0)});
      addEventListener("load",function(){go(0);setTimeout(function(){go(0)},150)});
    }else if(t==="back_forward"&&!location.hash){
      var y=0;try{y=+sessionStorage.getItem(key)||0}catch(e){}
      if(y)addEventListener("load",function(){go(y)});
    }
    addEventListener("pagehide",function(){try{sessionStorage.setItem(key,Math.round(scrollY))}catch(e){}});
  }catch(e){}
})();
