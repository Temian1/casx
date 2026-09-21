import { useEffect, useMemo, useReducer, useRef, useCallback } from "react";
import { wallet, useStore, money } from "../../store/store.js";
import SFX from "./sfx.js";
import { render as renderArt } from "./art.js";
import { makeContext, playRound } from "./engine.js";
import { Spin as SpinIcon, Plus, Minus, Bolt, Stop, Reset, Cart, Info } from "../../components/Icons.jsx";
import "./slots.css";

/* Generic slot presentation. The engine decides the whole round up
   front (a list of steps); this component animates them: reels whirl and
   slam in, wins glow, tumbles drop, features flash, coins lock. All
   mutable state sits in a ref and render() forces a repaint. Stake is
   taken before the round and the total paid at the end, so the ledger
   gets exactly one bet and (at most) one win per round. */

class Cancelled extends Error {}
const STRIP_LEN = 6;

function winTier(x) {
  if (x >= 250) return ["Epic Win", "that's the one"];
  if (x >= 100) return ["Mega Win", "huge"];
  if (x >= 40) return ["Super Win", "keep it rolling"];
  if (x >= 15) return ["Big Win", "nice hit"];
  return null;
}

export default function SlotMachine({ cfg }) {
  const W = useMemo(() => wallet(cfg.id), [cfg.id]);
  const ctx = useMemo(() => makeContext(cfg), [cfg]);
  const S = useRef(null);
  if (!S.current) {
    const grid = [];
    for (let c = 0; c < cfg.cols; c++) { const col = []; for (let r = 0; r < cfg.rows; r++) col.push({ s: ctx.strips[c][Math.floor(Math.random() * ctx.strips[c].length)], v: 0 }); grid.push(col); }
    S.current = {
      betIndex: cfg.bets.indexOf(1) >= 0 ? cfg.bets.indexOf(1) : 0, busy: false, lastWin: 0, auto: 0,
      grid, paintId: 1, whirl: new Set(), skip: false, winCells: new Set(), popCells: new Set(),
      flash: null, winbar: null, badge: null, corner: null, expanded: new Set(), sticky: new Set(),
      locked: null, special: null, coinCells: null,
    };
  }
  const alive = useRef(true);
  const timers = useRef(new Set());
  const [, force] = useReducer((x) => x + 1, 0);
  const { credit } = useStore();

  const later = useCallback((fn, ms) => { const id = setTimeout(() => { timers.current.delete(id); if (alive.current) fn(); }, ms); timers.current.add(id); }, []);
  const sleep = useCallback((ms) => new Promise((res, rej) => {
    const id = setTimeout(() => { timers.current.delete(id); if (alive.current) res(); else rej(new Cancelled()); }, ms);
    timers.current.add(id);
  }), []);
  useEffect(() => {
    alive.current = true;
    const t = timers.current;
    return () => { alive.current = false; t.forEach(clearTimeout); t.clear(); SFX.music.stop(); };
  }, []);

  const s = () => S.current;
  const bet = () => cfg.bets[s().betIndex];
  const render = () => { if (alive.current) force(); };
  const key = (c, r) => c + ":" + r;
  const flash = (title, sub, amount) => { s().flash = { title, sub, amount }; render(); };
  const hideFlash = () => { s().flash = null; render(); };
  const winbar = (amount, label) => { s().winbar = (label ? label + "  " : "") + money(amount); render(); };

  async function waitSkippable(ms) {
    const st = s(); let left = ms;
    while (left > 0 && !st.skip) { const d = Math.min(40, left); await sleep(d); left -= d; }
  }

  /* apply a grid from the engine: cells landing get born = paintId (drop animation) */
  function applyGrid(grid, { onlyFresh = false } = {}) {
    const st = s();
    st.paintId++;
    st.winCells = new Set(); st.popCells = new Set();
    st.grid = grid.map((col, c) => col.map((cell, r) => {
      const prev = st.grid[c]?.[r];
      const keep = onlyFresh && !cell.fresh && prev;
      return keep ? prev : { ...cell, born: st.paintId, strip: Array.from({ length: STRIP_LEN }, () => ctx.strips[c][Math.floor(Math.random() * ctx.strips[c].length)]) };
    }));
    render();
  }

  /* whirl the given cells then slam columns in left to right */
  async function spinCells(grid, cells) {
    const st = s();
    st.skip = false;
    st.whirl = new Set(cells);
    st.winCells = new Set(); st.popCells = new Set(); st.expanded = new Set();
    render();
    SFX.spinStart();
    for (let i = 0; i < 4; i++) later(() => SFX.reelLoop(i), i * 140);
    await waitSkippable(640);
    st.paintId++;
    st.grid = grid.map((col, c) => col.map((cell, r) => (st.whirl.has(key(c, r)) ? { ...cell, born: st.paintId } : { ...st.grid[c][r], ...cell, born: st.grid[c][r]?.born })));
    for (let c = 0; c < cfg.cols; c++) {
      let any = false;
      for (let r = 0; r < cfg.rows; r++) if (st.whirl.delete(key(c, r))) any = true;
      if (!any) continue;
      render();
      SFX.reelStop(c);
      await waitSkippable(st.skip ? 30 : 120);
    }
    await sleep(200);
  }

  async function countUp(amount) {
    const tier = winTier(amount / bet());
    if (!tier) { winbar(amount); return; }
    flash(tier[0], tier[1], 0);
    SFX.bigWinStart();
    for (let i = 1; i <= 26; i++) { s().flash = { ...s().flash, amount: amount * (i / 26) }; render(); SFX.countTick(i, 26); await sleep(34); }
    SFX.cashIn();
    await sleep(760);
    hideFlash();
    winbar(amount);
  }

  /* ---------- play a full round ---------- */
  async function runRound({ buy = false } = {}) {
    const st = s();
    const b = bet();
    const cost = buy ? b * cfg.freeSpins.buy : b;
    if (!W.debit(cost, buy ? "buy feature" : "spin")) { st.auto = 0; render(); return; }
    st.busy = true; st.lastWin = 0; st.winbar = null; st.flash = null; st.corner = null; st.badge = null;
    st.locked = null; st.special = null; st.sticky = new Set(); st.expanded = new Set();
    render();

    const force = new URLSearchParams(window.location.search).get("force") || undefined; /* test hook */
    const round = playRound(cfg, ctx, b, Math.random, { buy, force });
    let inFree = false;
    for (let i = 0; i < round.steps.length; i++) {
      const step = round.steps[i];
      const next = round.steps[i + 1];
      switch (step.t) {
        case "spin": {
          if (step.free) inFree = true;
          if (step.free) st.badge = `Free spin ${step.free.played} · ${step.free.left} left · ${money(step.free.total)}` + (step.free.mult > 1 ? ` · ×${step.free.mult}` : "");
          st.winbar = null; st.corner = null;
          const all = [];
          for (let c = 0; c < cfg.cols; c++) for (let r = 0; r < cfg.rows; r++) if (!st.sticky.has(key(c, r))) all.push(key(c, r));
          await spinCells(step.grid, all);
          if (step.scatters >= 3) { for (let n = 1; n <= Math.min(step.scatters, 6); n++) later(() => SFX.scatterHit(n), n * 140); await sleep(360); }
          break;
        }
        case "wins": {
          st.winCells = new Set(step.wins.flatMap((w) => w.cells.map(([c, r]) => key(c, r))));
          SFX.winHit(step.chain);
          winbar(step.running, step.chain > 1 ? "Tumble ×" + step.chain : "");
          await sleep(cfg.tumble ? 460 : 700);
          if (next?.t === "tumble") {
            st.popCells = st.winCells; st.winCells = new Set(); render();
            SFX.pop(st.popCells.size);
            await sleep(210);
          }
          break;
        }
        case "tumble": {
          applyGrid(step.grid, { onlyFresh: true });
          SFX.tumbleLand();
          if (step.grid.some((col) => col.some((c) => c.fresh && c.s === "bomb"))) SFX.orbLand(10);
          await sleep(330);
          break;
        }
        case "bombs": st.corner = `×${step.total}`; SFX.multRiser(step.total, 0.5); await sleep(520); winbar(step.amount, `×${step.total}`); await sleep(400); break;
        case "mult": winbar(step.amount, `×${step.mult}`); SFX.multRiser(step.mult, 0.35); await sleep(600); break;
        case "progress": st.corner = `×${step.mult} next`; render(); break;
        case "expand": {
          st.expanded = new Set(step.reels);
          render(); SFX.fanfare(false);
          await sleep(500);
          winbar(step.running, `${step.reels.length} reels`);
          await sleep(700);
          break;
        }
        case "sticky": st.sticky.add(key(...step.cell)); render(); SFX.orbLand(4); break;
        case "special": st.special = step.symbol; flash("Special symbol", "expands across reels in the feature"); await sleep(1400); hideFlash(); break;
        case "feature": {
          SFX.fanfare(true);
          flash(cfg.freeSpins.title || "Free Spins", step.reason === "bought" ? `${step.spins} spins purchased` : `${step.spins} free spins · ${step.reason}`);
          await sleep(1500); hideFlash(); SFX.music.start(); inFree = true;
          break;
        }
        case "retrigger": SFX.retrigger(); flash(`+${step.spins} Free Spins`, "retriggered"); await sleep(1100); hideFlash(); break;
        case "featureEnd": {
          SFX.music.stop(); SFX.cashIn();
          flash("Feature Complete", `${step.spins} free spins paid`, step.amount);
          await sleep(1800); hideFlash(); st.badge = null; st.special = null; st.sticky = new Set(); st.corner = null; render();
          break;
        }
        case "hold": {
          SFX.fanfare(true);
          flash(cfg.holdWin.title || "Hold & Win", `${step.count} coins locked · ${step.respins} respins`);
          st.locked = step.grid; st.holdRespins = step.respins;
          await sleep(1400); hideFlash();
          break;
        }
        case "holdSpin": {
          const free = [];
          for (let c = 0; c < cfg.cols; c++) for (let r = 0; r < cfg.rows; r++) if (!st.locked[c][r]) free.push(key(c, r));
          st.holdRespins = step.respins;
          /* spin only the unlocked positions: blanks unless a coin landed */
          const g = st.grid.map((col, c) => col.map((cell, r) => (step.grid[c][r] && !st.locked[c][r] ? { s: ctx.coinId, v: step.grid[c][r].v, fresh: true } : st.locked[c][r] ? cell : { s: "blank", v: 0, fresh: true })));
          await spinCells(g, free);
          st.locked = step.grid;
          if (step.landed.length) { SFX.orbLand(8); st.badge = `Hold & Win · ${step.count} coins · ${step.respins} respins`; }
          else st.badge = `Hold & Win · ${step.count} coins · ${step.respins} respins`;
          render();
          await sleep(450);
          break;
        }
        case "holdEnd": {
          SFX.multRiser(step.count, 0.6);
          await sleep(650);
          flash(step.grand ? "GRAND JACKPOT" : "Hold & Win", `${step.count} coins`, step.amount);
          SFX.cashIn();
          await sleep(1800); hideFlash();
          st.locked = null; st.badge = null;
          break;
        }
        case "spinEnd": break;
        case "end": {
          if (step.win > 0) {
            W.payout(step.win, inFree ? "spin + feature" : "spin");
            st.lastWin = step.win; render();
            if (step.capped) { flash("MAX WIN", `${cfg.maxWin.toLocaleString()}× bet`, step.win); SFX.cashIn(); await sleep(1600); hideFlash(); }
            await countUp(step.win);
          }
          break;
        }
        default: break;
      }
    }

    st.busy = false; render();
    await sleep(160);
    if (st.auto > 0 && W.credit() >= bet()) { st.auto--; render(); await sleep(200); if (!st.busy) await runRound(); }
    else if (st.auto > 0) { st.auto = 0; render(); }
  }

  const guard = (p) => p.catch((e) => { if (!(e instanceof Cancelled)) console.error(e); });
  const onSpin = () => {
    SFX.resume();
    const st = s();
    if (st.busy) { if (st.whirl.size) st.skip = true; return; }
    if (W.credit() < bet()) return;
    guard(runRound());
  };
  const onBuy = () => { SFX.resume(); SFX.click(); if (s().busy) return; guard(runRound({ buy: true })); };
  const onBet = (d) => { const st = s(); const n = st.betIndex + d; if (n < 0 || n >= cfg.bets.length) return; st.betIndex = n; render(); SFX.betTick(d > 0); };
  const onAuto = () => { SFX.resume(); SFX.click(); const st = s(); if (st.auto > 0) { st.auto = 0; render(); return; } st.auto = 25; render(); if (!st.busy) { st.auto--; guard(runRound()); } };
  const onReset = () => { if (s().busy) return; SFX.click(); W.reset(); s().lastWin = 0; s().auto = 0; render(); };

  useEffect(() => {
    const onKey = (e) => { if (e.code === "Space" && !/^(BUTTON|INPUT|SUMMARY|A|SELECT)$/.test(e.target.tagName)) { e.preventDefault(); onSpin(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const st = s();
  const b = bet();
  const whirling = st.whirl.size > 0;
  const buyCost = cfg.freeSpins?.buy ? b * cfg.freeSpins.buy : 0;
  const theme = cfg.theme || {};

  return (
    <div className="sm" style={{ "--g1": theme.g1 || "#FFC63B", "--g2": theme.g2 || "#FF2D87", "--glow": theme.glow || "255,198,59", "--f1": theme.frame?.[0] || "#43206E", "--f2": theme.frame?.[1] || "#2A1049", "--bg1": theme.bg?.[0] || "#160D2B", "--bg2": theme.bg?.[1] || "#0C0719" }}>
      <div className="sm-wrap">
        <div className="sm-logo">
          <h1>{cfg.title}</h1>
          <div className="sub">{cfg.tagline} &nbsp;·&nbsp; Max {cfg.maxWin.toLocaleString()}×</div>
        </div>

        <div className={"sm-stage" + (buyCost ? "" : " nobuy")}>
          {buyCost > 0 && (
            <div className="sm-rail">
              <button className="sm-buy" onClick={onBuy} disabled={st.busy || credit < buyCost}>
                <b><Cart size={12} /> Buy {cfg.freeSpins.title || "Free Spins"}</b>
                <span className="amt">{money(buyCost)}</span>
                <span className="tiny">{cfg.freeSpins.spins} spins · {cfg.freeSpins.buy}× bet</span>
              </button>
              {cfg.sideNote && <div className="sm-note">{cfg.sideNote}</div>}
            </div>
          )}

          <div className="sm-frame">
            <div className="sm-grid" style={{ "--cols": cfg.cols, "--rows": cfg.rows }} aria-label="Slot reels">
              {st.grid.map((col, c) => (
                <div className={"sm-col" + (st.expanded.has(c) ? " expanded" : "")} key={c}>
                  {st.expanded.has(c) && <div className="sm-expand"><Symbol id={st.special} cfg={cfg} /></div>}
                  {col.map((cell, r) => {
                    const k = key(c, r);
                    const lockedCoin = st.locked?.[c]?.[r];
                    const isWhirl = st.whirl.has(k);
                    const cls = ["sm-cell",
                      isWhirl ? "whirl" : "",
                      cell.born === st.paintId && !isWhirl ? "drop" : "",
                      st.winCells.has(k) ? "win" : "",
                      st.popCells.has(k) ? "pop" : "",
                      st.sticky.has(k) ? "sticky" : "",
                      lockedCoin ? "locked" : "",
                      cell.s === ctx.scatterId ? "scat" : "",
                      st.locked && !lockedCoin && !isWhirl ? "dim" : "",
                    ].filter(Boolean).join(" ");
                    return (
                      <div className={cls} key={k + "-" + (cell.born || 0)} style={cell.born === st.paintId && !isWhirl ? { animationDelay: (cfg.rows - 1 - r) * 36 + "ms" } : undefined}>
                        {isWhirl ? (
                          <div className="sm-strip">{[...(cell.strip || []), ...(cell.strip || [])].slice(0, STRIP_LEN * 2).map((id, i) => <div className="sm-sc" key={i}><Symbol id={id} cfg={cfg} /></div>)}</div>
                        ) : lockedCoin ? (
                          <CoinCell v={lockedCoin.v} bet={b} cfg={cfg} />
                        ) : cell.s === "bomb" ? (
                          <div className="sm-bomb">{cell.v}×</div>
                        ) : cell.s === "blank" ? null : cell.s === ctx.coinId ? (
                          <CoinCell v={cell.v} bet={b} cfg={cfg} />
                        ) : (
                          <Symbol id={cell.s} cfg={cfg} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {st.flash && (
              <div className="sm-flash">
                <div>
                  <h2>{st.flash.title}</h2>
                  {st.flash.sub ? <p>{st.flash.sub}</p> : null}
                  {st.flash.amount != null ? <div className="big">{money(st.flash.amount)}</div> : null}
                </div>
              </div>
            )}
            {st.winbar && <div className="sm-winbar">{st.winbar}</div>}
            {st.badge && <div className="sm-badge">{st.badge}</div>}
            {st.corner && <div className="sm-corner">{st.corner}</div>}
            {st.locked && <div className="sm-corner hold">{st.holdRespins} respins</div>}
          </div>
        </div>

        <div className="sm-bar">
          <div className="sm-meters">
            <div className="meter"><div className="k">Credit</div><div className="v credit">{money(credit)}</div></div>
            <div className="meter"><div className="k">Last Win</div><div className="v gold">{money(st.lastWin)}</div></div>
          </div>
          <div className="sm-spinwrap">
            <button className={"sm-spin" + (st.busy ? " busy" : "") + (whirling ? " reels" : "")} aria-label={whirling ? "Stop reels" : "Spin"} onClick={onSpin}
              disabled={(st.busy && !whirling) || (!st.busy && credit < b)}>
              {whirling ? <Stop size={30} /> : <SpinIcon size={34} />}
            </button>
          </div>
          <div className="sm-betbox">
            <button className="step" aria-label="Lower bet" onClick={() => onBet(-1)} disabled={st.busy || st.betIndex <= 0}><Minus size={16} /></button>
            <div className="meter" style={{ textAlign: "center", minWidth: 86 }}><div className="k">Bet</div><div className="v">{money(b)}</div></div>
            <button className="step" aria-label="Raise bet" onClick={() => onBet(1)} disabled={st.busy || st.betIndex >= cfg.bets.length - 1}><Plus size={16} /></button>
          </div>
        </div>

        <div className="sm-utils">
          <button className="ghost icon" aria-pressed={st.auto > 0 ? "true" : "false"} onClick={onAuto}>
            {st.auto > 0 ? <><Stop size={14} /> Stop ({st.auto})</> : <><Bolt size={14} /> Autoplay 25</>}
          </button>
          <button className="ghost icon" onClick={onReset} disabled={st.busy}><Reset size={14} /> Reset Credit</button>
        </div>

        <Paytable cfg={cfg} ctx={ctx} />
        <p className="foot">Play-money demo — no real wagering, no purchases, no payouts.</p>
      </div>
    </div>
  );
}

function Symbol({ id, cfg }) {
  const html = useMemo(() => { const sym = cfg.symbols.find((s) => s.id === id); return sym ? renderArt(sym.art) : ""; }, [id, cfg]);
  return <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />;
}

function CoinCell({ v, bet, cfg }) {
  const jackpot = typeof v === "string";
  return (
    <div className={"sm-coin" + (jackpot ? " jp " + v : "")}>
      <span className="sm-coin-face" />
      <span className="sm-coin-val">{jackpot ? v.toUpperCase() : money(v * bet)}</span>
      {jackpot && <span className="sm-coin-sub">{cfg.holdWin.jackpots[v]}× bet</span>}
    </div>
  );
}

function Paytable({ cfg, ctx }) {
  const bands = cfg.mode === "scatter" ? ["8–9", "10–11", "12+"] : ["×3", "×4", "×5"];
  return (
    <details className="sm-pt">
      <summary><Info size={13} /> Paytable &amp; Rules</summary>
      <div className="body">
        <div className="grid">
          {cfg.symbols.filter((s) => s.pays || s.wild || s.scatter || s.coin).slice().reverse().map((sym) => (
            <div className="row" key={sym.id}>
              <Symbol id={sym.id} cfg={cfg} />
              <div>
                <div className="nm">{sym.name}{sym.wild ? " · Wild" : ""}{sym.scatter ? " · Scatter" : ""}{sym.coin ? " · Coin" : ""}</div>
                <div className="pays">
                  {sym.pays ? sym.pays.map((p, i) => p ? <span key={i}>{bands[i]} <b>{p}×</b>{i < 2 ? " · " : ""}</span> : null) : sym.wild ? "substitutes for every paying symbol" : sym.scatter ? (cfg.freeSpins ? `${cfg.freeSpins.trigger}+ anywhere → ${cfg.freeSpins.spins} free spins` : "scatter") : sym.coin ? `${cfg.holdWin.trigger}+ trigger Hold & Win` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="rules">
          {cfg.rules.map((r, i) => <p key={i}>{r}</p>)}
          <p><strong>Mode.</strong> {cfg.mode === "lines" ? `${cfg.lines.length} fixed paylines, wins pay left to right from reel 1; pays are multiples of the total bet.` : cfg.mode === "ways" ? `${Math.pow(cfg.rows, cfg.cols)} ways — matching symbols on adjacent reels from the left pay, multiplied by the number of ways.` : "Pays anywhere — 8 or more of a symbol anywhere on the grid pays, then tumbles."} A single round is capped at <strong>{cfg.maxWin.toLocaleString()}× bet</strong>. Theoretical return about <strong>{cfg.rtp}%</strong>. Tap spin (or space) mid-spin to slam the reels in.</p>
          {ctx.wildId && <p className="tiny">Wild: {ctx.sym[ctx.wildId].name}.</p>}
        </div>
      </div>
    </details>
  );
}
