/* Widgets for Deck 10 — Binary dependent variables: LPM, logit, probit */
(function () {
  const { E, UI } = window; const C = UI.C; const W = window.WDATA; const H = window.HMDA;

  /* ------------------------------------------------------------------
     Mortgage denials: LPM vs logit vs probit
     ------------------------------------------------------------------ */
  UI.widget('binary-fit', host => {
    const S = UI.scaffold(host);
    let show = { lpm: true, logit: false, probit: false }, withBlack = false, x0 = 0.3, grp = 0;
    const bar = UI.el('div', { class: 'row' }); S.controls.appendChild(bar);
    UI.toggle(bar, { label: `<b style="color:${C.orange}">LPM</b>`, value: true, onChange: v => { show.lpm = v; draw(); } });
    UI.toggle(bar, { label: `<b style="color:${C.blue}">logit</b>`, value: false, onChange: v => { show.logit = v; draw(); } });
    UI.toggle(bar, { label: `<b style="color:${C.purple}">probit</b>`, value: false, onChange: v => { show.probit = v; draw(); } });
    UI.toggle(S.controls, { label: 'add the <b>black</b> dummy to the model', value: false, onChange: v => { withBlack = v; draw(); } });
    const segB = UI.el('div'); S.controls.appendChild(segB);
    const seg = UI.segmented(segB, { label: 'curves shown for', options: [{ value: 0, label: 'white applicant' }, { value: 1, label: 'black applicant' }], value: 0, onChange: v => { grp = +v; draw(); } });
    UI.slider(S.controls, { label: 'P/I ratio', min: 0.05, max: 1.0, step: 0.01, value: x0, fmt: v => v.toFixed(2), onInput: v => { x0 = v; draw(); } });
    const out = UI.readout(S.out);
    const P = new UI.Plot(S.plotHost, { w: 640, h: 340, xlim: [0, 1.05], ylim: [-0.35, 1.35], xlab: 'P/I ratio (loan payments / income)', ylab: 'deny (0/1) and predicted probability' });
    function fits() {
      const X = withBlack ? { pirat: H.pirat, black: H.black } : { pirat: H.pirat };
      return { lpm: E.ols(H.deny, X), logit: E.glm(H.deny, X, { link: 'logit' }), probit: E.glm(H.deny, X, { link: 'probit' }) };
    }
    function draw() {
      const f = fits(), at = v => withBlack ? { pirat: v, black: grp } : { pirat: v };
      segB.style.display = withBlack ? '' : 'none';
      P.clear();
      P.hline(0, { color: '#c9d2db', width: 1.3 }); P.hline(1, { color: '#c9d2db', width: 1.3 });
      const g = UI.svg('g'); P.gData.appendChild(g);
      const r = E.RNG(4);
      H.pirat.forEach((v, i) => { if (v > 1.05) return; g.appendChild(UI.svg('circle', { cx: P.X(v), cy: P.Y(H.deny[i] + r.unif(-0.06, 0.06)), r: 2.4, fill: (withBlack && H.black[i]) ? 'rgba(217,98,43,.35)' : 'rgba(31,95,168,.3)', stroke: 'none' })); });
      const lpmP = v => f.lpm.predict(at(v));
      if (show.lpm) P.fn(lpmP, { color: C.orange, width: 3.2 });
      if (show.logit) P.fn(v => f.logit.predict(at(v)), { color: C.blue, width: 3.2 });
      if (show.probit) P.fn(v => f.probit.predict(at(v)), { color: C.purple, width: 3.2, dash: '7 5' });
      P.vline(x0, { color: C.green, width: 2, dash: '5 4' });
      const bad = f.lpm.fitted.filter(p => p < 0 || p > 1).length;
      const row = (lab, col, val) => `<tr><td class="nm" style="color:${col}"><b>${lab}</b></td><td>${E.fmt(100 * val, 1)}%</td></tr>`;
      out.innerHTML = `<b>Predicted P(deny = 1)</b> at P/I = ${x0.toFixed(2)}${withBlack ? (grp ? ', black applicant' : ', white applicant') : ''}:` +
        `<table class="regtab"><tbody>` +
        (show.lpm ? row('LPM', C.orange, lpmP(x0)) : '') +
        (show.logit ? row('logit', C.blue, f.logit.predict(at(x0))) : '') +
        (show.probit ? row('probit', C.purple, f.probit.predict(at(x0))) : '') +
        `</tbody></table>` +
        (lpmP(x0) < 0 || lpmP(x0) > 1 ? `<span class="bad">The LPM prediction is outside [0, 1]!</span><br>` : '') +
        `<span class="muted small">In the sample the LPM gives an impossible probability for <b>${bad}</b> of ${f.lpm.n} applications. Logit and probit are S-shaped, so they always stay between 0 and 1.</span>` +
        (withBlack ? `<br><span class="muted small">Gap at this P/I ratio (black − white), logit: <b>${E.fmt(100 * (f.logit.predict(withBlack ? { pirat: x0, black: 1 } : {}) - f.logit.predict({ pirat: x0, black: 0 })), 1)} pp</b>.</span>` : '');
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Two problems of the LPM: impossible predictions, heteroskedasticity
     ------------------------------------------------------------------ */
  UI.widget('lpm-issues', host => {
    const S = UI.scaffold(host);
    const m = E.complete(W.mroz, ['inlf', 'nwifeinc', 'educ', 'exper', 'age', 'kidslt6', 'kidsge6']);
    const f = E.ols(m.inlf, { nwifeinc: m.nwifeinc, educ: m.educ, exper: m.exper, expersq: m.exper.map(v => v * v), age: m.age, kidslt6: m.kidslt6, kidsge6: m.kidsge6 });
    let view = 'fitted';
    UI.segmented(S.controls, { label: 'Problem', options: [{ value: 'fitted', label: 'impossible predictions' }, { value: 'het', label: 'heteroskedasticity' }], value: view, onChange: v => { view = v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      S.plotHost.innerHTML = '';
      const below = f.fitted.filter(p => p < 0).length, above = f.fitted.filter(p => p > 1).length;
      if (view === 'fitted') {
        const h = E.hist(f.fitted, -0.4, 1.4, 60), mx = Math.max(...h.counts);
        const P = new UI.Plot(S.plotHost, { w: 640, h: 330, xlim: [-0.4, 1.4], ylim: [0, mx * 1.12], xlab: 'fitted probability from the LPM', ylab: 'frequency' });
        P.hist(h, { fill: 'rgba(31,95,168,.55)' });
        P.vline(0, { color: C.red, width: 2.5 }); P.vline(1, { color: C.red, width: 2.5 });
        out.innerHTML = `<b>${below}</b> women have a predicted probability <b>below 0</b> and <b>${above}</b> above 1 (out of ${f.n}).<br><br>` +
          `<span class="muted small">A probability cannot be negative. This is the most visible problem, but not the most serious one: the model also forces the effect of an extra child to be the same when going from 0 to 1 and from 3 to 4 children.</span>`;
      } else {
        const p = f.fitted, u2 = f.resid.map(v => v * v);
        const B = 12, lo = E.min(p), w = (E.max(p) - lo) / B;
        const mids = [], vars = [];
        for (let b = 0; b < B; b++) {
          const idx = p.map((v, i) => ({ v, i })).filter(o => o.v >= lo + b * w && o.v < lo + (b + 1) * w).map(o => o.i);
          if (idx.length > 8) { mids.push(lo + (b + 0.5) * w); vars.push(E.mean(idx.map(i => u2[i]))); }
        }
        const P = new UI.Plot(S.plotHost, { w: 640, h: 330, xlim: [-0.1, 1.1], ylim: [0, 0.34], xlab: 'fitted probability p̂(x)', ylab: 'variance of the residuals' });
        P.fn(v => v * (1 - v), { color: C.orange, width: 3, from: 0, to: 1 });
        P.points(mids, vars, { r: 6, fill: C.blue, stroke: '#fff', sw: 2 });
        out.innerHTML = `Because \\(y\\) is 0/1, its variance is determined by its mean:<br>\\(\\text{Var}(u\\mid x) = p(x)\\,[1 - p(x)]\\)<br><br>` +
          `<span style="color:${C.orange}"><b>Orange</b></span>: that formula. <span style="color:${C.blue}"><b>Blue dots</b></span>: the average squared residual in each range of \\(\\hat p\\).<br><br>` +
          `<span class="muted small">The variance is largest at \\(\\hat p = 0.5\\) and shrinks to 0 at the ends: the LPM is <b>always heteroskedastic</b>, so MLR.5 fails. OLS stays unbiased and consistent, but you must use <b>robust standard errors</b>.</span>`;
      }
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     The logit curve: parameters and marginal effects
     ------------------------------------------------------------------ */
  UI.widget('logit-curve', host => {
    const S = UI.scaffold(host);
    let b0 = -4, b1 = 5.4, x0 = 0.4;
    UI.slider(S.controls, { label: '\\(\\beta_0\\)', min: -8, max: 4, step: 0.1, value: b0, fmt: v => v.toFixed(1), onInput: v => { b0 = v; draw(); } });
    UI.slider(S.controls, { label: '\\(\\beta_1\\)', min: -2, max: 12, step: 0.1, value: b1, fmt: v => v.toFixed(1), onInput: v => { b1 = v; draw(); } });
    UI.slider(S.controls, { label: 'evaluate at x', min: 0, max: 1.4, step: 0.01, value: x0, fmt: v => v.toFixed(2), onInput: v => { x0 = v; draw(); } });
    const out = UI.readout(S.out);
    const P = new UI.Plot(S.plotHost, { w: 640, h: 330, xlim: [0, 1.4], ylim: [-0.05, 1.05], xlab: 'x', ylab: 'P(y = 1 | x)' });
    function draw() {
      const g = v => E.plogis(b0 + b1 * v), me = v => E.dlogis(b0 + b1 * v) * b1;
      P.clear();
      P.hline(0, { color: '#c9d2db', width: 1.2 }); P.hline(1, { color: '#c9d2db', width: 1.2 }); P.hline(0.5, { color: '#e7ebf0', width: 1.2, dash: '4 4' });
      P.fn(g, { color: C.blue, width: 3.4, n: 250 });
      const y0 = g(x0), s = me(x0), w = 0.18;
      P.line(x0 - w, y0 - s * w, x0 + w, y0 + s * w, { color: C.green, width: 3 });
      P.points([x0], [y0], { r: 6, fill: C.green, stroke: '#fff', sw: 2 });
      const half = -b0 / b1;
      if (half > 0 && half < 1.4) { P.vline(half, { color: C.muted, width: 1.5, dash: '5 4' }); P.text(half, 1.0, ` p = 0.5`, { color: C.muted }); }
      out.innerHTML = `\\(P(y=1\\mid x) = \\dfrac{1}{1 + e^{-(${E.fmt(b0, 1)} + ${E.fmt(b1, 1)}x)}}\\)<br><br>` +
        `At \\(x = ${x0.toFixed(2)}\\): probability <b>${E.fmt(100 * y0, 1)}%</b><br>` +
        `marginal effect \\(= \\lambda(\\beta_0+\\beta_1x)\\,\\beta_1 = \\) <span class="big">${E.fmt(s, 3)}</span> per unit of x<br>` +
        `<span class="muted small">Green line: the slope of the curve at that point. It is <b>largest where p = 0.5</b> and tends to 0 at both ends, so the coefficient \\(\\beta_1 = ${E.fmt(b1, 1)}\\) is <b>not</b> a marginal effect. Only its <b>sign</b> can be read directly.</span>`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     What maximum likelihood maximizes (logit, deny on pirat)
     ------------------------------------------------------------------ */
  UI.widget('ml-explorer', host => {
    const S = UI.scaffold(host);
    const y = H.deny, x = H.pirat, n = y.length;
    const mle = E.glm(y, { pirat: x }, { link: 'logit' });
    const B0 = mle.coef[0], B1 = mle.coef[1];
    const L = (b0, b1) => {
      let s = 0;
      for (let i = 0; i < n; i++) { const p = 1 / (1 + Math.exp(-(b0 + b1 * x[i]))); s += y[i] ? Math.log(Math.max(p, 1e-12)) : Math.log(Math.max(1 - p, 1e-12)); }
      return s;
    };
    const Lmax = L(B0, B1);
    // one denied and one approved application, to show what a single term contributes
    let iD = 0, iA = 0;
    for (let i = 0; i < n; i++) { if (y[i] === 1 && x[i] > 0.5 && x[i] < 0.6) { iD = i; break; } }
    for (let i = 0; i < n; i++) { if (y[i] === 0 && x[i] > 0.28 && x[i] < 0.32) { iA = i; break; } }
    let b0 = -2, b1 = 2;
    const top = UI.el('div'), bot = UI.el('div'); S.plotHost.append(top, bot);
    const s0 = UI.slider(S.controls, { label: '\\(\\beta_0\\)', min: -8, max: 0, step: 0.05, value: b0, fmt: v => v.toFixed(2), onInput: v => { b0 = v; draw(); } });
    const s1 = UI.slider(S.controls, { label: '\\(\\beta_1\\)', min: 0, max: 12, step: 0.05, value: b1, fmt: v => v.toFixed(2), onInput: v => { b1 = v; draw(); } });
    UI.button(S.controls, 'jump to the MLE', () => {
      b0 = Math.round(B0 * 20) / 20; b1 = Math.round(B1 * 20) / 20;
      s0.set && s0.set(b0); s1.set && s1.set(b1); draw();
    }, 'small');
    const out = UI.readout(S.out);
    const P = new UI.Plot(top, { w: 640, h: 182, xlim: [0, 1.05], ylim: [-0.25, 1.25], xlab: 'P/I ratio', ylab: 'deny (0/1)', margin: { t: 8, b: 44 } });
    const Q = new UI.Plot(bot, { w: 640, h: 128, xlim: [0, 12], ylim: [Lmax - 260, Lmax + 25], xlab: '\\(\\beta_1\\)', ylab: '\\(\\log L\\)', margin: { t: 8, b: 48 } });
    const r = E.RNG(4);
    const jit = x.map(() => r.unif(-0.055, 0.055));
    function draw() {
      const p = v => 1 / (1 + Math.exp(-(b0 + b1 * v))), cur = L(b0, b1);
      P.clear();
      P.hline(0, { color: '#c9d2db', width: 1.2 }); P.hline(1, { color: '#c9d2db', width: 1.2 });
      const g = UI.svg('g'); P.gData.appendChild(g);
      x.forEach((v, i) => { if (v > 1.05) return; g.appendChild(UI.svg('circle', { cx: P.X(v), cy: P.Y(y[i] + jit[i]), r: 2.2, fill: 'rgba(31,95,168,.25)', stroke: 'none' })); });
      P.fn(v => 1 / (1 + Math.exp(-(B0 + B1 * v))), { color: C.muted, width: 2, dash: '6 5' });
      P.fn(p, { color: C.orange, width: 3.2 });
      [[iD, C.red], [iA, C.green]].forEach(([i, col]) => {
        P.points([x[i]], [y[i]], { r: 6, fill: col, stroke: '#fff', sw: 1.5 });
        P.line(x[i], y[i], x[i], p(x[i]), { color: col, width: 1.6, dash: '3 3' });
      });
      Q.clear();
      // clamp: values far below the axis would draw a path thousands of pixels tall
      Q.fn(v => { const l = L(b0, v); return l < Lmax - 255 ? null : l; }, { color: C.ink, width: 2.5, from: 0.05, to: 12, n: 90 });
      Q.vline(b1, { color: C.orange, width: 3 });
      Q.hline(Lmax, { color: C.muted, width: 1.2, dash: '4 4' });
      const pD = p(x[iD]), pA = p(x[iA]);
      out.innerHTML =
        `\\(\\log L = \\) <span class="big">${E.fmt(cur, 1)}</span> &nbsp;<span class="muted small">at \\(\\beta_0 = ${E.fmt(b0, 2)},\\ \\beta_1 = ${E.fmt(b1, 2)}\\)</span><br>` +
        `<span class="muted small">best possible: ${E.fmt(Lmax, 1)} at \\(\\hat\\beta_0 = ${E.fmt(B0, 2)},\\ \\hat\\beta_1 = ${E.fmt(B1, 2)}\\)</span><br><br>` +
        `<span style="color:${C.red}">■</span> <b>denied</b>, P/I = ${E.fmt(x[iD], 2)}: \\(\\hat p = ${E.fmt(pD, 3)}\\), adds \\(\\log\\hat p = ${E.fmt(Math.log(pD), 2)}\\)<br>` +
        `<span style="color:${C.green}">■</span> <b>approved</b>, P/I = ${E.fmt(x[iA], 2)}: adds \\(\\log(1-\\hat p) = ${E.fmt(Math.log(1 - pA), 2)}\\)<br><br>` +
        (Math.abs(cur - Lmax) < 0.5
          ? `<span class="good">This is the maximum.</span> Any other pair makes the 2,380 observed decisions <b>less</b> likely.`
          : `<span class="muted small">The lower panel is \\(\\log L\\) against \\(\\beta_1\\) with \\(\\beta_0\\) fixed. Climb the hill.</span>`);
      UI.renderMath(out);
    }
    draw();
  });
})();
