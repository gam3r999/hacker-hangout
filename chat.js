// Firebase config - keep your config
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
// Init Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== Config =====
const DEFAULT_ADMINS = { "adminsonlylol": "thisadminwilleventuallybeabused" };
let admins = {...DEFAULT_ADMINS};
let banned = {};
let messages = [];

const chatEl=document.getElementById('chat');
const userEl=document.getElementById('username');
const msgEl=document.getElementById('message');
const sendBtn=document.getElementById('send');

const adminUserEl=document.getElementById('adminUser');
const adminPassEl=document.getElementById('adminPass');
const adminLoginBtn=document.getElementById('adminLoginBtn');

const adminPanel=document.getElementById('admin-panel');
const banUserEl=document.getElementById('banUser');
const unbanUserEl=document.getElementById('unbanUser');
const banBtn=document.getElementById('banBtn');
const unbanBtn=document.getElementById('unbanBtn');
const clearBtn=document.getElementById('clearBtn');
const nukeBtn=document.getElementById('nukeBtn');
const bannedListEl=document.getElementById('bannedList');

// ===== Functions =====
function renderMessages(){
  chatEl.innerHTML='';
  messages.forEach(m=>{
    if(banned[m.username]) return;
    const d=document.createElement('div');
    d.className='msg '+((m.username===userEl.value||'Anonymous')?'me':'other');
    if(admins[m.username]) d.classList.add('admin');
    d.textContent=m.username+': '+m.text;
    chatEl.appendChild(d);
  });
  chatEl.scrollTop=chatEl.scrollHeight;
}

function updateBannedListUI(){bannedListEl.textContent=Object.keys(banned).join(', ')||'(none)';}

function sendMessage(){
  const username=(userEl.value||'Anonymous').trim();
  const text=(msgEl.value||'').trim();
  if(!text) return;
  if(banned[username]){
    const div=document.createElement('div'); div.className='msg banned'; div.textContent=username+': '+text;
    chatEl.appendChild(div); setTimeout(()=>div.remove(),2000); msgEl.value=''; return;
  }
  const m={username,text,timestamp:Date.now()};
  db.ref('messages').push(m);
  msgEl.value='';
}

function loginAdmin(){
  const u=(adminUserEl.value||'').trim(); const p=(adminPassEl.value||'').trim();
  if(admins[u]&&admins[u]===p){adminPanel.style.display='block'; sessionStorage.setItem('hh_admin_user',u); alert('Logged in as admin: '+u);}
  else alert('Wrong admin credentials'); adminUserEl.value=''; adminPassEl.value='';
}

function banUser(){
  const u=(banUserEl.value||'').trim(); if(!u) return alert('Enter username to ban');
  banned[u]=true; db.ref('banned/'+u).set(true); updateBannedListUI(); banUserEl.value='';
}
function unbanUser(){
  const u=(unbanUserEl.value||'').trim(); if(!u) return alert('Enter username to unban');
  delete banned[u]; db.ref('banned/'+u).remove(); updateBannedListUI(); unbanUserEl.value='';
}
function clearChat(){if(!confirm('Clear all messages?')) return; db.ref('messages').remove();}
function nuke(){
  const bomb=document.createElement('div'); bomb.style.width='50px'; bomb.style.height='50px';
  bomb.style.position='fixed'; bomb.style.top='0'; bomb.style.left='0';
  bomb.style.backgroundImage="url('https://i.imgur.com/nHg0JSz.png')";
  bomb.style.backgroundSize='contain'; bomb.style.backgroundRepeat='no-repeat';
  bomb.style.zIndex=9999;
  document.body.appendChild(bomb);
  const audio=new Audio('https://www.soundjay.com/misc/sounds/bomb-explosion-01.mp3');
  audio.play();
  let x=0,y=0;
  const interval=setInterval(()=>{
    x+=10; y+=10;
    bomb.style.transform=`translate(${x}px, ${y}px)`;
    if(x>window.innerWidth/2){ clearInterval(interval); document.body.removeChild(bomb);
      document.body.style.transition='transform 0.05s';
      document.body.style.transform='translate(10px,0)';
      setTimeout(()=>document.body.style.transform='translate(0,0)',50);
      setTimeout(()=>document.body.style.transform='translate(-10px,0)',100);
      setTimeout(()=>document.body.style.transform='translate(0,0)',150);
      setTimeout(()=>document.body.style.transform='translate(0,0)',300000); // 5 min cooldown
    }
  },30);
}

// ===== Firebase listeners =====
db.ref('messages').on('value',snap=>{
  messages=[]; snap.forEach(c=>messages.push(c.val())); renderMessages();
});
db.ref('banned').on('value',snap=>{banned={}; snap.forEach(c=>banned[c.key]=true); updateBannedListUI();});

// ===== Wire buttons =====
sendBtn.addEventListener('click',sendMessage);
msgEl.addEventListener('keydown',e=>{if(e.key==='Enter')sendMessage();});
adminLoginBtn.addEventListener('click',loginAdmin);
banBtn.addEventListener('click',banUser);
unbanBtn.addEventListener('click',unbanUser);
clearBtn.addEventListener('click',clearChat);
nukeBtn.addEventListener('click',nuke);

// Auto-show admin panel
const sessionAdmin=sessionStorage.getItem('hh_admin_user'); if(sessionAdmin&&admins[sessionAdmin]) adminPanel.style.display='block';
