/* ========== 夜间事件 ========== */
const SCAM_MSGS = [
  { from: '106 9xxx 2831', t: '【ETC服务】您的ETC卡已失效，请点击 etc-renz.cn 重新认证，逾期将停止使用。', scam: true, why: '官方不会用短信链接要求「认证」，陌生网址就是钓鱼网站。' },
  { from: '店长（新号）', t: '小F，我换号了，这是我新微信。帮我先垫付 ¥2,000 货款给供应商，晚上就还你。', scam: true, why: '冒充熟人/领导：「换新号 + 急事 + 转账」，一定要打原来的电话核实。' },
  { from: '快递客服', t: '您好，您的快递在运输中丢失，我们将三倍理赔，请添加客服 QQ 进行办理。', scam: true, why: '理赔不需要加 QQ、开屏幕共享或提供验证码。' },
  { from: '+00 852 xxxx', t: '【医保中心】您的医保卡存在异常消费，即将被冻结，详情请按 1 转人工。', scam: true, why: '冒充医保、公检法的电话，真正的机关不会电话要求你转账或「配合调查」。' },
  { from: '游戏好友', t: '兄弟，我号里有限定皮肤低价出，走这个第三方交易平台，链接发你了。', scam: true, why: '虚假交易平台：付了钱以后会以「冻结」「保证金」为由继续要钱。' },
  { from: '「金融客服」', t: '您大学期间开通过校园贷账户，未注销将影响个人征信，请联系客服注销。', scam: true, why: '「注销校园贷」是典型诈骗，征信不能被任何人修改。' },
  { from: '股票老师', t: '加入我们的股票交流群，内部消息，带你月赚 30%，稳赚不赔！', scam: true, why: '「稳赚不赔」「高收益」都是投资诈骗的信号。' },
  { from: '陌生号码', t: '你好，我是你初中同学李强，钱包丢了，能先借我 800 吗？明天就还你。', scam: true, why: '涉及借钱，务必通过电话或视频确认对方身份。' },
  { from: '兼职群', t: '在家刷单，一单佣金 20 元，日赚 500，宝妈学生都能做！', scam: true, why: '刷单就是诈骗——Friedrich 就是这么被骗的。' },
  { from: '「官方补贴」', t: '恭喜您获得百万补贴名额！点击 dy-bt.top 领取 ¥888 现金红包。', scam: true, why: '天上不会掉馅饼，陌生链接不要点。' },
  { from: '菜鸟驿站', t: '【菜鸟驿站】您的包裹已到 3 号楼驿站，取件码 5-2-0631。', scam: false, why: '只告知取件码，没有链接，也没有让你付钱。' },
  { from: '妈妈', t: '降温了，记得多穿点，别光顾着干活。', scam: false, why: '来自家人的关心。' },
  { from: '奶茶店店长', t: '明天早班九点到哈，别迟到～', scam: false, why: '正常的工作通知，没有涉及钱。' },
  { from: '12306', t: '【铁路12306】您已购 12月20日 G123 次车票，请凭身份证检票乘车。', scam: false, why: '只是购票提醒，不含链接和转账要求。' },
  { from: '阿明', t: '晚上回来吃火锅不？我买了肥牛。', scam: false, why: '室友约饭～' },
  { from: '中国移动', t: '【中国移动】您本月账单 58.00 元，详情可在官方 APP 查询。', scam: false, why: '提醒你去官方渠道查询，没有链接。' }
];

