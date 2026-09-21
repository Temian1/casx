import { svg, lg, rg } from "../art.js";

/* Candy Reactor — 6×5 pays-anywhere tumble slot. 8+ of a candy anywhere
   pays and tumbles; multiplier bombs (2×–100×) can land in the base game
   rarely and often in free spins, summing and multiplying the spin. */

const bean = (id, c1, c2) => () => svg(
  `<ellipse cx="50" cy="52" rx="30" ry="20" fill="url(#${id})" transform="rotate(-25 50 52)"/>` +
  `<ellipse cx="42" cy="44" rx="10" ry="5" fill="rgba(255,255,255,.5)" transform="rotate(-25 42 44)"/>`,
  `<defs>${rg(id, [[0, c1], [0.5, c2], [1, "#000"]])}</defs>`);
const ART = {
  jellyPink: bean("jp", "#FFD1E6", "#FF2D87"),
  jellyCyan: bean("jc", "#D6FFFC", "#29E8DE"),
  jellyLime: bean("jl", "#F0FFC8", "#B8FF3C"),
  jellyGold: bean("jg", "#FFF1C4", "#FFC63B"),
  gummy: () => svg(
    `<circle cx="34" cy="26" r="10" fill="url(#gm)"/><circle cx="66" cy="26" r="10" fill="url(#gm)"/>` +
    `<circle cx="50" cy="40" r="20" fill="url(#gm)"/><rect x="28" y="48" width="44" height="40" rx="16" fill="url(#gm)"/>` +
    `<circle cx="42" cy="38" r="3" fill="#5A0028"/><circle cx="58" cy="38" r="3" fill="#5A0028"/><path d="M44 48q6 5 12 0" stroke="#5A0028" stroke-width="2.5" fill="none" stroke-linecap="round"/>` +
    `<circle cx="42" cy="30" r="5" fill="rgba(255,255,255,.45)"/>`,
    `<defs>${rg("gm", [[0, "#FFB1D1"], [0.5, "#FF2D87"], [1, "#8E0A45"]])}</defs>`),
  chocolate: () => svg(
    `<rect x="14" y="26" width="72" height="50" rx="8" fill="url(#cc)" stroke="#2A1005" stroke-width="3"/>` +
    `<path d="M38 26v50M62 26v50M14 51h72" stroke="#2A1005" stroke-width="3"/>` +
    `<rect x="18" y="30" width="16" height="6" rx="3" fill="rgba(255,255,255,.28)"/><rect x="42" y="30" width="16" height="6" rx="3" fill="rgba(255,255,255,.28)"/><rect x="66" y="30" width="16" height="6" rx="3" fill="rgba(255,255,255,.28)"/>`,
    `<defs>${lg("cc", [[0, "#8A4A2A"], [0.5, "#5A2A12"], [1, "#2A1005"]])}</defs>`),
  macaron: () => svg(
    `<ellipse cx="50" cy="38" rx="32" ry="12" fill="url(#mc)"/><rect x="18" y="38" width="64" height="12" fill="url(#mc)"/>` +
    `<rect x="20" y="48" width="60" height="8" fill="#FFF1C4"/><rect x="18" y="56" width="64" height="12" fill="url(#mc)"/><ellipse cx="50" cy="68" rx="32" ry="12" fill="url(#mc)"/>` +
    `<ellipse cx="40" cy="34" rx="12" ry="4" fill="rgba(255,255,255,.45)"/>`,
    `<defs>${lg("mc", [[0, "#D9C4FF"], [0.5, "#B36BFF"], [1, "#5A1A9A"]])}</defs>`),
  cane: () => svg(
    `<path d="M36 90V36a14 14 0 0 1 28 0v6" fill="none" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round"/>` +
    `<path d="M36 90V36a14 14 0 0 1 28 0v6" fill="none" stroke="url(#cn)" stroke-width="16" stroke-linecap="round" stroke-dasharray="10 10"/>` +
    `<path d="M36 90V36a14 14 0 0 1 28 0v6" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="18" stroke-linecap="round" opacity=".3"/>`,
    `<defs>${lg("cn", [[0, "#FF6FA8"], [1, "#E0245E"]])}</defs>`),
  lollipop: () => svg(
    `<rect x="47" y="52" width="6" height="42" rx="3" fill="#FFF1C4"/><circle cx="50" cy="38" r="30" fill="url(#lp)"/>` +
    `<path d="M50 38m-22 0a22 22 0 1 1 44 0a16 16 0 1 1-32 0a10 10 0 1 1 20 0a4 4 0 1 1-8 0" fill="none" stroke="#FFFFFF" stroke-width="5" opacity=".85"/>` +
    `<text x="50" y="94" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="9" fill="#B8FF3C" letter-spacing="2">SCATTER</text>`,
    `<defs>${rg("lp", [[0, "#FF8AB8"], [0.5, "#FF2D87"], [1, "#B8FF3C"]], "50%", "50%")}</defs>`),
};

