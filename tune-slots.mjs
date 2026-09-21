/* Scale a slot's paytable so its simulated RTP hits a target:
   node tune-slots.mjs <file> <targetRtp%> [spins]
   Rewrites every 3-number `pays` array in the config in place. */
import { readFileSync, writeFileSync } from "node:fs";
import { makeContext, playRound } from "./src/games/slots/engine.js";

const [file, targetArg, spinsArg] = process.argv.slice(2);
const target = Number(targetArg) / 100, N = Number(spinsArg || 60000);
const path = `./src/games/slots/games/${file}.config.js`;

async function measure() {
  const { cfg } = await import(path + "?t=" + Date.now());
  const ctx = makeContext(cfg);
  let paid = 0, holdPaid = 0;
  for (let i = 0; i < N; i++) {
    const r = playRound(cfg, ctx, 1);
    paid += r.win;
    holdPaid += r.steps.find((s) => s.t === "holdEnd")?.amount || 0;
  }
  return { rtp: paid / N, hold: holdPaid / N };
}

const before = await measure();
/* line/ways/scatter pays scale linearly; hold & win coin values don't */
const k = (target - before.hold) / (before.rtp - before.hold);
let src = readFileSync(path, "utf8");
src = src.replace(/\[\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\s*\]/g, (m, a, b, c) =>
  "[" + [a, b, c].map((v) => +(Number(v) * k).toFixed(2)).join(", ") + "]");
writeFileSync(path, src);
const after = await measure();
console.log(`${file}: RTP ${(before.rtp * 100).toFixed(1)}% → ×${k.toFixed(3)} → ${(after.rtp * 100).toFixed(1)}% (hold share ${(after.hold * 100).toFixed(1)}%)`);
