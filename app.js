// Simple viewer for Intervals.icu workouts JSON

const fileInput = document.getElementById('fileInput');
const loadDefault = document.getElementById('loadDefault');
const workoutList = document.getElementById('workoutList');
const search = document.getElementById('search');
const loadedFile = document.getElementById('loadedFile');

let workouts = [];
let filtered = [];
let allWorkouts = [];

// On GitHub Pages we load the enriched library automatically. The select allows switching if multiple libs are present.
const librarySelect = document.getElementById('librarySelect');
async function loadSelectedLibrary(){
  const fname = librarySelect.value;
  try{
    const resp = await fetch(fname);
    if(!resp.ok) throw new Error('Impossible de charger '+fname+': '+resp.status);
    const json = await resp.json();
    loadedFile.textContent = fname;
    normalizeAndRender(json);
  }catch(err){
    alert('Erreur chargement library: '+err.message);
  }
}
if(librarySelect) librarySelect.addEventListener('change', ()=> loadSelectedLibrary());
//-load default on page load
if(librarySelect) loadSelectedLibrary();

// Filter control
const filterPurpose = document.getElementById('filterPurpose');
if(filterPurpose) filterPurpose.addEventListener('change', ()=>applyFilters());

if(search) search.addEventListener('input', ()=>{
  const q = search.value.trim().toLowerCase();
  if(!q) filtered = workouts.slice();
  else filtered = workouts.filter(w => (w.name||'').toLowerCase().includes(q) || (w.type||'').toLowerCase().includes(q) || (w.category||'').toLowerCase().includes(q));
  renderList();
});

// helper to detect narrow screens
function isNarrow(){ return window.innerWidth < 768; }

function normalizeAndRender(json){
  // Expecting either array of events or object with library_intervals
  if (Array.isArray(json)) {
    workouts = json.map(normalizeEvent);
  } else if (json.library_intervals) {
    workouts = json.library_intervals.map(item=>({
      name: item.name || item.id,
      category: 'WORKOUT',
      type: 'Workout',
      start_date_local: null,
      external_id: item.id,
      icu_workout: item.icu_workout || null,
      description: item.icu_workout ? (item.icu_workout.description||'') : ''
    }));
  } else if (json.library_enriched) {
    workouts = json.library_enriched.map(item=>({
      name: item.name || item.id,
      category: 'LIB',
      type: 'WorkoutTemplate',
      start_date_local: null,
      external_id: item.id,
      icu_workout: item.icu_workout || null,
      description: item.summary || item.example || item.notes || '',
      purpose: item.purpose || '',
      effects: item.effects || '',
      summary: item.summary || ''
    }));
    // preserve full list for filtering
    allWorkouts = workouts.slice();
  } else if (json.library) {
    // fallback for workout_library.json
    workouts = json.library.map(item=>({name:item.name, category:'LIB', type:'WorkoutTemplate', start_date_local:null, external_id:item.id, icu_workout:null, description:item.example||''}));
  } else {
    alert('Format JSON inconnu — attendez un tableau d`événements ou un objet library.');
    return;
  }
  filtered = workouts.slice();
  renderList();
  populateFilterOptions();
}

function normalizeEvent(ev){
  // Some events put icu_workout at root, some use file_contents with zwo — handle common keys
  return {
    name: ev.name || ev.filename || ev.title || 'Untitled',
    category: ev.category || ev.type || null,
    type: ev.type || ev.activity_type || 'Workout',
    start_date_local: ev.start_date_local || ev.start || null,
    external_id: ev.external_id || ev.id || null,
    icu_workout: ev.icu_workout || null,
    description: ev.description || ev.notes || ''
  };
}

function renderList(){
  workoutList.innerHTML = '';
  if (!filtered.length) {
    workoutList.innerHTML = '<li class="placeholder">Aucun workout trouvé</li>';
    return;
  }
  filtered.forEach((w, idx)=>{
    const li = document.createElement('li');
    li.dataset.idx = idx;
    li.classList.add('selectable','box');
    li.style.marginBottom = '0.5rem';
    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    titleDiv.innerHTML = `${escapeHtml(w.name)}`;
    const subDiv = document.createElement('div');
    subDiv.className = 'sub';
    subDiv.innerHTML = `${escapeHtml(w.type||'')} • ${escapeHtml(w.category||'')}`;
    const tags = document.createElement('div');
    tags.className = 'tags';
    const p = document.createElement('span');
    p.className = 'tag';
    p.textContent = w.purpose || inferPurpose(w.name);
    tags.appendChild(p);
    li.appendChild(titleDiv);
    li.appendChild(subDiv);
    li.appendChild(tags);
    li.addEventListener('click', ()=>{
      // visual selection without altering layout
      document.querySelectorAll('#workoutList li.selected').forEach(el=>el.classList.remove('selected'));
      li.classList.add('selected');
      selectWorkout(idx);
    });
    workoutList.appendChild(li);
  });
}

