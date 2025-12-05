const plansList = document.getElementById('plansList');
const plansIndexUrl = 'plans_index.json';
const plansMetaUrl = 'plans_meta.json';
const libraryUrl = document.getElementById('librarySelect')? document.getElementById('librarySelect').value : 'workout_library_enriched.json';
let plansIndex = [];
let plansMeta = {};
let library = [];
let currentPlan = null;

async function init(){
  try{
    const [pResp, mResp, lResp] = await Promise.all([fetch(plansIndexUrl), fetch(plansMetaUrl), fetch(libraryUrl)]);
    plansIndex = await pResp.json();
    plansMeta = await mResp.json();
    const libJson = await lResp.json();
    library = libJson.library_enriched || libJson.library || [];
    renderPlansList();
  }catch(err){
    alert('Erreur initialisation plans UI: '+err.message);
  }
}

function renderPlansList(){
  plansList.innerHTML = '';
  plansIndex.forEach(p=>{
    // only include French plans (files with _fr in filename)
    if(!p.filename || !p.filename.toLowerCase().includes('_fr')) return;
    const li = document.createElement('li');
    li.textContent = p.title;
    li.dataset.filename = p.filename;
    li.classList.add('selectable');
    li.style.listStyle='none';
    li.style.padding='10px';
    li.style.cursor='pointer';
    li.addEventListener('click', ()=>{
      // visual selection
      document.querySelectorAll('#plansList li.selected').forEach(el=>el.classList.remove('selected'));
      li.classList.add('selected');
      selectPlan(p.filename,p.title);
    });
    plansList.appendChild(li);
  });
}

async function selectPlan(filename,title){
  currentPlan = filename;
    // ensure visual selection matches
    document.querySelectorAll('#plansList li.selected').forEach(el=>el.classList.remove('selected'));
    const sel = document.querySelector('#plansList li[data-filename="'+filename+'"]');
    if(sel) sel.classList.add('selected');
    // show detail and hide list wrapper for centered layout
    document.getElementById('planViewPlaceholder').classList.add('hidden');
    document.getElementById('plansListWrapper').classList.add('hidden');
    const detail = document.getElementById('planDetail');
    detail.classList.remove('hidden');
    document.getElementById('planTitle').textContent = title;
    // add back button handler
    const back = document.getElementById('backToList');
    if(back) back.addEventListener('click', ()=>{
      detail.classList.add('hidden');
      document.getElementById('plansListWrapper').classList.remove('hidden');
      document.getElementById('planViewPlaceholder').classList.remove('hidden');
      document.querySelectorAll('#plansList li.selected').forEach(el=>el.classList.remove('selected'));
      currentPlan = null;
    });
  // load markdown
  try{
    const resp = await fetch(filename);
    if(!resp.ok) throw new Error('Impossible de charger '+filename+' ('+resp.status+')');
    const md = await resp.text();
    document.getElementById('planMarkdown').innerHTML = '<div class="content">'+marked.parse(md)+'</div>';
  }catch(err){
    document.getElementById('planMarkdown').textContent = 'Erreur chargement plan: '+err.message;
  }
  renderAttachedWorkouts();
}

// populateWorkoutPick removed — adding workouts to plans is disabled

function renderAttachedWorkouts(){
  const ul = document.getElementById('attachedWorkouts');
  ul.innerHTML = '';
  if(!currentPlan) return;
  const attached = plansMeta[currentPlan] && plansMeta[currentPlan].workouts ? plansMeta[currentPlan].workouts : [];
  attached.forEach(id=>{
    const w = library.find(x=> (x.external_id||x.name)===id);
    const li = document.createElement('li');
    li.textContent = w ? w.name+' ('+id+')' : id;
    const rem = document.createElement('button'); rem.textContent = 'Retirer';
    rem.addEventListener('click', ()=>{ removeAttached(id); });
    li.appendChild(rem);
    ul.appendChild(li);
  });
}

// addWorkout removed

function removeAttached(id){
  if(!currentPlan) return;
  const arr = plansMeta[currentPlan].workouts || [];
  plansMeta[currentPlan].workouts = arr.filter(x=>x!==id);
  renderAttachedWorkouts();
}

// downloadMeta and related event listeners removed

init();
