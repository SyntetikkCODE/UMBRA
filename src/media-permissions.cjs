// Chromium also checks the generic media permission without a mediaType after capture starts.
// Capture requests themselves remain limited to audio/video and the trusted application frame.
function mediaPermissionCheck(internal,permission,origin,mediaType){
 return internal&&['umbra://app','umbra://app/'].includes(origin)&&(['speaker-selection','display-capture','fullscreen'].includes(permission)||permission==='media'&&[undefined,'unknown','audio','video'].includes(mediaType));
}
function mediaPermissionRequest(internal,permission,mediaTypes,pending=false){
 return internal&&(['speaker-selection','fullscreen'].includes(permission)||permission==='display-capture'&&pending||permission==='media'&&(mediaTypes?.length>0?mediaTypes.every(t=>['audio','video'].includes(t)):pending));
}
module.exports={mediaPermissionCheck,mediaPermissionRequest};
