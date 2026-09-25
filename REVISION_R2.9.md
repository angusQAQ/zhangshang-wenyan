# R2.9 — 字詞表／色標圖例／無限題／知識多媒體

## 對照
| # | 要求 | 實作 |
|---|------|------|
| 1 | 主頁「操練與收藏」→「文言字詞」；新增字詞表；删主頁書籤卡 | `index.html`；底欄書籤保留 |
| 2 | `data/glossary.json` 約 150 詞縱表 | 自 `content/source-wenyan-glossary.docx` |
| 3 | 顯示解釋後色標圖例＋生僻另色可播粵音 | 圖例：實詞／虛詞／通假／活用／生僻；生僻 `#FDE2E8`／`#C45C7A` |
| 4 | 取消六題上限，可持續下一題 | 池盡自動洗牌；列表不顯示題數灰字 |
| 5 | 知識多媒體＋意動／使動多路徑 | CSS 筆記卡／色圈／對照表／自測；NOA 插圖稍後可換 |

## 快取
`?v=r29`（html／css／js／data）

## 改檔
`index.html` `css/app.css` `js/app.js` `data/glossary.json` `data/rare_chars.json` `data/knowledge.json` `data/function_words.json` `tools/r29_build_s3.py` 等
