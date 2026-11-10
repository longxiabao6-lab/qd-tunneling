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
