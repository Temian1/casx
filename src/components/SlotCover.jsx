import { useMemo } from "react";
import { render as renderArt } from "../games/slots/art.js";

/* Lobby cover generated from a slot config: theme gradient, a fan of the
   slot's top symbols, and its title. Nested <svg> elements carry the
   symbol art so no separate cover drawing is needed per slot. */

const place = (markup, x, y, size, rot = 0) =>
  markup.replace("<svg ", `<svg x="${x}" y="${y}" width="${size}" height="${size}" style="transform-box:fill-box;transform-origin:center;transform:rotate(${rot}deg)" `);

export default function SlotCover({ cfg }) {
  const uid = cfg.id.replace(/[^a-z0-9]/g, "");
  const symbols = useMemo(() => {
    const ids = cfg.coverSymbols || [
      ...cfg.symbols.filter((s) => s.pays && !s.wild && !s.scatter && !s.coin).slice(-3).map((s) => s.id),
      ...(cfg.symbols.find((s) => s.wild || s.coin || s.scatter) ? [cfg.symbols.find((s) => s.coin)?.id || cfg.symbols.find((s) => s.wild)?.id || cfg.symbols.find((s) => s.scatter)?.id] : []),
    ];
    const arts = ids.map((id) => renderArt(cfg.symbols.find((s) => s.id === id).art));
    const layout = [[30, 60, 110, -14], [150, 40, 120, 8], [80, 150, 130, -4], [190, 140, 100, 14]];
    return arts.map((m, i) => place(m, ...layout[i % layout.length])).join("");
  }, [cfg]);
  const t = cfg.theme;
  const words = cfg.title.toUpperCase().split(" ");
  const lines = words.length > 2 ? [words.slice(0, 2).join(" "), words.slice(2).join(" ")] : words.length === 2 && cfg.title.length > 11 ? words : [cfg.title.toUpperCase()];
  const size = lines.some((l) => l.length > 9) ? 34 : 48;
  return (
    <svg viewBox="0 0 300 400" role="img" aria-label={cfg.title + " cover"}>
      <defs>
        <radialGradient id={"bg" + uid} cx="50%" cy="30%" r="85%"><stop offset="0" stopColor={t.frame[0]} /><stop offset="0.6" stopColor={t.bg[0]} /><stop offset="1" stopColor="#07040F" /></radialGradient>
        <linearGradient id={"tg" + uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF" /><stop offset="0.45" stopColor={t.g1} /><stop offset="1" stopColor={t.g2} /></linearGradient>
      </defs>
      <rect width="300" height="400" fill={"url(#bg" + uid + ")"} />
      <circle cx="150" cy="130" r="120" fill={`rgba(${t.glow},.08)`} />
      <g dangerouslySetInnerHTML={{ __html: symbols }} />
      {lines.map((l, i) => (
        <text key={i} x="150" y={lines.length === 1 ? 330 : 306 + i * (size + 6)} textAnchor="middle" fontFamily="Bungee, Impact, sans-serif" fontSize={size} fill={"url(#tg" + uid + ")"}
          style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.55)", strokeWidth: 6 }}>{l}</text>
      ))}
      <text x="150" y="372" textAnchor="middle" fontFamily="Archivo, sans-serif" fontSize="10" letterSpacing="3" fill={t.g1}>{cfg.tagline.toUpperCase()}</text>
      <text x="150" y="390" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fontWeight="700" fill="#FFC63B">max {cfg.maxWin.toLocaleString()}×</text>
    </svg>
  );
}
