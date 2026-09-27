# 《掌上文言》IMPORT（R2）

> 未列於此檔 = 不准進包。刪除「知識主題概覽」相關素材若仍有舊 mock 引用請忽略。

## R2.6 visual update（NOA）
- 首頁圖標 `icon_grade`、`icon_vocab_quiz`、`icon_passage`、`icon_home_knowledge` 均以 **512×512 RGBA** 供 CSS 縮放；透明底、厚 `#7A8F6A` 線條，圖內不燒入中文。
- 知識主題頁 **不顯示 `deco_*.png`**；資產可留檔但狀態為「不顯示／optional unused」，不得引用。
- 練習答題後使用 `btn_next_question`（黑色 pill 白字「下一題」）。


## Brand
| entity_id | path |
|-----------|------|
| logo_master | art/ui/logo_master.png |
| app_icon | art/ui/app_icon.png |
| apple_touch_icon | art/ui/apple-touch-icon.png |
| icon_192 | art/ui/icon-192.png |
| icon_512 | art/ui/icon-512.png |
| favicon | art/ui/favicon-32.png |

## Hero / home
| entity_id | path |
|-----------|------|
| hero_home | art/ui/hero_home.png |
| icon_home_knowledge | art/ui/icon_home_knowledge.png |
| icon_knowledge | art/ui/icon_knowledge.png |
| icon_passage | art/ui/icon_passage.png |
| icon_grade | art/ui/icon_grade.png |
| icon_vocab_quiz | art/ui/icon_vocab_quiz.png |

## Knowledge deco headers（R2.6 不顯示／optional unused；正文用 HTML）
| entity_id | path | topic |
|-----------|------|-------|
| deco_features | art/knowledge/deco_features.png | features（不顯示／optional unused） |
| deco_howto_read | art/knowledge/deco_howto_read.png | howto-read（不顯示／optional unused） |
| deco_particles | art/knowledge/deco_particles.png | particles（不顯示／optional unused） |
| deco_polysemy | art/knowledge/deco_polysemy.png | polysemy（不顯示／optional unused） |
| deco_ancient_modern | art/knowledge/deco_ancient_modern.png | ancient-modern（不顯示／optional unused） |
| deco_loan_chars | art/knowledge/deco_loan_chars.png | loan-chars（不顯示／optional unused） |
| deco_sentence_patterns | art/knowledge/deco_sentence_patterns.png | sentence-patterns（不顯示／optional unused） |

## DEPRECATED knowledge charts（勿作可讀正文／勿跟 rem 依賴）
舊 `chart_*.png` 含燒入中文，**GIDEON 必須改用 HTML tables**；以下僅列存檔，預設唔進新 UI：

| entity_id | path | status |
|-----------|------|--------|
| chart_features | art/knowledge/chart_features.png | DEPRECATED |
| chart_howto_read | art/knowledge/chart_howto_read.png | DEPRECATED |
| chart_particles | art/knowledge/chart_particles.png | DEPRECATED |
| chart_polysemy | art/knowledge/chart_polysemy.png | DEPRECATED |
| chart_ancient_modern | art/knowledge/chart_ancient_modern.png | DEPRECATED |
| chart_loan_chars | art/knowledge/chart_loan_chars.png | DEPRECATED |
| chart_sentence_patterns | art/knowledge/chart_sentence_patterns.png | DEPRECATED |

**可讀正文禁止用 PNG 燒字；跟 rem 必須 HTML 真字。**

## Passage / quiz UI
| entity_id | path |
|-----------|------|
| mark_correct | art/ui/mark_correct.png |
| mark_wrong | art/ui/mark_wrong.png |
| badge_coming_soon | art/ui/badge_coming_soon.png |
| icon_bookmark | art/ui/icon_bookmark.png |
| icon_bookmark_on | art/ui/icon_bookmark_on.png |
| btn_show_explain | art/ui/btn_show_explain.png |
| btn_next_question | art/ui/btn_next_question.png |
| btn_close_explain | art/ui/btn_close_explain.png |
| btn_play_jyutping | art/ui/btn_play_jyutping.png |
| btn_sheet_close | art/ui/btn_sheet_close.png |
| sheet_handle | art/ui/sheet_handle.png |
| highlight_chips | art/ui/highlight_chips.png |
| highlight_sample | art/ui/highlight_sample.png |

## R2.4 色標 token 與 CSS 規則

`highlight_chips` 仍是合法的 legend 資產；但篇章原文的互動 marks **必須用 HTML/CSS**，不可把 `highlight_chips` 當成課文標記圖。marks 用 pastel fill + dotted underline（`text-decoration-style: dotted`），只在 explain mode 出現；before explain 保持純黑、無色標。

