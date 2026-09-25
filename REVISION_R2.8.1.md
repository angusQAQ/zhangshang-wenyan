# R2.8.1 — 正式底欄線稿接入

參考：`ref/sugong-dse/04-tabbar.jpg`

## 做咗乜
1. 接入 NOA 正式底欄線稿（512、透明底、#373737）：
   `art/ui/tab_{home,practice,wrong,bookmark,me}.png`
2. `index.html` 底欄 `img src` 改指上述檔（`?v=r281`）；標籤不變：首頁｜練習｜錯題｜書籤｜我的
3. CSS：去掉舊 `brightness(0)`（先前為綠線稿轉黑）；線稿已是深灰，僅用 opacity 分態——未選 0.42／選中 1
4. bump `css/app.css`、`js/app.js` → `?v=r281`

## 選中態
- 字：未選 `#8E8E93`；選中 `#1A1A1A` + font-weight 600
- icon：原色 `#373737` + opacity（唔再 filter 轉色）

## 驗
Pages 200；底欄五格正式線稿；選中近黑、未選淺灰；答題全屏仍暫藏底欄。
