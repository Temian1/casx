/* Cover art for the originals added in round two: Dice, Plinko, Blackjack. */

const Title = ({ children, y = 330, size = 44, fill }) => (
  <text x="150" y={y} textAnchor="middle" fontFamily="Bungee, Impact, sans-serif" fontSize={size} fill={fill}
    style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.55)", strokeWidth: 6 }}>{children}</text>
);

export function DiceCover() {
  const pip = (x, y) => <circle cx={x} cy={y} r="7" fill="#1B1436" />;
  return (
    <svg viewBox="0 0 300 400" role="img" aria-label="Dice cover">
      <defs>
        <radialGradient id="dcbg" cx="50%" cy="30%" r="80%"><stop offset="0" stopColor="#5A3A0E" /><stop offset="0.6" stopColor="#1E1408" /><stop offset="1" stopColor="#07040F" /></radialGradient>
        <linearGradient id="dctg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF" /><stop offset="0.5" stopColor="#FFC63B" /><stop offset="1" stopColor="#FF2D87" /></linearGradient>
        <linearGradient id="dcface" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#D9D3EE" /></linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#dcbg)" />
      <g transform="translate(95 90) rotate(-14)">
        <rect width="110" height="110" rx="20" fill="url(#dcface)" stroke="#8E86B3" strokeWidth="3" />
        {pip(28, 28)}{pip(82, 28)}{pip(55, 55)}{pip(28, 82)}{pip(82, 82)}
      </g>
      <g transform="translate(150 150) rotate(18)">
        <rect width="96" height="96" rx="18" fill="#FF2D87" stroke="#7A0E3A" strokeWidth="3" />
        <circle cx="26" cy="26" r="7" fill="#fff" /><circle cx="70" cy="70" r="7" fill="#fff" />
      </g>
      <rect x="40" y="262" width="220" height="14" rx="7" fill="#2A1044" />
      <rect x="150" y="262" width="110" height="14" rx="7" fill="#B8FF3C" />
      <rect x="148" y="254" width="4" height="30" fill="#FFC63B" />
      <Title y={330} size={62} fill="url(#dctg)">DICE</Title>
      <text x="150" y="358" textAnchor="middle" fontFamily="Archivo, sans-serif" fontSize="11" letterSpacing="4" fill="#29E8DE">OVER OR UNDER</text>
      <text x="150" y="380" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="13" fontWeight="700" fill="#FFC63B">up to 48×</text>
    </svg>
  );
}

export function PlinkoCover() {
  const pegs = [];
  for (let r = 0; r < 6; r++) for (let i = 0; i < r + 3; i++) pegs.push([150 + (i - (r + 2) / 2) * 32, 60 + r * 32]);
  const buckets = [[62, "#7A5C1E", "0.5"], [94, "#FFC63B", "1"], [126, "#FF8A1E", "3"], [158, "#FF2D87", "26"], [190, "#FF8A1E", "3"], [222, "#FFC63B", "1"]];
  return (
    <svg viewBox="0 0 300 400" role="img" aria-label="Plinko cover">
      <defs>
        <radialGradient id="pkbg" cx="50%" cy="30%" r="80%"><stop offset="0" stopColor="#3A1D5C" /><stop offset="0.6" stopColor="#170B2C" /><stop offset="1" stopColor="#07040F" /></radialGradient>
        <linearGradient id="pktg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF" /><stop offset="0.5" stopColor="#FFC63B" /><stop offset="1" stopColor="#29E8DE" /></linearGradient>
        <radialGradient id="pkball" cx="35%" cy="30%"><stop offset="0" stopColor="#FFF1C4" /><stop offset="0.5" stopColor="#FFC63B" /><stop offset="1" stopColor="#B36A00" /></radialGradient>
      </defs>
      <rect width="300" height="400" fill="url(#pkbg)" />
      {pegs.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill="#EFE7FF" />)}
      <path d="M150 30 L134 60 L150 92 L134 124 L166 156 L150 188 L166 220" fill="none" stroke="rgba(255,198,59,.35)" strokeWidth="3" strokeDasharray="4 5" />
      <circle cx="166" cy="220" r="12" fill="url(#pkball)" />
      {buckets.map(([x, c, t]) => (
        <g key={x}>
          <rect x={x - 14} y="238" width="28" height="18" rx="4" fill={c} />
          <text x={x} y="251" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="10" fontWeight="700" fill="#1A0710">{t}×</text>
        </g>
      ))}
      <Title y={330} size={54} fill="url(#pktg)">PLINKO</Title>
      <text x="150" y="358" textAnchor="middle" fontFamily="Archivo, sans-serif" fontSize="11" letterSpacing="4" fill="#29E8DE">DROP THE BALL</text>
      <text x="150" y="380" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="13" fontWeight="700" fill="#FFC63B">up to 970×</text>
    </svg>
  );
}

export function BlackjackCover() {
  const card = (x, y, rot, r, s, red) => (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect width="80" height="112" rx="8" fill="#FBF7FF" stroke="#C9BFE6" strokeWidth="2" />
      <text x="8" y="24" fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="20" fill={red ? "#E0245E" : "#1B1436"}>{r}</text>
      <text x="40" y="78" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="40" fill={red ? "#E0245E" : "#1B1436"}>{s}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 300 400" role="img" aria-label="Blackjack cover">
      <defs>
        <radialGradient id="bjbg" cx="50%" cy="30%" r="80%"><stop offset="0" stopColor="#12503E" /><stop offset="0.6" stopColor="#0A2A22" /><stop offset="1" stopColor="#07040F" /></radialGradient>
        <linearGradient id="bjtg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF" /><stop offset="0.5" stopColor="#B8FF3C" /><stop offset="1" stopColor="#29E8DE" /></linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#bjbg)" />
      <ellipse cx="150" cy="150" rx="130" ry="100" fill="none" stroke="rgba(184,255,60,.25)" strokeWidth="6" />
      {card(78, 70, -14, "A", "♠", false)}
      {card(140, 62, 10, "K", "♥", true)}
      <g transform="translate(150 222)">
        <circle r="22" fill="#FF2D87" /><circle r="14" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="5 4" />
        <circle cx="34" cy="6" r="18" fill="#FFC63B" /><circle cx="34" cy="6" r="11" fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="4 3" />
      </g>
      <Title y={330} size={44} fill="url(#bjtg)">BLACKJACK</Title>
      <text x="150" y="358" textAnchor="middle" fontFamily="Archivo, sans-serif" fontSize="11" letterSpacing="4" fill="#FF2D87">BEAT THE DEALER</text>
      <text x="150" y="380" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="13" fontWeight="700" fill="#FFC63B">pays 3:2</text>
    </svg>
  );
}
