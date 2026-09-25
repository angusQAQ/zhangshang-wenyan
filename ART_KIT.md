# 《掌上文言》ART_KIT（R2）

## 風格
白底教育 App + 橄欖綠；知識頁以**圖表／表格卡**為主，禁止純文字牆。

## Logo
卡通古代小人快樂讀書（無字）`art/ui/logo_master.png` 及 icon 全套。

## 知識圖表（R2）
| topic_id | 檔案 |
|----------|------|
| features | `art/knowledge/chart_features.png` |
| howto-read | `art/knowledge/chart_howto_read.png` |
| particles | `art/knowledge/chart_particles.png` |
| polysemy | `art/knowledge/chart_polysemy.png` |
| ancient-modern | `art/knowledge/chart_ancient_modern.png` |
| loan-chars | `art/knowledge/chart_loan_chars.png` |
| sentence-patterns | `art/knowledge/chart_sentence_patterns.png` |

內容對齊教局建議學習重點＋站內 knowledge 分級；圖內全港繁。

## 色標字
- 樣式條：`art/ui/highlight_chips.png`（實詞青绿／虛詞草綠／通假橙／活用紫）
- 句中示例：`art/ui/highlight_sample.png`
- CSS 建議：底色淺＋底邊 2–3px；可點；字級切換時用 `em`／`rem`，容器 `overflow-wrap`／彈性高，禁固定高裁切。

## 其他 R2 UI
書籤 off／on、文言字詞考核 icon、「顯示解釋」鈕、模式置中 mock：`mock/r2_mode_centered.png`

## 字級不破版（視覺約束給 GIDEON）
- 圖表寬 100%，高度 auto
- 卡內文用流式排版；大字級時只加行高／間距，唔改 absolute 座標疊圖
