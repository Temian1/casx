import { useEffect, useRef, useState } from "react";
import { wallet, useStore, money } from "../../store/store.js";
import { tone, noise, bell, step, resume, ui } from "../../audio/synth.js";
import { Plus, Minus, Reset, Shuffle, Cash, Play as PlayIcon, Bomb as BombIco, Info } from "../../components/Icons.jsx";
import "./mines.css";

/* Mines — 5×5 grid. Pick a mine count, place a bet, reveal tiles one
   at a time. Every safe tile raises the multiplier; hit a mine and the
   bet is gone. Cash out any time to bank bet × multiplier.
   Multiplier after k safe picks with m mines on N tiles is the inverse
   probability of surviving those k picks, scaled by the RTP. */

const N = 25;
const RTP = 0.97;
const BETS = [0.20, 0.50, 1, 2, 5, 10, 20, 50, 100];

function multiplierFor(mines, picks) {
  if (picks === 0) return 1;
  let p = 1;
  for (let i = 0; i < picks; i++) p *= (N - mines - i) / (N - i);
  return Math.floor((RTP / p) * 100) / 100;
}

function placeMines(count) {
  const idx = Array.from({ length: N }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return new Set(idx.slice(0, count));
}

const W = wallet("mines");

const SFX = {
  gem(n) {
    bell(step(659.25, Math.min(n, 14) * 2), 0.55, 0.14);
    noise({ from: 6000, to: 2500, dur: 0.14, gain: 0.05 });
  },
  boom() {
    tone({ freq: 140, to: 30, dur: 0.7, gain: 0.35, type: "sine" });
    noise({ from: 2200, to: 80, dur: 0.75, gain: 0.3, q: 0.5, type: "lowpass" });
    noise({ from: 900, to: 200, dur: 0.35, gain: 0.18, q: 0.8 });
  },
  start() {
    tone({ freq: 330, to: 660, dur: 0.16, gain: 0.12, type: "triangle" });
    tone({ freq: 495, to: 990, dur: 0.16, gain: 0.08, type: "triangle", delay: 0.08 });
  },
  reveal() { noise({ from: 3000, to: 800, dur: 0.08, gain: 0.05 }); },
};

export default function Mines() {
  const { credit } = useStore();
  const [betIndex, setBetIndex] = useState(2);
  const [mines, setMines] = useState(3);
  const [phase, setPhase] = useState("idle");       // idle | live | won | lost
  const [revealed, setRevealed] = useState(new Set());
  const [bombs, setBombs] = useState(new Set());
  const [hit, setHit] = useState(null);
  const [lastWin, setLastWin] = useState(0);
  const [msg, setMsg] = useState(null);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const bet = BETS[betIndex];
  const picks = revealed.size;
  const mult = multiplierFor(mines, picks);
  const nextMult = multiplierFor(mines, picks + 1);
  const cashValue = Math.round(bet * mult * 100) / 100;
  const live = phase === "live";

  function start() {
    resume();
    if (live || credit < bet) return;
    if (!W.debit(bet, `${mines} mines`)) return;
    setBombs(placeMines(mines));
    setRevealed(new Set());
    setHit(null);
    setMsg(null);
    setLastWin(0);
    setPhase("live");
    SFX.start();
  }

  function reveal(i) {
    if (!live || revealed.has(i)) return;
    resume();
    if (bombs.has(i)) {
      setHit(i);
      setPhase("lost");
      setMsg({ title: "Boom", sub: `lost ${money(bet)}` });
      SFX.boom();
      return;
    }
    const next = new Set(revealed); next.add(i);
    setRevealed(next);
    SFX.gem(next.size);
    if (next.size === N - mines) {
      /* every safe tile found — auto cash out at the top multiplier */
      settle(next.size);
    }
  }

  function settle(count) {
    const m = multiplierFor(mines, count);
    const win = Math.round(bet * m * 100) / 100;
    W.payout(win, `${count} gems · ${m.toFixed(2)}×`);
    setLastWin(win);
    setPhase("won");
    setMsg({ title: `${m.toFixed(2)}×`, sub: "cashed out", amount: win });
    ui.cashIn();
  }

  function cashOut() {
    if (!live || picks === 0) return;
    resume();
    settle(picks);
  }

  function randomPick() {
    if (!live) return;
    const options = [];
    for (let i = 0; i < N; i++) if (!revealed.has(i)) options.push(i);
    if (!options.length) return;
    reveal(options[Math.floor(Math.random() * options.length)]);
  }

  const over = phase === "won" || phase === "lost";

  return (
    <div className="mn">
      <div className="mn-wrap">
        <div className="mn-logo">
          <h1>Mines</h1>
          <div className="sub">5 × 5 &nbsp;·&nbsp; Find the gems &nbsp;·&nbsp; Cash out anytime</div>
        </div>

        <div className="mn-stage">
          <aside className="mn-panel">
            <div className="mn-meter"><div className="k">Credit</div><div className="v credit">{money(credit)}</div></div>

            <div className="mn-field">
              <div className="k">Bet</div>
              <div className="mn-stepper">
                <button className="step" disabled={live || betIndex <= 0} onClick={() => { setBetIndex(betIndex - 1); ui.betTick(false); }} aria-label="Lower bet"><Minus size={16} /></button>
                <span className="v">{money(bet)}</span>
                <button className="step" disabled={live || betIndex >= BETS.length - 1} onClick={() => { setBetIndex(betIndex + 1); ui.betTick(true); }} aria-label="Raise bet"><Plus size={16} /></button>
              </div>
            </div>

            <div className="mn-field">
              <div className="k"><BombIco size={12} /> Mines <span className="mn-count">{mines}</span></div>
              <input type="range" min="1" max="24" value={mines} disabled={live}
                onChange={(e) => { setMines(Number(e.target.value)); }} aria-label="Number of mines" />
              <div className="mn-chips">
                {[1, 3, 5, 10, 24].map((n) => (
                  <button key={n} className={"chip" + (mines === n ? " on" : "")} disabled={live}
                    onClick={() => { setMines(n); ui.click(); }}>{n}</button>
                ))}
              </div>
            </div>

            <div className="mn-stats">
              <div><div className="k">Current</div><div className="v gold">{mult.toFixed(2)}×</div></div>
              <div><div className="k">Next tile</div><div className="v">{picks < N - mines ? nextMult.toFixed(2) + "×" : "—"}</div></div>
              <div><div className="k">Last win</div><div className="v lime">{money(lastWin)}</div></div>
            </div>

            {!live ? (
              <button className="mn-main" onClick={start} disabled={credit < bet}>
                <PlayIcon size={14} /> {over ? "Play Again" : "Start Game"} · {money(bet)}
              </button>
            ) : (
              <>
                <button className="mn-main cash" onClick={cashOut} disabled={picks === 0}>
                  <Cash size={16} /> Cash Out · {money(cashValue)}
                </button>
                <button className="ghost icon" onClick={randomPick}><Shuffle size={14} /> Random Tile</button>
              </>
            )}
            <button className="ghost icon" onClick={() => { if (!live) { W.reset(); ui.click(); } }} disabled={live}><Reset size={14} /> Reset Credit</button>
          </aside>

          <div className="mn-board-wrap">
            <div className={"mn-board" + (over ? " over" : "") + (phase === "lost" ? " lost" : "")} role="grid" aria-label="Mine field">
              {Array.from({ length: N }, (_, i) => {
                const isRevealed = revealed.has(i);
                const isBomb = bombs.has(i);
                const show = isRevealed || (over && isBomb) || (phase === "won");
                const cls = ["tile",
                  isRevealed ? "gem" : "",
                  over && isBomb ? "bomb" : "",
                  hit === i ? "hit" : "",
                  phase === "won" && !isRevealed && !isBomb ? "dim" : "",
                  !live ? "locked" : "",
                ].filter(Boolean).join(" ");
                return (
                  <button key={i} className={cls} onClick={() => reveal(i)} disabled={!live || isRevealed} aria-label={`Tile ${i + 1}`}>
                    {show && isBomb && <BombIcon />}
                    {show && !isBomb && <GemIcon faded={!isRevealed} />}
                  </button>
                );
              })}
              {msg && (
                <div className={"mn-flash " + phase}>
                  <div>
                    <h2>{msg.title}</h2>
                    <p>{msg.sub}</p>
                    {msg.amount != null && <div className="big">{money(msg.amount)}</div>}
                  </div>
                </div>
              )}
            </div>
            <p className="mn-hint">
              {live ? `${N - mines - picks} gems left · hit a mine and the bet is lost` : "Set your bet and mine count, then start. More mines = bigger multipliers."}
            </p>
          </div>
        </div>

        <details className="mn-rules">
          <summary><Info size={13} /> How it works</summary>
          <div className="body">
            <p>25 tiles hide <strong>{mines}</strong> mine{mines > 1 ? "s" : ""}. Each safe tile you reveal multiplies your bet — the multiplier is the true odds of surviving that many picks, paid at <strong>97% RTP</strong>. You can cash out after any safe pick. Reveal every gem and the game cashes out automatically.</p>
            <p>Example with 3 mines: 1 pick pays <code>{multiplierFor(3, 1).toFixed(2)}×</code>, 5 picks <code>{multiplierFor(3, 5).toFixed(2)}×</code>, 10 picks <code>{multiplierFor(3, 10).toFixed(2)}×</code>, all 22 gems <code>{multiplierFor(3, 22).toFixed(2)}×</code>.</p>
          </div>
        </details>
        <p className="foot">Play-money demo — no real wagering, no purchases, no payouts.</p>
      </div>
    </div>
  );
}

function GemIcon({ faded }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" style={faded ? { opacity: 0.3 } : undefined}>
      <defs>
        <linearGradient id="mn-gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B8FF3C" /><stop offset="0.55" stopColor="#29E8DE" /><stop offset="1" stopColor="#1B7C87" />
        </linearGradient>
      </defs>
      <path d="M28 22h44l16 22-38 42L12 44z" fill="url(#mn-gem)" stroke="#0A4E52" strokeWidth="3" strokeLinejoin="round" />
      <path d="M12 44h76M28 22l12 22 10-22 10 22 12-22M40 44l10 42 10-42" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2.2" />
    </svg>
  );
}
function BombIcon() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="46" cy="58" r="28" fill="#1A1A1F" stroke="#3A3A44" strokeWidth="3" />
      <circle cx="36" cy="48" r="7" fill="rgba(255,255,255,.22)" />
      <rect x="52" y="22" width="12" height="14" rx="3" fill="#55555F" transform="rotate(30 58 29)" />
      <path d="M66 24c6-8 12-8 16-2" fill="none" stroke="#FFC63B" strokeWidth="4" strokeLinecap="round" />
      <circle cx="84" cy="20" r="6" fill="#FF2D87" />
      <circle cx="84" cy="20" r="3" fill="#FFF1C4" />
    </svg>
  );
}
