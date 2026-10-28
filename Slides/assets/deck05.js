/* Widgets for Deck 05 — Multiple Regression II: t tests and confidence intervals */
(function () {
  const { E, UI } = window; const C = UI.C; const W = window.WDATA;

  /* ------------------------------------------------------------------
     t versus N(0,1): fatter tails for small df (one control: df)
     ------------------------------------------------------------------ */
  UI.widget('t-vs-normal', host => {
    const S = UI.scaffold(host); let df = 5;
    UI.segmented(S.controls, { label: 'degrees of freedom', options: [3, 5, 10, 30, 120].map(v => ({ value: v, label: String(v) })), value: df, onChange: v => { df = +v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      S.plotHost.innerHTML = '';
      const L = 4.5, f = v => E.dt(v, df), c = E.qt(0.975, df);
      const P = new UI.Plot(S.plotHost, { w: 640, h: 300, xlim: [-L, L], ylim: [0, 0.43], xlab: 'value of the statistic', ylab: 'density', margin: { t: 10 } });
      // tail areas of t beyond +-1.96: what a normal-based test would call "5%"
      P.area(f, -L, -1.96, { fill: 'rgba(192,57,43,.32)' }); P.area(f, 1.96, L, { fill: 'rgba(192,57,43,.32)' });
      P.fn(v => E.dnorm(v), { color: C.blue, width: 3, n: 300 });
      P.fn(f, { color: C.ink, width: 3, dash: '8 5', n: 300 });
      [-1.96, 1.96].forEach(v => P.vline(v, { color: C.blue, width: 1.5, dash: '3 4' }));
      P.text(2.12, 0.36, 'N(0,1)', { color: C.blue, weight: 700 });
      P.text(2.12, 0.32, `t, df = ${df} (dashed)`, { color: C.ink, weight: 700 });
      const tail = 2 * (1 - E.pt(1.96, df));
      out.innerHTML = `Area beyond \\(\\pm 1.96\\) (red):<br>` +
        `<span style="color:${C.blue};font-weight:700">N(0,1)</span>: 5.0% &nbsp;·&nbsp; <b>t, df = ${df}</b>: <span class="big">${E.fmt(100 * tail, 1)}%</span><br><br>` +
        `5% two-sided critical value:<br><span style="color:${C.blue};font-weight:700">N(0,1)</span>: 1.960 &nbsp;·&nbsp; <b>t, df = ${df}</b>: <b>${E.fmt(c, 3)}</b><br><br>` +
        `<span class="muted small">Because σ is estimated, t has <b>fatter tails</b>, so the critical value must be larger. As df grows, t approaches N(0,1).</span>`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     One t test, one picture: the examples of the lecture
     data-preset = exper | enroll | skipped | crime | nox | all
     data-alt overrides the alternative; data-p="true" shades the p-value
     ------------------------------------------------------------------ */
  const PRESETS = {
    exper: { alt: 'right', t: 2.391, df: 522, par: '\\beta_{exper}', a: '0', lab: 'wage1: experience' },
    enroll: { alt: 'left', t: -0.918, df: 404, par: '\\beta_{enroll}', a: '0', lab: 'meap93: school size' },
    skipped: { alt: 'two', t: -3.197, df: 137, par: '\\beta_{skipped}', a: '0', lab: 'gpa1: skipped classes' },
    crime: { alt: 'right', t: 2.457, df: 95, par: '\\beta_{\\log(enroll)}', a: '1', lab: 'campus: crime elasticity' },
    nox: { alt: 'two', t: 0.398, df: 501, par: '\\beta_{\\log(nox)}', a: '-1', lab: 'hprice2: pollution elasticity' }
  };
  const REL = { right: '>', left: '<', two: '\\neq' };

  UI.widget('t-fig', host => {
    const S = UI.scaffold(host), ds = host.dataset, all = ds.preset === 'all', showP = ds.p === 'true';
    let cur = { ...PRESETS[all ? 'exper' : ds.preset] }, alpha = 0.05;
    if (ds.alt) cur.alt = ds.alt;
    if (all) UI.segmented(S.controls, { label: 'Example', options: Object.keys(PRESETS), value: 'exper', onChange: k => { cur = { ...PRESETS[k] }; draw(); } });
    UI.segmented(S.controls, { label: 'significance level \\(\\alpha\\)', options: [{ value: 0.1, label: '10%' }, { value: 0.05, label: '5%' }, { value: 0.01, label: '1%' }], value: 0.05, onChange: v => { alpha = +v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      const { alt, t, df } = cur, L = Math.max(4.2, Math.abs(t) + 0.8), f = v => E.dt(v, df);
      const red = 'rgba(192,57,43,.3)', c = alt === 'two' ? E.qt(1 - alpha / 2, df) : E.qt(1 - alpha, df);
      S.plotHost.innerHTML = '';
      const P = new UI.Plot(S.plotHost, { w: 640, h: 290, xlim: [-L, L], ylim: [0, 0.43], xlab: 't', ylab: 'density under H₀', margin: { t: 10 } });
      if (alt !== 'left') P.area(f, c, L, { fill: red });
      if (alt !== 'right') P.area(f, -L, -c, { fill: red });
      let p;
      if (alt === 'right') p = 1 - E.pt(t, df); else if (alt === 'left') p = E.pt(t, df); else p = 2 * (1 - E.pt(Math.abs(t), df));
      if (showP) {
        const pv = (a, b) => P.area(f, a, b, { fill: 'rgba(217,98,43,.45)' });
        if (alt === 'right') pv(t, L); else if (alt === 'left') pv(-L, t); else { pv(Math.abs(t), L); pv(-L, -Math.abs(t)); }
      }
      P.fn(f, { color: C.ink, width: 2.6, n: 300 });
      const cs = alt === 'right' ? [c] : alt === 'left' ? [-c] : [-c, c];
      cs.forEach(v => { P.vline(v, { color: C.red, width: 1.6, dash: '5 4' }); P.text(v, 0.3, v > 0 ? `${E.fmt(v, 3)} ` : ` ${E.fmt(v, 3)}`, { color: C.red, weight: 700, anchor: v > 0 ? 'end' : 'start' }); /* inside, clear of the t line */ });
      P.vline(t, { color: C.orange, width: 3.5 }); P.text(t, 0.405, ` t = ${E.fmt(t, 2)}`, { color: C.orange, weight: 700, anchor: t > L - 1.8 ? 'end' : 'start' });
      const rej = alt === 'right' ? t > c : alt === 'left' ? t < -c : Math.abs(t) > c;
      const cTxt = alt === 'right' ? `c = ${E.fmt(c, 3)}` : alt === 'left' ? `−c = ${E.fmt(-c, 3)}` : `c = ±${E.fmt(c, 3)}`;
      const rule = alt === 'right' ? `t ${rej ? '>' : '≤'} c` : alt === 'left' ? `t ${rej ? '<' : '≥'} −c` : `|t| ${rej ? '>' : '≤'} c`;
      const a = 100 * alpha;
      out.innerHTML = (all ? `<b>${cur.lab}</b><br>` : '') +
        `\\(H_0: ${cur.par} = ${cur.a} \\;\\text{vs.}\\; H_1: ${cur.par} ${REL[alt]} ${cur.a}\\)<br>` +
        `df = ${df}, α = ${a}%: <b style="color:${C.red}">${cTxt}</b><br>` +
        `t = ${E.fmt(t, 2)}, so ${rule}: ` +
        (rej ? `<span class="bad">reject H₀ at ${a}%</span>` : `<span class="good">fail to reject H₀ at ${a}%</span>`) +
        (showP ? `<br>p-value = <span class="big">${E.fmtP(p)}</span> (orange). We reject exactly when p &lt; α.` : '') +
        `<br><span class="muted small"><b style="color:${C.red}">Red</b>: the rejection region, area α.${showP ? ` <b style="color:${C.orange}">Orange</b>: the p-value, the area beyond t.` : ''}</span>`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Confidence interval coverage: 100 samples, 100 intervals
     ------------------------------------------------------------------ */
  UI.widget('ci-coverage', host => {
    const S = UI.scaffold(host);
    const B0 = 1, B1 = 0.5, SIG = 2; let n = 20, level = 0.95, cis = [], rs = E.RNG(7);
    const P = new UI.Plot(S.plotHost, { w: 640, h: 390, xlim: [-0.5, 1.5], ylim: [0, 101], xlab: 'confidence interval for β₁ (true β₁ = 0.5)', ylab: 'sample', yticks: [] });
    UI.segmented(S.controls, { label: 'Confidence level', options: [{ value: 0.9, label: '90%' }, { value: 0.95, label: '95%' }, { value: 0.99, label: '99%' }], value: 0.95, onChange: v => { level = +v; cis = []; add(100); } });
    UI.slider(S.controls, { label: 'sample size n', min: 5, max: 200, step: 1, value: n, fmt: v => v, onInput: v => { n = v; }, onChange: () => { cis = []; add(100); } });
    const row = UI.el('div', { class: 'row' }); S.controls.appendChild(row);
    UI.button(row, '+1 sample', () => add(1), 'small'); UI.button(row, '+100', () => add(100), 'small'); UI.button(row, 'Reset', () => { cis = []; add(1); }, 'small ghost');
    const out = UI.readout(S.out);
    function add(k) {
      for (let j = 0; j < k; j++) {
        const x = rs.vec(n, () => 10 * rs.unif()), y = x.map(v => B0 + B1 * v + SIG * rs.norm());
        const f = E.ols(y, { x }), b = f.coef[1], se = f.se[1];
        const c = E.qt(1 - (1 - level) / 2, n - 2);
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
    const b = f.coef[1], se = f.se[1], df = f.df; let a = 1, alpha = 0.05, showT = false;
    const top = UI.el('div'), bot = UI.el('div'); S.plotHost.append(top, bot); bot.style.display = 'none';
    const P = new UI.Plot(top, { w: 640, h: 130, xlim: [0.3, 1.3], ylim: [0, 1], xlab: 'values of the elasticity β₁', yticks: [], margin: { t: 8, b: 42 } });
    const T = new UI.Plot(bot, { w: 640, h: 210, xlim: [-6, 6], ylim: [0, 0.43], xlab: '\\(t = (\\hat\\beta_1 - a)/\\text{se}\\)', yticks: [], margin: { t: 6, b: 42 } });
    UI.slider(S.controls, { label: 'hypothesized value \\(a\\)', min: 0.3, max: 1.3, step: 0.005, value: a, fmt: v => v.toFixed(3), onInput: v => { a = v; draw(); } });
    UI.segmented(S.controls, { label: 'level', options: [{ value: 0.1, label: '90% / α = 10%' }, { value: 0.05, label: '95% / α = 5%' }, { value: 0.01, label: '99% / α = 1%' }], value: 0.05, onChange: v => { alpha = +v; draw(); } });
    UI.toggle(S.controls, { label: 'show the t test', value: false, onChange: v => { showT = v; bot.style.display = v ? '' : 'none'; draw(); } });
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
        (showT ? `\\(t = (${E.fmt(b, 3)} - ${E.fmt(a, 3)})/${E.fmt(se, 4)} = ${E.fmt(t, 2)}\\), \\(c = ${E.fmt(c, 3)}\\)<br>` : '') +
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
