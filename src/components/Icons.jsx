/* Inline SVG icon set. Every icon is a 24×24 stroke/fill glyph that
   inherits `currentColor`, so it recolours with the button it sits in. */

const I = ({ children, size = 18, fill = "none", viewBox = "0 0 24 24", ...rest }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>{children}</svg>
);

export const SoundOn = (p) => <I {...p}><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" /><path d="M16 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></I>;
export const SoundOff = (p) => <I {...p}><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" /><path d="M16.5 9l5 6M21.5 9l-5 6" /></I>;
export const Back = (p) => <I {...p}><path d="M15 5l-7 7 7 7" /></I>;
export const Play = (p) => <I {...p}><path d="M7 4l13 8-13 8z" fill="currentColor" stroke="none" /></I>;
export const Spin = (p) => <I {...p} strokeWidth="2.6"><path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" /><path d="M20.6 3.6v5.2h-5.2" /></I>;
export const Plus = (p) => <I {...p}><path d="M12 5v14M5 12h14" /></I>;
export const Minus = (p) => <I {...p}><path d="M5 12h14" /></I>;
export const Reset = (p) => <I {...p}><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" /><path d="M3.4 3.6v5.2h5.2" /></I>;
export const Bolt = (p) => <I {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none" /></I>;
export const Stop = (p) => <I {...p}><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" /></I>;
export const Coin = (p) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5h3.5a1.75 1.75 0 0 1 0 3.5h-2a1.75 1.75 0 0 0 0 3.5H15" /></I>;
export const Cart = (p) => <I {...p}><path d="M3 4h2l2.4 11h11.2L21 7H6" /><circle cx="9" cy="19" r="1.4" fill="currentColor" /><circle cx="17" cy="19" r="1.4" fill="currentColor" /></I>;
export const Star = (p) => <I {...p}><path d="M12 3l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.4 6.3 20.5l1.2-6.4L2.8 9.7l6.4-.8z" fill="currentColor" stroke="none" /></I>;
export const Info = (p) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></I>;
export const Home = (p) => <I {...p}><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></I>;
export const Dice = (p) => <I {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" /><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" /><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" /></I>;
export const Gem = (p) => <I {...p}><path d="M7 4h10l4 5-9 11L3 9z" /><path d="M3 9h18M7 4l3 5 2-5 2 5 3-5M10 9l2 11 2-11" strokeWidth="1.4" /></I>;
export const Bomb = (p) => <I {...p}><circle cx="11" cy="14" r="7" fill="currentColor" stroke="none" /><path d="M14 8l2.5-2.5M17 5c1-1.5 3-1.5 4 0" /><circle cx="21" cy="5" r="1.2" fill="currentColor" stroke="none" /></I>;
export const Cash = (p) => <I {...p}><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v.1M18 14.5v.1" /></I>;
export const Plane = (p) => <I {...p}><path d="M21 4l-8 9-5-2-4 2 4 2 2 4 2-4 9-11z" fill="currentColor" stroke="none" /></I>;
export const Cards = (p) => <I {...p}><rect x="7" y="3" width="13" height="17" rx="2" transform="rotate(8 13.5 11.5)" /><rect x="4" y="5" width="13" height="17" rx="2" fill="var(--panel, #150C28)" /><path d="M10.5 10.2c0-1 .8-1.7 1.6-1.7 1.4 0 1.9 1.4 1.9 1.4s.5-1.4 1.9-1.4c.9 0 1.6.7 1.6 1.7 0 2-3.5 4.3-3.5 4.3s-3.5-2.3-3.5-4.3z" fill="currentColor" stroke="none" transform="translate(-2.5 2.5)" /></I>;
export const Shuffle = (p) => <I {...p}><path d="M3 7h4l10 10h4M21 17l-3-3M21 17l-3 3M3 17h4l3-3M14 7h7M21 7l-3-3M21 7l-3 3" /></I>;
export const Trophy = (p) => <I {...p}><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v3M8.5 20h7M9.5 17h5" /></I>;
export const Hand = (p) => <I {...p}><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 6a1.5 1.5 0 0 1 3 0v6M14 7.5a1.5 1.5 0 0 1 3 0V13M17 10a1.5 1.5 0 0 1 3 0v5a6 6 0 0 1-6 6h-2.5a5 5 0 0 1-4.2-2.3L4 14.2a1.5 1.5 0 0 1 2.3-1.9L8 14" /></I>;
export const Check = (p) => <I {...p}><path d="M4 12.5l5 5L20 6.5" /></I>;
export const X = (p) => <I {...p}><path d="M6 6l12 12M18 6L6 18" /></I>;
export const Ball = (p) => <I {...p}><circle cx="12" cy="12" r="8" fill="currentColor" stroke="none" /><circle cx="9" cy="9" r="2.4" fill="#fff" opacity=".5" stroke="none" /></I>;
export const Wallet = (p) => <I {...p}><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18M16 14.5h2" /></I>;
export const Double = (p) => <I {...p}><path d="M5 5h4l6 14h4M15 5h4l-2.5 5.5" /></I>;
export const Timer = (p) => <I {...p}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9.5 3h5" /></I>;
export const Chip = (p) => <I {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><path d="M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21" /></I>;
export const Rocket = (p) => <I {...p}><path d="M5 19l3-3M14 4c3-1 5-1 6 0s1 3 0 6c-2 4-6 7-9 8l-3-3c1-3 4-7 6-11z" /><circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none" /><path d="M8 15l-4 1 2-4 2 3" /></I>;
