# R2.22 — iPhone 篇章列表右移／左空白

## 核實意圖
iPhone Safari：練習 → 年級 →「文言篇章」列表，左半空白、正文擠到右邊被裁；底欄仍全寬。中一／中二同樣。疑 R2.21／`?v=r2122` 之後。

## 根因
R2.21 删 `#know-practice` 時留下一顆多餘 `</div>`（`#view-knowledge` 內）。HTML 解析會提早關掉 `#app`，其後所有 view（含 `#view-passage-list`）變成 `body` 的直接子節點。

`body` 當時是 `display: flex`（橫列、置中）：空的白底 `#app`（`width:100%; min-height:100dvh`）佔左，列表 view 當 flex item 擠在右半並被 `overflow-x: hidden` 裁切。`.tabbar` 是 `position: fixed`、在 `#app` 外，所以底欄仍全寬——與截圖一致。不是 `translateX`／safe-area／slide-transition。

## 鎖
1. 删 `#view-knowledge` 內多餘 `</div>`，讓篇章列表／閱讀／練習等 view 回到 `#app` 內
2. `body` 改回普通 block；`#app` 用 `margin-inline: auto` 置中（不再用橫列 flex，避免再有 stray tag 時左右分屍）
3. `.view` 設 `width:100%; max-width:100%; min-width:0`；quiz 藏底欄補 `#app.quiz-mode ~ .tabbar`
4. 推 `?v=r2123`

## 不做
不改題庫／知識文案；不改底欄視覺。

## 分工
GIDEON；RIN DESIGN 一句。
