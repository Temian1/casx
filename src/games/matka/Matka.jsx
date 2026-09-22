import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { wallet, useStore, money } from "../../store/store.js";
import { tone, noise, bell, step, resume, ui } from "../../audio/synth.js";
import { Plus, Minus, Reset, Cards, Check, X, Info, Trophy, Shuffle } from "../../components/Icons.jsx";
import * as M from "./engine.js";
import "../../styles/games.css";
import "./matka.css";

/* Number Matka — a bet slip game. Build a slip of ank / jodi / panna /
   sangam bets, then the draw flips three cards for the open and three for
   the close. The whole slip is staked with one debit and settled with one
   payout, so the ledger records one bet and one win per draw. */

const W = wallet("number-matka");
const STAKES = [1, 2, 5, 10, 25, 50, 100];
const CHART_KEY = "casx.matka.charts.v1";

const SFX = {
  deal() { noise({ from: 2600, to: 700, dur: 0.08, gain: 0.09 }); tone({ freq: 260, to: 190, dur: 0.06, gain: 0.06, type: "triangle" }); },
  roll() { noise({ from: 400, to: 1800, dur: 0.5, gain: 0.07, q: 0.7 }); tone({ freq: 90, to: 200, dur: 0.5, gain: 0.12, type: "sawtooth", filter: 600, filterTo: 1800 }); },
  ank(n) { bell(step(523.25, n), 0.7, 0.14); },
  add() { tone({ freq: 700, to: 950, dur: 0.07, gain: 0.1, type: "square" }); },
  remove() { tone({ freq: 500, to: 300, dur: 0.07, gain: 0.08, type: "square" }); },
  win(mult) { bell(step(659.25, Math.min(Math.log2(mult + 1) * 4, 26)), 0.9, 0.16); ui.cashIn(); },
  lose() { ui.lose(); },
};

