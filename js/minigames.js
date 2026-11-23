/* ========== 打工小游戏 ========== */
const Mini = {};

/* 通用外壳：说明 → 倒计时 → 游戏 → 下班 */
Mini.run = function (def) {
  return new Promise(resolve => {
    const ov = el(`
      <div class="mini-ov">
        <div class="mini" style="--jc:${def.color}">
          <header class="mini-head">
            <div class="mh-title">${def.icon} ${def.title}</div>
            <div class="mh-score"></div>
            <div class="mh-time"><div class="mh-bar"><i></i></div><span>${def.duration}s</span></div>
          </header>
          <div class="mini-area"></div>
        </div>
      </div>`);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('in'));
    const area = $('.mini-area', ov);
    const bar = $('.mh-bar i', ov), tEl = $('.mh-time span', ov);
    let game, last, elapsed = 0, raf, ended = false, lastSec = -1;

    const api = {
      score(html) { $('.mh-score', ov).innerHTML = html; },
      end() { finish(); },
      get elapsed() { return elapsed; },
      float(text, x, y, color = '#fff') {
        const f = el(`<div class="fx" style="left:${x}px;top:${y}px;color:${color}">${text}</div>`);
        area.appendChild(f);
        setTimeout(() => f.remove(), 1000);
      },
      floatAt(node, text, color) {
        const a = area.getBoundingClientRect(), r = node.getBoundingClientRect();
        api.float(text, r.left - a.left + r.width / 2, r.top - a.top, color);
      }
    };

    area.innerHTML = `
      <div class="mini-intro">
        <div class="mi-icon">${def.icon}</div>
        <h2>${def.title}</h2>
        <ul>${def.howto.map(x => `<li>${x}</li>`).join('')}</ul>
        <button class="btn primary big">开工！</button>
      </div>`;
    $('.btn', area).onclick = async () => {
      SFX.click();
      area.innerHTML = '<div class="countdown"></div>';
      const cd = $('.countdown', area);
      for (const t of ['3', '2', '1', '开工！']) {
        cd.innerHTML = `<span>${t}</span>`;
        t.length > 1 ? SFX.good() : SFX.tick();
        await wait(t.length > 1 ? 500 : 620);
      }
      start();
    };

    function start() {
      area.innerHTML = '';
      game = def.create(area, api);
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
    function loop(now) {
      if (ended) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += dt;
      const left = Math.max(0, def.duration - elapsed);
      bar.style.width = (left / def.duration * 100) + '%';
      bar.classList.toggle('low', left < 10);
      const sec = Math.ceil(left);
      tEl.textContent = sec + 's';
      if (sec !== lastSec) { if (sec <= 5 && sec > 0) SFX.tick(); lastSec = sec; }
      game.tick && game.tick(dt, elapsed);
      if (left <= 0) return finish();
      raf = requestAnimationFrame(loop);
    }
    async function finish() {
      if (ended) return;
      ended = true;
      cancelAnimationFrame(raf);
      const r = game.result();
      game.cleanup && game.cleanup();
      const o = el('<div class="mini-done"><span>下班！</span></div>');
      area.appendChild(o);
      SFX.good();
      await wait(1300);
      ov.classList.remove('in');
      setTimeout(() => ov.remove(), 300);
      resolve(r);
    }
  });
};

/* ---------------------------------------------------------------
   1. 奶茶店
--------------------------------------------------------------- */
const TEA = {
  bases: [
    { id: 'black', name: '红茶', color: '#a34f27' },
    { id: 'green', name: '绿茶', color: '#a8c65a' },
    { id: 'oolong', name: '乌龙', color: '#d89a45' },
    { id: 'milk', name: '鲜奶', color: '#f3e7d3' }
  ],
  tops: [
    { id: 'pearl', name: '珍珠', color: '#2e1d16' },
    { id: 'coco', name: '椰果', color: '#f8f5ea' },
    { id: 'pudding', name: '布丁', color: '#f5c64f' },
    { id: 'taro', name: '芋圆', color: '#a586dc' },
    { id: 'none', name: '不加料', color: null }
  ],
  ice: [{ id: 0, name: '去冰' }, { id: 1, name: '少冰' }, { id: 2, name: '正常冰' }]
};

function cupSVG(s) {
  const base = TEA.bases.find(b => b.id === s.base);
  const top = TEA.tops.find(t => t.id === s.top);
  let tops = '', ice = '';
  if (top && top.color) {
    const pos = [[44, 146], [58, 148], [72, 147], [86, 146], [97, 144], [51, 137], [65, 139], [79, 138], [91, 136], [60, 130], [76, 129]];
    tops = pos.map(([x, y]) => top.id === 'coco'
      ? `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2" fill="${top.color}" stroke="#d9d4c3" stroke-width="1"/>`
      : top.id === 'pudding' ? `<rect x="${x - 6}" y="${y - 4}" width="12" height="8" rx="3" fill="${top.color}"/>`
      : `<circle cx="${x}" cy="${y}" r="5.5" fill="${top.color}"/>`).join('');
  }
  const cubes = [[50, 52, -12], [78, 58, 15], [62, 70, 8], [88, 76, -20]];
  const n = s.ice == null ? 0 : [0, 2, 4][s.ice];
  ice = cubes.slice(0, n).map(([x, y, r]) => `<rect x="${x}" y="${y}" width="17" height="17" rx="4" transform="rotate(${r} ${x + 8} ${y + 8})" fill="#fff" opacity=".55" stroke="#fff"/>`).join('');
  const ready = base && top && s.ice != null;
  return `<svg viewBox="0 0 140 180" class="cup-svg">
    <defs><clipPath id="cupclip"><path d="M24 30 L116 30 L104 160 Q103 166 96 166 L44 166 Q37 166 36 160 Z"/></clipPath></defs>
    ${ready ? '<rect x="80" y="2" width="9" height="70" rx="3" fill="#ff7a59" transform="rotate(12 84 40)"/>' : ''}
    <g clip-path="url(#cupclip)">
      <rect x="0" y="0" width="140" height="180" fill="rgba(255,255,255,.08)"/>
      ${base ? `<rect x="0" y="44" width="140" height="140" fill="${base.color}" class="liquid"/><rect x="0" y="44" width="140" height="6" fill="#fff" opacity=".18"/>` : ''}
      ${ice}${tops}
    </g>
    <path d="M24 30 L116 30 L104 160 Q103 166 96 166 L44 166 Q37 166 36 160 Z" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="3"/>
    <rect x="18" y="24" width="104" height="9" rx="4" fill="rgba(255,255,255,.85)"/>
    <text x="70" y="120" text-anchor="middle" font-size="12" fill="rgba(0,0,0,.25)" font-weight="700">${base ? '' : '空杯'}</text>
  </svg>`;
}

