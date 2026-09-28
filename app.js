/* ═══════════════════════════════════
   FitTrack Pro v15 — app controller
   UI orchestration kept here for backwards-compatible inline handlers.
   Pure domain/data services live under ./js/.
═══════════════════════════════════ */

const FT=window.FitTrack||{};
const {WEEKDAYS,WD_LABELS,MUSCLE_GROUPS,SEED_EXERCISES,SEED_PLANS,FOODS}=FT.modules.catalog;
const Storage=FT.storage.Storage;
const LIMITS={text:500,foodName:160,exerciseName:160,note:500,logs:4000};
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
    targetWeightKg:null, startWeightKg:null, weeklyWorkoutTarget:5, waterTarget:8,
    manualDay:null, audioEnabled:true,
    workoutPrefs:{autoRest:true,defaultRest:90,barWeightKg:20},
    weeklySchedule:{},
    wearable:{connected:false,name:'',deviceId:'',lastConnectedAt:null,lastSyncAt:null,method:'none',source:'',battery:null,heartRate:null,steps:null,avgHeartRate:null,capabilities:[]},
  },
  session:null,
  cookMeal:{name:'',ingredients:[],servings:1,myServings:1},
};

const KEY='fittrack_pro_v16', LEGACY_V15='fittrack_pro_v15', LEGACY_V14='fittrack_pro_v14', LEGACY_V13='fittrack_pro_v13', LEGACY_V12='fittrack_pro_v12', LEGACY_V11='fittrack_pro_v11', LEGACY_V10='fittrack_pro_v10', LEGACY_V9='fittrack_pro_v9', LEGACY_KEY='ft4',
  DRAFT='fittrack_pro_session_v15', LEGACY_DRAFT_V14='fittrack_pro_session_v14', LEGACY_DRAFT_V13='fittrack_pro_session_v13', LEGACY_DRAFT_V12='fittrack_pro_session_v12', LEGACY_DRAFT_V11='fittrack_pro_session_v11', LEGACY_DRAFT_V10='fittrack_pro_session_v10', LEGACY_DRAFT_V9='fittrack_pro_session_v9';
const SCHEMA_VERSION=16;

// ── CLIENT DATA LAYER ───────────────────────────────────────────
const FitTrackStorage=FT.storage;
// FitTrack Pro is a local-first PWA. Persistence is routed through the v14 adapter;
// IndexedDB is the durable shadow/recovery path while the UI remains synchronous.
function text(v,max=LIMITS.text){return String(v??'').replace(/\u0000/g,'').trim().slice(0,max)}
function finite(v,def=0){const n=Number(v);return Number.isFinite(n)?n:def}
function positive(v,def=0){const n=finite(v,def);return n>0?n:def}
function clamp(n,min,max){return Math.min(max,Math.max(min,n))}
function h(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
function jsarg(v){return h(JSON.stringify(String(v??'')));}
function safeId(v,fallback='id'){const x=String(v??'').replace(/[^A-Za-z0-9_-]/g,'_').slice(0,80);return x||fallback;}
function safeDateKey(v){const x=String(v??'');return /^\w{3} \w{3} \d{1,2} \d{4}$/.test(x)||/^\d{4}-\d{2}-\d{2}$/.test(x)?x:x.replace(/[^A-Za-z0-9 _-]/g,'_').slice(0,40);}

let _draftSaveTs=0, _midnightKey='';
let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;});

function normalizeExercise(raw,i=0){
  const e=raw&&typeof raw==='object'?raw:{};
  return {
    id:safeId(e.id,`ex_${String(i+1).padStart(3,'0')}`),
    name:text(e.name||'Exercise',LIMITS.exerciseName)||'Exercise',
    muscleGroup:MUSCLE_GROUPS.includes(e.muscleGroup)?e.muscleGroup:'Full Body',
    defaultSets:clamp(Math.round(positive(e.defaultSets,3)),1,30),
    defaultReps:text(e.defaultReps||'10–12',40),
    note:text(e.note||'',LIMITS.note),
    isCardio:!!e.isCardio,
    equipment:text(e.equipment||'',80),
    movement:text(e.movement||'',80),
    primaryMuscle:text(e.primaryMuscle||e.muscleGroup||'Full Body',80),
    secondaryMuscles:Array.isArray(e.secondaryMuscles)?e.secondaryMuscles.slice(0,8).map(x=>text(x,50)).filter(Boolean):[],
    difficulty:['Beginner','Intermediate','Advanced'].includes(e.difficulty)?e.difficulty:'Intermediate',
    exerciseType:text(e.exerciseType||(e.isCardio?'Cardio':'Strength'),40)
  };
}
function normalizePlan(raw,i=0){
  const p=raw&&typeof raw==='object'?raw:{};
  const exercises=Array.isArray(p.exercises)?p.exercises.map(pe=>({
    exId:safeId(pe?.exId,'ex_unknown'),sets:clamp(Math.round(positive(pe?.sets,3)),1,30),reps:text(pe?.reps||'10–12',40),note:text(pe?.note||'',LIMITS.note)
  })).filter(x=>x.exId):[];
  return {id:safeId(p.id,`pl_${String(i+1).padStart(3,'0')}`),name:text(p.name||'Workout Plan',160)||'Workout Plan',emoji:text(p.emoji||'💪',8)||'💪',exercises};
}
function normalizeFoodEntry(raw){
  const f=raw&&typeof raw==='object'?raw:{};
  return {name:text(f.name||'Food',LIMITS.foodName)||'Food',cal:clamp(Math.round(positive(f.cal,0)),0,20000),p:clamp(finite(f.p,0),0,500),c:clamp(finite(f.c,0),0,1000),f:clamp(finite(f.f,0),0,500),qty:clamp(finite(f.qty,1),0.1,100)};
}
function normalizeSet(raw,si=0,exName=''){
  const x=raw&&typeof raw==='object'?raw:{};
  return {exName:text(x.exName||exName,LIMITS.exerciseName)||exName||'Exercise',setNum:Math.max(1,Math.round(finite(x.setNum,si+1))),weight:x.weight===''?'':text(x.weight,20),reps:x.reps===''?'':text(x.reps,20),done:!!x.done,type:FT.modules.workoutIntelligence?.normalizeSetType(x.type),rpe:(finite(x.rpe,0)>=1&&finite(x.rpe,0)<=10)?Math.round(finite(x.rpe,0)*10)/10:null,rir:(finite(x.rir,-1)>=0&&finite(x.rir,-1)<=10)?Math.round(finite(x.rir,0)):null,note:text(x.note||'',140),_potentialPR:!!x._potentialPR};
}
function normalizeSession(raw){
  if(!raw||typeof raw!=='object'||!positive(raw.startTs,0))return null;
  const setLogs={};
  Object.entries(raw.setLogs&&typeof raw.setLogs==='object'?raw.setLogs:{}).forEach(([k,arr])=>{
    const idx=String(Math.max(0,Math.round(finite(k,0))));
    if(Array.isArray(arr))setLogs[idx]=arr.slice(0,60).map((x,i)=>normalizeSet(x,i));
  });
  return {
    planId:safeId(raw.planId,'pl_unknown'),planName:text(raw.planName||'Workout',160)||'Workout',planEmoji:text(raw.planEmoji||'💪',8)||'💪',
    startTs:finite(raw.startTs,Date.now()),setLogs,burn:clamp(Math.round(finite(raw.burn,0)),0,100000),extraExCount:clamp(Math.round(finite(raw.extraExCount,0)),0,1000),
    extraExercises:Array.isArray(raw.extraExercises)?raw.extraExercises.slice(0,100).map(x=>({...x,idx:Math.max(0,Math.round(finite(x?.idx,0))),exId:safeId(x?.exId,'ex_unknown')})):[],
    heartRateSamples:Array.isArray(raw.heartRateSamples)?raw.heartRateSamples.slice(-720).map(x=>({ts:finite(x?.ts,Date.now()),bpm:clamp(Math.round(finite(x?.bpm,0)),1,239)})).filter(x=>x.bpm>0):[],
    rpe:(finite(raw.rpe,0)>=1&&finite(raw.rpe,0)<=10)?Math.round(finite(raw.rpe,0)):null,note:text(raw.note||'',LIMITS.note),
    supersetGroups:Array.isArray(raw.supersetGroups)?raw.supersetGroups.map(g=>Array.isArray(g)?g.map(v=>Math.max(0,Math.round(finite(v,0)))).slice(0,4):[]).filter(g=>g.length>=2).slice(0,50):[],
    rest:{on:!!raw.rest?.on,startTs:finite(raw.rest?.startTs,0),target:clamp(Math.round(finite(raw.rest?.target,90)),15,1800),iv:null},
    lastHrSampleTs:finite(raw.lastHrSampleTs,0),timerIv:null
  };
}
function normalizeDayLog(raw){
  const d=raw&&typeof raw==='object'?raw:{};
  return {planId:safeId(d.planId,'pl_unknown'),foods:Array.isArray(d.foods)?d.foods.slice(0,LIMITS.logs).map(normalizeFoodEntry):[],water:clamp(Math.round(finite(d.water,0)),0,100),bodyWeight:d.bodyWeight==null?null:clamp(finite(d.bodyWeight,0),0,500),sessions:Array.isArray(d.sessions)?d.sessions.slice(0,50).map(normalizeSession).filter(Boolean):[]};
}
function normalizeState(d){
  const base=S.profile;
  const logs={};
  if(d?.logs&&typeof d.logs==='object')Object.entries(d.logs).slice(0,LIMITS.logs).forEach(([k,v])=>{logs[safeDateKey(k)]=normalizeDayLog(v);});
  return {
    exercises:(()=>{const seen=new Set();return (Array.isArray(d?.exercises)?d.exercises.slice(0,2000):[]).map((x,i)=>normalizeExercise(x,i)).filter(e=>{if(seen.has(e.id))return false;seen.add(e.id);return true;});})(),
    plans:(()=>{const seen=new Set();return (Array.isArray(d?.plans)?d.plans.slice(0,200):[]).map((x,i)=>normalizePlan(x,i)).filter(p=>{if(seen.has(p.id))return false;seen.add(p.id);return true;});})(),
    logs,
    profile:{...base,...(d?.profile||{}),name:text(d?.profile?.name||base.name,80)||'Athlete',programName:text(d?.profile?.programName||base.programName,160)||'My Program',
      weightKg:clamp(finite(d?.profile?.weightKg,base.weightKg),20,500),targetCal:clamp(Math.round(positive(d?.profile?.targetCal,base.targetCal)),500,10000),targetProtein:clamp(Math.round(positive(d?.profile?.targetProtein,base.targetProtein)),10,1000),targetCarbs:clamp(Math.round(positive(d?.profile?.targetCarbs,250)),1,1200),targetFat:clamp(Math.round(positive(d?.profile?.targetFat,70)),1,500),savedMeals:Array.isArray(d?.profile?.savedMeals)?d.profile.savedMeals.slice(0,100).map(m=>({id:text(m.id,80)||('meal_'+Math.random().toString(36).slice(2)),name:text(m.name,60)||'Saved meal',items:Array.isArray(m.items)?m.items.slice(0,100).map(x=>({name:text(x.name,120)||'Food',cal:clamp(finite(x.cal,0),0,10000),p:clamp(finite(x.p,0),0,1000),c:clamp(finite(x.c,0),0,2000),f:clamp(finite(x.f,0),0,1000),qty:clamp(finite(x.qty,1),0.1,100)})):[],createdAt:text(m.createdAt||'',50)})):[],
      goalDays:clamp(Math.round(positive(d?.profile?.goalDays,base.goalDays)),1,3650),targetWeightKg:d?.profile?.targetWeightKg==null?null:clamp(finite(d.profile.targetWeightKg,0),20,500),startWeightKg:d?.profile?.startWeightKg==null?null:clamp(finite(d.profile.startWeightKg,0),20,500),
      weeklyWorkoutTarget:clamp(Math.round(positive(d?.profile?.weeklyWorkoutTarget,base.weeklyWorkoutTarget)),1,14),waterTarget:clamp(Math.round(positive(d?.profile?.waterTarget,base.waterTarget)),1,30),manualDay:d?.profile?.manualDay?clamp(Math.round(finite(d.profile.manualDay,1)),1,3650):null,audioEnabled:d?.profile?.audioEnabled!==false,
      workoutPrefs:{autoRest:d?.profile?.workoutPrefs?.autoRest!==false,defaultRest:clamp(Math.round(finite(d?.profile?.workoutPrefs?.defaultRest,90)),15,1800),barWeightKg:clamp(finite(d?.profile?.workoutPrefs?.barWeightKg,20),5,50)},
      startDate:(typeof d?.profile?.startDate==='string'&&d.profile.startDate)?text(d.profile.startDate,80):base.startDate,
      weeklySchedule:{...base.weeklySchedule,...((d?.profile||{}).weeklySchedule||{})},
      wearable:{...base.wearable,...((d?.profile||{}).wearable||{}),name:text(d?.profile?.wearable?.name||'',120),deviceId:text(d?.profile?.wearable?.deviceId||'',160),manufacturer:text(d?.profile?.wearable?.manufacturer||'',120),model:text(d?.profile?.wearable?.model||'',120),source:text(d?.profile?.wearable?.source||'',120),method:['none','ble','health-connect'].includes(d?.profile?.wearable?.method)?d.profile.wearable.method:'none',connected:!!d?.profile?.wearable?.connected,battery:d?.profile?.wearable?.battery==null?null:clamp(Math.round(finite(d.profile.wearable.battery,0)),0,100),heartRate:d?.profile?.wearable?.heartRate==null?null:clamp(Math.round(finite(d.profile.wearable.heartRate,0)),1,239),steps:d?.profile?.wearable?.steps==null?null:Math.max(0,Math.round(finite(d.profile.wearable.steps,0))),capabilities:Array.isArray(d?.profile?.wearable?.capabilities)?d.profile.wearable.capabilities.slice(0,50).map(x=>text(x,60)):[]}
    }
  };
}
function load(){
  try{
    const rawKey=[KEY,LEGACY_V15,LEGACY_V14,LEGACY_V13,LEGACY_V12,LEGACY_V11,LEGACY_V10,LEGACY_V9,LEGACY_KEY].find(k=>Storage.get(k));
    const d=rawKey?Storage.json(rawKey,{}):{};
    const n=normalizeState(d||{});
    S.exercises=n.exercises;
    const validExIds=new Set(S.exercises.map(e=>e.id));
    S.plans=n.plans.map(p=>({...p,exercises:p.exercises.filter(pe=>validExIds.has(pe.exId))}));
    S.logs=n.logs;S.profile=n.profile;
    if(rawKey&&rawKey!==KEY)save();
  }catch(e){toast('Stored data could not be read — starting safely.');}
}
function save(){
  const payload={schemaVersion:SCHEMA_VERSION,savedAt:Date.now(),exercises:S.exercises,plans:S.plans,logs:S.logs,profile:S.profile};
  if(!Storage.set(KEY,JSON.stringify(payload))){toast('Storage is full. Export a backup before continuing.',true);return false;}
  FitTrackStorage.putSnapshot(payload).catch(()=>{});
  return true;
}
function saveDraft(force=false){
  if(!S.session){Storage.remove(DRAFT);return false;}
  const now=Date.now();if(!force&&now-_draftSaveTs<2500)return false;_draftSaveTs=now;
  const clean={...S.session,timerIv:null,rest:{...S.session.rest,iv:null},schemaVersion:SCHEMA_VERSION,savedAt:now};
  delete clean._runtime;
  return Storage.set(DRAFT,JSON.stringify(clean));
}
function loadDraft(){
  for(const k of [DRAFT,LEGACY_DRAFT_V14,LEGACY_DRAFT_V13,LEGACY_DRAFT_V12,LEGACY_DRAFT_V11,LEGACY_DRAFT_V10,LEGACY_DRAFT_V9]){
    const d=normalizeSession(Storage.json(k,null));
    if(!d)continue;
    const savedAt=finite(Storage.json(k,{})?.savedAt,0);
    if(savedAt&&Date.now()-savedAt>12*3600*1000){Storage.remove(k);continue;}
    return d;
  }
  return null;
}
function migrateV3(){try{
  const v3=Storage.json('ft3',null);if(!v3)return;
  if(v3.logs)Object.entries(v3.logs).forEach(([d,l])=>{if(!S.logs[d])S.logs[d]={foods:[],water:0,bodyWeight:null,sessions:[]};if(l.calories)S.logs[d].foods=l.calories.map(f=>normalizeFoodEntry({name:f.name,cal:f.cal,p:f.p||0,c:f.c||0,f:f.f||0,qty:1}));if(l.water)S.logs[d].water=l.water;if(l.weight)S.logs[d].bodyWeight=l.weight;if(l.sessions)S.logs[d].sessions=l.sessions.map(normalizeSession).filter(Boolean);});
  if(v3.profile){S.profile.name=text(v3.profile.name||S.profile.name,80)||S.profile.name;S.profile.weightKg=clamp(finite(v3.profile.weightKg,S.profile.weightKg),20,500);S.profile.targetCal=clamp(Math.round(positive(v3.profile.targetCal||v3.profile.targetCals,S.profile.targetCal)),500,10000);S.profile.targetProtein=clamp(Math.round(positive(v3.profile.targetProtein,S.profile.targetProtein)),10,1000);}
  Storage.remove('ft3');save();toast('Previous data imported ✓');
}catch(e){}}
function initSeed(){if(S.exercises.length)return;S.exercises=SEED_EXERCISES.map((e,i)=>{const raw={id:'ex_'+String(i+1).padStart(3,'0'),name:e.name,muscleGroup:e.mg,defaultSets:e.ds,defaultReps:e.dr,note:e.note||'',isCardio:!!e.isCardio};return normalizeExercise(FT.modules.exerciseLibrary?.enrichExercise?FT.modules.exerciseLibrary.enrichExercise(raw):raw,i);});S.plans=SEED_PLANS.map((p,i)=>({id:'pl_'+String(i+1).padStart(3,'0'),name:p.name,emoji:p.emoji,exercises:p.exNames.map(name=>{const ex=S.exercises.find(e=>e.name===name);return ex?{exId:ex.id,sets:ex.defaultSets,reps:ex.defaultReps,note:ex.note}:null;}).filter(Boolean)}));const ids=S.plans.map(p=>p.id);S.profile.weeklySchedule={mon:ids[0],tue:ids[1],wed:ids[2],thu:ids[3],fri:ids[4],sat:ids[5],sun:null};save();}

