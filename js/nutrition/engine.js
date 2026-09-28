/* FitTrack Nutrition Engine v17: pure nutrition calculations and serving helpers. */
(function(){
 const round=(n,d=1)=>Math.round((Number(n)||0)*10**d)/10**d;
 const per=(food,grams)=>{const q=Math.max(0,Number(grams)||0)/100;return {cal:round((food.cal||0)*q),p:round((food.p||0)*q),c:round((food.c||0)*q),f:round((food.f||0)*q)};};
 const totals=items=>(items||[]).reduce((a,x)=>{const q=Math.max(0,Number(x.qty)||1);a.cal+=Number(x.cal||0)*q;a.p+=Number(x.p||0)*q;a.c+=Number(x.c||0)*q;a.f+=Number(x.f||0)*q;return a;},{cal:0,p:0,c:0,f:0});
 const macroPct=(actual,target)=>target>0?Math.min(100,Math.round(actual/target*100)):0;
 window.FitTrack=window.FitTrack||{};window.FitTrack.register?window.FitTrack.register('nutrition',{per100:per,totals,macroPct}):(window.FitTrack.nutrition={per100:per,totals,macroPct});
})();
