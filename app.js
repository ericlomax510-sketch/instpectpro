// ══════════════════════════════════════════
// HASH — synchronous cyrb53 variant
// ══════════════════════════════════════════
const APP_PEPPER = 'InspectPro$2024#SecureApp!';

function hashPassword(password) {
  const str = APP_PEPPER + password;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// ══════════════════════════════════════════
// DATA STORES
// ══════════════════════════════════════════
let techAccounts  = JSON.parse(localStorage.getItem('ip_tech_accounts')  || '[]');
let customers     = JSON.parse(localStorage.getItem('ip_customers')       || '[]');
let custProfiles  = JSON.parse(localStorage.getItem('ip_cust_profiles')   || '[]');

if (!techAccounts.length) {
  techAccounts = [{ id:1, name:'Admin', username:'admin', passwordHash: hashPassword('admin123'), role:'admin', rating:5 }];
  saveTechAccounts();
}

function saveTechAccounts() { try { localStorage.setItem('ip_tech_accounts', JSON.stringify(techAccounts)); } catch(e){} }
function saveCustProfiles()  { try { localStorage.setItem('ip_cust_profiles',  JSON.stringify(custProfiles));  } catch(e){} }
function saveCustomers()     { try { localStorage.setItem('ip_customers',       JSON.stringify(customers));      } catch(e){} }

let currentMode = null;
let currentTechAccount = null;
let currentCustPortalId = null;
let loginMode = 'tech';

// ══════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════
function switchMode(m) {
  loginMode = m;
  document.getElementById('mode-tech-btn').classList.toggle('active', m==='tech');
  document.getElementById('mode-cust-btn').classList.toggle('active', m==='customer');
  document.getElementById('pin-section').style.display  = m==='tech'     ? 'block' : 'none';
  document.getElementById('cust-section').style.display = m==='customer' ? 'block' : 'none';
}

function techTab(tab) {
  document.getElementById('tech-signin-tab').classList.toggle('active', tab==='signin');
  document.getElementById('tech-register-tab').classList.toggle('active', tab==='register');
  document.getElementById('tech-signin-view').style.display   = tab==='signin'   ? 'block' : 'none';
  document.getElementById('tech-register-view').style.display = tab==='register' ? 'block' : 'none';
}

function custTab(tab) {
  document.getElementById('cust-signin-tab').classList.toggle('active', tab==='signin');
  document.getElementById('cust-register-tab').classList.toggle('active', tab==='register');
  document.getElementById('cust-signin-view').style.display   = tab==='signin'   ? 'block' : 'none';
  document.getElementById('cust-register-view').style.display = tab==='register' ? 'block' : 'none';
}

function techLogin() {
  const username = document.getElementById('tech-username').value.trim().toLowerCase();
  const password = document.getElementById('tech-password').value;
  document.getElementById('pin-error').textContent = '';
  if (!username || !password) { document.getElementById('pin-error').textContent = 'Enter username and password.'; return; }
  const account = techAccounts.find(a => a.username === username && a.passwordHash === hashPassword(password));
  if (!account) { document.getElementById('pin-error').textContent = 'Incorrect username or password.'; return; }
  currentTechAccount = account;
  enterTechMode();
}

function techRegister() {
  const name     = document.getElementById('tr-name').value.trim();
  const username = document.getElementById('tr-username').value.trim().toLowerCase().replace(/\s/g,'');
  const pw       = document.getElementById('tr-password').value;
  const pw2      = document.getElementById('tr-password2').value;
  document.getElementById('tr-error').textContent = '';
  if (!name || !username || !pw) { document.getElementById('tr-error').textContent = 'All fields required.'; return; }
  if (pw.length < 6) { document.getElementById('tr-error').textContent = 'Password must be 6+ characters.'; return; }
  if (pw !== pw2)    { document.getElementById('tr-error').textContent = 'Passwords do not match.'; return; }
  if (techAccounts.find(a => a.username === username)) { document.getElementById('tr-error').textContent = 'Username taken.'; return; }
  const newTech = { id:Date.now(), name, username, passwordHash:hashPassword(pw), role:'tech', rating:0 };
  techAccounts.push(newTech);
  saveTechAccounts();
  currentTechAccount = newTech;
  enterTechMode();
  toast('✓ Account created! Welcome, ' + name);
}

function custLogin() {
  const username = document.getElementById('cs-username').value.trim().toLowerCase();
  const password = document.getElementById('cs-password').value;
  document.getElementById('cust-error').textContent = '';
  if (!username || !password) { document.getElementById('cust-error').textContent = 'Enter username and password.'; return; }
  const profile = custProfiles.find(p => p.username === username && p.passwordHash === hashPassword(password));
  if (!profile) { document.getElementById('cust-error').textContent = 'Incorrect username or password.'; return; }
  currentCustPortalId = profile.id;
  enterCustomerPortal(profile);
}

function custRegister() {
  const name     = document.getElementById('cr-name').value.trim();
  const username = document.getElementById('cr-username').value.trim().toLowerCase().replace(/\s/g,'');
  const password = document.getElementById('cr-password').value;
  const phone    = document.getElementById('cr-phone').value.trim();
  const vehicle  = document.getElementById('cr-vehicle').value.trim();
  document.getElementById('cr-error').textContent = '';
  if (!name || !username || !password) { document.getElementById('cr-error').textContent = 'Name, username, and password required.'; return; }
  if (password.length < 6) { document.getElementById('cr-error').textContent = 'Password must be 6+ characters.'; return; }
  if (custProfiles.find(p => p.username === username)) { document.getElementById('cr-error').textContent = 'Username taken.'; return; }
  const profile = { id:Date.now(), name, username, passwordHash:hashPassword(password), phone:phone||'', vehicle:vehicle||'Not provided', submissions:[] };
  custProfiles.push(profile);
  saveCustProfiles();
  currentCustPortalId = profile.id;
  enterCustomerPortal(profile);
}

// ══════════════════════════════════════════
// ENTER APP MODES
// ══════════════════════════════════════════
function enterTechMode() {
  currentMode = 'tech';
  document.getElementById('login-gate').style.display  = 'none';
  document.getElementById('tech-app').style.display    = 'flex';
  document.getElementById('cust-portal').classList.remove('active');
  document.getElementById('topbar-user').textContent   = '👤 ' + (currentTechAccount?.name||'');
  buildStepNav(); renderHomeRecent(); renderInbox();
}

function enterCustomerPortal(profile) {
  currentMode = 'customer';
  document.getElementById('login-gate').style.display = 'none';
  document.getElementById('tech-app').style.display   = 'none';
  document.getElementById('cust-portal').classList.add('active');
  document.getElementById('portal-greeting').textContent = 'Hi, ' + profile.name;
  document.getElementById('portal-vehicle-info').innerHTML =
    `<strong style="color:rgba(255,255,255,.5)">Vehicle:</strong> ${profile.vehicle}<br><strong style="color:rgba(255,255,255,.5)">Phone:</strong> ${profile.phone||'—'}`;
  ['pt-fl-inner','pt-fl-outer','pt-fr-inner','pt-fr-outer','pt-rl-inner','pt-rl-outer','pt-rr-inner','pt-rr-outer','portal-comments']
    .forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  portalPhotos=[]; portalVideoBlob=null;
  const pg=document.getElementById('portal-photo-grid'); if(pg) pg.innerHTML='';
  const vp=document.getElementById('portal-video-preview'); if(vp){vp.src='';vp.style.display='none';}
  const vs=document.getElementById('portal-video-status'); if(vs) vs.textContent='';
  portalSelectedTech=null; portalSelectedServices=[];
  buildPortalServicesGrid(); initSendToSection(profile);
  const reportCard=document.getElementById('portal-car-report-card');
  if(profile.carReport){ reportCard.style.display='block'; renderCustomerCarReport(profile.carReport); }
  else { reportCard.style.display='none'; }
  renderPortalJobStatus(profile);
  updateSubmitBtn();
}

function logout() {
  currentMode=null; currentTechAccount=null; currentCustPortalId=null;
  document.getElementById('login-gate').style.display='flex';
  document.getElementById('tech-app').style.display='none';
  document.getElementById('cust-portal').classList.remove('active');
  ['tech-username','tech-password','cs-username','cs-password','cr-name','cr-username','cr-password','cr-phone','cr-vehicle','tr-name','tr-username','tr-password','tr-password2']
    .forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  ['pin-error','cust-error','cr-error','tr-error'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=''; });
  switchMode('tech'); techTab('signin'); custTab('signin');
}

