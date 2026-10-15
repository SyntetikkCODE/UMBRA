import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),violations=[];
const excluded=new Set(['.git','node_modules','dist','artifacts','runtime','licenses-dist','.signpath']);
async function scan(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){
 if(excluded.has(entry.name))continue;const file=path.join(dir,entry.name),relative=path.relative(root,file).replaceAll('\\','/');
 if(entry.isDirectory()){await scan(file);continue;}
 if(entry.isSymbolicLink()){violations.push(relative+': symbolic link');continue;}
 if(entry.name.startsWith('.env')||/\.(pfx|p12|key|db|log)$/i.test(entry.name)||/^(connection|remembered-sessions|umbra-v2|accounts|config)\.json$/i.test(entry.name)||entry.name==='wardogs-reference.png'||entry.name.endsWith('.pem')&&relative!=='assets/update-public-key.pem')violations.push(relative+': excluded private/local file');
 if(!/\.(mjs|cjs|js|json|md|txt|yml|yaml|html|ps1|nsh)$/.test(entry.name)&&entry.name!=='LICENSE')continue;
 const text=await fs.readFile(file,'utf8');
 // Never print the matched value; reports contain paths and rule names only.
 for(const [name,regex]of [['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['GitHub credential',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],['AWS credential',/\bAKIA[A-Z0-9]{16}\b/]])if(regex.test(text))violations.push(relative+': '+name);
}}
await scan(root);
if(violations.length){console.error(violations.join('\n'));process.exitCode=1;}else console.log('Public-tree check passed: no known local data paths, private key files or common credential formats. This does not replace human review.');
