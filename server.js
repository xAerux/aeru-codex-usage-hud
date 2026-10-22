#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scanUsage } from './usage.js';
import { readAccountUsage } from './codex-account-usage.js';
import { readLocalOllamaUsage } from './local-ollama-usage.js';

const HOST = '127.0.0.1';
const PREFERRED = Number(process.env.PORT) || 8787;
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const FORCE_SAMPLE = process.argv.includes('--sample');
const SHOULD_OPEN = !process.argv.includes('--no-open');
let accountCache = null;
let accountCacheAt = 0;
let accountRequest = null;

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

async function cachedAccountUsage() {
  if (accountCache && Date.now() - accountCacheAt < 60_000) return accountCache;
  if (!accountRequest) {
    accountRequest = readAccountUsage().catch(() => ({
      available: false,
      reason: 'Codex account usage is unavailable; showing local history.',
    }));
  }
  accountCache = await accountRequest;
  accountCacheAt = Date.now();
  accountRequest = null;
  return accountCache;
}

function formatTokens(value) {
  if (value >= 1e9) {
    const billions = value / 1e9;
    const digits = billions >= 100 ? 0 : billions >= 10 ? 1 : 2;
    return `${Number(billions.toFixed(digits)).toLocaleString('en-US')} billion`;
  }
  if (value >= 1e6) return `${Number((value / 1e6).toFixed(3)).toLocaleString('en-US')} million`;
  return Math.round(value).toLocaleString('en-US');
}

function formatCompactTokens(value) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(value >= 1e10 ? 1 : 2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  return Math.round(value).toLocaleString('en-US');
}

function mergeDailyBuckets(accountBuckets, ollamaBuckets) {
  const daily = new Map();
  for (const bucket of [...(accountBuckets || []), ...(ollamaBuckets || [])]) {
    daily.set(bucket.startDate, (daily.get(bucket.startDate) || 0) + Number(bucket.tokens || 0));
  }
  return [...daily.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([, tokens]) => tokens);
}

function applyAccountUsage(view, accountUsage, ollamaUsage) {
  view.accountUsage = accountUsage;
  view.ollamaUsage = ollamaUsage;
  if (!view.kpis || !view.stats) return;
  if (!accountUsage.available) {
    if (ollamaUsage?.available && ollamaUsage.totalTokens > 0) {
      const localTotal = Math.round(view.stats.totalTokens || 0);
      const combined = localTotal + Math.round(ollamaUsage.totalTokens);
      const formatted = formatTokens(combined);
      view.kpis.total = {
        value: formatted.replace(/ (billion|million)$/, ''),
        unit: formatted.match(/ (billion|million)$/)?.[1] || '',
        sub: `Local history ${formatCompactTokens(localTotal)} + Ollama ${formatCompactTokens(ollamaUsage.totalTokens)}`,
      };
      view.footnote = `Local observed total: ${combined.toLocaleString('en-US')} tokens, combining Codex session history and ${Math.round(ollamaUsage.totalTokens).toLocaleString('en-US')} Ollama tokens from ${ollamaUsage.responses.toLocaleString('en-US')} local adapter responses. Sign in to Codex to add the official online account lifetime total.`;
    } else {
      view.footnote = `${view.footnote} ${accountUsage.reason}`;
    }
    return;
  }

  const accountTotal = Math.round(accountUsage.lifetimeTokens);
  const localTotal = Math.round(view.stats.totalTokens || 0);
  const ollamaTotal = ollamaUsage?.available ? Math.round(ollamaUsage.totalTokens || 0) : 0;
  const combinedTotal = accountTotal + ollamaTotal;
  const formatted = formatTokens(combinedTotal);
  view.kpis.total = {
    value: formatted.replace(/ (billion|million)$/, ''),
    unit: formatted.match(/ (billion|million)$/)?.[1] || '',
    sub: `Online ${formatCompactTokens(accountTotal)} + Ollama ${formatCompactTokens(ollamaTotal)}`,
  };
  view.sparks.total = mergeDailyBuckets(accountUsage.dailyUsageBuckets, ollamaUsage?.dailyUsageBuckets);
  view.models = [...(view.models || [])];
  for (const model of ollamaUsage?.models || []) {
    const existing = view.models.find((row) => row.name === model.name);
    if (existing) existing.tokens += model.tokens;
    else view.models.push({ name: model.name, tokens: model.tokens });
  }
  view.models.sort((a, b) => b.tokens - a.tokens);
  view.models = view.models.slice(0, 8);
  const ollamaText = ollamaUsage?.available
    ? `Local Ollama: ${ollamaTotal.toLocaleString('en-US')} tokens across ${ollamaUsage.responses.toLocaleString('en-US')} captured responses.`
    : `Local Ollama captures unavailable: ${ollamaUsage?.reason || 'no adapter capture data found.'}`;
  view.footnote = `Combined total: ${combinedTotal.toLocaleString('en-US')} tokens = paid ChatGPT Codex account lifetime ${accountTotal.toLocaleString('en-US')} + local Ollama ${ollamaTotal.toLocaleString('en-US')}. ${ollamaText} Local Codex session history: ${localTotal.toLocaleString('en-US')} tokens across ${view.stats.sessions} sessions; it is used for project and estimated-cost breakdowns, and is not added because those GPT sessions overlap account usage.`;
}

function createServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url || '/', `http://${HOST}`);
    if (url.pathname === '/api/usage') {
      try {
        const source = url.searchParams.get('source') || 'codex';
        const weekOffset = Number(url.searchParams.get('weekOffset')) || 0;
        const [data, accountUsage, ollamaUsage] = await Promise.all([scanUsage({
          source,
          weekOffset,
          allowSample: FORCE_SAMPLE,
          endpoint: '',
        }), source === 'codex' ? cachedAccountUsage() : Promise.resolve(null), source === 'codex' ? readLocalOllamaUsage() : Promise.resolve(null)]);
        if (accountUsage) applyAccountUsage(data, accountUsage, ollamaUsage);
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
console.log('Local history stays on this computer. If available, Codex retrieves your account usage summary from OpenAI.\n');
console.log(`Dashboard  ${url}`);
console.log('Codex      ~/.codex   (override with AERU_CODEX_DIR)\n');
if (SHOULD_OPEN) openBrowser(url);

const close = () => server.close(() => process.exit(0));
process.once('SIGINT', close);
process.once('SIGTERM', close);
