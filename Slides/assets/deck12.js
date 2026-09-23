/* Widgets for Deck 12 — Model misspecification and data problems */
(function () {
  const { E, UI } = window; const C = UI.C; const W = window.WDATA; const ln = Math.log;

  /* ------------------------------------------------------------------
     RESET test: is the functional form right?
     ------------------------------------------------------------------ */
  UI.widget('reset-test', host => {
    const S = UI.scaffold(host);
    const d = W.hprice1;
    const MOD = {
      level: {
        y: d.price, X: { lotsize: d.lotsize, sqrft: d.sqrft, bdrms: d.bdrms },
        nm: ['lotsize', 'sqrft', 'bdrms'], ylab: 'price', yl: 'price', dg: 4
      },
      log: {
        y: d.price.map(ln), X: { llotsize: d.lotsize.map(ln), lsqrft: d.sqrft.map(ln), bdrms: d.bdrms },
        nm: ['\\log(lotsize)', '\\log(sqrft)', 'bdrms'], ylab: 'log(price)', yl: '\\log(price)', dg: 3
      }
    };
    // KaTeX-ready number with `sig` significant digits; scientific notation outside [0.001, 100000)
    const tex = (v, sig = 3) => {
      if (v === 0) return '0';
      const a = Math.abs(v);
      if (a >= 1e-3 && a < 1e5) return E.fmt(v, Math.min(8, Math.max(0, sig - 1 - Math.floor(Math.log10(a)))));
      const e = Math.floor(Math.log10(a));
      return `${E.fmt(v / Math.pow(10, e), 2)}\\times 10^{${e}}`;
    };
    let mk = 'level', step = 1;
    UI.segmented(S.controls, { label: 'Model', options: [{ value: 'level', label: 'level-level' }, { value: 'log', label: 'log-log' }], value: mk, onChange: v => { mk = v; draw(); } });
    UI.segmented(S.controls, {
      label: 'Step', value: 1, options: [
        { value: 1, label: '1 · get \\(\\hat y\\)' }, { value: 2, label: '2 · add \\(\\hat y^2,\\hat y^3\\)' }, { value: 3, label: '3 · \\(F\\) test' }],
      onChange: v => { step = +v; draw(); }
    });
    const out = UI.readout(S.out);
    function draw() {
      const M = MOD[mk], f = E.ols(M.y, M.X), n = f.n, k = 3;
      const yh = f.fitted, X2 = Object.assign({}, M.X, { yhat2: yh.map(v => v * v), yhat3: yh.map(v => v * v * v) });
      const fu = E.ols(M.y, X2);
      const q = 2, F = ((f.SSR - fu.SSR) / q) / (fu.SSR / fu.df), p = 1 - E.pf(F, q, fu.df), cv = E.qf(0.95, q, fu.df);
      const lo = E.min(yh), hi = E.max(yh), pad = 0.05 * (hi - lo);
      S.plotHost.innerHTML = '';
      let head = '', body = '';

      if (step === 1) {
        const P = new UI.Plot(S.plotHost, {
          w: 620, h: 272, xlim: [lo - pad, hi + pad], ylim: [E.min(M.y) - pad, E.max(M.y) + pad],
          xlab: '\\(\\hat y\\) (fitted value)', ylab: M.ylab
        });
        yh.forEach((v, i) => P.line(v, v, v, M.y[i], { color: 'rgba(120,120,130,.45)', width: 1 }));
        P.fn(v => v, { color: C.ink, width: 2, dash: '6 5' });
        P.points(yh, M.y, { r: 3.4 });
        head = `<b>Step 1.</b> Estimate the model and keep the fitted values.`;
        body = `\\(\\hat y = ${tex(f.coef[0], 4)} ${f.coef.slice(1).map((b, j) => (b < 0 ? '-' : '+') + tex(Math.abs(b), M.dg) + '\\,' + M.nm[j]).join(' ')}\\)<br><br>` +
          `\\(\\hat y_i\\) is <b>one number per house</b> summarizing all ${k} regressors; the gray segments are the residuals \\(\\hat u_i = y_i-\\hat y_i\\).<br>` +
          `\\(\\text{SSR}_r = \\sum\\hat u_i^2 = ${tex(f.SSR, 4)}\\)`;
      } else if (step === 2) {
        const P = new UI.Plot(S.plotHost, {
          w: 620, h: 272, xlim: [lo - pad, hi + pad],
          ylim: [-1.15 * E.quantile(f.resid.map(Math.abs), 0.97), 1.15 * E.quantile(f.resid.map(Math.abs), 0.97)],
          xlab: '\\(\\hat y\\)', ylab: '\\(\\hat u\\) (residual)'
        });
        P.hline(0, { color: C.ink, width: 1.3, dash: '4 4' });
        P.points(yh, f.resid, { r: 3.4 });
        // descriptive cubic in yhat, to show the shape RESET reacts to
        const cub = E.ols(f.resid, { a: yh, b: yh.map(v => v * v), c: yh.map(v => v * v * v) });
        P.fn(v => cub.coef[0] + cub.coef[1] * v + cub.coef[2] * v * v + cub.coef[3] * v * v * v,
          { color: C.red, width: 3, from: lo, to: hi, n: 120 });
        head = `<b>Step 2.</b> Add \\(\\textcolor{#d9622b}{\\hat y^2}\\) and \\(\\textcolor{#c0392b}{\\hat y^3}\\) to the original regression.`;
        body = `\\(\\textcolor{#d9622b}{\\hat\\gamma_1} = ${tex(fu.coef[4], 3)}\\) &nbsp;(\\(t = ${E.fmt(fu.t[4], 2)}\\)) &nbsp;&nbsp; \\(\\textcolor{#c0392b}{\\hat\\gamma_2} = ${tex(fu.coef[5], 3)}\\) &nbsp;(\\(t = ${E.fmt(fu.t[5], 2)}\\))<br>` +
          `\\(\\text{SSR}_{ur} = ${tex(fu.SSR, 4)}\\), down from \\(\\text{SSR}_r = ${tex(f.SSR, 4)}\\)<br><br>` +
          `<span class="muted small">The red curve is the residual pattern the two extra terms can pick up. ${mk === 'level' ? 'It bends clearly: the linear model overpredicts in the middle and underpredicts at the top.' : 'It is almost flat, so there is little left for \\(\\hat y^2\\) and \\(\\hat y^3\\) to explain.'}</span>`;
      } else {
        const L = Math.max(cv * 1.7, F * 1.2, 5), fy = v => E.df(v, q, fu.df);
        const ymax = Math.max(...E.range(0.05, L, 80).map(fy)) * 1.12;
        const P = new UI.Plot(S.plotHost, { w: 620, h: 272, xlim: [0, L], ylim: [0, ymax], xlab: `\\(F(${q},\\,${fu.df})\\) under \\(H_0\\)`, yticks: [], margin: { t: 10, b: 56 } });
        P.area(fy, cv, L, { fill: 'rgba(192,57,43,.3)' });
        P.fn(fy, { color: C.ink, width: 2.5, from: 0.01, n: 300 });
        P.vline(cv, { color: C.red, width: 2, dash: '5 4' });
        P.text(cv, ymax * 0.62, ` 5% critical value ${E.fmt(cv, 2)}`, { color: C.red, size: 17 });
        P.vline(Math.min(F, L * 0.99), { color: C.orange, width: 3.5 });
        P.text(Math.min(F, L * 0.985), ymax * 0.9, `F = ${E.fmt(F, 2)} `, { color: C.orange, weight: 700, anchor: F > L * 0.6 ? 'end' : 'start' });
        head = `<b>Step 3.</b> \\(H_0:\\textcolor{#d9622b}{\\gamma_1}=\\textcolor{#c0392b}{\\gamma_2}=0\\) against \\(H_1:\\) at least one is nonzero.`;
        body = `\\(F = \\dfrac{(\\text{SSR}_r-\\text{SSR}_{ur})/2}{\\text{SSR}_{ur}/(n-k-3)} = \\dfrac{(${tex(f.SSR, 4)}-${tex(fu.SSR, 4)})/2}{${tex(fu.SSR, 4)}/${fu.df}} = ${E.fmt(F, 3)}\\)<br>` +
          `p-value = <b>${E.fmt(p, 4)}</b>, critical value \\(F_{0.05}(2,${fu.df}) = ${E.fmt(cv, 2)}\\)<br>` +
          (p < 0.05
            ? `<span class="bad">Reject \\(H_0\\):</span> the functional form is misspecified. RESET does not say how to fix it — try logs or quadratics.`
            : `<span class="good">Fail to reject \\(H_0\\):</span> no evidence of neglected nonlinearity in this specification.`);
      }
      out.innerHTML = `<span class="muted small">\\(${M.yl}\\) on ${M.nm.map(s => `\\(${s}\\)`).join(', ')} · \\(n = ${n}\\)</span><br>${head}<br>${body}`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Classical errors in variables: attenuation bias
     ------------------------------------------------------------------ */
  UI.widget('meas-error', host => {
    const S = UI.scaffold(host);
    let se = 1, busy = null;
    const P = new UI.Plot(S.plotHost, { w: 640, h: 290, xlim: [-4.5, 4.5], ylim: [-6, 6], xlab: 'measured x* = x + e', ylab: 'y' });
    UI.slider(S.controls, { label: 'sd of the measurement error \\(\\sigma_e\\)', min: 0, max: 3, step: 0.05, value: se, fmt: v => v.toFixed(2), onInput: v => { se = v; clearTimeout(busy); busy = setTimeout(run, 25); } });
    const note = UI.el('p', { class: 'small muted', html: 'True model: \\(y = 1 + 1\\cdot x + u\\), \\(\\;x \\sim N(0,1)\\), \\(u \\sim N(0,1)\\); we only observe \\(x^* = x + e\\)' });
    S.controls.appendChild(note); UI.renderMath(note);
    const out = UI.readout(S.out);
    function run() {
      const r = E.RNG(23), n = 300, R = 200, est = [];
      let last = null;
      for (let k = 0; k < R; k++) {
        const x = r.vec(n, () => r.norm()), y = x.map(v => 1 + v + r.norm()), xs = x.map(v => v + se * r.norm());
        const f = E.slr(xs, y); est.push(f.b1);
        if (k === 0) last = { xs, y, f };
      }
      P.clear();
      P.points(last.xs, last.y, { r: 2.8, fill: 'rgba(31,95,168,.3)', stroke: 'none' });
      P.fn(v => 1 + v, { color: C.green, width: 3, dash: '7 5' });
      P.fn(v => last.f.b0 + last.f.b1 * v, { color: C.orange, width: 3.2 });
      const plim = 1 / (1 + se * se);
      out.innerHTML = `<span style="color:${C.green}"><b>True</b></span> slope: 1.00 &nbsp; <span style="color:${C.orange}"><b>OLS</b></span> with the mismeasured x: <span class="big">${E.fmt(E.mean(est), 3)}</span><br><br>` +
        `\\(\\text{plim}\\,\\hat\\beta_1 = \\beta_1\\dfrac{\\sigma_x^2}{\\sigma_x^2 + \\sigma_e^2} = \\dfrac{1}{1 + ${E.fmt(se * se, 2)}} = ${E.fmt(plim, 3)}\\)<br><br>` +
        (se < 0.05 ? `<span class="good">No measurement error: OLS is consistent.</span>` :
          `<span class="bad">Attenuation bias:</span> the estimate is pulled <b>toward zero</b>, here by about ${E.fmt(100 * (1 - plim), 0)}%. More data does not help: this is inconsistency, not noise.`);
      UI.renderMath(out);
    }
    run();
  });

  /* ------------------------------------------------------------------
     Outliers and influential observations (rdchem)
     ------------------------------------------------------------------ */
  UI.widget('outliers', host => {
    const S = UI.scaffold(host);
    const d = W.rdchem, n = d.sales.length;
    const big = d.sales.indexOf(E.max(d.sales));
    let logs = false, drop = new Set();
    UI.toggle(S.controls, { label: 'use the <b>log-log</b> model instead', value: false, onChange: v => { logs = v; draw(); } });
    const row = UI.el('div', { class: 'row' }); S.controls.appendChild(row);
    UI.button(row, 'drop the largest firm', () => { drop.has(big) ? drop.delete(big) : drop.add(big); draw(); }, 'small');
    UI.button(row, 'keep all firms', () => { drop = new Set(); draw(); }, 'small ghost');
    const out = UI.readout(S.out);
    function draw() {
      const keep = d.sales.map((_, i) => !drop.has(i));
      const x = logs ? d.sales.map(ln) : d.sales, y = logs ? d.rd.map(ln) : d.rdintens;
      const xs = x.filter((_, i) => keep[i]), ys = y.filter((_, i) => keep[i]), pm = d.profmarg.filter((_, i) => keep[i]);
      const f = E.ols(ys, { x: xs, profmarg: pm });
      S.plotHost.innerHTML = '';
      const P = new UI.Plot(S.plotHost, {
        w: 640, h: 320, xlim: logs ? [4, 11] : [-1500, 42000], ylim: logs ? [-2, 9] : [0, 10],
        xlab: logs ? 'log(sales)' : 'sales (millions of $)', ylab: logs ? 'log(R&D spending)' : 'R&D intensity (% of sales)'
      });
      const mp = E.mean(pm);
      P.fn(v => f.coef[0] + f.coef[1] * v + f.coef[2] * mp, { color: C.orange, width: 3.2 });
      const g = UI.svg('g'); P.gData.appendChild(g);
      x.forEach((v, i) => {
        const c = UI.svg('circle', { cx: P.X(v), cy: P.Y(y[i]), r: i === big ? 8 : 5, fill: drop.has(i) ? 'none' : (i === big ? 'rgba(192,57,43,.7)' : 'rgba(31,95,168,.5)'), stroke: drop.has(i) ? C.muted : (i === big ? C.red : C.blue), 'stroke-width': drop.has(i) ? 2 : 1, 'stroke-dasharray': drop.has(i) ? '3 3' : null });
        c.style.cursor = 'pointer'; c.addEventListener('click', () => { drop.has(i) ? drop.delete(i) : drop.add(i); draw(); }); g.appendChild(c);
      });
      out.innerHTML = `n = <b>${f.n}</b> of ${n} firms${drop.size ? ` (${drop.size} dropped)` : ''}<br>` +
        `coefficient on ${logs ? 'log(sales)' : 'sales'}: <span class="big">${E.fmt(f.coef[1], logs ? 3 : 5)}</span><br>` +
        `se ${E.fmt(f.se[1], logs ? 3 : 5)}, t = <b>${E.fmt(f.t[1], 2)}</b>, p = ${E.fmtP(f.p[1])}<br><br>` +
        (logs
          ? `<span class="good">The log-log model is barely affected</span> by dropping the largest firm: the elasticity stays near 1.08. Logs pull in extreme values.`
          : (drop.has(big)
            ? `<span class="or">Without the largest firm</span> the coefficient more than triples and becomes significant at 5%.`
            : `<span class="muted">One firm has sales of \\$39.7 billion, about twice the next largest. Click it (the red dot) or use the button to see how much it matters.</span>`)) +
        `<br><span class="muted small">Click any dot to drop or restore that firm.</span>`;
      UI.renderMath(out);
    }
    draw();
  });
})();
