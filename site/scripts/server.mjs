import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, readDays } from './content.mjs';
import { createWritingStore, StoreError } from './writing-store.mjs';

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const maxBodyBytes = 96 * 1024;
function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': mime['.json'], 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}
async function body(request) {
  if (Number(request.headers['content-length'] || 0) > maxBodyBytes) throw new StoreError(413, 'Request too large.');
  if (!String(request.headers['content-type']).startsWith('application/json')) throw new StoreError(415, 'JSON required.');
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > maxBodyBytes) throw new StoreError(413, 'Request too large.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new StoreError(400, 'Malformed JSON.'); }
}

export function createSiteServer({ staticDirectory = path.join(root, 'dist'), dataDirectory = path.join(root, 'data'), editions, localWriting = false }) {
  const store = createWritingStore(dataDirectory, editions);
  const base = path.resolve(staticDirectory);
  return http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    try {
      const host = request.headers.host || '';
      const port = response.socket.localPort;
      if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) throw new StoreError(403, 'Invalid local host.');
      const origin = `http://${host}`;
      if (request.headers.origin && request.headers.origin !== origin) throw new StoreError(403, 'Cross-origin request refused.');
      const url = new URL(request.url, origin);
      const pathname = decodeURIComponent(url.pathname);
      if (pathname === '/api/health' && request.method === 'GET') return json(response, 200, { app: 'zijian', ok: true });
      const route = pathname.match(/^\/api\/(writing|export)\/([a-z0-9-]+)$/);
      if (route) {
        if (!localWriting) throw new StoreError(404, 'Writing is stored on each visitor’s device.');
        const [, action, id] = route;
        if (action === 'writing' && request.method === 'GET') return json(response, 200, await store.read(id));
        if (request.method !== 'POST') throw new StoreError(405, 'Method not allowed.');
        const input = await body(request);
        const result = action === 'writing' ? await store.save(id, input) : await store.exportText(id, input.revision);
        return json(response, 200, result);
      }
      if (pathname.startsWith('/api/')) throw new StoreError(404, 'Unknown API route.');
      if (request.method !== 'GET' && request.method !== 'HEAD') throw new StoreError(405, 'Method not allowed.');
      let target = path.resolve(base, '.' + pathname);
      if (target !== base && !target.startsWith(base + path.sep)) throw new StoreError(403, 'Path outside site.');
      try {
        if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
        const actual = await realpath(target);
        if (!actual.startsWith(base + path.sep)) throw new StoreError(403, 'Path outside site.');
        const content = await readFile(actual);
        response.writeHead(200, { 'Content-Type': mime[path.extname(actual)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        return response.end(request.method === 'HEAD' ? undefined : content);
      } catch (error) {
        if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
        const html = await readFile(path.join(base, '404.html'));
        response.writeHead(404, { 'Content-Type': mime['.html'] });
        return response.end(request.method === 'HEAD' ? undefined : html);
      }
    } catch (error) {
      if (response.destroyed) return;
      const status = error instanceof URIError ? 400 : error.status || 500;
      if (status === 500) console.error('Request failed:', error.message);
      json(response, status, { message: status === 500 ? 'Unable to complete the request. Your writing was not confirmed saved.' : error.message });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const editions = await readDays();
  const server = createSiteServer({ editions });
  const port = Number(process.env.PORT || 4173);
  server.listen(port, '127.0.0.1', () => console.log(`字间 Local: http://127.0.0.1:${port}\nWriting directory: ${path.join(root, 'data', 'writing')}`));
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(() => process.exit(0)); });
}
