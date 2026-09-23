/* =====================================================================
   widgets-shared.js — widgets reused in several decks
   ===================================================================== */
(function () {
  const { E, UI } = window; const C = UI.C; const ln = Math.log;

  /* ------------------------------------------------------------------
     Functional-form simulator ("which model generated the data?")

     <div class="widget" data-widget="form-sim" data-models="ll,gl,lg,gg"></div>
     data-models: any of ll, gl, lg, gg, quad (default: ll,gl,lg,gg)

     The data come from a known DGP. Students fit any of the candidate
     models and judge the fit from (i) the scatter in transformed units and
     (ii) the residual plot, whose binned means reveal a systematic pattern
     when the functional form is wrong. "Mystery mode" hides the DGP.
     ------------------------------------------------------------------ */
  const MODELS = {
    ll: { label: 'level-level', ly: false, lx: false, b0: 5, b1: 0.8, sig: 1.2, tex: 'y = 5 + 0.8\\,x + u', form: (a, b) => `\\hat y = ${a} + ${b}\\,x` },
    gl: { label: 'log-level', ly: true, lx: false, b0: 0.3, b1: 0.12, sig: 0.25, tex: '\\log(y) = 0.3 + 0.12\\,x + u', form: (a, b) => `\\widehat{\\log(y)} = ${a} + ${b}\\,x` },
    lg: { label: 'level-log', ly: false, lx: true, b0: 1, b1: 3, sig: 0.8, tex: 'y = 1 + 3\\log(x) + u', form: (a, b) => `\\hat y = ${a} + ${b}\\log(x)` },
    gg: { label: 'log-log', ly: true, lx: true, b0: 0.5, b1: 0.4, sig: 0.15, tex: '\\log(y) = 0.5 + 0.4\\log(x) + u', form: (a, b) => `\\widehat{\\log(y)} = ${a} + ${b}\\log(x)` },
    quad: { label: 'quadratic', ly: false, lx: false, quad: true, b0: 1, b1: 1.4, b2: -0.06, sig: 1.4, tex: 'y = 1 + 1.4\\,x - 0.06\\,x^2 + u', form: (a, b, c) => `\\hat y = ${a} + ${b}\\,x ${c}\\,x^2` }
  };
  const XMIN = 0.3, XMAX = 20;

  UI.widget('form-sim', host => {
    const keys = (host.dataset.models || 'll,gl,lg,gg').split(',').map(s => s.trim()).filter(k => MODELS[k]);
    // layout: two control bars on top, then [plots | readout]
    host.innerHTML = ''; host.classList.add('widget-live');
    const bar1 = UI.el('div', { class: 'fs-bar' }), bar2 = UI.el('div', { class: 'fs-bar' });
    const grid = UI.el('div', { class: 'wgrid wide' }), plots = UI.el('div', { class: 'wplot' }), side = UI.el('div', { class: 'wside' });
    grid.append(plots, side); host.append(bar1, bar2, grid);
    const S = { controls: bar2, out: side };
    const top = UI.el('div'), bot = UI.el('div'); plots.append(top, bot);
    let truth = keys[1] || keys[0], fit = keys[0], view = 'trans', noise = 1, n = 250, seed = 1, mystery = false, revealed = false, guesses = 0;
    const r0 = E.RNG(99);

    const bT = UI.el('div'), bF = UI.el('div'), bV = UI.el('div'); bar1.append(bT, bF); bar2.append(bV);
    const segT = UI.segmented(bT, { label: 'True model', options: keys.map(k => ({ value: k, label: MODELS[k].label })), value: truth, onChange: v => { truth = v; seed++; draw(); } });
    UI.segmented(bF, { label: 'You estimate', options: keys.map(k => ({ value: k, label: MODELS[k].label })), value: fit, onChange: v => { fit = v; if (mystery && !revealed) guesses++; draw(); } });
    const segV = UI.segmented(bV, { label: 'Plot in', options: [{ value: 'trans', label: 'model units' }, { value: 'orig', label: 'original units' }], value: view, onChange: v => { view = v; draw(); } });
    UI.slider(S.controls, { label: 'noise', min: 0.2, max: 2, step: 0.1, value: noise, fmt: v => '×' + v.toFixed(1), onInput: v => { noise = v; draw(); } });
    const row = UI.el('div', { class: 'row' }); S.controls.appendChild(row);
    UI.button(row, '↻ New sample', () => { seed++; draw(); }, 'small ghost');
    const mbtn = UI.button(row, '🕵 Mystery mode', () => {
      mystery = !mystery; revealed = false; guesses = 0; mbtn.classList.toggle('on', mystery);
      if (mystery) { truth = keys[Math.floor(r0.unif() * keys.length)]; seed++; }
      bT.style.display = mystery ? 'none' : ''; rbtn.style.display = mystery ? '' : 'none'; draw();
    }, 'small ghost');
    const rbtn = UI.button(row, 'Reveal the true model', () => { revealed = true; draw(); }, 'small orange'); rbtn.style.display = 'none';
    const out = UI.readout(S.out);

    function simulate() {
      const r = E.RNG(1000 + seed), M = MODELS[truth];
      const x = r.vec(n, () => r.unif(XMIN, XMAX));
      const y = x.map(v => {
        const xx = M.lx ? ln(v) : v; let m = M.b0 + M.b1 * xx + (M.quad ? M.b2 * v * v : 0);
        m += noise * M.sig * r.norm();
        return M.ly ? Math.exp(m) : m;
      });
      return { x, y };
    }
    /* share of residual variation explained by bin means (0 = no pattern) */
    function patternScore(x, res) {
      const B = 8, lo = E.min(x), w = (E.max(x) - lo) / B + 1e-9, sums = new Array(B).fill(0), cnt = new Array(B).fill(0);
      x.forEach((v, i) => { const b = Math.min(B - 1, Math.floor((v - lo) / w)); sums[b] += res[i]; cnt[b]++; });
      const means = sums.map((s, b) => cnt[b] ? s / cnt[b] : 0), tot = E.sum(res.map(v => v * v));
      const between = E.sum(means.map((m, b) => cnt[b] * m * m));
      // F test: do the bin means of the residuals differ from zero? (residuals on bin dummies)
      const k = cnt.filter(c => c > 0).length, F = (between / (k - 1)) / ((tot - between) / (x.length - k));
      return { p: 1 - E.pf(F, k - 1, x.length - k), mids: means.map((_, b) => lo + (b + 0.5) * w), means, cnt };
    }
    function draw() {
      const { x, y } = simulate(), F = MODELS[fit];
      // log of y needs y > 0
      const keep = y.map(v => !F.ly || v > 0), X0 = x.filter((_, i) => keep[i]), Y0 = y.filter((_, i) => keep[i]), dropped = n - X0.length;
      const tx = v => F.lx ? ln(v) : v, ty = v => F.ly ? ln(v) : v;
      const regs = F.quad ? { x: X0, x2: X0.map(v => v * v) } : { x: X0.map(tx) };
      const res = E.ols(Y0.map(ty), regs);
      const pred = v => res.coef[0] + res.coef[1] * tx(v) + (F.quad ? res.coef[2] * v * v : 0);
      const trans = view === 'trans' && !F.quad;
      // ---- main scatter
      top.innerHTML = '';
      const PX = trans ? X0.map(tx) : X0, PY = trans ? Y0.map(ty) : Y0;
      const pad = (a, b) => [a - 0.04 * (b - a), b + 0.06 * (b - a)];
      const P = new UI.Plot(top, { w: 640, h: 192, xlim: pad(E.min(PX), E.max(PX)), ylim: pad(E.min(PY), E.quantile(PY, 0.99)), xlab: trans && F.lx ? 'log(x)' : 'x', ylab: trans && F.ly ? 'log(y)' : 'y', margin: { b: 42 } });
      P.points(PX, PY, { r: 3, fill: 'rgba(31,95,168,.35)', stroke: 'none' });
      if (trans) P.fn(v => res.coef[0] + res.coef[1] * v, { color: C.orange, width: 3.5 });
      else P.fn(v => { const m = pred(v); return F.ly ? Math.exp(m) : m; }, { color: C.orange, width: 3.5, from: XMIN, to: XMAX });
      // ---- residual plot with bin means
      bot.innerHTML = '';
      // clip the axis at the 97th percentile of |residual| so a few outliers do not flatten the pattern
      const pat = patternScore(X0, res.resid), rmax = E.quantile(res.resid.map(Math.abs), 0.97) * 1.15;
      const R = new UI.Plot(bot, { w: 640, h: 118, xlim: [0, XMAX + 0.5], ylim: [-rmax, rmax], xlab: 'x', ylab: 'residual', margin: { t: 6, b: 40 } });
      R.hline(0, { color: C.ink, width: 1.2, dash: '4 4' });
      R.points(X0, res.resid, { r: 2.4, fill: 'rgba(31,95,168,.3)', stroke: 'none' });
      const mm = pat.mids.filter((_, b) => pat.cnt[b]), mv = pat.means.filter((_, b) => pat.cnt[b]);
      R.path(mm, mv, { color: C.red, width: 3 }); R.points(mm, mv, { r: 5, fill: C.red, stroke: '#fff', sw: 1.5 });
      // ---- readout
      const bad = pat.p < 0.01, T = MODELS[truth], f3 = v => E.fmt(v, 3);
      const eq = F.quad ? F.form(f3(res.coef[0]), f3(res.coef[1]), (res.coef[2] < 0 ? '- ' : '+ ') + E.fmt(Math.abs(res.coef[2]), 4)) : F.form(f3(res.coef[0]), f3(res.coef[1]));
      const hidden = mystery && !revealed;
      let h = (hidden ? `<b>True model:</b> <span class="or">hidden</span>. Which one generated the data?<br>` : `<b>True model:</b> \\(${T.tex}\\)<br>`) +
        `<b>Estimated:</b> \\(${eq}\\)<br>` +
        (dropped ? `<span class="bad">${dropped} observations with y ≤ 0 dropped (log undefined).</span><br>` : '') +
        (bad ? `<span class="bad">✗ Residuals show a systematic pattern</span> (red line). The functional form looks <b>wrong</b>.`
          : `<span class="good">✓ No systematic pattern in the residuals.</span> The functional form looks <b>adequate</b>.`);
      if (!hidden && fit === truth) h += `<br>\\(\\hat\\beta_1 = ${f3(res.coef[1])}\\) vs. true \\(\\beta_1 = ${T.b1}\\)` + (T.quad ? `, \\(\\hat\\beta_2 = ${E.fmt(res.coef[2], 4)}\\) vs. ${T.b2}` : '');
      if (mystery && revealed) h += `<br>${fit === truth ? '<span class="good">🎯 Your model matches the DGP!</span>' : `<span class="bad">The DGP was ${T.label}.</span>`} Models tried: ${Math.max(1, guesses)}.`;
      h += `<br><span class="muted small">Red dots: average residual in each range of x. With the correct form they hover around 0.${F.quad ? '' : ' A straight cloud in the transformed units is another sign of the right form.'}</span>`;
      out.innerHTML = h; UI.renderMath(out);
      segV.el.style.opacity = F.quad ? 0.4 : 1;
    }
    draw();
  });
})();
