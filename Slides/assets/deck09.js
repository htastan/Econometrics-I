/* Widgets for Deck 09 — Qualitative information: dummy variables */
(function () {
  const { E, UI } = window; const C = UI.C; const W = window.WDATA; const ln = Math.log;
  const d = W.wage1;
  const BLUE = 'rgba(31,95,168,.55)', ORANGE = 'rgba(217,98,43,.6)';

  /* ------------------------------------------------------------------
     One dummy: same line, shifted intercept, or different slopes too
     ------------------------------------------------------------------ */
  UI.widget('dummy-lines', host => {
    const S = UI.scaffold(host);
    let model = 'shift', logy = false, x0 = 12;
    const bar = UI.el('div'); S.controls.appendChild(bar);
    UI.segmented(bar, { label: 'Model', options: [{ value: 'pooled', label: 'one line for everybody' }, { value: 'shift', label: '+ female dummy' }, { value: 'slope', label: '+ female × educ' }], value: model, onChange: v => { model = v; draw(); } });
    UI.toggle(S.controls, { label: 'use \\(\\log(wage)\\) instead of \\(wage\\)', value: false, onChange: v => { logy = v; draw(); } });
    UI.slider(S.controls, { label: 'compare at educ =', min: 0, max: 18, step: 1, value: x0, fmt: v => v, onInput: v => { x0 = v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      const y = logy ? d.wage.map(ln) : d.wage;
      const X = { educ: d.educ, exper: d.exper, tenure: d.tenure };
      if (model !== 'pooled') X.female = d.female;
      if (model === 'slope') X.femaleEduc = d.female.map((f, i) => f * d.educ[i]);
      const f = E.ols(y, X);
      const b = n => f.coef[f.names.indexOf(n)] || 0;
      const mE = E.mean(d.exper), mT = E.mean(d.tenure);
      const line = (fem, e) => b('(Intercept)') + b('educ') * e + b('female') * fem + b('femaleEduc') * fem * e + b('exper') * mE + b('tenure') * mT;
      S.plotHost.innerHTML = '';
      const P = new UI.Plot(S.plotHost, { w: 640, h: 330, xlim: [-0.5, 18.6], ylim: logy ? [0, 3.4] : [0, 26], xlab: 'educ', ylab: logy ? 'log(wage)' : 'wage' });
      const g = UI.svg('g'); P.gData.appendChild(g);
      d.educ.forEach((e, i) => g.appendChild(UI.svg('circle', { cx: P.X(e + (d.female[i] ? 0.16 : -0.16)), cy: P.Y(y[i]), r: 2.8, fill: d.female[i] ? ORANGE : BLUE, stroke: 'none' })));
      P.fn(e => line(0, e), { color: C.blue, width: 3.4, from: 0, to: 18.5 });
      P.fn(e => line(1, e), { color: C.orange, width: 3.4, from: 0, to: 18.5 });
      const gap = line(1, x0) - line(0, x0);
      P.line(x0, line(0, x0), x0, line(1, x0), { color: C.green, width: 3, top: true });
      const pct = logy ? 100 * (Math.exp(gap) - 1) : null;
      const eq = model === 'pooled' ? `one intercept for everybody`
        : model === 'shift' ? `\\(\\hat\\delta_0 = ${E.fmt(b('female'), 4)}\\) (se ${E.fmt(f.se[f.names.indexOf('female')], 4)}, t = ${E.fmt(f.t[f.names.indexOf('female')], 2)})`
          : `\\(\\hat\\delta_0 = ${E.fmt(b('female'), 3)}\\), \\(\\hat\\delta_1 = ${E.fmt(b('femaleEduc'), 4)}\\) (t = ${E.fmt(f.t[f.names.indexOf('femaleEduc')], 2)})`;
      out.innerHTML = `<span style="color:${C.blue}">●</span> men &nbsp; <span style="color:${C.orange}">●</span> women &nbsp; <span class="muted small">(exper and tenure held at their means)</span><br><br>${eq}<br><br>` +
        `<b>Predicted gap at educ = ${x0}:</b> <span class="big">${E.fmt(gap, 3)}</span>` + (logy ? ` log points ≈ <b>${E.fmt(pct, 1)}%</b>` : ` dollars per hour`) + `<br>` +
        (model === 'pooled' ? `<span class="bad">Without a dummy the model forces the same line on both groups: the gap is 0 by construction.</span>`
          : model === 'shift' ? `<span class="muted small">Parallel lines: the same gap at every level of education. The intercept for women is \\(\\hat\\beta_0 + \\hat\\delta_0\\).</span>`
            : `<span class="muted small">Different slopes: the return to education is ${E.fmt(b('educ'), 4)} for men and ${E.fmt(b('educ') + b('femaleEduc'), 4)} for women. The difference is small and insignificant, so the lines are nearly parallel.</span>`);
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     The dummy variable trap
     ------------------------------------------------------------------ */
  UI.widget('dummy-trap', host => {
    host.innerHTML = ''; host.classList.add('widget-live');
    const bar = UI.el('div', { class: 'fs-bar' }), grid = UI.el('div', { class: 'wgrid wide' });
    const left = UI.el('div'), side = UI.el('div', { class: 'wside' }); grid.append(left, side); host.append(bar, grid);
    let inter = true, fem = true, male = true;
    UI.toggle(bar, { label: 'intercept', value: true, onChange: v => { inter = v; draw(); } });
    UI.toggle(bar, { label: '<b>female</b> dummy', value: true, onChange: v => { fem = v; draw(); } });
    UI.toggle(bar, { label: '<b>male</b> dummy', value: true, onChange: v => { male = v; draw(); } });
    const out = UI.readout(side);
    function draw() {
      const male_ = d.female.map(v => 1 - v);
      const X = {};
      if (fem) X.female = d.female;
      if (male) X.male = male_;
      X.educ = d.educ;
      // small illustration table
      const rows = [0, 1, 2, 3].map(i => `<tr><td>${i + 1}</td>${inter ? '<td>1</td>' : ''}${fem ? `<td>${d.female[i]}</td>` : ''}${male ? `<td>${male_[i]}</td>` : ''}<td>${d.educ[i]}</td></tr>`).join('');
      left.innerHTML = `<table class="regtab"><thead><tr><th>obs</th>${inter ? '<th>intercept</th>' : ''}${fem ? '<th>female</th>' : ''}${male ? '<th>male</th>' : ''}<th>educ</th></tr></thead><tbody>${rows}</tbody></table>`;
      let res = null, err = null;
      try { res = E.ols(d.wage, X, { intercept: inter }); } catch (e) { err = e; }
      if (err) {
        out.innerHTML = `<span class="bad">OLS cannot be computed.</span><br><b>Perfect collinearity:</b> \\(intercept = female + male\\) for every observation, so MLR.3 fails: this is the <b>dummy variable trap</b>.<br><br><span class="muted small">R silently drops one of them and prints NA for its coefficient.</span>`;
      } else {
        const names = res.names.map(n => n === '(Intercept)' ? 'intercept' : n);
        out.innerHTML = `<table class="regtab"><tbody>${res.coef.map((b, j) => `<tr><td class="nm">${names[j]}</td><td>${E.fmt(b, 3)}</td></tr>`).join('')}</tbody></table>` +
          (inter && fem && !male ? `<span class="good">Fine.</span> Base group: <b>men</b>. The coefficient on female is the gap.`
            : inter && male && !fem ? `<span class="good">Fine.</span> Base group: <b>women</b>. The coefficient on male is the gap, with the opposite sign.`
              : !inter && fem && male ? `<span class="good">Fine, no trap without an intercept.</span> Each coefficient is now a <b>group intercept</b>, not a difference. \\(R^2\\) from such a model is not comparable.`
                : `<span class="or">One category is missing and there is no dummy for the other group.</span>`);
      }
      UI.renderMath(out);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Four groups (female × married): the base group is just a reference
     ------------------------------------------------------------------ */
  UI.widget('base-group', host => {
    const S = UI.scaffold(host, { layout: 'stack' });
    const y = d.wage.map(ln), ctrl = { educ: d.educ, exper: d.exper, expersq: d.exper.map(v => v * v), tenure: d.tenure, tenursq: d.tenure.map(v => v * v) };
    const G = { sm: (i) => (1 - d.female[i]) * (1 - d.married[i]), mm: (i) => (1 - d.female[i]) * d.married[i], sf: (i) => d.female[i] * (1 - d.married[i]), mf: (i) => d.female[i] * d.married[i] };
    const LAB = { sm: 'single male', mm: 'married male', sf: 'single female', mf: 'married female' };
    let base = 'sm';
    const bar = UI.el('div'); S.controls.appendChild(bar);
    UI.segmented(bar, { label: 'Base (omitted) group', options: Object.keys(LAB).map(k => ({ value: k, label: LAB[k] })), value: base, onChange: v => { base = v; draw(); } });
    const out = UI.readout(S.out);
    function draw() {
      const keys = Object.keys(LAB).filter(k => k !== base);
      const X = {}; keys.forEach(k => X[k] = d.wage.map((_, i) => G[k](i)));
      Object.assign(X, ctrl);
      const f = E.ols(y, X);
      const b0 = f.coef[0];
      const inter = k => k === base ? b0 : b0 + f.coef[f.names.indexOf(k)];
      S.plotHost.innerHTML = `<table class="regtab"><thead><tr><th>group</th><th>coefficient</th><th>interpretation</th><th>group intercept</th></tr></thead><tbody>` +
        Object.keys(LAB).map(k => {
          const isB = k === base, j = f.names.indexOf(k);
          return `<tr${isB ? ' class="hl"' : ''}><td class="nm">${LAB[k]}</td><td>${isB ? '—' : E.fmt(f.coef[j], 4)}</td><td class="nm">${isB ? '<b>base group</b> (omitted)' : `${E.fmt(100 * f.coef[j], 1)}% vs. ${LAB[base]}`}</td><td>${E.fmt(inter(k), 4)}</td></tr>`;
        }).join('') + `</tbody></table>`;
      out.innerHTML = `Model: \\(\\log(wage)\\) on three group dummies + educ, exper, exper², tenure, tenure². \\(R^2 = ${E.fmt(f.R2, 4)}\\), \\(\\hat\\sigma = ${E.fmt(f.sigma, 4)}\\)<br>` +
        `<span class="muted small">Change the base group: the coefficients change, because they are <b>differences with respect to the base</b>. The <b>group intercepts</b> in the last column, the fitted values and \\(R^2\\) never change. Only three dummies can enter: a fourth one would be the dummy variable trap.</span>`;
      UI.renderMath(out);
    }
    draw();
  });
})();
