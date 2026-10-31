/* Widgets for Deck 06 — Multiple Regression III: F and LM tests */
(function () {
  const { E, UI } = window; const C = UI.C; const W = window.WDATA; const ln = Math.log;

  /* ---------- data prepared once ---------- */
  const bw = E.complete(W.bwght, ['bwght', 'cigs', 'parity', 'faminc', 'motheduc', 'fatheduc']);
  const hp = (() => { const d = W.hprice1; return { lprice: d.price.map(ln), lassess: d.assess.map(ln), llotsize: d.lotsize.map(ln), lsqrft: d.sqrft.map(ln), bdrms: d.bdrms }; })();

  const EXAMPLES = {
    parents: () => {
      const ur = E.ols(bw.bwght, { cigs: bw.cigs, parity: bw.parity, faminc: bw.faminc, motheduc: bw.motheduc, fatheduc: bw.fatheduc });
      const r = E.ols(bw.bwght, { cigs: bw.cigs, parity: bw.parity, faminc: bw.faminc });
      return { ur, r, q: 2, h0: 'H_0: \\beta_{motheduc} = 0,\\; \\beta_{fatheduc} = 0', h1: 'H_1: \\beta_{motheduc} \\neq 0 \\text{ or } \\beta_{fatheduc} \\neq 0', title: 'bwght: parents\' education', note: 'Restricted model: drop motheduc and fatheduc (same 1,191 observations!).' };
    },
    overall: () => {
      const ur = E.ols(bw.bwght, { cigs: bw.cigs, parity: bw.parity, faminc: bw.faminc, motheduc: bw.motheduc, fatheduc: bw.fatheduc });
      const r = E.ols(bw.bwght, {});
      return { ur, r, q: 5, h0: 'H_0: \\beta_1 = \\dots = \\beta_5 = 0', h1: 'H_1: \\beta_j \\neq 0 \\text{ for at least one } j', title: 'bwght: overall significance', note: 'Restricted model: intercept only, so SSR_r = SST.' };
    },
    rational: () => {
      const ur = E.ols(hp.lprice, { lassess: hp.lassess, llotsize: hp.llotsize, lsqrft: hp.lsqrft, bdrms: hp.bdrms });
      const r = E.ols(hp.lprice.map((v, i) => v - hp.lassess[i]), {});
      return { ur, r, q: 4, h0: 'H_0: \\beta_1 = 1,\\; \\beta_2 = \\beta_3 = \\beta_4 = 0', h1: 'H_1: \\beta_1 \\neq 1 \\text{ or } \\beta_2 \\neq 0 \\text{ or } \\beta_3 \\neq 0 \\text{ or } \\beta_4 \\neq 0', title: 'hprice1: rational assessments', note: 'Restricted model: regress log(price) − log(assess) on a constant.' };
    }
  };

  /* ------------------------------------------------------------------
     F test: restricted vs unrestricted SSR, F distribution, decision
     ------------------------------------------------------------------ */
  UI.widget('f-ssr', host => {
    const S = UI.scaffold(host);
    let ex = 'parents', alpha = 0.05;
    const top = UI.el('div'), bot = UI.el('div'); S.plotHost.append(top, bot);
    UI.segmented(S.controls, { label: 'Example', options: [{ value: 'parents', label: 'parents\' educ' }, { value: 'overall', label: 'overall' }, { value: 'rational', label: 'rationality' }], value: ex, onChange: v => { ex = v; draw(); } });
    UI.segmented(S.controls, { label: '\\(\\alpha\\)', options: [{ value: 0.1, label: '10%' }, { value: 0.05, label: '5%' }, { value: 0.01, label: '1%' }], value: 0.05, onChange: v => { alpha = +v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      const X = EXAMPLES[ex](), q = X.q, df = X.ur.df;
      const SSRr = ex === 'overall' ? X.ur.SST : X.r.SSR, SSRur = X.ur.SSR;
      const F = ((SSRr - SSRur) / q) / (SSRur / df), p = 1 - E.pf(F, q, df), c = E.qf(1 - alpha, q, df);
      top.innerHTML = ''; bot.innerHTML = '';
      const B = new UI.Plot(top, { w: 640, h: 115, xlim: [0, SSRr * 1.08], ylim: [0, 3], xlab: 'sum of squared residuals', yticks: [], margin: { l: 110, t: 6, b: 40 } });
      B.rect(0, 1.9, SSRur, 2.7, { fill: 'rgba(31,95,168,.55)' }); B.rect(0, 0.6, SSRr, 1.4, { fill: 'rgba(217,98,43,.55)' });
      B.rect(SSRur, 0.6, SSRr, 1.4, { fill: 'rgba(192,57,43,.85)' });
      const lab = (y, t) => { const e = UI.svg('text', { x: 104, y: B.Y(y) + 5, 'text-anchor': 'end', class: 'ptext' }); e.textContent = t; B.gTop.appendChild(e); };
      lab(2.3, 'unrestricted'); lab(1.0, 'restricted');
      const L = Math.max(c * 1.6, F * 1.15, 4), fy = v => E.df(v, q, df), ymax = Math.min(1.2, Math.max(...E.range(0.05, L, 60).map(fy)) * 1.15);
      const P = new UI.Plot(bot, { w: 640, h: 190, xlim: [0, L], ylim: [0, ymax], xlab: `F(${q}, ${df})`, yticks: [], margin: { t: 8, b: 44 } });
      P.area(fy, c, L, { fill: 'rgba(192,57,43,.3)' }); P.fn(fy, { color: C.ink, width: 2.5, from: 0.01, n: 300 });
      P.vline(Math.min(F, L * 0.99), { color: C.orange, width: 3.5 }); P.text(Math.min(F, L * 0.99), ymax * 0.9, ` F = ${E.fmt(F, 2)}`, { color: C.orange, weight: 700, anchor: F > L * 0.7 ? 'end' : 'start' });
      const d = ex === 'rational' ? 4 : 0;
      out.innerHTML = `<b>${X.title}</b><br>\\(${X.h0}\\)<br>\\(${X.h1}\\)<br>` +
        `\\(F = \\frac{(${E.fmt(SSRr, d)} - ${E.fmt(SSRur, d)})/${q}}{${E.fmt(SSRur, d)}/${df}} =\\) <span class="big">${E.fmt(F, 3)}</span><br>` +
        `critical value ${E.fmt(c, 2)}, p-value = <b>${E.fmtP(p)}</b><br>` +
        (F > c ? `<span class="bad">Reject H₀</span> at ${alpha * 100}%.` : `<span class="good">Fail to reject H₀</span> at ${alpha * 100}%.`) +
        `<br><span class="muted small">${X.note} Red bar segment: the rise in SSR from imposing H₀.</span>`;
      UI.renderMath(out);
    }
    draw();
  });

})();
