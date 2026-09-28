/* FitTrack Pro v14 — persistence boundary.
 * localStorage remains the synchronous compatibility store; IndexedDB is a
 * shadow repository used for recovery and as the migration path to durable data.
 */
(function(){
  const FT=window.FitTrack=window.FitTrack||{};
  const DB_NAME='FitTrackProDB', DB_VERSION=1, SNAPSHOT='app_state';
  const Storage={
    get(key){try{return localStorage.getItem(key)}catch(e){FT.warn('storage.get',e);return null}},
    set(key,value){try{localStorage.setItem(key,value);return true}catch(e){FT.warn('storage.set',e);return false}},
    remove(key){try{localStorage.removeItem(key);return true}catch(e){FT.warn('storage.remove',e);return false}},
    json(key,fallback=null){const raw=this.get(key);if(raw==null)return fallback;try{return JSON.parse(raw)}catch(e){FT.warn('storage.json',e);return fallback}},
    available(){try{const k='__ft_probe__';localStorage.setItem(k,'1');localStorage.removeItem(k);return true}catch(e){return false}}
  };
  let dbPromise=null;
  function openDB(){
    if(!('indexedDB' in window))return Promise.resolve(null);
    if(dbPromise)return dbPromise;
    dbPromise=new Promise(resolve=>{
      try{
        const req=indexedDB.open(DB_NAME,DB_VERSION);
        req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('snapshots'))db.createObjectStore('snapshots',{keyPath:'id'});};
        req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null);
      }catch(e){resolve(null)}
    });
    return dbPromise;
  }
  async function idbPut(payload){const db=await openDB();if(!db)return false;return new Promise(resolve=>{try{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put({id:SNAPSHOT,savedAt:Date.now(),payload});tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false);}catch(e){resolve(false)}})}
  async function idbGet(){const db=await openDB();if(!db)return null;return new Promise(resolve=>{try{const tx=db.transaction('snapshots','readonly'),req=tx.objectStore('snapshots').get(SNAPSHOT);req.onsuccess=()=>resolve(req.result?.payload||null);req.onerror=()=>resolve(null);}catch(e){resolve(null)}})}
  async function idbClear(){const db=await openDB();if(!db)return false;return new Promise(resolve=>{try{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').clear();tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false);}catch(e){resolve(false)}})}
  async function restoreToLocalIfMissing(primaryKey){
    if(Storage.get(primaryKey))return false;
    const payload=await idbGet();
    if(!payload||typeof payload!=='object')return false;
    try{Storage.set(primaryKey,JSON.stringify(payload));return true}catch(e){return false}
  }
  const api={Storage,async putSnapshot(payload){try{return await idbPut(payload)}catch(e){return false}},getSnapshot:idbGet,clearSnapshot:idbClear,restoreToLocalIfMissing,dbName:DB_NAME};
  FT.storage=api;FT.register('storage',api);
  window.FitTrackStorage=api;
})();
