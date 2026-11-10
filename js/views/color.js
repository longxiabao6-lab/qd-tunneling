// 分頁三：顏色。拉桿調 CdSe 量子點直徑，顯示發光顏色、光譜位置與能量拆解
import { photon, rgb } from '../physics/color.js';
import { EG } from '../physics/constants.js';
import { setup, token } from '../ui/plot.js';
import { $, slider } from '../ui/controls.js';

let D = 5;
const f3 = x => x.toFixed(3);
const SPEC = [420, 720];                       // 光譜條的範圍（nm）
const sx = (nm, w) => (nm - SPEC[0]) / (SPEC[1] - SPEC[0]) * w;

export function draw() {
  const p = photon(D);

  // 量子點：暗底上的光點，半徑照直徑比例
  const c = setup($('c-dot')), { g, w, h } = c;
  g.fillStyle = '#16181d'; g.fillRect(0, 0, w, h);
  if (p) {
    const r = D / 8 * h * 0.36, cx = w / 2, cy = h / 2, col = rgb(p.nm);
    const halo = g.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.6);
    halo.addColorStop(0, col);
    halo.addColorStop(0.35, col.replace('rgb', 'rgba').replace(')', ', 0.45)'));
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = halo; g.beginPath(); g.arc(cx, cy, r * 2.6, 0, 2 * Math.PI); g.fill();
    g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r, 0, 2 * Math.PI); g.fill();
  }

  // 光譜條與目前波長的指標
  const s = setup($('c-spec'));
  for (let x = 0; x < s.w; x++) { s.g.fillStyle = rgb(SPEC[0] + (SPEC[1] - SPEC[0]) * x / s.w); s.g.fillRect(x, 8, 1, 26); }
  s.g.fillStyle = token('--muted'); s.g.textBaseline = 'top'; s.g.textAlign = 'center';
  for (const nm of [450, 500, 550, 600, 650, 700]) s.g.fillText(nm, sx(nm, s.w), 40);
  if (p) {
    const x = sx(p.nm, s.w);
    s.g.fillStyle = token('--ink');
    s.g.beginPath(); s.g.moveTo(x, 6); s.g.lineTo(x - 6, 0); s.g.lineTo(x + 6, 0); s.g.fill();
    s.g.fillRect(x - 1, 6, 2, 30);
  }

  $('r-color').innerHTML = p
    ? `<tbody><tr class="big"><td>${p.nm.toFixed(0)} nm</td><td>${f3(p.E)} eV</td></tr>
       <tr><td>能隙</td><td>${f3(EG)}</td></tr>
       <tr><td>電子最小特徵值</td><td>+ ${f3(p.ee)}</td></tr>
       <tr><td>電洞最小特徵值</td><td>+ ${f3(p.eh)}</td></tr>
       <tr><td>庫侖吸引</td><td>− ${f3(p.c)}</td></tr></tbody>`
    : '<tbody><tr><td>直徑太小，電子沒有束縛態</td></tr></tbody>';
}

export function init() {
  slider('s-d', 'o-d', v => v.toFixed(2) + ' nm', v => { D = v; draw(); });
}
