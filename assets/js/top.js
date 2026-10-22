/* Перезагрузка страницы всегда открывает сайт сверху (просьба USTEM, 21.10.2026). Заставка при открытии убрана 23.10.2026 по решению USTEM.
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
