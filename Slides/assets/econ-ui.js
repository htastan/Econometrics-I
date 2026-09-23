/* =====================================================================
   econ-ui.js — plotting, controls, quizzes and deck bootstrapping
   for the Econometrics I interactive reveal.js slides.
   Depends on: econ-core.js (window.E), reveal.js, KaTeX (optional).
   ===================================================================== */
(function () {
  'use strict';
  const E = window.E;
  const UI = {};
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------------- tiny DOM helpers ---------------- */
  UI.$ = (sel, root = document) => root.querySelector(sel);
  UI.$$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  UI.el = function (tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v); else e.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
    return e;
  };
  function svg(tag, attrs = {}) { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v); return e; }
  UI.svg = svg;

  /* KaTeX rendering helpers (safe if KaTeX is missing) */
  UI.tex = function (el, tex, display = false) {
    if (window.katex) { try { window.katex.render(tex, el, { displayMode: display, throwOnError: false }); return; } catch (e) { /* fallthrough */ } }
    el.textContent = tex;
  };
  UI.texStr = (tex, display = false) => window.katex ? window.katex.renderToString(tex, { displayMode: display, throwOnError: false }) : tex;
  /* render \( … \) and \[ … \] inside an element we built ourselves */
  UI.renderMath = function (root) {
    if (!root || !window.katex) return;
    const html = root.innerHTML;
    if (!/\\\(|\\\[/.test(html)) return;
    const dec = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    root.innerHTML = html
      .replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => UI.texStr(dec(t), true))
      .replace(/\\\(([\s\S]+?)\\\)/g, (_, t) => UI.texStr(dec(t), false));
  };

  /* ---------------- colors (kept in sync with theme.css) ---------------- */
  UI.C = { ink: '#1d2733', muted: '#6b7785', grid: '#e7ebf0', axis: '#9aa5b1', blue: '#1f5fa8', orange: '#d9622b', green: '#2f8f5b', red: '#c0392b', purple: '#7048a8', teal: '#12867f', gold: '#c8961e', point: '#1f5fa8', pointFill: 'rgba(31,95,168,.35)' };

  /* ---------------- nice ticks ---------------- */
  function niceTicks(lo, hi, n = 6) {
    const span = hi - lo; if (!(span > 0)) return [lo];
    const step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0))), r = step0 / mag;
    const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
    const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toPrecision(12));
    return out;
  }
  UI.niceTicks = niceTicks;
  const tickFmt = v => { const a = Math.abs(v); if (a === 0) return '0'; if (a >= 10000) return (v / 1000).toFixed(0) + 'k'; if (a >= 100) return v.toFixed(0); if (a >= 1) return +v.toFixed(2) + ''; return +v.toPrecision(2) + ''; };

  /* =====================================================================
     Plot — lightweight responsive SVG plot
     new UI.Plot(container, {w, h, xlim:[a,b], ylim:[c,d], xlab, ylab, margin})
     ===================================================================== */
  class Plot {
    constructor(container, o = {}) {
      this.o = Object.assign({ w: 640, h: 400, xlim: [0, 1], ylim: [0, 1], xlab: '', ylab: '', grid: true, xticks: null, yticks: null, xfmt: tickFmt, yfmt: tickFmt }, o);
      this.m = Object.assign({ l: 58, r: 16, t: 14, b: 46 }, o.margin || {});
      // KaTeX x labels are taller than plain text: leave room below the tick labels
      if (/\\\(/.test(this.o.xlab || '') && this.m.b < 56) this.m.b = 56;
      if (/\\\(/.test(this.o.ylab || '') && this.m.l < 62) this.m.l = 62;
      this.root = svg('svg', { viewBox: `0 0 ${this.o.w} ${this.o.h}`, class: 'eplot', preserveAspectRatio: 'xMidYMid meet' });
      (typeof container === 'string' ? document.querySelector(container) : container).appendChild(this.root);
      const defs = svg('defs'); this.root.appendChild(defs); this.defs = defs;
      this.clipId = 'clip' + Math.random().toString(36).slice(2, 9);
      const cp = svg('clipPath', { id: this.clipId }); cp.appendChild(svg('rect', { x: this.m.l, y: this.m.t, width: this.o.w - this.m.l - this.m.r, height: this.o.h - this.m.t - this.m.b })); defs.appendChild(cp);
      this.gAxes = svg('g', { class: 'axes' }); this.gData = svg('g', { class: 'data', 'clip-path': `url(#${this.clipId})` }); this.gTop = svg('g', { class: 'top' });
      this.root.append(this.gAxes, this.gData, this.gTop);
      this.setLimits(this.o.xlim, this.o.ylim);
    }
    get pw() { return this.o.w - this.m.l - this.m.r; }
    get ph() { return this.o.h - this.m.t - this.m.b; }
    X(v) { return this.m.l + (v - this.xlim[0]) / (this.xlim[1] - this.xlim[0]) * this.pw; }
    Y(v) { return this.m.t + (1 - (v - this.ylim[0]) / (this.ylim[1] - this.ylim[0])) * this.ph; }
    invX(px) { return this.xlim[0] + (px - this.m.l) / this.pw * (this.xlim[1] - this.xlim[0]); }
    invY(py) { return this.ylim[0] + (1 - (py - this.m.t) / this.ph) * (this.ylim[1] - this.ylim[0]); }
    setLimits(xlim, ylim) { this.xlim = xlim; this.ylim = ylim; this.drawAxes(); return this; }
    drawAxes() {
      const g = this.gAxes; g.innerHTML = ''; const o = this.o, m = this.m;
      const xt = o.xticks || niceTicks(this.xlim[0], this.xlim[1], Math.round(this.pw / 90));
      const yt = o.yticks || niceTicks(this.ylim[0], this.ylim[1], Math.round(this.ph / 60));
      if (o.grid) {
        xt.forEach(v => g.appendChild(svg('line', { x1: this.X(v), x2: this.X(v), y1: m.t, y2: m.t + this.ph, class: 'grid' })));
        yt.forEach(v => g.appendChild(svg('line', { y1: this.Y(v), y2: this.Y(v), x1: m.l, x2: m.l + this.pw, class: 'grid' })));
      }
      g.appendChild(svg('line', { x1: m.l, x2: m.l + this.pw, y1: m.t + this.ph, y2: m.t + this.ph, class: 'axis' }));
      g.appendChild(svg('line', { x1: m.l, x2: m.l, y1: m.t, y2: m.t + this.ph, class: 'axis' }));
      xt.forEach(v => { const t = svg('text', { x: this.X(v), y: m.t + this.ph + 18, class: 'tick', 'text-anchor': 'middle' }); t.textContent = o.xfmt(v); g.appendChild(t); });
      yt.forEach(v => { const t = svg('text', { x: m.l - 7, y: this.Y(v) + 4, class: 'tick', 'text-anchor': 'end' }); t.textContent = o.yfmt(v); g.appendChild(t); });
      if (o.xlab) this.label(o.xlab, m.l + this.pw / 2, o.h - 6, g);
      if (o.ylab) this.label(o.ylab, 14, m.t + this.ph / 2, g, true);
    }
    /* axis/plot label; text containing \( … \) is typeset with KaTeX inside a foreignObject
       (plain SVG text cannot place accents such as hats correctly) */
    label(str, x, y, parent, rotate = false, cls = 'alab', anchor = 'middle') {
      parent = parent || this.gTop;
      if (!/\\\(/.test(str) || !window.katex) {
        const t = svg('text', { x, y, class: cls, 'text-anchor': anchor, transform: rotate ? `rotate(-90 ${x} ${y})` : null }); t.textContent = str; parent.appendChild(t); return t;
      }
      // x labels: box bottom-aligned with the SVG edge; rotated y labels: box centered on (x, y)
      const W = 420, H = 28, top = rotate ? y - H / 2 + 2 : Math.min(y - 18, this.o.h - H);
      const fo = svg('foreignObject', { x: anchor === 'middle' ? x - W / 2 : x, y: top, width: W, height: H, class: 'texlabel ' + cls, transform: rotate ? `rotate(-90 ${x} ${y})` : null });
      const div = document.createElement('div'); div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml'); div.className = 'texlabel-inner'; div.style.textAlign = anchor === 'middle' ? 'center' : 'left';
      div.innerHTML = str; UI.renderMath(div); fo.appendChild(div); parent.appendChild(fo); return fo;
    }
    clear() { this.gData.innerHTML = ''; this.gTop.innerHTML = ''; return this; }
    layer(top = false) { const g = svg('g'); (top ? this.gTop : this.gData).appendChild(g); return g; }
    points(xs, ys, s = {}, parent) {
      const g = parent || svg('g'); const r = s.r ?? 3.6;
      for (let i = 0; i < xs.length; i++) { if (xs[i] == null || ys[i] == null) continue; g.appendChild(svg('circle', { cx: this.X(xs[i]), cy: this.Y(ys[i]), r, fill: s.fill ?? UI.C.pointFill, stroke: s.stroke ?? UI.C.point, 'stroke-width': s.sw ?? 0.8, class: s.cls })); }
      if (!parent) this.gData.appendChild(g); return g;
    }
    path(xs, ys, s = {}, parent) {
      let d = ''; let pen = false;
      for (let i = 0; i < xs.length; i++) { const x = xs[i], y = ys[i]; if (y == null || !Number.isFinite(y)) { pen = false; continue; } d += (pen ? 'L' : 'M') + this.X(x).toFixed(2) + ',' + this.Y(y).toFixed(2); pen = true; }
      const p = svg('path', { d, fill: 'none', stroke: s.color ?? UI.C.orange, 'stroke-width': s.width ?? 3, 'stroke-dasharray': s.dash, opacity: s.opacity, class: s.cls, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
      (parent || (s.top ? this.gTop : this.gData)).appendChild(p); return p;
    }
    fn(f, s = {}, parent) { const a = s.from ?? this.xlim[0], b = s.to ?? this.xlim[1], n = s.n ?? 200; const xs = E.range(a, b, n); return this.path(xs, xs.map(f), s, parent); }
    area(f, a, b, s = {}, parent) {
      const n = s.n ?? 120, xs = E.range(a, b, n), base = s.base ?? 0;
      let d = `M${this.X(a)},${this.Y(base)}`; xs.forEach(x => { d += `L${this.X(x).toFixed(2)},${this.Y(f(x)).toFixed(2)}`; }); d += `L${this.X(b)},${this.Y(base)}Z`;
      const p = svg('path', { d, fill: s.fill ?? 'rgba(217,98,43,.35)', stroke: 'none', class: s.cls }); (parent || this.gData).appendChild(p); return p;
    }
    line(x1, y1, x2, y2, s = {}, parent) { const l = svg('line', { x1: this.X(x1), y1: this.Y(y1), x2: this.X(x2), y2: this.Y(y2), stroke: s.color ?? UI.C.ink, 'stroke-width': s.width ?? 1.5, 'stroke-dasharray': s.dash, opacity: s.opacity, class: s.cls }); (parent || (s.top ? this.gTop : this.gData)).appendChild(l); return l; }
    hline(y, s = {}, parent) { return this.line(this.xlim[0], y, this.xlim[1], y, s, parent); }
    vline(x, s = {}, parent) { return this.line(x, this.ylim[0], x, this.ylim[1], s, parent); }
    rect(x1, y1, x2, y2, s = {}, parent) { const r = svg('rect', { x: Math.min(this.X(x1), this.X(x2)), y: Math.min(this.Y(y1), this.Y(y2)), width: Math.abs(this.X(x2) - this.X(x1)), height: Math.abs(this.Y(y2) - this.Y(y1)), fill: s.fill ?? 'rgba(31,95,168,.2)', stroke: s.stroke ?? 'none', 'stroke-width': s.sw ?? 1, opacity: s.opacity, class: s.cls }); (parent || this.gData).appendChild(r); return r; }
    text(x, y, str, s = {}, parent) { const t = svg('text', { x: this.X(x) + (s.dx ?? 0), y: this.Y(y) + (s.dy ?? 0), 'text-anchor': s.anchor ?? 'start', class: 'ptext ' + (s.cls || ''), fill: s.color, 'font-size': s.size, 'font-weight': s.weight }); t.textContent = str; (parent || this.gTop).appendChild(t); return t; }
    hist(h, s = {}, parent) { const g = parent || svg('g'); const scale = s.density ? 1 / (E.sum(h.counts) * h.width) : 1; h.counts.forEach((c, i) => { if (!c) return; g.appendChild(svg('rect', { x: this.X(h.edges[i]) + 0.5, y: this.Y(c * scale), width: Math.max(0, this.X(h.edges[i + 1]) - this.X(h.edges[i]) - 1), height: this.Y(0) - this.Y(c * scale), fill: s.fill ?? 'rgba(31,95,168,.55)', class: s.cls })); }); if (!parent) this.gData.appendChild(g); return g; }
    legend(items, pos = 'tr') { const g = svg('g', { class: 'legend' }); const x0 = pos.includes('r') ? this.m.l + this.pw - 190 : this.m.l + 12; let y = pos.includes('t') ? this.m.t + 18 : this.m.t + this.ph - items.length * 22; items.forEach(it => { g.appendChild(svg('line', { x1: x0, x2: x0 + 26, y1: y - 5, y2: y - 5, stroke: it.color, 'stroke-width': it.width ?? 3, 'stroke-dasharray': it.dash })); const t = svg('text', { x: x0 + 34, y, class: 'ltext' }); t.textContent = it.label; g.appendChild(t); y += 22; }); this.gTop.appendChild(g); return g; }
    /* convert a pointer event to data coordinates (works under reveal.js scaling) */
    toData(evt) { const pt = this.root.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY; const p = pt.matrixTransform(this.root.getScreenCTM().inverse()); return { x: this.invX(p.x), y: this.invY(p.y), px: p.x, py: p.y }; }
    /* make an element draggable; cb receives data coords */
    drag(elm, cb, end) {
      elm.style.cursor = 'grab';
      elm.addEventListener('pointerdown', ev => {
        ev.preventDefault(); ev.stopPropagation(); elm.setPointerCapture(ev.pointerId); elm.style.cursor = 'grabbing';
        const move = e => cb(this.toData(e), e);
        const up = e => { elm.releasePointerCapture(ev.pointerId); elm.removeEventListener('pointermove', move); elm.removeEventListener('pointerup', up); elm.style.cursor = 'grab'; end && end(this.toData(e)); };
        elm.addEventListener('pointermove', move); elm.addEventListener('pointerup', up);
      });
    }
  }
  UI.Plot = Plot;

  /* =====================================================================
     Controls
     ===================================================================== */
  /* slider: returns {input, get(), set(v)} */
  UI.slider = function (parent, o) {
    const fmt = o.fmt || (v => v);
    const wrap = UI.el('label', { class: 'ctrl' });
    const lab = UI.el('span', { class: 'ctrl-label', html: o.label });
    const inp = UI.el('input', { type: 'range', min: o.min, max: o.max, step: o.step ?? 'any', value: o.value });
    const val = UI.el('span', { class: 'ctrl-val' });
    const upd = () => { val.innerHTML = fmt(+inp.value); };
    inp.addEventListener('input', () => { upd(); o.onInput && o.onInput(+inp.value); });
    inp.addEventListener('change', () => { o.onChange && o.onChange(+inp.value); });
    wrap.append(lab, inp, val); parent.appendChild(wrap); upd();
    UI.renderMath(lab);
    return { el: wrap, input: inp, get: () => +inp.value, set: (v, fire) => { inp.value = v; upd(); fire && o.onInput && o.onInput(+inp.value); } };
  };
  UI.button = function (parent, label, onClick, cls = '') { const b = UI.el('button', { class: 'ebtn ' + cls, html: label, type: 'button' }); b.addEventListener('click', onClick); parent.appendChild(b); return b; };
  UI.select = function (parent, o) {
    const wrap = UI.el('label', { class: 'ctrl ctrl-select' }); wrap.append(UI.el('span', { class: 'ctrl-label', html: o.label || '' }));
    const s = UI.el('select'); o.options.forEach(op => { const opt = UI.el('option', { value: op.value ?? op, html: op.label ?? op }); s.appendChild(opt); }); if (o.value !== undefined) s.value = o.value;
    s.addEventListener('change', () => o.onChange && o.onChange(s.value)); wrap.append(s); parent.appendChild(wrap); return { el: wrap, input: s, get: () => s.value, set: v => { s.value = v; } };
  };
  UI.toggle = function (parent, o) {
    const wrap = UI.el('label', { class: 'ctrl ctrl-toggle' }); const c = UI.el('input', { type: 'checkbox' }); c.checked = !!o.value;
    c.addEventListener('change', () => o.onChange && o.onChange(c.checked)); const sp = UI.el('span', { html: o.label }); wrap.append(c, sp); parent.appendChild(wrap);
    UI.renderMath(sp);
    return { el: wrap, input: c, get: () => c.checked, set: v => { c.checked = v; } };
  };
  /* segmented control (radio buttons) */
  UI.segmented = function (parent, o) {
    const wrap = UI.el('div', { class: 'seg' }); let cur = o.value ?? (o.options[0].value ?? o.options[0]);
    const btns = o.options.map(op => { const v = op.value ?? op; const b = UI.el('button', { type: 'button', html: op.label ?? op, class: v === cur ? 'on' : '' }); UI.renderMath(b); b.addEventListener('click', () => { cur = v; btns.forEach(x => x.classList.remove('on')); b.classList.add('on'); o.onChange && o.onChange(v); }); wrap.appendChild(b); return b; });
    if (o.label) { const lb = UI.el('span', { class: 'ctrl-label', html: o.label }); parent.appendChild(lb); UI.renderMath(lb); }
    parent.appendChild(wrap);
    return { el: wrap, get: () => cur, set: v => { cur = v; btns.forEach((b, i) => b.classList.toggle('on', (o.options[i].value ?? o.options[i]) === v)); } };
  };
  UI.readout = function (parent, cls = '') { const d = UI.el('div', { class: 'readout ' + cls }); parent.appendChild(d); return d; };

  /* standard widget scaffold: returns {plot area, controls, readout} */
  UI.scaffold = function (host, o = {}) {
    host.innerHTML = ''; host.classList.add('widget-live');
    const grid = UI.el('div', { class: 'wgrid ' + (o.layout || 'side') });
    const left = UI.el('div', { class: 'wplot' }), right = UI.el('div', { class: 'wside' });
    const controls = UI.el('div', { class: 'wcontrols' }), out = UI.el('div', { class: 'wout' });
    right.append(controls, out); grid.append(left, right); host.appendChild(grid);
    return { plotHost: left, controls, out, side: right };
  };

  /* regression table (compact, R-summary-like) */
  UI.regTable = function (res, o = {}) {
    const names = o.names || res.names; const se = o.se || res.se; const d = o.digits ?? 4;
    let h = `<table class="regtab"><thead><tr><th></th><th>Estimate</th><th>Std. Error</th><th>t value</th><th>Pr(&gt;|t|)</th><th></th></tr></thead><tbody>`;
    res.coef.forEach((b, j) => { const t = b / se[j], p = 2 * (1 - E.pt(Math.abs(t), res.df)); h += `<tr${o.hl && o.hl.includes(j) ? ' class="hl"' : ''}><td class="nm">${names[j]}</td><td>${E.fmt(b, d)}</td><td>${E.fmt(se[j], d)}</td><td>${E.fmt(t, 2)}</td><td>${E.fmtP(p)}</td><td class="st">${E.stars(p)}</td></tr>`; });
    h += `</tbody></table><div class="regfoot">n = ${res.n} &nbsp;·&nbsp; R² = ${E.fmt(res.R2, 4)} &nbsp;·&nbsp; adj. R² = ${E.fmt(res.adjR2, 4)} &nbsp;·&nbsp; \\(\\hat\\sigma\\) = ${E.fmt(res.sigma, 4)}${res.k ? ` &nbsp;·&nbsp; F(${res.k}, ${res.df}) = ${E.fmt(res.F, 2)}` : ''}</div>`;
    return h;
  };

  /* =====================================================================
     Quizzes & exercises (declarative markup)
     ===================================================================== */
  const store = {
    key: () => 'econ1:' + location.pathname.split('/').pop(),
    get() { try { return JSON.parse(localStorage.getItem(this.key()) || '{}'); } catch (e) { return {}; } },
    set(id, ok) { try { const s = this.get(); s[id] = ok; localStorage.setItem(this.key(), JSON.stringify(s)); } catch (e) { /* storage unavailable */ } },
    clear() { try { localStorage.removeItem(this.key()); } catch (e) { } }
  };
  UI.store = store;

  /* <div class="quiz" data-id="q1" data-answer="b"> <p class="q">…</p>
       <button data-opt="a">…</button> … <div class="explain">…</div></div>
     multiple correct answers: data-answer="a,c" (select then "Check") */
  function initQuiz(q, idx) {
    if (q.dataset.ready) return; q.dataset.ready = 1;
    const id = q.dataset.id || ('q' + idx);
    const ans = (q.dataset.answer || '').split(',').map(s => s.trim());
    const multi = ans.length > 1;
    const opts = UI.$$('[data-opt]', q); const ex = UI.$('.explain', q);
    const fb = UI.el('div', { class: 'qfeedback' }); (ex ? ex.before(fb) : q.appendChild(fb));
    opts.forEach(b => b.classList.add('qopt'));
    const finish = ok => {
      q.classList.add('answered'); opts.forEach(b => { const right = ans.includes(b.dataset.opt); b.classList.toggle('correct', right); if (!right && b.classList.contains('picked')) b.classList.add('wrong'); });
      fb.innerHTML = ok ? '<b>✓ Correct!</b>' : '<b>✗ Not quite.</b> The highlighted option is correct.'; fb.className = 'qfeedback ' + (ok ? 'ok' : 'no');
      if (ex) ex.classList.add('show'); store.set(id, ok); UI.updateScore();
    };
    if (!multi) opts.forEach(b => b.addEventListener('click', () => { if (q.classList.contains('answered')) return; b.classList.add('picked'); finish(ans.includes(b.dataset.opt)); }));
    else {
      opts.forEach(b => b.addEventListener('click', () => { if (!q.classList.contains('answered')) b.classList.toggle('picked'); }));
      const chk = UI.el('button', { class: 'ebtn small', text: 'Check answer', type: 'button' }); fb.before(chk);
      chk.addEventListener('click', () => { if (q.classList.contains('answered')) return; const picked = opts.filter(b => b.classList.contains('picked')).map(b => b.dataset.opt); finish(picked.length === ans.length && picked.every(p => ans.includes(p))); });
    }
    const reset = UI.el('button', { class: 'qreset', title: 'Try again', text: '↺', type: 'button' });
    reset.addEventListener('click', () => { q.classList.remove('answered'); opts.forEach(b => b.classList.remove('picked', 'correct', 'wrong')); fb.innerHTML = ''; fb.className = 'qfeedback'; if (ex) ex.classList.remove('show'); });
    q.appendChild(reset);
  }

  /* numeric answer: <div class="numq" data-id data-answer="0.541" data-tol="0.005"> <p>…</p><div class="explain">…</div></div> */
  function initNumQ(q, idx) {
    if (q.dataset.ready) return; q.dataset.ready = 1;
    const id = q.dataset.id || ('n' + idx), ans = +q.dataset.answer, tol = +(q.dataset.tol || Math.abs(ans) * 0.01 + 1e-9);
    const row = UI.el('div', { class: 'numrow' }); const inp = UI.el('input', { type: 'text', inputmode: 'decimal', placeholder: q.dataset.placeholder || 'your answer' });
    const btn = UI.el('button', { class: 'ebtn small', text: 'Check', type: 'button' }); const fb = UI.el('span', { class: 'qfeedback' });
    row.append(inp, btn, fb); const ex = UI.$('.explain', q); ex ? ex.before(row) : q.appendChild(row);
    const check = () => { const v = parseFloat(inp.value.replace(',', '.').replace('−', '-')); if (Number.isNaN(v)) { fb.textContent = 'Enter a number'; return; } const ok = Math.abs(v - ans) <= tol; fb.innerHTML = ok ? '<b>✓ Correct</b>' : '<b>✗ Try again</b>'; fb.className = 'qfeedback ' + (ok ? 'ok' : 'no'); if (ok && ex) ex.classList.add('show'); store.set(id, ok); UI.updateScore(); };
    btn.addEventListener('click', check); inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') check(); });
    const show = UI.el('button', { class: 'linkbtn', text: 'show solution', type: 'button' }); show.addEventListener('click', () => ex && ex.classList.add('show')); row.appendChild(show);
  }

  /* sorter: <div class="sorter" data-id> <div class="bins"><div class="bin" data-bin="cs">Cross-section</div>…</div>
       <div class="items"><span class="item" data-bin="cs">…</span>…</div></div>
     click an item, then click a bin (touch-friendly); "Check" grades */
  function initSorter(s, idx) {
    if (s.dataset.ready) return; s.dataset.ready = 1;
    const id = s.dataset.id || ('s' + idx); let sel = null;
    const items = UI.$$('.item', s), bins = UI.$$('.bin', s), pool = UI.$('.items', s);
    bins.forEach(b => { if (!UI.$('.bin-drop', b)) { const d = UI.el('div', { class: 'bin-drop' }); b.appendChild(d); } });
    items.forEach(it => it.addEventListener('click', e => { e.stopPropagation(); if (sel) sel.classList.remove('sel'); sel = (sel === it) ? null : it; if (sel) sel.classList.add('sel'); }));
    bins.forEach(b => b.addEventListener('click', () => { if (!sel) return; UI.$('.bin-drop', b).appendChild(sel); sel.classList.remove('sel', 'ok', 'no'); sel = null; }));
    pool.addEventListener('click', () => { if (sel) { pool.appendChild(sel); sel.classList.remove('sel', 'ok', 'no'); sel = null; } });
    const bar = UI.el('div', { class: 'sorter-bar' }); const fb = UI.el('span', { class: 'qfeedback' });
    UI.button(bar, 'Check', () => { let good = 0, placed = 0; items.forEach(it => { const b = it.closest('.bin'); it.classList.remove('ok', 'no'); if (b) { placed++; const ok = b.dataset.bin === it.dataset.bin; it.classList.add(ok ? 'ok' : 'no'); if (ok) good++; } }); fb.innerHTML = `<b>${good} / ${items.length}</b> correct` + (placed < items.length ? ` · ${items.length - placed} not placed yet` : ''); fb.className = 'qfeedback ' + (good === items.length ? 'ok' : 'no'); store.set(id, good === items.length); UI.updateScore(); }, 'small');
    UI.button(bar, 'Reset', () => { items.forEach(it => { it.classList.remove('ok', 'no', 'sel'); pool.appendChild(it); }); fb.innerHTML = ''; }, 'small ghost');
    UI.button(bar, 'Solution', () => { items.forEach(it => { const b = bins.find(x => x.dataset.bin === it.dataset.bin); if (b) UI.$('.bin-drop', b).appendChild(it); it.classList.remove('no'); it.classList.add('ok'); }); }, 'small ghost');
    bar.appendChild(fb); s.appendChild(bar);
  }

  /* reveal-on-click blocks: <div class="reveal-box" data-label="Show answer">…</div> */
  function initRevealBox(b) {
    if (b.dataset.ready) return; b.dataset.ready = 1;
    const btn = UI.el('button', { class: 'ebtn small ghost', type: 'button', html: b.dataset.label || 'Show answer' });
    b.before(btn); btn.addEventListener('click', () => { b.classList.toggle('open'); btn.classList.toggle('on'); });
  }

  /* think–pair–share timer: <div class="timer" data-seconds="90"></div> */
  function initTimer(t) {
    if (t.dataset.ready) return; t.dataset.ready = 1;
    let total = +(t.dataset.seconds || 60), left = total, h = null;
    const face = UI.el('span', { class: 'timer-face' }), bar = UI.el('div', { class: 'timer-bar' }, UI.el('div'));
    const draw = () => { face.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; bar.firstChild.style.width = (100 * left / total) + '%'; t.classList.toggle('done', left === 0); };
    const btn = UI.button(t, '▶ Start', () => { if (h) { clearInterval(h); h = null; btn.textContent = '▶ Start'; return; } if (left === 0) left = total; btn.textContent = '❚❚ Pause'; h = setInterval(() => { left = Math.max(0, left - 1); draw(); if (!left) { clearInterval(h); h = null; btn.textContent = '↺ Restart'; } }, 1000); }, 'small');
    t.prepend(face); t.append(bar); draw();
  }

  /* copy buttons on R code blocks */
  function initCopy(pre) {
    if (pre.dataset.ready) return; pre.dataset.ready = 1;
    const b = UI.el('button', { class: 'copybtn', type: 'button', text: 'copy' });
    b.addEventListener('click', () => { const txt = pre.querySelector('code').innerText; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { b.textContent = 'copied ✓'; setTimeout(() => b.textContent = 'copy', 1400); }).catch(() => { b.textContent = 'select & Ctrl+C'; }); });
    pre.appendChild(b);
  }

  /* self-check score on any element with class .score-box */
  UI.updateScore = function () {
    const s = store.get(); const total = UI.$$('.quiz, .numq, .sorter').length; const good = Object.values(s).filter(Boolean).length;
    UI.$$('.score-box').forEach(b => { b.innerHTML = `<b>${good}</b> of <b>${total}</b> self-check exercises answered correctly on this device. <button class="linkbtn" type="button">reset</button>`; b.querySelector('button').onclick = () => { store.clear(); UI.updateScore(); }; });
  };

  /* =====================================================================
     Lazy widget registry — widgets are built the first time their slide
     is shown (so SVG sizes are right and loading stays fast).
     ===================================================================== */
  const registry = {};
  UI.widget = (name, init) => { registry[name] = init; };
  function buildWidgets(root) {
    UI.$$('[data-widget]', root).forEach(host => {
      if (host.dataset.built) return; const f = registry[host.dataset.widget];
      if (!f) { host.innerHTML = `<p class="muted">widget “${host.dataset.widget}” not found</p>`; return; }
      host.dataset.built = 1; host.setAttribute('data-prevent-swipe', '');
      try { f(host); } catch (err) { console.error(err); host.innerHTML = `<p class="muted">Widget error: ${err.message}</p>`; }
    });
  }
  UI.buildWidgets = buildWidgets;

  function initStatic(root = document) {
    UI.$$('.quiz', root).forEach(initQuiz); UI.$$('.numq', root).forEach(initNumQ); UI.$$('.sorter', root).forEach(initSorter);
    UI.$$('.reveal-box', root).forEach(initRevealBox); UI.$$('.timer', root).forEach(initTimer);
    UI.$$('.widget, .quiz, .numq, .sorter, .wcontrols', root).forEach(e => e.setAttribute('data-prevent-swipe', ''));
    // restore previous answers as a gentle marker
    const s = store.get(); UI.$$('.quiz[data-id], .numq[data-id]', root).forEach(q => { if (s[q.dataset.id] === true) q.classList.add('done-before'); });
    UI.updateScore();
  }

  /* hotspots: click any [data-tip] inside .hotspots to show its explanation
     in the .tip-panel of the same block */
  function initHotspots(h) {
    if (h.dataset.ready) return; h.dataset.ready = 1;
    let panel = UI.$('.tip-panel', h); if (!panel) { panel = UI.el('div', { class: 'tip-panel' }); h.appendChild(panel); }
    const def = panel.innerHTML || '<span class="muted">Click a highlighted part to see what it means.</span>'; panel.innerHTML = def;
    UI.$$('[data-tip]', h).forEach(s => { s.classList.add('hot'); s.addEventListener('click', () => { UI.$$('[data-tip]', h).forEach(x => x.classList.remove('on')); s.classList.add('on'); panel.innerHTML = s.dataset.tip; UI.renderMath(panel); }); });
  }

  /* =====================================================================
     Deck bootstrap — attaches to the reveal.js instance created by Quarto
     ===================================================================== */
  let attached = false;
  UI.attach = function () {
    if (attached || !window.Reveal) return;
    const go = () => {
      if (attached) return; attached = true;
      initStatic(); UI.$$('.hotspots').forEach(initHotspots);
      const printing = /print-pdf/gi.test(window.location.search);
      if (printing) buildWidgets(document); else buildWidgets(Reveal.getCurrentSlide());
      Reveal.on('slidechanged', e => {
        buildWidgets(e.currentSlide);
        const all = Reveal.getSlides(); const nxt = all[all.indexOf(e.currentSlide) + 1];
        if (nxt) (window.requestIdleCallback || setTimeout)(() => buildWidgets(nxt));
      });
      Reveal.on('overviewshown', () => buildWidgets(document));
    };
    if (Reveal.isReady && Reveal.isReady()) go(); else Reveal.on('ready', go);
  };
  window.addEventListener('load', UI.attach);
  document.addEventListener('DOMContentLoaded', () => setTimeout(UI.attach, 0));

  window.UI = UI;
})();
