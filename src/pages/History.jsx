import { useState } from "react";
import { Link } from "react-router-dom";
import { store, useStore, useLedger, money } from "../store/store.js";
import { GAMES } from "../games/registry.jsx";
import { Back, Wallet, Trophy, X, Reset } from "../components/Icons.jsx";
import { ui } from "../audio/synth.js";
import "./history.css";

/* Play history: every stake and payout recorded by the wallet, per-game
   totals, and overall earnings. Lives only in this browser. */

const titleOf = (id) => GAMES.find((g) => g.id === id)?.title || id;
const fmtTime = (ts) => {
  const d = new Date(ts);
  const today = new Date().toDateString() === d.toDateString();
  return (today ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " ") + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

export default function History() {
  const { credit } = useStore();
  const ledger = useLedger();
  const [filter, setFilter] = useState("all");
  const [confirm, setConfirm] = useState(false);
  const totals = store.totals();
  const games = Object.keys(ledger.games).map((id) => ({ id, ...store.gameStats(id) }))
    .sort((a, b) => b.wagered - a.wagered);
  const entries = ledger.entries.filter((e) => filter === "all" || e.game === filter).slice(0, 200);

  return (
    <div className="hs">
      <nav className="play-bar">
        <Link to="/" className="play-back" onClick={() => ui.click()}><Back size={16} /> Lobby</Link>
        <span className="play-name">History</span>
      </nav>
      <div className="hs-wrap">
        <section className="hs-summary">
          <div className="hs-card"><div className="k"><Wallet size={12} /> Credit</div><div className="v credit">{money(credit)}</div></div>
          <div className="hs-card"><div className="k">Wagered</div><div className="v">{money(totals.wagered)}</div></div>
          <div className="hs-card"><div className="k">Won</div><div className="v gold">{money(totals.won)}</div></div>
          <div className="hs-card"><div className="k">Games played</div><div className="v">{totals.rounds.toLocaleString()}</div></div>
          <div className="hs-card"><div className="k">Win / loss</div><div className="v"><span className="up">{totals.wins}W</span> / <span className="down">{totals.losses}L</span></div></div>
          <div className="hs-card"><div className="k"><Trophy size={12} /> Biggest win</div><div className="v gold">{money(totals.biggest)}</div></div>
          <div className={"hs-card net " + (totals.net >= 0 ? "up" : "down")}>
            <div className="k"><Trophy size={12} /> Earnings</div>
            <div className="v">{(totals.net >= 0 ? "+" : "−") + money(Math.abs(totals.net))}</div>
            <div className="hs-sub">{totals.rounds.toLocaleString()} rounds · {totals.wagered > 0 ? (totals.won / totals.wagered * 100).toFixed(1) + "% returned" : "no play yet"}</div>
          </div>
        </section>

        <section>
          <h2>By game</h2>
          {games.length === 0 ? <p className="g-hint">Play something and it shows up here.</p> : (
            <div className="hs-table">
              <div className="hs-row head"><span>Game</span><span>Rounds</span><span>W / L</span><span>Wagered</span><span>Won</span><span>Biggest</span><span>Net</span></div>
              {games.map((g) => (
                <div className="hs-row" key={g.id}>
                  <span className="hs-game"><Link to={"/play/" + g.id}>{titleOf(g.id)}</Link></span>
                  <span>{g.rounds}</span>
                  <span><span className="up">{g.wins}</span> / <span className="down">{g.losses}</span></span>
                  <span>{money(g.wagered)}</span>
                  <span>{money(g.won)}</span>
                  <span className="gold">{money(g.biggest)}</span>
                  <span className={g.net >= 0 ? "up" : "down"}>{(g.net >= 0 ? "+" : "−") + money(Math.abs(g.net))}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="hs-head">
            <h2>Recent activity</h2>
            <select className="hs-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by game">
              <option value="all">All games</option>
              {games.map((g) => <option key={g.id} value={g.id}>{titleOf(g.id)}</option>)}
            </select>
          </div>
          {entries.length === 0 ? <p className="g-hint">Nothing recorded yet.</p> : (
            <ul className="hs-list">
              {entries.map((e) => (
                <li key={e.id} className={"hs-entry " + e.type}>
                  <span className="hs-time">{fmtTime(e.ts)}</span>
                  <span className="hs-what"><b>{titleOf(e.game)}</b>{e.note ? <i> · {e.note}</i> : null}</span>
                  <span className={"hs-amt " + e.type}>{e.type === "bet" ? "−" : e.type === "win" ? "+" : ""}{money(e.amount)}</span>
                  <span className="hs-bal">{money(e.balance)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="hs-actions">
          {!confirm ? (
            <button className="ghost icon" onClick={() => { setConfirm(true); ui.click(); }}><Reset size={14} /> Clear history</button>
          ) : (
            <div className="hs-confirm">
              <span>Delete all play history? Credit is kept.</span>
              <button className="ghost icon" onClick={() => { setConfirm(false); ui.click(); }}><X size={14} /> Keep</button>
              <button className="ghost icon danger" onClick={() => { store.clearHistory(); setConfirm(false); ui.toggle(false); }}><Reset size={14} /> Delete</button>
            </div>
          )}
          <p className="foot">History is stored in this browser only. Play-money — no real wagering, no payouts.</p>
        </section>
      </div>
    </div>
  );
}
