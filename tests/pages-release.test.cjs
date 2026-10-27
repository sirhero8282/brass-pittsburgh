const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
test('Pages retains the session, current executor cache key and active metrics overlay',()=>{
 const html=read('dist/index.html'),app=read('dist/app.js');
 assert.match(app,/^const gameSession=/);assert.match(app,/JSON\.parse\(gameSession\.read\(\)\)/);assert.match(app,/gameSession\.commit\(state\)/);
 assert.match(app,/plan-executor-v229-owned-pipes-manufacturing-v1/);assert.match(html,/20261027-owned-pipes-plans-pages-session1/);
 assert.match(html,/local-session\.js\?v=1/);assert.match(html,/metrics-config\.js\?v=2/);assert.match(html,/visitor-metrics\.js\?v=1/);assert.match(html,/engineUpdatesView/);
 assert.match(html,/og:url" content="https:\/\/sirhero8282.github.io\/brass-pittsburgh\//);
});
test('Pages overlay is idempotent and resolves all assets under the project subpath',()=>{
 const before=read('dist/index.html'),app=read('dist/app.js');execFileSync(process.execPath,['scripts/prepare-pages.cjs'],{cwd:root});assert.equal(read('dist/index.html'),before);assert.equal(read('dist/app.js'),app);
 assert.match(execFileSync(process.execPath,['scripts/check-static.cjs'],{cwd:root,encoding:'utf8'}),/references resolve/);
});
