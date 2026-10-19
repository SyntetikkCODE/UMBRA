const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
if(process.platform!=='win32')throw new Error('Build the Windows audio helper on Windows.');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'native/bin'),compiler=path.join(process.env.WINDIR||'C:/Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe');fs.mkdirSync(folder,{recursive:true});
execFileSync(compiler,['/nologo','/target:exe','/platform:x64','/optimize+','/debug-','/out:'+path.join(folder,'UMBRA.AudioCapture.exe'),path.join(root,'native/AudioCapture.cs')],{stdio:'pipe',windowsHide:true});console.log('Built original UMBRA Windows application-audio helper.');
