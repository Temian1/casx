import { lazy } from "react";
import { DopamineCover, MinesCover, CrashCover } from "../components/Covers.jsx";

/* Every playable game in the lobby. `component` is lazy so each game's
   code and CSS only load when it is opened. */
export const GAMES = [
  {
    id: "dopamine-bonanza",
    title: "Dopamine Bonanza",
    tagline: "6×5 · Pays anywhere · Tumble",
    blurb: "Land 8+ matching symbols anywhere. Tumbles chain wins, 4 dopamine molecules open free spins with multiplier orbs up to 100×.",
    tags: ["Slots", "Free Spins", "Max 5,000×"],
    accent: "#FF2D87",
    Cover: DopamineCover,
    component: lazy(() => import("./dopamine/DopamineBonanza.jsx")),
  },
  {
    id: "mines",
    title: "Mines",
    tagline: "5×5 · Find the gems",
    blurb: "Pick your mine count and reveal tiles one by one. Each gem multiplies your bet — cash out whenever you like, or hit a mine and lose it all.",
    tags: ["Originals", "Instant", "99% RTP"],
    accent: "#29E8DE",
    Cover: MinesCover,
    component: lazy(() => import("./mines/Mines.jsx")),
  },
  {
    id: "crash",
    title: "Crash",
    tagline: "Ride the curve",
    blurb: "The multiplier climbs until it crashes. Cash out in time — manually or with an auto cash-out — to bank your bet × the multiplier.",
    tags: ["Originals", "Live", "99% RTP"],
    accent: "#B8FF3C",
    Cover: CrashCover,
    component: lazy(() => import("./crash/Crash.jsx")),
  },
];

export const gameById = (id) => GAMES.find((g) => g.id === id);
