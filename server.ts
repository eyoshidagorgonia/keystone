
import { createServer as createHttpsServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { createCertificate } from 'pem';
import { execSync } from 'child_process';

const dev = process.env.NODE_ENV !== 'production';
// Explicitly tell Next.js to use the current directory for the app
const app = next({ dev, dir: '.' });
const handle = app.getRequestHandler();

const port = parseInt(process.env.PORT || '9002', 10);
const hostname = '0.0.0.0';

async function getHttpsOptions() {
  try {
    // Check if OpenSSL is available
    execSync('openssl version', { stdio: 'ignore' });
    
    console.log('Generating self-signed SSL certificate...');
    const keys = await new Promise<any>((resolve, reject) => {
        createCertificate({ selfSigned: true }, (err, keys) => {
            if (err) {
                return reject(err);
            }
            resolve(keys);
        });
    });

    console.log('SSL certificate generated.');
    return {
        key: keys.serviceKey,
        cert: keys.certificate,
    };
  } catch (error: any) {
    console.error('Failed to generate SSL certificate:', error.message);
    return null;
  }
}

async function main() {
  await app.prepare();

  const httpsOptions = await getHttpsOptions();

  if (httpsOptions) {
    createHttpsServer(httpsOptions, (req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    }).listen(port, hostname, () => {
      console.log(`> Ready on https://${hostname}:${port}`);
    });
  } else {
    console.log('Starting in HTTP mode.');
    createHttpServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    }).listen(port, hostname, () => {
      console.log(`> Ready on http://localhost:${port}`);
    });
  }
}

main().catch((err: any) => {
  console.error(err);
  process.exit(1);
});
