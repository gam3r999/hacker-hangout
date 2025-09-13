// ===== CONFIG =====
window.ADMINS = { "adminsonlylol": "thisadminwilleventuallybeabused" };

// Firebase config (kept intact)
const firebaseConfig = {
  apiKey: "AIzaSyCiINrjPrVNG1aDC-OOq9Z1z9ZRwjjzXQI",
  authDomain: "hacker-hangout-gam3r999.firebaseapp.com",
  databaseURL: "https://hacker-hangout-gam3r999-default-rtdb.firebaseio.com",
  projectId: "hacker-hangout-gam3r999",
  storageBucket: "hacker-hangout-gam3r999.firebasestorage.app",
  messagingSenderId: "411445080851",
  appId: "1:411445080851:web:f0c3b87f8f6ec4cf4ea0e6",
  measurementId: "G-X880BXHHRE"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== MATRIX BACKGROUND =====
const canvas=document.getElementById("matrixCanvas");
const ctx=canvas.getContext("2d");
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;
const cols=Math.floor(canvas.width/20);
const ypos=Array(cols).fill(0);
function drawMatrix(){
  ctx.fillStyle="rgba(0,0,0,0.1)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#0f0";
  ctx.font="20px monospace";
  ypos.forEach((y,i)=>{
    const text=String.fromCharCode(33+Math.random()*94);
    ctx.fillText(text,i*20,y);
    ypos[i]=y>canvas.height?0:y+20;
  });
  requestAnimationFrame(drawMatrix);
}
drawMatrix();

// ===== CHAT ELEMENTS =====
const chatEl=document.getElementById("chat");
const userEl=document.getElementById("username");
const msgEl=document.getElementById("messageInput");
const sendBtn=document.getElementById("sendBtn");
const gifInput=document.getElementById("gifQuery");
const gifBtn=document.getElementById("gifSearchBtn");

// ===== BANNED USERS =====
let banned={};
const bannedRef=db.ref("banned");
bannedRef.on("value",snap=>{
  banned=snap.val()||{};
  updateBannedUI();
});
const bannedListEl=document.getElementById("bannedList");
function updateBannedUI(){ bannedListEl.textContent=Object.keys(banned).length?Object.keys(banned).join(","):"(none)"; }

// ===== SEND MESSAGE =====
function renderMsg(msg){
  if(banned[msg.username]) return;
  const div=document.createElement("div");
  div.className="msg "+(msg.username===userEl.value?"me":"other")+(ADMINS[msg.username]?" admin":"");
  div.innerHTML=msg.text;
  chatEl.appendChild(div);
  chatEl.scrollTop=chatEl.scrollHeight;
}
function flashBanned(username,text){
  const div=document.createElement("div");
  div.className="msg banned"; div.style.background="#f00";
  div.innerHTML=`${username}: ${text}`;
  chatEl.appendChild(div);
  chatEl.scrollTop=chatEl.scrollHeight;
  setTimeout(()=>div.remove(),2000);
}
function sendMessage(text){
  const username=(userEl.value||"Anonymous").trim();
  if(!text) return;
  if(banned[username]) return flashBanned(username,text);
  db.ref("messages").push({username,text,timestamp:Date.now()});
}
sendBtn.onclick=()=>{ sendMessage(msgEl.value); msgEl.value=""; };
msgEl.addEventListener("keydown",e=>{if(e.key==="Enter"){ sendMessage(msgEl.value); msgEl.value=""; }});
db.ref("messages").on("child_added",snap=>renderMsg(snap.val()));

// ===== ADMIN LOGIN =====
const adminUserEl=document.getElementById("adminUser");
const adminPassEl=document.getElementById("adminPass");
const adminLoginBtn=document.getElementById("adminLoginBtn");
const adminPanel=document.getElementById("admin-panel");
adminLoginBtn.onclick=()=>{
  const u=adminUserEl.value.trim(), p=adminPassEl.value.trim();
  if(ADMINS[u]&&ADMINS[u]===p){ adminPanel.style.display="block"; alert("Admin logged in: "+u); }
  else alert("Wrong credentials");
  adminUserEl.value=""; adminPassEl.value="";
};

// ===== BAN / UNBAN / CLEAR =====
const banUserEl=document.getElementById("banUser");
const unbanUserEl=document.getElementById("unbanUser");
const banBtn=document.getElementById("banBtn");
const unbanBtn=document.getElementById("unbanBtn");
banBtn.onclick=()=>{
  const u=banUserEl.value.trim(); if(!u)return;
  banned[u]=true; bannedRef.child(u).set(true); updateBannedUI(); banUserEl.value="";
};
unbanBtn.onclick=()=>{
  const u=unbanUserEl.value.trim(); if(!u)return;
  delete banned[u]; bannedRef.child(u).remove(); updateBannedUI(); unbanUserEl.value="";
};
document.getElementById("clearBtn").onclick=()=>db.ref("messages").remove();

// ===== TENOR GIF SUPPORT =====
gifBtn.onclick=()=>{
  const q=gifInput.value.trim(); if(!q)return;
  fetch(`https://api.tenor.com/v1/search?q=${encodeURIComponent(q)}&key=YOUR_TENOR_KEY&limit=1`)
    .then(r=>r.json())
    .then(data=>{
      if(data.results.length) sendMessage(`<img src="${data.results[0].media[0].gif.url}" style="max-width:200px;">`);
      gifInput.value="";
    });
};

// ===== SAHUR MODE =====
const sahurBtn=document.getElementById("sahurModeBtn");
sahurBtn.onclick=()=>db.ref("sahurMode").set({active:true,ts:Date.now()});
db.ref("sahurMode").on("value",snap=>{
  const val=snap.val(); if(!val||!val.active) return;
  if(!document.getElementById("sahurCursor")){
    const cursor=document.createElement("div");
    cursor.id="sahurCursor"; cursor.style.width="40px"; cursor.style.height="40px";
    cursor.style.backgroundImage='url("https://i.imgur.com/2xE2bYx.gif")';
    cursor.style.backgroundSize="cover"; cursor.style.position="fixed";
    cursor.style.pointerEvents="none"; cursor.style.zIndex="9999";
    document.body.appendChild(cursor);
    document.addEventListener("mousemove",e=>{ cursor.style.left=e.pageX+"px"; cursor.style.top=e.pageY+"px"; });
  }
});

// ===== ADMIN NUKE =====
const nukeBtn=document.getElementById("nukeBtn");
nukeBtn.onclick=()=>{
  const audio=new Audio("https://freesound.org/data/previews/348/348852_3248244-lq.mp3");
  audio.play();
  const bomb=document.createElement("div");
  bomb.style.width="50px"; bomb.style.height="50px"; bomb.style.backgroundImage="url('https://i.imgur.com/3KXnP3J.png')";
  bomb.style.backgroundSize="contain"; bomb.style.position="fixed"; bomb.style.top="0px"; bomb.style.left="-50px"; bomb.style.zIndex=9999;
  document.body.appendChild(bomb);
  let left=-50;
  const interval=setInterval(()=>{
    left+=20; bomb.style.left=left+"px"; bomb.style.top=(left/4)+"px";
    if(left>window.innerWidth+50){
      clearInterval(interval); bomb.remove();
      const explosion=document.createElement("div");
      explosion.style.position="fixed"; explosion.style.top="50%"; explosion.style.left="50%";
      explosion.style.transform="translate(-50%,-50%)"; explosion.style.width="200px"; explosion.style.height="200px";
      explosion.style.backgroundImage="url('https://i.imgur.com/OvMZBs9.png')"; explosion.style.backgroundSize="cover"; explosion.style.zIndex=10000;
      document.body.appendChild(explosion);
      const body=document.body; let count=0;
      const shakeInterval=setInterval(()=>{
        body.style.transform=`translate(${Math.random()*20-10}px,${Math.random()*20-10}px)`;
        count++; if(count>15){ clearInterval(shakeInterval); body.style.transform="translate(0,0)"; explosion.remove(); }
      },50);
      sendBtn.disabled=true; msgEl.disabled=true;
      setTimeout(()=>{ sendBtn.disabled=false; msgEl.disabled=false; },5*60*1000);
    }
  },50);
};
