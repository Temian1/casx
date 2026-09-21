/* Cover art for the lobby tiles — inline SVG, 3:4 portrait, no image
   files to load. Each cover uses unique gradient ids so several can sit
   on one page without clashing. */

const Title = ({ children, y = 330, size = 44, fill = "url(#tg)" }) => (
  <text x="150" y={y} textAnchor="middle" fontFamily="Bungee, Impact, sans-serif" fontSize={size} fill={fill}
    style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.55)", strokeWidth: 6 }}>{children}</text>
);

export function DopamineCover() {
  return (
    <svg viewBox="0 0 300 400" role="img" aria-label="Dopamine Bonanza cover">
      <defs>
        <radialGradient id="dbg" cx="50%" cy="30%" r="80%">
          <stop offset="0" stopColor="#4A1B7A" /><stop offset="0.6" stopColor="#1B0B36" /><stop offset="1" stopColor="#07040F" />
        </radialGradient>
        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF" /><stop offset="0.45" stopColor="#FFC63B" /><stop offset="1" stopColor="#FF2D87" />
        </linearGradient>
        <radialGradient id="orb" cx="34%" cy="30%"><stop offset="0" stopColor="#FFF1C4" /><stop offset="0.46" stopColor="#FF8A1E" /><stop offset="1" stopColor="#B32C00" /></radialGradient>
      </defs>
      <rect width="300" height="400" fill="url(#dbg)" />
      {/* confetti symbols */}
      {[[40, 60, "#29E8DE"], [250, 80, "#FF2D87"], [60, 300, "#B8FF3C"], [270, 260, "#FFC63B"], [130, 40, "#FF2D87"]].map(([x, y, c], i) => (
        <circle key={i} cx={x} cy={y} r={6 + (i % 3) * 3} fill={c} opacity=".8" />
      ))}
      {/* dopamine molecule */}
      <g transform="translate(150 165) scale(1.55)">
        <path d="M0-30 L26-15 L26 15 L0 30 L-26 15 L-26-15 Z" fill="rgba(41,232,222,.12)" stroke="#29E8DE" strokeWidth="5" strokeLinejoin="round" />
        <path d="M-26-15 L-52-29 M-26 15 L-52 29" stroke="#FF2D87" strokeWidth="5" strokeLinecap="round" />
        <circle cx="-54" cy="-31" r="8" fill="#FF2D87" /><circle cx="-54" cy="31" r="8" fill="#FF2D87" />
        <path d="M26-15 L48-27 L64-17" fill="none" stroke="#B8FF3C" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="66" cy="-16" r="8" fill="#B8FF3C" />
      </g>
      {/* multiplier orbs */}
      <g fontFamily="Bungee, Impact, sans-serif" fontSize="16" fill="#3A1000" textAnchor="middle">
        <circle cx="62" cy="235" r="22" fill="url(#orb)" /><text x="62" y="241">25×</text>
        <circle cx="240" cy="200" r="26" fill="url(#orb)" /><text x="240" y="207">100×</text>
      </g>
      <Title y={300} size={40}>DOPAMINE</Title>
      <Title y={346} size={40}>BONANZA</Title>
      <text x="150" y="376" textAnchor="middle" fontFamily="Archivo, sans-serif" fontSize="11" letterSpacing="4" fill="#29E8DE">PAYS ANYWHERE · TUMBLE</text>
    </svg>
  );
}

