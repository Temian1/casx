import { useSyncExternalStore } from "react";

/* Shared play-money wallet, sound settings and play ledger. Persisted to
   localStorage so credits, totals, and recent activity survive reloads. */

const KEY = "casx.v1";
const LEDGER_KEY = "casx.ledger.v1";
const DEFAULTS = { credit: 1000, sound: true, volume: 0.7 };
const MAX_ENTRIES = 750;
const EMPTY_GAME = {
  wagered: 0,
  won: 0,
  rounds: 0,
  wins: 0,
  biggest: 0,
  roundStake: 0,
  roundPayout: 0,
  roundWon: false,
};

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
/* ledger: { entries:[{id,ts,game,type,amount,balance,note}], games:{[id]:stats} } */
let ledger = load(LEDGER_KEY, () => ({ entries: [], games: {}, seq: 0 }));

/* Add win counts to ledgers created before this field existed. Recent
   entries provide the best available migration without discarding totals. */
for (const [gameId, game] of Object.entries(ledger.games)) {
  if (Number.isFinite(game.wins)) continue;
  const recordedWins = ledger.entries.filter((entry) => entry.game === gameId && entry.type === "win").length;
  ledger.games[gameId] = {
    ...game,
    wins: Math.min(game.rounds || 0, recordedWins),
    roundWon: ledger.entries.find((entry) => entry.game === gameId)?.type === "win",
    roundStake: 0,
    roundPayout: 0,
  };
}

const listeners = new Set();
function emit() { listeners.forEach((listener) => listener()); }
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

function record(game, type, amount, note, countRound = true) {
  const g = { ...EMPTY_GAME, ...ledger.games[game] };
  if (type === "bet") {
    g.wagered = r2(g.wagered + amount);
    if (countRound) {
      g.rounds++;
      g.roundStake = amount;
      g.roundPayout = 0;
      g.roundWon = false;
    } else {
      g.roundStake = r2(g.roundStake + amount);
    }
  }
  if (type === "win") {
    g.won = r2(g.won + amount);
    g.roundPayout = r2(g.roundPayout + amount);
    g.biggest = Math.max(g.biggest, g.roundPayout);
    if (!g.roundWon && g.roundPayout > g.roundStake + 1e-9) {
      g.wins++;
      g.roundWon = true;
    }
  }
  const entry = {
    id: ++ledger.seq,
    ts: Date.now(),
    game,
    type,
    amount: r2(amount),
    balance: state.credit,
    note: note || "",
  };
  ledger = {
    ...ledger,
    games: { ...ledger.games, [game]: g },
    entries: [entry, ...ledger.entries].slice(0, MAX_ENTRIES),
  };
  persistLedger();
}

function withDerived(game) {
  const g = { ...EMPTY_GAME, ...game };
  return { ...g, losses: Math.max(0, g.rounds - g.wins), net: r2(g.won - g.wagered) };
}

export const store = {
  get: () => state,
  set,
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  credit: () => state.credit,
  soundOn: () => state.sound,
  setSound: (on) => set({ sound: !!on }),
  setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)) }),

  /* Every stake and payout goes through these two methods. */
  debit(game, amount, note, countRound = true) {
    amount = r2(amount);
    if (amount <= 0) return true;
    if (state.credit < amount - 1e-9) return false;
    state = { ...state, credit: r2(state.credit - amount) };
    persist();
    record(game, "bet", amount, note, countRound);
    emit();
    return true;
  },
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

  ledger: () => ledger,
  gameStats: (game) => withDerived(ledger.games[game]),
  totals() {
    const totals = { wagered: 0, won: 0, net: 0, rounds: 0, wins: 0, losses: 0, biggest: 0 };
    for (const raw of Object.values(ledger.games)) {
      const game = withDerived(raw);
      totals.wagered += game.wagered;
      totals.won += game.won;
      totals.rounds += game.rounds;
      totals.wins += game.wins;
      totals.losses += game.losses;
      totals.biggest = Math.max(totals.biggest, game.biggest);
    }
    totals.wagered = r2(totals.wagered);
    totals.won = r2(totals.won);
    totals.net = r2(totals.won - totals.wagered);
    return totals;
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
    debit: (amount, note, countRound = true) => store.debit(game, amount, note, countRound),
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
