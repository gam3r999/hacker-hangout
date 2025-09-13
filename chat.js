// chat.js — local multi-tab chat with admin login, ban/unban, and banned-flash
(() => {
  // ===== CONFIG =====
  // Change these to your preferred admin username & password:
  const DEFAULT_ADMINS = { "adminsonlylol": "thisadminwilleventuallybeabused" }; // {username: password}
  // You can change the password here before uploading. Keep it secret.

  const CHANNEL_NAME = 'hacker-hangout-local-v2';
  const MESSAGES_KEY = 'hh_messages_v2';
  const BANNED_KEY = 'hh_banned_v2';
  const ADMINS_KEY = 'hh_admins_v2'; // stored in localStorage so you can add admins in-browser later

  // ===== UI =====
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

  // ===== Storage helpers =====
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch(e){ return fallback; }
  }
  function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  // messages array: {id, username, text, timestamp}
  let messages = load(MESSAGES_KEY, []);
  let banned = load(BANNED_KEY, {}); // { username: true }
  let admins = load(ADMINS_KEY, null) || DEFAULT_ADMINS;

  // BroadcastChannel for sync between tabs (if available)
  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel(CHANNEL_NAME) : null;

  // ===== rendering =====
  function renderMessages() {
    chatEl.innerHTML = '';
    messages.forEach(m => {
      // skip historical messages from currently banned users (they are hidden)
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

  // utility
  function id() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
  function escapeHtml(str){ return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }

  // ===== chat actions =====
  function broadcast(type, payload) {
    // update localStorage as source-of-truth before broadcasting
    if (type === 'message') save(MESSAGES_KEY, messages);
    if (type === 'ban') save(BANNED_KEY, banned);
    if (type === 'admins') save(ADMINS_KEY, admins);
    if (bc) bc.postMessage({type, payload});
  }

  function sendMessage() {
    const username = (userEl.value || 'Anonymous').trim();
    const text = (msgEl.value || '').trim();
    if (!text) return;
    if (banned[username]) {
      // show flashing banned message then remove
      flashBanned(username, text);
      msgEl.value = '';
      // also broadcast the attempt so other tabs' admin panels can show it (optional)
      broadcast('attempt', { username, text, timestamp: Date.now() });
      return;
    }
    const m = { id: id(), username, text, timestamp: Date.now() };
    messages.push(m);
    save(MESSAGES_KEY, messages);
    renderMessages();
    broadcast('message', m);
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
    const u = (adminUserEl.value || '').trim();
    const p = (adminPassEl.value || '').trim();
    if (!u || !p) { alert('Enter admin username and password'); return; }
    // check against admins object
    if (admins[u] && admins[u] === p) {
      adminPanel.style.display = 'block';
      alert('Logged in as admin: ' + u);
      // store logged-in admin in session (not secure, just convenience)
      sessionStorage.setItem('hh_admin_user', u);
    } else {
      alert('Wrong admin credentials');
    }
    adminUserEl.value = '';
    adminPassEl.value = '';
  }

  function banUser() {
    const u = (banUserEl.value || '').trim();
    if (!u) return alert('Enter username to ban');
    banned[u] = true;
    save(BANNED_KEY, banned);
    updateBannedListUI();
    renderMessages();
    broadcast('ban', { username: u });
    banUserEl.value = '';
  }

  function unbanUser() {
    const u = (unbanUserEl.value || '').trim();
    if (!u) return alert('Enter username to unban');
    delete banned[u];
    save(BANNED_KEY, banned);
    updateBannedListUI();
    renderMessages();
    broadcast('ban', { username: u, removed: true });
    unbanUserEl.value = '';
  }

  function clearChat() {
    if (!confirm('Clear all messages?')) return;
    messages = [];
    save(MESSAGES_KEY, messages);
    renderMessages();
    broadcast('clear', {});
  }

  // ===== BroadcastChannel handlers =====
  if (bc) {
    bc.onmessage = (ev) => {
      const { type, payload } = ev.data || {};
      if (!type) return;
      if (type === 'message') {
        // push new message (avoid duplicates)
        if (!messages.find(m => m.id === payload.id)) {
          messages.push(payload);
          save(MESSAGES_KEY, messages);
          renderMessages();
        }
      } else if (type === 'ban') {
        // payload: {username, removed}
        if (payload.removed) {
          delete banned[payload.username];
        } else {
          banned[payload.username] = true;
        }
        save(BANNED_KEY, banned);
        updateBannedListUI();
        renderMessages();
      } else if (type === 'clear') {
        messages = [];
        save(MESSAGES_KEY, messages);
        renderMessages();
      } else if (type === 'attempt') {
        // show admin alert via console (or UI could be extended)
        console.log('Banned user attempted message:', payload.username, payload.text);
      } else if (type === 'admins') {
        admins = load(ADMINS_KEY, DEFAULT_ADMINS);
      }
    };
  }

  // ===== wire UI =====
  sendBtn.addEventListener('click', sendMessage);
  msgEl.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  adminLoginBtn.addEventListener('click', loginAdmin);
  banBtn.addEventListener('click', banUser);
  unbanBtn.addEventListener('click', unbanUser);
  clearBtn.addEventListener('click', clearChat);

  // on load: render and update UI
  renderMessages();
  updateBannedListUI();

  // auto-show admin panel if session has admin
  const sessionAdmin = sessionStorage.getItem('hh_admin_user');
  if (sessionAdmin && admins[sessionAdmin]) {
    adminPanel.style.display = 'block';
  }

  // expose some helpers for console (optional)
  window.HackerLocalChat = {
    messages, banned, admins,
    addAdmin(user, pass){ admins[user]=pass; save(ADMINS_KEY, admins); broadcast('admins', {}); alert('Admin added: '+user); },
    removeAdmin(user){ delete admins[user]; save(ADMINS_KEY, admins); broadcast('admins', {}); alert('Admin removed: '+user); },
    ban(user){ banned[user]=true; save(BANNED_KEY, banned); broadcast('ban', {username:user}); updateBannedListUI(); renderMessages(); },
    unban(user){ delete banned[user]; save(BANNED_KEY, banned); broadcast('ban', {username:user, removed:true}); updateBannedListUI(); renderMessages(); },
    clear(){ messages=[]; save(MESSAGES_KEY, messages); broadcast('clear', {}); renderMessages(); }
  };
})();
