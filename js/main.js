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

let timer;
window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(() => VIEWS[t.current()].draw(), 120); });
document.fonts?.ready.then(() => VIEWS[t.current()].draw());   // 字型載入後再畫一次，刻度字才對
