const fs=require('node:fs/promises'),path=require('node:path');
const {DEFAULT_OVERLAY,overlaySettings,overlayBounds,overlayPayload,overlayProfiles}=require('./overlay-model.cjs');
function createVoiceOverlay({BrowserWindow,screen,dataDir,root,env=process.env}){
 let settings={...DEFAULT_OVERLAY},payload=overlayPayload(),profiles=[],window=null,loaded=false,previewTimer=null,previewing=false,closed=false,writeQueue=Promise.resolve();
 const file=path.join(dataDir,'voice-overlay.json');
 function displays(){return screen.getAllDisplays().map((d,i)=>({id:d.id,label:d.label||'Écran '+(i+1),primary:d.id===screen.getPrimaryDisplay().id}));}
 function display(){
  if(env.UMBRA_TEST_DISPLAY==='right'&&env.UMBRA_DATA_DIR){const p=require('./test-window.cjs').testWindowPlacement(screen,env);return screen.getDisplayNearestPoint({x:p.x,y:p.y});}
  return screen.getAllDisplays().find(d=>d.id===settings.displayId)||screen.getPrimaryDisplay();
 }
 function ensureWindow(){
  if(closed||window&&!window.isDestroyed())return;
  window=new BrowserWindow({...overlayBounds(display().workArea,settings.corner,payload.speakers.length),title:'HEXAGONE — Overlay vocal',frame:false,transparent:true,backgroundColor:'#00000000',resizable:false,movable:false,minimizable:false,maximizable:false,fullscreenable:false,focusable:false,skipTaskbar:true,alwaysOnTop:true,hasShadow:false,show:false,webPreferences:{preload:path.join(root,'overlay-preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false,focusOnNavigation:false}});
  window.setIgnoreMouseEvents(true);window.setAlwaysOnTop(true,'screen-saver');
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',e=>e.preventDefault());
  window.webContents.once('did-finish-load',()=>{loaded=true;window.webContents.send('voice-overlay:profiles',profiles);render();});
  window.on('closed',()=>{window=null;loaded=false;});window.loadURL('umbra://app/overlay.html');
 }
 function render(){
  const visible=!closed&&(previewing||settings.enabled&&payload.connected);
  if(!visible){window?.hide();return;}
  ensureWindow();if(!loaded)return;
  const shown=previewing?{...overlayPayload(),preview:true,label:'Aperçu de l’overlay'}:payload;
  const groups=new Set(shown.speakers.filter(p=>p.groupId!=='primary').map(p=>p.groupId)).size;
  window.setBounds(overlayBounds(display().workArea,settings.corner,shown.speakers.length,shown.extra,groups),false);
  window.webContents.send('voice-overlay:render',shown);if(!window.isVisible())window.showInactive();
 }
 const reposition=()=>render();for(const e of ['display-added','display-removed','display-metrics-changed'])screen.on(e,reposition);
 return {
  async open(){try{settings=overlaySettings(JSON.parse(await fs.readFile(file,'utf8')));}catch{}return this.info();},
  info(){return {settings:{...settings},displays:displays()};},
  configure(value){const next=overlaySettings(value);const task=writeQueue.catch(()=>{}).then(async()=>{await fs.mkdir(dataDir,{recursive:true});await fs.writeFile(file+'.tmp',JSON.stringify(next),'utf8');await fs.rename(file+'.tmp',file);settings=next;render();return this.info();});writeQueue=task;return task;},
  update(value){payload=overlayPayload(value);render();},
  profiles(value){profiles=overlayProfiles(value);if(loaded&&window&&!window.isDestroyed())window.webContents.send('voice-overlay:profiles',profiles);},
  clear(){payload=overlayPayload();previewing=false;clearTimeout(previewTimer);render();},
  preview(){clearTimeout(previewTimer);previewing=true;render();previewTimer=setTimeout(()=>{previewing=false;render();},5000);},
  close(){closed=true;clearTimeout(previewTimer);for(const e of ['display-added','display-removed','display-metrics-changed'])screen.removeListener(e,reposition);window?.destroy();}
 };
}
module.exports={createVoiceOverlay};
