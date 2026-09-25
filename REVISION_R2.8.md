# R2.8 — 底欄功能導航跟圖（實作）

參考：`ref/sugong-dse/04-tabbar.jpg`（使用者附件一致）

## 硬鎖對齊
1. 五欄等分：首頁｜練習｜錯題｜書籤｜我的
2. 白底 `#FFF`、頂部 `1px #E5E5E5`
3. 線稿 icon（`icon_line_*`）＋二字繁中標
4. 選中：近黑字／icon（`brightness(0)` + opacity ~0.92）；未選：`#8E8E93`／icon opacity ~0.42
5. `#app.quiz-mode` 時 `display:none` 底欄；`show("quiz"|"retest")` 進入，離開即還原

## 改檔
- `index.html`：練習改用 `icon_line_doc.png`；`?v=r28`
- `css/app.css`：tabbar 版式／色態跟圖
- `js/app.js`：註明 quiz-mode 暫藏觸發（行為未改）

## 資產
優先 `art/ui/tab_*.png`（目前無）；沿用 `icon_line_home|doc|wrongset|bookmark|me.png`。

## 驗
Pages 200；主功能頁底欄可見；答題全屏無底欄。
