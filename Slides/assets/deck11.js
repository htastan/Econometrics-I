/* Widgets for Deck 11 — Heteroskedasticity */
(function () {
  const { E, UI } = window; const C = UI.C; const W = window.WDATA; const ln = Math.log;

  /* ------------------------------------------------------------------
     What heteroskedasticity does to inference (Monte Carlo)
     ------------------------------------------------------------------ */
  UI.widget('het-inference', host => {
    const S = UI.scaffold(host);
    let gamma = 1.5, busy = null;
    const top = UI.el('div'), bot = UI.el('div'); S.plotHost.append(top, bot);
    const P = new UI.Plot(top, { w: 640, h: 210, xlim: [0, 10], ylim: [-12, 18], xlab: 'x', ylab: 'y', margin: { b: 40 } });
    const B = new UI.Plot(bot, { w: 640, h: 165, xlim: [0, 3], ylim: [0, 0.35], xlab: '', ylab: '', xticks: [], yticks: [], margin: { t: 10, b: 40, l: 30 } });
    UI.slider(S.controls, { label: 'heteroskedasticity \\(\\gamma\\)', min: 0, max: 2.5, step: 0.1, value: gamma, fmt: v => v.toFixed(1), onInput: v => { gamma = v; clearTimeout(busy); busy = setTimeout(run, 30); } });
    const note = UI.el('p', { class: 'small muted', html: 'DGP: \\(y = 1 + 0.5x + u\\), \\(\\;\\text{sd}(u\\mid x) = 2\\,x^{\\gamma/2}\\), n = 100, 2,000 samples' });
    S.controls.appendChild(note); UI.renderMath(note);
    const out = UI.readout(S.out);
    function run() {
      const r = E.RNG(19), n = 100, R = 2000;
      const b1 = [], seU = [], seR = [], rejU = [], rejR = [];
      let last = null;
      for (let k = 0; k < R; k++) {
        const x = r.vec(n, () => r.unif(0.2, 10));
        const y = x.map(v => 1 + 0.5 * v + 2 * Math.pow(v, gamma / 2) * r.norm());
        const f = E.ols(y, { x });
        b1.push(f.coef[1]); seU.push(f.se[1]); seR.push(f.se_hc1[1]);
        rejU.push(Math.abs((f.coef[1] - 0.5) / f.se[1]) > E.qt(0.975, n - 2) ? 1 : 0);
        rejR.push(Math.abs((f.coef[1] - 0.5) / f.se_hc1[1]) > E.qt(0.975, n - 2) ? 1 : 0);
        if (k === 0) last = { x, y, f };
      }
      P.clear();
      P.points(last.x, last.y, { r: 3, fill: 'rgba(31,95,168,.35)', stroke: 'none' });
      P.fn(v => 1 + 0.5 * v, { color: C.green, width: 3 });
      P.fn(v => 1 + 0.5 * v + 2 * 2 * Math.pow(v, gamma / 2), { color: C.purple, width: 1.6, dash: '5 4' });
      P.fn(v => 1 + 0.5 * v - 2 * 2 * Math.pow(v, gamma / 2), { color: C.purple, width: 1.6, dash: '5 4' });
      // bars: true sd vs average standard errors
      const sd = E.sd(b1), mu = E.mean(seU), mr = E.mean(seR), mx = Math.max(sd, mu, mr) * 1.35;
      B.setLimits([0, 3], [0, mx]); B.clear();
      const bar = (i, v, col, lab) => {
        B.rect(i + 0.15, 0, i + 0.85, v, { fill: col });
        B.text(i + 0.5, v + mx * 0.06, E.fmt(v, 3), { anchor: 'middle', weight: 700 });
        B.text(i + 0.5, -mx * 0.1, lab, { anchor: 'middle', size: 15 });
      };
      bar(0, sd, 'rgba(47,143,91,.8)', 'true sd of β̂₁');
      bar(1, mu, 'rgba(192,57,43,.8)', 'usual se (average)');
      bar(2, mr, 'rgba(31,95,168,.8)', 'robust se (average)');
      const rU = 100 * E.mean(rejU), rR = 100 * E.mean(rejR);
      out.innerHTML = `Mean of \\(\\hat\\beta_1\\): <b>${E.fmt(E.mean(b1), 3)}</b> (true 0.5) → <span class="good">OLS stays unbiased</span><br><br>` +
        `<b>Rejection rate of the true \\(H_0:\\beta_1 = 0.5\\)</b> at the 5% level:<br>` +
        `· usual se: <span class="${Math.abs(rU - 5) < 1.5 ? 'good' : 'bad'}">${E.fmt(rU, 1)}%</span><br>` +
        `· robust se: <span class="${Math.abs(rR - 5) < 1.5 ? 'good' : 'bad'}">${E.fmt(rR, 1)}%</span><br><br>` +
        (gamma < 0.15 ? `<span class="muted small">With \\(\\gamma = 0\\) the errors are homoskedastic: both standard errors are right and both tests have size 5%.</span>`
          : `<span class="muted small">The usual se ${mu < sd ? 'under' : 'over'}estimates the true sampling variation, so the usual t test rejects too ${rU > 5 ? 'often' : 'rarely'}. The robust se tracks the true sd and restores the 5% size. OLS itself is still unbiased.</span>`);
      UI.renderMath(out);
    }
    run();
  });

  /* ------------------------------------------------------------------
     Breusch–Pagan and White tests, step by step (hprice1)
     ------------------------------------------------------------------ */
  UI.widget('het-tests', host => {
    const S = UI.scaffold(host);
    const d = W.hprice1;
    const MODELS = {
      level: { y: d.price, X: { lotsize: d.lotsize, sqrft: d.sqrft, bdrms: d.bdrms }, lab: 'price on lotsize, sqrft, bdrms' },
      log: { y: d.price.map(ln), X: { llotsize: d.lotsize.map(ln), lsqrft: d.sqrft.map(ln), bdrms: d.bdrms }, lab: 'log(price) on log(lotsize), log(sqrft), bdrms' }
    };
    let mk = 'level', test = 'bp', step = 1;
    const b1 = UI.el('div'), b2 = UI.el('div'), b3 = UI.el('div'); S.controls.append(b1, b2, b3);
    UI.segmented(b1, { label: 'Model', options: [{ value: 'level', label: 'level-level' }, { value: 'log', label: 'log-log' }], value: mk, onChange: v => { mk = v; draw(); } });
    UI.segmented(b2, { label: 'Test', options: [{ value: 'bp', label: 'Breusch–Pagan' }, { value: 'white', label: 'White (special form)' }], value: test, onChange: v => { test = v; draw(); } });
    UI.segmented(b3, {
      label: 'Step', value: 1, options: [
        { value: 1, label: '1 · \\(\\hat u^2\\)' }, { value: 2, label: '2 · auxiliary reg.' }, { value: 3, label: '3 · \\(LM\\) test' }],
      onChange: v => { step = +v; draw(); }
    });
    const out = UI.readout(S.out);
    function draw() {
      const M = MODELS[mk], f = E.ols(M.y, M.X), u2 = f.resid.map(v => v * v);
      let aux, q, formula;
      if (test === 'bp') { aux = E.ols(u2, M.X); q = Object.keys(M.X).length; formula = `\\hat u^2 = \\delta_0 + \\delta_1 x_1 + \\dots + \\delta_${q} x_${q} + error`; }
      else { aux = E.ols(u2, { yhat: f.fitted, yhat2: f.fitted.map(v => v * v) }); q = 2; formula = `\\hat u^2 = \\delta_0 + \\delta_1 \\hat y + \\delta_2 \\hat y^2 + error`; }
      const LM = aux.n * aux.R2, p = 1 - E.pchisq(LM, q), c = E.qchisq(0.95, q);
      const F = aux.F, pF = aux.Fp;
      S.plotHost.innerHTML = '';
      let head = '', body = '';

      if (step < 3) {
        // squared residuals against the fitted values, with binned averages
        const yh = f.fitted, lo = E.min(yh), hi = E.max(yh), pad = 0.04 * (hi - lo);
        const top = E.quantile(u2, 0.97) * 1.1;
        const P = new UI.Plot(S.plotHost, {
          w: 640, h: 262, xlim: [lo - pad, hi + pad], ylim: [0, top],
          xlab: '\\(\\hat y\\) (fitted value)', ylab: '\\(\\hat u^2\\) (squared residual)'
        });
        P.points(yh, u2, { r: 3.2 });
        const B = 6, w = (hi - lo) / B, mids = [], means = [];
        for (let b = 0; b < B; b++) {
          const idx = yh.map((v, i) => ({ v, i })).filter(o => o.v >= lo + b * w && o.v < lo + (b + 1) * w).map(o => o.i);
          if (idx.length > 3) { mids.push(lo + (b + 0.5) * w); means.push(E.mean(idx.map(i => u2[i]))); }
        }
        P.path(mids, means, { color: C.red, width: 3 });
        P.points(mids, means, { r: 6, fill: C.red, stroke: '#fff', sw: 1.5 });
        if (step === 2 && test === 'white') {
          P.fn(v => aux.coef[0] + aux.coef[1] * v + aux.coef[2] * v * v, { color: C.orange, width: 3.2, from: lo, to: hi, n: 120 });
        }
        if (step === 1) {
          head = `<b>Step 1.</b> Estimate the model by OLS and square the residuals.`;
          body = `${mk === 'level' ? `<span class="bad">The spread grows with the predicted price</span>: expensive houses are much harder to predict.` : `<span class="good">The spread is roughly constant</span> across fitted values.`}<br><br>` +
            `Under \\(H_0\\) the variance is the same everywhere, so \\(\\hat u^2\\) should be <b>unrelated</b> to the regressors.<br><br>` +
            `<span class="muted small">Red line: the average \\(\\hat u^2\\) in each range of \\(\\hat y\\), an estimate of \\(\\text{Var}(u\\mid \\mathbf x)\\).</span>`;
        } else {
          head = `<b>Step 2.</b> Regress \\(\\hat u^2\\) on the test variables.`;
          body = `\\(${formula}\\)<br><br>` +
            `\\(R^2_{\\hat u^2} = ${E.fmt(aux.R2, 5)}\\), \\(n = ${aux.n}\\), \\(q = ${q}\\) restrictions<br><br>` +
            `<span class="muted small">${test === 'bp' ? 'Breusch–Pagan puts the regressors themselves on the right-hand side.' : 'The White special form uses \\(\\hat y\\) and \\(\\hat y^2\\) (orange curve), which stand in for all squares and cross products.'} A high \\(R^2\\) here means the variance moves with \\(\\mathbf x\\).</span>`;
        }
      } else {
        const lim = Math.max(20, LM * 1.2);
        const P = new UI.Plot(S.plotHost, { w: 640, h: 262, xlim: [0, lim], ylim: [0, 0.5], xlab: `\\(\\chi^2_{${q}}\\) under \\(H_0\\)`, yticks: [], margin: { t: 10, b: 52 } });
        const g = v => E.dchisq(v, q);
        P.area(g, c, lim, { fill: 'rgba(192,57,43,.3)' }); P.fn(g, { color: C.ink, width: 2.5, from: 0.05, n: 250 });
        P.vline(c, { color: C.red, width: 2, dash: '5 4' });
        P.text(c, 0.3, ` 5% critical value ${E.fmt(c, 2)}`, { color: C.red, size: 17 });
        P.vline(Math.min(LM, lim * 0.99), { color: C.orange, width: 3.5 });
        P.text(Math.min(LM, lim * 0.98), 0.45, ` LM = ${E.fmt(LM, 2)}`, { color: C.orange, weight: 700, anchor: LM > lim * 0.7 ? 'end' : 'start' });
        head = `<b>Step 3.</b> \\(H_0:\\) all \\(\\delta_j = 0\\) (homoskedasticity) against \\(H_1:\\) at least one \\(\\delta_j \\neq 0\\).`;
        body = `\\(LM = n R^2_{\\hat u^2} = ${aux.n}\\times ${E.fmt(aux.R2, 5)} = ${E.fmt(LM, 2)} \\sim \\chi^2_{${q}}\\), p = <b>${E.fmt(p, 4)}</b><br>` +
          `\\(F(${q}, ${aux.df}) = ${E.fmt(F, 3)}\\), p = <b>${E.fmt(pF, 4)}</b> &nbsp;<span class="muted small">(the two forms agree)</span><br><br>` +
          (p < 0.05 ? `<span class="bad">Reject homoskedasticity</span> at 5%: use robust standard errors (or WLS).` : `<span class="good">Fail to reject homoskedasticity</span> at 5%.`) +
          `<br><span class="muted small">${mk === 'level' ? 'In levels the variance grows with the size of the house.' : 'Taking logs often removes most of the heteroskedasticity: here the tests no longer reject.'}</span>`;
      }
      out.innerHTML = `<span class="muted small">${M.lab} · \\(n = ${aux.n}\\)</span><br>${head}<br>${body}`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Weighted least squares: giving noisy observations less weight
     ------------------------------------------------------------------ */
  UI.widget('wls', host => {
    const S = UI.scaffold(host);
    let seed = 2, showW = true;
    const P = new UI.Plot(S.plotHost, { w: 640, h: 330, xlim: [0, 10], ylim: [-8, 16], xlab: 'income', ylab: 'saving' });
    UI.toggle(S.controls, { label: 'dot size = weight \\(1/h(x) = 1/x\\)', value: true, onChange: v => { showW = v; draw(); } });
    const row = UI.el('div', { class: 'row' }); S.controls.appendChild(row);
    UI.button(row, '↻ New sample', () => { seed++; draw(); }, 'small ghost');
    UI.button(row, 'Run 300 samples', () => compare(), 'small');
    const out = UI.readout(S.out);
    function sample(sd) {
      const r = E.RNG(sd), n = 80, x = r.vec(n, () => r.unif(0.3, 10));
      const y = x.map(v => 1 + 0.5 * v + Math.sqrt(v) * 1.6 * r.norm());   // Var(u|x) = sigma^2 * x
      return { x, y };
    }
    function draw() {
      const { x, y } = sample(seed);
      const ols = E.ols(y, { x }), wls = E.ols(y, { x }, { weights: x.map(v => 1 / v) });
      P.clear();
      const g = UI.svg('g'); P.gData.appendChild(g);
      x.forEach((v, i) => g.appendChild(UI.svg('circle', { cx: P.X(v), cy: P.Y(y[i]), r: showW ? E.clamp(9 / Math.sqrt(v), 2, 9) : 4, fill: 'rgba(31,95,168,.35)', stroke: C.blue, 'stroke-width': 0.7 })));
      P.fn(v => 1 + 0.5 * v, { color: C.green, width: 2.5, dash: '6 5' });
      P.fn(v => ols.coef[0] + ols.coef[1] * v, { color: C.orange, width: 3 });
      P.fn(v => wls.coef[0] + wls.coef[1] * v, { color: C.purple, width: 3 });
      out.innerHTML = `True: \\(y = 1 + 0.5x + u\\) with \\(\\text{Var}(u\\mid x) = \\sigma^2 x\\)<br>` +
        `<span style="color:${C.orange}"><b>OLS</b></span>: \\(\\hat\\beta_1 = ${E.fmt(ols.coef[1], 3)}\\) &nbsp; <span style="color:${C.purple}"><b>WLS</b></span>: \\(\\hat\\beta_1 = ${E.fmt(wls.coef[1], 3)}\\)<br>` +
        `<span class="muted small">WLS divides everything by \\(\\sqrt{x}\\), i.e. gives small (precise) observations more weight. Both are unbiased; WLS is more precise. Press "Run 300 samples".</span>`;
      UI.renderMath(out);
    }
    function compare() {
      const bo = [], bw = [];
      for (let k = 0; k < 300; k++) {
        const { x, y } = sample(1000 + k);
        bo.push(E.ols(y, { x }).coef[1]);
        bw.push(E.ols(y, { x }, { weights: x.map(v => 1 / v) }).coef[1]);
      }
      out.innerHTML = `<b>300 samples</b> from the same DGP:<br>` +
        `<span style="color:${C.orange}"><b>OLS</b></span>: mean ${E.fmt(E.mean(bo), 3)}, sd <b>${E.fmt(E.sd(bo), 4)}</b><br>` +
        `<span style="color:${C.purple}"><b>WLS</b></span>: mean ${E.fmt(E.mean(bw), 3)}, sd <b>${E.fmt(E.sd(bw), 4)}</b><br><br>` +
        `<span class="good">Both are unbiased</span>, but WLS is about ${E.fmt(100 * (1 - E.sd(bw) / E.sd(bo)), 0)}% more precise: that is what "OLS is no longer BLUE" means.<br>` +
        `<span class="muted small">This requires knowing \\(h(x)\\). When it is unknown we estimate it (FGLS), and then the efficiency gain is only approximate.</span>`;
      UI.renderMath(out);
    }
    draw();
  });
})();
