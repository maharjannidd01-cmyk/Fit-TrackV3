/* ═══════════════════════════════════
   FitTrack Pro v4.1  —  app.js
   + Add/edit exercises mid-workout
   + Larger rest timer
   + Food quantity editing
   + 60+ Indian/Nepali foods
   + Cook your meal
   + Export date filter
   + Workout summary PNG
═══════════════════════════════════ */

const WEEKDAYS=['sun','mon','tue','wed','thu','fri','sat'];
const WD_LABELS={sun:'Sunday',mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday',sat:'Saturday'};
const MUSCLE_GROUPS=['Chest','Back','Shoulders','Biceps','Triceps','Legs','Glutes','Core','Cardio','Full Body'];

// ── SEED EXERCISES ────────────────────
const SEED_EXERCISES=[
  {name:'Incline Bench Press',   mg:'Chest',    ds:3,dr:'10–12',note:'Tempo 3-1-1, shoulder-safe'},
  {name:'Flat Bench Press',      mg:'Chest',    ds:4,dr:'8–10', note:'Primary chest compound'},
  {name:'Dumbbell Bench Press',  mg:'Chest',    ds:3,dr:'12',   note:'Full stretch at bottom'},
  {name:'Pec Dec',               mg:'Chest',    ds:3,dr:'12–15',note:'Peak contraction squeeze'},
  {name:'Push-up',               mg:'Chest',    ds:3,dr:'12',   note:'Full range, chest to floor'},
  {name:'Skull Crusher',         mg:'Triceps',  ds:3,dr:'12',   note:'EZ bar, elbows in'},
  {name:'Lat Pulldown',          mg:'Back',     ds:3,dr:'10–12',note:'Wide grip, full stretch'},
  {name:'T-Bar Row',             mg:'Back',     ds:3,dr:'10–12',note:'Chest on pad, full range'},
  {name:'Chest Supported Row',   mg:'Back',     ds:3,dr:'10–12',note:'Removes lower back stress'},
  {name:'Straight Arm Pulldown', mg:'Back',     ds:3,dr:'12',   note:'Arms straight, lat isolation'},
  {name:'Seated Cable Row',      mg:'Back',     ds:3,dr:'12',   note:'Retract shoulder blades'},
  {name:'Single Arm DB Row',     mg:'Back',     ds:3,dr:'12',   note:'Keep hips square'},
  {name:'Barbell Row',           mg:'Back',     ds:3,dr:'10–12',note:'Hinge at hips, pull to waist'},
  {name:'Face Pull',             mg:'Shoulders',ds:3,dr:'15',   note:'Shoulder health priority'},
  {name:'Shoulder Press',        mg:'Shoulders',ds:3,dr:'8–10', note:'Dumbbells preferred'},
  {name:'Lateral Raise',         mg:'Shoulders',ds:3,dr:'12–15',note:'Slow 3s eccentric'},
  {name:'Preacher Curl',         mg:'Biceps',   ds:3,dr:'12',   note:'Full range, slow neg'},
  {name:'Barbell Curl',          mg:'Biceps',   ds:3,dr:'10–12',note:'No swinging, strict form'},
  {name:'Incline DB Curl',       mg:'Biceps',   ds:3,dr:'12',   note:'Full stretch for peak'},
  {name:'Hammer Curl',           mg:'Biceps',   ds:3,dr:'12',   note:'Brachialis focus'},
  {name:'Arm Curl (Cable)',       mg:'Biceps',   ds:3,dr:'20',   note:'Light, high rep, squeeze'},
  {name:'Triceps Pushdown',      mg:'Triceps',  ds:3,dr:'12–15',note:'Elbows fixed, squeeze'},
  {name:'Overhead Extension',    mg:'Triceps',  ds:3,dr:'12',   note:'Elbows in, control'},
  {name:'Triceps Rope Pulldown', mg:'Triceps',  ds:3,dr:'12–15',note:'Superset with Face Pull'},
  {name:'Squat',                 mg:'Legs',     ds:3,dr:'10',   note:'Depth below parallel'},
  {name:'Sumo Squat',            mg:'Legs',     ds:3,dr:'8–12', note:'Wide stance, toes 45°'},
  {name:'RDL',                   mg:'Legs',     ds:3,dr:'12',   note:'Hinge, feel hamstring'},
  {name:'Leg Curl',              mg:'Legs',     ds:3,dr:'12',   note:'Full range, slow eccentric'},
  {name:'Leg Press',             mg:'Legs',     ds:3,dr:'12',   note:'Standard width'},
  {name:'Wide Leg Press',        mg:'Legs',     ds:3,dr:'12',   note:'Feet high+wide = glutes'},
  {name:'Leg Extension',         mg:'Legs',     ds:3,dr:'12',   note:'Full extension, squeeze quads'},
  {name:'Lunges',                mg:'Legs',     ds:3,dr:'12',   note:'Walking, DBs 15–20 kg'},
  {name:'Calf Raises',           mg:'Legs',     ds:4,dr:'15',   note:'Full stretch, pause at top'},
  {name:'Tibialis Raise',        mg:'Legs',     ds:3,dr:'15',   note:'Shin strength'},
  {name:'Hip Thrust',            mg:'Glutes',   ds:3,dr:'15',   note:'Smith machine or barbell'},
  {name:'Abs Circuit',           mg:'Core',     ds:1,dr:'10 min',note:'Plank, leg raise, crunch, bicycle'},
  {name:'Plank',                 mg:'Core',     ds:3,dr:'60s',  note:'Maintain neutral spine'},
  {name:'Hanging Leg Raise',     mg:'Core',     ds:3,dr:'15',   note:'Full ROM, slow'},
  {name:'Cable Crunch',          mg:'Core',     ds:3,dr:'15',   note:'Weighted ab work'},
  {name:'Russian Twist',         mg:'Core',     ds:3,dr:'20',   note:'Plate or medicine ball'},
  {name:'Treadmill',             mg:'Cardio',   ds:1,dr:'20 min',note:'Incline 10, speed 4.5–5',isCardio:true},
  {name:'Standalone Cycling',    mg:'Cardio',   ds:1,dr:'5 min', note:'Warm-up, low resistance',isCardio:true},
  {name:'HIIT Treadmill',        mg:'Cardio',   ds:1,dr:'20 min',note:'30s sprint/30s walk ×10',isCardio:true},
  {name:'Rowing Machine',        mg:'Cardio',   ds:1,dr:'15 min',note:'Steady or interval',isCardio:true},
  {name:'Burpees',               mg:'Full Body',ds:3,dr:'10–15',note:'Circuit, full extension'},
  {name:'Jump Squats',           mg:'Full Body',ds:3,dr:'15',   note:'Circuit, land soft'},
  {name:'Kettlebell Swings',     mg:'Full Body',ds:3,dr:'20',   note:'Circuit, hip drive'},
];

const SEED_PLANS=[
  {name:'Legs — Hamstring Focus',emoji:'🦵',exNames:['Standalone Cycling','Sumo Squat','RDL','Leg Curl','Wide Leg Press','Calf Raises','Treadmill']},
  {name:'Push Day',emoji:'💪',exNames:['Incline Bench Press','Dumbbell Bench Press','Pec Dec','Shoulder Press','Lateral Raise','Triceps Pushdown','Overhead Extension','Push-up','Treadmill']},
  {name:'Pull Day',emoji:'🔙',exNames:['Lat Pulldown','T-Bar Row','Chest Supported Row','Straight Arm Pulldown','Barbell Curl','Incline DB Curl','Hammer Curl','Arm Curl (Cable)','Abs Circuit','Treadmill']},
  {name:'Lower — Quad Focus',emoji:'⬇️',exNames:['Squat','Leg Extension','Leg Press','Lunges','Calf Raises','Tibialis Raise']},
  {name:'Upper Superset Day',emoji:'🏋️',exNames:['Flat Bench Press','Barbell Row','Shoulder Press','Lat Pulldown','Lateral Raise','Preacher Curl','Triceps Rope Pulldown','Face Pull','Abs Circuit','Treadmill']},
  {name:'Full Body HIIT',emoji:'🔥',exNames:['Burpees','Jump Squats','Push-up','Kettlebell Swings','HIIT Treadmill']},
];

// ── FOOD DATABASE — Indian/Nepali ─────
const FOODS=[
  // Proteins
  {name:'Chicken Breast (100g)',    cal:165,p:31,  c:0,  f:3.6},
  {name:'Chicken Thigh (100g)',     cal:209,p:26,  c:0,  f:11},
  {name:'Chicken Tikka (100g)',     cal:163,p:25,  c:5,  f:5},
  {name:'Butter Chicken (100g)',    cal:165,p:16,  c:8,  f:8},
  {name:'Mutton Curry (100g)',      cal:190,p:21,  c:4,  f:10},
  {name:'Buff Sukuti (100g)',       cal:280,p:34,  c:2,  f:14},
  {name:'Mutton Sukuti (100g)',     cal:290,p:35,  c:2,  f:15},
  {name:'Fish Rohu (100g)',         cal:97, p:17,  c:0,  f:2.8},
  {name:'Fish Curry (100g)',        cal:140,p:18,  c:5,  f:6},
  {name:'Eggs (1 whole)',           cal:78, p:6,   c:0.6,f:5},
  {name:'Egg White (1)',            cal:17, p:3.6, c:0.2,f:0.1},
  {name:'Egg Curry (1 egg)',        cal:130,p:8,   c:5,  f:9},
  {name:'Paneer (100g)',            cal:265,p:18,  c:3,  f:20},
  {name:'Palak Paneer (100g)',      cal:150,p:7,   c:8,  f:10},
  {name:'Paneer Bhurji (100g)',     cal:220,p:14,  c:6,  f:16},
  {name:'Soya Chunks (100g dry)',   cal:345,p:52,  c:26, f:0.5},
  {name:'Whey Protein (1 scoop)',   cal:120,p:24,  c:3,  f:1.5},
  {name:'Protein Bar (1)',          cal:200,p:20,  c:22, f:7},
  // Dairy
  {name:'Milk (200ml)',             cal:122,p:6.4, c:9.6,f:4.8},
  {name:'Curd / Dahi (100g)',       cal:98, p:11,  c:3.4,f:4.3},
  {name:'Greek Yogurt (100g)',      cal:59, p:10,  c:3.6,f:0.4},
  {name:'Lassi Sweet (200ml)',      cal:180,p:5,   c:32, f:4},
  {name:'Lassi Salty (200ml)',      cal:120,p:5,   c:16, f:4},
  {name:'Masala Chai (1 cup)',      cal:80, p:2,   c:14, f:2},
  // Grains / Staples
  {name:'Brown Rice (100g cooked)', cal:112,p:2.6, c:24, f:0.9},
  {name:'White Rice (100g cooked)', cal:130,p:2.7, c:28, f:0.3},
  {name:'Roti / Chapati (1)',       cal:104,p:3,   c:20, f:1.5},
  {name:'Paratha (1 plain)',        cal:180,p:4,   c:26, f:7},
  {name:'Aloo Paratha (1)',         cal:265,p:5,   c:38, f:10},
  {name:'Puri (1 piece)',           cal:110,p:2,   c:15, f:5},
  {name:'Oats (100g dry)',          cal:389,p:17,  c:66, f:7},
  {name:'Chiura / Beaten Rice (100g)',cal:346,p:7, c:77, f:1},
  {name:'Sattu (100g)',             cal:406,p:22,  c:65, f:7},
  {name:'Dhido (100g cooked)',      cal:142,p:3,   c:31, f:1},
  {name:'Sel Roti (1 piece)',       cal:180,p:3,   c:32, f:5},
  {name:'Poha (100g cooked)',       cal:158,p:3,   c:34, f:2},
  {name:'Upma (100g cooked)',       cal:135,p:3,   c:24, f:3},
  {name:'Khichdi (100g cooked)',    cal:110,p:4,   c:20, f:2},
  {name:'Dosa (1 plain)',           cal:133,p:3,   c:26, f:2},
  {name:'Idli (1)',                 cal:39, p:1.9, c:8,  f:0.2},
  // Dal / Lentils
  {name:'Dal / Lentils (100g)',     cal:116,p:9,   c:20, f:0.4},
  {name:'Dal Tadka (100ml)',        cal:80, p:4,   c:12, f:2},
  {name:'Sambar (100ml)',           cal:55, p:3,   c:8,  f:1},
  {name:'Rajma (100g cooked)',      cal:127,p:8.7, c:22, f:0.5},
  {name:'Chana / Chickpeas (100g)', cal:164,p:9,   c:27, f:2.6},
  {name:'Chole Bhature (1 plate)',  cal:490,p:13,  c:68, f:18},
  {name:'Kwati / Mixed Beans (100g)',cal:180,p:10, c:28, f:4},
  // Nepali Dishes
  {name:'Dal Bhat Set (1 plate)',   cal:450,p:15,  c:80, f:8},
  {name:'Chicken Momo (6 pcs)',     cal:260,p:18,  c:28, f:7},
  {name:'Buff Momo (6 pcs)',        cal:280,p:16,  c:30, f:8},
  {name:'Veg Momo (6 pcs)',         cal:210,p:8,   c:32, f:5},
  {name:'Thukpa (1 bowl)',          cal:320,p:14,  c:48, f:7},
  {name:'Aloo Tama (100g)',         cal:95, p:4,   c:16, f:2},
  {name:'Gundruk (100g)',           cal:240,p:26,  c:32, f:4},
  {name:'Yomari (1 piece)',         cal:180,p:4,   c:36, f:3},
  {name:'Newari Khaja Set',         cal:480,p:18,  c:62, f:16},
  {name:'Buff Choila (100g)',       cal:220,p:22,  c:3,  f:13},
  {name:'Chicken Biryani (1 plate)',cal:450,p:25,  c:52, f:14},
  {name:'Fried Rice (100g)',        cal:163,p:4,   c:28, f:4},
  // Vegetables & Others
  {name:'Sweet Potato (100g)',      cal:86, p:1.6, c:20, f:0.1},
  {name:'Potato (100g boiled)',     cal:87, p:1.9, c:20, f:0.1},
  {name:'Broccoli (100g)',          cal:34, p:2.8, c:7,  f:0.4},
  {name:'Spinach (100g)',           cal:23, p:2.9, c:3.6,f:0.4},
  {name:'Banana (1 medium)',        cal:89, p:1.1, c:23, f:0.3},
  {name:'Apple (1 medium)',         cal:95, p:0.5, c:25, f:0.3},
  {name:'Peanut Butter (1 tbsp)',   cal:94, p:4,   c:3,  f:8},
  {name:'Almonds (10 nuts)',        cal:69, p:2.5, c:2.4,f:6},
  {name:'Olive Oil (1 tbsp)',       cal:119,p:0,   c:0,  f:14},
  {name:'Samosa (1 piece)',         cal:145,p:3,   c:20, f:6},
  {name:'Pav Bhaji (1 plate)',      cal:400,p:10,  c:58, f:14},
];

// ── STATE ─────────────────────────────
const S={
  page:'home', today:new Date().toDateString(),
  plansTab:'plans',
  exercises:[], plans:[], logs:{},
  profile:{
    name:'Athlete', weightKg:100,
    targetCal:2300, targetProtein:200,
    goalDays:100, programName:'100-Day Transformation',
    startDate:new Date().toDateString(),
    manualDay:null, audioEnabled:true,
    weeklySchedule:{},
  },
  session:null,
  cookMeal:{name:'',ingredients:[],servings:1,myServings:1},
};

const KEY='ft4', DRAFT='ft4_draft';

function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');if(d.exercises)S.exercises=d.exercises;if(d.plans)S.plans=d.plans;if(d.logs)S.logs=d.logs;if(d.profile)S.profile={...S.profile,...d.profile};}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify({exercises:S.exercises,plans:S.plans,logs:S.logs,profile:S.profile}));}catch(e){}}
function saveDraft(){if(!S.session){try{localStorage.removeItem(DRAFT);}catch(e){}return;}try{localStorage.setItem(DRAFT,JSON.stringify({...S.session,savedAt:Date.now()}));}catch(e){}}
function loadDraft(){try{const d=JSON.parse(localStorage.getItem(DRAFT)||'null');if(!d||!d.startTs)return null;if(Date.now()-(d.savedAt||0)>6*3600*1000){localStorage.removeItem(DRAFT);return null;}return d;}catch(e){return null;}}
function migrateV3(){try{const v3=JSON.parse(localStorage.getItem('ft3')||'null');if(!v3)return;if(v3.logs)Object.entries(v3.logs).forEach(([d,l])=>{if(!S.logs[d])S.logs[d]={foods:[],water:0,bodyWeight:null,sessions:[]};if(l.calories)S.logs[d].foods=l.calories.map(f=>({name:f.name,cal:f.cal,p:f.p||0,c:f.c||0,f:f.f||0,qty:1}));if(l.water)S.logs[d].water=l.water;if(l.weight)S.logs[d].bodyWeight=l.weight;if(l.sessions)S.logs[d].sessions=l.sessions;});if(v3.profile){S.profile.name=v3.profile.name||S.profile.name;S.profile.weightKg=v3.profile.weightKg||S.profile.weightKg;S.profile.targetCal=v3.profile.targetCal||v3.profile.targetCals||S.profile.targetCal;S.profile.targetProtein=v3.profile.targetProtein||S.profile.targetProtein;}localStorage.removeItem('ft3');save();toast('Previous data imported ✓');}catch(e){}}
function initSeed(){if(S.exercises.length)return;S.exercises=SEED_EXERCISES.map((e,i)=>({id:'ex_'+String(i+1).padStart(3,'0'),name:e.name,muscleGroup:e.mg,defaultSets:e.ds,defaultReps:e.dr,note:e.note||'',isCardio:!!e.isCardio}));S.plans=SEED_PLANS.map((p,i)=>({id:'pl_'+String(i+1).padStart(3,'0'),name:p.name,emoji:p.emoji,exercises:p.exNames.map(name=>{const ex=S.exercises.find(e=>e.name===name);return ex?{exId:ex.id,sets:ex.defaultSets,reps:ex.defaultReps,note:ex.note}:null;}).filter(Boolean)}));const ids=S.plans.map(p=>p.id);S.profile.weeklySchedule={mon:ids[0],tue:ids[1],wed:ids[2],thu:ids[3],fri:ids[4],sat:ids[5],sun:null};save();}

// ── HELPERS ───────────────────────────
function $(id){return document.getElementById(id);}
function todayLog(){if(!S.logs[S.today])S.logs[S.today]={foods:[],water:0,bodyWeight:null,sessions:[]};if(!S.logs[S.today].sessions)S.logs[S.today].sessions=[];return S.logs[S.today];}
function dayLog(d){if(!S.logs[d])S.logs[d]={foods:[],water:0,bodyWeight:null,sessions:[]};if(!S.logs[d].sessions)S.logs[d].sessions=[];return S.logs[d];}

// Food calcs account for qty
function foodCal(f){return Math.round(f.cal*(f.qty||1));}
function foodP(f){return Math.round((f.p||0)*(f.qty||1)*10)/10;}
function foodC(f){return Math.round((f.c||0)*(f.qty||1)*10)/10;}
function foodF(f){return Math.round((f.f||0)*(f.qty||1)*10)/10;}
function consumed(d){return (dayLog(d).foods||[]).reduce((s,f)=>s+foodCal(f),0);}
function proteinG(d){return (dayLog(d).foods||[]).reduce((s,f)=>s+foodP(f),0);}
function burnedCal(d){return (dayLog(d).sessions||[]).reduce((s,sess)=>s+(sess.burn||0),0);}

function dayNum(){if(S.profile.manualDay)return S.profile.manualDay;const diff=Math.floor((new Date()-new Date(S.profile.startDate))/86400000)+1;return Math.min(Math.max(diff,1),S.profile.goalDays);}
function todayWD(){return WEEKDAYS[new Date().getDay()];}
function todayPlanId(){return todayLog().planId||S.profile.weeklySchedule[todayWD()]||S.plans[0]?.id||null;}
function getPlan(id){return S.plans.find(p=>p.id===id)||null;}
function getEx(id){return S.exercises.find(e=>e.id===id)||null;}
function fmt(s){s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;return h>0?`${h}:${z(m)}:${z(ss)}`:`${z(m)}:${z(ss)}`;}
function z(n){return String(n).padStart(2,'0');}
function fmtDate(d){return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'});}
function fmtDateLong(d){return new Date(d).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'long',year:'numeric'});}

