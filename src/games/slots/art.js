/* Shared SVG helpers for slot symbol art. Every symbol is a function
   returning a 100×100 SVG string; render() suffixes gradient ids so many
   copies can sit on one page without clashing. */

export function svg(inner, defs) {
  return '<svg viewBox="0 0 100 100" role="img" aria-hidden="true">' + (defs || "") + inner + "</svg>";
}
export function lg(id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
    stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("") + "</linearGradient>";
}
export function rg(id, stops, cx = "35%", cy = "30%") {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}">` +
    stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("") + "</radialGradient>";
}

let counter = 0;
export function render(fn) {
  const n = ++counter;
  return fn().replace(/id="(\w+)"/g, 'id="$1_' + n + '"').replace(/url\(#(\w+)\)/g, "url(#$1_" + n + ")");
}

/* Card-rank low symbols in a theme colour: rank("A", "#FF2D87") */
export function rank(label, color, dark) {
  return () => svg(
    `<rect x="16" y="10" width="68" height="80" rx="12" fill="url(#rk)" stroke="${dark || "rgba(0,0,0,.45)"}" stroke-width="3"/>` +
    `<rect x="22" y="16" width="56" height="68" rx="8" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.5"/>` +
    `<text x="50" y="${label.length > 1 ? 62 : 64}" text-anchor="middle" font-family="Bungee,Impact,sans-serif" font-size="${label.length > 1 ? 30 : 40}" fill="#FFFFFF" style="paint-order:stroke;stroke:rgba(0,0,0,.5);stroke-width:5">${label}</text>`,
    `<defs>${lg("rk", [[0, lighten(color)], [0.55, color], [1, shade(color)]])}</defs>`
  );
}
export function ranks(color) {
  return [
    { id: "r10", name: "10", art: rank("10", color) },
    { id: "rJ", name: "J", art: rank("J", color) },
    { id: "rQ", name: "Q", art: rank("Q", color) },
    { id: "rK", name: "K", art: rank("K", color) },
    { id: "rA", name: "A", art: rank("A", color) },
  ];
}

/* tiny colour helpers (hex only) */
function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function toHex(r, g, b) { return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join(""); }
export function lighten(c, k = 0.35) { const [r, g, b] = hex(c); return toHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k); }
export function shade(c, k = 0.45) { const [r, g, b] = hex(c); return toHex(r * (1 - k), g * (1 - k), b * (1 - k)); }

/* Badge-style symbol: a coloured disc with a glyph string on top */
export function disc(color, glyph) {
  return () => svg(
    `<circle cx="50" cy="52" r="40" fill="${shade(color)}"/><circle cx="50" cy="48" r="40" fill="url(#dg)"/>` +
    `<circle cx="50" cy="48" r="32" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2"/>` + glyph,
    `<defs>${rg("dg", [[0, lighten(color, 0.6)], [0.6, color], [1, shade(color, 0.3)]])}</defs>`
  );
}
