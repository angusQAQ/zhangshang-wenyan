# R2.12 — 內容圖放大＋知識圖去焗字／卡通重畫／修破圖

## 核實
- 使用者選 **A**：「照這個做：A 內容圖 lightbox；知識圖去焗字改 HTML 系統字；修破圖」
- 追加：「設計太醜，重新繪畫卡通風格」→ 僅 **文言知識 teach／hero 內容圖** 重畫（非整 UI 重設）

## 範圍
### 做
1. **Lightbox**：內容圖可點擊放大（知識 teach／hero、篇章相關內容圖）。除外：底欄 tab icon、對錯 mark、純裝飾小圖、chrome。
2. **知識圖去焗字**：teach／hero PNG **不准焗中文**；說明用 HTML，字體＝App 系統字級／字族。
3. **卡通重畫（NOA）**：無字插畫；可愛扁平卡通、清晰剪影；對齊 `art_direction` 白底教育＋已有 logo 卡通語彙；色圈／姿勢／場景可保留教學功能。
4. **破圖**：修路徑或重出；`commercial_ok`；入 `IMPORT.md`。

### 不做
- 整 UI 重設（已取消）
- 改玩法／色標／未顯示解釋前零高亮／練習禁語譯／虛詞多義表
- chrome icon 放大

## 分工
| 帽 | 產出 |
| --- | --- |
| NOA | 無字卡通 teach／hero → `art/knowledge/teach/`；`ART_KIT`／`IMPORT` 更新 |
| GIDEON | lightbox；知識頁圖下 HTML 系統字 caption；接新圖；修破圖；推 Pages `?v=r2114` |
| RIN | DESIGN 不動 |

## GIDEON 本輪（r2113）

### 勘察
- 渲染：`buildUnifiedKnowledge` 合併 s1→s3 HTML → `openKnowledge` 寫入 `#know-content`；`bindKnowledgeImmerse` 掛點選；**新增** `enhanceKnowledgeMedia` 疊系統字＋可放大。
- 知識圖路徑（皆本地存在；線上 HEAD 200，**無 404**）：
  - hero：`art/knowledge/teach/hero_{features,howto-read,particles,polysemy,ancient-modern,loan-chars,sentence-patterns,passive}.png`
  - teach：`teach_{polysemy,loan,passive,yi_dong,shi_dong,compare_shi_yi}.png`
  - chart：`art/knowledge/chart_*.png`（7 張）
  - 未入文但在檔：`hero_{shi_dong,yi_dong,compare_shi_yi}.png`、`teach_notebook_frame.png`、`_ref_hero`／`_hero_extract`
- **破顯示（非 404）**：`.know-hero-art` 舊 CSS 把 1200×780 教學卡壓成 **64×64** → 焗字糊成「破圖」。已改寬幅 `object-fit:contain`。

### 改動檔
| 檔 | 內容 |
| --- | --- |
| `index.html` | `#img-lightbox`；`?v=r2114` |
| `css/app.css` | lightbox；teach 圖下系統字 caption；hero 寬幅；object-fit／破圖態 |
| `js/app.js` | lightbox（點圖／Esc／關閉）；`enhanceKnowledgeMedia` 圖下 caption；`DATA_V=r2114` |
| `GAME_BRIEF.json` | `knowledge_media`／`revisions.R2.12`（已有） |
| `REVISION_R2.12.md` | 本檔 |

### Lightbox
- 目標：`#know-content` 內 `.teach-art img`、`.know-hero-art img`（class `content-zoomable`）
- 開：點圖或 Enter／空白；關：遮罩、關閉掣、**Esc**
- caption 用圖下系統字（`.teach-sys-caption`／figcaption／know-hero-cap）；**rem** 跟 `html[data-font]`
- 除外：tabbar／quiz chrome／brand／bookmark 等（選擇器擋）

### 圖下系統字（R2.12b）
- 每張 teach：沿用／補上圖下 `.teach-sys-caption`／`figcaption`，不再以半透明底欄覆蓋圖片；文案來自既有 figcaption／alt／chart 對照表
- 每張 hero：沿用既有圖下 `.know-hero-cap`，不重複插入 caption
- chart 另加 `.teach-sys-note`：提示「系統字說明：請看上方色塊與下方表格」
- **未改玩法／色標／解釋關零高亮**

### 部署
- cache：`?v=r2114`
- 可獨立上線：**lightbox＋hero 破顯示修＋圖下 caption 結構＋無字新圖**

## NOA 交付記錄（同路徑覆蓋，已完成）
請交 **無焗中文** 扁平卡通（白底教育語彙），覆蓋：

| 路徑 | 用途 |
| --- | --- |
| `art/knowledge/teach/hero_features.png` | 特點 |
| `art/knowledge/teach/hero_howto-read.png` | 閱讀 |
| `art/knowledge/teach/hero_particles.png` | 虛詞 |
| `art/knowledge/teach/hero_polysemy.png` | 一詞多義 |
| `art/knowledge/teach/hero_ancient-modern.png` | 古今 |
| `art/knowledge/teach/hero_loan-chars.png` | 通假 |
| `art/knowledge/teach/hero_sentence-patterns.png` | 句式 |
| `art/knowledge/teach/hero_passive.png` | 被動 |
| `art/knowledge/teach/hero_shi_dong.png` | 使動（可選接文） |
| `art/knowledge/teach/hero_yi_dong.png` | 意動（可選接文） |
| `art/knowledge/teach/hero_compare_shi_yi.png` | 對照（可選接文） |
| `art/knowledge/teach/teach_polysemy.png` | 多義示意 |
| `art/knowledge/teach/teach_loan.png` | 通假示意 |
| `art/knowledge/teach/teach_passive.png` | 被動示意 |
| `art/knowledge/teach/teach_yi_dong.png` | 意動示意 |
| `art/knowledge/teach/teach_shi_dong.png` | 使動示意 |
| `art/knowledge/teach/teach_compare_shi_yi.png` | 使／意對照 |
| `art/knowledge/chart_*.png`（7） | 可改無字插畫，或廢 PNG 全改 DOM（GIDEON 可跟） |

說明文案由圖下 HTML／系統字提供（勿燒進圖）；已完成換檔、`?v=r2114`、`IMPORT.md` 更新。

## 驗收
- [x] 點內容圖 → 放大；點遮罩／關閉／Esc 還原（結構）
- [x] 知識頁可見字＝圖下 HTML 系統字；無半透明底欄覆蓋圖片
- [x] 無 404；hero 不再 64×64 破顯示
- [x] 卡通無字剪影清晰（NOA R2.12b：hero×11＋teach×7）

### NOA delivery R2.12b／r2114
- [x] Pretty GenerateImage 無焗字已覆蓋 hero×11＋teach×7；色塊骨架不上線。
- [x] GIDEON 改用圖下 HTML 系統字 caption；hero 沿用 `.know-hero-cap`，無重疊蓋圖。
- [x] 全站 cache、`DATA_V`、tab 圖及 ui-motion 已更新至 `r2114`。
