const fs=require('node:fs');
const path=require('node:path');
const {NsisUpdater}=require('electron-updater');
const {SignedUpdateProvider}=require('./signed-update-provider.cjs');
const {verifyInstaller}=require('./update-verification.cjs');
function updateFeed(value='https://umbra.lotus-order.fr/umbra-updates/'){
 const url=new URL(value);
 if(url.username||url.password||url.search||url.hash||!(url.protocol==='https:'||url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname)))throw new Error('Adresse de mise à jour invalide.');
 return url.href.endsWith('/')?url.href:url.href+'/';
}
function createUpdates({app,changed=()=>{},beforeInstall=async()=>{},feed=process.env.UMBRA_UPDATE_FEED_URL,isInstalled,makeUpdater=options=>new NsisUpdater(options),verifyDownload=verifyInstaller,pollMs=60000}={}){
 const installed=isInstalled??(app.isPackaged&&fs.existsSync(path.join(path.dirname(process.execPath),'umbra-installed')));
 let state={phase:installed?'checking':'portable',currentVersion:app.getVersion(),version:'',percent:0,startup:true,installed,message:''},updater=null,running=null,expected=null,readyResolve;
 let poll=null,stopped=false;
 const ready=new Promise(resolve=>readyResolve=resolve);
 const set=values=>{state={...state,...values};changed(state);};
 const finish=()=>{set({startup:false});readyResolve(state);};
 if(installed){
  updater=makeUpdater({provider:'custom',updateProvider:SignedUpdateProvider,url:updateFeed(feed),useMultipleRangeRequest:false});
  updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.allowDowngrade=false;updater.disableWebInstaller=true;updater.disableDifferentialDownload=true;
  updater.logger={info:()=>{},warn:()=>{},debug:()=>{},error:()=>{}};
  updater.on('error',()=>{});
  updater.on('download-progress',progress=>set({phase:'downloading',percent:Math.min(100,Math.round(progress.percent))}));
 }
 async function install(){
  if(!updater||state.phase!=='ready'||!expected)throw new Error('Aucune mise à jour prête.');
  await verifyDownload(updater.installerPath,expected);
  set({phase:'installing',percent:100});await beforeInstall();updater.quitAndInstall(true,true);
 }
 async function check(startup=false,download=true){
  if(running)return running;
  if(!startup&&['ready','installing'].includes(state.phase))return state;
  const task=(async()=>{
   try{
    if(!installed){finish();return state;}
    if(download)set({phase:'checking',startup,message:''});
    const result=await updater.checkForUpdates();
    if(!result?.isUpdateAvailable){set({phase:'current',version:'',message:'UMBRA est à jour.'});if(download)finish();return state;}
    expected=result.updateInfo.files[0];
    if(!download){set({phase:'available',startup:false,version:result.updateInfo.version,percent:0,message:''});return state;}
    set({phase:'downloading',version:result.updateInfo.version,percent:0});
    await updater.downloadUpdate();await verifyDownload(updater.installerPath,expected);set({phase:'ready',percent:100});
    if(startup){await install();}else finish();
   }catch(e){if(download){set({phase:'error',message:e.message});finish();}}
   return state;
  })();running=task;try{return await task;}finally{running=null;}
 }
 const stop=()=>{stopped=true;clearInterval(poll);poll=null;};
 async function start(){await check(true);if(installed&&!stopped&&!poll){poll=setInterval(()=>{if(!running&&!['ready','installing','downloading'].includes(state.phase))check(false,false);},pollMs);poll.unref?.();}}
 return {status:()=>state,ready,start,check:async()=>{if(running)await running;return check(false);},probe:()=>check(false,false),install,installed,stop};
}
module.exports={createUpdates,updateFeed};
