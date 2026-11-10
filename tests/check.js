// 對答案：網頁的計算要和報告的 Python（code/act9_tunneling.py、act8_optics.py）一樣
// 執行：cd web && npm test。每一行印出：項目、網頁、Python、差
import { readFileSync } from 'fs';
import { barriers, total, trans, det } from '../js/physics/transfer.js';
import { levels } from '../js/physics/tridiag.js';
import { photon } from '../js/physics/color.js';

const ref = JSON.parse(readFileSync(new URL('./check.json', import.meta.url)));
let bad = 0;
function near(a, b, tol, what, rel = false) {
  const d = Math.abs(a - b) / (rel ? Math.abs(b) : 1), ok = d <= tol;
  if (!ok) bad++;
  console.log(ok ? 'ok' : 'NG', what.padEnd(16), a.toPrecision(10), b.toPrecision(10), (rel ? '相對差 ' : '差 ') + d.toExponential(1));
}

// 一、穿透率（相對差）與 det M = 1
const st = barriers(ref.V0, ref.b, ref.w, 2);
for (const [e, t] of Object.entries(ref.T_at)) near(trans(+e, st), t, 1e-6, `T(${e})`, true);
let worst = 0, count = 0;
for (let e = 0.01; e < 0.55; e += 0.01, count++) worst = Math.max(worst, Math.abs(det(total(e, st)) - 1));
near(worst, 0, 1e-9, `|det M − 1|（${count} 個 E）`);

// 二、同一個井的三對角特徵值（Python 用格距 0.005 nm、井外各 16 nm）
const h = 0.005, out = 16, V = [];
for (let x = -out + h; x < ref.w + out - h / 2; x += h) V.push(x > 0 && x < ref.w ? 0 : ref.V0);
console.log(`三對角矩陣 ${V.length} 階`);
levels(V, h, ref.V0 - 1e-6).E.forEach((l, i) => near(l, ref.levels[i], 1e-8, `λ${i + 1}`));

// 三、顏色：直徑 3、5、7 nm，act8_optics.py 的有限井、V0 取 0.56 eV 時的波長（Python 印出的全部位數）
[[3, 541.586630879345], [5, 617.9821985670991], [7, 658.1392796535317]]
  .forEach(([D, nm]) => near(photon(D).nm, nm, 1e-3, `波長（${D} nm）`));

console.log(bad ? `${bad} 項不對` : '全部對上');
process.exit(bad ? 1 : 0);
