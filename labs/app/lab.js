/* Shared helpers for the lab applets. Loaded in <head>: applies the site theme
   before first paint, then offers small canvas and colour utilities as window.Lab. */
(function(){
  var k="ac-theme",t=null,v=/^(dark|light)$/,root=document.documentElement;
  try{var m=/[?&]theme=(dark|light)/.exec(location.search);if(m)t=m[1]}catch(e){}
  if(!t)try{t=localStorage.getItem(k)}catch(e){}
  if(!t)try{t=sessionStorage.getItem(k)}catch(e){}
  if(!t)try{var c=/(?:^|; )ac-theme=(dark|light)/.exec(document.cookie);if(c)t=c[1]}catch(e){}
  if(!t)try{var w=/ac-theme=(dark|light)/.exec(window.name||"");if(w)t=w[1]}catch(e){}
  if(t&&v.test(t))root.setAttribute("data-theme",t);
  var cbs=[];
  function fire(){cbs.forEach(function(f){try{f();}catch(e){}});}
  addEventListener("message",function(e){var d=e.data;if(d&&typeof d.acTheme==="string"&&v.test(d.acTheme)){root.setAttribute("data-theme",d.acTheme);}});
  addEventListener("storage",function(e){if(e.key===k&&e.newValue&&v.test(e.newValue))root.setAttribute("data-theme",e.newValue);});
  try{if(window.frameElement&&window.frameElement.classList.contains("lab-frame"))root.classList.add("embedded");}catch(e){}
  addEventListener("DOMContentLoaded",function(){
    if(window.top===window.self){var b=document.querySelector(".ac-back");if(b)b.hidden=false;}
    new MutationObserver(fire).observe(root,{attributes:true,attributeFilter:["data-theme"]});
    if(window.matchMedia)matchMedia("(prefers-color-scheme: dark)").addEventListener("change",fire);
  });
  function css(n){return getComputedStyle(root).getPropertyValue(n).trim();}
  function rgb(c){c=(c||"").trim();if(c[0]==="#"){if(c.length===4)c="#"+c[1]+c[1]+c[2]+c[2]+c[3]+c[3];return[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];}var m=c.match(/[\d.]+/g)||[0,0,0];return[+m[0],+m[1],+m[2]];}
  function mix(a,b,t){if(typeof a==="string")a=rgb(a);if(typeof b==="string")b=rgb(b);return"rgb("+Math.round(a[0]+(b[0]-a[0])*t)+","+Math.round(a[1]+(b[1]-a[1])*t)+","+Math.round(a[2]+(b[2]-a[2])*t)+")";}
  function setup(cv,maxDpr){var dpr=Math.min(window.devicePixelRatio||1,maxDpr||2),w=cv.clientWidth||400,h=cv.clientHeight||300;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);var c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);return{ctx:c,w:w,h:h,dpr:dpr};}
  function isDark(){var a=root.getAttribute("data-theme");if(a)return a==="dark";return!!(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches);}
  function pressed(sel,test){document.querySelectorAll(sel).forEach(function(b){b.setAttribute("aria-pressed",String(!!test(b)));});}
  function local(cv,ev){var r=cv.getBoundingClientRect();return[ev.clientX-r.left,ev.clientY-r.top];}
  var SUP="⁰¹²³⁴⁵⁶⁷⁸⁹",SUB="₀₁₂₃₄₅₆₇₈₉";
  function sup(n){return String(n).replace(/-/g,"⁻").replace(/\d/g,function(d){return SUP[+d];});}
  function sub(n){return String(n).replace(/\d/g,function(d){return SUB[+d];});}
  window.Lab={css:css,rgb:rgb,mix:mix,setup:setup,isDark:isDark,onTheme:function(f){cbs.push(f);},pressed:pressed,local:local,sup:sup,sub:sub,
    reduce:!!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches),font:function(px,w){return(w?w+" ":"")+px+"px "+css("--f-mono");}};
})();
