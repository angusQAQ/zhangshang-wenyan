# 掌上文言

初中文言文自學網頁（香港繁體書面語）。通勤碎片練習：文言知識掃讀、文言篇章選擇題，即時對錯與解釋。

## 永久連結

**https://angusqaq.github.io/zhangshang-wenyan/**

## 本機開啟

```bash
# 任選一種靜態伺服（因 fetch JSON，勿直接用 file://）
cd zhangshang-wenyan
python3 -m http.server 8080
# 瀏覽器開啟 http://127.0.0.1:8080/
```

或以 VS Code Live Server 等工具開啟 `index.html` 所在目錄。

## 結構

- `index.html`／`css/app.css`／`js/app.js` — 單頁應用
- `data/passages.json` — 中一／中二篇章與題目
- `data/knowledge.json` — 中一／中二文言知識七主題
- `art/ui/` — UI 素材（見 `IMPORT.md`）

## 說明

- 直向 iPhone 優先，最大寬度約 430px
- 中三顯示「內容即將推出」
- 無登入、無雲端、無 BGM
