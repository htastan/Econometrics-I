/* Layout audit helper (development only — not loaded by the decks).
   Paste into the console or load via a script tag, then: await auditDeck()
   Reports slides whose content overflows the slide and text smaller than
   `minPx` on the 1280×760 slide canvas. */
window.auditDeck = async function (minPx = 20) {
  Reveal.configure({ transition: 'none', backgroundTransition: 'none' });
  const H = Reveal.getConfig().height, scale = Reveal.getScale();
  const slides = Reveal.getSlides(), report = [];
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i], ix = Reveal.getIndices(s);
    Reveal.slide(ix.h, ix.v, 999);
    await new Promise(r => setTimeout(r, 250));
    UI.buildWidgets(s);
    s.querySelectorAll('.explain').forEach(e => e.classList.add('show'));
    s.querySelectorAll('.reveal-box').forEach(e => e.classList.add('open'));
    await new Promise(r => setTimeout(r, 120));
    const top = s.getBoundingClientRect().top;
    let bottom = 0;
    s.querySelectorAll('*').forEach(el => { if (el.closest('aside.notes')) return; const r = el.getBoundingClientRect(); if (r.height > 0) bottom = Math.max(bottom, r.bottom); });
    const h = (bottom - top) / scale;
    const small = new Set();
    s.querySelectorAll('p, li, span, td, th, button, label, code, div, text').forEach(el => {
      if (el.closest('aside.notes') || el.closest('.katex')) return;
      const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!own) return;
      let px = parseFloat(getComputedStyle(el).fontSize);
      if (el instanceof SVGElement) { const svg = el.ownerSVGElement; px = px * svg.getBoundingClientRect().width / svg.viewBox.baseVal.width / scale; }
      if (px < minPx) small.add(`${px.toFixed(1)}px:"${el.textContent.trim().slice(0, 28)}"`);
    });
    // horizontal overflow: math wider than its column / card / slide (equations cannot wrap)
    const wide = [];
    s.querySelectorAll('.katex').forEach(k => {
      if (k.closest('aside.notes') || k.parentElement.closest('.katex')) return;
      const box = (k.closest('.column, .card, .callout, .quiz, .readout, .tip-panel, .item') || s).getBoundingClientRect();
      // the .katex block is as wide as its container; measure the rendered glyph boxes instead
      let L = Infinity, R = -Infinity;
      // skip KaTeX's clipped helper SVGs (sqrt tails, stretchy arrows), which are huge but invisible
      k.querySelectorAll('.katex-html *').forEach(b => { if (b.closest('.hide-tail, svg, .svg-align, .stretchy')) return; const r = b.getBoundingClientRect(); if (r.width > 0) { L = Math.min(L, r.left); R = Math.max(R, r.right); } });
      if (R > box.right + 3 || L < box.left - 3) wide.push(k.textContent.slice(0, 30));
    });
    s.querySelectorAll('.explain').forEach(e => e.classList.remove('show'));
    s.querySelectorAll('.reveal-box').forEach(e => e.classList.remove('open'));
    const title = (s.querySelector('h1,h2')?.textContent || '').slice(0, 45);
    if (h > H - 50 || small.size || wide.length) report.push({ i, title, height: Math.round(h), overflow: h > H - 50, small: [...small].slice(0, 6), wide: wide.slice(0, 3) });
  }
  Reveal.slide(0);
  return report;
};
