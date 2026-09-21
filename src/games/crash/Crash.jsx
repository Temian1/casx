import { useEffect, useRef, useState } from "react";
import { store, useStore, money } from "../../store/store.js";
import { tone, noise, bell, step, resume, ui } from "../../audio/synth.js";
import "./crash.css";

/* Crash — place a bet, launch, and watch the multiplier climb. Cash out
   before it crashes to bank bet × multiplier. Crash point is drawn from
   the classic 0.99/(1-u) distribution: 1% of rounds crash instantly,
   the rest follow a heavy tail. Long-run return is 99%. */

const BETS = [0.20, 0.50, 1, 2, 5, 10, 20, 50, 100];
const GROWTH = Math.log(2) / 7500; // doubles every 7.5s (per ms)

function drawCrashPoint() {
  const u = Math.random();
  if (u < 0.01) return 1.0;
  return Math.max(1, Math.floor((0.99 / (1 - u)) * 100) / 100);
}
const multAt = (ms) => Math.exp(GROWTH * ms);

const SFX = {
  launch() {
    noise({ from: 400, to: 6000, dur: 0.5, gain: 0.1, q: 0.7 });
    tone({ freq: 90, to: 400, dur: 0.45, gain: 0.2, type: "sawtooth", filter: 800, filterTo: 3000 });
  },
  tick(m) {
    tone({ freq: step(330, Math.min(Math.log2(m) * 7, 36)), dur: 0.05, gain: 0.05, type: "square" });
  },
  crash() {
    tone({ freq: 220, to: 25, dur: 0.9, gain: 0.32, type: "sawtooth", filter: 2000, filterTo: 100 });
    noise({ from: 3000, to: 60, dur: 0.9, gain: 0.3, q: 0.5, type: "lowpass" });
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
  const round = useRef(null);   // { start, crashAt, points:[], raf, lastTick, bet, cashed }
  const stateRef = useRef({ phase, autoOut });
  stateRef.current = { phase, autoOut };

  const bet = BETS[betIndex];
  const flying = phase === "flying";

  useEffect(() => () => { if (round.current?.raf) cancelAnimationFrame(round.current.raf); }, []);

  function launch() {
    resume();
    if (flying || credit < bet) return;
    store.addCredit(-bet);
    setLastWin(0);
    setCashed(null);
    setMult(1);
    setPhase("flying");
    round.current = { start: performance.now(), crashAt: drawCrashPoint(), points: [], raf: 0, lastTick: 0, bet, cashed: null };
    SFX.launch();
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
      if (!r.cashed) SFX.crash();
      else tone({ freq: 200, to: 80, dur: 0.3, gain: 0.1, type: "sine" });
      return;
    }
    r.points.push([elapsed, m]);
    setMult(m);
    draw(r.points, false, null);
    if (now - r.lastTick > 180 / Math.max(1, Math.log2(m) + 1)) { r.lastTick = now; SFX.tick(m); }
    r.raf = requestAnimationFrame(frame);
  }

  function doCashOut(atOverride) {
    const r = round.current;
    if (!r || r.cashed) return;
    const at = atOverride ?? multAt(performance.now() - r.start);
    const m = Math.floor(at * 100) / 100;
    const win = Math.round(r.bet * m * 100) / 100;
    r.cashed = { at: m, win };
    store.addCredit(win);
    setLastWin(win);
    setCashed(r.cashed);
    SFX.cash(m);
  }

  function cashOut() {
    if (!flying) return;
    resume();
    doCashOut();
  }

  /* ---------- canvas ---------- */
  function draw(points, crashed, crashAt) {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const pad = { l: 44, r: 16, t: 16, b: 28 };
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
    if (points.length > 1) {
      const grad = ctx.createLinearGradient(0, H, 0, 0);
      grad.addColorStop(0, crashed ? "rgba(255,45,135,.05)" : "rgba(41,232,222,.05)");
      grad.addColorStop(1, crashed ? "rgba(255,45,135,.35)" : "rgba(184,255,60,.35)");
      ctx.beginPath();
      ctx.moveTo(X(points[0][0]), Y(1));
      for (const [t, m] of points) ctx.lineTo(X(t), Y(m));
      ctx.lineTo(X(last[0]), Y(1));
      ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

      ctx.beginPath();
      for (let i = 0; i < points.length; i++) { const [t, m] = points[i]; if (i) ctx.lineTo(X(t), Y(m)); else ctx.moveTo(X(t), Y(m)); }
      ctx.strokeStyle = crashed ? "#FF2D87" : "#B8FF3C"; ctx.lineWidth = 3.5; ctx.lineJoin = "round";
      ctx.shadowColor = crashed ? "rgba(255,45,135,.8)" : "rgba(184,255,60,.8)"; ctx.shadowBlur = 14;
      ctx.stroke(); ctx.shadowBlur = 0;

      /* rocket head */
      ctx.beginPath(); ctx.arc(X(last[0]), Y(last[1]), crashed ? 9 : 6, 0, Math.PI * 2);
      ctx.fillStyle = crashed ? "#FF2D87" : "#FFF"; ctx.fill();
    }
    if (crashed && crashAt) {
      ctx.textAlign = "left"; ctx.fillStyle = "#FF2D87"; ctx.font = "800 12px Archivo, sans-serif";
      ctx.fillText("CRASHED @ " + crashAt.toFixed(2) + "×", pad.l + 8, pad.t + 14);
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
          <div className="sub">Launch &nbsp;·&nbsp; Ride the curve &nbsp;·&nbsp; Cash out before it blows</div>
        </div>

        <div className="cr-history" aria-label="Recent crash points">
          {history.length === 0 && <span className="cr-hist-empty">No rounds yet</span>}
          {history.map((h, i) => (
            <span key={i} className={"cr-hist " + (h < 2 ? "low" : h < 10 ? "mid" : "high")}>{h.toFixed(2)}×</span>
          ))}
        </div>

        <div className="cr-stage">
          <div className={"cr-screen" + (crashed ? " crashed" : "") + (flying ? " flying" : "")}>
            <canvas ref={canvasRef} />
            <div className="cr-readout">
              <div className={"cr-mult" + (crashed && !cashed ? " bad" : "") + (cashed ? " good" : "")}>{mult.toFixed(2)}×</div>
              {cashed && <div className="cr-note good">Cashed out @ {cashed.at.toFixed(2)}× · {money(cashed.win)}</div>}
              {crashed && !cashed && <div className="cr-note bad">Crashed — {money(bet)} lost</div>}
              {phase === "idle" && <div className="cr-note">Set your bet and hit Launch</div>}
            </div>
          </div>

          <aside className="cr-panel">
            <div><div className="k">Credit</div><div className="v credit">{money(credit)}</div></div>
            <div className="cr-field">
              <div className="k">Bet</div>
              <div className="cr-stepper">
                <button className="step" disabled={flying || betIndex <= 0} onClick={() => { setBetIndex(betIndex - 1); ui.betTick(false); }} aria-label="Lower bet">−</button>
                <span className="v">{money(bet)}</span>
                <button className="step" disabled={flying || betIndex >= BETS.length - 1} onClick={() => { setBetIndex(betIndex + 1); ui.betTick(true); }} aria-label="Raise bet">+</button>
              </div>
            </div>
            <div className="cr-field">
              <label className="k" htmlFor="cr-auto">Auto cash out (×) — blank to disable</label>
              <input id="cr-auto" className="cr-input" inputMode="decimal" value={autoOut} disabled={flying}
                onChange={(e) => setAutoOut(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="e.g. 2.00" />
            </div>
            <div className="cr-stats">
              <div><div className="k">Last win</div><div className="v lime">{money(lastWin)}</div></div>
              <div><div className="k">Live value</div><div className="v gold">{flying && !cashed ? money(liveValue) : "—"}</div></div>
            </div>

            {!flying ? (
              <button className="cr-main" onClick={launch} disabled={credit < bet}>Launch · {money(bet)}</button>
            ) : (
              <button className="cr-main cash" onClick={cashOut} disabled={!!cashed}>
                {cashed ? "Cashed Out" : "Cash Out · " + money(liveValue)}
              </button>
            )}
            <button className="ghost" onClick={() => { if (!flying) { store.resetCredit(); ui.click(); } }} disabled={flying}>Reset Credit</button>
          </aside>
        </div>

        <details className="cr-rules">
          <summary>How it works</summary>
          <div className="body">
            <p>Each round the multiplier starts at <code>1.00×</code> and climbs — doubling roughly every 7.5 seconds. It can crash at any moment. <strong>Cash out before the crash</strong> to win your bet × the multiplier at that instant. Set an auto cash-out and the game will bank it for you the moment the curve reaches that number.</p>
            <p>The crash point is drawn from <code>0.99 / (1 − u)</code> with <code>u</code> uniform, and 1% of rounds crash instantly at 1.00× — the same distribution used by the classic crash games, giving a 99% long-run return.</p>
          </div>
        </details>
        <p className="foot">Play-money demo — no real wagering, no purchases, no payouts.</p>
      </div>
    </div>
  );
}
