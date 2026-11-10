// 入口：接好三個分頁，視窗大小一變就重畫目前那頁
import * as tunnel from './views/tunnel.js';
import * as levels from './views/levels.js';
import * as color from './views/color.js';
import { tabs } from './ui/controls.js';

const VIEWS = { tunnel, levels, color };
const names = Object.keys(VIEWS);
names.forEach(n => VIEWS[n].init());
const t = tabs(names, Object.fromEntries(names.map(n => [n, VIEWS[n].draw])));

const start = location.hash.slice(1);
t.show(names.includes(start) ? start : 'tunnel');

// 手機上第一頁的圖黏在上方時，位能圖要捲走：往上偏移它自己的高度
function stickTop() {
  const box = document.querySelector('.stick-tunnel'), first = box.querySelector('figure');
  box.style.top = -(first.offsetHeight + parseFloat(getComputedStyle(first).marginBottom)) + 'px';
}
const redraw = () => { VIEWS[t.current()].draw(); stickTop(); };

let timer;
window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(redraw, 120); });
document.fonts?.ready.then(redraw);   // 字型載入後再畫一次，刻度字才對
