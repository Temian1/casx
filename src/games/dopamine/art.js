/* SVG ARTWORK — every symbol drawn inline, 100×100 viewBox.
   Lifted verbatim from the original standalone build. */
function svg(inner, extra) {
  return '<svg viewBox="0 0 100 100" role="img" aria-hidden="true">' + (extra || "") + inner + "</svg>";
}

export const ART = {

  /* Zyn — pale mint nicotine pouch can, top-down */
  zyn: function(){
    return svg(
      '<circle cx="50" cy="52" r="37" fill="#0A4E52"/>'+
      '<circle cx="50" cy="48" r="37" fill="url(#zg)"/>'+
      '<circle cx="50" cy="48" r="30" fill="none" stroke="#12A6A0" stroke-width="3"/>'+
      '<circle cx="50" cy="48" r="22" fill="#F2FEFD"/>'+
      '<text x="50" y="54" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="17" fill="#0B6C6E" letter-spacing="1">ZYN</text>'+
      '<path d="M28 30a36 36 0 0 1 30-12" stroke="rgba(255,255,255,.75)" stroke-width="5" fill="none" stroke-linecap="round"/>',
      '<defs><radialGradient id="zg" cx="36%" cy="28%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="55%" stop-color="#D8F7F3"/><stop offset="100%" stop-color="#7FD6CE"/></radialGradient></defs>'
    );
  },

  /* Velo — deep indigo pouch can, top-down */
  velo: function(){
    return svg(
      '<circle cx="50" cy="52" r="37" fill="#0B0A2E"/>'+
      '<circle cx="50" cy="48" r="37" fill="url(#vg)"/>'+
      '<circle cx="50" cy="48" r="30" fill="none" stroke="#5C4BE0" stroke-width="3"/>'+
      '<circle cx="50" cy="48" r="22" fill="#171449"/>'+
      '<text x="50" y="54" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="14" fill="#9C8BFF" letter-spacing="1">VELO</text>'+
      '<path d="M28 30a36 36 0 0 1 30-12" stroke="rgba(180,170,255,.55)" stroke-width="5" fill="none" stroke-linecap="round"/>',
      '<defs><radialGradient id="vg" cx="36%" cy="28%"><stop offset="0" stop-color="#4E42A8"/><stop offset="55%" stop-color="#2A2270"/><stop offset="100%" stop-color="#14103F"/></radialGradient></defs>'
    );
  },

  /* Monster — black can, green claw slashes */
  monster: function(){
    return svg(
      '<rect x="30" y="14" width="40" height="72" rx="11" fill="url(#mg)"/>'+
      '<rect x="30" y="14" width="40" height="72" rx="11" fill="none" stroke="#2E2E2E" stroke-width="2"/>'+
      '<rect x="32" y="14" width="36" height="7" rx="3.5" fill="#BFC4C9"/>'+
      '<ellipse cx="50" cy="16" rx="18" ry="4" fill="#DDE2E6"/>'+
      '<path d="M40.5 29c4 11 3.6 22 .6 34-.6-12-2.6-22-5.6-31z" fill="#6AE82B"/>'+
      '<path d="M50 27c4.4 12 4 24 .8 37-.8-13-2.8-24-6-34z" fill="#6AE82B"/>'+
      '<path d="M59.5 29c4 11 3.6 22 .6 34-.6-12-2.6-22-5.6-31z" fill="#6AE82B"/>'+
      '<text x="50" y="80" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="8" fill="#6AE82B" letter-spacing="1.2">ENERGY</text>'+
      '<rect x="34" y="24" width="4" height="54" rx="2" fill="rgba(255,255,255,.14)"/>',
      '<defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1A1A1A"/><stop offset="42%" stop-color="#000"/><stop offset="100%" stop-color="#2A2A2A"/></linearGradient></defs>'
    );
  },

  /* Energy shot — slim electric-blue can */
  redbull: function(){
    return svg(
      '<rect x="33" y="14" width="34" height="72" rx="10" fill="url(#rg)"/>'+
      '<rect x="33" y="14" width="34" height="72" rx="10" fill="none" stroke="#123A6E" stroke-width="2"/>'+
      '<rect x="35" y="14" width="30" height="7" rx="3.5" fill="#C6CCD2"/>'+
      '<ellipse cx="50" cy="16" rx="15" ry="3.5" fill="#E2E7EB"/>'+
      '<path d="M50 30 L40 56 h9 l-4 20 15-28h-9z" fill="#FFD400"/>'+
      '<rect x="36" y="24" width="3.6" height="54" rx="1.8" fill="rgba(255,255,255,.2)"/>',
      '<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1E63C8"/><stop offset="45%" stop-color="#0B3E92"/><stop offset="100%" stop-color="#1A5AB4"/></linearGradient></defs>'
    );
  },

  /* iPhone 17 Pro Max — titanium back, square camera plateau */
  iphone: function(){
    return svg(
      '<rect x="28" y="8" width="44" height="84" rx="11" fill="url(#ig)"/>'+
      '<rect x="28" y="8" width="44" height="84" rx="11" fill="none" stroke="#6E7176" stroke-width="2"/>'+
      '<rect x="31" y="11" width="38" height="78" rx="9" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1.4"/>'+
      '<rect x="33" y="13" width="30" height="26" rx="8" fill="#26282C"/>'+
      '<circle cx="42" cy="21" r="5.4" fill="#0B0C0E" stroke="#8A8E94" stroke-width="1.6"/>'+
      '<circle cx="54" cy="21" r="5.4" fill="#0B0C0E" stroke="#8A8E94" stroke-width="1.6"/>'+
      '<circle cx="42" cy="32" r="5.4" fill="#0B0C0E" stroke="#8A8E94" stroke-width="1.6"/>'+
      '<circle cx="42" cy="21" r="2.1" fill="#3E6FA8"/><circle cx="54" cy="21" r="2.1" fill="#3E6FA8"/>'+
      '<circle cx="42" cy="32" r="2.1" fill="#3E6FA8"/>'+
      '<circle cx="55" cy="33" r="2.6" fill="#C9CDD2"/>'+
      '<rect x="44" y="60" width="12" height="15" rx="2.6" fill="rgba(255,255,255,.18)"/>'+
      '<rect x="30" y="16" width="2.6" height="60" rx="1.3" fill="rgba(255,255,255,.3)"/>',
      '<defs><linearGradient id="ig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9AA0A8"/><stop offset="35%" stop-color="#5E636B"/><stop offset="70%" stop-color="#7E848D"/><stop offset="100%" stop-color="#43474D"/></linearGradient></defs>'
    );
  },

  /* Cash — banded stack of notes */
  cash: function(){
    return svg(
      '<g transform="rotate(-8 50 56)">'+
        '<rect x="16" y="62" width="68" height="16" rx="3" fill="#1D6B3A"/>'+
        '<rect x="16" y="52" width="68" height="16" rx="3" fill="#25823F"/>'+
        '<rect x="16" y="42" width="68" height="16" rx="3" fill="#2E9A4A"/>'+
        '<rect x="16" y="28" width="68" height="20" rx="3" fill="#3CB35A"/>'+
        '<rect x="19" y="31" width="62" height="14" rx="2" fill="none" stroke="#1D6B3A" stroke-width="1.4"/>'+
        '<circle cx="50" cy="38" r="6.4" fill="#D6F5DE"/>'+
        '<text x="50" y="42" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="9" fill="#1D6B3A">$</text>'+
        '<rect x="40" y="24" width="20" height="58" rx="2" fill="#E0B23C"/>'+
        '<rect x="40" y="24" width="20" height="58" rx="2" fill="none" stroke="#A97D14" stroke-width="1.2"/>'+
      '</g>'
    );
  },

  /* Ferrari — red mid-engine wedge, profile */
  ferrari: function(){
    return svg(
      '<g transform="translate(0,6)">'+
        '<path d="M8 60c0-6 5-9 12-10l12-13c5-5 12-8 21-8h10c11 0 20 5 26 13l5 7c4 2 4 10-2 11H12c-3 0-4-4-4-6z" fill="url(#fg)"/>'+
        '<path d="M37 40c4-4 9-6 15-6h8c7 0 13 3 17 8H35z" fill="#1A2733"/>'+
        '<path d="M14 54h72" stroke="rgba(0,0,0,.2)" stroke-width="2"/>'+
        '<path d="M20 48c14-4 46-4 60 0" stroke="rgba(255,255,255,.35)" stroke-width="2.4" fill="none" stroke-linecap="round"/>'+
        '<circle cx="29" cy="62" r="11" fill="#141414"/><circle cx="29" cy="62" r="5" fill="#C8CDD4"/>'+
        '<circle cx="73" cy="62" r="11" fill="#141414"/><circle cx="73" cy="62" r="5" fill="#C8CDD4"/>'+
        '<rect x="46" y="46" width="9" height="11" rx="1.6" fill="#FFE04A"/>'+
        '<path d="M50 48l-1.6 6h2.4l-.6 3.4 2.6-4.8h-2z" fill="#111"/>'+
      '</g>',
      '<defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF3A2B"/><stop offset="55%" stop-color="#D8140A"/><stop offset="100%" stop-color="#8E0703"/></linearGradient></defs>'
    );
  },

  /* Dom Pérignon — dark green bottle, gold foil and shield */
  dom: function(){
    return svg(
      '<path d="M44 10h12v9c0 4 2 6 4 9 4 5 6 10 6 17v40a5 5 0 0 1-5 5H39a5 5 0 0 1-5-5V45c0-7 2-12 6-17 2-3 4-5 4-9z" fill="url(#dg)"/>'+
      '<path d="M44 10h12v9c0 4 2 6 4 9 4 5 6 10 6 17v40a5 5 0 0 1-5 5H39a5 5 0 0 1-5-5V45c0-7 2-12 6-17 2-3 4-5 4-9z" fill="none" stroke="#0B2A18" stroke-width="2"/>'+
      '<path d="M43 8h14v15H43z" fill="#E7B63C"/>'+
      '<path d="M42 22h16v7H42z" fill="#C3901F"/>'+
      '<path d="M50 44l13 4v11c0 9-6 15-13 18-7-3-13-9-13-18V48z" fill="#F0CE72"/>'+
      '<path d="M50 44l13 4v11c0 9-6 15-13 18-7-3-13-9-13-18V48z" fill="none" stroke="#8E6510" stroke-width="1.6"/>'+
      '<text x="50" y="60" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="12" fill="#2C4A22">DP</text>'+
      '<path d="M41 64h18" stroke="#2C4A22" stroke-width="1.6"/>'+
      '<rect x="37" y="34" width="3.4" height="48" rx="1.7" fill="rgba(255,255,255,.22)"/>',
      '<defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2F6B38"/><stop offset="45%" stop-color="#14401F"/><stop offset="100%" stop-color="#285E30"/></linearGradient></defs>'
    );
  },

  /* Scatter — dopamine molecule: catechol ring, OH groups, ethylamine tail */
  scatter: function(){
    var ring = "M50 24 L69 35 L69 57 L50 68 L31 57 L31 35 Z";
    return svg(
      '<circle cx="50" cy="50" r="44" fill="url(#sg)"/>'+
      '<path d="'+ring+'" fill="none" stroke="#29E8DE" stroke-width="5" stroke-linejoin="round"/>'+
      '<path d="M53 31 L64 37 M64 52 L53 59 M36 52 L36 39" fill="none" stroke="#29E8DE" stroke-width="2.6"/>'+
      '<path d="M31 35 L14 26 M31 57 L14 66" stroke="#FF2D87" stroke-width="4.6" stroke-linecap="round"/>'+
      '<circle cx="12" cy="24" r="6.4" fill="#FF2D87"/><circle cx="12" cy="68" r="6.4" fill="#FF2D87"/>'+
      '<path d="M69 35 L83 27 L94 34" fill="none" stroke="#B8FF3C" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<circle cx="95" cy="35" r="6.4" fill="#B8FF3C"/>'+
      '<text x="12" y="27" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="7" fill="#2A0716">OH</text>'+
      '<text x="12" y="71" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="7" fill="#2A0716">OH</text>'+
      '<text x="95" y="38" text-anchor="middle" font-family="Archivo,Arial" font-weight="800" font-size="7" fill="#132A03">N</text>',
      '<defs><radialGradient id="sg" cx="50%" cy="46%"><stop offset="0" stop-color="rgba(41,232,222,.34)"/><stop offset="70%" stop-color="rgba(255,45,135,.16)"/><stop offset="100%" stop-color="rgba(255,45,135,0)"/></radialGradient></defs>'
    );
  }
};

/* SVG gradient ids must be unique per instance or browsers reuse the
   first definition. Render, then suffix every id with a counter. */
let artCounter = 0;
export function renderSymbol(id) {
  const fn = ART[id];
  if (!fn) return "";
  const n = ++artCounter;
  return fn().replace(/id="(\w+)"/g, 'id="$1_' + n + '"').replace(/url\(#(\w+)\)/g, "url(#$1_" + n + ")");
}