function streak(){let s=0;const now=new Date();for(let i=0;i<90;i++){const d=new Date(now);d.setDate(d.getDate()-i);const l=S.logs[d.toDateString()];if(l&&((l.sessions||[]).length>0||(l.foods||[]).length>0))s++;else if(i>0)break;}return s;}

function prevLoad(exName){const dates=Object.keys(S.logs).filter(d=>d!==S.today).sort((a,b)=>new Date(b)-new Date(a));for(const d of dates)for(const sess of(S.logs[d].sessions||[]))for(const sets of Object.values(sess.setLogs||{})){if(!sets.length||sets[0].exName!==exName)continue;const done=sets.filter(s=>s.done&&s.weight!=='');if(done.length){const maxW=Math.max(...done.map(s=>parseFloat(s.weight)||0));return{weight:maxW,reps:done[done.length-1].reps,date:d};}}return null;}

function calcPRs(){const prs={};Object.entries(S.logs).forEach(([d,l])=>(l.sessions||[]).forEach(sess=>Object.values(sess.setLogs||{}).forEach(sets=>sets.forEach(set=>{if(!set.done||!set.weight||!set.exName)return;const w=parseFloat(set.weight)||0;if(!prs[set.exName]||w>prs[set.exName].weight)prs[set.exName]={weight:w,reps:set.reps,date:d};}))));return prs;}
function calcTotalVolume(){let v=0;Object.values(S.logs).forEach(l=>(l.sessions||[]).forEach(sess=>Object.values(sess.setLogs||{}).forEach(sets=>sets.forEach(s=>{if(s.done&&s.weight&&s.reps)v+=((parseFloat(s.weight)||0)*(parseInt(s.reps)||0));}))));return Math.round(v);}

// Max weight in a session
function sessionMaxWeight(sess){let max=0,exName='';Object.values(sess.setLogs||{}).forEach(sets=>sets.forEach(s=>{if(s.done&&s.weight){const w=parseFloat(s.weight)||0;if(w>max){max=w;exName=s.exName||'';}}})  );return{weight:max,exercise:exName};}

// ── SESSION ───────────────────────────
function startSession(planId){
  const plan=getPlan(planId);
  if(!plan){toast('Select a plan first',true);return;}
  const setLogs={};
  plan.exercises.forEach((pe,i)=>{
    const ex=getEx(pe.exId);
    const cnt=ex?.isCardio?1:pe.sets;
    setLogs[i]=Array.from({length:cnt},(_,si)=>({exName:ex?.name||'',setNum:si+1,weight:'',reps:'',done:false}));
  });
  if(S.session){clearInterval(S.session.timerIv);clearInterval(S.session.rest?.iv);}
  S.session={
    planId,planName:plan.name,planEmoji:plan.emoji||'💪',
    startTs:Date.now(),setLogs,burn:0,
    extraExCount:0,  // track how many exercises were added
    rest:{on:false,startTs:0,target:90,iv:null},
    timerIv:null,
  };
  S.session.timerIv=setInterval(tickSession,1000);
  todayLog().planId=planId;
  save();saveDraft();syncBars();go('workout');
}

function tickSession(){
  if(!S.session)return;
  const el=$('sb-time');if(el)el.textContent=fmt((Date.now()-S.session.startTs)/1000);
  S.session.burn=Math.round(5*(S.profile.weightKg||100)*(Date.now()-S.session.startTs)/3600000);
  const bel=$('sb-burn');if(bel)bel.textContent=S.session.burn+' kcal';
  saveDraft();
}

function finishSession(){
  if(!S.session)return;
  clearInterval(S.session.timerIv);
  clearInterval(S.session.rest?.iv);
  const log=todayLog();
  const sessData={
    planId:S.session.planId,planName:S.session.planName,planEmoji:S.session.planEmoji||'💪',
    duration:Math.floor((Date.now()-S.session.startTs)/1000),
    burn:S.session.burn,
    setLogs:JSON.parse(JSON.stringify(S.session.setLogs)),
    ts:Date.now(),
  };
  log.sessions.push(sessData);
  const dur=sessData.duration, brn=sessData.burn;
  S.session=null;
  saveDraft();save();syncBars();
  showSummary(sessData);
}

// ── ADD EXERCISE DURING WORKOUT ───────
function openAddExWorkout(){
  if(!S.session)return;
  const byGroup={};
  S.exercises.forEach(e=>{if(!byGroup[e.muscleGroup])byGroup[e.muscleGroup]=[];byGroup[e.muscleGroup].push(e);});
  showModal(`
  <div class="modal-head">
    <div class="modal-title">➕ Add Exercise to Session</div>
    <button class="modal-close" onclick="closeModal()">×</button>
  </div>
  <div style="padding:8px 16px">
    <input type="text" class="inp" placeholder="Search exercise…" oninput="filterAddExWorkout(this.value)" id="aew-search">
  </div>
  <div id="aew-list">
    ${renderAddExList('')}
  </div>`);
}

function renderAddExList(q){
  const filtered=S.exercises.filter(e=>!q||e.name.toLowerCase().includes(q.toLowerCase()));
  const byGroup={};
  filtered.forEach(e=>{if(!byGroup[e.muscleGroup])byGroup[e.muscleGroup]=[];byGroup[e.muscleGroup].push(e);});
  return Object.entries(byGroup).map(([mg,exs])=>`
    <div class="sec" style="padding:10px 16px 5px">${mg}</div>
    <div class="card mx mb8">
      ${exs.map(ex=>`
      <div class="ex-lib-row" style="cursor:pointer" onclick="addExToSession('${ex.id}')">
        <div style="flex:1"><div style="font-size:14px;font-weight:600">${ex.name}</div>
        <div class="ex-lib-mg">${ex.defaultSets}×${ex.defaultReps}${ex.isCardio?' · cardio':''}</div></div>
        <span style="color:var(--accent);font-size:22px;font-weight:800">+</span>
      </div>`).join('')}
    </div>`).join('');
}

function filterAddExWorkout(q){const el=$('aew-list');if(el)el.innerHTML=renderAddExList(q);}

function addExToSession(exId){
  if(!S.session)return;
  const ex=getEx(exId);if(!ex)return;
  const idx=Object.keys(S.session.setLogs).length;
  const cnt=ex.isCardio?1:ex.defaultSets;
  S.session.setLogs[idx]=Array.from({length:cnt},(_,si)=>({exName:ex.name,setNum:si+1,weight:'',reps:'',done:false}));
  // Store the exercise ref for rendering
  if(!S.session.extraExercises) S.session.extraExercises=[];
  S.session.extraExercises.push({idx,exId,sets:ex.defaultSets,reps:ex.defaultReps,note:ex.note||'',isCardio:ex.isCardio});
  saveDraft();
  closeModal();
  go('workout');
  toast(ex.name+' added to session');
}

