/* =====================================================================
   econ-core.js — numerical core for the Econometrics I interactive slides
   (no DOM). Distributions, OLS with inference, random numbers, helpers.
   Prof. Dr. Hüseyin Taştan · Yıldız Technical University
   ===================================================================== */
(function (root) {
  'use strict';
  const E = {};

  /* ---------------- basic helpers ---------------- */
  E.sum = a => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; };
  E.mean = a => E.sum(a) / a.length;
  E.variance = a => { const m = E.mean(a); let s = 0; for (const v of a) s += (v - m) * (v - m); return s / (a.length - 1); };
  E.sd = a => Math.sqrt(E.variance(a));
  E.cov = (a, b) => { const ma = E.mean(a), mb = E.mean(b); let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb); return s / (a.length - 1); };
  E.cor = (a, b) => E.cov(a, b) / (E.sd(a) * E.sd(b));
  E.min = a => a.reduce((m, v) => v < m ? v : m, Infinity);
  E.max = a => a.reduce((m, v) => v > m ? v : m, -Infinity);
  E.range = (a, b, n) => { const out = []; for (let i = 0; i < n; i++) out.push(a + (b - a) * i / (n - 1)); return out; };
  E.seq = (a, b, step = 1) => { const out = []; for (let v = a; v <= b + 1e-12; v += step) out.push(v); return out; };
  E.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  E.quantile = (a, p) => { const s = [...a].sort((x, y) => x - y); const h = (s.length - 1) * p; const lo = Math.floor(h); return s[lo] + (h - lo) * ((s[lo + 1] ?? s[lo]) - s[lo]); };
  E.log = Math.log; E.exp = Math.exp;

  /* number formatting */
  E.fmt = (v, d = 3) => {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    if (!Number.isFinite(v)) return v > 0 ? '∞' : '−∞';
    const s = Number(v).toFixed(d);
    return s.startsWith('-') ? '−' + s.slice(1) : s;
  };
  E.fmtP = p => p < 0.0001 ? '< 0.0001' : E.fmt(p, 4);
  E.signed = (v, d = 3) => (v >= 0 ? '+ ' : '− ') + Math.abs(v).toFixed(d);
  E.stars = p => p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : p < 0.1 ? '.' : '';

  /* ---------------- random numbers (seedable) ---------------- */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  E.RNG = function (seed) {
    const u = mulberry32(seed === undefined ? (Math.random() * 2 ** 31) | 0 : seed);
    let spare = null;
    const r = {
      unif: (a = 0, b = 1) => a + (b - a) * u(),
      norm: (m = 0, s = 1) => {
        if (spare !== null) { const z = spare; spare = null; return m + s * z; }
        let x, y, q; do { x = 2 * u() - 1; y = 2 * u() - 1; q = x * x + y * y; } while (q >= 1 || q === 0);
        const f = Math.sqrt(-2 * Math.log(q) / q); spare = y * f; return m + s * x * f;
      },
      chisq: k => { let s = 0; for (let i = 0; i < k; i++) { const z = r.norm(); s += z * z; } return s; },
      expo: (rate = 1) => -Math.log(1 - u()) / rate,
      bern: p => (u() < p ? 1 : 0),
      int: (a, b) => a + Math.floor(u() * (b - a + 1)),
      pick: arr => arr[Math.floor(u() * arr.length)],
      shuffle: arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(u() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
      vec: (n, f) => Array.from({ length: n }, f),
      raw: u
    };
    return r;
  };
  E.rng = E.RNG();

  /* ---------------- special functions ---------------- */
  const LANCZOS = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  E.lgamma = function lgamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1; let a = LANCZOS[0]; const t = x + 7.5;
    for (let i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  };
  function betacf(a, b, x) {
    const MAXIT = 300, EPS = 3e-16, FPMIN = 1e-300;
    let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
      const del = d * c; h *= del; if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  /* regularized incomplete beta I_x(a,b) */
  E.ibeta = function (x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(E.lgamma(a + b) - E.lgamma(a) - E.lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  };
  /* regularized lower incomplete gamma P(a,x) */
  E.igamma = function (a, x) {
    if (x <= 0) return 0;
    if (x < a + 1) { let ap = a, sum = 1 / a, del = sum; for (let n = 0; n < 500; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-16) break; } return sum * Math.exp(-x + a * Math.log(x) - E.lgamma(a)); }
    let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
    for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-16) break; }
    return 1 - Math.exp(-x + a * Math.log(x) - E.lgamma(a)) * h;
  };

  /* ---------------- distributions ---------------- */
  const SQ2PI = Math.sqrt(2 * Math.PI);
  E.dnorm = (x, m = 0, s = 1) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * SQ2PI);
  E.pnorm = (x, m = 0, s = 1) => { const z = (x - m) / s; const p = 0.5 * E.igamma(0.5, z * z / 2); return z >= 0 ? 0.5 + p : 0.5 - p; };
  E.qnorm = function (p, m = 0, s = 1) { // Acklam + one Newton step
    if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239],
      b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572],
      c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783],
      d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425; let q, r, x;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p <= 1 - pl) { q = p - 0.5; r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    else { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    const e = E.pnorm(x) - p; const u = e * SQ2PI * Math.exp(x * x / 2); x = x - u / (1 + x * u / 2);
    return m + s * x;
  };
  E.dt = (x, df) => Math.exp(E.lgamma((df + 1) / 2) - E.lgamma(df / 2) - 0.5 * Math.log(df * Math.PI) - (df + 1) / 2 * Math.log(1 + x * x / df));
  E.pt = (x, df) => { if (!Number.isFinite(df) || df > 1e7) return E.pnorm(x); const p = 0.5 * E.ibeta(df / (df + x * x), df / 2, 0.5); return x > 0 ? 1 - p : p; };
  E.dchisq = (x, k) => x <= 0 ? (k === 2 ? 0.5 : (k < 2 ? Infinity : 0)) : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - E.lgamma(k / 2));
  E.pchisq = (x, k) => E.igamma(k / 2, x / 2);
  E.df = (x, d1, d2) => x <= 0 ? 0 : Math.exp(0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) - Math.log(x) - (E.lgamma(d1 / 2) + E.lgamma(d2 / 2) - E.lgamma((d1 + d2) / 2)));
  E.pf = (x, d1, d2) => x <= 0 ? 0 : E.ibeta(d1 * x / (d1 * x + d2), d1 / 2, d2 / 2);
  E.dlogis = x => { const e = Math.exp(-Math.abs(x)); return e / ((1 + e) * (1 + e)); };
  E.plogis = x => 1 / (1 + Math.exp(-x));

  function invert(cdf, p, lo, hi) { // monotone cdf bisection with bracket expansion
    while (cdf(lo) > p) lo = lo < 0 ? lo * 2 : lo - 1;
    while (cdf(hi) < p) hi = hi > 0 ? hi * 2 : hi + 1;
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (cdf(mid) < p) lo = mid; else hi = mid; if (hi - lo < 1e-12 * Math.max(1, Math.abs(mid))) break; }
    return (lo + hi) / 2;
  }
  E.qt = (p, df) => (!Number.isFinite(df) || df > 1e7) ? E.qnorm(p) : invert(x => E.pt(x, df), p, -10, 10);
  E.qchisq = (p, k) => invert(x => E.pchisq(x, k), p, 0, Math.max(10, 3 * k));
  E.qf = (p, d1, d2) => invert(x => E.pf(x, d1, d2), p, 0, 10);

  /* ---------------- linear algebra (small k) ---------------- */
  E.inv = function (A) {
    const n = A.length, M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
    for (let c = 0; c < n; c++) {
      let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      if (Math.abs(M[piv][c]) < 1e-12) throw new Error('singular');
      [M[c], M[piv]] = [M[piv], M[c]];
      const d = M[c][c]; for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
      for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; if (f) for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j]; }
    }
    return M.map(r => r.slice(n));
  };

  /* ---------------- OLS ----------------
     E.ols(y, {x1:[..], x2:[..]}, {intercept:true, weights:null})
     rows with null/NaN in any variable are dropped (listwise). */
  E.ols = function (y, X, opts = {}) {
    const intercept = opts.intercept !== false;
    const names = Object.keys(X);
    const w = opts.weights || null;
    const rows = [];
    for (let i = 0; i < y.length; i++) {
      if (y[i] === null || !Number.isFinite(y[i])) continue;
      let ok = true; for (const nm of names) { const v = X[nm][i]; if (v === null || !Number.isFinite(v)) { ok = false; break; } }
      if (w && !(w[i] > 0)) ok = false;
      if (ok) rows.push(i);
    }
    const cn = (intercept ? ['(Intercept)'] : []).concat(names);
    const k1 = cn.length, n = rows.length;
    const Z = rows.map(i => (intercept ? [1] : []).concat(names.map(nm => X[nm][i])));
    const yy = rows.map(i => y[i]);
    const ww = rows.map(i => (w ? w[i] : 1));
    const XtX = Array.from({ length: k1 }, () => new Array(k1).fill(0)), Xty = new Array(k1).fill(0);
    for (let r = 0; r < n; r++) { const z = Z[r], wr = ww[r]; for (let a = 0; a < k1; a++) { Xty[a] += wr * z[a] * yy[r]; for (let b = a; b < k1; b++) XtX[a][b] += wr * z[a] * z[b]; } }
    for (let a = 0; a < k1; a++) for (let b = 0; b < a; b++) XtX[a][b] = XtX[b][a];
    const XtXi = E.inv(XtX);
    const coef = XtXi.map(r => r.reduce((s, v, j) => s + v * Xty[j], 0));
    const fitted = Z.map(z => z.reduce((s, v, j) => s + v * coef[j], 0));
    const resid = yy.map((v, i) => v - fitted[i]);
    let SSR = 0; for (let i = 0; i < n; i++) SSR += ww[i] * resid[i] * resid[i];
    const ybarw = E.sum(yy.map((v, i) => ww[i] * v)) / E.sum(ww);
    let SST = 0; for (let i = 0; i < n; i++) SST += ww[i] * (intercept ? (yy[i] - ybarw) ** 2 : yy[i] ** 2);
    const df = n - k1, sigma2 = SSR / df;
    const vcov = XtXi.map(r => r.map(v => v * sigma2));
    const se = coef.map((_, j) => Math.sqrt(vcov[j][j]));
    const tval = coef.map((b, j) => b / se[j]);
    const pval = tval.map(t => 2 * (1 - E.pt(Math.abs(t), df)));
    // heteroskedasticity-robust (HC0 & HC1) — unweighted OLS only
    const meat = Array.from({ length: k1 }, () => new Array(k1).fill(0));
    for (let r = 0; r < n; r++) { const z = Z[r], e2 = resid[r] * resid[r] * ww[r] * ww[r]; for (let a = 0; a < k1; a++) for (let b = 0; b < k1; b++) meat[a][b] += e2 * z[a] * z[b]; }
    const sand = XtXi.map(r => meat[0].map((_, j) => r.reduce((s, v, m) => s + v * meat[m][j], 0))).map(r => XtXi[0].map((_, j) => r.reduce((s, v, m) => s + v * XtXi[m][j], 0)));
    const se_hc0 = coef.map((_, j) => Math.sqrt(sand[j][j]));
    const se_hc1 = se_hc0.map(s => s * Math.sqrt(n / df));
    const R2 = 1 - SSR / SST, k = k1 - (intercept ? 1 : 0);
    const adjR2 = 1 - (1 - R2) * (n - 1) / df;
    const F = k > 0 ? (R2 / k) / ((1 - R2) / df) : NaN;
    const res = {
      names: cn, coef, se, t: tval, p: pval, vcov, se_hc0, se_hc1, vcov_hc0: sand,
      fitted, resid, rows, n, k, df, SSR, SST, SSE: SST - SSR, R2, adjR2, sigma: Math.sqrt(sigma2),
      F, Fp: k > 0 ? 1 - E.pf(F, k, df) : NaN, intercept, y: yy,
      b: nm => coef[cn.indexOf(nm)], seOf: nm => se[cn.indexOf(nm)],
      predict: xs => (intercept ? coef[0] : 0) + names.reduce((s, nm, j) => s + coef[j + (intercept ? 1 : 0)] * xs[nm], 0)
    };
    return res;
  };

  /* ---------------- logit / probit by iteratively reweighted least squares ----------------
     E.glm(y, X, {link: 'logit' | 'probit'})  — y must be 0/1 */
  E.glm = function (y, X, opts = {}) {
    const link = opts.link || 'logit', names = Object.keys(X);
    const rows = [];
    for (let i = 0; i < y.length; i++) {
      if (!Number.isFinite(y[i])) continue;
      if (names.every(nm => Number.isFinite(X[nm][i]))) rows.push(i);
    }
    const cn = ['(Intercept)'].concat(names), k1 = cn.length, n = rows.length;
    const Z = rows.map(i => [1].concat(names.map(nm => X[nm][i]))), yy = rows.map(i => y[i]);
    const mean = E.mean(yy);
    let b = new Array(k1).fill(0); b[0] = link === 'logit' ? Math.log(mean / (1 - mean)) : E.qnorm(mean);
    let XtWXi = null;
    for (let it = 0; it < 60; it++) {
      const XtWX = Array.from({ length: k1 }, () => new Array(k1).fill(0)), XtWz = new Array(k1).fill(0);
      for (let r = 0; r < n; r++) {
        const z = Z[r]; let eta = 0; for (let j = 0; j < k1; j++) eta += z[j] * b[j];
        let mu, dmu;
        if (link === 'logit') { mu = E.clamp(E.plogis(eta), 1e-10, 1 - 1e-10); dmu = mu * (1 - mu); }
        else { mu = E.clamp(E.pnorm(eta), 1e-10, 1 - 1e-10); dmu = Math.max(E.dnorm(eta), 1e-10); }
        const w = dmu * dmu / (mu * (1 - mu)), work = eta + (yy[r] - mu) / dmu;
        for (let a = 0; a < k1; a++) { XtWz[a] += w * z[a] * work; for (let c = 0; c < k1; c++) XtWX[a][c] += w * z[a] * z[c]; }
      }
      XtWXi = E.inv(XtWX);
      const nb = XtWXi.map(r => r.reduce((s, v, j) => s + v * XtWz[j], 0));
      const diff = Math.max(...nb.map((v, j) => Math.abs(v - b[j])));
      b = nb; if (diff < 1e-10) break;
    }
    const se = b.map((_, j) => Math.sqrt(XtWXi[j][j])), z = b.map((v, j) => v / se[j]);
    const eta = i => Z[i].reduce((s, v, j) => s + v * b[j], 0);
    const mu = i => link === 'logit' ? E.plogis(eta(i)) : E.pnorm(eta(i));
    let ll = 0; for (let i = 0; i < n; i++) { const p = E.clamp(mu(i), 1e-12, 1 - 1e-12); ll += yy[i] * Math.log(p) + (1 - yy[i]) * Math.log(1 - p); }
    const link_inv = v => link === 'logit' ? E.plogis(v) : E.pnorm(v);
    return {
      names: cn, coef: b, se, z, p: z.map(v => 2 * (1 - E.pnorm(Math.abs(v)))), n, k: k1 - 1, logLik: ll, link,
      fitted: Z.map((_, i) => mu(i)),
      predict: xs => link_inv(b[0] + names.reduce((s, nm, j) => s + b[j + 1] * xs[nm], 0)),
      /* partial effect of regressor `nm` at the given point (derivative of the probability) */
      margin: (nm, xs) => { const lin = b[0] + names.reduce((s, q, j) => s + b[j + 1] * xs[q], 0); const dens = link === 'logit' ? E.dlogis(lin) : E.dnorm(lin); return dens * b[names.indexOf(nm) + 1]; }
    };
  };

  /* simple regression shortcut */
  E.slr = (x, y) => { const mx = E.mean(x), my = E.mean(y); let sxy = 0, sxx = 0; for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; } const b1 = sxy / sxx; return { b0: my - b1 * mx, b1, sxx }; };

  /* complete cases helper: returns object of arrays with rows where all listed columns are non-null */
  E.complete = function (data, cols) {
    const n = data[cols[0]].length, out = {}; cols.forEach(c => out[c] = []);
    for (let i = 0; i < n; i++) { if (cols.every(c => data[c][i] !== null && Number.isFinite(data[c][i]))) cols.forEach(c => out[c].push(data[c][i])); }
    return out;
  };

  /* histogram counts */
  E.hist = function (vals, lo, hi, bins) {
    const w = (hi - lo) / bins, counts = new Array(bins).fill(0);
    for (const v of vals) { const b = Math.floor((v - lo) / w); if (b >= 0 && b < bins) counts[b]++; else if (v === hi) counts[bins - 1]++; }
    return { counts, lo, hi, bins, width: w, edges: E.range(lo, hi, bins + 1) };
  };

  root.E = E;
  if (typeof module !== 'undefined') module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
