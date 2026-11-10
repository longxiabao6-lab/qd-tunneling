// 對答案：網頁的計算要和報告的 Python（code/act9_tunneling.py、act8_optics.py）一樣
// 執行：cd web && npm test
import { readFileSync } from 'fs';
import { barriers, total, trans, det } from '../js/physics/transfer.js';
import { levels } from '../js/physics/tridiag.js';
import { photon } from '../js/physics/color.js';

const ref = JSON.parse(readFileSync(new URL('./check.json', import.meta.url)));
let bad = 0;
function near(a, b, tol, what) {
  const ok = Math.abs(a - b) <= tol;
  if (!ok) bad++;
  console.log(ok ? 'ok' : 'NG', what.padEnd(16), a.toPrecision(7), b.toPrecision(7));
}

// 一、穿透率與 det M = 1
const st = barriers(ref.V0, ref.b, ref.w, 2);
for (const [e, t] of Object.entries(ref.T_at)) near(trans(+e, st), t, 1e-6 * t, `T(${e})`);
let worst = 0;
for (let e = 0.01; e < 0.55; e += 0.01) worst = Math.max(worst, Math.abs(det(total(e, st)) - 1));
near(worst, 0, 1e-9, 'max |det M − 1|');

// 二、同一個井的三對角特徵值（Python 用格距 0.005 nm、兩邊各 8 nm）
const h = 0.005, V = [];
for (let x = -8 + h; x < ref.w + 8 - h / 2; x += h) V.push(x > 0 && x < ref.w ? 0 : ref.V0);
levels(V, h, ref.V0 - 1e-6).E.forEach((l, i) => near(l, ref.levels[i], 1e-4, `λ${i + 1}`));

// 三、顏色：直徑 3、5、7 nm（act8_optics.py 算出 541.6、618.0、658.1 nm）
[[3, 541.6], [5, 618.0], [7, 658.1]].forEach(([D, nm]) => near(photon(D).nm, nm, 0.15, `波長（${D} nm）`));

console.log(bad ? `${bad} 項不對` : '全部對上');
process.exit(bad ? 1 : 0);
