import { useEffect, useReducer, useRef, useCallback } from "react";
import { wallet, useStore, money } from "../../store/store.js";
import SFX from "./sfx.js";
import { multiplierImage, symbolImage } from "./art.js";
import {
  SYMBOLS, SCATTER, MULT_ID, COLS, ROWS, BETS, MAX_WIN_X, MAX_ORB_X,
  ORB_CHANCE, SUPER_ORB_CHANCE, FS_SPINS, SUPER_FS_SPINS, FS_COST, SUPER_FS_COST,
  buildStrip, newGrid, clearFresh, evaluate, countScatters, sumOrbs, tumble, pickOrb, winTier, pick,
} from "./engine.js";
import { Spin as SpinIcon, Plus, Minus, Bolt, Stop, Reset, Cart, Star, Info } from "../../components/Icons.jsx";
import "./dopamine.css";

/* The spin cycle is an async sequence of grid mutations and pauses. All
   game state lives in a mutable ref (S); every paint()/render() call just
   forces a React re-render from that ref. Timers are tracked so leaving
   the page mid-spin cancels everything cleanly. */

const W = wallet("dopamine-bonanza");
class Cancelled extends Error {}
const STRIP_LEN = 7; /* symbols visible in a spinning reel strip (rendered twice for a seamless loop) */

function initialState() {
  const grid = newGrid(buildStrip(false));
  clearFresh(grid);
  return {
    betIndex: 4, ante: false, grid, busy: false, lastWin: 0,
    free: 0, freeTotal: 0, superMode: false, freeWin: 0, auto: 0,
    /* presentation */
    paintId: 1, spinning: Array(COLS).fill(false), reelSyms: [], skip: false,
    winCells: new Set(), popCells: new Set(), flash: null, winbar: null, totmult: null,
  };
}

