/* Widgets for Deck 01 — Introduction to Econometrics */
(function () {
  const { E, UI } = window; const C = UI.C;

  /* color scale for a standardized variable (blue = low, orange = high) */
  const heat = z => { const t = E.clamp((z + 2) / 4, 0, 1); const a = [31, 95, 168], b = [217, 98, 43]; const c = a.map((v, i) => Math.round(v + (b[i] - v) * t)); return `rgba(${c[0]},${c[1]},${c[2]},.6)`; };

  /* ------------------------------------------------------------------
     Correlation is not causation: an unobserved confounder (ability)
     ------------------------------------------------------------------ */
  UI.widget('confounding', host => {
    const S = UI.scaffold(host);
    const P = new UI.Plot(S.plotHost, { w: 640, h: 420, xlim: [4, 20], ylim: [0, 25], xlab: 'educ (years of schooling)', ylab: 'hourly wage' });
    let seed = 7, st = { beta: 0.5, delta: 2, gamma: 1, rand: false };
    const n = 300;
    UI.slider(S.controls, { label: 'True effect β', min: 0, max: 1.2, step: 0.05, value: st.beta, fmt: v => v.toFixed(2), onInput: v => { st.beta = v; draw(); } });
    UI.slider(S.controls, { label: 'ability → wage', min: 0, max: 3, step: 0.1, value: st.delta, fmt: v => v.toFixed(1), onInput: v => { st.delta = v; draw(); } });
    UI.slider(S.controls, { label: 'ability → educ', min: 0, max: 1.5, step: 0.05, value: st.gamma, fmt: v => v.toFixed(2), onInput: v => { st.gamma = v; draw(); } });
    UI.toggle(S.controls, { label: '<b>Run an experiment:</b> assign educ at random', value: false, onChange: v => { st.rand = v; draw(); } });
    const row = UI.el('div', { class: 'row' }); S.controls.appendChild(row);
    UI.button(row, '↻ New sample', () => { seed++; draw(); }, 'small ghost');
    const out = UI.readout(S.out);
    S.out.appendChild(UI.el('div', { class: 'legend-inline small', html: `<span><i style="background:${C.green}"></i>true causal effect</span><span><i style="background:${C.orange}"></i>naive regression line</span><br><span class="muted">dot color = ability (blue low → orange high)</span>` }));
    function draw() {
      const r = E.RNG(seed);
      const abil = r.vec(n, () => r.norm());
      const educ = abil.map(a => E.clamp(12 + (st.rand ? 0 : st.gamma * 1.8 * a) + r.norm(0, st.rand ? Math.sqrt(4 + (st.gamma * 1.8) ** 2) : 2), 5, 19.5));
      const wage = educ.map((e, i) => E.clamp(4 + st.beta * (e - 12) + st.delta * abil[i] + r.norm(0, 1.5) + 4, 0.3, 24.5));
      P.clear();
      const g = UI.svg('g'); P.gData.appendChild(g);
      educ.forEach((e, i) => g.appendChild(UI.svg('circle', { cx: P.X(e), cy: P.Y(wage[i]), r: 4, fill: heat(abil[i]), stroke: 'none' })));
      const f = E.slr(educ, wage), mx = E.mean(educ), my = E.mean(wage);
      P.fn(x => my + st.beta * (x - mx), { color: C.green, width: 3.5, dash: '8 6' });
      P.fn(x => f.b0 + f.b1 * x, { color: C.orange, width: 3.5 });
      const bias = f.b1 - st.beta;
      out.innerHTML = `Naive slope from the data: <span class="big">${E.fmt(f.b1, 2)}</span><br>True causal effect β: <b>${E.fmt(st.beta, 2)}</b><br>` +
        (Math.abs(bias) < 0.08 ? `<span class="good">≈ No bias</span> — ${st.rand ? 'randomization breaks the link between ability and education.' : 'ability is (almost) unrelated to education.'}` :
          `<span class="bad">Bias ≈ ${E.fmt(bias, 2)}</span> — part of the ability effect is wrongly attributed to education.`);
    }
    draw();
  });

  /* ------------------------------------------------------------------
     Randomization balances groups (RCT) vs self-selection
     ------------------------------------------------------------------ */
  UI.widget('rct', host => {
    const S = UI.scaffold(host, { layout: 'wide' });
    const top = UI.el('div'), bot = UI.el('div'); S.plotHost.append(top, bot);
    const P = new UI.Plot(top, { w: 640, h: 250, xlim: [0, 2], ylim: [-3.5, 3.5], xlab: '', ylab: 'motivation (unobserved)', xticks: [], margin: { b: 26 } });
    const H = new UI.Plot(bot, { w: 640, h: 150, xlim: [-1, 5], ylim: [0, 1], xlab: 'estimated treatment effect (difference in mean outcomes)', ylab: '', yticks: [], margin: { l: 58, b: 44, t: 8 } });
    const n = 120, ate = 2; let mode = 'random', seed = 11, history = [];
    const r0 = E.RNG(3); const mot = r0.vec(n, () => r0.norm()); const noise = r0.vec(n, () => r0.norm(0, 1));
    UI.segmented(S.controls, { label: 'How is treatment assigned?', options: [{ value: 'self', label: 'Self-selection' }, { value: 'random', label: 'Coin flip (RCT)' }], value: mode, onChange: v => { mode = v; history = []; assign(); } });
    const row = UI.el('div', { class: 'row' }); S.controls.appendChild(row);
    UI.button(row, '🎲 Assign again', () => assign(), 'small');
    UI.button(row, '×50', () => { for (let i = 0; i < 50; i++) assign(true); assign(); }, 'small ghost');
    const out = UI.readout(S.out);
    const note = UI.el('p', { class: 'small muted', html: `Outcome: \\(y_i = 2\\cdot\\text{treat}_i + 1.5\\cdot\\text{motivation}_i + \\text{noise}\\)` }); S.out.appendChild(note); UI.renderMath(note);
    function assign(silent) {
      seed++; const r = E.RNG(seed);
      const treat = mot.map(m => mode === 'random' ? r.bern(0.5) : r.bern(E.plogis(2.2 * m)));
      const y = mot.map((m, i) => ate * treat[i] + 1.5 * m + noise[i]);
      const m1 = E.mean(mot.filter((_, i) => treat[i])), m0 = E.mean(mot.filter((_, i) => !treat[i]));
      const est = E.mean(y.filter((_, i) => treat[i])) - E.mean(y.filter((_, i) => !treat[i]));
      history.push(est);
      if (silent) return;
      P.clear(); const g = UI.svg('g'); P.gData.appendChild(g);
      mot.forEach((m, i) => { const x = (treat[i] ? 1.5 : 0.5) + (r.unif() - 0.5) * 0.55; g.appendChild(UI.svg('circle', { cx: P.X(x), cy: P.Y(m), r: 4.2, fill: treat[i] ? 'rgba(217,98,43,.55)' : 'rgba(31,95,168,.5)' })); });
      P.line(0.15, m0, 0.85, m0, { color: C.blue, width: 3.5 }); P.line(1.15, m1, 1.85, m1, { color: C.orange, width: 3.5 });
      P.text(0.5, 3.1, 'Control', { anchor: 'middle', weight: 700, color: C.blue }); P.text(1.5, 3.1, 'Treatment', { anchor: 'middle', weight: 700, color: C.orange });
      H.clear(); const h = E.hist(history, -1, 5, 40); const mx = Math.max(...h.counts);
      H.setLimits([-1, 5], [0, mx * 1.15]); H.hist(h, { fill: 'rgba(31,95,168,.5)' });
      H.vline(ate, { color: C.green, width: 3, dash: '6 5' }); H.text(ate, mx * 1.05, ' true effect = 2', { color: C.green, weight: 700 });
      H.vline(est, { color: C.orange, width: 2.5 });
      out.innerHTML = `Mean motivation — treated: <b>${E.fmt(m1, 2)}</b>, control: <b>${E.fmt(m0, 2)}</b><br>Imbalance: <span class="${Math.abs(m1 - m0) < 0.35 ? 'good' : 'bad'}">${E.fmt(m1 - m0, 2)}</span><br>Estimated effect: <span class="big">${E.fmt(est, 2)}</span> (true = 2)<br><span class="muted">Replications so far: ${history.length}, average estimate ${E.fmt(E.mean(history), 2)}</span>`;
    }
    assign();
  });
})();
