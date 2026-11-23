/* ========== 主流程：标题 / 每日循环 / 结局 ========== */
const MAX_DAY = 14;
const RENT_DAY = 7;
const SAVE_KEY = 'fj_save_v1';

const JOBS = {
  tea:      { name: '奶茶店店员', icon: '🧋', slots: [0, 1], energy: 25, mood: -4, auto: 210, range: '¥200-450', play: () => Mini.tea(), desc: '按单做奶茶，手快有小费' },
  flyer:    { name: '街头发传单', icon: '📄', slots: [0],    energy: 18, mood: -6, auto: 140, range: '¥120-310', play: () => Mini.flyer(), desc: '不累，但看人脸色' },
  cashier:  { name: '便利店夜班', icon: '🏪', slots: [1],    energy: 35, mood: -6, auto: 260, range: '¥240-420', play: () => Mini.cashier(), desc: '扫码收银，算准找零' },
  delivery: { name: '外卖骑手',   icon: '🛵', slots: [0, 1], energy: 32, mood: -3, auto: 240, range: '¥200-450', play: () => Mini.delivery(), desc: '风里雨里，准时必达' },
  tutor:    { name: '德语家教',   icon: '📚', slots: [1],    energy: 15, mood: +4, auto: 300, range: '¥300-480', play: () => Mini.tutor(), desc: '专业对口，最体面的一份' }
};
const SLOT_NAME = ['白天', '晚上'];

