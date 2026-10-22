/* FIRST түлектері және олардың жолы — блок «Біздің жетістіктеріміз» астында.
 * Жаңа түлек қосу: төмендегі тізімге тағы бір { … } жолын қосыңыз.
 *  photo — сурет файлы assets/img/alumni/ ішінде (мысалы "assets/img/alumni/aruzhan.jpg"); бос болса — сұр фон мен белгіше;
 *  name  — аты-жөні; path — қысқа жолы («FLL → FTC → Назарбаев Университеті»); text — бір-екі сөйлем;
 *  ["русский","қазақша","English"] ретімен. Қазақша/ағылшынша бос болса, басқа тілдегі мәтін көрсетіледі;
 *  url   — Instagram посты. */
const ALUMNI=[
 {photo:"assets/img/alumni/stanford.webp",name:["Амира Махмеджан","Амира Махмеджан","Amira Makhmedzhan"],path:["FIRST → Stanford University","",""],text:["","",""],url:"https://www.instagram.com/p/DDKMTVxt2oR/"},
 {photo:"assets/img/alumni/kareneev.webp",name:["Таир Каренеев","Таир Каренеев","Tair Kareneyev"],path:["FIRST → Worcester Polytechnic Institute","",""],text:["","",""],url:"https://www.instagram.com/p/DEWtDdLM5T5/"},
 {photo:"assets/img/alumni/alibaev.webp",name:["Дамир Алибаев","Дамир Алибаев","Damir Alibayev"],path:["FIRST → University of Toronto","",""],text:["","",""],url:"https://www.instagram.com/p/DHQ53FPtkUF/?img_index=8"},
 {photo:"assets/img/alumni/serikov.webp",name:["Алихан Сериков","Алихан Сериков","Alikhan Serikov"],path:["FIRST → Stanford University","",""],text:["","",""],url:"https://www.instagram.com/p/DW1CnfrjIV5/?img_index=1"}
];
Object.assign(T.ru,{alh:"Выпускники FIRST® и их путь",alp:"Наши выпускники продолжают путь в науке, технологиях и инженерии. Их истории – тоже наше достижение.",alig:"Читать полностью",alsoon:"История выпускника скоро появится здесь"});
Object.assign(T.kk,{alh:"FIRST® түлектері және олардың жолы",alp:"Түлектеріміз ғылым, технология және инженерия саласындағы жолын жалғастыруда. Олардың тарихы – біздің де жетістігіміз.",alig:"Толық оқу",alsoon:"Түлектің тарихы жақында осында болады"});
Object.assign(T.en,{alh:"FIRST® alumni and their path",alp:"Our alumni carry on in science, technology and engineering. Their stories are our achievement too.",alig:"Read the full story",alsoon:"This alumni story is coming soon"});
