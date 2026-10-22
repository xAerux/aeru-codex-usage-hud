import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const REQUEST_TIMEOUT_MS = 12_000;

function codexCandidates() {
  const windows = process.platform === 'win32';
  const executable = windows ? 'codex.exe' : 'codex';
  const candidates = [];
  const add = (value) => {
    if (value && !candidates.includes(value) && fs.existsSync(value)) candidates.push(value);
  };

  add(process.env.CODEX_CLI_PATH);
  for (const folder of (process.env.PATH || '').split(path.delimiter)) add(path.join(folder, executable));

  const localAppData = process.env.LOCALAPPDATA;
  if (windows && localAppData) {
    add(path.join(localAppData, 'Programs', 'OpenAI', 'Codex', 'bin', executable));
    const versionedBin = path.join(localAppData, 'OpenAI', 'Codex', 'bin');
    try {
      const versions = fs.readdirSync(versionedBin, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(versionedBin, entry.name, executable));
      for (const candidate of versions.reverse()) add(candidate);
    } catch { /* The stable installation path or PATH may still be available. */ }
  }

  if (!windows) {
    const home = os.homedir();
    for (const candidate of [
      path.join(home, '.local', 'bin', executable),
      path.join(home, 'bin', executable),
      '/usr/local/bin/codex',
      '/opt/homebrew/bin/codex',
    ]) add(candidate);
  }
  return candidates;
}

function readWithCodex(executable) {
  return new Promise((resolve) => {
    let settled = false;
    let buffer = '';
    let initialized = false;
    let child;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { child?.kill(); } catch { /* The app-server may already have exited. */ }
      resolve(result);
    };
    const timer = setTimeout(() => finish({ available: false, reason: 'Codex account usage did not respond in time.' }), REQUEST_TIMEOUT_MS);

    try {
      child = spawn(executable, ['app-server', '--listen', 'stdio://'], {
        stdio: ['pipe', 'pipe', 'ignore'],
        windowsHide: true,
      });
    } catch {
      finish({ available: false, reason: 'Could not start the Codex app-server.' });
      return;
    }

    child.on('error', () => finish({ available: false, reason: 'Could not start the Codex app-server.' }));
    child.on('exit', () => {
      if (!settled) finish({ available: false, reason: 'Codex account usage is unavailable; showing local history.' });
    });
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      buffer += chunk;
      for (;;) {
        const newline = buffer.indexOf('\n');
        if (newline < 0) break;
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        let message;
        try { message = JSON.parse(line); } catch { continue; }

        if (message.id === 1) {
          if (message.error) {
            finish({ available: false, reason: 'This Codex app-server cannot provide account usage; showing local history.' });
            return;
          }
          initialized = true;
          child.stdin.write(`${JSON.stringify({ method: 'initialized', params: {} })}\n`);
          child.stdin.write(`${JSON.stringify({ method: 'account/usage/read', id: 2 })}\n`);
        } else if (message.id === 2 && initialized) {
          const summary = message.result?.summary;
          const lifetimeTokens = Number(summary?.lifetimeTokens);
          if (message.error || !Number.isFinite(lifetimeTokens) || lifetimeTokens < 0) {
            finish({ available: false, reason: 'Codex account usage is unavailable for the current sign-in; showing local history.' });
            return;
          }
          const dailyUsageBuckets = Array.isArray(message.result.dailyUsageBuckets)
            ? message.result.dailyUsageBuckets
                .filter((bucket) => /^\d{4}-\d{2}-\d{2}$/.test(bucket?.startDate) && Number.isFinite(Number(bucket.tokens)))
                .map((bucket) => ({ startDate: bucket.startDate, tokens: Number(bucket.tokens) }))
            : [];
          finish({
            available: true,
            lifetimeTokens,
            peakDailyTokens: Number.isFinite(Number(summary.peakDailyTokens)) ? Number(summary.peakDailyTokens) : null,
            longestRunningTurnSec: Number.isFinite(Number(summary.longestRunningTurnSec)) ? Number(summary.longestRunningTurnSec) : null,
            currentStreakDays: Number.isFinite(Number(summary.currentStreakDays)) ? Number(summary.currentStreakDays) : null,
            longestStreakDays: Number.isFinite(Number(summary.longestStreakDays)) ? Number(summary.longestStreakDays) : null,
            dailyUsageBuckets,
          });
        }
      }
    });

    child.stdin.on('error', () => finish({ available: false, reason: 'Codex account usage is unavailable; showing local history.' }));
    child.stdin.write(`${JSON.stringify({
      method: 'initialize',
      id: 1,
      params: {
        clientInfo: { name: 'aeru-codex-usage-hud', title: 'Aeru CODEX Usage HUD', version: '0.3.0' },
        capabilities: {},
      },
    })}\n`);
  });
}

export async function readAccountUsage() {
  const candidates = codexCandidates();
  if (!candidates.length) {
    return { available: false, reason: 'Codex CLI was not found; showing local history.' };
  }
  for (const executable of candidates) {
    const result = await readWithCodex(executable);
    if (result.available) return result;
    if (result.reason.includes('did not respond in time')) return result;
  }
  return { available: false, reason: 'Sign in to Codex with ChatGPT to show account lifetime usage. Local history is still available.' };
}
