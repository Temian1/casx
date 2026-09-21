import { useSyncExternalStore } from "react";

/* Tiny external store: shared play-money wallet + sound settings.
   Persisted to localStorage so credits survive between games / reloads.
   No accounts, no login — everything is local and fictional. */

const KEY = "casx.v1";
const DEFAULTS = { credit: 1000, sound: true, volume: 0.7 };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const data = JSON.parse(raw);
    return { ...DEFAULTS, ...data };
  } catch {
    return { ...DEFAULTS };
  }
}

let state = load();
const listeners = new Set();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function set(patch) {
  state = { ...state, ...patch };
  persist();
  listeners.forEach((l) => l());
}

export const store = {
  get: () => state,
  set,
  subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
  /* wallet helpers — safe to call from imperative game code */
  credit: () => state.credit,
  setCredit: (n) => set({ credit: Math.max(0, Math.round(n * 100) / 100) }),
  addCredit: (n) => set({ credit: Math.max(0, Math.round((state.credit + n) * 100) / 100) }),
  resetCredit: () => set({ credit: DEFAULTS.credit }),
  soundOn: () => state.sound,
  setSound: (on) => set({ sound: !!on }),
  setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)) }),
};

export function useStore() {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export function money(n) {
  return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
