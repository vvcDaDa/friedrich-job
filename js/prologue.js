/* ========== 序章：一条私信 ========== */
const Prologue = (() => {
  const SKIP = { skip: true };
  let stage, phone, abortP, abortFn, balance, balEl, keyHandler;

  const guard = p => Promise.race([p, abortP]);

  /* ---------- 舞台 ---------- */
  function build() {
    $('#app').innerHTML = '';
    stage = el(`
      <div class="pro">
        <div class="pro-room">
          <div class="pro-window">${Art.stars(30)}${Art.skyline(true, 11)}</div>
          <div class="pro-lamp"></div>
          <div class="pro-desk"></div>
        </div>
        <div class="pro-bal"><span>银行卡余额</span><b>¥12,860</b></div>
        <div class="phone">
          <div class="ph-notch"></div>
          <div class="ph-status"><span class="ph-clock">22:47</span><span>📶 🔋</span></div>
          <div class="ph-head"><div class="ph-back">‹</div><div class="ph-ava"></div><div class="ph-name"><b></b><small></small></div></div>
          <div class="ph-body"></div>
          <div class="ph-input"><div class="ph-fake">发消息…</div></div>
          <div class="ph-screen"></div>
          <div class="ph-banner"></div>
        </div>
        <div class="card-text"></div>
        <div class="narr"></div>
        <button class="skip-btn">跳过序章 ⏭</button>
      </div>`);
    $('#app').appendChild(stage);
    phone = $('.phone', stage);
    balEl = $('.pro-bal b', stage);
    balance = 12860;
    abortP = new Promise((_, rej) => { abortFn = () => rej(SKIP); });
    abortP.catch(() => {});
    $('.skip-btn', stage).onclick = () => { SFX.click(); abortFn(); };
    keyHandler = e => {
      if (e.key === ' ' || e.key === 'Enter') {
        const b = $('.narr.show .narr-box', stage);
        if (b) { e.preventDefault(); b.click(); }
      }
    };
    window.addEventListener('keydown', keyHandler);
  }

  function setBalance(v) {
    const from = balance;
    balance = v;
    animateNumber(balEl, from, v, 900);
    const box = $('.pro-bal', stage);
    box.classList.remove('up', 'down');
    void box.offsetWidth;
    box.classList.add(v < from ? 'down' : 'up');
  }

  /* ---------- 旁白 / 对白 ---------- */
  function say(text, { who = 'Friedrich', expr = 'normal', ava = null } = {}) {
    return guard(new Promise(res => {
      const box = $('.narr', stage);
      const isNarrator = who === null;
      const face = ava || (who === 'Friedrich' ? Art.avatar(expr) : '');
      box.innerHTML = `
        <div class="narr-box ${isNarrator ? 'narrator' : ''}">
          ${face ? `<div class="narr-ava">${face}</div>` : ''}
          <div class="narr-txt">${!isNarrator ? `<div class="narr-who">${who}</div>` : ''}<p></p><span class="narr-next">▼</span></div>
        </div>`;
      box.classList.add('show');
      const p = $('p', box), nb = $('.narr-box', box);
      let i = 0, done = false;
      const chars = [...text];
      const iv = setInterval(() => {
        i++;
        p.textContent = chars.slice(0, i).join('');
        if (i % 2 === 0) SFX.type();
        if (i >= chars.length) { clearInterval(iv); done = true; nb.classList.add('done'); }
      }, 32);
      nb.onclick = () => {
        if (!done) { clearInterval(iv); p.textContent = text; done = true; nb.classList.add('done'); return; }
        SFX.click();
        res();
      };
    }));
  }
  const think = (t, expr = 'normal') => say(t, { who: 'Friedrich', expr });
  const narr = t => say(t, { who: null });
  function hideNarr() { const b = $('.narr', stage); if (b) b.classList.remove('show'); }

  async function card(text, ms = 1800) {
    hideNarr();
    const c = $('.card-text', stage);
    c.innerHTML = `<span>${text}</span>`;
    c.classList.add('show');
    await guard(wait(ms));
    c.classList.remove('show');
    await guard(wait(500));
  }

  /* ---------- 手机 ---------- */
  function phoneShow(on = true) { phone.classList.toggle('show', on); }
  function app({ name, sub = '', ava = '💬', color = '#5b8cff', theme = '' }) {
    $('.ph-name b', phone).textContent = name;
    $('.ph-name small', phone).textContent = sub;
    $('.ph-ava', phone).innerHTML = ava;
    $('.ph-ava', phone).style.background = color;
    $('.ph-body', phone).innerHTML = '';
    phone.dataset.theme = theme;
  }
  function scrollDown() { const b = $('.ph-body', phone); b.scrollTop = b.scrollHeight; }
  async function recv(text, { from = null, ava = null, color = '#ddd', delay = 800 } = {}) {
    hideNarr();
    const body = $('.ph-body', phone);
    const row = el(`<div class="msg in">${ava ? `<div class="m-ava" style="background:${color}">${ava}</div>` : ''}<div class="m-col">${from ? `<div class="m-from">${from}</div>` : ''}<div class="bubble typing"><i></i><i></i><i></i></div></div></div>`);
    body.appendChild(row);
    scrollDown();
    await guard(wait(delay));
    $('.bubble', row).classList.remove('typing');
    $('.bubble', row).innerHTML = text;
    SFX.msg();
    scrollDown();
    await guard(wait(350));
  }
  async function send(text) {
    const body = $('.ph-body', phone);
    body.appendChild(el(`<div class="msg out"><div class="bubble">${text}</div></div>`));
    SFX.pop();
    scrollDown();
    await guard(wait(500));
  }
  function sys(text, cls = '') {
    $('.ph-body', phone).appendChild(el(`<div class="m-sys ${cls}">${text}</div>`));
    scrollDown();
  }
  function choose(opts) {
    hideNarr();
    return guard(new Promise(res => {
      const inp = $('.ph-input', phone);
      inp.innerHTML = opts.map((o, i) => `<button class="ph-opt" data-i="${i}">${o}</button>`).join('');
      inp.classList.add('choosing');
      $$('.ph-opt', inp).forEach(b => b.onclick = () => {
        SFX.click();
        inp.classList.remove('choosing');
        inp.innerHTML = '<div class="ph-fake">发消息…</div>';
        res(+b.dataset.i);
      });
    }));
  }
  async function banner(title, text, icon = '🏦') {
    const b = $('.ph-banner', phone);
    b.innerHTML = `<div class="bn-ico">${icon}</div><div><b>${title}</b><p>${text}</p></div>`;
    b.classList.add('show');
    await guard(wait(2300));
    b.classList.remove('show');
    await guard(wait(300));
  }
  /* 全屏应用页面（转账 / 借贷 / 点赞任务） */
  function screen(html, mount) {
    hideNarr();
    return guard(new Promise(res => {
      const s = $('.ph-screen', phone);
      s.innerHTML = html;
      s.classList.add('show');
      mount(s, v => { s.classList.remove('show'); setTimeout(() => (s.innerHTML = ''), 300); res(v); });
    }));
  }

  /* 长按转账页面 */
  function transfer(amount, to = '商户结算中心', note = '任务垫付') {
    return screen(`
      <div class="pay">
        <div class="pay-top">转账</div>
        <div class="pay-to"><div class="pay-ico">🏪</div><div><b>${to}</b><small>账户 6217 **** **** 0${rand(100, 999)}</small></div></div>
        <div class="pay-amt"><small>转账金额</small>¥${amount.toLocaleString('zh-CN')}.00</div>
        <div class="pay-note">备注：${note}</div>
        <div class="pay-warn">⚠️ 请确认收款方身份，谨防诈骗</div>
        <button class="hold-btn"><span>长按确认转账</span><i></i></button>
      </div>`, (s, done) => {
      const btn = $('.hold-btn', s);
      let t = null, start = 0;
      const bar = $('i', btn);
      const down = e => {
        e.preventDefault();
        start = performance.now();
        const step = () => {
          const p = Math.min(1, (performance.now() - start) / 1100);
          bar.style.width = p * 100 + '%';
          if (p >= 1) { t = null; SFX.coin(); done(); return; }
          t = requestAnimationFrame(step);
        };
        t = requestAnimationFrame(step);
      };
      const up = () => { if (t) { cancelAnimationFrame(t); t = null; bar.style.width = '0'; } };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointerleave', up);
      btn.addEventListener('pointercancel', up);
    });
  }

  /* ---------- 剧本 ---------- */
  const HR = { from: '兼职-小雅', ava: '👩', color: '#ffb3c7' };
  const JIE = { from: '接待员-阿杰', ava: '🧑‍💼', color: '#9ec5ff' };

  async function script() {
    Music.play('night');
    await wait(400);
    await narr('这是 Friedrich。');
    await think('……这是大学外教给我起的名字，后来大家就一直这么叫了。', 'normal');
    await narr('毕业三个月，投了四十多份简历，至今没有一个回音。');
    await narr('银行卡里的 ¥12,860，是他大学四年打零工攒下的全部积蓄。');
    await think('下周就要交房租了……再找不到工作就麻烦了。', 'worried');
    await narr('这天深夜，他躺在床上刷着手机。一条私信弹了出来——');

    hideNarr();
    phoneShow();
    app({ name: '兼职-小雅', sub: '在线', ava: '👩', color: '#ffb3c7' });
    await guard(wait(700));
    await recv('亲～看你最近在找工作呀？😊', HR);
    await recv('我们是短视频平台<b>官方合作</b>的推广公司，招线上兼职，在家动动手指就能赚钱哦～', HR);
    await recv('给商家视频点赞，<b>一单 5 元，日结</b>！不收任何费用💕', HR);
    let c = await choose(['真的假的？', '有点心动，怎么做？']);
    if (c === 0) {
      await send('真的假的？不会是骗子吧');
      await recv('哈哈亲很谨慎呢👍 我们是正规公司，<b>从不收押金</b>，你先试试就知道啦～', HR);
    } else {
      await send('有点心动，怎么做？');
      await recv('超简单哒！', HR);
    }
    await recv('这是今天的 3 个体验任务，点赞后截图发我就行～', HR);

    // 点赞小任务
    await screen(`
      <div class="likes">
        <div class="lk-title">📋 体验任务：为商家视频点赞</div>
        ${['🍜 老王面馆 · 招牌牛肉面', '👗 小鹿女装 · 冬季新款', '🐶 萌宠日记 · 柯基搞笑合集'].map((t, i) => `
          <div class="lk-card"><div class="lk-thumb" style="--h:${i * 110}">${t.slice(0, 2)}</div><div class="lk-info"><b>${t.slice(3)}</b><small>${rand(2, 9)}.${rand(1, 9)}w 播放</small></div><button class="lk-heart">♡</button></div>`).join('')}
        <button class="btn primary lk-done" disabled>截图发给小雅</button>
      </div>`, (s, done) => {
      let n = 0;
      $$('.lk-heart', s).forEach(h => h.onclick = () => {
        if (h.classList.contains('on')) return;
        h.classList.add('on'); h.textContent = '♥'; SFX.pop();
        if (++n === 3) $('.lk-done', s).disabled = false;
      });
      $('.lk-done', s).onclick = () => { SFX.click(); done(); };
    });
    await send('<span class="m-img">🖼️ 截图×3</span>');
    await recv('收到！马上给你结算～', HR);
    await banner('工商银行', '您尾号 2281 账户入账 ¥15.00，余额 ¥12,875.00', '🏦');
    setBalance(12875);
    await think('居然……真的到账了？', 'happy');
    await think('动动手指就有 15 块，好像也不错。', 'happy');

    await recv('亲做得超棒！想不想赚更多呀？', HR);
    await recv('我拉你进 <b>VIP 任务群</b>，做「商家冲量」任务，<b>返佣 30%</b>，很多宝妈学生一天赚好几百呢！', HR);
    await choose(['好呀，拉我进去']);
    await send('好呀，拉我进去');

    app({ name: 'VIP任务群 ⭐ (498)', sub: '群聊', ava: '⭐', color: '#ffd36b', theme: 'group' });
    sys('「兼职-小雅」邀请你加入了群聊');
    await recv('欢迎新成员 @Friedrich 🎉 今日冲量任务开始啦！<br>第一单：<b>垫付 ¥200，返还 ¥260</b>', JIE);
    await recv('刚提现了 2600！感谢阿杰老师🙏 [图片]', { from: '宝妈-晴晴', ava: '👩‍🍼', color: '#c5f0d6', delay: 600 });
    await recv('今天赚了快一个月工资了😭 早知道早点来', { from: '上班族小王', ava: '👨‍💻', color: '#ffe0b3', delay: 600 });
    await recv('收到收到，已到账💰', { from: '大学生-阿乐', ava: '🧑‍🎓', color: '#e0d4ff', delay: 500 });
    c = await choose(['我也试试 200 的', '我先看看再说']);
    if (c === 1) {
      await send('我先看看再说');
      await recv('@Friedrich 今天<b>名额只剩 3 个</b>了哦，下一轮要等一周～', JIE);
      await recv('冲冲冲！我抢到了！', { from: '宝妈-晴晴', ava: '👩‍🍼', color: '#c5f0d6', delay: 500 });
      await think('……只有 200，就算亏了也不多。', 'worried');
      await choose(['那我也做一单']);
      await send('那我也做一单');
    } else {
      await send('我也试试 200 的');
    }
    await recv('好的，请转账至商户结算账户，转账后截图发群里～', JIE);
    await transfer(200);
    setBalance(12675);
    await send('<span class="m-img">🖼️ 转账截图</span>');
    await recv('已确认✅ 返佣发放中…', JIE);
    await banner('工商银行', '您尾号 2281 账户入账 ¥260.00，余额 ¥12,935.00', '🏦');
    setBalance(12935);
    await think('赚了 60！', 'happy');

    Music.play('tense');
    await recv('恭喜 @Friedrich 获得<b>「连单任务」</b>资格！<br>需连续完成 3 单，共垫付 <b>¥3,000</b>，完成后一次性返还 <b>¥3,900</b>。', JIE);
    c = await choose(['好！', '能不能只做一单？']);
    if (c === 1) {
      await send('能不能只做一单？');
      await recv('连单是系统自动派单，<b>不能拆分</b>哦。中途放弃的话，本金无法退回。', JIE);
      await choose(['……好吧']);
      await send('……好吧');
    } else await send('好！');
    await transfer(3000);
    setBalance(9935);
    await send('<span class="m-img">🖼️ 转账截图</span>');
    await recv('收到，系统处理中…', { ...JIE, delay: 1400 });
    await recv('⚠️ 系统检测到您<b>操作失误</b>，订单<b>卡单</b>了！<br>需完成补单 <b>¥6,800</b> 才能解冻全部资金（共返还 ¥13,520）', { ...JIE, delay: 1500 });
    await think('什么？！', 'shock');
    c = await choose(['我没有操作失误啊！', '能先把 3000 退给我吗？']);
    await send(c === 0 ? '我没有操作失误啊！' : '能先把 3000 退给我吗？');
    await recv('亲，这是系统判定，老师也没办法。<br>现在补单，钱马上全部返还；<b>不补单，前面的资金会被系统清零</b>。', JIE);
    await recv('我上次也卡单，补完就提现了，别慌！', { from: '上班族小王', ava: '👨‍💻', color: '#ffe0b3', delay: 600 });
    c = await choose(['……好，我补', '我再想想']);
    if (c === 1) {
      await send('我再想想');
      sys('⏳ 补单倒计时 <b class="cd">30:00</b>', 'warn');
      const cd = $$('.cd', phone).pop();
      let sec = 1800;
      for (let i = 0; i < 14; i++) { sec -= rand(60, 140); cd.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; SFX.tick(); await guard(wait(140)); }
      await recv('@Friedrich 超时清零可就一分都拿不回来了！', JIE);
      await think('一万多块……我不能让它就这么没了。', 'worried');
      await choose(['……好，我补']);
    }
    await send('……好，我补');
    await transfer(6800);
    setBalance(3135);
    await recv('补单成功✅<br>提现前需缴纳<b>个人所得税及保证金 ¥5,000</b>，提现时一并返还。', { ...JIE, delay: 1300 });
    await think('我……卡里只剩三千了。', 'sad');
    await send('我没有那么多钱了');
    await recv('可以借呀！「速借宝」<b>秒批秒到</b>，提现后马上还上，一分利息都不用出～', JIE);

    // 网贷页面
    await screen(`
      <div class="loan">
        <div class="loan-brand">⚡ 速借宝</div>
        <div class="loan-card"><small>最高可借（元）</small><b>5,000</b><span>日息低至 0.05% · 秒到账</span></div>
        <ul class="loan-list"><li>✔ 无需征信</li><li>✔ 3 分钟审批</li><li>✔ 14 天随借随还</li></ul>
        <div class="loan-fine">借款即视为同意《服务协议》：到期应还 ¥6,200（含平台服务费 ¥1,200）</div>
        <button class="btn loan-btn">立即借款</button>
      </div>`, (s, done) => {
      $('.loan-btn', s).onclick = async e => {
        SFX.click();
        e.target.disabled = true;
        e.target.textContent = '审核中…';
        await wait(1100);
        e.target.textContent = '✔ 放款成功';
        SFX.coin();
        await wait(700);
        done();
      };
    });
    await banner('工商银行', '您尾号 2281 账户入账 ¥5,000.00，余额 ¥8,135.00', '🏦');
    setBalance(8135);
    await transfer(5000, '商户结算中心', '保证金');
    setBalance(3135);
    await recv('保证金已到账。<br>❗ 系统检测到您的账户存在<b>异常流水</b>，已被冻结，需缴纳<b>解冻金 ¥2,800</b>。', { ...JIE, delay: 1500 });
    await think('又要钱……？', 'shock');
    await recv('最后一步了亲！解冻后 <b>¥22,000</b> 立即到账～', JIE);
    await think('已经投进去这么多了……就差这一步了……', 'worried');
    await choose(['（转账）']);
    await transfer(2800, '商户结算中心', '解冻金');
    setBalance(335);
    await recv('提现处理中，请耐心等待…', { ...JIE, delay: 900 });

    Music.stop();
    await card('一小时后……', 1400);
    await send('请问什么时候到账？');
    sys('消息已发出，但被对方拒收了 ❗', 'err');
    SFX.bad();
    await guard(wait(1000));
    sys('该群聊已被群主解散', 'err');
    SFX.doom();
    stage.classList.add('glitch');
    await guard(wait(1200));
    stage.classList.remove('glitch');
    await think('……', 'shock');
    await think('我……被骗了。', 'sad');
    phoneShow(false);
  }

  async function aftermath() {
    Music.play('sad');
    phoneShow(false);
    setBalance(335);
    await card('那天晚上，Friedrich 一夜没睡。', 1900);
    await narr('被骗走的钱：¥17,525。其中 ¥5,000 是借来的网贷。');
    await narr('现在，他卡里只剩 ¥335。');
    await narr('7 天后要交房租 ¥2,300；14 天后，「速借宝」要还 ¥6,200。');
    const reported = await guard(modal({
      title: '天亮了。Friedrich 决定——',
      ava: Art.avatar('sad'),
      cls: 'center',
      body: '<p>他一遍遍翻着聊天记录，觉得自己蠢透了。</p>',
      buttons: [
        { text: '去派出所报警', sub: '整理聊天记录、转账凭证，并拨打 96110', value: true, cls: 'primary' },
        { text: '太丢人了，算了', sub: '谁也不告诉，自己扛', value: false }
      ]
    }));
    if (reported) {
      const cop = Art.npc('👮', '#9ec5ff');
      await say('你这是典型的「刷单返利」诈骗。先给小甜头，再用「卡单」「解冻金」一步步让你越陷越深。', { who: '民警 老陈', ava: cop });
      await say('聊天记录和转账凭证都很重要，我们会立案。能追回多少不好保证，但你来报案是对的。', { who: '民警 老陈', ava: cop });
      await say('还有，那个「速借宝」我们也会查一查。小伙子，被骗不丢人，别想不开。', { who: '民警 老陈', ava: cop });
      await think('谢谢您……', 'sad');
    } else {
      await think('要是被人知道我被骗了这么多……还是算了吧。', 'sad');
      await narr('他删掉了那些聊天记录，像是要把这件事一起删掉。');
    }
    await think('哭也没用。钱没了，就再挣回来。', 'determined');
    await recap(reported);
    return reported;
  }

  function recap(reported) {
    hideNarr();
    return guard(new Promise(res => {
      const r = el(`
        <div class="recap">
          <div class="recap-in">
            <h2>🔍 反诈复盘</h2>
            <p class="recap-sub">Friedrich 遇到的，是最常见的「刷单返利」诈骗。回头看，每一步都有破绽：</p>
            <ol>
              <li><b>「动动手指就赚钱」</b>——所有刷单、点赞返利都是诈骗，刷单本身也违法。</li>
              <li><b>先给小甜头</b>——¥15、¥60 的返利是诱饵，为的是让你放下戒心。</li>
              <li><b>「连单」「卡单」</b>——编造规则让你不断追加，「不补就清零」是在利用你的沉没成本。</li>
              <li><b>保证金、解冻金、税费</b>——正规平台提现从不需要先交钱。</li>
              <li><b>诱导网贷</b>——让你借钱继续转账，是骗子榨干受害者的最后一步。</li>
            </ol>
            <div class="recap-tip">📞 遇到可疑情况，拨打 <b>96110</b> 反诈专线；被骗后第一时间拨打 <b>110</b> 报警并保留证据。</div>
            <div class="recap-state">
              <div><small>余额</small><b>¥335</b></div>
              <div><small>房租 · 第 7 天</small><b>¥2,300</b></div>
              <div><small>速借宝 · 第 14 天</small><b>¥6,200</b></div>
            </div>
            <button class="btn primary big">开始打工 →</button>
          </div>
        </div>`);
      stage.appendChild(r);
      requestAnimationFrame(() => r.classList.add('show'));
      $('.btn', r).onclick = () => { SFX.good(); res(); };
    }));
  }

  async function run() {
    build();
    let reported;
    try {
      await script();
    } catch (e) {
      if (e !== SKIP) throw e;
    }
    // 跳过后也会进入后续的抉择
    $('.skip-btn', stage).remove();
    abortP = new Promise(() => {});
    phoneShow(false);
    reported = await aftermath();
    window.removeEventListener('keydown', keyHandler);
    return { reported };
  }

  return { run };
})();
