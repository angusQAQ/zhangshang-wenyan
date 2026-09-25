# R2.9-S3 — 組三篇章解鎖

來源：`content/s3-passages-qa.md`（OCR；殘缺標【缺】或不收錄，不補造原文）

## 結果
- `data/passages.json` → `s3`：**16 篇**可讀可練（判斷＋MCQ；解釋跟 R2.7.2）
- 略過 OCR 過殘篇（秋水、飲酒、陌上桑等），記於建置腳本 skipped
- `data/function_words.json`：虛詞另存，**不取代** glossary 150 詞
- UI 年級標籤改「組一／組二／組三」（不顯示中一／中二／中三）

## 建置
`tools/r29_build_s3.py`