function editExDuringWorkout(exIdx){
  if(!S.session)return;
  const sets=S.session.setLogs[exIdx]||[];
  const exName=sets[0]?.exName||'Exercise';
  showModal(`
  <div class="modal-head">
    <div class="modal-title">Edit: ${exName}</div>
    <button class="modal-close" onclick="closeModal()">×</button>
  </div>
  <div style="padding:14px 16px;display:grid;gap:10px">
    <div>
      <label class="lbl">Number of Sets</label>
      <div style="display:flex;align-items:center;gap:10px">
        <button class="btn btn-o btn-sm" onclick="addSetToEx(${exIdx})">+ Add Set</button>
        <button class="btn btn-r btn-sm" onclick="removeLastSet(${exIdx})">− Remove</button>
      </div>
    </div>
    <div>
      <label class="lbl">Sets currently: ${sets.length}</label>
    </div>
    <button class="btn btn-r" onclick="removeExFromSession(${exIdx})">🗑 Remove This Exercise</button>
    <button class="btn btn-o" onclick="closeModal()">Done</button>
  </div>`);
}

function addSetToEx(exIdx){
  if(!S.session?.setLogs[exIdx])return;
  const sets=S.session.setLogs[exIdx];
  sets.push({exName:sets[0]?.exName||'',setNum:sets.length+1,weight:'',reps:'',done:false});
  saveDraft();closeModal();go('workout');
}
function removeLastSet(exIdx){
  if(!S.session?.setLogs[exIdx])return;
  const sets=S.session.setLogs[exIdx];
  if(sets.length<=1)return;
  sets.pop();saveDraft();closeModal();go('workout');
}
function removeExFromSession(exIdx){
  if(!S.session)return;
  delete S.session.setLogs[exIdx];
  saveDraft();closeModal();go('workout');toast('Exercise removed');
}

// ── REST TIMER ─────────────────────────
function startRest(secs){
  if(!S.session)return;
  clearInterval(S.session.rest?.iv);
  S.session.rest={on:true,startTs:Date.now(),target:secs,iv:setInterval(tickRest,250)};
  syncBars();saveDraft();
}
function tickRest(){
  if(!S.session?.rest?.on)return;
  const rem=Math.max(0,S.session.rest.target-(Date.now()-S.session.rest.startTs)/1000);
  // Update both ring bar and overlay
  const rc=$('rb-count');if(rc)rc.textContent=fmt(Math.ceil(rem));
  const oc=$('rov-count');if(oc)oc.textContent=fmt(Math.ceil(rem));
  const C1=2*Math.PI*24, ring1=$('rb-ring');
  if(ring1)ring1.style.strokeDashoffset=C1*(rem/S.session.rest.target);
  const C2=2*Math.PI*90, ring2=$('rov-ring');
  if(ring2)ring2.style.strokeDashoffset=C2*(rem/S.session.rest.target);
  if(rem<=0){
    clearInterval(S.session.rest.iv);
    S.session.rest.on=false;saveDraft();
    if(navigator.vibrate)navigator.vibrate([400,100,400]);
    if(S.profile.audioEnabled)playBeep();
    toast('Rest over — GO! 💪');
    setTimeout(()=>{syncBars();const o=$('rest-overlay');if(o)o.classList.remove('on');},1200);
  }
}
function skipRest(){if(!S.session)return;clearInterval(S.session.rest?.iv);S.session.rest.on=false;saveDraft();syncBars();}
function openRestOverlay(){const o=$('rest-overlay');if(o)o.classList.toggle('on');}
function closeRestOverlay(){const o=$('rest-overlay');if(o)o.classList.remove('on');}
function playBeep(){try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=520;g.gain.setValueAtTime(.3,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.5);o.start();o.stop(ctx.currentTime+.5);}catch(e){}}

function completeSet(exIdx,setIdx){
  if(!S.session)return;
  const set=S.session.setLogs[exIdx]?.[setIdx];if(!set)return;
  set.done=!set.done;saveDraft();
  const row=$(`sr-${exIdx}-${setIdx}`);if(row)row.classList.toggle('done',set.done);
  const btn=$(`sc-${exIdx}-${setIdx}`);if(btn){btn.textContent=set.done?'✓':'○';btn.classList.toggle('on',set.done);}
  const wi=$(`sw-${exIdx}-${setIdx}`);const ri=$(`sr2-${exIdx}-${setIdx}`);
  if(wi)wi.readOnly=set.done;if(ri)ri.readOnly=set.done;
  const allDone=S.session.setLogs[exIdx].every(s=>s.done);
  const card=$(`ec-${exIdx}`);if(card)card.classList.toggle('done',allDone);
  const badge=$(`eb-${exIdx}`);if(badge)badge.style.display=allDone?'':'none';
  const total=Object.values(S.session.setLogs).flat().length;
  const done=Object.values(S.session.setLogs).flat().filter(s=>s.done).length;
  const pct=Math.round((done/total)*100);
  const pb=$('sb-prog');if(pb)pb.style.width=pct+'%';
  const pl=$('sb-prog-lbl');if(pl)pl.textContent=`${done}/${total} sets · ${pct}%`;
  if(set.done)startRest(allDone?90:60);
}
function setVal(exIdx,setIdx,field,val){if(!S.session)return;const set=S.session.setLogs[exIdx]?.[setIdx];if(set){set[field]=val;saveDraft();}}

function syncBars(){
  const sb=$('session-bar'),rb=$('rest-bar'),sc=$('scroll');if(!sb||!rb||!sc)return;
  const sessOn=!!S.session,restOn=!!(S.session?.rest?.on);
  sb.classList.toggle('on',sessOn);rb.classList.toggle('on',restOn);
  sc.style.paddingTop=(sessOn?(56+(restOn?80:0)):0)+'px';
  const rt=$('rb-title');if(rt&&S.session)rt.textContent=S.session.planName||'Rest Timer';
}

document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&S.session){
    const el=$('sb-time');if(el)el.textContent=fmt((Date.now()-S.session.startTs)/1000);
    S.session.burn=Math.round(5*(S.profile.weightKg||100)*(Date.now()-S.session.startTs)/3600000);
    const bel=$('sb-burn');if(bel)bel.textContent=S.session.burn+' kcal';
    if(S.session.rest?.on){const rem=S.session.rest.target-(Date.now()-S.session.rest.startTs)/1000;if(rem<=0){clearInterval(S.session.rest.iv);S.session.rest.on=false;if(navigator.vibrate)navigator.vibrate([400,100,400]);toast('Rest over — GO! 💪');syncBars();}}
  }
  if(document.hidden)saveDraft();
});

// ── NAVIGATION ─────────────────────────
function go(page){
  S.page=page;
  document.querySelectorAll('.nb').forEach(b=>b.classList.toggle('on',b.dataset.p===page));
  const sc=$('scroll');if(!sc)return;
  const renders={home:pgHome,workout:pgWorkout,food:pgFood,dashboard:pgDashboard,history:pgHistory,plans:pgPlans};
  sc.innerHTML=`<div class="page">${(renders[page]||pgHome)()}</div>`;
  sc.scrollTop=0;bindPage();syncBars();
}
function bindPage(){
  const fs=$('food-search');if(fs)fs.addEventListener('input',foodSearch);
  const bw=$('bw-inp');if(bw)bw.addEventListener('change',e=>{todayLog().bodyWeight=parseFloat(e.target.value)||null;save();});
}

let _toastT;
function toast(msg,isErr=false){const t=$('toast');if(!t)return;t.textContent=msg;t.className=isErr?'err':'ok';t.style.opacity='1';clearTimeout(_toastT);_toastT=setTimeout(()=>t.style.opacity='0',2500);}

// ─────────────────────────────────────
//  HOME PAGE
// ─────────────────────────────────────
function pgHome(){
  const dn=dayNum(),goal=S.profile.goalDays,pct=Math.round((dn/goal)*100);
  const log=todayLog(),cal=consumed(S.today),pro=Math.round(proteinG(S.today));
  const brn=burnedCal(S.today),net=cal-brn;
  const planId=todayPlanId(),plan=getPlan(planId);
  const dateStr=new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'});
  const draft=loadDraft();
  const draftBanner=(!S.session&&draft)?`
    <div style="margin:0 16px 12px;background:var(--adim);border:1px solid var(--abrd);
      border-radius:var(--r);padding:14px 16px;display:flex;justify-content:space-between;align-items:center">
      <div><div style="font-size:13px;font-weight:700;color:var(--accent)">Unfinished session found</div>
        <div style="font-size:12px;color:var(--sub);margin-top:2px">${draft.planName||''}</div></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-o btn-sm" onclick="discardDraft()">Discard</button>
        <button class="btn btn-a btn-sm" onclick="resumeDraft()">Resume</button>
      </div>
    </div>`:'';
  return `
  ${draftBanner}
  <div class="hero">
    <div class="hero-day">${dateStr} · ${S.profile.programName}</div>
    <div class="hero-title">Day <span style="color:var(--accent)">${dn}</span> <span style="font-size:16px;color:var(--sub);font-weight:500">/ ${goal}</span></div>
    <div class="hero-sub">${plan?plan.emoji+' '+plan.name:'No plan selected'}</div>
    <div class="prog-wrap"><div class="prog-fill" style="width:${pct}%"></div></div>
    <div style="display:flex;gap:8px">
      ${S.session
        ?`<button class="btn btn-a" style="flex:1" onclick="go('workout')">Resume →</button>
           <button class="btn btn-o btn-sm" onclick="confirmFinish()">Finish ✓</button>`
        :`<button class="btn btn-a" style="flex:1" onclick="startSession('${planId||''}')">⏱ Start Workout</button>
           <button class="btn btn-o btn-sm" onclick="openPlanPicker()">Change</button>`}
    </div>
    ${(log.sessions||[]).length>0?`<div style="font-size:12px;color:var(--accent);margin-top:10px">✓ ${log.sessions.length} session(s) done today · ${brn} kcal burned</div>`:''}
  </div>
  <div class="sec">Today</div>
  <div class="macro-row">
    <div class="mc"><div class="v" style="color:var(--accent)">${cal}</div><div class="l">Eaten</div></div>
    <div class="mc"><div class="v" style="color:var(--red)">${brn}</div><div class="l">Burned</div></div>
    <div class="mc"><div class="v" style="color:${net<=0?'var(--green)':'var(--red)'}">${net>0?'+':''}${net}</div><div class="l">Net</div></div>
    <div class="mc"><div class="v" style="color:var(--blue)">${pro}g</div><div class="l">Protein</div></div>
  </div>
  <div class="sec">Water</div>
  <div class="water-row">
    ${[1,2,3,4,5,6,7,8].map(i=>`<button class="gl ${(log.water||0)>=i?'on':''}" onclick="logWater(${i})">${(log.water||0)>=i?'💧':'○'}</button>`).join('')}
    <span style="font-size:12px;color:var(--sub);margin-left:4px">${log.water||0}/8 glasses</span>
  </div>
  <div class="sec">Body Weight</div>
  <div style="padding:0 16px;display:flex;align-items:center;gap:10px">
    <input id="bw-inp" type="number" class="inp" style="max-width:110px" step="0.1" placeholder="kg" value="${log.bodyWeight||''}">
    <span style="font-size:13px;color:var(--sub)">log today's weight</span>
  </div>
  <div class="sec">Activity</div>
  <div class="card mx mb12 pad" style="display:flex;justify-content:space-around">
    <div style="text-align:center"><div style="font-size:22px;font-weight:800;color:var(--orange)">${streak()}</div><div style="font-size:10px;color:var(--sub);text-transform:uppercase;letter-spacing:.5px">Streak 🔥</div></div>
    <div style="text-align:center"><div style="font-size:22px;font-weight:800;color:var(--accent)">${Object.values(S.logs).filter(l=>(l.sessions||[]).length>0).length}</div><div style="font-size:10px;color:var(--sub);text-transform:uppercase;letter-spacing:.5px">Sessions</div></div>
    <div style="text-align:center"><div style="font-size:22px;font-weight:800;color:var(--purple)">${Math.max(0,goal-dn)}</div><div style="font-size:10px;color:var(--sub);text-transform:uppercase;letter-spacing:.5px">Days Left</div></div>
  </div>
  <div class="sec">Upcoming</div>
  <div class="card mx mb12">
    ${[1,2,3,4].map(i=>{const d2=dn+i;if(d2>goal)return '';const wd=WEEKDAYS[(new Date().getDay()+i)%7];const pid=S.profile.weeklySchedule[wd];const pl=getPlan(pid);return `<div class="upcoming-row"><span style="font-size:11px;color:var(--sub);min-width:44px">Day ${d2}</span><span style="font-size:22px">${pl?.emoji||'📋'}</span><div style="flex:1"><div style="font-size:14px;font-weight:600">${pl?.name||'—'}</div><div style="font-size:11px;color:var(--sub)">${WD_LABELS[wd]}</div></div></div>`;}).join('')}
  </div>`;
}
function logWater(g){todayLog().water=g;save();go('home');}
function discardDraft(){localStorage.removeItem(DRAFT);go('home');}
function resumeDraft(){const d=loadDraft();if(!d)return;S.session=d;S.session.timerIv=setInterval(tickSession,1000);if(S.session.rest?.on)S.session.rest.iv=setInterval(tickRest,250);syncBars();go('workout');}
function confirmFinish(){const d=Object.values(S.session?.setLogs||{}).flat().filter(s=>s.done).length;const t=Object.values(S.session?.setLogs||{}).flat().length;if(d<t*.4&&!confirm(`Only ${d}/${t} sets done. Finish anyway?`))return;finishSession();}

