import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { scanUsage } from './usage.js';

async function temp() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'hud-'));
}

test('codex sums last_token_usage and does not double-count cumulative totals', async () => {
  const root = await temp();
  const codex = path.join(root, 'codex', 'sessions', '2026', '10', '16');
  await fs.mkdir(codex, { recursive: true });
  const lines = [
    JSON.stringify({ timestamp: '2026-10-16T15:00:00.000Z', type: 'session_meta', payload: { id: 's1', cwd: '/work/ne', title: 'Vault discovery' } }),
    JSON.stringify({ timestamp: '2026-10-16T15:00:01.000Z', type: 'turn_context', payload: { model: 'gpt-5.6-luna' } }),
    JSON.stringify({
      timestamp: '2026-10-16T15:00:02.000Z',
      type: 'event_msg',
      payload: {
        type: 'token_count',
        info: {
          total_token_usage: { input_tokens: 1000, cached_input_tokens: 800, output_tokens: 100, total_tokens: 1100 },
          last_token_usage: { input_tokens: 1000, cached_input_tokens: 800, output_tokens: 100, total_tokens: 1100 },
        },
      },
    }),
    JSON.stringify({
      timestamp: '2026-10-16T15:05:00.000Z',
      type: 'event_msg',
      payload: {
        type: 'token_count',
        info: {
          total_token_usage: { input_tokens: 5000, cached_input_tokens: 4000, output_tokens: 400, total_tokens: 5400 },
          last_token_usage: { input_tokens: 4000, cached_input_tokens: 3200, output_tokens: 300, total_tokens: 4300 },
        },
      },
    }),
  ];
  await fs.writeFile(path.join(codex, 'rollout-s1.jsonl'), lines.join('\n'));
  const view = await scanUsage({ codexDir: path.join(root, 'codex'), grokDir: path.join(root, 'missing-grok'), source: 'codex', allowSample: false });
  assert.equal(view.mode, 'live');
  assert.equal(view.stats.totalTokens, 5400);
  assert.equal(view.stats.cachedTokens, 4000);
  assert.equal(view.projects[0].name, 'ne');
  assert.ok(view.stats.costUsd > 0);
  assert.ok(view.stats.costUsd < 0.01);
});

test('duplicate codex response ids are counted once', async () => {
  const root = await temp();
  const dir = path.join(root, 'codex', 'sessions');
  await fs.mkdir(dir, { recursive: true });
  const line = (id) =>
    JSON.stringify({
      timestamp: '2026-10-15T12:00:00.000Z',
      type: 'token_usage_record',
      payload: { response_id: 'r1', session_id: id, model: 'gpt-5.6-sol', usage: { input_tokens: 100, cached_input_tokens: 10, output_tokens: 20, total_tokens: 120 }, cwd: '/work/files-pasted' },
    });
  // session id comes from session_meta; without it the file basename is the id.
  await fs.writeFile(path.join(dir, 'a.jsonl'), [JSON.stringify({ type: 'session_meta', payload: { id: 's2', cwd: '/work/files-pasted' }, timestamp: '2026-10-15T12:00:00.000Z' }), line('s2'), line('s2')].join('\n'));
  const view = await scanUsage({ codexDir: path.join(root, 'codex'), grokDir: path.join(root, 'nope'), source: 'codex' });
  assert.equal(view.stats.totalTokens, 120);
});

test('missing folder returns an empty live view instead of throwing', async () => {
  const root = await temp();
  const view = await scanUsage({ codexDir: path.join(root, 'a'), source: 'codex' });
  assert.equal(view.mode, 'live');
  assert.equal(view.wordmark, 'CODEX');
  assert.equal(view.stats.totalTokens, 0);
  assert.match(view.footnote, /~\/\.codex/);
  assert.doesNotMatch(view.footnote, /grok/i);
});
