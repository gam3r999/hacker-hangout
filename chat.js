// chat.js — Firebase multi-device chat with local admin, banning, and device alt detection
(() => {
  // ===== CONFIG =====
  const DEFAULT_ADMINS = { "adminsonlylol": "thisadminwilleventuallybeabused" };

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

  // ===== Firebase helpers =====
  const { db, ref, push, set, onValue, remove } = window.CloudDB;
  const messagesRef = ref(db, 'messages');
  const bannedRef = ref(db, 'banned');
  const deviceUsersRef = ref(db, 'device_users');

  // ===== Device ID =====
  let DEVICE_ID = localStorage.getItem('hh_device_id');
  if (!DEVICE_ID) {
    DEVICE_ID = Date.now().toString(36) + Math.random().toString(36).slice(2,8);
    localStorage.setItem('hh_device_id', DEVICE_ID);
  }

  let messages = [];
  let banned = {};
  let admins = JSON.parse(sessionStorage.getItem('hh_admins') || 'null') || DEFAULT_ADMINS;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function renderMessages() {
    chatEl.innerHTML = '';
    messages.forEach(m => {
      if (banned[m.username]) return;
      const d = document.createElement('div');
      d.className = 'msg ' + ((m.username === (userEl.value || 'Anonymous')) ? 'me' : 'other');
      if (admins[m.username]) d.classList.add('admin');
      d.innerHTML = `<strong>${escapeHtml(m.username)}</strong>: ${escapeHtml(m.text)}`;
      chatEl.appendChild(d);
    });
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  function updateBannedListUI() {
    const names = Object.keys(banned);
    bannedListEl.textContent = names.length ? names.join(', ') : '(none)';
  }

  function flashBanned(username, text) {
    const div = document.createElement('div');
    div.className = 'msg banned';
    div.innerHTML = `<strong>${escapeHtml(username)}</strong>: ${escapeHtml(text)}`;
    chatEl.appendChild(div);
    chatEl.scrollTop = chatEl.scrollHeight;
    setTimeout(()=> div.remove(), 2000);
  }

  // ===== Send message =====
  function sendMessage() {
    const username = (userEl.value||'Anonymous').trim();
    const text = (msgEl.value||'').trim();
    if (!text) return;

    // Device alt detection
    onValue(ref(db, `device_users/${DEVICE_ID}`), snap => {
      const usedNames = snap.exists() ? Object.keys(snap.val()) : [];
      if (usedNames.length && !usedNames.includes(username)) {
        alert("⚠️ Detected alt attempt on this device! Previous names: " + usedNames.join(', '));
        flashBanned(username, text);
        msgEl.value = '';
        return;
      } else {
        // Store device username
        set(ref(db, `device_users/${DEVICE_ID}/${username}`), { lastUsed: Date.now() });
      }

      if (banned[username]) {
        flashBanned(username, text);
        msgEl.value = '';
        return;
      }

      const msgObj = { id: Date.now().toString(36)+Math.random().toString(36).slice(2,8), username, text, timestamp: Date.now(), device: DEVICE_ID };
      push(messagesRef, msgObj);
      msgEl.value = '';
    }, { onlyOnce:true });
  }

  // ===== Admin actions =====
  function loginAdmin() {
    const u = (adminUserEl.value||'').trim();
    const p = (adminPassEl.value||'').trim();
    if (!u || !p) { alert('Enter admin username and password'); return; }
    if (admins[u] && admins[u] === p) {
      adminPanel.style.display='block';
      sessionStorage.setItem('hh_admin_user', u);
      sessionStorage.setItem('hh_admins', JSON.stringify(admins));
      alert('Logged in as admin: '+u);
    } else { alert('Wrong admin credentials'); }
    adminUserEl.value=''; adminPassEl.value='';
  }

  function banUser() {
    const u = (banUserEl.value||'').trim();
    if (!u) return alert('Enter username to ban');
    set(ref(db,'banned/'+u), true);
    banUserEl.value='';
  }

  function unbanUser() {
    const u = (unbanUserEl.value||'').trim();
    if (!u) return alert('Enter username to unban');
    remove(ref(db,'banned/'+u));
    unbanUserEl.value='';
  }

  function clearChat() {
    if (!confirm('Clear all messages?')) return;
    remove(messagesRef);
  }

  // ===== Firebase listeners =====
  onValue(messagesRef, snap => {
    messages = snap.exists() ? Object.values(snap.val()) : [];
    renderMessages();
  });

  onValue(bannedRef, snap => {
    banned = snap.exists() ? snap.val() : {};
    updateBannedListUI();
    renderMessages();
  });

  // ===== Wire UI =====
  sendBtn.addEventListener('click', sendMessage);
  msgEl.addEventListener('keydown', e => { if(e.key==='Enter') sendMessage(); });
  adminLoginBtn.addEventListener('click', loginAdmin);
  banBtn.addEventListener('click', banUser);
  unbanBtn.addEventListener('click', unbanUser);
  clearBtn.addEventListener('click', clearChat);

  // Auto-show admin panel if session has admin
  const sessionAdmin = sessionStorage.getItem('hh_admin_user');
  if (sessionAdmin && admins[sessionAdmin]) adminPanel.style.display='block';
})();
