import { useEffect, useRef, useState } from "react";
import { store, useStore, money } from "../../store/store.js";
import { tone, noise, bell, step, resume, ui } from "../../audio/synth.js";
import { Plus, Minus, Reset, Ball, Info } from "../../components/Icons.jsx";
import "../../styles/games.css";
import "./plinko.css";

/* Plinko — drop a ball through a triangle of pegs. Each row bounces it
   left or right with equal odds; the bucket it lands in (a binomial
   outcome) pays the multiplier shown. Several balls can be in flight. */

const BETS = [0.20, 0.50, 1, 2, 5, 10, 20, 50, 100];
const RTP = 0.97;
const ROWS = [8, 12, 16];
const RISKS = ["low", "medium", "high"];
/* Classic bucket tables (≈99% base), scaled by RTP at pay time */
const TABLE = {
  8:  { low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6], medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13], high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29] },
  12: { low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10], medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33], high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170] },
  16: { low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16], medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110], high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000] },
};
const mults = (rows, risk) => TABLE[rows][risk].map((m) => Math.round(m * RTP * 100) / 100);
const ROW_MS = 150;

const SFX = {
  drop() { tone({ freq: 700, to: 300, dur: 0.1, gain: 0.08, type: "triangle" }); },
  peg(row) { tone({ freq: 900 + row * 40 + Math.random() * 80, dur: 0.04, gain: 0.05, type: "square" }); noise({ from: 4000, to: 1500, dur: 0.03, gain: 0.03 }); },
  land(m) {
    if (m >= 1) { bell(step(523.25, Math.min(Math.log2(m + 1) * 5, 24)), 0.7, 0.14); if (m >= 5) ui.cashIn(); }
    else { tone({ freq: 220, to: 90, dur: 0.25, gain: 0.14, type: "sine" }); noise({ from: 800, to: 200, dur: 0.2, gain: 0.08 }); }
  },
};

