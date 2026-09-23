/* Widgets for Deck 03 — Simple Regression Model II:
   functional form, unbiasedness, variance, standard errors */
(function () {
  const { E, UI } = window; const C = UI.C; const W = window.WDATA;
  const ln = Math.log;

  /* ------------------------------------------------------------------
     Functional form explorer: level/log combinations on real data
     ------------------------------------------------------------------ */
  UI.widget('func-form', host => {
    const S = UI.scaffold(host);
    const sets = {
      wage: { x: W.wage1.educ, y: W.wage1.wage, xn: 'educ', yn: 'wage', xu: 'year of education', yu: 'dollars per hour', xlog: false },
      ceo: { x: W.ceosal1.sales, y: W.ceosal1.salary, xn: 'sales', yn: 'salary', xu: 'million dollars of sales', yu: 'thousand dollars', xlog: true }
    };
    let D = sets.wage, model = 'll', view = 'trans', P;
    const b1 = UI.el('div'), b2 = UI.el('div'), b3 = UI.el('div'); S.controls.append(b1, b2, b3);
    UI.segmented(b1, { label: 'Data', options: [{ value: 'wage', label: 'wage1: wage & educ' }, { value: 'ceo', label: 'ceosal1: salary & sales' }], value: 'wage', onChange: v => { D = sets[v]; draw(); } });
    UI.segmented(b2, { label: 'Model', options: [{ value: 'll', label: 'level-level' }, { value: 'gl', label: 'log-level' }, { value: 'lg', label: 'level-log' }, { value: 'gg', label: 'log-log' }], value: 'll', onChange: v => { model = v; draw(); } });
    UI.segmented(b3, { label: 'Plot in', options: [{ value: 'trans', label: 'transformed units' }, { value: 'orig', label: 'original units' }], value: 'trans', onChange: v => { view = v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      const ly = model[0] === 'g', lx = model[1] === 'g';
      // log(0) is undefined: keep only observations where the transformed values are finite
      const keep = D.x.map((v, i) => Number.isFinite(lx ? ln(v) : v) && Number.isFinite(ly ? ln(D.y[i]) : D.y[i]));
      const x0 = D.x.filter((_, i) => keep[i]), y0 = D.y.filter((_, i) => keep[i]), dropped = D.x.length - x0.length;
      const X = x0.map(v => lx ? ln(v) : v), Y = y0.map(v => ly ? ln(v) : v);
      const f = E.slr(X, Y), yh = X.map(v => f.b0 + f.b1 * v), my = E.mean(Y);
      const R2 = 1 - E.sum(Y.map((v, i) => (v - yh[i]) ** 2)) / E.sum(Y.map(v => (v - my) ** 2));
      const tr = view === 'trans';
      const px = tr ? X : x0, py = tr ? Y : y0;
      const pad = (a, b) => [a - 0.04 * (b - a), b + 0.04 * (b - a)];
      const xl = pad(E.min(px), E.max(px)), yl = pad(E.min(py), tr ? E.max(py) : E.quantile(py, 0.985));
      S.plotHost.innerHTML = '';
      P = new UI.Plot(S.plotHost, { w: 640, h: 380, xlim: xl, ylim: yl, xlab: tr && lx ? `log(${D.xn})` : D.xn, ylab: tr && ly ? `log(${D.yn})` : D.yn });
      P.points(px, py, { r: 3.2, fill: 'rgba(31,95,168,.3)', stroke: 'none' });
      const curve = x0 => { const xx = lx ? ln(x0) : x0; const v = f.b0 + f.b1 * xx; return ly ? Math.exp(v) : v; };
      if (tr) P.fn(v => f.b0 + f.b1 * v, { color: C.orange, width: 3.5 });
      else P.fn(curve, { color: C.orange, width: 3.5, from: Math.max(xl[0], lx ? 1e-6 : xl[0]) });
      const yN = ly ? `\\log(${D.yn})` : D.yn, xN = lx ? `\\log(${D.xn})` : D.xn;
      const b = f.b1;
      const interp = {
        ll: `One more ${D.xu} → ${D.yn} changes by <b>${E.fmt(b, 3)}</b> ${D.yu}.`,
        gl: `One more ${D.xu} → ${D.yn} changes by about <b>${E.fmt(100 * b, 1)}%</b>.`,
        lg: `A 1% increase in ${D.xn} → ${D.yn} changes by <b>${E.fmt(b / 100, 3)}</b> ${D.yu}.`,
        gg: `A 1% increase in ${D.xn} → ${D.yn} changes by about <b>${E.fmt(b, 3)}%</b> (elasticity).`
      }[model];
      out.innerHTML = `\\(\\widehat{${yN}} = ${E.fmt(f.b0, 3)} ${b >= 0 ? '+' : '-'} ${E.fmt(Math.abs(b), 3)}\\,${xN}\\)<br>\\(R^2 = ${E.fmt(R2, 3)}\\), \\(n = ${x0.length}\\)` +
        (dropped ? `<br><span class="bad">${dropped} workers with ${D.xn} = 0 are dropped: log(0) is undefined.</span>` : '') +
        `<br><br><b>Interpretation:</b> ${interp}` +
        (lx && D === sets.wage ? `<br><span class="or">⚠ Unusual choice.</span> <span class="small">educ is measured in years and contains zeros, so "1% more education" is not a natural question. We normally do not log years of schooling, experience or age. Notice how poorly this form fits.</span>` : '') +
        `<br><span class="muted small">${ly ? 'R² of a log(y) model cannot be compared with the R² of a model for y.' : 'Switch to “original units” to see the implied curve.'}</span>`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Monte Carlo: unbiasedness of OLS (and what breaks it)
     ------------------------------------------------------------------ */
  UI.widget('mc-unbiased', host => {
    const S = UI.scaffold(host, { layout: 'wide' });
    const top = UI.el('div'), bot = UI.el('div'); S.plotHost.append(top, bot);
    const P = new UI.Plot(top, { w: 640, h: 200, xlim: [0, 10], ylim: [-5, 12], xlab: 'x', ylab: 'y', margin: { b: 40 } });
    const H = new UI.Plot(bot, { w: 640, h: 165, xlim: [0, 1], ylim: [0, 1], xlab: 'slope estimates \\(\\hat\\beta_1\\) from repeated samples', yticks: [], margin: { t: 8, b: 44 } });
    const B0 = 1, B1 = 0.5, SIG = 2; let n = 30, viol = false, est = [], rs = E.RNG(2024);
    UI.slider(S.controls, { label: 'sample size n', min: 5, max: 500, step: 1, value: n, fmt: v => v, onInput: v => { n = v; }, onChange: () => { est = []; run(1); } });
    UI.toggle(S.controls, { label: '<b>Violate SLR.4:</b> u is correlated with x', value: false, onChange: v => { viol = v; est = []; run(1); } });
    const row = UI.el('div', { class: 'row' }); S.controls.appendChild(row);
    UI.button(row, '1 sample', () => run(1), 'small');
    UI.button(row, '+100', () => run(100), 'small');
    UI.button(row, '+1000', () => run(1000), 'small');
    UI.button(row, 'Reset', () => { est = []; run(1); }, 'small ghost');
    const out = UI.readout(S.out);
    const note = UI.el('p', { class: 'small muted', html: 'DGP: \\(y = 1 + 0.5x + u\\), \\(u = 2\\cdot N(0,1)\\), \\(x = 10\\cdot U(0,1)\\)' }); S.out.appendChild(note); UI.renderMath(note);
    let last;
    function sample() {
      const x = rs.vec(n, () => 10 * rs.unif()), y = x.map(v => B0 + B1 * v + SIG * rs.norm() + (viol ? 0.35 * (v - 5) : 0));
      return { x, y, f: E.slr(x, y) };
    }
    function run(k) {
      for (let i = 0; i < k; i++) { last = sample(); est.push(last.f.b1); }
      P.clear();
      P.points(last.x, last.y, { r: n > 150 ? 2.5 : 4 });
      P.fn(v => B0 + B1 * v, { color: C.green, width: 3 });
      P.fn(v => last.f.b0 + last.f.b1 * v, { color: C.orange, width: 3 });
      const lo = 0.5 - 1.1, hi = 0.5 + 1.1 + (viol ? 0.5 : 0);
      const h = E.hist(est, lo, hi, 50), mx = Math.max(1, ...h.counts);
      H.setLimits([lo, hi], [0, mx * 1.18]); H.clear(); H.hist(h, { fill: 'rgba(31,95,168,.55)' });
      H.vline(B1, { color: C.green, width: 3, dash: '6 5' }); H.text(B1, mx * 1.1, ' β₁ = 0.5', { color: C.green, weight: 700 });
      const m = E.mean(est); if (est.length > 1) { H.vline(m, { color: C.orange, width: 3 }); }
      const sdx = 10 / Math.sqrt(12), theo = SIG / (sdx * Math.sqrt(n));
      out.innerHTML = `Samples: <b>${est.length}</b><br>This sample: \\(\\hat\\beta_1 = ${E.fmt(last.f.b1, 3)}\\)<br>` +
        `Average of \\(\\hat\\beta_1\\): <span class="big">${E.fmt(m, 3)}</span><br>` +
        (est.length > 1 ? `Std. dev. of \\(\\hat\\beta_1\\): <b>${E.fmt(E.sd(est), 3)}</b> <span class="muted">(theory ≈ ${E.fmt(theo, 3)})</span><br>` : '') +
        (est.length < 50 ? '<span class="muted">Add more samples to see the sampling distribution.</span>' :
          (viol ? `<span class="bad">Biased: the estimates center on ${E.fmt(m, 2)}, not 0.5.</span>` : `<span class="good">Unbiased: the estimates center on the true β₁ = 0.5.</span>`));
      UI.renderMath(out);
    }
    run(1);
  });

  /* ------------------------------------------------------------------
     Homoskedasticity vs heteroskedasticity
     ------------------------------------------------------------------ */
  UI.widget('hetero-vis', host => {
    const S = UI.scaffold(host);
    let mode = 'homo', P;
    UI.segmented(S.controls, { label: 'Show', options: [{ value: 'homo', label: 'Homoskedastic' }, { value: 'het', label: 'Heteroskedastic' }, { value: 'wage', label: 'wage1 data' }], value: mode, onChange: v => { mode = v; draw(); } });
    const out = UI.readout(S.out);
    const r = E.RNG(77), n = 400, xs = r.vec(n, () => r.int(8, 18)), z = r.vec(n, () => r.norm()), jit = r.vec(n, () => r.unif(-0.25, 0.25));
    function draw() {
      S.plotHost.innerHTML = '';
      let x, y, sdf, f;
      if (mode === 'wage') { x = W.wage1.educ; y = W.wage1.wage; }
      else { sdf = v => mode === 'homo' ? 2.2 : 0.35 * (v - 6.5); x = xs; y = xs.map((v, i) => -1 + 0.6 * v + sdf(v) * z[i]); }
      f = E.slr(x, y);
      P = new UI.Plot(S.plotHost, { w: 640, h: 330, xlim: mode === 'wage' ? [-0.5, 18.8] : [7.3, 18.7], ylim: [-4, 25], xlab: 'educ', ylab: 'wage' });
      P.points(x.map((v, i) => v + (mode === 'wage' ? 0 : jit[i])), y, { r: 3, fill: 'rgba(31,95,168,.3)', stroke: 'none' });
      P.fn(v => f.b0 + f.b1 * v, { color: C.orange, width: 3 });
      const grid = mode === 'wage' ? E.seq(6, 18) : E.seq(8, 18);
      const band = grid.map(v => { const res = y.filter((_, i) => x[i] === v).map(yy => yy - (f.b0 + f.b1 * v)); return res.length > 4 ? E.sd(res) : null; });
      grid.forEach((v, j) => { if (band[j] == null) return; const c = f.b0 + f.b1 * v; P.line(v, c - 2 * band[j], v, c + 2 * band[j], { color: C.purple, width: 5, opacity: 0.55 }); });
      out.innerHTML = mode === 'homo' ? `<span class="good">Homoskedastic:</span> \\(\\text{Var}(u\\mid x) = \\sigma^2\\) is the same at every value of \\(x\\).<br>Purple bars (±2 s.d. of \\(u\\) in each slice) all have the same length.` :
        mode === 'het' ? `<span class="bad">Heteroskedastic:</span> \\(\\text{Var}(u\\mid x)\\) grows with \\(x\\).<br>OLS is <b>still unbiased</b>, but the variance formulas below are no longer valid (Week 12).` :
          `Real data: the spread of wages <b>increases with education</b>. This is a typical pattern in wage data, so SLR.5 is questionable here.`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     What drives Var(beta1-hat)? sigma, n, spread of x
     ------------------------------------------------------------------ */
  UI.widget('var-b1', host => {
    const S = UI.scaffold(host, { layout: 'wide' });
    const top = UI.el('div'), bot = UI.el('div'); S.plotHost.append(top, bot);
    const P = new UI.Plot(top, { w: 640, h: 170, xlim: [-8, 8], ylim: [-10, 10], xlab: 'x', ylab: 'y', margin: { b: 40 } });
    const D = new UI.Plot(bot, { w: 640, h: 155, xlim: [-0.5, 1.5], ylim: [0, 1], xlab: 'sampling distribution of \\(\\hat\\beta_1\\) (true \\(\\beta_1 = 0.5\\))', yticks: [], margin: { t: 8, b: 44 } });
    let sig = 2, n = 50, sx = 2;
    const r = E.RNG(3), zx = r.vec(500, () => r.norm()), zu = r.vec(500, () => r.norm());
    UI.slider(S.controls, { label: 'error s.d. \\(\\sigma\\)', min: 0.5, max: 4, step: 0.1, value: sig, fmt: v => v.toFixed(1), onInput: v => { sig = v; draw(); } });
    UI.slider(S.controls, { label: 'sample size \\(n\\)', min: 10, max: 500, step: 5, value: n, fmt: v => v, onInput: v => { n = v; draw(); } });
    UI.slider(S.controls, { label: 'spread of \\(x\\) (s.d.)', min: 0.5, max: 3.5, step: 0.1, value: sx, fmt: v => v.toFixed(1), onInput: v => { sx = v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      const x = zx.slice(0, n).map(v => sx * v), y = x.map((v, i) => 0.5 * v + sig * zu[i]);
      const SST = E.sum(x.map(v => (v - E.mean(x)) ** 2)), sd = sig / Math.sqrt(SST);
      P.clear(); P.points(x, y, { r: n > 200 ? 2.5 : 3.5, fill: 'rgba(31,95,168,.35)', stroke: 'none' }); P.fn(v => 0.5 * v, { color: C.green, width: 3 });
      const peak = E.dnorm(0.5, 0.5, sd); D.setLimits([-0.5, 1.5], [0, Math.max(peak * 1.12, 3)]); D.clear();
      D.area(v => E.dnorm(v, 0.5, sd), 0.5 - 4 * sd, 0.5 + 4 * sd, { fill: 'rgba(217,98,43,.3)', n: 200 });
      D.fn(v => E.dnorm(v, 0.5, sd), { color: C.orange, width: 3, n: 300 });
      D.vline(0.5, { color: C.green, width: 2.5, dash: '6 5' });
      out.innerHTML = `\\[\\text{Var}(\\hat\\beta_1) = \\frac{\\sigma^2}{SST_x} = \\frac{${E.fmt(sig * sig, 2)}}{${E.fmt(SST, 1)}}\\]` +
        `\\(\\text{sd}(\\hat\\beta_1) = \\) <span class="big">${E.fmt(sd, 4)}</span><br><br>` +
        `<span class="muted">More noise → wider. More data or more spread in \\(x\\) → larger \\(SST_x\\) → narrower.</span>`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     t test preview: H0: beta1 = b vs two-sided, wage1 slope
     ------------------------------------------------------------------ */
  UI.widget('t-preview', host => {
    const S = UI.scaffold(host);
    const bhat = 0.54136, se = 0.05325, df = 524; let h0 = 0, alpha = 0.05, P;
    UI.slider(S.controls, { label: 'hypothesized \\(\\beta_1\\) under \\(H_0\\)', min: 0, max: 0.8, step: 0.01, value: h0, fmt: v => v.toFixed(2), onInput: v => { h0 = v; draw(); } });
    UI.segmented(S.controls, { label: 'significance level \\(\\alpha\\)', options: [{ value: 0.1, label: '10%' }, { value: 0.05, label: '5%' }, { value: 0.01, label: '1%' }], value: 0.05, onChange: v => { alpha = +v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      const t = (bhat - h0) / se, c = E.qt(1 - alpha / 2, df), p = 2 * (1 - E.pt(Math.abs(t), df));
      const L = Math.max(4.5, Math.abs(t) + 1);
      S.plotHost.innerHTML = '';
      P = new UI.Plot(S.plotHost, { w: 640, h: 272, xlim: [-L, L], ylim: [0, 0.45], xlab: 't statistic', ylab: 'density under H₀' });
      P.area(v => E.dt(v, df), -L, -c, { fill: 'rgba(192,57,43,.35)' }); P.area(v => E.dt(v, df), c, L, { fill: 'rgba(192,57,43,.35)' });
      P.fn(v => E.dt(v, df), { color: C.ink, width: 2.5, n: 300 });
      P.vline(t, { color: C.orange, width: 3.5 }); P.text(t, 0.41, ` t = ${E.fmt(t, 2)}`, { color: C.orange, weight: 700, anchor: t > L - 2 ? 'end' : 'start' });
      P.text(-c, 0.02, `−${E.fmt(c, 2)}`, { anchor: 'end', dx: -4, color: C.red }); P.text(c, 0.02, `${E.fmt(c, 2)}`, { dx: 4, color: C.red });
      const rej = Math.abs(t) > c;
      out.innerHTML =
        `\\(t = (${E.fmt(bhat, 4)} - ${E.fmt(h0, 2)}) / ${E.fmt(se, 4)} = \\) <span class="big">${E.fmt(t, 2)}</span><br>` +
        `critical value \\(c = ${E.fmt(c, 3)}\\), p-value = <b>${E.fmtP(p)}</b><br>` +
        (rej ? `<span class="bad">Reject H₀</span> at the ${alpha * 100}% level.` : `<span class="good">Fail to reject H₀</span> at the ${alpha * 100}% level.`) +
        `<br><span class="muted small">Red areas: rejection region. Try H₀ values near 0.54.</span>`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Regression through the origin vs. full model vs. constant only
     ------------------------------------------------------------------ */
  UI.widget('origin', host => {
    const S = UI.scaffold(host);
    const d = W.ceosal1, x = d.roe, y = d.salary;
    const full = E.slr(x, y), b1o = E.sum(x.map((v, i) => v * y[i])) / E.sum(x.map(v => v * v)), m = E.mean(y);
    const ssr = f => E.sum(x.map((v, i) => (y[i] - f(v)) ** 2));
    const show = { full: true, orig: false, cons: false };
    const P = new UI.Plot(S.plotHost, { w: 640, h: 320, xlim: [0, 58], ylim: [0, 4000], xlab: 'roe', ylab: 'salary' });
    UI.toggle(S.controls, { label: `<b style="color:${C.orange}">full model</b>: intercept + slope`, value: true, onChange: v => { show.full = v; draw(); } });
    UI.toggle(S.controls, { label: `<b style="color:${C.purple}">through the origin</b>: slope only`, value: false, onChange: v => { show.orig = v; draw(); } });
    UI.toggle(S.controls, { label: `<b style="color:${C.green}">constant only</b>: intercept only`, value: false, onChange: v => { show.cons = v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      P.clear(); P.points(x, y, { r: 3.5 });
      if (show.full) P.fn(v => full.b0 + full.b1 * v, { color: C.orange, width: 3.5 });
      if (show.orig) P.fn(v => b1o * v, { color: C.purple, width: 3.5 });
      if (show.cons) P.hline(m, { color: C.green, width: 3.5 });
      out.innerHTML = `<span style="color:${C.orange}">\\(\\widehat{salary} = ${E.fmt(full.b0, 1)} + ${E.fmt(full.b1, 2)}\\,roe\\)</span> · SSR = ${E.fmt(ssr(v => full.b0 + full.b1 * v) / 1e6, 1)}m<br>` +
        `<span style="color:${C.purple}">\\(\\widetilde{salary} = ${E.fmt(b1o, 2)}\\,roe\\)</span> · SSR = ${E.fmt(ssr(v => b1o * v) / 1e6, 1)}m<br>` +
        `<span style="color:${C.green}">\\(\\widehat{salary} = ${E.fmt(m, 1)}\\)</span> (the sample mean) · SSR = ${E.fmt(ssr(() => m) / 1e6, 1)}m<br>` +
        `<span class="muted small">Forcing the line through (0, 0) changes the slope a lot. It is justified only if theory says \\(y = 0\\) when \\(x = 0\\).</span>`;
      UI.renderMath(out);
    }
    draw();
  });
})();
