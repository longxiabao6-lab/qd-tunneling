// 分頁、分段按鈕、拉桿：只管互動，不管畫什麼
export const $ = id => document.getElementById(id);

// 一幀最多畫一次：拖曳時事件很多，合併起來等下一幀再畫
export function frame(fn) {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fn(); });
  };
}

// 一排按鈕用左右鍵移動（分頁和分段按鈕共用）：只有選中的那顆能用 Tab 進來
function arrows(buttons, pick) {
  buttons.forEach((b, i) => b.addEventListener('keydown', e => {
    const n = buttons.length;
    const j = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key];
    if (j === undefined) return;
    e.preventDefault();
    const t = buttons[(j + n) % n];
    t.focus();
    pick(t);
  }));
}
const mark = (buttons, on, attr) => buttons.forEach(x => {
  x.setAttribute(attr, x === on);
  x.tabIndex = x === on ? 0 : -1;
});

// 分頁：按鈕、方向鍵、網址 #名稱、上一頁都會切換；切到哪一頁就呼叫那一頁的 draw
export function tabs(names, views) {
  const btns = names.map(t => $('t-' + t));
  const show = name => {
    mark(btns, $('t-' + name), 'aria-selected');
    for (const t of names) $('p-' + t).hidden = t !== name;
    if (location.hash.slice(1) !== name) history.replaceState(null, '', '#' + name);
    views[name]();
  };
  btns.forEach((b, i) => b.addEventListener('click', () => show(names[i])));
  arrows(btns, b => show(names[btns.indexOf(b)]));
  window.addEventListener('hashchange', () => {
    const t = location.hash.slice(1);
    if (names.includes(t)) show(t);
  });
  const current = () => names.find(t => !$('p-' + t).hidden);
  return { show, current };
}

// 分段按鈕（一組裡只能選一個，role="radio"）
export function segmented(id, onPick) {
  const btns = [...$(id).querySelectorAll('button')];
  const pick = b => { mark(btns, b, 'aria-checked'); onPick(b.dataset.v); };
  btns.forEach(b => b.addEventListener('click', () => pick(b)));
  arrows(btns, pick);
  mark(btns, btns.find(b => b.getAttribute('aria-checked') === 'true'), 'aria-checked');
  // 拖曳畫井以後，四個形狀都不算選中；第一顆仍留在 Tab 順序裡
  return { clear: () => btns.forEach((x, i) => { x.setAttribute('aria-checked', false); x.tabIndex = i ? -1 : 0; }) };
}

// 拉桿：值一變就更新右邊的數字、讀音（帶單位）、拉過的長度，並呼叫 onChange
export function slider(id, out, fmt, onChange) {
  const el = $(id), o = $(out);
  const sync = () => {
    const v = +el.value, s = fmt(v);
    o.textContent = s;
    el.setAttribute('aria-valuetext', s);
    el.style.setProperty('--p', (v - el.min) / (el.max - el.min) * 100 + '%');
  };
  el.addEventListener('input', () => { sync(); onChange(+el.value); });
  sync();
  return el;
}
