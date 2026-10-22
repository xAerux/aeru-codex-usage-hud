// @ts-nocheck
/**
 * Local-only usage scan.
 * Codex: ~/.codex/sessions and archived_sessions JSONL.
 *        Sums last_token_usage (per-turn delta). Never sums cumulative totals.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';

const CNY_PER_USD = 7.2;

// Public API list prices, USD per 1M tokens, checked Oct 2026.
// Not a subscription invoice. Cached tokens are priced at the cached rate
// and are NOT also charged as fresh input.
const RATE_TABLE = [
  [/gpt-5\.6-luna/i, 0.2, 0.02, 1.2],
  [/gpt-5\.6-terra/i, 2, 0.2, 12],
  [/gpt-5\.6-sol/i, 4, 0.4, 20],
  [/gpt-6\.1-sol/i, 2, 0.1, 10],
  [/gpt-6-sol/i, 2, 0.2, 10],
  [/gpt-6-luna/i, 0.1, 0.01, 0.5],
  [/gpt-6-astra|gpt-6\.0-astra/i, 10, 1, 50],
  [/gpt-5\.5/i, 5, 0.5, 30],
  [/gpt-5\.4-mini/i, 0.75, 0.075, 4.5],
  [/gpt-5\.4-nano/i, 0.2, 0.02, 1.25],
  [/gpt-5\.4/i, 2.5, 0.25, 15],
  [/gpt-5\.3-codex/i, 1.75, 0.175, 14],
  [/gpt-5\.2/i, 1.75, 0.175, 14],
  [/gpt-5\.1/i, 1.25, 0.125, 10],
  [/gpt-5-mini/i, 0.25, 0.025, 2],
  [/gpt-5-nano/i, 0.05, 0.005, 0.4],
  [/gpt-5/i, 1.25, 0.125, 10],
  [/gpt-4o-mini/i, 0.15, 0.075, 0.6],
  [/gpt-4o/i, 2.5, 1.25, 10],
  [/o4-mini/i, 1.1, 0.275, 4.4],
  [/o3-mini/i, 1.1, 0.55, 4.4],
  [/o1-mini/i, 1.1, 0.55, 4.4],
  [/codex-auto-review/i, 2, 0.2, 8],
  [/grok-build/i, 1, 0.2, 2],
  [/grok-4\.7/i, 2, 0.5, 6],
  [/grok-4\.6/i, 2, 0.5, 6],
  [/grok-4\.5/i, 2, 0.3, 6],
  [/grok-4\.3/i, 1.25, 0.2, 2.5],
  [/grok-4/i, 3, 0.75, 15],
  [/grok-3/i, 3, 0.75, 15],
  [/grok/i, 2, 0.5, 6],
];

const FALLBACK_RATE = [2, 0.2, 8];

function homeDir() {
  return process.env.USERPROFILE || process.env.HOME || os.homedir() || '';
}

export function defaultCodexDir() {
  return process.env.AERU_CODEX_DIR || process.env.CODEX_HOME || path.join(homeDir(), '.codex');
}

export function defaultGrokDir() {
  return process.env.AERU_GROK_DIR || process.env.GROK_HOME || path.join(homeDir(), '.grok');
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function blank() {
  return { input: 0, output: 0, cached: 0, cacheWrite: 0, total: 0, cost: 0 };
}

function addInto(target, slice) {
  target.input += slice.input;
  target.output += slice.output;
  target.cached += slice.cached;
  target.cacheWrite += slice.cacheWrite;
  target.total += slice.total;
  target.cost += slice.cost;
}

function normalizeModel(name) {
  return String(name || 'unknown')
    .trim()
    .replace(/^xai\//i, '')
    .replace(/^x-ai\//i, '')
    .replace(/^openai\//i, '')
    .replace(/-build$/i, '');
}

function rateFor(model) {
  const id = normalizeModel(model);
  for (const row of RATE_TABLE) {
    if (row[0].test(id)) return { input: row[1], cached: row[2], output: row[3], known: true, id };
  }
  return { input: FALLBACK_RATE[0], cached: FALLBACK_RATE[1], output: FALLBACK_RATE[2], known: false, id };
}

function readTokens(raw) {
  if (!raw || typeof raw !== 'object') return null;
  let input = num(raw.inputTokens ?? raw.input_tokens ?? raw.promptTokens ?? raw.prompt_tokens ?? raw.input);
  const output = num(raw.outputTokens ?? raw.output_tokens ?? raw.completionTokens ?? raw.completion_tokens ?? raw.output);
  let cached = num(
    raw.cachedReadTokens ??
      raw.cached_read_tokens ??
      raw.cachedInputTokens ??
      raw.cached_input_tokens ??
      raw.cache_read_input_tokens ??
      raw.cacheReadTokens ??
      raw.cached,
  );
  const cacheWrite = num(
    raw.cacheCreationTokens ?? raw.cache_creation_tokens ?? raw.cacheWriteTokens ?? raw.cache_write_tokens ?? raw.cache_write_input_tokens,
  );
  // Some logs report fresh input only, with cache beside it.
  if (cached + cacheWrite > input && input >= 0 && cached > 0) input += cached + cacheWrite;
  cached = Math.min(cached, input);
  const total = num(raw.totalTokens ?? raw.total_tokens ?? raw.total) || input + output;
  if (!input && !output && !total && !cached) return null;
  return { input, output, cached, cacheWrite, total: total || input + output };
}

function priceSlice(tokens, model, ticks) {
  const rate = rateFor(model);
  const tickCost = num(ticks);
  let cost = 0;
  let pricedByTable = true;
  if (tickCost > 0) {
    cost = tickCost / 1e10;
    pricedByTable = false;
  } else {
    const uncached = Math.max(0, tokens.input - tokens.cached - tokens.cacheWrite);
    cost = (uncached * rate.input + tokens.cached * rate.cached + tokens.cacheWrite * rate.input + tokens.output * rate.output) / 1e6;
  }
  return { ...tokens, cost, model: rate.id || normalizeModel(model), knownRate: rate.known, pricedByTable };
}

function parseTime(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null;
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    if (/^\d+(\.\d+)?$/.test(value.trim())) return parseTime(Number(value));
    const t = Date.parse(value);
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

function dateKeyFromMs(ms) {
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayKey() {
  return dateKeyFromMs(Date.now());
}

function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function projectFromCwd(cwd, root) {
  if (!cwd || typeof cwd !== 'string') return 'Unattributed';
  let decoded = cwd;
  try {
    decoded = decodeURIComponent(cwd);
  } catch {
    decoded = cwd;
  }
  const normalized = path.normalize(decoded);
  if (root && normalized.toLowerCase().startsWith(path.normalize(root).toLowerCase())) return 'Workspace';
  const base = path.basename(normalized);
  if (!base || base === '.' || base === path.parse(normalized).root) return 'Unattributed';
  return base;
}

async function exists(dir) {
  try {
    const stat = await fsp.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function listFiles(folder, predicate) {
  const files = [];
  async function visit(current, depth) {
    if (depth > 8) return;
    let entries;
    try {
      entries = await fsp.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(full, depth + 1);
      else if (entry.isFile() && predicate(full, entry.name)) files.push(full);
    }
  }
  if (await exists(folder)) await visit(folder, 0);
  return files;
}

function emptyScan(source) {
  return {
    source,
    found: false,
    files: 0,
    skipped: 0,
    sessions: [],
    daily: new Map(),
    projects: new Map(),
    models: new Map(),
    totals: blank(),
    unknownModels: new Set(),
  };
}

function bucket(map, key) {
  if (!map.has(key)) map.set(key, blank());
  return map.get(key);
}

function applySlice(scan, session, slice, day) {
  addInto(scan.totals, slice);
  addInto(session.usage, slice);
  addInto(bucket(scan.projects, session.project), slice);
  addInto(bucket(scan.models, slice.model || session.model || 'unknown'), slice);
  if (!slice.knownRate && slice.pricedByTable) scan.unknownModels.add(slice.model || 'unknown');
  if (day) addInto(bucket(scan.daily, day), slice);
  session.turns += 1;
  if ((slice.total || 0) >= (session.peakTurn || 0)) session.peakTurn = slice.total;
}

async function scanCodex(codexDir) {
  const scan = emptyScan('codex');
  scan.found = await exists(codexDir);
  if (!scan.found) return scan;
  const files = [
    ...(await listFiles(path.join(codexDir, 'sessions'), (_f, name) => name.toLowerCase().endsWith('.jsonl'))),
    ...(await listFiles(path.join(codexDir, 'archived_sessions'), (_f, name) => name.toLowerCase().endsWith('.jsonl'))),
  ];
  // Some installs drop jsonl directly under ~/.codex/sessions only; also accept a flat sessions folder.
  scan.files = files.length;
  const seenSessions = new Set();
  const seenResponses = new Set();

  for (const file of files) {
    const session = {
      id: path.basename(file),
      source: 'codex',
      project: 'Unattributed',
      title: '',
      model: 'unknown',
      usage: blank(),
      turns: 0,
      cwd: '',
    };
    const counts = [];
    const records = [];
    let malformed = 0;
    try {
      const stream = fs.createReadStream(file, { encoding: 'utf8' });
      const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
      for await (const line of lines) {
        if (!line || line.length > 2_000_000) continue;
        const trimmed = line.trim();
        if (!trimmed) continue;
        let record;
        try {
          record = JSON.parse(trimmed);
        } catch {
          malformed += 1;
          continue;
        }
        const payload = record.payload && typeof record.payload === 'object' ? record.payload : {};
        const stamp = parseTime(record.timestamp || payload.timestamp || record.time);
        if (record.type === 'session_meta') {
          session.id = payload.id || payload.session_id || session.id;
          session.cwd = payload.cwd || session.cwd;
          session.title = safeTitle(payload) || session.title;
          if (payload.model) session.model = normalizeModel(payload.model);
        }
        if (record.type === 'turn_context') {
          if (payload.model) session.model = normalizeModel(payload.model);
          if (payload.cwd) session.cwd = payload.cwd;
        }
        const info = payload.info && typeof payload.info === 'object' ? payload.info : payload;
        const isCount =
          (record.type === 'event_msg' && (payload.type === 'token_count' || payload.type === 'token_usage')) ||
          record.type === 'token_count';
        if (isCount) {
          const last = info.last_token_usage || payload.last_token_usage;
          const total = info.total_token_usage || payload.total_token_usage;
          const model = normalizeModel(info.model || payload.model || session.model);
          counts.push({ last, total, model, stamp });
          continue;
        }
        if (record.type === 'token_usage_record' || record.type === 'token_usage') {
          const responseId = payload.response_id || payload.responseId || record.response_id || '';
          const usage = payload.usage || payload.turn_token_usage || payload.last_token_usage || info;
          const model = normalizeModel(payload.model || payload.model_id || session.model);
          records.push({ responseId, usage, model, stamp });
        }
      }
      lines.close();
      stream.destroy();
    } catch {
      scan.skipped += 1;
      continue;
    }
    scan.skipped += malformed ? 0 : 0;
    if (malformed) scan.malformed = (scan.malformed || 0) + malformed;
    if (seenSessions.has(session.id)) continue;
    seenSessions.add(session.id);
    session.project = projectFromCwd(session.cwd, codexDir);

    if (counts.length) {
      let prev = null;
      for (const event of counts) {
        let tokens = null;
        if (event.last) tokens = readTokens(event.last);
        else if (event.total) {
          const cur = readTokens(event.total);
          if (cur) {
            if (!prev || cur.total + 1 < prev.total) tokens = cur;
            else {
              tokens = {
                input: Math.max(0, cur.input - prev.input),
                output: Math.max(0, cur.output - prev.output),
                cached: Math.max(0, cur.cached - prev.cached),
                cacheWrite: Math.max(0, cur.cacheWrite - prev.cacheWrite),
                total: Math.max(0, cur.total - prev.total),
              };
              if (!tokens.input && !tokens.output && !tokens.total) tokens = null;
            }
            prev = cur;
          }
        }
        if (!tokens) continue;
        const slice = priceSlice(tokens, event.model, 0);
        applySlice(scan, session, slice, event.stamp ? dateKeyFromMs(event.stamp) : null);
      }
    } else {
      for (const event of records) {
        if (event.responseId) {
          if (seenResponses.has(event.responseId)) continue;
          seenResponses.add(event.responseId);
        }
        const tokens = readTokens(event.usage);
        if (!tokens) continue;
        const slice = priceSlice(tokens, event.model, 0);
        applySlice(scan, session, slice, event.stamp ? dateKeyFromMs(event.stamp) : null);
      }
    }
    if (session.turns > 0) scan.sessions.push(session);
  }
  return scan;
}

function safeTitle(payload) {
  for (const key of ['title', 'name', 'thread_name', 'session_title']) {
    const value = payload[key];
    if (typeof value === 'string') {
      const clean = value.replace(/\s+/g, ' ').trim();
      if (clean && clean.length <= 80 && !/^(you|user)\b/i.test(clean)) return clean;
    }
  }
  return '';
}

function grokUpdate(record) {
  const candidates = [record?.params?.update, record?.update, record?.payload, record];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const kind = candidate.sessionUpdate || candidate.session_update || candidate.type;
    if (kind === 'turn_completed' || kind === 'turn_complete') return candidate;
  }
  return null;
}

async function scanGrok(grokDir) {
  const scan = emptyScan('grok');
  scan.found = await exists(grokDir);
  if (!scan.found) return scan;
  const sessionRoot = path.join(grokDir, 'sessions');
  const files = (await listFiles(sessionRoot, (_full, name) => name === 'updates.jsonl')).filter(
    (file) => !file.split(path.sep).includes('subagents'),
  );
  scan.files = files.length;
  const seenPrompts = new Set();

  for (const file of files) {
    const parts = file.split(path.sep);
    const sessionId = parts[parts.length - 2] || path.basename(file);
    const encodedCwd = parts[parts.length - 3] || '';
    let summary = null;
    try {
      summary = JSON.parse(await fsp.readFile(path.join(path.dirname(file), 'summary.json'), 'utf8'));
    } catch {
      summary = null;
    }
    const session = {
      id: sessionId,
      source: 'grok',
      project: projectFromCwd(summary?.cwd || encodedCwd, grokDir),
      title: safeTitle(summary || {}),
      model: normalizeModel(summary?.model || summary?.defaultModel || 'grok'),
      usage: blank(),
      turns: 0,
      cwd: summary?.cwd || '',
    };
    let lineNo = 0;
    try {
      const stream = fs.createReadStream(file, { encoding: 'utf8' });
      const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
      for await (const line of lines) {
        lineNo += 1;
        if (!line || line.length > 2_000_000 || !line.includes('turn_complete')) continue;
        let record;
        try {
          record = JSON.parse(line);
        } catch {
          scan.malformed = (scan.malformed || 0) + 1;
          continue;
        }
        const update = grokUpdate(record);
        if (!update) continue;
        const usage = update.usage || update.tokenUsage || update.token_usage;
        if (!usage || typeof usage !== 'object') continue;
        const promptId = update.promptId || update.prompt_id || update.id || record.id || '';
        const dedupeKey = promptId ? `p:${promptId}` : `f:${file}:${lineNo}`;
        if (seenPrompts.has(dedupeKey)) continue;
        seenPrompts.add(dedupeKey);
        const stamp = parseTime(
          record.timestamp || record.time || record.params?.timestamp || update.timestamp || update.completedAt || update.completed_at,
        );
        const day = stamp ? dateKeyFromMs(stamp) : null;
        const modelUsage = usage.modelUsage || usage.model_usage;
        const rows =
          modelUsage && typeof modelUsage === 'object' && !Array.isArray(modelUsage)
            ? Object.entries(modelUsage).map(([model, value]) => ({
                model,
                usage: value,
                ticks: value?.costUsdTicks ?? value?.cost_usd_ticks,
              }))
            : [
                {
                  model: usage.model || update.model || session.model,
                  usage,
                  ticks: usage.costUsdTicks ?? usage.cost_usd_ticks,
                },
              ];
        for (const row of rows) {
          const tokens = readTokens(row.usage || {});
          if (!tokens) continue;
          const slice = priceSlice(tokens, row.model, row.ticks);
          session.model = slice.model || session.model;
          applySlice(scan, session, slice, day);
        }
      }
      lines.close();
      stream.destroy();
    } catch {
      scan.skipped += 1;
      continue;
    }
    if (session.turns > 0) scan.sessions.push(session);
  }
  return scan;
}

function mergeScans(scans) {
  const merged = emptyScan('all');
  merged.found = scans.some((scan) => scan.found);
  for (const scan of scans) {
    merged.files += scan.files;
    merged.skipped += scan.skipped;
    merged.malformed = (merged.malformed || 0) + (scan.malformed || 0);
    merged.sessions.push(...scan.sessions);
    addInto(merged.totals, scan.totals);
    for (const [key, value] of scan.daily) addInto(bucket(merged.daily, key), value);
    for (const [key, value] of scan.projects) addInto(bucket(merged.projects, key), value);
    for (const [key, value] of scan.models) addInto(bucket(merged.models, key), value);
    for (const model of scan.unknownModels) merged.unknownModels.add(model);
  }
  return merged;
}

function trimNum(value, digits) {
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function humanTokens(n) {
  const abs = Math.abs(n);
  if (abs >= 1e9) {
    const v = n / 1e9;
    const digits = v >= 100 ? 0 : v >= 10 ? 1 : 2;
    return { value: trimNum(v, digits), unit: 'billion' };
  }
  if (abs >= 1e6) {
    const v = n / 1e6;
    const digits = v >= 100 ? 0 : 3;
    return { value: trimNum(v, digits), unit: 'million' };
  }
  if (abs >= 1000) return { value: Math.round(n).toLocaleString('en-US'), unit: '' };
  return { value: String(Math.round(n)), unit: '' };
}

function money(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function yen(usd) {
  return `¥${(usd * CNY_PER_USD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function sentenceTokens(n) {
  const human = humanTokens(n);
  if (!human.unit) return `${human.value} tokens`;
  return `${human.value} ${human.unit} tokens`;
}

function longDate(key) {
  if (!key) return 'No dated usage';
  return keyToDate(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function axisDay(key) {
  const date = keyToDate(key);
  const wd = date.toLocaleDateString('en-US', { weekday: 'short' });
  const [, m, d] = key.split('-');
  return `${wd} ${m}-${d}`;
}

function series(daily, keys, pick) {
  return keys.map((key) => pick(daily.get(key) || blank()));
}

function lastKeys(daily, count) {
  const end = keyToDate(todayKey());
  const keys = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(end);
    date.setDate(end.getDate() - i);
    keys.push(dateKeyFromMs(date.getTime()));
  }
  return keys;
}

function buildWeeks(daily) {
  const keys = [...daily.keys()].sort();
  const today = keyToDate(todayKey());
  if (!keys.length) {
    const days = weekKeys(0);
    return [{ offset: 0, title: 'Last 7 days', range: `${longDate(days[0])} – ${longDate(days[6])}`, tokens: 0 }];
  }
  const earliest = keyToDate(keys[0]);
  const diffDays = Math.max(0, Math.floor((today.getTime() - earliest.getTime()) / 86400000));
  const maxOffset = Math.max(0, Math.floor(diffDays / 7));
  const weeks = [];
  for (let offset = 0; offset <= maxOffset; offset += 1) {
    const days = weekKeys(offset);
    const tokens = days.reduce((sum, key) => sum + (daily.get(key)?.total || 0), 0);
    if (!tokens && offset !== 0) continue;
    weeks.push({
      offset,
      title: offset === 0 ? 'Last 7 days' : `${axisDay(days[0])} – ${axisDay(days[6])}`,
      range: `${longDate(days[0])} – ${longDate(days[6])}`,
      tokens,
    });
  }
  return weeks.length ? weeks : [{ offset: 0, title: 'Last 7 days', range: '', tokens: 0 }];
}

function weekKeys(offset) {
  const end = keyToDate(todayKey());
  end.setDate(end.getDate() - offset * 7);
  const keys = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(end);
    date.setDate(end.getDate() - i);
    keys.push(dateKeyFromMs(date.getTime()));
  }
  return keys;
}

function finePrint() {
  return 'AGGREGATED BY LAST_TOKEN_USAGE, WITH THE AMOUNT ESTIMATED BASED ON THE PUBLICLY AVAILABLE PRICE FROM THE OPENAI API.';
}

export function toView(scan, meta) {
  const source = meta.source;
  const weeks = buildWeeks(scan.daily);
  const selected = weeks.find((week) => week.offset === meta.weekOffset) || weeks[0];
  const days = weekKeys(selected.offset);
  const validKeys = [...scan.daily.keys()].filter((key) => (scan.daily.get(key)?.total || 0) > 0);
  const totals = scan.totals;
  const today = scan.daily.get(todayKey()) || blank();
  const average = validKeys.length ? totals.total / validKeys.length : 0;
  const cacheRate = totals.input ? Math.max(0, Math.min(100, (totals.cached / totals.input) * 100)) : 0;
  const humanTotal = humanTokens(totals.total);
  const humanToday = humanTokens(today.total);
  const humanAvg = humanTokens(average);
  const humanCached = humanTokens(totals.cached);
  const sparkKeys = lastKeys(scan.daily, 14);
  const sparkTotals = series(scan.daily, sparkKeys, (row) => row.total);
  const sparkCost = series(scan.daily, sparkKeys, (row) => row.cost);
  const sparkCache = series(scan.daily, sparkKeys, (row) => (row.input ? (row.cached / row.input) * 100 : 0));
  const sparkOutput = series(scan.daily, sparkKeys, (row) => row.output);

  let bestDay = null;
  let bestCost = null;
  let bestOutput = null;
  for (const [key, value] of scan.daily) {
    if (!bestDay || value.total > bestDay.value.total) bestDay = { key, value };
    if (!bestCost || value.cost > bestCost.value.cost) bestCost = { key, value };
    if (!bestOutput || value.output > bestOutput.value.output) bestOutput = { key, value };
  }
  const bestSession = [...scan.sessions].sort((a, b) => b.usage.total - a.usage.total)[0] || null;
  const cacheSession =
    [...scan.sessions]
      .filter((session) => session.usage.input >= 1000 && session.usage.cached > 0)
      .sort((a, b) => b.usage.cached / b.usage.input - a.usage.cached / a.usage.input)[0] || null;
  const projects = [...scan.projects.entries()].sort((a, b) => b[1].total - a[1].total);
  const models = [...scan.models.entries()].sort((a, b) => b[1].total - a[1].total);
  const topProject = projects[0];

  const projectRows = projects.map(([name, value], index) => ({
    rank: index + 1,
    name,
    detail: `${sentenceTokens(value.total)} · ${money(value.cost)}`,
    pct: totals.total ? (value.total / totals.total) * 100 : 0,
  }));

  const modelRows = models.slice(0, 8).map(([name, value]) => ({ name, tokens: value.total }));

  const maxDayHuman = bestDay ? humanTokens(bestDay.value.total) : { value: '—', unit: '' };
  const maxSessionHuman = bestSession ? humanTokens(bestSession.usage.total) : { value: '—', unit: '' };
  const peakOut = bestOutput ? humanTokens(bestOutput.value.output) : { value: '—', unit: '' };
  const topHuman = topProject ? humanTokens(topProject[1].total) : null;

  const footnote = footnoteFor(scan, meta);

  return {
    mode: 'live',
    source: 'codex',
    wordmark: 'CODEX',
    fine: finePrint(),
    available: meta.available,
    generatedAt: new Date().toISOString(),
    endpoint: meta.endpoint || '',
    kpis: {
      today: { value: today.total ? humanToday.value : '0', unit: today.total ? humanToday.unit : '', sub: `${Math.round(today.total).toLocaleString('en-US')} tokens` },
      total: { value: totals.total ? humanTotal.value : '0', unit: totals.total ? humanTotal.unit : '', sub: `${Math.round(totals.total).toLocaleString('en-US')} tokens` },
      cost: { value: money(totals.cost), unit: '', sub: yen(totals.cost) },
      cache: { value: cacheRate.toFixed(0), unit: '%', sub: `${humanCached.value}${humanCached.unit ? ` ${humanCached.unit}` : ''} cached` },
      average: {
        value: average ? humanAvg.value : '0',
        unit: average ? humanAvg.unit : '',
        sub: `${validKeys.length} valid date${validKeys.length === 1 ? '' : 's'}`,
      },
    },
    sparks: { today: sparkTotals, total: sparkTotals, cost: sparkCost, cache: sparkCache, average: sparkTotals },
    rangeLabel: selected.range,
    weekPreset: selected.title,
    days: days.map((key) => {
      const row = scan.daily.get(key) || blank();
      return { label: axisDay(key), tokens: row.total, tip: `${longDate(key)} · ${Math.round(row.total).toLocaleString('en-US')} tokens` };
    }),
    weeks: weeks.map((week) => ({ offset: week.offset, title: week.title, range: week.range })),
    weekOffset: selected.offset,
    projects: projectRows,
    models: modelRows,
    highlights: [
      {
        key: 'coins',
        label: 'Maximum daily dosage',
        value: maxDayHuman.value,
        unit: maxDayHuman.unit,
        sub: bestDay ? `${longDate(bestDay.key)} · ${Math.round(bestDay.value.total).toLocaleString('en-US')} tokens` : 'No dated usage',
        spark: sparkTotals,
      },
      {
        key: 'dollar',
        label: 'Highest cost day',
        value: bestCost ? money(bestCost.value.cost) : '—',
        unit: '',
        sub: bestCost ? `${longDate(bestCost.key)} · ${sentenceTokens(bestCost.value.total)}` : 'No dated usage',
        spark: sparkCost,
      },
      {
        key: 'target',
        label: 'Highest cache hit session',
        value: cacheSession ? ((cacheSession.usage.cached / cacheSession.usage.input) * 100).toFixed(0) : '0',
        unit: '%',
        sub: cacheSession
          ? `${cacheSession.title || cacheSession.project} · ${sentenceTokens(cacheSession.usage.cached).replace(' tokens', '')} cached`
          : 'No cached session yet',
        spark: sparkCache,
      },
      {
        key: 'cube',
        label: 'Highest single session',
        value: maxSessionHuman.value,
        unit: maxSessionHuman.unit,
        sub: bestSession ? `${bestSession.project} · ${money(bestSession.usage.cost)}` : 'No session yet',
        spark: sparkTotals,
      },
      {
        key: 'bolt',
        label: 'Peak output day',
        value: peakOut.value,
        unit: peakOut.unit,
        sub: bestOutput ? `${longDate(bestOutput.key)} · Output tokens` : 'No output recorded',
        spark: sparkOutput,
      },
      {
        key: 'grid',
        label: 'Most active projects',
        value: topProject ? topProject[0] : '—',
        unit: '',
        sub: topProject ? `${sentenceTokens(topProject[1].total)} · ${money(topProject[1].cost)}` : 'No workspace recorded',
        spark: sparkTotals,
      },
    ],
    footnote,
    stats: {
      totalTokens: totals.total,
      inputTokens: totals.input,
      outputTokens: totals.output,
      cachedTokens: totals.cached,
      costUsd: totals.cost,
      sessions: scan.sessions.length,
      files: scan.files,
    },
  };
}

function footnoteFor(scan, meta) {
  const parts = [];
  const codex = meta.codex;
  if (!codex.found) parts.push('No Codex folder at ~/.codex.');
  else if (!codex.sessions.length) parts.push('Codex folder found, but no token records yet.');
  else parts.push(`Codex: ${codex.sessions.length} session${codex.sessions.length === 1 ? '' : 's'} from local history.`);
  if (scan.unknownModels.size) parts.push('Unlisted models use the reference rate of $2 / $0.20 cached / $8 per 1M.');
  parts.push('Estimates are not an invoice.');
  return parts.join(' ');
}

export async function scanUsage(options = {}) {
  const weekOffset = Math.max(0, Math.floor(num(options.weekOffset)));
  const codexDir = options.codexDir || defaultCodexDir();
  const codex = await scanCodex(codexDir);
  const available = { codex: codex.found };
  if (options.allowSample && codex.sessions.length === 0) {
    return {
      mode: 'sample',
      source: 'codex',
      available,
      generatedAt: new Date().toISOString(),
      endpoint: options.endpoint || '',
      weekOffset,
    };
  }
  return toView(codex, { source: 'codex', weekOffset, available, endpoint: options.endpoint || '', codex });
}
