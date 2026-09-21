import { useEffect, useRef, useState } from "react";
import { wallet, useStore, money } from "../../store/store.js";
import { tone, noise, bell, step, resume, ui } from "../../audio/synth.js";
import { Plus, Minus, Reset, Cards, Hand, Double, Check, Info } from "../../components/Icons.jsx";
import "../../styles/games.css";
import "./blackjack.css";

/* Blackjack — six-deck shoe, dealer stands on soft 17, blackjack pays
   3:2, double on any first two cards. No splits, no insurance, no
   surrender: a tight, house-favouring rule set (≈ 99.4% with perfect
   basic strategy, far less for a casual player). */

const BETS = [0.50, 1, 2, 5, 10, 20, 50, 100];
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const DECKS = 6;

function newShoe() {
  const cards = [];
  for (let d = 0; d < DECKS; d++) for (const s of SUITS) for (const r of RANKS) cards.push({ r, s, id: `${r}${s}${d}` });
  for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  return cards;
}
const cardValue = (c) => (c.r === "A" ? 11 : ["J", "Q", "K"].includes(c.r) ? 10 : Number(c.r));
function handValue(hand) {
  let total = 0, aces = 0;
  for (const c of hand) { total += cardValue(c); if (c.r === "A") aces++; }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return { total, soft: aces > 0 && total <= 21 };
}
const isBlackjack = (h) => h.length === 2 && handValue(h).total === 21;

const W = wallet("blackjack");

