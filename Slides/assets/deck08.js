/* Widgets for Deck 08 — Further topics: scaling, quadratics, interactions,
   adjusted R-squared and prediction */
(function () {
  const { E, UI } = window; const C = UI.C; const W = window.WDATA;

  /* ------------------------------------------------------------------
     Data scaling: what changes and what does not
     ------------------------------------------------------------------ */
  UI.widget('scaling', host => {
    host.innerHTML = ''; host.classList.add('widget-live');
    const bar = UI.el('div', { class: 'fs-bar' }), body = UI.el('div', { class: 'wgrid wide' });
    const left = UI.el('div'), side = UI.el('div', { class: 'wside' }); body.append(left, side); host.append(bar, body);
    const d = E.complete(W.bwght, ['bwght', 'cigs', 'faminc']);
    let yU = 'oz', xU = 'cigs', fU = 'k';
    const b1 = UI.el('div'), b2 = UI.el('div'), b3 = UI.el('div'); bar.append(b1, b2, b3);
    UI.segmented(b1, { label: 'birth weight', options: [{ value: 'oz', label: 'ounces' }, { value: 'g', label: 'grams' }], value: yU, onChange: v => { yU = v; draw(); } });
    UI.segmented(b2, { label: 'smoking', options: [{ value: 'cigs', label: 'cigarettes/day' }, { value: 'packs', label: 'packs/day' }], value: xU, onChange: v => { xU = v; draw(); } });
    UI.segmented(b3, { label: 'income', options: [{ value: 'k', label: '$1,000s' }, { value: 'd', label: 'dollars' }], value: fU, onChange: v => { fU = v; draw(); } });
    const out = UI.readout(side);
    function draw() {
      const y = d.bwght.map(v => yU === 'g' ? v * 28.3495231 : v);
      const x1 = d.cigs.map(v => xU === 'packs' ? v / 20 : v);
      const x2 = d.faminc.map(v => fU === 'd' ? v * 1000 : v);
      const f = E.ols(y, { smoke: x1, income: x2 });
      const names = ['(Intercept)', xU === 'packs' ? 'packs' : 'cigs', fU === 'd' ? 'famincdollars' : 'faminc'];
      left.innerHTML = `<div class="mono small">lm(${yU === 'g' ? 'bwghtgrams' : 'bwght'} ~ ${names[1]} + ${names[2]}, data = bwght)</div>` +
        UI.regTable(f, { names, digits: 5 });
      UI.renderMath(left);
      out.innerHTML = `<b>Changes:</b> the coefficients and their standard errors.<br>` +
        `<b>Never changes:</b> \\(t\\) (smoking: <b>${E.fmt(f.t[1], 3)}</b>), the p-values, \\(R^2 = ${E.fmt(f.R2, 5)}\\), and every conclusion.<br>` +
        `<span class="muted small">Rescaling only removes awkward zeros: 0.00263 per dollar = 2.63 per $1,000.</span>`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Quadratic models: marginal effect and turning point
     ------------------------------------------------------------------ */
  UI.widget('quadratic', host => {
    const S = UI.scaffold(host);
    const sets = {
      wage: (() => { const d = W.wage1, f = E.ols(d.wage, { exper: d.exper, expersq: d.exper.map(v => v * v) }); return { f, x: d.exper, y: d.wage, xn: 'exper', yn: 'wage', xlim: [0, 52], ylim: [0, 26], unit: 'dollars per hour', log: false }; })(),
      house: (() => {
        const d = W.hprice2, ln = Math.log;
        const f = E.ols(d.price.map(ln), { lnox: d.nox.map(ln), ldist: d.dist.map(ln), rooms: d.rooms, roomssq: d.rooms.map(v => v * v), stratio: d.stratio });
        return { f, x: d.rooms, y: null, xn: 'rooms', yn: 'log(price)', xlim: [3.5, 8.8], ylim: [9.5, 11.5], unit: 'log points', log: true, idx: [3, 4] };
      })()
    };
    let key = 'wage', x0 = 10;
    const seg = UI.el('div'); S.controls.appendChild(seg);
    UI.segmented(seg, { label: 'Example', options: [{ value: 'wage', label: 'wage & experience' }, { value: 'house', label: 'house price & rooms' }], value: key, onChange: v => { key = v; const D = sets[key]; sl.input.min = D.xlim[0]; sl.input.max = D.xlim[1]; x0 = key === 'wage' ? 10 : 5; sl.set(x0); draw(); } });
    const sl = UI.slider(S.controls, { label: 'evaluate at', min: 0, max: 52, step: 0.5, value: x0, fmt: v => v, onInput: v => { x0 = v; draw(); } });
    UI.toggle(S.controls, { label: 'compare with the <b>linear</b> model', value: false, onChange: v => { lin = v; draw(); } });
    let lin = false;
    const out = UI.readout(S.out);
    function draw() {
      const D = sets[key], f = D.f;
      const i1 = key === 'wage' ? 1 : 3, i2 = key === 'wage' ? 2 : 4;
      const b1 = f.coef[i1], b2 = f.coef[i2];
      const other = key === 'wage' ? f.coef[0] : f.coef[0] + f.coef[1] * Math.log(5.55) + f.coef[2] * Math.log(3.8) + f.coef[5] * 18.5;
      const g = v => other + b1 * v + b2 * v * v, slope = v => b1 + 2 * b2 * v, tp = -b1 / (2 * b2);
      S.plotHost.innerHTML = '';
      const P = new UI.Plot(S.plotHost, { w: 640, h: 320, xlim: D.xlim, ylim: D.ylim, xlab: D.xn, ylab: D.yn });
      if (key === 'wage') P.points(D.x, D.y, { r: 2.6, fill: 'rgba(31,95,168,.25)', stroke: 'none' });
      P.fn(g, { color: C.orange, width: 3.5 });
      if (lin) { const fl = key === 'wage' ? E.slr(D.x, D.y) : null; if (fl) P.fn(v => fl.b0 + fl.b1 * v, { color: C.muted, width: 2.5, dash: '7 5' }); }
      // tangent line at x0
      const s0 = slope(x0), y0 = g(x0), w = (D.xlim[1] - D.xlim[0]) * 0.18;
      P.line(x0 - w, y0 - s0 * w, x0 + w, y0 + s0 * w, { color: C.green, width: 3 });
      P.points([x0], [y0], { r: 6, fill: C.green, stroke: '#fff', sw: 2 });
      if (tp > D.xlim[0] && tp < D.xlim[1]) { P.vline(tp, { color: C.red, width: 2, dash: '5 4' }); P.text(tp, D.ylim[1] - (D.ylim[1] - D.ylim[0]) * 0.06, ` turning point ${E.fmt(tp, 1)}`, { color: C.red, weight: 700, anchor: tp > D.xlim[1] * 0.7 ? 'end' : 'start' }); }
      out.innerHTML = `\\(\\widehat{${key === 'wage' ? 'wage' : '\\log(price)'}} = \\dots ${b1 < 0 ? '-' : '+'} ${E.fmt(Math.abs(b1), 4)}\\,${D.xn} ${b2 < 0 ? '-' : '+'} ${E.fmt(Math.abs(b2), 5)}\\,${D.xn}^2\\)<br><br>` +
        `<b>Effect at ${D.xn} = ${E.fmt(x0, 1)}:</b> \\(\\hat\\beta_1 + 2\\hat\\beta_2 x = \\) <span class="big">${E.fmt(s0, 4)}</span> ${key === 'wage' ? D.unit : '(≈ ' + E.fmt(100 * s0, 1) + '% per room)'}<br>` +
        `<b>Turning point</b> \\(= |\\hat\\beta_1/(2\\hat\\beta_2)| = ${E.fmt(Math.abs(tp), 2)}\\)<br>` +
        (key === 'wage' ? `<span class="muted small">Green: the tangent. Beyond ${E.fmt(tp, 0)} years the estimated effect turns negative; ${E.fmt(100 * D.x.filter(v => v > tp).length / D.x.length, 0)}% of the sample lies there.</span>`
          : `<span class="muted small">Green: the tangent. U-shaped: the effect is negative below ${E.fmt(tp, 1)} rooms, but almost no community is there.</span>`);
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Interaction terms: the partial effect depends on another variable
     ------------------------------------------------------------------ */
  UI.widget('interaction', host => {
    const S = UI.scaffold(host);
    const d = W.attend;
    const f = E.ols(d.stndfnl, {
      atndrte: d.atndrte, priGPA: d.priGPA, ACT: d.ACT,
      priGPAsq: d.priGPA.map(v => v * v), ACTsq: d.ACT.map(v => v * v),
      inter: d.priGPA.map((v, i) => v * d.atndrte[i])
    });
    const iA = 1, iI = 6, mean = E.mean(d.priGPA);
    let g0 = mean;
    const P = new UI.Plot(S.plotHost, { w: 640, h: 360, xlim: [0.85, 4], ylim: [-0.02, 0.035], xlab: 'priGPA', ylab: 'partial effect of atndrte' });
    UI.slider(S.controls, { label: 'priGPA', min: 0.9, max: 3.95, step: 0.01, value: g0, fmt: v => v.toFixed(2), onInput: v => { g0 = v; draw(); } });
    const row = UI.el('div', { class: 'row' }); S.controls.appendChild(row);
    UI.button(row, `set priGPA to the mean (${E.fmt(mean, 2)})`, () => { g0 = mean; sl0(); draw(); }, 'small ghost');
    const sl0 = () => { host.querySelector('input[type=range]').value = g0; host.querySelector('.ctrl-val').textContent = g0.toFixed(2); };
    const out = UI.readout(S.out);
    function draw() {
      const b1 = f.coef[iA], b6 = f.coef[iI];
      const eff = v => b1 + b6 * v;
      // se of the partial effect: Var(b1) + g^2 Var(b6) + 2 g Cov
      const se = v => Math.sqrt(f.vcov[iA][iA] + v * v * f.vcov[iI][iI] + 2 * v * f.vcov[iA][iI]);
      const c = E.qt(0.975, f.df), xs = E.range(0.9, 3.95, 80);
      P.clear();
      P.path(xs, xs.map(v => eff(v) + c * se(v)), { color: C.blue, width: 1.6, dash: '5 4' });
      P.path(xs, xs.map(v => eff(v) - c * se(v)), { color: C.blue, width: 1.6, dash: '5 4' });
      P.hline(0, { color: C.ink, width: 1.4, dash: '4 4' });
      P.fn(eff, { color: C.orange, width: 3.5, from: 0.9, to: 3.95 });
      P.vline(g0, { color: C.green, width: 2.5 });
      P.points([g0], [eff(g0)], { r: 6, fill: C.green, stroke: '#fff', sw: 2 });
      const t = eff(g0) / se(g0), p = 2 * (1 - E.pt(Math.abs(t), f.df));
      out.innerHTML = `\\(\\dfrac{\\partial\\, stndfnl}{\\partial\\, atndrte} = \\hat\\beta_{atndrte} + \\hat\\beta_{inter}\\cdot priGPA\\)<br>` +
        `\\(= ${E.fmt(b1, 4)} + ${E.fmt(b6, 4)}\\times ${E.fmt(g0, 2)} =\\) <span class="big">${E.fmt(eff(g0), 4)}</span><br>` +
        `se = ${E.fmt(se(g0), 4)}, \\(t = ${E.fmt(t, 2)}\\), p = ${E.fmtP(p)}<br>` +
        (p < 0.05 ? `<span class="good">Significant at 5%</span>` : `<span class="bad">Not significant at 5%</span>`) + `<br><br>` +
        `<span class="muted small">A 10 percentage point higher attendance rate changes the final score by about <b>${E.fmt(10 * eff(g0), 3)}</b> standard deviations at this priGPA. The coefficient on atndrte alone (${E.fmt(b1, 4)}) is the effect at priGPA = 0, which does not exist in the data: that is why it looks insignificant.</span>`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     R² vs adjusted R²: add junk regressors
     ------------------------------------------------------------------ */
  UI.widget('adjr2', host => {
    const S = UI.scaffold(host, { layout: 'stack' });
    const d = E.complete(W.gpa2, ['colgpa', 'sat', 'hsperc']);
    const n = d.colgpa.length, r = E.RNG(17);
    let junk = [];
    const rows = UI.el('div'); S.plotHost.appendChild(rows);
    const row = UI.el('div', { class: 'row' }); S.controls.appendChild(row);
    UI.button(row, '+ add a random variable', () => { junk.push(r.vec(n, () => r.norm())); draw(); }, 'small');
    UI.button(row, '+ add 5', () => { for (let i = 0; i < 5; i++) junk.push(r.vec(n, () => r.norm())); draw(); }, 'small ghost');
    UI.button(row, 'Reset', () => { junk = []; draw(); }, 'small ghost');
    const out = UI.readout(S.out);
    const base = E.ols(d.colgpa, { sat: d.sat, hsperc: d.hsperc });   // model without noise
    function draw() {
      const X = { sat: d.sat, hsperc: d.hsperc };
      junk.forEach((v, i) => X['noise' + (i + 1)] = v);
      const f = E.ols(d.colgpa, X);
      rows.innerHTML = `<div class="mono small">lm(colgpa ~ sat + hsperc${junk.map((_, i) => ' + noise' + (i + 1)).join('')}, data = gpa2)</div>` +
        `<div class="meter" style="height:1.5em"><div style="width:${100 * f.R2}%;background:${C.blue}"></div><div style="width:${100 * (1 - f.R2)}%;background:#eef1f5"></div></div>`;
      out.innerHTML = `Pure noise variables added: <b>${junk.length}</b><br>` +
        `\\(R^2 = \\) <span class="big">${E.fmt(f.R2, 5)}</span><br>\\(\\bar R^2 = \\) <span class="big">${E.fmt(f.adjR2, 5)}</span><br>` +
        (junk.length
          ? `Without the noise variables: \\(R^2 = ${E.fmt(base.R2, 5)}\\), \\(\\bar R^2 = ${E.fmt(base.adjR2, 5)}\\)<br>` +
          (f.R2 > base.R2 ? `<span class="bad">R² rose by ${E.fmt(f.R2 - base.R2, 5)}</span> — it always does. ` : '') +
          (f.adjR2 < base.adjR2 ? `<span class="good">The adjusted R² fell by ${E.fmt(base.adjR2 - f.adjR2, 5)}.</span>` : `<span class="or">This time the adjusted R² also rose: by chance some noise variable got \\(|t| > 1\\).</span>`)
          : `<span class="muted">Start adding variables that are pure noise by construction.</span>`) +
        `<br><span class="muted small">\\(\\bar R^2 = 1 - \\dfrac{SSR/(n-k-1)}{SST/(n-1)}\\) rises if and only if the new variable has \\(|t| > 1\\). It is not a license to add variables: theory should decide.</span>`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Prediction: confidence interval for E(y|x) vs prediction interval
     ------------------------------------------------------------------ */
  UI.widget('prediction', host => {
    const S = UI.scaffold(host);
    const d = E.complete(W.gpa2, ['colgpa', 'sat', 'hsperc', 'hsize']);
    const f = E.ols(d.colgpa, { sat: d.sat, hsperc: d.hsperc, hsize: d.hsize, hsizesq: d.hsize.map(v => v * v) });
    let sat = 1200, hsperc = 30, hsize = 5;
    const P = new UI.Plot(S.plotHost, { w: 640, h: 360, xlim: [700, 1500], ylim: [0.8, 4.2], xlab: 'SAT score', ylab: 'college GPA' });
    UI.slider(S.controls, { label: 'sat', min: 700, max: 1500, step: 10, value: sat, fmt: v => v, onInput: v => { sat = v; draw(); } });
    UI.slider(S.controls, { label: 'hsperc', min: 1, max: 90, step: 1, value: hsperc, fmt: v => v, onInput: v => { hsperc = v; draw(); } });
    UI.slider(S.controls, { label: 'hsize (100s)', min: 1, max: 20, step: 0.5, value: hsize, fmt: v => v, onInput: v => { hsize = v; draw(); } });
    const out = UI.readout(S.out);
    const xv = s => [1, s, hsperc, hsize, hsize * hsize];
    function se_fit(s) { const x = xv(s); let q = 0; for (let a = 0; a < x.length; a++) for (let b = 0; b < x.length; b++) q += x[a] * f.vcov[a][b] * x[b]; return Math.sqrt(q); }
    function draw() {
      const yhat = s => { const x = xv(s); return x.reduce((acc, v, j) => acc + v * f.coef[j], 0); };
      const c = E.qt(0.975, f.df), xs = E.range(700, 1500, 60);
      P.clear();
      P.path(xs, xs.map(s => yhat(s) + c * Math.sqrt(se_fit(s) ** 2 + f.sigma ** 2)), { color: C.purple, width: 2, dash: '6 5' });
      P.path(xs, xs.map(s => yhat(s) - c * Math.sqrt(se_fit(s) ** 2 + f.sigma ** 2)), { color: C.purple, width: 2, dash: '6 5' });
      P.path(xs, xs.map(s => yhat(s) + c * se_fit(s)), { color: C.blue, width: 2 });
      P.path(xs, xs.map(s => yhat(s) - c * se_fit(s)), { color: C.blue, width: 2 });
      P.fn(yhat, { color: C.orange, width: 3.2 });
      P.points([sat], [yhat(sat)], { r: 6, fill: C.orange, stroke: '#fff', sw: 2 });
      const se0 = se_fit(sat), y0 = yhat(sat), sePred = Math.sqrt(se0 * se0 + f.sigma * f.sigma);
      out.innerHTML = `Predicted <b>average</b> GPA for sat = ${sat}, hsperc = ${hsperc}, hsize = ${hsize}:<br>\\(\\hat y = \\) <span class="big">${E.fmt(y0, 3)}</span><br><br>` +
        `<span style="color:${C.blue}"><b>95% CI for E(y|x)</b></span>: [${E.fmt(y0 - c * se0, 3)}, ${E.fmt(y0 + c * se0, 3)}] &nbsp; <span class="muted">se = ${E.fmt(se0, 4)}</span><br>` +
        `<span style="color:${C.purple}"><b>95% prediction interval</b></span> for one student: [${E.fmt(y0 - c * sePred, 3)}, ${E.fmt(y0 + c * sePred, 3)}] &nbsp; <span class="muted">se = ${E.fmt(sePred, 3)}</span><br><br>` +
        `<span class="muted small">The prediction interval is far wider because it also contains the unknown \\(u^0\\): \\(\\text{se}(\\hat e^0) = \\sqrt{\\text{se}(\\hat y^0)^2 + \\hat\\sigma^2}\\) with \\(\\hat\\sigma = ${E.fmt(f.sigma, 3)}\\). As \\(n\\) grows the blue band shrinks, the purple one does not.</span>`;
      UI.renderMath(out);
    }
    draw();
  });
})();
