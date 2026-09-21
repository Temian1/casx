import { tone, noise, bell, step, musicBus, resume, ui } from "../../audio/synth.js";
import { store } from "../../store/store.js";

/* Named effects for Dopamine Bonanza, built on the shared synth. */
const SFX = {
  resume,
  click: ui.click,
  betTick: ui.betTick,
  toggle: ui.toggle,
  cashIn: ui.cashIn,

  /* lever pull: descending whoosh over a low thump */
  spinStart() {
    noise({ from: 5200, to: 600, dur: 0.42, gain: 0.13, q: 0.8 });
    tone({ freq: 170, to: 60, dur: 0.3, gain: 0.26, type: "sine" });
    tone({ freq: 340, to: 120, dur: 0.18, gain: 0.07, type: "sawtooth", filter: 1800, filterTo: 400 });
  },
  /* reels whirring while blurred */
  reelLoop(i) {
    tone({ freq: 120 + (i % 3) * 24, to: 90, dur: 0.09, gain: 0.05, type: "sawtooth", filter: 900, filterTo: 300, delay: i * 0.05 });
  },
  /* one column slamming into place */
  reelStop(i) {
    const d = i * 0.075;
    noise({ from: 1700, to: 260, dur: 0.11, gain: 0.14, delay: d, q: 0.9 });
    tone({ freq: 190 - i * 8, to: 70, dur: 0.13, gain: 0.2, type: "sine", delay: d });
    tone({ freq: 900 + i * 40, to: 500, dur: 0.05, gain: 0.05, type: "square", delay: d });
  },
  /* win chime — climbs a step with every tumble in the chain */
  winHit(chain) {
    const base = step(523.25, Math.min(chain - 1, 10) * 2);
    [0, 4, 7].forEach((n, i) => tone({ freq: step(base, n), dur: 0.3, gain: 0.15, type: "triangle", delay: i * 0.045 }));
    noise({ from: 5000, to: 2200, dur: 0.18, gain: 0.06 });
  },
  pop(n) {
    for (let i = 0; i < Math.min(n, 6); i++) noise({ from: 2600 + Math.random() * 2400, to: 700, dur: 0.09, gain: 0.06, delay: i * 0.028 });
    tone({ freq: 260, to: 110, dur: 0.12, gain: 0.1, type: "sine" });
  },
  tumbleLand() {
    noise({ from: 1200, to: 220, dur: 0.16, gain: 0.1, q: 0.8 });
    tone({ freq: 150, to: 70, dur: 0.15, gain: 0.14, type: "sine" });
  },
  scatterHit(n) {
    bell(step(659.25, (n - 1) * 3), 0.85, 0.16);
    noise({ from: 7000, to: 3000, dur: 0.3, gain: 0.05 });
  },
  fanfare(big) {
    const root = big ? 261.63 : 196.0;
    [0, 4, 7, 12, 16, 19].forEach((n, i) => {
      tone({ freq: step(root, n), dur: 0.7, gain: 0.14, type: "triangle", delay: i * 0.09 });
      tone({ freq: step(root, n) / 2, dur: 0.7, gain: 0.08, type: "sine", delay: i * 0.09 });
    });
    noise({ from: 400, to: 7000, dur: 0.6, gain: 0.08, q: 0.7 });
    bell(step(root, 24), 1.4, 0.13, 0.55);
  },
  retrigger() {
    [0, 5, 9, 12].forEach((n, i) => tone({ freq: step(392, n), dur: 0.45, gain: 0.15, type: "triangle", delay: i * 0.08 }));
  },
  /* an orb landing — brighter the bigger it is */
  orbLand(value) {
    const n = Math.min((Math.log(value) / Math.log(2)) * 3, 22);
    bell(step(880, n), 0.5, 0.12);
    noise({ from: 9000, to: 4000, dur: 0.22, gain: 0.05 });
  },
  multRiser(total, secs) {
    const d = secs || 0.5;
    tone({ freq: 200, to: 1800, dur: d, gain: 0.13, type: "sawtooth", filter: 600, filterTo: 6000, q: 6 });
    noise({ from: 300, to: 8000, dur: d, gain: 0.08, q: 0.6 });
    tone({ freq: 110, dur: 0.5, gain: 0.26, type: "sine", delay: d });
    bell(1046.5, 1.0, 0.16, d);
  },
  countTick(i, steps) {
    tone({ freq: step(440, (i / steps) * 24), dur: 0.05, gain: 0.09, type: "square" });
  },
  bigWinStart() {
    tone({ freq: 80, to: 200, dur: 0.5, gain: 0.22, type: "sine" });
    noise({ from: 200, to: 6000, dur: 0.5, gain: 0.07, q: 0.6 });
  },

  /* free spins backing loop: 16-step sequencer */
  music: (() => {
    let timer = null, i = 0;
    const BASS = [55.0, 0, 0, 55.0, 0, 0, 43.65, 0, 49.0, 0, 0, 49.0, 0, 0, 41.2, 0];
    const ARP = [0, 7, 12, 15, 12, 7, 15, 19, 0, 7, 12, 15, 19, 15, 12, 7];
    return {
      start() {
        if (timer) return;
        resume();
        musicBus(0.5, 0.4);
        i = 0;
        timer = setInterval(() => {
          if (!store.soundOn()) return;
          const s = i % 16;
          if (BASS[s]) tone({ freq: BASS[s], dur: 0.3, gain: 0.3, type: "sawtooth", filter: 420, filterTo: 160, q: 5, bus: "music" });
          tone({ freq: step(220, ARP[s]), dur: 0.13, gain: 0.075, type: "square", filter: 2600, bus: "music" });
          if (s % 4 === 2) noise({ from: 8000, to: 5000, dur: 0.05, gain: 0.03 });
          i++;
        }, 125);
      },
      stop() {
        if (!timer) return;
        clearInterval(timer); timer = null;
        musicBus(0.0001, 0.25);
      },
    };
  })(),
};
export default SFX;
