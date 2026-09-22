/* Number Matka — pure game logic, no DOM.

   How a real matka draw works (Kalyan/Milan/Rajdhani style):

   - Three playing cards are drawn for the OPEN. Their face values are
     three digits; written in ascending order they form the open PANNA
     (also called patti). Traditional charts rank 0 last (1,2,…,9,0), so
     190 is a valid ascending panna.
   - The three digits are added and only the last digit of the total is
     kept: that is the open ANK. 3+6+9 = 18 → open ank 8.
   - Later the same happens for the CLOSE. The two anks side by side make
     the JODI: open 8, close 2 → jodi 82.
   - A full result is written  369-82-246  (open panna, jodi, close panna).

   Because the panna is sorted, the 1000 ordered digit triples collapse to
   220 pannas: 120 single pannas (three different digits, 6 orderings each
   → 0.6%), 90 double pannas (one digit twice, 3 orderings → 0.3%) and 10
   triple pannas (0.1%). The ank is the digit sum mod 10, which is exactly
   uniform, so each ank is 10% and each jodi 1%.

   Rates below are the traditional matka rate card. They are "for 1" —
   a winning 9× ank bet returns nine times the stake in total. The card is
   deliberately uneven: ank and jodi return 90%, pannas 84% (70% on a
   triple), and full sangam is the classic sucker bet. rateInfo() exposes
   the true return of every bet so the paytable can show it. */

export const RTP_NOTE = "Ank and Jodi return 90%; pannas 84% (70% on a triple); sangams are long shots.";

/* digit 0 sorts last, as it does on every matka panel chart */
export const rankOf = (d) => (d === 0 ? 10 : d);
export const sortDigits = (digits) => [...digits].sort((a, b) => rankOf(a) - rankOf(b));
export const pannaOf = (digits) => sortDigits(digits).join("");
export const ankOf = (digits) => digits.reduce((a, d) => a + d, 0) % 10;

/** "single" | "double" | "triple" */
export function pannaType(panna) {
  const [a, b, c] = String(panna).padStart(3, "0").split("").map(Number);
  if (a === b && b === c) return "triple";
  return a === b || b === c || a === c ? "double" : "single";
}

/* Every valid panna, in chart order, grouped by type. */
function buildPannas() {
  const all = [];
  for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) for (let c = 0; c < 10; c++) {
    const p = pannaOf([a, b, c]);
    if (!all.includes(p)) all.push(p);
  }
  return all.sort((x, y) => Number(x) - Number(y));
}
export const PANNAS = buildPannas();                                   /* 220 */
export const SINGLE_PANNAS = PANNAS.filter((p) => pannaType(p) === "single");  /* 120 */
export const DOUBLE_PANNAS = PANNAS.filter((p) => pannaType(p) === "double");  /*  90 */
export const TRIPLE_PANNAS = PANNAS.filter((p) => pannaType(p) === "triple");  /*  10 */

/* probability of one specific panna coming out of a draw */
export const PANNA_ODDS = { single: 6 / 1000, double: 3 / 1000, triple: 1 / 1000 };

/* Traditional rate card (payout "for 1", stake included) */
export const RATES = {
  ank: 9,
  jodi: 90,
  panna: { single: 140, double: 280, triple: 700 },
  halfSangam: { single: 1400, double: 2800, triple: 7000 },
  fullSangam: 10000,
};
export const MAX_WIN_X = RATES.fullSangam;

export const BET_TYPES = [
  { id: "open-ank", name: "Open Ank", short: "Open", pick: "digit", desc: "the open digit (sum of the three open cards)" },
  { id: "close-ank", name: "Close Ank", short: "Close", pick: "digit", desc: "the close digit" },
  { id: "jodi", name: "Jodi", short: "Jodi", pick: "jodi", desc: "both digits together, 00–99" },
  { id: "open-panna", name: "Open Panna", short: "O.Panna", pick: "panna", desc: "the three open cards in chart order" },
  { id: "close-panna", name: "Close Panna", short: "C.Panna", pick: "panna", desc: "the three close cards in chart order" },
  { id: "half-sangam-open", name: "Half Sangam A", short: "H.Sangam A", pick: "ankPanna", desc: "open ank plus close panna" },
  { id: "half-sangam-close", name: "Half Sangam B", short: "H.Sangam B", pick: "pannaAnk", desc: "open panna plus close ank" },
  { id: "full-sangam", name: "Full Sangam", short: "F.Sangam", pick: "pannaPanna", desc: "open panna and close panna together" },
];

