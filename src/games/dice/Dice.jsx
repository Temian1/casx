import { useEffect, useRef, useState } from "react";
import { wallet, useStore, money } from "../../store/store.js";
import { tone, noise, bell, step, resume, ui } from "../../audio/synth.js";
import { Plus, Minus, Reset, Dice as DiceIcon, Info } from "../../components/Icons.jsx";
import "../../styles/games.css";
import "./dice.css";

/* Dice — pick a target from 2 to 98 and bet the roll (0.00–99.99) lands
   over or under it. Payout is the true odds scaled by the RTP, so tight
   targets pay huge and safe targets pay a hair over even money. */

const BETS = [0.20, 0.50, 1, 2, 5, 10, 20, 50, 100];
const RTP = 0.96;

function chanceFor(target, over) { return over ? (99.99 - target) / 100 : target / 100; }
function multFor(target, over) { return Math.floor((RTP / chanceFor(target, over)) * 10000) / 10000; }

const W = wallet("dice");

const SFX = {
  tick(i) { tone({ freq: 380 + (i % 4) * 60, dur: 0.03, gain: 0.05, type: "square" }); },
  win(m) { bell(step(659.25, Math.min(Math.log2(m) * 5, 24)), 0.8, 0.15); ui.cashIn(); },
  lose() { ui.lose(); },
  thud() { noise({ from: 900, to: 150, dur: 0.16, gain: 0.14, q: 0.8 }); tone({ freq: 150, to: 60, dur: 0.16, gain: 0.16, type: "sine" }); },
};

