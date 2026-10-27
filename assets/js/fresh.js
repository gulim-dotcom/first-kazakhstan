/* FIRST® Kazakhstan — свежая версия сайта на любом устройстве.
 * При публикации (tools/build_site.mjs) в страницу записывается номер сборки <meta name="fk-build">, а рядом кладётся version.json.
 * Этот скрипт сверяет их: при открытии страницы, при возврате на вкладку (телефон достали из кармана, вернулись из другого
 * приложения) и при показе страницы из кэша «назад/вперёд». Если на сервере уже новая сборка, страница один раз
 * перезагружается по адресу с ?_v=<сборка> — такой адрес не может прийти из старого кэша браузера, Telegram или Instagram.
 * Параметр _v затем убирается из адресной строки. На странице, открытой с диска (file://), и в старых браузерах ничего не делает.
 * Написан на ES5, чтобы работать даже на очень старых телефонах. */
(function(){
  "use strict";
  var m=document.querySelector('meta[name="fk-build"]');
  if(!m||!window.fetch||!window.Promise||!/^https?:$/.test(location.protocol))return;
  var cur=m.getAttribute("content")||"";
  if(!cur||cur==="dev")return;
  /* убрать ?_v=… из адреса после обновления */
  try{
    if(/[?&]_v=/.test(location.search)){
      var q=location.search.replace(/^\?/,"").split("&").filter(function(x){return x&&x.indexOf("_v=")!==0}).join("&");
      history.replaceState(history.state,"",location.pathname+(q?"?"+q:"")+location.hash);
    }
  }catch(e){}
  var busy=false,last=0;
  function check(){
    var now=Date.now();
    if(busy||now-last<30000)return;
    busy=true;last=now;
    fetch("version.json?t="+now,{cache:"no-store",credentials:"omit"}).then(function(r){return r.ok?r.json():null}).then(function(j){
      busy=false;
      var v=j&&j.v;
      if(!v||v===cur||!/^[0-9a-z]{4,40}$/.test(v))return;
      /* не больше одной перезагрузки на каждую новую сборку – без бесконечного цикла, даже если сервер ещё отдаёт старую страницу */
      var k="fk-upd:"+v;
      try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1")}catch(e){return}
      var q=location.search.replace(/^\?/,"").split("&").filter(function(x){return x&&x.indexOf("_v=")!==0});
      q.push("_v="+v);
      location.replace(location.pathname+"?"+q.join("&")+location.hash);
    })["catch"](function(){busy=false});
  }
  if(document.readyState==="complete")setTimeout(check,1500);
  else addEventListener("load",function(){setTimeout(check,1500)});
  addEventListener("pageshow",function(e){if(e.persisted){last=0;check()}});
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")check()});
})();
