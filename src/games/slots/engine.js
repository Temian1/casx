/* Generic slot engine — pure functions, no DOM.
   A slot is a config object; playRound() turns one stake into a list of
   presentation steps (spin, wins, tumble, feature, hold & win …) plus the
   total win. The React SlotMachine plays the steps; sim-slots.mjs sums
   them to measure RTP. Everything the maths needs lives in the config.

   Config shape (see the individual slot files):
   { id, cols, rows, mode: "lines" | "ways" | "scatter",
     lines?: [[row per reel]], symbols: [{ id, name, weight | [per reel],
     pays, wild?, scatter?, coin?, art }], freeSpins?, tumble?, bombs?,
     holdWin?, maxWin, bets }
   `pays` are multiples of the TOTAL bet: [3-of-a-kind, 4, 5] for lines
   and ways, [8-9, 10-11, 12+] for scatter-pays. */

export const r2 = (n) => Math.round(n * 100) / 100;

/* ---------- reel strips ---------- */
export function buildStrips(cfg) {
  const strips = [];
  for (let c = 0; c < cfg.cols; c++) {
    const strip = [];
    for (const s of cfg.symbols) {
      const w = Array.isArray(s.weight) ? s.weight[c] : s.weight;
      for (let i = 0; i < Math.round((w || 0) * 10); i++) strip.push(s.id); /* weights may be fractional */
    }
    strips.push(strip);
  }
  return strips;
}
const pickFrom = (strip, rng) => strip[Math.floor(rng() * strip.length)];

export function symbolMap(cfg) {
  return Object.fromEntries(cfg.symbols.map((s) => [s.id, s]));
}

function makeCell(cfg, id, rng, ctx) {
  const cell = { s: id, v: 0, fresh: true };
  const sym = ctx.sym[id];
  if (sym?.coin) cell.v = drawCoin(cfg, rng);
  return cell;
}

export function spinGrid(cfg, strips, rng, ctx) {
  const g = [];
  for (let c = 0; c < cfg.cols; c++) {
    const col = [];
    for (let r = 0; r < cfg.rows; r++) col.push(makeCell(cfg, pickFrom(strips[c], rng), rng, ctx));
    g.push(col);
  }
  return g;
}
export const cloneGrid = (g) => g.map((col) => col.map((c) => ({ ...c, fresh: false })));

/* ---------- helpers ---------- */
function weighted(table, rng) {
  let total = 0;
  for (const [, w] of table) total += w;
  let r = rng() * total;
  for (const [v, w] of table) { r -= w; if (r <= 0) return v; }
  return table[0][0];
}
function drawCoin(cfg, rng) {
  const hw = cfg.holdWin;
  return weighted(hw.values, rng); /* a number (× bet) or a jackpot key string */
}
export function countSymbol(grid, id) {
  let n = 0;
  for (const col of grid) for (const cell of col) if (cell.s === id) n++;
  return n;
}

/* ---------- win evaluation ---------- */
export function evaluateLines(cfg, grid, bet, ctx) {
  const wins = [];
  const wild = ctx.wildId;
  for (let li = 0; li < cfg.lines.length; li++) {
    const line = cfg.lines[li];
    let symbol = null, count = 0;
    const cells = [];
    for (let c = 0; c < cfg.cols; c++) {
      const id = grid[c][line[c]].s;
      const isWild = id === wild;
      if (symbol === null) {
        if (isWild) { count++; cells.push([c, line[c]]); continue; }
        if (ctx.sym[id].scatter || ctx.sym[id].coin) break;
        symbol = id; count++; cells.push([c, line[c]]);
      } else if (id === symbol || isWild) {
        count++; cells.push([c, line[c]]);
      } else break;
    }
    /* all-wild line: pay as the best symbol it could stand for */
    if (symbol === null && count >= 3) {
      symbol = ctx.bestId;
    }
    if (!symbol) continue;
    const pays = ctx.sym[symbol].pays;
    const idx = count - 3;
    if (idx < 0 || !pays || !pays[idx]) continue;
    wins.push({ line: li, symbol, count, amount: r2(pays[idx] * bet), cells });
  }
  return wins;
}

export function evaluateWays(cfg, grid, bet, ctx) {
  const wins = [];
  const wild = ctx.wildId;
  for (const sym of cfg.symbols) {
    if (sym.wild || sym.scatter || sym.coin || !sym.pays) continue;
    let ways = 1, reels = 0;
    const cells = [];
    for (let c = 0; c < cfg.cols; c++) {
      let n = 0;
      for (let r = 0; r < cfg.rows; r++) {
        const id = grid[c][r].s;
        if (id === sym.id || id === wild) { n++; cells.push([c, r]); }
      }
      if (n === 0) break;
      ways *= n; reels++;
    }
    const idx = reels - 3;
    if (idx < 0 || !sym.pays[idx]) continue;
    wins.push({ symbol: sym.id, count: reels, ways, amount: r2(sym.pays[idx] * bet * ways), cells });
  }
  return wins;
}