// ══════════════════════════════════════════
// STAR RATINGS
// ══════════════════════════════════════════
let acctCurrentRating = 0;

function setAcctRating(n) {
  acctCurrentRating = n;
  [1,2,3,4,5].forEach(i => {
    const s = document.getElementById('acct-star-'+i);
    if (s) s.textContent = i<=n ? '★' : '☆';
    if (s) s.style.color  = i<=n ? '#ffb800' : 'rgba(0,0,0,.25)';
  });
}

function getPortalStars(username) {
  const t = techAccounts.find(a => a.username === username);
  const r = (t && t.rating) ? t.rating : 0;
  if (!r) return '<span style="font-size:11px;color:rgba(255,255,255,.3)">No rating yet</span>';
  return [1,2,3,4,5].map(n=>`<span style="font-size:14px;color:${n<=r?'#ffb800':'rgba(255,255,255,.2)'}">${n<=r?'★':'☆'}</span>`).join('')
    + ` <span style="font-size:11px;color:rgba(255,255,255,.4)">${r}/5</span>`;
}

// ══════════════════════════════════════════
// SCREEN NAV
// ══════════════════════════════════════════
function gotoScreen(s) {
  document.querySelectorAll('#main>.screen').forEach(el=>el.classList.remove('active'));
  const target = document.getElementById('screen-'+s);
  if (target) target.classList.add('active');
  ['home','inbox','inspection','customers','pricing','accounts'].forEach(n=>{
    const t=document.getElementById('ttab-'+n); if(t) t.classList.toggle('active', n===s);
  });
  document.getElementById('sidebar').style.display = s==='inspection' ? 'flex' : 'none';
  if (s==='customers')  renderCustomers();
  if (s==='home')       { renderHomeRecent(); renderInbox(); }
  if (s==='accounts')   renderAccountsScreen();
  if (s==='pricing')    buildPriceEditor();
  if (s==='inbox')      renderInbox();
}

// ══════════════════════════════════════════
// INSPECTION
// ══════════════════════════════════════════
const CHECKLIST_ITEMS = ['Engine Air Filter','Battery','Battery Cables','Belts','Radiator Hoses','Brake Fluid','Coolant Level','Power Steering Fluid','Engine Oil','Transmission Fluid','Front Brakes','Rear Brakes','Front Tires','Rear Tires','Suspension','Exhaust','CV Axles','Wipers','All Lights','Washer Fluid'];
const STEP_LABELS = ['','Customer Info','Photos & Walk-Around','Checklist','Comments & Services','Finalize & Send'];

let state = { step:1, photos:[], checklist:{}, recServices:[], walkVideoBlob:null, walkStream:null, walkRecorder:null, walkChunks:[], linkedCustProfileId:null };
let sendingForRecord = null;
let vaultTargetRecordId = null;
let vaultVideoBlob = null;
const postJobState = {1:false,2:false,3:false,4:false};

function startNewInspection() {
  state={step:1,photos:[],checklist:{},recServices:[],walkVideoBlob:null,walkStream:null,walkRecorder:null,walkChunks:[],linkedCustProfileId:null};
  ['f-name','f-phone','f-email','f-year','f-make','f-model','f-miles','f-wo','f-tech','f-comments','f-work-done']
    .forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  const pg=document.getElementById('photo-grid');
  if(pg) pg.innerHTML='<div class="photo-thumb" onclick="document.querySelector(\'#photo-upload-label input\').click()">➕</div>';
  const wl=document.getElementById('walk-live'); if(wl) wl.style.display='none';
  const wp=document.getElementById('walk-preview'); if(wp){wp.src='';wp.style.display='none';}
  const ws=document.getElementById('walk-status'); if(ws) ws.textContent='';
  const rs=document.getElementById('rec-services-list'); if(rs) rs.innerHTML='';
  const cm=document.getElementById('cust-media-card'); if(cm) cm.style.display='none';
  const sw=document.getElementById('start-walk-btn'); if(sw) sw.style.display='inline-flex';
  const stw=document.getElementById('stop-walk-btn'); if(stw) stw.style.display='none';
  [1,2,3,4].forEach(n=>{ postJobState[n]=false; const el=document.getElementById('pj-'+n); if(el){el.classList.remove('checked');el.textContent='';} });
  buildChecklist(); gotoScreen('inspection'); goStep(1);
}

function goStep(n) {
  state.step=n;
  document.querySelectorAll('[id^="istep-"]').forEach(el=>el.classList.remove('active'));
  const target=document.getElementById('istep-'+n); if(target) target.classList.add('active');
  buildStepNav();
  const prog=document.getElementById('step-progress'); if(prog) prog.style.width=(n/5*100)+'%';
  if(n===2) refreshCustMediaCard();
  if(n===5) buildReceiptPreview();
}

function buildStepNav() {
  const nav=document.getElementById('step-nav'); if(!nav) return;
  nav.innerHTML='';
  for(let i=1;i<=5;i++){
    const d=document.createElement('div');
    d.className='step-item'+(i===state.step?' active':'')+(i<state.step?' done':'');
    d.onclick=()=>goStep(i);
    d.innerHTML=`<span class="snum">${i<state.step?'✓':i}</span><span>${STEP_LABELS[i]}</span>`;
    nav.appendChild(d);
  }
}

function togglePostJob(n) {
  postJobState[n]=!postJobState[n];
  const el=document.getElementById('pj-'+n); if(!el) return;
  el.classList.toggle('checked',postJobState[n]);
  el.textContent=postJobState[n]?'✓':'';
}

// ══════════════════════════════════════════
// WALK-AROUND VIDEO
// ══════════════════════════════════════════
function startWalkVideo() {
  navigator.mediaDevices.getUserMedia({video:true,audio:true}).then(stream=>{
    state.walkStream=stream; state.walkChunks=[];
    const live=document.getElementById('walk-live'); live.srcObject=stream; live.style.display='block';
    state.walkRecorder=new MediaRecorder(stream);
    state.walkRecorder.ondataavailable=e=>{if(e.data.size>0) state.walkChunks.push(e.data);};
    state.walkRecorder.onstop=()=>{
      state.walkVideoBlob=new Blob(state.walkChunks,{type:'video/webm'});
      const p=document.getElementById('walk-preview'); p.src=URL.createObjectURL(state.walkVideoBlob); p.style.display='block';
      document.getElementById('walk-live').style.display='none';
      document.getElementById('walk-status').textContent='✓ Walk-around recorded';
    };
    state.walkRecorder.start();
    document.getElementById('start-walk-btn').style.display='none';
    document.getElementById('stop-walk-btn').style.display='inline-flex';
    document.getElementById('walk-status').textContent='🔴 Recording…';
  }).catch(()=>toast('Camera access denied'));
}

