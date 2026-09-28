/* FitTrack Pro v14 — pure analytics functions. No DOM or persistence access. */
(function(){
  const FT=window.FitTrack=window.FitTrack||{};
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const todayKey=()=>new Date().toDateString();
  function foodProtein(food){return Math.round(num(food?.p)*num(food?.qty||1)*10)/10;}
  function dayProtein(log){return (log?.foods||[]).reduce((s,f)=>s+foodProtein(f),0);}
  function setVolume(set){return set?.done&&set.weight!==''&&set.reps!==''?num(set.weight)*num(set.reps):0;}
  function sessionVolume(sess){return Object.values(sess?.setLogs||{}).flat().reduce((s,set)=>s+setVolume(set),0);}
  function rangeStats(logs,profile,days=7,now=new Date()){
    const out={sessions:0,volume:0,proteinDays:0,loggedDays:0,waterDays:0};
    for(let i=0;i<days;i++){
      const d=new Date(now);d.setDate(d.getDate()-i);const k=d.toDateString(),l=logs?.[k];if(!l)continue;
      const sess=l.sessions||[];out.sessions+=sess.length;out.volume+=sess.reduce((v,se)=>v+sessionVolume(se),0);
      if(dayProtein(l)>0)out.proteinDays++;
      if(sess.length||(l.foods||[]).length||l.bodyWeight||l.water)out.loggedDays++;
      if((l.water||0)>=(profile?.waterTarget||8))out.waterDays++;
    }
    out.volume=Math.round(out.volume);return out;
  }
  function calcTrainingScore(logs,profile){
    const r=rangeStats(logs,profile,7),target=Math.max(1,parseInt(profile?.weeklyWorkoutTarget)||5);
    const sessionPart=Math.min(100,Math.round(r.sessions/target*100));
    const proteinPart=Math.min(100,Math.round(r.proteinDays/7*100));
    const waterPart=Math.min(100,Math.round(r.waterDays/7*100));
    return Math.max(0,Math.min(100,Math.round(sessionPart*.5+proteinPart*.25+waterPart*.25)));
  }
  function calcPRs(logs){const prs={};Object.entries(logs||{}).forEach(([d,l])=>(l.sessions||[]).forEach(sess=>Object.values(sess.setLogs||{}).forEach(sets=>sets.forEach(set=>{if(!set.done||!set.weight||!set.exName)return;const w=num(set.weight);if(!prs[set.exName]||w>prs[set.exName].weight)prs[set.exName]={weight:w,reps:set.reps,date:d};}))));return prs;}
  function calcTotalVolume(logs){return Math.round(Object.values(logs||{}).reduce((v,l)=>v+(l.sessions||[]).reduce((s,se)=>s+sessionVolume(se),0),0));}
  function sessionMaxWeight(sess){let max=0,exercise='';Object.values(sess?.setLogs||{}).forEach(sets=>sets.forEach(s=>{const w=num(s.weight);if(s.done&&w>max){max=w;exercise=s.exName||'';}}));return{weight:max,exercise};}
  function sessionHR(sess){const a=(sess?.heartRateSamples||[]).map(x=>num(x?.bpm)).filter(n=>n>0);return{avg:a.length?Math.round(a.reduce((s,n)=>s+n,0)/a.length):null,max:a.length?Math.max(...a):null};}
  function estimate1RM(weight,reps){const w=num(weight),r=parseInt(reps)||0;return w&&r?Math.round(w*(1+r/30)):0;}
  function latestBodyWeight(logs){const rows=Object.entries(logs||{}).filter(([,l])=>l&&l.bodyWeight).sort(([a],[b])=>new Date(b)-new Date(a));return rows.length?num(rows[0][1].bodyWeight):null;}
  function goalProgress(logs,profile,dayNumber){const current=latestBodyWeight(logs),start=num(profile?.startWeightKg||profile?.weightKg),target=num(profile?.targetWeightKg);let weightPct=null;if(start&&target&&current!=null&&start!==target)weightPct=Math.max(0,Math.min(100,Math.round((current-start)/(target-start)*100)));const days=Math.max(1,dayNumber);const sessions=Object.values(logs||{}).reduce((n,l)=>n+(l.sessions||[]).length,0);return{current,start,target,weightPct,sessions,weeks:Math.max(1,Math.ceil(days/7)),weeklyTarget:parseInt(profile?.weeklyWorkoutTarget)||5};}
  FT.register('metrics',{rangeStats,calcTrainingScore,calcPRs,calcTotalVolume,sessionMaxWeight,sessionHR,estimate1RM,latestBodyWeight,goalProgress,sessionVolume,todayKey});
})();