// ─────────────────────────────────────
//  WORKOUT PAGE
// ─────────────────────────────────────
function pgWorkout(){
  if(!S.session){
    const sp=todayPlanId(),plan=getPlan(sp);
    return `<div class="pg-title">Workout</div><div class="pg-sub">Select a plan and start your session</div>
    ${plan?`<div class="card mx mb12" style="padding:18px;text-align:center;border-left:4px solid var(--accent)">
      <div style="font-size:48px;margin-bottom:10px">${plan.emoji}</div>
      <div style="font-size:20px;font-weight:800;margin-bottom:4px">${plan.name}</div>
      <div style="font-size:13px;color:var(--sub);margin-bottom:16px">${plan.exercises.length} exercises</div>
      <div style="display:flex;gap:8px"><button class="btn btn-a" style="flex:1" onclick="startSession('${plan.id}')">⏱ Start Session</button>
      <button class="btn btn-o btn-sm" onclick="openPlanPicker()">Change</button></div></div>
    <div class="sec">Preview</div>
    <div class="card mx">${plan.exercises.map((pe,i)=>{const ex=getEx(pe.exId);return `<div style="display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--line)${i===plan.exercises.length-1?';border-bottom:none':''}"><span style="font-size:22px;font-weight:800;color:var(--faint);min-width:26px">${i+1}</span><div style="flex:1"><div style="font-size:14px;font-weight:600">${ex?.name||'Unknown'}</div><div style="font-size:12px;color:var(--accent);margin-top:2px">${pe.sets}×${pe.reps}</div></div>${ex?.isCardio?'<span class="pill pb">cardio</span>':''}</div>`;}).join('')}</div>`
    :`<div style="padding:40px 16px;text-align:center"><div style="font-size:13px;color:var(--sub);margin-bottom:16px">No plan selected</div><button class="btn btn-a" style="max-width:240px;margin:0 auto" onclick="openPlanPicker()">Select a Plan</button></div>`}`;
  }
  const plan=getPlan(S.session.planId);
  const fl=Object.values(S.session.setLogs).flat();
  const done=fl.filter(s=>s.done).length,total=fl.length;
  const pct=Math.round((done/total)*100);
  const pb=$('sb-prog');if(pb)pb.style.width=pct+'%';
  const pl=$('sb-prog-lbl');if(pl)pl.textContent=`${done}/${total} sets · ${pct}%`;

  // Build exercise list: plan exercises + any extras
  const planExItems=(plan?.exercises||[]).map((pe,i)=>({planExIdx:i,pe,ex:getEx(pe.exId),isExtra:false}));
  const extraItems=(S.session.extraExercises||[]).map(e=>({planExIdx:e.idx,pe:{sets:e.sets,reps:e.reps,note:e.note||''},ex:getEx(e.exId),isExtra:true}));
  const allItems=[...planExItems,...extraItems];

  return `<div style="padding:12px 0 0">
  ${allItems.map(({planExIdx,pe,ex,isExtra})=>renderExCard(ex,pe,planExIdx,isExtra)).join('')}
  <div style="padding:10px 16px;display:grid;gap:8px">
    <button class="btn btn-b" onclick="openAddExWorkout()">➕ Add Exercise to Session</button>
    <button class="btn btn-r" onclick="confirmFinish()">🏁 Finish Workout</button>
  </div></div>`;
}

function renderExCard(ex,pe,i,isExtra){
  const sets=S.session?S.session.setLogs[i]||[]:[],allDone=sets.length>0&&sets.every(s=>s.done);
  const prev=prevLoad(ex?.name||'');
  return `<div class="ex-card${allDone?' done':''}" id="ec-${i}">
  <div class="ex-head">
    <div class="ex-num">${i+1}</div>
    <div class="ex-meta">
      <div class="ex-name">${ex?.name||'Exercise'} ${isExtra?'<span class="pill po" style="font-size:9px;margin-left:4px">Added</span>':''}</div>
      <div class="ex-scheme">${pe.sets}×${pe.reps}</div>
    </div>
    <div style="display:flex;gap:6px;align-items:center">
      <span class="pill pa" id="eb-${i}" style="display:${allDone?'':'none'}">✓</span>
      <button class="icon-btn" style="font-size:13px" onclick="editExDuringWorkout(${i})">⋮</button>
    </div>
  </div>
  ${pe.note?`<div class="ex-note">${pe.note}</div>`:''}
  <div class="ex-prev ${prev?'':'none'}">
    ${prev?`📊 Last: <strong>${prev.weight}kg × ${prev.reps}</strong> · ${fmtDate(prev.date)}`:'📊 No previous data yet'}
  </div>
  ${ex?.isCardio?`<div class="cardio-row"><span style="font-size:13px;color:var(--sub)">🏃 Timed — mark done when complete</span>
    <button class="sc ${sets[0]?.done?'on':''}" id="sc-${i}-0"
      onclick="completeSet(${i},0)" style="width:auto;padding:0 14px;font-size:13px">${sets[0]?.done?'✓ Done':'Mark Done'}</button></div>`:`
  <div class="set-tbl">
    <div class="set-head"><span>#</span><span>Weight (kg)</span><span>Reps</span><span>✓</span></div>
    ${sets.map((set,si)=>`<div class="set-row${set.done?' done':''}" id="sr-${i}-${si}">
      <div class="sn">${si+1}</div>
      <input id="sw-${i}-${si}" type="number" class="si" step="0.5"
        placeholder="${prev?prev.weight:'—'}" value="${set.weight}"
        oninput="setVal(${i},${si},'weight',this.value)" ${set.done?'readonly':''}>
      <input id="sr2-${i}-${si}" type="number" class="si"
        placeholder="${pe.reps.toString().split('–')[0]}" value="${set.reps}"
        oninput="setVal(${i},${si},'reps',this.value)" ${set.done?'readonly':''}>
      <button class="sc${set.done?' on':''}" id="sc-${i}-${si}"
        onclick="completeSet(${i},${si})">${set.done?'✓':'○'}</button>
    </div>`).join('')}
  </div>`}
  </div>`;
}

// ─────────────────────────────────────
//  WORKOUT SUMMARY + PNG EXPORT
// ─────────────────────────────────────
function showSummary(sessData){
  const dn=dayNum(),goal=S.profile.goalDays;
  const daysLeft=Math.max(0,goal-dn);
  const str=streak();
  const dur=sessData.duration,brn=sessData.burn;
  const mw=sessionMaxWeight(sessData);
  const prs=calcPRs();
  const overlay=$('summary-overlay');
  if(!overlay)return;
  overlay.classList.add('on');
  const si=$('sum-inner');
  si.innerHTML=`
  <div class="sum-header">
    <button class="sum-close" onclick="closeSummary()">×</button>
    <div class="sum-brand">FitTrack Pro · Workout Complete 🎉</div>
    <div class="sum-plan">${sessData.planEmoji||'💪'} ${sessData.planName}</div>
    <div class="sum-date">${fmtDateLong(new Date().toDateString())}</div>
    <div class="sum-big">
      <div class="sum-big-val">${fmt(dur)}</div>
      <div class="sum-big-unit">duration</div>
    </div>
  </div>
  <div class="sum-body">
    <div class="sum-grid">
      <div class="sum-card">
        <div class="sum-card-val" style="color:var(--red)">${brn}</div>
        <div class="sum-card-label">kcal Burned</div>
      </div>
      <div class="sum-card">
        <div class="sum-card-val" style="color:var(--orange)">${str} 🔥</div>
        <div class="sum-card-label">Day Streak</div>
      </div>
      <div class="sum-card">
        <div class="sum-card-val" style="color:var(--purple)">${dn}</div>
        <div class="sum-card-label">Day # of ${goal}</div>
      </div>
      <div class="sum-card">
        <div class="sum-card-val" style="color:var(--blue)">${daysLeft}</div>
        <div class="sum-card-label">Days Remaining</div>
      </div>
    </div>
    ${mw.weight>0?`
    <div class="sum-pr-box">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--accent);text-transform:uppercase;margin-bottom:8px">🏆 Top Lift This Session</div>
      <div style="font-size:32px;font-weight:900;color:var(--accent)">${mw.weight} kg</div>
      <div style="font-size:14px;color:var(--sub);margin-top:4px">${mw.exercise}</div>
      ${prs[mw.exercise]&&mw.weight>=(prs[mw.exercise]?.weight||0)?'<div style="margin-top:8px"><span class="pill pa">🏆 Personal Record!</span></div>':''}
    </div>`:''}
    <div class="sum-hr-box">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--red);text-transform:uppercase;margin-bottom:8px">Heart Rate</div>
      <div style="display:flex;gap:24px">
        <div><div style="font-size:22px;font-weight:800;color:var(--sub)">—</div><div style="font-size:11px;color:var(--sub)">Avg bpm</div></div>
        <div><div style="font-size:22px;font-weight:800;color:var(--sub)">—</div><div style="font-size:11px;color:var(--sub)">Max bpm</div></div>
      </div>
      <div style="font-size:11px;color:var(--sub);margin-top:8px">Connect a wearable for heart rate data</div>
    </div>
    <div style="background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:14px 16px">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--sub);text-transform:uppercase;margin-bottom:10px">Session Summary</div>
      <div style="display:grid;gap:6px;font-size:13px">
        <div style="display:flex;justify-content:space-between"><span style="color:var(--sub)">Exercises done</span><span>${Object.keys(sessData.setLogs||{}).length}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--sub)">Total sets</span><span>${Object.values(sessData.setLogs||{}).flat().filter(s=>s.done).length}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--sub)">Total volume</span><span style="color:var(--accent)">${Object.values(sessData.setLogs||{}).flat().filter(s=>s.done).reduce((v,s)=>v+(parseFloat(s.weight)||0)*(parseInt(s.reps)||0),0).toLocaleString()} kg</span></div>
      </div>
    </div>
  </div>
  <div class="sum-actions">
    <button class="btn btn-a" onclick="downloadSummaryPNG()">📸 Save as Image</button>
    <button class="btn btn-o" onclick="shareSummary()">📤 Share</button>
    <button class="btn btn-o" onclick="closeSummary()">Done →</button>
  </div>`;
  // store for PNG generation
  overlay._sessData=sessData;
  overlay._dn=dn;overlay._goal=goal;overlay._str=str;
}

function closeSummary(){const o=$('summary-overlay');if(o){o.classList.remove('on');o.innerHTML='<div class="sum-inner" id="sum-inner"></div>';}go('home');}

function downloadSummaryPNG(){
  const overlay=$('summary-overlay');
  if(!overlay||!overlay._sessData){toast('No session data',true);return;}
  const d=overlay._sessData,dn=overlay._dn,goal=overlay._goal,str=overlay._str;
  const dur=d.duration,brn=d.burn,mw=sessionMaxWeight(d);
  const W=1080,H=1920;
  const canvas=document.createElement('canvas');
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  // Background
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0a1500');bg.addColorStop(.5,'#0d0d0d');bg.addColorStop(1,'#000510');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // Top accent bar
  const accentBar=ctx.createLinearGradient(0,0,W,0);
  accentBar.addColorStop(0,'#c9ff3e');accentBar.addColorStop(1,'#3effa0');
  ctx.fillStyle=accentBar;ctx.fillRect(0,0,W,10);
  // Brand
  ctx.font='700 52px -apple-system,sans-serif';
  ctx.fillStyle='#c9ff3e';ctx.fillText('FITTRACK PRO',80,120);
  // Emoji + Plan name
  ctx.font='700 72px -apple-system,sans-serif';
  ctx.fillStyle='#f0f0f0';ctx.fillText(d.planEmoji||'💪'+' '+d.planName,80,230);
  // Date
  ctx.font='400 44px -apple-system,sans-serif';
  ctx.fillStyle='#7a7a8a';ctx.fillText(fmtDateLong(new Date().toDateString()),80,310);
  // Separator
  ctx.strokeStyle='rgba(201,255,62,.2)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(80,360);ctx.lineTo(W-80,360);ctx.stroke();
  // Big duration
  ctx.font='900 200px -apple-system,sans-serif';
  ctx.fillStyle='#c9ff3e';ctx.fillText(fmt(dur),80,580);
  ctx.font='400 52px -apple-system,sans-serif';
  ctx.fillStyle='#7a7a8a';ctx.fillText('DURATION',80,650);
  // Stats grid (2×2)
  const statsY=720;
  function drawStatCard(x,y,w,h,val,label,color){
    ctx.fillStyle='#161616';roundRect(ctx,x,y,w,h,24);ctx.fill();
    ctx.strokeStyle='#282828';ctx.lineWidth=2;roundRect(ctx,x,y,w,h,24);ctx.stroke();
    ctx.font='900 88px -apple-system,sans-serif';ctx.fillStyle=color;
    ctx.fillText(String(val),x+32,y+h-70);
    ctx.font='700 38px -apple-system,sans-serif';ctx.fillStyle='#7a7a8a';
    ctx.fillText(label,x+32,y+h-24);
  }
  const cw=(W-80*2-30)/2,ch=260;
  drawStatCard(80,statsY,cw,ch,brn,'KCAL BURNED','#ff4f4f');
  drawStatCard(80+cw+30,statsY,cw,ch,str+'🔥','DAY STREAK','#ff8c3e');
  drawStatCard(80,statsY+ch+20,cw,ch,dn,'TODAY\'S DAY','#b57bff');
  drawStatCard(80+cw+30,statsY+ch+20,cw,ch,Math.max(0,goal-dn),'DAYS LEFT','#3ecfff');
  // Max weight
  if(mw.weight>0){
    const mwy=statsY+ch*2+80;
    ctx.fillStyle='rgba(201,255,62,.08)';roundRect(ctx,80,mwy,W-160,200,24);ctx.fill();
    ctx.strokeStyle='rgba(201,255,62,.28)';ctx.lineWidth=2;roundRect(ctx,80,mwy,W-160,200,24);ctx.stroke();
    ctx.font='700 40px -apple-system,sans-serif';ctx.fillStyle='#c9ff3e';
    ctx.fillText('🏆 TOP LIFT THIS SESSION',112,mwy+60);
    ctx.font='900 100px -apple-system,sans-serif';ctx.fillStyle='#c9ff3e';
    ctx.fillText(mw.weight+' kg',112,mwy+170);
    ctx.font='400 36px -apple-system,sans-serif';ctx.fillStyle='#7a7a8a';
    const nm=mw.exercise.length>30?mw.exercise.slice(0,30)+'…':mw.exercise;
    ctx.fillText(nm,360,mwy+170);
  }
  // HR section (placeholder)
  const hry=statsY+ch*2+320;
  ctx.fillStyle='rgba(255,79,79,.08)';roundRect(ctx,80,hry,W-160,160,24);ctx.fill();
  ctx.strokeStyle='rgba(255,79,79,.25)';ctx.lineWidth=2;roundRect(ctx,80,hry,W-160,160,24);ctx.stroke();
  ctx.font='700 38px -apple-system,sans-serif';ctx.fillStyle='#ff4f4f';
  ctx.fillText('❤️ HEART RATE — Connect wearable to track',112,hry+100);
  // Footer
  ctx.font='600 42px -apple-system,sans-serif';ctx.fillStyle='#333';
  ctx.fillText('fittrackpro.app',80,H-60);
  ctx.font='700 42px -apple-system,sans-serif';ctx.fillStyle='#c9ff3e';
  const fw=ctx.measureText('fittrackpro.app').width;
  ctx.fillText('#FitTrackPro',80+fw+40,H-60);
  // Download
  const url=canvas.toDataURL('image/png');
  const a=document.createElement('a');a.href=url;
  a.download=`fittrack_${d.planName.replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.png`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  toast('Image saved!');
}

