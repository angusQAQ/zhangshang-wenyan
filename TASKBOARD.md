# TASKBOARD — 掌上文言

## 狀態
Plan 待核實（`approved_by_user` ≠ true → 禁止寫程式／批量生圖）

## 已鎖
- 名稱：掌上文言
- 類型：自學網頁（非遊戲）
- 2D｜靜態 HTML／CSS／JS｜iPhone 直向
- 香港繁體書面語；禁粵語；禁任何簡體
- 無 BGM
- UI 參考：`ref/ui-*.png`（白底教育 App）
- 內容源：`content/source-wenyan-kit.md`＋教局年級材料
- 路徑：年級 → 文言知識／文言篇章

## 分工（核實後）
| 帽 | 任務 |
|---|---|
| KAI | brief／砍單／內容年級邊界裁決 |
| RIN | DESIGN：點選流程、對錯回饋、判斷題三態；非關卡營 |
| NOA | 換皮：首屏／列表／答題／解釋；跟 ref；圖內字繁體 |
| GIDEON | 骨架頁面→接皮→iPhone 直向實測→截圖＋操作錄影 |

## 必問清單（已答）
1. 2D ✅
2. 引擎：靜態網頁（GIDEON 建議已採）✅
3. 風格：用戶附件 UI 參考＝白底教育風 ✅
4. 文字：港繁書面語、禁粵語、禁簡體 ✅
5. 聲音：無 BGM ✅
6. 直向 iPhone ✅

## 核實口令
回「照這個做」／「執行」／「ok」／「核實」才開工。

## 內容到貨
- 中一文言篇章＋題＋答：`content/s1-passages-qa.md`（用戶提供）
- 中二／中三篇章：仍缺

- 中二文言篇章＋題＋答：`content/s2-passages-qa.md`

## EXECUTE 已開（2026-09-25）
用戶：「你先製作這個程式…中三之後補充…永久有效連結」
- approved_by_user=true
- 中三：佔位，不 invent 篇章
- 產出：可開網頁＋永久 Pages 連結
- 順序：RIN DESIGN 鎖定 → NOA 正式 UI 素材 → GIDEON 靜態站＋自測＋部署