Mini.tea = () => Mini.run({
  title: '奶茶店', icon: '🧋', color: '#ff9f6e', duration: 70,
  howto: [
    '顾客在左侧排队，<b>只能服务最前面</b>（高亮）的顾客',
    '按订单选择 <b>茶底 · 小料 · 冰量</b>，然后点「出杯」',
    '越早出杯小费越多，连续做对有连击奖励',
    '键盘：<kbd>1-4</kbd> 茶底 <kbd>Q-T</kbd> 小料 <kbd>A S D</kbd> 冰量 <kbd>空格</kbd> 出杯'
  ],
  create(area, api) {
    const faces = ['👩', '🧑', '👨', '👵', '👦', '👧', '🧔', '👩‍🦰', '👨‍🦱', '🧑‍🎓', '👩‍💼', '👴', '🧕', '👱‍♀️'];
    const keys = { base: ['1', '2', '3', '4'], top: ['q', 'w', 'e', 'r', 't'], ice: ['a', 's', 'd'] };
    area.innerHTML = `
      <div class="tea">
        <div class="tea-queue"></div>
        <div class="tea-work">
          <div class="tea-cup"></div>
          <div class="tea-ctrl">
            <div class="tc-row" data-k="base"><label>茶底</label><div>${TEA.bases.map((b, i) => `<button class="chip" data-v="${b.id}"><i style="background:${b.color}"></i>${b.name}<kbd>${keys.base[i]}</kbd></button>`).join('')}</div></div>
            <div class="tc-row" data-k="top"><label>小料</label><div>${TEA.tops.map((t, i) => `<button class="chip" data-v="${t.id}">${t.color ? `<i style="background:${t.color}"></i>` : ''}${t.name}<kbd>${keys.top[i].toUpperCase()}</kbd></button>`).join('')}</div></div>
            <div class="tc-row" data-k="ice"><label>冰量</label><div>${TEA.ice.map((c, i) => `<button class="chip" data-v="${c.id}">🧊 ${c.name}<kbd>${keys.ice[i].toUpperCase()}</kbd></button>`).join('')}</div></div>
            <div class="tc-act"><button class="btn ghost" data-act="dump">🗑 倒掉</button><button class="btn primary" data-act="serve">✓ 出杯 <kbd>空格</kbd></button></div>
          </div>
        </div>
      </div>`;
    const qEl = $('.tea-queue', area), cupEl = $('.tea-cup', area);
    let sel = { base: null, top: null, ice: null };
    let queue = [], uid = 0, nextSpawn = 0.3;
    let served = 0, wrong = 0, missed = 0, earn = 0, combo = 0, tips = 0, best = 0;

    const nameOf = (k, v) => (k === 'base' ? TEA.bases : k === 'top' ? TEA.tops : TEA.ice).find(x => String(x.id) === String(v)).name;
    const orderHTML = o => `<span>${nameOf('base', o.base)}</span><span>${nameOf('top', o.top)}</span><span>${nameOf('ice', o.ice)}</span>`;

    function renderSel() {
      $$('.tc-row', area).forEach(row => {
        const k = row.dataset.k;
        $$('.chip', row).forEach(c => c.classList.toggle('on', String(sel[k]) === c.dataset.v));
      });
      cupEl.innerHTML = cupSVG(sel);
    }
    function setSel(k, v) { sel[k] = k === 'ice' ? +v : v; SFX.pop(); renderSel(); }
    function renderQueue() {
      qEl.innerHTML = queue.length ? queue.map((c, i) => `
        <div class="cust ${i === 0 ? 'front' : ''}" data-id="${c.id}">
          <div class="c-face">${c.face}</div>
          <div class="c-order">${orderHTML(c.o)}</div>
          <div class="c-pat"><i></i></div>
        </div>`).join('') : '<div class="tea-empty">暂时没有顾客～</div>';
      updateBars();
    }
    function updateBars() {
      queue.forEach(c => {
        const e = qEl.querySelector(`[data-id="${c.id}"] .c-pat i`);
        if (!e) return;
        const r = Math.max(0, c.p / c.max);
        e.style.width = r * 100 + '%';
        e.style.background = r > .5 ? 'var(--teal)' : r > .25 ? 'var(--gold)' : 'var(--red)';
      });
    }
    function updScore() { api.score(`☕ ${served}　💰 ¥${earn}${combo > 1 ? `　<span class="combo">连击 ×${combo}</span>` : ''}`); }
    function spawn() {
      const o = { base: pick(TEA.bases).id, top: pick(TEA.tops).id, ice: rand(0, 2) };
      const max = rand(21, 27);
      queue.push({ id: ++uid, face: pick(faces), o, p: max, max });
      renderQueue();
    }
    function serve() {
      if (!queue.length) { api.floatAt(cupEl, '还没有顾客', '#ccc'); return; }
      if (sel.base == null || sel.top == null || sel.ice == null) { api.floatAt(cupEl, '还没做完哦', '#ffcc4d'); SFX.bad(); return; }
      const c = queue[0];
      const ok = c.o.base === sel.base && c.o.top === sel.top && c.o.ice === sel.ice;
      if (ok) {
        combo++; best = Math.max(best, combo);
        const tip = Math.round(6 * c.p / c.max) + Math.min(combo - 1, 5);
        earn += 12 + tip; tips += tip; served++;
        SFX.coin();
        api.floatAt(cupEl, `+¥${12 + tip}`, '#7dffb0');
      } else {
        combo = 0; wrong++;
        SFX.bad();
        api.floatAt(cupEl, '😠 不是我点的！', '#ff6b81');
      }
      queue.shift();
      sel = { base: null, top: null, ice: null };
      renderSel(); renderQueue(); updScore();
    }

    $$('.tc-row', area).forEach(row => $$('.chip', row).forEach(c => c.onclick = () => setSel(row.dataset.k, c.dataset.v)));
    $('[data-act=serve]', area).onclick = serve;
    $('[data-act=dump]', area).onclick = () => { sel = { base: null, top: null, ice: null }; SFX.whoosh(); renderSel(); };
    const onKey = e => {
      const k = e.key.toLowerCase();
      if (k === ' ') { e.preventDefault(); serve(); return; }
      for (const g of ['base', 'top', 'ice']) {
        const i = keys[g].indexOf(k);
        if (i >= 0) {
          const list = g === 'base' ? TEA.bases : g === 'top' ? TEA.tops : TEA.ice;
          setSel(g, list[i].id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    renderSel(); renderQueue(); updScore();

    return {
      tick(dt, t) {
        nextSpawn -= dt;
        if (nextSpawn <= 0 && queue.length < 4) {
          spawn();
          nextSpawn = Math.max(3.4, rand(55, 80) / 10 - t * 0.035);
        }
        queue.forEach(c => (c.p -= dt));
        const gone = queue.filter(c => c.p <= 0);
        if (gone.length) {
          missed += gone.length;
          queue = queue.filter(c => c.p > 0);
          combo = 0;
          SFX.bad();
          api.float('😤 等太久，走了', 70, 40, '#ff6b81');
          renderQueue(); updScore();
        } else updateBars();
      },
      result() {
        const total = served + wrong + missed;
        return {
          earn: 100 + earn,
          quality: total ? served / total * Math.min(1, served / 8) : 0,
          lines: [`底薪 ¥100 · 提成与小费 ¥${earn}`, `完成 ${served} 杯（最高连击 ${best}）`, `做错 ${wrong} 杯 · 等跑 ${missed} 位顾客`],
          stat: { served }
        };
      },
      cleanup() { window.removeEventListener('keydown', onKey); }
    };
  }
});

/* ---------------------------------------------------------------
   2. 发传单
--------------------------------------------------------------- */
Mini.flyer = () => Mini.run({
  title: '街头发传单', icon: '📄', color: '#7bd88f', duration: 45,
  howto: [
    '点击经过的路人递传单，目标 <b>30 张</b>',
    '头上有 <b>👀</b> 的人一定会接；普通路人可能会拒绝',
    '<b>📱 / ⏰</b> 赶时间的人别去打扰，会被嫌弃',
    '<b>👮 保安</b> 千万别凑上去，会被赶走一会儿！'
  ],
  create(area, api) {
    area.innerHTML = `
      <div class="street">
        <div class="st-shop">${Art.skyline(false, 3)}</div>
        <div class="st-walk"></div>
        <div class="st-hud">📄 已发 <b>0</b> / 30</div>
        <div class="st-stun">🚫 被保安赶走了……</div>
      </div>`;
    const st = $('.street', area), cnt = $('.st-hud b', area);
    const lanes = [0.52, 0.70, 0.90], sizes = [50, 60, 72];
    let peds = [], spawnT = 0, given = 0, annoyed = 0, guardHits = 0, refused = 0, stun = 0;

    function spawn() {
      const W = st.clientWidth, H = st.clientHeight;
      const r = Math.random();
      let type = r < .3 ? 'keen' : r < .7 ? 'neutral' : r < .92 ? 'busy' : 'guard';
      if (type === 'guard' && peds.some(p => p.type === 'guard')) type = 'neutral';
      const dir = Math.random() < .5 ? 1 : -1;
      const lane = rand(0, 2);
      const speed = type === 'busy' ? rand(150, 210) : type === 'guard' ? 60 : rand(65, 115);
      const emo = type === 'busy' ? pick(['🏃', '🏃‍♀️']) : type === 'guard' ? '👮' : pick(['🚶', '🚶‍♀️', '🚶‍♂️']);
      const bubble = { keen: '👀', busy: pick(['📱', '⏰']), guard: '🚫', neutral: '' }[type];
      const e = el(`<div class="ped ${type}" style="font-size:${sizes[lane]}px;z-index:${lane + 2}"><span class="ped-b">${bubble}</span><span class="ped-e" style="transform:scaleX(${dir > 0 ? -1 : 1})">${emo}</span></div>`);
      const p = { e, type, x: dir > 0 ? -60 : W + 60, y: lanes[lane] * H, v: speed * dir * (W / 800 + .3), done: false };
      e.addEventListener('pointerdown', ev => { ev.preventDefault(); hit(p); });
      st.appendChild(e);
      peds.push(p);
    }
    function react(p, b, text, color) {
      $('.ped-b', p.e).textContent = b;
      p.e.classList.add('reacted');
      api.float(text, p.x, p.y - 70, color);
    }
    function hit(p) {
      if (p.done || stun > 0) return;
      p.done = true;
      if (p.type === 'keen' || (p.type === 'neutral' && Math.random() < .42)) {
        given++; SFX.coin(); react(p, '😊', '+1', '#7dffb0');
        p.e.classList.add('got');
      } else if (p.type === 'neutral') {
        refused++; SFX.tone(300, .1, 'triangle', .06); react(p, '🙅', '不用了', '#ddd');
      } else if (p.type === 'busy') {
        annoyed++; SFX.bad(); react(p, '😒', '别挡道！', '#ff6b81');
      } else {
        guardHits++; SFX.alarm(); react(p, '😠', '这里不准发传单！', '#ff6b81');
        stun = 2.2; st.classList.add('stun');
      }
      cnt.textContent = given;
      api.score(`📄 ${given}　😒 ${annoyed}`);
    }
    api.score('📄 0　😒 0');
    return {
      tick(dt) {
        spawnT -= dt;
        if (spawnT <= 0) { spawn(); spawnT = rand(42, 80) / 100; }
        if (stun > 0) { stun -= dt; if (stun <= 0) st.classList.remove('stun'); }
        const W = st.clientWidth;
        peds.forEach(p => { p.x += p.v * dt; p.e.style.transform = `translate(${p.x}px, ${p.y}px)`; });
        peds = peds.filter(p => {
          const out = p.x < -90 || p.x > W + 90;
          if (out) p.e.remove();
          return !out;
        });
      },
      result() {
        const bonus = given >= 30 ? 40 : 0;
        return {
          earn: Math.max(40, 70 + given * 5 + bonus - guardHits * 10),
          quality: clamp(given / 30, 0, 1) * (annoyed > 3 ? .8 : 1),
          lines: [`底薪 ¥70 · 每张 ¥5 · 共发出 ${given} 张`, bonus ? '🎯 达成目标奖励 ¥40' : '未达到 30 张目标', `招人烦 ${annoyed} 次 · 被保安赶 ${guardHits} 次${guardHits ? `（扣 ¥${guardHits * 10}）` : ''}`],
          moodAdj: -annoyed
        };
      }
    };
  }
});

/* ---------------------------------------------------------------
   3. 便利店夜班
--------------------------------------------------------------- */
const GOODS = [
  ['🍙', '饭团', 65], ['🥤', '可乐', 35], ['🍜', '泡面', 50], ['🍫', '巧克力', 85], ['🥛', '牛奶', 45],
  ['🍞', '面包', 70], ['🧃', '果汁', 60], ['🍪', '饼干', 95], ['🌭', '烤肠', 40], ['🍢', '关东煮', 120],
  ['🍺', '啤酒', 80], ['🧻', '纸巾', 25], ['🔋', '电池', 150], ['🍦', '冰淇淋', 100], ['☕', '咖啡', 115], ['🥚', '茶叶蛋', 20]
];
const fy = j => '¥' + (j % 10 ? (j / 10).toFixed(1) : j / 10);

Mini.cashier = () => Mini.run({
  title: '便利店夜班', icon: '🏪', color: '#6ea8ff', duration: 80,
  howto: [
    '点击柜台上的商品逐个 <b>扫码</b>',
    '顾客付现金时，点下方钱币 <b>凑出正确找零</b>，再点「找零」',
    '找多了要从工资里扣！找少了顾客会不高兴',
    '扫码支付的顾客最省事～'
  ],
  create(area, api) {
    const faces = ['🧑‍💻', '👷', '🧑‍🍳', '👩‍⚕️', '🧔', '👨‍🎤', '👩‍🎓', '🕵️', '🧑‍🔧', '👵'];
    const lines = ['加班到现在，饿死了……', '老板，就这些。', '快点快点，末班车要走了！', '（打了个哈欠）', '有热水吗？算了就这些。', '明天还要早起……', '嗯……'];
    const denoms = [500, 200, 100, 50, 10, 5];
    area.innerHTML = `
      <div class="shop">
        <div class="shop-top">
          <div class="cust-big"><div class="cb-face"></div><div class="cb-say"></div></div>
          <div class="pos"><div class="pos-head">🏪 24h 便利店 · POS</div><div class="pos-lines"></div><div class="pos-total">合计 <b>¥0</b></div><div class="pos-paid"></div></div>
        </div>
        <div class="counter"></div>
        <div class="till">
          <div class="tray"><span>找零：</span><div class="tray-coins"></div><b class="tray-sum">¥0</b></div>
          <div class="denoms">${denoms.map(d => `<button class="money m${d}" data-d="${d}">${fy(d)}</button>`).join('')}</div>
          <div class="till-act"><button class="btn ghost" data-a="undo">↶ 撤回</button><button class="btn primary" data-a="give">💵 找零</button></div>
        </div>
      </div>`;
    const q = s => $(s, area);
    let cust = null, ok = 0, bad = 0, qr = 0, earn = 0, deduct = 0, combo = 0, tray = [], phase = 'none';

    function setTill(on) { q('.till').classList.toggle('off', !on); }
    function renderTray() {
      q('.tray-coins').innerHTML = tray.map(d => `<span class="mini-money m${d}">${fy(d)}</span>`).join('');
      q('.tray-sum').textContent = fy(tray.reduce((a, b) => a + b, 0));
    }
    function updScore() { api.score(`🧾 ${ok + qr}　💰 ¥${earn}${deduct ? `　<span class="neg">-¥${deduct}</span>` : ''}`); }
    function newCustomer() {
      const items = shuffle(GOODS).slice(0, rand(2, 4));
      cust = { items, total: 0, scanned: 0, face: pick(faces) };
      phase = 'scan'; tray = []; renderTray(); setTill(false);
      q('.cb-face').textContent = cust.face;
      q('.cust-big').classList.remove('leave'); void q('.cust-big').offsetWidth; q('.cust-big').classList.add('enter');
      q('.cb-say').textContent = pick(lines);
      q('.pos-lines').innerHTML = '';
      q('.pos-total b').textContent = '¥0';
      q('.pos-paid').innerHTML = '';
      q('.counter').innerHTML = items.map((g, i) => `<button class="good" data-i="${i}"><span>${g[0]}</span><small>${g[1]}</small></button>`).join('');
      $$('.good', area).forEach(b => b.onclick = () => scan(b));
    }
    function scan(b) {
      if (phase !== 'scan' || b.classList.contains('done')) return;
      const g = cust.items[+b.dataset.i];
      b.classList.add('done');
      SFX.beep();
      cust.total += g[2]; cust.scanned++;
      q('.pos-lines').insertAdjacentHTML('beforeend', `<div><span>${g[0]} ${g[1]}</span><span>${fy(g[2])}</span></div>`);
      q('.pos-total b').textContent = fy(cust.total);
      if (cust.scanned === cust.items.length) pay();
    }
    async function pay() {
      phase = 'wait';
      await wait(350);
      if (Math.random() < .3) {
        q('.cb-say').textContent = '我扫码～';
        q('.pos-paid').innerHTML = '📱 扫码支付中…';
        await wait(700);
        if (phase !== 'wait') return;
        SFX.coin();
        q('.pos-paid').innerHTML = '✅ 支付成功';
        qr++; earn += 8; updScore();
        api.floatAt(q('.pos'), '+¥8', '#7dffb0');
        next();
        return;
      }
      const notes = [100, 200, 500, 1000].filter(n => n >= cust.total);
      let paid = notes[0];
      if (Math.random() < .3 && notes[1]) paid = notes[1];
      if (Math.random() < .25 && cust.total % 10 === 5) paid += 5; // 顾客多给五毛凑整
      cust.paid = paid; cust.need = paid - cust.total;
      q('.cb-say').textContent = cust.need === 0 ? '正好，不用找了吧？' : `给你 ${fy(paid)}。`;
      q('.pos-paid').innerHTML = `收现金 <b>${fy(paid)}</b>`;
      SFX.pop();
      phase = 'change'; setTill(true);
    }
    async function next() {
      phase = 'leaving'; setTill(false);
      await wait(650);
      q('.cust-big').classList.add('leave');
      await wait(400);
      newCustomer();
    }
    $$('.money', area).forEach(b => b.onclick = () => { if (phase !== 'change') return; tray.push(+b.dataset.d); SFX.tone(1400, .04, 'triangle', .05); renderTray(); });
    q('[data-a=undo]').onclick = () => { if (phase !== 'change') return; tray.pop(); renderTray(); };
    q('[data-a=give]').onclick = () => {
      if (phase !== 'change') return;
      const sum = tray.reduce((a, b) => a + b, 0);
      if (sum === cust.need) {
        combo++; ok++;
        const g = 18 + Math.min(combo - 1, 5) * 2;
        earn += g;
        SFX.good();
        q('.cb-say').textContent = pick(['谢谢！', '辛苦啦～', '晚安！', '👍']);
        api.floatAt(q('.tray'), `+¥${g}`, '#7dffb0');
        next();
      } else if (sum > cust.need) {
        combo = 0; bad++;
        const d = Math.min(50, Math.round((sum - cust.need) / 10));
        deduct += d;
        SFX.bad();
        q('.cb-say').textContent = '（顾客揣着多找的钱，偷偷溜了）';
        api.floatAt(q('.tray'), `找多了！-¥${d}`, '#ff6b81');
        next();
      } else {
        combo = 0; bad++;
        SFX.bad();
        q('.cb-say').textContent = `还差 ${fy(cust.need - sum)} 呢！`;
        api.floatAt(q('.tray'), '找少了', '#ffcc4d');
      }
      updScore();
    };
    newCustomer(); updScore();
    return {
      result() {
        const tot = ok + qr + bad;
        return {
          earn: Math.max(100, 160 + earn - deduct),
          quality: tot ? (ok + qr) / tot * Math.min(1, (ok + qr) / 8) : 0,
          lines: [`夜班底薪 ¥160 · 提成 ¥${earn}`, `服务顾客 ${ok + qr} 位（现金 ${ok} · 扫码 ${qr}）`, `找错 ${bad} 次${deduct ? ` · 赔钱 ¥${deduct}` : ''}`]
        };
      },
      cleanup() { phase = 'over'; }
    };
  }
});

/* ---------------------------------------------------------------
   4. 外卖骑手
--------------------------------------------------------------- */
/* 外卖参数：用自动寻路机器人实测校准——机器人（反应远超人类）一个班 20-36 单 ≈ ¥250-420，熟练玩家约 ¥200-280 */
const DELIV = {
  interval: 3.0,     // 平常每隔几秒派一单
  rushInterval: 2.0, // 高峰期派单间隔
  rushFrom: 30, rushTo: 65, // 高峰期时间段（秒）
  maxActive: 5,      // 同时最多挂几单
  pay: 8,            // 每单基础配送费
  speedBonus: 3,     // 极速送达最多额外奖励
  rushBonus: 2,      // 高峰补贴
  timeBase: 9, timePer: 0.75, // 每单时限 = timeBase + 距离 × timePer
  penalty: 5,        // 超时罚款
  floor: 60          // 站点保底
};

Mini.delivery = () => Mini.run({
  title: '外卖骑手', icon: '🛵', color: '#ffd166', duration: 90,
  howto: [
    '用 <kbd>方向键</kbd> / <kbd>WASD</kbd> 或屏幕方向键骑车',
    '骑到 <b>餐厅旁边</b> 自动取餐，再骑到 <b>同颜色标记的楼</b> 旁边送达',
    '单子一个接一个来，每单钱不多，<b>超时还要罚款</b>——规划好路线，顺路多带几单',
    '中途会进入 <b>🔥 午高峰</b>：派单更快，每单有高峰补贴',
    '🚧 施工路段无法通行'
  ],
  create(area, api) {
    const N = 9;
    const isRoad = (x, y) => x % 2 === 0 || y % 2 === 0;
    const key = (x, y) => x + ',' + y;
    const colors = ['#ff5d73', '#4dabf7', '#51cf66', '#cc5de8', '#ffa94d', '#22d3ee'];
    let blocked;
    // 生成施工路段并保证道路连通
    for (let tries = 0; tries < 50; tries++) {
      blocked = new Set();
      while (blocked.size < 6) {
        const x = rand(0, N - 1), y = rand(0, N - 1);
        if (isRoad(x, y) && (x % 2) !== (y % 2) && !(x === 4 && y === 4)) blocked.add(key(x, y));
      }
      const seen = new Set([key(4, 4)]), st = [[4, 4]];
      while (st.length) {
        const [cx, cy] = st.pop();
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const nx = cx + dx, ny = cy + dy, k = key(nx, ny);
          if (nx >= 0 && ny >= 0 && nx < N && ny < N && isRoad(nx, ny) && !blocked.has(k) && !seen.has(k)) { seen.add(k); st.push([nx, ny]); }
        });
      }
      let roads = 0;
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if (isRoad(x, y) && !blocked.has(key(x, y))) roads++;
      if (seen.size === roads) break;
    }
    const blds = [];
    for (let y = 1; y < N; y += 2) for (let x = 1; x < N; x += 2) blds.push({ x, y });
    const sb = shuffle(blds);
    const rests = sb.slice(0, 4).map((b, i) => ({ ...b, icon: ['🍔', '🍜', '🧋', '🍕'][i], name: ['汉堡店', '面馆', '奶茶店', '披萨店'][i] }));
    const homes = sb.slice(4).map((b, i) => ({ ...b, icon: i % 3 ? '🏠' : '🏢', no: i + 1 }));

    area.innerHTML = `
      <div class="deliv">
        <div class="map-wrap"><div class="map">
          ${Array.from({ length: N * N }, (_, i) => {
            const x = i % N, y = Math.floor(i / N);
            const r = rests.find(b => b.x === x && b.y === y), h = homes.find(b => b.x === x && b.y === y);
            if (!isRoad(x, y)) return `<div class="cell bld ${r ? 'rest' : ''}" data-k="${key(x, y)}">${r ? r.icon : `${h.icon}<small>${h.no}</small>`}<div class="marks"></div></div>`;
            return `<div class="cell road ${blocked.has(key(x, y)) ? 'block' : ''}">${blocked.has(key(x, y)) ? '🚧' : ''}</div>`;
          }).join('')}
          <div class="scooter"><span>🛵</span></div>
        </div></div>
        <div class="side">
          <div class="orders"></div>
          <div class="dpad">
            <button data-d="up">▲</button><button data-d="left">◀</button><button data-d="down">▼</button><button data-d="right">▶</button>
          </div>
        </div>
      </div>`;
    const sc = $('.scooter', area), scE = $('.scooter span', area);
    const pos = { x: 4, y: 4 };
    let rush = false, orders = [], oid = 0, spawnT = 0.5, delivered = 0, late = 0, earn = 0, penalty = 0, fast = 0;
    const held = [];
    let moveCd = 0;
    const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const adj = (b) => Math.abs(b.x - pos.x) + Math.abs(b.y - pos.y) === 1;
    const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    function place() {
      sc.style.left = (pos.x * 100 / N) + '%';
      sc.style.top = (pos.y * 100 / N) + '%';
    }
    function tryMove(d) {
      const [dx, dy] = DIRS[d];
      const nx = pos.x + dx, ny = pos.y + dy;
      if (dx) scE.style.transform = `scaleX(${dx > 0 ? -1 : 1})`;
      if (nx < 0 || ny < 0 || nx >= N || ny >= N || !isRoad(nx, ny) || blocked.has(key(nx, ny))) {
        sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
        return;
      }
      pos.x = nx; pos.y = ny;
      place(); check();
    }
    function spawnOrder() {
      const r = pick(rests);
      const used = orders.map(o => o.home);
      const free = homes.filter(x => !used.includes(x));
      const far = free.filter(x => dist(r, x) >= 6);
      const h = pick(far.length ? far : free);
      const d = dist(pos, r) + dist(r, h);
      const max = Math.round(DELIV.timeBase + d * DELIV.timePer);
      orders.push({ id: ++oid, rest: r, home: h, state: 'wait', t: max, max, rush, color: colors[oid % colors.length] });
      SFX.msg();
      renderMarks(); renderOrders();
    }
    function check() {
      let ch = false;
      orders.forEach(o => {
        if (o.state === 'wait' && adj(o.rest)) {
          o.state = 'carry'; ch = true; SFX.pop();
          api.floatAt(sc, '取餐！', '#ffd166');
        } else if (o.state === 'carry' && adj(o.home)) {
          o.state = 'done'; ch = true; delivered++;
          const g = DELIV.pay + Math.round(DELIV.speedBonus * o.t / o.max) + (o.rush ? DELIV.rushBonus : 0);
          if (o.t / o.max > .5) fast++;
          earn += g; SFX.coin();
          api.floatAt(sc, `+¥${g}`, '#7dffb0');
        }
      });
      if (ch) { orders = orders.filter(o => o.state !== 'done'); renderMarks(); renderOrders(); updScore(); }
    }
    function renderMarks() {
      $$('.marks', area).forEach(m => (m.innerHTML = ''));
      orders.forEach(o => {
        const rm = $(`[data-k="${key(o.rest.x, o.rest.y)}"] .marks`, area);
        const hm = $(`[data-k="${key(o.home.x, o.home.y)}"] .marks`, area);
        if (o.state === 'wait') rm.insertAdjacentHTML('beforeend', `<i class="mk" style="--oc:${o.color}">${o.id}</i>`);
        hm.insertAdjacentHTML('beforeend', `<i class="mk home ${o.state === 'carry' ? 'hot' : ''}" style="--oc:${o.color}">${o.id}</i>`);
      });
    }
    function renderOrders() {
      $('.orders', area).innerHTML = orders.length ? orders.map(o => `
        <div class="ord ${o.state}" style="--oc:${o.color}" data-id="${o.id}">
          <span class="o-dot">${o.id}</span>
          <div class="o-txt">${o.state === 'wait' ? `去 ${o.rest.icon} ${o.rest.name} 取餐` : `🛵 送往 ${o.home.no} 号楼`}<div class="o-bar"><i></i></div></div>
        </div>`).join('') : '<div class="o-empty">等待派单…</div>';
      updBars();
    }
    function updBars() {
      orders.forEach(o => {
        const b = $(`.ord[data-id="${o.id}"] .o-bar i`, area);
        if (b) { const r = o.t / o.max; b.style.width = r * 100 + '%'; b.style.background = r > .5 ? 'var(--teal)' : r > .25 ? 'var(--gold)' : 'var(--red)'; }
      });
    }
    function updScore() { api.score(`📦 ${delivered}　💰 ¥${earn}${penalty ? `　<span class="neg">-¥${penalty}</span>` : ''}`); }

    const KEYMAP = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };
    const press = d => { if (!held.includes(d)) { held.push(d); tryMove(d); moveCd = 0.2; } };
    const release = d => { const i = held.indexOf(d); if (i >= 0) held.splice(i, 1); };
    const kd = e => { const d = KEYMAP[e.key.toLowerCase()]; if (d) { e.preventDefault(); if (!e.repeat) press(d); } };
    const ku = e => { const d = KEYMAP[e.key.toLowerCase()]; if (d) release(d); };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    $$('.dpad button', area).forEach(b => {
      const d = b.dataset.d;
      b.addEventListener('pointerdown', e => { e.preventDefault(); press(d); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => release(d)));
    });
    place(); renderOrders(); updScore();

    return {
      tick(dt, t) {
        if (held.length) {
          moveCd -= dt;
          if (moveCd <= 0) { tryMove(held[held.length - 1]); moveCd = 0.13; }
        }
        spawnT -= dt;
        // 平台按固定节奏派单（高峰期更快），挂单满了就不再派
        const nowRush = t >= DELIV.rushFrom && t < DELIV.rushTo;
        if (nowRush !== rush) {
          rush = nowRush;
          area.querySelector('.deliv').classList.toggle('rush', rush);
          api.float(rush ? '🔥 午高峰来了！' : '高峰结束，喘口气', area.clientWidth / 2, 40, rush ? '#ffb347' : '#9fe');
          if (rush) SFX.alarm();
        }
        if (spawnT <= 0) {
          if (orders.length < DELIV.maxActive) spawnOrder();
          spawnT = rush ? DELIV.rushInterval : DELIV.interval;
        }
        let lost = false;
        orders.forEach(o => { o.t -= dt; if (o.t <= 0) { o.state = 'late'; lost = true; } });
        if (lost) {
          const n = orders.filter(o => o.state === 'late').length;
          late += n; penalty += DELIV.penalty * n;
          orders = orders.filter(o => o.state !== 'late');
          SFX.bad();
          api.float(`⏰ 超时！-¥${DELIV.penalty * n}`, 120, 30, '#ff6b81');
          renderMarks(); renderOrders(); updScore();
        } else updBars();
      },
      result() {
        return {
          earn: Math.max(DELIV.floor, DELIV.floor + earn - penalty),
          quality: (delivered + late) ? delivered / (delivered + late) * Math.min(1, delivered / 18) : 0,
          lines: [`站点保底 ¥${DELIV.floor} · 送达 ${delivered} 单（${fast} 单极速送达）`, `配送收入 ¥${earn}`, `超时 ${late} 单${penalty ? ` · 罚款 ¥${penalty}` : ''}`],
          stat: { late }
        };
      },
      cleanup() { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); }
    };
  }
});

