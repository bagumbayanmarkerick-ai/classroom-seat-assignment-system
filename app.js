const DB_NAME = 'classroom-seats';
const DB_VERSION = 1;
let db;
const $ = (selector) => document.querySelector(selector);
const today = new Date();
const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      const students = database.createObjectStore('students', {keyPath:'id', autoIncrement:true});
      students.createIndex('name', 'name', {unique:true});
      students.createIndex('seat', 'seat', {unique:true});
      const attendance = database.createObjectStore('attendance', {keyPath:'key'});
      attendance.createIndex('day', 'day');
      attendance.createIndex('studentId', 'studentId');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function all(store) { return new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}); }
function write(store, value, method='put') { return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store)[method](value);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);}); }
function removeStudent(id) { return new Promise((resolve,reject)=>{const tx=db.transaction(['students','attendance'],'readwrite');tx.objectStore('students').delete(id);const req=tx.objectStore('attendance').index('studentId').openCursor(IDBKeyRange.only(id));req.onsuccess=()=>{const c=req.result;if(c){c.delete();c.continue();}};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);}); }
const esc = (s) => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sortRoster = (items) => items.sort((a,b)=>a.seat.localeCompare(b.seat,undefined,{numeric:true,sensitivity:'base'}));
function imageAsDataUrl(file) {
  if (!file) return Promise.resolve('');
  return new Promise((resolve,reject)=>{
    const reader=new FileReader(); reader.onerror=()=>reject(reader.error);
    reader.onload=async()=>{try{const image=await createImageBitmap(file);const scale=Math.min(1,480/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();resolve(canvas.toDataURL('image/jpeg',0.78));}catch(error){reject(error);}};
    reader.readAsArrayBuffer(file);
  });
}
function studentDetails(student) {
  const parts=[]; if(student.subject)parts.push(`Subject: ${esc(student.subject)}`);if(student.grade)parts.push(`Grade: ${esc(student.grade)}`);
  return parts.length?`<span class="seat-label">${parts.join(' · ')}</span>`:'';
}
function portrait(student) { return student.picture?`<img class="portrait" src="${student.picture}" alt="Picture of ${esc(student.name)}">`:'<span class="portrait placeholder" aria-hidden="true">👤</span>'; }

async function render() { await Promise.all([renderPlan(),renderRoster(),renderHistory()]); }
async function renderPlan() {
  const date = $('#attendance-date').value; const roster=sortRoster(await all('students')); const records=(await all('attendance')).filter(a=>a.day===date);
  const byId=new Map(records.map(a=>[a.studentId,a.status]));
  const present=roster.filter(s=>byId.get(s.id)==='Present').length;
  const absent=roster.filter(s=>byId.get(s.id)==='Absent').length;
  $('#total-count').textContent=roster.length;
  $('#present-count').textContent=present;
  $('#absent-count').textContent=absent;
  $('#unmarked-count').textContent=Math.max(0,roster.length-present-absent);
  $('#plan').innerHTML=roster.length?roster.map(s=>{const status=byId.get(s.id);return `<article class="student-card">${portrait(s)}<div class="student-info"><span class="student-name">${esc(s.name)}</span><span class="seat-label">Seat ${esc(s.seat)} · <span class="status ${status||''}">${status||'Not marked'}</span></span>${studentDetails(s)}</div><div class="attendance-actions"><button data-mark="Present" data-id="${s.id}" class="${status==='Present'?'selected':''}">Present</button><button data-mark="Absent" data-id="${s.id}" class="absent ${status==='Absent'?'selected':''}">Absent</button></div></article>`}).join(''):'<div class="empty">Add students in the Students section to start.</div>';
}
async function renderRoster() {
  const roster=sortRoster(await all('students'));
  $('#roster').innerHTML=roster.length?roster.map(s=>`<article class="student-card">${portrait(s)}<div class="student-info"><span class="student-name">${esc(s.name)}</span><span class="seat-label">Seat ${esc(s.seat)}</span>${studentDetails(s)}</div><div class="attendance-actions"><button class="secondary" data-edit="${s.id}" data-seat="${esc(s.seat)}">Change seat</button><button class="absent" data-delete="${s.id}" data-name="${esc(s.name)}">Remove</button></div></article>`).join(''):'<div class="empty">No students yet. Add the first student above.</div>';
}
async function renderHistory() {
  const month=$('#history-month').value; const [roster, records]=await Promise.all([all('students'),all('attendance')]);
  const names=new Map(roster.map(s=>[s.id,s.name])); const filtered=records.filter(a=>a.day.startsWith(month)).sort((a,b)=>a.day.localeCompare(b.day)||String(names.get(a.studentId)||'').localeCompare(names.get(b.studentId)||''));
  if(!filtered.length){$('#history-list').innerHTML='<div class="empty">No attendance records for this month.</div>';return;}
  const grouped=new Map(); for(const row of filtered){if(!names.has(row.studentId))continue;if(!grouped.has(row.day))grouped.set(row.day,[]);grouped.get(row.day).push(row);}
  $('#history-list').innerHTML=[...grouped].map(([day,rows])=>`<section class="history-day"><h3>${day}</h3>${rows.map(r=>`<div class="history-row"><span>${esc(names.get(r.studentId))}</span><span class="status ${r.status}">${r.status}</span></div>`).join('')}</section>`).join('')||'<div class="empty">No attendance records for this month.</div>';
}

document.querySelectorAll('.tab').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.tab,.page').forEach(el=>el.classList.remove('active'));button.classList.add('active');$('#'+button.dataset.page).classList.add('active');}));
$('#attendance-date').value=localISO(today); $('#history-month').value=localISO(today).slice(0,7);
$('#attendance-date').addEventListener('change',renderPlan); $('#history-month').addEventListener('change',renderHistory);
$('#student-form').addEventListener('submit',async event=>{event.preventDefault();const name=$('#student-name').value.trim(),seat=$('#student-seat').value.trim(),subject=$('#student-subject').value.trim(),grade=$('#student-grade').value.trim(),file=$('#student-picture').files[0];try{const picture=await imageAsDataUrl(file);await write('students',{name,seat,subject,grade,picture},'add');$('#student-form').reset();$('#save-state').textContent='Student and details saved on this device.';await render();}catch(e){alert(e.name==='ConstraintError'?'That student name or seat is already in use.':'Could not save student or picture.');}});
$('#plan').addEventListener('click',async event=>{const button=event.target.closest('[data-mark]');if(!button)return;const studentId=Number(button.dataset.id),day=$('#attendance-date').value;await write('attendance',{key:`${studentId}|${day}`,studentId,day,status:button.dataset.mark});$('#save-state').textContent=`Attendance saved for ${day}.`;await renderPlan();});
$('#roster').addEventListener('click',async event=>{const del=event.target.closest('[data-delete]');if(del){if(confirm(`Remove ${del.dataset.name} and their attendance records?`)){await removeStudent(Number(del.dataset.delete));await render();}return;}const edit=event.target.closest('[data-edit]');if(edit){$('#edit-id').value=edit.dataset.edit;$('#edit-seat').value=edit.dataset.seat;$('#edit-dialog').showModal();}});
$('#edit-form').addEventListener('submit',async event=>{if(event.submitter?.id!=='save-seat')return;event.preventDefault();const roster=await all('students'),student=roster.find(s=>s.id===Number($('#edit-id').value));student.seat=$('#edit-seat').value.trim();try{await write('students',student);$('#edit-dialog').close();await render();}catch(e){alert(e.name==='ConstraintError'?'That seat is already assigned.':'Could not update seat.');}});

let installPrompt; window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;$('#install').hidden=false;});
$('#install').addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('#install').hidden=true;});
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{$('#save-state').textContent='Offline setup needs this app to be opened from a secure website.';}));
openDb().then(async database=>{db=database;await render();}).catch(()=>{$('#save-state').textContent='This browser could not open local storage. Try a current version of Chrome, Edge, Firefox, or Safari.';});
