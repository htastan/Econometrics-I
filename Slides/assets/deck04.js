/* Widgets for Deck 04 — Multiple Regression I: estimation */
(function () {
  const { E, UI } = window; const C = UI.C; const W = window.WDATA;

  /* ------------------------------------------------------------------
     OLS with two regressors: fitting a plane in 3D (drag to rotate)
     ------------------------------------------------------------------ */
  UI.widget('ols-3d', host => {
    host.innerHTML = ''; host.classList.add('widget-live');
    const bar = UI.el('div', { class: 'fs-bar' });
    const grid = UI.el('div', { class: 'wgrid wide' }), left = UI.el('div', { class: 'wplot' }), side = UI.el('div', { class: 'wside' });
    grid.append(left, side); host.append(bar, grid);
    const ctr = UI.el('div', { class: 'wcontrols compact' }), out = UI.readout(UI.el('div'));
    side.append(ctr, out);

    const Wd = 640, Hd = 350, svg = UI.svg('svg', { viewBox: `0 0 ${Wd} ${Hd}`, class: 'eplot' }); left.appendChild(svg);
    const legend = UI.el('div', { class: 'muted small', style: { textAlign: 'center' } }); left.appendChild(legend);
    svg.style.cursor = 'grab'; svg.style.touchAction = 'none';
    const TRUE = { b0: 2, b1: 0.6, b2: 0.4 };
    let mode = 'sim', planeMode = 'guess', showPRF = false, showRes = true, seed = 3;
    let theta = -0.65, phi = 0.38, spin = null, D, fit, guess = { b0: 0, b1: 0, b2: 0 };

    const sets = {
      sim: () => { const r = E.RNG(seed), n = 40, x1 = r.vec(n, () => r.unif(0, 10)), x2 = r.vec(n, () => r.unif(0, 10)); return { x1, x2, y: x1.map((v, i) => TRUE.b0 + TRUE.b1 * v + TRUE.b2 * x2[i] + r.norm(0, 1.3)), n1: 'x₁', n2: 'x₂', ny: 'y', rng: [[-4, 10], [-1, 2], [-1, 2]], lim: [[0, 10], [0, 10], [-2, 16]] }; },
      gpa: () => ({ x1: W.gpa1.hsGPA, x2: W.gpa1.ACT, y: W.gpa1.colGPA, n1: 'hsGPA', n2: 'ACT', ny: 'colGPA', rng: [[-1, 4], [-1, 2], [-0.1, 0.15]], lim: [[2.3, 4.05], [15, 34], [2, 4.1]] })
    };

    const b1 = UI.el('div'); bar.appendChild(b1);
    UI.segmented(b1, { label: 'Data', options: [{ value: 'sim', label: 'simulated (n = 40)' }, { value: 'gpa', label: 'gpa1 (n = 141)' }], value: mode, onChange: v => { mode = v; load(); } });
    const b2 = UI.el('div'); bar.appendChild(b2);
    UI.segmented(b2, { label: 'Plane', options: [{ value: 'guess', label: 'your guess' }, { value: 'ols', label: 'OLS' }], value: planeMode, onChange: v => { planeMode = v; draw(); } });
    const s0 = UI.slider(ctr, { label: '\\(\\tilde\\beta_0\\)', min: -4, max: 10, step: 0.01, value: 0, fmt: v => v.toFixed(2), onInput: v => { guess.b0 = v; planeMode === 'guess' && draw(); } });
    const s1 = UI.slider(ctr, { label: '\\(\\tilde\\beta_1\\)', min: -1, max: 2, step: 0.005, value: 0, fmt: v => v.toFixed(3), onInput: v => { guess.b1 = v; planeMode === 'guess' && draw(); } });
    const s2 = UI.slider(ctr, { label: '\\(\\tilde\\beta_2\\)', min: -1, max: 2, step: 0.005, value: 0, fmt: v => v.toFixed(3), onInput: v => { guess.b2 = v; planeMode === 'guess' && draw(); } });
    UI.toggle(ctr, { label: 'show residuals', value: true, onChange: v => { showRes = v; draw(); } });
    const prfT = UI.toggle(ctr, { label: 'show true PRF <span class="muted">(unknown in practice!)</span>', value: false, onChange: v => { showPRF = v; draw(); } });
    const row = UI.el('div', { class: 'row' }); bar.appendChild(row);
    const nb = UI.button(row, '↻ New sample', () => { seed++; load(); }, 'small ghost');
    const sb = UI.button(row, '⟳ Rotate', () => { if (spin) { cancelAnimationFrame(spin); spin = null; sb.classList.remove('on'); return; } sb.classList.add('on'); const step = () => { theta += 0.008; draw(); spin = requestAnimationFrame(step); }; step(); }, 'small ghost');
    UI.button(row, 'Reset view', () => { theta = -0.65; phi = 0.38; draw(); }, 'small ghost');

    function load() {
      D = sets[mode]();
      fit = E.ols(D.y, { x1: D.x1, x2: D.x2 });
      [s0, s1, s2].forEach((s, j) => { s.input.min = D.rng[j][0]; s.input.max = D.rng[j][1]; });
      guess = { b0: E.mean(D.y), b1: 0, b2: 0 }; s0.set(guess.b0); s1.set(0); s2.set(0);
      prfT.el.style.display = mode === 'sim' ? '' : 'none'; nb.style.display = mode === 'sim' ? '' : 'none';
      draw();
    }

    // ---- 3D projection (orthographic) ----
    function proj(x1, x2, y) {
      const L = D.lim, X = 2 * (x1 - L[0][0]) / (L[0][1] - L[0][0]) - 1, Y = 2 * (x2 - L[1][0]) / (L[1][1] - L[1][0]) - 1, Z = 2 * (y - L[2][0]) / (L[2][1] - L[2][0]) - 1;
      const sx = Math.cos(theta) * X - Math.sin(theta) * Y, depth = Math.sin(theta) * X + Math.cos(theta) * Y;
      const sy = Z * Math.cos(phi) - depth * Math.sin(phi);
      return { x: Wd / 2 + 165 * sx, y: Hd / 2 + 8 - 138 * sy, d: depth * Math.cos(phi) + Z * Math.sin(phi) };
    }
    const line = (a, b, st) => svg.appendChild(UI.svg('line', Object.assign({ x1: a.x, y1: a.y, x2: b.x, y2: b.y }, st)));
    const txt = (p, s, st = {}) => { const t = UI.svg('text', Object.assign({ x: p.x, y: p.y, class: 'ptext', 'text-anchor': 'middle' }, st)); t.textContent = s; svg.appendChild(t); };
    function planeMesh(b, stroke, fill, dash) {
      const L = D.lim, f = (u, v) => b.b0 + b.b1 * u + b.b2 * v, N = 6;
      const c = [[L[0][0], L[1][0]], [L[0][1], L[1][0]], [L[0][1], L[1][1]], [L[0][0], L[1][1]]].map(([u, v]) => proj(u, v, f(u, v)));
      if (fill) svg.appendChild(UI.svg('polygon', { points: c.map(p => `${p.x},${p.y}`).join(' '), fill, stroke: 'none' }));
      for (let i = 0; i <= N; i++) {
        const u = L[0][0] + i / N * (L[0][1] - L[0][0]), v = L[1][0] + i / N * (L[1][1] - L[1][0]);
        line(proj(u, L[1][0], f(u, L[1][0])), proj(u, L[1][1], f(u, L[1][1])), { stroke, 'stroke-width': 1.3, 'stroke-dasharray': dash, opacity: 0.8 });
        line(proj(L[0][0], v, f(L[0][0], v)), proj(L[0][1], v, f(L[0][1], v)), { stroke, 'stroke-width': 1.3, 'stroke-dasharray': dash, opacity: 0.8 });
      }
    }
    function draw() {
      svg.innerHTML = '';
      const L = D.lim, b = planeMode === 'ols' ? { b0: fit.coef[0], b1: fit.coef[1], b2: fit.coef[2] } : guess;
      // box: floor edges and vertical axis
      const fl = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([i, j]) => proj(L[0][i], L[1][j], L[2][0]));
      for (let k = 0; k < 4; k++) line(fl[k], fl[(k + 1) % 4], { stroke: '#c5ced8', 'stroke-width': 1.2 });
      line(fl[0], proj(L[0][0], L[1][0], L[2][1]), { stroke: '#c5ced8', 'stroke-width': 1.2 });
      txt(proj((L[0][0] + L[0][1]) / 2, L[1][0], L[2][0]), D.n1, { dy: 22, class: 'alab' });
      txt(proj(L[0][1], (L[1][0] + L[1][1]) / 2, L[2][0]), D.n2, { dy: 22, class: 'alab' });
      txt(proj(L[0][0], L[1][0], L[2][1]), D.ny, { dy: -8, class: 'alab' });
      // points behind the plane first, then the plane, then points in front
      const f = (u, v) => b.b0 + b.b1 * u + b.b2 * v;
      const P = D.y.map((y, i) => ({ i, p: proj(D.x1[i], D.x2[i], y), q: proj(D.x1[i], D.x2[i], f(D.x1[i], D.x2[i])), above: y >= f(D.x1[i], D.x2[i]) }));
      P.sort((a, b2) => a.p.d - b2.p.d);
      const drawPt = o => {
        if (showRes) line(o.p, o.q, { stroke: C.red, 'stroke-width': 1.6, opacity: 0.8 });
        svg.appendChild(UI.svg('circle', { cx: o.p.x, cy: o.p.y, r: mode === 'sim' ? 5.5 : 4, fill: o.above ? 'rgba(31,95,168,.85)' : 'rgba(217,98,43,.85)', stroke: '#fff', 'stroke-width': 1 }));
      };
      P.filter(o => !o.above).forEach(drawPt);
      if (showPRF && mode === 'sim') planeMesh(TRUE, C.green, null, '6 5');
      planeMesh(b, planeMode === 'ols' ? C.ink : C.purple, planeMode === 'ols' ? 'rgba(20,50,79,.13)' : 'rgba(112,72,168,.13)');
      P.filter(o => o.above).forEach(drawPt);
      // readout
      const ssr = (bb) => E.sum(D.y.map((y, i) => (y - bb.b0 - bb.b1 * D.x1[i] - bb.b2 * D.x2[i]) ** 2));
      const my = ssr(b), best = fit.SSR, d = mode === 'gpa' ? 3 : 2, f3 = v => E.fmt(v, mode === 'gpa' ? 4 : 3);
      out.innerHTML = `<b>${planeMode === 'ols' ? 'OLS' : 'Yours'}:</b> \\(\\hat{${mode === 'gpa' ? 'y' : 'y'}} = ${f3(b.b0)} ${b.b1 < 0 ? '-' : '+'} ${f3(Math.abs(b.b1))}\\,${mode === 'gpa' ? 'hsGPA' : 'x_1'} ${b.b2 < 0 ? '-' : '+'} ${f3(Math.abs(b.b2))}\\,${mode === 'gpa' ? 'ACT' : 'x_2'}\\)<br>` +
        `SSR = <span class="big">${E.fmt(my, d)}</span> ` +
        (planeMode === 'guess' ? (my / best < 1.01 ? `<span class="good">🎯 at the minimum!</span>` : `<span class="or">+${E.fmt(100 * (my / best - 1), 0)}% vs. OLS</span>`) : `<span class="good">= minimum</span>`) +
        (showPRF && mode === 'sim' ? `<br><span style="color:${C.green}"><b>True PRF</b> (dashed): \\(y = 2 + 0.6x_1 + 0.4x_2\\)</span>` : '');
      legend.innerHTML = `<span style="color:${C.blue}">●</span> above the plane (\\(\\hat u>0\\)) &nbsp; <span style="color:${C.orange}">●</span> below (\\(\\hat u<0\\)) &nbsp; · &nbsp; drag the picture to rotate`;
      UI.renderMath(out); UI.renderMath(legend);
    }
    // drag to rotate
    svg.addEventListener('pointerdown', ev => {
      ev.preventDefault(); ev.stopPropagation(); svg.setPointerCapture(ev.pointerId); svg.style.cursor = 'grabbing';
      let lx = ev.clientX, ly = ev.clientY;
      const move = e => { theta += (e.clientX - lx) * 0.01; phi = E.clamp(phi + (e.clientY - ly) * 0.008, -0.2, 1.5); lx = e.clientX; ly = e.clientY; draw(); };
      const up = () => { svg.removeEventListener('pointermove', move); svg.removeEventListener('pointerup', up); svg.style.cursor = 'grab'; };
      svg.addEventListener('pointermove', move); svg.addEventListener('pointerup', up);
    });
    load();
  });

  /* ------------------------------------------------------------------
     Partialling out (Frisch–Waugh–Lovell), step by step on gpa1
     ------------------------------------------------------------------ */
  UI.widget('fwl', host => {
    const S = UI.scaffold(host);
    const d = W.gpa1, y = d.colGPA, x1 = d.hsGPA, x2 = d.ACT;
    const aux = E.slr(x2, x1), r1 = x1.map((v, i) => v - aux.b0 - aux.b1 * x2[i]);
    const simple = E.slr(x1, y), step3 = E.slr(r1, y), full = E.ols(y, { hsGPA: x1, ACT: x2 });
    let step = 1;
    UI.segmented(S.controls, { label: 'Step', options: [{ value: 1, label: '① simple' }, { value: 2, label: '② partial out ACT' }, { value: 3, label: '③ regress on residuals' }], value: 1, onChange: v => { step = +v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      S.plotHost.innerHTML = '';
      if (step === 1) {
        const P = new UI.Plot(S.plotHost, { w: 640, h: 300, xlim: [2.3, 4.05], ylim: [2, 4.1], xlab: 'hsGPA', ylab: 'colGPA' });
        P.points(x1, y, { r: 4 }); P.fn(v => simple.b0 + simple.b1 * v, { color: C.orange, width: 3.5 });
        out.innerHTML = `Simple regression of colGPA on hsGPA:<br>slope = <span class="big">${E.fmt(simple.b1, 4)}</span><br>This slope mixes the effect of hsGPA with that of ACT, because the two are correlated (corr = ${E.fmt(E.cor(x1, x2), 2)}).`;
      } else if (step === 2) {
        const P = new UI.Plot(S.plotHost, { w: 640, h: 300, xlim: [15, 34], ylim: [2.3, 4.05], xlab: 'ACT', ylab: 'hsGPA' });
        x2.forEach((v, i) => P.line(v, x1[i], v, aux.b0 + aux.b1 * v, { color: C.red, width: 1.3, opacity: 0.7 }));
        P.points(x2, x1, { r: 4, fill: 'rgba(112,72,168,.45)', stroke: C.purple }); P.fn(v => aux.b0 + aux.b1 * v, { color: C.purple, width: 3.5 });
        out.innerHTML = `Regress hsGPA on ACT and keep the residuals \\(\\hat r_{i1}\\) (red lines).<br><br>\\(\\hat r_{i1}\\) is the part of hsGPA that <b>cannot</b> be explained by ACT: hsGPA "net of" ACT.`;
      } else {
        const P = new UI.Plot(S.plotHost, { w: 640, h: 300, xlim: [-1, 1], ylim: [2, 4.1], xlab: '\\(\\hat r_1\\) = hsGPA with ACT partialled out', ylab: 'colGPA' });
        P.points(r1, y, { r: 4, fill: 'rgba(47,143,91,.45)', stroke: C.green }); P.fn(v => step3.b0 + step3.b1 * v, { color: C.green, width: 3.5 });
        out.innerHTML = `Regress colGPA on \\(\\hat r_{i1}\\):<br>slope = <span class="big">${E.fmt(step3.b1, 4)}</span><br>Multiple regression coefficient on hsGPA: <b>${E.fmt(full.coef[1], 4)}</b> <span class="good">identical!</span><br><br>\\(\\hat\\beta_1\\) measures the relationship between \\(y\\) and \\(x_1\\) <b>after the effect of \\(x_2\\) has been removed</b>.`;
      }
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Omitted variable bias: Monte Carlo, short vs long regression
     ------------------------------------------------------------------ */
  UI.widget('ovb', host => {
    const S = UI.scaffold(host);
    const B1 = 0.5; let b2 = 0.6, delta = 0.6, busy = null;
    const P = new UI.Plot(S.plotHost, { w: 640, h: 330, xlim: [-0.8, 1.8], ylim: [0, 1], xlab: 'estimates of β₁ from 300 samples (n = 100)', yticks: [] });
    UI.slider(S.controls, { label: 'effect of omitted \\(x_2\\) on \\(y\\): \\(\\beta_2\\)', min: -1, max: 1, step: 0.05, value: b2, fmt: v => v.toFixed(2), onInput: v => { b2 = v; schedule(); } });
    UI.slider(S.controls, { label: 'link \\(x_2 = \\delta x_1 + v\\): \\(\\delta\\)', min: -1, max: 1, step: 0.05, value: delta, fmt: v => v.toFixed(2), onInput: v => { delta = v; schedule(); } });
    const out = UI.readout(S.out);
    const tab = UI.el('div'); S.out.appendChild(tab);
    const schedule = () => { clearTimeout(busy); busy = setTimeout(run, 40); };
    function run() {
      const r = E.RNG(11), short = [], long = [];
      for (let k = 0; k < 300; k++) {
        const n = 100, x1 = r.vec(n, () => r.norm()), x2 = x1.map(v => delta * v + r.norm()), y = x1.map((v, i) => 1 + B1 * v + b2 * x2[i] + r.norm());
        short.push(E.slr(x1, y).b1); long.push(E.ols(y, { x1, x2 }).coef[1]);
      }
      const h1 = E.hist(long, -0.8, 1.8, 52), h2 = E.hist(short, -0.8, 1.8, 52), mx = Math.max(...h1.counts, ...h2.counts);
      P.setLimits([-0.8, 1.8], [0, mx * 1.15]); P.clear();
      P.hist(h1, { fill: 'rgba(47,143,91,.5)' }); P.hist(h2, { fill: 'rgba(217,98,43,.5)' });
      P.vline(B1, { color: C.green, width: 2.5, dash: '6 4' }); P.text(B1, mx * 1.08, ' β₁ = 0.5', { color: C.green, weight: 700 });
      const bias = b2 * delta;
      out.innerHTML = `<span style="color:${C.green};font-weight:700">Long</span> regression (x₁ and x₂): mean = ${E.fmt(E.mean(long), 3)}<br>` +
        `<span style="color:${C.orange};font-weight:700">Short</span> regression (x₂ omitted): mean = <span class="big">${E.fmt(E.mean(short), 3)}</span><br>` +
        `\\(\\text{bias} = \\beta_2 \\cdot \\tilde\\delta_1 = ${E.fmt(b2, 2)} \\times ${E.fmt(delta, 2)} = ${E.fmt(bias, 3)}\\)<br>` +
        (Math.abs(bias) < 0.02 ? `<span class="good">No bias: β₂ = 0 or x₂ is unrelated to x₁.</span>` : `<span class="bad">${bias > 0 ? 'Upward (positive)' : 'Downward (negative)'} bias.</span>`);
      UI.renderMath(out);
      const sgn = v => Math.abs(v) < 0.02 ? 0 : Math.sign(v), cb = sgn(b2), cd = sgn(delta);
      const cell = (bs, ds, lab) => `<td style="padding:.2em .5em;border:1px solid #dfe5ec;${cb === bs && cd === ds ? `background:${lab === '+' ? 'rgba(217,98,43,.25)' : 'rgba(31,95,168,.25)'};font-weight:700` : ''}">${lab === '+' ? 'positive bias' : 'negative bias'}</td>`;
      tab.innerHTML = `<table style="font-size:.95em;margin-top:.4em;border-collapse:collapse"><tr><td></td><th style="padding:.2em .5em">Corr(x₁,x₂) &gt; 0</th><th style="padding:.2em .5em">Corr(x₁,x₂) &lt; 0</th></tr>` +
        `<tr><th style="padding:.2em .5em">β₂ &gt; 0</th>${cell(1, 1, '+')}${cell(1, -1, '−')}</tr><tr><th style="padding:.2em .5em">β₂ &lt; 0</th>${cell(-1, 1, '−')}${cell(-1, -1, '+')}</tr></table>`;
    }
    run();
  });

  /* ------------------------------------------------------------------
     Multicollinearity: estimates of (β1, β2) across samples, VIF
     ------------------------------------------------------------------ */
  UI.widget('mcoll', host => {
    /* Panel A: one sample, x1 against x2; red segments = r1-hat, the part of x1
       not explained by x2 (the only variation beta1-hat can use, see partialling out).
       Panel B: (beta1-hat, beta2-hat) across 250 samples. y = x1 + x2 + u, n = 100. */
    host.innerHTML = ''; host.classList.add('widget-live');
    const bar = UI.el('div', { class: 'fs-bar' }), grid = UI.el('div', { class: 'mc-grid' });
    const pa = UI.el('div'), pb = UI.el('div'), side = UI.el('div');
    grid.append(pa, pb, side); host.append(bar, grid);
    let rho = 0.5, busy = null;
    const sl = UI.slider(bar, { label: 'Corr(x₁, x₂)', min: 0, max: 1, step: 0.01, value: rho, fmt: v => v.toFixed(2), onInput: v => { rho = v; clearTimeout(busy); busy = setTimeout(run, 30); } });
    sl.el.style.gridTemplateColumns = '6.2em 1fr 3em'; sl.el.style.width = '24em';
    const pr = UI.el('div', { class: 'row' }); bar.appendChild(pr);
    [0, 0.5, 0.9, 0.99, 1].forEach(v => UI.button(pr, String(v), () => { rho = v; sl.set(v); run(); }, 'small ghost'));
    const A = new UI.Plot(pa, { w: 330, h: 330, xlim: [-3.2, 3.2], ylim: [-3.2, 3.2], xlab: 'x₂', ylab: 'x₁', margin: { l: 44, t: 30 } });
    const B = new UI.Plot(pb, { w: 330, h: 330, xlim: [0, 2], ylim: [0, 2], xlab: '\\(\\hat\\beta_1\\)', ylab: '\\(\\hat\\beta_2\\)', margin: { l: 50, t: 30 } });
    const out = UI.readout(side);
    function run() {
      const n = 100, perfect = rho >= 0.999, r = E.RNG(5), b1 = [], b2 = [];
      const gen = () => { const x1 = r.vec(n, () => r.norm()); const x2 = x1.map(v => perfect ? v : rho * v + Math.sqrt(1 - rho * rho) * r.norm()); return { x1, x2 }; };
      // Panel A: one sample
      const one = gen(), aux = E.slr(one.x2, one.x1), r1 = one.x1.map((v, i) => v - aux.b0 - aux.b1 * one.x2[i]);
      A.clear();
      one.x2.forEach((v, i) => A.line(v, one.x1[i], v, aux.b0 + aux.b1 * v, { color: C.red, width: 1.8, opacity: 0.85 }));
      A.points(one.x2, one.x1, { r: 3.4, fill: 'rgba(31,95,168,.5)', stroke: 'none' });
      A.fn(v => aux.b0 + aux.b1 * v, { color: C.purple, width: 3 });
      A.text(0, 3.65, 'One sample', { anchor: 'middle', weight: 700 });
      // Panel B: estimates across samples
      B.clear();
      if (!perfect) {
        for (let k = 0; k < 250; k++) { const d = gen(), y = d.x1.map((v, i) => v + d.x2[i] + r.norm()); const f = E.ols(y, { x1: d.x1, x2: d.x2 }); b1.push(f.coef[1]); b2.push(f.coef[2]); }
        const h = Math.max(1, 4 * Math.sqrt(1 / (1 - rho * rho) / n)); B.setLimits([1 - h, 1 + h], [1 - h, 1 + h]); B.clear();
        B.points(b1, b2, { r: 3.2, fill: 'rgba(31,95,168,.4)', stroke: 'none' });
        B.points([1], [1], { r: 7, fill: C.green, stroke: '#fff', sw: 2 });
        B.text(1, 1 + h * 1.14, '250 samples', { anchor: 'middle', weight: 700 });
      } else {
        B.setLimits([0, 2], [0, 2]); B.clear(); B.text(1, 1, 'OLS cannot be computed', { anchor: 'middle', size: 20, weight: 700, color: C.red });
      }
      // readout
      const left = perfect ? 0 : 1 - rho * rho, vif = perfect ? Infinity : 1 / left;
      const info = `<div class="small"><b>Information left for \\(\\hat\\beta_1\\):</b> \\(1-R_1^2\\) = <b>${E.fmt(100 * left, 0)}%</b></div><div class="meter"><div style="width:${100 * left}%;background:${C.red}"></div><div style="width:${100 - 100 * left}%;background:#dfe5ec"></div></div>`;
      out.innerHTML = info + (perfect ?
        `<span class="bad">Perfect collinearity: \\(x_1 = x_2\\).</span> No red variation is left, so the effect of \\(x_1\\) cannot be separated from that of \\(x_2\\) at all. MLR.3 fails and OLS is not defined.` :
        `① \\(\\hat\\beta_1\\) uses only the <b style="color:${C.red}">red</b> lines (left): the part of x₁ not explained by x₂. Higher correlation → shorter red lines.<br>` +
        `② Less variation → noisier estimate. \\(VIF_1 =\\) <span class="big">${E.fmt(vif, 1)}</span>: the variance is ${E.fmt(vif, 1)}× the uncorrelated case.<br>` +
        `③ A high \\(\\hat\\beta_1\\) is offset by a low \\(\\hat\\beta_2\\) (corr = ${E.fmt(E.cor(b1, b2), 2)}), but the <b>sum</b> stays precise: sd\\((\\hat\\beta_1+\\hat\\beta_2)\\) = ${E.fmt(E.sd(b1.map((v, i) => v + b2[i])), 2)} vs. sd\\((\\hat\\beta_1)\\) = ${E.fmt(E.sd(b1), 2)}.<br>` +
        `<span class="muted small">No bias: the cloud stays centered on the green truth.</span>`);
      UI.renderMath(out);
    }
    run();
  });
})();
