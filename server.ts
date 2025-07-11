
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { parse } from 'url';
import next from 'next';
import { createCertificate, SslInformation, checkOpenSSL } from 'pem';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = 9002;
const certDir = './.cert';
const certPath = `${certDir}/local-cert.pem`;
const keyPath = `${certDir}/local-key.pem`;


async function getHttpsOptions() {
  if (existsSync(certPath) && existsSync(keyPath)) {
    console.log('Found existing SSL certificate.');
    return {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
    };
  }

  const opensslExists = await checkOpenSSL();
  if (!opensslExists) {
    console.warn('OpenSSL not found. Cannot generate certificate. Starting in HTTP mode.');
    return null;
  }
  
  console.log('Generating self-signed SSL certificate...');
  
  return new Promise<{key: string, cert: string} | null>((resolve) => {
    createCertificate({ selfSigned: true }, (err, keys: SslInformation) => {
        if (err) {
            console.error('Failed to generate SSL certificate:', err);
            console.warn('Starting in HTTP mode.');
            resolve(null);
            return;
        }

        if (!existsSync(certDir)) {
          mkdirSync(certDir);
        }
        
        writeFileSync(certPath, keys.certificate);
        writeFileSync(keyPath, keys.serviceKey);
        console.log('Certificate generated!');
        resolve({ key: keys.serviceKey, cert: keys.certificate });
    });
  });
}

async function main() {
  await app.prepare();

  const httpsOptions = await getHttpsOptions();

  if (httpsOptions) {
    createHttpsServer(httpsOptions, (req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    }).listen(port, () => {
      console.log(`> Ready on https://localhost:${port}`);
    });
  } else {
     createHttpServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    }).listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
