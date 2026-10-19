import {spawn} from 'node:child_process';
import path from 'node:path';
export function windowsKey(virtualKey,state){return new Promise((resolve,reject)=>{
 const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(import.meta.dirname,'windows-key.ps1'),'-VirtualKey',String(virtualKey),'-State',state],{windowsHide:true,stdio:['ignore','ignore','pipe']});let error='';child.stderr.on('data',b=>error+=b);child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error('Windows key injection failed: '+error)));
});}
