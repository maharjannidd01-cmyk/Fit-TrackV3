/* FitTrack Pro v14 — runtime namespace and lightweight app diagnostics. */
(function(){
  const FT=window.FitTrack=window.FitTrack||{};
  FT.version='15.0.0';
  FT.modules=FT.modules||{};
  FT.config={
    storageKeyPrefix:'fittrack_pro_v',
    maxWorkoutSets:30,
    maxPlans:200,
    maxExercises:2000,
    maxLogs:4000,
    draftTtlMs:12*60*60*1000
  };
  FT.register=function(name,api){FT.modules[name]=api;FT[name]=api;return api;};
  FT.warn=function(scope,error){try{console.warn('[FitTrack:'+scope+']',error);}catch(_){} };
})();
