# R2.6 修訂對照（GIDEON）

專案：掌上文言 · GitHub Pages  
永久連結：https://angusqaq.github.io/zhangshang-wenyan/

## 五條對照

| # | KAI 要求 | 實作 | 狀態 |
|---|----------|------|------|
| 1 | 語譯／淺白按原文**逐段拆** | `data/passages.json` 每篇 `guide.sections[]` 與 `paragraphBlocks(text)` 段數對齊；每段自有 `label`／`translation`／`plain`／`theme`。由全文語譯按段合理拆分，非速攻課文照抄。`renderExplainTables` 讀 `sections[i]`。 | ✅ |
| 2 | 粵音＝中大漢語多功能字庫標準（離線） | 擴充／校正 `data/jyutping.json`（離線表，**非即時抓網**）。字詞 sheet 標「讀音來源：香港中文大學漢語多功能字庫（離線表）」。Web Speech 僅播放輔助。 | ✅ |
| 3 | 主頁功能圖標放大 | `#home-knowledge`／`#home-extra` 入口加 `feat-entry`；CSS 約 1.5×（icon-wrap 3.75rem／圖 2.35rem）。優先使用 NOA 512×512 新檔（`icon_home_knowledge`／`icon_vocab_quiz` 等）；年級卡不加。 | ✅ |
| 4 | 知識主題頂 deco 刪顯示 | `js/app.js` 不再插入 `KNOW_DECO`／deco img；檔留 repo。IMPORT／ART_KIT 標「不顯示／optional unused」。知識 HTML 表／卡保留。 | ✅ |
| 5 | 練習「下一題」可滑到可撳 | 答完後在 explain 下方放 in-flow `#quiz-next-inline`（NOA `btn_next_question.png` 黑 pill；末題改「本輪結束」CSS pill）。`scrollIntoView`；保留底 footer 作次要入口。重測同樣處理。 | ✅ |

## 粵音來源註明
- 準則：香港中文大學「漢語多功能字庫」讀音標準。
- 載體：本機 `data/jyutping.json` 離線表；唔連線查中大、唔即時抓網。
- UI：字詞 sheet 讀音旁短句標來源；播音可用 Web Speech（zh-HK）作輔助，字典準則以離線表為準。

## 自測步驟
1. 開 Pages：顯示解釋 → 第 2、3… 段「語譯／淺白」唔係「—」。
2. 點色標字 → sheet 見粵拼 +「讀音來源：香港中文大學漢語多功能字庫（離線表）」。
3. 主頁「文言知識／字詞考核／書籤」icon 明顯大於年級卡且不裁切。
4. 知識主題頁頂無 deco 圖；正文表仍在。
5. 練習揀選項後向下滑 → 見到「下一題」／「本輪結束」並可撳（觸控＋鍵鼠）。

## 已知風險
- 多音字（如「說／好／被／與」）離線表取文言常用讀；個別語境或需日後按篇微調。
- `icon_bookmark` 仍為較細原圖，放大後略軟；待 NOA 補 512 可直接替換。
- 固定 footer 仍保留；極短螢幕＋大字體時以 in-flow 掣為準。
- `softParagraphs` 僅在無空行時啟動；現有篇章以 `\n\n` 分段為主。

## 不做（依指令）
- 不改 dimension／engine／scope；不發明中三篇章；不刪 knowledge 正文。