| kind | fill | dotted underline |
|------|------|------------------|
| 實詞／名物 | `#FFF0DA` | `#E6963C` |
| 虛詞／動詞等 | `#EAF4E5` | `#7A8F6A` |
| 通假 | `#E4F2F3` | `#4E8E95` |
| 活用 | `#F1E8FB` | `#8264B4` |
| 生僻（R2.9） | `#FDE2E8` | `#C45C7A` |

## R2.8 底欄 tab icons（跟 ref/sugong-dse/04-tabbar.jpg）
| entity_id | path | label |
|-----------|------|-------|
| tab_home | art/ui/tab_home.png | 首頁 |
| tab_practice | art/ui/tab_practice.png | 練習 |
| tab_wrong | art/ui/tab_wrong.png | 錯題 |
| tab_bookmark | art/ui/tab_bookmark.png | 書籤 |
| tab_me | art/ui/tab_me.png | 我的 |

線稿深灰 `#373737`、透明底、512×512。選中態由 CSS 加深／變黑；未選中保持灰。白底欄＋細頂線由 GIDEON CSS。

commercial_ok: true


## R2.9 visual（NOA）

commercial_ok: true

### 主頁／字詞入口
| entity_id | path |
|-----------|------|
| icon_home_glossary | art/ui/icon_home_glossary.png |
| icon_home_vocab | art/ui/icon_home_vocab.png |
| icon_vocab_quiz | art/ui/icon_vocab_quiz.png |

（`icon_vocab_quiz` 與 `icon_home_vocab` 同圖；R2.9 刷新）

### 解釋圖例
| entity_id | path |
|-----------|------|
| legend_explain | art/ui/legend_explain.png |

### 色標 token（含 NEW 生僻）
| kind | fill | dotted underline |
|------|------|------------------|
| 實詞／名物 | `#FFF0DA` | `#E6963C` |
| 虛詞／動詞等 | `#EAF4E5` | `#7A8F6A` |
| 通假 | `#E4F2F3` | `#4E8E95` |
| 活用 | `#F1E8FB` | `#8264B4` |
| **生僻**（NEW） | `#FDE2E8` | `#C45C7A` |

CSS：`--r24-mark-rare-fill` / `--r24-mark-rare-line`；生僻可點播粵語。

### 知識教學卡（mid-article 顯示）
| entity_id | path |
|-----------|------|
| teach_shi_dong | art/knowledge/teach/teach_shi_dong.png |
| teach_yi_dong | art/knowledge/teach/teach_yi_dong.png |
| teach_compare_shi_yi | art/knowledge/teach/teach_compare_shi_yi.png |
| teach_notebook_frame | art/knowledge/teach/teach_notebook_frame.png |
| teach_loan | art/knowledge/teach/teach_loan.png |
| teach_polysemy | art/knowledge/teach/teach_polysemy.png |
| teach_passive | art/knowledge/teach/teach_passive.png |

**Note：** `deco_*` 仍 unused／不顯示；`teach_*` **ARE for display** mid-article（使動／意動優先）。commercial_ok: true。


## R2.10 hero teach + interactive chrome（NOA）

commercial_ok: true

`deco_*` 仍 unused／不顯示。`hero_*` 與下列 interactive chrome **ARE for display**。GIDEON：於圖形／色塊／步驟圓／翻面區掛 tap targets；步驟揭曉／翻卡／點揭定義。長正文保持 HTML。

### HERO teach（知識主題）
| entity_id | path | topic_id |
|-----------|------|----------|
| hero_features | art/knowledge/teach/hero_features.png | features |
| hero_howto_read | art/knowledge/teach/hero_howto-read.png | howto-read |
| hero_particles | art/knowledge/teach/hero_particles.png | particles |
| hero_polysemy | art/knowledge/teach/hero_polysemy.png | polysemy |
| hero_ancient_modern | art/knowledge/teach/hero_ancient-modern.png | ancient-modern |
| hero_loan_chars | art/knowledge/teach/hero_loan-chars.png | loan-chars |
| hero_sentence_patterns | art/knowledge/teach/hero_sentence-patterns.png | sentence-patterns |
| hero_shi_dong | art/knowledge/teach/hero_shi_dong.png | sentence-patterns（使動） |
| hero_yi_dong | art/knowledge/teach/hero_yi_dong.png | sentence-patterns（意動） |
| hero_compare_shi_yi | art/knowledge/teach/hero_compare_shi_yi.png | sentence-patterns（對照） |
| _ref_hero | art/knowledge/teach/_ref_hero.png | （內部參考＝logo_master 副本） |