export function MinesCover() {
  const tiles = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) tiles.push([c, r]);
  return (
    <svg viewBox="0 0 300 400" role="img" aria-label="Mines cover">
      <defs>
        <radialGradient id="mbg" cx="50%" cy="30%" r="80%">
          <stop offset="0" stopColor="#1D4A5C" /><stop offset="0.6" stopColor="#0E2130" /><stop offset="1" stopColor="#07040F" />
        </radialGradient>
        <linearGradient id="mtg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF" /><stop offset="0.5" stopColor="#29E8DE" /><stop offset="1" stopColor="#B8FF3C" />
        </linearGradient>
        <linearGradient id="mgem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B8FF3C" /><stop offset="0.55" stopColor="#29E8DE" /><stop offset="1" stopColor="#1B7C87" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#mbg)" />
      <g transform="translate(46 44)">
        {tiles.map(([c, r], i) => {
          const gem = [5, 6, 9, 10, 0].includes(i), bomb = i === 15;
          return (
            <g key={i} transform={`translate(${c * 54} ${r * 54})`}>
              <rect width="48" height="48" rx="9" fill={gem ? "#0B2530" : bomb ? "#2A0C1A" : "#2C4E60"} stroke={gem ? "#29E8DE" : bomb ? "#FF2D87" : "rgba(255,255,255,.12)"} strokeWidth="2" />
              {gem && <path d="M14 14h20l8 10-18 20L6 24z" fill="url(#mgem)" stroke="#0A4E52" strokeWidth="1.5" />}
              {bomb && <><circle cx="22" cy="28" r="12" fill="#1A1A1F" /><path d="M30 16c4-6 8-6 12-2" fill="none" stroke="#FFC63B" strokeWidth="3" strokeLinecap="round" /><circle cx="43" cy="12" r="4" fill="#FF2D87" /></>}
            </g>
          );
        })}
      </g>
      <Title y={318} size={62} fill="url(#mtg)">MINES</Title>
      <text x="150" y="352" textAnchor="middle" fontFamily="Archivo, sans-serif" fontSize="11" letterSpacing="4" fill="#FF2D87">FIND THE GEMS</text>
      <text x="150" y="376" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="13" fontWeight="700" fill="#FFC63B">99% RTP</text>
    </svg>
  );
}

export function CrashCover() {
  return (
    <svg viewBox="0 0 300 400" role="img" aria-label="Crash cover">
      <defs>
        <radialGradient id="cbg" cx="50%" cy="30%" r="80%">
          <stop offset="0" stopColor="#3A1D5C" /><stop offset="0.6" stopColor="#140B28" /><stop offset="1" stopColor="#07040F" />
        </radialGradient>
        <linearGradient id="ctg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF" /><stop offset="0.5" stopColor="#B8FF3C" /><stop offset="1" stopColor="#FF2D87" />
        </linearGradient>
        <linearGradient id="cfill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="rgba(184,255,60,0)" /><stop offset="1" stopColor="rgba(184,255,60,.4)" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#cbg)" />
      <g stroke="rgba(155,138,196,.2)" strokeWidth="1">
        {[80, 130, 180, 230].map((y) => <line key={y} x1="30" x2="270" y1={y} y2={y} />)}
      </g>
      <path d="M30 250 C 110 245, 180 210, 240 70 L 240 250 Z" fill="url(#cfill)" />
      <path d="M30 250 C 110 245, 180 210, 240 70" fill="none" stroke="#B8FF3C" strokeWidth="6" strokeLinecap="round" />
      {/* rocket */}
      <g transform="translate(240 70) rotate(-62)">
        <path d="M0-22 C 10-10, 10 12, 0 22 C -10 12, -10-10, 0-22 Z" fill="#EFE7FF" stroke="#29E8DE" strokeWidth="2" />
        <circle cy="-2" r="4" fill="#29E8DE" />
        <path d="M-6 12 L-12 24 L-2 18 Z M6 12 L12 24 L2 18 Z" fill="#FF2D87" />
        <path d="M0 22 L-5 40 L0 34 L5 40 Z" fill="#FFC63B" />
      </g>
      <text x="60" y="66" fontFamily="Bungee, Impact, sans-serif" fontSize="30" fill="#FFC63B">12.48×</text>
      <Title y={318} size={62} fill="url(#ctg)">CRASH</Title>
      <text x="150" y="352" textAnchor="middle" fontFamily="Archivo, sans-serif" fontSize="11" letterSpacing="4" fill="#29E8DE">CASH OUT IN TIME</text>
      <text x="150" y="376" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="13" fontWeight="700" fill="#FFC63B">99% RTP</text>
    </svg>
  );
}
