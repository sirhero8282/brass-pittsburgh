// Read-only deployment inspection. Credentials stay in memory and are never printed.
const {execFileSync}=require('node:child_process');
(async()=>{
 let raw;try{raw=execFileSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',stdio:['pipe','pipe','pipe'],env:{...process.env,GIT_TERMINAL_PROMPT:'0'}})}catch{throw Error('GitHub credential unavailable')}
 const credential=Object.fromEntries(raw.trim().split(/\r?\n/).map(line=>{let i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)]}));
 if(!credential.password)throw Error('GitHub credential unavailable');
 const headers={'Authorization':'Bearer '+credential.password,'User-Agent':'Codex-Pages-Deployment','Accept':'application/vnd.github+json'};
 async function get(path){const response=await fetch('https://api.github.com/repos/sirhero8282/brass-pittsburgh'+path,{headers});if(!response.ok)throw Error('GitHub HTTP '+response.status+' for '+path);return response.json()}
 const pages=await get('/pages'),runs=await get('/actions/runs?per_page=5');
 console.log(JSON.stringify({pages:{status:pages.status,url:pages.html_url,buildType:pages.build_type,source:pages.source},runs:runs.workflow_runs.map(r=>({id:r.id,head:r.head_sha,status:r.status,conclusion:r.conclusion,url:r.html_url,title:r.display_title}))}));
})().catch(error=>{console.error(error.message);process.exitCode=1});
