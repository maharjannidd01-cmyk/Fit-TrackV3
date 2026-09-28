/* FitTrack Pro v14 — workout domain engine. DOM-free and testable. */
(function(){
  const FT=window.FitTrack=window.FitTrack||{};
  function buildSetLogs(plan,exerciseResolver){
    const setLogs={};(plan?.exercises||[]).forEach((pe,i)=>{const ex=exerciseResolver(pe.exId);const cnt=ex?.isCardio?1:Math.max(1,parseInt(pe.sets)||3);setLogs[i]=Array.from({length:cnt},(_,si)=>({exName:ex?.name||'',setNum:si+1,weight:'',reps:'',done:false}));});return setLogs;
  }
  function progress(session){const sets=Object.values(session?.setLogs||{}).flat(),done=sets.filter(s=>s.done).length;return{total:sets.length,done,pct:sets.length?Math.round(done/sets.length*100):0};}
  function volume(session){return Math.round(Object.values(session?.setLogs||{}).flat().reduce((v,s)=>v+(s.done&&s.weight!==''&&s.reps!==''?(parseFloat(s.weight)||0)*(parseInt(s.reps)||0):0),0));}
  function completedSets(session){return Object.values(session?.setLogs||{}).flat().filter(s=>s.done).length;}
  function nextIncompleteIndex(session,exIdx,setIdx){const sets=session?.setLogs?.[exIdx]||[];for(let i=setIdx+1;i<sets.length;i++)if(!sets[i].done)return i;return null;}
  FT.register('workout',{buildSetLogs,progress,volume,completedSets,nextIncompleteIndex});
})();
