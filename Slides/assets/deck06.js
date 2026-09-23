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
      return { ur, r, q: 2, h0: 'H_0: \\beta_{motheduc} = 0,\\; \\beta_{fatheduc} = 0', title: 'bwght: parents\' education', note: 'Restricted model: drop motheduc and fatheduc (same 1,191 observations!).' };
    },
    overall: () => {
      const ur = E.ols(bw.bwght, { cigs: bw.cigs, parity: bw.parity, faminc: bw.faminc, motheduc: bw.motheduc, fatheduc: bw.fatheduc });
      const r = E.ols(bw.bwght, {});
      return { ur, r, q: 5, h0: 'H_0: \\beta_1 = \\dots = \\beta_5 = 0', title: 'bwght: overall significance', note: 'Restricted model: intercept only, so SSR_r = SST.' };
    },
    rational: () => {
      const ur = E.ols(hp.lprice, { lassess: hp.lassess, llotsize: hp.llotsize, lsqrft: hp.lsqrft, bdrms: hp.bdrms });
      const r = E.ols(hp.lprice.map((v, i) => v - hp.lassess[i]), {});
      return { ur, r, q: 4, h0: 'H_0: \\beta_1 = 1,\\; \\beta_2 = \\beta_3 = \\beta_4 = 0', title: 'hprice1: rational assessments', note: 'Restricted model: regress log(price) − log(assess) on a constant.' };
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
      out.innerHTML = `<b>${X.title}</b><br>\\(${X.h0}\\)<br>` +
        `\\(F = \\frac{(${E.fmt(SSRr, d)} - ${E.fmt(SSRur, d)})/${q}}{${E.fmt(SSRur, d)}/${df}} =\\) <span class="big">${E.fmt(F, 3)}</span><br>` +
        `critical value ${E.fmt(c, 2)}, p-value = <b>${E.fmtP(p)}</b><br>` +
        (F > c ? `<span class="bad">Reject H₀</span> at ${alpha * 100}%.` : `<span class="good">Fail to reject H₀</span> at ${alpha * 100}%.`) +
        `<br><span class="muted small">${X.note} Red bar segment: the rise in SSR from imposing H₀.</span>`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Individually insignificant, jointly significant: CI box vs ellipse
     ------------------------------------------------------------------ */
  UI.widget('joint-ellipse', host => {
    const S = UI.scaffold(host);
    let rho = 0.95, seed = 4;
    const P = new UI.Plot(S.plotHost, { w: 560, h: 370, xlim: [-1, 1.5], ylim: [-1, 1.5], xlab: 'β₁', ylab: 'β₂' });
    UI.slider(S.controls, { label: 'Corr\\((x_1,x_2)\\)', min: 0, max: 0.98, step: 0.01, value: rho, fmt: v => v.toFixed(2), onInput: v => { rho = v; draw(); } });
    const row = UI.el('div', { class: 'row' }); S.controls.appendChild(row);
    UI.button(row, '↻ New sample', () => { seed++; draw(); }, 'small ghost');
    UI.button(row, '🔍 Find a "puzzling" sample', () => { for (let k = 0; k < 400; k++) { seed++; const st = fit(); if (st.p1 > 0.05 && st.p2 > 0.05 && st.pF < 0.05) break; } draw(); }, 'small orange');
    const out = UI.readout(S.out);
    function fit() {
      const r = E.RNG(seed), n = 60, x1 = r.vec(n, () => r.norm()), x2 = x1.map(v => rho * v + Math.sqrt(1 - rho * rho) * r.norm());
      const y = x1.map((v, i) => 0.25 * v + 0.25 * x2[i] + r.norm());
      const f = E.ols(y, { x1, x2 }), b = [f.coef[1], f.coef[2]], V = [[f.vcov[1][1], f.vcov[1][2]], [f.vcov[2][1], f.vcov[2][2]]];
      const Vi = E.inv(V), Fst = (b[0] * (Vi[0][0] * b[0] + Vi[0][1] * b[1]) + b[1] * (Vi[1][0] * b[0] + Vi[1][1] * b[1])) / 2;
      return { f, b, V, Vi, df: f.df, p1: f.p[1], p2: f.p[2], F: Fst, pF: 1 - E.pf(Fst, 2, f.df) };
    }
    function draw() {
      const st = fit(), c = E.qt(0.975, st.df), cF = E.qf(0.95, 2, st.df);
      const se1 = Math.sqrt(st.V[0][0]), se2 = Math.sqrt(st.V[1][1]);
      const span = Math.max(1.2, 3 * se1, 3 * se2), mx = st.b[0], my = st.b[1];
      P.setLimits([Math.min(-0.3, mx - span), Math.max(0.3, mx + span)], [Math.min(-0.3, my - span), Math.max(0.3, my + span)]); P.clear();
      P.hline(0, { color: C.axis, width: 1 }); P.vline(0, { color: C.axis, width: 1 });
      P.rect(mx - c * se1, my - c * se2, mx + c * se1, my + c * se2, { fill: 'rgba(31,95,168,.12)', stroke: C.blue, sw: 2 });
      // ellipse: points b + sqrt(2 cF) * L u, with L the Cholesky factor of V
      const l11 = Math.sqrt(st.V[0][0]), l21 = st.V[1][0] / l11, l22 = Math.sqrt(st.V[1][1] - l21 * l21), k = Math.sqrt(2 * cF);
      const th = E.range(0, 2 * Math.PI, 160), ex = th.map(t => mx + k * l11 * Math.cos(t)), ey = th.map((t, i) => my + k * (l21 * Math.cos(t) + l22 * Math.sin(t)));
      P.path(ex, ey, { color: C.orange, width: 3 });
      P.points([mx], [my], { r: 5, fill: C.ink, stroke: '#fff' });
      P.points([0], [0], { r: 8, fill: '#fff', stroke: C.red, sw: 3 });
      P.text(0, 0, '  (0, 0)', { color: C.red, weight: 700, dy: -10 });
      const inBox = Math.abs(mx) < c * se1 && Math.abs(my) < c * se2, rejF = st.pF < 0.05;
      out.innerHTML = `\\(t_1 = ${E.fmt(st.f.t[1], 2)}\\) (p = ${E.fmtP(st.p1)}), \\(\\;t_2 = ${E.fmt(st.f.t[2], 2)}\\) (p = ${E.fmtP(st.p2)})<br>` +
        `\\(F\\) for \\(H_0: \\beta_1 = \\beta_2 = 0\\): <span class="big">${E.fmt(st.F, 2)}</span> (p = ${E.fmtP(st.pF)})<br>` +
        `<span style="color:${C.blue}"><b>Blue box</b></span>: pairs not rejected by the two separate t tests. <span style="color:${C.orange}"><b>Orange ellipse</b></span>: pairs not rejected by the joint F test (95%).<br>` +
        (inBox && rejF ? `<span class="bad">Puzzle solved:</span> (0,0) is inside the box but <b>outside the ellipse</b>. Each variable looks insignificant alone, but together they clearly matter.` :
          `<span class="muted">(0,0) is ${inBox ? 'inside' : 'outside'} the box and ${rejF ? 'outside' : 'inside'} the ellipse.</span>`) +
        `<br><span class="muted small">With highly correlated regressors the ellipse becomes long and thin: the data pin down β₁ + β₂ but not each coefficient.</span>`;
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     LM test step by step (bwght, parents' education)
     ------------------------------------------------------------------ */
  UI.widget('lm-steps', host => {
    const S = UI.scaffold(host);
    const r = E.ols(bw.bwght, { cigs: bw.cigs, parity: bw.parity, faminc: bw.faminc });
    const aux = E.ols(r.resid, { cigs: bw.cigs, parity: bw.parity, faminc: bw.faminc, motheduc: bw.motheduc, fatheduc: bw.fatheduc });
    const LM = aux.n * aux.R2, p = 1 - E.pchisq(LM, 2), c = E.qchisq(0.95, 2);
    let step = 1;
    UI.segmented(S.controls, { label: 'Step', options: [{ value: 1, label: '① restricted model' }, { value: 2, label: '② auxiliary regression' }, { value: 3, label: '③ LM = nR²' }], value: 1, onChange: v => { step = +v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      S.plotHost.innerHTML = '';
      if (step === 1) {
        S.plotHost.innerHTML = `<p><b>Estimate the model under H₀</b> (without motheduc, fatheduc), on the 1,191 observations with complete data. Save the residuals \\(\\tilde u\\).</p>` + UI.regTable(r, { names: ['(Intercept)', 'cigs', 'parity', 'faminc'], digits: 4 });
        out.innerHTML = `Only the <b>restricted</b> model is estimated. This is the attraction of LM tests: we never estimate the unrestricted model directly.`;
      } else if (step === 2) {
        S.plotHost.innerHTML = `<p><b>Regress \\(\\tilde u\\) on all the regressors</b>, including the excluded ones:</p>` + UI.regTable(aux, { names: ['(Intercept)', 'cigs', 'parity', 'faminc', 'motheduc', 'fatheduc'], digits: 4 });
        out.innerHTML = `\\(R^2_{\\tilde u} = ${E.fmt(aux.R2, 5)}\\)<br>If motheduc and fatheduc matter, they should explain part of what the restricted model left in \\(\\tilde u\\). A tiny \\(R^2\\) means they explain almost nothing.`;
      } else {
        const P = new UI.Plot(S.plotHost, { w: 640, h: 340, xlim: [0, 12], ylim: [0, 0.52], xlab: 'χ²(2)', yticks: [] });
        const f = v => E.dchisq(v, 2); P.area(f, c, 12, { fill: 'rgba(192,57,43,.3)' }); P.fn(f, { color: C.ink, width: 2.5, from: 0.02, n: 200 });
        P.vline(LM, { color: C.orange, width: 3.5 }); P.text(LM, 0.46, ` LM = ${E.fmt(LM, 2)}`, { color: C.orange, weight: 700 });
        out.innerHTML = `\\(LM = n\\,R^2_{\\tilde u} = ${aux.n} \\times ${E.fmt(aux.R2, 5)} = \\) <span class="big">${E.fmt(LM, 2)}</span><br>Under H₀, \\(LM \\stackrel{a}{\\sim} \\chi^2_q\\) with \\(q = 2\\).<br>5% critical value: ${E.fmt(c, 2)}; p-value = <b>${E.fmt(p, 3)}</b><br><span class="good">Fail to reject H₀</span>, the same conclusion as the F test (p = 0.238).`;
      }
      UI.renderMath(S.plotHost); UI.renderMath(out);
    }
    draw();
  });
})();
