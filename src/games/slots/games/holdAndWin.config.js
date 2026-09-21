import { svg, lg, ranks } from "../art.js";
import { LINES_5x3_20 } from "../engine.js";

/* Hold & Win — 5×3, 20 lines, wild sun. Gold coins carry cash values or
   Mini / Minor / Major jackpots. Six or more coins lock in place and start
   three respins; every new coin resets the counter. Fill all 15 for the
   Grand. */

const defs = `<defs>${lg("au", [[0, "#FFF1C4"], [0.5, "#FFC63B"], [1, "#9A6A08"]])}${lg("fur", [[0, "#8A6A4A"], [1, "#3A2A1A"]])}${lg("sky", [[0, "#FF8A1E"], [1, "#6A1A5A"]])}</defs>`;
const ART = {
  wolf: () => svg(
    `<path d="M30 30l-8-16 16 10h24l16-10-8 16c8 8 8 24 0 34-8 10-32 10-40 0-8-10-8-26 0-34z" fill="url(#fur)" stroke="#1A0C05" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M50 44v20l-8 6M50 64l8 6" stroke="#1A0C05" stroke-width="3" fill="none"/><circle cx="40" cy="44" r="4" fill="#FFC63B"/><circle cx="60" cy="44" r="4" fill="#FFC63B"/><path d="M46 70q4 3 8 0" stroke="#1A0C05" stroke-width="3" fill="none"/>`, defs),
  eagle: () => svg(
    `<path d="M50 34c-14-10-34-8-44 2 12 2 20 6 26 14-10 0-18 4-24 12 10-2 20 0 28 6l14 14 14-14c8-6 18-8 28-6-6-8-14-12-24-12 6-8 14-12 26-14-10-10-30-12-44-2z" fill="url(#fur)" stroke="#1A0C05" stroke-width="3" stroke-linejoin="round"/>` +
    `<circle cx="50" cy="28" r="10" fill="#F4EFE6" stroke="#1A0C05" stroke-width="2"/><path d="M52 28l10 4-8 4z" fill="#FFC63B"/><circle cx="47" cy="27" r="2" fill="#1A0C05"/>`, defs),
  bison: () => svg(
    `<path d="M26 34c-10-2-14-10-12-18 6 4 10 8 14 12M74 34c10-2 14-10 12-18-6 4-10 8-14 12" fill="#F4EFE6" stroke="#1A0C05" stroke-width="3"/>` +
    `<path d="M30 30c12-10 28-10 40 0 6 8 8 18 6 30-4 12-14 22-26 22S28 72 24 60c-2-12 0-22 6-30z" fill="url(#fur)" stroke="#1A0C05" stroke-width="3"/>` +
    `<circle cx="40" cy="48" r="4" fill="#FFC63B"/><circle cx="60" cy="48" r="4" fill="#FFC63B"/><ellipse cx="50" cy="70" rx="10" ry="6" fill="#1A0C05"/>`, defs),
  ram: () => svg(
    `<path d="M22 44c-10-8-10-24 2-28 10-2 16 8 12 18-2 6-6 10-14 10zM78 44c10-8 10-24-2-28-10-2-16 8-12 18 2 6 6 10 14 10z" fill="url(#au)" stroke="#6A4600" stroke-width="3"/>` +
    `<path d="M34 30c8-8 24-8 32 0 6 10 6 26 0 40-6 10-26 10-32 0-6-14-6-30 0-40z" fill="#F4EFE6" stroke="#1A0C05" stroke-width="3"/>` +
    `<circle cx="42" cy="46" r="4" fill="#1A0C05"/><circle cx="58" cy="46" r="4" fill="#1A0C05"/><ellipse cx="50" cy="68" rx="8" ry="5" fill="#FF8AB8"/>`, defs),
  sun: () => svg(
    `<circle cx="50" cy="50" r="22" fill="url(#au)" stroke="#6A4600" stroke-width="3"/>` +
    `${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M50 10l6 14h-12z" fill="#FFC63B" transform="rotate(${a} 50 50)"/>`).join("")}` +
    `<text x="50" y="56" text-anchor="middle" font-family="Bungee,Impact,sans-serif" font-size="14" fill="#3A1000">WILD</text>`, defs),
  coin: () => svg(
    `<circle cx="50" cy="50" r="38" fill="url(#au)" stroke="#6A4600" stroke-width="3"/><circle cx="50" cy="50" r="30" fill="none" stroke="#6A4600" stroke-width="2" stroke-dasharray="4 3"/>` +
    `<text x="50" y="60" text-anchor="middle" font-family="Bungee,Impact,sans-serif" font-size="28" fill="#3A1000">$</text>`, defs),
};

export const cfg = {
  id: "hold-and-win", title: "Hold & Win", tagline: "5×3 · 20 lines · Coins & jackpots",
  blurb: "Six or more gold coins lock the reels and start three respins. Every new coin resets the counter; fill all 15 positions for the 1,000× Grand.",
  tags: ["Slots", "Respins", "Grand 1,000×"], accent: "#FF8A1E", rtp: 80,
  theme: { g1: "#FFC63B", g2: "#FF8A1E", glow: "255,138,30", frame: ["#7A3A0E", "#3A1A05"], bg: ["#2A1030", "#12061A"] },
  cols: 5, rows: 3, mode: "lines", lines: LINES_5x3_20,
  bets: [0.20, 0.50, 1, 2, 5, 10, 20, 50], maxWin: 5000,
  symbols: [
    ...ranks("#8A4A1E").map((s, i) => ({ ...s, weight: 10, pays: i < 3 ? [1.13, 2.81, 8.44] : [1.13, 3.38, 11.26] })),
    { id: "ram", name: "Ram", weight: 6, pays: [2.81, 8.44, 28.14], art: ART.ram },
    { id: "bison", name: "Bison", weight: 5, pays: [4.5, 11.26, 45.02], art: ART.bison },
    { id: "eagle", name: "Eagle", weight: 4, pays: [6.75, 22.51, 84.42], art: ART.eagle },
    { id: "wolf", name: "Wolf", weight: 3, pays: [11.26, 45.02, 168.83], art: ART.wolf },
    { id: "sun", name: "Sun", weight: [0, 2, 2, 2, 0], wild: true, art: ART.sun },
    { id: "coin", name: "Gold Coin", weight: 7, coin: true, art: ART.coin },
  ],
  holdWin: {
    trigger: 6, respins: 3, respinChance: 0.07, title: "Hold & Win",
    values: [[1, 40], [2, 30], [3, 20], [5, 14], [8, 8], [10, 6], [15, 4], [20, 3], [50, 1], ["mini", 6], ["minor", 3], ["major", 1]],
    jackpots: { mini: 20, minor: 50, major: 200, grand: 1000 },
  },
  rules: [
    "The Sun is wild on reels 2, 3 and 4. Gold Coins land on every reel carrying a cash value of 1× to 50× the bet, or a Mini (20×), Minor (50×) or Major (200×) jackpot. Coins do not pay on lines.",
    "Six or more Coins on one spin start Hold & Win: the coins lock, every other position respins three times, and each new coin resets the respins to three. When the respins run out every locked coin pays its value. Fill all 15 positions and the Grand jackpot (1,000× bet) is added on top.",
  ],
};
