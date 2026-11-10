// 分頁二：能階。可以在圖上拖曳改位能，H 的特徵值畫成能階、特徵向量畫成波函數
import { levels, vec } from '../physics/tridiag.js';
import { setup, axes, ticks, token, levelColors, hline, dataX, dataY } from '../ui/plot.js';
import { $, segmented } from '../ui/controls.js';

const LEN = 12, N = 240, H = LEN / (N + 1), VMAX = 0.6;    // 12 nm、240 個格點
const V = new Float64Array(N);
const xs = i => (i + 1) * H;
let shapes, last = null, dragging = false;

const PRESETS = {
  box:    x => (Math.abs(x - LEN / 2) < 2.5 ? 0 : 0.5),
  para:   x => Math.min(VMAX, 0.5 * ((x - LEN / 2) / 4) ** 2),
  double: x => { const r = Math.abs(x - LEN / 2); return r < 0.5 ? 0.3 : r < 3 ? 0 : 0.5; },
  step:   x => (Math.abs(x - LEN / 2) > 3 ? 0.5 : x < LEN / 2 ? 0 : 0.15),
};

function preset(name) {
  for (let i = 0; i < N; i++) V[i] = PRESETS[name](xs(i));
  draw();
}

export function draw() {
  // 只算束縛態：能量要低於井外（兩端）的位能，電子才出不去
  const top = Math.min(V[0], V[N - 1]);
  const col = levelColors(), { E, d, e } = levels(Array.from(V), H, top - 1e-6, 6);
  const vs = E.map(l => vec(d, e, l));
  const c = setup($('c-draw')), g = c.g;
  const a = axes(c, { x: [0, LEN], y: [0, VMAX], xt: ticks(0, LEN, 6), yt: ticks(0, VMAX, 6),
    xl: '位置（nm）', yl: '能量（eV）', yf: t => t.toFixed(1) });

  g.fillStyle = token('--barrier'); g.beginPath(); g.moveTo(a.X(0), a.Y(0));
  for (let i = 0; i < N; i++) g.lineTo(a.X(xs(i)), a.Y(V[i]));
  g.lineTo(a.X(LEN), a.Y(0)); g.closePath(); g.fill();

  // 每個能階：淡虛線標能量，曲線是特徵向量（最大的分量畫成 0.04 eV 高）
  E.forEach((l, k) => {
    const v = vs[k], big = v.reduce((m, x) => (Math.abs(x) > Math.abs(m) ? x : m), 0), s = 0.04 / big;
    g.strokeStyle = col[Math.min(k, 3)];
    g.globalAlpha = 0.35; g.lineWidth = 1; g.setLineDash([5, 4]);
    hline(g, a.Y(l), a.X(0), a.X(LEN));
    g.globalAlpha = 1; g.lineWidth = 1.8; g.setLineDash([]); g.beginPath();
    for (let i = 0; i < N; i++) (i ? g.lineTo : g.moveTo).call(g, a.X(xs(i)), a.Y(l + s * v[i]));
    g.stroke();
  });

  // 正交性：兩兩內積最大的那個
  let worst = 0;
  for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) {
    let s = 0;
    for (let k = 0; k < N; k++) s += vs[i][k] * vs[j][k];
    worst = Math.max(worst, Math.abs(s));
  }
  $('r-levels').innerHTML = `<thead><tr><th>能階</th><th>特徵值（eV）</th></tr></thead><tbody>${E.map((l, k) =>
    `<tr><td><span class="sw" style="background:${col[Math.min(k, 3)]}"></span>λ<sub>${k + 1}</sub></td><td>${l.toFixed(3)}</td></tr>`).join('')
    || `<tr><td colspan="2">沒有低於井外位能 ${top.toFixed(2)} eV 的能階</td></tr>`}</tbody>`;
  $('n-orth').textContent = `H 是 ${N}×${N} 的對稱三對角矩陣，所以特徵值都是實數、特徵向量互相垂直：兩兩內積最大 ${worst.toExponential(1)}。`;
}

// 拖曳：兩次事件之間的格點用直線補起來，畫得快也不會斷
function paint(ev) {
  const cv = $('c-draw');
  const i = Math.round(dataX(ev, cv, 0, LEN) / H) - 1, v = Math.max(0, Math.min(VMAX, dataY(ev, cv, 0, VMAX)));
  const [j0, v0] = last ?? [i, v];
  for (let k = Math.min(i, j0); k <= Math.max(i, j0); k++) {
    if (k >= 0 && k < N) V[k] = i === j0 ? v : v0 + (v - v0) * (k - j0) / (i - j0);
  }
  last = [i, v];
  shapes.clear();
  draw();
}

export function init() {
  shapes = segmented('g-shape', preset);
  const cv = $('c-draw');
  cv.addEventListener('pointerdown', e => { dragging = true; last = null; cv.setPointerCapture(e.pointerId); paint(e); });
  cv.addEventListener('pointermove', e => { if (dragging) paint(e); });
  cv.addEventListener('pointerup', () => { dragging = false; last = null; });
  for (let i = 0; i < N; i++) V[i] = PRESETS.box(xs(i));
}
