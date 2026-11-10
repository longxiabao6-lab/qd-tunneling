// 分頁一：共振穿隧。上面畫位能與能階，下面畫 T(E)，右邊列特徵值對尖峰
import { barriers, total, trans, peakNear, detCheck } from '../physics/transfer.js';
import { stackLevels } from '../physics/tridiag.js';
import { setup, axes, ticks, token, levelColors, vline, hline, dataX, clip, pow10 } from '../ui/plot.js';
import { $, slider, segmented, frame } from '../ui/controls.js';

const st = { v0: 0.56, b: 2, w: 5, nb: 2, hover: null };
const f3 = x => x.toFixed(3);
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const lam = i => 'λ' + String(i + 1).replace(/./g, d => SUB[d]);

// 參數一變才重算的東西（能階、尖峰、整條曲線）；滑過圖只改游標，不重算
let cache = null;
function compute() {
  const { v0, b, w, nb } = st, stack = barriers(v0, b, w, nb), lev = stackLevels(stack, v0);
  const emax = v0 * 1.25, n = 1400, E = [], T = [];
  for (let i = 1; i <= n; i++) { E.push(emax * i / n); T.push(trans(E[i - 1], stack)); }
  // 每個特徵值左右找尖峰，範圍不超過到相鄰特徵值的一半，也不超過 0.03 eV
  const pk = lev.map((e, i) => {
    const left = i ? (e - lev[i - 1]) / 2 : 0.03, right = i < lev.length - 1 ? (lev[i + 1] - e) / 2 : 0.03;
    const p = peakNear(stack, Math.max(1e-4, e - Math.min(0.03, left)), e + Math.min(0.03, right));
    return p.T > 0.5 ? p : null;
  });
  // 縱軸下限：曲線最低點往下取到 10 的偶數次方，最低畫到 10⁻³⁰
  const lowest = Math.min(...T.filter(t => t > 0));
  const ymin = Math.max(1e-30, Math.min(1e-6, Math.pow(10, 2 * Math.floor(Math.log10(lowest) / 2))));
  cache = { stack, lev, pk, E, T, emax, ymin };
}

function drawPlots() {
  const { stack, lev, pk, E, T, emax, ymin } = cache, col = levelColors();
  const color = i => col[i % col.length];
  const L = stack.reduce((a, s) => a + s[1], 0);

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

  // 下：T(E)，縱軸取對數，虛線是上面的能階，圓點是找到的尖峰
  const c2 = setup($('c-trans'));
  const dec = Math.round(-Math.log10(ymin)), step = Math.max(2, 2 * Math.ceil(dec / 8));
  const yt = []; for (let k = 0; k <= dec; k += step) yt.push(Math.pow(10, -k));
  const a2 = axes(c2, { x: [0, emax], y: [ymin, 1.5], log: true, xt: ticks(0, emax, 5), yt,
    xl: '能量 E（eV）', yl: '穿透率 T', xf: t => t.toFixed(2), yf: pow10 });
  c2.g.setLineDash([5, 4]); c2.g.lineWidth = 1.2;
  lev.forEach((e, i) => { c2.g.strokeStyle = color(i); vline(c2.g, a2.X(e), a2.Y(1.5), a2.Y(ymin)); });
  c2.g.setLineDash([]);
  clip(c2);
  c2.g.strokeStyle = token('--line'); c2.g.lineWidth = 1.6; c2.g.beginPath();
  E.forEach((e, i) => (i ? c2.g.lineTo(a2.X(e), a2.Y(T[i])) : c2.g.moveTo(a2.X(e), a2.Y(T[i]))));
  c2.g.stroke();
  c2.g.restore();
  pk.forEach((p, i) => {
    if (!p) return;
    c2.g.fillStyle = color(i); c2.g.beginPath(); c2.g.arc(a2.X(p.E), a2.Y(p.T), 3, 0, 2 * Math.PI); c2.g.fill();
  });
  if (st.hover !== null) {
    const e = st.hover, t = trans(e, stack), right = a2.X(e) > c2.w * 0.7;
    c2.g.fillStyle = token('--ink'); c2.g.beginPath(); c2.g.arc(a2.X(e), a2.Y(Math.max(t, ymin)), 3.5, 0, 2 * Math.PI); c2.g.fill();
    c2.g.textAlign = right ? 'right' : 'left'; c2.g.textBaseline = 'bottom';
    c2.g.fillText(`E = ${f3(e)} eV　T = ${t < 1e-3 ? t.toExponential(1) : t.toFixed(3)}`, a2.X(e) + (right ? -8 : 8), a2.Y(Math.max(t, ymin)) - 6);
  }
  const found = pk.filter(Boolean).map(p => f3(p.E));
  $('c-trans').setAttribute('aria-label', `穿透率對能量的曲線，T = 1 的尖峰在 ${found.join('、') || '（沒有）'} eV`);
}