function selectWorkout(idx){
  const w = filtered[idx];
  if(!w) return;
  // ensure list highlight matches selection (in case of programmatic select)
  document.querySelectorAll('#workoutList li.selected').forEach(el=>el.classList.remove('selected'));
  const selLi = document.querySelector('#workoutList li[data-idx="'+idx+'"]');
  if(selLi) selLi.classList.add('selected');
  document.getElementById('empty').classList.add('hidden');
  const detail = document.getElementById('workoutDetail');
  detail.classList.remove('hidden');
  document.getElementById('wName').textContent = w.name;
  document.getElementById('wCategory').textContent = w.category || '';
  document.getElementById('wType').textContent = w.type || '';
  document.getElementById('wDate').textContent = w.start_date_local || '';
  document.getElementById('wExternal').textContent = w.external_id || '';
  document.getElementById('wDescription').textContent = w.description || (w.icu_workout ? JSON.stringify(w.icu_workout, null, 2) : '');
  document.getElementById('wPurpose').textContent = w.purpose || inferPurpose(w.name);
  document.getElementById('wSummary').textContent = w.summary || '';
  document.getElementById('wEffects').textContent = w.effects || '';
  renderSteps(w.icu_workout);
  // attach export handlers
  document.getElementById('exportJson').onclick = ()=>exportAsJson(w);
  document.getElementById('exportZwo').onclick = ()=>exportAsZwo(w);

  // On narrow screens hide the list and show a back button in the detail card
  const listPane = document.getElementById('listPane');
  if(isNarrow() && listPane){
    listPane.style.display = 'none';
    // create back button if not exists
    let back = document.getElementById('backToListWorkouts');
    if(!back){
      back = document.createElement('button');
      back.id = 'backToListWorkouts';
      back.className = 'button is-light is-small';
      back.textContent = '← Retour à la liste';
      const detail = document.getElementById('workoutDetail');
      if(detail && detail.parentNode){
        detail.parentNode.insertBefore(back, detail);
      }
      back.addEventListener('click', ()=>{
        listPane.style.display = '';
        back.remove();
        // scroll into view list
        listPane.scrollIntoView({behavior:'smooth'});
        document.getElementById('empty').classList.remove('hidden');
        detail.classList.add('hidden');
        document.querySelectorAll('#workoutList li.selected').forEach(el=>el.classList.remove('selected'));
      });
    }
  }
}

function renderSteps(icu){
  const container = document.getElementById('wSteps');
  container.innerHTML = '';
  if(!icu || !icu.steps){
    container.innerHTML = '<div class="placeholder">Pas de structure (steps) disponible</div>';
    return;
  }
  icu.steps.forEach((s,i)=>{
    const el = document.createElement('div');
    el.className = 'step';
    const title = document.createElement('div');
    title.innerHTML = `<strong>${i+1}. ${escapeHtml(s.type||'step')}</strong>`;
    const body = document.createElement('div');
    body.style.marginTop='6px';
    body.innerHTML = formatStepBody(s);
    el.appendChild(title);
    el.appendChild(body);
    container.appendChild(el);
  });
}

function formatStepBody(s){
  const parts = [];
  if(s.duration) parts.push('Durée: '+s.duration+' s');
  if(s.on_duration) parts.push('On: '+s.on_duration+(s.on_duration>60?' s':' s'));
  if(s.off_duration) parts.push('Off: '+s.off_duration+' s');
  if(s.reps) parts.push('Répétitions: '+s.reps);
  if(s.distance) parts.push('Distance: '+s.distance+' m');
  if(s.target){
    if(s.target.type) parts.push('Cible: '+s.target.type+(s.target.zone?(' zone '+s.target.zone):''));
    else parts.push('Cible: '+JSON.stringify(s.target));
  }
  if(s.notes) parts.push('Notes: '+escapeHtml(s.notes));
  if(s.message) parts.push('Message: '+escapeHtml(s.message));
  return parts.join('<br>') || '<em>aucune information</em>';
}

