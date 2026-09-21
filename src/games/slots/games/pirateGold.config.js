import { svg, lg, ranks } from "../art.js";
import { LINES_5x4_25 } from "../engine.js";

/* Pirate Gold — 5×4, 25 lines. Skull wilds, ship scatters. Three ships
   award 8 free spins (+2 per extra ship) in which every wild that lands
   stays locked in place for the rest of the feature. */

const defs = `<defs>${lg("au", [[0, "#FFF1C4"], [0.5, "#FFC63B"], [1, "#9A6A08"]])}${lg("wood", [[0, "#8A5A2A"], [1, "#3A2010"]])}${lg("red", [[0, "#FF6A6A"], [1, "#8E0A0A"]])}</defs>`;
const ART = {
  parrot: () => svg(
    `<path d="M40 24c14-6 28 2 30 16 2 14-6 26-4 40l-8-10-6 8-2-14c-14-2-24-14-22-26 1-8 6-12 12-14z" fill="url(#red)"/>` +
    `<path d="M54 46c10 8 10 22 4 34" stroke="#29E8DE" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M60 50c8 8 8 20 2 30" stroke="#FFC63B" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    `<path d="M40 24c-8-2-14 2-16 8 6 0 10 2 12 6z" fill="#FFC63B"/><circle cx="46" cy="32" r="4" fill="#fff"/><circle cx="47" cy="32" r="2" fill="#000"/>`, defs),
  cannon: () => svg(
    `<path d="M14 62l52-30a10 10 0 0 1 10 17L24 79a10 10 0 0 1-10-17z" fill="url(#wood)" stroke="#1A0C05" stroke-width="3"/>` +
    `<circle cx="72" cy="40" r="9" fill="#1A0C05"/><circle cx="30" cy="70" r="14" fill="url(#wood)" stroke="#1A0C05" stroke-width="3"/><circle cx="30" cy="70" r="5" fill="#1A0C05"/>` +
    `<circle cx="80" cy="26" r="6" fill="#FFC63B"/><path d="M84 22l6-6M86 30l8 0" stroke="#FFC63B" stroke-width="3" stroke-linecap="round"/>`, defs),
  chest: () => svg(
    `<rect x="16" y="44" width="68" height="40" rx="5" fill="url(#wood)" stroke="#1A0C05" stroke-width="3"/>` +
    `<path d="M16 46c0-14 12-22 34-22s34 8 34 22z" fill="url(#wood)" stroke="#1A0C05" stroke-width="3"/>` +
    `<path d="M16 46h68" stroke="#FFC63B" stroke-width="4"/><rect x="42" y="40" width="16" height="16" rx="3" fill="url(#au)" stroke="#6A4600" stroke-width="2"/>` +
    `<circle cx="30" cy="30" r="6" fill="url(#au)"/><circle cx="50" cy="26" r="6" fill="url(#au)"/><circle cx="70" cy="30" r="6" fill="url(#au)"/><circle cx="40" cy="22" r="5" fill="#29E8DE"/>`, defs),
  captain: () => svg(
    `<path d="M18 40c8-20 56-20 64 0l-12 4H30z" fill="#1B1436" stroke="#FFC63B" stroke-width="3"/><path d="M18 40c14-6 50-6 64 0" fill="none" stroke="#FFC63B" stroke-width="3"/>` +
    `<ellipse cx="50" cy="56" rx="18" ry="20" fill="#E7B36A"/><path d="M32 60c4 18 32 18 36 0v14c-8 10-28 10-36 0z" fill="#3A2010"/>` +
    `<path d="M40 52h6" stroke="#1B1436" stroke-width="3" stroke-linecap="round"/><path d="M52 48l12 4M62 52a6 6 0 1 0 0 .1" fill="none" stroke="#1B1436" stroke-width="3"/><circle cx="60" cy="52" r="5" fill="#1B1436"/>` +
    `<path d="M50 34l-4-8 4 2 4-2z" fill="#FFC63B"/>`, defs),
  skull: () => svg(
    `<path d="M50 14c-18 0-30 12-30 28 0 10 6 18 12 22v10h36V64c6-4 12-12 12-22 0-16-12-28-30-28z" fill="#F4EFE6" stroke="#2A2020" stroke-width="3"/>` +
    `<circle cx="38" cy="44" r="8" fill="#2A2020"/><circle cx="62" cy="44" r="8" fill="#2A2020"/><path d="M50 52l-4 8h8z" fill="#2A2020"/>` +
    `<path d="M38 74v8M46 74v8M54 74v8M62 74v8" stroke="#2A2020" stroke-width="3"/>` +
    `<path d="M14 20l72 60M86 20L14 80" stroke="#F4EFE6" stroke-width="7" stroke-linecap="round" opacity=".9"/>` +
    `<text x="50" y="96" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="10" fill="#FFC63B" letter-spacing="2">WILD</text>`, defs),
  ship: () => svg(
    `<path d="M14 66h72l-10 18H24z" fill="url(#wood)" stroke="#1A0C05" stroke-width="3"/>` +
    `<path d="M50 14v52" stroke="#1A0C05" stroke-width="4"/><path d="M52 18c18 4 24 14 24 28H52z" fill="#F4EFE6"/><path d="M48 24C32 28 26 38 26 50h22z" fill="#F4EFE6"/>` +
    `<path d="M52 16l16 4-16 6z" fill="#FF2D87"/><path d="M8 78c8-6 16 6 24 0s16-6 24 0 16 6 24 0 8 0 12 0" fill="none" stroke="#29E8DE" stroke-width="4" stroke-linecap="round"/>`, defs),
};

export const cfg = {
  id: "pirate-gold", title: "Pirate Gold", tagline: "5×4 · 25 lines · Sticky wilds",
  blurb: "Skull wilds and ship scatters on a 5×4 board. Three ships open 8 free spins where every wild locks in place until the feature ends.",
  tags: ["Slots", "25 lines", "Sticky Wilds"], accent: "#FFC63B", rtp: 86,
  theme: { g1: "#FFC63B", g2: "#29E8DE", glow: "255,198,59", frame: ["#5A3A1A", "#2A1A0A"], bg: ["#0E2A38", "#071520"] },
  cols: 5, rows: 4, mode: "lines", lines: LINES_5x4_25,
  bets: [0.25, 0.50, 1, 2, 5, 10, 25, 50], maxWin: 3000,
  symbols: [
    ...ranks("#1E6A8A").map((s, i) => ({ ...s, weight: 12, pays: i < 3 ? [0.66, 1.66, 4.97] : [0.83, 2.49, 8.28] })),
    { id: "parrot", name: "Parrot", weight: 8, pays: [1.66, 6.63, 24.85], art: ART.parrot },
    { id: "cannon", name: "Cannon", weight: 7, pays: [2.49, 9.94, 33.14], art: ART.cannon },
    { id: "chest", name: "Treasure Chest", weight: 5, pays: [4.14, 16.57, 66.27], art: ART.chest },
    { id: "captain", name: "Captain", weight: 4, pays: [8.28, 33.14, 165.68], art: ART.captain },
    { id: "skull", name: "Skull", weight: [1, 2, 2, 2, 1], wild: true, art: ART.skull },
    { id: "ship", name: "Ship", weight: [1, 1, 1, 1, 1], scatter: true, art: ART.ship },
  ],
  freeSpins: { trigger: 3, spins: 8, extraPerScatter: 2, retrigger: 3, retriggerSpins: 4, sticky: true, buy: 45, title: "Plunder Spins" },
  rules: [
    "The Skull is wild and substitutes for every symbol except the Ship.",
    "Three or more Ships anywhere award 8 free spins, plus 2 more for each extra Ship. During the feature every Skull that lands sticks to its position for all remaining spins. Three more Ships add 4 spins.",
  ],
};
