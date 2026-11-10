// 截網頁：手機（390 寬）與桌機，三個分頁；報告的截圖也用這支
// 執行：PLAYWRIGHT=<playwright 的路徑> node tools/shoot.cjs <輸出資料夾> [網址]
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const out = process.argv[2], url = process.argv[3] || 'http://127.0.0.1:8731/';
(async () => {
  const b = await chromium.launch();
  for (const [name, vp, scale] of [['m', { width: 390, height: 844 }, 2], ['d', { width: 1280, height: 900 }, 1]]) {
    const p = await b.newPage({ viewport: vp, deviceScaleFactor: scale });
    for (const t of ['tunnel', 'levels', 'color']) {
      await p.goto('about:blank'); await p.goto(url + '#' + t); await p.waitForTimeout(800);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      await p.screenshot({ path: `${out}/${name}_${t}.png`, fullPage: true });
      console.log(name, t, '頁面寬', sw, '視窗寬', vp.width);
    }
    await p.close();
  }
  await b.close();
})();
