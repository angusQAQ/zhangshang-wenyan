# R2.10.1 — 解釋前零色標＋字詞表例句「」

## 硬鎖
1. **關「顯示解釋」之前**：原文純文字、**零** `.hl`／生僻色標（中一／二／三全站）。開解釋後才色標。
2. **文言字詞表例句**：一律「」包裹（render 層；已有則不重複）。

## 根因與修
- `wrapHighlights` 在 `highlights=null` 仍對 `rare_chars` 套 `hl-rare` → `fillClassical` 改為 null 時只 `escapeHtml` 純文。
- `openPassage`／`setGuideOpen(false)` 已傳 `null`；explain-on 仍走 `wrapHighlights`＋圖例。
- `formatGlossaryExample`：缺「」則補。

## 快取
`?v=r2101`（`index.html` css／js／tab；`DATA_V`）

## 驗證
- explain off：`#pass-text` 無 `.hl`／`hl-rare`
- explain on：色標／生僻正常
- 字詞表例：均為「……」