function inferPurpose(name){
  if(!name) return '';
  const n = name.toLowerCase();
  if(n.includes('vo2') || n.includes('vo2max') ) return 'VO2max / puissance neuromusculaire';
  if(n.includes('threshold') || n.includes('seuil') || n.includes('thresh')) return 'Travail au seuil / FTP-like';
  if(n.includes('long') || n.includes('long run') || n.includes('sortie longue')) return 'Endurance / pratique ravitaillement';
  if(n.includes('hill')) return 'Puissance en côte / résistance à la fatigue';
  if(n.includes('tempo')) return 'Tempo / effort marathon';
  if(n.includes('x-train') || n.includes('cross') || n.includes('xtrain')) return 'Cross-training / aérobie sans impact';
  if(n.includes('strength') || n.includes('renfo') || n.includes('mountain')) return 'Renforcement musculaire';
  return 'But non déterminé (heuristique)';
}

function populateFilterOptions(){
  if(!allWorkouts || !allWorkouts.length) return;
  const purposes = new Set();
  allWorkouts.forEach(w=>{
    const p = (w.purpose || inferPurpose(w.name) || '').trim();
    if(p) purposes.add(p);
  });
  // Clear existing except the first "Tous"
  while(filterPurpose.options.length>1) filterPurpose.remove(1);
  Array.from(purposes).sort().forEach(p=>{
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    filterPurpose.appendChild(opt);
  });
  // populate multi-checkbox list
  const filterList = document.getElementById('filterList');
  filterList.innerHTML = '';
  Array.from(purposes).sort().forEach(p=>{
    const id = 'f_'+p.replace(/[^a-z0-9]/gi,'_');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = id;
    cb.value = p;
    cb.addEventListener('change', ()=>applyMultiFilter());
    const lbl = document.createElement('label');
    lbl.htmlFor = id;
    lbl.textContent = p;
    const row = document.createElement('div');
    row.appendChild(cb);
    row.appendChild(lbl);
    filterList.appendChild(row);
  });
}

function applyMultiFilter(){
  // collect checked purposes
  const filterList = document.getElementById('filterList');
  const checks = filterList.querySelectorAll('input[type=checkbox]:checked');
  const selected = Array.from(checks).map(c=>c.value);
  // apply filter: if any selected, filter by those purposes
  if(selected.length===0){
    // no multi-filter, fallback to simple filter
    applyFilters();
    return;
  }
  const q = search.value.trim().toLowerCase();
  filtered = (allWorkouts && allWorkouts.length ? allWorkouts : workouts).filter(w=>{
    const p = (w.purpose || inferPurpose(w.name) || '').trim();
    const matchesP = selected.includes(p);
    const matchesQ = !q || (w.name||'').toLowerCase().includes(q) || (w.type||'').toLowerCase().includes(q) || (w.category||'').toLowerCase().includes(q) || (w.description||'').toLowerCase().includes(q);
    return matchesP && matchesQ;
  });
  renderList();
}

// toggle filter list visibility
document.getElementById('toggleFilters').addEventListener('click', ()=>{
  const fl = document.getElementById('filterList');
  fl.classList.toggle('hidden');
});

// selection actions
document.getElementById('selectAll').addEventListener('click', ()=>{
  document.querySelectorAll('#workoutList .item-select').forEach(cb=>cb.checked=true);
});
document.getElementById('clearSelection').addEventListener('click', ()=>{
  document.querySelectorAll('#workoutList .item-select').forEach(cb=>cb.checked=false);
});

document.getElementById('exportSelectedBulk').addEventListener('click', ()=>{
  const selected = Array.from(document.querySelectorAll('#workoutList .item-select')).filter(cb=>cb.checked).map(cb=>filtered[parseInt(cb.dataset.idx,10)]).filter(Boolean);
  if(!selected.length) return alert('Aucune sélection faite');
  // build bulk events payload with ZWO file_contents per selected
  const events = selected.map(w=>{
    const icu = w.icu_workout;
    const xml = icu ? generateZwoFromIcu(w.name, w.description||'', icu) : '';
    return {
      category: 'WORKOUT',
      filename: (w.external_id || w.name || 'workout') + '.zwo',
      file_contents: xml,
      external_id: w.external_id || w.name
    };
  });
  const filename = 'events_bulk_export.json';
  downloadBlob(filename, JSON.stringify(events, null, 2), 'application/json');
});

function applyFilters(){
  const q = search.value.trim().toLowerCase();
  const p = filterPurpose.value;
  filtered = (allWorkouts && allWorkouts.length ? allWorkouts : workouts).filter(w=>{
    const matchesQ = !q || (w.name||'').toLowerCase().includes(q) || (w.type||'').toLowerCase().includes(q) || (w.category||'').toLowerCase().includes(q) || (w.description||'').toLowerCase().includes(q);
    const matchesP = !p || (w.purpose||'') === p;
    return matchesQ && matchesP;
  });
  renderList();
}

