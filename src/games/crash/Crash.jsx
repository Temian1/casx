import { useEffect, useRef, useState } from "react";
import { wallet, useStore, money } from "../../store/store.js";
import { tone, noise, bell, step, resume, ui } from "../../audio/synth.js";
import { Plus, Minus, Reset, Plane as PlaneIcon, Cash, Timer, Info } from "../../components/Icons.jsx";
import "./crash.css";

/* Crash — place a bet, take off, and watch the multiplier climb while the
   plane flies the curve. Cash out before it flies away to bank
   bet × multiplier. Crash point: 0.97/(1-u), 3% of rounds crash instantly. */

const BETS = [0.20, 0.50, 1, 2, 5, 10, 20, 50, 100];
const GROWTH = Math.log(2) / 7500; // doubles every 7.5s (per ms)
const EDGE = 0.97;                 // long-run return

function drawCrashPoint() {
  const u = Math.random();
  if (u < 1 - EDGE) return 1.0;
  return Math.max(1, Math.floor((EDGE / (1 - u)) * 100) / 100);
}
const multAt = (ms) => Math.exp(GROWTH * ms);

const W = wallet("crash");

const SFX = {
  takeoff() {
    noise({ from: 300, to: 5000, dur: 0.9, gain: 0.12, q: 0.6 });
    tone({ freq: 70, to: 260, dur: 0.9, gain: 0.18, type: "sawtooth", filter: 500, filterTo: 2600 });
  },
  engine(m) {
    tone({ freq: 55 + Math.min(Math.log2(m) * 12, 90), dur: 0.16, gain: 0.045, type: "sawtooth", filter: 380, q: 2 });
  },
  tick(m) {
    tone({ freq: step(330, Math.min(Math.log2(m) * 7, 36)), dur: 0.05, gain: 0.045, type: "square" });
  },
  flyAway() {
    tone({ freq: 400, to: 1400, dur: 0.7, gain: 0.12, type: "sawtooth", filter: 3000, filterTo: 800 });
    noise({ from: 4000, to: 300, dur: 0.9, gain: 0.16, q: 0.5 });
    tone({ freq: 160, to: 40, dur: 0.6, gain: 0.2, type: "sine", delay: 0.1 });
  },
  cash(m) {
    bell(step(523.25, Math.min(Math.log2(m) * 4, 24)), 0.9, 0.16);
    ui.cashIn();
  },
};