// ── HELPERS ───────────────────────────
function $(id){return document.getElementById(id);}
// Nutrition 2.0 saved meal presets (backward-compatible, local-first).
function savedMeals(){if(!Array.isArray(S.profile.savedMeals))S.profile.savedMeals=[];return S.profile.savedMeals;}
function saveCurrentMealPreset(){const name=prompt('Name this meal for quick logging:');if(!name||!name.trim())return;const items=(todayLog().foods||[]).map(f=>({name:String(f.name||'Food'),cal:Number(f.cal)||0,p:Number(f.p)||0,c:Number(f.c)||0,f:Number(f.f)||0,qty:Number(f.qty)||1}));if(!items.length){toast('Log food first to save a meal',true);return;}savedMeals().push({id:'meal_'+Date.now(),name:name.trim().slice(0,60),items,createdAt:new Date().toISOString()});save();go('food');toast('Meal preset saved');}
function logSavedMeal(id){const meal=savedMeals().find(x=>x.id===id);if(!meal)return;meal.items.forEach(x=>todayLog().foods.push({...x,qty:Number(x.qty)||1,mealPreset:meal.name}));save();go('food');toast(meal.name+' added');}
function deleteSavedMeal(id){S.profile.savedMeals=savedMeals().filter(x=>x.id!==id);save();go('food');}
function nutritionMacroTarget(key,fallback){const n=Number(S.profile[key]);return Number.isFinite(n)&&n>0?n:fallback;}
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
function localDateISO(d=new Date()){const x=new Date(d);return `${x.getFullYear()}-${z(x.getMonth()+1)}-${z(x.getDate())}`;}
function localDateFromInput(v){const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return new Date();return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),0,0,0,0);}
function refreshToday(){const k=new Date().toDateString();if(S.today!==k){S.today=k;return true;}return false;}
function calcTrainingScore(){return FT.metrics.calcTrainingScore(S.logs,S.profile);}
function focusNextSet(exIdx,setIdx){
  requestAnimationFrame(()=>{
    const sets=S.session?.setLogs?.[exIdx]||[];
    const next=sets[setIdx+1];
    const target=next && !next.done?($(`sw-${exIdx}-${setIdx+1}`)||$(`sr2-${exIdx}-${setIdx+1}`)):null;
    if(target){target.focus();try{target.select();}catch(e){}}
  });
}
function goalProgress(){return FT.metrics.goalProgress(S.logs,S.profile,dayNum());}
function latestBodyWeight(){return FT.metrics.latestBodyWeight(S.logs);}
function rangeStats(days){return FT.metrics.rangeStats(S.logs,S.profile,days);}
function streak(){let s=0;const now=new Date();for(let i=0;i<90;i++){const d=new Date(now);d.setDate(d.getDate()-i);const l=S.logs[d.toDateString()];if(l&&((l.sessions||[]).length>0||(l.foods||[]).length>0))s++;else if(i>0)break;}return s;}

function prevLoad(exName){const dates=Object.keys(S.logs).filter(d=>d!==S.today).sort((a,b)=>new Date(b)-new Date(a));for(const d of dates)for(const sess of(S.logs[d].sessions||[]))for(const sets of Object.values(sess.setLogs||{})){if(!sets.length||sets[0].exName!==exName)continue;const done=sets.filter(s=>s.done&&s.weight!=='');if(done.length){const maxW=Math.max(...done.map(s=>parseFloat(s.weight)||0));return{weight:maxW,reps:done[done.length-1].reps,date:d};}}return null;}
function calcPRs(){return FT.metrics.calcPRs(S.logs);}
function calcTotalVolume(){return FT.metrics.calcTotalVolume(S.logs);}
function sessionMaxWeight(sess){return FT.metrics.sessionMaxWeight(sess);}

// ── SESSION ───────────────────────────
function startSession(planId){
  const plan=getPlan(planId);
  if(!plan){toast('Select a plan first',true);return;}
  const setLogs=FT.modules.workout.buildSetLogs(plan,getEx);
  Object.values(setLogs).forEach(arr=>arr.forEach(s=>{s.type='working';s.rpe=null;s.rir=null;s.note='';}));
  if(S.session){clearInterval(S.session.timerIv);clearInterval(S.session.rest?.iv);}
  S.session={
    planId,planName:plan.name,planEmoji:plan.emoji||'💪',
    startTs:Date.now(),setLogs,burn:0,
    extraExCount:0,
    heartRateSamples:[],rpe:null,note:'',supersetGroups:[],
    rest:{on:false,startTs:0,target:90,iv:null},
    timerIv:null,lastHrSampleTs:0,lastTickSaveTs:0
  };
  S.session.timerIv=setInterval(tickSession,1000);
  todayLog().planId=planId;
  save();saveDraft();syncBars();go('workout');
}

function tickSession(){
  if(!S.session)return;
  const elapsed=(Date.now()-S.session.startTs)/1000;
  const el=$('sb-time');if(el)el.textContent=fmt(elapsed);
  S.session.burn=Math.round(5*(S.profile.weightKg||100)*(Date.now()-S.session.startTs)/3600000);
  const bel=$('sb-burn');if(bel)bel.textContent=S.session.burn+' kcal est.';
  saveDraft(false);
}

function sessionAvgHR(sess){const a=(sess?.heartRateSamples||[]).map(x=>Number(x.bpm)).filter(n=>n>0);return a.length?Math.round(a.reduce((s,n)=>s+n,0)/a.length):null;}
function sessionMaxHR(sess){const a=(sess?.heartRateSamples||[]).map(x=>Number(x.bpm)).filter(n=>n>0);return a.length?Math.max(...a):null;}
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
    heartRateSamples:Array.isArray(S.session.heartRateSamples)?JSON.parse(JSON.stringify(S.session.heartRateSamples)):[],
    avgHeartRate:sessionAvgHR(S.session),maxHeartRate:sessionMaxHR(S.session),
    rpe:S.session.rpe??null,note:S.session.note||'',
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
      <div class="ex-lib-row" style="cursor:pointer" onclick="addExToSession(${jsarg(ex.id)})">
        <div style="flex:1"><div style="font-size:14px;font-weight:600">${h(ex.name)}</div>
        <div class="ex-lib-mg">${ex.defaultSets}×${ex.defaultReps}${ex.isCardio?' · cardio':''}</div></div>
        <span style="color:var(--accent);font-size:22px;font-weight:800">+</span>
      </div>`).join('')}
    </div>`).join('');
}

function filterAddExWorkout(q){const el=$('aew-list');if(el)el.innerHTML=renderAddExList(q);}