// ---------- Export helpers ----------
function downloadBlob(filename, content, mime){
  const blob = new Blob([content], {type: mime||'application/octet-stream'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportAsJson(w){
  if(!w) return alert('Aucun workout sélectionné');
  const data = w.icu_workout || {steps: []};
  const filename = (w.external_id || w.name || 'workout') + '.icu.json';
  downloadBlob(filename, JSON.stringify(data, null, 2), 'application/json');
}

function exportAsZwo(w){
  if(!w) return alert('Aucun workout sélectionné');
  const icu = w.icu_workout;
  if(!icu) return alert('Aucune structure (icu_workout) disponible pour ce workout');
  const xml = generateZwoFromIcu(w.name, w.description || '', icu);
  const filename = (w.external_id || w.name || 'workout') + '.zwo';
  downloadBlob(filename, xml, 'application/xml');
}

function generateZwoFromIcu(name, description, icu){
  // Simple mapping of icu_workout steps to ZWO elements. Not exhaustive but usable for common types.
  const zoneToPower = z => {
    // map zone numbers to approximate FTP fractions
    if(!z) return {low:0.45, high:0.55};
    const map = {1:[0.40,0.55],2:[0.55,0.70],3:[0.70,0.85],4:[0.85,0.95],5:[0.95,1.02],6:[1.02,1.12]};
    return map[z] || [0.5,0.6];
  };

  function stepToXml(s){
    if(!s) return '';
    if(s.type === 'Warmup' || s.type === 'SteadyState' || s.type === 'Cooldown'){
      const dur = s.duration || 600;
      const tgt = s.target && s.target.zone ? zoneToPower(s.target.zone) : [0.45,0.55];
      return `    <SteadyState Duration="${dur}" PowerLow="${tgt[0].toFixed(2)}" PowerHigh="${tgt[1].toFixed(2)}"/>\n`;
    }
    if(s.type === 'Interval'){
      const reps = s.reps || 1;
      const on = s.on_duration || s.onDuration || 60;
      const off = s.off_duration || s.offDuration || (s.off_duration===0?0:60);
      const tgt = s.target && s.target.zone ? zoneToPower(s.target.zone) : [1.05,0.45];
      // Use OnPower as midpoint
      const onPower = ((tgt[1]||tgt[0]) + (tgt[0]||0))/2 || 1.0;
      const offPower = 0.45;
      return `    <IntervalsT Repeat="${reps}" OnDuration="${on}" OffDuration="${off}" OnPower="${onPower.toFixed(2)}" OffPower="${offPower.toFixed(2)}"/>\n`;
    }
    if(s.type === 'Set' && s.interval){
      // expand sets into IntervalsT blocks followed by a textevent for between_sets_rest
      const it = s.interval;
      const reps = it.reps || 1;
      const on = it.on_duration || it.onDuration || 60;
      const off = it.off_duration || it.offDuration || 60;
      const tgt = it.target && it.target.zone ? zoneToPower(it.target.zone) : [1.05,0.45];
      const onPower = ((tgt[1]||tgt[0]) + (tgt[0]||0))/2 || 1.0;
      const offPower = 0.45;
      let out = `    <IntervalsT Repeat="${reps}" OnDuration="${on}" OffDuration="${off}" OnPower="${onPower.toFixed(2)}" OffPower="${offPower.toFixed(2)}"/>\n`;
      if(s.between_sets_rest) out += `    <textevent message="Between sets rest: ${s.between_sets_rest}s" duration="5"/>\n`;
      return out;
    }
    if(s.type === 'TextEvent' || s.type === 'textevent'){
      const msg = (s.message || s.msg || s.text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const dur = s.duration || 5;
      return `    <textevent message="${msg}" duration="${dur}"/>\n`;
    }
    // fallback
    return `    <textevent message="Unsupported step type: ${s.type || 'unknown'}" duration="5"/>\n`;
  }

  let inner = '';
  (icu.steps || []).forEach(s => { inner += stepToXml(s); });

  const escName = (name||'Workout').replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const escDesc = (description||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<workoutFile>\n  <author>SWAP</author>\n  <name>${escName}</name>\n  <description>${escDesc}</description>\n  <workout>\n${inner}  </workout>\n</workoutFile>`;
  return xml;
}

function escapeHtml(s){
  if(!s) return '';
  return String(s).replace(/[&"'<>]/g, c => ({'&':'&amp;','"':'&quot;',"'":"&#39;","<":"&lt;",">":"&gt;"}[c]));
}

// Small helper: if page loaded with events_bulk_all_templates.json available, optionally auto-load
window.addEventListener('load', ()=>{
  // nothing automatic, user triggers Load default or picks file
});
