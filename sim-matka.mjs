/* Monte Carlo check of Number Matka: node sim-matka.mjs [draws] */
import * as M from "./src/games/matka/engine.js";

const N = Number(process.argv[2] || 2000000);

/* One flat bet of each kind, repeated over N draws. */
const bets = [
  ["open-ank", { digit: 7 }],
  ["close-ank", { digit: 3 }],
  ["jodi", { jodi: "82" }],
  ["open-panna", { panna: "123" }],
  ["open-panna", { panna: "112" }],
  ["open-panna", { panna: "111" }],
  ["close-panna", { panna: "456" }],
  ["half-sangam-open", { digit: 8, panna: "246" }],
  ["half-sangam-close", { panna: "369", digit: 2 }],
  ["full-sangam", { openPanna: "369", closePanna: "246" }],
];
const tally = bets.map(() => ({ staked: 0, won: 0, hits: 0 }));

/* also check the draw itself is unbiased */
const ankCount = Array(10).fill(0);
const typeCount = { single: 0, double: 0, triple: 0 };

for (let i = 0; i < N; i++) {
  const r = M.drawResult();
  ankCount[r.open.ank]++;
  typeCount[M.pannaType(r.open.panna)]++;
  for (let b = 0; b < bets.length; b++) {
    const [type, pick] = bets[b];
    const t = tally[b];
    t.staked += 1;
    if (M.betWins({ type, pick }, r)) { t.won += M.rateInfo(type, pick).rate; t.hits++; }
  }
}

console.log(`${N.toLocaleString()} draws\n`);
console.log("bet                 pick          rate   theory   actual   hits");
for (let b = 0; b < bets.length; b++) {
  const [type, pick] = bets[b], t = tally[b];
  const { rate } = M.rateInfo(type, pick);
  console.log(
    type.padEnd(19) + M.pickLabel(type, pick).padEnd(13) +
    String(rate).padStart(5) +
    (M.returnOf(type, pick) * 100).toFixed(2).padStart(8) + "%" +
    (t.won / t.staked * 100).toFixed(2).padStart(8) + "%" +
    String(t.hits).padStart(7),
  );
}
const ankErr = Math.max(...ankCount.map((c) => Math.abs(c / N - 0.1)));
console.log(`\nank spread: max deviation from 10% = ${(ankErr * 100).toFixed(3)} pts`);
console.log("panna type mix:", Object.entries(typeCount).map(([k, v]) => `${k} ${(v / N * 100).toFixed(2)}%`).join("  "),
  "(expected single 72%  double 27%  triple 1%)");
