import { store } from "../store/store.js";

/* Shared WebAudio synth. Everything is generated at runtime — no audio
   files. One AudioContext is lazily created on the first user gesture
   and shared by every game. Two buses (sfx / music) hang off a master
   gain so backing loops can duck under effects. */

let ctx = null, master = null, busSfx = null, busMusic = null, noiseBuf = null, ready = false;

function init() {
  if (ready) return true;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = store.get().volume;
    busSfx = ctx.createGain(); busSfx.gain.value = 1;
    busMusic = ctx.createGain(); busMusic.gain.value = 0.0001;
    busSfx.connect(master); busMusic.connect(master); master.connect(ctx.destination);
    const len = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    ready = true;
    store.subscribe(() => { if (ready) master.gain.value = store.get().volume; });
    return true;
  } catch { return false; }
}

export function on() {
  if (!store.soundOn()) return false;
  if (!init()) return false;
  if (ctx.state === "suspended") ctx.resume();
  return true;
}
export function resume() { on(); }
const t0 = (d) => ctx.currentTime + (d || 0);

export function tone(o = {}) {
  if (!on()) return;
  const start = t0(o.delay), dur = o.dur || 0.18, gain = o.gain == null ? 0.18 : o.gain,
    atk = o.attack == null ? 0.006 : o.attack, bus = o.bus === "music" ? busMusic : busSfx;
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = o.type || "triangle";
  osc.frequency.setValueAtTime(o.freq, start);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), start + dur);
  if (o.detune) osc.detune.value = o.detune;
  let node = osc;
  if (o.filter) {
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(o.filter, start);
    if (o.filterTo) f.frequency.exponentialRampToValueAtTime(Math.max(60, o.filterTo), start + dur);
    f.Q.value = o.q || 1;
    osc.connect(f); node = f;
  }
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  node.connect(g); g.connect(bus);
  osc.start(start); osc.stop(start + dur + 0.03);
}

export function noise(o = {}) {
  if (!on()) return;
  const start = t0(o.delay), dur = o.dur || 0.2, gain = o.gain == null ? 0.16 : o.gain;
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = o.type || "bandpass";
  f.frequency.setValueAtTime(o.from || 900, start);
  if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(60, o.to), start + dur);
  f.Q.value = o.q || 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(f); f.connect(g); g.connect(busSfx);
  src.start(start); src.stop(start + dur + 0.03);
}

export function bell(freq, dur, gain, delay) {
  [1, 2.02, 2.99, 4.21].forEach((p, i) => {
    tone({ freq: freq * p, dur: (dur || 0.7) * (1 - i * 0.16), gain: (gain || 0.13) / (i + 1.5), type: "sine", delay: delay || 0, attack: 0.004 });
  });
}

const SEMI = Math.pow(2, 1 / 12);
export const step = (base, n) => base * Math.pow(SEMI, n);

export function musicBus(level, tc) {
  if (!ready) return;
  busMusic.gain.setTargetAtTime(Math.max(0.0001, level), ctx.currentTime, tc || 0.3);
}

/* Generic UI blips shared by every game */
export const ui = {
  click() { tone({ freq: 520, to: 300, dur: 0.07, gain: 0.12, type: "square" }); noise({ from: 2600, to: 900, dur: 0.05, gain: 0.07 }); },
  betTick(up) { tone({ freq: up ? 720 : 560, to: up ? 900 : 440, dur: 0.09, gain: 0.13, type: "triangle" }); },
  toggle(onState) { tone({ freq: onState ? 520 : 420, dur: 0.08, gain: 0.13, type: "sine" }); tone({ freq: onState ? 780 : 320, dur: 0.14, gain: 0.11, type: "sine", delay: 0.07 }); },
  cashIn() { [0, 7, 12, 19].forEach((n, i) => bell(step(523.25, n), 0.9, 0.13, i * 0.07)); },
  lose() { tone({ freq: 220, to: 60, dur: 0.5, gain: 0.2, type: "sawtooth", filter: 1200, filterTo: 200 }); noise({ from: 900, to: 120, dur: 0.45, gain: 0.14, q: 0.7 }); },
};
