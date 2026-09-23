/* Widgets for Deck 07 — Large-sample properties of OLS */
(function () {
  const { E, UI } = window; const C = UI.C;

  const NS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
  /* ------------------------------------------------------------------
     Consistency: sampling distribution as n grows (and when it fails)
     ------------------------------------------------------------------ */
  UI.widget('consistency', host => {
    const S = UI.scaffold(host);
    let ni = 2, omit = false, busy;
    const P = new UI.Plot(S.plotHost, { w: 640, h: 390, xlim: [-0.4, 1.6], ylim: [0, 1], xlab: 'estimates of β₁ (true β₁ = 0.5) from 300 samples', yticks: [] });
    const sl = UI.slider(S.controls, { label: 'sample size n', min: 0, max: NS.length - 1, step: 1, value: ni, fmt: v => NS[v], onInput: v => { ni = v; clearTimeout(busy); busy = setTimeout(run, 20); } });
    UI.toggle(S.controls, { label: '<b>Omit</b> \\(x_2\\), which is correlated with \\(x_1\\) (MLR.4\' fails)', value: false, onChange: v => { omit = v; run(); } });
    const out = UI.readout(S.out);
    function run() {
      const n = NS[ni], r = E.RNG(31), est = [];
      for (let k = 0; k < 300; k++) {
        const x1 = r.vec(n, () => r.norm()), x2 = x1.map(v => 0.6 * v + 0.8 * r.norm());
        const y = x1.map((v, i) => 1 + 0.5 * v + (omit ? 0.5 * x2[i] : 0) + r.norm());
        est.push(E.slr(x1, y).b1);
      }
      const h = E.hist(est, -0.4, 1.6, 80), mx = Math.max(...h.counts);
      P.setLimits([-0.4, 1.6], [0, mx * 1.15]); P.clear(); P.hist(h, { fill: omit ? 'rgba(217,98,43,.55)' : 'rgba(31,95,168,.55)' });
      P.vline(0.5, { color: C.green, width: 3, dash: '6 4' }); P.text(0.5, mx * 1.08, ' β₁ = 0.5', { color: C.green, weight: 700 });
      if (omit) { P.vline(0.8, { color: C.red, width: 2.5, dash: '3 3' }); P.text(0.8, mx * 0.95, ' plim = 0.8', { color: C.red, weight: 700 }); }
      const far = est.filter(v => Math.abs(v - 0.5) > 0.1).length / est.length;
      out.innerHTML = `n = <b>${n}</b><br>mean of \\(\\hat\\beta_1\\) = <b>${E.fmt(E.mean(est), 3)}</b>, sd = <b>${E.fmt(E.sd(est), 3)}</b><br>` +
        `share of estimates more than 0.1 away from β₁: <span class="big">${E.fmt(100 * far, 0)}%</span><br>` +
        (omit ? `<span class="bad">Inconsistent:</span> as n grows the distribution collapses on \\(\\beta_1 + \\beta_2\\delta_1 = 0.5 + 0.5\\times0.6 = 0.8\\), not on 0.5. More data does <b>not</b> help.`
          : `<span class="good">Consistent:</span> as n grows the distribution collapses on the true value: \\(P(|\\hat\\beta_1 - \\beta_1| > \\varepsilon) \\to 0\\).`) +
        `<br><span class="muted small">Move n step by step. The spread shrinks at the rate \\(1/\\sqrt{n}\\).</span>`;
      UI.renderMath(out);
    }
    run();
  });

  /* ------------------------------------------------------------------
     Asymptotic normality: t statistic with non-normal errors
     ------------------------------------------------------------------ */
  UI.widget('asy-normal', host => {
    const S = UI.scaffold(host);
    let ni = 0, dist = 'skew', busy;
    const P = new UI.Plot(S.plotHost, { w: 640, h: 390, xlim: [-4.5, 4.5], ylim: [0, 0.5], xlab: '\\(t = (\\hat\\beta_1 - \\beta_1)/\\text{se}(\\hat\\beta_1)\\) from 2,000 samples (H₀ true)', yticks: [] });
    UI.segmented(S.controls, { label: 'Distribution of u', options: [{ value: 'normal', label: 'normal' }, { value: 'unif', label: 'uniform' }, { value: 'skew', label: 'very skewed' }, { value: 'heavy', label: 'heavy tails' }], value: dist, onChange: v => { dist = v; run(); } });
    UI.slider(S.controls, { label: 'sample size n', min: 0, max: 6, step: 1, value: ni, fmt: v => NS[v], onInput: v => { ni = v; clearTimeout(busy); busy = setTimeout(run, 20); } });
    const out = UI.readout(S.out);
    function draw_u(r) {
      if (dist === 'normal') return r.norm();
      if (dist === 'unif') return r.unif(-1.7, 1.7);
      if (dist === 'skew') { const z = r.norm(); return (z * z - 1) / 1.414; } // centered chi-square(1)
      const z = r.norm(), v = r.chisq(3); return z / Math.sqrt(v / 3) / 1.7; // t(3)
    }
    function run() {
      const n = NS[ni], r = E.RNG(8), ts = [];
      for (let k = 0; k < 2000; k++) {
        const x = r.vec(n, () => r.expo() ), y = x.map(v => 1 + 0.5 * v + draw_u(r));
        const f = E.ols(y, { x }); ts.push((f.coef[1] - 0.5) / f.se[1]);
      }
      const h = E.hist(ts, -4.5, 4.5, 60);
      P.clear(); P.hist(h, { density: true, fill: 'rgba(31,95,168,.5)' });
      P.fn(v => E.dnorm(v), { color: C.orange, width: 3, n: 200 });
      const c1 = E.qt(0.95, n - 2), c2 = E.qt(0.975, n - 2), N = ts.length;
      const L = ts.filter(t => t < -c1).length / N, R = ts.filter(t => t > c1).length / N, T = ts.filter(t => Math.abs(t) > c2).length / N;
      const ok = v => Math.abs(v - 0.05) < 0.01, cls = v => ok(v) ? 'good' : 'bad';
      out.innerHTML = `n = <b>${n}</b>, errors: <b>${{ normal: 'normal', unif: 'uniform', skew: 'very skewed (χ²₁)', heavy: 'heavy-tailed (t₃)' }[dist]}</b><br>` +
        `How often is the <b>true</b> H₀ rejected? (each test has nominal size 5%)<br>` +
        `left-tail test: <span class="${cls(L)}">${E.fmt(100 * L, 1)}%</span> &nbsp; right-tail test: <span class="${cls(R)}">${E.fmt(100 * R, 1)}%</span><br>` +
        `two-sided test: <span class="${cls(T)}">${E.fmt(100 * T, 1)}%</span><br>` +
        (ok(L) && ok(R) && ok(T) ? `<span class="good">All three tests have about the right size.</span>` : `<span class="or">Size distortion: the t distribution is not a good approximation yet.</span>`) +
        `<br><span class="muted small">Orange: N(0, 1). With skewed errors the histogram is lopsided in small samples, so one-sided tests go wrong; the two-sided test is more robust. As n grows, the CLT fixes both (Theorem 5.2).</span>`;
      UI.renderMath(out);
    }
    run();
  });

})();