### Interactive chrome
| entity_id | path |
|-----------|------|
| tap_hint_ring | art/ui/tap_hint_ring.png |
| hotspot_dot | art/ui/hotspot_dot.png |
| card_flip_hint | art/ui/card_flip_hint.png |
| immersive_panel_bg | art/ui/immersive_panel_bg.png |
| btn_reveal | art/ui/btn_reveal.png |
| legend_knowledge_dots | art/ui/legend_knowledge_dots.png |

（`legend_explain` 保留。）舊 `teach_*` 仍可進包作備援；R2.10 顯示優先 `hero_*`。

## R2.11.1 被動重畫（NOA）
| entity_id | path |
|-----------|------|
| teach_passive | art/knowledge/teach/teach_passive.png |
| hero_passive | art/knowledge/teach/hero_passive.png |

Logo 主人翁卡通；舊醜圖已覆蓋。commercial_ok: true

## R2.12b — pretty GenerateImage 無焗字（NOA 2026-09-27）

- **方法：** Cursor GenerateImage＋`logo_master` 參考；**禁止** Pillow 色塊骨架上線。
- **規則：** `text_in_image: false`；說明由 GIDEON 圖下 HTML 系統字 caption；可 lightbox。
- **路徑：** `art/knowledge/teach/hero_*.png`（11）＋`teach_*.png`（7）；覆蓋同路徑。
- **commercial_ok：** true（自生圖）。
- **系統字說明速查：** features→單音／省略／語序；howto-read→斷句→釋詞→通譯→章旨→賞析；particles→而／也／者／乎／之／於／其；polysemy→之三義；ancient-modern→古義↔今義；loan→本字↔通假；sentence／shi／yi／compare→使動／意動；passive→受事／施事。

## R2.13 — 知識圖上熱點沉浸（NOA）

- **Hero 場景：** 沿用 R2.12b `art/knowledge/teach/hero_*.png`（無焗字）。
- **熱點座標：** `art/knowledge/hotspots/HOTSPOT_LAYOUT.json`（% 座標；每主題 3–5 點；`label` 僅 HTML）。
- **Chrome：**
  | id | path | 用途 |
  | --- | --- | --- |
  | hotspot_dot | art/ui/hotspot_dot.png | 熱點實心色圈 |
  | tap_hint_ring | art/ui/tap_hint_ring.png | 虛線提示圈／pulse |
  | btn_zoom_corner | art/ui/btn_zoom_corner.png | **角標放大**（唯此開 lightbox） |
  | immersive_panel_bg | art/ui/immersive_panel_bg.png | 揭曉面板底 |
  | btn_reveal | art/ui/btn_reveal.png | 揭曉 pill（CSS 疊字） |
- **規則：** 熱點優先；整圖唔再一點放大；`text_in_image: false`；commercial_ok true。

## R2.13／R2.14 — GIDEON 接皮（2026-09-27）
- 熱點資料寫入 `data/knowledge.json` → `topics[].hotspots`（座標採 NOA `HOTSPOT_LAYOUT.json`；body 由現有教學文切片）
- 角標：`art/ui/btn_zoom_corner.png`＋「放大」；熱點點：`hotspot_dot.png`
- 字詞出處：`glossary.json` 全表 `《篇名》作者`；版本 `r2116`

## R2.16 — 文言知識刪圖（NOA 2026-09-27）

**鎖：** 知識模組 **禁止** 再載入任何插圖。檔可留 repo，**視同不能進包／不得引用**。

### 自 R2.16 起「不顯示／勿進包」
- 全部 `art/knowledge/deco_*.png`
- 全部 `art/knowledge/chart_*.png`（本已 DEPRECATED）
- 全部 `art/knowledge/teach/hero_*.png`、`teach_*.png`、`_ref_*`／`_hero_*`
- `art/knowledge/hotspots/HOTSPOT_LAYOUT.json`（R2.13 圖上熱點作廢）
- 知識專用 chrome（僅知識頁用）：`hotspot_dot`、`tap_hint_ring`、`btn_zoom_corner`、`card_flip_hint`、`immersive_panel_bg`、`btn_reveal`、`legend_knowledge_dots`

### 仍進包（非知識插圖）
- 主頁入口 `icon_home_knowledge`／`icon_knowledge`（導航 icon，不是知識頁插圖）
- 篇章／字詞／底欄／色標等其他模組 UI 不動

上方 R2.9–R2.13 列「ARE for display」之 knowledge 圖／熱點 chrome，**一律被本節覆蓋為不顯示**。
