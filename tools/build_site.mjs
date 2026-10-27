// FIRST® Kazakhstan — сборка сайта перед публикацией на GitHub Pages (запускается в .github/workflows/update-site.yml).
// Исходники в репозитории не меняются: готовый сайт собирается в отдельную папку (по умолчанию _site).
//
// Что делает:
//  1. Каждой ссылке на свой файл (assets/…: стили, скрипты, данные, картинки, шрифты) ставит ?v=<хэш содержимого>.
//     Изменился файл — изменился адрес, и любой браузер (Android, Windows, iPhone, Telegram, Instagram) берёт новую версию,
//     а не старую из кэша. Вручную менять ?v=… больше не нужно.
//  2. Вписывает казахские тексты интерфейса (из assets/js/data.js) прямо в HTML. Раньше кнопки, метки и подписи были пустыми,
//     пока не загрузится JavaScript, и на медленном интернете или старом телефоне вместо слов были видны пустые квадраты.
//     app.js после загрузки по-прежнему переключает язык как раньше.
//  3. Записывает номер сборки в <meta name="fk-build"> и в version.json — по нему assets/js/fresh.js сам обновляет
//     открытые вкладки, когда выходит новая версия сайта.
//
// Запуск: node tools/build_site.mjs [папка-результат]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.resolve(ROOT, process.argv[2] || "_site");
const SKIP = new Set([".git", ".github", "tools", "_site", "node_modules", "__pycache__", "README.md", ".gitignore"]);
const HTML = ["index.html", "news.html", "404.html"];
// status.js меняется каждый час (время проверки таблицы) — на номер сборки он не влияет, чтобы вкладки не перезагружались зря
const NOT_IN_BUILD_ID = new Set(["assets/data/status.js"]);

const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

// --- 1. копия сайта ---
fs.rmSync(OUT, { recursive: true, force: true });
function copy(rel) {
  const src = path.join(ROOT, rel);
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(path.join(OUT, rel), { recursive: true });
    for (const n of fs.readdirSync(src)) if (!SKIP.has(n)) copy(path.join(rel, n));
  } else fs.copyFileSync(src, path.join(OUT, rel));
}
copy("");

const read = (rel) => fs.readFileSync(path.join(OUT, rel), "utf8");
const write = (rel, s) => fs.writeFileSync(path.join(OUT, rel), s);
const hashOf = (rel) => {
  const f = path.join(OUT, rel);
  if (!fs.existsSync(f)) throw new Error("нет файла, на который ссылается страница: " + rel);
  return sha(fs.readFileSync(f)).slice(0, 10);
};

// --- 2. ?v=<хэш> в CSS (картинки и шрифты), потом в HTML ---
for (const css of ["assets/css/style.css"]) {
  const dir = path.posix.dirname(css);
  write(css, read(css).replace(/url\((['"]?)(\.\.\/[^)'"?#]+)(\?[^)'"#]*)?\1\)/g, (m, q, ref) => {
    const rel = path.posix.normalize(path.posix.join(dir, ref));
    return `url(${q}${ref}?v=${hashOf(rel)}${q})`;
  }));
}
const stamp = (s) => s.replace(/\b(src|href)="(\/?)(assets\/[^"?#]+)(\?[^"#]*)?"/g, (m, a, slash, rel) => `${a}="${slash}${rel}?v=${hashOf(rel)}"`);

// --- 3. казахские тексты прямо в HTML ---
// data.js и alumni.js — только данные (тексты на трёх языках), их можно выполнить отдельно от браузера
const ctx = vm.createContext({});
for (const f of ["assets/js/data.js", "assets/js/alumni.js"]) new vm.Script(fs.readFileSync(path.join(ROOT, f), "utf8"), { filename: f }).runInContext(ctx);
const T = new vm.Script("T").runInContext(ctx);
const tt = (k) => (T.kk && T.kk[k] != null ? T.kk[k] : T.ru && T.ru[k] != null ? T.ru[k] : "");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function prerender(s) {
  let missing = [];
  // пустые элементы с data-t="ключ" получают текст
  s = s.replace(/(<([a-z][a-z0-9]*)\b[^>]*\sdata-t="([^"]+)"[^>]*>)(<\/\2>)/gi, (m, open, tag, k, close) => {
    const v = tt(k);
    if (!v) missing.push(k);
    return open + esc(v) + close;
  });
  // aria-label и alt
  s = s.replace(/<[a-z][a-z0-9]*\b[^>]*\sdata-ta="([^"]+)"[^>]*>/gi, (m, k) => (tt(k) ? m.replace(/\saria-label="[^"]*"/, ` aria-label="${esc(tt(k))}"`) : m));
  s = s.replace(/<img\b[^>]*\sdata-talt="([^"]+)"[^>]*>/gi, (m, k) => (tt(k) ? m.replace(/\salt="[^"]*"/, ` alt="${esc(tt(k))}"`) : m));
  if (missing.length) console.warn("::warning::нет текста для ключей: " + missing.join(", "));
  return s;
}

const pages = {};
for (const p of HTML) {
  if (!fs.existsSync(path.join(OUT, p))) continue;
  let s = stamp(read(p));
  if (s.includes('data-t="')) s = prerender(s);
  pages[p] = s;
}

// --- 4. номер сборки: хэш всего опубликованного текста (кроме status.js) ---
const all = [];
(function walk(rel) {
  for (const n of fs.readdirSync(path.join(OUT, rel)).sort()) {
    const r = rel ? rel + "/" + n : n;
    if (fs.statSync(path.join(OUT, r)).isDirectory()) walk(r);
    else all.push(r);
  }
})("");
const h = crypto.createHash("sha256");
for (const r of all) {
  if (NOT_IN_BUILD_ID.has(r)) continue;
  h.update(r + "\0");
  h.update(pages[r] != null ? pages[r].replace(/\?v=[0-9a-f]{10}/g, "") : fs.readFileSync(path.join(OUT, r)));
  h.update("\0");
}
const build = h.digest("hex").slice(0, 12);
for (const [p, s] of Object.entries(pages)) write(p, s.replace(/<meta name="fk-build" content="[^"]*">/, `<meta name="fk-build" content="${build}">`));
write("version.json", JSON.stringify({ v: build }) + "\n");
console.log(`Сборка ${build}: ${all.length} файлов → ${path.relative(ROOT, OUT) || "."}`);