const BOMBS = [[2, 300], [3, 240], [4, 180], [5, 150], [6, 110], [8, 86], [10, 64], [12, 42], [15, 30], [20, 22], [25, 14], [50, 6], [100, 2]];

export const cfg = {
  id: "candy-reactor", title: "Candy Reactor", tagline: "6×5 · Pays anywhere · Tumble",
  blurb: "Eight or more matching candies anywhere pay and tumble away. Multiplier bombs up to 100× stack up through free spins.",
  tags: ["Slots", "Tumble", "Bombs 100×"], accent: "#FF2D87", rtp: 89,
  theme: { g1: "#FF8AB8", g2: "#B36BFF", glow: "255,45,135", frame: ["#7A1F5A", "#3A0E34"], bg: ["#2A0F3A", "#12061E"] },
  cols: 6, rows: 5, mode: "scatter", tumble: true,
  bets: [0.20, 0.40, 0.60, 0.80, 1, 2, 4, 6, 10, 20, 50, 100], maxWin: 5000,
  symbols: [
    { id: "jp", name: "Pink Jelly", weight: 138, pays: [0.29, 0.85, 5.68], art: ART.jellyPink },
    { id: "jc", name: "Cyan Jelly", weight: 132, pays: [0.45, 1.14, 6.81], art: ART.jellyCyan },
    { id: "jl", name: "Lime Jelly", weight: 126, pays: [0.68, 1.36, 9.08], art: ART.jellyLime },
    { id: "jg", name: "Gold Jelly", weight: 120, pays: [0.91, 1.71, 11.36], art: ART.jellyGold },
    { id: "gummy", name: "Gummy Bear", weight: 100, pays: [2.15, 2.86, 17.16], art: ART.gummy },
    { id: "choc", name: "Chocolate", weight: 88, pays: [2.86, 7.15, 21.45], art: ART.chocolate },
    { id: "macaron", name: "Macaron", weight: 70, pays: [3.58, 14.3, 35.75], art: ART.macaron },
    { id: "cane", name: "Candy Cane", weight: 50, pays: [14.3, 35.75, 71.5], art: ART.cane },
    { id: "lolly", name: "Lollipop", weight: 13, scatter: true, art: ART.lollipop },
  ],
  bombs: { baseChance: 0.002, freeChance: 0.11, values: BOMBS },
  freeSpins: { trigger: 4, spins: 10, retrigger: 3, retriggerSpins: 5, buy: 80, title: "Reactor Spins" },
  rules: [
    "No paylines: land 8 or more of the same candy anywhere on the 6×5 grid and it pays. Winning candies dissolve, everything above tumbles down and new candies fall in — tumbles repeat until no new win forms.",
    "Bombs carry a multiplier from 2× to 100×. They survive tumbles, and when the sequence ends every bomb on screen is added together and multiplies the whole spin's win. Bombs are rare in the base game and common during free spins.",
    "Four or more lollipops award 10 free spins; three more during the feature add 5.",
  ],
};
