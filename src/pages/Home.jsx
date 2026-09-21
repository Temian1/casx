import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GAMES } from "../games/registry.jsx";
import { useStore, money } from "../store/store.js";
import { ui, resume } from "../audio/synth.js";
import { Play as PlayIcon, Wallet, X } from "../components/Icons.jsx";
import "./home.css";

export default function Home() {
  const [pending, setPending] = useState(null);
  const { credit } = useStore();
  const navigate = useNavigate();

  const open = (g) => { resume(); ui.click(); setPending(g); };
  const play = () => { if (!pending) return; ui.toggle(true); navigate("/play/" + pending.id); };

  useEffect(() => {
    if (!pending) return;
    const onKey = (e) => { if (e.key === "Escape") setPending(null); if (e.key === "Enter") play(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return (
    <div className="home">
      <header className="home-hero">
        <div className="home-brand">
          <span className="home-mark">CASX</span>
          <span className="home-sub">Play-money arcade · no sign-up</span>
        </div>
        <div className="home-wallet">
          <span className="k"><Wallet size={12} /> Credit</span>
          <span className="v credit">{money(credit)}</span>
        </div>
      </header>

      <section className="home-intro">
        <h1>Pick a game</h1>
        <p>Every game runs on fictional credits shared across the lobby. No account, no deposits, nothing to install — tap a cover to play.</p>
      </section>

      <section className="home-grid" aria-label="Games">
        {GAMES.map((g) => (
          <button key={g.id} className="cover" style={{ "--accent": g.accent }} onClick={() => open(g)} aria-label={"Play " + g.title}>
            <div className="cover-art"><g.Cover /></div>
            <div className="cover-meta">
              <div className="cover-title">{g.title}</div>
              <div className="cover-tag">{g.tagline}</div>
            </div>
            <span className="cover-play"><PlayIcon size={12} /> Play</span>
          </button>
        ))}
      </section>

      <footer className="foot">Play-money demo — no real wagering, no purchases, no payouts. Credits are fictional and stay in your browser.</footer>

      {pending && (
        <div className="prompt-backdrop" onClick={() => setPending(null)}>
          <div className="prompt" role="dialog" aria-modal="true" aria-labelledby="prompt-title" onClick={(e) => e.stopPropagation()} style={{ "--accent": pending.accent }}>
            <div className="prompt-art"><pending.Cover /></div>
            <div className="prompt-body">
              <div className="prompt-kicker">Ready to play?</div>
              <h2 id="prompt-title">{pending.title}</h2>
              <p>{pending.blurb}</p>
              <div className="prompt-tags">{pending.tags.map((t) => <span key={t}>{t}</span>)}</div>
              <div className="prompt-actions">
                <button className="ghost icon" onClick={() => { ui.click(); setPending(null); }}><X size={14} /> Not now</button>
                <button className="prompt-go" onClick={play} autoFocus><PlayIcon size={14} /> Play {pending.title}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
