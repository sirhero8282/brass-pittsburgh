const ACTIVE_MS = 150_000;
const DAY_MS = 86_400_000;
export const koreaDay = time => new Date(time + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
const hash = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');

async function readEvent(request) {
  const reader = request.body?.getReader();
  if (!reader) throw Error('Missing body');
  const chunks=[]; let size=0;
  for (;;) {
    const { value, done }=await reader.read(); if (done) break;
    size+=value.length;
    if (size>1024) { await reader.cancel(); throw Error('Body too large'); }
    chunks.push(value);
  }
  const bytes=new Uint8Array(size);let offset=0;
  for(const chunk of chunks) { bytes.set(chunk,offset);offset+=chunk.length; }
  const body=JSON.parse(new TextDecoder().decode(bytes));
  if (!/^[a-f0-9-]{36}$/i.test(body?.visitorId || '')) throw Error('Invalid visitor ID');
  return body;
}

export class SiteMetrics {
  constructor(ctx) {
    this.ctx=ctx;this.sql=ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS visitors (day TEXT NOT NULL, visitor TEXT NOT NULL, PRIMARY KEY(day, visitor))');
    this.sql.exec('CREATE TABLE IF NOT EXISTS daily (day TEXT PRIMARY KEY, visitors INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS presence (visitor TEXT PRIMARY KEY, last_seen INTEGER NOT NULL)');
    this.sql.exec('CREATE INDEX IF NOT EXISTS presence_seen ON presence(last_seen)');
  }
  async fetch(request) {
    const url=new URL(request.url), now=Date.now(),day=koreaDay(now);
    if (url.pathname==='/collect' && request.method==='POST') {
      let body;try { body=await readEvent(request); } catch { return json({error:'Invalid event'},400); }
      // No IP address, user agent, game state, URL query or referrer is persisted.
      const visitor=await hash(body.visitorId),dailyVisitor=await hash(day+':'+body.visitorId);
      this.ctx.storage.transactionSync(()=>{
        const seen=this.sql.exec('SELECT 1 AS seen FROM visitors WHERE day=? AND visitor=?',day,dailyVisitor).toArray().length;
        if (!seen) {
          this.sql.exec('INSERT INTO visitors(day, visitor) VALUES (?, ?)',day,dailyVisitor);
          this.sql.exec('INSERT INTO daily(day, visitors) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET visitors=visitors+1',day);
        }
        this.sql.exec('INSERT INTO presence(visitor, last_seen) VALUES (?, ?) ON CONFLICT(visitor) DO UPDATE SET last_seen=excluded.last_seen',visitor,now);
        this.sql.exec('DELETE FROM presence WHERE last_seen<=?',now-ACTIVE_MS);
        this.sql.exec('DELETE FROM visitors WHERE day<?',koreaDay(now-DAY_MS));
        this.sql.exec('DELETE FROM daily WHERE day<?',koreaDay(now-365*DAY_MS));
      });
      return new Response(null,{status:204});
    }
    if (url.pathname==='/stats' && request.method==='GET') {
      const rows=this.sql.exec('SELECT day, visitors FROM daily WHERE day>=? ORDER BY day DESC',koreaDay(now-29*DAY_MS)).toArray();
      const byDay=new Map(rows.map(row=>[row.day,row.visitors]));
      const daily=Array.from({length:30},(_,i)=>{const date=koreaDay(now-i*DAY_MS);return {day:date,visitors:byDay.get(date)||0};});
      const active=this.sql.exec('SELECT COUNT(*) AS active FROM presence WHERE last_seen>?',now-ACTIVE_MS).one().active;
      return json({asOf:new Date(now).toISOString(),timezone:'Asia/Seoul',activeWindowSeconds:150,active,today:daily[0].visitors,daily});
    }
    return json({error:'Not found'},404);
  }
}

// Only this gateway is public. Detailed statistics always require the secret.
export async function handleRequest(request,env) {
  const origin=request.headers.get('Origin');
  if (origin!==env.ALLOWED_ORIGIN) return json({error:'Origin not allowed'},403);
  const cors={'Access-Control-Allow-Origin':origin,'Vary':'Origin','Cache-Control':'no-store'};
  let response;
  const url=new URL(request.url);
  if (!['/collect','/stats'].includes(url.pathname)) response=json({error:'Not found'},404);
  else if (request.method==='OPTIONS') response=new Response(null,{status:204,headers:{'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'3600'}});
  else if ((url.pathname==='/collect' && request.method!=='POST') || (url.pathname==='/stats' && request.method!=='GET')) response=json({error:'Method not allowed'},405);
  else if (url.pathname==='/stats' && (!env.ADMIN_TOKEN || request.headers.get('Authorization')!=='Bearer '+env.ADMIN_TOKEN)) response=json({error:'Unauthorized'},401);
  else response=await env.METRICS.get(env.METRICS.idFromName('brass-pittsburgh')).fetch(request);
  const headers=new Headers(response.headers);for(const [key,value] of Object.entries(cors))headers.set(key,value);
  return new Response(response.body,{status:response.status,headers});
}
export default {fetch:handleRequest};
