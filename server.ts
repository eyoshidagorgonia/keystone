
import { createServer } from 'https';
import { parse } from 'url';
import next from 'next';
import { createCertificate } from 'pem';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = 9002;
const certPath = './.cert/local-cert.pem';
const keyPath = './.cert/local-key.pem';

async function main() {
  let httpsOptions = {};

  if (!existsSync(certPath) || !existsSync(keyPath)) {
    console.log('Generating self-signed SSL certificate...');
    const keys = await new Promise<any>((resolve, reject) => {
        createCertificate({ selfSigned: true }, (err, keys) => {
            if (err) {
                return reject(err);
            }
            resolve(keys);
        });
    });

    if (!existsSync('./.cert')) {
      require('fs').mkdirSync('./.cert');
    }
    
    writeFileSync(certPath, keys.certificate);
    writeFileSync(keyPath, keys.serviceKey);
    console.log('Certificate generated!');
    httpsOptions = { key: keys.serviceKey, cert: keys.certificate };
  } else {
    console.log('Found existing SSL certificate.');
    httpsOptions = {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
    };
  }

  await app.prepare();

  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`> Ready on https://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
