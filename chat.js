window.initChat = function() {
  const db = window.db;
  const messagesRef = db.ref("messages");
  const bannedRef = db.ref("banned");

  const chatEl = document.getElementById("chat-container");
  const userEl = document.getElementById("username");
  const msgEl = document.getElementById("message");
  const sendBtn = document.getElementById("send");

  const adminUserEl = document.getElementById("adminUser");
  const adminPassEl = document.getElementById("adminPass");
  const adminLoginBtn = document.getElementById("adminLoginBtn");
  const adminPanel = document.getElementById("admin-panel");
  const banUserEl = document.getElementById("banUser");
  const unbanUserEl = document.getElementById("unbanUser");
  const banBtn = document.getElementById("banBtn");
  const unbanBtn = document.getElementById("unbanBtn");
  const bannedListEl = document.getElementById("bannedList");
  const nukeBtn = document.getElementById("nukeBtn");

  const nukeOverlay = document.getElementById("nukeOverlay");
  const nukeBomb = document.getElementById("nukeBomb");

  // Admin creds (intentionally weak for "abuse")
  const ADMINS = { "admin": "thisadminwilleventuallybeabused" };

  // Device fingerprint
  const deviceId = localStorage.getItem("hh_device_id") || (Date.now()+"_"+Math.random());
  localStorage.setItem("hh_device_id", deviceId);

  let bannedUsers = {};
  let nukeActive = false;

  // ===== Matrix background =====
  const canvas = document.getElementById("matrix");
  const ctx = canvas.getContext("2d");
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  const letters = "01";
  const fontSize = 14;
  const columns = canvas.width / fontSize;
  const drops = Array(Math.floor(columns)).fill(1);

  function drawMatrix() {
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0f0";
    ctx.font = fontSize + "px monospace";
    drops.forEach((y, i) => {
      const text = letters[Math.floor(Math.random()*letters.length)];
      ctx.fillText(text, i*fontSize, y*fontSize);
      if (y*fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
  }
  setInterval(drawMatrix, 33);

  // ===== Chat rendering =====
  function renderMessage(m) {
    if (bannedUsers[m.username]) return;
    const div = document.createElement("div");
    div.className = "msg " + (m.username === userEl.value ? "me" : "other");
    if (m.admin) div.classList.add("admin");
    div.innerHTML = `<strong>${m.username}</strong>: ${m.text}`;
    chatEl.appendChild(div);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  // Listen for messages
  messagesRef.on("child_added", snap => {
    renderMessage(snap.val());
  });

  // Listen for bans
  bannedRef.on("value", snap => {
    bannedUsers = snap.val() || {};
    bannedListEl.textContent = Object.keys(bannedUsers).join(", ") || "(none)";
  });

  // Send message
  sendBtn.onclick = () => {
    if (nukeActive) { alert("Chat nuked! Wait..."); return; }
    const u = userEl.value || "Anonymous";
    const t = msgEl.value.trim();
    if (!t) return;
    if (bannedUsers[u] || bannedUsers[deviceId]) {
      const div = document.createElement("div");
      div.className = "msg banned";
      div.textContent = `${u}: ${t}`;
      chatEl.appendChild(div);
      chatEl.scrollTop = chatEl.scrollHeight;
      setTimeout(()=>div.remove(),2000);
      msgEl.value = "";
      return;
    }
    messagesRef.push({ username: u, text: t, timestamp: Date.now(), device: deviceId });
    msgEl.value = "";
  };

  // ===== Admin actions =====
  adminLoginBtn.onclick = () => {
    const u = adminUserEl.value;
    const p = adminPassEl.value;
    if (ADMINS[u] && ADMINS[u] === p) {
      adminPanel.style.display = "block";
      alert("Admin logged in: " + u);
    } else {
      alert("Wrong creds");
    }
    adminUserEl.value = "";
    adminPassEl.value = "";
  };

  banBtn.onclick = () => {
    const u = banUserEl.value.trim();
    if (u) bannedRef.child(u).set(true);
    banUserEl.value = "";
  };
  unbanBtn.onclick = () => {
    const u = unbanUserEl.value.trim();
    if (u) bannedRef.child(u).remove();
    unbanUserEl.value = "";
  };

  // ===== Nuke =====
  function triggerNuke() {
    nukeOverlay.style.display = "flex";
    nukeBomb.style.left = "-120px";
    nukeBomb.style.top = "40%";

    // Animate bomb across screen
    let pos = -120;
    const fly = setInterval(() => {
      pos += 10;
      nukeBomb.style.left = pos + "px";
      if (pos > window.innerWidth) {
        clearInterval(fly);
        nukeOverlay.classList.add("explosion");
        nukeBomb.style.display = "none";
        document.body.classList.add("shake-screen");

        setTimeout(()=>document.body.classList.remove("shake-screen"), 5000);

        // lock chat for 5 mins
        nukeActive = true;
        setTimeout(()=>{
          nukeOverlay.style.display="none";
          nukeOverlay.classList.remove("explosion");
          nukeBomb.style.display="block";
          nukeActive = false;
        }, 300000);
      }
    }, 50);
  }
  nukeBtn.onclick = triggerNuke;
};
