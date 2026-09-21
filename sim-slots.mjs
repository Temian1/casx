/* Monte Carlo check of every config-driven slot: node sim-slots.mjs [id] [spins] */
import { makeContext, playRound } from "./src/games/slots/engine.js";

const files = ["neonFruits", "pharaohsVault", "candyReactor", "pirateGold", "dragonFortune", "holdAndWin"];
const only = process.argv[2];
const N = Number(process.argv[3] || 100000);

for (const f of files) {
  const { cfg } = await import(`./src/games/slots/games/${f}.config.js`);
  if (only && cfg.id !== only && f !== only) continue;
  const ctx = makeContext(cfg);
  let paid = 0, hits = 0, feats = 0, featPaid = 0, holds = 0, holdPaid = 0, max = 0, capped = 0;
  for (let i = 0; i < N; i++) {
    const r = playRound(cfg, ctx, 1);
    paid += r.win; if (r.win > 0) hits++; if (r.win > max) max = r.win;
    if (r.steps.some((s) => s.t === "feature")) { feats++; featPaid += r.steps.find((s) => s.t === "featureEnd")?.amount || 0; }
    if (r.steps.some((s) => s.t === "hold")) { holds++; holdPaid += r.steps.find((s) => s.t === "holdEnd")?.amount || 0; }
    if (r.steps.at(-1).capped) capped++;
  }
  let buy = 0, M = 0;
  if (cfg.freeSpins?.buy) { M = 3000; for (let i = 0; i < M; i++) buy += playRound(cfg, ctx, 1, Math.random, { buy: true }).win; }
  console.log(
    `${cfg.id.padEnd(16)} RTP ${(paid / N * 100).toFixed(1).padStart(5)}%  hit ${(hits / N * 100).toFixed(1)}%` +
    (feats ? `  feature 1/${(N / feats).toFixed(0)} avg ${(featPaid / feats).toFixed(0)}x` : "") +
    (holds ? `  hold 1/${(N / holds).toFixed(0)} avg ${(holdPaid / holds).toFixed(0)}x` : "") +
    (M ? `  buy ${(buy / M).toFixed(0)}/${cfg.freeSpins.buy}` : "") +
    `  max ${max}x capped ${capped}`,
  );
}
