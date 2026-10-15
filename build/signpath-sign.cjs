const fs=require('node:fs/promises'),path=require('node:path'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const run=promisify(execFile);
function createSigner({upload,submit,verify,env=process.env,root=path.resolve(__dirname,'..')}={}){
 let queue=Promise.resolve(),sequence=0;
 return configuration=>{
  const task=queue.then(async()=>{
   if(env.GITHUB_ACTIONS!=='true'||env.RUNNER_ENVIRONMENT!=='github-hosted'||env.GITHUB_REPOSITORY!=='SyntetikkCODE/UMBRA'||env.GITHUB_REF!=='refs/heads/main'||env.GITHUB_EVENT_NAME!=='workflow_dispatch')throw new Error('Signing requires a manual build of main on a GitHub-hosted runner.');
   for(const key of ['SIGNPATH_API_TOKEN','SIGNPATH_ORGANIZATION_ID','SIGNPATH_PUBLISHER','GITHUB_TOKEN','RUNNER_TEMP','SIGNPATH_ACTION_PATH'])if(!env[key])throw new Error('Missing signing setting: '+key);
   const {version}=JSON.parse(await fs.readFile(path.join(root,'package.json'))),name=path.basename(configuration.path);
   if(!['UMBRA.exe',`UMBRA-Setup-${version}-win64.exe`,`UMBRA-Setup-${version}-win64.__uninstaller.exe`].includes(name))throw new Error('Refusing to sign a third-party or unexpected executable.');
   if(configuration.hash!=='sha256')throw new Error('Only SHA-256 signing is permitted.');
   const productVersion=name==='UMBRA.exe'?version+'.0':version;
   const staging=await fs.mkdtemp(path.join(path.resolve(env.RUNNER_TEMP),'umbra-signpath-')),unsigned=path.join(staging,'umbra-signable.exe'),signed=path.join(staging,'signed','umbra-signable.exe');
   await fs.copyFile(configuration.path,unsigned);
   try{
    const artifactId=await upload('umbra-signable-'+(++sequence),unsigned,staging);
    await submit({artifactId,directory:path.dirname(signed),version:productVersion,env});
    await verify(signed,env.SIGNPATH_PUBLISHER,productVersion);
    // Copy only after verification. A failed or missing signature must never be published.
    await fs.copyFile(signed,configuration.path);
   }finally{if(path.dirname(staging)!==path.resolve(env.RUNNER_TEMP)||!path.basename(staging).startsWith('umbra-signpath-'))throw new Error('Unsafe temporary cleanup target.');await fs.rm(staging,{recursive:true,force:true});}
  });
  queue=task;return task;
 };
}
let signer;
module.exports=async configuration=>{
 if(!signer)signer=createSigner({
  upload:async(name,file,root)=>{const {DefaultArtifactClient}=await import('@actions/artifact');const result=await new DefaultArtifactClient().uploadArtifact(name,[file],root,{retentionDays:7});if(!result.id)throw new Error('No GitHub artifact ID returned.');return result.id;},
  submit:async({artifactId,directory,version,env})=>{
   const action=path.resolve(env.SIGNPATH_ACTION_PATH,'index.js');
   const inputs={'connector-url':'https://pipelineconnector.connectors.signpath.io/GitHubActions/GitHubCom','api-token':env.SIGNPATH_API_TOKEN,'organization-id':env.SIGNPATH_ORGANIZATION_ID,'project-slug':'umbra','signing-policy-slug':'release-signing','artifact-configuration-slug':'umbra-pe-v1','github-artifact-id':String(artifactId),'github-token':env.GITHUB_TOKEN,'wait-for-completion':'true','wait-for-completion-timeout-in-seconds':'1800','service-unavailable-timeout-in-seconds':'120','download-signed-artifact-timeout-in-seconds':'300','output-artifact-directory':directory,'skip-decompress':'false',parameters:'version: '+JSON.stringify(version)};
   const actionEnv={...env};for(const [key,value]of Object.entries(inputs))actionEnv['INPUT_'+key.toUpperCase()]=value;
   await run(process.execPath,[action],{env:actionEnv,windowsHide:true,timeout:1900000,maxBuffer:2*1024*1024});
  },
  verify:async(file,publisher,version)=>{await run('powershell.exe',['-NoProfile','-NonInteractive','-File',path.join(__dirname,'verify-authenticode.ps1'),'-FilePath',file,'-ExpectedPublisher',publisher,'-ExpectedVersion',version],{windowsHide:true,timeout:120000});}
 });
 return signer(configuration);
};
module.exports.createSigner=createSigner;