function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

function shareSummary(){
  const overlay=$('summary-overlay');
  if(!overlay||!overlay._sessData)return;
  const d=overlay._sessData;
  const text=`💪 Workout Complete!\n${d.planEmoji||''} ${d.planName}\n⏱ ${fmt(d.duration)} · 🔥 ${d.burn} kcal\n📅 ${fmtDateLong(new Date().toDateString())}\n\nTracked with FitTrack Pro`;
  if(navigator.share)navigator.share({title:'FitTrack Workout',text});
  else{navigator.clipboard?.writeText(text);toast('Copied to clipboard!');}
}

// ─────────────────────────────────────
//  FOOD PAGE
// ─────────────────────────────────────
function pgFood(){
  const log=todayLog(),cal=consumed(S.today),pro=Math.round(proteinG(S.today));
  const carbs=Math.round((log.foods||[]).reduce((s,f)=>s+foodC(f),0));
  const fats=Math.round((log.foods||[]).reduce((s,f)=>s+foodF(f),0));
  const rem=S.profile.targetCal-cal;
  const pct=Math.min(Math.round((cal/S.profile.targetCal)*100),100);
  const R=38,C=2*Math.PI*R;
  return `
  <div style="display:flex;align-items:center;gap:16px;padding:14px 16px;
    background:var(--card);border-bottom:1px solid var(--line)">
    <div class="ring-wrap">
      <svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="${R}" fill="none" stroke="var(--faint)" stroke-width="9"/>
        <circle cx="48" cy="48" r="${R}" fill="none" stroke="var(--accent)" stroke-width="9"
          stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pct/100)}"
          stroke-linecap="round" transform="rotate(-90 48 48)"/></svg>
      <div class="ring-center"><div class="ring-val">${cal}</div><div class="ring-lbl">/ ${S.profile.targetCal}</div></div>
    </div>
    <div style="flex:1;display:grid;gap:7px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--sub)">🔵 Protein</span>
        <span style="font-size:14px;font-weight:700;color:var(--blue)">${pro}g / ${S.profile.targetProtein}g</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--sub)">🟢 Carbs</span>
        <span style="font-size:14px;font-weight:700;color:var(--accent)">${carbs}g</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--sub)">🟠 Fats</span>
        <span style="font-size:14px;font-weight:700;color:var(--orange)">${fats}g</span>
      </div>
      <div style="font-size:13px;font-weight:700;color:${rem>=0?'var(--green)':'var(--red)'}">${rem>=0?rem+' kcal left':Math.abs(rem)+' kcal over target'}</div>
    </div>
  </div>

  <div class="sec">Add Food</div>
  <div style="padding:0 16px 10px">
    <input id="food-search" type="text" class="inp" placeholder="Search chicken, rice, momo, dal bhat…" autocomplete="off">
  </div>
  <div id="food-results" style="padding:0 16px"></div>

  <div class="sec">Add Custom</div>
  <div style="padding:0 16px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
    <input id="cf-name" type="text" class="inp" placeholder="Food name" style="grid-column:1/-1">
    <div><label class="lbl">Calories</label><input id="cf-cal" type="number" class="inp inp-sm" placeholder="0"></div>
    <div><label class="lbl">Protein g</label><input id="cf-p" type="number" class="inp inp-sm" placeholder="0"></div>
    <div><label class="lbl">Carbs g</label><input id="cf-c" type="number" class="inp inp-sm" placeholder="0"></div>
    <div><label class="lbl">Fat g</label><input id="cf-f" type="number" class="inp inp-sm" placeholder="0"></div>
    <button class="btn btn-o" style="grid-column:1/-1" onclick="addCustomFood()">Add to Log</button>
  </div>

  <div class="sec">Cook Your Meal 🍳</div>
  <div style="padding:0 16px 8px">
    <button class="btn btn-g" onclick="openCookMeal()">🥘 Open Meal Builder</button>
  </div>

  <div class="sec">Today's Food Log <span style="font-weight:400;font-size:11px">(${(log.foods||[]).length} items · ${cal} kcal)</span></div>
  <div class="card mx">
    ${(log.foods||[]).length===0
      ?`<div class="pad" style="color:var(--sub);font-size:13px">No food logged yet</div>`
      :(log.foods||[]).map((f,i)=>`
      <div class="food-item">
        <div class="fi-info">
          <div class="fi-nm">${f.name}</div>
          <div class="fi-mc">${foodP(f)}g P · ${foodC(f)}g C · ${foodF(f)}g F${f.qty&&f.qty!==1?` · ×${f.qty}`:''}</div>
        </div>
        <div class="fi-right">
          <div class="fi-qty-wrap">
            <button class="fi-qty-btn" onclick="changeFoodQty('${S.today}',${i},-0.5)">−</button>
            <span class="fi-qty-val">${f.qty||1}x</span>
            <button class="fi-qty-btn" onclick="changeFoodQty('${S.today}',${i},0.5)">+</button>
          </div>
          <div class="fi-cal">${foodCal(f)}</div>
          <button class="fi-rm" onclick="removeFood(${i})">×</button>
        </div>
      </div>`).join('')}
  </div>`;
}

function foodSearch(){
  const q=$('food-search')?.value.toLowerCase().trim();
  const r=$('food-results');if(!r)return;
  if(!q){r.innerHTML='';return;}
  const hits=FOODS.filter(f=>f.name.toLowerCase().includes(q)).slice(0,8);
  r.innerHTML=hits.length
    ?hits.map(f=>`<div class="food-res" onclick="addFoodItem('${f.name.replace(/'/g,"\\'")}',${f.cal},${f.p},${f.c},${f.f})"><span style="font-size:14px">${f.name}</span><span style="font-size:13px;font-weight:700;color:var(--accent)">${f.cal} kcal</span></div>`).join('')
    :`<div style="font-size:13px;color:var(--sub);padding:8px 0">No matches — use custom below</div>`;
}
function addFoodItem(name,cal,p,c,f){
  todayLog().foods.push({name,cal,p,c,f,qty:1});save();
  const s=$('food-search');if(s)s.value='';
  const r=$('food-results');if(r)r.innerHTML='';
  go('food');toast(name+' added!');
}
function addCustomFood(){
  const n=$('cf-name')?.value.trim();const c=parseInt($('cf-cal')?.value)||0;
  if(!n||!c){toast('Enter name + calories',true);return;}
  const p=parseFloat($('cf-p')?.value)||0,cr=parseFloat($('cf-c')?.value)||0,fv=parseFloat($('cf-f')?.value)||0;
  todayLog().foods.push({name:n,cal:c,p,c:cr,f:fv,qty:1});save();go('food');toast(n+' added!');
}
function removeFood(i){todayLog().foods.splice(i,1);save();go('food');}
function changeFoodQty(dateStr,idx,delta){
  const log=dayLog(dateStr);if(!log.foods[idx])return;
  const newQty=Math.max(0.5,Math.round(((log.foods[idx].qty||1)+delta)*10)/10);
  log.foods[idx].qty=newQty;save();
  if(dateStr===S.today)go('food');
  else openDayEdit(dateStr);
}

// ── COOK MEAL ─────────────────────────
let _cm={name:'',ingredients:[],servings:4,myServings:1};

function openCookMeal(){
  _cm={name:'',ingredients:[],servings:4,myServings:1};
  renderCookModal();
}
function renderCookModal(){
  const total=_cm.ingredients.reduce((s,ing)=>({cal:s.cal+ing.cal*ing.qty/100,p:s.p+(ing.p||0)*ing.qty/100,c:s.c+(ing.c||0)*ing.qty/100,f:s.f+(ing.f||0)*ing.qty/100}),{cal:0,p:0,c:0,f:0});
  const perServing={cal:total.cal/_cm.servings,p:total.p/_cm.servings,c:total.c/_cm.servings,f:total.f/_cm.servings};
  const myTotal={cal:perServing.cal*_cm.myServings,p:perServing.p*_cm.myServings,c:perServing.c*_cm.myServings,f:perServing.f*_cm.myServings};
  showModal(`
  <div class="modal-head">
    <div class="modal-title">🥘 Meal Builder</div>
    <button class="modal-close" onclick="closeModal()">×</button>
  </div>
  <div style="padding:14px 16px;display:grid;gap:10px">
    <div><label class="lbl">Recipe Name</label>
      <input id="cm-name" class="inp" placeholder="e.g. Chicken Dal Bhat" value="${_cm.name}"
        oninput="_cm.name=this.value"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div><label class="lbl">Total Servings</label>
        <input id="cm-srv" type="number" class="inp inp-sm" value="${_cm.servings}" min="1"
          onchange="_cm.servings=parseFloat(this.value)||1;renderCookModal()"></div>
      <div><label class="lbl">My Servings</label>
        <input id="cm-my" type="number" class="inp inp-sm" value="${_cm.myServings}" min="0.5" step="0.5"
          onchange="_cm.myServings=parseFloat(this.value)||1;renderCookModal()"></div>
    </div>
  </div>

  <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--sub);text-transform:uppercase;padding:4px 16px 8px">Ingredients</div>
  <div class="card mx mb8">
    ${_cm.ingredients.length===0?`<div class="pad" style="color:var(--sub);font-size:13px">No ingredients yet</div>`:
      _cm.ingredients.map((ing,i)=>`
      <div class="ing-row">
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600">${ing.name}</div>
          <div style="font-size:11px;color:var(--sub)">${ing.qty}g · ${Math.round(ing.cal*ing.qty/100)} kcal</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <input type="number" class="inp inp-sm" style="width:72px" value="${ing.qty}"
            onchange="cmSetQty(${i},this.value)" placeholder="g">
          <span style="font-size:11px;color:var(--sub)">g</span>
          <button class="fi-rm" onclick="cmRemoveIng(${i})">×</button>
        </div>
      </div>`).join('')}
  </div>

  <div style="padding:0 16px;display:grid;gap:8px">
    <button class="btn btn-b btn-sm" style="width:auto" onclick="openCmIngPicker()">+ Add Ingredient</button>
  </div>

  ${_cm.ingredients.length>0?`
  <div style="margin:12px 16px;background:var(--adim);border:1px solid var(--abrd);border-radius:var(--r);padding:14px">
    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--accent);text-transform:uppercase;margin-bottom:8px">My ${_cm.myServings} Serving${_cm.myServings!==1?'s':''}</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">
      <div><div style="font-size:20px;font-weight:800;color:var(--accent)">${Math.round(myTotal.cal)}</div><div style="font-size:9px;color:var(--sub)">kcal</div></div>
      <div><div style="font-size:20px;font-weight:800;color:var(--blue)">${Math.round(myTotal.p)}g</div><div style="font-size:9px;color:var(--sub)">protein</div></div>
      <div><div style="font-size:20px;font-weight:800;color:var(--accent)">${Math.round(myTotal.c)}g</div><div style="font-size:9px;color:var(--sub)">carbs</div></div>
      <div><div style="font-size:20px;font-weight:800;color:var(--orange)">${Math.round(myTotal.f)}g</div><div style="font-size:9px;color:var(--sub)">fat</div></div>
    </div>
  </div>
  <div style="padding:0 16px 8px">
    <button class="btn btn-a" onclick="logCookMeal()">Log to Food Diary</button>
  </div>`:''}
  `);
}

function cmSetQty(i,val){_cm.ingredients[i].qty=parseFloat(val)||100;renderCookModal();}
function cmRemoveIng(i){_cm.ingredients.splice(i,1);renderCookModal();}