const SFX = {
  deal() { noise({ from: 2500, to: 700, dur: 0.07, gain: 0.08 }); tone({ freq: 240, to: 180, dur: 0.05, gain: 0.05, type: "triangle" }); },
  flip() { noise({ from: 3500, to: 1200, dur: 0.09, gain: 0.07 }); },
  chip() { tone({ freq: 1200, to: 900, dur: 0.05, gain: 0.07, type: "square" }); tone({ freq: 1500, dur: 0.04, gain: 0.04, type: "square", delay: 0.05 }); },
  bust() { ui.lose(); },
  win() { ui.cashIn(); },
  bj() { [0, 4, 7, 12].forEach((n, i) => bell(step(659.25, n), 0.9, 0.14, i * 0.08)); },
  push() { tone({ freq: 440, dur: 0.15, gain: 0.1, type: "sine" }); tone({ freq: 440, dur: 0.15, gain: 0.1, type: "sine", delay: 0.18 }); },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Blackjack() {
  const { credit } = useStore();
  const [betIndex, setBetIndex] = useState(2);
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [hole, setHole] = useState(true);          // dealer's second card face down
  const [phase, setPhase] = useState("idle");      // idle | dealing | player | dealer | done
  const [stake, setStake] = useState(0);
  const [outcome, setOutcome] = useState(null);    // { title, sub, amount, kind }
  const [lastWin, setLastWin] = useState(0);
  const [history, setHistory] = useState([]);
  const shoe = useRef(newShoe());
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const bet = BETS[betIndex];
  const pv = handValue(player), dv = handValue(dealer);
  const busy = phase === "dealing" || phase === "dealer";
  const canAct = phase === "player";
  const canDouble = canAct && player.length === 2 && credit >= stake;

  function draw() {
    if (shoe.current.length < 60) shoe.current = newShoe();
    return shoe.current.pop();
  }

  async function deal() {
    resume();
    if (busy || canAct || credit < bet) return;
    if (!W.debit(bet, "hand")) return;
    SFX.chip();
    setStake(bet); setOutcome(null); setLastWin(0);
    setPlayer([]); setDealer([]); setHole(true);
    setPhase("dealing");
    const p = [], d = [];
    const seq = [[p, setPlayer], [d, setDealer], [p, setPlayer], [d, setDealer]];
    for (const [hand, set] of seq) {
      hand.push(draw()); set([...hand]); SFX.deal();
      await sleep(260);
      if (!alive.current) return;
    }
    if (isBlackjack(p) || isBlackjack(d)) {
      setHole(false); SFX.flip();
      await sleep(400);
      if (isBlackjack(p) && isBlackjack(d)) finish(p, d, bet, "push");
      else if (isBlackjack(p)) finish(p, d, bet, "blackjack");
      else finish(p, d, bet, "lose");
      return;
    }
    setPhase("player");
  }

  async function hit() {
    if (!canAct) return;
    resume();
    const p = [...player, draw()];
    setPlayer(p); SFX.deal();
    if (handValue(p).total > 21) { await sleep(350); finish(p, dealer, stake, "bust"); }
    else if (handValue(p).total === 21) { await sleep(300); stand(p, stake); }
  }

  async function double() {
    if (!canDouble) return;
    resume();
    if (!W.debit(stake, "double")) return;
    SFX.chip();
    const total = stake * 2;
    setStake(total);
    const p = [...player, draw()];
    setPlayer(p); SFX.deal();
    await sleep(350);
    if (handValue(p).total > 21) finish(p, dealer, total, "bust");
    else stand(p, total);
  }

  async function stand(pHand = player, wager = stake) {
    if (phase !== "player" && phase !== "dealing") return;
    resume();
    setPhase("dealer");
    setHole(false); SFX.flip();
    await sleep(450);
    let d = [...dealer];
    /* dealer draws to 17, stands on soft 17 */
    while (handValue(d).total < 17) {
      if (!alive.current) return;
      d = [...d, draw()]; setDealer(d); SFX.deal();
      await sleep(520);
    }
    const pt = handValue(pHand).total, dt = handValue(d).total;
    if (dt > 21) finish(pHand, d, wager, "dealer-bust");
    else if (pt > dt) finish(pHand, d, wager, "win");
    else if (pt < dt) finish(pHand, d, wager, "lose");
    else finish(pHand, d, wager, "push");
  }

  function finish(p, d, wager, kind) {
    if (!alive.current) return;
    let amount = 0, title, sub;
    switch (kind) {
      case "blackjack": amount = wager * 2.5; title = "Blackjack!"; sub = "pays 3 to 2"; SFX.bj(); break;
      case "win": amount = wager * 2; title = "You win"; sub = `${handValue(p).total} beats ${handValue(d).total}`; SFX.win(); break;
      case "dealer-bust": amount = wager * 2; title = "Dealer busts"; sub = `dealer drew ${handValue(d).total}`; SFX.win(); break;
      case "push": amount = wager; title = "Push"; sub = "bet returned"; SFX.push(); break;
      case "bust": title = "Bust"; sub = `${handValue(p).total} — over 21`; SFX.bust(); break;
      default: title = "Dealer wins"; sub = isBlackjack(d) ? "dealer blackjack" : `${handValue(d).total} beats ${handValue(p).total}`; SFX.bust();
    }
    if (amount > 0) W.payout(amount, kind);
    const net = amount - wager;
    setLastWin(amount);
    setOutcome({ title, sub, amount: amount > 0 ? amount : null, kind: net > 0 ? "win" : net < 0 ? "lose" : "push" });
    setHistory((h) => [net > 0 ? "W" : net < 0 ? "L" : "P", ...h].slice(0, 20));
    setPhase("done");
  }

  return (
    <div className="g bj" style={{ "--g1": "#B8FF3C", "--g2": "#29E8DE", "--glow": "184,255,60" }}>
      <div className="g-wrap">
        <div className="g-logo">
          <h1>Blackjack</h1>
          <div className="sub">Six decks &nbsp;·&nbsp; dealer stands on 17 &nbsp;·&nbsp; blackjack pays 3:2</div>
        </div>

        <div className="g-history" aria-label="Recent hands">
          {history.length === 0 && <span className="g-hint">No hands yet</span>}
          {history.map((h, i) => <span key={i} className={"g-hist " + (h === "W" ? "win" : h === "L" ? "lose" : "")}>{h}</span>)}
        </div>

        <div className="g-stage right">
          <div className={"g-screen bj-table" + (outcome?.kind === "lose" ? " lost" : "")}>
            <div className="bj-felt">
              <div className="bj-seat dealer">
                <div className="bj-label">Dealer {dealer.length > 0 && !hole ? <b>{dv.total}</b> : dealer.length > 0 ? <b>{cardValue(dealer[0])}</b> : null}</div>
                <div className="bj-hand">
                  {dealer.map((c, i) => <Card key={c.id} card={c} down={i === 1 && hole} />)}
                  {dealer.length === 0 && <CardSlot />}
                </div>
              </div>
              <div className="bj-mid">
                <span className="bj-rule">BLACKJACK PAYS 3 TO 2 · DEALER STANDS ON ALL 17s</span>
                {stake > 0 && <span className="bj-stake"><ChipIcon /> {money(stake)}</span>}
              </div>
              <div className="bj-seat player">
                <div className="bj-hand">
                  {player.map((c) => <Card key={c.id} card={c} />)}
                  {player.length === 0 && <CardSlot />}
                </div>
                <div className="bj-label">You {player.length > 0 && <b>{pv.total}{pv.soft && pv.total !== 21 ? " soft" : ""}</b>}</div>
              </div>
            </div>
            {outcome && (
              <div className={"g-flash bj-flash " + (outcome.kind === "lose" ? "lost" : "")}>
                <div>
                  <h2>{outcome.title}</h2>
                  <p>{outcome.sub}</p>
                  {outcome.amount != null && <div className="big">{money(outcome.amount)}</div>}
                </div>
              </div>
            )}
          </div>

          <aside className="g-panel">
            <div><div className="k">Credit</div><div className="v credit">{money(credit)}</div></div>
            <div className="g-field">
              <div className="k">Bet</div>
              <div className="g-stepper">
                <button className="step" disabled={busy || canAct || betIndex <= 0} onClick={() => { setBetIndex(betIndex - 1); ui.betTick(false); }} aria-label="Lower bet"><Minus size={16} /></button>
                <span className="v">{money(bet)}</span>
                <button className="step" disabled={busy || canAct || betIndex >= BETS.length - 1} onClick={() => { setBetIndex(betIndex + 1); ui.betTick(true); }} aria-label="Raise bet"><Plus size={16} /></button>
              </div>
            </div>
            <div className="g-stats">
              <div><div className="k">Last payout</div><div className="v lime">{money(lastWin)}</div></div>
              <div><div className="k">Shoe</div><div className="v">{shoe.current.length}</div></div>
            </div>

            {canAct ? (
              <>
                <div className="g-row">
                  <button className="g-main" onClick={hit}><Plus size={16} /> Hit</button>
                  <button className="g-main alt" onClick={() => stand()}><Hand size={16} /> Stand</button>
                </div>
                <button className="g-main danger" onClick={double} disabled={!canDouble}><Double size={16} /> Double · {money(stake)}</button>
              </>
            ) : (
              <button className="g-main" onClick={deal} disabled={busy || credit < bet}><Cards size={16} /> {phase === "done" ? "Deal again" : "Deal"} · {money(bet)}</button>
            )}
            <button className="ghost icon" onClick={() => { if (!busy && !canAct) { W.reset(); ui.click(); } }} disabled={busy || canAct}><Reset size={14} /> Reset Credit</button>
          </aside>
        </div>

        <details className="g-rules">
          <summary><Info size={13} /> Rules</summary>
          <div className="body">
            <p>Beat the dealer without going over 21. Cards 2–10 count face value, pictures count 10, aces count 11 or 1. <strong>Hit</strong> to draw, <strong>Stand</strong> to hold, <strong>Double</strong> on your first two cards to double the bet and take exactly one more card.</p>
            <p>The dealer shows one card, draws until reaching 17 and <strong>stands on every 17 including soft 17</strong>. A natural blackjack pays <code>3:2</code>; a dealer blackjack beats everything but a player blackjack (that's a push). Six decks, reshuffled when the shoe runs low. No splits, no insurance, no surrender. <Check size={12} /> Basic strategy gives about 99.4% back; guessing gives much less.</p>
          </div>
        </details>
        <p className="foot">Play-money demo — no real wagering, no purchases, no payouts.</p>
      </div>
    </div>
  );
}

function Card({ card, down }) {
  const red = card.s === "♥" || card.s === "♦";
  return (
    <div className={"bj-card" + (down ? " down" : "") + (red ? " red" : "")} aria-label={down ? "face-down card" : card.r + card.s}>
      {!down && (
        <svg viewBox="0 0 60 84" aria-hidden="true">
          <rect x="1" y="1" width="58" height="82" rx="6" fill="#FBF7FF" stroke="#C9BFE6" strokeWidth="1.5" />
          <text x="6" y="17" fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="14" fill={red ? "#E0245E" : "#1B1436"}>{card.r}</text>
          <text x="6" y="30" fontFamily="Arial, sans-serif" fontSize="13" fill={red ? "#E0245E" : "#1B1436"}>{card.s}</text>
          <text x="30" y="56" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="30" fill={red ? "#E0245E" : "#1B1436"}>{card.s}</text>
          <g transform="rotate(180 30 42)">
            <text x="6" y="17" fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="14" fill={red ? "#E0245E" : "#1B1436"}>{card.r}</text>
            <text x="6" y="30" fontFamily="Arial, sans-serif" fontSize="13" fill={red ? "#E0245E" : "#1B1436"}>{card.s}</text>
          </g>
        </svg>
      )}
      {down && (
        <svg viewBox="0 0 60 84" aria-hidden="true">
          <rect x="1" y="1" width="58" height="82" rx="6" fill="#2A1252" stroke="#6A3FA8" strokeWidth="1.5" />
          <rect x="7" y="7" width="46" height="70" rx="4" fill="none" stroke="#FF2D87" strokeWidth="1.2" strokeDasharray="3 2" />
          <text x="30" y="49" textAnchor="middle" fontFamily="Bungee, Impact, sans-serif" fontSize="16" fill="#FF2D87">CX</text>
        </svg>
      )}
    </div>
  );
}
const CardSlot = () => <div className="bj-card slot" aria-hidden="true" />;
const ChipIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#FF2D87" /><circle cx="12" cy="12" r="6" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="3 3" /></svg>
);