export default function DopamineBonanza() {
  const S = useRef(null);
  if (!S.current) S.current = initialState();
  const alive = useRef(true);
  const timers = useRef(new Set());
  const [, force] = useReducer((x) => x + 1, 0);
  const { credit } = useStore();

  const later = useCallback((fn, ms) => {
    const id = setTimeout(() => { timers.current.delete(id); if (alive.current) fn(); }, ms);
    timers.current.add(id);
  }, []);
  const sleep = useCallback((ms) => new Promise((res, rej) => {
    const id = setTimeout(() => { timers.current.delete(id); if (alive.current) res(); else rej(new Cancelled()); }, ms);
    timers.current.add(id);
  }), []);

  useEffect(() => {
    alive.current = true;
    const t = timers.current;
    return () => { alive.current = false; t.forEach(clearTimeout); t.clear(); SFX.music.stop(); };
  }, []);

  /* ---------- helpers bound to the ref ---------- */
  const s = () => S.current;
  const bet = () => BETS[s().betIndex];
  const stake = () => (s().ante ? bet() * 1.25 : bet());
  const render = () => { if (alive.current) force(); };

  function paint() {
    const st = s();
    st.paintId++;
    st.winCells = new Set();
    st.popCells = new Set();
    for (const col of st.grid) for (const cell of col) if (cell.fresh) cell.born = st.paintId;
    render();
  }
  const flash = (title, sub, amount) => { s().flash = { title, sub, amount }; render(); };
  const hideFlash = () => { s().flash = null; render(); };
  const showWinbar = (amount, label) => { s().winbar = (label ? label + "  " : "") + money(amount); render(); };

  async function countUp(amount) {
    const tier = winTier(amount, bet());
    if (!tier) { showWinbar(amount); return; }
    flash(tier[0], tier[1], 0);
    SFX.bigWinStart();
    const steps = 26;
    for (let i = 1; i <= steps; i++) {
      s().flash = { ...s().flash, amount: amount * (i / steps) };
      render();
      SFX.countTick(i, steps);
      await sleep(34);
    }
    SFX.cashIn();
    await sleep(760);
    hideFlash();
    showWinbar(amount);
  }

  /* Wait in small slices so a tap on the spin button can cut the wait short */
  async function waitSkippable(ms) {
    const st = s();
    let left = ms;
    while (left > 0 && !st.skip) { const d = Math.min(40, left); await sleep(d); left -= d; }
  }

  /* ---------- reel spin: all columns whirl, then slam in one at a time ---------- */
  async function spinReels(strip) {
    const st = s();
    st.skip = false;
    st.reelSyms = Array.from({ length: COLS }, () => Array.from({ length: STRIP_LEN }, () => pick(strip)));
    st.spinning = Array(COLS).fill(true);
    st.winCells = new Set(); st.popCells = new Set();
    render();
    SFX.spinStart();
    for (let i = 0; i < 4; i++) { later(() => SFX.reelLoop(i), i * 140); }
    await waitSkippable(720);
    for (let c = 0; c < COLS; c++) {
      st.spinning[c] = false;
      st.paintId++;
      for (const cell of st.grid[c]) cell.born = st.paintId;
      render();
      SFX.reelStop(c);
      await waitSkippable(st.skip ? 40 : 130);
    }
    await sleep(260);
  }

  /* ---------- core spin cycle ---------- */
  async function runSpin(isFree) {
    const st = s();
    st.busy = true;
    st.winbar = null; st.flash = null; st.totmult = null;
    if (!isFree) {
      if (!W.debit(stake(), st.ante ? "spin · double chance" : "spin")) { st.busy = false; render(); return; }
      st.lastWin = 0;
    }
    render();

    const strip = buildStrip(st.ante);
    /* Orbs only exist inside the feature. */
    const orbChance = isFree ? (st.superMode ? SUPER_ORB_CHANCE : ORB_CHANCE) : 0;

    /* final landing grid is decided up front; the reels just reveal it */
    st.grid = newGrid(strip);
    const orbsLanded = [];
    if (orbChance > 0) {
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
        if (Math.random() < orbChance) {
          st.grid[c][r].m = pickOrb(st.superMode); st.grid[c][r].s = MULT_ID;
          orbsLanded.push(st.grid[c][r].m);
        }
      }
    }
    await spinReels(strip);
    clearFresh(st.grid);

    const scatNow = countScatters(st.grid);
    for (let sn = 1; sn <= Math.min(scatNow, 6); sn++) later(() => SFX.scatterHit(sn), sn * 140);
    orbsLanded.forEach((v, oi) => later(() => SFX.orbLand(v), 120 + oi * 110));
    if (scatNow >= 3 || orbsLanded.length) await sleep(360);

    /* tumble loop */
    let spinWin = 0, chain = 0;
    for (;;) {
      const wins = evaluate(st.grid, bet());
      if (wins.length === 0) break;
      chain++;
      spinWin += wins.reduce((a, w) => a + w.amount, 0);

      st.winCells = new Set(wins.flatMap((w) => w.cells.map(([c, r]) => c + ":" + r)));
      SFX.winHit(chain);
      showWinbar(spinWin, chain > 1 ? "Tumble ×" + chain : "");
      await sleep(460);

      const popCount = wins.reduce((a, w) => a + w.cells.length, 0);
      st.popCells = st.winCells; st.winCells = new Set();
      render();
      SFX.pop(popCount);
      await sleep(210);

      const before = sumOrbs(st.grid);
      st.grid = tumble(st.grid, wins, strip, orbChance, st.superMode);
      paint();
      SFX.tumbleLand();
      const after = sumOrbs(st.grid);
      if (after > before) SFX.orbLand(after - before);
      await sleep(330);
      clearFresh(st.grid);
    }

    /* multiplier orbs resolve at the end of the sequence */
    const orbTotal = sumOrbs(st.grid);
    if (isFree && orbTotal > 0 && spinWin > 0) {
      st.totmult = orbTotal + "× TOTAL"; render();
      SFX.multRiser(orbTotal, 0.5);
      await sleep(520);
      spinWin *= orbTotal;
      showWinbar(spinWin, orbTotal + "×");
      await sleep(420);
    } else if (isFree && orbTotal > 0) {
      st.totmult = orbTotal + "× TOTAL"; render();
    }

    /* max win cap */
    if (spinWin > MAX_WIN_X * bet()) {
      spinWin = MAX_WIN_X * bet();
      showWinbar(spinWin, "MAX WIN");
      await sleep(400);
    }

    const scat = countScatters(st.grid);

    if (spinWin > 0) {
      W.payout(spinWin, isFree ? "free spin" : "spin");
      st.lastWin = isFree ? st.lastWin + spinWin : spinWin;
      if (isFree) st.freeWin += spinWin;
      render();
      await countUp(spinWin);
    }

    if (isFree) {
      st.free--;
      render();
      if (scat >= 3) {
        st.free += 5; st.freeTotal += 5;
        SFX.retrigger();
        flash("+5 Free Spins", "retriggered");
        await sleep(1200);
        hideFlash();
      }
    } else if (scat >= 4) {
      await triggerFeature(false, scat);
    }

    st.busy = false;
    render();
    await sleep(160);

    if (st.free > 0) { await runSpin(true); return; }
    if (isFree) {
      SFX.music.stop();
      SFX.cashIn();
      flash("Feature Complete", st.freeTotal + " free spins paid", st.freeWin);
      await sleep(1900);
      hideFlash();
      st.totmult = null;
      render();
    }

    if (st.auto > 0 && W.credit() >= stake()) {
      st.auto--;
      render();
      await sleep(220);
      if (!st.busy) await runSpin(false);
    } else if (st.auto > 0) {
      st.auto = 0; render();
    }
  }

  async function triggerFeature(isSuper, scat) {
    const st = s();
    st.free = isSuper ? SUPER_FS_SPINS : FS_SPINS;
    st.freeTotal = st.free; st.superMode = !!isSuper; st.freeWin = 0;
    SFX.fanfare(!!isSuper);
    flash(isSuper ? "Super Free Spins" : "Free Spins", scat ? scat + " dopamine molecules" : st.free + " spins purchased");
    await sleep(1500);
    hideFlash();
    SFX.music.start();
    render();
  }

  const guard = (p) => p.catch((e) => { if (!(e instanceof Cancelled)) console.error(e); });

  /* ---------- controls ---------- */
  const onSpin = () => {
    SFX.resume();
    const st = s();
    if (st.busy) { if (st.spinning.some(Boolean)) st.skip = true; return; }  /* tap again to slam the reels */
    if (st.free > 0) { guard(runSpin(true)); return; }
    if (W.credit() < stake()) return;
    guard(runSpin(false));
  };
  const onBet = (dir) => {
    const st = s();
    const next = st.betIndex + dir;
    if (next < 0 || next >= BETS.length) return;
    st.betIndex = next; render(); SFX.betTick(dir > 0);
  };
  const onAnte = () => { s().ante = !s().ante; render(); SFX.toggle(s().ante); };
  const onBuy = (isSuper) => {
    SFX.resume(); SFX.click();
    const st = s();
    if (st.busy || st.free > 0) return;
    const cost = bet() * (isSuper ? SUPER_FS_COST : FS_COST);
    if (!W.debit(cost, isSuper ? "buy super free spins" : "buy free spins")) return; st.lastWin = 0; st.busy = true; render();
    guard((async () => { await triggerFeature(isSuper, 0); st.busy = false; await runSpin(true); })());
  };
  const onAuto = () => {
    SFX.resume(); SFX.click();
    const st = s();
    if (st.auto > 0) { st.auto = 0; render(); return; }
    st.auto = 25; render();
    if (!st.busy && st.free === 0) { st.auto--; guard(runSpin(false)); }
  };
  const onReset = () => {
    const st = s();
    if (st.busy) return;
    SFX.click(); SFX.music.stop();
    W.reset();
    st.lastWin = 0; st.auto = 0; st.free = 0; st.winbar = null; st.flash = null; st.totmult = null;
    render();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" && !/^(BUTTON|INPUT|SUMMARY|A)$/.test(e.target.tagName)) { e.preventDefault(); onSpin(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }); // re-bind each render so closures see the live ref

  /* ---------- derived view ---------- */
  const st = s();
  const locked = st.busy || st.free > 0;
  const b = bet();
  const isSpinning = st.spinning.some(Boolean);

  return (
    <div className="db">
      <div className="wrap">
        <div className="logo">
          <h1>Dopamine Bonanza</h1>
          <div className="sub">6 × 5 &nbsp;·&nbsp; Pays Anywhere &nbsp;·&nbsp; Tumble &nbsp;·&nbsp; Max {MAX_WIN_X.toLocaleString()}×</div>
        </div>

        <div className="stage">
          <div className="rail">
            <button className="buy fs" onClick={() => onBuy(false)} disabled={locked || credit < b * FS_COST}>
              <b><Cart size={12} /> Buy Free Spins</b>
              <span className="amt">{money(b * FS_COST)}</span>
              <span className="tiny">{FS_SPINS} spins · {FS_COST}× bet</span>
            </button>
            <button className="buy sfs" onClick={() => onBuy(true)} disabled={locked || credit < b * SUPER_FS_COST}>
              <b><Star size={12} /> Super Free Spins</b>
              <span className="amt">{money(b * SUPER_FS_COST)}</span>
              <span className="tiny">{SUPER_FS_SPINS} spins · richer orbs · {SUPER_FS_COST}× bet</span>
            </button>
            <div className="ante">
              <span className="hd">Double Chance</span>
              <div className="row">
                <span className="cost">{money(b * 1.25)}</span>
                <button className="sw" role="switch" aria-checked={st.ante ? "true" : "false"} aria-label="Double chance to win feature" onClick={onAnte} disabled={locked} />
              </div>
              <span className="tiny">+25% stake, doubles the scatter rate.</span>
            </div>
          </div>

          <div className="frame">
            <Grid st={st} />
            {st.flash && (
              <div className="flash dim">
                <div>
                  <h2>{st.flash.title}</h2>
                  {st.flash.sub ? <p>{st.flash.sub}</p> : null}
                  {st.flash.amount != null ? <div className="big">{money(st.flash.amount)}</div> : null}
                </div>
              </div>
            )}
            {st.winbar && <div className="winbar">{st.winbar}</div>}
            {st.free > 0 && (
              <div className="fsbadge">
                {(st.superMode ? "Super Free Spins" : "Free Spins") + " · " + st.free + " left · " + money(st.freeWin)}
              </div>
            )}
            {st.totmult && <div className="totmult">{st.totmult}</div>}
          </div>
        </div>

        <div className="bar">
          <div className="meters">
            <div className="meter"><div className="k">Credit</div><div className="v credit">{money(credit)}</div></div>
            <div className="meter"><div className="k">Last Win</div><div className="v won">{money(st.lastWin)}</div></div>
          </div>
          <div className="spinwrap">
            <button className={"spin" + (st.busy ? " busy" : "") + (isSpinning ? " reels" : "")} aria-label={isSpinning ? "Stop reels" : "Spin"} onClick={onSpin}
              disabled={(st.busy && !isSpinning) || (!st.busy && st.free === 0 && credit < stake())}>
              {isSpinning ? <Stop size={30} /> : <SpinIcon size={34} />}
            </button>
          </div>
          <div className="betbox">
            <button className="step" aria-label="Lower bet" onClick={() => onBet(-1)} disabled={locked || st.betIndex <= 0}><Minus size={16} /></button>
            <div className="meter" style={{ textAlign: "center", minWidth: 86 }}>
              <div className="k">Bet</div><div className="v">{money(b)}</div>
            </div>
            <button className="step" aria-label="Raise bet" onClick={() => onBet(1)} disabled={locked || st.betIndex >= BETS.length - 1}><Plus size={16} /></button>
          </div>
        </div>

        <div className="utils">
          <button className="ghost icon" aria-pressed={st.auto > 0 ? "true" : "false"} onClick={onAuto}>
            {st.auto > 0 ? <><Stop size={14} /> Stop ({st.auto})</> : <><Bolt size={14} /> Autoplay 25</>}
          </button>
          <button className="ghost icon" onClick={onReset} disabled={st.busy}><Reset size={14} /> Reset Credit</button>
        </div>

        <Paytable />

        <p className="foot">Play-money demo — no real wagering, no purchases, no payouts. Credits are fictional.</p>
      </div>
    </div>
  );
}

