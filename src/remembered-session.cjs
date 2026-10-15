const fs=require('node:fs/promises'),path=require('node:path');
class RememberedSession{
 constructor(directory,storage){this.file=path.join(directory,'remembered-session.bin');this.storage=storage;}
 async clear(){await fs.rm(this.file,{force:true});}
 async save(value){
  if(!this.storage.isEncryptionAvailable())throw new Error('Windows ne permet pas de protéger la session sur ce PC.');
  const bytes=this.storage.encryptString(JSON.stringify({...value,expires:Date.now()+30*86400000}));
  await fs.mkdir(path.dirname(this.file),{recursive:true});await fs.writeFile(this.file+'.tmp',bytes,{mode:0o600});await fs.rename(this.file+'.tmp',this.file);
 }
 async load(base){
  try{
   if(!this.storage.isEncryptionAvailable())return null;
   const bytes=await fs.readFile(this.file);if(bytes.length>16384)throw new Error('Invalid size');
   const value=JSON.parse(this.storage.decryptString(bytes));
   if(value.base!==base||!Number.isFinite(value.expires)||value.expires<=Date.now())return null;
   if(base?typeof value.token!=='string'||!/^[a-f0-9]{64}$/.test(value.token):typeof value.userId!=='string')throw new Error('Invalid session');
   return value;
  }catch(error){if(error.code!=='ENOENT')await this.clear();return null;}
 }
}
module.exports={RememberedSession};
