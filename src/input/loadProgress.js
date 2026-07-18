const DEFS={manifest:{weight:.12,label:'讀取村莊配置與資產清單'},fonts:{weight:.08,label:'準備介面字型'},gl:{weight:.16,label:'建立 WebGL 渲染環境'},physics:{weight:.22,label:'建立碰撞與物理世界'},scene:{weight:.24,label:'配置道路、建築與互動物件'},frame:{weight:.18,label:'預熱材質並確認第一幀'}};
const stages=Object.fromEntries(Object.keys(DEFS).map(k=>[k,0])); const listeners=new Set(); let started=false; let error=null;
function notify(){listeners.forEach(fn=>fn(getLoadSnapshot()));}
export function setStep(name,value){if(!(name in stages))return; stages[name]=Math.max(stages[name],Math.min(1,value)); notify();}
export function setLoadError(message){error=message||'Unknown loading error.';notify();}
export function clearLoadError(){error=null;notify();}
export function getLoadProgress(){return Math.round(Object.entries(stages).reduce((n,[k,v])=>n+v*DEFS[k].weight,0)*100);}
export function getCurrentLoadStage(){const e=Object.entries(stages).find(([,v])=>v<1);return e?{key:e[0],label:DEFS[e[0]].label}:{key:'complete',label:'準備完成'};}
export function isAllReady(){return !error&&Object.values(stages).every(v=>v>=1);}
export function getLoadSnapshot(){return {progress:getLoadProgress(),stage:getCurrentLoadStage(),error,ready:isAllReady(),stages:{...stages}};}
export function subscribeLoad(fn){listeners.add(fn);return()=>listeners.delete(fn);}
export function beginRealLoad(){if(started)return;started=true;clearLoadError();fetch(`${import.meta.env.BASE_URL}manifests/village-manifest.json`,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}).then(m=>{if(!m?.sceneId||!Array.isArray(m.assetGroups))throw new Error('Village manifest is invalid.');setStep('manifest',1);}).catch(e=>setLoadError(`場景資產清單讀取失敗：${e.message}`));if(document?.fonts?.ready)document.fonts.ready.then(()=>setStep('fonts',1)).catch(()=>setStep('fonts',1));else setStep('fonts',1);}
export function resetLoadProgress(){Object.keys(stages).forEach(k=>stages[k]=0);error=null;started=false;notify();}