function openCmIngPicker(){
  showModal(`
  <div class="modal-head">
    <div class="modal-title">Add Ingredient</div>
    <button class="modal-close" onclick="renderCookModal()">← Back</button>
  </div>
  <div style="padding:8px 16px">
    <input type="text" class="inp" placeholder="Search food…" oninput="filterCmIng(this.value)" id="cm-ing-search">
  </div>
  <div id="cm-ing-list">${renderCmIngList('')}</div>
  <div style="padding:10px 16px;border-top:1px solid var(--line)">
    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--sub);text-transform:uppercase;margin-bottom:8px">Custom Ingredient</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      <input id="ci-name" class="inp" placeholder="Name" style="grid-column:1/-1">
      <div><label class="lbl" style="font-size:8px">Cal per 100g</label><input id="ci-cal" type="number" class="inp inp-sm" placeholder="0"></div>
      <div><label class="lbl" style="font-size:8px">Protein per 100g</label><input id="ci-p" type="number" class="inp inp-sm" placeholder="0"></div>
      <button class="btn btn-o" style="grid-column:1/-1;padding:9px" onclick="addCustomCmIng()">Add Custom</button>
    </div>
  </div>`);
}
function renderCmIngList(q){
  const hits=FOODS.filter(f=>!q||f.name.toLowerCase().includes(q.toLowerCase())).slice(0,12);
  return `<div style="padding:0 16px">${hits.map(f=>`<div class="food-res" onclick="addCmIng('${f.name.replace(/'/g,"\\'")}',${f.cal},${f.p||0},${f.c||0},${f.f||0})"><span style="font-size:14px">${f.name}</span><span style="font-size:12px;color:var(--sub)">${f.cal}/100g</span></div>`).join('')}</div>`;
}
function filterCmIng(q){const el=$('cm-ing-list');if(el)el.innerHTML=renderCmIngList(q);}
function addCmIng(name,cal,p,c,f){_cm.ingredients.push({name,cal,p,c,f,qty:100});renderCookModal();}
function addCustomCmIng(){const n=$('ci-name')?.value.trim();const c=parseInt($('ci-cal')?.value)||0;if(!n||!c){toast('Enter name + calories',true);return;}addCmIng(n,c,parseFloat($('ci-p')?.value)||0,0,0);}

function logCookMeal(){
  if(!_cm.ingredients.length){toast('Add ingredients first',true);return;}
  const name=_cm.name||'Home-cooked Meal';
  const total=_cm.ingredients.reduce((s,ing)=>({cal:s.cal+ing.cal*ing.qty/100,p:s.p+(ing.p||0)*ing.qty/100,c:s.c+(ing.c||0)*ing.qty/100,f:s.f+(ing.f||0)*ing.qty/100}),{cal:0,p:0,c:0,f:0});
  const perSrv={cal:total.cal/_cm.servings,p:total.p/_cm.servings,c:total.c/_cm.servings,f:total.f/_cm.servings};
  todayLog().foods.push({
    name:`${name} (${_cm.myServings} srv)`,
    cal:Math.round(perSrv.cal*_cm.myServings),
    p:Math.round(perSrv.p*_cm.myServings*10)/10,
    c:Math.round(perSrv.c*_cm.myServings*10)/10,
    f:Math.round(perSrv.f*_cm.myServings*10)/10,
    qty:1,
  });
  save();closeModal();go('food');toast(name+' logged!');
}