export function evaluateScatterPays(cfg, grid, bet, ctx) {
  const counts = {}, positions = {};
  for (let c = 0; c < cfg.cols; c++) for (let r = 0; r < cfg.rows; r++) {
    const cell = grid[c][r];
    const sym = ctx.sym[cell.s];
    if (!sym || sym.scatter || sym.bomb || !sym.pays) continue;
    counts[cell.s] = (counts[cell.s] || 0) + 1;
    (positions[cell.s] = positions[cell.s] || []).push([c, r]);
  }
  const wins = [];
  for (const id in counts) {
    const n = counts[id];
    if (n < 8) continue;
    const band = n >= 12 ? 2 : n >= 10 ? 1 : 0;
    wins.push({ symbol: id, count: n, amount: r2(ctx.sym[id].pays[band] * bet), cells: positions[id] });
  }
  return wins;
}

export function evaluate(cfg, grid, bet, ctx) {
  if (cfg.mode === "lines") return evaluateLines(cfg, grid, bet, ctx);
  if (cfg.mode === "ways") return evaluateWays(cfg, grid, bet, ctx);
  return evaluateScatterPays(cfg, grid, bet, ctx);
}

/* Remove winning cells, drop survivors, refill from the top (scatter-pays). */
export function tumble(cfg, grid, wins, strips, rng, ctx, bombChance) {
  const doomed = new Set();
  wins.forEach((w) => w.cells.forEach(([c, r]) => doomed.add(c + ":" + r)));
  const out = [];
  for (let c = 0; c < cfg.cols; c++) {
    const kept = [];
    for (let r = 0; r < cfg.rows; r++) if (!doomed.has(c + ":" + r)) kept.push({ ...grid[c][r], fresh: false });
    const fills = [];
    for (let k = 0; k < cfg.rows - kept.length; k++) fills.push(newCell(cfg, strips[c], rng, ctx, bombChance));
    out.push(fills.concat(kept));
  }
  return out;
}
function newCell(cfg, strip, rng, ctx, bombChance) {
  if (bombChance > 0 && rng() < bombChance) return { s: "bomb", v: weighted(cfg.bombs.values, rng), fresh: true };
  return makeCell(cfg, pickFrom(strip, rng), rng, ctx);
}
export function sumBombs(grid) {
  let t = 0;
  for (const col of grid) for (const cell of col) if (cell.s === "bomb") t += cell.v;
  return t;
}

/* ---------- one full round ---------- */
export function makeContext(cfg) {
  const sym = symbolMap(cfg);
  const wildId = cfg.symbols.find((s) => s.wild)?.id || null;
  const scatterId = cfg.symbols.find((s) => s.scatter)?.id || null;
  const coinId = cfg.symbols.find((s) => s.coin)?.id || null;
  const paying = cfg.symbols.filter((s) => s.pays && !s.wild && !s.scatter && !s.coin);
  const bestId = paying.reduce((a, b) => ((b.pays[2] || 0) > (a.pays[2] || 0) ? b : a), paying[0]).id;
  return { sym, wildId, scatterId, coinId, bestId, strips: buildStrips(cfg), paying };
}

/**
 * playRound(cfg, ctx, bet, rng, { buy }) → { steps, win }
 * steps drive presentation; `win` is the total to pay (already capped).
 */
