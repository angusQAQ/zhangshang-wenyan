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

commercial_ok: true