// ─────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────
function pgDashboard(){
  const totalSess=Object.values(S.logs).reduce((s,l)=>s+(l.sessions||[]).length,0);
  const totalBurn=Object.entries(S.logs).reduce((s,[d])=>s+burnedCal(d),0);
  const totalVol=calcTotalVolume();
  const prs=calcPRs();
  const prList=Object.entries(prs).sort((a,b)=>b[1].weight-a[1].weight).slice(0,8);
  const weeks=[];const now=new Date();
  for(let w=7;w>=0;w--){let vol=0,lbl='';for(let d=0;d<7;d++){const dt=new Date(now);dt.setDate(dt.getDate()-(w*7+d));const k=dt.toDateString();if(d===0)lbl=dt.toLocaleDateString('en-IN',{day:'numeric',month:'short'});const l=S.logs[k];if(l)(l.sessions||[]).forEach(sess=>{Object.values(sess.setLogs||{}).forEach(sets=>{sets.forEach(s=>{if(s.done&&s.weight&&s.reps)vol+=((parseFloat(s.weight)||0)*(parseInt(s.reps)||0));});});});}weeks.push({vol,lbl});}
  const maxVol=Math.max(...weeks.map(w=>w.vol),1);
  const cells=[];for(let w=11;w>=0;w--)for(let d=6;d>=0;d--){const dt=new Date(now);dt.setDate(dt.getDate()-(w*7+d));const k=dt.toDateString();const l=S.logs[k];cells.push({k,hasSess:l&&(l.sessions||[]).length>0,hasFood:l&&(l.foods||[]).length>0});}
  const bwData=Object.entries(S.logs).filter(([,l])=>l.bodyWeight).sort(([a],[b])=>new Date(a)-new Date(b)).slice(-20);
  return `
  <div class="pg-title">Dashboard</div><div class="pg-sub">Performance overview</div>
  <div class="dash-stats">
    <div class="ds"><div class="v">${totalSess}</div><div class="l">Sessions</div></div>
    <div class="ds"><div class="v">${streak()}</div><div class="l">Streak 🔥</div></div>
    <div class="ds"><div class="v">${prList.length}</div><div class="l">PRs</div></div>
    <div class="ds"><div class="v">${(totalVol/1000).toFixed(1)}t</div><div class="l">Volume</div></div>
    <div class="ds"><div class="v">${totalBurn}</div><div class="l">kcal</div></div>
    <div class="ds"><div class="v">${dayNum()}</div><div class="l">Day / ${S.profile.goalDays}</div></div>
  </div>
  <div class="sec">Weekly Volume</div>
  <div class="chart-box mx mb12">${svgBarChart(weeks.map(w=>w.vol),weeks.map(w=>w.lbl),maxVol)}</div>
  <div class="sec">Consistency</div>
  <div class="chart-box mx mb12">
    <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:3px">
      ${cells.map(c=>`<div onclick="openDayEdit('${c.k}')"
        style="aspect-ratio:1;border-radius:3px;cursor:pointer;
        background:${c.hasSess?'var(--green)':c.hasFood?'var(--blue)':'var(--faint)'};
        opacity:${c.hasSess||c.hasFood?1:.2}"></div>`).join('')}
    </div>
    <div style="display:flex;gap:14px;margin-top:10px;font-size:11px;color:var(--sub)">
      <div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:2px;background:var(--green)"></div>Workout</div>
      <div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:2px;background:var(--blue)"></div>Food</div>
    </div>
  </div>
  ${prList.length>0?`<div class="sec">Personal Records</div><div class="card mx mb12">${prList.map(([n,pr])=>`<div class="pr-row"><div><div class="pr-name">${n}</div><div class="pr-date">${fmtDate(pr.date)}</div></div><div style="text-align:right"><div class="pr-val">${pr.weight} kg</div><div style="font-size:11px;color:var(--sub)">${pr.reps} reps</div></div></div>`).join('')}</div>`:''}
  ${bwData.length>1?`<div class="sec">Body Weight Trend</div><div class="chart-box mx mb12">${svgLineChart(bwData.map(([,l])=>l.bodyWeight),bwData.map(([d])=>fmtDate(d)))}</div>`:''}`;
}
function svgBarChart(vals,labels,maxVal){const W=300,H=120,PAD=8,BW=22,n=vals.length,xs=vals.map((_,i)=>PAD+i*((W-PAD*2)/(n-1)));return `<svg viewBox="0 0 ${W} ${H+30}" width="100%" style="overflow:visible">${vals.map((v,i)=>{const bh=Math.max(3,Math.round((v/maxVal)*(H-10)));return `<rect x="${xs[i]-BW/2}" y="${H-bh}" width="${BW}" height="${bh}" rx="3" fill="${v>0?'var(--accent)':'var(--faint)'}" opacity="${v>0?1:.4}"/><text x="${xs[i]}" y="${H+14}" text-anchor="middle" font-size="7" fill="var(--sub)">${labels[i]||''}</text>${v>0?`<text x="${xs[i]}" y="${H-bh-4}" text-anchor="middle" font-size="7" fill="var(--sub)">${v>=1000?(v/1000).toFixed(1)+'t':Math.round(v)}</text>`:''}`}).join('')}</svg>`;}
function svgLineChart(vals,labels){const W=300,H=100,PAD=10;if(vals.length<2)return '<div style="color:var(--sub);font-size:13px">Not enough data</div>';const mn=Math.min(...vals)-2,mx=Math.max(...vals)+2,xs=vals.map((_,i)=>PAD+i*((W-PAD*2)/(vals.length-1))),ys=vals.map(v=>PAD+(1-(v-mn)/(mx-mn))*(H-PAD*2));const pts=xs.map((x,i)=>`${x},${ys[i]}`).join(' ');const n=vals.length,sumX=xs.reduce((a,x)=>a+x,0),sumY=ys.reduce((a,y)=>a+y,0),sumXY=xs.reduce((a,x,i)=>a+x*ys[i],0),sumXX=xs.reduce((a,x)=>a+x*x,0),slope=(n*sumXY-sumX*sumY)/(n*sumXX-sumX*sumX),intercept=(sumY-slope*sumX)/n;return `<svg viewBox="0 0 ${W} ${H+20}" width="100%"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/><line x1="${xs[0]}" y1="${intercept+slope*xs[0]}" x2="${xs[xs.length-1]}" y2="${intercept+slope*xs[xs.length-1]}" stroke="var(--sub)" stroke-width="1" stroke-dasharray="4 3" opacity=".5"/>${xs.map((x,i)=>`<circle cx="${x}" cy="${ys[i]}" r="3" fill="var(--accent)"/><text x="${x}" y="${ys[i]-6}" text-anchor="middle" font-size="7" fill="var(--sub)">${vals[i]}</text>`).join('')}<text x="${xs[0]}" y="${H+16}" font-size="7" fill="var(--sub)" text-anchor="middle">${labels[0]||''}</text><text x="${xs[xs.length-1]}" y="${H+16}" font-size="7" fill="var(--sub)" text-anchor="middle">${labels[labels.length-1]||''}</text></svg>`;}

// ─────────────────────────────────────
//  HISTORY
// ─────────────────────────────────────
function pgHistory(){
  const dates=Object.keys(S.logs).sort((a,b)=>new Date(b)-new Date(a));
  return `<div class="pg-title">History</div><div class="pg-sub">Tap any day to view or edit</div>
  ${dates.length===0?`<div class="pad" style="color:var(--sub);font-size:13px;padding:16px">No data yet — start logging!</div>`:`
  <div class="card mx">${dates.map(d=>{const l=S.logs[d],sess=l.sessions||[];const cal=(l.foods||[]).reduce((s,f)=>s+foodCal(f),0);const brn=sess.reduce((s,se)=>s+(se.burn||0),0);return `<div class="hi-row" onclick="openDayEdit('${d}')"><div class="hi-date">${fmtDate(d)}</div><div class="hi-info"><div class="hi-split">${sess[0]?.planEmoji||''} ${sess[0]?.planName||'—'}</div><div class="hi-sub">${cal} kcal · ${brn} burned${l.bodyWeight?' · '+l.bodyWeight+'kg':''}</div></div><span style="color:var(--sub);font-size:18px">›</span></div>`;}).join('')}</div>`}`;
}

// ─────────────────────────────────────
//  PLANS
// ─────────────────────────────────────
function pgPlans(){const t=S.plansTab;return `<div class="pg-title">Plans</div>
  <div class="sub-tabs">
    <button class="st${t==='plans'?' on':''}" onclick="setPlansTab('plans')">My Plans</button>
    <button class="st${t==='exercises'?' on':''}" onclick="setPlansTab('exercises')">Exercises</button>
    <button class="st${t==='schedule'?' on':''}" onclick="setPlansTab('schedule')">Schedule</button>
    <button class="st${t==='export'?' on':''}" onclick="setPlansTab('export')">Export</button>
  </div>
  ${t==='plans'?plansTab():t==='exercises'?exercisesTab():t==='schedule'?scheduleTab():exportTab()}`;}
function setPlansTab(t){S.plansTab=t;go('plans');}

function plansTab(){return `<div style="padding:12px 16px"><button class="btn btn-a" onclick="openPlanBuilder(null)">+ Create New Plan</button></div>
  <div class="card mx">${S.plans.length===0?`<div class="pad" style="color:var(--sub);font-size:13px">No plans yet</div>`:
    S.plans.map(p=>`<div class="plan-row"><div class="plan-em">${p.emoji||'📋'}</div><div class="plan-info"><div class="plan-name">${p.name}</div><div class="plan-sub">${p.exercises.length} exercises</div></div>
    <div class="plan-actions"><button class="icon-btn" onclick="openPlanBuilder('${p.id}')">✏️</button><button class="icon-btn" onclick="deletePlan('${p.id}')">🗑️</button></div></div>`).join('')}</div>`;}

function exercisesTab(){const byGroup={};S.exercises.forEach(e=>{if(!byGroup[e.muscleGroup])byGroup[e.muscleGroup]=[];byGroup[e.muscleGroup].push(e);});return `<div style="padding:12px 16px"><button class="btn btn-a" onclick="openExerciseEdit(null)">+ Create Exercise</button></div>
  ${Object.entries(byGroup).map(([mg,exs])=>`<div class="sec">${mg}</div><div class="card mx mb8">${exs.map(ex=>`<div class="ex-lib-row"><div style="flex:1"><div style="font-size:14px;font-weight:600">${ex.name}</div><div class="ex-lib-mg">${ex.defaultSets}×${ex.defaultReps}${ex.isCardio?' · cardio':''}</div></div><div class="plan-actions"><button class="icon-btn" onclick="openExerciseEdit('${ex.id}')">✏️</button><button class="icon-btn" onclick="deleteExercise('${ex.id}')">🗑️</button></div></div>`).join('')}</div>`).join('')}`;}

function scheduleTab(){return `<div class="sec">Default Weekly Plan</div><div class="card mx">${WEEKDAYS.map(wd=>{const pid=S.profile.weeklySchedule[wd]||null;const plan=getPlan(pid);return `<div class="sch-row"><div class="sch-day">${WD_LABELS[wd]}</div><div class="sch-plan">${plan?plan.emoji+' '+plan.name:'Rest / None'}</div><button class="sch-change" onclick="openSchPicker('${wd}')">Change</button></div>`;}).join('')}</div>`;}

// ── EXPORT TAB (with date filter) ─────
function exportTab(){
  const now=new Date(),defFrom=new Date(now);defFrom.setDate(defFrom.getDate()-30);
  return `<div class="sec">Filter Period</div>
  <div style="padding:0 16px;display:grid;gap:10px">
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-o btn-sm" onclick="setExpRange(1)">Today</button>
      <button class="btn btn-o btn-sm" onclick="setExpRange(7)">7 Days</button>
      <button class="btn btn-o btn-sm" onclick="setExpRange(30)">30 Days</button>
      <button class="btn btn-o btn-sm" onclick="setExpRange(90)">90 Days</button>
      <button class="btn btn-o btn-sm" onclick="setExpRange(9999)">All Time</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div><label class="lbl">From</label><input type="date" id="exp-from" class="inp" value="${defFrom.toISOString().split('T')[0]}"></div>
      <div><label class="lbl">To</label><input type="date" id="exp-to" class="inp" value="${now.toISOString().split('T')[0]}"></div>
    </div>
  </div>
  <div id="exp-preview" style="padding:0 16px;margin-top:8px"></div>
  <div style="padding:12px 16px;display:grid;gap:8px">
    <button class="btn btn-a" onclick="showExpPreview()">🔍 Preview Data</button>
    <button class="btn btn-o" onclick="doCSV()">📊 Export CSV (Excel)</button>
    <button class="btn btn-o" onclick="doJSON()">📄 Export JSON</button>
    <button class="btn btn-o" onclick="doShare()">📤 Share as Text</button>
  </div>`;
}

function setExpRange(days){
  const now=new Date();const from=new Date(now);from.setDate(from.getDate()-(days-1));
  const fi=$('exp-from');const ti=$('exp-to');
  if(fi)fi.value=from.toISOString().split('T')[0];
  if(ti)ti.value=now.toISOString().split('T')[0];
  showExpPreview();
}

function getExpLogs(){
  const from=new Date($('exp-from')?.value||new Date());
  const to=new Date($('exp-to')?.value||new Date());
  to.setHours(23,59,59);
  return Object.entries(S.logs).filter(([d])=>{const dt=new Date(d);return dt>=from&&dt<=to;}).sort(([a],[b])=>new Date(a)-new Date(b));
}

function showExpPreview(){
  const logs=getExpLogs();
  const el=$('exp-preview');if(!el)return;
  if(!logs.length){el.innerHTML='<div style="font-size:13px;color:var(--sub);padding:8px 0">No data in this range</div>';return;}
  let totCal=0,totBrn=0,totSess=0;
  logs.forEach(([d,l])=>{totCal+=consumed(d);totBrn+=burnedCal(d);totSess+=(l.sessions||[]).length;});
  el.innerHTML=`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px">
    <div class="mc"><div class="v" style="font-size:16px">${logs.length}</div><div class="l">Days</div></div>
    <div class="mc"><div class="v" style="font-size:16px">${totSess}</div><div class="l">Sessions</div></div>
    <div class="mc"><div class="v" style="font-size:16px;color:var(--red)">${totBrn}</div><div class="l">Burned</div></div>
    <div class="mc"><div class="v" style="font-size:16px">${totCal}</div><div class="l">Eaten</div></div>
  </div>`;
}

function buildExpData(){return getExpLogs().map(([d,l])=>({date:d,plan:(l.sessions||[]).map(s=>s.planName||'').join(', '),duration_min:(l.sessions||[]).reduce((s,sess)=>s+Math.round((sess.duration||0)/60),0),calories_eaten:consumed(d),protein_g:Math.round(proteinG(d)),calories_burned:burnedCal(d),water_glasses:l.water||0,body_weight_kg:l.bodyWeight||'',sets:(l.sessions||[]).flatMap(sess=>Object.values(sess.setLogs||{}).flatMap(sets=>sets.filter(s=>s.done).map(s=>({ex:s.exName,kg:s.weight,reps:s.reps}))))  }));}
function dlFile(c,n,t){const b=new Blob([c],{type:t});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);}
function doCSV(){const d=buildExpData();if(!d.length){toast('No data in selected range',true);return;}const h=['Date','Plan','Duration(min)','Cal Eaten','Protein(g)','Cal Burned','Water','Weight(kg)'];dlFile([h.join(','),...d.map(r=>[r.date,`"${r.plan}"`,r.duration_min,r.calories_eaten,r.protein_g,r.calories_burned,r.water_glasses,r.body_weight_kg].join(','))].join('\n'),'fittrack_export.csv','text/csv');toast('CSV downloaded!');}
function doJSON(){const d=buildExpData();if(!d.length){toast('No data in selected range',true);return;}dlFile(JSON.stringify(d,null,2),'fittrack_export.json','application/json');toast('JSON downloaded!');}
function doShare(){const d=buildExpData();if(!d.length){toast('No data',true);return;}const t=d.slice(-7).map(r=>`📅 ${r.date}\n💪 ${r.plan||'Rest'} · ${r.duration_min}min\n🍽️ ${r.calories_eaten} kcal · 🔥 ${r.calories_burned} burned\n`).join('\n');if(navigator.share)navigator.share({title:'FitTrack Export',text:t});else{navigator.clipboard?.writeText(t);toast('Copied!');}}

// ─────────────────────────────────────
//  MODALS
// ─────────────────────────────────────
function showModal(html){$('modal-root').innerHTML=`<div class="backdrop" onclick="closeModal(event)"><div class="sheet" onclick="event.stopPropagation()">${html}</div></div>`;}
function closeModal(e){if(!e||e.target.classList.contains('backdrop'))$('modal-root').innerHTML='';}

function openPlanPicker(wd){
  showModal(`<div class="modal-head"><div class="modal-title">${wd?'Set Plan for '+WD_LABELS[wd]:"Today's Plan"}</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="pad" style="padding-top:8px"><div class="card">
    <div class="plan-row" style="cursor:pointer" onclick="${wd?`setSchPlan('${wd}',null)`:'setTodayPlan(null)'}"><div class="plan-em">😴</div><div class="plan-info"><div class="plan-name">Rest Day</div><div class="plan-sub">No workout</div></div></div>
    ${S.plans.map(p=>`<div class="plan-row" style="cursor:pointer;border-top:1px solid var(--line)" onclick="${wd?`setSchPlan('${wd}','${p.id}')`:`setTodayPlan('${p.id}')`}"><div class="plan-em">${p.emoji||'📋'}</div><div class="plan-info"><div class="plan-name">${p.name}</div><div class="plan-sub">${p.exercises.length} exercises</div></div></div>`).join('')}
  </div></div>`);}
function setTodayPlan(id){todayLog().planId=id;save();closeModal();go('home');}
function openSchPicker(wd){openPlanPicker(wd);}
function setSchPlan(wd,id){S.profile.weeklySchedule[wd]=id;save();closeModal();go('plans');}

function openExerciseEdit(id){
  const ex=id?getEx(id):null;
  showModal(`<div class="modal-head"><div class="modal-title">${ex?'Edit Exercise':'New Exercise'}</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div style="padding:16px;display:grid;gap:12px">
    <div><label class="lbl">Name</label><input id="ee-name" class="inp" value="${ex?.name||''}" placeholder="e.g. Bench Press"></div>
    <div><label class="lbl">Muscle Group</label><select id="ee-mg" class="inp">${MUSCLE_GROUPS.map(g=>`<option value="${g}" ${ex?.muscleGroup===g?'selected':''}>${g}</option>`).join('')}</select></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><label class="lbl">Default Sets</label><input id="ee-sets" type="number" class="inp inp-sm" value="${ex?.defaultSets||3}"></div>
      <div><label class="lbl">Default Reps</label><input id="ee-reps" class="inp inp-sm" value="${ex?.defaultReps||'12'}"></div>
    </div>
    <div><label class="lbl">Note</label><input id="ee-note" class="inp" value="${ex?.note||''}" placeholder="Tips or cues"></div>
    <div style="display:flex;align-items:center;gap:10px"><input type="checkbox" id="ee-cardio" ${ex?.isCardio?'checked':''} style="width:18px;height:18px"><label for="ee-cardio" style="font-size:14px">Cardio / timed exercise</label></div>
    <button class="btn btn-a" onclick="saveExercise('${id||''}')">Save Exercise</button>
    ${id?`<button class="btn btn-r" onclick="deleteExercise('${id}')">Delete Exercise</button>`:''}
  </div>`);}

function saveExercise(id){const name=$('ee-name')?.value.trim();if(!name){toast('Enter exercise name',true);return;}const ex={id:id||('ex_'+Date.now()),name,muscleGroup:$('ee-mg')?.value||'Other',defaultSets:parseInt($('ee-sets')?.value)||3,defaultReps:$('ee-reps')?.value||'12',note:$('ee-note')?.value.trim()||'',isCardio:$('ee-cardio')?.checked||false};if(id){const i=S.exercises.findIndex(e=>e.id===id);if(i>=0)S.exercises[i]=ex;}else S.exercises.push(ex);save();closeModal();go('plans');toast(name+' saved!');}
function deleteExercise(id){if(!confirm('Delete this exercise?'))return;S.exercises=S.exercises.filter(e=>e.id!==id);save();closeModal();go('plans');toast('Deleted');}
function deletePlan(id){if(!confirm('Delete this plan?'))return;S.plans=S.plans.filter(p=>p.id!==id);save();go('plans');toast('Plan deleted');}

let _pbPlan=null;
function openPlanBuilder(id){const plan=id?getPlan(id):null;_pbPlan=plan?JSON.parse(JSON.stringify(plan)):{id:'pl_'+Date.now(),name:'',emoji:'📋',exercises:[]};renderPBModal();}
function renderPBModal(){const p=_pbPlan;showModal(`
  <div class="modal-head"><div class="modal-title">${p.id&&S.plans.find(x=>x.id===p.id)?'Edit Plan':'New Plan'}</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div style="padding:16px;display:grid;gap:10px">
    <div style="display:grid;grid-template-columns:56px 1fr;gap:10px">
      <div><label class="lbl">Icon</label><input id="pb-emoji" class="inp inp-sm" value="${p.emoji}" maxlength="2"></div>
      <div><label class="lbl">Plan Name</label><input id="pb-name" class="inp" value="${p.name}" placeholder="e.g. Push Day"></div>
    </div>
    <button class="btn btn-b btn-sm" style="width:auto" onclick="openExPicker()">+ Add Exercise</button>
  </div>
  <div class="sec" style="padding:4px 16px 8px">Exercises (${p.exercises.length})</div>
  <div class="card mx">${p.exercises.length===0?`<div class="pad" style="color:var(--sub);font-size:13px">No exercises yet</div>`:
    p.exercises.map((pe,i)=>{const ex=getEx(pe.exId);return `<div class="pb-ex-row">
      <div style="flex:1"><div class="pb-ex-name">${ex?.name||'Unknown'}</div>
      <div style="display:flex;gap:6px;margin-top:5px;align-items:center">
        <input type="number" class="inp inp-sm" style="width:52px" value="${pe.sets}" min="1" onchange="pbSetSets(${i},this.value)">
        <span style="color:var(--sub);font-size:12px">×</span>
        <input class="inp inp-sm" style="width:68px" value="${pe.reps}" onchange="pbSetReps(${i},this.value)">
      </div></div>
      <div class="pb-move"><button class="pb-mv-btn" onclick="pbMove(${i},-1)" ${i===0?'disabled':''}>▲</button><button class="pb-mv-btn" onclick="pbMove(${i},1)" ${i===p.exercises.length-1?'disabled':''}>▼</button></div>
      <button class="pb-rm" onclick="pbRemove(${i})">×</button></div>`;}).join('')}
  </div>
  <div style="padding:14px 16px;display:grid;gap:8px"><button class="btn btn-a" onclick="savePBPlan()">Save Plan</button></div>`);}
function pbSetSets(i,v){if(_pbPlan)_pbPlan.exercises[i].sets=parseInt(v)||1;}
function pbSetReps(i,v){if(_pbPlan)_pbPlan.exercises[i].reps=v;}
function pbMove(i,dir){if(!_pbPlan)return;const j=i+dir;if(j<0||j>=_pbPlan.exercises.length)return;[_pbPlan.exercises[i],_pbPlan.exercises[j]]=[_pbPlan.exercises[j],_pbPlan.exercises[i]];renderPBModal();}
function pbRemove(i){if(_pbPlan){_pbPlan.exercises.splice(i,1);renderPBModal();}}
function openExPicker(){const n=$('pb-name')?.value||_pbPlan.name;const e=$('pb-emoji')?.value||_pbPlan.emoji;if(_pbPlan){_pbPlan.name=n;_pbPlan.emoji=e;}const byGroup={};S.exercises.forEach(e=>{if(!byGroup[e.muscleGroup])byGroup[e.muscleGroup]=[];byGroup[e.muscleGroup].push(e);});showModal(`<div class="modal-head"><div class="modal-title">Add Exercise</div><button class="modal-close" onclick="renderPBModal()">← Back</button></div><div style="padding:8px 16px"><input type="text" class="inp" placeholder="Search…" oninput="filterExPicker(this.value)" id="ep-search"></div><div id="ep-list">${renderExPickerList('')}</div>`);}
function renderExPickerList(q){const f=S.exercises.filter(e=>!q||e.name.toLowerCase().includes(q.toLowerCase()));const bg={};f.forEach(e=>{if(!bg[e.muscleGroup])bg[e.muscleGroup]=[];bg[e.muscleGroup].push(e);});return Object.entries(bg).map(([mg,exs])=>`<div class="sec" style="padding:10px 16px 5px">${mg}</div><div class="card mx mb8">${exs.map(ex=>`<div class="ex-lib-row" onclick="pbAddEx('${ex.id}')" style="cursor:pointer"><div style="flex:1"><div style="font-size:14px;font-weight:600">${ex.name}</div><div class="ex-lib-mg">${ex.defaultSets}×${ex.defaultReps}</div></div><span style="color:var(--accent);font-size:22px;font-weight:800">+</span></div>`).join('')}</div>`).join('');}
function filterExPicker(q){const el=$('ep-list');if(el)el.innerHTML=renderExPickerList(q);}
function pbAddEx(exId){const ex=getEx(exId);if(!ex||!_pbPlan)return;_pbPlan.exercises.push({exId,sets:ex.defaultSets,reps:ex.defaultReps,note:ex.note||''});renderPBModal();toast(ex.name+' added');}
function savePBPlan(){if(!_pbPlan)return;_pbPlan.name=$('pb-name')?.value.trim()||_pbPlan.name;_pbPlan.emoji=$('pb-emoji')?.value||'📋';if(!_pbPlan.name){toast('Enter a plan name',true);return;}if(!_pbPlan.exercises.length){toast('Add at least one exercise',true);return;}const idx=S.plans.findIndex(p=>p.id===_pbPlan.id);if(idx>=0)S.plans[idx]=_pbPlan;else S.plans.push(_pbPlan);save();_pbPlan=null;closeModal();go('plans');toast('Plan saved ✓');}

function openDayEdit(dateStr){
  const log=dayLog(dateStr);const sess=log.sessions||[];
  const cal=consumed(dateStr);const brn=burnedCal(dateStr);
  showModal(`
  <div class="modal-head"><div class="modal-title">✏️ ${fmtDate(dateStr)}</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:14px 16px;background:var(--card2);border-bottom:1px solid var(--line)">
    <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--accent)">${cal}</div><div style="font-size:10px;color:var(--sub)">kcal eaten</div></div>
    <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--red)">${brn}</div><div style="font-size:10px;color:var(--sub)">kcal burned</div></div>
    <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:${cal-brn<=0?'var(--green)':'var(--sub)'}">${cal-brn}</div><div style="font-size:10px;color:var(--sub)">net</div></div>
  </div>
  <div style="padding:14px 16px;border-bottom:1px solid var(--line)">
    <label class="lbl">Body Weight (kg)</label>
    <input id="de-bw" type="number" class="inp" style="max-width:120px" step="0.1" value="${log.bodyWeight||''}" placeholder="kg">
  </div>
  <div style="padding:12px 16px;border-bottom:1px solid var(--line)">
    <label class="lbl" style="margin-bottom:8px">Water</label>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${[1,2,3,4,5,6,7,8].map(i=>`<button class="gl ${(log.water||0)>=i?'on':''}" onclick="deWater('${dateStr}',${i})">${(log.water||0)>=i?'💧':'○'}</button>`).join('')}</div>
  </div>
  <div style="padding:12px 16px;border-bottom:1px solid var(--line)">
    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--sub);text-transform:uppercase;margin-bottom:10px">Food Log (${(log.foods||[]).length})</div>
    ${(log.foods||[]).length===0?`<div style="font-size:13px;color:var(--sub)">No food logged</div>`:
      (log.foods||[]).map((f,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--line)">
        <div style="flex:1"><div style="font-size:13px;font-weight:600">${f.name}</div><div style="font-size:11px;color:var(--sub)">${foodCal(f)} kcal · ${foodP(f)}g P · ×${f.qty||1}</div></div>
        <div class="fi-qty-wrap">
          <button class="fi-qty-btn" onclick="changeFoodQty('${dateStr}',${i},-0.5)">−</button>
          <span class="fi-qty-val">${f.qty||1}x</span>
          <button class="fi-qty-btn" onclick="changeFoodQty('${dateStr}',${i},0.5)">+</button>
        </div>
        <button style="background:none;border:none;font-size:18px;color:var(--sub);cursor:pointer" onclick="deRemoveFood('${dateStr}',${i})">×</button>
      </div>`).join('')}
    <div style="display:grid;grid-template-columns:1fr 80px auto;gap:8px;margin-top:10px">
      <input id="de-fname" class="inp" placeholder="Food name">
      <input id="de-fcal" type="number" class="inp" placeholder="kcal">
      <button class="btn btn-o btn-sm" onclick="deAddFood('${dateStr}')">Add</button>
    </div>
  </div>
  ${sess.length>0?`<div style="padding:12px 16px;border-bottom:1px solid var(--line)">
    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--sub);text-transform:uppercase;margin-bottom:10px">Sessions (${sess.length})</div>
    ${sess.map((s,si)=>`<div style="background:var(--card2);border:1px solid var(--line);border-radius:var(--r);padding:12px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-weight:700">${s.planEmoji||''} ${s.planName||'Session'}</span><span style="font-size:12px;color:var(--sub)">${fmt(s.duration||0)}</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <div><label class="lbl">Cal Burned</label><input type="number" class="inp inp-sm" value="${s.burn||0}" onchange="deBurn('${dateStr}',${si},this.value)"></div>
        <div><label class="lbl">Duration (min)</label><input type="number" class="inp inp-sm" value="${Math.round((s.duration||0)/60)}" onchange="deDur('${dateStr}',${si},this.value)"></div>
      </div>
      <button class="btn btn-b btn-sm" style="width:auto;font-size:12px" onclick="openSessionEdit('${dateStr}',${si})">✏️ Edit Sets</button>
    </div>`).join('')}</div>`:''}
  <div style="padding:14px 16px;display:grid;gap:8px">
    <button class="btn btn-a" onclick="deSave('${dateStr}')">Save Changes</button>
    <button class="btn btn-r" onclick="deDelete('${dateStr}')">🗑 Delete This Day</button>
  </div>`);}