function drawSide() {
  const { v0, nb } = st, { stack, lev, pk } = cache, col = levelColors();
  // 位障三道以上：能階會一組一組靠在一起，組和組之間畫一條線
  const gaps = lev.slice(1).map((e, i) => e - lev[i]), small = Math.min(...gaps);
  const newGroup = i => nb > 2 && i > 0 && gaps[i - 1] > 2.5 * small;
  const miss = [];
  const rows = lev.map((e, i) => {
    const p = pk[i];
    if (!p) miss.push(i);
    return `<tr${newGroup(i) ? ' class="grp"' : ''}><td><span class="sw" style="background:${col[i % col.length]}"></span>${lam(i)}</td>`
      + `<td>${f3(e)}</td><td>${p ? f3(p.E) : '—'}</td></tr>`;
  }).join('');
  $('r-tunnel').innerHTML = `<thead><tr><th>能階</th><th>三對角特徵值</th><th>T 的尖峰</th></tr></thead>`
    + `<tbody>${rows || '<tr><td colspan="3">這個結構沒有束縛態</td></tr>'}</tbody>`;

  const e0 = st.hover ?? 0.1, M = total(e0, stack), d = detCheck(M);
  let note = `整段矩陣 M 是 ${stack.length} 個 2×2 相乘。`;
  note += d.big < 1e4
    ? `在 E = ${f3(e0)} eV，det M = ${d.det.toFixed(9)}。`
    : `在 E = ${f3(e0)} eV，M 的元素大到 ${d.big.toExponential(1)}，ad − bc 相減時小數位被消光，算出來的 det M 不可靠；`
      + `|det M − 1| 和 M² 相比只有 ${d.rel.toExponential(0)}，仍在浮點誤差內。每一層的 det 都是 1，乘積在理論上也是 1。`;
  if (nb > 2) note += `${nb} 道位障有 ${nb - 1} 個井，每個能階分裂成 ${nb - 1} 個。`;
  if (miss.length) {
    const top = miss.filter(i => lev[i] > v0 - 0.06), other = miss.filter(i => lev[i] <= v0 - 0.06);
    if (top.length) note += `${top.map(lam).join('、')} 貼近位障頂，共振峰很寬又偏高，0.03 eV 內找不到 T = 1 的尖峰。`;
    if (other.length) note += small < 2e-4
      ? `${other.map(lam).join('、')} 沒有配到尖峰：能階彼此只差 ${small.toExponential(0)} eV，和三對角矩陣格距 0.01 nm 的誤差同一量級，尖峰無法一一配對。`
      : `${other.map(lam).join('、')} 附近找不到 T = 1 的尖峰。`;
  }
  $('n-det').textContent = note;
}

export function draw() {
  if (!cache) compute();
  drawPlots();
  drawSide();
}
const redraw = frame(() => { compute(); draw(); });
const hoverDraw = frame(() => { drawPlots(); drawSide(); });

export function init() {
  slider('s-v0', 'o-v0', v => v.toFixed(2) + ' eV', v => { st.v0 = v; redraw(); });
  slider('s-b', 'o-b', v => v.toFixed(2) + ' nm', v => { st.b = v; redraw(); });
  slider('s-w', 'o-w', v => v.toFixed(1) + ' nm', v => { st.w = v; redraw(); });
  segmented('g-nb', v => { st.nb = +v; redraw(); });
  const cv = $('c-trans');
  const read = e => {
    const E = dataX(e, cv, 0, cache.emax);
    st.hover = E > 1e-4 && E < cache.emax ? E : null;
    hoverDraw();
  };
  // 滑鼠：滑過就讀、離開就清掉。手指：點一下或拖過去，讀數留在圖上
  cv.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) read(e); });
  cv.addEventListener('pointerdown', read);
  cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { st.hover = null; hoverDraw(); } });
}
