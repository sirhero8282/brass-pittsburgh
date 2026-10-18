// Read-only public deployment check; ignores line-ending differences introduced by Git.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
(async()=>{
 const base='https://sirhero8282.github.io/brass-pittsburgh/',files=['index.html','app.js','engine-updates.js','engine-updates.css','runtime/local-session.js','runtime/visitor-metrics.js','metrics-config.js'];
 const rows=[];
 for(const file of files){const response=await fetch(new URL(file,base),{cache:'no-store'});if(!response.ok)throw Error(file+': HTTP '+response.status);const remote=(await response.text()).replaceAll('\r',''),local=fs.readFileSync(path.resolve(__dirname,'../dist',file),'utf8').replaceAll('\r','');if(remote!==local)throw Error(file+': deployed file is not the current verified release');rows.push({file,match:true,sha256:crypto.createHash('sha256').update(remote).digest('hex')})}
 const executor=fs.readFileSync(path.resolve(__dirname,'../dist/app.js'),'utf8').match(/const AUTOMA_EXECUTOR_VERSION='([^']+)'/)?.[1];
 if(!executor)throw Error('Verified app has no executor version');
 console.log(JSON.stringify({url:base,executor,verified:rows}));
})().catch(error=>{console.error(error.message);process.exitCode=1});
