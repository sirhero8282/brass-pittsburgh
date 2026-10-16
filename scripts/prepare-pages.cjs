// Idempotent, bounded deployment overlay for importing a newer verified Site runtime.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const origin = process.env.PAGES_ORIGIN || 'https://sirhero8282.github.io/brass-pittsburgh/';
const header = "const gameSession=globalThis.BrassSession?.createLocalSession({storage:globalThis.localStorage,onError:error=>console.error(error)})||{read:()=>localStorage.getItem('brass-p-next-v1'),commit:value=>localStorage.setItem('brass-p-next-v1',JSON.stringify(value))};\n";
let app = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
if (!app.startsWith(header)) {
  const load = "JSON.parse(localStorage.getItem('brass-p-next-v1'))";
  const save = "localStorage.setItem('brass-p-next-v1',JSON.stringify(state));";
  if (app.split(load).length !== 2 || app.split(save).length !== 2) throw new Error('Upstream storage boundary changed: review before importing');
  app = header + app.replace(load, 'JSON.parse(gameSession.read())').replace(save, 'gameSession.commit(state);');
  fs.writeFileSync(path.join(root, 'dist/app.js'), app);
}
let html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
html = html.replace(/(<meta property="og:url" content=")[^"]+/, '$1' + origin)
  .replace(/(<meta property="og:image" content=")[^"]+/, '$1' + new URL('og.png', origin).href);
if (!html.includes('./runtime/local-session.js')) {
  const marker = '<script src="./ai-champion.js';
  if (!html.includes(marker)) throw new Error('Missing upstream script boundary');
  html = html.replace(marker, '<script src="./runtime/local-session.js?v=1"></script>' + marker);
}
html = html.replace(/app\.js\?v=[^" ]+/, 'app.js?v=20261017-pages-session1');
fs.writeFileSync(path.join(root, 'dist/index.html'), html);
console.log('GitHub Pages overlay ready: ' + origin);
