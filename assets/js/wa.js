/* FIRST® Kazakhstan — ссылка на WhatsApp-сообщество в подвале: по нажатию открывается окно с описанием группы
 * и кнопкой «Вступить». Тексты — ключи wa* в assets/js/data.js, адрес группы — в index.html и news.html.
 * Без JavaScript или в старом браузере без <dialog> ссылка просто ведёт в WhatsApp. */
(function(){
"use strict";
const d=document.getElementById("waDlg");
if(!d||typeof d.showModal!=="function")return;
document.querySelectorAll(".wa-open").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();d.showModal()}));
d.querySelector(".wa-x").addEventListener("click",()=>d.close());
/* нажатие на затемнённый фон вокруг окна закрывает его */
d.addEventListener("click",e=>{if(e.target===d)d.close()});
d.querySelector(".wa-join").addEventListener("click",()=>d.close());
})();