/* ---------- grid ---------- */
function Grid({ st }) {
  return (
    <div className="grid" aria-label="Slot reels">
      {st.grid.map((col, c) => (
        <div className={"col" + (st.spinning[c] ? " whirl" : "")} key={c}>
          {st.spinning[c] ? (
            <div className="strip" aria-hidden="true">
              {[...st.reelSyms[c], ...st.reelSyms[c]].map((id, i) => (
                <div className="cell blur" key={i}><Symbol id={id} /></div>
              ))}
            </div>
          ) : col.map((cell, r) => {
            const k = c + ":" + r;
            const isDrop = cell.born === st.paintId;
            const cls = ["cell",
              isDrop ? "drop" : "",
              !cell.m && cell.s === SCATTER.id ? "scat" : "",
              st.winCells.has(k) ? "win" : "",
              st.popCells.has(k) ? "pop" : "",
            ].filter(Boolean).join(" ");
            return (
              <div className={cls} key={k + "-" + (cell.born || 0)}
                style={isDrop ? { animationDelay: (ROWS - 1 - r) * 36 + "ms" } : undefined}>
                {cell.m ? <Multiplier value={cell.m} /> : <Symbol id={cell.s} />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Symbol({ id }) {
  return <img src={symbolImage(id)} alt="" draggable="false" />;
}

function Multiplier({ value, preview = false }) {
  const isMax = value === MAX_ORB_X;
  return (
    <div className={(preview ? "pt-mult" : "orb") + (isMax ? " max" : "")}>
      <img src={multiplierImage(isMax)} alt="" draggable="false" />
      <span>{value}×</span>
    </div>
  );
}

function Paytable() {
  return (
    <details className="pt">
      <summary><Info size={13} /> Paytable &amp; Rules</summary>
      <div className="ptbody">
        <div className="ptgrid">
          {SYMBOLS.slice().reverse().map((sym) => (
            <div className="ptrow" key={sym.id}>
              <Symbol id={sym.id} />
              <div>
                <div className="nm">{sym.name}</div>
                <div className="pays">
                  8–9 <span>{sym.pays[0].toFixed(2)}×</span> · 10–11 <span>{sym.pays[1].toFixed(2)}×</span> · 12+ <span>{sym.pays[2].toFixed(2)}×</span>
                </div>
              </div>
            </div>
          ))}
          <div className="ptrow">
            <Symbol id="scatter" />
            <div>
              <div className="nm">Dopamine — Scatter</div>
              <div className="pays">4+ anywhere <span>{FS_SPINS} free spins</span></div>
            </div>
          </div>
          <div className="ptrow">
            <Multiplier value={10} preview />
            <div>
              <div className="nm">Multiplier</div>
              <div className="pays">Blue diamond <span>2×–50×</span></div>
            </div>
          </div>
          <div className="ptrow">
            <Multiplier value={MAX_ORB_X} preview />
            <div>
              <div className="nm">Max Multiplier</div>
              <div className="pays">Yellow diamond <span>{MAX_ORB_X}×</span></div>
            </div>
          </div>
        </div>
        <div className="rules">
          <p><strong>Pays anywhere.</strong> There are no paylines. Land <strong>8 or more</strong> of the same symbol anywhere on the 6×5 grid and it pays — position is irrelevant. Payouts above are multiples of your <em>total bet</em>, split into three count bands: 8–9, 10–11, and 12+.</p>
          <p><strong>Tumble.</strong> Every winning symbol is removed, everything above it drops down, and fresh symbols fall in from the top. Tumbles repeat for free until no new win forms, and all wins in the sequence add up.</p>
          <p><strong>Free spins.</strong> Land <strong>4 or more dopamine molecules</strong> (scatter) anywhere to win <strong>{FS_SPINS} free spins</strong>. Landing 3+ scatters during the feature retriggers <code>+5</code> spins.</p>
          <p><strong>Multiplier orbs.</strong> During free spins only, orbs worth <code>2×</code> to <code>100×</code> drop onto the grid. They never pay by themselves and survive every tumble — when the sequence ends, all orb values on screen are <em>added together</em> and applied to that spin's whole win.</p>
          <p><strong>Double Chance</strong> raises your stake by 25% and doubles the scatter rate. <strong>Buy Free Spins</strong> costs {FS_COST}× bet for {FS_SPINS} spins; <strong>Super Free Spins</strong> costs {SUPER_FS_COST}× for {SUPER_FS_SPINS} spins drawn from a far richer orb table. A single spin is capped at <strong>{MAX_WIN_X.toLocaleString()}× bet</strong>.</p>
          <p><strong>Tip.</strong> Tap the spin button (or space) while the reels are turning to slam them in. Theoretical return is about 84% — this game is built to be a grind.</p>
        </div>
      </div>
    </details>
  );
}
