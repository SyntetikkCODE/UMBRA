const fs=require('node:fs');
const base=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'electron-builder.json')));
if(!process.env.SIGNPATH_PUBLISHER)throw new Error('SIGNPATH_PUBLISHER must match the issued certificate identity.');
module.exports={...base,forceCodeSigning:true,win:{...base.win,signtoolOptions:{sign:'build/signpath-sign.cjs',publisherName:process.env.SIGNPATH_PUBLISHER,signingHashAlgorithms:['sha256']}}};
