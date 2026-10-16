const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const port = Number(process.env.PORT || 4194);
const prefix = '/brass-pittsburgh/';
const types = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml' };
http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  if (pathname === '/') { res.writeHead(302, { Location: prefix }).end(); return; }
  if (!pathname.startsWith(prefix)) { res.writeHead(404).end(); return; }
  const file = path.resolve(root, pathname.slice(prefix.length) || 'index.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}${prefix}`));
