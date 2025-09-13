// chat.js — Firebase multi-device chat with admin, banning, device-alt detection
(function(){
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
  const bannedListEl=document.getElementById('bannedList');

  const DEFAULT_ADMINS={ "adminsonlylol":"thisadminwilleventuallybeabused" };
  let admins={...DEFAULT_ADMINS};
  let bannedUsers={};

  // device-alt detection
  let deviceId=localStorage.getItem('hh_device_id');
  if(!deviceId){deviceId=Date.now().toString(36)+Math.random().toString(36).slice(2,8); localStorage.setItem('hh_device_id',deviceId);}

  const db=firebase.database();
  const messagesRef=db.ref('messages');
  const bannedRef=db.ref('banned');
  const devicesRef=db.ref('devices');

  function escapeHtml(str){ return String(str).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }

  function renderMessages(arr){
    chatEl.innerHTML='';
    arr.forEach(m=>{
      if(bannedUsers[m.username]) return;
      const div=document.createElement('div');
      div.className='msg '+((m.username==(userEl.value||'Anonymous')?'me':'other'));
      if(admins[m.username]) div.classList.add('admin');
      div.innerHTML=`<strong>${escapeHtml(m.username)}</strong>: ${escapeHtml(m.text)}`;
      chatEl.appendChild(div);
    });
    chatEl.scrollTop=chatEl.scrollHeight;
  }

  function flashBanned(username,text){
    const div=document.createElement('div');
    div.className='msg banned';
    div.innerHTML=`<strong>${escapeHtml(username)}</strong>: ${escapeHtml(text)}`;
    chatEl.appendChild(div);
    chatEl.scrollTop=chatEl.scrollHeight;
    setTimeout(()=>div.remove(),2000);
  }

  function sendMessage(){
    const username=(userEl.value||'Anonymous').trim();
    const text=(msgEl.value||'').trim();
    if(!text) return;
    if(bannedUsers[username]){ flashBanned(username,text); msgEl.value=''; return;}
    devicesRef.child(username+'_'+deviceId).set({ timestamp:Date.now() });
    messagesRef.push({ username,text,timestamp:Date.now(),deviceId });
    msgEl.value='';
  }

  function loginAdmin(){
    const u=(adminUserEl.value||'').trim();
    const p=(adminPassEl.value||'').trim();
    if(!u||!p) return alert('Enter admin username & password');
    if(admins[u]&&admins[u]===p){ adminPanel.style.display='block'; alert('Logged in as admin: '+u); sessionStorage.setItem('hh_admin_user',u);}
    else alert('Wrong admin credentials');
    adminUserEl.value=''; adminPassEl.value='';
  }

  function updateBannedListUI(){
    bannedListEl.textContent=Object.keys(bannedUsers).length?Object.keys(bannedUsers).join(', '):'(none)';
  }

  function banUser(){
    const u=(banUserEl.value||'').trim(); if(!u) return alert('Enter username'); bannedRef.child(u).set(true);
    banUserEl.value='';
  }

  function unbanUser(){
    const u=(unbanUserEl.value||'').trim(); if(!u) return alert('Enter username'); bannedRef.child(u).remove();
    unbanUserEl.value='';
  }

  function clearChat(){ if(!confirm('Clear all messages?')) return; messagesRef.remove(); }

  sendBtn.addEventListener('click',sendMessage);
  msgEl.addEventListener('keydown',e=>{if(e.key==='Enter')sendMessage();});
  adminLoginBtn.addEventListener('click',loginAdmin);
  banBtn.addEventListener('click',banUser);
  unbanBtn.addEventListener('click',unbanUser);
  clearBtn.addEventListener('click',clearChat);

  // Listen for messages
  messagesRef.on('value',snapshot=>{
    const msgs=[]; snapshot.forEach(child=>{msgs.push(child.val());});
    renderMessages(msgs);
  });

  // Listen for banned users
  bannedRef.on('value',snapshot=>{
    bannedUsers={}; snapshot.forEach(child=>{bannedUsers[child.key]=true;});
    updateBannedListUI();
  });

  // Auto-show admin if logged in
  const sessionAdmin=sessionStorage.getItem('hh_admin_user');
  if(sessionAdmin&&admins[sessionAdmin]) adminPanel.style.display='block';
})();
