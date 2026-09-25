# R2.7.2 — 下一題縮掣＋解釋改口（覆蓋 R2.7.1「必引原文」）

## UI
- NOA：`art/ui/btn_next_question.png` 縮至 **360×72**（原 600×128）。
- CSS：`.btn-next-asset` 唔再全寬霸屏；置中、`max-width: 13.75rem`（約 220×44，可點次要掣）。
- HTML：`width/height` 改 360×72；快取破壞 `?v=r272`。

## 解釋文風（硬規格）
1. **段落**詳講：正解為何對、各錯項錯喺邊＋易誤解。
2. **原文**只在有需要時引用（唔強制每句）。
3. **禁止引用語譯**（删「語譯：」「今釋：」及譯文充數；資料層標籤掃描＝0）。
4. 要對照先用小表；禁空話。
5. `enrichRationale`：只清語譯殘／選項公式；**唔再自動補「原文「…」」**。

## 工具
- `tools/r272_paragraph_explains.py`：passages／knowledge／vocab 解釋改寫。

## 驗證
- `node --check js/app.js`
- 練習解釋路徑「語譯：」「今釋：」＝0（「只讀語譯」選項字面除外）
- GitHub Pages 200
