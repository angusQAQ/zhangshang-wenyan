# 《掌上文言》ART_KIT（R2）

## 風格
白底教育 App + 橄欖綠 #7A8F6A；知識頁以 **HTML 真表格／分塊** 承載可讀正文，裝飾圖只作頁頂視覺。

commercial_ok: true

## R2.6 視覺更新（NOA）

### 首頁入口圖標（可用 CSS 放大）
首頁入口圖標統一輸出 **512×512 RGBA**、透明底，線條用較厚的橄欖綠 `#7A8F6A`；圖內不燒入中文。可按首頁卡片需要以 CSS 縮放，不應再以低解像度圖放大。

| entity_id | path | 狀態／用途 |
|-----------|------|------------|
| icon_grade | `art/ui/icon_grade.png` | R2.6 更新；三張無字等級卡片 |
| icon_vocab_quiz | `art/ui/icon_vocab_quiz.png` | R2.6 更新；字詞考核頁／問號圖示 |
| icon_passage | `art/ui/icon_passage.png` | R2.6 更新；篇章文件圖示（如首頁使用） |
| icon_home_knowledge | `art/ui/icon_home_knowledge.png` | 保留；512×512 文言知識入口 |

### 練習按鈕

| entity_id | path | 規格 |
|-----------|------|------|
| btn_next_question | `art/ui/btn_next_question.png` | R2.7.2：360×72 RGBA；黑色 pill、白色「下一題」（縮細） |

### 知識主題頁（R2.6 規則）
`deco_*.png` **不顯示**於 knowledge topic pages；檔案可以留在磁碟，但一律標記為「不顯示／optional unused」，不可由主題頁引用。知識頁以可跟 `rem` 的 HTML 真字、table/list 為主。


## Logo
卡通古代小人快樂讀書（無字）`art/ui/logo_master.png` 及 icon 全套。

## 知識裝飾頭圖（R2.2 資產；R2.6 不顯示）
頁頂裝飾插畫資產可留檔，但 R2.6 **不再顯示／optional unused**；**純視覺隱喻，無燒入可讀正文／表格字**。短題目若有 ≤6 字且大字；本批皆無字。

| topic_id | entity_id | 檔案 | 隱喻 |
|----------|-----------|------|------|
| features | deco_features | `art/knowledge/deco_features.png` | 卷軸＋放大鏡 |
| howto-read | deco_howto_read | `art/knowledge/deco_howto_read.png` | 五步圖示橫列 |
| particles | deco_particles | `art/knowledge/deco_particles.png` | 空白色 pill 浮粒 |
| polysemy | deco_polysemy | `art/knowledge/deco_polysemy.png` | 一字分裂多義 blob |
| ancient-modern | deco_ancient_modern | `art/knowledge/deco_ancient_modern.png` | 左毛筆／右現代書 |
| loan-chars | deco_loan_chars | `art/knowledge/deco_loan_chars.png` | 兩字形橋接 |
| sentence-patterns | deco_sentence_patterns | `art/knowledge/deco_sentence_patterns.png` | 結構積木 |

### DEPRECATED — chart_*.png（勿再作可讀正文）
舊檔留存僅供對照，**禁止**再當知識正文／表格來源（字級不跟 rem）：

- `art/knowledge/chart_features.png`
- `art/knowledge/chart_howto_read.png`
- `art/knowledge/chart_particles.png`
- `art/knowledge/chart_polysemy.png`
- `art/knowledge/chart_ancient_modern.png`
- `art/knowledge/chart_loan_chars.png`
- `art/knowledge/chart_sentence_patterns.png`

**規則（給 GIDEON）：可讀正文禁止用 PNG 燒字；跟 rem 必須 HTML 真字。** R2.6 起 `deco_*` 不顯示（optional unused）；定義／例句／步驟一律 HTML table／list。

## 色標字
- 樣式條：`art/ui/highlight_chips.png`（**legend 仍有效**；篇章 marks 規則見 R2.4）
- 句中示例：`art/ui/highlight_sample.png`
- CSS 建議：可點字用 pastel fill＋**dotted underline**；字級切換時用 `em`／`rem`，容器 `overflow-wrap`／彈性高，禁固定高裁切。

