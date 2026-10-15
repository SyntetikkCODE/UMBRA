const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),destination=path.join(root,'licenses-dist');
fs.mkdirSync(destination,{recursive:true});
fs.cpSync(path.join(root,'licenses'),destination,{recursive:true});
fs.copyFileSync(path.join(root,'LICENSE'),path.join(destination,'UMBRA-MIT.txt'));
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json')));
const inventory=[];
for(const [relative,meta]of Object.entries(lock.packages)){
 if(!relative||meta.dev||meta.devOptional)continue;
 const dir=path.join(root,relative),name=relative.split('node_modules/').at(-1),installed=JSON.parse(fs.readFileSync(path.join(dir,'package.json')));
 const license=installed.license||meta.license||'SEE PACKAGE LICENSE';inventory.push({name,version:meta.version,license});
 const folder=path.join(destination,'npm',name.replaceAll('/','__'));fs.mkdirSync(folder,{recursive:true});
 for(const file of fs.readdirSync(dir))if(/^(LICENSE|LICENCE|COPYING|NOTICE)(\.|$|-)/i.test(file)&&fs.statSync(path.join(dir,file)).isFile())fs.copyFileSync(path.join(dir,file),path.join(folder,file));
}
fs.writeFileSync(path.join(destination,'npm-inventory.json'),JSON.stringify(inventory,null,2)+'\n');
console.log('Prepared self-contained runtime licenses for '+inventory.length+' dependency packages.');