function stopWalkVideo() {
  if(state.walkRecorder?.state!=='inactive') state.walkRecorder.stop();
  if(state.walkStream) state.walkStream.getTracks().forEach(t=>t.stop());
  document.getElementById('start-walk-btn').style.display='inline-flex';
  document.getElementById('stop-walk-btn').style.display='none';
}

function uploadWalkVideo(input) {
  const f=input.files[0]; if(!f) return; state.walkVideoBlob=f;
  const p=document.getElementById('walk-preview'); p.src=URL.createObjectURL(f); p.style.display='block';
  document.getElementById('walk-status').textContent='✓ Uploaded: '+f.name;
}

// ══════════════════════════════════════════
// PHOTOS
// ══════════════════════════════════════════
const simCanvas=document.createElement('canvas');
function capturePhotoSim(){
  simCanvas.width=400; simCanvas.height=300;
  const ctx=simCanvas.getContext('2d'),h=Math.random()*360;
  ctx.fillStyle=`hsl(${h},35%,82%)`; ctx.fillRect(0,0,400,300);
  ctx.fillStyle=`hsl(${h},40%,40%)`; ctx.font='bold 18px sans-serif'; ctx.textAlign='center';
  ctx.fillText('📷 '+new Date().toLocaleTimeString(),200,155);
  addPhotoDataUrl(simCanvas.toDataURL('image/jpeg',.85));
}
function uploadPhotos(input){ Array.from(input.files).forEach(f=>{const r=new FileReader();r.onload=e=>addPhotoDataUrl(e.target.result);r.readAsDataURL(f);}); }
function addPhotoDataUrl(url){ state.photos.push({dataUrl:url}); renderPhotos(); }
function removePhoto(i){ state.photos.splice(i,1); renderPhotos(); }
function renderPhotos(){
  const g=document.getElementById('photo-grid'); if(!g) return;
  g.innerHTML='';
  state.photos.forEach((p,i)=>{ const d=document.createElement('div'); d.className='photo-thumb'; d.innerHTML=`<img src="${p.dataUrl}"><button class="del-btn" onclick="removePhoto(${i})">✕</button>`; g.appendChild(d); });
  const a=document.createElement('div'); a.className='photo-thumb'; a.innerHTML='➕'; a.onclick=()=>document.querySelector('#photo-upload-label input').click(); g.appendChild(a);
}

// ══════════════════════════════════════════
// CHECKLIST
// ══════════════════════════════════════════
function buildChecklist(){
  const c=document.getElementById('checklist-items'); if(!c) return; c.innerHTML='';
  CHECKLIST_ITEMS.forEach(item=>{
    if(!state.checklist[item]) state.checklist[item]=null;
    const row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--border)';
    row.innerHTML=`<span style="flex:1;font-size:13px;font-weight:600">${item}</span>
    <div style="display:flex;gap:5px">
      <div style="width:20px;height:20px;border-radius:5px;background:var(--green);cursor:pointer;opacity:${state.checklist[item]==='g'?1:.25};border:2px solid ${state.checklist[item]==='g'?'#fff':'transparent'};transition:all .15s" onclick="setCheck('${item}','g',this.parentElement)"></div>
      <div style="width:20px;height:20px;border-radius:5px;background:var(--yellow);cursor:pointer;opacity:${state.checklist[item]==='y'?1:.25};border:2px solid ${state.checklist[item]==='y'?'#fff':'transparent'};transition:all .15s" onclick="setCheck('${item}','y',this.parentElement)"></div>
      <div style="width:20px;height:20px;border-radius:5px;background:var(--red);cursor:pointer;opacity:${state.checklist[item]==='r'?1:.25};border:2px solid ${state.checklist[item]==='r'?'#fff':'transparent'};transition:all .15s" onclick="setCheck('${item}','r',this.parentElement)"></div>
    </div>`;
    c.appendChild(row);
  });
}

function setCheck(item,val,grp){
  state.checklist[item]=state.checklist[item]===val?null:val;
  const dots=grp.querySelectorAll('div'),vals=['g','y','r'];
  dots.forEach((d,i)=>{ const a=state.checklist[item]===vals[i]; d.style.opacity=a?'1':'.25'; d.style.border=a?'2px solid #fff':'2px solid transparent'; });
}

// ══════════════════════════════════════════
// RECOMMENDED SERVICES
// ══════════════════════════════════════════
function addRecService(n){ if(state.recServices.includes(n)) return; state.recServices.push(n); renderRecServices(); }
function removeRecService(i){ state.recServices.splice(i,1); renderRecServices(); }
function renderRecServices(){
  const l=document.getElementById('rec-services-list'); if(!l) return;
  if(!state.recServices.length){l.innerHTML='<div style="color:var(--muted);font-size:13px">None added.</div>';return;}
  l.innerHTML=state.recServices.map((s,i)=>`
    <div style="display:inline-flex;align-items:center;gap:6px;background:var(--bg);border:1.5px solid var(--border);border-radius:20px;padding:5px 12px;margin:4px;font-size:12px;font-weight:700">${s}
    <button onclick="removeRecService(${i})" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:13px">✕</button></div>`).join('');
}

// ══════════════════════════════════════════
// CUSTOMER MEDIA (Step 2)
// ══════════════════════════════════════════
function refreshCustMediaCard(){
  const name=document.getElementById('f-name')?.value.trim();
  const phone=document.getElementById('f-phone')?.value.trim();
  if(!name&&!phone) return;
  const profile=custProfiles.find(p=>p.phone===phone||p.name===name);
  if(!profile||!profile.submissions?.length) return;
  state.linkedCustProfileId=profile.id;
  const sub=profile.submissions[profile.submissions.length-1];
  const card=document.getElementById('cust-media-card');
  const content=document.getElementById('cust-media-content');
  card.style.display='block';
  let html=`<div style="font-size:12px;color:var(--muted);margin-bottom:12px">Latest: ${new Date(sub.date).toLocaleString()} ${sub.sentToTechName?'· Sent to: '+sub.sentToTechName:''}</div>`;
  if(sub.requestedServices?.length) html+=`<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Requested Services</div><div style="display:flex;flex-wrap:wrap;gap:5px">${sub.requestedServices.map(s=>`<span style="background:rgba(59,130,246,.1);color:var(--blue);font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px">${s}</span>`).join('')}</div></div>`;
  if(sub.videoDataUrl) html+=`<div style="margin-bottom:12px"><div class="card-title">Walk-Around Video</div><video controls src="${sub.videoDataUrl}" style="width:100%;max-height:180px;border-radius:10px;object-fit:cover"></video></div>`;
  if(sub.photos?.length) html+=`<div style="margin-bottom:12px"><div class="card-title">Photos (${sub.photos.length})</div><div class="photo-grid">${sub.photos.map(p=>`<div class="photo-thumb"><img src="${p}"></div>`).join('')}</div></div>`;
  if(sub.comments) html+=`<div style="background:var(--bg);border-radius:8px;padding:10px;font-size:13px;color:var(--muted);font-style:italic;border:1px solid var(--border)">"${sub.comments}"</div>`;
  content.innerHTML=html;
}

