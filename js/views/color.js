// 分頁三：顏色。拉桿調 CdSe 量子點直徑，顯示發光顏色、光譜位置與能量拆解
import { photon, rgb } from '../physics/color.js';
import { EG } from '../physics/constants.js';
import { setup, token } from '../ui/plot.js';
import { $, slider, frame } from '../ui/controls.js';

let D = 3;
const f3 = x => x.toFixed(3);
const SPEC = [420, 720];                       // 光譜條的範圍（nm）
const sx = (nm, w) => (nm - SPEC[0]) / (SPEC[1] - SPEC[0]) * w;

export function draw() {
  const p = photon(D);

  // 量子點：暗底上的光點，半徑照直徑比例
  const c = setup($('c-dot')), { g, w, h } = c;
  g.fillStyle = '#16181d'; g.fillRect(0, 0, w, h);
  if (p) {
    const r = D / 8 * h * 0.3, cx = w / 2, cy = h / 2, col = rgb(p.nm), R = Math.min(r * 2.6, h / 2);   // 光暈不超出畫布
    const halo = g.createRadialGradient(cx, cy, r * 0.2, cx, cy, R);
    halo.addColorStop(0, col);
    halo.addColorStop(0.35, col.replace('rgb', 'rgba').replace(')', ', 0.45)'));
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = halo; g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.fill();
    g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r, 0, 2 * Math.PI); g.fill();
  } else {
    g.fillStyle = '#c9ced6'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('直徑太小，電子沒有束縛態', w / 2, h / 2);
  }
  $('c-dot').setAttribute('aria-label', p ? `直徑 ${D.toFixed(2)} nm 的量子點，吸收峰 ${p.nm.toFixed(0)} nm` : '直徑太小，沒有束縛態');

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
    ? `<thead><tr><th>第一激子吸收峰</th><th></th></tr></thead>
       <tbody><tr class="big"><td>${p.nm.toFixed(0)} nm</td><td>${f3(p.E)} eV</td></tr>
       <tr><td>能隙</td><td>${f3(EG)}</td></tr>
       <tr><td>電子在球裡的最小特徵值</td><td>+ ${f3(p.ee)}</td></tr>
       <tr><td>電洞在球裡的最小特徵值</td><td>+ ${f3(p.eh)}</td></tr>
       <tr><td>庫侖吸引</td><td>− ${f3(p.c)}</td></tr></tbody>`
    : '<tbody><tr><td>直徑太小，電子沒有束縛態</td></tr></tbody>';
}

export function init() {
  const later = frame(draw);
  slider('s-d', 'o-d', v => v.toFixed(2) + ' nm', v => { D = v; later(); });
}
