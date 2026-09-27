# R2.19 — 全篇章段落劃分核對（對齊原文格式）

## 核實意圖
使用者：「部分篇章在錯誤的地方劃分下一段，例如鄒忌諷齊王納諫、自護其短，你要重新審視全部文章，確保全部文章的分段合理，符合原文格式」

## 根因
多數篇 `text` 無 `\n\n`；UI 用 `guide.sections.length` 強制 `splitTextToCount`，按句強切 → 段界錯位（自護其短語譯亦被切爛）。

## 鎖
1. **全庫 36 篇**逐篇審：`data/passages.json` 的 `text` 用 `\n\n` 標**通行教材／原文慣用段界**（不准靠猜句長）
2. `guide.sections` **段數＝正文段數**；每段 `translation`／`plain`／`theme` 對應該段；殘缺標【缺】，禁半句亂切
3. 先修範例：`鄒忌諷齊王納諫`、`自護其短`；其餘同標準
4. 交 `PASSAGE_PARAGRAPH_AUDIT.md`（每篇：舊段數／新段數／依據一句）
5. 推 `?v=r2120`

## 不做
不改虛詞 R2.18；不重開知識圖；不准只改 UI 啟發式交差。

## 分工
GIDEON 改 JSON＋自測分段顯示；RIN DESIGN 一句：段界以正文 `\n\n` 為準、sections 對齊；NOA 唔使。
