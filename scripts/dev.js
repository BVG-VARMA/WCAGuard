import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('🛡️  Starting WCAGuard Dev Cluster...');
console.log('   • Server:    http://localhost:4000');
console.log('   • Dashboard: http://localhost:3000');
console.log('   • Demo App:  http://localhost:5173\n');

function runService(name, cwd, command, args) {
  const child = spawn(command, args, {
    cwd: path.join(ROOT_DIR, cwd),
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (err) => {
    console.error(`[${name}] Failed to start:`, err);
  });

  child.on('exit', (code) => {
    console.log(`[${name}] Process exited with code ${code}`);
  });

  return child;
}

const serverProcess = runService('Server', 'server', 'node', ['--watch', 'src/index.js']);
const demoProcess = runService('DemoApp', 'demo-app', npmCmd, ['run', 'dev']);
const clientProcess = runService('Client', 'client', npmCmd, ['run', 'dev']);

process.on('SIGINT', () => {
  serverProcess.kill();
  demoProcess.kill();
  clientProcess.kill();
  process.exit();
});
