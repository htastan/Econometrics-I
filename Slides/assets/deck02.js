/* Widgets for Deck 02 — Simple Regression Model I: OLS estimation */
(function () {
  const { E, UI } = window; const C = UI.C; const W = window.WDATA;
  const tex = UI.texStr;

  /* ------------------------------------------------------------------
     Zero conditional mean: E(u|x) across slices of the population
     ------------------------------------------------------------------ */
  UI.widget('cond-mean', host => {
    const S = UI.scaffold(host);
    const P = new UI.Plot(S.plotHost, { w: 640, h: 400, xlim: [7.3, 18.7], ylim: [-4.5, 4.5], xlab: 'educ (years)', ylab: 'u (unobserved factors, e.g. ability)' });
    let mode = 'none', k = 0.6;
    const r = E.RNG(21), n = 450;
    const x = r.vec(n, () => r.int(8, 18)), e = r.vec(n, () => r.norm()), jit = r.vec(n, () => r.unif(-0.28, 0.28));
    UI.segmented(S.controls, { label: 'How does u depend on educ?', options: [{ value: 'none', label: 'Not at all' }, { value: 'lin', label: 'Linearly' }, { value: 'quad', label: 'U-shaped' }], value: mode, onChange: v => { mode = v; draw(); } });
    const sl = UI.slider(S.controls, { label: 'strength', min: 0, max: 1, step: 0.05, value: k, fmt: v => v.toFixed(2), onInput: v => { k = v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      const u = x.map((xi, i) => e[i] + (mode === 'lin' ? k * 0.45 * (xi - 13) : mode === 'quad' ? k * 0.16 * ((xi - 13) ** 2 - 10) : 0));
      P.clear();
      P.points(x.map((v, i) => v + jit[i]), u, { r: 3, fill: 'rgba(31,95,168,.28)', stroke: 'none' });
      P.hline(0, { color: C.ink, width: 1.5, dash: '5 4' });
      const xs = E.seq(8, 18), cm = xs.map(v => E.mean(u.filter((_, i) => x[i] === v)));
      P.path(xs, cm, { color: C.orange, width: 3 });
      P.points(xs, cm, { r: 7, fill: C.orange, stroke: '#fff', sw: 2 });
      const rho = E.cor(x, u), flat = Math.max(...cm.map(Math.abs)) < 0.45;
      out.innerHTML = `Orange dots: the average of \\(u\\) in each education "slice", \\(\\hat E(u\\mid educ)\\).<br>Correlation(educ, u) = <b>${E.fmt(rho, 2)}</b><br>` +
        (flat ? `<span class="good">✓ E(u|x) ≈ 0 in every slice.</span> SLR.4 is plausible.` :
          `<span class="bad">✗ E(u|x) changes with x.</span> SLR.4 fails.` + (Math.abs(rho) < 0.1 ? ` <b>Note:</b> the correlation is ≈ 0, yet the mean of u still depends on x. <i>Zero correlation is not enough!</i>` : ''));
      UI.renderMath(out);
      sl.el.style.opacity = mode === 'none' ? 0.35 : 1;
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Population regression function with conditional distributions
     ------------------------------------------------------------------ */
  UI.widget('prf', host => {
    const S = UI.scaffold(host);
    const P = new UI.Plot(S.plotHost, { w: 640, h: 340, xlim: [0, 10], ylim: [-2, 14], xlab: 'x', ylab: 'y' });
    let b1 = 0.8, sig = 1.2; const b0 = 2;
    const r = E.RNG(5), n = 160, x = r.vec(n, () => r.unif(0.3, 9.7)), z = r.vec(n, () => r.norm());
    UI.slider(S.controls, { label: 'slope \\(\\beta_1\\)', min: 0, max: 1.2, step: 0.05, value: b1, fmt: v => v.toFixed(2), onInput: v => { b1 = v; draw(); } });
    UI.slider(S.controls, { label: 'error s.d. \\(\\sigma\\)', min: 0.3, max: 2.5, step: 0.05, value: sig, fmt: v => v.toFixed(2), onInput: v => { sig = v; draw(); } });
    const out = UI.readout(S.out);
    out.innerHTML = `For each value of \\(x\\), \\(y\\) has a whole <b>distribution</b> (the bell curves), because \\(u\\) varies.<br>The PRF \\(E(y\\mid x)=\\beta_0+\\beta_1x\\) connects the <b>centers</b> of these distributions.`; UI.renderMath(out);
    function draw() {
      P.clear();
      P.points(x, x.map((v, i) => b0 + b1 * v + sig * z[i]), { r: 3, fill: 'rgba(31,95,168,.25)', stroke: 'none' });
      P.fn(v => b0 + b1 * v, { color: C.orange, width: 3.5 });
      [2, 5, 8].forEach(x0 => {
        const m = b0 + b1 * x0, ys = E.range(m - 3.2 * sig, m + 3.2 * sig, 80), sc = 1.6 * sig;
        P.path(ys.map(y => x0 + sc * E.dnorm(y, m, sig) * 2.2), ys, { color: C.navy || '#14324f', width: 2.2 });
        P.line(x0, m - 3.2 * sig, x0, m + 3.2 * sig, { color: C.muted, width: 1, dash: '3 3' });
        P.points([x0], [m], { r: 6, fill: C.orange, stroke: '#fff', sw: 2 });
      });
      P.text(9.6, b0 + b1 * 9.6 + 0.9, 'E(y|x) = β₀ + β₁x', { anchor: 'end', color: C.orange, weight: 700 });
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Be the OLS estimator: fit a line by hand, minimize SSR
     ------------------------------------------------------------------ */
  UI.widget('ols-game', host => {
    const S = UI.scaffold(host);
    const sets = {
      small: (() => { const r = E.RNG(42), x = E.seq(1, 12).map(v => v + r.unif(-0.3, 0.3)); return { x, y: x.map(v => 1.5 + 0.7 * v + r.norm(0, 1.4)), xlim: [0, 13], ylim: [-1, 14], xlab: 'x (simulated data, n = 12)', ylab: 'y' }; })(),
      gpa: { x: W.gpa1.hsGPA, y: W.gpa1.colGPA, xlim: [2.2, 4.1], ylim: [1.9, 4.1], xlab: 'hsGPA (gpa1, n = 141)', ylab: 'colGPA' }
    };
    let D = sets.small, b0, b1, showRes = true, showSq = false, showOLS = false, P, fit;
    const segBox = UI.el('div'); S.controls.appendChild(segBox);
    UI.segmented(segBox, { label: 'Data', options: [{ value: 'small', label: 'Small sample' }, { value: 'gpa', label: 'gpa1 data' }], value: 'small', onChange: v => { D = sets[v]; setup(); } });
    const s0 = UI.slider(S.controls, { label: 'intercept \\(\\tilde\\beta_0\\)', min: -5, max: 10, step: 0.01, value: 0, fmt: v => v.toFixed(2), onInput: v => { b0 = v; draw(); } });
    const s1 = UI.slider(S.controls, { label: 'slope \\(\\tilde\\beta_1\\)', min: -1, max: 2, step: 0.005, value: 0, fmt: v => v.toFixed(3), onInput: v => { b1 = v; draw(); } });
    UI.toggle(S.controls, { label: 'show residuals \\(\\hat u_i\\)', value: showRes, onChange: v => { showRes = v; draw(); } });
    UI.toggle(S.controls, { label: 'show <b>squared</b> residuals', value: showSq, onChange: v => { showSq = v; draw(); } });
    const row = UI.el('div', { class: 'row' }); S.controls.appendChild(row);
    const bt = UI.button(row, 'Reveal OLS line', () => { showOLS = !showOLS; bt.textContent = showOLS ? 'Hide OLS line' : 'Reveal OLS line'; draw(); }, 'small orange');
    UI.button(row, 'Reset', () => { init(); draw(); }, 'small ghost');
    const out = UI.readout(S.out);
    function init() { b0 = E.mean(D.y); b1 = 0; s0.set(b0); s1.set(b1); }
    function setup() {
      S.plotHost.innerHTML = '';
      P = new UI.Plot(S.plotHost, { w: 640, h: 420, xlim: D.xlim, ylim: D.ylim, xlab: D.xlab, ylab: D.ylab });
      fit = E.slr(D.x, D.y);
      const rng = D === sets.gpa ? [-2, 5, 0.005, -1, 2] : [-5, 10, 0.01, -1, 2];
      s0.input.min = rng[0]; s0.input.max = rng[1]; s0.input.step = rng[2]; s1.input.min = rng[3]; s1.input.max = rng[4];
      // draggable handles at 20% and 80% of the x-range
      init(); draw();
    }
    function draw() {
      P.clear();
      const ssr = (a, b) => E.sum(D.x.map((x, i) => (D.y[i] - a - b * x) ** 2));
      const my = ssr(b0, b1), best = ssr(fit.b0, fit.b1);
      if (showSq) D.x.forEach((x, i) => { const yh = b0 + b1 * x, side = Math.abs(P.Y(D.y[i]) - P.Y(yh)); const px = P.X(x), top = Math.min(P.Y(D.y[i]), P.Y(yh)); P.gData.appendChild(UI.svg('rect', { x: px, y: top, width: side, height: side, fill: 'rgba(217,98,43,.16)', stroke: 'rgba(217,98,43,.6)' })); });
      if (showRes) D.x.forEach((x, i) => P.line(x, D.y[i], x, b0 + b1 * x, { color: C.red, width: 1.6 }));
      if (showOLS) P.fn(v => fit.b0 + fit.b1 * v, { color: C.green, width: 3, dash: '8 5' });
      P.points(D.x, D.y, { r: D === sets.small ? 6 : 4, fill: 'rgba(31,95,168,.55)', stroke: C.blue });
      P.fn(v => b0 + b1 * v, { color: C.orange, width: 3.5 });
      // handles
      const [xa, xb] = [D.xlim[0] + 0.15 * (D.xlim[1] - D.xlim[0]), D.xlim[0] + 0.85 * (D.xlim[1] - D.xlim[0])];
      [xa, xb].forEach((xh, j) => {
        const h = UI.svg('circle', { cx: P.X(xh), cy: P.Y(b0 + b1 * xh), r: 9, class: 'handle' }); P.gTop.appendChild(h);
        P.drag(h, d => { const other = j ? xa : xb, yo = b0 + b1 * other; const nb1 = (d.y - yo) / (xh - other); b1 = nb1; b0 = yo - nb1 * other; s0.set(b0); s1.set(b1); draw(); });
      });
      const ratio = my / best;
      out.innerHTML = `Your SSR: <span class="big">${E.fmt(my, D === sets.gpa ? 2 : 1)}</span><br>` +
        `Smallest possible SSR (OLS): <b>${E.fmt(best, D === sets.gpa ? 2 : 1)}</b><br>` +
        (ratio < 1.01 ? `<span class="good">🎯 Within 1% of the minimum. You found (almost) the OLS line!</span>` : ratio < 1.1 ? `<span class="or">Close: ${E.fmt((ratio - 1) * 100, 1)}% above the minimum.</span>` : `<span class="bad">${E.fmt((ratio - 1) * 100, 0)}% above the minimum.</span>`) +
        (showOLS ? `<br>OLS: \\(\\hat\\beta_0 = ${E.fmt(fit.b0, 3)}\\), \\(\\hat\\beta_1 = ${E.fmt(fit.b1, 3)}\\)` : '') +
        `<br><span class="muted small">Drag the white handles or use the sliders.</span>`;
      UI.renderMath(out);
    }
    setup();
  });

  /* ------------------------------------------------------------------
     PRF vs SRF: every sample gives a different SRF
     ------------------------------------------------------------------ */
  UI.widget('srf-sampling', host => {
    const S = UI.scaffold(host);
    const P = new UI.Plot(S.plotHost, { w: 640, h: 400, xlim: [0, 10], ylim: [-4, 12], xlab: 'x', ylab: 'y' });
    const B0 = 1, B1 = 0.5, SIG = 2; let n = 30, hist = [], rs = E.RNG(99);
    UI.slider(S.controls, { label: 'sample size n', min: 5, max: 200, step: 1, value: n, fmt: v => v, onInput: v => { n = v; } , onChange: () => { hist = []; draw1(); } });
    const row = UI.el('div', { class: 'row' }); S.controls.appendChild(row);
    UI.button(row, 'Draw a sample', () => draw1(), 'small');
    UI.button(row, 'Draw 20 samples', () => { for (let i = 0; i < 20; i++) draw1(i < 19); }, 'small ghost');
    UI.button(row, 'Clear', () => { hist = []; draw1(); }, 'small ghost');
    const out = UI.readout(S.out);
    S.out.appendChild(UI.el('div', { class: 'legend-inline small', html: `<span><i style="background:${C.green}"></i>PRF (unknown in practice)</span><span><i style="background:${C.orange}"></i>SRF from this sample</span><span><i style="background:#b8c2cc"></i>earlier SRFs</span>` }));
    let last;
    function draw1(silent) {
      const x = rs.vec(n, () => rs.unif(0, 10)), y = x.map(v => B0 + B1 * v + rs.norm(0, SIG)), f = E.slr(x, y);
      hist.push(f); last = { x, y, f }; if (silent) return;
      P.clear();
      hist.slice(0, -1).slice(-60).forEach(h => P.fn(v => h.b0 + h.b1 * v, { color: '#b8c2cc', width: 1.2, opacity: 0.8 }));
      P.points(x, y, { r: n > 80 ? 3 : 4.5 });
      P.fn(v => B0 + B1 * v, { color: C.green, width: 3.5 });
      P.fn(v => f.b0 + f.b1 * v, { color: C.orange, width: 3.5 });
      const mb1 = E.mean(hist.map(h => h.b1));
      out.innerHTML = `Population: \\(y = 1 + 0.5x + u\\)<br>This sample: \\(\\hat\\beta_0 = ${E.fmt(f.b0, 3)}\\), \\(\\hat\\beta_1 = ${E.fmt(f.b1, 3)}\\)<br>Samples drawn: <b>${hist.length}</b> · average \\(\\hat\\beta_1\\): <b>${E.fmt(mb1, 3)}</b>`;
      UI.renderMath(out);
    }
    draw1();
  });

  /* ------------------------------------------------------------------
     CEO salary: click a firm to see its fitted value and residual
     ------------------------------------------------------------------ */
  UI.widget('ceo-click', host => {
    const S = UI.scaffold(host);
    const d = W.ceosal1, res = E.ols(d.salary, { roe: d.roe }), b0 = res.coef[0], b1 = res.coef[1];
    let zoom = true, sel = 3, P;
    UI.toggle(S.controls, { label: 'zoom in (salary ≤ 4000, like the textbook figure)', value: true, onChange: v => { zoom = v; setup(); } });
    const out = UI.readout(S.out);
    const hidden = d.salary.filter(s => s > 4000).length;
    function setup() {
      S.plotHost.innerHTML = '';
      P = new UI.Plot(S.plotHost, { w: 640, h: 410, xlim: [0, 58], ylim: zoom ? [0, 4000] : [0, 15000], xlab: 'roe (return on equity, %)', ylab: 'salary ($1000s)' });
      draw();
    }
    function draw() {
      P.clear();
      P.fn(v => b0 + b1 * v, { color: C.orange, width: 3.2 });
      const i = sel, yh = b0 + b1 * d.roe[i];
      P.line(d.roe[i], d.salary[i], d.roe[i], yh, { color: C.red, width: 3, dash: '6 4' });
      const g = UI.svg('g'); P.gData.appendChild(g);
      d.roe.forEach((x, j) => {
        const c = UI.svg('circle', { cx: P.X(x), cy: P.Y(d.salary[j]), r: j === sel ? 8 : 4.5, fill: j === sel ? C.orange : 'rgba(31,95,168,.45)', stroke: j === sel ? '#fff' : C.blue, 'stroke-width': j === sel ? 2 : 0.7 });
        c.style.cursor = 'pointer'; c.addEventListener('click', () => { sel = j; draw(); }); g.appendChild(c);
      });
      P.points([d.roe[i]], [yh], { r: 6, fill: '#fff', stroke: C.orange, sw: 3 });
      const u = d.salary[i] - yh;
      out.innerHTML = `<b>Firm #${i + 1}</b><br>roe = <b>${E.fmt(d.roe[i], 1)}</b>, salary = <b>${E.fmt(d.salary[i], 0)}</b><br>` +
        `Fitted: \\(\\widehat{salary} = ${E.fmt(b0, 3)} + ${E.fmt(b1, 3)}\\times ${E.fmt(d.roe[i], 1)} = ${E.fmt(yh, 1)}\\)<br>` +
        `Residual: \\(\\hat u = ${E.fmt(d.salary[i], 0)} - ${E.fmt(yh, 1)} = \\) <span class="big" style="color:${u >= 0 ? C.green : C.red}">${E.fmt(u, 1)}</span><br>` +
        `<span class="muted">${u >= 0 ? 'Positive residual: the model <b>under</b>-predicts this CEO\'s salary.' : 'Negative residual: the model <b>over</b>-predicts this CEO\'s salary.'}</span>` +
        (zoom ? `<br><span class="muted small">${hidden} firms with salary > 4000 are outside the zoomed view.</span>` : '') + `<br><span class="muted small">Click any dot.</span>`;
      UI.renderMath(out);
    }
    setup();
  });

  /* ------------------------------------------------------------------
     Algebraic properties of OLS: drag the data, the identities survive
     ------------------------------------------------------------------ */
  UI.widget('ols-props', host => {
    const S = UI.scaffold(host);
    const P = new UI.Plot(S.plotHost, { w: 640, h: 410, xlim: [0, 10], ylim: [0, 10], xlab: 'x', ylab: 'y' });
    let pts = [[1, 2.2], [2.2, 3.9], [3.5, 2.8], [4.6, 5.6], [6, 4.4], [7.2, 7.3], [8.6, 6.2]];
    const out = UI.readout(S.out);
    S.controls.appendChild(UI.el('p', { class: 'muted', html: '<b>Drag any blue point.</b> The OLS line is re-estimated instantly. Watch the numbers on the right.' }));
    UI.button(S.controls, 'Shuffle the points', () => { const r = E.RNG(Date.now() % 1e6); pts = pts.map(() => [r.unif(0.5, 9.5), r.unif(0.5, 9.5)]); draw(); }, 'small ghost');
    function draw() {
      P.clear();
      const x = pts.map(p => p[0]), y = pts.map(p => p[1]), f = E.slr(x, y), yh = x.map(v => f.b0 + f.b1 * v), u = y.map((v, i) => v - yh[i]);
      const mx = E.mean(x), my = E.mean(y);
      P.fn(v => f.b0 + f.b1 * v, { color: C.orange, width: 3.2 });
      x.forEach((v, i) => P.line(v, y[i], v, yh[i], { color: C.red, width: 1.8, dash: '4 3' }));
      P.line(mx - 0.35, my, mx + 0.35, my, { color: C.green, width: 3, top: true }); P.line(mx, my - 0.35, mx, my + 0.35, { color: C.green, width: 3, top: true });
      P.text(mx + 0.3, my - 0.4, '(x̄, ȳ)', { color: C.green, weight: 700 });
      pts.forEach((p, i) => { const c = UI.svg('circle', { cx: P.X(p[0]), cy: P.Y(p[1]), r: 9, fill: 'rgba(31,95,168,.8)', stroke: '#fff', 'stroke-width': 2 }); P.gTop.appendChild(c); P.drag(c, d => { pts[i] = [E.clamp(d.x, 0.2, 9.8), E.clamp(d.y, 0.2, 9.8)]; draw(); }); });
      const z = v => Math.abs(v) < 1e-7 ? 0 : v;
      out.innerHTML = `\\(\\hat y = ${E.fmt(f.b0, 2)} ${f.b1 >= 0 ? '+' : '-'} ${E.fmt(Math.abs(f.b1), 2)}x\\)<br><br>` +
        `① \\(\\sum \\hat u_i\\) = <span class="big">${E.fmt(z(E.sum(u)), 6)}</span><br>` +
        `② \\(\\sum x_i \\hat u_i\\) = <span class="big">${E.fmt(z(E.sum(u.map((v, i) => v * x[i]))), 6)}</span><br>` +
        `③ \\(\\bar y = ${E.fmt(my, 3)}\\), \\(\\;\\overline{\\hat y} = ${E.fmt(E.mean(yh), 3)}\\)<br>` +
        `④ line at \\(\\bar x\\): \\(${E.fmt(f.b0 + f.b1 * mx, 3)} = \\bar y\\) <span class="good">✓</span>`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     SST = SSE + SSR and R-squared
     ------------------------------------------------------------------ */
  UI.widget('r2', host => {
    const S = UI.scaffold(host);
    const P = new UI.Plot(S.plotHost, { w: 640, h: 400, xlim: [0, 10], ylim: [-6, 22], xlab: 'x', ylab: 'y' });
    let slope = 1, sig = 2, sel = 0;
    const r = E.RNG(8), n = 50, x = r.vec(n, () => r.unif(0.3, 9.7)), z = r.vec(n, () => r.norm());
    sel = x.indexOf(E.max(x));
    UI.slider(S.controls, { label: 'true slope', min: 0, max: 2, step: 0.05, value: slope, fmt: v => v.toFixed(2), onInput: v => { slope = v; draw(); } });
    UI.slider(S.controls, { label: 'noise \\(\\sigma\\)', min: 0.2, max: 6, step: 0.1, value: sig, fmt: v => v.toFixed(1), onInput: v => { sig = v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      const y = x.map((v, i) => 3 + slope * v + sig * z[i]), f = E.slr(x, y), yh = x.map(v => f.b0 + f.b1 * v), my = E.mean(y);
      const SST = E.sum(y.map(v => (v - my) ** 2)), SSR = E.sum(y.map((v, i) => (v - yh[i]) ** 2)), SSE = SST - SSR, R2 = SSE / SST;
      P.clear();
      P.hline(my, { color: C.muted, width: 1.6, dash: '6 4' }); P.text(0.2, my + 0.6, 'ȳ', { color: C.muted, weight: 700 });
      P.fn(v => f.b0 + f.b1 * v, { color: C.orange, width: 3.2 });
      const g = UI.svg('g'); P.gData.appendChild(g);
      x.forEach((v, i) => { const c = UI.svg('circle', { cx: P.X(v), cy: P.Y(y[i]), r: i === sel ? 7 : 4.5, fill: i === sel ? C.ink : 'rgba(31,95,168,.45)', stroke: i === sel ? '#fff' : C.blue }); c.style.cursor = 'pointer'; c.addEventListener('click', () => { sel = i; draw(); }); g.appendChild(c); });
      const xs = x[sel];
      P.line(xs + 0.12, my, xs + 0.12, yh[sel], { color: C.blue, width: 4, top: true });
      P.line(xs - 0.12, yh[sel], xs - 0.12, y[sel], { color: C.red, width: 4, top: true });
      const pe = 100 * SSE / SST;
      out.innerHTML = `<div class="meter"><div style="width:${pe}%;background:${C.blue}"></div><div style="width:${100 - pe}%;background:${C.red}"></div></div>` +
        `<span class="bl">SSE = ${E.fmt(SSE, 0)}</span> (explained) + <span style="color:${C.red};font-weight:700">SSR = ${E.fmt(SSR, 0)}</span> (residual) = SST = ${E.fmt(SST, 0)}<br>` +
        `\\(R^2 = SSE/SST =\\) <span class="big">${E.fmt(R2, 3)}</span><br>\\(\\text{Corr}(y,\\hat y)^2 = ${E.fmt(E.cor(y, yh) ** 2, 3)}\\)<br>` +
        `<span class="muted small">For the dark point: <b style="color:${C.blue}">blue</b> = \\(\\hat y_i-\\bar y\\) (explained), <b style="color:${C.red}">red</b> = \\(\\hat u_i\\) (unexplained). Click another point.</span>`;
      UI.renderMath(out);
    }
    draw();
  });
})();
