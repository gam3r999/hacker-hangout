(function(){
const chatEl=document.getElementById('chat');
const userEl=document.getElementById('username');
const msgEl=document.getElementById('message');
const sendBtn=document.getElementById('send');
const fileInput=document.getElementById('fileInput');
const sendFileBtn=document.getElementById('sendFileBtn');

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

const DEFAULT_ADMINS={ "adminsonlylol":"thisadminwilleventuallybeabused" };
let admins={...DEFAULT_ADMINS};
let bannedUsers={};

let deviceId=localStorage.getItem('hh_device_id');
if(!deviceId){deviceId=Date.now().toString(36)+Math.random().toString(36).slice(2,8); localStorage.setItem('hh_device_id',deviceId);}

const db=firebase.database();
const storage=firebase.storage();
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
    if(m.fileType==='image') div.innerHTML=`<strong>${escapeHtml(m.username)}</strong>:<br><img src="${m.fileURL}" style="max-width:200px;">`;
    else if(m.fileType==='audio') div.innerHTML=`<strong>${escapeHtml(m.username)}</strong>:<br><audio controls src="${m.fileURL}"></audio>`;
    else div.innerHTML=`<strong>${escapeHtml(m.username)}</strong>: ${escapeHtml(m.text)}`;
   
