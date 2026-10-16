// Canonical rules: catalog pipeline oilOnBuild in pittsburgh-2p-layout.json.
// This generator performs mechanical rewrites only. Never edit generated tables.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),layoutPath='dist/assets/data/pittsburgh-2p-layout.json';
function outputs(layout){
 const nodes=new Map(layout.catalog.map(item=>[item.id,item]));
 const pipes=layout.catalog.filter(item=>item.kind==='network'&&item.id.includes('_pipeline_'));
 if(!pipes.length)throw Error('No pipeline rules');
 const routes=[],oil={};
 for(const item of pipes){
  const a=nodes.get(item.fromId)?.name,b=nodes.get(item.toId)?.name;
  if(!a||!b||a===b||!Number.isInteger(item.oilOnBuild)||item.oilOnBuild<0)throw Error('Invalid pipeline rule: '+item.id);
  const key='pipe:'+[a,b].sort().join('|');
  if(Object.hasOwn(oil,key))throw Error('Duplicate pipeline: '+key);
  const documented=item.note?.match(/오일 수: (\d+)/);
  if(documented&&Number(documented[1])!==item.oilOnBuild)throw Error('Authored note disagrees with rule: '+item.id);
  routes.push([a,b]);oil[key]=item.oilOnBuild;
 }
 const block='// BEGIN GENERATED PIPELINE RULES (scripts/sync-pipeline-rules.cjs)\nconst PIPE='+JSON.stringify(routes)+';\nconst PIPELINE_OIL=Object.freeze('+JSON.stringify(oil)+');\n// END GENERATED PIPELINE RULES';
 return {block,script:'window.PITTSBURGH_2P_LAYOUT='+JSON.stringify(layout)+';\n'};
}
function sync(check=false){
 const layout=JSON.parse(fs.readFileSync(path.join(root,layoutPath),'utf8')),generated=outputs(layout),pending=[];
 for(const file of ['dist/app.js','engine-source.js']){
  const before=fs.readFileSync(path.join(root,file),'utf8');
  const pattern=/\/\/ BEGIN GENERATED PIPELINE RULES[^\n]*\r?\n[\s\S]*?\/\/ END GENERATED PIPELINE RULES|const PIPE=\[[^\n]*\r?\nconst PIPE_BONUS=[^\n]*/;
  if(!pattern.test(before))throw Error('Missing generated rules block: '+file);
  pending.push([file,before.replace(pattern,generated.block)]);
 }
 pending.push(['dist/assets/data/pittsburgh-2p-layout.js',generated.script]);
 for(const [file,next] of pending){
  const absolute=path.join(root,file),before=fs.readFileSync(absolute,'utf8');
  if(before.replace(/\r\n/g,'\n')===next.replace(/\r\n/g,'\n'))continue;
  if(check)throw Error('Stale generated pipeline rules: '+file+'; run node scripts/sync-pipeline-rules.cjs');
  fs.writeFileSync(absolute,next);
 }
}
module.exports={outputs,sync};
if(require.main===module){sync(process.argv.includes('--check'));console.log('Pipeline rule outputs are synchronized.');}
