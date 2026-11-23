/* ========== 通用工具 ========== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const yuan = n => (n < 0 ? '-¥' : '¥') + Math.abs(Math.round(n)).toLocaleString('zh-CN');

/* localStorage 可能不可用（隐私模式等），全部包 try */
const Store = {
  get(k, d = null) {
    try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
  },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
};

/* 数字滚动动画 */
function animateNumber(node, from, to, dur = 700, fmt = yuan) {
  const t0 = performance.now();
  function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    node.textContent = fmt(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ========== 弹窗 ========== */
function modal({ title = '', body = '', ava = null, buttons = [{ text: '继续', value: true, cls: 'primary' }], cls = '', onMount = null } = {}) {
  return new Promise(resolve => {
    const root = $('#modal-root');
    const m = el(`
      <div class="modal-back ${cls}">
        <div class="modal">
          ${ava ? `<div class="modal-ava">${ava}</div>` : ''}
          <div class="modal-main">
            ${title ? `<h3 class="modal-title">${title}</h3>` : ''}
            <div class="modal-body">${body}</div>
            <div class="modal-btns"></div>
          </div>
        </div>
      </div>`);
    const bw = $('.modal-btns', m);
    let closed = false;
    function close(v) {
      if (closed) return;
      closed = true;
      m.classList.remove('in');
      m.classList.add('out');
      setTimeout(() => m.remove(), 220);
      resolve(v);
    }
    buttons.forEach(b => {
      const btn = el(`<button class="btn ${b.cls || ''}" ${b.disabled ? 'disabled' : ''}>${b.text}${b.sub ? `<small>${b.sub}</small>` : ''}</button>`);
      btn.onclick = () => { SFX.click(); close(b.value); };
      bw.appendChild(btn);
    });
    if (!buttons.length) bw.remove();
    root.appendChild(m);
    requestAnimationFrame(() => m.classList.add('in'));
    if (onMount) onMount(m, close);
  });
}

function toast(text, type = '') {
  const t = el(`<div class="toast ${type}">${text}</div>`);
  $('#toast-root').appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 2300);
}
