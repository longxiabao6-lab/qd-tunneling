// 對稱三對角矩陣 H = t·K + diag(V)（報告第 2 章）的特徵值與特徵向量
import { ME, hop } from './constants.js';

// 有幾個特徵值小於 x：對 H − xI 做 LDLᵀ，負的主元有幾個就是答案（Sturm 數列）
export function below(d, e, x) {
  let n = 0, p = d[0] - x;
  if (p < 0) n++;
  for (let i = 1; i < d.length; i++) {
    p = d[i] - x - e[i - 1] * e[i - 1] / (p === 0 ? 1e-300 : p);
    if (p < 0) n++;
  }
  return n;
}

// 第 j 小的特徵值（j 從 0 起），在 [lo, hi] 裡二分，夾到 1e-13 eV 就停
export function eig(d, e, j, lo, hi) {
  for (let it = 0; it < 80 && hi - lo > 1e-13; it++) {
    const mid = (lo + hi) / 2;
    if (below(d, e, mid) > j) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

// 反冪法：解 (H − λI) x = b 兩三次就收斂到特徵向量；三對角用追趕法（Thomas）
export function vec(d, e, lam) {
  const n = d.length, x = new Float64Array(n).fill(1), c = new Float64Array(n), y = new Float64Array(n);
  for (let it = 0; it < 3; it++) {
    let p = d[0] - lam + 1e-10;
    c[0] = e[0] / p; y[0] = x[0] / p;
    for (let i = 1; i < n; i++) {
      p = d[i] - lam + 1e-10 - e[i - 1] * c[i - 1];
      c[i] = i < n - 1 ? e[i] / p : 0;
      y[i] = (x[i] - e[i - 1] * y[i - 1]) / p;
    }
    x[n - 1] = y[n - 1];
    for (let i = n - 2; i >= 0; i--) x[i] = y[i] - c[i] * x[i + 1];
    let s = 0;
    for (let i = 0; i < n; i++) s += x[i] * x[i];
    s = Math.sqrt(s);
    for (let i = 0; i < n; i++) x[i] /= s;
  }
  return x;
}

// 每個格點一個位能 V（eV）→ 對角線 d、對角線外 e
export function hamil(V, h, m = ME) {
  const t = hop(h, m);
  return { d: Float64Array.from(V, v => 2 * t + v), e: new Float64Array(V.length - 1).fill(-t), t };
}

// 低於 vmax 的能階，最多 k 個
export function levels(V, h, vmax, k = 6, m = ME) {
  const { d, e, t } = hamil(V, h, m);
  const lo = Math.min(...V), n = Math.min(below(d, e, vmax), k), E = [];
  // 只要 vmax 以下的能階，上界取 vmax 就夠；下界從上一個能階開始，區間越來越小
  for (let j = 0; j < n; j++) E.push(eig(d, e, j, j ? E[j - 1] : lo, vmax));
  return { E, d, e, t };
}

// 傳遞矩陣那頁的結構放進三對角矩陣：兩端再接 out nm 的位障，最外面 ψ = 0
export function stackLevels(stack, v0, h = 0.01, out = 16) {   // 外牆要離夠遠：λ3 在位障裡衰減長度約 3 nm，8 nm 會偏高 4e-4 eV
  const L = stack.reduce((a, s) => a + s[1], 0), V = [];
  for (let x = -out + h; x < L + out - h / 2; x += h) {
    if (x < 0 || x >= L) { V.push(v0); continue; }
    let acc = 0;
    for (const [v, w] of stack) {
      if (x < acc + w) { V.push(v); break; }
      acc += w;
    }
  }
  return levels(V, h, v0 - 1e-6, 40).E;            // 位障多時能階也多，全部列出來才不會配錯
}
