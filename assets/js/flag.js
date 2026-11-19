/* FIRST® Kazakhstan — флаг со слоганом в блоке контактов (главная и «Новости»).
 * Такие флаги с цитатами висят на соревнованиях FIRST. Полотно – картинка assets/img/flag-quote.webp (соотношение 1:2),
 * здесь оно «оживает»: сетка из 13×25 точек, связанных как ткань (метод Верле), верхний ряд закреплён на рейке.
 *  – когда флаг впервые появляется на экране, он отпускается из приподнятого положения и, качнувшись, повисает;
 *  – дальше его слегка колышет «сквозняк»; курсор (или палец) продавливает ткань и тянет её за собой, но несильно;
 *  – рисуется через WebGL: складки затеняются по наклону ткани, поверх – мелкое плетение и подгиб по краю.
 * Пока флага нет на экране или вкладка в фоне, расчёт стоит. Нет WebGL, отключена анимация в системе или что-то пошло не так –
 * остаётся обычная картинка флага (она же несёт текст слогана для экранных дикторов). */
(function(){
"use strict";
var NX=12,NY=24,COLS=NX+1,ROWS=NY+1,N=COLS*ROWS,D=1/NX;   /* полотно 1×2 в «ширинах флага» */
var MX=.2,MT=.05,MB=.18;                                    /* поля холста вокруг полотна: по бокам, сверху, снизу – место для качания */

/* ---------- ткань ---------- */
function makeCloth(){
  var p=new Float32Array(N*3),q=new Float32Array(N*3),nr=new Float32Array(N*3),c=[],t=0;
  var link=function(a,b,k){c.push(a,b,0,k)};
  for(var j=0;j<ROWS;j++)for(var i=0;i<COLS;i++){var a=j*COLS+i;
    if(i<NX)link(a,a+1,1);if(j<NY)link(a,a+COLS,1);                               /* нити вдоль и поперёк */
    if(i<NX&&j<NY){link(a,a+COLS+1,.6);link(a+1,a+COLS,.6)}                       /* диагонали – ткань не перекашивается */
    if(i<NX-1)link(a,a+2,.25);if(j<NY-1)link(a,a+2*COLS,.25)}                     /* через одну точку – ткань не сминается в гармошку */
  /* положение: полотно отведено назад на угол ang (0 – висит ровно) */
  function pose(ang){var cs=Math.cos(ang),sn=Math.sin(ang);
    for(var j=0;j<ROWS;j++)for(var i=0;i<COLS;i++){var k=(j*COLS+i)*3;p[k]=i*D;p[k+1]=j*D*cs;p[k+2]=-j*D*sn+Math.sin(i*.9)*.012*j*D;q[k]=p[k];q[k+1]=p[k+1];q[k+2]=p[k+2]}}
  pose(0);
  for(var m=0;m<c.length;m+=4){var a3=c[m]*3,b3=c[m+1]*3,dx=p[b3]-p[a3],dy=p[b3+1]-p[a3+1];c[m+2]=Math.sqrt(dx*dx+dy*dy)}
  /* шаг dt секунд; ptr – курсор: x,y в ширинах флага, vx,vy – его скорость, on – над флагом ли он */
  function step(dt,ptr){t+=dt;var dt2=dt*dt,R=.42,sp=ptr&&ptr.on?Math.min(3,Math.sqrt(ptr.vx*ptr.vx+ptr.vy*ptr.vy)):0;
    for(var j=1;j<ROWS;j++)for(var i=0;i<COLS;i++){var k=(j*COLS+i)*3,x=p[k],y=p[k+1],z=p[k+2];
      var ax=.12*Math.sin(t*.5+y*1.3),ay=9,az=.8*(y*.5)*(.55*Math.sin(t*1.25+y*2.2)+.45*Math.sin(t*.7+x*3+y*1.1));   /* сила тяжести и сквозняк */
      if(ptr&&ptr.on){var px=x-ptr.x,py=y-ptr.y,d=Math.sqrt(px*px+py*py);
        if(d<R){var w=1-d/R;w*=w;az-=(1.5+3.0*sp)*w;ax+=3.0*ptr.vx*w;ay+=1.4*ptr.vy*w}}
      var vx=(x-q[k])*.985,vy=(y-q[k+1])*.985,vz=(z-q[k+2])*.982;   /* сопротивление воздуха: флаг качается недолго */
      q[k]=x;q[k+1]=y;q[k+2]=z;p[k]=x+vx+ax*dt2;p[k+1]=y+vy+ay*dt2;p[k+2]=z+vz+az*dt2}
    for(var it=0;it<7;it++)for(var m=0;m<c.length;m+=4){var a=c[m],b=c[m+1],a3=a*3,b3=b*3;
      var dx=p[b3]-p[a3],dy=p[b3+1]-p[a3+1],dz=p[b3+2]-p[a3+2],len=Math.sqrt(dx*dx+dy*dy+dz*dz)||1e-6,f=(len-c[m+2])/len*c[m+3];
      var pa=a<COLS,pb=b<COLS;if(pa&&pb)continue;var wa=pa?0:pb?1:.5,wb=pb?0:pa?1:.5;   /* верхний ряд закреплён на рейке */
      p[a3]+=dx*f*wa;p[a3+1]+=dy*f*wa;p[a3+2]+=dz*f*wa;p[b3]-=dx*f*wb;p[b3+1]-=dy*f*wb;p[b3+2]-=dz*f*wb}}
  /* нормали – по соседним точкам: по ним шейдер затеняет складки */
  function normals(){for(var j=0;j<ROWS;j++)for(var i=0;i<COLS;i++){
    var l=(j*COLS+(i>0?i-1:i))*3,r=(j*COLS+(i<NX?i+1:i))*3,u=((j>0?j-1:j)*COLS+i)*3,d=((j<NY?j+1:j)*COLS+i)*3,k=(j*COLS+i)*3;
    var ux=p[r]-p[l],uy=p[r+1]-p[l+1],uz=p[r+2]-p[l+2],vx=p[d]-p[u],vy=p[d+1]-p[u+1],vz=p[d+2]-p[u+2];
    var nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,n=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;nr[k]=nx/n;nr[k+1]=ny/n;nr[k+2]=nz/n}
    return nr}
  return{p:p,pose:pose,step:step,normals:normals};
}
if(typeof module!=="undefined"&&module.exports){module.exports={makeCloth:makeCloth,COLS:COLS,ROWS:ROWS};return}   /* для проверки расчёта вне браузера */

/* ---------- отрисовка ---------- */
var VS="attribute vec3 aP;attribute vec3 aN;attribute vec2 aUV;uniform vec4 uM;varying vec2 vUV;varying vec3 vN;"+
  "void main(){vUV=aUV;vN=aN;float w=1.0-aP.z/4.2;gl_Position=vec4((aP.x-0.5)*uM.x,(uM.z-(aP.y+uM.w)*uM.y),0.0,w);}";
var FS="precision mediump float;uniform sampler2D uT;uniform float uW;varying vec2 vUV;varying vec3 vN;"+
  "void main(){vec3 n=normalize(vN);float back=step(n.z,0.0);n=mix(n,-n,back);"+
  "vec3 L=normalize(vec3(-0.35,-0.55,0.76));float df=max(dot(n,L),0.0);"+
  "vec3 c=texture2D(uT,vUV).rgb;"+
  "float weave=sin(vUV.x*uW)*sin(vUV.y*uW*2.0);"+                                   /* плетение: нити вдоль и поперёк */
  "float e=min(min(vUV.x,1.0-vUV.x),min(vUV.y,1.0-vUV.y)*2.0);"+                     /* расстояние до края в ширинах флага */
  "c*=(0.40+0.76*df)*(1.0+0.04*weave);"+                                            /* складки: светлее к свету, темнее в тени */
  "c*=mix(0.9,1.0,smoothstep(0.0,0.014,e))*(1.0-0.07*(1.0-smoothstep(0.0,0.0035,abs(e-0.032))));"+   /* подгиб и строчка по краю */
  "c+=pow(max(dot(n,normalize(L+vec3(0.0,0.0,1.0))),0.0),22.0)*0.09;"+              /* лёгкий блеск ткани */
  "c=mix(c,vec3(dot(c,vec3(0.333)))*0.85,back*0.3);gl_FragColor=vec4(c,1.0);}";

function start(box){
  var img=box.querySelector("img"),cv=box.querySelector("canvas");if(!img||!cv)return;
  var gl=null;try{gl=cv.getContext("webgl",{alpha:true,antialias:true,premultipliedAlpha:true})}catch(e){}
  if(!gl)return;
  function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null}
  var vs=sh(gl.VERTEX_SHADER,VS),fs=sh(gl.FRAGMENT_SHADER,FS);if(!vs||!fs)return;
  var pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return;
  gl.useProgram(pr);
  var cloth=makeCloth(),uv=new Float32Array(N*2),ix=new Uint16Array(NX*NY*6),k=0;
  for(var j=0;j<ROWS;j++)for(var i=0;i<COLS;i++){uv[(j*COLS+i)*2]=i/NX;uv[(j*COLS+i)*2+1]=j/NY}
  for(j=0;j<NY;j++)for(i=0;i<NX;i++){var a=j*COLS+i;ix[k++]=a;ix[k++]=a+1;ix[k++]=a+COLS;ix[k++]=a+1;ix[k++]=a+COLS+1;ix[k++]=a+COLS}
  function buf(name,size,data,usage){var b=gl.createBuffer(),l=gl.getAttribLocation(pr,name);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,usage);
    gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0);return b}
  var bP=buf("aP",3,cloth.p,gl.DYNAMIC_DRAW),bN=buf("aN",3,cloth.normals(),gl.DYNAMIC_DRAW);buf("aUV",2,uv,gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,ix,gl.STATIC_DRAW);
  var tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
  try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img)}catch(e){return}
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  var an=gl.getExtension("EXT_texture_filter_anisotropic");if(an)gl.texParameterf(gl.TEXTURE_2D,an.TEXTURE_MAX_ANISOTROPY_EXT,4);
  var uM=gl.getUniformLocation(pr,"uM"),uW=gl.getUniformLocation(pr,"uW");
  gl.uniform4f(uM,2/(1+2*MX),2/(2+MT+MB),1,MT);gl.clearColor(0,0,0,0);

  var ptr={x:0,y:0,vx:0,vy:0,on:false,t:0},seen=false,live=false,raf=0,last=0,acc=0,dead=false;
  function size(){var r=cv.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(2,Math.round(r.width*dpr)),h=Math.max(2,Math.round(r.height*dpr));
    if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
    gl.viewport(0,0,w,h);gl.uniform1f(uW,6.2832*(w/(1+2*MX))/3.2)}   /* нить плетения ≈ 3 точки экрана */
  function draw(){gl.bindBuffer(gl.ARRAY_BUFFER,bP);gl.bufferSubData(gl.ARRAY_BUFFER,0,cloth.p);
    gl.bindBuffer(gl.ARRAY_BUFFER,bN);gl.bufferSubData(gl.ARRAY_BUFFER,0,cloth.normals());
    gl.clear(gl.COLOR_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,ix.length,gl.UNSIGNED_SHORT,0)}
  function advance(sec){acc+=Math.min(sec,.05);var n=0;
    if(performance.now()-ptr.t>90){ptr.vx*=.8;ptr.vy*=.8}                            /* курсор остановился – его «ветер» стихает */
    while(acc>=1/60&&n++<3){cloth.step(1/60,ptr);acc-=1/60}}
  function frame(ts){raf=0;if(!live||dead)return;advance(last?(ts-last)/1000:1/60);last=ts;draw();raf=requestAnimationFrame(frame)}
  function run(on){live=on&&!document.hidden;if(live&&!raf){last=0;raf=requestAnimationFrame(frame)}}
  function fallback(){dead=true;box.classList.remove("gl","go")}                      /* снова обычная картинка */
  size();draw();box.classList.add("gl");
  cv.addEventListener("webglcontextlost",function(e){e.preventDefault();fallback()});
  window.addEventListener("resize",function(){if(!dead){size();draw()}});
  /* первый показ: полотно отведено назад и отпущено */
  var io=new IntersectionObserver(function(ens){var en=ens[ens.length-1];
    if(en.isIntersecting&&en.intersectionRatio>=.3&&!seen){seen=true;size();cloth.pose(.65);box.classList.add("go")}
    run(en.isIntersecting&&seen)},{threshold:[0,.3]});
  io.observe(box);
  function inView(){var r=box.getBoundingClientRect();return r.bottom>0&&r.top<window.innerHeight}
  document.addEventListener("visibilitychange",function(){run(seen&&inView())});
  window.addEventListener("pointermove",function(e){var r=box.getBoundingClientRect(),w=r.width||1,x=(e.clientX-r.left)/w,y=(e.clientY-r.top)/w,now=performance.now();
    var on=x>-.35&&x<1.35&&y>-.2&&y<2.3,dt=Math.max(8,now-ptr.t)/1000;
    if(on&&ptr.on&&dt<.2){var vx=(x-ptr.x)/dt,vy=(y-ptr.y)/dt;ptr.vx+=(Math.max(-3,Math.min(3,vx))-ptr.vx)*.35;ptr.vy+=(Math.max(-3,Math.min(3,vy))-ptr.vy)*.35}else{ptr.vx=ptr.vy=0}
    ptr.x=x;ptr.y=y;ptr.on=on;ptr.t=now},{passive:true});
  document.addEventListener("pointerleave",function(){ptr.on=false});
  /* для проверки без requestAnimationFrame: прогнать sec секунд расчёта и нарисовать кадр */
  cv._play=function(sec,pose){if(pose!=null){cloth.pose(pose);box.classList.add("go")}size();for(var s=0;s<sec*60;s++)cloth.step(1/60,ptr);draw()};
}
function init(){
  if(!window.WebGLRenderingContext||!("IntersectionObserver" in window))return;
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var l=document.querySelectorAll(".flag");
  for(var i=0;i<l.length;i++)(function(box){var img=box.querySelector("img");if(!img)return;
    var go=function(){try{start(box)}catch(e){box.classList.remove("gl","go")}};
    if(img.complete&&img.naturalWidth)go();else img.addEventListener("load",go,{once:true})})(l[i]);
}
init();
})();