export default function Crash() {
  const { credit } = useStore();
  const [betIndex, setBetIndex] = useState(2);
  const [autoOut, setAutoOut] = useState("2.00");
  const [phase, setPhase] = useState("idle");   // idle | flying | crashed
  const [mult, setMult] = useState(1);
  const [cashed, setCashed] = useState(null);   // { at, win }
  const [history, setHistory] = useState([]);
  const [lastWin, setLastWin] = useState(0);

  const canvasRef = useRef(null);
  const planeRef = useRef(null);
  const round = useRef(null);   // { start, crashAt, points:[], raf, lastTick, lastEngine, bet, cashed }
  const stateRef = useRef({ phase, autoOut });
  stateRef.current = { phase, autoOut };

  const bet = BETS[betIndex];
  const flying = phase === "flying";

  useEffect(() => () => { if (round.current?.raf) cancelAnimationFrame(round.current.raf); }, []);

  function launch() {
    resume();
    if (flying || credit < bet) return;
    if (!W.debit(bet, "round")) return;
    setLastWin(0);
    setCashed(null);
    setMult(1);
    setPhase("flying");
    round.current = { start: performance.now(), crashAt: drawCrashPoint(), points: [], raf: 0, lastTick: 0, lastEngine: 0, bet, cashed: null };
    SFX.takeoff();
    round.current.raf = requestAnimationFrame(frame);
  }

  function frame(now) {
    const r = round.current;
    if (!r) return;
    const elapsed = now - r.start;
    let m = multAt(elapsed);
    const auto = parseFloat(stateRef.current.autoOut);

    if (!r.cashed && auto >= 1.01 && m >= auto && auto < r.crashAt) doCashOut(auto);

    if (m >= r.crashAt) {
      m = r.crashAt;
      r.points.push([elapsed, m]);
      setMult(m);
      draw(r.points, true, r.crashAt);
      setPhase("crashed");
      setHistory((h) => [r.crashAt, ...h].slice(0, 14));
      SFX.flyAway();
      return;
    }
    r.points.push([elapsed, m]);
    setMult(m);
    draw(r.points, false, null);
    if (now - r.lastTick > 180 / Math.max(1, Math.log2(m) + 1)) { r.lastTick = now; SFX.tick(m); }
    if (now - r.lastEngine > 150) { r.lastEngine = now; SFX.engine(m); }
    r.raf = requestAnimationFrame(frame);
  }

  function doCashOut(atOverride) {
    const r = round.current;
    if (!r || r.cashed) return;
    const at = atOverride ?? multAt(performance.now() - r.start);
    const m = Math.floor(at * 100) / 100;
    const win = Math.round(r.bet * m * 100) / 100;
    r.cashed = { at: m, win };
    W.payout(win, `cashed out @ ${m.toFixed(2)}×`);
    setLastWin(win);
    setCashed(r.cashed);
    SFX.cash(m);
  }

  function cashOut() {
    if (!flying) return;
    resume();
    doCashOut();
  }

  /* ---------- canvas + plane ---------- */
  function draw(points, crashed, crashAt) {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const pad = { l: 44, r: 70, t: 40, b: 28 };
    const last = points[points.length - 1] || [0, 1];
    const tMax = Math.max(4000, last[0] * 1.08);
    const mMax = Math.max(2, last[1] * 1.15);
    const X = (t) => pad.l + (t / tMax) * (W - pad.l - pad.r);
    const Y = (m) => H - pad.b - ((m - 1) / (mMax - 1)) * (H - pad.t - pad.b);

    /* grid */
    ctx.strokeStyle = "rgba(155,138,196,.18)"; ctx.lineWidth = 1;
    ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillStyle = "#9B8AC4"; ctx.textAlign = "right";
    const stepM = mMax <= 3 ? 0.5 : mMax <= 8 ? 1 : mMax <= 25 ? 5 : mMax <= 100 ? 20 : 100;
    for (let m = 1; m <= mMax; m += stepM) {
      ctx.beginPath(); ctx.moveTo(pad.l, Y(m)); ctx.lineTo(W - pad.r, Y(m)); ctx.stroke();
      ctx.fillText(m.toFixed(stepM < 1 ? 1 : 0) + "×", pad.l - 6, Y(m) + 4);
    }
    ctx.textAlign = "center";
    const stepT = tMax <= 8000 ? 1000 : tMax <= 30000 ? 5000 : 10000;
    for (let t = 0; t <= tMax; t += stepT) ctx.fillText((t / 1000) + "s", X(t), H - 8);

    /* curve */
    let hx = X(0), hy = Y(1), angle = 0;
    if (points.length > 1) {
      const grad = ctx.createLinearGradient(0, H, 0, 0);
      grad.addColorStop(0, crashed ? "rgba(255,45,135,.05)" : "rgba(255,45,135,.06)");
      grad.addColorStop(1, crashed ? "rgba(255,45,135,.3)" : "rgba(255,45,135,.4)");
      ctx.beginPath();
      ctx.moveTo(X(points[0][0]), Y(1));
      for (const [t, m] of points) ctx.lineTo(X(t), Y(m));
      ctx.lineTo(X(last[0]), Y(1));
      ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

      ctx.beginPath();
      for (let i = 0; i < points.length; i++) { const [t, m] = points[i]; if (i) ctx.lineTo(X(t), Y(m)); else ctx.moveTo(X(t), Y(m)); }
      ctx.strokeStyle = crashed ? "#FF2D87" : "#FF2D87"; ctx.lineWidth = 3.5; ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(255,45,135,.8)"; ctx.shadowBlur = 14;
      ctx.stroke(); ctx.shadowBlur = 0;

      const prev = points[Math.max(0, points.length - 8)];
      hx = X(last[0]); hy = Y(last[1]);
      angle = Math.atan2(Y(last[1]) - Y(prev[1]), X(last[0]) - X(prev[0]));
    }
    if (crashed && crashAt) {
      ctx.textAlign = "left"; ctx.fillStyle = "#FF2D87"; ctx.font = "800 12px Archivo, sans-serif";
      ctx.fillText("FLEW AWAY @ " + crashAt.toFixed(2) + "×", pad.l + 8, pad.t - 14);
    }
    const pl = planeRef.current;
    if (pl) {
      pl.style.transform = `translate(${hx}px, ${hy}px) rotate(${angle}rad)`;
    }
  }

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ro = new ResizeObserver(() => draw(round.current?.points || [], phase === "crashed", round.current?.crashAt));
    ro.observe(cv);
    draw(round.current?.points || [], phase === "crashed", round.current?.crashAt);
    return () => ro.disconnect();
  }, [phase]);

  const crashed = phase === "crashed";
  const liveValue = Math.round(bet * Math.floor(mult * 100)) / 100;

  return (
    <div className="cr">
      <div className="cr-wrap">
        <div className="cr-logo">
          <h1>Crash</h1>
          <div className="sub">Take off &nbsp;·&nbsp; Ride the curve &nbsp;·&nbsp; Cash out before it flies away</div>
        </div>

        <div className="cr-history" aria-label="Recent crash points">
          {history.length === 0 && <span className="cr-hist-empty">No rounds yet</span>}
          {history.map((h, i) => (
            <span key={i} className={"cr-hist " + (h < 2 ? "low" : h < 10 ? "mid" : "high")}>{h.toFixed(2)}×</span>
          ))}
        </div>

        <div className="cr-stage">
          <div className={"cr-screen" + (crashed ? " crashed" : "") + (flying ? " flying" : "")}>
            <div className="cr-sky" aria-hidden="true">
              <span className="cloud c1" /><span className="cloud c2" /><span className="cloud c3" />
            </div>
            <canvas ref={canvasRef} />
            <div ref={planeRef} className={"cr-plane" + (crashed ? " gone" : "") + (flying ? " fly" : "")} aria-hidden="true">
              <PlaneSprite />
            </div>
            <div className="cr-readout">
              <div className={"cr-mult" + (crashed && !cashed ? " bad" : "") + (cashed ? " good" : "")}>{mult.toFixed(2)}×</div>
              {cashed && <div className="cr-note good">Cashed out @ {cashed.at.toFixed(2)}× · {money(cashed.win)}</div>}
              {crashed && !cashed && <div className="cr-note bad">Flew away — {money(bet)} lost</div>}
              {phase === "idle" && <div className="cr-note">Set your bet and take off</div>}
            </div>
          </div>

          <aside className="cr-panel">
            <div><div className="k">Credit</div><div className="v credit">{money(credit)}</div></div>
            <div className="cr-field">
              <div className="k">Bet</div>
              <div className="cr-stepper">
                <button className="step" disabled={flying || betIndex <= 0} onClick={() => { setBetIndex(betIndex - 1); ui.betTick(false); }} aria-label="Lower bet"><Minus size={16} /></button>
                <span className="v">{money(bet)}</span>
                <button className="step" disabled={flying || betIndex >= BETS.length - 1} onClick={() => { setBetIndex(betIndex + 1); ui.betTick(true); }} aria-label="Raise bet"><Plus size={16} /></button>
              </div>
            </div>
            <div className="cr-field">
              <label className="k" htmlFor="cr-auto"><Timer size={12} /> Auto cash out (×) — blank to disable</label>
              <input id="cr-auto" className="cr-input" inputMode="decimal" value={autoOut} disabled={flying}
                onChange={(e) => setAutoOut(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="e.g. 2.00" />
            </div>
            <div className="cr-stats">
              <div><div className="k">Last win</div><div className="v lime">{money(lastWin)}</div></div>
              <div><div className="k">Live value</div><div className="v gold">{flying && !cashed ? money(liveValue) : "—"}</div></div>
            </div>

            {!flying ? (
              <button className="cr-main" onClick={launch} disabled={credit < bet}><PlaneIcon size={16} /> Take off · {money(bet)}</button>
            ) : (
              <button className="cr-main cash" onClick={cashOut} disabled={!!cashed}>
                <Cash size={16} /> {cashed ? "Cashed Out" : "Cash Out · " + money(liveValue)}
              </button>
            )}
            <button className="ghost icon" onClick={() => { if (!flying) { W.reset(); ui.click(); } }} disabled={flying}><Reset size={14} /> Reset Credit</button>
          </aside>
        </div>

        <details className="cr-rules">
          <summary><Info size={13} /> How it works</summary>
          <div className="body">
            <p>Each round the multiplier starts at <code>1.00×</code> and climbs — doubling roughly every 7.5 seconds — while the plane flies the curve. It can fly away at any moment. <strong>Cash out before it does</strong> to win your bet × the multiplier at that instant. Set an auto cash-out and the game will bank it for you the moment the curve reaches that number.</p>
            <p>The crash point is drawn from <code>0.97 / (1 − u)</code> with <code>u</code> uniform, and 3% of rounds crash instantly at 1.00× — a 97% long-run return.</p>
          </div>
        </details>
        <p className="foot">Play-money demo — no real wagering, no purchases, no payouts.</p>
      </div>
    </div>
  );
}

/* A small airliner, nose pointing right (+x). Rotated by the curve's tangent. */
function PlaneSprite() {
  return (
    <svg viewBox="0 0 120 60" width="84" height="42" aria-hidden="true">
      <defs>
        <linearGradient id="cr-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" /><stop offset="0.55" stopColor="#D9D3EE" /><stop offset="1" stopColor="#8E86B3" />
        </linearGradient>
      </defs>
      {/* exhaust glow */}
      <ellipse className="cr-exhaust" cx="10" cy="34" rx="14" ry="4" fill="#FF2D87" opacity=".55" />
      {/* tail fin */}
      <path d="M14 34 L26 14 h12 L30 34z" fill="#FF2D87" />
      {/* rear wing */}
      <path d="M20 34 l10 -2 l14 5 l-18 3z" fill="#B7AEDD" />
      {/* fuselage */}
      <path d="M8 30 q4 -6 18 -7 h58 q22 0 30 9 q-8 9 -30 9 h-58 q-14 -1 -18 -7z" fill="url(#cr-body)" stroke="#5B5380" strokeWidth="1.2" />
      {/* nose cone */}
      <path d="M100 26 q14 2 16 6 q-2 4 -16 6z" fill="#3B3358" />
      {/* main wing */}
      <path d="M46 36 l30 -1 l16 16 l-26 -3z" fill="#9F96C9" stroke="#5B5380" strokeWidth="1" />
      <path d="M50 26 l28 0 l14 -12 l-24 3z" fill="#C7BFEA" stroke="#5B5380" strokeWidth="1" />
      {/* windows */}
      {[52, 60, 68, 76, 84].map((x) => <circle key={x} cx={x} cy="29" r="1.9" fill="#29E8DE" />)}
      {/* cockpit */}
      <path d="M92 25 q6 1 9 4 q-3 2 -8 3z" fill="#29E8DE" opacity=".85" />
      {/* engine */}
      <rect x="58" y="38" width="16" height="7" rx="3.5" fill="#5B5380" />
      <circle cx="58" cy="41.5" r="3.4" fill="#FFC63B" />
    </svg>
  );
}
