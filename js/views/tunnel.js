// 分頁一：共振穿隧。上面畫位能與能階，下面畫 T(E)，右邊列特徵值對尖峰
import { barriers, total, trans, det } from '../physics/transfer.js';
import { stackLevels } from '../physics/tridiag.js';
import { setup, axes, ticks, token, levelColors, vline, hline, dataX, clip } from '../ui/plot.js';
import { $, slider, segmented } from '../ui/controls.js';

const st = { v0: 0.56, b: 1.5, w: 5, nb: 2, hover: null };
const f3 = x => x.toFixed(3);
const sup = '⁰¹²³⁴⁵⁶';

// T(E) 粗掃：畫曲線用，順便找局部最高點當尖峰
function sweep(stack, emax, n = 1400) {
  const E = [], T = [], pk = [];
  for (let i = 1; i <= n; i++) { E.push(emax * i / n); T.push(trans(E[i - 1], stack)); }
  for (let i = 1; i < n - 1; i++) if (T[i] > T[i - 1] && T[i] >= T[i + 1] && T[i] > 0.05 && E[i] < st.v0) pk.push(E[i]);
  return { E, T, pk };
}

export function draw() {
  const { v0, b, w, nb } = st, stack = barriers(v0, b, w, nb), lev = stackLevels(stack, v0), col = levelColors();
  const L = stack.reduce((a, s) => a + s[1], 0), emax = v0 * 1.25, color = i => col[Math.min(i, 3)];

  // 上：位能（實心）與能階（只畫在井裡）
  const c1 = setup($('c-profile'));
  const a1 = axes(c1, { x: [-1.5, L + 1.5], y: [0, emax], xt: ticks(-1, L + 1, 6), yt: ticks(0, emax, 4),
    xl: '位置（nm）', yl: '能量（eV）', yf: t => t.toFixed(1) });
  let x = 0;
  for (const [V, d] of stack) {
    if (V > 0) { c1.g.fillStyle = token('--barrier'); c1.g.fillRect(a1.X(x), a1.Y(V), a1.X(x + d) - a1.X(x), a1.Y(0) - a1.Y(V)); }
    x += d;
  }
  lev.forEach((e, i) => {
    c1.g.strokeStyle = color(i); c1.g.lineWidth = 2;
    let x0 = 0;
    for (const [V, d] of stack) { if (V === 0) hline(c1.g, a1.Y(e), a1.X(x0), a1.X(x0 + d)); x0 += d; }
  });

  // 下：T(E)，縱軸取對數，虛線是上面的能階
  const c2 = setup($('c-trans'));
  const a2 = axes(c2, { x: [0, emax], y: [1e-6, 1.5], log: true, xt: ticks(0, emax, 5), yt: [1e-6, 1e-4, 1e-2, 1],
    xl: '能量 E（eV）', yl: '穿透率 T', xf: t => t.toFixed(2), yf: t => t === 1 ? '1' : '10⁻' + sup[-Math.log10(t)] });
  c2.g.setLineDash([5, 4]); c2.g.lineWidth = 1.2;
  lev.forEach((e, i) => { c2.g.strokeStyle = color(i); vline(c2.g, a2.X(e), a2.Y(1.5), a2.Y(1e-6)); });
  c2.g.setLineDash([]);
  const { E, T, pk } = sweep(stack, emax);
  clip(c2);
  c2.g.strokeStyle = token('--line'); c2.g.lineWidth = 1.6; c2.g.beginPath();
  E.forEach((e, i) => (i ? c2.g.lineTo(a2.X(e), a2.Y(T[i])) : c2.g.moveTo(a2.X(e), a2.Y(T[i]))));
  c2.g.stroke();
  c2.g.restore();
  if (st.hover !== null) {
    const e = st.hover, t = trans(e, stack), right = a2.X(e) > c2.w * 0.7;
    c2.g.fillStyle = token('--ink'); c2.g.beginPath(); c2.g.arc(a2.X(e), a2.Y(t), 3.5, 0, 2 * Math.PI); c2.g.fill();
    c2.g.textAlign = right ? 'right' : 'left'; c2.g.textBaseline = 'bottom';
    c2.g.fillText(`E = ${f3(e)} eV　T = ${t < 1e-3 ? t.toExponential(1) : t.toFixed(3)}`, a2.X(e) + (right ? -8 : 8), a2.Y(t) - 6);
  }

  // 右邊：每個特徵值配最近的尖峰，差太多（例如能階貼著位障頂）就不配
  let miss = [];
  const rows = lev.map((e, i) => {
    let p = pk.length ? pk.reduce((a, q) => (Math.abs(q - e) < Math.abs(a - e) ? q : a)) : NaN;
    if (Math.abs(p - e) > 0.03) { p = NaN; miss.push(`λ${'₁₂₃₄₅₆₇₈₉'[i] ?? i + 1}`); }
    return `<tr><td><span class="sw" style="background:${color(i)}"></span>λ<sub>${i + 1}</sub></td><td>${f3(e)}</td><td>${isNaN(p) ? '—' : f3(p)}</td></tr>`;
  }).join('');
  $('r-tunnel').innerHTML = `<thead><tr><th>能階</th><th>三對角特徵值</th><th>T 的尖峰</th></tr></thead>`
    + `<tbody>${rows || '<tr><td colspan="3">這個結構沒有束縛態</td></tr>'}</tbody>`;
  const e0 = st.hover ?? 0.1;
  $('n-det').textContent = `整段矩陣 M 是 ${stack.length} 個 2×2 相乘；在 E = ${f3(e0)} eV，det M = ${det(total(e0, stack)).toFixed(9)}。單位 eV，尖峰取粗掃的最高點。`
    + (miss.length ? `${miss.join('、')} 貼近位障頂，共振峰很寬，附近 0.03 eV 內找不到尖峰，所以不配對。` : '');
}

export function init() {
  slider('s-v0', 'o-v0', v => v.toFixed(2) + ' eV', v => { st.v0 = v; draw(); });
  slider('s-b', 'o-b', v => v.toFixed(2) + ' nm', v => { st.b = v; draw(); });
  slider('s-w', 'o-w', v => v.toFixed(1) + ' nm', v => { st.w = v; draw(); });
  segmented('g-nb', v => { st.nb = +v; draw(); });
  const cv = $('c-trans');
  cv.addEventListener('pointermove', e => {
    const emax = st.v0 * 1.25, E = dataX(e, cv, 0, emax);
    st.hover = E > 1e-4 && E < emax ? E : null;
    draw();
  });
  cv.addEventListener('pointerleave', () => { st.hover = null; draw(); });
}
