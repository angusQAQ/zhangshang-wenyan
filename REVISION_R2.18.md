# R2.18 — 文言虛詞表：删出處，改例句語譯

## 核實意圖
使用者：「文言虛詞表：刪除所有出處，改為例句語譯解釋」

## 鎖（只動虛詞表，不動字詞表）
1. `data/function_words.json`：每義項**删除／停用** `source`（含【待補】）；新增 `translation`（或 `gloss`）＝該 `example` 的白話語譯／句意解釋（香港書面語，短、準）
2. UI「文言虛詞表」：出處欄改顯示語譯；不准再出現《篇名》作者／佚名／待補
3. `formatGlossarySource` 仍可服務**字詞表**；虛詞渲染路徑獨立，勿共用出處格式
4. 交 `FUNCTION_WORDS_AUDIT.md` 更新註：R2.18 起虛詞不列出處
5. 推 `?v=r2119`

## 不做
不改 glossary／篇章出處；不重開知識圖。

## 分工
GIDEON：JSON＋UI＋Pages；RIN：DESIGN 一句；NOA：唔使。
