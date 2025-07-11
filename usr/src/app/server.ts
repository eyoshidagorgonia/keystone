
import { createServer as createHttpServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: '.' });
const handle = app.getRequestHandler();

// Set default port based on the mode
const getDefaultPort = () => {
    if (process.env.KEYSTONE_MODE === 'api') {
        return '9003';
    }
    return '9002';
};

const port = parseInt(process.env.PORT || getDefaultPort(), 10);
const hostname = '0.0.0.0';

async function main() {
  await app.prepare();

  createHttpServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}

main().catch((err: any) => {
  console.error(err);
  process.exit(1);
});
