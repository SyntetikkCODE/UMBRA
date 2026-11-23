const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('voiceOverlay',{onProfiles(callback){ipcRenderer.on('voice-overlay:profiles',(_event,value)=>callback(value));},onUpdate(callback){ipcRenderer.on('voice-overlay:render',(_event,value)=>callback(value));}});
