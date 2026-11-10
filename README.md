# 量子點模擬程式

線性代數期末報告「以矩陣最小特徵值計算量子點的發光顏色」的配套網頁。

網頁：<https://longxiabao6-lab.github.io/qd-tunneling/>

三個分頁：

- **共振穿隧**：用 2×2 傳遞矩陣算穿透率 T(E)，尖峰和三對角矩陣的特徵值對照。
- **能階**：在圖上拖曳改位能井，即時算三對角矩陣 H 的特徵值與特徵向量。
- **顏色**：拉桿調 CdSe 量子點直徑，看發光波長與顏色。

不需要安裝，全部在瀏覽器裡算。

## 檔案

```
index.html
css/   tokens（顏色、字級）→ base → layout → components
js/
  physics/   constants、transfer（傳遞矩陣）、tridiag（Sturm 二分、反冪法）、color
  ui/        plot（畫布與座標軸）、controls（分頁、拉桿、按鈕組）
  views/     三個分頁各一支
  main.js
tests/  check.js 對照報告的 Python 算出的數字（check.json）
tools/  shoot.cjs 截圖
```

## 對答案

```
npm test
```

會把網頁的穿透率、det M、特徵值與波長，和報告裡 Python 程式的結果逐項比對。