/* ---- panel chart (recent results per market), kept in this browser ---- */
function loadCharts() {
  try { return JSON.parse(localStorage.getItem(CHART_KEY)) || {}; } catch { return {}; }
}
function saveChart(marketId, entry) {
  const all = loadCharts();
  all[marketId] = [entry, ...(all[marketId] || [])].slice(0, 24);
  try { localStorage.setItem(CHART_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return all;
}

export default function Matka() {
  const { credit } = useStore();
  const [market, setMarket] = useState(M.MARKETS[0]);
  const [slip, setSlip] = useState([]);
  const [stakeIndex, setStakeIndex] = useState(2);
  const [betType, setBetType] = useState(M.BET_TYPES[0].id);
  const [pick, setPick] = useState({ digit: null, panna: null, openPanna: null, closePanna: null, jodi: null });
  const [phase, setPhase] = useState("betting");   // betting | drawing | result
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState(0);     // 0-6 cards face up
  const [settled, setSettled] = useState(null);
  const [charts, setCharts] = useState(loadCharts);

  const alive = useRef(true);
  const timers = useRef(new Set());
  const seq = useRef(0);
  useEffect(() => {
    alive.current = true;
    const t = timers.current;
    return () => { alive.current = false; t.forEach(clearTimeout); t.clear(); };
  }, []);
  const sleep = useCallback((ms) => new Promise((res) => {
    const id = setTimeout(() => { timers.current.delete(id); if (alive.current) res(); }, ms);
    timers.current.add(id);
  }), []);

  const stake = STAKES[stakeIndex];
  const total = useMemo(() => Math.round(slip.reduce((a, b) => a + b.stake, 0) * 100) / 100, [slip]);
  const betting = phase === "betting";
  const type = M.BET_TYPES.find((t) => t.id === betType);
  const chart = charts[market.id] || [];

  /* ---- is the current pick complete for this bet type? ---- */
  const ready = useMemo(() => {
    switch (type.pick) {
      case "digit": return pick.digit != null;
      case "jodi": return !!pick.jodi;
      case "panna": return !!pick.panna;
      case "ankPanna":
      case "pannaAnk": return pick.digit != null && !!pick.panna;
      case "pannaPanna": return !!pick.openPanna && !!pick.closePanna;
      default: return false;
    }
  }, [type, pick]);

  const currentPick = useMemo(() => {
    switch (type.pick) {
      case "digit": return { digit: pick.digit };
      case "jodi": return { jodi: pick.jodi };
      case "panna": return { panna: pick.panna };
      case "ankPanna":
      case "pannaAnk": return { digit: pick.digit, panna: pick.panna };
      case "pannaPanna": return { openPanna: pick.openPanna, closePanna: pick.closePanna };
      default: return {};
    }
  }, [type, pick]);

  const preview = ready ? M.rateInfo(betType, currentPick) : null;

  function addBet() {
    if (!betting || !ready) return;
    resume();
    if (credit < total + stake) return;
    setSlip((s) => [...s, { id: ++seq.current, type: betType, pick: currentPick, stake }]);
    SFX.add();
    setPick((p) => ({ ...p, jodi: null, panna: null, openPanna: null, closePanna: null, digit: null }));
  }
  const removeBet = (id) => { if (betting) { setSlip((s) => s.filter((b) => b.id !== id)); SFX.remove(); } };
  const clearSlip = () => { if (betting) { setSlip([]); SFX.remove(); } };

  function quickPick() {
    resume(); ui.click();
    const pickOf = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const d = Math.floor(Math.random() * 10);
    const p = pickOf(M.SINGLE_PANNAS);
    switch (type.pick) {
      case "digit": setPick((x) => ({ ...x, digit: d })); break;
      case "jodi": setPick((x) => ({ ...x, jodi: String(Math.floor(Math.random() * 100)).padStart(2, "0") })); break;
      case "panna": setPick((x) => ({ ...x, panna: p })); break;
      case "ankPanna": case "pannaAnk": setPick((x) => ({ ...x, digit: d, panna: p })); break;
      case "pannaPanna": setPick((x) => ({ ...x, openPanna: p, closePanna: pickOf(M.SINGLE_PANNAS) })); break;
      default: break;
    }
  }

  /* ---- run the draw ---- */
  async function playDraw() {
    if (!betting || slip.length === 0) return;
    resume();
    if (!W.debit(total, `${market.name} · ${slip.length} bet${slip.length > 1 ? "s" : ""}`)) return;
    const r = M.drawResult();
    setResult(r); setSettled(null); setRevealed(0); setPhase("drawing");
    SFX.roll();
    await sleep(500);
    for (let i = 1; i <= 3; i++) { if (!alive.current) return; setRevealed(i); SFX.deal(); await sleep(420); }
    SFX.ank(r.open.ank * 2);
    await sleep(700);
    SFX.roll();
    await sleep(400);
    for (let i = 4; i <= 6; i++) { if (!alive.current) return; setRevealed(i); SFX.deal(); await sleep(420); }
    SFX.ank(r.close.ank * 2);
    await sleep(800);
    if (!alive.current) return;

    const s = M.settle(slip, r);
    if (s.payout > 0) { W.payout(s.payout, `${market.name} ${M.formatResult(r)}`); SFX.win(s.payout / s.staked); }
    else SFX.lose();
    setSettled(s);
    setCharts(saveChart(market.id, { ts: Date.now(), ...r }));
    setPhase("result");
  }

  function newDraw() {
    ui.click();
    setPhase("betting"); setResult(null); setSettled(null); setRevealed(0);
  }
  function repeatSlip() {
    ui.click();
    setSlip((s) => s.map((b) => ({ ...b, id: ++seq.current })));
    setPhase("betting"); setResult(null); setSettled(null); setRevealed(0);
  }

  const cards = result ? [...result.open.digits, ...result.close.digits] : [null, null, null, null, null, null];

  return (
    <div className="g mk" style={{ "--g1": market.accent, "--g2": "#FF2D87", "--glow": "255,198,59" }}>
      <div className="g-wrap">
        <div className="g-logo">
          <h1>Number Matka</h1>
          <div className="sub">Ank · Jodi · Panna · Sangam &nbsp;·&nbsp; Max {M.MAX_WIN_X.toLocaleString()}×</div>
        </div>

        <div className="mk-markets" role="tablist" aria-label="Market">
          {M.MARKETS.map((m) => (
            <button key={m.id} role="tab" aria-selected={m.id === market.id} className={"mk-market" + (m.id === market.id ? " on" : "")}
              style={{ "--mk": m.accent }} disabled={!betting}
              onClick={() => { setMarket(m); ui.click(); }}>
              <b>{m.name}</b><span>{m.open} / {m.close}</span>
            </button>
          ))}
        </div>

        <div className="g-stage right">
          {/* ---------------- board ---------------- */}
          <div className={"g-screen mk-board" + (phase === "drawing" ? " drawing" : "") + (settled && settled.net < 0 ? " lost" : "")}>
            <div className="mk-pot" aria-hidden="true"><PotIcon /></div>

            <div className="mk-sides">
              <DrawSide label="Open" time={market.open} digits={cards.slice(0, 3)} shown={Math.min(revealed, 3)}
                panna={revealed >= 3 ? result?.open.panna : null} ank={revealed >= 3 ? result?.open.ank : null} />
              <div className="mk-jodi">
                <div className="k">Jodi</div>
                <div className="mk-jodi-val">{revealed >= 6 ? result.jodi : revealed >= 3 ? `${result.open.ank}·` : "··"}</div>
              </div>
              <DrawSide label="Close" time={market.close} digits={cards.slice(3, 6)} shown={Math.max(0, revealed - 3)}
                panna={revealed >= 6 ? result?.close.panna : null} ank={revealed >= 6 ? result?.close.ank : null} />
            </div>

            {revealed >= 6 && result && (
              <div className="mk-result-line">{M.formatResult(result)}</div>
            )}
            {phase === "betting" && slip.length === 0 && (
              <p className="g-hint mk-idle">Build a slip on the right, then run the draw. Three cards make the open, three the close.</p>
            )}

            {settled && (
              <div className={"g-flash mk-flash " + (settled.net >= 0 ? "" : "lost")}>
                <div>
                  <h2>{settled.payout > 0 ? (settled.net > 0 ? "You win" : "Part return") : "No hit"}</h2>
                  <p>{M.formatResult(result)}</p>
                  {settled.payout > 0 && <div className="big">{money(settled.payout)}</div>}
                  <div className="mk-net">{settled.net >= 0 ? "+" : "−"}{money(Math.abs(settled.net))} on {money(settled.staked)}</div>
                  <div className="mk-flash-actions">
                    <button className="g-main alt" onClick={repeatSlip}><Reset size={14} /> Repeat slip</button>
                    <button className="ghost icon" onClick={newDraw}><Check size={14} /> New slip</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ---------------- bet slip ---------------- */}
          <aside className="g-panel mk-panel">
            <div><div className="k">Credit</div><div className="v credit">{money(credit)}</div></div>

            <div className="g-field">
              <div className="k">Bet type</div>
              <select className="g-input mk-select" value={betType} disabled={!betting}
                onChange={(e) => { setBetType(e.target.value); setPick({ digit: null, panna: null, openPanna: null, closePanna: null, jodi: null }); ui.click(); }}>
                {M.BET_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name} — {rateLabel(t.id)}</option>)}
              </select>
              <p className="mk-desc">{type.desc}</p>
            </div>

            <div className="mk-picker">
              {(type.pick === "digit" || type.pick === "ankPanna" || type.pick === "pannaAnk") && (
                <DigitPicker value={pick.digit} disabled={!betting} onPick={(d) => { setPick((p) => ({ ...p, digit: d })); ui.betTick(true); }}
                  label={type.pick === "pannaAnk" ? "Close ank" : type.pick === "ankPanna" ? "Open ank" : "Digit"} />
              )}
              {type.pick === "jodi" && (
                <JodiPicker value={pick.jodi} disabled={!betting} onPick={(j) => { setPick((p) => ({ ...p, jodi: j })); ui.betTick(true); }} />
              )}
              {(type.pick === "panna" || type.pick === "ankPanna" || type.pick === "pannaAnk") && (
                <PannaPicker label={type.pick === "ankPanna" ? "Close panna" : type.pick === "pannaAnk" ? "Open panna" : "Panna"}
                  value={pick.panna} disabled={!betting} onPick={(p) => { setPick((x) => ({ ...x, panna: p })); ui.betTick(true); }} />
              )}
              {type.pick === "pannaPanna" && (
                <>
                  <PannaPicker label="Open panna" value={pick.openPanna} disabled={!betting} onPick={(p) => { setPick((x) => ({ ...x, openPanna: p })); ui.betTick(true); }} />
                  <PannaPicker label="Close panna" value={pick.closePanna} disabled={!betting} onPick={(p) => { setPick((x) => ({ ...x, closePanna: p })); ui.betTick(true); }} />
                </>
              )}
            </div>

            <div className="g-field">
              <div className="k">Stake per bet</div>
              <div className="g-stepper">
                <button className="step" disabled={!betting || stakeIndex <= 0} onClick={() => { setStakeIndex(stakeIndex - 1); ui.betTick(false); }} aria-label="Lower stake"><Minus size={16} /></button>
                <span className="v">{money(stake)}</span>
                <button className="step" disabled={!betting || stakeIndex >= STAKES.length - 1} onClick={() => { setStakeIndex(stakeIndex + 1); ui.betTick(true); }} aria-label="Raise stake"><Plus size={16} /></button>
              </div>
            </div>

            {preview && (
              <div className="mk-preview">
                <span>{M.pickLabel(betType, currentPick)}</span>
                <b>{preview.rate}×</b>
                <i>pays {money(stake * preview.rate)} · {(preview.chance * 100).toFixed(preview.chance < 0.001 ? 4 : 2)}% chance</i>
              </div>
            )}

            <div className="g-row">
              <button className="g-main" onClick={addBet} disabled={!betting || !ready || credit < total + stake}><Plus size={16} /> Add bet</button>
              <button className="ghost icon" onClick={quickPick} disabled={!betting}><Shuffle size={14} /> Random</button>
            </div>

            <div className="mk-slip">
              <div className="mk-slip-head">
                <span className="k"><Cards size={12} /> Slip · {slip.length}</span>
                {slip.length > 0 && betting && <button className="mk-clear" onClick={clearSlip}><X size={12} /> clear</button>}
              </div>
              {slip.length === 0 ? <p className="mk-empty">No bets yet.</p> : (
                <ul className="mk-slip-list">
                  {(settled ? settled.lines : slip).map((b) => (
                    <li key={b.id} className={settled ? (b.won ? "won" : "lost") : ""}>
                      <span className="mk-bt">{M.BET_TYPES.find((t) => t.id === b.type).short}</span>
                      <span className="mk-bp">{M.pickLabel(b.type, b.pick)}</span>
                      <span className="mk-bs">{money(b.stake)}</span>
                      {settled ? (
                        <span className={"mk-bo " + (b.won ? "won" : "lost")}>{b.won ? "+" + money(b.payout) : "—"}</span>
                      ) : (
                        <button className="mk-del" onClick={() => removeBet(b.id)} aria-label="Remove bet"><X size={12} /></button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mk-total"><span>Total stake</span><b>{money(total)}</b></div>
            </div>

            {betting ? (
              <button className="g-main" onClick={playDraw} disabled={slip.length === 0 || credit < total}>
                <Cards size={16} /> Run draw · {money(total)}
              </button>
            ) : phase === "drawing" ? (
              <button className="g-main" disabled><Cards size={16} /> Drawing…</button>
            ) : (
              <button className="g-main alt" onClick={newDraw}><Check size={16} /> New slip</button>
            )}
            <button className="ghost icon" onClick={() => { if (betting) { W.reset(); ui.click(); } }} disabled={!betting}><Reset size={14} /> Reset Credit</button>
          </aside>
        </div>

        {/* ---------------- panel chart ---------------- */}
        <section className="mk-chart">
          <div className="mk-chart-head"><span className="k"><Trophy size={12} /> {market.name} panel chart</span><span className="mk-chart-note">most recent first</span></div>
          {chart.length === 0 ? <p className="g-hint">No draws yet on this market.</p> : (
            <div className="mk-chart-row">
              {chart.map((c, i) => (
                <div className="mk-chart-cell" key={c.ts + "-" + i}>
                  <span className="mk-cp">{c.open.panna}</span>
                  <b className="mk-cj">{c.jodi}</b>
                  <span className="mk-cp">{c.close.panna}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <RateCard />
        <p className="foot">Play-money demo — no real wagering, no purchases, no payouts. Matka gambling is illegal in India; this is a fictional-credit simulation of the format.</p>
      </div>
    </div>
  );
}

function rateLabel(id) {
  if (id === "open-ank" || id === "close-ank") return "9×";
  if (id === "jodi") return "90×";
  if (id === "open-panna" || id === "close-panna") return "140–700×";
  if (id === "full-sangam") return "10,000×";
  return "1,400–7,000×";
}

/* ---------------- board pieces ---------------- */
function DrawSide({ label, time, digits, shown, panna, ank }) {
  return (
    <div className="mk-side">
      <div className="mk-side-head"><span className="k">{label}</span><span className="mk-time">{time}</span></div>
      <div className="mk-cards">
        {digits.map((d, i) => <Card key={i} digit={d} faceUp={i < shown} />)}
      </div>
      <div className="mk-derived">
        <span className="mk-panna">{panna ?? "···"}</span>
        <span className="mk-ank">{ank ?? "·"}</span>
      </div>
    </div>
  );
}

/* A playing card whose face value is the digit (10 shows as 0). */
function Card({ digit, faceUp }) {
  const suits = ["♠", "♥", "♦", "♣"];
  const suit = suits[(digit ?? 0) % 4];
  const red = suit === "♥" || suit === "♦";
  const face = digit === 0 ? "10" : String(digit);
  return (
    <div className={"mk-card" + (faceUp ? " up" : "")}>
      <div className="mk-card-inner">
        <div className="mk-card-back"><svg viewBox="0 0 60 84" aria-hidden="true">
          <rect x="1" y="1" width="58" height="82" rx="6" fill="#2A1252" stroke="#6A3FA8" strokeWidth="1.5" />
          <rect x="7" y="7" width="46" height="70" rx="4" fill="none" stroke="#FFC63B" strokeWidth="1.2" strokeDasharray="3 2" />
          <text x="30" y="49" textAnchor="middle" fontFamily="Bungee, Impact, sans-serif" fontSize="16" fill="#FFC63B">CX</text>
        </svg></div>
        <div className="mk-card-face"><svg viewBox="0 0 60 84" aria-hidden="true">
          <rect x="1" y="1" width="58" height="82" rx="6" fill="#FBF7FF" stroke="#C9BFE6" strokeWidth="1.5" />
          <text x="7" y="18" fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="15" fill={red ? "#E0245E" : "#1B1436"}>{face}</text>
          <text x="30" y="56" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="28" fill={red ? "#E0245E" : "#1B1436"}>{suit}</text>
          <text x="53" y="78" textAnchor="end" fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="15" fill={red ? "#E0245E" : "#1B1436"} transform="rotate(180 46 72)">{face}</text>
        </svg></div>
      </div>
      {faceUp && <span className="mk-card-digit">{digit}</span>}
    </div>
  );
}

const PotIcon = () => (
  <svg viewBox="0 0 120 100" width="86" height="72" aria-hidden="true">
    <defs>
      <linearGradient id="mk-pot" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#C97A3A" /><stop offset="0.5" stopColor="#8A4A1E" /><stop offset="1" stopColor="#4A2410" />
      </linearGradient>
    </defs>
    <ellipse cx="60" cy="22" rx="26" ry="8" fill="#3A1C0C" />
    <path d="M34 22c0 8 -22 14 -22 36 0 24 22 36 48 36s48-12 48-36c0-22-22-28-22-36z" fill="url(#mk-pot)" stroke="#2A1005" strokeWidth="2.5" />
    <ellipse cx="60" cy="22" rx="20" ry="6" fill="#1A0C05" />
    <path d="M22 62c14 8 62 8 76 0" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="3" />
    <path d="M40 40c-6 6-8 14-6 22" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* ---------------- pickers ---------------- */
function DigitPicker({ value, onPick, disabled, label }) {
  return (
    <div className="g-field">
      <div className="k">{label}</div>
      <div className="mk-digits">
        {Array.from({ length: 10 }, (_, d) => (
          <button key={d} className={"mk-digit" + (value === d ? " on" : "")} disabled={disabled} onClick={() => onPick(d)}>{d}</button>
        ))}
      </div>
    </div>
  );
}

function JodiPicker({ value, onPick, disabled }) {
  return (
    <div className="g-field">
      <div className="k">Jodi 00–99</div>
      <div className="mk-jodi-grid">
        {Array.from({ length: 100 }, (_, n) => {
          const j = String(n).padStart(2, "0");
          return <button key={j} className={"mk-jc" + (value === j ? " on" : "")} disabled={disabled} onClick={() => onPick(j)}>{j}</button>;
        })}
      </div>
    </div>
  );
}

const PANNA_TABS = [
  { id: "single", label: "Single", list: M.SINGLE_PANNAS, rate: M.RATES.panna.single },
  { id: "double", label: "Double", list: M.DOUBLE_PANNAS, rate: M.RATES.panna.double },
  { id: "triple", label: "Triple", list: M.TRIPLE_PANNAS, rate: M.RATES.panna.triple },
];
function PannaPicker({ label, value, onPick, disabled }) {
  const [tab, setTab] = useState("single");
  const [q, setQ] = useState("");
  const active = PANNA_TABS.find((t) => t.id === tab);
  const list = q ? active.list.filter((p) => p.includes(q)) : active.list;
  return (
    <div className="g-field">
      <div className="k">{label} {value && <span className="mk-chosen">{value}</span>}</div>
      <div className="g-seg mk-seg">
        {PANNA_TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "on" : ""} disabled={disabled} onClick={() => { setTab(t.id); ui.click(); }}>{t.label} {t.rate}×</button>
        ))}
      </div>
      <input className="g-input mk-search" inputMode="numeric" placeholder="filter, e.g. 12" value={q} disabled={disabled}
        onChange={(e) => setQ(e.target.value.replace(/\D/g, ""))} aria-label={"Filter " + label} />
      <div className="mk-panna-grid">
        {list.map((p) => <button key={p} className={"mk-pc" + (value === p ? " on" : "")} disabled={disabled} onClick={() => onPick(p)}>{p}</button>)}
        {list.length === 0 && <span className="mk-empty">No panna matches.</span>}
      </div>
    </div>
  );
}

/* ---------------- rules ---------------- */
function RateCard() {
  const rows = [
    ["Ank (open or close)", "any digit 0–9", "9×", "10%", "90%"],
    ["Jodi", "both digits, 00–99", "90×", "1%", "90%"],
    ["Single Panna", "three different digits", "140×", "0.6%", "84%"],
    ["Double Panna", "one digit twice", "280×", "0.3%", "84%"],
    ["Triple Panna", "all three the same", "700×", "0.1%", "70%"],
    ["Half Sangam", "one ank + the other panna", "1,400–7,000×", "0.06%", "84%"],
    ["Full Sangam", "both pannas", "10,000×", "0.0036%", "36%"],
  ];
  return (
    <details className="g-rules mk-rules">
      <summary><Info size={13} /> How Matka works &amp; rate card</summary>
      <div className="body">
        <p><strong>The draw.</strong> Three cards are drawn for the <strong>open</strong>. Written in ascending order they are the open <strong>panna</strong> (0 counts last, so 190 is a valid panna). Their digits are added and the last digit of the total is the open <strong>ank</strong>: 3+6+9 = 18 → ank <code>8</code>. The same happens for the <strong>close</strong>. The two anks side by side are the <strong>jodi</strong>. A result is written <code>369-82-246</code>.</p>
        <p><strong>Why pannas pay so much.</strong> Because the three cards are sorted, only 220 pannas exist: 120 single (0.6% each), 90 double (0.3%) and 10 triple (0.1%). The ank is a digit sum, which lands on each digit exactly 10% of the time, so a jodi is 1%.</p>
        <table className="mk-table">
          <thead><tr><th>Bet</th><th>Pick</th><th>Rate</th><th>Chance</th><th>Return</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td className="gold">{r[2]}</td><td>{r[3]}</td><td className={Number(r[4].replace("%", "")) >= 84 ? "up" : "down"}>{r[4]}</td></tr>)}</tbody>
        </table>
        <p>Rates are the traditional matka card and are paid <em>for one</em> — a winning 9× ank returns nine times the stake, stake included. The card is deliberately uneven: <strong>ank and jodi are the best value at 90%</strong>, pannas return 84% (70% on a triple), and <strong>Full Sangam is the classic long shot</strong> — 10,000× sounds huge but the true odds are 1 in 27,778, so it returns 36%.</p>
        <p><strong>Markets</strong> (Kalyan, Milan Day, Rajdhani Night, Main Bazar) are the named draws real matka runs at different times of day. The maths is identical on every market; each keeps its own panel chart of recent results.</p>
        <p className="mk-warn">Real matka gambling is illegal in India and ruins people. This is a fictional-credit simulation of the format, built to show how the odds actually work.</p>
      </div>
    </details>
  );
}
