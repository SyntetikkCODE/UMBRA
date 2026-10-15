const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const folder=path.resolve(process.argv[2]||'../installer');
const keyFile=process.env.UMBRA_RELEASE_SIGN_KEY||path.join(process.env.USERPROFILE,'.umbra-release/update-signing-key.pem');
const key=crypto.createPrivateKey(fs.readFileSync(keyFile));
const publicKey=fs.readFileSync(path.join(__dirname,'../assets/update-public-key.pem'));
const bytes=fs.readFileSync(path.join(folder,'latest.yml')),signature=crypto.sign(null,bytes,key);
if(!crypto.verify(null,bytes,publicKey,signature))throw new Error('Release signing key does not match the embedded public key');
fs.writeFileSync(path.join(folder,'latest.yml.sig'),signature.toString('base64')+'\n');
console.log('Release manifest signed; private key never included in distribution.');