function deWater(d,g){dayLog(d).water=g;save();openDayEdit(d);}
function deRemoveFood(d,i){dayLog(d).foods.splice(i,1);save();openDayEdit(d);}
function deAddFood(d){const n=$('de-fname')?.value.trim();const c=parseInt($('de-fcal')?.value)||0;if(!n||!c){toast('Enter name and calories',true);return;}dayLog(d).foods.push({name:n,cal:c,p:0,c:0,f:0,qty:1});save();openDayEdit(d);}
function deBurn(d,si,v){dayLog(d).sessions[si].burn=parseInt(v)||0;save();}
function deDur(d,si,v){dayLog(d).sessions[si].duration=(parseInt(v)||0)*60;save();}
function deSave(d){const bw=parseFloat($('de-bw')?.value)||null;if(bw)dayLog(d).bodyWeight=bw;save();closeModal();go('history');toast('Saved ✓');}
function deDelete(d){if(!confirm('Delete all data for '+fmtDate(d)+'?'))return;delete S.logs[d];save();closeModal();go('history');toast('Day deleted');}

function openSessionEdit(dateStr,sessIdx){
  const sess=dayLog(dateStr).sessions[sessIdx];if(!sess)return;
  showModal(`<div class="modal-head"><div class="modal-title">Edit Sets</div><button class="modal-close" onclick="openDayEdit('${dateStr}')">← Back</button></div>
  <div style="padding:12px 0">
    ${Object.entries(sess.setLogs||{}).map(([exIdx,sets])=>{const exName=sets[0]?.exName||'Exercise';return `<div style="margin:0 16px 12px">
      <div style="font-size:14px;font-weight:700;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--line)">${exName}</div>
      <div style="display:grid;grid-template-columns:24px 1fr 1fr 36px;gap:5px;margin-bottom:5px">
        <span style="font-size:9px;color:var(--sub);text-align:center">#</span><span style="font-size:9px;color:var(--sub);text-align:center">KG</span><span style="font-size:9px;color:var(--sub);text-align:center">REPS</span><span style="font-size:9px;color:var(--sub);text-align:center">✓</span>
      </div>
      ${sets.map((set,si)=>`<div class="es-set-row" style="background:${set.done?'var(--adim)':'transparent'};border-radius:6px;padding:3px 2px">
        <div style="font-size:12px;font-weight:700;color:var(--sub);text-align:center">${si+1}</div>
        <input type="number" class="inp inp-sm" step="0.5" value="${set.weight}" onchange="seEdit('${dateStr}',${sessIdx},'${exIdx}',${si},'weight',this.value)">
        <input type="number" class="inp inp-sm" value="${set.reps}" onchange="seEdit('${dateStr}',${sessIdx},'${exIdx}',${si},'reps',this.value)">
        <button class="sc${set.done?' on':''}" onclick="seToggle('${dateStr}',${sessIdx},'${exIdx}',${si})" style="width:36px;height:34px">${set.done?'✓':'○'}</button>
      </div>`).join('')}
      <button style="background:none;border:1px dashed var(--line);border-radius:7px;width:100%;padding:7px;color:var(--sub);font-size:12px;margin-top:6px;cursor:pointer" onclick="seAddSet('${dateStr}',${sessIdx},'${exIdx}','${exName}')">+ Add Set</button>
    </div>`;}).join('')}
  </div>
  <div style="padding:14px 16px"><button class="btn btn-a" onclick="openDayEdit('${dateStr}')">Done ✓</button></div>`);}
function seEdit(d,si,exIdx,setIdx,field,val){const sets=dayLog(d).sessions[si]?.setLogs?.[exIdx];if(sets&&sets[setIdx]){sets[setIdx][field]=val;save();}}
function seToggle(d,si,exIdx,setIdx){const sets=dayLog(d).sessions[si]?.setLogs?.[exIdx];if(sets&&sets[setIdx]){sets[setIdx].done=!sets[setIdx].done;save();openSessionEdit(d,si);}}
function seAddSet(d,si,exIdx,exName){const sess=dayLog(d).sessions[si];if(!sess?.setLogs)return;if(!sess.setLogs[exIdx])sess.setLogs[exIdx]=[];sess.setLogs[exIdx].push({exName,setNum:sess.setLogs[exIdx].length+1,weight:'',reps:'',done:false});save();openSessionEdit(d,si);}

function openSettings(){showModal(`
  <div class="modal-head"><div class="modal-title">⚙️ Settings</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div style="padding:16px;display:grid;gap:12px">
    <div><label class="lbl">Your Name</label><input id="s-name" class="inp" value="${S.profile.name}"></div>
    <div><label class="lbl">Body Weight (kg)</label><input id="s-bw" type="number" class="inp" step="0.1" value="${S.profile.weightKg}"></div>
    <div><label class="lbl">Daily Calorie Target</label><input id="s-cal" type="number" class="inp" value="${S.profile.targetCal}"></div>
    <div><label class="lbl">Daily Protein Target (g)</label><input id="s-pro" type="number" class="inp" value="${S.profile.targetProtein}"></div>
    <div><label class="lbl">Program Name</label><input id="s-prog" class="inp" value="${S.profile.programName}"></div>
    <div><label class="lbl">Goal Days</label><input id="s-goal" type="number" class="inp" value="${S.profile.goalDays}" min="1" max="365"></div>
    <div><label class="lbl">Program Start Date</label><input id="s-start" type="date" class="inp" value="${new Date(S.profile.startDate).toISOString().split('T')[0]}"></div>
    <div style="background:var(--card2);border:1px solid var(--line);border-radius:var(--r);padding:14px">
      <div style="font-size:13px;font-weight:700;margin-bottom:6px">🗓 Manual Day Override</div>
      <div style="font-size:12px;color:var(--sub);margin-bottom:8px">Force a specific day number. Leave blank for auto.</div>
      <input id="s-mday" type="number" class="inp" style="max-width:100px" min="1" max="${S.profile.goalDays}" placeholder="Day #" value="${S.profile.manualDay||''}">
    </div>
    <div style="display:flex;align-items:center;gap:10px"><input type="checkbox" id="s-audio" ${S.profile.audioEnabled?'checked':''} style="width:18px;height:18px"><label for="s-audio" style="font-size:14px">Rest timer audio beep</label></div>
    <button class="btn btn-a" onclick="saveSettings()">Save Settings</button>
    <button class="btn btn-r" onclick="clearAll()">🗑 Clear All Data</button>
  </div>`);}

function saveSettings(){S.profile.name=$('s-name')?.value.trim()||'Athlete';S.profile.weightKg=parseFloat($('s-bw')?.value)||100;S.profile.targetCal=parseInt($('s-cal')?.value)||2300;S.profile.targetProtein=parseInt($('s-pro')?.value)||200;S.profile.programName=$('s-prog')?.value.trim()||'My Program';S.profile.goalDays=parseInt($('s-goal')?.value)||100;const sd=$('s-start')?.value;if(sd)S.profile.startDate=new Date(sd).toDateString();const md=parseInt($('s-mday')?.value);S.profile.manualDay=(md>=1&&md<=S.profile.goalDays)?md:null;S.profile.audioEnabled=$('s-audio')?.checked??true;save();closeModal();go('home');toast('Settings saved ✓');}
function clearAll(){if(!confirm('Delete ALL data?'))return;S.logs={};save();closeModal();go('home');toast('All data cleared');}

// ── SETTINGS GEAR ─────────────────────
function addSettingsBtn(){const btn=document.createElement('button');btn.textContent='⚙️';btn.onclick=openSettings;btn.style.cssText='position:fixed;top:10px;right:10px;z-index:400;background:var(--card);border:1px solid var(--line);width:36px;height:36px;border-radius:50%;font-size:17px;display:flex;align-items:center;justify-content:center;cursor:pointer;';document.body.appendChild(btn);}

// ── INIT ──────────────────────────────
window.addEventListener('load',()=>{
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  load();migrateV3();initSeed();
  const draft=loadDraft();
  if(draft&&draft.startTs){S.session=draft;S.session.timerIv=setInterval(tickSession,1000);if(S.session.rest?.on)S.session.rest.iv=setInterval(tickRest,250);}
  addSettingsBtn();go('home');syncBars();
});