/** Payout multiplier ("for 1") and true return of a bet, before it is placed. */
export function rateInfo(type, pick) {
  switch (type) {
    case "open-ank":
    case "close-ank":
      return { rate: RATES.ank, chance: 1 / 10 };
    case "jodi":
      return { rate: RATES.jodi, chance: 1 / 100 };
    case "open-panna":
    case "close-panna": {
      const t = pannaType(pick.panna);
      return { rate: RATES.panna[t], chance: PANNA_ODDS[t], pannaType: t };
    }
    case "half-sangam-open":
    case "half-sangam-close": {
      const t = pannaType(pick.panna);
      return { rate: RATES.halfSangam[t], chance: (1 / 10) * PANNA_ODDS[t], pannaType: t };
    }
    case "full-sangam": {
      const a = pannaType(pick.openPanna), b = pannaType(pick.closePanna);
      return { rate: RATES.fullSangam, chance: PANNA_ODDS[a] * PANNA_ODDS[b], pannaType: a + "/" + b };
    }
    default:
      return { rate: 0, chance: 0 };
  }
}
export const returnOf = (type, pick) => {
  const { rate, chance } = rateInfo(type, pick);
  return rate * chance;
};

/** A side of the draw: three digits, their panna and their ank. */
export function drawSide(rng = Math.random) {
  const digits = [0, 0, 0].map(() => Math.floor(rng() * 10));
  return { digits, panna: pannaOf(digits), ank: ankOf(digits) };
}
export function drawResult(rng = Math.random) {
  const open = drawSide(rng), close = drawSide(rng);
  return { open, close, jodi: String(open.ank) + String(close.ank) };
}
export const formatResult = (r) => `${r.open.panna}-${r.jodi}-${r.close.panna}`;

/** Does this bet win against the result? */
export function betWins(bet, result) {
  const { type, pick } = bet;
  switch (type) {
    case "open-ank": return pick.digit === result.open.ank;
    case "close-ank": return pick.digit === result.close.ank;
    case "jodi": return pick.jodi === result.jodi;
    case "open-panna": return pick.panna === result.open.panna;
    case "close-panna": return pick.panna === result.close.panna;
    case "half-sangam-open": return pick.digit === result.open.ank && pick.panna === result.close.panna;
    case "half-sangam-close": return pick.digit === result.close.ank && pick.panna === result.open.panna;
    case "full-sangam": return pick.openPanna === result.open.panna && pick.closePanna === result.close.panna;
    default: return false;
  }
}

/** Settle a whole bet slip. Returns each bet's outcome plus the totals. */
export function settle(slip, result) {
  const lines = slip.map((bet) => {
    const { rate } = rateInfo(bet.type, bet.pick);
    const won = betWins(bet, result);
    const payout = won ? Math.round(bet.stake * rate * 100) / 100 : 0;
    return { ...bet, won, rate, payout };
  });
  const staked = Math.round(lines.reduce((a, l) => a + l.stake, 0) * 100) / 100;
  const payout = Math.round(lines.reduce((a, l) => a + l.payout, 0) * 100) / 100;
  return { lines, staked, payout, net: Math.round((payout - staked) * 100) / 100 };
}

/** Human label for a pick, e.g. "7", "82", "128", "7 + 128". */
export function pickLabel(type, pick) {
  switch (type) {
    case "open-ank":
    case "close-ank": return String(pick.digit);
    case "jodi": return pick.jodi;
    case "open-panna":
    case "close-panna": return pick.panna;
    case "half-sangam-open": return `${pick.digit} + ${pick.panna}`;
    case "half-sangam-close": return `${pick.panna} + ${pick.digit}`;
    case "full-sangam": return `${pick.openPanna} + ${pick.closePanna}`;
    default: return "";
  }
}

/* Markets are the named draws real matka runs — Kalyan, Milan and so on.
   They differ only in name, colour and draw time; the maths is identical,
   and each keeps its own panel chart of recent results. */
export const MARKETS = [
  { id: "kalyan", name: "Kalyan", open: "16:15", close: "18:15", accent: "#FFC63B" },
  { id: "milan-day", name: "Milan Day", open: "15:10", close: "17:10", accent: "#29E8DE" },
  { id: "rajdhani", name: "Rajdhani Night", open: "21:35", close: "23:50", accent: "#FF2D87" },
  { id: "main-bazar", name: "Main Bazar", open: "21:35", close: "00:05", accent: "#B8FF3C" },
];
