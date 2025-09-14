(function(){
  const chatEl=document.getElementById('chat');
  const userEl=document.getElementById('username');
  const msgEl=document.getElementById('message');
  const sendBtn=document.getElementById('send');
  const fileInput=document.getElementById('fileInput');
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
  const nukeBtn=document.getElementById('nukeBtn');

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
      let content='';
      if(m.text) content+=`<strong>${escapeHtml(m.username)}</strong>: ${escapeHtml(m.text)}<br>`;
      if(m.files){
        m.files.forEach(f=>{
          if(f.type.startsWith('image')) content+=`<img src="${f.url}" style="max-width:200px; display:block; margin:5px 0;">`;
          else if(f.type.startsWith('audio')) content+=`<audio controls src="${f.url}" style="display:block; margin:5px 0;"></audio>`;
        });
      }
      div.innerHTML=content;
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

  async function sendMessage(){
    const username=(userEl.value||'Anonymous').trim();
    const text=(msgEl.value||'').trim();
    const files=fileInput.files;
    if(!text && !files.length) return;
    if(bannedUsers[username]){ flashBanned(username,text); msgEl.value=''; return;}

    let fileData=[];
    for(let f of files){
      const reader=new FileReader();
      const dataURL=await new Promise(res=>{reader.onload=e=>res(e.target.result); reader.readAsDataURL(f);});
      fileData.push({name:f.name, type:f.type, url:dataURL});
    }

    devicesRef.child(username+'_'+deviceId).set({ timestamp:Date.now() });
    messagesRef.push({ username, text, timestamp:Date.now(), deviceId, files:fileData });
    msgEl.value=''; fileInput.value='';
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

  function nuke(){
    const bomb=document.createElement('div');
    bomb.textContent='☢️💣☢️';
    bomb.style.position='fixed';
    bomb.style.top='0';
    bomb.style.left='-50px';
    bomb.style.fontSize='5rem';
    bomb.style.zIndex='9999';
    document.body.appendChild(bomb);
    const audio=new Audio('https://www.myinstants.com/media/sounds/tactical-nuke.mp3');
    audio.play();
    let pos=-50;
    const interval=setInterval(()=>{
      pos+=20;
      bomb.style.left=pos+'px';
      if(pos>window.innerWidth/2){
        clearInterval(interval);
        bomb.remove();
        document.body.classList.add('shake');
        setTimeout(()=>document.body.classList.remove('shake'),1000);
      }
    },50);
    // Disable chat for 5 min
    sendBtn.disabled=true; msgEl.disabled=true; fileInput.disabled=true;
    setTimeout(()=>{sendBtn.disabled=false; msgEl.disabled=false; fileInput.disabled=false;},5*60*1000);
  }

  // CSS for shake
  const style=document.createElement('style');
  style.textContent="@keyframes shake{0%{transform:translate(1px,1px)}25%{transform:translate(-1px,-2px)}50%{transform:translate(2px,-1px)}75%{transform:translate(-2px,2px)}100%{transform:translate(1px,-1px)}} .shake{animation:shake 0.5s;}";
  document.head.appendChild(style);

  sendBtn.addEventListener('click',sendMessage);
  msgEl.addEventListener('keydown',e=>{if(e.key==='Enter')sendMessage();});
  adminLoginBtn.addEventListener('click',loginAdmin);
  banBtn.addEventListener('click',banUser);
  unbanBtn.addEventListener('click',unbanUser);
  clearBtn.addEventListener('click',clearChat);
  nukeBtn.addEventListener('click',nuke);

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
