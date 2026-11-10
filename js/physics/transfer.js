// 傳遞矩陣（報告第 5 章）：每一層一個 2×2，整段結構就是連乘
import { ME, kf } from './constants.js';

// 一層：把 (ψ, ψ') 從左推到右。E > V 用 cos、sin；E < V 用 cosh、sinh，兩種 det 都是 1
export function layer(E, V, d, m = ME) {
  const q = E - V;
  if (Math.abs(q) < 1e-12) return [1, d, 0, 1];
  if (q > 0) {
    const k = kf(m) * Math.sqrt(q), c = Math.cos(k * d), s = Math.sin(k * d);
    return [c, s / k, -k * s, c];
  }
  const k = kf(m) * Math.sqrt(-q), c = Math.cosh(k * d), s = Math.sinh(k * d);
  return [c, s / k, k * s, c];
}

// 2×2 相乘，矩陣存成 [a, b, c, d] = [[a, b], [c, d]]
export const mul = (A, B) => [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3],
                              A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]];

export const det = M => M[0] * M[3] - M[1] * M[2];

// 整段 M = P_N ⋯ P_1（先碰到的那層乘在最右邊）
export function total(E, stack, m = ME) {
  let M = [1, 0, 0, 1];
  for (const [V, d] of stack) M = mul(layer(E, V, d, m), M);
  return M;
}

// 穿透率：外面 V = 0、波數 k；det M = 1 時 T = 4 / [(M11 + M22)² + (k M12 − M21 / k)²]
export function trans(E, stack, m = ME) {
  const k = kf(m) * Math.sqrt(E), M = total(E, stack, m);
  const a = M[0] + M[3], b = k * M[1] - M[2] / k;
  return 4 / (a * a + b * b);
}

// nb 道位障、nb − 1 個井；每一層寫成 [位能 eV, 寬度 nm]
export function barriers(v0, b, w, nb) {
  const s = [];
  for (let i = 0; i < nb; i++) {
    s.push([v0, b]);
    if (i < nb - 1) s.push([0, w]);
  }
  return s;
}

// 在 [lo, hi] 裡找 T 的最高點：每輪取 120 點、留下最高點左右各兩格再細分。
// 窄尖峰在 log T 上是一個往下開的漏斗，粗格點的最高點一定落在漏斗裡，所以一路縮小就找得到
export function peakNear(stack, lo, hi, m = ME, rounds = 7, n = 120) {
  let best = lo, dx = 0;
  for (let round = 0; round < rounds; round++) {
    dx = (hi - lo) / n;
    let bt = -1;
    for (let i = 0; i <= n; i++) {
      const e = lo + i * dx, t = trans(e, stack, m);
      if (t > bt) { bt = t; best = e; }
    }
    lo = Math.max(lo, best - 2 * dx); hi = best + 2 * dx;
  }
  // 是不是真的尖峰：左右各踏一小步（可以踏出窗口），兩邊都比較低才算。
  // T 在窗口裡單調時，最高點只是窗口的邊，踏出去會更高
  const T = trans(best, stack, m), d = Math.max(dx, 1e-9);
  return T > trans(best - d, stack, m) && T > trans(best + d, stack, m) ? { E: best, T } : null;
}

// |det M − 1| 和 M 的大小一起看：元素到 1e13 時，ad − bc 相減會把小數位消光
export function detCheck(M) {
  const big = Math.max(...M.map(Math.abs));
  return { det: det(M), big, rel: Math.abs(det(M) - 1) / (big * big) };
}
