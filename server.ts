
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

console.log('--- Keystone Server Starting ---');

const dev = process.env.NODE_ENV !== 'production';
const mode = process.env.KEYSTONE_MODE || 'admin'; // Default to admin

console.log(`[Server] Running in ${dev ? 'development' : 'production'} mode.`);
console.log(`[Server] KEYSTONE_MODE: ${mode}`);

const app = next({ dev, dir: '.' });
const handle = app.getRequestHandler();

const getDefaultPort = () => {
    if (mode === 'api') {
        return '9003';
    }
    return '9002';
};

const port = parseInt(process.env.PORT || getDefaultPort(), 10);
console.log(`[Server] Attempting to listen on port: ${port}`);

async function main() {
  await app.prepare();
  console.log('[Server] Next.js app prepared.');

  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    const { pathname } = parsedUrl;

    // In API mode, block all requests that are NOT for the API endpoints.
    // This is the most reliable way to disable the UI completely.
    if (mode === 'api' && pathname && !pathname.startsWith('/api/')) {
        console.log(`[Server] Blocking non-API path in API mode: ${pathname}`);
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
        return;
    }
    
    // For all other requests (or in admin mode), let Next.js handle them
    handle(req, res, parsedUrl);

  }).listen(port, () => {
    console.log(`[Server] > Ready and listening on http://localhost:${port}`);
  });
}

main().catch((err: any) => {
  console.error('[Server] Fatal error during startup:', err);
  process.exit(1);
});