const Events = {
  /* 固定剧情（每天晚上） */
  scheduled(S) {
    const d = S.day;
    const map = {
      1: 'roommate', 2: 'deliveryUnlock', 4: 'mom', 5: S.reported ? 'policeLoan' : 'scamQuiz',
      6: 'tutorUnlock', 9: S.reported ? null : 'recoveryScam', 10: 'dinner',
      11: S.reported ? 'policeRecover' : null, 12: 'scamQuiz', 13: S.loan > 0 ? 'collector' : null
    };
    return map[d] || null;
  },
  randomPool(S) {
    const pool = ['scamQuiz', 'sick', 'insomnia', 'review', 'hotpot'];
    if (!S.flags.wallet) pool.push('wallet', 'wallet');
    return pool.filter(id => id !== S.lastRandom);
  },

  async run(id, S) {
    if (!this.defs[id]) return;
    await this.defs[id](S);
  },

  defs: {
    async roommate(S) {
      await modal({
        title: '室友阿明', ava: Art.npc('🧑‍🦱', '#7bd88f'),
        body: `<p>“听说你的事了……别太自责，骗子都是专业的。”</p><p>“我打工的那家便利店缺夜班，钱比白天多一些，我帮你跟店长说了，明晚就能去。”</p>`,
        buttons: [{ text: '谢谢你，阿明', cls: 'primary' }]
      });
      S.unlocked.cashier = true;
      Game.mood(+6);
      Game.log('🏪 解锁了「便利店夜班」');
    },
    async deliveryUnlock(S) {
      await modal({
        title: '招聘信息', ava: Art.npc('🛵', '#ffd166'),
        body: `<p>楼下外卖站点贴出了告示：</p><blockquote>众包骑手招募 · 多劳多得 · 站点提供电动车</blockquote><p>Friedrich 去问了问，站长说<b>明天就能上岗</b>。</p><p class="hint">✅ 这是正规站点，不需要交任何押金——要你先交钱的「招聘」才要当心。</p>`,
        buttons: [{ text: '报名！', cls: 'primary' }]
      });
      S.unlocked.delivery = true;
      Game.log('🛵 解锁了「外卖骑手」');
    },
    async mom(S) {
      const v = await modal({
        title: '📞 妈妈来电', ava: Art.npc('👩', '#ff9fb2'),
        body: `<p>“儿子，最近工作找得怎么样？钱还够花吗？”</p><p class="hint">Friedrich 握着手机，不知道该怎么开口。</p>`,
        buttons: [
          { text: '（说实话）妈，我被骗了……', value: 'truth', cls: 'primary' },
          { text: '（隐瞒）挺好的，别担心', value: 'hide' }
        ]
      });
      if (v === 'truth') {
        await modal({
          title: '妈妈', ava: Art.npc('👩', '#ff9fb2'),
          body: `<p>电话那头沉默了一会儿。</p><p>“傻孩子……钱没了可以再挣，人没事就好。”</p><p>“妈给你转一千，先别饿着。以后再有人让你转钱，先给家里打个电话。”</p>`,
          buttons: [{ text: '嗯……谢谢妈', cls: 'primary' }]
        });
        Game.money(+1000, '妈妈转账');
        Game.mood(+20);
        S.flags.toldMom = true;
      } else {
        await modal({ title: '', ava: Art.avatar('sad'), body: '<p>挂掉电话，Friedrich 鼻子一酸。</p><p class="hint">被骗不是丢人的事，说出来往往能得到帮助。</p>', buttons: [{ text: '……' }] });
        Game.mood(-10);
      }
    },
    async policeLoan(S) {
      await modal({
        title: '📞 派出所来电', ava: Art.npc('👮', '#9ec5ff'),
        body: `<p>“小伙子，你说的那个「速借宝」我们查了，<b>涉嫌违规放贷</b>。”</p><p>“所谓 ¥1,200「服务费」不受法律保护，你只需要归还实际到手的本金 <b>¥6,000</b>。”</p>`,
        buttons: [{ text: '太好了！', cls: 'primary' }]
      });
      S.loan = Math.max(0, S.loan - 1200);
      Game.mood(+12);
      Game.log('⚖️ 网贷「服务费」¥1,200 被免除');
    },
    async policeRecover(S) {
      await modal({
        title: '📞 好消息', ava: Art.npc('👮', '#9ec5ff'),
        body: `<p>“警方打掉了一个刷单诈骗团伙，追回了一部分赃款。”</p><p>“按比例，返还给你 <b>¥1,800</b>。证据保存得好，帮了大忙。”</p>`,
        buttons: [{ text: '谢谢警察同志！', cls: 'primary' }]
      });
      Game.money(+1800, '追回赃款');
      Game.mood(+20);
    },
    async tutorUnlock(S) {
      await modal({
        title: '邻居王阿姨', ava: Art.npc('👩‍🦳', '#c49bff'),
        body: `<p>“小伙子，听说你是学德语的？我家小宇明年要去德国读书。”</p><p>“每天晚上能不能来教他一会儿？课时费好商量！”</p>`,
        buttons: [{ text: '当然可以！', cls: 'primary' }]
      });
      S.unlocked.tutor = true;
      Game.mood(+8);
      Game.log('📚 解锁了「德语家教」');
    },
    async recoveryScam(S) {
      const v = await modal({
        title: '💬 一条新私信', ava: Art.npc('🕴️', '#888'),
        body: `<p class="quote">【资金追回中心】您好，我们是专业网络追损团队，已锁定骗子账户。先支付 <b>¥800</b> 律师费，即可帮您追回全部被骗资金。</p>`,
        buttons: [
          { text: '付钱，说不定能追回来', value: 'pay' },
          { text: '这是二次诈骗！拉黑，去报警', value: 'no', cls: 'primary' }
        ]
      });
      if (v === 'pay') {
        const lose = Math.min(800, Math.max(0, S.money));
        Game.money(-lose, '「律师费」');
        await modal({ title: '又被骗了', ava: Art.avatar('sad'), body: `<p>转完 ¥${lose} 之后，对方的头像就再也没有亮过。</p><p class="hint">「帮你追回被骗资金」是专门针对受害者的二次诈骗。追赃只能通过公安机关。</p>`, buttons: [{ text: '……' }] });
        Game.mood(-20);
        S.stats.fell++;
      } else {
        await modal({ title: '迟到的报警', ava: Art.avatar('determined'), body: '<p>Friedrich 拉黑了对方，终于还是走进了派出所。</p><p>“这些人专挑被骗过的人下手……我不能再躲了。”</p><p class="hint">✅ 报了案，也许还能追回一些钱。</p>', buttons: [{ text: '继续', cls: 'primary' }] });
        S.reported = true;
        S.flags.reportedLate = true;
        S.stats.spotted++;
        Game.mood(+10);
      }
    },
    async dinner(S) {
      const v = await modal({
        title: '老同学聚餐', ava: Art.npc('🧑‍🤝‍🧑', '#ffb86b'),
        body: '<p>大学同学群里在约周末聚餐，AA 每人 ¥120。</p><p>“Friedrich 你一定要来啊，好久没见了！”</p>',
        buttons: [{ text: '去！（-¥120）', value: true, cls: 'primary', disabled: S.money < 120 }, { text: '说自己要加班', value: false }]
      });
      if (v) {
        Game.money(-120, '同学聚餐');
        Game.mood(+25);
        await modal({ title: '', ava: Art.avatar('happy'), body: '<p>大家聊起各自的近况，有人找工作也碰过壁，有人也差点被骗过。</p><p>Friedrich 第一次笑得这么轻松。</p>', buttons: [{ text: '继续' }] });
      } else Game.mood(-6);
    },
    async collector(S) {
      const v = await modal({
        title: '📞 陌生来电', ava: Art.npc('😈', '#ff6b81'),
        body: `<p>“速借宝的！明天到期，钱准备好没有？”</p><p>“还不上的话，我们就给你通讯录里的所有人打电话！”</p>`,
        buttons: [
          { text: '（吓坏了）求求你们再宽限几天', value: 'beg' },
          { text: '我会按期还款。暴力催收违法，再骚扰我就报警', value: 'firm', cls: 'primary' }
        ]
      });
      if (v === 'firm') {
        await modal({ title: '', ava: Art.avatar('determined'), body: '<p>对方骂了几句，挂了电话。</p><p class="hint">✅ 催收人员威胁、骚扰你或你的亲友属于违法行为，可以向公安机关、金融监管部门投诉举报。</p>', buttons: [{ text: '继续', cls: 'primary' }] });
        S.flags.stoodUp = true;
        Game.mood(+5);
      } else {
        await modal({ title: '', ava: Art.avatar('worried'), body: '<p>对方冷笑了一声挂了电话。Friedrich 一整晚都没睡好。</p>', buttons: [{ text: '……' }] });
        Game.mood(-15);
        S.energy = clamp(S.energy - 15, 0, 100);
      }
    },
    async scamQuiz(S) {
      const scams = shuffle(SCAM_MSGS.filter(m => m.scam)).slice(0, rand(2, 3));
      const real = shuffle(SCAM_MSGS.filter(m => !m.scam)).slice(0, 4 - scams.length);
      const msgs = shuffle([...scams, ...real]);
      const picks = await modal({
        title: '📱 睡前刷手机，收到了几条消息',
        cls: 'wide',
        body: `<p class="hint">判断每一条是「正常」还是「诈骗」：</p>
          <div class="quiz">${msgs.map((m, i) => `
            <div class="qz" data-i="${i}">
              <div class="qz-from">${m.from}</div>
              <div class="qz-t">${m.t}</div>
              <div class="qz-btns"><button data-v="0">✅ 正常</button><button data-v="1">🚨 诈骗</button></div>
            </div>`).join('')}</div>`,
        buttons: [],
        onMount(m, close) {
          const ans = {};
          const sub = el('<button class="btn primary" disabled>提交判断</button>');
          $('.modal-main', m).appendChild(el('<div class="modal-btns"></div>')).appendChild(sub);
          $$('.qz', m).forEach(q => $$('button', q).forEach(b => b.onclick = () => {
            SFX.click();
            ans[q.dataset.i] = b.dataset.v === '1';
            $$('button', q).forEach(x => x.classList.toggle('on', x === b));
            sub.disabled = Object.keys(ans).length < msgs.length;
          }));
          sub.onclick = () => close(ans);
        }
      });
      let right = 0, lost = 0, fooled = 0;
      const rows = msgs.map((m, i) => {
        const ok = picks[i] === m.scam;
        if (ok) right++;
        if (m.scam && !ok) { fooled++; lost += rand(100, 250); }
        return `<div class="qz-r ${ok ? 'ok' : 'no'}"><b>${ok ? '✔' : '✘'} ${m.scam ? '诈骗' : '正常'}</b>「${m.t.slice(0, 18)}…」<p>${m.why}</p></div>`;
      }).join('');
      lost = Math.min(lost, Math.max(0, S.money));
      await modal({
        title: right === msgs.length ? '🎉 火眼金睛！全部识破' : `判断正确 ${right} / ${msgs.length}`,
        cls: 'wide',
        body: `${rows}${fooled ? `<p class="bad">你点开了可疑链接……损失 ¥${lost}。</p>` : ''}`,
        buttons: [{ text: '记住了', cls: 'primary' }]
      });
      S.stats.spotted += scams.length - fooled;
      if (fooled) { Game.money(-lost, '误入诈骗链接'); S.stats.fell += fooled; Game.mood(-8); }
      if (right === msgs.length) { Game.mood(+10); S.flags.eagle = true; }
    },
    async sick(S) {
      const v = await modal({
        title: '🤒 着凉了', ava: Art.avatar('tired'),
        body: '<p>连着几天早出晚归，Friedrich 发起了低烧。</p>',
        buttons: [{ text: '去社区诊所（-¥60）', value: true, cls: 'primary' }, { text: '硬扛过去', value: false }]
      });
      if (v) { Game.money(-60, '看病'); Game.mood(+2); }
      else { S.energy = clamp(S.energy - 30, 0, 100); Game.mood(-8); toast('体力 -30', 'bad'); }
    },
    async insomnia(S) {
      const v = await modal({
        title: '🌙 失眠', ava: Art.avatar('worried'),
        body: '<p>躺在床上，Friedrich 又想起了那些转出去的钱。</p>',
        buttons: [{ text: '打开备忘录，写下还款计划', value: true, cls: 'primary' }, { text: '刷手机刷到天亮', value: false }]
      });
      if (v) { Game.mood(+8); toast('心情 +8：计划写好了，心里踏实多了'); }
      else { S.energy = clamp(S.energy - 20, 0, 100); Game.mood(-5); toast('体力 -20', 'bad'); }
    },
    async review(S) {
      await modal({ title: '⭐ 好评', ava: Art.avatar('happy'), body: '<p>有顾客在平台上给 Friedrich 写了好评：「小哥人超好，还会说德语！」</p><p>老板发来了 <b>¥50</b> 红包。</p>', buttons: [{ text: '开心！', cls: 'primary' }] });
      Game.money(+50, '好评红包');
      Game.mood(+8);
    },
    async hotpot(S) {
      await modal({ title: '🍲 宵夜', ava: Art.npc('🧑‍🦱', '#7bd88f'), body: '<p>阿明煮了一锅火锅：“别光顾着干活，吃点热乎的。”</p>', buttons: [{ text: '开吃！', cls: 'primary' }] });
      S.energy = clamp(S.energy + 10, 0, 100);
      Game.mood(+12);
    },
    async wallet(S) {
      S.flags.wallet = true;
      const v = await modal({
        title: '👛 捡到钱包', ava: Art.avatar('shock'),
        body: '<p>下班路上，Friedrich 捡到一个钱包，里面有 <b>¥600</b> 现金和一张身份证。</p><p class="hint">¥600……差不多是两天的工钱。</p>',
        buttons: [{ text: '按身份证联系失主', value: true, cls: 'primary' }, { text: '把现金留下……', value: false }]
      });
      if (v) {
        await modal({ title: '', ava: Art.avatar('happy'), body: '<p>失主是一位赶夜班的护士，激动得连声道谢，非要塞给他 ¥100。</p>', buttons: [{ text: '继续' }] });
        Game.money(+100, '失主答谢');
        Game.mood(+15);
        S.flags.honest = true;
      } else {
        Game.money(+600, '钱包里的钱');
        Game.mood(-25);
        S.flags.keptWallet = true;
        await modal({ title: '', ava: Art.avatar('worried'), body: '<p>钱是有了，可他想起了自己被骗时的感觉，一整晚都良心不安。</p>', buttons: [{ text: '……' }] });
      }
    }
  }
};