function addExToSession(exId){
  if(!S.session)return;
  const ex=getEx(exId);if(!ex)return;
  const idx=Object.keys(S.session.setLogs).reduce((m,k)=>Math.max(m,parseInt(k,10)||0),-1)+1;
  const cnt=ex.isCardio?1:ex.defaultSets;
  S.session.setLogs[idx]=Array.from({length:cnt},(_,si)=>({exName:ex.name,setNum:si+1,weight:'',reps:'',done:false,type:'working',rpe:null,rir:null,note:''}));
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
    <div class="modal-title">Edit: ${h(exName)}</div>
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
    <button class="btn btn-o" onclick="toggleSuperset(${exIdx})">${supersetGroupFor(exIdx)?'↔ Unlink Superset':'↔ Link with Next Exercise'}</button>
    <button class="btn btn-o" onclick="openPlateCalculator(${exIdx})">⚖ Plate Calculator</button>
    <button class="btn btn-r" onclick="removeExFromSession(${exIdx})">🗑 Remove This Exercise</button>
    <button class="btn btn-o" onclick="closeModal()">Done</button>
  </div>`);
}

function addSetToEx(exIdx){
  if(!S.session?.setLogs[exIdx])return;
  const sets=S.session.setLogs[exIdx];
  sets.push({exName:sets[0]?.exName||'',setNum:sets.length+1,weight:'',reps:'',done:false,type:'working',rpe:null,rir:null,note:''});
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
  if(Array.isArray(S.session.extraExercises)) S.session.extraExercises=S.session.extraExercises.filter(e=>e.idx!==exIdx);
  saveDraft();closeModal();go('workout');toast('Exercise removed');
}

function workoutSessionStats(){return FT.modules.workoutIntelligence?.sessionStats(S.session)||{total:0,done:0,pct:0,volume:0,workingSets:0,avgRpe:null,potentialPRs:0};}
function previousMaxWeight(exName){let max=0;Object.values(S.logs||{}).forEach(log=>(log.sessions||[]).forEach(sess=>Object.values(sess.setLogs||{}).forEach(arr=>arr.forEach(s=>{if(s.done&&s.exName===exName)max=Math.max(max,Number(s.weight)||0);})))) ;return max;}
function isSetPotentialPR(set){return !!(set?.weight&&set?.done&&(Number(set.weight)||0)>previousMaxWeight(set.exName||''));}
function supersetGroupFor(exIdx){return (S.session?.supersetGroups||[]).find(g=>g.includes(Number(exIdx)))||null;}
function supersetLabel(exIdx){const g=supersetGroupFor(exIdx);if(!g)return '';const letter=String.fromCharCode(65+((S.session.supersetGroups||[]).indexOf(g)%26));return `SS ${letter} · ${g.indexOf(Number(exIdx))===1?'B':'A'}`;}
function setMeta(exIdx,setIdx,field,val){const set=S.session?.setLogs?.[exIdx]?.[setIdx];if(!set)return;if(field==='type')set.type=FT.modules.workoutIntelligence.normalizeSetType(val);else if(field==='rpe'){const n=parseFloat(val);set.rpe=Number.isFinite(n)?clamp(n,1,10):null;}else if(field==='rir'){const n=parseInt(val);set.rir=Number.isFinite(n)?clamp(n,0,10):null;}else if(field==='note')set.note=text(val,140);saveDraft();updateWorkoutHUD();}
function toggleSuperset(exIdx){if(!S.session)return;const n=Number(exIdx),groups=S.session.supersetGroups||[],existing=groups.findIndex(g=>g.includes(n));if(existing>=0){groups.splice(existing,1);saveDraft();go('workout');toast('Superset link removed');return;}const next=FT.modules.workoutIntelligence.nextExerciseIndex(S.session.setLogs,n);if(next==null){toast('Keep a following exercise to make a superset.',true);return;}if(groups.some(g=>g.includes(next))){toast('Next exercise is already grouped.',true);return;}groups.push([n,next]);S.session.supersetGroups=groups;saveDraft();go('workout');toast('Superset linked ✓');}
function openPlateCalculator(exIdx){const sets=S.session?.setLogs?.[exIdx]||[],active=sets.find(s=>!s.done)||sets[0]||{},target=Number(active.weight)||Number(prevLoad(active.exName||'')?.weight)||40,bar=Number(S.profile.workoutPrefs?.barWeightKg)||20;const render=()=>{const w=Number($('pc-weight')?.value)||0,b=Number($('pc-bar')?.value)||20,out=FT.modules.workoutIntelligence.plateBreakdown(w,b);const el=$('pc-out');if(el)el.innerHTML=out.possible?`<div class="pc-total">${out.target} kg</div><div class="pc-sub">${out.bar} kg bar · ${out.side} kg per side</div><div class="pc-list">${out.pairs.length?out.pairs.map(p=>`<span>${p.count} × ${p.plate} kg / side</span>`).join(''):'<span>No plates needed</span>'}</div>`:`<div class="pc-total">Not exact</div><div class="pc-sub">Closest load differs by ${out.delta} kg total</div><div class="pc-list">${out.pairs.map(p=>`<span>${p.count} × ${p.plate} kg / side</span>`).join('')||'<span>Bar only</span>'}</div>`;};showModal(`<div class="modal-head"><div class="modal-title">⚖ Plate Calculator</div><button class="modal-close" onclick="closeModal()">×</button></div><div class="plate-calc"><div class="plate-grid"><div><label class="lbl">Target total (kg)</label><input id="pc-weight" type="number" class="inp" step="0.5" value="${target}"></div><div><label class="lbl">Bar (kg)</label><input id="pc-bar" type="number" class="inp" step="0.5" value="${bar}"></div></div><div id="pc-out" class="pc-output"></div><button class="btn btn-a" onclick="closeModal()">Done</button><div class="pc-note">Assumes 25 / 20 / 15 / 10 / 5 / 2.5 / 1.25 kg plates. Adjust the bar to match your gym.</div></div>`);$('pc-weight')?.addEventListener('input',render);$('pc-bar')?.addEventListener('input',render);render();}
function adjustRest(delta){if(!S.session?.rest?.on)return;const elapsed=(Date.now()-S.session.rest.startTs)/1000,remaining=Math.max(0,S.session.rest.target-elapsed),next=Math.max(0,remaining+delta);if(next<=0){skipRest();return;}clearInterval(S.session.rest.iv);S.session.rest={on:true,startTs:Date.now(),target:Math.round(next),iv:null};S.session.rest.iv=setInterval(tickRest,250);saveDraft();syncBars();}

// ── REST TIMER ─────────────────────────
function startRest(secs){
  if(!S.session||!(Number(secs)>0))return;
  clearInterval(S.session.rest?.iv);
  S.session.rest={on:true,startTs:Date.now(),target:clamp(Math.round(secs),15,1800),iv:setInterval(tickRest,250)};
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
  const C2=2*Math.PI*132, ring2=$('rov-ring');
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
  if(!S.session)return;const set=S.session.setLogs[exIdx]?.[setIdx];if(!set)return;
  set.done=!set.done;set._potentialPR=set.done&&isSetPotentialPR(set);saveDraft();
  const row=$(`sr-${exIdx}-${setIdx}`);if(row)row.classList.toggle('done',set.done);
  const btn=$(`sc-${exIdx}-${setIdx}`);if(btn){btn.textContent=set.done?'✓':'○';btn.classList.toggle('on',set.done);}
  const wi=$(`sw-${exIdx}-${setIdx}`),ri=$(`sr2-${exIdx}-${setIdx}`);if(wi)wi.readOnly=set.done;if(ri)ri.readOnly=set.done;
  const pr=$(`spr-${exIdx}-${setIdx}`);if(pr)pr.style.display=set._potentialPR?'inline-flex':'none';
  const allDone=S.session.setLogs[exIdx].every(s=>s.done),card=$(`ec-${exIdx}`),badge=$(`eb-${exIdx}`);if(card)card.classList.toggle('done',allDone);if(badge)badge.style.display=allDone?'':'none';
  updateWorkoutHUD();
  if(set.done&&S.profile.workoutPrefs?.autoRest!==false){const secs=FT.modules.workoutIntelligence.restForSet(set,S.profile.workoutPrefs);if(secs)startRest(secs);focusNextSet(exIdx,setIdx);}
}

function setVal(exIdx,setIdx,field,val){if(!S.session)return;const set=S.session.setLogs[exIdx]?.[setIdx];if(set){set[field]=val;saveDraft();updateWorkoutHUD();}}

function updateWorkoutHUD(){const el=$('workout-live-hud');if(!el||!S.session)return;const st=workoutSessionStats();el.querySelector('[data-hud="progress"]')?.replaceChildren(document.createTextNode(`${st.done}/${st.total}`));el.querySelector('[data-hud="volume"]')?.replaceChildren(document.createTextNode(`${st.volume.toLocaleString()} kg`));el.querySelector('[data-hud="prs"]')?.replaceChildren(document.createTextNode(String(st.potentialPRs)));el.querySelector('[data-hud="rpe"]')?.replaceChildren(document.createTextNode(st.avgRpe==null?'—':st.avgRpe));}
function syncBars(){
  const sb=$('session-bar'),rb=$('rest-bar'),sc=$('scroll');
  if(!sb||!rb||!sc)return;
  const sessOn=!!S.session,restOn=!!(S.session?.rest?.on);
  sb.classList.toggle('on',sessOn);rb.classList.toggle('on',restOn);
  document.body.classList.toggle('session-active',sessOn);
  document.body.classList.toggle('rest-active',restOn);
  const rt=$('rb-title');if(rt&&S.session)rt.textContent=S.session.planName||'Rest Timer';
  if(!restOn){const o=$('rest-overlay');if(o)o.classList.remove('on');}
}

window.addEventListener('pagehide',()=>{saveDraft(true);});
window.addEventListener('beforeunload',()=>{saveDraft(true);});

document.addEventListener('visibilitychange',()=>{
  if(!document.hidden){if(refreshToday())go(S.page||'home');}
  if(!document.hidden&&S.session){
    const el=$('sb-time');if(el)el.textContent=fmt((Date.now()-S.session.startTs)/1000);
    S.session.burn=Math.round(5*(S.profile.weightKg||100)*(Date.now()-S.session.startTs)/3600000);
    const bel=$('sb-burn');if(bel)bel.textContent=S.session.burn+' kcal';
    if(S.session.rest?.on){const rem=S.session.rest.target-(Date.now()-S.session.rest.startTs)/1000;if(rem<=0){clearInterval(S.session.rest.iv);S.session.rest.on=false;if(navigator.vibrate)navigator.vibrate([400,100,400]);toast('Rest over — GO! 💪');syncBars();}}
  }
  if(document.hidden)saveDraft(true);
});

// ── NAVIGATION ─────────────────────────
function go(page){
  refreshToday();
  const allowed=new Set(['home','workout','food','dashboard','history','plans']);
  if(!allowed.has(page))page='home';
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
        <div style="font-size:12px;color:var(--sub);margin-top:2px">${h(draft.planName||'')}</div></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-o btn-sm" onclick="discardDraft()">Discard</button>
        <button class="btn btn-a btn-sm" onclick="resumeDraft()">Resume</button>
      </div>
    </div>`:'';
  return `
  ${draftBanner}
  <div class="hero">
    <div class="hero-day">${dateStr} · ${h(S.profile.programName)}</div>
    <div class="hero-title">Day <span style="color:var(--accent)">${dn}</span> <span style="font-size:16px;color:var(--sub);font-weight:500">/ ${goal}</span></div>
    <div class="hero-sub">${plan?h(plan.emoji)+' '+h(plan.name):'No plan selected'}</div>
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
  <div class="goal-strip card mx mb12">
    <div class="goal-strip-head"><div><div class="goal-kicker">GOAL PROGRESS</div><div class="goal-title">${S.profile.targetWeightKg?`Target ${S.profile.targetWeightKg} kg`:'Set your target weight'}</div></div><button class="btn btn-o btn-sm" onclick="openSettings()">${S.profile.targetWeightKg?'Edit':'Set goal'}</button></div>
    ${S.profile.targetWeightKg&&goalProgress().weightPct!==null?`<div class="goal-bar"><div style="width:${goalProgress().weightPct}%"></div></div><div class="goal-meta"><span>${goalProgress().current||'—'} kg current</span><span>${goalProgress().weightPct}% of target path</span></div>`:`<div class="goal-empty">Add a target weight and weekly workout target to make your dashboard personal.</div>`}
  </div>
  <div class="quick-grid mx">
    <button class="quick-card" onclick="go('workout')"><span>💪</span><strong>${(log.sessions||[]).length?'Continue training':'Start training'}</strong><small>${(log.sessions||[]).length?log.sessions.length+' session today':'Your scheduled plan is ready'}</small></button>
    <button class="quick-card" onclick="go('food')"><span>🍽️</span><strong>Log nutrition</strong><small>${cal} kcal · ${pro}g protein</small></button>
    <button class="quick-card" onclick="$('bw-inp')?.focus()"><span>⚖️</span><strong>Log weight</strong><small>${log.bodyWeight?log.bodyWeight+' kg today':'No weight logged'}</small></button>
    <button class="quick-card" onclick="logWater(Math.min((log.water||0)+1,S.profile.waterTarget||8))"><span>💧</span><strong>Add water</strong><small>${log.water||0}/${S.profile.waterTarget||8} glasses</small></button>
  </div>
  <div class="wear-home-wrap">
    ${wearableHomeCard()}
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
    ${Array.from({length:S.profile.waterTarget||8},(_,k)=>k+1).map(i=>`<button class="gl ${(log.water||0)>=i?'on':''}" onclick="logWater(${i})">${(log.water||0)>=i?'💧':'○'}</button>`).join('')}
    <span style="font-size:12px;color:var(--sub);margin-left:4px">${log.water||0}/${S.profile.waterTarget||8} glasses</span>
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
    ${[1,2,3,4].map(i=>{const d2=dn+i;if(d2>goal)return '';const wd=WEEKDAYS[(new Date().getDay()+i)%7];const pid=S.profile.weeklySchedule[wd];const pl=getPlan(pid);return `<div class="upcoming-row"><span style="font-size:11px;color:var(--sub);min-width:44px">Day ${d2}</span><span style="font-size:22px">${pl?.emoji||'📋'}</span><div style="flex:1"><div style="font-size:14px;font-weight:600">${h(pl?.name||'—')}</div><div style="font-size:11px;color:var(--sub)">${WD_LABELS[wd]}</div></div></div>`;}).join('')}
  </div>`;
}
function logWater(g){todayLog().water=g;save();go('home');}
function discardDraft(){[DRAFT,LEGACY_DRAFT_V14,LEGACY_DRAFT_V13,LEGACY_DRAFT_V12,LEGACY_DRAFT_V11,LEGACY_DRAFT_V10,LEGACY_DRAFT_V9].forEach(k=>Storage.remove(k));go('home');}
function resumeDraft(){const d=loadDraft();if(!d)return;S.session=d;S.session.timerIv=setInterval(tickSession,1000);if(S.session.rest?.on)S.session.rest.iv=setInterval(tickRest,250);syncBars();go('workout');}
function setSessionMeta(field,val){if(!S.session)return;if(field==='rpe'){const n=parseInt(val);S.session.rpe=Number.isFinite(n)?Math.max(1,Math.min(10,n)):null;}else if(field==='note'){S.session.note=String(val||'').slice(0,500);}saveDraft(true);}
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
      <div style="font-size:20px;font-weight:800;margin-bottom:4px">${h(plan.name)}</div>
      <div style="font-size:13px;color:var(--sub);margin-bottom:16px">${plan.exercises.length} exercises</div>
      <div style="display:flex;gap:8px"><button class="btn btn-a" style="flex:1" onclick="startSession('${plan.id}')">⏱ Start Session</button>
      <button class="btn btn-o btn-sm" onclick="openPlanPicker()">Change</button></div></div>
    <div class="sec">Preview</div>
    <div class="card mx">${plan.exercises.map((pe,i)=>{const ex=getEx(pe.exId);return `<div style="display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--line)${i===plan.exercises.length-1?';border-bottom:none':''}"><span style="font-size:22px;font-weight:800;color:var(--faint);min-width:26px">${i+1}</span><div style="flex:1"><div style="font-size:14px;font-weight:600">${h(ex?.name||'Unknown')}</div><div style="font-size:12px;color:var(--accent);margin-top:2px">${pe.sets}×${pe.reps}</div></div>${ex?.isCardio?'<span class="pill pb">cardio</span>':''}</div>`;}).join('')}</div>`
    :`<div style="padding:40px 16px;text-align:center"><div style="font-size:13px;color:var(--sub);margin-bottom:16px">No plan selected</div><button class="btn btn-a" style="max-width:240px;margin:0 auto" onclick="openPlanPicker()">Select a Plan</button></div>`}`;
  }
  const plan=getPlan(S.session.planId);
  const fl=Object.values(S.session.setLogs).flat();
  const done=fl.filter(s=>s.done).length,total=fl.length;
  const pct=total?Math.round((done/total)*100):0;
  const pb=$('sb-prog');if(pb)pb.style.width=pct+'%';
  const pl=$('sb-prog-lbl');if(pl)pl.textContent=`${done}/${total} sets · ${pct}%`;

  // Build exercise list: plan exercises + any extras
  const planExItems=(plan?.exercises||[]).map((pe,i)=>({planExIdx:i,pe,ex:getEx(pe.exId),isExtra:false}));
  const extraItems=(S.session.extraExercises||[]).map(e=>({planExIdx:e.idx,pe:{sets:e.sets,reps:e.reps,note:e.note||''},ex:getEx(e.exId),isExtra:true}));
  const allItems=[...planExItems,...extraItems];

  return `<div style="padding:12px 0 0"><div class="workout-live-hud" id="workout-live-hud"><div><span>SETS</span><b data-hud="progress">${done}/${total}</b></div><div><span>VOLUME</span><b data-hud="volume">${FT.modules.workoutIntelligence.sessionStats(S.session).volume.toLocaleString()} kg</b></div><div><span>PR</span><b data-hud="prs">${FT.modules.workoutIntelligence.sessionStats(S.session).potentialPRs}</b></div><div><span>AVG RPE</span><b data-hud="rpe">${FT.modules.workoutIntelligence.sessionStats(S.session).avgRpe??'—'}</b></div></div>
  ${allItems.map(({planExIdx,pe,ex,isExtra})=>renderExCard(ex,pe,planExIdx,isExtra)).join('')}
  <div class="session-meta-card card mx mb12">
    <div class="session-meta-head"><div><div class="goal-kicker">SESSION CHECK-OUT</div><div class="goal-title">How did this workout feel?</div></div><div class="live-hr-chip">${S.profile.wearable?.connected&&S.profile.wearable?.heartRate?`♥ ${S.profile.wearable.heartRate} bpm`:'HR —'}</div></div>
    <label class="lbl">RPE · 1 easy — 10 maximal</label>
    <div class="rpe-row">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button class="rpe-btn ${(S.session.rpe===n)?'on':''}" onclick="setSessionMeta('rpe',${n});go('workout')" aria-label="RPE ${n}">${n}</button>`).join('')}</div>
    <label class="lbl session-note-label">Session note</label><textarea class="inp session-note" maxlength="500" placeholder="Technique, pain-free notes, energy, equipment…" oninput="setSessionMeta('note',this.value)">${h(S.session.note||'')}</textarea>
  </div>
  <div style="padding:0 16px 10px;display:grid;gap:8px">
    <button class="btn btn-b" onclick="openAddExWorkout()">➕ Add Exercise to Session</button>
    <button class="btn btn-r" onclick="confirmFinish()">🏁 Finish Workout</button>
  </div></div>`;
}

function renderExCard(ex,pe,i,isExtra){const sets=S.session?S.session.setLogs[i]||[]:[],allDone=sets.length>0&&sets.every(s=>s.done),prev=prevLoad(ex?.name||''),suggestion=FT.modules.workoutIntelligence.progression(prev,pe.reps,S.session?.rpe),ss=supersetLabel(i),typeOptions=Object.entries(FT.modules.workoutIntelligence.SET_TYPES).map(([k,v])=>`<option value="${k}" ${k===(sets[0]?.type||'working')?'selected':''}>${v.label}</option>`).join('');return `<div class="ex-card${allDone?' done':''}${ss?' superset-card':''}" id="ec-${i}">
  <div class="ex-head"><div class="ex-num">${i+1}</div><div class="ex-meta"><div class="ex-name">${h(ex?.name||'Exercise')} ${isExtra?'<span class="pill po" style="font-size:9px;margin-left:4px">Added</span>':''} ${ss?`<span class="superset-badge">${ss}</span>`:''}</div><div class="ex-scheme">${pe.sets}×${pe.reps}</div></div><div style="display:flex;gap:5px;align-items:center"><button class="icon-btn workout-tool-btn" onclick="openPlateCalculator(${i})" aria-label="Plate calculator">⚖</button><span class="pill pa" id="eb-${i}" style="display:${allDone?'':'none'}">✓</span><button class="icon-btn" style="font-size:13px" onclick="editExDuringWorkout(${i})" aria-label="Edit exercise">⋮</button></div></div>
  ${pe.note?`<div class="ex-note">${h(pe.note)}</div>`:''}
  <div class="ex-progress-row"><div class="ex-prev ${prev?'':'none'}">${prev?`📊 Last: <strong>${prev.weight}kg × ${prev.reps}</strong> · ${fmtDate(prev.date)}`:'📊 No previous data yet'}</div><span class="progression-pill ${suggestion?.kind||'baseline'}">${h(suggestion?.label||'Build baseline')}</span></div>
  ${ex?.isCardio?`<div class="cardio-row"><span style="font-size:13px;color:var(--sub)">🏃 Timed — mark done when complete</span><button class="sc ${sets[0]?.done?'on':''}" id="sc-${i}-0" onclick="completeSet(${i},0)" style="width:auto;padding:0 14px;font-size:13px">${sets[0]?.done?'✓ Done':'Mark Done'}</button></div>`:`<div class="set-tbl"><div class="set-head"><span>#</span><span>Weight (kg)</span><span>Reps</span><span>✓</span></div>${sets.map((set,si)=>`<div class="set-row-wrap"><div class="set-row${set.done?' done':''}" id="sr-${i}-${si}"><div class="sn">${si+1}</div><input id="sw-${i}-${si}" type="number" class="si" step="0.5" inputmode="decimal" placeholder="${prev?prev.weight:'—'}" value="${h(set.weight)}" oninput="setVal(${i},${si},'weight',this.value)" ${set.done?'readonly':''}><input id="sr2-${i}-${si}" type="number" class="si" inputmode="numeric" placeholder="${String(pe.reps).split('–')[0]}" value="${h(set.reps)}" oninput="setVal(${i},${si},'reps',this.value)" ${set.done?'readonly':''}><button class="sc${set.done?' on':''}" id="sc-${i}-${si}" onclick="completeSet(${i},${si})">${set.done?'✓':'○'}</button></div><div class="set-detail-row"><select class="set-detail-control" aria-label="Set type" onchange="setMeta(${i},${si},'type',this.value)">${Object.entries(FT.modules.workoutIntelligence.SET_TYPES).map(([k,v])=>`<option value="${k}" ${k===(set.type||'working')?'selected':''}>${v.label}</option>`).join('')}</select><input class="set-detail-control" type="number" min="1" max="10" step="0.5" placeholder="RPE" value="${set.rpe??''}" onchange="setMeta(${i},${si},'rpe',this.value)" aria-label="RPE"><input class="set-detail-control" type="number" min="0" max="10" step="1" placeholder="RIR" value="${set.rir??''}" onchange="setMeta(${i},${si},'rir',this.value)" aria-label="RIR"><span class="set-pr-badge" id="spr-${i}-${si}" style="display:${set._potentialPR?'inline-flex':'none'}">PR</span></div></div>`).join('')}</div>`}
  </div>`;}

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
    <div class="sum-plan">${sessData.planEmoji||'💪'} ${h(sessData.planName)}</div>
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
        <div class="sum-card-label">kcal Burned · est.</div>
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
        <div><div style="font-size:22px;font-weight:800;color:var(--red)">${sessData.avgHeartRate||'—'}</div><div style="font-size:11px;color:var(--sub)">Average bpm</div></div>
        <div><div style="font-size:22px;font-weight:800;color:var(--red)">${sessData.maxHeartRate||'—'}</div><div style="font-size:11px;color:var(--sub)">Max bpm</div></div>
      </div>
      <div style="font-size:11px;color:var(--sub);margin-top:8px">${sessData.avgHeartRate?'Captured from the active wearable connection.':'No heart-rate samples were captured during this session.'}</div>
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
  ctx.fillStyle='#f0f0f0';ctx.fillText((d.planEmoji||'💪')+' '+(d.planName||'Workout'),80,230);
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
  // HR section — show captured session data when available; never fabricate.
  const hry=statsY+ch*2+320;
  ctx.fillStyle='rgba(255,79,79,.08)';roundRect(ctx,80,hry,W-160,160,24);ctx.fill();
  ctx.strokeStyle='rgba(255,79,79,.25)';ctx.lineWidth=2;roundRect(ctx,80,hry,W-160,160,24);ctx.stroke();
  ctx.font='700 34px -apple-system,sans-serif';ctx.fillStyle='#ff4f4f';
  if(d.avgHeartRate){
    ctx.fillText('❤️ HEART RATE',112,hry+56);
    ctx.font='900 58px -apple-system,sans-serif';
    ctx.fillText(`${d.avgHeartRate} avg · ${d.maxHeartRate||d.avgHeartRate} max bpm`,112,hry+125);
  }else{
    ctx.fillText('❤️ HEART RATE',112,hry+58);
    ctx.font='400 32px -apple-system,sans-serif';ctx.fillStyle='#7a7a8a';
    ctx.fillText('No samples captured in this session',112,hry+115);
  }
  // Footer
  ctx.font='600 42px -apple-system,sans-serif';ctx.fillStyle='#333';
  ctx.fillText('fittrackpro.app',80,H-60);
  ctx.font='700 42px -apple-system,sans-serif';ctx.fillStyle='#c9ff3e';
  const fw=ctx.measureText('fittrackpro.app').width;
  ctx.fillText('#FitTrackPro',80+fw+40,H-60);
  // Download
  const url=canvas.toDataURL('image/png');
  const a=document.createElement('a');a.href=url;
  a.download=`fittrack_${d.planName.replace(/\s+/g,'_')}_${localDateISO()}.png`;
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

  <div class="card mx" style="padding:14px;margin-top:14px">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><strong style="font-size:14px">Macro targets</strong><button class="btn btn-o btn-sm" onclick="editMacroTargets()">Edit targets</button></div>
    ${[['Protein',pro,nutritionMacroTarget('targetProtein',S.profile.targetProtein||150),'var(--blue)'],['Carbs',carbs,nutritionMacroTarget('targetCarbs',250),'var(--accent)'],['Fat',fats,nutritionMacroTarget('targetFat',70),'var(--orange)']].map(([label,val,target,color])=>`<div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px"><span>${label}</span><b>${val} / ${target} g</b></div><div style="height:7px;background:var(--faint);border-radius:9px;overflow:hidden"><div style="width:${Math.min(100,val/Math.max(1,target)*100)}%;height:100%;background:${color};border-radius:9px"></div></div></div>`).join('')}
  </div>
  <div class="sec">Saved meals <button class="btn btn-o btn-sm" onclick="saveCurrentMealPreset()">Save today's food as meal</button></div>
  <div class="card mx" style="padding:12px">
    ${savedMeals().length?savedMeals().map(m=>{const t=(m.items||[]).reduce((o,x)=>{const q=Number(x.qty)||1;o.cal+=(Number(x.cal)||0)*q;o.p+=(Number(x.p)||0)*q;return o;},{cal:0,p:0});return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)"><div style="flex:1;min-width:0"><b style="font-size:13px">${h(m.name)}</b><div style="font-size:11px;color:var(--sub)">${Math.round(t.cal)} kcal · ${Math.round(t.p)}g protein</div></div><button class="btn btn-g btn-sm" onclick="logSavedMeal('${m.id}')">Add</button><button class="btn btn-o btn-sm" onclick="deleteSavedMeal('${m.id}')" aria-label="Delete meal">×</button></div>`}).join(''):'<div style="font-size:12px;color:var(--sub)">Save frequently eaten combinations for one-tap logging.</div>'}
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
          <div class="fi-nm">${h(f.name)}</div>
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
    ?hits.map(f=>`<div class="food-res" onclick="addFoodItem('${f.name.replace(/'/g,"\\'")}',${f.cal},${f.p},${f.c},${f.f})"><span style="font-size:14px">${h(f.name)}</span><span style="font-size:13px;font-weight:700;color:var(--accent)">${f.cal} kcal</span></div>`).join('')
    :`<div style="font-size:13px;color:var(--sub);padding:8px 0">No matches — use custom below</div>`;
}
function addFoodItem(name,cal,p,c,f){
  todayLog().foods.push({name,cal,p,c,f,qty:1});save();
  const s=$('food-search');if(s)s.value='';
  const r=$('food-results');if(r)r.innerHTML='';
  go('food');toast(name+' added!');
}
function editMacroTargets(){const p=Number(prompt('Daily protein target (g)',nutritionMacroTarget('targetProtein',150)));if(!Number.isFinite(p)||p<=0||p>600){toast('Enter a target from 1 to 600g',true);return;}const c=Number(prompt('Daily carbohydrate target (g)',nutritionMacroTarget('targetCarbs',250)));if(!Number.isFinite(c)||c<=0||c>1200){toast('Enter a target from 1 to 1200g',true);return;}const f=Number(prompt('Daily fat target (g)',nutritionMacroTarget('targetFat',70)));if(!Number.isFinite(f)||f<=0||f>500){toast('Enter a target from 1 to 500g',true);return;}S.profile.targetProtein=p;S.profile.targetCarbs=c;S.profile.targetFat=f;save();go('food');toast('Macro targets updated');}
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
      <input id="cm-name" class="inp" placeholder="e.g. Chicken Dal Bhat" value="${h(_cm.name)}"
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
          <div style="font-size:14px;font-weight:600">${h(ing.name)}</div>
          <div style="font-size:11px;color:var(--sub)">${ing.qty}g · ${Math.round(ing.cal*ing.qty/100)} kcal</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <input type="number" class="inp inp-sm" style="width:72px" value="${h(ing.qty)}"
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
  return `<div style="padding:0 16px">${hits.map(f=>`<div class="food-res" onclick="addCmIng('${f.name.replace(/'/g,"\\'")}',${f.cal},${f.p||0},${f.c||0},${f.f||0})"><span style="font-size:14px">${h(f.name)}</span><span style="font-size:12px;color:var(--sub)">${f.cal}/100g</span></div>`).join('')}</div>`;
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
  const w=S.profile.wearable||{};
  const totalSess=Object.values(S.logs).reduce((s,l)=>s+(l.sessions||[]).length,0);
  const totalBurn=Object.values(S.logs).reduce((s,l)=>s+(l.sessions||[]).reduce((v,se)=>v+(se.burn||0),0),0);
  const totalVol=calcTotalVolume();
  const prs=calcPRs();
  const prList=Object.entries(prs).sort((a,b)=>b[1].weight-a[1].weight).slice(0,8);
  const score=calcTrainingScore();
  const weeks=[];const now=new Date();
  for(let w=7;w>=0;w--){let vol=0,lbl='';for(let d=0;d<7;d++){const dt=new Date(now);dt.setDate(dt.getDate()-(w*7+d));const k=dt.toDateString();if(d===0)lbl=dt.toLocaleDateString('en-IN',{day:'numeric',month:'short'});const l=S.logs[k];if(l)(l.sessions||[]).forEach(sess=>Object.values(sess.setLogs||{}).forEach(sets=>sets.forEach(s=>{if(s.done&&s.weight&&s.reps)vol+=(parseFloat(s.weight)||0)*(parseInt(s.reps)||0);})));}weeks.push({vol,lbl});}
  const maxVol=Math.max(...weeks.map(x=>x.vol),1);
  const weightLogs=Object.entries(S.logs).filter(([,l])=>Number.isFinite(parseFloat(l.bodyWeight))).sort(([a],[b])=>new Date(a)-new Date(b));
  const latestWeight=weightLogs.at(-1)?.[1]?.bodyWeight||null;
  const firstWeight=weightLogs[0]?.[1]?.bodyWeight||null;
  const weightDelta=(latestWeight!=null&&firstWeight!=null&&weightLogs.length>1)?Math.round((latestWeight-firstWeight)*10)/10:null;
  const cells=[];for(let w=11;w>=0;w--)for(let d=6;d>=0;d--){const dt=new Date(now);dt.setDate(dt.getDate()-(w*7+d));const k=dt.toDateString();const l=S.logs[k];cells.push({k,hasSess:l&&(l.sessions||[]).length>0,hasFood:l&&(l.foods||[]).length>0});}
  const bwData=weightLogs.slice(-20);
  const r7=rangeStats(7);
  return `
  <div class="pg-title">Dashboard</div>
  <div class="pg-sub">Performance, consistency and training load</div>
  <div class="scorecard-wrap">
    <section class="scorecard" aria-label="Training score">
      <div class="scorecard-head">
        <div><div class="scorecard-kicker">7-DAY TRAINING SCORE</div><div class="scorecard-title">Consistency snapshot</div></div>
        <div class="scorecard-score">${score}<span style="font-size:16px;color:var(--sub);font-weight:700">/100</span></div>
      </div>
      <div class="scorecard-bar"><i style="width:${score}%"></i></div>
      <div class="scorecard-meta"><span>${r7.sessions}/${Math.max(1,S.profile.weeklyWorkoutTarget||5)} workouts</span><span>${r7.proteinDays}/7 protein days · ${r7.waterDays}/7 water goals</span></div>
      <div class="scorecard-note">A product metric based only on your recent logged workouts, protein days and water goals. It is not a medical readiness score.</div>
    </section>
  </div>
  <div class="dashboard-stack">
    <section class="dashboard-block">
      <div class="sec">Wearable & Health</div>
      ${wearableDashboardCard()}
    </section>
    <section class="dashboard-block">
      <div class="sec">Overview</div>
      <div class="metric-grid-3">
        <div class="metric-tile"><b>${totalSess}</b><span>Sessions</span></div>
        <div class="metric-tile"><b>${streak()}</b><span>Streak</span></div>
        <div class="metric-tile"><b>${prList.length}</b><span>PRs</span></div>
        <div class="metric-tile"><b>${(totalVol/1000).toFixed(1)}t</b><span>Total volume</span></div>
        <div class="metric-tile"><b>${totalBurn}</b><span>Est. kcal</span></div>
        <div class="metric-tile"><b>${dayNum()}</b><span>Day / ${S.profile.goalDays}</span></div>
        ${latestWeight!=null?`<div class="metric-tile"><b>${latestWeight}</b><span>Weight kg${weightDelta!==null?` · ${weightDelta>0?'+':''}${weightDelta}`:''}</span></div>`:''}
      </div>
    </section>
    <section class="dashboard-block">
      <div class="sec">Goal Progress</div>
      <div class="goal-dashboard card">
        <div><div class="goal-kicker">${h(S.profile.programName)}</div><div class="goal-title">Day ${dayNum()} of ${S.profile.goalDays}</div></div>
        <div class="goal-bar"><div style="width:${Math.min(100,Math.round(dayNum()/Math.max(1,S.profile.goalDays)*100))}%"></div></div>
        <div class="goal-meta"><span>${S.profile.targetWeightKg?`Target ${S.profile.targetWeightKg} kg`:'Target weight not set'}</span><span>${Math.min(100,Math.round(dayNum()/Math.max(1,S.profile.goalDays)*100))}% timeline</span></div>
      </div>
    </section>
    <section class="dashboard-block">
      <div class="sec">7-Day Snapshot</div>
      <div class="metric-grid-3">
        <div class="metric-tile"><b>${r7.sessions}</b><span>Workouts</span></div>
        <div class="metric-tile"><b>${Math.round(r7.volume/100)/10}t</b><span>Volume</span></div>
        <div class="metric-tile"><b>${r7.proteinDays}/7</b><span>Protein days</span></div>
        <div class="metric-tile"><b>${r7.waterDays}/7</b><span>Water goals</span></div>
        <div class="metric-tile"><b>${w.connected&&w.heartRate?w.heartRate+' bpm':'—'}</b><span>Live HR</span></div>
      </div>
    </section>
    <section class="dashboard-block">
      <div class="sec">Weekly Volume</div>
      <div class="chart-box">${svgBarChart(weeks.map(x=>x.vol),weeks.map(x=>x.lbl),maxVol)}</div>
    </section>
    <section class="dashboard-block">
      <div class="sec">Consistency</div>
      <div class="chart-box">
        <div class="consistency-grid">
          ${cells.map(c=>`<button class="consistency-cell" aria-label="${c.k}" onclick="openDayEdit('${c.k}')" style="background:${c.hasSess?'var(--green)':c.hasFood?'var(--blue)':'var(--faint)'};opacity:${c.hasSess||c.hasFood?1:.2}"></button>`).join('')}
        </div>
        <div class="consistency-legend"><span><i style="background:var(--green)"></i>Workout</span><span><i style="background:var(--blue)"></i>Food</span></div>
      </div>
    </section>
    ${prList.length>0?`<section class="dashboard-block"><div class="sec">Personal Records</div><div class="card pr-list">${prList.map(([n,pr])=>`<div class="pr-row"><div><div class="pr-name">${n}</div><div class="pr-date">${fmtDate(pr.date)}</div></div><div style="text-align:right"><div class="pr-val">${pr.weight} kg</div><div style="font-size:11px;color:var(--sub)">${pr.reps} reps</div></div></div>`).join('')}</div></section>`:''}
    ${bwData.length>1?`<section class="dashboard-block"><div class="sec">Body Weight Trend</div><div class="chart-box">${svgLineChart(bwData.map(([,l])=>l.bodyWeight),bwData.map(([d])=>fmtDate(d)))}</div></section>`:''}
  </div>`;
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
  <div class="card mx">${dates.map(d=>{const l=S.logs[d],sess=l.sessions||[];const cal=(l.foods||[]).reduce((s,f)=>s+foodCal(f),0);const brn=sess.reduce((s,se)=>s+(se.burn||0),0);return `<div class="hi-row" onclick="openDayEdit('${d}')"><div class="hi-date">${fmtDate(d)}</div><div class="hi-info"><div class="hi-split">${sess[0]?.planEmoji||''} ${h(sess[0]?.planName||'—')}</div><div class="hi-sub">${cal} kcal · ${brn} burned${l.bodyWeight?' · '+l.bodyWeight+'kg':''}</div></div><span style="color:var(--sub);font-size:18px">›</span></div>`;}).join('')}</div>`}`;
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
    S.plans.map(p=>`<div class="plan-row"><div class="plan-em">${p.emoji||'📋'}</div><div class="plan-info"><div class="plan-name">${h(p.name)}</div><div class="plan-sub">${p.exercises.length} exercises</div></div>
    <div class="plan-actions"><button class="icon-btn" onclick="openPlanBuilder('${p.id}')">✏️</button><button class="icon-btn" onclick="deletePlan('${p.id}')">🗑️</button></div></div>`).join('')}</div>`;}

function exercisesTab(){
  const lib=FT.modules.exerciseLibrary; const groups=['All',...MUSCLE_GROUPS];
  const mg=S.exerciseMuscleFilter||'All', eq=S.exerciseEquipmentFilter||'All', q=(S.exerciseSearch||'').trim().toLowerCase();
  const filtered=S.exercises.filter(e=>{const p=lib.profile(e);const hay=[e.name,p.primaryMuscle,p.equipment,p.movement,...p.secondaryMuscles].join(' ').toLowerCase();return(!q||hay.includes(q))&&(mg==='All'||p.primaryMuscle===mg)&&(eq==='All'||p.equipment===eq);}).sort((a,b)=>a.name.localeCompare(b.name));
  const equipment=['All',...Array.from(new Set(S.exercises.map(e=>lib.profile(e).equipment).filter(Boolean))).sort()];
  return `<div class="exercise-library-head"><div><div class="library-title">Exercise Library 2.0</div><div class="library-sub">Search, filter, inspect history and find substitutions.</div></div><button class="btn btn-a btn-sm" onclick="openExerciseEdit(null)">+ New</button></div>
  <div class="exercise-filter"><input class="inp" value="${h(S.exerciseSearch||'')}" placeholder="Search exercise, muscle, equipment…" oninput="setExerciseSearch(this.value)"><select class="inp" onchange="setExerciseMuscleFilter(this.value)">${groups.map(g=>`<option value="${h(g)}" ${g===mg?'selected':''}>${g}</option>`).join('')}</select><select class="inp" onchange="setExerciseEquipmentFilter(this.value)">${equipment.map(g=>`<option value="${h(g)}" ${g===eq?'selected':''}>${h(g)}</option>`).join('')}</select></div>
  <div class="library-count">${filtered.length} exercise${filtered.length===1?'':'s'} shown</div>
  <div class="exercise-library-grid">${filtered.length?filtered.map(ex=>{const p=lib.profile(ex);return `<article class="exercise-library-card"><div class="elc-main"><div class="elc-title">${h(ex.name)}</div><div class="elc-meta">${h(p.primaryMuscle)} · ${h(p.equipment)} · ${h(p.movement)}</div><div class="elc-tags"><span>${h(p.difficulty)}</span><span>${ex.defaultSets}×${h(ex.defaultReps)}</span></div></div><div class="elc-actions"><button class="icon-btn" onclick="openExerciseDetails(${jsarg(ex.id)})" aria-label="View details">ⓘ</button><button class="icon-btn" onclick="openExerciseEdit(${jsarg(ex.id)})" aria-label="Edit">✏️</button><button class="icon-btn" onclick="deleteExercise(${jsarg(ex.id)})" aria-label="Delete">🗑️</button></div></article>`;}).join(''):`<div class="card library-empty">No exercises match the current filters.</div>`}</div>`;
}
function setExerciseSearch(v){S.exerciseSearch=String(v||'').slice(0,80);go('plans');}
function setExerciseMuscleFilter(v){S.exerciseMuscleFilter=String(v||'All');go('plans');}
function setExerciseEquipmentFilter(v){S.exerciseEquipmentFilter=String(v||'All');go('plans');}
function openExerciseDetails(id){const ex=getEx(id);if(!ex)return;const lib=FT.modules.exerciseLibrary,p=lib.profile(ex),hist=lib.history(ex.name,S.logs),subs=lib.findSubstitutes(ex,S.exercises).slice(0,6),vol=hist.reduce((n,r)=>n+r.volume,0);showModal(`<div class="modal-head"><div class="modal-title">${h(ex.name)}</div><button class="modal-close" onclick="closeModal()">×</button></div><div class="exercise-detail"><div class="exercise-detail-hero"><div><div class="exercise-detail-kicker">${h(p.exerciseType)}</div><div class="exercise-detail-name">${h(ex.name)}</div><div class="exercise-detail-sub">${h(p.primaryMuscle)} · ${h(p.equipment)} · ${h(p.movement)}</div></div><span class="pill pa">${h(p.difficulty)}</span></div><div class="detail-grid"><div><span>Primary</span><b>${h(p.primaryMuscle)}</b></div><div><span>Secondary</span><b>${p.secondaryMuscles.length?h(p.secondaryMuscles.join(', ')):'—'}</b></div><div><span>Default</span><b>${ex.defaultSets} × ${h(ex.defaultReps)}</b></div><div><span>Tracked volume</span><b>${Math.round(vol).toLocaleString()} kg</b></div></div><div class="detail-note">${h(p.guidance||ex.note||'Use controlled range of motion and a manageable load.')}</div><div class="sec in-modal">Recent History</div>${hist.length?`<div class="exercise-history">${hist.slice(0,8).map(r=>`<div class="exercise-history-row"><div><b>${h(r.date)}</b><span>${r.sets} sets · ${Math.round(r.volume)} kg</span></div><div class="history-top">${r.topWeight?Math.round(r.topWeight*10)/10+' kg':'—'}<small>${r.bestE1RM?' · est. 1RM '+Math.round(r.bestE1RM*10)/10:''}</small></div></div>`).join('')}</div>`:`<div class="detail-note">No completed history for this exercise yet.</div>`}<div class="sec in-modal">Suggested Substitutions</div><div class="substitute-grid">${subs.length?subs.map(x=>{const q=lib.profile(x);return `<button class="substitute" onclick="openExerciseDetails(${jsarg(x.id)})"><b>${h(x.name)}</b><span>${h(q.primaryMuscle)} · ${h(q.movement)}</span></button>`;}).join(''):`<div class="detail-note">No close substitutions found.</div>`}</div><button class="btn btn-a" onclick="openExerciseEdit(${jsarg(ex.id)})">✏️ Edit Exercise</button></div>`);}

function scheduleTab(){return `<div class="sec">Default Weekly Plan</div><div class="card mx">${WEEKDAYS.map(wd=>{const pid=S.profile.weeklySchedule[wd]||null;const plan=getPlan(pid);return `<div class="sch-row"><div class="sch-day">${WD_LABELS[wd]}</div><div class="sch-plan">${plan?plan.emoji+' '+plan.name:'Rest / None'}</div><button class="sch-change" onclick="openSchPicker(${jsarg(wd)})">Change</button></div>`;}).join('')}</div>`;}

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
      <div><label class="lbl">From</label><input type="date" id="exp-from" class="inp" value="${localDateISO(defFrom)}"></div>
      <div><label class="lbl">To</label><input type="date" id="exp-to" class="inp" value="${localDateISO(now)}"></div>
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
  if(fi)fi.value=localDateISO(from);
  if(ti)ti.value=localDateISO(now);
  showExpPreview();
}

function getExpLogs(){
  const from=localDateFromInput($('exp-from')?.value);
  const to=localDateFromInput($('exp-to')?.value);
  to.setHours(23,59,59,999);
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

function buildExpData(){return getExpLogs().map(([d,l])=>({date:d,plan:(l.sessions||[]).map(s=>s.planName||'').join(', '),duration_min:(l.sessions||[]).reduce((s,sess)=>s+Math.round((sess.duration||0)/60),0),calories_eaten:consumed(d),protein_g:Math.round(proteinG(d)),calories_burned:burnedCal(d),water_glasses:l.water||0,body_weight_kg:l.bodyWeight||'',volume_kg:(l.sessions||[]).reduce((v,sess)=>v+Object.values(sess.setLogs||{}).flat().reduce((vv,set)=>vv+(set.done&&set.weight&&set.reps?(parseFloat(set.weight)||0)*(parseInt(set.reps)||0):0),0),0),sets:(l.sessions||[]).flatMap(sess=>Object.values(sess.setLogs||{}).flatMap(sets=>sets.filter(s=>s.done).map(s=>({ex:s.exName,kg:s.weight,reps:s.reps}))))  }));}
function dlFile(c,n,t){const b=new Blob([c],{type:t});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);}
function csvCell(v){const x=String(v??'');return /[",\n]/.test(x)?`"${x.replace(/"/g,'""')}"`:x;}
function doCSV(){const d=buildExpData();if(!d.length){toast('No data in selected range',true);return;}const h=['Date','Plan','Duration(min)','Cal Eaten','Protein(g)','Cal Burned','Water','Weight(kg)','Volume(kg)'];dlFile([h.join(','),...d.map(r=>[r.date,r.plan,r.duration_min,r.calories_eaten,r.protein_g,r.calories_burned,r.water_glasses,r.body_weight_kg,r.volume_kg].map(csvCell).join(','))].join('\n'),'fittrack_export.csv','text/csv');toast('CSV downloaded!');}
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
    ${S.plans.map(p=>`<div class="plan-row" style="cursor:pointer;border-top:1px solid var(--line)" onclick="${wd?`setSchPlan('${wd}','${p.id}')`:`setTodayPlan('${p.id}')`}"><div class="plan-em">${p.emoji||'📋'}</div><div class="plan-info"><div class="plan-name">${h(p.name)}</div><div class="plan-sub">${p.exercises.length} exercises</div></div></div>`).join('')}
  </div></div>`);}
function setTodayPlan(id){todayLog().planId=id;save();closeModal();go('home');}
function openSchPicker(wd){openPlanPicker(wd);}
function setSchPlan(wd,id){S.profile.weeklySchedule[wd]=id;save();closeModal();go('plans');}

function openExerciseEdit(id){const ex=id?getEx(id):null;const p=FT.modules.exerciseLibrary.profile(ex||{});showModal(`<div class="modal-head"><div class="modal-title">${ex?'Edit Exercise':'New Exercise'}</div><button class="modal-close" onclick="closeModal()">×</button></div><div class="exercise-form"><div><label class="lbl">Name</label><input id="ee-name" class="inp" value="${h(ex?.name||'')}" placeholder="e.g. Incline Dumbbell Press"></div><div><label class="lbl">Primary Muscle</label><select id="ee-mg" class="inp">${MUSCLE_GROUPS.map(g=>`<option value="${h(g)}" ${(ex?.primaryMuscle||ex?.muscleGroup||'Full Body')===g?'selected':''}>${g}</option>`).join('')}</select></div><div class="form-grid-2"><div><label class="lbl">Equipment</label><input id="ee-equipment" class="inp" value="${h(p.equipment||'Bodyweight')}" placeholder="Barbell, Dumbbell…"></div><div><label class="lbl">Movement</label><input id="ee-movement" class="inp" value="${h(p.movement||'Compound')}" placeholder="Horizontal Push…"></div></div><div class="form-grid-2"><div><label class="lbl">Default Sets</label><input id="ee-sets" type="number" class="inp" value="${ex?.defaultSets||3}"></div><div><label class="lbl">Default Reps</label><input id="ee-reps" class="inp" value="${h(ex?.defaultReps||'12')}"></div></div><div class="form-grid-2"><div><label class="lbl">Secondary Muscles</label><input id="ee-secondary" class="inp" value="${h((p.secondaryMuscles||[]).join(', '))}" placeholder="Triceps, Front Delts"></div><div><label class="lbl">Difficulty</label><select id="ee-difficulty" class="inp">${['Beginner','Intermediate','Advanced'].map(x=>`<option ${p.difficulty===x?'selected':''}>${x}</option>`).join('')}</select></div></div><div><label class="lbl">Guidance / Form Cue</label><input id="ee-note" class="inp" value="${h(ex?.note||p.guidance||'')}" placeholder="Key technique cue"></div><label class="check-row"><input type="checkbox" id="ee-cardio" ${ex?.isCardio?'checked':''}><span>Cardio / timed exercise</span></label><button class="btn btn-a" onclick="saveExercise('${id||''}')">Save Exercise</button>${id?`<button class="btn btn-r" onclick="deleteExercise('${id}')">Delete Exercise</button>`:''}</div>`);}
function saveExercise(id){const name=text($('ee-name')?.value||'',LIMITS.exerciseName);if(!name){toast('Enter exercise name',true);return;}const raw={id:id||('ex_'+Date.now()),name,muscleGroup:MUSCLE_GROUPS.includes($('ee-mg')?.value)?$('ee-mg').value:'Full Body',defaultSets:clamp(parseInt($('ee-sets')?.value)||3,1,30),defaultReps:text($('ee-reps')?.value||'12',40),note:text($('ee-note')?.value||'',LIMITS.note),isCardio:!!$('ee-cardio')?.checked,equipment:text($('ee-equipment')?.value||'Bodyweight',80),movement:text($('ee-movement')?.value||'Compound',80),primaryMuscle:$('ee-mg')?.value||'Full Body',secondaryMuscles:String($('ee-secondary')?.value||'').split(',').map(x=>text(x,50)).filter(Boolean).slice(0,8),difficulty:$('ee-difficulty')?.value||'Intermediate'};const out=normalizeExercise(FT.modules.exerciseLibrary.enrichExercise(raw));if(id){const i=S.exercises.findIndex(e=>e.id===id);if(i>=0)S.exercises[i]=out;}else S.exercises.push(out);save();closeModal();go('plans');toast(name+' saved!');}
function deleteExercise(id){if(!confirm('Delete this exercise?'))return;S.exercises=S.exercises.filter(e=>e.id!==id);save();closeModal();go('plans');toast('Deleted');}
function deletePlan(id){if(!confirm('Delete this plan?'))return;S.plans=S.plans.filter(p=>p.id!==id);save();go('plans');toast('Plan deleted');}

let _pbPlan=null;
function openPlanBuilder(id){const plan=id?getPlan(id):null;_pbPlan=plan?JSON.parse(JSON.stringify(plan)):{id:'pl_'+Date.now(),name:'',emoji:'📋',exercises:[]};renderPBModal();}
function renderPBModal(){const p=_pbPlan;showModal(`
  <div class="modal-head"><div class="modal-title">${p.id&&S.plans.find(x=>x.id===p.id)?'Edit Plan':'New Plan'}</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div style="padding:16px;display:grid;gap:10px">
    <div style="display:grid;grid-template-columns:56px 1fr;gap:10px">
      <div><label class="lbl">Icon</label><input id="pb-emoji" class="inp inp-sm" value="${p.emoji}" maxlength="2"></div>
      <div><label class="lbl">Plan Name</label><input id="pb-name" class="inp" value="${h(p.name)}" placeholder="e.g. Push Day"></div>
    </div>
    <button class="btn btn-b btn-sm" style="width:auto" onclick="openExPicker()">+ Add Exercise</button>
  </div>
  <div class="plan-balance-card">${FT.modules.exerciseLibrary.planBalance(p,S.exercises)}</div>
  <div class="sec" style="padding:4px 16px 8px">Exercises (${p.exercises.length})</div>
  <div class="card mx">${p.exercises.length===0?`<div class="pad" style="color:var(--sub);font-size:13px">No exercises yet</div>`:
    p.exercises.map((pe,i)=>{const ex=getEx(pe.exId);return `<div class="pb-ex-row">
      <div style="flex:1"><div class="pb-ex-name">${h(ex?.name||'Unknown')}</div>
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
function renderExPickerList(q){const f=S.exercises.filter(e=>!q||e.name.toLowerCase().includes(q.toLowerCase()));const bg={};f.forEach(e=>{if(!bg[e.muscleGroup])bg[e.muscleGroup]=[];bg[e.muscleGroup].push(e);});return Object.entries(bg).map(([mg,exs])=>`<div class="sec" style="padding:10px 16px 5px">${mg}</div><div class="card mx mb8">${exs.map(ex=>`<div class="ex-lib-row" onclick="pbAddEx(${jsarg(ex.id)})" style="cursor:pointer"><div style="flex:1"><div style="font-size:14px;font-weight:600">${h(ex.name)}</div><div class="ex-lib-mg">${ex.defaultSets}×${ex.defaultReps}</div></div><span style="color:var(--accent);font-size:22px;font-weight:800">+</span></div>`).join('')}</div>`).join('');}
function filterExPicker(q){const el=$('ep-list');if(el)el.innerHTML=renderExPickerList(q);}
function pbAddEx(exId){const ex=getEx(exId);if(!ex||!_pbPlan)return;_pbPlan.exercises.push({exId,sets:ex.defaultSets,reps:ex.defaultReps,note:ex.note||''});renderPBModal();toast(ex.name+' added');}
function savePBPlan(){if(!_pbPlan)return;_pbPlan.name=text($('pb-name')?.value||_pbPlan.name,160);_pbPlan.emoji=text($('pb-emoji')?.value||'📋',8)||'📋';_pbPlan.exercises=_pbPlan.exercises.map(x=>({exId:safeId(x.exId,'ex_unknown'),sets:clamp(parseInt(x.sets)||1,1,30),reps:text(x.reps||'10–12',40),note:text(x.note||'',LIMITS.note)}));if(!_pbPlan.name){toast('Enter a plan name',true);return;}if(!_pbPlan.exercises.length){toast('Add at least one exercise',true);return;}const idx=S.plans.findIndex(p=>p.id===_pbPlan.id);if(idx>=0)S.plans[idx]=_pbPlan;else S.plans.push(_pbPlan);save();_pbPlan=null;closeModal();go('plans');toast('Plan saved ✓');}

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
    <div style="display:flex;gap:6px;flex-wrap:wrap">${Array.from({length:S.profile.waterTarget||8},(_,k)=>k+1).map(i=>`<button class="gl ${(log.water||0)>=i?'on':''}" onclick="deWater('${dateStr}',${i})">${(log.water||0)>=i?'💧':'○'}</button>`).join('')}</div>
  </div>
  <div style="padding:12px 16px;border-bottom:1px solid var(--line)">
    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--sub);text-transform:uppercase;margin-bottom:10px">Food Log (${(log.foods||[]).length})</div>
    ${(log.foods||[]).length===0?`<div style="font-size:13px;color:var(--sub)">No food logged</div>`:
      (log.foods||[]).map((f,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--line)">
        <div style="flex:1"><div style="font-size:13px;font-weight:600">${h(f.name)}</div><div style="font-size:11px;color:var(--sub)">${foodCal(f)} kcal · ${foodP(f)}g P · ×${f.qty||1}</div></div>
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
      <div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-weight:700">${s.planEmoji||''} ${h(s.planName||'Session')}</span><span style="font-size:12px;color:var(--sub)">${fmt(s.duration||0)}</span></div>
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
      <div style="font-size:14px;font-weight:700;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--line)">${h(exName)}</div>
      <div style="display:grid;grid-template-columns:24px 1fr 1fr 36px;gap:5px;margin-bottom:5px">
        <span style="font-size:9px;color:var(--sub);text-align:center">#</span><span style="font-size:9px;color:var(--sub);text-align:center">KG</span><span style="font-size:9px;color:var(--sub);text-align:center">REPS</span><span style="font-size:9px;color:var(--sub);text-align:center">✓</span>
      </div>
      ${sets.map((set,si)=>`<div class="es-set-row" style="background:${set.done?'var(--adim)':'transparent'};border-radius:6px;padding:3px 2px">
        <div style="font-size:12px;font-weight:700;color:var(--sub);text-align:center">${si+1}</div>
        <input type="number" class="inp inp-sm" step="0.5" value="${h(set.weight)}" onchange="seEdit('${dateStr}',${sessIdx},'${exIdx}',${si},'weight',this.value)">
        <input type="number" class="inp inp-sm" value="${h(set.reps)}" onchange="seEdit('${dateStr}',${sessIdx},'${exIdx}',${si},'reps',this.value)">
        <button class="sc${set.done?' on':''}" onclick="seToggle('${dateStr}',${sessIdx},'${exIdx}',${si})" style="width:36px;height:34px">${set.done?'✓':'○'}</button>
      </div>`).join('')}
      <button style="background:none;border:1px dashed var(--line);border-radius:7px;width:100%;padding:7px;color:var(--sub);font-size:12px;margin-top:6px;cursor:pointer" onclick="seAddSet('${dateStr}',${sessIdx},'${exIdx}','${h(exName)}')">+ Add Set</button>
    </div>`;}).join('')}
  </div>
  <div style="padding:14px 16px"><button class="btn btn-a" onclick="openDayEdit('${dateStr}')">Done ✓</button></div>`);}
function seEdit(d,si,exIdx,setIdx,field,val){const sets=dayLog(d).sessions[si]?.setLogs?.[exIdx];if(sets&&sets[setIdx]){sets[setIdx][field]=val;save();}}
function seToggle(d,si,exIdx,setIdx){const sets=dayLog(d).sessions[si]?.setLogs?.[exIdx];if(sets&&sets[setIdx]){sets[setIdx].done=!sets[setIdx].done;save();openSessionEdit(d,si);}}
function seAddSet(d,si,exIdx,exName){const sess=dayLog(d).sessions[si];if(!sess?.setLogs)return;if(!sess.setLogs[exIdx])sess.setLogs[exIdx]=[];sess.setLogs[exIdx].push({exName,setNum:sess.setLogs[exIdx].length+1,weight:'',reps:'',done:false});save();openSessionEdit(d,si);}


// ── DATA BACKUP / RESTORE ─────────────────
function installApp(){
  if(!deferredInstallPrompt){toast('Use your browser menu to install FitTrack Pro');return;}
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.finally(()=>{deferredInstallPrompt=null;});
}
function exportBackup(){
  const payload={version:6,schemaVersion:SCHEMA_VERSION,exportedAt:new Date().toISOString(),app:'FitTrack Pro',
    exercises:S.exercises,plans:S.plans,logs:S.logs,profile:S.profile};
  dlFile(JSON.stringify(payload,null,2),'fittrack-backup.json','application/json');
  toast('Backup downloaded ✓');
}
function importBackup(){
  const input=document.createElement('input'); input.type='file'; input.accept='.json,application/json';
  input.onchange=()=>{
    const file=input.files?.[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const d=JSON.parse(reader.result);
        if(!d || !Array.isArray(d.exercises) || !Array.isArray(d.plans) || typeof d.logs!=='object' || !d.profile)
          throw new Error('Invalid FitTrack backup');
        if(!confirm('Restore this backup? Current FitTrack data will be replaced.'))return;
        const normalized=normalizeState(d);
        S.exercises=normalized.exercises; S.plans=normalized.plans; S.logs=normalized.logs; S.profile=normalized.profile;
        S.session=null; Storage.remove(DRAFT); save(); closeModal(); go('home'); syncBars(); toast('Backup restored ✓');
      }catch(e){toast('Invalid backup file',true);}
    };
    reader.readAsText(file);
  };
  input.click();
}
function resetAllData(){
  if(!confirm('Delete all workouts, food logs, plans, exercises and profile data? This cannot be undone.'))return;
  [KEY,DRAFT,LEGACY_V11,LEGACY_V10,LEGACY_V9,LEGACY_KEY,'ft3','fittrack_pro_session_v9','fittrack_pro_session_v10','fittrack_pro_session_v11'].forEach(Storage.remove.bind(Storage));
  location.reload();
}
function estimate1RM(weight,reps){return FT.metrics.estimate1RM(weight,reps);}


// ── WEARABLE HUB / CONNECTION LAYER ───────────────────────────
const BLE_UUID=FT.modules.wearables.BLE_UUID;
let wearableDevice=null, wearableHRChar=null, wearableDisconnectHandler=null;
function wearableAvailable(){return !!(navigator.bluetooth&&navigator.bluetooth.requestDevice)}
function wearableSecureContext(){return window.isSecureContext===true||location.hostname==='localhost'||location.hostname==='127.0.0.1'}
function wearableBrowserLabel(){if(!wearableAvailable())return 'Bluetooth API unavailable';if(!wearableSecureContext())return 'HTTPS required';return 'Ready to connect'}
function setWearableState(patch,rerender=false,persist=true){const next={...(S.profile.wearable||{}),...patch};const changed=Object.keys(patch).some(k=>JSON.stringify(next[k])!==JSON.stringify(S.profile.wearable?.[k]));S.profile.wearable=next;if(changed&&persist)save();if(rerender)renderWearableStatus();}
function wearableConnectionLabel(w){
  if(w.connected)return 'Connected · '+(w.method==='ble'?'Direct Bluetooth':w.method==='health-connect'?'Health Connect':'Wearable');
  if(w.method==='health-connect')return 'Health Connect bridge';
  if(w.name)return 'Saved device · reconnect';
  return 'Not connected';
}
function renderWearableStatus(){
  const w=S.profile.wearable||{};
  const st=$('wear-settings-status'),sub=$('wear-settings-sub'),hr=$('wear-hr'),bat=$('wear-battery'),steps=$('wear-steps'),method=$('wear-method-status');
  if(st){st.textContent=w.connected?'Connected':'Not connected';st.classList.toggle('on',!!w.connected);}
  if(sub)sub.textContent=w.name?(w.name+' · '+wearableConnectionLabel(w)):'Noise ColorFit Pro 5 Max or other compatible wearable';
  if(hr)hr.textContent=w.heartRate?String(w.heartRate):'—';
  if(bat)bat.textContent=w.battery!=null?String(w.battery)+'%':'—';
  if(steps)steps.textContent=w.steps!=null?Number(w.steps).toLocaleString():'—';
  if(method)method.textContent=wearableBrowserLabel();
  const c=$('wear-connect-main');if(c)c.textContent=w.connected?'Disconnect wearable':'Connect via Bluetooth';
  const r=$('wear-reconnect');if(r)r.hidden=!(!w.connected&&w.deviceId);
}
function wearableHomeCard(){
  const w=S.profile.wearable||{};
  return `<section class="wear-card wear-home-card">
    <div class="wear-head"><div class="wear-icon">⌁</div><div><div class="wear-kicker">WEARABLE & HEALTH</div><div class="wear-title">${w.connected?h(w.name||'Wearable connected'):'Connect your wearable'}</div><div class="wear-sub">${w.connected?'Live heart-rate link is available':'Noise ColorFit Pro 5 Max · Bluetooth · Android Health Connect'}</div></div><span class="wear-status ${w.connected?'on':''}">${w.connected?'LIVE':'SET UP'}</span></div>
    <div class="wear-action-row"><button class="btn btn-g btn-sm" onclick="openWearableHub()">${w.connected?'Open wearable':'Connect wearable'}</button><button class="btn btn-o btn-sm" onclick="openWearableHub()">Connection options</button></div>
    ${w.connected?`<div class="wear-metrics"><div class="wear-metric"><b>${w.heartRate||'—'}</b><span>HR bpm</span></div><div class="wear-metric"><b>${w.battery!=null?w.battery+'%':'—'}</b><span>Battery</span></div><div class="wear-metric"><b>${w.steps!=null?Number(w.steps).toLocaleString():'—'}</b><span>Steps</span></div></div>`:`<div class="wear-note">The connection menu now shows the available method for this browser and the Android Health Connect path for full activity data.</div>`}
  </section>`;
}
function wearableDashboardCard(){
  const w=S.profile.wearable||{};
  return `<div class="wear-card">
    <div class="wear-head"><div class="wear-icon">⌁</div><div><div class="wear-title">${h(w.name||'No wearable connected')}</div><div class="wear-sub">${wearableConnectionLabel(w)}</div></div><span class="wear-status ${w.connected?'on':''}">${w.connected?'LIVE':'OFFLINE'}</span></div>
    <div class="wear-metrics"><div class="wear-metric"><b>${w.heartRate||'—'}</b><span>HR bpm</span></div><div class="wear-metric"><b>${w.battery!=null?w.battery+'%':'—'}</b><span>Battery</span></div><div class="wear-metric"><b>${w.steps!=null?Number(w.steps).toLocaleString():'—'}</b><span>Steps</span></div></div>
    <div class="wear-action-row"><button class="btn btn-g btn-sm" onclick="openWearableHub()">${w.connected?'Manage connection':'Choose connection method'}</button></div>
    <div class="wear-note">Only metrics actually received from the device or bridge are shown. No steps, sleep, SpO₂ or calories are fabricated.</div>
  </div>`;
}
function openWearableHub(){
  const w=S.profile.wearable||{};
  showModal(`<div class="modal-head"><div><div class="modal-title">⌁ Wearable & Health</div><div class="modal-subtitle">Choose how FitTrack Pro gets fitness data</div></div><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="wear-hub">
      <div class="wear-current"><div><div class="wear-kicker">CURRENT STATUS</div><strong>${w.connected?h(w.name||'Wearable connected'):'No active connection'}</strong><span>${wearableConnectionLabel(w)}</span></div><span class="wear-status ${w.connected?'on':''}">${w.connected?'CONNECTED':'NOT CONNECTED'}</span></div>
      <div class="wear-method active"><div class="wm-icon">⌁</div><div class="wm-main"><strong>Direct Bluetooth (BLE)</strong><span>Experimental browser connection · ${wearableBrowserLabel()}</span><small>Best for compatible standard BLE heart-rate and battery services. This can work for a watch only when those services are exposed to the browser.</small></div><button id="wear-connect-main" class="btn ${w.connected?'btn-r':'btn-g'} btn-sm" onclick="${w.connected?'disconnectNoiseWearable()':'connectNoiseWearable()'}">${w.connected?'Disconnect':'Connect'}</button></div>
      <div class="wear-method"><div class="wm-icon">HC</div><div class="wm-main"><strong>Android Health Connect</strong><span>Recommended path for broader health data</span><small>NoiseFit can sync activity data to the phone. A native Android/TWA bridge is required for FitTrack Pro to read Health Connect securely.</small></div><button class="btn btn-o btn-sm" onclick="showHealthConnectInfo()">How to connect</button></div>
      <div class="wear-method"><div class="wm-icon">NF</div><div class="wm-main"><strong>NoiseFit companion route</strong><span>Use NoiseFit as the upstream watch app</span><small>Keep the watch paired with NoiseFit. FitTrack should consume standardized data through the Android bridge rather than pretending to speak an undocumented Noise protocol.</small></div><button class="btn btn-o btn-sm" onclick="showNoiseFitInfo()">Setup guide</button></div>
      <button id="wear-reconnect" class="btn btn-o" ${w.deviceId?'':'hidden'} onclick="reconnectSavedWearable()">↻ Reconnect saved wearable</button>
      <div class="wear-capabilities"><div class="wear-kicker">DATA POLICY</div><div>Direct BLE: heart rate / battery only when exposed. Health Connect bridge: broader standardized records such as exercise, heart rate, steps and calories when permitted. FitTrack never invents missing wearable values.</div></div>
    </div>`);
  renderWearableStatus();
}
function showHealthConnectInfo(){
  showModal(`<div class="modal-head"><div class="modal-title">Android Health Connect</div><button class="modal-close" onclick="closeModal()">×</button></div><div class="info-modal"><div class="info-callout">This browser PWA cannot directly request Android Health Connect permissions. The production integration needs an Android companion / TWA bridge.</div><ol><li>Pair the ColorFit Pro 5 Max with NoiseFit on Android.</li><li>Allow NoiseFit to sync its supported activity data.</li><li>Install the FitTrack Android companion when available.</li><li>Grant FitTrack only the Health Connect data types it needs, such as heart rate, steps, exercise and calories.</li><li>Return to FitTrack and run sync; imported values will be marked as Health Connect data.</li></ol><button class="btn btn-o" onclick="openWearableHub()">Back to connection methods</button></div>`);
}
function showNoiseFitInfo(){
  showModal(`<div class="modal-head"><div class="modal-title">NoiseFit → FitTrack</div><button class="modal-close" onclick="closeModal()">×</button></div><div class="info-modal"><div class="info-callout">For the ColorFit Pro 5 Max, Noise documents phone-side activity syncing through the NoiseFit app. FitTrack does not assume a private Noise BLE protocol.</div><ol><li>Keep Bluetooth enabled on the Android phone.</li><li>Open NoiseFit and keep the watch paired.</li><li>Sync the watch inside NoiseFit until the activity sync completes.</li><li>Use the future FitTrack Health Connect bridge to import standardized records.</li></ol><button class="btn btn-o" onclick="openWearableHub()">Back to connection methods</button></div>`);
}
function bindWearableDisconnect(device){
  if(wearableDisconnectHandler&&wearableDevice){try{wearableDevice.removeEventListener('gattserverdisconnected',wearableDisconnectHandler);}catch(e){}}
  wearableDisconnectHandler=()=>{setWearableState({connected:false,heartRate:null,lastSyncAt:Date.now()},true);};
  wearableDevice=device;
  device.addEventListener('gattserverdisconnected',wearableDisconnectHandler);
}

async function connectNoiseWearable(){
  if(!wearableAvailable()){toast('Direct Bluetooth is not available in this browser. Use Chrome on a supported HTTPS Android/desktop setup.',true);return;}
  if(!wearableSecureContext()){toast('Bluetooth requires a secure HTTPS origin. localhost is allowed for development.',true);return;}
  try{
    const device=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:[BLE_UUID.deviceInfo,BLE_UUID.battery,BLE_UUID.heartRate]});
    bindWearableDisconnect(device);
    const server=await device.gatt.connect();
    setWearableState({connected:true,name:device.name||'Bluetooth wearable',deviceId:device.id||'',lastConnectedAt:Date.now(),lastSyncAt:Date.now(),method:'ble',source:'Web Bluetooth'},true);
    await readWearableBattery(server);
    await readWearableDeviceInfo(server);
    await subscribeWearableHR(server);
    toast((device.name||'Wearable')+' connected ✓');
    closeModal();
  }catch(e){
    if(e&&e.name==='NotFoundError')return;
    console.warn('Wearable connection failed',e);
    setWearableState({connected:false},true);
    const detail=e?.name==='SecurityError'?'Check HTTPS / browser permissions.':e?.message?.slice(0,90)||'';
    toast('Could not connect. '+detail,true);
  }
}
async function reconnectSavedWearable(){
  if(!wearableAvailable()||!navigator.bluetooth.getDevices){toast('Saved-device reconnect is not supported by this browser.',true);return;}
  try{
    const list=await navigator.bluetooth.getDevices();
    const saved=S.profile.wearable?.deviceId;
    const device=list.find(d=>d.id===saved)||list.find(d=>d.name===S.profile.wearable?.name?.split(' · ')[0]);
    if(!device){toast('No previously authorized wearable found. Tap Connect instead.',true);return;}
    bindWearableDisconnect(device);
    const server=await device.gatt.connect();
    setWearableState({connected:true,lastConnectedAt:Date.now(),method:'ble',source:'Web Bluetooth'},true);
    await readWearableBattery(server);await readWearableDeviceInfo(server);await subscribeWearableHR(server);
    closeModal();toast((device.name||'Wearable')+' reconnected ✓');
  }catch(e){console.warn('Reconnect failed',e);toast('Saved wearable could not be reconnected.',true);}
}
async function readWearableBattery(server){try{const svc=await server.getPrimaryService(BLE_UUID.battery);const ch=await svc.getCharacteristic(BLE_UUID.batteryLevel);const v=await ch.readValue();setWearableState({battery:v.getUint8(0),lastSyncAt:Date.now()});}catch(e){}}
async function readWearableDeviceInfo(server){try{const svc=await server.getPrimaryService(BLE_UUID.deviceInfo);const patch={};for(const [key,uuid] of [['manufacturer',BLE_UUID.manufacturer],['model',BLE_UUID.model]]){try{const ch=await svc.getCharacteristic(uuid);const v=await ch.readValue();const value=new TextDecoder().decode(v).replace(/\0/g,'').trim();if(value)patch[key]=text(value,120);}catch(e){}}if(Object.keys(patch).length){patch.source='Web Bluetooth';setWearableState(patch,true);}}catch(e){}}
async function subscribeWearableHR(server){try{const svc=await server.getPrimaryService(BLE_UUID.heartRate);const ch=await svc.getCharacteristic(BLE_UUID.heartRateMeasurement);wearableHRChar=ch;await ch.startNotifications();ch.addEventListener('characteristicvaluechanged',onWearableHR);setWearableState({capabilities:Array.from(new Set([...(S.profile.wearable?.capabilities||[]),'heart_rate']))},true);}catch(e){console.info('No standard BLE heart-rate service exposed by this device.');}}
function onWearableHR(ev){try{const v=ev.target.value;const hr=FT.modules.wearables.parseHeartRate(v);if(hr>0&&hr<240){setWearableState({heartRate:hr,lastSyncAt:Date.now()},false,false);if(S.session&&Date.now()-(S.session.lastHrSampleTs||0)>=5000){S.session.heartRateSamples=(S.session.heartRateSamples||[]).concat({ts:Date.now(),bpm:hr}).slice(-720);S.session.lastHrSampleTs=Date.now();saveDraft(false);}}}catch(e){}}
async function disconnectNoiseWearable(){try{if(wearableHRChar){try{wearableHRChar.removeEventListener('characteristicvaluechanged',onWearableHR)}catch(e){}try{await wearableHRChar.stopNotifications()}catch(e){}wearableHRChar=null}if(wearableDevice&&wearableDisconnectHandler){try{wearableDevice.removeEventListener('gattserverdisconnected',wearableDisconnectHandler)}catch(e){}wearableDisconnectHandler=null}if(wearableDevice?.gatt?.connected)wearableDevice.gatt.disconnect();wearableDevice=null}catch(e){}setWearableState({connected:false,heartRate:null,lastSyncAt:Date.now(),method:'none'},true);toast('Wearable disconnected')}
// Optional native Health Connect bridge contract: host app can post a message with standardized records.
window.addEventListener('message',e=>{
  const d=e?.data;if(!d||d.type!=='FITTRACK_HEALTH_CONNECT_SYNC')return;
  if(e.origin!==location.origin||e.source!==window){console.warn('Health Connect message rejected: origin/source mismatch');return;}
  try{
    const payload=d.payload&&typeof d.payload==='object'?d.payload:{};
    const w=S.profile.wearable||{};
    const hr=finite(payload.heartRate,NaN),steps=finite(payload.steps,NaN),battery=finite(payload.battery,NaN);
    const samples=Array.isArray(payload.heartRateSamples)?payload.heartRateSamples.slice(-720).map(x=>({ts:finite(x?.ts,Date.now()),bpm:clamp(Math.round(finite(x?.bpm,0)),1,239)})).filter(x=>x.bpm>0):[];
    setWearableState({method:'health-connect',source:'Android Health Connect',connected:true,lastSyncAt:Date.now(),heartRate:Number.isFinite(hr)?hr:w.heartRate,steps:Number.isFinite(steps)?Math.max(0,Math.round(steps)):w.steps,battery:Number.isFinite(battery)?clamp(Math.round(battery),0,100):w.battery},true);
    if(S.session&&samples.length)S.session.heartRateSamples=samples;
    if(S.session)saveDraft(true);
    toast('Health Connect sync received ✓');
  }catch(err){console.warn('Health Connect bridge payload rejected',err);}
});
function renderWearablePreviewData(){renderWearableStatus();}

function openSettings(){showModal(`
  <div class="modal-head"><div class="modal-title">⚙️ Settings</div><button class="modal-close" onclick="closeModal()">×</button></div>
  <div style="padding:16px;display:grid;gap:12px">
    <div><label class="lbl">Your Name</label><input id="s-name" class="inp" value="${h(S.profile.name)}"></div>
    <div><label class="lbl">Body Weight (kg)</label><input id="s-bw" type="number" class="inp" step="0.1" value="${S.profile.weightKg}"></div>
    <div><label class="lbl">Daily Calorie Target</label><input id="s-cal" type="number" class="inp" value="${S.profile.targetCal}"></div>
    <div><label class="lbl">Daily Protein Target (g)</label><input id="s-pro" type="number" class="inp" value="${S.profile.targetProtein}"></div>
    <div><label class="lbl">Program Name</label><input id="s-prog" class="inp" value="${h(S.profile.programName)}"></div>
    <div><label class="lbl">Goal Days</label><input id="s-goal" type="number" class="inp" value="${S.profile.goalDays}" min="1" max="365"></div>
    <div><label class="lbl">Target Weight (kg)</label><input id="s-target-w" type="number" class="inp" step="0.1" placeholder="e.g. 80" value="${S.profile.targetWeightKg||''}"></div>
    <div><label class="lbl">Starting Weight (kg)</label><input id="s-start-w" type="number" class="inp" step="0.1" placeholder="Optional" value="${S.profile.startWeightKg||''}"></div>
    <div><label class="lbl">Weekly Workout Target</label><input id="s-weekly" type="number" class="inp" min="1" max="14" value="${S.profile.weeklyWorkoutTarget||5}"></div>
    <div><label class="lbl">Daily Water Target (glasses)</label><input id="s-water" type="number" class="inp" min="1" max="30" value="${S.profile.waterTarget||8}"></div>
    <div><label class="lbl">Program Start Date</label><input id="s-start" type="date" class="inp" value="${localDateISO(S.profile.startDate)}"></div>
    <div style="background:var(--card2);border:1px solid var(--line);border-radius:var(--r);padding:14px">
      <div style="font-size:13px;font-weight:700;margin-bottom:6px">🗓 Manual Day Override</div>
      <div style="font-size:12px;color:var(--sub);margin-bottom:8px">Force a specific day number. Leave blank for auto.</div>
      <input id="s-mday" type="number" class="inp" style="max-width:100px" min="1" max="${S.profile.goalDays}" placeholder="Day #" value="${S.profile.manualDay||''}">
    </div>
    <div class="workout-settings-panel"><div class="goal-kicker">WORKOUT MODE</div><div class="goal-title" style="margin-bottom:8px">Training defaults</div><div class="workout-settings-grid"><label class="check-row"><input id="s-auto-rest" type="checkbox" ${S.profile.workoutPrefs?.autoRest!==false?'checked':''}><span>Auto-start rest after completed sets</span></label><div><label class="lbl">Default rest (seconds)</label><input id="s-rest-default" type="number" class="inp" min="15" max="1800" step="15" value="${S.profile.workoutPrefs?.defaultRest||90}"></div><div><label class="lbl">Bar weight (kg)</label><input id="s-bar-weight" type="number" class="inp" min="5" max="50" step="0.5" value="${S.profile.workoutPrefs?.barWeightKg||20}"></div></div></div>
    <div class="wear-card wear-settings-card">
      <div class="wear-head"><div class="wear-icon">⌁</div><div><div class="wear-kicker">WEARABLE CONNECTION</div><div class="wear-title" id="wear-settings-title">Noise ColorFit Pro 5 Max</div><div class="wear-sub" id="wear-settings-sub">Noise ColorFit Pro 5 Max or other compatible wearable</div></div><span id="wear-settings-status" class="wear-status">Not connected</span></div>
      <div class="wear-browser"><span>Bluetooth status</span><b id="wear-method-status">Checking…</b></div>
      <div class="wear-metrics"><div class="wear-metric"><b id="wear-hr">—</b><span>HR bpm</span></div><div class="wear-metric"><b id="wear-battery">—</b><span>Battery</span></div><div class="wear-metric"><b id="wear-steps">—</b><span>Steps</span></div></div>
      <div class="wear-actions"><button id="wear-connect-main" class="btn btn-g" onclick="connectNoiseWearable()">Connect via Bluetooth</button><button class="btn btn-o" onclick="openWearableHub()">Options</button></div>
      <div class="wear-note">For broader activity and sleep records, use the Android Health Connect route. Direct browser Bluetooth is experimental and depends on standard BLE services being exposed.</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px"><input type="checkbox" id="s-audio" ${S.profile.audioEnabled?'checked':''} style="width:18px;height:18px"><label for="s-audio" style="font-size:14px">Rest timer audio beep</label></div>
    <button class="btn btn-a" onclick="saveSettings()">Save Settings</button>
    <button class="btn btn-o" onclick="installApp()">📲 Install FitTrack Pro</button>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button class="btn btn-o" onclick="exportBackup()">⬇ Backup Data</button>
      <button class="btn btn-o" onclick="importBackup()">⬆ Restore Data</button>
    </div>
    <button class="btn btn-r" onclick="clearAll()">🗑 Clear All Data</button>
  </div>`);renderWearableStatus();}

function saveSettings(){S.profile.name=$('s-name')?.value.trim()||'Athlete';S.profile.weightKg=parseFloat($('s-bw')?.value)||100;S.profile.targetCal=parseInt($('s-cal')?.value)||2300;S.profile.targetProtein=parseInt($('s-pro')?.value)||200;S.profile.programName=$('s-prog')?.value.trim()||'My Program';S.profile.goalDays=parseInt($('s-goal')?.value)||100;S.profile.targetWeightKg=parseFloat($('s-target-w')?.value)||null;S.profile.startWeightKg=parseFloat($('s-start-w')?.value)||null;S.profile.weeklyWorkoutTarget=Math.max(1,parseInt($('s-weekly')?.value)||5);S.profile.waterTarget=Math.max(1,parseInt($('s-water')?.value)||8);const sd=$('s-start')?.value;if(sd){const [yy,mm,dd]=sd.split('-').map(Number);if(yy&&mm&&dd)S.profile.startDate=new Date(yy,mm-1,dd).toDateString();}const md=parseInt($('s-mday')?.value);S.profile.manualDay=(md>=1&&md<=S.profile.goalDays)?md:null;S.profile.audioEnabled=$('s-audio')?.checked??true;S.profile.workoutPrefs={autoRest:$('s-auto-rest')?.checked??true,defaultRest:clamp(parseInt($('s-rest-default')?.value)||90,15,1800),barWeightKg:clamp(parseFloat($('s-bar-weight')?.value)||20,5,50)};save();closeModal();go('home');toast('Settings saved ✓');}
function clearAll(){resetAllData();}

// ── SETTINGS GEAR ─────────────────────
function addSettingsBtn(){
  const btn=$('settings-btn'); if(btn)btn.onclick=openSettings;
}

window.addEventListener('error',e=>{try{console.error('FitTrack runtime error',e.error||e.message);}catch(_){}});
window.addEventListener('unhandledrejection',e=>{try{console.error('FitTrack async error',e.reason);}catch(_){}});
// ── INIT ──────────────────────────────
window.addEventListener('load',async()=>{
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  await FitTrackStorage.restoreToLocalIfMissing(KEY).catch(()=>false);
  load();migrateV3();initSeed();
  S.exerciseSearch='';S.exerciseMuscleFilter='All';S.exerciseEquipmentFilter='All';
  S.exercises=S.exercises.map((e,i)=>normalizeExercise(FT.modules.exerciseLibrary.enrichExercise(e),i));
  save();
  const draft=loadDraft();
  if(draft&&draft.startTs){S.session=draft;S.session.timerIv=setInterval(tickSession,1000);if(S.session.rest?.on)S.session.rest.iv=setInterval(tickRest,250);}
  addSettingsBtn();go('home');syncBars();renderWearableStatus();
  if(navigator.bluetooth?.getDevices){setTimeout(()=>reconnectSavedWearable().catch(()=>{}),600);}
});
