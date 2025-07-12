
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

console.log('--- Keystone Server Starting ---');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dev = process.env.NODE_ENV !== 'production';
const mode = process.env.KEYSTONE_MODE || 'admin';

console.log(`[Server] Running in ${dev ? 'development' : 'production'} mode.`);
console.log(`[Server] KEYSTONE_MODE: ${mode}`);

const getDefaultPort = () => {
    if (mode === 'api') {
        return '9003';
    }
    return '9002';
};

const port = process.env.PORT || getDefaultPort();
console.log(`[Server] Attempting to start on port: ${port}`);

const command = dev ? 'next' : 'next';
const args = dev ? ['dev', '-p', port] : ['start', '-p', port];

const nextProcess = spawn(command, args, {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'), // Run from the project root
  env: {
    ...process.env,
    PORT: port,
  },
});

nextProcess.on('close', (code) => {
  console.log(`[Server] Next.js process exited with code ${code}`);
  process.exit(code ?? 1);
});

nextProcess.on('error', (err) => {
  console.error('[Server] Fatal error starting Next.js:', err);
  process.exit(1);
});

console.log(`[Server] > Spawning Next.js: ${command} ${args.join(' ')}`);
console.log(`[Server] > Ready on http://localhost:${port}`);
