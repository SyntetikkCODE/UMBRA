const path=require('node:path');
function taskbarBadge(value){
 if(!value||!Number.isSafeInteger(value.unread)||value.unread<0||value.unread>9999||!Number.isSafeInteger(value.mentions)||value.mentions<0||value.mentions>9999)throw new Error('Notification invalide.');
 if(value.mentions)return {icon:'notification-mention.png',description:value.mentions+' mention'+(value.mentions>1?'s':'')+' non lue'+(value.mentions>1?'s':'')+' · UMBRA'};
 if(value.unread)return {icon:'notification-unread.png',description:'Messages non lus · UMBRA'};
 return {icon:null,description:''};
}
function setTaskbarBadge(win,nativeImage,value){const badge=taskbarBadge(value);if(process.platform==='win32'&&win&&!win.isDestroyed())win.setOverlayIcon(badge.icon?nativeImage.createFromPath(path.join(__dirname,'../assets',badge.icon)):null,badge.description);return badge.icon?'pending':'clear';}
module.exports={taskbarBadge,setTaskbarBadge};