// ══════════════════════════════════════════
// RECEIPT PREVIEW
// ══════════════════════════════════════════
function buildReceiptPreview(){
  const name=document.getElementById('f-name')?.value||'—';
  const vehicle=[document.getElementById('f-year')?.value,document.getElementById('f-make')?.value,document.getElementById('f-model')?.value].filter(Boolean).join(' ')||'—';
  const miles=document.getElementById('f-miles')?.value||'—';
  const workOrder=document.getElementById('f-wo')?.value||'—';
  const tech=document.getElementById('f-tech')?.value||'—';
  const comments=document.getElementById('f-comments')?.value||'';
  const workDone=document.getElementById('f-work-done')?.value||'';
  const allRed=Object.entries(state.checklist).filter(([,v])=>v==='r').map(([k])=>k);
  const allYel=Object.entries(state.checklist).filter(([,v])=>v==='y').map(([k])=>k);
  const profile=state.linkedCustProfileId?custProfiles.find(p=>p.id===state.linkedCustProfileId):null;
  const sub=profile?.submissions?.length?profile.submissions[profile.submissions.length-1]:null;
  const issueRows=(items,color,lbl)=>items.map(n=>`<div class="issue-row"><div style="width:10px;height:10px;border-radius:3px;background:${color};flex-shrink:0;margin-top:2px"></div><span style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;width:60px;flex-shrink:0">${lbl}</span><span>${n}</span></div>`).join('');
  document.getElementById('receipt-preview').innerHTML=`
    <div class="receipt">
      <div class="receipt-logo">Inspect<span>Pro</span></div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:4px">VEHICLE INSPECTION REPORT</div>
      <hr class="receipt-divider">
      <div class="receipt-row"><span class="rlabel">Customer</span><span class="rval">${name}</span></div>
      <div class="receipt-row"><span class="rlabel">Vehicle</span><span class="rval">${vehicle}</span></div>
      <div class="receipt-row"><span class="rlabel">Mileage</span><span class="rval">${miles}</span></div>
      <div class="receipt-row"><span class="rlabel">Work Order</span><span class="rval">${workOrder}</span></div>
      <div class="receipt-row"><span class="rlabel">Technician</span><span class="rval" style="color:var(--accent);font-weight:800">${tech}</span></div>
      <div class="receipt-row"><span class="rlabel">Date</span><span class="rval">${new Date().toLocaleDateString()}</span></div>
      ${allRed.length||allYel.length?`<hr class="receipt-divider"><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:13px;margin-bottom:10px">FINDINGS</div>${issueRows(allRed,'var(--red)','Urgent')}${issueRows(allYel,'var(--yellow)','Monitor')}`:`<hr class="receipt-divider"><div style="color:var(--green);font-weight:700;font-size:13px;padding:8px 0">✓ All Items Satisfactory</div>`}
      ${state.recServices.length?`<hr class="receipt-divider"><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:13px;margin-bottom:8px">RECOMMENDED SERVICES</div>${state.recServices.map(s=>`<div style="font-size:13px;padding:3px 0">• ${s}</div>`).join('')}`:''}
      ${workDone?`<hr class="receipt-divider"><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:13px;margin-bottom:8px">✅ WORK COMPLETED</div><div style="font-size:13px;color:var(--muted);line-height:1.6">${workDone}</div>`:''}
      ${comments?`<hr class="receipt-divider"><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:13px;margin-bottom:8px">COMMENTS</div><div style="font-size:13px;color:var(--muted);line-height:1.6">${comments}</div>`:''}
      ${sub?.requestedServices?.length?`<hr class="receipt-divider"><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:13px;margin-bottom:8px">CUSTOMER REQUESTED</div><div style="display:flex;flex-wrap:wrap;gap:5px">${sub.requestedServices.map(s=>`<span style="background:rgba(59,130,246,.08);color:var(--blue);font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px">${s}</span>`).join('')}</div>`:''}
      <hr class="receipt-divider">
      <div style="font-size:11px;color:var(--muted)">Photos: ${state.photos.length} · Walk-Around: ${state.walkVideoBlob?'✓':'—'} · Cust Photos: ${sub?.photos?.length||0}</div>
    </div>`;
}

// ══════════════════════════════════════════
// SAVE INSPECTION
// ══════════════════════════════════════════
function saveInspection(){
  const name=document.getElementById('f-name')?.value||'Unknown';
  const vehicle=[document.getElementById('f-year')?.value,document.getElementById('f-make')?.value,document.getElementById('f-model')?.value].filter(Boolean).join(' ')||'—';
  const record={
    id:Date.now(), name, vehicle,
    miles:document.getElementById('f-miles')?.value||'',
    workOrder:document.getElementById('f-wo')?.value||'',
    tech:document.getElementById('f-tech')?.value||'',
    mechanicName:document.getElementById('f-tech')?.value||'',
    phone:document.getElementById('f-phone')?.value||'',
    email:document.getElementById('f-email')?.value||'',
    comments:document.getElementById('f-comments')?.value||'',
    workDone:document.getElementById('f-work-done')?.value||'',
    checklist:state.checklist, photos:state.photos,
    recServices:state.recServices, hasVideo:!!state.walkVideoBlob,
    postJobChecks:{...postJobState},
    linkedCustProfileId:state.linkedCustProfileId||null,
    workVault:[], date:new Date().toISOString()
  };
  customers.unshift(record); saveCustomers();
  toast('✓ Inspection saved!');
  setTimeout(()=>gotoScreen('customers'),800);
}

// ══════════════════════════════════════════
// PDF
// ══════════════════════════════════════════
function generatePDF(record){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'pt',format:'letter'});
  const W=doc.internal.pageSize.getWidth(); let y=40;
  doc.setFillColor(26,26,46); doc.rect(0,0,W,75,'F');
  doc.setTextColor(232,255,71); doc.setFont('helvetica','bold'); doc.setFontSize(24); doc.text('InspectPro',40,38);
  doc.setTextColor(255,255,255); doc.setFontSize(11); doc.setFont('helvetica','normal'); doc.text('VEHICLE INSPECTION REPORT',40,56);
  doc.setTextColor(136,136,170); doc.setFontSize(9); doc.text(`Date: ${new Date(record.date||Date.now()).toLocaleDateString()}  WO: ${record.workOrder||'—'}`,40,68);
  y=95;
  [['Customer',record.name||'—'],['Vehicle',record.vehicle||'—'],['Mileage',record.miles||'—'],['Technician',record.mechanicName||record.tech||'—']].forEach(([l,v])=>{
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(153,153,176); doc.text(l,50,y+10);
    doc.setFont('helvetica','bold'); doc.setTextColor(26,26,46); doc.text(String(v),160,y+10); y+=14;
  }); y+=12;
  const allRed=Object.entries(record.checklist||{}).filter(([,v])=>v==='r').map(([k])=>k);
  const allYel=Object.entries(record.checklist||{}).filter(([,v])=>v==='y').map(([k])=>k);
  const drawSec=(title,items,rgb,dot)=>{
    if(!items.length) return;
    if(y>680){doc.addPage();y=40;}
    doc.setFillColor(...rgb); doc.rect(40,y,W-80,20,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(255,255,255); doc.text(title.toUpperCase(),50,y+14); y+=24;
    items.forEach(n=>{
      if(y>720){doc.addPage();y=40;}
      doc.setFillColor(...dot); doc.circle(52,y+5,4,'F');
      doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(40,40,60);
      const lines=doc.splitTextToSize(n,W-130); doc.text(lines,62,y+9); y+=Math.max(lines.length*13,16);
    }); y+=6;
  };
  drawSec('URGENT — IMMEDIATE REPAIR',allRed,[200,40,40],[239,68,68]);
  drawSec('MONITOR — FUTURE REPAIR',allYel,[160,120,0],[245,158,11]);
  if(record.recServices?.length){
    if(y>680){doc.addPage();y=40;}
    doc.setFillColor(26,26,46); doc.rect(40,y,W-80,20,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(232,255,71); doc.text('RECOMMENDED SERVICES',50,y+14); y+=24;
    record.recServices.forEach(s=>{ doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(40,40,60); doc.text('• '+s,50,y+9); y+=16; }); y+=6;
  }
  if(record.comments){ if(y>680){doc.addPage();y=40;} doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(26,26,46); doc.text('TECH COMMENTS',40,y+12); y+=18; doc.setFont('helvetica','italic'); doc.setFontSize(10); doc.setTextColor(80,80,110); const lines=doc.splitTextToSize(record.comments,W-80); doc.text(lines,40,y+10); y+=lines.length*14+10; }
  doc.setFontSize(8); doc.setTextColor(180,180,200); doc.text('Generated by InspectPro',40,doc.internal.pageSize.getHeight()-16);
  return doc;
}

function downloadPDF(){
  const name=document.getElementById('f-name')?.value||'customer';
  const rec={name,vehicle:[document.getElementById('f-year')?.value,document.getElementById('f-make')?.value,document.getElementById('f-model')?.value].filter(Boolean).join(' '),miles:document.getElementById('f-miles')?.value,workOrder:document.getElementById('f-wo')?.value,tech:document.getElementById('f-tech')?.value,mechanicName:document.getElementById('f-tech')?.value,comments:document.getElementById('f-comments')?.value,checklist:state.checklist,recServices:state.recServices,date:new Date().toISOString()};
  generatePDF(rec).save(`InspectionReport-${name.replace(/\s/g,'_')}.pdf`);
  toast('PDF downloaded!');
}

// ══════════════════════════════════════════
// SEND MODAL
// ══════════════════════════════════════════
function openSendModal(){
  sendingForRecord=null;
  document.getElementById('sm-name').value=document.getElementById('f-name')?.value||'';
  document.getElementById('sm-phone').value=document.getElementById('f-phone')?.value||'';
  document.getElementById('sm-email').value=document.getElementById('f-email')?.value||'';
  document.getElementById('send-modal').classList.add('open');
}
function openSendModalForRecord(){
  const name=document.getElementById('detail-name').textContent;
  const rec=customers.find(c=>c.name===name);
  sendingForRecord=rec||null;
  document.getElementById('sm-name').value=rec?.name||'';
  document.getElementById('sm-phone').value=rec?.phone||'';
  document.getElementById('sm-email').value=rec?.email||'';
  document.getElementById('send-modal').classList.add('open');
}
function closeSendModal(){ document.getElementById('send-modal').classList.remove('open'); }

function doSend(){
  const phone=document.getElementById('sm-phone').value.trim();
  const email=document.getElementById('sm-email').value.trim();
  if(!phone&&!email){ toast('Enter phone or email first.'); return; }
  closeSendModal();
  const rec=sendingForRecord||{name:document.getElementById('f-name')?.value||'',vehicle:[document.getElementById('f-year')?.value,document.getElementById('f-make')?.value,document.getElementById('f-model')?.value].filter(Boolean).join(' '),miles:document.getElementById('f-miles')?.value,workOrder:document.getElementById('f-wo')?.value,tech:document.getElementById('f-tech')?.value,mechanicName:document.getElementById('f-tech')?.value,comments:document.getElementById('f-comments')?.value,workDone:document.getElementById('f-work-done')?.value,checklist:state.checklist,recServices:state.recServices,linkedCustProfileId:state.linkedCustProfileId,date:new Date().toISOString()};
  const profileId=rec.linkedCustProfileId;
  if(profileId){
    const pIdx=custProfiles.findIndex(p=>p.id===profileId);
    if(pIdx>=0){
      custProfiles[pIdx].carReport={date:new Date().toISOString(),vehicle:rec.vehicle,miles:rec.miles,tech:rec.tech,mechanicName:rec.mechanicName||rec.tech||'',checklist:rec.checklist||{},recServices:rec.recServices||[],comments:rec.comments||'',workDone:rec.workDone||''};
      saveCustProfiles();
    }
  }
  generatePDF(rec).save(`CarReport-${(rec.name||'customer').replace(/\s/g,'_')}.pdf`);
  toast('📄 Report downloaded! Share via text or email.');
}

// ══════════════════════════════════════════
// CUSTOMERS LIST
// ══════════════════════════════════════════
function renderCustomers(){
  const list=document.getElementById('customer-list-view');
  document.getElementById('cust-count-badge').textContent=customers.length+' Records';
  if(!customers.length){list.innerHTML=`<div class="empty-state"><div class="es-icon">📋</div><h3>No Records Yet</h3><p>Save an inspection to see it here.</p></div>`;return;}
  list.innerHTML=customers.map((c,i)=>{
    const reds=Object.entries(c.checklist||{}).filter(([,v])=>v==='r').length;
    const yels=Object.entries(c.checklist||{}).filter(([,v])=>v==='y').length;
    const profile=c.linkedCustProfileId?custProfiles.find(p=>p.id===c.linkedCustProfileId):null;
    const sub=profile?.submissions?.[profile.submissions.length-1];
    const svcCount=sub?.requestedServices?.length||0;
    const init=c.name.split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2)||'?';
    return `<div class="customer-card" onclick="openCustomer(${i})">
      <div class="cust-avatar">${init}</div>
      <div class="cust-info"><div class="cname">${c.name}</div><div class="cveh">${c.vehicle}</div></div>
      <div class="cust-chips">
        ${reds?`<span class="chip chip-red">🔴 ${reds}</span>`:''}
        ${yels?`<span class="chip chip-yellow">🟡 ${yels}</span>`:''}
        ${svcCount?`<span class="chip chip-blue">🔧 ${svcCount}</span>`:''}
        ${c.workVault?.length?`<span class="chip" style="background:rgba(34,214,122,.12);color:#16a34a">🎬 Vault</span>`:''}
        <span class="chip chip-date">${new Date(c.date).toLocaleDateString()}</span>
      </div>
    </div>`;
  }).join('');
}

function renderHomeRecent(){
  const el=document.getElementById('home-recent'); if(!el) return;
  if(!customers.length){el.innerHTML='<div style="color:var(--muted);font-size:13px;padding:8px 0">No inspections yet.</div>';return;}
  el.innerHTML=customers.slice(0,4).map((c,i)=>{
    const init=c.name.split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2)||'?';
    return `<div class="customer-card" onclick="openCustomer(${i})">
      <div class="cust-avatar" style="width:36px;height:36px;font-size:14px">${init}</div>
      <div class="cust-info"><div class="cname" style="font-size:13px">${c.name}</div><div class="cveh">${c.vehicle} · ${new Date(c.date).toLocaleDateString()}</div></div>
    </div>`;
  }).join('');
}

function openCustomer(i){
  const c=customers[i];
  document.getElementById('detail-name').textContent=c.name;
  const reds=Object.entries(c.checklist||{}).filter(([,v])=>v==='r').map(([k])=>k);
  const yels=Object.entries(c.checklist||{}).filter(([,v])=>v==='y').map(([k])=>k);
  const profile=c.linkedCustProfileId?custProfiles.find(p=>p.id===c.linkedCustProfileId):null;
  const sub=profile?.submissions?.length?profile.submissions[profile.submissions.length-1]:null;
  const vault=c.workVault||[];
  document.getElementById('detail-content').innerHTML=`
    <div class="card">
      <div class="card-title">Vehicle Info</div>
      <div class="receipt-row"><span class="rlabel">Vehicle</span><span class="rval">${c.vehicle}</span></div>
      <div class="receipt-row"><span class="rlabel">Mileage</span><span class="rval">${c.miles||'—'}</span></div>
      <div class="receipt-row"><span class="rlabel">Work Order</span><span class="rval">${c.workOrder||'—'}</span></div>
      <div class="receipt-row"><span class="rlabel">Technician</span><span class="rval" style="color:var(--accent);font-weight:800">${c.mechanicName||c.tech||'—'}</span></div>
      <div class="receipt-row"><span class="rlabel">Date</span><span class="rval">${new Date(c.date).toLocaleString()}</span></div>
    </div>
    ${reds.length?`<div class="card"><div class="card-title" style="color:var(--red)">🔴 Urgent</div>${reds.map(n=>`<div class="issue-row"><div style="width:10px;height:10px;border-radius:3px;background:var(--red);flex-shrink:0;margin-top:2px"></div><span>${n}</span></div>`).join('')}</div>`:''}
    ${yels.length?`<div class="card"><div class="card-title" style="color:var(--yellow)">🟡 Monitor</div>${yels.map(n=>`<div class="issue-row"><div style="width:10px;height:10px;border-radius:3px;background:var(--yellow);flex-shrink:0;margin-top:2px"></div><span>${n}</span></div>`).join('')}</div>`:''}
    ${c.workDone?`<div class="card" style="border-color:rgba(34,214,122,.25)"><div class="card-title" style="color:var(--green)">✅ Work Completed</div><div style="font-size:13px;line-height:1.7">${c.workDone}</div></div>`:''}
    ${c.recServices?.length?`<div class="card"><div class="card-title">Recommended Services</div>${c.recServices.map(s=>`<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">• ${s}</div>`).join('')}</div>`:''}
    ${c.comments?`<div class="card"><div class="card-title">Tech Comments</div><div style="font-size:13px;color:var(--muted);line-height:1.7">${c.comments}</div></div>`:''}
    ${c.photos?.length?`<div class="card"><div class="card-title">📷 Photos (${c.photos.length})</div><div class="photo-grid">${c.photos.map(p=>`<div class="photo-thumb"><img src="${p.dataUrl}"></div>`).join('')}</div></div>`:''}
    ${sub?`<div class="card" style="border-color:rgba(59,130,246,.25)">
      <div class="card-title" style="color:var(--blue)">📱 Customer Submitted</div>
      ${sub.requestedServices?.length?`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">${sub.requestedServices.map(s=>`<span style="background:rgba(59,130,246,.1);color:var(--blue);font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px">${s}</span>`).join('')}</div>`:''}
      ${sub.videoDataUrl?`<video controls src="${sub.videoDataUrl}" style="width:100%;max-height:180px;border-radius:10px;object-fit:cover;margin-bottom:10px"></video>`:''}
      ${sub.photos?.length?`<div class="photo-grid">${sub.photos.map(p=>`<div class="photo-thumb"><img src="${p}"></div>`).join('')}</div>`:''}
      ${sub.comments?`<div style="background:var(--bg);border-radius:8px;padding:10px;font-size:13px;color:var(--muted);font-style:italic;border:1px solid var(--border);margin-top:10px">"${sub.comments}"</div>`:''}
    </div>`:''}
    <div class="card" style="border-color:rgba(34,214,122,.2)">
      <div style="display:flex;align-items:center;margin-bottom:14px">
        <div class="card-title" style="color:#16a34a;margin-bottom:0;flex:1">🎬 Work Video Vault</div>
        <button class="btn btn-ghost" style="font-size:12px;padding:7px 12px" onclick="openVaultModal(${c.id})">+ Add Video</button>
      </div>
      ${vault.length?vault.map((v,vi)=>`
        <div class="vault-item" id="vault-${c.id}-${vi}">
          <div class="vi-header">
            <span class="vi-title">${v.title||'Untitled'}</span>
            <span class="vi-date">${new Date(v.date).toLocaleDateString()}</span>
            <button class="vi-toggle" onclick="toggleVault('${c.id}',${vi})">▼</button>
            <button class="rm-btn" onclick="deleteVaultVideo(${i},${vi})">🗑</button>
          </div>
          <div class="vi-body"><video controls src="${v.videoDataUrl}" style="width:100%;max-height:180px;border-radius:10px;object-fit:cover;margin-top:8px"></video></div>
        </div>`).join(''):'<div style="color:var(--muted);font-size:13px">No work videos yet.</div>'}
    </div>`;
  gotoScreen('cust-detail');
}

function toggleVault(custId,vi){ const el=document.getElementById(`vault-${custId}-${vi}`); if(el) el.classList.toggle('open'); }
function deleteVaultVideo(recIdx,vi){ customers[recIdx].workVault.splice(vi,1); saveCustomers(); openCustomer(recIdx); toast('Video removed.'); }

// ══════════════════════════════════════════
// VAULT MODAL
// ══════════════════════════════════════════
function openVaultModal(recordId){ vaultTargetRecordId=recordId; vaultVideoBlob=null; document.getElementById('vm-title').value=''; document.getElementById('vm-preview-wrap').style.display='none'; document.getElementById('vault-modal').classList.add('open'); }
function closeVaultModal(){ document.getElementById('vault-modal').classList.remove('open'); }
function vaultFileSelected(input){ const f=input.files[0]; if(!f) return; vaultVideoBlob=f; const p=document.getElementById('vm-preview'); p.src=URL.createObjectURL(f); document.getElementById('vm-preview-wrap').style.display='block'; }
function saveVaultVideo(){
  if(!vaultVideoBlob){toast('Select a video first.');return;}
  const title=document.getElementById('vm-title').value.trim()||'Work Video';
  const reader=new FileReader();
  reader.onload=e=>{
    const idx=customers.findIndex(c=>c.id===vaultTargetRecordId);
    if(idx<0){toast('Record not found.');return;}
    if(!customers[idx].workVault) customers[idx].workVault=[];
    customers[idx].workVault.push({title,date:new Date().toISOString(),videoDataUrl:e.target.result});
    saveCustomers(); closeVaultModal(); toast('✓ Video saved!'); openCustomer(idx);
  };
  reader.readAsDataURL(vaultVideoBlob);
}

// ══════════════════════════════════════════
// INBOX
// ══════════════════════════════════════════
function renderInbox(){
  const list=document.getElementById('inbox-list'); if(!list) return;
  const myUsername=currentTechAccount?.username; if(!myUsername) return;
  const allJobs=[];
  custProfiles.forEach(profile=>{
    (profile.submissions||[]).forEach((sub,subIdx)=>{
      if(sub.sentToTech===myUsername) allJobs.push({sub,subIdx,profile});
    });
  });
  allJobs.sort((a,b)=>new Date(b.sub.date)-new Date(a.sub.date));
  const pending=allJobs.filter(j=>!j.sub.jobStatus||j.sub.jobStatus==='pending');
  const pb=document.getElementById('inbox-pending-badge'); if(pb) pb.textContent=pending.length+' Pending';
  const cb=document.getElementById('inbox-badge-count'); if(cb){cb.textContent=pending.length;cb.style.display=pending.length>0?'inline':'none';}
  if(!allJobs.length){list.innerHTML=`<div class="empty-state"><div class="es-icon">📥</div><h3>No Submissions Yet</h3><p>Customer job requests appear here.</p></div>`;return;}
  list.innerHTML=allJobs.map(({sub,subIdx,profile})=>{
    const status=sub.jobStatus||'pending';
    const sc=status==='accepted'?'accepted':status==='declined'?'declined':'pending';
    const sb=status==='accepted'?'<span class="inbox-badge badge-accepted">✓ Accepted</span>':status==='declined'?'<span class="inbox-badge badge-declined">✕ Declined</span>':'<span class="inbox-badge badge-pending">⏳ Pending</span>';
    const svcCount=sub.requestedServices?.length||0;
    const init=profile.name.split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2)||'?';
    return `<div class="inbox-item ${sc}">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:42px;height:42px;border-radius:12px;background:var(--dark);color:var(--accent);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:16px;flex-shrink:0">${init}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><div style="font-weight:700;font-size:15px">${profile.name}</div>${sb}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">${profile.vehicle||'—'} · ${new Date(sub.date).toLocaleString()}</div>
        </div>
      </div>
      ${svcCount?`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">${sub.requestedServices.map(s=>`<span style="background:rgba(59,130,246,.1);color:var(--blue);font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px">${s}</span>`).join('')}</div>`:''}
      ${sub.comments?`<div style="background:var(--bg);border-radius:8px;padding:10px 12px;font-size:13px;color:var(--muted);font-style:italic;margin-bottom:10px;border:1px solid var(--border)">"${sub.comments}"</div>`:''}
      ${status==='pending'?`<div style="display:flex;gap:8px"><button class="btn btn-green" style="flex:1" onclick="respondToJob('${profile.id}',${subIdx},'accepted')">✓ Accept</button><button class="btn btn-ghost" style="border-color:var(--red);color:var(--red)" onclick="respondToJob('${profile.id}',${subIdx},'declined')">✕ Decline</button></div>`:''}
      ${status==='accepted'?`<div style="background:rgba(34,214,122,.08);border:1px solid rgba(34,214,122,.2);border-radius:8px;padding:10px;font-size:13px;color:var(--green);font-weight:600;text-align:center">✓ Accepted — customer notified</div>`:''}
      ${status==='declined'?`<div style="background:rgba(255,59,59,.06);border:1px solid rgba(255,59,59,.15);border-radius:8px;padding:10px;font-size:13px;color:var(--red);font-weight:600;text-align:center">✕ Declined — customer notified</div>`:''}
    </div>`;
  }).join('');
}

function respondToJob(profileId,subIdx,response){
  const id=parseInt(profileId);
  const pIdx=custProfiles.findIndex(p=>p.id===id);
  if(pIdx<0){toast('Profile not found.');return;}
  custProfiles[pIdx].submissions[subIdx].jobStatus=response;
  saveCustProfiles(); renderInbox();
  toast(response==='accepted'?'✓ Job accepted!':'✕ Job declined.');
}

// ══════════════════════════════════════════
// ACCOUNTS
// ══════════════════════════════════════════
function renderAccountsScreen(){
  const techList=document.getElementById('tech-accounts-list');
  techList.innerHTML=techAccounts.length?techAccounts.map((a,i)=>`
    <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">
      <div style="width:36px;height:36px;border-radius:10px;background:var(--dark);color:var(--accent);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:14px;flex-shrink:0">${a.name.charAt(0)}</div>
      <div style="flex:1"><div style="font-weight:700;font-size:13px">${a.name}</div><div style="font-size:11px;color:var(--muted)">@${a.username} · ${a.role} · ${a.rating?'⭐'.repeat(a.rating):'No rating'}</div></div>
      <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="openEditAccount('tech',${i})">✏️ Edit</button>
      ${a.role!=='admin'?`<button class="btn btn-ghost" style="font-size:11px;padding:5px 10px;border-color:var(--red);color:var(--red)" onclick="deleteAccount('tech',${i})">🗑</button>`:''}
    </div>`).join(''):'<div style="color:var(--muted);font-size:13px">No tech accounts.</div>';
  const custList=document.getElementById('customer-accounts-list');
  custList.innerHTML=custProfiles.length?custProfiles.map((p,i)=>`
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:36px;height:36px;border-radius:10px;background:var(--dark);color:var(--accent);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:14px;flex-shrink:0">${p.name.charAt(0)}</div>
      <div style="flex:1"><div style="font-weight:700;font-size:13px">${p.name}</div><div style="font-size:12px;color:var(--muted)">@${p.username||'—'} · ${p.vehicle||'—'}</div></div>
      <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="openEditAccount('customer',${i})">✏️ Edit</button>
      <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px;border-color:var(--red);color:var(--red)" onclick="deleteAccount('customer',${i})">🗑</button>
    </div>`).join(''):'<div style="color:var(--muted);font-size:13px">No customer accounts yet.</div>';
}

function openAccountModal(type){
  document.getElementById('acct-modal-title').textContent=type==='tech'?'New Technician':'New Customer';
  document.getElementById('acct-modal-sub').textContent='Fill in the details below.';
  document.getElementById('acct-type').value=type; document.getElementById('acct-edit-id').value='';
  ['acct-name','acct-username','acct-password','acct-phone','acct-vehicle'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('acct-error').textContent='';
  document.getElementById('acct-cust-fields').style.display=type==='customer'?'block':'none';
  document.getElementById('acct-tech-fields').style.display=type==='tech'?'block':'none';
  acctCurrentRating=0; setAcctRating(0);
  document.getElementById('account-modal').classList.add('open');
}

function openEditAccount(type,idx){
  const a=type==='tech'?techAccounts[idx]:custProfiles[idx];
  document.getElementById('acct-modal-title').textContent='Edit Account';
  document.getElementById('acct-modal-sub').textContent='Leave password blank to keep existing.';
  document.getElementById('acct-type').value=type; document.getElementById('acct-edit-id').value=idx;
  document.getElementById('acct-name').value=a.name||''; document.getElementById('acct-username').value=a.username||'';
  document.getElementById('acct-password').value=''; document.getElementById('acct-phone').value=a.phone||''; document.getElementById('acct-vehicle').value=a.vehicle||'';
  document.getElementById('acct-error').textContent='';
  document.getElementById('acct-cust-fields').style.display=type==='customer'?'block':'none';
  document.getElementById('acct-tech-fields').style.display=type==='tech'?'block':'none';
  acctCurrentRating=(type==='tech'?a.rating:0)||0; setAcctRating(acctCurrentRating);
  document.getElementById('account-modal').classList.add('open');
}

function closeAccountModal(){ document.getElementById('account-modal').classList.remove('open'); }

function saveAccount(){
  const type=document.getElementById('acct-type').value;
  const editId=document.getElementById('acct-edit-id').value;
  const name=document.getElementById('acct-name').value.trim();
  const username=document.getElementById('acct-username').value.trim().toLowerCase().replace(/\s/g,'');
  const password=document.getElementById('acct-password').value;
  const phone=document.getElementById('acct-phone').value.trim();
  const vehicle=document.getElementById('acct-vehicle').value.trim();
  document.getElementById('acct-error').textContent='';
  if(!name||!username){document.getElementById('acct-error').textContent='Name and username required.';return;}
  const isEdit=editId!=='';
  if(type==='tech'){
    if(techAccounts.find((a,i)=>a.username===username&&(!isEdit||i!==parseInt(editId)))){document.getElementById('acct-error').textContent='Username taken.';return;}
    if(isEdit){const idx=parseInt(editId);techAccounts[idx].name=name;techAccounts[idx].username=username;techAccounts[idx].rating=acctCurrentRating;if(password)techAccounts[idx].passwordHash=hashPassword(password);}
    else{if(!password){document.getElementById('acct-error').textContent='Password required.';return;}techAccounts.push({id:Date.now(),name,username,passwordHash:hashPassword(password),role:'tech',rating:acctCurrentRating});}
    saveTechAccounts();
  } else {
    if(custProfiles.find((p,i)=>p.username===username&&(!isEdit||i!==parseInt(editId)))){document.getElementById('acct-error').textContent='Username taken.';return;}
    if(isEdit){const idx=parseInt(editId);custProfiles[idx].name=name;custProfiles[idx].username=username;custProfiles[idx].phone=phone;if(vehicle)custProfiles[idx].vehicle=vehicle;if(password)custProfiles[idx].passwordHash=hashPassword(password);}
    else{if(!password){document.getElementById('acct-error').textContent='Password required.';return;}custProfiles.push({id:Date.now(),name,username,passwordHash:hashPassword(password),phone,vehicle:vehicle||'Not provided',submissions:[]});}
    saveCustProfiles();
  }
  closeAccountModal(); renderAccountsScreen(); toast('✓ Account saved!');
}

function deleteAccount(type,idx){
  if(!confirm('Delete this account?')) return;
  if(type==='tech'){if(techAccounts[idx]?.role==='admin'){toast('Cannot delete admin.');return;}techAccounts.splice(idx,1);saveTechAccounts();}
  else{custProfiles.splice(idx,1);saveCustProfiles();}
  renderAccountsScreen(); toast('Account deleted.');
}

// ══════════════════════════════════════════
// PRICING
// ══════════════════════════════════════════
const DEFAULT_SERVICES=[
  {icon:'🛢️',name:'Oil Change',price:89},{icon:'🔍',name:'Full Diagnostic',price:120},
  {icon:'🛞',name:'Tire Inspection',price:35},{icon:'🔄',name:'Tire Rotation',price:45},
  {icon:'⚖️',name:'Wheel Alignment',price:95},{icon:'🛑',name:'Brake Service',price:180},
  {icon:'🔋',name:'Battery Check',price:25},{icon:'❄️',name:'A/C Service',price:149},
  {icon:'🌡️',name:'Coolant Flush',price:99},{icon:'⚙️',name:'Transmission Flush',price:199},
  {icon:'🔧',name:'Engine Tune-Up',price:150},{icon:'💡',name:'Check Engine Light',price:75},
  {icon:'🚘',name:'Windshield Wipers',price:28},{icon:'🛡️',name:'Cabin Air Filter',price:45},
  {icon:'🌬️',name:'Engine Air Filter',price:38},{icon:'🔩',name:'Suspension Check',price:60},
];
function getServicePrices(){ try{ const s=localStorage.getItem('ip_service_prices'); return s?JSON.parse(s):DEFAULT_SERVICES.map(s=>({...s})); }catch(e){ return DEFAULT_SERVICES.map(s=>({...s})); } }
function buildPriceEditor(){ const c=document.getElementById('app-price-editor'); if(!c) return; const prices=getServicePrices(); c.innerHTML=prices.map((s,i)=>`<div class="price-edit-row"><span class="pe-icon">${s.icon}</span><span class="pe-name">${s.name}</span><div class="pe-wrap"><span class="pe-dollar">$</span><input class="pe-input" type="number" min="0" id="pe-${i}" value="${s.price}"></div></div>`).join(''); }
function saveServicePrices(){ const prices=getServicePrices(); prices.forEach((s,i)=>{ const el=document.getElementById('pe-'+i); if(el){const v=parseFloat(el.value);s.price=isNaN(v)||v<0?0:v;} }); try{localStorage.setItem('ip_service_prices',JSON.stringify(prices));}catch(e){} const msg=document.getElementById('price-saved-msg'); if(msg){msg.style.display='block';setTimeout(()=>msg.style.display='none',2500);} toast('✓ Prices saved!'); }

// ══════════════════════════════════════════
// CUSTOMER PORTAL
// ══════════════════════════════════════════
const PORTAL_SERVICES=[
  {icon:'🛢️',label:'Oil Change'},{icon:'🔍',label:'Full Diagnostic'},{icon:'🛞',label:'Tire Inspection'},
  {icon:'🔄',label:'Tire Rotation'},{icon:'⚖️',label:'Wheel Alignment'},{icon:'🛑',label:'Brake Service'},
  {icon:'🔋',label:'Battery Check'},{icon:'❄️',label:'A/C Service'},{icon:'🌡️',label:'Coolant Flush'},
  {icon:'⚙️',label:'Transmission Flush'},{icon:'🔧',label:'Engine Tune-Up'},{icon:'💡',label:'Check Engine Light'},
  {icon:'🚘',label:'Windshield Wipers'},{icon:'🛡️',label:'Cabin Air Filter'},{icon:'🌬️',label:'Engine Air Filter'},
  {icon:'🔩',label:'Suspension Check'},
];

let portalSelectedServices=[];
let portalPhotos=[];
let portalVideoBlob=null;
let portalSelectedTech=null;

function buildPortalServicesGrid(){
  portalSelectedServices=[];
  const grid=document.getElementById('portal-services-grid'); if(!grid) return;
  grid.innerHTML=PORTAL_SERVICES.map((s,i)=>`<button class="portal-service-btn" id="psvc-${i}" onclick="togglePortalService(${i})"><span>${s.icon}</span>${s.label}</button>`).join('');
}

function togglePortalService(i){
  const btn=document.getElementById('psvc-'+i);
  const label=PORTAL_SERVICES[i].label;
  if(portalSelectedServices.includes(label)){portalSelectedServices=portalSelectedServices.filter(s=>s!==label);btn.classList.remove('selected');}
  else{portalSelectedServices.push(label);btn.classList.add('selected');}
}

function portalHandlePhotos(input){
  const files=Array.from(input.files||[]);
  if(!files.length) return;
  let loaded=0;
  files.forEach(file=>{
    const reader=new FileReader();
    reader.onload=e=>{portalPhotos.push(e.target.result);loaded++;if(loaded===files.length)renderPortalPhotos();};
    reader.onerror=()=>{loaded++;if(loaded===files.length)renderPortalPhotos();};
    reader.readAsDataURL(file);
  });
  input.value='';
}

function renderPortalPhotos(){
  const g=document.getElementById('portal-photo-grid'); if(!g) return;
  g.innerHTML=portalPhotos.map((p,i)=>`<div class="portal-photo-thumb"><img src="${p}"><button class="del-btn" onclick="removePortalPhoto(${i})">✕</button></div>`).join('');
}

function removePortalPhoto(i){ portalPhotos.splice(i,1); renderPortalPhotos(); }

function portalHandleVideo(input){
  const file=input.files&&input.files[0]; if(!file) return;
  portalVideoBlob=file;
  const preview=document.getElementById('portal-video-preview');
  if(preview){preview.src=URL.createObjectURL(file);preview.style.display='block';}
  const status=document.getElementById('portal-video-status');
  if(status) status.textContent='✓ Video ready: '+file.name;
  input.value='';
}

function initSendToSection(profile){
  portalSelectedTech=null;
  const prevRow=document.getElementById('previous-tech-row');
  const prevBtn=document.getElementById('prev-tech-btn');
  if(profile.preferredMechanic){
    const tech=techAccounts.find(a=>a.username===profile.preferredMechanic);
    if(tech&&prevRow&&prevBtn){
      prevRow.style.display='block';
      const initials=tech.name.split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2)||'?';
      prevBtn.innerHTML=`<div onclick="setSendToTech('${tech.username}','${tech.name}')" style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px;cursor:pointer">
        <div style="width:38px;height:38px;border-radius:10px;background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:#e8ff47;flex-shrink:0">${initials}</div>
        <div style="flex:1"><div style="font-weight:700;font-size:13px;color:#fff">${tech.name}</div><div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:2px">${getPortalStars(tech.username)}</div></div>
        <div style="font-size:11px;font-weight:700;color:rgba(232,255,71,.7);background:rgba(232,255,71,.08);padding:4px 10px;border-radius:20px">Select →</div>
      </div>`;
    } else if(prevRow) { prevRow.style.display='none'; }
  } else if(prevRow) { prevRow.style.display='none'; }
  const si=document.getElementById('send-search-input'); if(si) si.value='';
  const sr=document.getElementById('send-to-results'); if(sr) sr.innerHTML='';
  updateSubmitBtn();
}

function sendToSearch(query){
  const results=document.getElementById('send-to
