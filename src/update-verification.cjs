const {verify,createHash}=require('node:crypto');
const {createReadStream}=require('node:fs');
const {once}=require('node:events');
function verifyManifest(bytes,signature,publicKey){
 if(bytes.length>65536||typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature.trim()))throw new Error('Signature de mise à jour invalide.');
 if(!verify(null,bytes,publicKey,Buffer.from(signature.trim(),'base64')))throw new Error('La signature de cette mise à jour ne correspond pas à UMBRA.');
}
function validateManifest(info){
 if(!info||!/^\d+\.\d+\.\d+$/.test(info.version)||!Array.isArray(info.files)||info.files.length!==1||info.packages)throw new Error('Manifest de mise à jour invalide.');
 const f=info.files[0];
 if(!/^[A-Za-z0-9._-]+\.exe$/.test(f.url)||!Number.isSafeInteger(f.size)||f.size<1||f.size>1024*1024*1024||typeof f.sha512!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(f.sha512))throw new Error('Fichier de mise à jour invalide.');
 return info;
}
async function verifyInstaller(file,expected){
 const stream=createReadStream(file),hash=createHash('sha512');let size=0;
 for await(const chunk of stream){size+=chunk.length;hash.update(chunk);}
 if(size!==expected.size||hash.digest('base64')!==expected.sha512)throw new Error('Le fichier de mise à jour est incomplet ou a été modifié.');
}
module.exports={verifyManifest,validateManifest,verifyInstaller};
