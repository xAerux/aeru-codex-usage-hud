import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';

const RAW_CAPTURE_SUFFIX = 'RAW-UPSTREAM-SSE.txt';
const CACHE_MS = 10_000;
let cachedFiles = new Map();
let cachedAt = 0;
let cachedResult = null;

function homeDir() {
  return process.env.USERPROFILE || process.env.HOME || os.homedir() || '';
}

function captureDir() {
  const codexHome = process.env.CODEX_HOME || path.join(homeDir(), '.codex');
  return process.env.AERU_OLLAMA_CAPTURE_DIR || path.join(codexHome, 'local14b-tool-adapter', 'captures');
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function dateFromName(name) {
  const match = name.match(/^\d+-([0-9]{4}-[0-9]{2}-[0-9]{2})T/);
  return match ? match[1] : null;
}

async function readCapture(file, name) {
  const result = { inputTokens: 0, outputTokens: 0, totalTokens: 0, responses: 0, model: 'unknown', date: dateFromName(name) };
  let latest = null;
  const input = fs.createReadStream(file, { encoding: 'utf8' });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  try {
    for await (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      let event;
      try { event = JSON.parse(line.slice(6)); } catch { continue; }
      if (event.type === 'response.completed' && event.response && typeof event.response === 'object') latest = event.response;
    }
  } finally {
    lines.close();
    input.destroy();
  }

  const usage = latest?.usage;
  if (!usage || typeof usage !== 'object') return result;
  result.inputTokens = number(usage.input_tokens ?? usage.prompt_tokens);
  result.outputTokens = number(usage.output_tokens ?? usage.completion_tokens);
  result.totalTokens = number(usage.total_tokens) || result.inputTokens + result.outputTokens;
  result.model = typeof latest.model === 'string' && latest.model ? latest.model : 'unknown';
  if (result.totalTokens > 0) result.responses = 1;
  return result;
}

function summarize(files) {
  const summary = {
    available: true,
    captureFiles: files.size,
    responses: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    models: [],
    dailyUsageBuckets: [],
  };
  const models = new Map();
  const days = new Map();
  for (const entry of files.values()) {
    if (!entry.usage.responses) continue;
    summary.responses += entry.usage.responses;
    summary.inputTokens += entry.usage.inputTokens;
    summary.outputTokens += entry.usage.outputTokens;
    summary.totalTokens += entry.usage.totalTokens;
    models.set(entry.usage.model, (models.get(entry.usage.model) || 0) + entry.usage.totalTokens);
    if (entry.usage.date) days.set(entry.usage.date, (days.get(entry.usage.date) || 0) + entry.usage.totalTokens);
  }
  summary.models = [...models.entries()].map(([name, tokens]) => ({ name, tokens })).sort((a, b) => b.tokens - a.tokens);
  summary.dailyUsageBuckets = [...days.entries()].map(([startDate, tokens]) => ({ startDate, tokens })).sort((a, b) => a.startDate.localeCompare(b.startDate));
  return summary;
}

export async function readLocalOllamaUsage() {
  if (cachedResult && Date.now() - cachedAt < CACHE_MS) return cachedResult;
  const directory = captureDir();
  try {
    const names = (await fsp.readdir(directory)).filter((name) => name.endsWith(RAW_CAPTURE_SUFFIX));
    const present = new Set(names);
    for (const name of cachedFiles.keys()) if (!present.has(name)) cachedFiles.delete(name);
    await Promise.all(names.map(async (name) => {
      const file = path.join(directory, name);
      try {
        const stat = await fsp.stat(file);
        const existing = cachedFiles.get(name);
        if (existing && existing.size === stat.size && existing.mtimeMs === stat.mtimeMs) return;
        const usage = await readCapture(file, name);
        cachedFiles.set(name, { size: stat.size, mtimeMs: stat.mtimeMs, usage });
      } catch {
        // A capture can be rotated or removed while the folder is being scanned.
      }
    }));
    cachedResult = summarize(cachedFiles);
    cachedAt = Date.now();
    return cachedResult;
  } catch {
    const result = { available: false, reason: 'Local Ollama adapter captures were not found.', captureFiles: 0, responses: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, models: [], dailyUsageBuckets: [] };
    cachedResult = result;
    cachedAt = Date.now();
    return result;
  }
}