export function playRound(cfg, ctx, bet, rng = Math.random, opts = {}) {
  const steps = [];
  let total = 0;
  const cap = cfg.maxWin * bet;
  const add = (amt) => { total = r2(Math.min(cap, total + amt)); return total; };

  const fs = cfg.freeSpins;
  let feature = null; /* { spins, super } */

  if (opts.buy && fs) {
    feature = { spins: fs.spins, bought: true };
    steps.push({ t: "feature", spins: fs.spins, reason: "bought" });
  } else {
    const base = playSpin(cfg, ctx, bet, rng, { free: false, force: opts.force }, steps);
    add(base.win);
    if (base.holdTriggered) {
      const hw = playHoldWin(cfg, ctx, bet, rng, base.grid, steps);
      add(hw.win);
    }
    if (fs && ctx.scatterId && base.scatters >= fs.trigger) {
      feature = { spins: fs.spins + (fs.extraPerScatter ? (base.scatters - fs.trigger) * fs.extraPerScatter : 0) };
      steps.push({ t: "feature", spins: feature.spins, reason: base.scatters + " scatters" });
    }
  }

  if (feature) {
    const fsState = {
      left: feature.spins, played: 0, total: 0, mult: fs.multiplier || 1,
      special: fs.expanding ? ctx.paying[Math.floor(rng() * ctx.paying.length)].id : null,
      sticky: fs.sticky ? new Set() : null,
      progressive: fs.progressive ? 1 : 0,
    };
    if (fsState.special) steps.push({ t: "special", symbol: fsState.special });
    while (fsState.left > 0) {
      fsState.left--; fsState.played++;
      const r = playSpin(cfg, ctx, bet, rng, { free: true, fsState }, steps);
      fsState.total = r2(fsState.total + r.win);
      add(r.win);
      if (r.holdTriggered) { const hw = playHoldWin(cfg, ctx, bet, rng, r.grid, steps); add(hw.win); fsState.total = r2(fsState.total + hw.win); }
      if (fs.retrigger && r.scatters >= fs.retrigger) {
        fsState.left += fs.retriggerSpins;
        steps.push({ t: "retrigger", spins: fs.retriggerSpins, left: fsState.left });
      }
      if (total >= cap) break;
    }
    steps.push({ t: "featureEnd", spins: fsState.played, amount: fsState.total });
  }

  steps.push({ t: "end", win: total, capped: total >= cap });
  return { steps, win: total };
}

/* One spin (base or free) including tumbles, bombs, expanding/sticky/progressive modifiers. */
function playSpin(cfg, ctx, bet, rng, mode, steps) {
  const fsState = mode.fsState;
  const inFree = mode.free;
  const strips = inFree && cfg.freeStrips ? cfg.freeStrips : ctx.strips;
  const bombChance = cfg.bombs ? (inFree ? cfg.bombs.freeChance : cfg.bombs.baseChance) : 0;

  let grid = spinGrid(cfg, strips, rng, ctx);
  if (bombChance > 0) {
    for (const col of grid) for (let r = 0; r < col.length; r++) if (rng() < bombChance) col[r] = { s: "bomb", v: weighted(cfg.bombs.values, rng), fresh: true };
  }
  /* test hook: ?force=hold plants six coins, ?force=feature plants the scatters */
  if (mode.force === "hold" && ctx.coinId) {
    let n = 0;
    for (const col of grid) for (let r = 0; r < col.length && n < cfg.holdWin.trigger; r++) if (n++ >= 0) col[r] = makeCell(cfg, ctx.coinId, rng, ctx);
  }
  if (mode.force === "feature" && ctx.scatterId && cfg.freeSpins) {
    for (let c = 0; c < cfg.freeSpins.trigger; c++) grid[c][0] = { s: ctx.scatterId, v: 0, fresh: true };
  }
  if (fsState?.sticky) {
    for (const key of fsState.sticky) { const [c, r] = key.split(":").map(Number); grid[c][r] = { s: ctx.wildId, v: 0, fresh: true }; }
  }
  const scatters = ctx.scatterId ? countSymbol(grid, ctx.scatterId) : 0;
  const coins = ctx.coinId ? countSymbol(grid, ctx.coinId) : 0;
  steps.push({ t: "spin", grid: cloneGrid(grid).map((col) => col.map((c) => ({ ...c, fresh: true }))), free: fsState ? { left: fsState.left, played: fsState.played, mult: fsState.progressive || fsState.mult, total: fsState.total } : null, scatters });

  let spinWin = 0, chain = 0;
  for (;;) {
    let wins = evaluate(cfg, grid, bet, ctx);
    if (wins.length === 0) break;
    chain++;
    let amount = r2(wins.reduce((a, w) => a + w.amount, 0));
    spinWin = r2(spinWin + amount);
    steps.push({ t: "wins", wins, amount, chain, running: spinWin });
    if (!cfg.tumble) break;
    grid = tumble(cfg, grid, wins, strips, rng, ctx, bombChance);
    steps.push({ t: "tumble", grid: cloneGrid(grid).map((col) => col.map((c) => ({ ...c }))) });
  }

  /* sticky wilds: remember wilds that landed this spin */
  if (fsState?.sticky) {
    for (let c = 0; c < cfg.cols; c++) for (let r = 0; r < cfg.rows; r++) {
      if (grid[c][r].s === ctx.wildId && !fsState.sticky.has(c + ":" + r)) { fsState.sticky.add(c + ":" + r); steps.push({ t: "sticky", cell: [c, r] }); }
    }
  }

  /* expanding special symbol (book-style): pays across all reels it appears on */
  if (fsState?.special) {
    const reels = [];
    for (let c = 0; c < cfg.cols; c++) if (grid[c].some((cell) => cell.s === fsState.special)) reels.push(c);
    const pays = ctx.sym[fsState.special].pays;
    const idx = reels.length - 3;
    if (idx >= 0 && pays[idx]) {
      const amount = r2(pays[idx] * bet * (cfg.freeSpins.expandFactor || 1));
      spinWin = r2(spinWin + amount);
      steps.push({ t: "expand", symbol: fsState.special, reels, amount, running: spinWin });
    }
  }

  /* bombs (scatter-pays): sum of all bomb values multiplies the spin */
  if (cfg.bombs && spinWin > 0) {
    const b = sumBombs(grid);
    if (b > 0) { spinWin = r2(spinWin * b); steps.push({ t: "bombs", total: b, amount: spinWin }); }
  }

  /* fixed feature multiplier / progressive multiplier */
  if (fsState && spinWin > 0) {
    const m = fsState.progressive || fsState.mult;
    if (m > 1) { spinWin = r2(spinWin * m); steps.push({ t: "mult", mult: m, amount: spinWin }); }
    if (fsState.progressive) { fsState.progressive++; steps.push({ t: "progress", mult: fsState.progressive }); }
  }

  const holdTriggered = !!cfg.holdWin && coins >= cfg.holdWin.trigger;
  steps.push({ t: "spinEnd", amount: spinWin, scatters, coins, holdTriggered });
  return { win: spinWin, scatters, grid, holdTriggered };
}