export default function Plinko() {
  const { credit } = useStore();
  const [betIndex, setBetIndex] = useState(2);
  const [rows, setRows] = useState(12);
  const [risk, setRisk] = useState("medium");
  const [history, setHistory] = useState([]);
  const [lastWin, setLastWin] = useState(0);
  const [inFlight, setInFlight] = useState(0);
  const [hitBucket, setHitBucket] = useState(null);

  const canvasRef = useRef(null);
  const bucketsRef = useRef(null);
  const balls = useRef([]);       // { path:[0|1], t0, bet, rows, risk, lastRow }
  const raf = useRef(0);
  const geomRef = useRef(null);
  const cfg = useRef({ rows, risk });
  cfg.current = { rows, risk };

  const bet = BETS[betIndex];
  const table = mults(rows, risk);

  /* geometry for the current board, recomputed on resize */
  function geometry(W, H, R) {
    const sp = Math.min((W - 40) / (R + 2), (H - 70) / (R + 1));
    return { sp, cx: W / 2, top: 34, r: Math.max(3, sp * 0.16), ball: Math.max(5, sp * 0.24),
      peg: (row, i) => [W / 2 + (i - (row + 2) / 2) * sp, 34 + row * sp] };
  }

  function drop() {
    resume();
    if (credit < bet || balls.current.length >= 12) return;
    store.addCredit(-bet);
    const R = cfg.current.rows;
    const path = Array.from({ length: R }, () => (Math.random() < 0.5 ? 0 : 1));
    balls.current.push({ path, t0: performance.now(), bet, rows: R, risk: cfg.current.risk, lastRow: -1 });
    setInFlight(balls.current.length);
    SFX.drop();
    if (!raf.current) raf.current = requestAnimationFrame(frame);
  }

  /* position of a ball at time t along its path: hops from peg to peg with a small arc */
  function ballPos(b, g, now) {
    const R = b.rows;
    const t = (now - b.t0) / ROW_MS;           // rows travelled
    const rowF = Math.min(t, R);
    const row = Math.floor(rowF), f = rowF - row;
    const kAt = (r) => b.path.slice(0, r).reduce((a, d) => a + d, 0);
    const xAt = (r) => g.cx + (kAt(r) - r / 2) * g.sp;   // x above row r (between pegs)
    const yAt = (r) => g.top + r * g.sp - g.sp * 0.55;
    if (row >= R) return { x: xAt(R), y: g.top + R * g.sp - g.sp * 0.1, done: true, row: R };
    const x0 = xAt(row), x1 = xAt(row + 1), y0 = yAt(row), y1 = yAt(row + 1);
    const ease = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
    return { x: x0 + (x1 - x0) * ease, y: y0 + (y1 - y0) * f - Math.sin(f * Math.PI) * g.sp * 0.25, done: false, row };
  }

  function frame(now) {
    const cv = canvasRef.current;
    if (!cv) { raf.current = 0; return; }
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const R = cfg.current.rows;
    const g = geometry(W, H, R);
    geomRef.current = g;
    const bk = bucketsRef.current;
    if (bk) {
      const w = (R + 1) * g.sp;
      bk.style.width = w + "px"; bk.style.left = (g.cx - w / 2) + "px"; bk.style.top = (g.top + R * g.sp + g.sp * 0.15) + "px";
      bk.style.height = Math.max(22, Math.min(34, g.sp * 0.9)) + "px";
    }

    /* pegs */
    for (let row = 0; row < R; row++) for (let i = 0; i < row + 3; i++) {
      const [x, y] = g.peg(row, i);
      ctx.beginPath(); ctx.arc(x, y, g.r, 0, Math.PI * 2);
      ctx.fillStyle = "#EFE7FF"; ctx.shadowColor = "rgba(239,231,255,.6)"; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0;
    }

    /* balls */
    const alive = [];
    for (const b of balls.current) {
      if (b.rows !== R) { settle(b); continue; }   // board changed mid-flight: settle instantly
      const p = ballPos(b, g, now);
      if (p.row !== b.lastRow && p.row < R) { b.lastRow = p.row; if (p.row > 0) SFX.peg(p.row); }
      ctx.beginPath(); ctx.arc(p.x, p.y, g.ball, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(p.x - g.ball * 0.4, p.y - g.ball * 0.4, 1, p.x, p.y, g.ball);
      grad.addColorStop(0, "#FFF1C4"); grad.addColorStop(0.5, "#FFC63B"); grad.addColorStop(1, "#B36A00");
      ctx.fillStyle = grad; ctx.shadowColor = "rgba(255,198,59,.8)"; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
      if (p.done) settle(b); else alive.push(b);
    }
    balls.current = alive;
    setInFlight(alive.length);
    raf.current = alive.length ? requestAnimationFrame(frame) : 0;
  }

  function settle(b) {
    const k = b.path.reduce((a, d) => a + d, 0);
    const m = mults(b.rows, b.risk)[k];
    const win = Math.round(b.bet * m * 100) / 100;
    if (win > 0) store.addCredit(win);
    setLastWin(win);
    setHitBucket({ k, rows: b.rows, at: performance.now() });
    setHistory((h) => [m, ...h].slice(0, 16));
    SFX.land(m);
  }

  useEffect(() => {
    const cv = canvasRef.current;
    const ro = new ResizeObserver(() => { if (!raf.current) raf.current = requestAnimationFrame(frame); });
    ro.observe(cv);
    if (!raf.current) raf.current = requestAnimationFrame(frame);
    return () => { ro.disconnect(); cancelAnimationFrame(raf.current); raf.current = 0; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  useEffect(() => { if (!raf.current) raf.current = requestAnimationFrame(frame); }); // repaint after any state change

  const bucketClass = (m) => (m >= 10 ? "hot" : m >= 2 ? "warm" : m >= 1 ? "even" : "cold");

  return (
    <div className="g pk" style={{ "--g1": "#FFC63B", "--g2": "#29E8DE", "--glow": "255,198,59" }}>
      <div className="g-wrap">
        <div className="g-logo">
          <h1>Plinko</h1>
          <div className="sub">Drop the ball &nbsp;·&nbsp; pick your rows and risk</div>
        </div>

        <div className="g-history" aria-label="Recent results">
          {history.length === 0 && <span className="g-hint">No drops yet</span>}
          {history.map((m, i) => <span key={i} className={"g-hist " + (m >= 10 ? "big" : m >= 1 ? "win" : "lose")}>{m}×</span>)}
        </div>

        <div className="g-stage">
          <aside className="g-panel">
            <div><div className="k">Credit</div><div className="v credit">{money(credit)}</div></div>
            <div className="g-field">
              <div className="k">Bet</div>
              <div className="g-stepper">
                <button className="step" disabled={betIndex <= 0} onClick={() => { setBetIndex(betIndex - 1); ui.betTick(false); }} aria-label="Lower bet"><Minus size={16} /></button>
                <span className="v">{money(bet)}</span>
                <button className="step" disabled={betIndex >= BETS.length - 1} onClick={() => { setBetIndex(betIndex + 1); ui.betTick(true); }} aria-label="Raise bet"><Plus size={16} /></button>
              </div>
            </div>
            <div className="g-field">
              <div className="k">Risk</div>
              <div className="g-seg">
                {RISKS.map((r) => <button key={r} className={risk === r ? "on" : ""} disabled={inFlight > 0} onClick={() => { setRisk(r); ui.click(); }}>{r}</button>)}
              </div>
            </div>
            <div className="g-field">
              <div className="k">Rows</div>
              <div className="g-seg">
                {ROWS.map((r) => <button key={r} className={rows === r ? "on" : ""} disabled={inFlight > 0} onClick={() => { setRows(r); ui.click(); }}>{r}</button>)}
              </div>
            </div>
            <div className="g-stats">
              <div><div className="k">Last win</div><div className="v lime">{money(lastWin)}</div></div>
              <div><div className="k">In flight</div><div className="v">{inFlight}</div></div>
              <div><div className="k">Top pay</div><div className="v gold">{Math.max(...table)}×</div></div>
            </div>
            <button className="g-main" onClick={drop} disabled={credit < bet || inFlight >= 12}><Ball size={16} /> Drop ball · {money(bet)}</button>
            <button className="ghost icon" onClick={() => { if (!inFlight) { store.resetCredit(); ui.click(); } }} disabled={inFlight > 0}><Reset size={14} /> Reset Credit</button>
          </aside>

          <div className="g-screen pk-screen">
            <canvas ref={canvasRef} />
            <div className="pk-buckets" ref={bucketsRef}>
              {table.map((m, i) => {
                const hit = hitBucket && hitBucket.rows === rows && hitBucket.k === i;
                return <div key={hit ? i + "-" + hitBucket.at : i} className={"pk-bucket " + bucketClass(m) + (hit ? " hit" : "")}>{m >= 100 ? Math.round(m) : m >= 10 ? m.toFixed(1) : m}×</div>;
              })}
            </div>
          </div>
        </div>

        <details className="g-rules">
          <summary><Info size={13} /> How it works</summary>
          <div className="body">
            <p>The ball hits one peg per row and bounces left or right with equal odds, so the middle buckets are far more likely than the edges. The multiplier table is the classic Plinko payout for each rows/risk combination, scaled to a <strong>97% return</strong>. High risk on 16 rows pays up to <code>{mults(16, "high")[0]}×</code> — with odds of about 1 in 65,000.</p>
            <p>You can drop several balls at once; each one settles independently when it lands.</p>
          </div>
        </details>
        <p className="foot">Play-money demo — no real wagering, no purchases, no payouts.</p>
      </div>
    </div>
  );
}
