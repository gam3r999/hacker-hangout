// chat.js — full, no export, ready for any browser
function initChat({ db, ref, push, set, onValue, remove }) {
  const chatEl = document.getElementById('chat');
  const userEl = document.getElementById('username');
  const msgEl = document.getElementById('message');
  const sendBtn = document.getElementById('send');
  const adminUserEl = document.getElementById('adminUser');
  const adminPassEl = document.getElementById('adminPass');
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  const adminPanel = document.getElementById('admin-panel');
  const banUserEl = document.getElementById('banUser');
  const unbanUserEl = document.getElementById('unbanUser');
  const banBtn = document.getElementById('banBtn');
  const unbanBtn = document.getElementById('unbanBtn');
  const clearBtn = document.getElementById('clearBtn');
  const bannedListEl = document.getElementById('bannedList');

  const messagesRef = ref(db, 'messages');
  const bannedRef = ref(db, 'banned');
  const devicesRef = ref(db, 'devices');

  const ADMINS = { "adminsonlylol": "thisadminwilleventuallybeabused" };

  // DEVICE/IP detection
  let DEVICE_ID = localStorage.getItem('hh_device_id');
  if(!DEVICE_ID){ DEVICE_ID = Date.now().toString(36)+Math.random().toString(36).slice(2,8); localStorage.setItem('hh_device_id',DEVICE_ID); }

  let messages = [], banned = {}, usedDevices = {};

  function escapeHtml(str){ return String(str).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }

  function renderMessages(){
    chatEl.innerHTML='';
    messages.forEach(m=>{
      if(banned[m.username]) return;
      const d=document.createElement('div');
      d.className='msg '+((m.username==(userEl.value||'Anonymous'))?'me':'other');
      if(ADMINS[m.username]) d.classList.add('admin');
      d.innerHTML=`<strong>${escapeHtml(m.username)}</strong>: ${escapeHtml(m.text)}`;
      chatEl.appendChild(d);
    });
    chatEl.scrollTop=chatEl.scrollHeight;
  }

  function flashBanned(u,t){
    const div=document.createElement('div'); div.className='msg banned';
    div.innerHTML=`<strong>${escapeHtml(u)}</strong>: ${escapeHtml(t)}`;
    chatEl.appendChild(div);
    chatEl.scrollTop=chatEl.scrollHeight;
    setTimeout(()=>div.remove(),2000);
  }

  function sendMessage(){
    const username=(userEl.value||'Anonymous').trim(), text=(msgEl.value||'').trim();
    if(!text) return;
    if(banned[username]){ flashBanned(username,text); msgEl.value=''; return; }

    // DEVICE/IP alt check
    if(usedDevices[DEVICE_ID] && usedDevices[DEVICE_ID]!==username){
      flashBanned(username,'ALT DETECTED!');
      msgEl.value=''; return;
    }

    push(messagesRef,{ username, text, timestamp:Date.now(), device:DEVICE_ID });
    set(ref(db,'devices/'+DEVICE_ID),username);
    msgEl.value='';
  }

  function loginAdmin(){
    const u=(adminUserEl.value||'').trim(), p=(adminPassEl.value||'').trim();
    if(ADMINS[u]===p){ adminPanel.style.display='block'; alert('Logged in as admin: '+u); } else { alert('Wrong admin credentials'); }
    adminUserEl.value=''; adminPassEl.value='';
  }

  function banUser(){ 
    const u=(banUserEl.value||'').trim(); 
    if(!u) return alert('Enter username'); 
    set(ref(db,'banned/'+u),true); 
    banUserEl.value=''; 
  }

  function unbanUser(){ 
    const u=(unbanUserEl.value||'').trim(); 
    if(!u) return alert('Enter username'); 
    remove(ref(db,'banned/'+u)); 
    unbanUserEl.value=''; 
  }

  function clearChat(){ 
    if(confirm('Clear all messages?')) remove(messagesRef); 
  }

  // Event listeners
  sendBtn.addEventListener('click',sendMessage);
  msgEl.addEventListener('keydown',e=>{if(e.key==='Enter') sendMessage();});
  adminLoginBtn.addEventListener('click',loginAdmin);
  banBtn.addEventListener('click',banUser);
  unbanBtn.addEventListener('click',unbanUser);
  clearBtn.addEventListener('click',clearChat);

  // LISTEN TO FIREBASE
  onValue(messagesRef,snap=>{ messages = snap.exists()? Object.values(snap.val()):[]; renderMessages(); });
  onValue(bannedRef,snap=>{ banned = snap.exists()? snap.val():{}; renderMessages(); });
  onValue(devicesRef,snap=>{ usedDevices = snap.exists()? snap.val():{}; });

  // INITIAL RENDER
  renderMessages();
}

// expose globally
window.initChat = initChat;