/* Hold & Win: coins lock, other positions respin; a new coin resets the counter. */
function playHoldWin(cfg, ctx, bet, rng, startGrid, steps) {
  const hw = cfg.holdWin;
  const N = cfg.cols * cfg.rows;
  const locked = startGrid.map((col) => col.map((cell) => (cell.s === ctx.coinId ? { s: cell.s, v: cell.v } : null)));
  let count = locked.flat().filter(Boolean).length;
  let respins = hw.respins;
  steps.push({ t: "hold", grid: locked, respins, count });
  while (respins > 0 && count < N) {
    respins--;
    const landed = [];
    for (let c = 0; c < cfg.cols; c++) for (let r = 0; r < cfg.rows; r++) {
      if (locked[c][r]) continue;
      if (rng() < hw.respinChance) { locked[c][r] = { s: ctx.coinId, v: drawCoin(cfg, rng) }; landed.push([c, r]); count++; }
    }
    if (landed.length) respins = hw.respins;
    steps.push({ t: "holdSpin", grid: locked.map((col) => col.map((x) => (x ? { ...x } : null))), landed, respins, count });
  }
  let win = 0;
  const parts = [];
  for (const col of locked) for (const cell of col) {
    if (!cell) continue;
    const v = typeof cell.v === "string" ? hw.jackpots[cell.v] : cell.v;
    win += v * bet; parts.push(cell.v);
  }
  let grand = false;
  if (count >= N) { win = r2(win + hw.jackpots.grand * bet); grand = true; }
  win = r2(win);
  steps.push({ t: "holdEnd", amount: win, count, grand });
  return { win };
}

/* ---------- standard payline sets ---------- */
export const LINES_5x3_10 = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0], [2, 2, 1, 2, 2], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [1, 0, 1, 2, 1],
];
export const LINES_5x3_20 = [
  ...LINES_5x3_10,
  [1, 2, 1, 0, 1], [0, 1, 1, 1, 0], [2, 1, 1, 1, 2], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 2, 0, 2, 0], [2, 0, 2, 0, 2], [0, 2, 2, 2, 0],
];
export const LINES_5x4_25 = [
  [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2], [3, 3, 3, 3, 3], [0, 1, 2, 1, 0],
  [3, 2, 1, 2, 3], [1, 2, 3, 2, 1], [2, 1, 0, 1, 2], [0, 0, 1, 0, 0], [3, 3, 2, 3, 3],
  [1, 0, 0, 0, 1], [2, 3, 3, 3, 2], [1, 1, 0, 1, 1], [2, 2, 3, 2, 2], [0, 1, 1, 1, 0],
  [3, 2, 2, 2, 3], [1, 0, 1, 2, 1], [2, 3, 2, 1, 2], [0, 1, 0, 1, 0], [3, 2, 3, 2, 3],
  [1, 2, 1, 2, 1], [2, 1, 2, 1, 2], [0, 2, 0, 2, 0], [3, 1, 3, 1, 3], [1, 3, 1, 3, 1],
];
