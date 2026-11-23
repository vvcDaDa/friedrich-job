/* ========== 矢量美术：Friedrich 头像 / 城市天际线 ========== */
const Art = {
  avatar(expr = 'normal') {
    const skin = '#f8d6bf', skinD = '#ebbda3', hair = '#f2c25c', hairD = '#d69c35';
    const ink = '#2b2b3d';
    const eyeDots = `<ellipse cx="48" cy="64" rx="3.4" ry="4.2" fill="${ink}"/><ellipse cx="72" cy="64" rx="3.4" ry="4.2" fill="${ink}"/>
      <circle cx="49.3" cy="62.4" r="1.2" fill="#fff"/><circle cx="73.3" cy="62.4" r="1.2" fill="#fff"/>`;
    const S = `fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`;
    const parts = {
      normal: {
        eyes: eyeDots,
        brows: `<path d="M41 52 q7 -3.5 14 0" ${S}/><path d="M65 52 q7 -3.5 14 0" ${S}/>`,
        mouth: `<path d="M53 79 q7 5 14 0" ${S}/>`
      },
      happy: {
        eyes: `<path d="M43.5 65 q4.5 -6 9 0" ${S}/><path d="M67.5 65 q4.5 -6 9 0" ${S}/>`,
        brows: `<path d="M41 50 q7 -4 14 0" ${S}/><path d="M65 50 q7 -4 14 0" ${S}/>`,
        mouth: `<path d="M51 76 q9 12 18 0 z" fill="#c4524f" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/><path d="M55 80.5 q5 3 10 0" fill="#ff8f8a"/>`,
        extra: `<ellipse cx="41" cy="74" rx="5" ry="3" fill="#ff9c9c" opacity=".55"/><ellipse cx="79" cy="74" rx="5" ry="3" fill="#ff9c9c" opacity=".55"/>`
      },
      sad: {
        eyes: `<ellipse cx="48" cy="66" rx="3" ry="3.6" fill="${ink}"/><ellipse cx="72" cy="66" rx="3" ry="3.6" fill="${ink}"/>`,
        brows: `<path d="M41 55 L55 51" ${S}/><path d="M65 51 L79 55" ${S}/>`,
        mouth: `<path d="M53 82 q7 -6 14 0" ${S}/>`,
        extra: `<path d="M45 71 q-3 6 0 8 q3 -2 0 -8z" fill="#7cc8ff"/>`
      },
      shock: {
        eyes: `<circle cx="48" cy="64" r="5.4" fill="#fff" stroke="${ink}" stroke-width="2"/><circle cx="72" cy="64" r="5.4" fill="#fff" stroke="${ink}" stroke-width="2"/>
          <circle cx="48" cy="64" r="2" fill="${ink}"/><circle cx="72" cy="64" r="2" fill="${ink}"/>`,
        brows: `<path d="M41 47 q7 -5 14 -1" ${S}/><path d="M65 46 q7 -4 14 1" ${S}/>`,
        mouth: `<ellipse cx="60" cy="81" rx="4.5" ry="5.5" fill="#7a3434" stroke="${ink}" stroke-width="2"/>`,
        extra: `<path d="M86 46 q4 5 0 9 q-4 -4 0 -9z" fill="#9fd8ff"/>`
      },
      tired: {
        eyes: `<path d="M43.5 65 h9" ${S}/><path d="M67.5 65 h9" ${S}/>
          <path d="M44 70 q4 2 8 0" fill="none" stroke="#b58a9a" stroke-width="1.6"/><path d="M68 70 q4 2 8 0" fill="none" stroke="#b58a9a" stroke-width="1.6"/>`,
        brows: `<path d="M41 54 q7 -2 14 1" ${S}/><path d="M65 55 q7 -3 14 -1" ${S}/>`,
        mouth: `<path d="M54 81 q6 -2 12 0" ${S}/>`,
        extra: `<path d="M84 50 q4 5 0 9 q-4 -4 0 -9z" fill="#9fd8ff"/>`
      },
      determined: {
        eyes: eyeDots,
        brows: `<path d="M41 50 L55 54" ${S}/><path d="M65 54 L79 50" ${S}/>`,
        mouth: `<path d="M52 78 q8 6 16 -1" ${S}/>`
      },
      worried: {
        eyes: eyeDots,
        brows: `<path d="M41 54 L55 50" ${S}/><path d="M65 50 L79 54" ${S}/>`,
        mouth: `<path d="M52 81 q3 -3 5 0 q3 3 5 0 q3 -3 5 0" ${S}/>`
      }
    };
    const p = parts[expr] || parts.normal;
    return `<svg class="ava" viewBox="0 0 120 120" aria-label="Friedrich">
      <path d="M18 122 q4 -30 42 -31 q38 1 42 31z" fill="#4f6cf5"/>
      <path d="M44 93 q16 10 32 0 l-4 -4 q-12 6 -24 0z" fill="#3b55d6"/>
      <path d="M50 92 l10 12 l10 -12" fill="#f4f4ff"/>
      <rect x="53" y="80" width="14" height="15" rx="6" fill="${skinD}"/>
      <circle cx="33" cy="66" r="6.5" fill="${skin}"/><circle cx="87" cy="66" r="6.5" fill="${skin}"/>
      <ellipse cx="60" cy="62" rx="27" ry="28.5" fill="${skin}"/>
      <path d="M31 63 q-6 -33 24 -37 q6 -9 17 -4 q22 4 19 39 q-5 -14 -15 -17 q-3 7 -15 7 q-11 0 -13 -7 q-12 6 -17 19z" fill="${hair}"/>
      <path d="M56 26 q-4 -9 4 -12 q-1 6 5 9z" fill="${hairD}"/>
      <path d="M60 30 q-6 12 -20 12" fill="none" stroke="${hairD}" stroke-width="2" stroke-linecap="round"/>
      ${p.extra || ''}
      ${p.eyes}
      <g fill="none" stroke="#3b3b52" stroke-width="2.2"><circle cx="48" cy="64" r="8.5"/><circle cx="72" cy="64" r="8.5"/><path d="M56.5 63 q3.5 -2 7 0"/><path d="M39.5 62 l-6 -2"/><path d="M80.5 62 l6 -2"/></g>
      ${p.brows}
      <path d="M59 70 q-2 4 1.5 4.5" fill="none" stroke="${skinD}" stroke-width="2" stroke-linecap="round"/>
      ${p.mouth}
    </svg>`;
  },

  /* 简单伪随机，保证天际线每次一样 */
  _rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; },

  skyline(night = true, seed = 7) {
    const r = this._rng(seed);
    let back = '', front = '', win = '';
    let x = -10;
    while (x < 1210) {
      const w = 40 + r() * 70, h = 90 + r() * 170;
      back += `<rect x="${x}" y="${300 - h - 40}" width="${w}" height="${h + 40}" class="b-back"/>`;
      x += w + 4;
    }
    x = -20;
    while (x < 1220) {
      const w = 55 + r() * 90, h = 60 + r() * 150;
      front += `<rect x="${x}" y="${300 - h}" width="${w}" height="${h}" class="b-front"/>`;
      if (r() < .3) front += `<rect x="${x + w / 2 - 2}" y="${300 - h - 18}" width="3" height="18" class="b-front"/>`;
      for (let wy = 300 - h + 12; wy < 290; wy += 16) {
        for (let wx = x + 8; wx < x + w - 10; wx += 13) {
          if (r() < (night ? .32 : .12)) win += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="6" height="8" class="win"/>`;
        }
      }
      x += w + 6;
    }
    return `<svg class="skyline" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice">${back}${front}${win}</svg>`;
  },

  stars(n = 50) {
    let s = '';
    for (let i = 0; i < n; i++) {
      s += `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 60).toFixed(1)}%;animation-delay:${(Math.random() * 4).toFixed(2)}s;transform:scale(${(.4 + Math.random() * .8).toFixed(2)})"></i>`;
    }
    return `<div class="stars">${s}</div>`;
  },

  npc(emoji, color = '#5b8cff') {
    return `<div class="npc-ava" style="--c:${color}">${emoji}</div>`;
  }
};
