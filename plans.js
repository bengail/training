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
    populateWorkoutPick();
  }catch(err){
    alert('Erreur initialisation plans UI: '+err.message);
  }
}

function renderPlansList(){
  plansList.innerHTML = '';
  plansIndex.forEach(p=>{
    const li = document.createElement('li');
    li.textContent = p.title;
    li.dataset.filename = p.filename;
    li.classList.add('selectable');
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
  document.getElementById('planTitle').textContent = title;
  document.getElementById('planViewPlaceholder').classList.add('hidden');
  document.getElementById('planDetail').classList.remove('hidden');
  // load markdown
  try{
    const resp = await fetch(filename);
    if(!resp.ok) throw new Error('Impossible de charger '+filename+' ('+resp.status+')');
    const md = await resp.text();
    document.getElementById('planMarkdown').innerHTML = marked.parse(md);
  }catch(err){
    document.getElementById('planMarkdown').textContent = 'Erreur chargement plan: '+err.message;
  }
  renderAttachedWorkouts();
}

function populateWorkoutPick(){
  const sel = document.getElementById('workoutPick');
  sel.innerHTML = '';
  library.forEach(w=>{
    const opt = document.createElement('option');
    opt.value = w.external_id || w.name;
    opt.textContent = w.name;
    sel.appendChild(opt);
  });
}

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

function addWorkout(){
  if(!currentPlan) return alert('Sélectionne un plan d\'abord');
  const sel = document.getElementById('workoutPick');
  const id = sel.value;
  if(!plansMeta[currentPlan]) plansMeta[currentPlan]={workouts:[]};
  if(!plansMeta[currentPlan].workouts.includes(id)) plansMeta[currentPlan].workouts.push(id);
  renderAttachedWorkouts();
}

function removeAttached(id){
  if(!currentPlan) return;
  const arr = plansMeta[currentPlan].workouts || [];
  plansMeta[currentPlan].workouts = arr.filter(x=>x!==id);
  renderAttachedWorkouts();
}

function downloadMeta(){
  const content = JSON.stringify(plansMeta, null, 2);
  const blob = new Blob([content], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'plans_meta.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

document.getElementById('addWorkout').addEventListener('click', addWorkout);
document.getElementById('downloadMeta').addEventListener('click', downloadMeta);

init();
