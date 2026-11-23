/* ========== 合成音效 & 背景音乐（无需音频文件） ========== */
const SFX = {
  ctx: null,
  master: null,
  on: Store.get('fj_sound', true),
  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return !!this.ctx;
  },
  tone(f, d = 0.1, type = 'sine', v = 0.1, slide = 0, delay = 0) {
    if (!this.on || !this.ensure()) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(40, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + d + 0.03);
  },
  click() { this.tone(520, .06, 'triangle', .07); },
  type() { this.tone(1000 + Math.random() * 300, .02, 'square', .012); },
  msg() { this.tone(880, .07, 'sine', .1); this.tone(1320, .1, 'sine', .08, 0, .07); },
  coin() { this.tone(988, .07, 'square', .05); this.tone(1319, .2, 'square', .05, 0, .07); },
  good() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .16, 'triangle', .09, 0, i * .08)); },
  bad() { this.tone(240, .28, 'sawtooth', .05, -120); },
  beep() { this.tone(1760, .07, 'square', .035); },
  pop() { this.tone(320, .08, 'sine', .1, 360); },
  tick() { this.tone(1250, .04, 'sine', .05); },
  whoosh() { this.tone(200, .25, 'triangle', .04, 500); },
  alarm() {
    for (let i = 0; i < 3; i++) {
      this.tone(660, .12, 'square', .05, 0, i * .26);
      this.tone(440, .12, 'square', .05, 0, i * .26 + .13);
    }
  },
  doom() { this.tone(110, 1.2, 'sawtooth', .06, -50); this.tone(165, 1.2, 'sine', .05, -60); },
  toggle() {
    this.on = !this.on;
    Store.set('fj_sound', this.on);
    if (this.on) { this.click(); Music.resume(); } else Music.pause();
    return this.on;
  }
};

/* 简单的生成式背景音乐：和弦 + 琶音，三种情绪 */
const Music = {
  mode: null,
  timer: null,
  step: 0,
  songs: {
    // 每小节一个和弦（MIDI 音符）
    day:   { bpm: 92, chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]] },
    night: { bpm: 76, chords: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 66]] },
    tense: { bpm: 104, chords: [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]] },
    sad:   { bpm: 64, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [52, 55, 59]] }
  },
  play(mode) {
    if (this.mode === mode && this.timer) return;
    this.stop();
    this.mode = mode;
    if (!SFX.on) return;
    this.resume();
  },
  resume() {
    if (!this.mode || this.timer || !SFX.on) return;
    const song = this.songs[this.mode];
    const eighth = 60 / song.bpm / 2 * 1000;
    this.step = 0;
    this.timer = setInterval(() => this.tickNote(song), eighth);
  },
  pause() { clearInterval(this.timer); this.timer = null; },
  stop() { this.pause(); this.mode = null; },
  hz: m => 440 * Math.pow(2, (m - 69) / 12),
  tickNote(song) {
    if (!SFX.on || !SFX.ctx || SFX.ctx.state !== 'running') { this.step++; return; }
    const bar = Math.floor(this.step / 8) % song.chords.length;
    const beat = this.step % 8;
    const ch = song.chords[bar];
    const len = 60 / song.bpm / 2;
    if (beat === 0) {
      SFX.tone(this.hz(ch[0] - 24), len * 7, 'triangle', .045);
      ch.forEach(n => SFX.tone(this.hz(n), len * 7.5, 'sine', .012));
    }
    const pattern = this.mode === 'tense' ? [0, 1, 2, 1, 0, 2, 1, 2] : [0, 2, 1, 3, 2, 1, 3, 2];
    const n = ch[pattern[beat] % ch.length] + 12;
    if (this.mode !== 'sad' || beat % 2 === 0) SFX.tone(this.hz(n), len * 1.6, 'sine', this.mode === 'tense' ? .022 : .02);
    this.step++;
  }
};

/* 浏览器要求用户交互后才能播放声音 */
['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => { if (SFX.on) { SFX.ensure(); Music.resume(); } }, { passive: true }));
