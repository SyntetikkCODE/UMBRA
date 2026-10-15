const fs=require('node:fs');
const path=require('node:path');
const {GenericProvider}=require('electron-updater/out/providers/GenericProvider');
const {parseUpdateInfo}=require('electron-updater/out/providers/Provider');
const {verifyManifest,validateManifest}=require('./update-verification.cjs');
const publicKey=fs.readFileSync(path.join(__dirname,'../assets/update-public-key.pem'),'utf8');
async function smallResponse(url){
 const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(8000),headers:{'Cache-Control':'no-cache'}});
 if(!response.ok)throw new Error('Serveur de mises à jour indisponible ('+response.status+').');
 let size=0;const chunks=[];
 for await(const chunk of response.body){size+=chunk.length;if(size>65536)throw new Error('Réponse de mise à jour trop grande.');chunks.push(Buffer.from(chunk));}
 return Buffer.concat(chunks);
}
class SignedUpdateProvider extends GenericProvider{
 async getLatestVersion(){
  const base=this.baseUrl,manifestUrl=new URL('latest.yml',base),signatureUrl=new URL('latest.yml.sig',base);
  const [bytes,signature]=await Promise.all([smallResponse(manifestUrl),smallResponse(signatureUrl)]);
  verifyManifest(bytes,signature.toString('ascii'),publicKey);
  // Parse precisely the bytes whose signature was checked; never fetch them again.
  return validateManifest(parseUpdateInfo(new TextDecoder('utf-8',{fatal:true}).decode(bytes),'latest.yml',manifestUrl));
 }
}
module.exports={SignedUpdateProvider};