/* ---------------------------------------------------------------
   5. 英语家教
--------------------------------------------------------------- */
const WORDS = [
  ['apple', '苹果'], ['library', '图书馆'], ['weather', '天气'], ['kitchen', '厨房'], ['bridge', '桥'], ['island', '岛屿'],
  ['money', '钱'], ['salary', '工资'], ['rent', '房租'], ['debt', '债务'], ['loan', '贷款'], ['bank', '银行'],
  ['fraud', '诈骗'], ['police', '警察'], ['careful', '小心的'], ['honest', '诚实的'], ['brave', '勇敢的'], ['tired', '累的'],
  ['hungry', '饿的'], ['delicious', '美味的'], ['busy', '忙碌的'], ['quiet', '安静的'], ['dangerous', '危险的'], ['important', '重要的'],
  ['hope', '希望'], ['dream', '梦想'], ['future', '未来'], ['friend', '朋友'], ['family', '家人'], ['neighbor', '邻居'],
  ['teacher', '老师'], ['student', '学生'], ['customer', '顾客'], ['delivery', '外卖/配送'], ['receipt', '收据'], ['change', '零钱'],
  ['umbrella', '雨伞'], ['subway', '地铁'], ['breakfast', '早餐'], ['medicine', '药'], ['promise', '承诺'], ['mistake', '错误'],
  ['borrow', '借入'], ['return', '归还'], ['believe', '相信'], ['refuse', '拒绝'], ['report', '举报/报告'], ['protect', '保护']
];

