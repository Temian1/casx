import { lazy } from "react";
import { DopamineCover, MinesCover, CrashCover } from "../components/Covers.jsx";
import { DiceCover, PlinkoCover, BlackjackCover } from "../components/CoversMore.jsx";
import SlotCover from "../components/SlotCover.jsx";
import { cfg as neonFruits } from "./slots/games/neonFruits.config.js";
import { cfg as pharaohsVault } from "./slots/games/pharaohsVault.config.js";
import { cfg as candyReactor } from "./slots/games/candyReactor.config.js";
import { cfg as pirateGold } from "./slots/games/pirateGold.config.js";
import { cfg as dragonFortune } from "./slots/games/dragonFortune.config.js";
import { cfg as holdAndWin } from "./slots/games/holdAndWin.config.js";

/* Config-driven slots share SlotMachine; each entry is derived from its config. */
const slot = (cfg, file) => ({
  id: cfg.id, title: cfg.title, tagline: cfg.tagline, blurb: cfg.blurb, accent: cfg.accent,
  tags: [...cfg.tags, cfg.rtp + "% RTP"],
  Cover: () => <SlotCover cfg={cfg} />,
  component: lazy(() => import(`./slots/games/${file}.jsx`)),
});

/* Every playable game in the lobby. `component` is lazy so each game's
   code and CSS only load when it is opened. */
export const GAMES = [
  {
    id: "dopamine-bonanza",
    title: "Dopamine Bonanza",
    tagline: "6×5 · Pays anywhere · Tumble",
    blurb: "Land 8+ matching symbols anywhere. Tumbles chain wins, 4 dopamine molecules open free spins with multiplier orbs up to 100×. Capped at 5,000× — and built to be a grind.",
    tags: ["Slots", "Free Spins", "Max 5,000×", "84% RTP"],
    accent: "#FF2D87",
    Cover: DopamineCover,
    component: lazy(() => import("./dopamine/DopamineBonanza.jsx")),
  },
  {
    id: "mines",
    title: "Mines",
    tagline: "5×5 · Find the gems",
    blurb: "Pick your mine count and reveal tiles one by one. Each gem multiplies your bet — cash out whenever you like, or hit a mine and lose it all.",
    tags: ["Originals", "Instant", "97% RTP"],
    accent: "#29E8DE",
    Cover: MinesCover,
    component: lazy(() => import("./mines/Mines.jsx")),
  },
  {
    id: "crash",
    title: "Crash",
    tagline: "Take off · ride the curve",
    blurb: "The plane takes off and the multiplier climbs until it flies away. Cash out in time — manually or with an auto cash-out — to bank your bet × the multiplier.",
    tags: ["Originals", "Live", "97% RTP"],
    accent: "#B8FF3C",
    Cover: CrashCover,
    component: lazy(() => import("./crash/Crash.jsx")),
  },
  {
    id: "dice",
    title: "Dice",
    tagline: "Over / under · set your odds",
    blurb: "Pick a target from 2 to 98 and bet the roll lands over or under it. Tight targets pay up to 48×; safe ones pay a hair over even money.",
    tags: ["Originals", "Instant", "96% RTP"],
    accent: "#FFC63B",
    Cover: DiceCover,
    component: lazy(() => import("./dice/Dice.jsx")),
  },
  {
    id: "plinko",
    title: "Plinko",
    tagline: "8 / 12 / 16 rows · 3 risk levels",
    blurb: "Drop a ball through the pegs and see which bucket it lands in. High risk on 16 rows pays up to 970× — with the odds to match.",
    tags: ["Originals", "Multi-ball", "97% RTP"],
    accent: "#FF8A1E",
    Cover: PlinkoCover,
    component: lazy(() => import("./plinko/Plinko.jsx")),
  },
  {
    id: "blackjack",
    title: "Blackjack",
    tagline: "6 decks · dealer stands on 17",
    blurb: "Classic table blackjack: hit, stand or double against a dealer who stands on every 17. Naturals pay 3:2. No splits, no insurance.",
    tags: ["Table", "Skill", "3:2"],
    accent: "#B8FF3C",
    Cover: BlackjackCover,
    component: lazy(() => import("./blackjack/Blackjack.jsx")),
  },
];

export const SLOTS = [
  slot(neonFruits, "neonFruits"),
  slot(pharaohsVault, "pharaohsVault"),
  slot(candyReactor, "candyReactor"),
  slot(pirateGold, "pirateGold"),
  slot(dragonFortune, "dragonFortune"),
  slot(holdAndWin, "holdAndWin"),
];
GAMES.splice(1, 0, ...SLOTS);

export const gameById = (id) => GAMES.find((g) => g.id === id);
