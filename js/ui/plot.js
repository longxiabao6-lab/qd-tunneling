// 畫圖工具：畫布設定、座標軸、刻度。三個分頁共用
export const token = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
export const levelColors = () => ['--l1', '--l2', '--l3', '--l4'].map(token);
export const PAD = { L: 54, R: 14, T: 12, B: 36 };

// 依螢幕密度放大畫布，回傳 ctx 與 CSS 寬高
export function setup(cv) {
  // 第一次記下 HTML 寫的高度；之後 cv.height 會改成乘過密度的值，不能再拿來用
  if (!cv.dataset.h) cv.dataset.h = cv.getAttribute('height');
  const r = window.devicePixelRatio || 1, w = cv.clientWidth, h = +cv.dataset.h;
  cv.width = w * r; cv.height = h * r; cv.style.height = h + 'px';
  const g = cv.getContext('2d');
  g.setTransform(r, 0, 0, r, 0, 0);
  g.clearRect(0, 0, w, h);
  g.font = '12px "Noto Sans TC", sans-serif';
  return { g, w, h };
}

// 好讀的刻度：間距取 1、2、2.5、5 乘 10 的次方
export function ticks(a, b, n) {
  const raw = (b - a) / n, p = Math.pow(10, Math.floor(Math.log10(raw)));
  const s = [1, 2, 2.5, 5, 10].map(k => k * p).find(k => k >= raw), out = [];
  for (let t = Math.ceil(a / s) * s; t <= b + 1e-9; t += s) out.push(+t.toFixed(10));
  return out;
}

// 座標軸與格線；o.log 時 y 用 10 的次方。回傳座標換算 X、Y
export function axes(c, o) {
  const { g, w, h } = c, { L, R, T, B } = PAD;
  const ly = y => (o.log ? Math.log10(Math.max(y, 1e-30)) : y);
  const X = x => L + (x - o.x[0]) / (o.x[1] - o.x[0]) * (w - L - R);
  const Y = y => h - B - (ly(y) - ly(o.y[0])) / (ly(o.y[1]) - ly(o.y[0])) * (h - T - B);
  g.strokeStyle = token('--rule'); g.fillStyle = token('--muted'); g.lineWidth = 1;
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (const t of o.xt) {
    g.beginPath(); g.moveTo(X(t), T); g.lineTo(X(t), h - B); g.stroke();
    g.fillText(o.xf ? o.xf(t) : t, X(t), h - B + 6);
  }
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (const t of o.yt) {
    g.beginPath(); g.moveTo(L, Y(t)); g.lineTo(w - R, Y(t)); g.stroke();
    g.fillText(o.yf ? o.yf(t) : t, L - 6, Math.min(Y(t), h - B - 7));   // 最底下那個往上挪，免得和 x 的第一個刻度疊在一起
  }
  g.textAlign = 'center'; g.textBaseline = 'bottom';
  g.fillText(o.xl, (L + w - R) / 2, h - 2);
  g.save(); g.translate(13, (T + h - B) / 2); g.rotate(-Math.PI / 2); g.fillText(o.yl, 0, 0); g.restore();
  return { X, Y };
}

// 只在繪圖區內畫（曲線超出範圍時不會畫到刻度上）
export function clip(c) {
  const { L, R, T, B } = PAD;
  c.g.save(); c.g.beginPath(); c.g.rect(L, T, c.w - L - R, c.h - T - B); c.g.clip();
}

// 從滑鼠位置換回資料座標（x 方向）
export function dataX(e, cv, x0, x1) {
  const r = cv.getBoundingClientRect();
  return x0 + (e.clientX - r.left - PAD.L) / (r.width - PAD.L - PAD.R) * (x1 - x0);
}
export function dataY(e, cv, y0, y1) {
  const r = cv.getBoundingClientRect();
  return y0 + (1 - (e.clientY - r.top - PAD.T) / (r.height - PAD.T - PAD.B)) * (y1 - y0);
}

export const vline = (g, x, y0, y1) => { g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); };
export const hline = (g, y, x0, x1) => { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); };
