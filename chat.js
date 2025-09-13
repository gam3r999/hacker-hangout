// chat.js — full multi-device Firebase chat with device-alt detection
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

  // admin credentials (stored in file)
  const DEFAULT_ADMINS = { "adminsonlylol": "thisadminwilleventuallybeabused" };

  let bannedUsers = {};
  let admins = { ...DEFAULT_ADMINS };

  // get device ID (simple localStorage + random)
  let deviceId = localStorage.getItem('hh_device_id');
  if (!deviceId) {
    deviceId = Date.now().toString(36) + Math.random().toString(36).slice(2,8);
    localStorage.setItem('hh_device_id', deviceId);
  }

  const messagesRef = ref(db, 'messages');
  const bannedRef = ref(db, 'banned');
  const devicesRef = ref(db, 'devices');

  // ===== render messages =====
  function renderMessages(msgArray) {
    chatEl.innerHTML = '';
    msgArray.forEach(m => {
      if (bannedUsers[m.username]) return;
      const div = document.createElement('div');
      div.className = 'msg ' + ((m.username === (userEl.value || 'Anonymous')) ? 'me' : 'other');
      if (admins[m.username]) div.classList.add('admin');
      div.innerHTML = `<strong>${escapeHtml(m.username)}</strong>: ${escapeHtml(m.text)}`;
      chatEl.appendChild(div);
    });
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  function escapeHtml(str){ return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }

  // ===== send message =====
  function sendMessage() {
    const username = (userEl.value || 'Anonymous').trim();
    const text = (msgEl.value || '').trim();
    if (!text) return;

    // check banned
    if (bannedUsers[username]) {
      flashBanned(username, text);
      msgEl.value = '';
      return;
    }

    // write device info for alt detection
    set(ref(db, `devices/${username}_${deviceId}`), { timestamp: Date.now() });

    const m = { username, text, timestamp: Date.now(), deviceId };
    push(messagesRef, m);
    msgEl.value = '';
  }

  function flashBanned(username, text) {
    const div = document.createElement('div');
    div.className = 'msg banned';
    div.innerHTML = `<strong>${escapeHtml(username)}</strong>: ${escapeHtml(text)}`;
    chatEl.appendChild(div);
    chatEl.scrollTop = chatEl.scrollHeight;
    setTimeout(()=> div.remove(), 2000);
  }

  // ===== admin actions =====
  function loginAdmin() {
    const u = (adminUserEl.value||'').trim();
    const p = (adminPassEl.value||'').trim();
    if (!u || !p) return alert('Enter admin username & password');
    if (admins[u] && admins[u] === p) {
      adminPanel.style.display='block';
      alert('Logged in as admin: '+u);
      sessionStorage.setItem('hh_admin_user', u);
    } else alert('Wrong admin credentials');
    adminUserEl.value='';
    adminPassEl.value='';
  }

  function banUser() {
    const u = (banUserEl.value||'').trim();
    if (!u) return alert('Enter username to ban');
    set(ref(db, `banned/${u}`), true);
    banUserEl.value='';
  }

  function unbanUser() {
    const u = (unbanUserEl.value||'').trim();
    if (!u) return alert('Enter username to unban');
    remove(ref(db, `banned/${u}`));
    unbanUserEl.value='';
  }

  function clearChat() {
    if (!confirm('Clear all messages?')) return;
    remove(messagesRef);
  }

  // ===== Firebase listeners =====
  onValue(messagesRef, snap=>{
    const msgs = [];
    snap.forEach(s=> msgs.push(s.val()));
    renderMessages(msgs);
  });

  onValue(bannedRef, snap=>{
    bannedUsers = snap.val()||{};
    bannedListEl.textContent = Object.keys(bannedUsers).length ? Object.keys(bannedUsers).join(', ') : '(none)';
  });

  // ===== wire UI =====
  sendBtn.addEventListener('click', sendMessage);
  msgEl.addEventListener('keydown', e=>{ if(e.key==='Enter') sendMessage(); });
  adminLoginBtn.addEventListener('click', loginAdmin);
  banBtn.addEventListener('click', banUser);
  unbanBtn.addEventListener('click', unbanUser);
  clearBtn.addEventListener('click', clearChat);

  // restore admin session
  const sessionAdmin = sessionStorage.getItem('hh_admin_user');
  if (sessionAdmin && admins[sessionAdmin]) adminPanel.style.display='block';

  console.log('Chat initialized. Device ID:', deviceId);
}

// expose globally
window.initChat = initChat;
