import fs from 'node:fs/promises';
import path from 'node:path';
export const MAX_MEDIA=25*1024*1024;
export function mediaType(bytes){
 if(bytes.length<12)throw new Error('Fichier média invalide.');
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(['GIF87a','GIF89a'].includes(bytes.subarray(0,6).toString()))return 'image/gif';
 if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')return 'image/webp';
 if(bytes.subarray(4,8).toString()==='ftyp'&&['isom','iso2','mp41','mp42','avc1','M4V ','MSNV','qt  '].includes(bytes.subarray(8,12).toString()))return 'video/mp4';
 if(bytes.subarray(0,4).equals(Buffer.from([26,69,223,163]))&&bytes.subarray(0,4096).includes(Buffer.from('webm')))return 'video/webm';
 throw new Error('Formats acceptés : PNG, JPG, GIF, WebP, MP4 et WebM.');
}
export async function writeMedia(directory,id,bytes){await fs.mkdir(directory,{recursive:true,mode:0o700});await fs.writeFile(path.join(directory,id),bytes,{flag:'wx',mode:0o600});}
export async function removeMedia(directory,ids){await Promise.all(ids.map(id=>fs.unlink(path.join(directory,id)).catch(e=>{if(e.code!=='ENOENT')throw e;})));}
