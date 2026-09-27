# R2.16 — 文言知識刪除圖片

## 需求
使用者：「文言知識刪除圖片部分」

## 交付（r2117）
- `data/knowledge.json`：移除全部 `know-hero`／`teach-art`／`chart`／`art/knowledge` 插圖 HTML
- `js/app.js`：`scrubKnowledgeHtml`＋`enhanceKnowledgeMedia` 運行時再剝殘圖；**不再**掛圖上熱點／角標放大（R2.13 作廢）
- 保留：色塊文字熱點（非圖）、主頁 `icon_home_knowledge`、底欄／練習 chrome、非知識 lightbox
- DESIGN／IMPORT／ART_KIT：知識圖標「不顯示／勿進包」；知識＝純文

## 資產
`art/knowledge/**` 可留 repo，UI 路徑不再載入。
