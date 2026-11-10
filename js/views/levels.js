// 分頁二：能階。可以在圖上拖曳改位能，H 的特徵值畫成能階、特徵向量畫成波函數
import { levels, vec } from '../physics/tridiag.js';
import { setup, axes, ticks, token, levelColors, hline, dataX, dataY } from '../ui/plot.js';
import { $, segmented, frame } from '../ui/controls.js';

const LEN = 20, N = 800, H = LEN / (N + 1), VMAX = 0.6;    // 20 nm、800 個格點：井外留夠長，λ3 才不會被兩端的牆推高
const V = new Float64Array(N);
const xs = i => (i + 1) * H;
let shapes, last = null, dragging = false;

// 位障高都取 0.56 eV，和第一頁、報告 4.3 節一樣；方井寬 5 nm 也和第一頁一樣
const V0 = 0.56;
const PRESETS = {
  box:    x => (Math.abs(x - LEN / 2) < 2.5 ? 0 : V0),
  para:   x => Math.min(VMAX, V0 * ((x - LEN / 2) / 4) ** 2),
  double: x => { const r = Math.abs(x - LEN / 2); return r < 0.5 ? 0.3 : r < 3 ? 0 : V0; },
  step:   x => (Math.abs(x - LEN / 2) > 3 ? V0 : x < LEN / 2 ? 0 : 0.15),
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
    g.strokeStyle = col[k % col.length];
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
    `<tr><td><span class="sw" style="background:${col[k % col.length]}"></span>λ<sub>${k + 1}</sub></td><td>${l.toFixed(3)}</td></tr>`).join('')
    || `<tr><td colspan="2">沒有低於井外位能 ${top.toFixed(2)} eV 的能階</td></tr>`}</tbody>`;
  $('n-orth').textContent = `H 是 ${N}×${N} 的對稱三對角矩陣（格距 ${H.toFixed(3)} nm），所以特徵值都是實數、特徵向量互相垂直`
    + (vs.length > 1 ? `：兩兩內積最大 ${worst.toExponential(1)}。` : '。至少要有兩個能階才能比較內積。');
  $('c-draw').setAttribute('aria-label', `位能井與特徵向量，${E.length} 個能階：${E.map(l => l.toFixed(3)).join('、')} eV`);
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
  later();
}
const later = frame(() => draw());

export function init() {
  shapes = segmented('g-shape', preset);
  const cv = $('c-draw'), edit = $('b-edit');
  // 手指：要先按「用手指畫井」，不然在圖上滑動是捲頁面；滑鼠一律可以畫
  edit.addEventListener('click', () => {
    const on = edit.getAttribute('aria-pressed') !== 'true';
    edit.setAttribute('aria-pressed', on);
    edit.textContent = on ? '畫好了，恢復捲動' : '用手指畫井';
    cv.classList.toggle('editing', on);
  });
  const stop = () => { dragging = false; last = null; };
  cv.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' && !cv.classList.contains('editing')) return;
    dragging = true; last = null; cv.setPointerCapture(e.pointerId); paint(e);
  });
  cv.addEventListener('pointermove', e => { if (dragging) paint(e); });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) cv.addEventListener(ev, stop);
  for (let i = 0; i < N; i++) V[i] = PRESETS.box(xs(i));
}
