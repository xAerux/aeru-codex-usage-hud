#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scanUsage } from './usage.js';

const HOST = '127.0.0.1';
const PREFERRED = Number(process.env.PORT) || 8787;
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const FORCE_SAMPLE = process.argv.includes('--sample');
const SHOULD_OPEN = !process.argv.includes('--no-open');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function send(response, status, body, type) {
  response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  response.end(body);
}

function openBrowser(url) {
  if (process.platform === 'win32') execFile('cmd', ['/c', 'start', '', url], { windowsHide: true });
  else if (process.platform === 'darwin') execFile('open', [url]);
  else execFile('xdg-open', [url]);
}

function createServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url || '/', `http://${HOST}`);
    if (url.pathname === '/api/usage') {
      try {
        const source = url.searchParams.get('source') || 'codex';
        const weekOffset = Number(url.searchParams.get('weekOffset')) || 0;
        const data = await scanUsage({
          source,
          weekOffset,
          allowSample: FORCE_SAMPLE,
          endpoint: '',
        });
        send(response, 200, JSON.stringify(data), 'application/json; charset=utf-8');
      } catch (error) {
        send(response, 500, JSON.stringify({ error: 'Unable to scan local history.', detail: error.message }), 'application/json; charset=utf-8');
      }
      return;
    }
    const rel = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT)) {
      send(response, 403, 'Forbidden', 'text/plain; charset=utf-8');
      return;
    }
    try {
      const body = await fsp.readFile(file);
      send(response, 200, body, TYPES[path.extname(file)] || 'application/octet-stream');
    } catch {
      send(response, 404, 'Not found', 'text/plain; charset=utf-8');
    }
  });
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, HOST);
  });
}

const server = createServer();
let port = PREFERRED;
for (; port < PREFERRED + 10; port += 1) {
  try {
    await listen(server, port);
    break;
  } catch (error) {
    if (error.code !== 'EADDRINUSE' || port === PREFERRED + 9) throw error;
  }
}

const endpoint = `${HOST}:${port}`;
const url = `http://${endpoint}`;
console.log('\nCODEX TOKEN USAGE DASHBOARD');
console.log('Local Codex history. Nothing is uploaded.\n');
console.log(`Dashboard  ${url}`);
console.log('Codex      ~/.codex   (override with AERU_CODEX_DIR)\n');
if (SHOULD_OPEN) openBrowser(url);

const close = () => server.close(() => process.exit(0));
process.once('SIGINT', close);
process.once('SIGTERM', close);
