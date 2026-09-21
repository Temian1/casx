import { svg, lg, rg, ranks } from "../art.js";

/* Dragon Fortune — 5×3, 243 ways. Yin-yang wild, pearl scatter. Three
   pearls award 10 free spins with a multiplier that climbs by one after
   every winning spin and never resets during the feature. */

const defs = `<defs>${lg("au", [[0, "#FFF1C4"], [0.5, "#FFC63B"], [1, "#9A6A08"]])}${lg("red", [[0, "#FF6A6A"], [0.5, "#E0245E"], [1, "#6A0A2A"]])}${lg("jade", [[0, "#B8FF3C"], [1, "#1E7A3A"]])}</defs>`;
const ART = {
  coin: () => svg(
    `<circle cx="50" cy="50" r="36" fill="url(#au)" stroke="#6A4600" stroke-width="3"/><circle cx="50" cy="50" r="28" fill="none" stroke="#6A4600" stroke-width="2"/>` +
    `<rect x="40" y="40" width="20" height="20" fill="#3A1000"/><path d="M50 14v10M50 76v10M14 50h10M76 50h10" stroke="#6A4600" stroke-width="3"/>`, defs),
  lantern: () => svg(
    `<rect x="42" y="10" width="16" height="8" rx="2" fill="url(#au)"/><path d="M28 22h44c4 16 4 32 0 48H28c-4-16-4-32 0-48z" fill="url(#red)" stroke="#6A0A2A" stroke-width="3"/>` +
    `<path d="M36 22c-2 16-2 32 0 48M50 22v48M64 22c2 16 2 32 0 48" stroke="rgba(0,0,0,.25)" stroke-width="2"/>` +
    `<rect x="42" y="70" width="16" height="8" rx="2" fill="url(#au)"/><path d="M46 78v14M50 78v16M54 78v14" stroke="#FFC63B" stroke-width="3" stroke-linecap="round"/>`, defs),
  koi: () => svg(
    `<path d="M20 50c10-16 40-24 60-14-6 8-8 20 0 28-20 10-50 2-60-14z" fill="url(#red)" stroke="#6A0A2A" stroke-width="3"/>` +
    `<path d="M80 36l12-12-2 26-10-4M40 36c4-8 12-10 18-8M40 64c4 8 12 10 18 8" fill="#FFF1C4" stroke="#6A0A2A" stroke-width="2"/>` +
    `<circle cx="34" cy="48" r="4" fill="#fff"/><circle cx="35" cy="48" r="2" fill="#000"/><circle cx="56" cy="44" r="6" fill="#FFF1C4"/><circle cx="66" cy="56" r="5" fill="#FFF1C4"/>`, defs),
  dragon: () => svg(
    `<path d="M22 68c-8-14 2-30 18-32 10-2 18 4 26 2 8-4 10-14 4-20 12 2 18 14 12 26-4 8-14 12-24 10-8-2-14 4-14 12 0 6 6 10 12 8-10 12-28 8-34-6z" fill="url(#jade)" stroke="#0E3A1A" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M70 18l6-8 2 10M80 24l10-2-6 8" fill="#FFC63B"/><circle cx="66" cy="28" r="3" fill="#FF2D87"/>` +
    `<circle cx="60" cy="66" r="10" fill="url(#au)"/><circle cx="60" cy="66" r="4" fill="#FF2D87"/>`, defs),
  yinyang: () => svg(
    `<circle cx="50" cy="50" r="38" fill="#F4EFE6" stroke="#FFC63B" stroke-width="4"/>` +
    `<path d="M50 12a38 38 0 0 1 0 76 19 19 0 0 1 0-38 19 19 0 0 0 0-38z" fill="#1B1436"/>` +
    `<circle cx="50" cy="31" r="6" fill="#1B1436"/><circle cx="50" cy="69" r="6" fill="#F4EFE6"/>` +
    `<text x="50" y="97" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="10" fill="#FFC63B" letter-spacing="2">WILD</text>`, defs),
  pearl: () => svg(
    `<circle cx="50" cy="48" r="26" fill="url(#pr)"/><circle cx="40" cy="38" r="7" fill="rgba(255,255,255,.75)"/>` +
    `<path d="M20 70c10 10 50 10 60 0-4 12-12 18-30 18S24 82 20 70z" fill="url(#jade)" stroke="#0E3A1A" stroke-width="2"/>` +
    `<path d="M50 8l4 10-4 4-4-4z M18 40l10 2-2 6-8-2z M82 40l-10 2 2 6 8-2z" fill="#29E8DE"/>` +
    `<text x="50" y="97" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="9" fill="#29E8DE" letter-spacing="2">SCATTER</text>`,
    `<defs>${rg("pr", [[0, "#FFFFFF"], [0.5, "#D9C4FF"], [1, "#7A5AB8"]])}${lg("jade", [[0, "#B8FF3C"], [1, "#1E7A3A"]])}</defs>`),
};

export const cfg = {
  id: "dragon-fortune", title: "Dragon Fortune", tagline: "5×3 · 243 ways · Rising multiplier",
  blurb: "243 ways to win. Three pearls open 10 free spins with a multiplier that rises by one after every winning spin — and never resets.",
  tags: ["Slots", "243 ways", "Progressive ×"], accent: "#E0245E", rtp: 85,
  theme: { g1: "#FFC63B", g2: "#E0245E", glow: "224,36,94", frame: ["#7A1F2A", "#3A0A12"], bg: ["#2A0A14", "#12050A"] },
  cols: 5, rows: 3, mode: "ways",
  bets: [0.25, 0.50, 1, 2, 5, 10, 25, 50], maxWin: 4000,
  symbols: [
    ...ranks("#8A1E2A").map((s, i) => ({ ...s, weight: 11, pays: i < 3 ? [0.35, 0.86, 2.59] : [0.43, 1.29, 3.45] })),
    { id: "coin", name: "Gold Coin", weight: 7, pays: [0.86, 2.59, 8.63] , art: ART.coin },
    { id: "lantern", name: "Lantern", weight: 6, pays: [1.29, 3.45, 12.95], art: ART.lantern },
    { id: "koi", name: "Koi", weight: 5, pays: [1.73, 6.9, 25.89], art: ART.koi },
    { id: "dragon", name: "Dragon", weight: 3, pays: [4.32, 17.26, 86.31], art: ART.dragon },
    { id: "yinyang", name: "Yin Yang", weight: [0, 2, 2, 2, 0], wild: true, art: ART.yinyang },
    { id: "pearl", name: "Pearl", weight: 1.6, scatter: true, art: ART.pearl },
  ],
  freeSpins: { trigger: 3, spins: 10, retrigger: 3, retriggerSpins: 5, progressive: true, buy: 30, title: "Dragon Spins" },
  rules: [
    "243 ways: a symbol on reel 1 that also appears on each following adjacent reel pays, and the win is multiplied by the number of ways it can be traced. Yin Yang is wild on reels 2, 3 and 4.",
    "Three or more Pearls award 10 free spins. The feature starts at 1×; every spin that wins is paid at the current multiplier and then raises it by one. Three more Pearls add 5 spins.",
  ],
};
