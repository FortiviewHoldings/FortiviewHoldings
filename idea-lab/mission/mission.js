// Mission Control: the page script, kept in its own file. The studio importer rewrites every url(...),
// src=, and href= it finds anywhere in a page's HTML, inline script text included, which broke this
// script once imported (G5 #19). A separate .js file is stored verbatim, so the script survives the import.
(function () {
  IdeaLab.starfield("il-stars");
  IdeaLab.nav("mission", "..");
  IdeaLab.disclosure("il-disclose-mount");
  var esc = IdeaLab.esc;

  var KEY = "ideaLab.mission.v1";
  var EMOJIS = ["🚀","💡","🐶","🎮","🌟","🍪","🌱","🎨","🤖","⚽","🎵","🛹"];
  var SVGS = {
    star: '<polygon points="12,2 14.9,8.6 22,9.3 16.5,14 18.2,21 12,17.3 5.8,21 7.5,14 2,9.3 9.1,8.6" fill="currentColor"/>',
    sparkle: '<path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="currentColor"/>',
    bolt: '<polygon points="13,2 4,14 11,14 9,22 20,9 13,9" fill="currentColor"/>',
    heart: '<path d="M12 21 C12 21 4 13.5 4 8.5 A4 4 0 0 1 12 6 A4 4 0 0 1 20 8.5 C20 13.5 12 21 12 21 Z" fill="currentColor"/>',
    planet: '<g transform="rotate(-20 12 12)"><ellipse cx="12" cy="12" rx="11" ry="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="6" fill="currentColor"/></g>',
    bulb: '<circle cx="12" cy="9.5" r="6" fill="currentColor"/><rect x="9" y="14.5" width="6" height="5.5" rx="1.5" fill="currentColor"/>',
    globe: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/><ellipse cx="12" cy="12" rx="4" ry="10" fill="none" stroke="currentColor" stroke-width="1.4"/><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.4"/>',
    diamond: '<polygon points="12,2 22,9 12,22 2,9" fill="currentColor"/>',
    drop: '<path d="M12 2 C12 2 5 11 5 15 a7 7 0 0 0 14 0 C19 11 12 2 12 2 Z" fill="currentColor"/>'
  };
  var PRESETS = ["#7c5cff","#3ee0ff","#46e0a8","#ff6ea9","#ffb454","#21bca5"];
  var STAGES = [
    { t: "Spot the problem", p: "Who has this problem, and how do you know it is real?" },
    { t: "Sketch the build", p: "What is the simplest version you could make this week?" },
    { t: "Make a tiny one",  p: "Build the smallest real thing: a drawing, a paper model, a one-page site." },
    { t: "Show three people", p: "Ask three people to try it. Write what they said." },
    { t: "Improve one thing", p: "Change one thing based on what you heard. What did you change?" },
    { t: "Tell the world",    p: "How will people find out about it? One sentence." }
  ];

  /* ---- state ---- */
  var state = { name:"", tagline:"", what:"", who:"", cta:"", maker:"",
    logoType:"emoji", emoji:"🚀", svgKey:"planet", photo:"",
    baseColor:"#7c5cff", harmony:"triad", bgStyle:"aurora", bgImage:"", stages:[] };
  STAGES.forEach(function(){ state.stages.push({ text:"", done:false }); });
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var s = JSON.parse(raw);
      ["name","tagline","what","who","cta","maker","logoType","emoji","svgKey","photo","baseColor","harmony","bgStyle","bgImage"].forEach(function(k){ if (s[k] != null) state[k] = s[k]; });
      if (Array.isArray(s.stages)) s.stages.forEach(function(x,i){ if (state.stages[i]) state.stages[i] = { text:x.text||"", done:!!x.done }; });
    }
  } catch (e) {}
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  /* ---- color math ---- */
  function hexToHsl(hex){
    hex = String(hex).replace("#",""); if (hex.length===3) hex = hex.split("").map(function(c){return c+c;}).join("");
    var r=parseInt(hex.substr(0,2),16)/255, g=parseInt(hex.substr(2,2),16)/255, b=parseInt(hex.substr(4,2),16)/255;
    var mx=Math.max(r,g,b), mn=Math.min(r,g,b), h=0, sat=0, l=(mx+mn)/2;
    if (mx!==mn){ var d=mx-mn; sat = l>0.5 ? d/(2-mx-mn) : d/(mx+mn);
      if (mx===r) h=(g-b)/d+(g<b?6:0); else if (mx===g) h=(b-r)/d+2; else h=(r-g)/d+4; h/=6; }
    return [h*360, sat*100, l*100];
  }
  function hslToHex(h,s,l){
    h=((h%360)+360)%360; s/=100; l/=100;
    var c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2, r,g,b;
    if (h<60){r=c;g=x;b=0;} else if (h<120){r=x;g=c;b=0;} else if (h<180){r=0;g=c;b=x;}
    else if (h<240){r=0;g=x;b=c;} else if (h<300){r=x;g=0;b=c;} else {r=c;g=0;b=x;}
    function to(v){ return ("0"+Math.round((v+m)*255).toString(16)).slice(-2); }
    return "#"+to(r)+to(g)+to(b);
  }
  function palette(){
    var hsl = hexToHsl(state.baseColor), h = hsl[0], sat = Math.max(60, hsl[1]);
    var offs = state.harmony==="quad" ? [0,90,180,270] : [0,120,240];
    var cols = offs.map(function(o){ return hslToHex(h+o, sat, 62); });
    return {
      cols: cols,
      bg: hslToHex(h, 34, 7),
      ink: hslToHex(h, 22, 96),
      muted: hslToHex(h, 16, 72),
      accent: "linear-gradient(120deg,"+cols[0]+","+cols[1]+")",
      solid: cols[0],
      second: cols[2 % cols.length] || cols[0],
      btnInk: hslToHex(h, 40, 8)
    };
  }

  /* ---- logo + background css for the generated site ---- */
  function logoMarkup(size, color){
    if (state.logoType==="photo" && state.photo)
      return '<img src="'+state.photo+'" alt="" style="width:'+size+'px;height:'+size+'px;object-fit:cover;border-radius:22%;display:inline-block;vertical-align:middle">';
    if (state.logoType==="svg" && SVGS[state.svgKey])
      return '<span style="display:inline-block;width:'+size+'px;height:'+size+'px;color:'+color+';vertical-align:middle;line-height:0"><svg viewBox="0 0 24 24" width="'+size+'" height="'+size+'">'+SVGS[state.svgKey]+'</svg></span>';
    return '<span style="font-size:'+size+'px;line-height:1;vertical-align:middle">'+esc(state.emoji||"🚀")+'</span>';
  }
  function heroBgCss(p){
    if (state.bgStyle==="image" && state.bgImage)
      return 'position:relative;background:'+p.bg+';';
    if (state.bgStyle==="glow")
      return 'background:radial-gradient(700px 460px at 50% -8%,'+p.solid+'44,'+p.bg+' 62%);';
    if (state.bgStyle==="grid")
      return 'background:'+p.bg+';background-image:linear-gradient(#ffffff10 1px,transparent 1px),linear-gradient(90deg,#ffffff10 1px,transparent 1px);background-size:26px 26px;';
    return 'background:radial-gradient(900px 520px at 72% -10%,'+p.cols[1]+'2e,transparent 55%),radial-gradient(700px 500px at 18% 0%,'+p.solid+'2a,transparent 55%),'+p.bg+';';
  }
  function bgImageLayer(){
    if (state.bgStyle==="image" && state.bgImage)
      return '<div style="position:absolute;inset:0;z-index:0;background:url('+state.bgImage+') center/cover no-repeat;filter:blur(26px) brightness(.45);transform:scale(1.18)"></div>';
    return "";
  }

  function val(v, def){ return esc((v && v.trim()) ? v : def); }
  function slug(){ return (state.name || "my-idea").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "my-idea"; }

  /* ---- artifact builders ---- */
  function siteHTML(){
    var p = palette();
    var name = val(state.name, "My Big Idea");
    var tag  = val(state.tagline, state.name || "A brand new idea");
    var what = val(state.what, "Tell people what your idea does in a sentence or two.");
    var cta  = val(state.cta, "Try it");
    var who  = state.who.trim() ? esc(state.who) : "";
    var maker = state.maker.trim() ? esc(state.maker) : "";
    return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1"><title>'+name+'</title><style>' +
      'body{margin:0;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:'+p.bg+';color:'+p.ink+'}*{box-sizing:border-box}' +
      '.bar{position:relative;z-index:1;display:flex;align-items:center;gap:10px;padding:16px 24px;border-bottom:1px solid #ffffff14}' +
      '.bar b{font-weight:800}.bar nav{margin-left:auto;display:flex;gap:18px;color:'+p.muted+';font-size:14px}' +
      '.hero{'+heroBgCss(p)+'overflow:hidden;padding:74px 24px 78px;text-align:center}' +
      '.in{position:relative;z-index:1;max-width:820px;margin:0 auto}' +
      '.logo{margin-bottom:6px}' +
      '.hero h1{font-size:clamp(30px,6vw,54px);margin:.3em 0;line-height:1.05}' +
      '.tag{background:'+p.accent+';-webkit-background-clip:text;background-clip:text;color:transparent}' +
      '.hero p{font-size:clamp(16px,2.4vw,20px);color:'+p.muted+';max-width:60ch;margin:0 auto 28px}' +
      '.cta{display:inline-block;padding:15px 30px;border-radius:999px;background:'+p.accent+';color:'+p.btnInk+';font-weight:800;text-decoration:none;cursor:pointer}' +
      '.who{margin-top:30px;display:inline-block;padding:10px 18px;border:1px solid '+p.second+'66;border-radius:999px;color:'+p.muted+'}' +
      'footer{text-align:center;color:'+p.muted+';padding:30px;border-top:1px solid #ffffff14;font-size:14px}' +
      '</style></head><body>' +
      '<header class="bar">'+logoMarkup(26,p.solid)+'<b>'+name+'</b><nav><span>Home</span><span>About</span><span>'+cta+'</span></nav></header>' +
      '<section class="hero">'+bgImageLayer()+'<div class="in"><div class="logo">'+logoMarkup(78,p.solid)+'</div>' +
      '<h1><span class="tag">'+tag+'</span></h1><p>'+what+'</p><a class="cta">'+cta+'</a>' +
      (who ? '<div class="who">Made for '+who+'</div>' : '') + '</div></section>' +
      '<footer>'+(maker ? 'Made by '+maker+' · ' : '')+'An Idea Lab project</footer></body></html>';
  }
  function toolbar(){
    return '<div class="noprint" style="position:fixed;top:0;left:0;right:0;background:#11151c;color:#fff;padding:10px 16px;font-family:system-ui,sans-serif;font-size:14px;display:flex;gap:12px;align-items:center;z-index:9">' +
      '<button onclick="window.print()" style="font:inherit;font-weight:700;cursor:pointer;border:0;border-radius:8px;padding:8px 16px;background:#21bca5;color:#04060d">🖨️ Print / Save as PDF</button>' +
      '<span style="opacity:.85">In the dialog, choose <b>Save as PDF</b>.</span></div><style>@media print{.noprint{display:none!important}}</style>';
  }
  function flyerHTML(){
    var p = palette();
    var name = val(state.name,"My Big Idea"), tag = val(state.tagline, state.name||"A brand new idea");
    var what = val(state.what,"Tell people what your idea does."), cta = val(state.cta,"Try it");
    var who = state.who.trim()?esc(state.who):"", maker = state.maker.trim()?esc(state.maker):"";
    return '<!doctype html><html><head><meta charset="utf-8"><title>'+name+' | flyer</title><style>' +
      '@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:system-ui,Segoe UI,Roboto,sans-serif;background:#2a2f3a;padding:70px 16px 24px;display:flex;flex-direction:column;align-items:center}' +
      '.page{position:relative;overflow:hidden;width:210mm;min-height:297mm;'+heroBgCss(p)+'color:'+p.ink+';padding:34mm 24mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:16px;box-shadow:0 20px 60px #0008}' +
      '.in{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:16px}' +
      'h1{font-size:56px;margin:0;line-height:1.04}.tag{font-size:27px;font-weight:800;background:'+p.accent+';-webkit-background-clip:text;background-clip:text;color:transparent}' +
      '.what{font-size:21px;color:'+p.muted+';max-width:80%}.cta{margin-top:8px;padding:17px 38px;border-radius:14px;background:'+p.accent+';color:'+p.btnInk+';font-weight:800;font-size:23px}' +
      '.who{color:'+p.muted+';font-size:18px}.by{margin-top:14px;color:'+p.muted+';font-size:15px}' +
      '@media print{body{background:#fff;padding:0}.page{box-shadow:none;width:auto;min-height:100vh}}' +
      '</style></head><body>'+toolbar()+'<div class="page">'+bgImageLayer()+'<div class="in"><div>'+logoMarkup(135,p.solid)+'</div><h1>'+name+'</h1>' +
      '<div class="tag">'+tag+'</div><div class="what">'+what+'</div><div class="cta">'+cta+'</div>' +
      (who?'<div class="who">Made for '+who+'</div>':'')+'<div class="by">'+(maker?'Made by '+maker+' · ':'')+'An Idea Lab project</div></div></div></body></html>';
  }
  function cardsHTML(){
    var p = palette();
    var name = val(state.name,"My Big Idea"), tag = val(state.tagline, state.name||"A brand new idea");
    var maker = state.maker.trim()?esc(state.maker):"";
    var one = '<div class="card"><div class="top">'+logoMarkup(26,p.solid)+'<span class="nm">'+name+'</span></div>' +
      '<div class="tg">'+tag+'</div><div class="by">'+(maker?esc(state.maker)+' · ':'')+'An Idea Lab project</div></div>';
    var cards=""; for (var i=0;i<10;i++) cards+=one;
    return '<!doctype html><html><head><meta charset="utf-8"><title>'+name+' | business cards</title><style>' +
      '@page{size:A4;margin:8mm}*{box-sizing:border-box}body{margin:0;font-family:system-ui,Segoe UI,Roboto,sans-serif;background:#2a2f3a;padding:70px 16px 24px;display:flex;flex-direction:column;align-items:center}' +
      '.sheet{display:grid;grid-template-columns:repeat(2,85mm);gap:6mm;background:#fff;padding:8mm;border-radius:6px;box-shadow:0 20px 60px #0008}' +
      '.card{width:85mm;height:54mm;border:1px dashed #c9c9c9;border-radius:9px;padding:7mm;display:flex;flex-direction:column;gap:3mm;justify-content:center;'+heroBgCss(p)+'color:'+p.ink+';overflow:hidden}' +
      '.card .top{display:flex;align-items:center;gap:9px}.card .nm{font-weight:800;font-size:15pt}.card .tg{font-size:10.5pt;color:'+p.muted+'}.card .by{margin-top:auto;font-size:8.5pt;color:'+p.muted+'}' +
      '@media print{body{background:#fff;padding:0}.sheet{box-shadow:none;padding:0;border-radius:0}}' +
      '</style></head><body>'+toolbar()+'<div class="sheet">'+cards+'</div></body></html>';
  }

  /* ---- exports ---- */
  function openDoc(html){ var w=window.open("","_blank"); if(!w){ alert("Please allow pop-ups to open this."); return; } w.document.open(); w.document.write(html); w.document.close(); }
  function downloadHTML(fn, html){ var b=new Blob([html],{type:"text/html"}), u=URL.createObjectURL(b), a=document.createElement("a"); a.href=u; a.download=fn; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function(){URL.revokeObjectURL(u);},1500); }
  function made(){ IdeaLab.award("brandsmith", 60); }
  document.getElementById("exOpen").addEventListener("click", function(){ openDoc(siteHTML()); made(); });
  document.getElementById("exHtml").addEventListener("click", function(){ downloadHTML(slug()+".html", siteHTML()); made(); });
  document.getElementById("exFlyer").addEventListener("click", function(){ openDoc(flyerHTML()); made(); });
  document.getElementById("exCards").addEventListener("click", function(){ openDoc(cardsHTML()); made(); });

  /* ---- live preview ---- */
  var frame = document.getElementById("siteFrame"), urlEl = document.getElementById("siteUrl"), tmr;
  function renderPreview(){ frame.srcdoc = siteHTML(); urlEl.textContent = slug()+".example"; drawPalette(); }
  function schedulePreview(){ clearTimeout(tmr); tmr=setTimeout(renderPreview,160); }
  function drawPalette(){
    var p = palette(), row = document.getElementById("paletteRow"); row.innerHTML="";
    p.cols.forEach(function(c){ var s=document.createElement("span"); s.style.background=c; row.appendChild(s); });
  }

  /* ---- text fields ---- */
  function bindInput(id, field){ var el=document.getElementById(id); el.value=state[field]||""; el.addEventListener("input", function(){ state[field]=el.value; save(); schedulePreview(); }); }
  bindInput("bName","name"); bindInput("bTag","tagline"); bindInput("bWhat","what"); bindInput("bWho","who"); bindInput("bCta","cta"); bindInput("bMaker","maker");

  /* ---- logo pickers ---- */
  var logoEmoji = document.getElementById("logoEmoji"), logoSvg = document.getElementById("logoSvg");
  EMOJIS.forEach(function(em){
    var b=document.createElement("button"); b.type="button"; b.className="emoji"+(em===state.emoji?" sel":""); b.textContent=em;
    b.addEventListener("click", function(){ state.emoji=em; state.logoType="emoji"; save(); setLogoTab("emoji"); markSel(logoEmoji,b); renderPreview(); });
    logoEmoji.appendChild(b);
  });
  Object.keys(SVGS).forEach(function(key){
    var b=document.createElement("button"); b.type="button"; b.className="emoji"+(key===state.svgKey&&state.logoType==="svg"?" sel":"");
    b.innerHTML='<svg viewBox="0 0 24 24" style="color:var(--plasma)">'+SVGS[key]+'</svg>';
    b.addEventListener("click", function(){ state.svgKey=key; state.logoType="svg"; save(); setLogoTab("svg"); markSel(logoSvg,b); renderPreview(); });
    logoSvg.appendChild(b);
  });
  function markSel(container, btn){ container.querySelectorAll(".emoji").forEach(function(x){x.classList.remove("sel");}); btn.classList.add("sel"); }
  function setLogoTab(lt){
    state.logoType = lt;
    document.querySelectorAll("#logoTabs .miniTab").forEach(function(t){ t.classList.toggle("active", t.dataset.lt===lt); });
    document.getElementById("logoEmoji").classList.toggle("hidden", lt!=="emoji");
    document.getElementById("logoSvg").classList.toggle("hidden", lt!=="svg");
    document.getElementById("logoPhoto").classList.toggle("hidden", lt!=="photo");
  }
  document.querySelectorAll("#logoTabs .miniTab").forEach(function(t){ t.addEventListener("click", function(){ setLogoTab(t.dataset.lt); save(); renderPreview(); }); });

  /* ---- image upload (downscaled, kept local) ---- */
  function loadImage(file, maxDim, mime, cb){
    var rd=new FileReader();
    rd.onload=function(e){ var img=new Image(); img.onload=function(){
      var sc=Math.min(1, maxDim/Math.max(img.width,img.height));
      var w=Math.round(img.width*sc), h=Math.round(img.height*sc);
      var c=document.createElement("canvas"); c.width=w; c.height=h; c.getContext("2d").drawImage(img,0,0,w,h);
      cb(c.toDataURL(mime, 0.72)); }; img.src=e.target.result; };
    rd.readAsDataURL(file);
  }
  document.getElementById("photoInput").addEventListener("change", function(){
    if (!this.files || !this.files[0]) return;
    loadImage(this.files[0], 200, "image/png", function(url){
      state.photo=url; state.logoType="photo"; save();
      var th=document.getElementById("photoThumb"); th.src=url; th.classList.remove("hidden");
      setLogoTab("photo"); renderPreview();
    });
  });
  document.getElementById("bgInput").addEventListener("change", function(){
    if (!this.files || !this.files[0]) return;
    loadImage(this.files[0], 1000, "image/jpeg", function(url){
      state.bgImage=url; state.bgStyle="image"; save();
      var th=document.getElementById("bgThumb"); th.src=url; th.classList.remove("hidden");
      setBg("image"); renderPreview();
    });
  });

  /* ---- color controls: native swatch + hex field + HSL sliders, all kept in sync ---- */
  var baseColor = document.getElementById("baseColor");
  var hexInput = document.getElementById("hexInput");
  var hueR = document.getElementById("hueR"), satR = document.getElementById("satR"), litR = document.getElementById("litR");
  function validHex(v){ v = String(v).replace("#","").trim();
    if (/^[0-9a-fA-F]{3}$/.test(v)) v = v.split("").map(function(c){ return c+c; }).join("");
    return /^[0-9a-fA-F]{6}$/.test(v) ? "#"+v.toLowerCase() : null; }
  function trackGrads(hex){ var hsl=hexToHsl(hex), h=hsl[0], l=Math.min(Math.max(hsl[2],22),78);
    satR.style.background="linear-gradient(90deg,"+hslToHex(h,0,l)+","+hslToHex(h,100,l)+")";
    litR.style.background="linear-gradient(90deg,#05070c,"+hslToHex(h,Math.max(55,hsl[1]),52)+",#ffffff)"; }
  function setColor(hex, src){ var v = validHex(hex); if (!v) return;
    state.baseColor = v;
    if (src!=="native") baseColor.value = v;
    if (src!=="hex") hexInput.value = v;
    if (src!=="slider"){ var hsl=hexToHsl(v); hueR.value=Math.round(hsl[0]); satR.value=Math.round(hsl[1]); litR.value=Math.round(hsl[2]); }
    trackGrads(v); save(); schedulePreview(); }
  baseColor.value = state.baseColor; hexInput.value = state.baseColor;
  (function(){ var hsl=hexToHsl(state.baseColor); hueR.value=Math.round(hsl[0]); satR.value=Math.round(hsl[1]); litR.value=Math.round(hsl[2]); trackGrads(state.baseColor); })();
  baseColor.addEventListener("input", function(){ setColor(baseColor.value, "native"); });
  hexInput.addEventListener("input", function(){ if (validHex(hexInput.value)) setColor(hexInput.value, "hex"); });
  hexInput.addEventListener("blur", function(){ hexInput.value = state.baseColor; });
  [hueR, satR, litR].forEach(function(s){ s.addEventListener("input", function(){ setColor(hslToHex(+hueR.value, +satR.value, +litR.value), "slider"); }); });
  document.querySelectorAll("#harmonySeg button").forEach(function(b){
    if (b.dataset.h===state.harmony) b.classList.add("on"); else b.classList.remove("on");
    b.addEventListener("click", function(){
      state.harmony=b.dataset.h; save();
      document.querySelectorAll("#harmonySeg button").forEach(function(x){ x.classList.toggle("on", x===b); });
      renderPreview();
    });
  });
  var presetRow = document.getElementById("presetRow");
  PRESETS.forEach(function(col){
    var b=document.createElement("button"); b.type="button"; b.className="swatch"; b.style.background=col; b.setAttribute("aria-label","preset "+col);
    b.addEventListener("click", function(){ setColor(col, "preset"); });
    presetRow.appendChild(b);
  });

  /* ---- background controls ---- */
  function setBg(bg){
    state.bgStyle=bg;
    document.querySelectorAll("#bgSeg button").forEach(function(x){ x.classList.toggle("on", x.dataset.bg===bg); });
    document.getElementById("bgPhotoWrap").style.opacity = bg==="image" ? "1" : ".55";
  }
  document.querySelectorAll("#bgSeg button").forEach(function(b){
    b.addEventListener("click", function(){ setBg(b.dataset.bg); save(); renderPreview(); });
  });

  /* ---- size toggle ---- */
  document.querySelectorAll("#sizeSeg button").forEach(function(b){
    b.addEventListener("click", function(){
      document.querySelectorAll("#sizeSeg button").forEach(function(x){ x.classList.toggle("on", x===b); });
      document.getElementById("device").className = "device " + b.dataset.size;
    });
  });

  /* ---- restore visual state then first render ---- */
  setLogoTab(state.logoType);
  (function(){ var th=document.getElementById("photoThumb"); if(state.photo){ th.src=state.photo; th.classList.remove("hidden"); }
    var bt=document.getElementById("bgThumb"); if(state.bgImage){ bt.src=state.bgImage; bt.classList.remove("hidden"); } })();
  setBg(state.bgStyle);
  renderPreview();

  /* ---- tabs ---- */
  var studio=document.getElementById("studio"), plan=document.getElementById("plan");
  var tabStudio=document.getElementById("tabStudio"), tabPlan=document.getElementById("tabPlan");
  function showTab(which){ var s=which==="studio"; studio.hidden=!s; plan.hidden=s; tabStudio.classList.toggle("active",s); tabPlan.classList.toggle("active",!s); }
  tabStudio.addEventListener("click", function(){ showTab("studio"); });
  tabPlan.addEventListener("click", function(){ showTab("plan"); });

  /* ---- plan (quest map) ---- */
  var questsEl=document.getElementById("quests");
  STAGES.forEach(function(stg,i){
    var q=document.createElement("div"); q.className="quest"+(state.stages[i].done?" done":"");
    q.innerHTML='<div class="quest__top"><span class="quest__num">'+(i+1)+'</span><h3>'+esc(stg.t)+'</h3>'+
      '<button class="donebtn" type="button">'+(state.stages[i].done?"Done ✓":"Mark done")+'</button></div>'+
      '<p>'+esc(stg.p)+'</p><textarea placeholder="Your notes...">'+esc(state.stages[i].text)+'</textarea>';
    q.querySelector("textarea").addEventListener("input", function(){ state.stages[i].text=this.value; save(); });
    var btn=q.querySelector(".donebtn");
    btn.addEventListener("click", function(){ state.stages[i].done=!state.stages[i].done; q.classList.toggle("done",state.stages[i].done); btn.textContent=state.stages[i].done?"Done ✓":"Mark done"; save(); updatePlan(); });
    questsEl.appendChild(q);
  });
  function updatePlan(){ var d=state.stages.filter(function(s){return s.done;}).length;
    document.getElementById("bar").style.width=(d/STAGES.length*100)+"%";
    document.getElementById("progTxt").textContent=d+" of "+STAGES.length+" done";
    if (state.name.trim() && d===STAGES.length) IdeaLab.award("mission-logged",60);
  }
  updatePlan();

  document.getElementById("resetBtn").addEventListener("click", function(){
    if (!confirm("Start a new mission? This clears the idea saved in this browser.")) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    window.location.reload();
  });
})();
