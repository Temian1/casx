# CASX Games

Play-money arcade built with React + Vite. No login, no deposits — credits are fictional and live in the browser (`localStorage`), shared across every game in the lobby.

## Games

| Game | Type | Notes |
|---|---|---|
| **Dopamine Bonanza** | 6×5 scatter-pays slot | Tumbles, 4+ scatters → 10 free spins, multiplier orbs 2×–100× summed per spin, Double Chance ante, Buy Free Spins / Super Free Spins. Ported 1:1 from `legacy/dopamine-bonanza-standalone.html`. |
| **Mines** | 5×5 grid | Choose 1–24 mines. Multiplier = true survival odds × 99% RTP. Cash out after any safe pick; revealing every gem auto-cashes. |
| **Crash** | Curve | Crash point drawn from `0.99 / (1 − u)` (1% instant crash). Manual or auto cash-out, live canvas curve, round history. |

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
  components/Covers.jsx   inline SVG cover art for each tile
  games/registry.jsx      list of games shown in the lobby
  games/dopamine/         engine.js (pure logic) · art.js · sfx.js · DopamineBonanza.jsx
  games/mines/            Mines.jsx
  games/crash/            Crash.jsx
legacy/                   original standalone HTML build of Dopamine Bonanza
```

To add a game: drop a component under `src/games/<name>/`, give it a cover in `Covers.jsx`, and add an entry to `games/registry.jsx`.

Play-money demo — no real wagering, no purchases, no payouts.
