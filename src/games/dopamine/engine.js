/* Pure game logic for Dopamine Bonanza — no DOM, no React.
   6×5 grid, scatter pays (8+ anywhere), tumbles, orb multipliers.

   Maths (200k-spin Monte Carlo, see sim.mjs): overall ≈ 84% RTP with a
   ~34% hit rate, free spins land about 1 in 450 spins, bought features
   return roughly 65–70% of their price (FS 100×, Super FS 200×). A grind. */

export const SYMBOLS = [
  { id: "velo",    name: "Velo",          weight: 138, pays: [0.34, 1.01, 6.75] },
  { id: "zyn",     name: "Zyn",           weight: 132, pays: [0.54, 1.35, 8.10] },
  { id: "monster", name: "Monster",       weight: 126, pays: [0.81, 1.62, 10.8] },
  { id: "redbull", name: "Energy Shot",   weight: 120, pays: [1.08, 2.03, 13.5] },
  { id: "iphone",  name: "iPhone 17 Pro", weight: 100, pays: [2.55, 3.40, 20.4] },
  { id: "cash",    name: "Cash",          weight: 88,  pays: [3.40, 8.50, 25.5] },
  { id: "ferrari", name: "Ferrari",       weight: 70,  pays: [4.25, 17.0, 42.5] },
  { id: "dom",     name: "Dom Pérignon",  weight: 50,  pays: [17.0, 42.5, 85.0] },
];
export const SCATTER = { id: "scatter", name: "Dopamine", weight: 13 };
export const MULT_ID = "mult";
export const SYM_BY_ID = Object.fromEntries(SYMBOLS.map((s) => [s.id, s]));
export const COLS = 6, ROWS = 5;
export const BETS = [0.20, 0.40, 0.60, 0.80, 1.00, 2.00, 4.00, 6.00, 10.00, 20.00, 50.00, 100.00];
export const MAX_WIN_X = 5000; /* cap on a single spin, in bets */

/* Multiplier orb value tables (value, relative weight). Super free spins
   use the richer table — bigger orbs land far more often. */
export const ORB_TABLE = [
  [2, 300], [3, 240], [4, 180], [5, 150], [6, 110], [8, 86], [10, 64],
  [12, 42], [15, 30], [20, 22], [25, 14], [50, 6], [100, 2],
];
export const SUPER_ORB_TABLE = [
  [2, 120], [3, 150], [4, 160], [5, 150], [6, 130], [8, 110], [10, 90],
  [12, 70], [15, 50], [20, 40], [25, 28], [50, 14], [100, 6],
];
/* Orb landing chance per cell, inside the feature only (super mode keeps the
   rate but draws from the richer table — more orbs would just block wins) */
export const ORB_CHANCE = 0.11, SUPER_ORB_CHANCE = 0.11;
/* Feature sizes and buy prices (in bets) */
export const FS_SPINS = 10, SUPER_FS_SPINS = 15, FS_COST = 100, SUPER_FS_COST = 200;

export function buildStrip(anteOn) {
  const strip = [];
  SYMBOLS.forEach((s) => { for (let i = 0; i < s.weight; i++) strip.push(s.id); });
  const sw = SCATTER.weight * (anteOn ? 2 : 1);
  for (let j = 0; j < sw; j++) strip.push(SCATTER.id);
  return strip;
}
export const pick = (strip) => strip[Math.floor(Math.random() * strip.length)];

export function pickOrb(superMode) {
  const table = superMode ? SUPER_ORB_TABLE : ORB_TABLE;
  let total = 0;
  for (const [, w] of table) total += w;
  let r = Math.random() * total;
  for (const [v, w] of table) { r -= w; if (r <= 0) return v; }
  return 2;
}

/* grid is COLS arrays of ROWS cells, index 0 = top row.
   A cell is { s:<symbolId>, m:<orbValue|0>, fresh:<bool> }. */
export function newGrid(strip) {
  const g = [];
  for (let c = 0; c < COLS; c++) {
    const col = [];
    for (let r = 0; r < ROWS; r++) col.push({ s: pick(strip), m: 0, fresh: true });
    g.push(col);
  }
  return g;
}

export function clearFresh(grid) {
  for (const col of grid) for (const cell of col) cell.fresh = false;
}

export function evaluate(grid, bet) {
  const counts = {}, positions = {};
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
    const cell = grid[c][r];
    if (cell.m) continue;                 /* orbs never pay */
    if (cell.s === SCATTER.id) continue;  /* scatter pays only as trigger */
    counts[cell.s] = (counts[cell.s] || 0) + 1;
    (positions[cell.s] = positions[cell.s] || []).push([c, r]);
  }
  const wins = [];
  for (const id in counts) {
    const n = counts[id];
    if (n < 8) continue;
    const sym = SYM_BY_ID[id];
    const band = n >= 12 ? 2 : n >= 10 ? 1 : 0;
    wins.push({ id, count: n, mult: sym.pays[band], amount: sym.pays[band] * bet, cells: positions[id] });
  }
  return wins;
}

export function countScatters(grid) {
  let n = 0;
  for (const col of grid) for (const cell of col) if (!cell.m && cell.s === SCATTER.id) n++;
  return n;
}

export function sumOrbs(grid) {
  let t = 0;
  for (const col of grid) for (const cell of col) t += cell.m || 0;
  return t;
}

/* Remove winning cells, let survivors fall, refill from the top.
   Orbs survive every tumble — they only clear when the spin ends.
   Returns a new grid (columns are new arrays; surviving cell objects reused). */
export function tumble(grid, wins, strip, orbChance, superMode) {
  const doomed = new Set();
  wins.forEach((w) => w.cells.forEach(([c, r]) => doomed.add(c + ":" + r)));
  const out = [];
  for (let c = 0; c < COLS; c++) {
    const kept = [];
    for (let r = 0; r < ROWS; r++) if (!doomed.has(c + ":" + r)) kept.push(grid[c][r]);
    kept.forEach((cell) => { cell.fresh = false; });
    const need = ROWS - kept.length, fills = [];
    for (let k = 0; k < need; k++) {
      const cell = { s: pick(strip), m: 0, fresh: true };
      if (orbChance > 0 && Math.random() < orbChance) { cell.m = pickOrb(superMode); cell.s = MULT_ID; }
      fills.push(cell);
    }
    out.push(fills.concat(kept));
  }
  return out;
}

export function winTier(amount, bet) {
  const x = amount / bet;
  if (x >= 250) return ["Dopamine Overload", "max receptors saturated"];
  if (x >= 100) return ["Mega Win", "serotonin secondary"];
  if (x >= 40)  return ["Super Win", "hit the receptors"];
  if (x >= 15)  return ["Big Win", "that one landed"];
  return null;
}
