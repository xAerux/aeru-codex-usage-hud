(function () {
  const ICONS = {
    coins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v4c0 1.7 3.1 3 7 3s7-1.3 7-3V7"/><path d="M5 11v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/></svg>',
    dollar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M12 7v10M15 9.2c-.6-.8-1.6-1.2-3-1.2-1.7 0-2.8.8-2.8 2s1.1 1.8 3 2.1 2.8.7 2.8 2-1.2 2.1-3 2.1c-1.3 0-2.3-.4-2.9-1.2"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 16l4.2-4.2 3 2.4L20 6"/><path d="M14 6h6v6"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3.5l2.2 4.6 5 .7-3.6 3.5.9 5.1L12 15.8 7.5 17.4l.9-5.1L4.8 8.8l5-.7z"/></svg>',
    cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
    bars: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 19V10M12 19V5M19 19v-7"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13 2L5 14h7l-1 8 8-12h-7z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/></svg>',
  };
  const COLORS = ['#5dff9d', '#2ee0c0', '#b6ff6a', '#e6f25a', '#49c8ff', '#8aa6ff'];

  const codexDays = [
    { label: 'Fri 10-10', tokens: 2_120_000_000, tip: 'Fri, Oct 10, 2026 · 2,120,000,000 tokens' },
    { label: 'Sat 10-11', tokens: 540_000_000, tip: 'Sat, Oct 11, 2026 · 540,000,000 tokens' },
    { label: 'Sun 10-12', tokens: 1_460_000_000, tip: 'Sun, Oct 12, 2026 · 1,460,000,000 tokens' },
    { label: 'Mon 10-13', tokens: 520_000_000, tip: 'Mon, Oct 13, 2026 · 520,000,000 tokens' },
    { label: 'Tue 10-14', tokens: 960_000_000, tip: 'Tue, Oct 14, 2026 · 960,000,000 tokens' },
    { label: 'Wed 10-15', tokens: 170_000_000, tip: 'Wed, Oct 15, 2026 · 170,000,000 tokens' },
    { label: 'Thu 10-16', tokens: 6_536_606, tip: 'Thu, Oct 16, 2026 · 6,536,606 tokens' },
  ];
  const priorDays = [
    { label: 'Fri 10-03', tokens: 880_000_000, tip: 'Fri, Oct 3, 2026 · 880,000,000 tokens' },
    { label: 'Sat 10-04', tokens: 420_000_000, tip: 'Sat, Oct 4, 2026 · 420,000,000 tokens' },
    { label: 'Sun 10-05', tokens: 1_640_000_000, tip: 'Sun, Oct 5, 2026 · 1,640,000,000 tokens' },
    { label: 'Mon 10-06', tokens: 211_233_201, tip: 'Mon, Oct 6, 2026 · 211,233,201 tokens' },
    { label: 'Tue 10-07', tokens: 640_000_000, tip: 'Tue, Oct 7, 2026 · 640,000,000 tokens' },
    { label: 'Wed 10-08', tokens: 300_000_000, tip: 'Wed, Oct 8, 2026 · 300,000,000 tokens' },
    { label: 'Thu 10-09', tokens: 150_000_000, tip: 'Thu, Oct 9, 2026 · 150,000,000 tokens' },
  ];
  const spark = [10, 22, 16, 34, 20, 48, 30, 62, 36, 70, 44, 58, 40, 76, 52, 68];
  const sparkB = [18, 12, 28, 22, 40, 26, 50, 33, 60, 42, 55, 38, 64, 46, 72, 50];

  function kpi(value, unit, sub) { return { value, unit, sub }; }
  function hl(key, label, value, unit, sub, series) { return { key, label, value, unit, sub, spark: series }; }

  const SAMPLES = {
    codex: {
      mode: 'sample',
      source: 'codex',
      wordmark: 'CODEX',
      fine: 'AGGREGATED BY LAST_TOKEN_USAGE, WITH THE AMOUNT ESTIMATED BASED ON THE PUBLICLY AVAILABLE PRICE FROM THE OPENAI API.',
      kpis: {
        today: kpi('6.537', 'million', '6,536,606 tokens'),
        total: kpi('870', 'million', '873,621,939 tokens'),
        cost: kpi('$315.37', '', '¥2,270.64'),
        cache: kpi('97', '%', '840 million cached'),
        average: kpi('67.202', 'million', '13 valid dates'),
      },
      sparks: { today: spark, total: spark, cost: sparkB, cache: spark, average: spark },
      rangeLabel: 'Fri, Oct 10, 2026 – Thu, Oct 16, 2026',
      weekPreset: 'Last 7 days',
      days: codexDays,
      daysByOffset: { 0: codexDays, 1: priorDays },
      weeks: [
        { offset: 0, title: 'Last 7 days', range: 'Fri, Oct 10, 2026 – Thu, Oct 16, 2026' },
        { offset: 1, title: 'Fri 10-03 – Thu 10-09', range: 'Fri, Oct 3, 2026 – Thu, Oct 9, 2026' },
      ],
      weekOffset: 0,
      projects: [
        { rank: 1, name: 'ne', detail: '720 million tokens · $255.56', pct: 36.5 },
        { rank: 2, name: 'files-pasted-by-the-user-chii', detail: '120 million tokens · $48.58', pct: 15.2 },
        { rank: 3, name: 'referenced-chatgpt-conversation-this-is-an', detail: '14.195 million tokens · $5.11', pct: 7.1 },
      ],
      models: [
        { name: 'gpt-5.6-luna', tokens: 7.35e9 },
        { name: 'gpt-5.6-sol', tokens: 1.42e9 },
        { name: 'codex-auto-review', tokens: 0.78e9 },
        { name: 'gpt-5.6-terra', tokens: 0.58e9 },
        { name: 'gpt-6-sol', tokens: 0.36e9 },
        { name: 'gpt-6.1-sol', tokens: 0.22e9 },
      ],
      highlights: [
        hl('coins', 'Maximum daily dosage', '210', 'million', 'Mon, Oct 5, 2026 · 211,233,201 tokens', spark),
        hl('dollar', 'Highest cost day', '$72.73', '', 'Mon, Oct 5, 2026 · 210 million tokens', sparkB),
        hl('target', 'Highest cache hit session', '98', '%', 'Add Character Vault discovery · 10.987 million cached', spark),
        hl('cube', 'Highest single session', '710', 'million', 'Production House · $248.51', sparkB),
        hl('bolt', 'Peak output day', '581,000', '', 'Mon, Oct 5, 2026 · Output tokens', spark),
        hl('grid', 'Most active projects', 'ne', '', '720 million tokens · $255.56', sparkB),
      ],
      footnote: 'Reference layout. Run this HUD on your computer to read ~/.codex. Estimates use public API prices, not your ChatGPT invoice.',
    },
  };

  const $ = (id) => document.getElementById(id);
  const state = { source: 'codex', week: 0, view: null, mode: 'sample', open: false };
  let raf = 0;
  let timer = 0;
  let matrixTimer = 0;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[ch]));
  }

  function matrix() {
    const host = $('matrix');
    if (!host) return;
    const w = Math.max(1, window.innerWidth || host.clientWidth || 1);
    const h = Math.max(1, window.innerHeight || host.clientHeight || 1);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.textBaseline = 'top';
    const colW = 12;
    const rowH = 14;
    const cols = Math.ceil(w / colW);
    const rows = Math.ceil(h / rowH);
    for (let i = 0; i < cols; i += 1) {
      const head = (i * 17 + 5) % rows;
      const trail = 12 + (i % 16);
      const edge = Math.min(i / Math.max(1, cols - 1), 1 - i / Math.max(1, cols - 1));
      const column = 0.62 + (1 - edge * 1.15) * 0.38;
      for (let r = 0; r < rows; r += 1) {
        const dist = (r - head + rows) % rows;
        let alpha = 0.035;
        let color = '18, 220, 98';
        if (dist === 0) {
          alpha = 1;
          color = '236, 255, 246';
        } else if (dist < 2) {
          alpha = 0.82;
          color = '170, 255, 210';
        } else if (dist < trail) {
          alpha = 0.5 * (1 - dist / trail);
          color = '40, 235, 120';
        } else if ((i * 3 + r) % 9 === 0) {
          alpha = 0.14;
        }
        const bit = (i * 31 + r * 17) % 3 === 0 ? '0' : '1';
        ctx.fillStyle = `rgba(${color},${Math.max(0, Math.min(1, alpha * column)).toFixed(3)})`;
        ctx.fillText(bit, i * colW, r * rowH);
      }
    }
    host.style.backgroundImage = `url("${canvas.toDataURL('image/png')}")`;
  }

  function clock() {
    const tick = () => {
      const now = new Date();
      const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      const time = now.toLocaleTimeString('en-US', { hour12: false });
      if ($('date')) $('date').textContent = date;
      if ($('clock')) $('clock').textContent = time;
    };
    tick();
    timer = window.setInterval(tick, 1000);
  }

  function sparkSVG(values, w, h) {
    const nums = (values || []).map(Number).filter((n) => Number.isFinite(n));
    if (nums.length < 2) return '';
    const max = Math.max(...nums, 1);
    const min = Math.min(...nums, 0);
    const span = max - min || 1;
    const step = (w - 2) / (nums.length - 1);
    const pts = nums.map((n, i) => [1 + i * step, h - 2 - ((n - min) / span) * (h - 6)]);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    const area = `${line} L${w - 1} ${h} L1 ${h} Z`;
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${area}" fill="rgba(61,255,154,.28)"/><path d="${line}" fill="none" stroke="#3dff9a" stroke-width="1.6"/></svg>`;
  }

  function axisMax(max) {
    if (!(max > 0)) return 1;
    const pow = 10 ** Math.floor(Math.log10(max));
    let best = max * 1.15;
    for (const mult of [1, 1.2, 1.5, 2, 2.2, 2.5, 4, 5, 8, 10]) {
      for (const scale of [pow / 10, pow, pow * 10, pow * 100]) {
        const top = mult * scale;
        if (top >= max * 1.02 && top < best) best = top;
      }
    }
    return best;
  }

  function axisLabel(n) {
    if (n <= 0) return '0';
    if (n >= 1e9) {
      const b = Math.round((n / 1e9) * 10) / 10;
      return `${Number.isInteger(b) ? b.toFixed(0) : b.toFixed(1)}B`;
    }
    if (n >= 1e6) return `${Math.round(n / 1e6)}M`;
    if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
    return String(Math.round(n));
  }

  function smooth(points) {
    if (points.length < 2) return '';
    let d = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }

  function currentDays(view) {
    if (view.daysByOffset && view.daysByOffset[state.week]) return view.daysByOffset[state.week];
    return view.days || [];
  }

  function drawChart() {
    const host = $('chartHost');
    const view = state.view;
    if (!host || !view) return;
    const days = currentDays(view);
    const w = Math.max(320, host.clientWidth || 640);
    const h = Math.max(200, host.clientHeight || 280);
    const left = 64;
    const right = 12;
    const top = 16;
    const bottom = 36;
    const max = axisMax(Math.max(0, ...days.map((d) => d.tokens || 0)));
    const iw = w - left - right;
    const ih = h - top - bottom;
    const points = days.map((d, i) => ({
      x: left + (days.length <= 1 ? iw / 2 : (iw * i) / (days.length - 1)),
      y: top + ih - ((d.tokens || 0) / max) * ih,
      ...d,
    }));
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({ y: top + ih - t * ih, label: axisLabel(max * t) }));
    const grid = ticks.map((t) => `<line x1="${left}" y1="${t.y}" x2="${w - right}" y2="${t.y}" stroke="rgba(61,255,154,.18)" stroke-dasharray="2 5"/><text x="${left - 8}" y="${t.y + 4}" fill="#9dccb4" font-size="11" text-anchor="end" font-family="Rajdhani,sans-serif">${esc(t.label)}</text>`).join('');
    const vlines = points.map((p) => `<line x1="${p.x}" y1="${top}" x2="${p.x}" y2="${top + ih}" stroke="rgba(61,255,154,.12)" stroke-dasharray="2 5"/>`).join('');
    const line = points.length ? smooth(points) : '';
    const area = line ? `${line} L${points.at(-1).x} ${top + ih} L${points[0].x} ${top + ih} Z` : '';
    const labels = points.map((p) => `<text x="${p.x}" y="${h - 10}" fill="#d7f3e6" font-size="11" text-anchor="middle" font-family="Rajdhani,sans-serif">${esc(p.label || '')}</text>`).join('');
    const dots = points.map((p, i) => `<circle class="pt" data-i="${i}" cx="${p.x}" cy="${p.y}" r="4.5" fill="#f4fff8" stroke="#3dff9a" stroke-width="2"/>`).join('');
    host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Seven day token usage"><defs><linearGradient id="fillG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3dff9a" stop-opacity="0.55"/><stop offset="1" stop-color="#3dff9a" stop-opacity="0.02"/></linearGradient><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><text x="16" y="${(h / 2).toFixed(0)}" fill="#9dccb4" font-size="11" font-family="Rajdhani,sans-serif" transform="rotate(-90 16 ${(h / 2).toFixed(0)})" text-anchor="middle">Tokens</text>${grid}${vlines}<path d="${area}" fill="url(#fillG)"/><path d="${line}" fill="none" stroke="#7dffbe" stroke-width="2.6" filter="url(#glow)"/>${dots}${labels}</svg>`;
    state.points = points;
  }

  function drawModels() {
    const host = $('modelHost');
    const view = state.view;
    if (!host || !view) return;
    const rows = view.models || [];
    if (!rows.length) {
      host.innerHTML = '<p class="empty">No model usage yet.</p>';
      return;
    }
    const w = Math.max(280, host.clientWidth || 360);
    const rowH = 28;
    const top = 8;
    const left = 132;
    const right = 12;
    const bottom = 28;
    const h = top + rows.length * rowH + bottom;
    const max = axisMax(Math.max(...rows.map((r) => r.tokens || 0)));
    const iw = w - left - right;
    const ticks = [0, 0.25, 0.5, 0.75, 1];
    const grid = ticks.map((t) => {
      const x = left + iw * t;
      return `<line x1="${x}" y1="${top}" x2="${x}" y2="${top + rows.length * rowH}" stroke="rgba(61,255,154,.16)" stroke-dasharray="2 4"/><text x="${x}" y="${h - 8}" fill="#b7e7cc" font-size="11" text-anchor="middle" font-family="Rajdhani,sans-serif">${axisLabel(max * t)}</text>`;
    }).join('');
    const bars = rows.map((row, i) => {
      const y = top + i * rowH + 6;
      const bw = Math.max(2, ((row.tokens || 0) / max) * iw);
      const color = COLORS[i % COLORS.length];
      return `<text x="${left - 8}" y="${y + 12}" fill="#e7fff4" font-size="12" text-anchor="end" font-family="Rajdhani,sans-serif">${esc(row.name)}</text><rect x="${left}" y="${y}" width="${bw.toFixed(1)}" height="12" rx="6" fill="${color}" opacity="0.95"><title>${esc(row.name)}</title></rect>`;
    }).join('');
    host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Model proportion">${grid}${bars}</svg>`;
  }

  function paint(view) {
    state.view = view;
    state.mode = view.mode || 'live';
    $('wordmark').textContent = view.wordmark || 'CODEX';
    $('fine').textContent = view.fine || '';
    $('range').textContent = state.week && view.weeks ? (view.weeks.find((w) => w.offset === state.week)?.range || view.rangeLabel || '') : (view.rangeLabel || '');
    $('weekLabel').textContent = (view.weeks || []).find((w) => w.offset === state.week)?.title || view.weekPreset || 'Last 7 days';
    const host = view.mode === 'sample' ? '127.0.0.1:8787' : (view.endpoint && view.endpoint !== 'preview' ? view.endpoint : location.host);
    $('host').textContent = host || '127.0.0.1:8787';
    const order = ['today', 'total', 'cost', 'cache', 'average'];
    const labels = ["TODAY'S TOKENS", 'HISTORICAL TOTAL', 'HISTORICAL ESTIMATED AMOUNT', 'CACHE HIT RATE', 'AVERAGE DAILY'];
    const icons = ['coins', 'dollar', 'chart', 'target', 'calendar'];
    $('kpis').innerHTML = order.map((key, i) => {
      const card = view.kpis[key];
      return `<article class="kpi${key === 'total' ? ' hot' : ''}"><div class="k-top"><span class="k-ico">${ICONS[icons[i]]}</span><span class="k-label">${labels[i]}</span></div><div class="k-val"><span class="num">${esc(card.value)}</span>${card.unit ? `<span class="unit">${esc(card.unit)}</span>` : ''}</div><div class="k-sub">${esc(card.sub)}</div><div class="spark">${sparkSVG(view.sparks?.[key], 92, 36)}</div></article>`;
    }).join('');
    const projects = view.projects || [];
    $('projects').innerHTML = projects.length
      ? projects.map((row) => `<div class="prow"><span class="rank">${row.rank}</span><div class="pmeta"><div class="pname">${esc(row.name)}</div><div class="pdetail">${esc(row.detail)}</div></div><div class="pbarwrap"><span class="track"><i class="fill" style="width:${Math.max(2, Math.min(100, row.pct))}%"></i></span><span class="pct">${Number(row.pct).toFixed(1)}%</span></div></div>`).join('')
      : '<p class="empty">No project usage in this view yet.</p>';
    $('highlights').innerHTML = (view.highlights || []).map((item) => `<article class="hl"><span class="hl-ico">${ICONS[item.key] || ''}</span><div><div class="hl-label">${esc(item.label)}</div><div class="hl-value">${esc(item.value)}${item.unit ? `<span class="unit">${esc(item.unit)}</span>` : ''}</div><div class="hl-sub">${esc(item.sub)}</div></div><div class="hl-spark">${sparkSVG(item.spark, 78, 42)}</div></article>`).join('');
    $('foot').textContent = view.footnote || '';
    drawChart();
    drawModels();
    renderMenu();
  }

  function renderMenu() {
    const menu = $('menu');
    const weeks = state.view?.weeks || [];
    menu.hidden = !state.open;
    menu.innerHTML = weeks.map((week) => `<button type="button" data-offset="${week.offset}" aria-selected="${week.offset === state.week}">${esc(week.title)}</button>`).join('');
    menu.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => {
        state.week = Number(button.dataset.offset) || 0;
        state.open = false;
        if (state.mode === 'sample' && state.view?.daysByOffset) paint(state.view);
        else load();
      });
    });
  }

  async function pull(query) {
    if (typeof window.__loadUsage === 'function') return window.__loadUsage(query);
    const params = new URLSearchParams({ source: query.source, weekOffset: String(query.weekOffset || 0) });
    const response = await fetch(`/api/usage?${params}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('The local scan failed.');
    return response.json();
  }

  async function load() {
    const gen = state.gen;
    try {
      const data = await pull({ source: 'codex', weekOffset: state.week });
      if (gen !== state.gen) return;
      if (data.mode === 'sample') {
        const sample = SAMPLES.codex;
        sample.endpoint = data.endpoint;
        if (!state.week) sample.weekOffset = 0;
        paint(sample);
        return;
      }
      if (!state.week) state.week = data.weekOffset || 0;
      paint(data);
    } catch (error) {
      if (gen !== state.gen) return;
      if (window.__hudPreview) paint(SAMPLES.codex);
      else {
        $('foot').textContent = error.message || 'Unable to read local history.';
      }
    }
  }

  function boot() {
    window.__hudDestroy?.();
    state.gen = (window.__hudGen = (window.__hudGen || 0) + 1);
    matrix();
    clock();
    const onMove = (event) => {
      const tip = $('tip');
      const node = event.target;
      if (!tip || !node || !node.classList || !node.classList.contains('pt') || !state.points) {
        if (tip) tip.style.display = 'none';
        return;
      }
      const point = state.points[Number(node.dataset.i)];
      const rect = $('chartBox').getBoundingClientRect();
      tip.style.display = 'block';
      tip.style.left = `${event.clientX - rect.left}px`;
      tip.style.top = `${event.clientY - rect.top}px`;
      tip.textContent = point?.tip || '';
    };
    const onLeave = () => { if ($('tip')) $('tip').style.display = 'none'; };
    const onDoc = (event) => {
      if (!event.target.closest('.week')) {
        state.open = false;
        if ($('menu')) $('menu').hidden = true;
      }
    };
    const onResize = () => {
      clearTimeout(matrixTimer);
      matrixTimer = window.setTimeout(matrix, 160);
      drawChart();
      drawModels();
    };
    window.addEventListener('resize', onResize);
    $('chartBox').addEventListener('mousemove', onMove);
    $('chartBox').addEventListener('mouseleave', onLeave);
    document.addEventListener('click', onDoc);
    $('weekBtn').addEventListener('click', () => {
      state.open = !state.open;
      renderMenu();
    });
    if (window.__hudPreview) paint(SAMPLES.codex);
    else if (location.protocol === 'file:') {
      $('fine').textContent = 'THIS PAGE WAS OPENED AS A FILE. GO UP ONE FOLDER AND DOUBLE-CLICK Start Dashboard.bat.';
      $('foot').textContent = 'index.html cannot read your Codex history by itself. The .bat file starts the local server and opens the dashboard.';
      return;
    } else {
      $('fine').textContent = 'SCANNING LOCAL CODEX HISTORY…';
      $('foot').textContent = 'Reading ~/.codex on this computer. Nothing is uploaded.';
    }
    load();
    window.__hudDestroy = () => {
      state.gen += 1;
      cancelAnimationFrame(raf);
      clearInterval(timer);
      clearTimeout(matrixTimer);
      $('chartBox')?.removeEventListener('mousemove', onMove);
      $('chartBox')?.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('click', onDoc);
      window.removeEventListener('resize', onResize);
    };
  }

  if (document.getElementById('kpis')) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
