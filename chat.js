// ===== Firebase Config (YOUR CONFIG) =====
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

// ===== Elements =====
const chatEl = document.getElementById('chat');
const userEl = document.getElementById('username');
const msgEl = document.getElementById('message');
const sendBtn = document.getElementById('send');

const adminPanel = document.getElementById('admin-panel');
const adminUserEl = document.getElementById('adminUser');
const adminPassEl = document.getElementById('adminPass');
const adminLoginBtn = document.getElementById('adminLoginBtn');

const banUserEl = document.getElementById('banUser');
const unbanUserEl = document.getElementById('unbanUser');
const banBtn = document.getElementById('banBtn');
const unbanBtn = document.getElementById('unbanBtn');
const clearBtn = document.getElementById('clearBtn');
const bannedListEl = document.getElementById('bannedList');
const nukeBtn = document.getElementById('nukeBtn');

// ===== Data =====
let messages = [];
let banned = {};
let admins = { "adminsonlylol": "thisadminwilleventuallybeabused" };
let sahurCursor;

// ===== Matrix Background =====
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;
const cols = Math.floor(width / 20);
const ypos = Array(cols).fill(0);

function matrix() {
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#0f0";
  ctx.font = "20px monospace";
  ypos.forEach((y, i) => {
    const text = String.fromCharCode(33 + Math.random() * 94);
    ctx.fillText(text, i * 20, y);
    ypos[i] = (y > height && Math.random() > 0.975) ? 0 : y + 20;
  });
}
setInterval(matrix, 50);
window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

// ===== Utils =====
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

function renderMessages() {
  chatEl.innerHTML = '';
  messages.forEach(m => {
    if (banned[m.username]) return;
    const div = document.createElement('div');
    div.className = 'msg ' + ((m.username === userEl.value) ? 'me' : 'other');
    div.innerHTML = `<strong>${escapeHtml(m.username)}</strong>: ${escapeHtml(m.text)}`;
    chatEl.appendChild(div);
  });
  chatEl.scrollTop = chatEl.scrollHeight;
}

function updateBannedListUI() {
  bannedListEl.textContent = Object.keys(banned).length ? Object.keys(banned).join(', ') : '(none)';
}

function flashBanned(username, text) {
  const div = document.createElement('div');
  div.className = 'msg banned';
  div.innerHTML = `<strong>${escapeHtml(username)}</strong>: ${escapeHtml(text)}`;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
  setTimeout(() => div.remove(), 2000);
}

// ===== Chat actions =====
function sendMessage() {
  const username = (userEl.value || 'Anonymous').trim();
  const text = (msgEl.value || '').trim();
  if (!text) return;
  if (banned[username]) return flashBanned(username, text);
  db.ref('messages').push({ username, text, timestamp: Date.now() });
  msgEl.value = '';
}

// ===== Admin =====
function loginAdmin() {
  const u = (adminUserEl.value || '').trim();
  const p = (adminPassEl.value || '').trim();
  if (admins[u] && admins[u] === p) {
    adminPanel.style.display = 'block';
    sessionStorage.setItem('hh_admin_user', u);
    alert('Logged in as ' + u);
  } else {
    alert('Wrong admin credentials');
  }
  adminUserEl.value = '';
  adminPassEl.value = '';
}

function banUser() {
  const u = (banUserEl.value || '').trim();
  if (!u) return;
  banned[u] = true;
  db.ref('banned/' + u).set(true);
  updateBannedListUI();
  banUserEl.value = '';
}

function unbanUser() {
  const u = (unbanUserEl.value || '').trim();
  if (!u) return;
  delete banned[u];
  db.ref('banned/' + u).remove();
  updateBannedListUI();
  unbanUserEl.value = '';
}

function clearChat() {
  if (!confirm('Clear all messages?')) return;
  db.ref('messages').remove();
  messages = [];
  renderMessages();
}

// ===== Nuke =====
function nuke() {
  const bomb = document.createElement('div');
  bomb.style.width = '50px';
  bomb.style.height = '50px';
  bomb.style.position = 'fixed';
  bomb.style.top = '0';
  bomb.style.left = '0';
  bomb.style.backgroundImage = "url('https://i.imgur.com/nHg0JSz.png')";
  bomb.style.backgroundSize = 'contain';
  bomb.style.backgroundRepeat = 'no-repeat';
  bomb.style.zIndex = 9999;
  document.body.appendChild(bomb);

  new Audio('https://www.soundjay.com/misc/sounds/bomb-explosion-01.mp3').play();

  let x = 0, y = 0;
  const interval = setInterval(() => {
    x += 10; y += 10;
    bomb.style.transform = `translate(${x}px,${y}px)`;
    if (x > window.innerWidth / 2) {
      clearInterval(interval);
      document.body.removeChild(bomb);
      // Shake effect
      document.body.style.transition = 'transform 0.05s';
      document.body.style.transform = 'translate(10px,0)';
      setTimeout(() => document.body.style.transform = 'translate(-10px,0)', 50);
      setTimeout(() => document.body.style.transform = 'translate(0,0)', 100);
      // 5 min cooldown
      setTimeout(() => {}, 300000);
    }
  }, 30);
}

// ===== Firebase Listeners =====
db.ref('messages').on('child_added', snap => { messages.push(snap.val()); renderMessages(); });
db.ref('banned').on('value', snap => {
  banned = {};
  snap.forEach(c => { banned[c.key] = true; });
  updateBannedListUI();
});

// ===== Event Listeners =====
sendBtn.addEventListener('click', sendMessage);
msgEl.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
adminLoginBtn.addEventListener('click', loginAdmin);
banBtn.addEventListener('click', banUser);
unbanBtn.addEventListener('click', unbanUser);
clearBtn.addEventListener('click', clearChat);
nukeBtn.addEventListener('click', nuke);

// ===== Auto-show admin panel =====
const sessionAdmin = sessionStorage.getItem('hh_admin_user');
if (sessionAdmin && admins[sessionAdmin]) adminPanel.style.display = 'block';

// ===== Sahur Cursor Mode =====
function startSahurMode() {
  sahurCursor = setInterval(() => { document.body.style.cursor = 'crosshair'; }, 100);
}
function stopSahurMode() {
  clearInterval(sahurCursor);
  document.body.style.cursor = "url('https://i.imgur.com/nHg0JSz.png'), auto";
}
window.startSahurMode = startSahurMode;
window.stopSahurMode = stopSahurMode;
