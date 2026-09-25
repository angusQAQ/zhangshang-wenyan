# R2.6.1 — 每段必有語譯（硬閘＋自測）

用戶＋KAI：開「顯示解釋」後語譯全集中第一段，第二段起空白／「—」。要求：**每一段表都有對應語譯實文**。

## 硬閘（已落地）
1. **渲染以 `guide.sections` 為主驅動**（`sections.length ≥ 1`）：
   - 表格數量＝`sections.length`
   - 第 i 表語譯＝`sections[i].translation`（trim 後非空；空則按全文語譯句讀拆補，**禁止輸出「—」**）
   - 原文：`splitTextToCount(text, n)`（優先 `\n\n` → `\n` → 句號均分）配第 i section
   - 淺白／段旨同樣取 `sections[i].plain`／`theme`
   - **只有完全無 sections** 才 fallback 舊「第1段用 `g.translation`、其餘 dash」邏輯
2. **資料校正**：`tools/fix_section_translations.js` 掃 s1/s2/s3；缺／空／「—」則按 `guide.translation` 與原文段數拆寫補齊；保證 `sections.length === paragraphBlocks(text).length` 且每段 `translation.trim()` 非空。本次掃描 20 篇均已對齊，無需改寫 `passages.json`。
3. **快取破壞**：`fetch data/*.json?v=r261`；`index.html` 引 `css/app.css?v=r261`、`js/app.js?v=r261`。
4. 唔改 dimension／engine／scope。

## 自測（本地 node）
- 20 篇：sections 驅動下每段 translation 非空且 ≠「—」；≥2 段者 `section[0].translation ≠ guide.translation` 且 `section[1]` 有實文。
- 抽 s1-p01：2 表；sec0≠全文；sec1＝「莊公說：「這蟲如果是人…」。
- `node --check js/app.js` OK；`node tools/fix_section_translations.js` OK。

## 改檔
- `js/app.js` — sections 主驅動、`splitTextToCount`／`splitTranslationToCount`、JSON `?v=r261`
- `index.html` — css/js query
- `tools/fix_section_translations.js` — 資料校正腳本
- `DESIGN.md` — R2.6.1 硬規格註
- `REVISION_R2.6.1.md` — 本檔

## 風險
- 用戶仍見舊畫面 → 硬刷／清 CDN 快取（已加 `r261`）；PWA／Service Worker 若日後加入需另 bust。
- 無 sections 嘅舊資料仍會走 fallback（第2段起 dash）；目前 20 篇皆有 sections。
