# R2.7 — 六項硬規格（GIDEON）

專案：掌上文言 · GitHub Pages  
永久連結：https://angusqaq.github.io/zhangshang-wenyan/

## 對照

| # | 要求 | 實作 | 狀態 |
|---|------|------|------|
| 1 | 刪「讀音來源：香港中文大學…Web Speech 僅作播放輔助。」 | `index.html` 字詞 sheet 移除 `#ws-jyut-src` 整段 | ✅ |
| 2 | 字詞解釋完整標 **意思**＋**詞性** | `guide.words[]`（word/pos/meaning）由 highlights 同步；highlights 補 `pos`＋完整 `gloss`；sheet 顯示「詞性」「意思」；解釋區加「字詞表」 | ✅ |
| 3 | 練習解釋勿再「選「xxxxx」不符。」 | 資料層剝除公式話術；`stripXuanFormula` 渲染層保險 | ✅ |
| 4 | 解釋須引用**原文**＋**語譯** | passages／knowledge／vocab 的 optionExplains（及 explain）一律含原文摘句＋語譯／今釋；`enrichRationale` 渲染補齊 | ✅ |
| 5 | 功能列圖案＋文字放大 | `--tabbar-h: 4.25rem`；tab 字 `0.8125rem`；icon `1.75rem` | ✅ |
| 6 | 文言知識禁「中一／中二／中三」與年級劃分 | 清 `knowledge.json`；`buildUnifiedKnowledge` 不再插「入門／加深／銜接」標題；去 level-badge | ✅ |

## 快取破壞
- `?v=r27`：`index.html` → css／js；`js/app.js` `DATA_V` → `data/*.json`

## 改檔
- `index.html`／`css/app.css`／`js/app.js`
- `data/passages.json`／`knowledge.json`／`vocab_quiz.json`
- `tools/r27_data_fix.py`／`DESIGN.md`／`REVISION_R2.7.md`

## 自測
- `node --check js/app.js` OK
- knowledge 正文＋practice：`中一|中二|中三|選「|程度說明` = 0
- passages／knowledge／vocab OE：皆含原文＋語譯／今釋；`選「` = 0
- UI：無讀音來源句；字詞卡有詞性；tab 放大；知識頁無分級標題

## 風險
- 舊書籤／錯題本本地資料可能仍帶舊 optionExplains（含「選「」話術）；新作答會寫入新格式。
- 詞性為啟發式＋詞表推斷，個別字或需日後按篇微調。
- CDN／瀏覽器快取：硬刷或清快取以吃到 `r27`。
