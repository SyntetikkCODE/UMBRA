const { app, BrowserWindow, ipcMain, protocol, net, session, dialog, nativeImage, shell, safeStorage, clipboard, desktopCapturer } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
protocol.registerSchemesAsPrivileged([{ scheme: 'umbra', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
app.setName('UMBRA');
app.setPath('userData',path.join(app.getPath('appData'),'UMBRA'));
if (process.env.UMBRA_DATA_DIR) app.setPath('userData', path.resolve(process.env.UMBRA_DATA_DIR));
if (!app.requestSingleInstanceLock()) { app.quit(); } else {
let win;
let accounts;
let startupError;
let remote=null;
let audioPreferences=null;
let ptt;
let updates;
let defaultAudio;
const captureSelection=require('./src/screen-capture.cjs').createCaptureSelection();
const {mediaPermissionCheck,mediaPermissionRequest}=require('./src/media-permissions.cjs');
const withPreferences=state=>({...state,settings:{...defaultAudio,...(remote?audioPreferences:state.settings)}});

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
const trusted = e => e.sender === win?.webContents && e.senderFrame?.url.startsWith('umbra://app/');
const guard = e => { if (!trusted(e)) throw new Error('Origine refusée'); };
function createWindow() {
  win = new BrowserWindow({ width: 1540, height: 990, minWidth: 1120, minHeight: 740, frame: false, backgroundColor: '#101010', show: false, title: 'UMBRA — Wardogs Companion', icon: path.join(__dirname, 'assets/umbra.ico'), webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('umbra://app/')) e.preventDefault(); });
  win.once('ready-to-show', () => win.show());
  win.loadURL('umbra://app/index.html');
}
app.whenReady().then(async () => {
  const {DEFAULT_AUDIO}=await import('./src/audio.mjs');defaultAudio=DEFAULT_AUDIO;
  const { Accounts } = await import('./src/accounts.mjs');
  accounts = new Accounts(app.getPath('userData'));
  try { await accounts.open(); } catch(error) { startupError=error.message; }
  const {Remote,serverUrl}=await import('./src/remote.mjs');
  const {createPtt}=require('./src/ptt.cjs');
  ptt=createPtt(held=>{if(win&&!win.isDestroyed())win.webContents.send('voice:keys',held);});
  const preferencesFile=path.join(app.getPath('userData'),'connection.json');
  let saved={};try{saved=JSON.parse(await fs.readFile(preferencesFile,'utf8'));}catch{}
  audioPreferences={...defaultAudio,...(saved.audioPreferences||accounts.db?.state?.settings)};
  const setRemote=url=>{
    remote?.close();remote=url?new Remote(url,event=>{
      if(event.type==='state')event.state=withPreferences(event.state);
      if(win&&!win.isDestroyed())win.webContents.send('network:event',event);
    }):null;
  };
  const configured=process.env.UMBRA_SERVER_URL || (process.env.UMBRA_OFFLINE?'':saved.url ?? 'https://lotus-order.fr/umbra-api');
  setRemote(configured);
  const saveConnection=()=>fs.mkdir(app.getPath('userData'),{recursive:true}).then(()=>fs.writeFile(preferencesFile,JSON.stringify({url:remote?.base||'',audioPreferences}),'utf8'));
  const {RememberedSession}=require('./src/remembered-session.cjs');
  const remembered=new RememberedSession(app.getPath('userData'),safeStorage);
  const authenticate=async(kind,credentials)=>{
    const remember=credentials?.remember===true;
    if(remember&&!safeStorage.isEncryptionAvailable())throw new Error('Windows ne permet pas de protéger la session sur ce PC.');
    await remembered.clear();
    const r=remote?await remote.auth(kind,{...credentials,remember}):await accounts[kind](credentials);
    if(remember)await remembered.save(remote?{base:remote.base,token:remote.token}:{base:'',userId:r.state.currentUserId});
    r.state=withPreferences(r.state);return r;
  };

  protocol.handle('umbra', request => {
    const url = new URL(request.url);
    if (url.hostname !== 'app') return new Response('', { status: 403 });
    const file = path.resolve(__dirname, '.' + decodeURIComponent(url.pathname));
    const relative = path.relative(__dirname, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return new Response('', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback, details) => {
    const internal=wc === win?.webContents && wc.getURL().startsWith('umbra://app/');
    callback(mediaPermissionRequest(internal&&(permission!=='fullscreen'||details.isMainFrame!==false),permission,details.mediaTypes,captureSelection.pending()));
  });
  session.defaultSession.setPermissionCheckHandler((wc, permission, origin, details) => mediaPermissionCheck(wc===win?.webContents,permission,origin,details.mediaType));
  session.defaultSession.setDisplayMediaRequestHandler(async(request,callback)=>{
    if(request.frame!==win?.webContents.mainFrame||!request.frame.url.startsWith('umbra://app/'))return callback(null);
    const chosen=captureSelection.consume();if(!chosen)return callback(null);
    try{const sources=await desktopCapturer.getSources({types:['screen','window'],thumbnailSize:{width:0,height:0}}),source=sources.find(s=>s.id===chosen.id);callback(source?{video:source,...(chosen.audio&&request.audioRequested?{audio:'loopback'}:{})}:null);}catch{callback(null);}
  });
  const handle = (channel, fn) => ipcMain.handle(channel, async (e, ...args) => {
    guard(e); if(startupError&&!remote&&!channel.startsWith('network:')&&!channel.startsWith('updates:')) throw new Error(startupError); return fn(...args);
  });
  const {createUpdates}=require('./src/updates.cjs');
  updates=createUpdates({app,changed:state=>{if(win&&!win.isDestroyed())win.webContents.send('updates:state',state);},beforeInstall:async()=>{ptt.stop();remote?.close();await accounts.queue;}});
  handle('updates:status',()=>updates.status());
  handle('updates:ready',()=>updates.ready);
  handle('updates:check',()=>updates.check());
  handle('updates:install',()=>updates.install());
  handle('auth:status', async()=>remote?{...await remote.request('health'),shared:true,baseUrl:remote.base}:{...accounts.status(),shared:false});
  handle('text:copy',text=>{if(typeof text!=='string'||text.length>20000)throw new Error('Texte invalide.');clipboard.writeText(text);return true;});
  handle('auth:register',credentials=>authenticate('register',credentials));
  handle('auth:login',credentials=>authenticate('login',credentials));
  handle('auth:reset',async credentials=>{if(remote)return remote.request('auth/reset',credentials);const r=await accounts.resetPassword(credentials);await remembered.clear();return {ok:true};});
  handle('auth:reset-code',async playerId=>remote?remote.request('admin/password-reset',{playerId}):accounts.beginPasswordReset(playerId));
  handle('auth:resume',async()=>{
    const savedSession=await remembered.load(remote?.base||'');if(!savedSession)return null;
    try{const r=remote?await remote.resume(savedSession.token):accounts.session(savedSession.userId);if(!remote)accounts.userId=savedSession.userId;r.state=withPreferences(r.state);return r;}
    catch(error){if(!remote||error.status===401)await remembered.clear();return null;}
  });
  handle('auth:logout', async()=>{ptt.stop();await remembered.clear();if(remote)await remote.logout().catch(()=>{});else await accounts.logout();});
  handle('auth:tutorial', ()=>remote?remote.request('tutorial',{}):accounts.tutorialDone());
  handle('state:load', async()=>{const r=remote?await remote.request('state'):accounts.session();r.state=withPreferences(r.state);return r;});
  handle('state:action', async action=>{
    if(remote&&action.type==='settings'){const current=await remote.request('state');const nextPreferences={...withPreferences(current.state).settings,...action.values};const {validateState}=await import('./src/model.mjs');validateState({...current.state,settings:nextPreferences});audioPreferences=nextPreferences;await saveConnection();return withPreferences(current.state);}
    const state=remote?(await remote.request('action',action)).state:await accounts.action(action);return withPreferences(state);
  });
  handle('state:replace', async state=>withPreferences(remote?(await remote.request('replace',state)).state:await accounts.replace(state)));
  handle('profile:picture', async()=>{
    if(remote)await remote.request('state');else accounts.session();
    const result=await dialog.showOpenDialog(win,{title:'Choisir une photo de profil',filters:[{name:'Images',extensions:['png','jpg','jpeg','webp']}],properties:['openFile']});
    if(result.canceled)return null;
    const file=result.filePaths[0];if((await fs.stat(file)).size>5000000)throw new Error('Choisis une image de moins de 5 Mo.');
    const img=nativeImage.createFromBuffer(await fs.readFile(file));if(img.isEmpty())throw new Error('Cette image ne peut pas être ouverte.');
    const {width,height}=img.getSize();if(width*height>16000000)throw new Error('Image trop grande (16 mégapixels maximum).');
    const side=Math.min(width,height),normalized=img.crop({x:Math.floor((width-side)/2),y:Math.floor((height-side)/2),width:side,height:side}).resize({width:160,height:160,quality:'best'}).toDataURL();
    if(normalized.length>400000)throw new Error('Image trop volumineuse.');return normalized;
  });
  handle('profile:banner',async()=>{
    if(remote)await remote.request('state');else accounts.session();
    const result=await dialog.showOpenDialog(win,{title:'Choisir une bannière de profil',filters:[{name:'Images',extensions:['png','jpg','jpeg','webp']}],properties:['openFile']});if(result.canceled)return null;
    const file=result.filePaths[0];if((await fs.stat(file)).size>5000000)throw new Error('Choisis une image de moins de 5 Mo.');
    const img=nativeImage.createFromBuffer(await fs.readFile(file));if(img.isEmpty())throw new Error('Cette image ne peut pas être ouverte.');const {width,height}=img.getSize();if(width*height>16000000)throw new Error('Image trop grande (16 mégapixels maximum).');
    const cropWidth=Math.max(1,Math.min(width,Math.floor(height*640/180))),cropHeight=Math.max(1,Math.min(height,Math.floor(cropWidth*180/640))),normalized=img.crop({x:Math.floor((width-cropWidth)/2),y:Math.floor((height-cropHeight)/2),width:cropWidth,height:cropHeight}).resize({width:640,height:180,quality:'best'}).toDataURL();
    if(normalized.length>600000)throw new Error('Bannière trop volumineuse.');return normalized;
  });
  handle('state:export', async () => {
    const state=remote?(await remote.request('state')).state:accounts.session().state;
    const result=await dialog.showSaveDialog(win,{title:'Exporter les escouades',defaultPath:'umbra-escouades.json',filters:[{name:'Sauvegarde UMBRA',extensions:['json']}]});
    if(result.canceled)return false;
    await fs.writeFile(result.filePath,JSON.stringify(state,null,2),'utf8');return true;
  });
  handle('state:import', async () => {
    if(remote){const r=await remote.request('state');if(!r.state.players.find(p=>p.id===r.state.currentUserId).admin)throw new Error('Action réservée aux admins.');}else accounts.admin();
    const result=await dialog.showOpenDialog(win,{title:'Importer les escouades',filters:[{name:'Sauvegarde UMBRA',extensions:['json']}],properties:['openFile']});
    if(result.canceled)return null;
    if((await fs.stat(result.filePaths[0])).size>20000000)throw new Error('Fichier trop volumineux');
    const candidate=JSON.parse(await fs.readFile(result.filePaths[0],'utf8'));if(remote){const {validateState}=await import('./src/model.mjs');validateState(candidate);return candidate;}return accounts.validateImport(candidate);
  });
  handle('network:info',()=>({shared:!!remote,url:remote?.base||'',keys:ptt.keys,version:app.getVersion()}));
  handle('capture:sources',async()=>{if(remote)await remote.request('state');else accounts.session();win.show();win.focus();const sources=await desktopCapturer.getSources({types:['screen','window'],thumbnailSize:{width:300,height:180},fetchWindowIcons:false});captureSelection.list(sources);return sources.map(s=>({id:s.id,name:s.name,type:s.id.startsWith('screen:')?'screen':'application',thumbnail:s.thumbnail.toDataURL()}));});
  handle('capture:select',(id,audio)=>{captureSelection.select(id,audio);return true;});
  handle('capture:cancel',()=>{captureSelection.clear();return true;});
  handle('network:configure',async url=>{if(url)url=serverUrl(url);if(!remote&&url)audioPreferences=accounts.db?.state?.settings||audioPreferences||defaultAudio;ptt.stop();await remembered.clear();setRemote(url);await saveConnection();return {shared:!!remote,url:remote?.base||''};});
  handle('network:invite',()=>{if(!remote)throw new Error('Connexion au serveur requise.');return remote.request('admin/invite');});
  handle('voice:plan',()=>{if(!remote)throw new Error('Connecte-toi à un serveur partagé pour utiliser le vocal.');return remote.request('voice/plan');});
  handle('voice:disconnect',async()=>{ptt.stop();if(remote?.token)try{await remote.request('voice/disconnect',{});}catch{}return true;});
  handle('voice:presence',()=>remote?remote.request('voice/presence',{}):true);
  handle('voice:visit',squadId=>{if(!remote)throw new Error('Serveur partagé requis.');return remote.request('voice/visit',{squadId});});
  handle('voice:ptt-start',keys=>{if(!remote?.token)throw new Error('Connexion requise.');ptt.start(keys);return true;});
  handle('voice:ptt-stop',()=>{ptt.stop();return true;});
  handle('chat:request',(method,data={})=>{
    if(!remote?.token)throw new Error('Le texte nécessite une connexion au serveur de la team.');
    if(method==='channels')return remote.request('chat/channels');
    if(method==='pins')return remote.request('chat/pins?channelId='+encodeURIComponent(data.channelId));
    if(method==='message')return remote.request('chat/message?channelId='+encodeURIComponent(data.channelId)+'&messageId='+encodeURIComponent(data.messageId));
    if(method==='messages'){if(typeof data.channelId!=='string')throw new Error('Salon invalide.');return remote.request('chat/messages?channelId='+encodeURIComponent(data.channelId)+(data.before!==undefined?'&before='+encodeURIComponent(data.before):''));}
    if(['send','create','delete','discard','update','duplicate','react','pin','delete-message'].includes(method))return remote.request('chat/'+method,data);
    if(method==='upload'){if(typeof data.channelId!=='string'||typeof data.name!=='string'||!(data.bytes instanceof Uint8Array)||data.bytes.byteLength>25*1024*1024)throw new Error('Fichier invalide.');return remote.upload(data.channelId,data.name,Buffer.from(data.bytes));}
    if(method==='attachment'){if(typeof data.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(data.id))throw new Error('Média invalide.');return remote.attachment(data.id);}
    if(method==='saveAttachment')return (async()=>{if(typeof data.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(data.id))throw new Error('Média invalide.');const result=await remote.attachment(data.id),extension={'image/png':'png','image/jpeg':'jpg','image/gif':'gif','image/webp':'webp','video/mp4':'mp4','video/webm':'webm'}[result.type];if(!extension)throw new Error('Format invalide.');const chosen=await dialog.showSaveDialog(win,{title:'Enregistrer la pièce jointe',defaultPath:'UMBRA-media.'+extension,filters:[{name:'Média',extensions:[extension]}]});if(chosen.canceled)return false;await fs.writeFile(chosen.filePath,result.bytes);return true;})();
    if(method==='openLink'){const url=new URL(data.url);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('Lien invalide.');return shell.openExternal(url.href);}
    throw new Error('Action textuelle invalide.');
  });
  ipcMain.on('voice:activity',(event,data)=>{guard(event);remote?.activity(data.speaking===true,data.channel);});
  ipcMain.on('voice:status',(event,data)=>{guard(event);remote?.voiceStatus(data);});
  for (const action of ['minimize', 'maximize', 'close']) ipcMain.on('window:' + action, e => { guard(e); if (action === 'maximize') win.isMaximized() ? win.unmaximize() : win.maximize(); else win[action](); });
  createWindow();
  updates.start();
});
app.on('window-all-closed', () => app.quit());
let closing = false;
app.on('before-quit', event => {
  if (!closing) { event.preventDefault(); closing = true; updates?.stop();ptt?.stop();remote?.close(); (accounts?.queue || Promise.resolve()).then(() => app.quit(), () => app.quit()); }
});
}
