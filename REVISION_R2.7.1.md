# R2.7.1 — 練習解釋去語譯堆砌、一針見血

專案：掌上文言 · GitHub Pages  
永久連結：https://angusqaq.github.io/zhangshang-wenyan/

## 問題
R2.7 為「引原文＋語譯」在 `explain`／`optionExplains` 前綴整段語譯，變成廢話；錯項亦未穩點「錯在邊」。

## 文風硬鎖（已落地）
1. **正解**：短段講點解啱；**必引原文**「……」；禁整段語譯充數。
2. **錯項**：點錯誤位置＋學生易誤解處（古今義／通假、望文生義、忽略明示句等）。
3. 段落為主；要對照才小表。
4. 禁：複述題幹、無關背景、`語譯：「…」` 模板。

## 實作
| 層 | 改動 |
|----|------|
| 資料 | `passages.json`／`knowledge.json`／`vocab_quiz.json` 全部 `explain`＋`optionExplains` 重寫 |
| 渲染 | `stripYuanyiDump`＋`enrichRationale`：剝語譯堆、**不再**自動補語譯；缺引號時才補 `原文「…」` |
| 工具 | `tools/r271_sharpen_explains.py`；`tools/r27_data_fix.py` 同步唔再寫語譯模板 |
| 快取 | `?v=r271`（index css／js；`DATA_V`→data/*.json） |

## 自測
- `node --check js/app.js` OK
- 抽樣 5+ 題（篇章／知識／字詞）：無 `語譯：「` 堆砌，有原文引句；錯項以「錯在…」起
- 全庫解釋欄 `語譯：「`／`語譯／` = 0

## 風險
- 舊書籤／錯題本本地仍可能帶 R2.7 長模板；新作答寫入新格式。
- 知識題無篇章原文時用「相關要點」＋例子引號，嚴密度低於篇章題。
- CDN 快取：硬刷以吃到 `r271`。
