/* Pure game logic for Dopamine Bonanza — no DOM, no React.
   6×5 grid, scatter pays (8+ anywhere), tumbles, orb multipliers. */

export const SYMBOLS = [
  { id: "velo",    name: "Velo",          weight: 150, pays: [0.25, 0.75, 5] },
  { id: "zyn",     name: "Zyn",           weight: 145, pays: [0.40, 1.00, 6] },
  { id: "monster", name: "Monster",       weight: 135, pays: [0.60, 1.20, 8] },
  { id: "redbull", name: "Energy Shot",   weight: 128, pays: [0.80, 1.50, 10] },
  { id: "iphone",  name: "iPhone 17 Pro", weight: 96,  pays: [1.50, 2.00, 12] },
  { id: "cash",    name: "Cash",          weight: 84,  pays: [2.00, 5.00, 15] },
  { id: "ferrari", name: "Ferrari",       weight: 64,  pays: [2.50, 10.0, 25] },
  { id: "dom",     name: "Dom Pérignon",  weight: 44,  pays: [10.0, 25.0, 50] },
];
export const SCATTER = { id: "scatter", name: "Dopamine", weight: 16 };
export const MULT_ID = "mult";
export const SYM_BY_ID = Object.fromEntries(SYMBOLS.map((s) => [s.id, s]));
export const COLS = 6, ROWS = 5;
export const BETS = [0.20, 0.40, 0.60, 0.80, 1.00, 2.00, 4.00, 6.00, 10.00, 20.00, 50.00, 100.00];

/* Multiplier orb value table (value, relative weight) */
export const ORB_TABLE = [
  [2, 300], [3, 240], [4, 180], [5, 150], [6, 110], [8, 86], [10, 64],
  [12, 42], [15, 30], [20, 22], [25, 14], [50, 6], [100, 2],
];

export function buildStrip(anteOn) {
  const strip = [];
  SYMBOLS.forEach((s) => { for (let i = 0; i < s.weight; i++) strip.push(s.id); });
  const sw = SCATTER.weight * (anteOn ? 2 : 1);
  for (let j = 0; j < sw; j++) strip.push(SCATTER.id);
  return strip;
}
export const pick = (strip) => strip[Math.floor(Math.random() * strip.length)];

export function pickOrb() {
  let total = 0;
  for (const [, w] of ORB_TABLE) total += w;
  let r = Math.random() * total;
  for (const [v, w] of ORB_TABLE) { r -= w; if (r <= 0) return v; }
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
export function tumble(grid, wins, strip, orbChance) {
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
      if (orbChance > 0 && Math.random() < orbChance) { cell.m = pickOrb(); cell.s = MULT_ID; }
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
