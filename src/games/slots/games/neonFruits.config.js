import { svg, lg, rg, disc } from "../art.js";
import { LINES_5x3_10 } from "../engine.js";

/* Neon Fruits — retro 5×3, 10 lines, neon-tube fruit. Wild star on
   reels 2–4, "777" scatter opens 10 free spins with every win doubled. */

const glow = (c) => `<circle cx="50" cy="50" r="46" fill="none" stroke="${c}" stroke-width="2" opacity=".35"/>`;
const ART = {
  cherry: () => svg(glow("#FF2D87") +
    `<path d="M50 22c8 8 16 20 18 32" stroke="#B8FF3C" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    `<path d="M50 22c-10 8-18 20-20 32" stroke="#B8FF3C" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    `<path d="M50 22c6-6 14-8 22-6" stroke="#B8FF3C" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    `<circle cx="30" cy="62" r="15" fill="url(#ch)"/><circle cx="68" cy="60" r="15" fill="url(#ch)"/>` +
    `<circle cx="25" cy="56" r="4" fill="rgba(255,255,255,.6)"/><circle cx="63" cy="54" r="4" fill="rgba(255,255,255,.6)"/>`,
    `<defs>${rg("ch", [[0, "#FF8AB8"], [0.5, "#FF2D87"], [1, "#8E0A45"]])}</defs>`),
  lemon: () => svg(glow("#FFE04A") +
    `<ellipse cx="50" cy="54" rx="30" ry="22" fill="url(#lm)" transform="rotate(-20 50 54)"/>` +
    `<path d="M22 60l-6-4M78 46l6-4" stroke="#FFE04A" stroke-width="5" stroke-linecap="round"/>` +
    `<ellipse cx="40" cy="46" rx="8" ry="5" fill="rgba(255,255,255,.45)" transform="rotate(-20 40 46)"/>`,
    `<defs>${rg("lm", [[0, "#FFF6B0"], [0.5, "#FFE04A"], [1, "#B08A00"]])}</defs>`),
  orange: () => svg(glow("#FF8A1E") +
    `<circle cx="50" cy="54" r="28" fill="url(#or)"/><path d="M50 26c-2-6 2-10 8-10" stroke="#B8FF3C" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="54" cy="16" rx="9" ry="4" fill="#B8FF3C" transform="rotate(-20 54 16)"/><circle cx="40" cy="44" r="6" fill="rgba(255,255,255,.4)"/>`,
    `<defs>${rg("or", [[0, "#FFD3A6"], [0.5, "#FF8A1E"], [1, "#9A4A00"]])}</defs>`),
  plum: () => svg(glow("#B36BFF") +
    `<path d="M50 24c-18 0-28 14-28 28s12 28 28 28 28-14 28-28S68 24 50 24z" fill="url(#pl)"/>` +
    `<path d="M50 52c0-12 0-20 0-28" stroke="rgba(0,0,0,.25)" stroke-width="3"/>` +
    `<path d="M50 24c2-6 6-9 12-9" stroke="#B8FF3C" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="40" cy="42" r="6" fill="rgba(255,255,255,.4)"/>`,
    `<defs>${rg("pl", [[0, "#E2C4FF"], [0.5, "#B36BFF"], [1, "#4A1A8A"]])}</defs>`),
  bell: () => svg(glow("#FFC63B") +
    `<path d="M50 18c-14 0-22 12-22 26v14l-8 10h60l-8-10V44c0-14-8-26-22-26z" fill="url(#bl)"/>` +
    `<circle cx="50" cy="16" r="4" fill="#FFF1C4"/><ellipse cx="50" cy="74" rx="9" ry="5" fill="#B36BFF"/>` +
    `<path d="M36 34c2-8 8-12 14-12" stroke="rgba(255,255,255,.55)" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    `<defs>${lg("bl", [[0, "#FFF1C4"], [0.5, "#FFC63B"], [1, "#9A6A08"]])}</defs>`),
  bar: () => svg(glow("#29E8DE") +
    `<rect x="12" y="34" width="76" height="32" rx="8" fill="url(#br)" stroke="#0A5C5A" stroke-width="3"/>` +
    `<text x="50" y="58" text-anchor="middle" font-family="Bungee,Impact,sans-serif" font-size="24" fill="#07040F">BAR</text>` +
    `<rect x="16" y="38" width="68" height="6" rx="3" fill="rgba(255,255,255,.45)"/>`,
    `<defs>${lg("br", [[0, "#B8FFFB"], [0.5, "#29E8DE"], [1, "#0F8F8A"]])}</defs>`),
  seven: () => svg(glow("#FF2D87") +
    `<path d="M24 20h52v10L46 82H28l28-52H24z" fill="url(#sv)" stroke="#5A0028" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M28 24h44" stroke="rgba(255,255,255,.6)" stroke-width="3"/>`,
    `<defs>${lg("sv", [[0, "#FFB1D1"], [0.5, "#FF2D87"], [1, "#8E0A45"]])}</defs>`),
  wild: () => svg(
    `<path d="M50 8l11 27 29 2-22 19 7 28-25-15-25 15 7-28L10 37l29-2z" fill="url(#wd)" stroke="#5A3B00" stroke-width="3" stroke-linejoin="round"/>` +
    `<text x="50" y="58" text-anchor="middle" font-family="Bungee,Impact,sans-serif" font-size="15" fill="#3A1000">WILD</text>`,
    `<defs>${rg("wd", [[0, "#FFF6B0"], [0.5, "#FFC63B"], [1, "#B86A00"]])}</defs>`),
  scatter: disc("#B8FF3C", `<text x="50" y="44" text-anchor="middle" font-family="Bungee,Impact,sans-serif" font-size="22" fill="#0E2A00">777</text><text x="50" y="66" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="11" fill="#0E2A00" letter-spacing="2">FREE</text>`),
};