## 其他 R2 UI
書籤 off／on、文言字詞考核 icon、「顯示解釋」鈕、主頁入口 `art/ui/icon_home_knowledge.png`（文言知識）、模式置中 mock：`mock/r2_mode_centered.png`

## 字級不破版（視覺約束給 GIDEON）
- 裝飾頭圖寬 100%，高度 auto；**正文唔喺 PNG 入面**
- 卡內文用流式排版／HTML 表格；大字級時只加行高／間距，唔改 absolute 座標疊圖

## R2.4 速攻對齊

> 只對齊《速攻文憑試》參考圖的互動 chrome／版式；**不可拷貝參考圖的課文或任何課文段落文字**。
> 參考：`ref/sugong-dse/01-plain-before.png`、`02-explain-on.png`、`03-word-sheet.png`。

### GIDEON 必用 CSS tokens

```css
:root {
  /* brand / shared chrome */
  --brand-olive: #7A8F6A;
  --r24-ink: #111111;
  --r24-muted: #8A8A8A;
  --r24-border: #E5E5E5;
  --r24-toggle-bg: #111111;
  --r24-toggle-fg: #FFFFFF;

  /* explain table: label column stays light grey-green */
  --r24-table-label: #EEF2EE;
  --r24-row-segment: #EEF2EE;  /* 段落劃分 */
  --r24-row-original: #FFFFFF; /* 原文 */
  --r24-row-translation: #F3F1F8; /* 語譯：light purple */
  --r24-row-plain: #EAF5EE;       /* 淺白解讀：light green */
  --r24-row-summary: #FBF1DF;     /* 段旨：soft warm cream */

  /* clickable 原文 marks: pastel fill + dotted underline */
  --r24-mark-shi-fill: #FFF0DA;
  --r24-mark-shi-line: #E6963C; /* 實詞／名物：orange */
  --r24-mark-xu-fill: #EAF4E5;
  --r24-mark-xu-line: #7A8F6A;  /* 虛詞／動詞等：green */
  --r24-mark-tong-fill: #E4F2F3;
  --r24-mark-tong-line: #4E8E95; /* 通假：soft teal, distinct */
  --r24-mark-huo-fill: #F1E8FB;
  --r24-mark-huo-line: #8264B4; /* 活用：soft purple, distinct */
  --r24-mark-rare-fill: #FDE2E8;
  --r24-mark-rare-line: #C45C7A; /* 生僻：soft pink, R2.9 */

  /* word bottom sheet */
  --r24-sheet: #FFFFFF;
  --r24-sheet-overlay: rgba(0, 0, 0, .40);
  --r24-sheet-handle: #D9D9D9;
  --r24-pronunciation-bg: #E8F5EE;
}
```

### 狀態與版式規則

- **Before explain**：原文只用 `--r24-ink` 純黑字；不顯示色標、底色、底線或任何色彩 mark。
- **After explain**：用真正的 HTML `<table>`，不是燒字 PNG。左 label 欄固定 `--r24-table-label` 淺灰；列依序必須是：`段落劃分`（`--r24-row-segment`）、`原文`（白）、`語譯`（`--r24-row-translation` 淡紫）、`淺白解讀`（`--r24-row-plain` 淡綠）、`段旨`（`--r24-row-summary` 淡暖色）。表格內容要流式換行，不可固定高度裁切。
- **原文色標**：只在 explain mode 的原文格顯示。每個可點字用 pastel fill 加 dotted underline，不能用實線：`text-decoration-line: underline; text-decoration-style: dotted; text-decoration-thickness: 2px; text-underline-offset: 3px;`。kind 對應上方四組 token；實詞／名物橙色、虛詞／動詞等綠色，通假與活用保留獨立柔和 teal／紫色。
- **Toggle**：黑色 `#111111` pill、白字；開關文案只用「顯示解釋」／「關閉解釋」。
- **Word bottom sheet**：底部白色 card，圓角只在上方；灰色 `--r24-sheet-handle` drag handle。欄位依序為出處／字詞／讀音（`--r24-pronunciation-bg` 淡綠 box，配「播放粵語讀音」白底 outline button）／解釋；最底 full-width 黑色「關閉」pill。遮罩用 `--r24-sheet-overlay`。
- **品牌邊界**：首頁／nav 繼續使用橄欖綠 `#7A8F6A`；篇章 explain mode 的表格及 bottom sheet chrome 以本節 token 為準，不要把品牌綠套成整張表的底色。

