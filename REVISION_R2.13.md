# R2.13 — 文言知識圖上熱點沉浸（7 主題）

## 核實
使用者：「照這個做：A 圖上熱點沉浸（7 主題；點熱點出知識；放大改角標；禁焗字）」

## Loop（鎖）
1. 進入主題 → 見可讀場景圖（無焗字）＋可見熱點提示  
2. **點熱點** → 展開該點知識面板（HTML＋系統字）  
3. 可再點其他熱點；同一動詞「點選」  
4. **放大**：場景角標／獨立「放大」掣 → lightbox（整張圖點擊**不再**直接放大，避免蓋過沉浸）

## 範圍
### 做
- 7 主題皆有圖上熱點：`features`｜`howto-read`｜`particles`｜`polysemy`｜`ancient-modern`｜`loan-chars`｜`sentence-patterns`
- 每主題 **3–5** 熱點；熱點標籤／面板文＝系統字（可從現有合併正文切片，不准發明考點）
- 熱點優先於 lightbox；chrome／mark 除外規則維持
- 禁 PNG 焗字；卡通扁平對齊 R2.12 `art_direction.knowledge_media`

### 不做
- 另開教學關／第二機制（拖曳、配對、進度樹）
- 整 UI 重設
- 改篇章色標／練習禁語譯／虛詞多義表規則

## 分工
| 帽 | 產出 |
| --- | --- |
| RIN | DESIGN 補 R2.13 Loop／觸控對照／實體（熱點） |
| NOA | 7 主題場景可點剪影／色圈對位；`hotspot_dot`／`tap_hint_ring`；IMPORT |
| GIDEON | 熱點揭面板；角標放大；接皮；Pages `?v=r2115` |

## 驗收
- 10s 內能點開 ≥1 熱點並讀到知識  
- 點熱點≠開 lightbox；角標才放大  
- 7 主題皆可走完主路徑；無焗字；pretty

### NOA delivery
HOTSPOT_LAYOUT.json＋btn_zoom_corner／hotspot_dot／tap_hint_ring 已更新；IMPORT／ART_KIT 已標 R2.13。

## 狀態
**shipped** `r2116` — 七主題 hotspots 資料＋圖上熱點／角標放大；沿用既有 hotspot_dot（NOA 新環未到）。
