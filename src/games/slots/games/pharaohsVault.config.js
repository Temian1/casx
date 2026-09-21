import { svg, lg, ranks } from "../art.js";
import { LINES_5x3_10 } from "../engine.js";

/* Pharaoh's Vault — 5×3, 10 lines, book-style. The Golden Book is both
   wild and scatter; 3+ books award 10 free spins with a randomly chosen
   special symbol that expands across every reel it lands on. */

const gold = `<defs>${lg("au", [[0, "#FFF1C4"], [0.5, "#FFC63B"], [1, "#9A6A08"]])}${lg("lapis", [[0, "#4C7DFF"], [1, "#122A7A"]])}</defs>`;
const ART = {
  scarab: () => svg(
    `<ellipse cx="50" cy="56" rx="20" ry="26" fill="url(#lapis)" stroke="#FFC63B" stroke-width="3"/>` +
    `<path d="M50 32v50M36 44l-14-12M64 44l14-12M34 60l-14 4M66 60l14 4M38 74l-10 12M62 74l10 12" stroke="#FFC63B" stroke-width="4" stroke-linecap="round"/>` +
    `<circle cx="50" cy="26" r="9" fill="url(#au)"/><path d="M40 20a12 12 0 0 1 20 0" fill="none" stroke="#FFC63B" stroke-width="3"/>`, gold),
  anubis: () => svg(
    `<path d="M34 86V50c0-14 6-22 16-24 10 2 16 10 16 24v36z" fill="#1B1436" stroke="#FFC63B" stroke-width="3"/>` +
    `<path d="M40 28l-8-18 14 12M60 28l8-18-14 12" fill="#1B1436" stroke="#FFC63B" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M50 40c8 0 14 6 14 14l-6 4-8-6-8 6-6-4c0-8 6-14 14-14z" fill="#2A2050"/>` +
    `<path d="M42 50h5M53 50h5" stroke="#FFC63B" stroke-width="3" stroke-linecap="round"/><path d="M34 70h32" stroke="#FFC63B" stroke-width="4"/>`, gold),
  pharaoh: () => svg(
    `<path d="M28 84V44c0-12 6-24 22-24s22 12 22 24v40z" fill="url(#lapis)" stroke="#FFC63B" stroke-width="3"/>` +
    `<path d="M28 44h44M28 54h44M28 64h44" stroke="#FFC63B" stroke-width="3" opacity=".8"/>` +
    `<path d="M38 40c0-8 5-14 12-14s12 6 12 14v20c0 6-5 10-12 10s-12-4-12-10z" fill="#E7B36A"/>` +
    `<path d="M43 46h4M53 46h4" stroke="#1B1436" stroke-width="3" stroke-linecap="round"/><rect x="46" y="62" width="8" height="14" rx="2" fill="#1B1436"/>` +
    `<path d="M44 20l6-8 6 8" fill="#FFC63B"/>`, gold),
  eye: () => svg(
    `<path d="M12 50c12-18 26-26 38-26s26 8 38 26c-12 18-26 26-38 26S24 68 12 50z" fill="#1B1436" stroke="#FFC63B" stroke-width="4"/>` +
    `<circle cx="50" cy="50" r="13" fill="url(#lapis)" stroke="#FFC63B" stroke-width="3"/><circle cx="50" cy="50" r="5" fill="#FFC63B"/>` +
    `<path d="M14 50c10-10 22-14 36-14M50 76v-4c0 10 10 14 22 12M28 74c6 2 10 6 12 12" fill="none" stroke="#FFC63B" stroke-width="4" stroke-linecap="round"/>`, gold),
  book: () => svg(
    `<path d="M18 22h30v60H18a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4zM52 22h30a4 4 0 0 1 4 4v52a4 4 0 0 1-4 4H52z" fill="url(#au)" stroke="#6A4600" stroke-width="3"/>` +
    `<path d="M48 22h4v60h-4z" fill="#6A4600"/>` +
    `<rect x="22" y="30" width="22" height="44" rx="3" fill="none" stroke="#6A4600" stroke-width="2"/><rect x="56" y="30" width="22" height="44" rx="3" fill="none" stroke="#6A4600" stroke-width="2"/>` +
    `<circle cx="33" cy="52" r="8" fill="url(#lapis)"/><path d="M60 44h14M60 52h14M60 60h14" stroke="#6A4600" stroke-width="3"/>` +
    `<text x="50" y="16" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="10" fill="#FFC63B" letter-spacing="2">WILD·SCATTER</text>`, gold),
};

export const cfg = {
  id: "pharaohs-vault", title: "Pharaoh's Vault", tagline: "5×3 · 10 lines · Expanding symbol",
  blurb: "The Golden Book is wild and scatter. Three books unlock 10 free spins with a special symbol that expands across whole reels.",
  tags: ["Slots", "Book-style", "Free Spins"], accent: "#FFC63B", rtp: 88,
  theme: { g1: "#FFC63B", g2: "#4C7DFF", glow: "255,198,59", frame: ["#6A4600", "#3A2400"], bg: ["#1B1436", "#0B0820"] },
  cols: 5, rows: 3, mode: "lines", lines: LINES_5x3_10,
  bets: [0.20, 0.50, 1, 2, 5, 10, 20, 50], maxWin: 5000,
  symbols: [
    ...ranks("#8A5A1E").map((s, i) => ({ ...s, weight: 10 - (i > 2 ? 1 : 0), pays: i < 3 ? [1.56, 3.89, 15.56] : [1.56, 6.22, 23.34] })),
    { id: "scarab", name: "Scarab", weight: 6, pays: [4.67, 15.56, 77.79], art: ART.scarab },
    { id: "anubis", name: "Anubis", weight: 5, pays: [7.78, 31.12, 116.69], art: ART.anubis },
    { id: "pharaoh", name: "Pharaoh", weight: 4, pays: [15.56, 62.23, 311.17], art: ART.pharaoh },
    { id: "eye", name: "Eye of Horus", weight: 3, pays: [31.12, 155.59, 777.93], art: ART.eye },
    { id: "book", name: "Golden Book", weight: 1.1, wild: true, scatter: true, art: ART.book },
  ],
  freeSpins: { trigger: 3, spins: 10, retrigger: 3, retriggerSpins: 10, expanding: true, expandFactor: 4, buy: 60, title: "Vault Spins" },
  rules: [
    "The Golden Book substitutes for every symbol and is also the scatter: three or more anywhere pay 10 free spins.",
    "Before the free spins one paying symbol is chosen at random. During the feature, whenever it lands on three or more reels it expands to fill them and pays across the reels regardless of position.",
    "Three more books during the feature add another 10 spins.",
  ],
};