export const cfg = {
  id: "neon-fruits", title: "Neon Fruits", tagline: "5×3 · 10 lines · Retro neon",
  blurb: "Classic fruit machine, neon-lit. Wild stars on the middle reels, 777 scatters open 10 free spins with every win doubled.",
  tags: ["Slots", "Classic", "10 lines"], accent: "#B8FF3C", rtp: 89,
  theme: { g1: "#B8FF3C", g2: "#FF2D87", glow: "184,255,60", frame: ["#1E5C58", "#0E2A30"], bg: ["#0B1B24", "#06101A"] },
  cols: 5, rows: 3, mode: "lines", lines: LINES_5x3_10,
  bets: [0.20, 0.50, 1, 2, 5, 10, 20, 50], maxWin: 2500,
  symbols: [
    { id: "cherry", name: "Cherry", weight: 9, pays: [0.86, 2.16, 6.48], art: ART.cherry },
    { id: "lemon", name: "Lemon", weight: 9, pays: [0.86, 2.59, 8.64], art: ART.lemon },
    { id: "orange", name: "Orange", weight: 8, pays: [1.3, 3.46, 10.8], art: ART.orange },
    { id: "plum", name: "Plum", weight: 8, pays: [1.73, 4.32, 12.96], art: ART.plum },
    { id: "bell", name: "Bell", weight: 6, pays: [2.59, 8.64, 25.92], art: ART.bell },
    { id: "bar", name: "Bar", weight: 5, pays: [4.32, 12.96, 43.19], art: ART.bar },
    { id: "seven", name: "Lucky 7", weight: 3, pays: [8.64, 25.92, 107.98], art: ART.seven },
    { id: "wild", name: "Neon Star", weight: [0, 2, 2, 2, 0], wild: true, art: ART.wild },
    { id: "scatter", name: "777", weight: 1.2, scatter: true, art: ART.scatter },
  ],
  freeSpins: { trigger: 3, spins: 10, multiplier: 2, retrigger: 3, retriggerSpins: 5, buy: 25, title: "Free Spins" },
  rules: [
    "Wild Neon Star lands on reels 2, 3 and 4 and stands in for every fruit, the bell, the bar and the seven.",
    "Three or more 777 scatters anywhere award 10 free spins. Every win during free spins is doubled; three more scatters add 5 spins.",
  ],
};
