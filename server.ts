
import { createServer as createHttpServer } from 'http';
import { parse } from 'url';
import next from 'next';

console.log('--- Keystone Server Starting ---');

const dev = process.env.NODE_ENV !== 'production';
const mode = process.env.KEYSTONE_MODE || 'admin'; // Default to admin

console.log(`[Server] Running in ${dev ? 'development' : 'production'} mode.`);
console.log(`[Server] KEYSTONE_MODE: ${mode}`);

// Initialize Next.js app with the correct directory
const app = next({ dev, dir: '.' });
const handle = app.getRequestHandler();

// Set default port based on the mode
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

  createHttpServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`[Server] > Ready and listening on http://localhost:${port}`);
  });
}

main().catch((err: any) => {
  console.error('[Server] Fatal error during startup:', err);
  process.exit(1);
});
