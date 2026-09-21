/* Monte Carlo check of Dopamine Bonanza maths: node sim.mjs */
import * as E from "./src/games/dopamine/engine.js";
const N = 200000, bet = 1, strip = E.buildStrip(false);
const spin = (isFree, sm) => { const oc = isFree ? (sm ? E.SUPER_ORB_CHANCE : E.ORB_CHANCE) : 0; let g = E.newGrid(strip);
  if (oc) for (const col of g) for (const c of col) if (Math.random() < oc) { c.m = E.pickOrb(sm); c.s = E.MULT_ID; }
  let w = 0; for (;;) { const x = E.evaluate(g, bet); if (!x.length) break; w += x.reduce((a, y) => a + y.amount, 0); g = E.tumble(g, x, strip, oc, sm); }
  const o = E.sumOrbs(g); if (isFree && o && w) w *= o; w = Math.min(w, E.MAX_WIN_X * bet); return { win: w, scat: E.countScatters(g) }; };
const feat = (sm) => { let f = 10, t = 0; while (f-- > 0) { const r = spin(true, sm); t += r.win; if (r.scat >= 3) f += 5; } return t; };
let paid = 0, hits = 0, feats = 0, fp = 0, max = 0;
for (let i = 0; i < N; i++) { const r = spin(false); paid += r.win; if (r.win) hits++; max = Math.max(max, r.win); if (r.scat >= 4) { feats++; const f = feat(false); paid += f; fp += f; } }
let b = 0, bs = 0, M = 3000; for (let i = 0; i < M; i++) { b += feat(false); bs += feat(true); }
console.log(`RTP ${(paid/N*100).toFixed(1)}% hit ${(hits/N*100).toFixed(1)}% feat 1/${(N/feats).toFixed(0)} featAvg ${(fp/feats).toFixed(0)}x buyFS ${(b/M).toFixed(0)}/100 buySFS ${(bs/M).toFixed(0)}/500 maxBase ${max}`);
