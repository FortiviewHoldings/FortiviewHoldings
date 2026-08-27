// The Pulse DNA orb, ported verbatim from the Field Node Manager demo
// (helpers.js drawOrb). A glowing sphere with a double-helix inside; `phase`
// advances to animate it.
export const ORB_P = "#38ffb3";
export const ORB_S = "#bf7dff";

export function drawOrb(cv, phase) {
var ctx=cv.getContext("2d"),w=cv.width,h=cv.height;ctx.clearRect(0,0,w,h);
    var cx=w*.5,cy=h*.5,r=Math.min(w,h)*.46,iR=r*.84;
    ctx.save();ctx.shadowColor=ORB_P;ctx.shadowBlur=12;ctx.globalAlpha=.30;ctx.fillStyle=ORB_P;ctx.beginPath();ctx.arc(cx,cy,r*1.05,0,Math.PI*2);ctx.fill();ctx.restore();
    var sh=ctx.createRadialGradient(cx-r*.32,cy-r*.36,r*.05,cx,cy,r);
    sh.addColorStop(0,"#66ffffff");sh.addColorStop(.16,"#2f38ffb3");sh.addColorStop(.48,"#160b141b");sh.addColorStop(.78,"#32170b27");sh.addColorStop(1,"#7710161a");
    ctx.fillStyle=sh;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,iR,0,Math.PI*2);ctx.clip();
    var d=30,sx=cx-iR*.82,ex=cx+iR*.82,amp=iR*.30,dr=Math.max(1.15,r*.040);ctx.lineWidth=Math.max(1,r*.035);ctx.lineCap="round";
    ctx.globalAlpha=.28;ctx.strokeStyle=ORB_P;ctx.beginPath();for(var a=0;a<d;a++){var na=a/(d-1),xa=sx+(ex-sx)*na,ya=cy+Math.sin(na*Math.PI*4+phase)*amp;a?ctx.lineTo(xa,ya):ctx.moveTo(xa,ya);}ctx.stroke();
    ctx.globalAlpha=.28;ctx.strokeStyle=ORB_S;ctx.beginPath();for(var b=0;b<d;b++){var nb=b/(d-1),xb=sx+(ex-sx)*nb,yb=cy-Math.sin(nb*Math.PI*4+phase)*amp;b?ctx.lineTo(xb,yb):ctx.moveTo(xb,yb);}ctx.stroke();
    for(var i=0;i<d;i++){var n=i/(d-1),x=sx+(ex-sx)*n,wv=Math.sin(n*Math.PI*4+phase),yA=cy+wv*amp,yB=cy-wv*amp,dA=(wv+1)*.5,dB=1-dA;
      if(i%3===0){ctx.globalAlpha=.20;ctx.strokeStyle="#d9ffffff";ctx.lineWidth=Math.max(.8,r*.022);ctx.beginPath();ctx.moveTo(x,yA);ctx.lineTo(x,yB);ctx.stroke();}
      ctx.globalAlpha=.44+dA*.48;ctx.fillStyle=ORB_P;ctx.beginPath();ctx.arc(x,yA,dr*(.76+dA*.56),0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.44+dB*.48;ctx.fillStyle=ORB_S;ctx.beginPath();ctx.arc(x,yB,dr*(.76+dB*.56),0,Math.PI*2);ctx.fill();}
    ctx.restore();
    ctx.globalAlpha=.35;ctx.strokeStyle="#f0ffffff";ctx.lineWidth=Math.max(1,r*.025);ctx.beginPath();ctx.arc(cx-r*.18,cy-r*.22,r*.52,Math.PI*1.12,Math.PI*1.70);ctx.stroke();
    ctx.globalAlpha=1;ctx.lineWidth=Math.max(1,r*.035);ctx.strokeStyle=ORB_S;ctx.beginPath();ctx.arc(cx,cy,r*.98,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=.42;ctx.strokeStyle=ORB_P;ctx.lineWidth=Math.max(1,r*.018);ctx.beginPath();ctx.arc(cx,cy,r*.78,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
}
