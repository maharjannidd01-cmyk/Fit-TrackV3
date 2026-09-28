/* FitTrack Pro v16 — Exercise Intelligence domain module. */
(function(){
  const FT=window.FitTrack=window.FitTrack||{};
  const muscles=['Chest','Back','Shoulders','Biceps','Triceps','Legs','Glutes','Core','Cardio','Full Body'];
  const KB=[
    {re:/dumbbell bench/i,equipment:'Dumbbell',movement:'Horizontal Push',primaryMuscle:'Chest',secondaryMuscles:['Triceps','Shoulders']},
    {re:/bench press|pec dec|push-up/i,equipment:'Barbell / Bodyweight',movement:'Horizontal Push',primaryMuscle:'Chest',secondaryMuscles:['Triceps','Shoulders']},
    {re:/lat pulldown|straight arm pulldown/i,equipment:'Cable',movement:'Vertical Pull',primaryMuscle:'Back',secondaryMuscles:['Biceps']},
    {re:/row/i,equipment:'Cable / Barbell',movement:'Horizontal Pull',primaryMuscle:'Back',secondaryMuscles:['Biceps','Rear Delts']},
    {re:/face pull|lateral raise|shoulder press/i,equipment:'Dumbbell / Cable',movement:'Shoulder',primaryMuscle:'Shoulders',secondaryMuscles:['Triceps','Upper Back']},
    {re:/curl|preacher/i,equipment:'Dumbbell / Cable',movement:'Elbow Flexion',primaryMuscle:'Biceps',secondaryMuscles:['Forearms']},
    {re:/triceps|skull crusher|overhead extension/i,equipment:'Cable / Free Weight',movement:'Elbow Extension',primaryMuscle:'Triceps',secondaryMuscles:['Shoulders']},
    {re:/squat|leg press|leg extension|lunge|jump squat/i,equipment:'Barbell / Machine',movement:'Knee Dominant',primaryMuscle:'Legs',secondaryMuscles:['Glutes','Core']},
    {re:/rdl|deadlift|leg curl/i,equipment:'Barbell / Machine',movement:'Hip Hinge',primaryMuscle:'Legs',secondaryMuscles:['Glutes','Hamstrings']},
    {re:/hip thrust/i,equipment:'Barbell / Machine',movement:'Hip Extension',primaryMuscle:'Glutes',secondaryMuscles:['Legs','Core']},
    {re:/calf|tibialis/i,equipment:'Machine / Bodyweight',movement:'Ankle',primaryMuscle:'Legs',secondaryMuscles:['Calves']},
    {re:/plank|abs|leg raise|cable crunch|russian twist/i,equipment:'Bodyweight / Cable',movement:'Core Stability',primaryMuscle:'Core',secondaryMuscles:['Hip Flexors']},
    {re:/treadmill|cycling|rowing|hiit/i,equipment:'Cardio Machine',movement:'Cardio',primaryMuscle:'Cardio',secondaryMuscles:[],exerciseType:'Cardio'},
    {re:/burpees|kettlebell swings/i,equipment:'Bodyweight / Kettlebell',movement:'Full Body',primaryMuscle:'Full Body',secondaryMuscles:['Legs','Core']}
  ];
  function profile(ex){
    ex=ex||{};const name=String(ex.name||'');let p={equipment:ex.equipment||'',movement:ex.movement||'',primaryMuscle:ex.primaryMuscle||ex.muscleGroup||'Full Body',secondaryMuscles:Array.isArray(ex.secondaryMuscles)?ex.secondaryMuscles:[],difficulty:ex.difficulty||'Intermediate',exerciseType:ex.exerciseType||(ex.isCardio?'Cardio':'Strength'),guidance:ex.note||''};
    const hit=KB.find(k=>k.re.test(name));if(hit){p={...p,...hit,secondaryMuscles:(ex.secondaryMuscles&&ex.secondaryMuscles.length?ex.secondaryMuscles:hit.secondaryMuscles||[])};}
    if(!muscles.includes(p.primaryMuscle))p.primaryMuscle=ex.muscleGroup||'Full Body'; return p;
  }
  function enrichExercise(ex){const p=profile(ex);return {...ex,equipment:p.equipment||'General',movement:p.movement||'General',primaryMuscle:p.primaryMuscle,secondaryMuscles:p.secondaryMuscles,difficulty:p.difficulty,exerciseType:p.exerciseType};}
  function parseReps(v){const m=String(v??'').match(/\d+/);return m?Number(m[0]):0;}
  function estimate1RM(w,r){w=Number(w);r=Number(r);return w>0&&r>0?w*(1+r/30):0;}
  function history(exName,logs){const rows=[];Object.entries(logs||{}).forEach(([date,log])=>{let sets=0,volume=0,topWeight=0,bestE1RM=0;(log.sessions||[]).forEach(sess=>Object.values(sess.setLogs||{}).forEach(arr=>arr.forEach(set=>{if(set.done&&String(set.exName||'')===String(exName)){const w=Number(set.weight)||0,r=parseReps(set.reps);sets++;volume+=w*r;topWeight=Math.max(topWeight,w);bestE1RM=Math.max(bestE1RM,estimate1RM(w,r));}})));if(sets)rows.push({date,sets,volume,topWeight,bestE1RM});});return rows.sort((a,b)=>String(b.date).localeCompare(String(a.date)));}
  function findSubstitutes(ex,all){const p=profile(ex);return (all||[]).filter(x=>x.id!==ex.id).map(x=>{const q=profile(x);let score=0;if(q.primaryMuscle===p.primaryMuscle)score+=6;if(q.movement===p.movement)score+=5;if(q.exerciseType===p.exerciseType)score+=1;return {x,score};}).filter(z=>z.score>=6).sort((a,b)=>b.score-a.score||a.x.name.localeCompare(b.x.name)).map(z=>z.x);}
  function planBalance(plan,all){const c={};let total=0;(plan?.exercises||[]).forEach(pe=>{const ex=(all||[]).find(x=>x.id===pe.exId);if(!ex)return;const m=profile(ex).primaryMuscle||ex.muscleGroup||'Full Body',n=Math.max(0,Number(pe.sets)||0);c[m]=(c[m]||0)+n;total+=n;});const rows=Object.entries(c).sort((a,b)=>b[1]-a[1]),max=rows[0]?.[1]||1;return `<div class="balance-head"><div class="balance-title">Muscle Balance</div><div class="balance-total">${total} planned sets</div></div><div class="balance-bars">${rows.length?rows.map(([m,n])=>`<div class="balance-row"><span>${m}</span><div class="balance-track"><i style="width:${Math.round(n/max*100)}%"></i></div><b>${n}</b></div>`).join(''):`<div class="detail-note">Add exercises to see distribution.</div>`}</div>`;}
  FT.modules=FT.modules||{};FT.modules.exerciseLibrary={profile,enrichExercise,history,findSubstitutes,planBalance,estimate1RM,parseReps};
})();