### R2.4 chrome PNG（可用作非文字版式參照）

| entity_id | path | 用途 |
|-----------|------|------|
| btn_show_explain | `art/ui/btn_show_explain.png` | 黑 pill「顯示解釋」 |
| btn_close_explain | `art/ui/btn_close_explain.png` | 黑 pill「關閉解釋」 |
| btn_play_jyutping | `art/ui/btn_play_jyutping.png` | 讀音 card 內白色 outline button |
| btn_sheet_close | `art/ui/btn_sheet_close.png` | sheet 底部 full-width 黑 pill「關閉」 |
| sheet_handle | `art/ui/sheet_handle.png` | sheet 灰色 drag handle |

## R2.8 底欄
白底細頂線、五等分、線稿＋二字標。icons：`tab_home`／`tab_practice`／`tab_wrong`／`tab_bookmark`／`tab_me`（對齊 `ref/sugong-dse/04-tabbar.jpg`）。選中黑、未選中灰＝CSS。

## R2.9 視覺（NOA）

commercial_ok: true

### 主頁入口 icons（512×512 RGBA；厚橄欖線；無中文）

| entity_id | path | 用途 |
|-----------|------|------|
| icon_home_glossary | `art/ui/icon_home_glossary.png` | 文言字詞表；開書＋列表線＋索引標籤 |
| icon_home_vocab | `art/ui/icon_home_vocab.png` | 文言字詞／操練入口；閃卡＋問號 |
| icon_vocab_quiz | `art/ui/icon_vocab_quiz.png` | 與 `icon_home_vocab` 同步（同角色） |

### 顯示解釋 · 色標圖例 strip

| entity_id | path | 規格 |
|-----------|------|------|
| legend_explain | `art/ui/legend_explain.png` | ~1200×160；橫向 chips：實詞｜虛詞｜通假｜活用｜生僻（生僻旁喇叭 silhouette） |

GIDEON：開「顯示解釋」後置於解釋區可見位置（表上方或原文上方）。`highlight_chips` 仍可用；R2.9 優先 `legend_explain`（含生僻＋正確 token）。

### 生僻色標 token（NEW）

| kind | fill | dotted underline |
|------|------|------------------|
| 生僻 | `#FDE2E8` | `#C45C7A` |

CSS 建議：`--r24-mark-rare-fill: #FDE2E8; --r24-mark-rare-line: #C45C7A;`；旁可接粵語讀音（喇叭／btn_play_jyutping）。

### 知識教學卡 teach_*（文章中可顯示）

軟扁卡通＋筆記簿框；短繁中標籤 ≤短句；正文仍 HTML。

| entity_id | path | 主題／插入建議 |
|-----------|------|----------------|
| teach_shi_dong | `art/knowledge/teach/teach_shi_dong.png` | 使動；定義句或對照表前／後 |
| teach_yi_dong | `art/knowledge/teach/teach_yi_dong.png` | 意動；「以之為」說明旁 |
| teach_compare_shi_yi | `art/knowledge/teach/teach_compare_shi_yi.png` | 使動 vs 意動對照；對照表後 |
| teach_notebook_frame | `art/knowledge/teach/teach_notebook_frame.png` | 可重用筆記框 deco／section chrome |
| teach_loan | `art/knowledge/teach/teach_loan.png` | 通假；loan-chars 主題 |
| teach_polysemy | `art/knowledge/teach/teach_polysemy.png` | 一詞多義；polysemy 主題 |
| teach_passive | `art/knowledge/teach/teach_passive.png` | 被動；句式／活用相關段 |

**規則：** `deco_*` 仍 **不顯示／optional unused**。`teach_*` **要顯示**於知識文中（教學多媒體層）。勿把長正文燒進 PNG。
