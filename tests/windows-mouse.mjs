import {spawn} from 'node:child_process';
import path from 'node:path';
export function mouseButton(button,state){
 return new Promise((resolve,reject)=>{
  const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(import.meta.dirname,'windows-mouse.ps1'),'-Button',String(button),'-State',state],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  let error='';child.stderr.on('data',b=>error+=b);child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error('Windows mouse injection failed: '+error)));
 });
}
