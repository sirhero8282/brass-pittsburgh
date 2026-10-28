const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const failures = [];
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  if (entry.name.startsWith('.')) return [];
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
}); }
for (const file of walk(root).filter(file => /\.(html|css|js)$/.test(file))) {
  const source = fs.readFileSync(file, 'utf8');
  const references = [...source.matchAll(/(?:src|href)=["']([^"']+)["']|url\(["']?([^)'"\s]+)["']?\)/g)];
  for (const match of references) {
    const ref = match[1] || match[2];
    if (/^(?:[a-z]+:|#|\$|\{)/i.test(ref) || ref.includes('${')) continue;
    if (ref.startsWith('/')) { failures.push(`${path.relative(root, file)}: root-relative ${ref}`); continue; }
    // core.js emits HTML into /four-player.html: its img paths use that document's base.
    const documentBase = ['four-player/core.js','online/two-core.js'].includes(path.relative(root, file).split(path.sep).join('/')) ? root : path.dirname(file);
    const target = path.resolve(documentBase, decodeURIComponent(ref.split(/[?#]/)[0]));
    const rootIndex = target === root && fs.existsSync(path.join(root, 'index.html'));
    if ((!target.startsWith(root + path.sep) && !rootIndex) || !fs.existsSync(target)) failures.push(`${path.relative(root, file)}: missing ${ref}`);
  }
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('Static HTML/CSS/script asset references resolve under a Pages project subpath.');
