# CASX Games

Play-money arcade built with React + Vite. No login, no deposits — credits are fictional and live in the browser (`localStorage`), shared across every game in the lobby.

## Games

| Game | Type | Return | Notes |
|---|---|---|---|
| **Dopamine Bonanza** | 6×5 scatter-pays slot | ≈ 84% | Tumbles, 4+ scatters → 10 free spins, multiplier orbs 2×–100× summed per spin, Double Chance ante, Buy Free Spins (100×) / Super Free Spins (200×, 15 spins, richer orbs). Single-spin cap 5,000×. Reels whirl and slam in column by column; tap spin (or space) to slam them early. Maths verified with `node sim.mjs`. |
| **Mines** | 5×5 grid | 97% | Choose 1–24 mines. Multiplier = true survival odds × RTP. Cash out after any safe pick; revealing every gem auto-cashes. |
| **Crash** | Curve + plane | 97% | Crash point drawn from `0.97 / (1 − u)` (3% instant). An airliner flies the live curve and flies away on crash. Manual or auto cash-out, round history. |
| **Dice** | Over / under | 96% | Target 2–98, roll 0.00–99.99. Payout = RTP ÷ win chance (up to 48×). |
| **Plinko** | Pegboard | 97% | 8 / 12 / 16 rows, low / medium / high risk, classic bucket tables. Several balls can be in flight at once. |
| **Blackjack** | Table | ≈ 99.4% with basic strategy | Six-deck shoe, dealer stands on all 17s, blackjack pays 3:2, double on first two cards. No splits, insurance or surrender. |

Every game is deliberately house-favouring; the slot in particular is tuned to be a grind (34% hit rate, features about 1 in 450 spins, bought features return roughly two-thirds of their price).

All sound is synthesised at runtime with WebAudio — there are no audio files. A shared sound toggle and volume slider sit in the game header.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve dist/
```

## Structure

```
src/
  audio/synth.js          shared WebAudio synth (tone / noise / bell / music bus)
  store/store.js          wallet + sound settings, persisted to localStorage
  pages/Home.jsx          lobby with cover art + "play this game?" prompt
  pages/Play.jsx          game shell (back link, sound, volume) — lazy-loads the game
  components/Covers*.jsx  inline SVG cover art for each tile
  games/registry.jsx      list of games shown in the lobby
  games/dopamine/         engine.js (pure logic) · art.js · sfx.js · DopamineBonanza.jsx
  games/mines/            Mines.jsx
  games/crash/            Crash.jsx (canvas curve + SVG plane sprite)
  games/dice/             Dice.jsx
  games/plinko/           Plinko.jsx (canvas pegboard)
  games/blackjack/        Blackjack.jsx
  components/Icons.jsx    shared inline SVG icon set used by every button
  styles/games.css        shared panel/stage layout for the originals
sim.mjs                   Monte Carlo check of the slot maths (node sim.mjs)
legacy/                   original standalone HTML build of Dopamine Bonanza
```

To add a game: drop a component under `src/games/<name>/`, give it a cover in `Covers.jsx`, and add an entry to `games/registry.jsx`.

Play-money demo — no real wagering, no purchases, no payouts.
