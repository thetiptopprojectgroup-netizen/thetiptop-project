/**
 * Démarre l’API mock (5000) puis Vite (5174) pour Playwright — un seul processus parent.
 */
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, '..');

function waitFor(url, maxMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      http
        .get(url, (r) => {
          r.resume();
          resolve();
        })
        .on('error', () => {
          if (Date.now() - start > maxMs) reject(new Error(`Timeout waiting for ${url}`));
          else setTimeout(tryOnce, 150);
        });
    };
    tryOnce();
  });
}

const mock = spawn(process.execPath, [path.join(__dirname, 'e2e-mock-api.mjs')], {
  stdio: 'inherit',
});

mock.on('error', (err) => {
  console.error(err);
  process.exit(1);
});

await waitFor('http://127.0.0.1:5000/api/health');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const vite = spawn(
  npmCmd,
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5174'],
  {
    cwd: clientRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }
);

function shutdown(code = 0) {
  try {
    mock.kill();
  } catch {
    /* ignore */
  }
  try {
    vite.kill();
  } catch {
    /* ignore */
  }
  process.exit(code);
}

vite.on('exit', (c) => shutdown(c ?? 0));
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
