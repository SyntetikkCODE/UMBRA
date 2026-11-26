const fs=require('node:fs/promises'),path=require('node:path');
const {DEFAULT_OVERLAY,overlaySettings,overlayBounds,overlayPayload,overlayProfiles}=require('./overlay-model.cjs');
function createVoiceOverlay({BrowserWindow,screen,dataDir,root,env=process.env,changed=()=>{}}){
 let settings={...DEFAULT_OVERLAY},payload=overlayPayload(),profiles=[],window=null,loaded=false,previewTimer=null,previewing=false,closed=false,writeQueue=Promise.resolve();
 const file=path.join(dataDir,'voice-overlay.json');
 let placement=null,drag=null;
 function save(next){const task=writeQueue.catch(()=>{}).then(async()=>{await fs.mkdir(dataDir,{recursive:true});await fs.writeFile(file+'.tmp',JSON.stringify(next),'utf8');await fs.rename(file+'.tmp',file);settings=next;render();return info();});writeQueue=task;return task;}
 function info(){return {settings:{...settings},displays:displays(),editing:!!placement};}
 function interactive(value){window?.setIgnoreMouseEvents(!value);window?.setMovable(value);window?.setFocusable(value);}
 function clamp(bounds,area){return {...bounds,x:Math.round(Math.max(area.x,Math.min(bounds.x,area.x+area.width-bounds.width))),y:Math.round(Math.max(area.y,Math.min(bounds.y,area.y+area.height-bounds.height)))};}
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
  const visible=!closed&&(placement||previewing||settings.enabled&&payload.connected);
  if(!visible){interactive(false);window?.hide();return;}
  ensureWindow();if(!loaded)return;
  const shown=placement&&!payload.connected?{...overlayPayload(),label:'Position de l’overlay'}:previewing&&!placement?{...overlayPayload(),preview:true,label:'Aperçu de l’overlay'}:payload;
  const groups=new Set(shown.speakers.filter(p=>p.groupId!=='primary').map(p=>p.groupId)).size;
  if(!placement)window.setBounds(overlayBounds(display().workArea,settings.corner,shown.speakers.length,shown.extra,groups,settings.position),false);
  interactive(!!placement);window.webContents.send('voice-overlay:render',{...shown,editing:!!placement});if(!window.isVisible())window.showInactive();
 }
 const reposition=()=>render();for(const e of ['display-added','display-removed','display-metrics-changed'])screen.on(e,reposition);
 return {
  async open(){try{settings=overlaySettings(JSON.parse(await fs.readFile(file,'utf8')));}catch{}return this.info();},
  info,
  configure(value){if(placement)throw new Error('Valide ou annule le placement en cours.');return save(overlaySettings(value));},
  owns(event){return !!window&&event.sender===window.webContents&&event.senderFrame===window.webContents.mainFrame&&event.senderFrame.url==='umbra://app/overlay.html';},
  beginPlacement(){if(placement)return info();clearTimeout(previewTimer);previewing=false;ensureWindow();const area=display().workArea,groups=new Set(payload.speakers.filter(p=>p.groupId!=='primary').map(p=>p.groupId)).size,normal=overlayBounds(area,settings.corner,payload.speakers.length,payload.extra,groups,settings.position);placement={original:normal,initial:clamp({...normal,height:Math.min(normal.height+84,area.height)},area)};window.setBounds(placement.initial,false);render();changed(info());return info();},
  dragStart(){if(placement&&window)drag={cursor:{...screen.getCursorScreenPoint()},bounds:window.getBounds()};},
  dragMove(){if(!placement||!drag||!window)return;const cursor=screen.getCursorScreenPoint(),d=env.UMBRA_TEST_DISPLAY==='right'&&env.UMBRA_DATA_DIR?display():screen.getDisplayNearestPoint(cursor);window.setBounds(clamp({...drag.bounds,x:drag.bounds.x+cursor.x-drag.cursor.x,y:drag.bounds.y+cursor.y-drag.cursor.y},d.workArea),false);},
  dragEnd(){drag=null;},
  async finishPlacement(commit){if(!placement)return info();const bounds=window.getBounds(),moved=bounds.x!==placement.initial.x||bounds.y!==placement.initial.y,point=moved?bounds:placement.original,d=screen.getDisplayMatching(point),next=overlaySettings({...settings,displayId:d.id,position:{x:Math.max(0,point.x-d.workArea.x),y:Math.max(0,point.y-d.workArea.y)}});if(commit)await save(next);placement=null;drag=null;render();const value=info();changed(value);return value;},
  update(value){payload=overlayPayload(value);render();},
  profiles(value){profiles=overlayProfiles(value);if(loaded&&window&&!window.isDestroyed())window.webContents.send('voice-overlay:profiles',profiles);},
  clear(){payload=overlayPayload();previewing=false;placement=null;drag=null;clearTimeout(previewTimer);interactive(false);render();changed(info());},
  preview(){clearTimeout(previewTimer);previewing=true;render();previewTimer=setTimeout(()=>{previewing=false;render();},5000);},
  close(){closed=true;clearTimeout(previewTimer);for(const e of ['display-added','display-removed','display-metrics-changed'])screen.removeListener(e,reposition);window?.destroy();}
 };
}
module.exports={createVoiceOverlay};
