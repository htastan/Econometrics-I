/* Widgets for Deck 05 — Multiple Regression II: t tests and confidence intervals */
(function () {
  const { E, UI } = window; const C = UI.C; const W = window.WDATA;

  /* ------------------------------------------------------------------
     t test explorer: alternatives, alpha, p-value, textbook presets
     ------------------------------------------------------------------ */
  UI.widget('t-explorer', host => {
    host.innerHTML = ''; host.classList.add('widget-live');
    const bar1 = UI.el('div', { class: 'fs-bar' }), bar2 = UI.el('div', { class: 'fs-bar' });
    const grid = UI.el('div', { class: 'wgrid wide' }), left = UI.el('div', { class: 'wplot' }), side = UI.el('div', { class: 'wside' });
    grid.append(left, side); host.append(bar1, bar2, grid);
    let alt = 'two', alpha = 0.05, df = 60, t = 2.1, showN = false, label = '';
    const bA = UI.el('div'); bar1.appendChild(bA);
    const segA = UI.segmented(bA, { label: '\\(H_1\\)', options: [{ value: 'right', label: 'β > a (right tail)' }, { value: 'left', label: 'β < a (left tail)' }, { value: 'two', label: 'β ≠ a (two-sided)' }], value: alt, onChange: v => { alt = v; label = ''; draw(); } });
    const sT = UI.slider(bar2, { label: 't statistic', min: -5, max: 5, step: 0.01, value: t, fmt: v => v.toFixed(2), onInput: v => { t = v; label = ''; draw(); } });
    const sA = UI.slider(bar2, { label: '\\(\\alpha\\)', min: 0.001, max: 0.2, step: 0.001, value: alpha, fmt: v => (100 * v).toFixed(1) + '%', onInput: v => { alpha = v; draw(); } });
    const sD = UI.slider(bar2, { label: 'df', min: 2, max: 600, step: 1, value: df, fmt: v => v, onInput: v => { df = v; label = ''; draw(); } });
    [sT, sA, sD].forEach(s => { s.el.style.width = '15.5em'; s.el.style.gridTemplateColumns = '4.6em 1fr 3.6em'; });
    const pre = UI.el('div', { class: 'row' }); bar1.appendChild(pre);
    pre.appendChild(UI.el('span', { class: 'ctrl-label', text: 'Examples:' }));
    const PRESETS = [
      { k: 'exper', alt: 'right', t: 2.391, df: 522, lab: 'wage1: H₀ β_exper = 0 vs > 0' },
      { k: 'enroll', alt: 'left', t: -0.918, df: 404, lab: 'meap93: H₀ β_enroll = 0 vs < 0' },
      { k: 'skipped', alt: 'two', t: -3.197, df: 137, lab: 'gpa1: H₀ β_skipped = 0 vs ≠ 0' },
      { k: 'crime', alt: 'right', t: 2.458, df: 95, lab: 'campus: H₀ elasticity = 1 vs > 1' },
      { k: 'nox', alt: 'two', t: 0.398, df: 501, lab: 'hprice2: H₀ β_log(nox) = −1 vs ≠ −1' }
    ];
    PRESETS.forEach(p => UI.button(pre, p.k, () => { alt = p.alt; t = p.t; df = p.df; label = p.lab; segA.set(alt); sT.set(t); sD.set(df); draw(); }, 'small ghost'));
    UI.toggle(bar1, { label: 'N(0,1) for comparison', value: false, onChange: v => { showN = v; draw(); } });
    const out = UI.readout(side);
    function draw() {
      const L = Math.max(4.2, Math.abs(t) + 0.8);
      left.innerHTML = '';
      const P = new UI.Plot(left, { w: 640, h: 300, xlim: [-L, L], ylim: [0, 0.43], xlab: 't', ylab: 'density under H₀', margin: { t: 10 } });
      const f = v => E.dt(v, df);
      const cR = E.qt(1 - alpha, df), cT = E.qt(1 - alpha / 2, df);
      let p, rej, cTxt;
      if (alt === 'right') { p = 1 - E.pt(t, df); rej = t > cR; cTxt = `c = ${E.fmt(cR, 3)}`; P.area(f, cR, L, { fill: 'rgba(192,57,43,.3)' }); }
      else if (alt === 'left') { p = E.pt(t, df); rej = t < -cR; cTxt = `−c = ${E.fmt(-cR, 3)}`; P.area(f, -L, -cR, { fill: 'rgba(192,57,43,.3)' }); }
      else { p = 2 * (1 - E.pt(Math.abs(t), df)); rej = Math.abs(t) > cT; cTxt = `c = ±${E.fmt(cT, 3)}`; P.area(f, -L, -cT, { fill: 'rgba(192,57,43,.3)' }); P.area(f, cT, L, { fill: 'rgba(192,57,43,.3)' }); }
      // p-value area (hatched look via orange outline)
      const pv = (a, b) => P.area(f, a, b, { fill: 'rgba(217,98,43,.35)' });
      if (alt === 'right') pv(t, L); else if (alt === 'left') pv(-L, t); else { pv(Math.abs(t), L); pv(-L, -Math.abs(t)); }
      if (showN) P.fn(v => E.dnorm(v), { color: C.muted, width: 2, dash: '6 5', n: 300 });
      P.fn(f, { color: C.ink, width: 2.6, n: 300 });
      P.vline(t, { color: C.orange, width: 3.5 }); P.text(t, 0.405, ` t = ${E.fmt(t, 2)}`, { color: C.orange, weight: 700, anchor: t > L - 1.8 ? 'end' : 'start' });
      const hyp = { right: 'H_0: \\beta_j = a \\;\\text{vs.}\\; H_1: \\beta_j > a', left: 'H_0: \\beta_j = a \\;\\text{vs.}\\; H_1: \\beta_j < a', two: 'H_0: \\beta_j = a \\;\\text{vs.}\\; H_1: \\beta_j \\neq a' }[alt];
      out.innerHTML = (label ? `<b>${label}</b><br>` : '') + `\\(${hyp}\\)<br>` +
        `df = ${df}, α = ${E.fmt(100 * alpha, 1)}%, critical value ${cTxt}<br>` +
        `p-value = <span class="big">${E.fmtP(p)}</span><br>` +
        (rej ? `<span class="bad">Reject H₀</span> at the ${E.fmt(100 * alpha, 1)}% level (t is in the red region).` : `<span class="good">Fail to reject H₀</span> at the ${E.fmt(100 * alpha, 1)}% level.`) +
        `<br><span class="muted small"><b style="color:${C.red}">Red</b>: rejection region (area α). <b style="color:${C.orange}">Orange</b>: p-value, the tail area beyond t. We reject exactly when p &lt; α: move the α slider past ${E.fmtP(p)} and watch the decision flip.</span>`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Confidence interval coverage: 100 samples, 100 intervals
     ------------------------------------------------------------------ */
  UI.widget('ci-coverage', host => {
    const S = UI.scaffold(host);
    const B0 = 1, B1 = 0.5, SIG = 2; let n = 20, level = 0.95, useZ = false, cis = [], rs = E.RNG(7);
    const P = new UI.Plot(S.plotHost, { w: 640, h: 390, xlim: [-0.5, 1.5], ylim: [0, 101], xlab: 'confidence interval for β₁ (true β₁ = 0.5)', ylab: 'sample', yticks: [] });
    UI.segmented(S.controls, { label: 'Confidence level', options: [{ value: 0.9, label: '90%' }, { value: 0.95, label: '95%' }, { value: 0.99, label: '99%' }], value: 0.95, onChange: v => { level = +v; cis = []; add(100); } });
    UI.slider(S.controls, { label: 'sample size n', min: 5, max: 200, step: 1, value: n, fmt: v => v, onInput: v => { n = v; }, onChange: () => { cis = []; add(100); } });
    UI.toggle(S.controls, { label: 'use 1.96-type normal critical value instead of \\(t_{n-2}\\)', value: false, onChange: v => { useZ = v; cis = []; add(100); } });
    const row = UI.el('div', { class: 'row' }); S.controls.appendChild(row);
    UI.button(row, '+1 sample', () => add(1), 'small'); UI.button(row, '+100', () => add(100), 'small'); UI.button(row, 'Reset', () => { cis = []; add(1); }, 'small ghost');
    const out = UI.readout(S.out);
    function add(k) {
      for (let j = 0; j < k; j++) {
        const x = rs.vec(n, () => 10 * rs.unif()), y = x.map(v => B0 + B1 * v + SIG * rs.norm());
        const f = E.ols(y, { x }), b = f.coef[1], se = f.se[1];
        const c = useZ ? E.qnorm(1 - (1 - level) / 2) : E.qt(1 - (1 - level) / 2, n - 2);
        cis.push({ lo: b - c * se, hi: b + c * se, b });
      }
      draw();
    }
    function draw() {
      const show = cis.slice(-100);
      const w = Math.max(0.6, ...show.map(c => Math.max(Math.abs(c.lo - 0.5), Math.abs(c.hi - 0.5))));
      P.setLimits([0.5 - Math.min(w, 3), 0.5 + Math.min(w, 3)], [0, 101]); P.clear();
      show.forEach((c, i) => { const miss = c.lo > B1 || c.hi < B1; P.line(c.lo, i + 1, c.hi, i + 1, { color: miss ? C.red : 'rgba(31,95,168,.7)', width: miss ? 3 : 2 }); P.points([c.b], [i + 1], { r: 2.2, fill: miss ? C.red : C.blue, stroke: 'none' }); });
      P.vline(B1, { color: C.green, width: 3, dash: '6 4' });
      const miss = cis.filter(c => c.lo > B1 || c.hi < B1).length, cov = 1 - miss / cis.length;
      out.innerHTML = `Intervals drawn: <b>${cis.length}</b> (last 100 shown)<br>Contain the true β₁: <span class="big">${E.fmt(100 * cov, 1)}%</span><br>Nominal level: ${100 * level}%<br>` +
        `<span class="bad">${miss}</span> interval${miss === 1 ? '' : 's'} miss β₁ (red).` +
        (useZ && n < 30 ? `<br><span class="or">With small n, the normal critical value is too small: coverage falls below ${100 * level}%.</span>` : '') +
        `<br><span class="muted small">The true β₁ never moves; the <b>intervals</b> are random. "95% confidence" is a property of the procedure: 95% of such intervals contain β₁. We never know whether our one interval does.</span>`;
      UI.renderMath(out);
    }
    add(100);
  });

  /* ------------------------------------------------------------------
     CI ↔ two-sided test duality (hprice1 elasticity)
     ------------------------------------------------------------------ */
  UI.widget('ci-duality', host => {
    const S = UI.scaffold(host);
    const d = W.hprice1, f = E.ols(d.price.map(Math.log), { lsqrft: d.sqrft.map(Math.log), bdrms: d.bdrms });
    const b = f.coef[1], se = f.se[1], df = f.df; let a = 1, alpha = 0.05;
    const top = UI.el('div'), bot = UI.el('div'); S.plotHost.append(top, bot);
    const P = new UI.Plot(top, { w: 640, h: 130, xlim: [0.3, 1.3], ylim: [0, 1], xlab: 'values of the elasticity β₁', yticks: [], margin: { t: 8, b: 42 } });
    const T = new UI.Plot(bot, { w: 640, h: 210, xlim: [-6, 6], ylim: [0, 0.43], xlab: '\\(t = (\\hat\\beta_1 - a)/\\text{se}\\)', yticks: [], margin: { t: 6, b: 42 } });
    UI.slider(S.controls, { label: 'hypothesized value \\(a\\)', min: 0.3, max: 1.3, step: 0.005, value: a, fmt: v => v.toFixed(3), onInput: v => { a = v; draw(); } });
    UI.segmented(S.controls, { label: 'level', options: [{ value: 0.1, label: '90% / α = 10%' }, { value: 0.05, label: '95% / α = 5%' }, { value: 0.01, label: '99% / α = 1%' }], value: 0.05, onChange: v => { alpha = +v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      const c = E.qt(1 - alpha / 2, df), lo = b - c * se, hi = b + c * se, t = (b - a) / se, rej = Math.abs(t) > c;
      P.clear(); P.rect(lo, 0.3, hi, 0.7, { fill: 'rgba(31,95,168,.25)', stroke: C.blue });
      P.points([b], [0.5], { r: 6, fill: C.blue, stroke: '#fff', sw: 2 });
      P.vline(a, { color: rej ? C.red : C.green, width: 3.5 }); P.text(a, 0.88, ` a = ${E.fmt(a, 3)}`, { color: rej ? C.red : C.green, weight: 700, anchor: a > 1.1 ? 'end' : 'start' });
      T.clear(); const fd = v => E.dt(v, df);
      T.area(fd, -6, -c, { fill: 'rgba(192,57,43,.3)' }); T.area(fd, c, 6, { fill: 'rgba(192,57,43,.3)' });
      T.fn(fd, { color: C.ink, width: 2.4, n: 250 }); T.vline(E.clamp(t, -5.9, 5.9), { color: rej ? C.red : C.green, width: 3.5 });
      out.innerHTML = `\\(\\widehat{\\log(price)} = ${E.fmt(f.coef[0], 3)} + ${E.fmt(b, 3)}\\log(sqrft) + ${E.fmt(f.coef[2], 3)}\\,bdrms\\), n = ${f.n}<br>` +
        `${100 * (1 - alpha)}% CI: \\([${E.fmt(lo, 3)},\\; ${E.fmt(hi, 3)}]\\)<br>` +
        `\\(t = (${E.fmt(b, 3)} - ${E.fmt(a, 3)})/${E.fmt(se, 4)} = ${E.fmt(t, 2)}\\)<br>` +
        (rej ? `<span class="bad">a is outside the CI ⇔ reject H₀: β₁ = a</span>` : `<span class="good">a is inside the CI ⇔ fail to reject H₀: β₁ = a</span>`) +
        `<br><span class="muted small">Try a = 1 (unit elasticity): it lies just inside the 95% interval.</span>`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Reading regression output: click any number
     ------------------------------------------------------------------ */
  UI.widget('reg-reader', host => {
    host.innerHTML = ''; host.classList.add('widget-live');
    const d = W.wage1, f = E.ols(d.wage.map(Math.log), { educ: d.educ, exper: d.exper, tenure: d.tenure });
    const grid = UI.el('div', { class: 'wgrid', style: { gridTemplateColumns: '1.35fr 1fr' } }), left = UI.el('div'), side = UI.el('div');
    grid.append(left, side); host.appendChild(grid);
    const panel = UI.el('div', { class: 'tip-panel', html: '<span class="muted">Click any highlighted number in the output.</span>' }); side.appendChild(panel);
    const f4 = v => E.fmt(v, 5), row = j => ({ nm: f.names[j], b: f.coef[j], se: f.se[j], t: f.t[j], p: f.p[j] });
    const tip = (j, what) => {
      const r = row(j), nm = r.nm === '(Intercept)' ? 'the intercept' : `<b>${r.nm}</b>`;
      return {
        b: `<b>Estimate</b> \\(\\hat\\beta\\) for ${nm}. ${r.nm === '(Intercept)' ? 'The predicted log(wage) when educ = exper = tenure = 0.' : `Holding the other regressors fixed, one more year of ${r.nm} changes log(wage) by ${E.fmt(r.b, 4)}, i.e. the wage by about <b>${E.fmt(100 * r.b, 2)}%</b>.`}`,
        se: `<b>Standard error</b> \\(\\text{se}(\\hat\\beta)\\) = ${f4(r.se)}: the estimated standard deviation of the sampling distribution of this estimate. It measures its precision.`,
        t: `<b>t value</b> for \\(H_0: \\beta = 0\\): \\(t = \\hat\\beta/\\text{se} = ${f4(r.b)}/${f4(r.se)} = ${E.fmt(r.t, 3)}\\). The estimate is ${E.fmt(Math.abs(r.t), 1)} standard errors away from 0.`,
        p: `<b>p-value</b> for the <b>two-sided</b> test of \\(H_0: \\beta = 0\\): \\(P(|T_{${f.df}}| > ${E.fmt(Math.abs(r.t), 2)}) = ${E.fmtP(r.p)}\\). Reject at level α if p < α.${r.nm === 'exper' ? ' For the one-sided alternative β > 0, halve it: ' + E.fmt(r.p / 2, 4) + '.' : ''}`,
        s: `<b>Significance stars</b>: *** p < 0.001, ** p < 0.01, * p < 0.05, . p < 0.1. A shortcut, not a substitute for reading the numbers.`
      }[what];
    };
    const cell = (html, t) => { const c = UI.el('td', { html }); if (t) { c.classList.add('hot'); c.addEventListener('click', () => { UI.$$('.hot', left).forEach(x => x.classList.remove('on')); c.classList.add('on'); panel.innerHTML = t(); UI.renderMath(panel); }); } return c; };
    const tab = UI.el('table', { class: 'regtab regreader' });
    const hd = UI.el('tr'); ['', 'Estimate', 'Std. Error', 't value', 'Pr(>|t|)', ''].forEach(h => hd.appendChild(UI.el('th', { text: h }))); tab.appendChild(hd);
    f.coef.forEach((_, j) => {
      const r = row(j), tr = UI.el('tr');
      tr.append(cell(r.nm), cell(E.fmt(r.b, 5), () => tip(j, 'b')), cell(E.fmt(r.se, 5), () => tip(j, 'se')), cell(E.fmt(r.t, 3), () => tip(j, 't')), cell(E.fmtP(r.p), () => tip(j, 'p')), cell(E.stars(r.p) || '&nbsp;', () => tip(j, 's')));
      tr.firstChild.classList.add('nm'); tab.appendChild(tr);
    });
    left.appendChild(UI.el('div', { class: 'mono small', html: `lm(formula = log(wage) ~ educ + exper + tenure, data = wage1)` }));
    left.appendChild(tab);
    const foot = UI.el('div', { class: 'mono small regfoot2' });
    const fitem = (html, t) => { const s = UI.el('span', { html, class: 'hot' }); s.addEventListener('click', () => { UI.$$('.hot', left).forEach(x => x.classList.remove('on')); s.classList.add('on'); panel.innerHTML = t; UI.renderMath(panel); }); return s; };
    foot.append(fitem(`Residual standard error: ${E.fmt(f.sigma, 4)}`, `<b>SER</b> \\(\\hat\\sigma = \\sqrt{SSR/(n-k-1)} = ${E.fmt(f.sigma, 4)}\\): the typical size of a residual, in units of log(wage).`), ' on ',
      fitem(`${f.df} degrees of freedom`, `<b>Degrees of freedom</b> \\(n-k-1 = ${f.n} - 3 - 1 = ${f.df}\\). Used for the t distribution of every t statistic above.`), UI.el('br'),
      fitem(`Multiple R-squared: ${E.fmt(f.R2, 4)}`, `<b>R²</b>: educ, exper and tenure together explain ${E.fmt(100 * f.R2, 1)}% of the sample variation in log(wage).`), ', ',
      fitem(`Adjusted R-squared: ${E.fmt(f.adjR2, 4)}`, `<b>Adjusted R²</b> penalizes extra regressors (Week 7).`), UI.el('br'),
      fitem(`F-statistic: ${E.fmt(f.F, 2)} on ${f.k} and ${f.df} DF, p-value: ${E.fmtP(f.Fp)}`, `<b>F statistic</b> for \\(H_0: \\beta_{educ} = \\beta_{exper} = \\beta_{tenure} = 0\\), i.e. the regression explains nothing. Next week!`));
    left.appendChild(foot);
  });
})();