export default function Dice() {
  const { credit } = useStore();
  const [betIndex, setBetIndex] = useState(2);
  const [target, setTarget] = useState(50);
  const [over, setOver] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [shown, setShown] = useState(null);     // number being displayed (during roll animation too)
  const [result, setResult] = useState(null);   // { roll, win, amount }
  const [history, setHistory] = useState([]);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);

  const bet = BETS[betIndex];
  const chance = chanceFor(target, over) * 100;
  const mult = multFor(target, over);
  const payout = Math.round(bet * mult * 100) / 100;

  function roll() {
    resume();
    if (rolling || credit < bet) return;
    if (!W.debit(bet, `${over ? "over" : "under"} ${target}`)) return;
    setRolling(true); setResult(null);
    const r = Math.floor(Math.random() * 10000) / 100;
    const win = over ? r > target : r < target;
    let i = 0;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      i++;
      setShown(Math.floor(Math.random() * 10000) / 100);
      SFX.tick(i);
      if (i >= 16) {
        clearInterval(timer.current);
        setShown(r);
        const amount = win ? payout : 0;
        if (win) W.payout(amount, `rolled ${r.toFixed(2)}`);
        setResult({ roll: r, win, amount });
        setHistory((h) => [{ r, win }, ...h].slice(0, 16));
        setRolling(false);
        if (win) SFX.win(mult); else { SFX.thud(); SFX.lose(); }
      }
    }, 45);
  }

  const clampTarget = (v) => Math.min(98, Math.max(2, Math.round(v)));

  return (
    <div className="g dc" style={{ "--g1": "#FFC63B", "--g2": "#FF2D87", "--glow": "255,198,59" }}>
      <div className="g-wrap">
        <div className="g-logo">
          <h1>Dice</h1>
          <div className="sub">Roll over or under &nbsp;·&nbsp; you set the odds</div>
        </div>

        <div className="g-history" aria-label="Recent rolls">
          {history.length === 0 && <span className="g-hint">No rolls yet</span>}
          {history.map((h, i) => <span key={i} className={"g-hist " + (h.win ? "win" : "lose")}>{h.r.toFixed(2)}</span>)}
        </div>

        <div className="g-stage">
          <aside className="g-panel">
            <div><div className="k">Credit</div><div className="v credit">{money(credit)}</div></div>
            <div className="g-field">
              <div className="k">Bet</div>
              <div className="g-stepper">
                <button className="step" disabled={rolling || betIndex <= 0} onClick={() => { setBetIndex(betIndex - 1); ui.betTick(false); }} aria-label="Lower bet"><Minus size={16} /></button>
                <span className="v">{money(bet)}</span>
                <button className="step" disabled={rolling || betIndex >= BETS.length - 1} onClick={() => { setBetIndex(betIndex + 1); ui.betTick(true); }} aria-label="Raise bet"><Plus size={16} /></button>
              </div>
            </div>
            <div className="g-field">
              <div className="k">Direction</div>
              <div className="g-seg">
                <button className={over ? "on" : ""} disabled={rolling} onClick={() => { setOver(true); ui.click(); }}>Roll over</button>
                <button className={!over ? "on" : ""} disabled={rolling} onClick={() => { setOver(false); ui.click(); }}>Roll under</button>
              </div>
            </div>
            <div className="g-field">
              <div className="k">Target <span className="dc-target">{target}</span></div>
              <div className="g-stepper">
                <button className="step" disabled={rolling || target <= 2} onClick={() => setTarget(clampTarget(target - 1))} aria-label="Lower target"><Minus size={16} /></button>
                <input className="g-input dc-num" inputMode="numeric" value={target} disabled={rolling}
                  onChange={(e) => { const v = parseInt(e.target.value.replace(/\D/g, ""), 10); if (!isNaN(v)) setTarget(clampTarget(v)); }} aria-label="Target number" />
                <button className="step" disabled={rolling || target >= 98} onClick={() => setTarget(clampTarget(target + 1))} aria-label="Raise target"><Plus size={16} /></button>
              </div>
            </div>
            <div className="g-stats">
              <div><div className="k">Win chance</div><div className="v">{chance.toFixed(2)}%</div></div>
              <div><div className="k">Payout</div><div className="v gold">{mult.toFixed(4)}×</div></div>
              <div><div className="k">Profit</div><div className="v lime">{money(payout - bet)}</div></div>
            </div>
            <button className="g-main" onClick={roll} disabled={rolling || credit < bet}><DiceIcon size={16} /> Roll · {money(bet)}</button>
            <button className="ghost icon" onClick={() => { if (!rolling) { W.reset(); ui.click(); } }} disabled={rolling}><Reset size={14} /> Reset Credit</button>
          </aside>

          <div className="g-screen dc-screen">
            <div className={"dc-readout" + (result ? (result.win ? " win" : " lose") : "") + (rolling ? " rolling" : "")}>
              <div className="dc-num-big">{shown == null ? "—" : shown.toFixed(2)}</div>
              <div className="dc-sub">
                {rolling ? "rolling…" : result ? (result.win ? `WIN ${money(result.amount)}` : `LOSE — needed ${over ? "over" : "under"} ${target}`) : `bet the roll lands ${over ? "over" : "under"} ${target}`}
              </div>
            </div>
            <div className="dc-bar" aria-hidden="true">
              <div className="dc-track">
                <div className={"dc-zone " + (over ? "over" : "under")} style={over ? { left: `${target}%`, right: 0 } : { left: 0, width: `${target}%` }} />
                <div className="dc-marker" style={{ left: `${target}%` }}><span>{target}</span></div>
                {shown != null && !rolling && <div className={"dc-pin" + (result?.win ? " win" : " lose")} style={{ left: `${Math.min(99.99, shown)}%` }} />}
              </div>
              <div className="dc-scale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
            </div>
            <div className="dc-quick">
              {[10, 25, 50, 75, 90].map((t) => (
                <button key={t} className="ghost" disabled={rolling} onClick={() => { setTarget(t); ui.click(); }}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        <details className="g-rules">
          <summary><Info size={13} /> How it works</summary>
          <div className="body">
            <p>Each roll produces a number from <code>0.00</code> to <code>99.99</code>. Choose a target and whether the roll must land <strong>over</strong> or <strong>under</strong> it. The payout is <code>{RTP} ÷ win chance</code>, so a 50/50 pays {multFor(50, true).toFixed(2)}× and a 2% shot pays about {multFor(98, true).toFixed(0)}×. The house keeps 4% in the long run.</p>
          </div>
        </details>
        <p className="foot">Play-money demo — no real wagering, no purchases, no payouts.</p>
      </div>
    </div>
  );
}
