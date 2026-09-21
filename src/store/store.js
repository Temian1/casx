import { useSyncExternalStore } from "react";

/* Tiny external store: shared play-money wallet, sound settings and the
   play ledger. Persisted to localStorage so credits and history survive
   between games / reloads. No accounts, no login — everything is local. */

const KEY = "casx.v1";
const LEDGER_KEY = "casx.ledger.v1";
const DEFAULTS = { credit: 1000, sound: true, volume: 0.7 };
const MAX_ENTRIES = 600;

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback();
    return { ...fallback(), ...JSON.parse(raw) };
  } catch {
    return fallback();
  }
}

let state = load(KEY, () => ({ ...DEFAULTS }));
/* ledger: { entries:[{id,ts,game,type,amount,balance,note}], games:{[id]:{wagered,won,rounds,biggest}} } */
let ledger = load(LEDGER_KEY, () => ({ entries: [], games: {}, seq: 0 }));

const listeners = new Set();
function emit() { listeners.forEach((l) => l()); }
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}
function persistLedger() {
  try { localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger)); } catch { /* ignore */ }
}
const r2 = (n) => Math.round(n * 100) / 100;

function set(patch) {
  state = { ...state, ...patch };
  persist();
  emit();
}

function record(game, type, amount, note) {
  const g = ledger.games[game] || { wagered: 0, won: 0, rounds: 0, biggest: 0 };
  if (type === "bet") { g.wagered = r2(g.wagered + amount); g.rounds++; }
  if (type === "win") { g.won = r2(g.won + amount); if (amount > g.biggest) g.biggest = amount; }
  const entry = { id: ++ledger.seq, ts: Date.now(), game, type, amount: r2(amount), balance: state.credit, note: note || "" };
  ledger = { ...ledger, games: { ...ledger.games, [game]: g }, entries: [entry, ...ledger.entries].slice(0, MAX_ENTRIES) };
  persistLedger();
}

export const store = {
  get: () => state,
  set,
  subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
  credit: () => state.credit,
  soundOn: () => state.sound,
  setSound: (on) => set({ sound: !!on }),
  setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)) }),

  /* ---- accounting: every stake and payout goes through here ---- */
  /** Take a stake from the wallet. Returns false (and does nothing) if it can't be covered. */
  debit(game, amount, note) {
    amount = r2(amount);
    if (amount <= 0) return true;
    if (state.credit < amount - 1e-9) return false;
    state = { ...state, credit: r2(state.credit - amount) };
    persist();
    record(game, "bet", amount, note);
    emit();
    return true;
  },
  /** Pay a win (or return a stake) to the wallet. */
  payout(game, amount, note) {
    amount = r2(amount);
    if (amount <= 0) return;
    state = { ...state, credit: r2(state.credit + amount) };
    persist();
    record(game, "win", amount, note);
    emit();
  },
  resetCredit(game) {
    state = { ...state, credit: DEFAULTS.credit };
    persist();
    record(game || "wallet", "reset", DEFAULTS.credit, "credit reset");
    emit();
  },

  /* ---- ledger reads ---- */
  ledger: () => ledger,
  gameStats: (game) => ledger.games[game] || { wagered: 0, won: 0, rounds: 0, biggest: 0 },
  totals() {
    let wagered = 0, won = 0, rounds = 0;
    for (const g of Object.values(ledger.games)) { wagered += g.wagered; won += g.won; rounds += g.rounds; }
    return { wagered: r2(wagered), won: r2(won), net: r2(won - wagered), rounds };
  },
  clearHistory() {
    ledger = { entries: [], games: {}, seq: 0 };
    persistLedger();
    emit();
  },
};

/** Per-game wallet handle: `const W = wallet("mines"); W.debit(1); W.payout(2.4)` */
export function wallet(game) {
  return {
    id: game,
    credit: () => state.credit,
    debit: (amount, note) => store.debit(game, amount, note),
    payout: (amount, note) => store.payout(game, amount, note),
    reset: () => store.resetCredit(game),
    stats: () => store.gameStats(game),
  };
}

export function useStore() {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
export function useLedger() {
  return useSyncExternalStore(store.subscribe, store.ledger, store.ledger);
}

export function money(n) {
  return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