Mini.tutor = () => Mini.run({
  title: '英语家教', icon: '📚', color: '#c49bff', duration: 60,
  howto: [
    '小宇念出一个英语单词，选出正确的中文意思',
    '答得又快又准，小宇会越学越开心',
    '每连续答对 5 题，王阿姨额外加 ¥8',
    '键盘：<kbd>1</kbd>-<kbd>4</kbd> 选择答案'
  ],
  create(area, api) {
    area.innerHTML = `
      <div class="tutor">
        <div class="tu-kid"><div class="tu-face">🧒</div><div class="tu-say">老师好！</div></div>
        <div class="tu-card"><small>这个词是什么意思？</small><div class="tu-word"></div></div>
        <div class="tu-opts"></div>
        <div class="tu-streak"></div>
      </div>`;
    let cur, right = 0, wrongN = 0, streak = 0, bonus = 0, lock = false, pool = shuffle(WORDS);
    function nextQ() {
      if (!pool.length) pool = shuffle(WORDS);
      cur = pool.pop();
      const opts = shuffle([cur[1], ...shuffle(WORDS.filter(w => w !== cur)).slice(0, 3).map(w => w[1])]);
      $('.tu-word', area).textContent = cur[0];
      $('.tu-card', area).classList.remove('pop'); void $('.tu-card', area).offsetWidth; $('.tu-card', area).classList.add('pop');
      $('.tu-opts', area).innerHTML = opts.map((o, i) => `<button class="tu-opt" data-v="${o}"><kbd>${i + 1}</kbd>${o}</button>`).join('');
      $$('.tu-opt', area).forEach(b => b.onclick = () => answer(b));
      lock = false;
    }
    function answer(b) {
      if (lock) return;
      lock = true;
      const ok = b.dataset.v === cur[1];
      if (ok) {
        right++; streak++;
        b.classList.add('right'); SFX.coin();
        $('.tu-face', area).textContent = streak >= 5 ? '🤩' : '😄';
        $('.tu-say', area).textContent = pick(['懂了！', `${cur[0]}！`, '老师好厉害', 'Yes！']);
        if (streak % 5 === 0) { bonus += 8; api.floatAt(b, '连对 5 题 +¥8', '#ffcc4d'); SFX.good(); }
      } else {
        wrongN++; streak = 0;
        b.classList.add('wrong'); SFX.bad();
        $$('.tu-opt', area).forEach(x => { if (x.dataset.v === cur[1]) x.classList.add('right'); });
        $('.tu-face', area).textContent = '😵';
        $('.tu-say', area).textContent = `原来 ${cur[0]} 是「${cur[1]}」`;
      }
      $('.tu-streak', area).innerHTML = streak > 1 ? `🔥 连对 ${streak}` : '';
      api.score(`✅ ${right}　❌ ${wrongN}`);
      setTimeout(nextQ, ok ? 450 : 1100);
    }
    const onKey = e => { const i = +e.key - 1; const bs = $$('.tu-opt', area); if (i >= 0 && i < bs.length) answer(bs[i]); };
    window.addEventListener('keydown', onKey);
    nextQ(); api.score('✅ 0　❌ 0');
    return {
      result() {
        return {
          earn: 180 + right * 10 + bonus,
          quality: (right + wrongN) ? right / (right + wrongN) * Math.min(1, right / 15) : 0,
          lines: [`课时费 ¥180 · 答对 ${right} 题 × ¥10`, bonus ? `连对奖励 ¥${bonus}` : '没有拿到连对奖励', `答错 ${wrongN} 题`]
        };
      },
      cleanup() { window.removeEventListener('keydown', onKey); }
    };
  }
});
