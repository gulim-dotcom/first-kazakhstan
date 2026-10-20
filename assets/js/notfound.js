/* FIRST® Kazakhstan — страница «не найдено» (404.html).
 * Адреса прежнего сайта (/ru/…, /kz/…, /kk/…, /en/…) из закладок и поиска ведут на новую главную на том же языке;
 * любой другой несуществующий адрес остаётся на странице «Бет табылмады». */
(function(){
  "use strict";
  var p=location.pathname.toLowerCase().split("/").filter(Boolean);
  var LANG={ru:"ru",en:"en",kz:"",kk:"",qq:""};
  if(!p.length||!Object.prototype.hasOwnProperty.call(LANG,p[0]))return;
  var lang=LANG[p[0]],rest=p.slice(1).join("/");
  var SEC={about:"#about",results:"#results",programs:"#programs",program:"#programs",events:"#events",calendar:"#events",media:"#media",partners:"#partners",contacts:"#contacts"};
  var page=/^news/.test(rest)?"/news.html":"/",hash="";
  for(var k in SEC){if(rest.indexOf(k)===0){hash=SEC[k];break}}
  location.replace(page+(lang?"?lang="+lang:"")+(page==="/"?hash:""));
})();
