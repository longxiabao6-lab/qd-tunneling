// 分頁、分段按鈕、拉桿：只管互動，不管畫什麼
export const $ = id => document.getElementById(id);

// 分頁：按鈕、網址 #名稱、上一頁都會切換；切到哪一頁就呼叫那一頁的 draw
export function tabs(names, views) {
  const show = name => {
    for (const t of names) {
      $('t-' + t).setAttribute('aria-selected', t === name);
      $('p-' + t).hidden = t !== name;
    }
    if (location.hash.slice(1) !== name) history.replaceState(null, '', '#' + name);
    views[name]();
  };
  names.forEach(t => $('t-' + t).addEventListener('click', () => show(t)));
  window.addEventListener('hashchange', () => {
    const t = location.hash.slice(1);
    if (names.includes(t)) show(t);
  });
  const current = () => names.find(t => !$('p-' + t).hidden);
  return { show, current };
}

// 分段按鈕（一組裡只能選一個）
export function segmented(id, onPick) {
  const box = $(id);
  box.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    box.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', x === b));
    onPick(b.dataset.v);
  });
  return { clear: () => box.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', false)) };
}

// 拉桿：值一變就更新右邊的數字並呼叫 onChange
export function slider(id, out, fmt, onChange) {
  const el = $(id), o = $(out);
  const update = () => { o.textContent = fmt(+el.value); onChange(+el.value); };
  el.addEventListener('input', update);
  o.textContent = fmt(+el.value);
  return el;
}