const Game = {
  S: null,

  /* ---------- 状态 ---------- */
  fresh(reported) {
    return {
      day: 1, slot: 0, money: 335, loan: 7200, rent: 1500, rentPaid: false, rentLate: false,
      energy: 85, mood: 40, reported,
      unlocked: { tea: true, flyer: true, cashier: false, delivery: false, tutor: false },
      skill: { tea: 0, flyer: 0, cashier: 0, delivery: 0, tutor: 0 },
      stats: { earned: 0, jobs: 0, played: 0, great: 0, spotted: 0, fell: 0, paid: 0 },
      flags: {}, logs: [], today: { earn: 0, spend: 0 }, lastRandom: null, forceRest: false
    };
  },
  save() { Store.set(SAVE_KEY, this.S); },
  hasSave() { const s = Store.get(SAVE_KEY); return s && s.day && !s.over; },

  log(t) { this.S.logs.unshift({ d: this.S.day, s: this.S.slot, t }); this.S.logs = this.S.logs.slice(0, 40); },
  money(n, why = '') {
    const S = this.S;
    S.money = Math.round(S.money + n);
    if (n > 0) { S.today.earn += n; S.stats.earned += n; } else S.today.spend -= n;
    if (why) this.log(`${n >= 0 ? '💰' : '💸'} ${why} ${n >= 0 ? '+' : ''}${yuan(n)}`);
  },
  mood(n) { this.S.mood = clamp(Math.round(this.S.mood + n), 0, 100); },

  /* ---------- 标题 ---------- */
  title() {
    Music.play('night');
    const has = this.hasSave();
    $('#app').innerHTML = '';
    const t = el(`
      <div class="title-scr">
        ${Art.stars(70)}
        <div class="title-moon"></div>
        ${Art.skyline(true, 5)}
        <div class="title-in">
          <div class="title-ava">${Art.avatar('determined')}</div>
          <h1>Friedrich <span>打工记</span></h1>
          <p class="title-sub">被骗走 ¥18,525 之后的十四天</p>
          <div class="title-btns">
            <button class="btn primary big" data-a="new">${has ? '重新开始' : '开始游戏'}</button>
            ${has ? '<button class="btn big" data-a="cont">继续游戏</button>' : ''}
          </div>
          <div class="title-tools">
            <button class="icon-btn" data-a="sound">${SFX.on ? '🔊 声音：开' : '🔇 声音：关'}</button>
            <button class="icon-btn" data-a="about">ℹ️ 关于</button>
          </div>
        </div>
      </div>`);
    $('#app').appendChild(t);
    $$('[data-a]', t).forEach(b => b.onclick = async () => {
      const a = b.dataset.a;
      SFX.click();
      if (a === 'new') {
        if (has && !(await modal({ title: '重新开始？', body: '<p>当前存档将被覆盖。</p>', buttons: [{ text: '取消', value: false }, { text: '重新开始', value: true, cls: 'primary' }] }))) return;
        const r = await Prologue.run();
        this.S = this.fresh(r.reported);
        this.save();
        this.morning(true);
      } else if (a === 'cont') {
        this.S = Store.get(SAVE_KEY);
        this.hub();
      } else if (a === 'sound') {
        const on = SFX.toggle();
        b.textContent = on ? '🔊 声音：开' : '🔇 声音：关';
        if (on) Music.play('night');
      } else if (a === 'about') {
        modal({
          title: '关于这个游戏',
          body: `<p>《Friedrich 打工记》是一个关于网络诈骗与重新出发的小游戏。故事和人物纯属虚构，但诈骗套路都来自真实案例。</p>
            <p>🎮 在 14 天里打工、生活、做选择，想办法还清网贷。</p>
            <p>📞 现实中遇到可疑情况，请拨打 <b>96110</b> 反诈专线；被骗后立即拨打 <b>110</b> 报警。</p>`,
          buttons: [{ text: '好的', cls: 'primary' }]
        });
      }
    });
  },

  /* ---------- 每日主界面 ---------- */
  async morning(first = false) {
    const S = this.S;
    S.today = { earn: 0, spend: 0 };
    this.hub();
    await wait(250);
    if (first) {
      await modal({
        title: '第 1 天', ava: Art.avatar('determined'),
        body: `<p>Friedrich 在招聘软件上找到了附近奶茶店和传单派发的兼职。</p>
          <p>🎯 <b>目标</b>：第 ${RENT_DAY} 天交房租 ¥1,500，第 ${MAX_DAY} 天还清「速借宝」。</p>
          <p>☀️ 每天有 <b>白天</b> 和 <b>晚上</b> 两个时段，可以打工、休息或出去散心。</p>
          <p>⚡ 打工消耗体力；😊 心情太差会影响收入。认真干（玩小游戏）赚得更多，也可以选择「随便干干」直接跳过。</p>`,
        buttons: [{ text: '开干！', cls: 'primary' }]
      });
    } else if (S.forceRest) {
      S.forceRest = false;
      await modal({ title: '撑不住了', ava: Art.avatar('tired'), body: '<p>连日的压力让 Friedrich 彻底垮了，他在床上躺了一整个白天。</p><p class="hint">心情太低会崩溃，记得适当休息和散心。</p>', buttons: [{ text: '……' }] });
      S.energy = clamp(S.energy + 30, 0, 100);
      S.mood = 30;
      S.slot = 1;
      this.save();
      this.hub();
    } else if (S.day === MAX_DAY) {
      toast('⚠️ 最后一天！今晚「速借宝」就要扣款了', 'warn');
    } else if (S.day === RENT_DAY && !S.rentPaid) {
      toast('🏠 今晚要交房租 ¥1,500', 'warn');
    }
  },

  thought() {
    const S = this.S;
    const need = S.loan + (S.rentPaid ? 0 : S.rent);
    if (S.energy < 25) return ['tired', '好累……再干下去要倒下了。'];
    if (S.mood < 20) return ['sad', '我真的能还清吗……'];
    if (S.money >= need) return ['happy', '钱够了！再多攒一点。'];
    if (S.day === MAX_DAY) return ['determined', '最后一天了，拼了！'];
    if (!S.rentPaid && S.day >= RENT_DAY - 1 && S.money < S.rent) return ['worried', '房租还差一些……'];
    if (S.mood > 70) return ['happy', '今天状态不错！'];
    return [S.slot ? 'normal' : 'determined', pick(['一步一步来。', '今天也要加油。', '再也不信天上掉馅饼了。', '先把房租凑出来。'])];
  },

  hub() {
    const S = this.S;
    const night = S.slot === 1;
    Music.play(night ? 'night' : 'day');
    const [expr, words] = this.thought();
    const daysLeft = MAX_DAY - S.day;
    const bills = [];
    if (!S.rentPaid) bills.push({ n: '🏠 房租', v: S.rent, d: S.rentLate ? 10 : RENT_DAY });
    if (S.loan > 0) bills.push({ n: '⚡ 速借宝', v: S.loan, d: MAX_DAY });
    const moodMult = S.mood < 25;

    $('#app').innerHTML = '';
    const h = el(`
      <div class="hub ${night ? 'night' : 'day'}">
        <header class="hud">
          <div class="hud-day"><b>第 ${S.day} 天</b><small>${night ? '🌙' : '☀️'} ${SLOT_NAME[S.slot]} · 还剩 ${daysLeft} 天</small></div>
          <div class="hud-money"><small>余额</small><b>${yuan(S.money)}</b></div>
          <div class="hud-bars">
            <div class="bar en"><label>⚡ 体力</label><div><i style="width:${S.energy}%"></i></div><span>${S.energy}</span></div>
            <div class="bar mo ${moodMult ? 'warn' : ''}"><label>😊 心情</label><div><i style="width:${S.mood}%"></i></div><span>${S.mood}</span></div>
          </div>
          <div class="hud-tools">
            <button class="icon-btn" data-a="sound" title="声音">${SFX.on ? '🔊' : '🔇'}</button>
            <button class="icon-btn" data-a="menu" title="菜单">☰</button>
          </div>
        </header>
        <section class="scene">
          ${night ? Art.stars(40) : '<div class="sun"></div><div class="cloud c1"></div><div class="cloud c2"></div>'}
          ${Art.skyline(night, 21)}
          <div class="fr">
            <div class="fr-bubble">${words}</div>
            <div class="fr-ava">${Art.avatar(expr)}</div>
          </div>
          <div class="bills">
            ${bills.map(b => `<div class="bill ${b.d - S.day <= 1 ? 'urgent' : ''}"><span>${b.n}</span><b>${yuan(b.v)}</b><small>第 ${b.d} 天 · ${b.d === S.day ? '今晚到期' : `剩 ${b.d - S.day} 天`}</small></div>`).join('') || '<div class="bill ok"><span>🎉 债务</span><b>全部还清</b></div>'}
            ${S.loan > 0 || !S.rentPaid ? '<button class="btn small" data-a="pay">提前还款</button>' : ''}
          </div>
        </section>
        <section class="acts">
          <h3>${night ? '晚上' : '白天'}了，做点什么？${moodMult ? '<span class="tag bad">心情低落：收入 -15%</span>' : ''}</h3>
          <div class="jobs">
            ${Object.entries(JOBS).map(([id, j]) => {
              const locked = !S.unlocked[id];
              const wrongSlot = !j.slots.includes(S.slot);
              const tired = S.energy < j.energy;
              const dis = locked || wrongSlot || tired;
              const why = locked ? '🔒 尚未解锁' : wrongSlot ? `仅限${j.slots.map(s => SLOT_NAME[s]).join('/')}` : tired ? '体力不足' : '';
              const lv = S.skill[id];
              return `<button class="job ${dis ? 'dis' : ''}" data-job="${id}" ${dis ? 'disabled' : ''}>
                <div class="job-ic">${locked ? '❔' : j.icon}</div>
                <div class="job-info"><b>${locked ? '？？？' : j.name}</b><small>${locked ? '也许会有新的机会…' : j.desc}</small>
                  <div class="job-meta">${locked ? '' : `<span>💰 ${j.range}</span><span>⚡ -${j.energy}</span>${lv ? `<span>熟练 Lv${Math.min(lv, 5)}</span>` : ''}`}</div></div>
                ${why ? `<div class="job-why">${why}</div>` : ''}
              </button>`;
            }).join('')}
          </div>
          <div class="others">
            <button class="other" data-a="rest"><span>🛏️</span><b>休息</b><small>体力 +35 · 心情 +6</small></button>
            <button class="other" data-a="fun"><span>🌇</span><b>出去散心</b><small>心情大幅恢复</small></button>
            <button class="other" data-a="log"><span>📒</span><b>账本</b><small>收支与日志</small></button>
          </div>
        </section>
      </div>`);
    $('#app').appendChild(h);

    $$('.job', h).forEach(b => b.onclick = () => { SFX.click(); this.doJob(b.dataset.job); });
    $$('[data-a]', h).forEach(b => b.onclick = () => {
      SFX.click();
      const a = b.dataset.a;
      if (a === 'rest') this.rest();
      else if (a === 'fun') this.fun();
      else if (a === 'log') this.showLog();
      else if (a === 'pay') this.payEarly();
      else if (a === 'sound') { SFX.toggle(); if (SFX.on) Music.play(night ? 'night' : 'day'); b.textContent = SFX.on ? '🔊' : '🔇'; }
      else if (a === 'menu') this.menu();
    });
  },

  /* ---------- 打工 ---------- */
  async doJob(id) {
    const S = this.S, j = JOBS[id];
    const mult = (1 + 0.04 * Math.min(S.skill[id], 5)) * (S.mood < 25 ? 0.85 : 1);
    const mode = await modal({
      title: `${j.icon} ${j.name}`,
      body: `<p>${j.desc}。</p><p class="hint">消耗体力 ${j.energy}${S.skill[id] ? ` · 熟练度加成 +${Math.min(S.skill[id], 5) * 4}%` : ''}</p>`,
      buttons: [
        { text: '认真干', sub: '玩小游戏，收入看表现', value: 'play', cls: 'primary' },
        { text: '随便干干', sub: `跳过小游戏，约 ${yuan(j.auto * mult)}`, value: 'auto' },
        { text: '算了', value: null, cls: 'ghost' }
      ]
    });
    if (!mode) return;
    let r;
    if (mode === 'play') {
      Music.pause();
      r = await j.play();
      Music.resume();
      S.stats.played++;
    } else {
      r = { earn: Math.round(j.auto * (0.92 + Math.random() * 0.16)), quality: 0.5, lines: ['按部就班地干完了活。'], auto: true };
    }
    const earn = Math.round(r.earn * mult);
    let md = j.mood + (r.moodAdj || 0);
    if (r.quality >= 0.85) { md += 5; S.stats.great++; }
    else if (r.quality < 0.35 && !r.auto) md -= 4;
    if (r.auto) md -= 1;
    S.energy = clamp(S.energy - j.energy, 0, 100);
    this.mood(md);
    S.skill[id]++;
    S.stats.jobs++;
    if (id === 'tea' && r.quality >= 0.9) S.flags.teaMaster = true;
    if (id === 'delivery' && !r.auto && r.stat && r.stat.late === 0 && r.quality > 0.5) S.flags.rider = true;
    this.money(earn, `${j.name}`);

    const expr = r.auto ? 'normal' : r.quality >= 0.85 ? 'happy' : r.quality >= 0.5 ? 'determined' : 'tired';
    const grade = r.auto ? '' : r.quality >= 0.85 ? '<div class="grade s">干得漂亮！</div>' : r.quality >= 0.5 ? '<div class="grade a">还不错</div>' : '<div class="grade c">有点手忙脚乱</div>';
    await modal({
      title: '今天的工钱', ava: Art.avatar(expr),
      body: `${grade}<div class="earn-big">+${yuan(earn)}</div>
        <ul class="lines">${r.lines.map(l => `<li>${l}</li>`).join('')}</ul>
        ${mult !== 1 ? `<p class="hint">加成后系数 ×${mult.toFixed(2)}</p>` : ''}
        <div class="deltas"><span>⚡ ${-j.energy}</span><span>😊 ${md >= 0 ? '+' : ''}${md}</span></div>`,
      buttons: [{ text: '继续', cls: 'primary' }]
    });
    SFX.coin();
    this.nextSlot();
  },

  rest() {
    const S = this.S;
    S.energy = clamp(S.energy + 35, 0, 100);
    this.mood(+6);
    this.log('🛏️ 好好休息了一下');
    toast('体力 +35 · 心情 +6');
    this.nextSlot();
  },

  async fun() {
    const S = this.S;
    const v = await modal({
      title: '🌇 出去散心', ava: Art.avatar('normal'),
      body: '<p>去哪儿呢？</p>',
      buttons: [
        { text: '去江边走走', sub: '免费 · 心情 +14 · 体力 +5', value: 'walk', cls: 'primary' },
        { text: '吃顿好的', sub: '-¥45 · 心情 +24 · 体力 +10', value: 'eat', disabled: S.money < 45 },
        { text: '算了', value: null, cls: 'ghost' }
      ]
    });
    if (!v) return;
    if (v === 'walk') {
      S.energy = clamp(S.energy + 5, 0, 100); this.mood(+14);
      this.log('🌊 去江边吹了吹风');
      await modal({ title: '', ava: Art.avatar('happy'), body: `<p>${pick(['江风吹在脸上，城市的灯一盏盏亮起来。', '有个大爷在江边拉二胡，Friedrich 听了好一会儿。', '看着江面的货船慢慢开过，心里平静了许多。'])}</p>`, buttons: [{ text: '回去吧' }] });
    } else {
      this.money(-45, '吃了顿好的');
      S.energy = clamp(S.energy + 10, 0, 100); this.mood(+24);
      await modal({ title: '', ava: Art.avatar('happy'), body: `<p>${pick(['一碗热腾腾的牛肉面下肚，整个人都活过来了。', '路边的烤串摊，老板还多送了两串。', '久违地吃了顿火锅，辣得直冒汗。'])}</p>`, buttons: [{ text: '满足！' }] });
    }
    this.nextSlot();
  },

  async payEarly() {
    const S = this.S;
    const opts = [];
    if (!S.rentPaid) opts.push({ text: `交房租 ${yuan(S.rent)}`, value: 'rent', disabled: S.money < S.rent, cls: 'primary' });
    if (S.loan > 0) {
      [500, 1000].forEach(n => { if (S.loan > n) opts.push({ text: `还网贷 ${yuan(n)}`, value: n, disabled: S.money < n }); });
      opts.push({ text: `一次还清网贷 ${yuan(S.loan)}`, value: 'all', disabled: S.money < S.loan });
    }
    opts.push({ text: '取消', value: null, cls: 'ghost' });
    const v = await modal({ title: '💳 提前还款', body: `<p>当前余额 <b>${yuan(S.money)}</b>。提前还款能让 Friedrich 安心一点（心情 +4）。</p><p class="hint">记得留些钱吃饭（每晚 ¥35）。</p>`, buttons: opts });
    if (!v) return;
    if (v === 'rent') { this.money(-S.rent, '交房租'); S.rentPaid = true; }
    else {
      const n = v === 'all' ? S.loan : v;
      this.money(-n, '偿还网贷'); S.loan -= n; S.stats.paid += n;
    }
    this.mood(+4);
    SFX.good();
    this.save();
    this.hub();
  },

  nextSlot() {
    const S = this.S;
    if (S.slot === 0) { S.slot = 1; this.save(); this.hub(); }
    else this.night();
  },

  /* ---------- 夜晚结算 ---------- */
  async night() {
    const S = this.S;
    Music.play('night');
    const food = S.money >= 35;
    if (food) this.money(-35, '吃饭');
    else this.mood(-10);
    S.energy = clamp(S.energy + 45, 0, 100);
    if (S.loan > 0) this.mood(-2);

    await modal({
      title: `🌙 第 ${S.day} 天结束`, ava: Art.avatar(S.today.earn > 300 ? 'happy' : 'tired'),
      body: `<div class="sum">
          <div><small>今日收入</small><b class="pos">+${yuan(S.today.earn)}</b></div>
          <div><small>今日支出</small><b class="neg">-${yuan(S.today.spend)}</b></div>
          <div><small>当前余额</small><b>${yuan(S.money)}</b></div>
        </div>
        <p class="hint">${food ? '🍚 晚饭 ¥35' : '😣 钱不够，饿着肚子睡了（心情 -10）'} · 🛏️ 睡了一觉，体力 +45</p>`,
      buttons: [{ text: '继续', cls: 'primary' }]
    });

    // 剧情事件 / 随机事件
    let ev = Events.scheduled(S);
    if (!ev && S.day < MAX_DAY && Math.random() < 0.6) {
      ev = pick(Events.randomPool(S));
      S.lastRandom = ev;
    }
    if (ev) await Events.run(ev, S);

    // 房租
    if (!S.rentPaid && (S.day === RENT_DAY || (S.rentLate && S.day === 10))) await this.rentDue();

    // 心情崩溃
    if (S.mood <= 0) S.forceRest = true;

    if (S.day >= MAX_DAY) return this.finale();
    S.day++;
    S.slot = 0;
    this.save();
    this.morning();
  },

  async rentDue() {
    const S = this.S;
    if (S.money >= S.rent) {
      await modal({ title: '🏠 交房租', ava: Art.npc('🧓', '#ffb86b'), body: `<p>房东来收房租了。Friedrich 交了 <b>${yuan(S.rent)}</b>。</p><p>“小伙子挺准时嘛！”</p>`, buttons: [{ text: '呼……', cls: 'primary' }] });
      this.money(-S.rent, '房租');
      S.rentPaid = true;
      this.mood(+8);
    } else if (!S.rentLate) {
      await modal({ title: '🏠 房租不够', ava: Art.npc('🧓', '#ffb86b'), body: `<p>“还差 ${yuan(S.rent - S.money)}？”房东皱了皱眉。</p><p>“行吧，宽限你三天，<b>第 10 天</b>之前交齐，滞纳金 ¥200。”</p>`, buttons: [{ text: '谢谢房东……', cls: 'primary' }] });
      S.rent += 200;
      S.rentLate = true;
      this.mood(-12);
    } else {
      const pay = Math.max(0, S.money - 35);
      await modal({ title: '🏠 搬家', ava: Art.avatar('sad'), body: `<p>房租还是没凑齐。Friedrich 交出了手头的 ${yuan(pay)}，抱着行李搬到了阿明的沙发上。</p><p>“没事，挤挤就好。”阿明拍了拍他。</p>`, buttons: [{ text: '……', cls: 'primary' }] });
      this.money(-pay, '部分房租');
      S.rentPaid = true;
      S.flags.couch = true;
      this.mood(-20);
    }
  },

  /* ---------- 结局 ---------- */
  async finale() {
    const S = this.S;
    Music.play('tense');
    let paidNow = 0;
    if (S.loan > 0) {
      paidNow = Math.min(S.loan, Math.max(0, S.money));
      S.money -= paidNow; S.loan -= paidNow; S.stats.paid += paidNow;
    }
    await modal({
      title: '⚡ 速借宝：到期扣款', ava: Art.avatar('worried'),
      body: paidNow ? `<p>系统自动扣款 <b>${yuan(paidNow)}</b>。</p><p>${S.loan > 0 ? `仍欠 <b class="neg">${yuan(S.loan)}</b>……` : '<b class="pos">已全部还清！</b>'}</p>` : (S.loan > 0 ? `<p>账户余额不足，仍欠 <b class="neg">${yuan(S.loan)}</b>……</p>` : '<p>网贷早已提前还清 🎉</p>'),
      buttons: [{ text: '……', cls: 'primary' }]
    });
    S.over = true;
    this.save();
    Store.del(SAVE_KEY);
    this.ending();
  },

  ending() {
    const S = this.S;
    const repaid = S.loan <= 0;
    let key, title, expr, story = [];
    if (repaid && S.reported && S.mood >= 40) {
      key = 'A'; title = '重新出发'; expr = 'happy';
      story = [
        '第十四天晚上，Friedrich 还清了最后一笔钱。',
        '他把还款记录截了图，又把那段被骗的经历一字一句写了下来，投给了社区的反诈宣传栏。',
        '后来，他成了一名反诈宣传志愿者，在社区、在学校，一遍遍讲自己的故事。',
        '「被骗不丢人，丢人的是骗子。」他总是这样开场。'
      ];
    } else if (repaid) {
      key = 'B'; title = '还清了，但……'; expr = 'determined';
      story = [
        '第十四天晚上，Friedrich 盯着「已结清」三个字看了很久。',
        '钱是还上了，可那段日子留下的疲惫和后怕，还要很久才能散去。',
        S.reported ? '好在他没有一个人扛着，这一路有人帮他。' : '那件事他谁也没告诉。也许有一天，他会愿意说出来。',
        '他把手机里所有「兼职」「返利」的群都退了。日子，还得继续。'
      ];
    } else {
      key = 'C'; title = '未完待续'; expr = 'sad';
      story = [
        `第十四天晚上，Friedrich 还差 ${yuan(S.loan)}。`,
        '他坐在床边很久，终于拨通了家里的电话，又去咨询了法律援助。',
        '他这才知道：违规网贷的高额服务费不受法律保护，暴力催收可以举报，而他也不是只能一个人扛。',
        '钱还没还完，但他明白了一件事——被骗不是他的错，求助也不是。'
      ];
    }
    if (S.flags.couch) story.push('（后来他在阿明的沙发上睡了一个月，两人成了最好的朋友。）');
    if (S.flags.keptWallet) story.push('（那个钱包里的身份证，他最终还是匿名寄回给了失主。）');

    const badges = [
      [S.reported, '🚔', '勇敢报案', '没有因为丢人而沉默'],
      [S.flags.toldMom, '💗', '说出真相', '向家人坦白了一切'],
      [S.flags.eagle, '🦅', '火眼金睛', '一次识破全部可疑消息'],
      [S.flags.stoodUp, '🛡️', '不怕催收', '面对威胁据理力争'],
      [S.flags.teaMaster, '🧋', '奶茶大师', '一个班几乎零失误'],
      [S.flags.rider, '🛵', '准时必达', '一个班零超时'],
      [S.flags.honest, '👛', '拾金不昧', '把钱包还给了失主'],
      [S.stats.fell === 0, '🧠', '不再上当', '十四天里没有再被骗过']
    ];
    const got = badges.filter(b => b[0]).length;
    const score = Math.max(0, Math.round((repaid ? 600 : 0) + S.stats.earned / 20 + S.mood * 2 + got * 40 + Math.max(0, S.money) / 10 - S.loan / 20));
    const rank = score >= 1200 ? 'S' : score >= 950 ? 'A' : score >= 700 ? 'B' : 'C';
    Music.play(key === 'C' ? 'sad' : 'day');
    SFX.good();

    $('#app').innerHTML = '';
    const e = el(`
      <div class="ending end-${key}">
        ${Art.stars(50)}
        <div class="end-in">
          <div class="end-tag">结局 ${key}</div>
          <h1>${title}</h1>
          <div class="end-ava">${Art.avatar(expr)}</div>
          <div class="end-story">${story.map(p => `<p>${p}</p>`).join('')}</div>
          <div class="end-stats">
            <div><small>评价</small><b class="rank r${rank}">${rank}</b></div>
            <div><small>累计赚到</small><b>${yuan(S.stats.earned)}</b></div>
            <div><small>打工次数</small><b>${S.stats.jobs}</b></div>
            <div><small>识破诈骗</small><b>${S.stats.spotted}</b></div>
            <div><small>剩余存款</small><b>${yuan(Math.max(0, S.money))}</b></div>
            <div><small>最终心情</small><b>${S.mood}</b></div>
          </div>
          <h3>成就 ${got} / ${badges.length}</h3>
          <div class="badges">${badges.map(b => `<div class="badge ${b[0] ? 'on' : ''}"><span>${b[1]}</span><b>${b[2]}</b><small>${b[0] ? b[3] : '？？？'}</small></div>`).join('')}</div>
          <div class="end-tips">
            <h3>🛡️ 记住这几句话</h3>
            <ul>
              <li>刷单返利、点赞赚钱，<b>全是诈骗</b>。</li>
              <li>凡是要你<b>先交钱</b>才能拿钱的，都要警惕。</li>
              <li>不点陌生链接，不开屏幕共享，不说验证码。</li>
              <li>被骗了，第一时间拨打 <b>110</b>，保留证据；可疑情况拨打 <b>96110</b>。</li>
              <li>「帮你追回被骗资金」的，是二次诈骗。</li>
            </ul>
          </div>
          <div class="end-btns">
            <button class="btn primary big" data-a="again">再玩一次</button>
            <button class="btn big" data-a="title">返回标题</button>
          </div>
          <p class="end-credit">Friedrich 打工记 · 谢谢游玩</p>
        </div>
      </div>`);
    $('#app').appendChild(e);
    window.scrollTo(0, 0);
    $('[data-a=again]', e).onclick = async () => {
      SFX.click();
      const r = await Prologue.run();
      this.S = this.fresh(r.reported); this.save(); this.morning(true);
    };
    $('[data-a=title]', e).onclick = () => { SFX.click(); this.title(); };
  },

  /* ---------- 其他面板 ---------- */
  showLog() {
    const S = this.S;
    modal({
      title: '📒 账本',
      cls: 'wide',
      body: `<div class="sum">
          <div><small>累计收入</small><b class="pos">${yuan(S.stats.earned)}</b></div>
          <div><small>已还网贷</small><b>${yuan(S.stats.paid)}</b></div>
          <div><small>剩余网贷</small><b class="neg">${yuan(S.loan)}</b></div>
        </div>
        <ul class="logs">${S.logs.length ? S.logs.map(l => `<li><small>D${l.d}·${SLOT_NAME[l.s]}</small>${l.t}</li>`).join('') : '<li>还没有记录</li>'}</ul>`,
      buttons: [{ text: '关闭', cls: 'primary' }]
    });
  },

  async menu() {
    const v = await modal({
      title: '菜单',
      body: '<p class="hint">游戏会在每个时段自动存档。</p>',
      buttons: [{ text: '继续游戏', value: null, cls: 'primary' }, { text: '返回标题', value: 'title' }]
    });
    if (v === 'title') { this.save(); this.title(); }
  }
};

Game.title();
