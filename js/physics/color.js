// 量子點的發光顏色（報告 4.3 節）：球形有限井的最小特徵值
import { EG, ME, MH, EPS, HC, COUL, V0 } from './constants.js';
import { hamil, below, eig } from './tridiag.js';

// u = rψ 的徑向方程，井內 0、井外 v0，盒外再留 out nm 才設 u = 0（同 act8_optics.py）
export function sphere(R, m, v0 = V0, out = 8, h = 0.01) {
  const n = Math.round((R + out) / h) - 1, V = new Float64Array(n);
  for (let i = 0; i < n; i++) V[i] = (i + 1) * h > R ? v0 : 0;
  const { d, e } = hamil(V, h, m);
  if (below(d, e, v0) === 0) return null;          // 沒有束縛態
  return eig(d, e, 0, 0, v0);
}

// 發光能量 = 能隙 + 電子侷限能 + 電洞侷限能 − 庫侖吸引；回傳各項與波長
export function photon(D, v0 = V0) {
  const R = D / 2, ee = sphere(R, ME, v0), eh = sphere(R, MH, v0);
  if (ee === null || eh === null) return null;
  const c = 1.8 * COUL / (EPS * R), E = EG + ee + eh - c;
  return { E, ee, eh, c, nm: HC / E };
}

// 波長 → 螢幕上的顏色，只是顯示用的近似；報告的色度照 CIE 1931 算
export function rgb(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else r = 1;
  const f = nm > 700 ? 0.3 + 0.7 * (780 - nm) / 80 : nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : 1;
  const ch = x => Math.round(255 * Math.pow(Math.max(0, Math.min(1, x * f)), 0.8));
  return `rgb(${ch(r)}, ${ch(g)}, ${ch(b)})`;
}
