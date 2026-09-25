(function () {
  "use strict";

  const GRADES = [
    { id: "s1", label: "中一", desc: "文言篇章" },
    { id: "s2", label: "中二", desc: "文言篇章" },
    { id: "s3", label: "中三", desc: "文言篇章即將推出" },
  ];

  const LETTERS = ["A", "B", "C", "D"];
  const LAST_GRADE_KEY = "zw_last_grade";
  const STATS_KEY = "zw_stats_v1";
  const FONT_KEY = "zw_font_scale";
  const WRONG_KEY = "zw_wrong_v1";
  const BOOKMARK_KEY = "zw_bookmarks_v1";

  const state = {
    grade: null,
    passages: null,
    knowledge: null,
    unifiedKnowledge: null,
    vocabQuiz: null,
    jyutping: {},
    currentPassage: null,
    guideOpen: false,
    quizKind: null,
    quizPool: [],
    quizOrder: [],
    quizCursor: 0,
    quizLocked: false,
    quizCorrect: 0,
    quizAnswered: 0,
    quizMeta: null,
    knowledgeTopicId: null,
    retestQueue: [],
    retestIndex: 0,
    retestLocked: false,
    retestCorrect: 0,
  };

  const HL_KIND_LABEL = { shi: "實詞", xu: "虛詞", tong: "通假", huo: "活用" };

  const $ = (sel) => document.querySelector(sel);
  const views = {
    home: $("#view-home"),
    hub: $("#view-hub"),
    "knowledge-list": $("#view-knowledge-list"),
    knowledge: $("#view-knowledge"),
    "passage-list": $("#view-passage-list"),
    passage: $("#view-passage"),
    quiz: $("#view-quiz"),
    bookmarks: $("#view-bookmarks"),
    wrong: $("#view-wrong"),
    settings: $("#view-settings"),
    retest: $("#view-retest"),
  };

  function show(name) {
    Object.keys(views).forEach((k) => {
      if (views[k]) views[k].classList.toggle("active", k === name);
    });
    const quizMode = name === "quiz" || name === "retest";
    $("#app").classList.toggle("quiz-mode", quizMode);
    window.scrollTo(0, 0);
    syncTab(name);
  }

  function syncTab(name) {
    let tab = "home";
    if (name === "wrong" || name === "retest") tab = "wrong";
    else if (name === "bookmarks") tab = "bookmark";
    else if (name === "settings") tab = "me";
    else if (
      name === "hub" ||
      name === "knowledge-list" ||
      name === "knowledge" ||
      name === "passage-list" ||
      name === "passage" ||
      name === "quiz"
    )
      tab = "practice";
    document.querySelectorAll(".tabbar .tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });
  }

  function gradeLabel(id) {
    const g = GRADES.find((x) => x.id === id);
    return g ? g.label : id;
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1800);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }


  function lettersFor(n) {
    return LETTERS.slice(0, n);
  }

  /** Build HTML for overall explain + per-option paragraphs (trusted JSON → escapeHtml). */
  function buildExplainHtml(q) {
    const letters = lettersFor((q.options || []).length || 4);
    let html = `<h4>解釋</h4><p>${escapeHtml(q.explain || "")}</p>`;
    const oes = q.optionExplains;
    if (Array.isArray(oes) && oes.length) {
      html += `<div class="option-explains">`;
      oes.forEach((text, i) => {
        if (text == null || text === "") return;
        const ok = i === q.answer;
        html += `<div class="opt-exp ${ok ? "is-correct" : "is-wrong"}">`;
        html += `<span class="opt-exp-label">${letters[i] || i} · ${ok ? "正確" : "錯項"}</span>`;
        html += `<p>${escapeHtml(text)}</p></div>`;
      });
      html += `</div>`;
    }
    return html;
  }

  function fillExplainPanel(panel, q) {
    if (!panel) return;
    panel.innerHTML = buildExplainHtml(q);
    panel.classList.add("show");
  }


  function uid() {
    return "w_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function rememberGrade(id) {
    state.grade = id;
    try {
      localStorage.setItem(LAST_GRADE_KEY, id);
    } catch (_) {}
  }

  function lastGrade() {
    try {
      return localStorage.getItem(LAST_GRADE_KEY) || state.grade || "s1";
    } catch (_) {
      return state.grade || "s1";
    }
  }

  /* ---------- Font scale ---------- */
  function applyFontScale(scale) {
    const allowed = ["sm", "md", "lg", "xl"];
    if (allowed.indexOf(scale) < 0) scale = "md";
    document.documentElement.dataset.font = scale;
    try {
      localStorage.setItem(FONT_KEY, scale);
    } catch (_) {}
    document.querySelectorAll(".font-opt").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.scale === scale);
    });
  }

  const setFontScale = applyFontScale;

  function initFontScale() {
    let scale = "md";
    try {
      scale = localStorage.getItem(FONT_KEY) || "md";
    } catch (_) {}
    applyFontScale(scale);
  }

  /* ---------- Wrong book storage ---------- */
  function loadWrongs() {
    try {
      const raw = localStorage.getItem(WRONG_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function saveWrongs(arr) {
    try {
      localStorage.setItem(WRONG_KEY, JSON.stringify(arr));
    } catch (_) {
      toast("本機儲存空間不足");
    }
  }

  function wrongKeyOf(entry) {
    return [
      entry.grade || "",
      entry.type || "",
      entry.passageId || "",
      entry.knowledgeId || "",
      entry.questionId || "",
    ].join("|");
  }

  function addWrong(entry) {
    const list = loadWrongs();
    const key = wrongKeyOf(entry);
    const idx = list.findIndex((x) => wrongKeyOf(x) === key);
    entry.id = entry.id || uid();
    entry.timestamp = entry.timestamp || Date.now();
    entry.corrected = false;
    if (idx >= 0) {
      entry.id = list[idx].id;
      list[idx] = entry;
    } else {
      list.unshift(entry);
    }
    saveWrongs(list);
  }

  function markCorrected(id) {
    const list = loadWrongs();
    const item = list.find((x) => x.id === id);
    if (item) {
      item.corrected = true;
      item.correctedAt = Date.now();
      saveWrongs(list);
    }
  }

  function removeWrong(id) {
    saveWrongs(loadWrongs().filter((x) => x.id !== id));
  }

  function clearWrongs() {
    saveWrongs([]);
  }


  /* ---------- Bookmarks (local) ---------- */
  function loadBookmarks() {
    try {
      const raw = localStorage.getItem(BOOKMARK_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function saveBookmarks(arr) {
    try {
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(arr));
    } catch (_) {
      toast("本機儲存空間不足");
    }
  }

  function bookmarkKeyOf(entry) {
    return [
      entry.kind || "",
      entry.grade || "",
      entry.passageId || "",
      entry.knowledgeId || "",
      entry.questionId || "",
    ].join("|");
  }

  function isBookmarked(entry) {
    const key = bookmarkKeyOf(entry);
    return loadBookmarks().some((x) => bookmarkKeyOf(x) === key);
  }

  function toggleBookmark(entry) {
    const list = loadBookmarks();
    const key = bookmarkKeyOf(entry);
    const idx = list.findIndex((x) => bookmarkKeyOf(x) === key);
    if (idx >= 0) {
      list.splice(idx, 1);
      saveBookmarks(list);
      toast("已取消書籤");
      return false;
    }
    const snap = Object.assign({}, entry);
    snap.id = snap.id || uid();
    snap.timestamp = Date.now();
    list.unshift(snap);
    saveBookmarks(list);
    toast("已加入書籤");
    return true;
  }

  function clearBookmarks() {
    saveBookmarks([]);
  }

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function buildShuffledOrder(n) {
    const order = [];
    for (let i = 0; i < n; i++) order.push(i);
    return shuffleInPlace(order);
  }


  function recordAnswer(ok) {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      const s = raw ? JSON.parse(raw) : { attempted: 0, correct: 0 };
      s.attempted = (Number(s.attempted) || 0) + 1;
      if (ok) s.correct = (Number(s.correct) || 0) + 1;
      localStorage.setItem(STATS_KEY, JSON.stringify(s));
    } catch (_) {}
  }

  /* ---------- Classical text (full, no truncate) + P2 highlights ---------- */
  function paragraphBlocks(raw) {
    const text = String(raw == null ? "" : raw);
    const blocks = text.split(/\n\s*\n/).map((s) => s.replace(/^\n+|\n+$/g, ""));
    const meaningful = blocks.filter((b) => b.length > 0);
    if (meaningful.length > 1) return meaningful;
    if (text.indexOf("\n") !== -1) {
      return text.split("\n").filter((line) => line.trim());
    }
    const soft = softParagraphs(text);
    return soft.length ? soft : [text];
  }

  function softParagraphs(text) {
    const parts = [];
    let buf = "";
    for (let i = 0; i < text.length; i++) {
      buf += text[i];
      const ch = text[i];
      const next = text[i + 1] || "";
      if ((ch === "。" || ch === "！" || ch === "？") && buf.length >= 28) {
        if (next === "「" || buf.length >= 40) {
          parts.push(buf);
          buf = "";
        }
      }
    }
    if (buf) parts.push(buf);
    if (parts.join("") !== text) return [text];
    return parts.length ? parts : [text];
  }

  function buildHighlightIndex(highlights) {
    const list = Array.isArray(highlights) ? highlights.slice() : [];
    list.sort((a, b) => String(b.text || "").length - String(a.text || "").length);
    return list.filter((h) => h && h.text);
  }

  function wrapHighlights(plain, highlights) {
    const list = buildHighlightIndex(highlights);
    if (!list.length) return escapeHtml(plain).replace(/\n/g, "<br>");
    let i = 0;
    let out = "";
    while (i < plain.length) {
      let matched = null;
      for (let hi = 0; hi < list.length; hi++) {
        const t = list[hi].text;
        if (t && plain.substr(i, t.length) === t) {
          matched = list[hi];
          break;
        }
      }
      if (matched) {
        const kind = matched.kind || "shi";
        const t = matched.text;
        const gloss = matched.gloss || "";
        out +=
          '<button type="button" class="hl hl-' +
          escapeHtml(kind) +
          '" data-hl="' +
          escapeHtml(t) +
          '" data-kind="' +
          escapeHtml(kind) +
          '" data-gloss="' +
          escapeHtml(gloss) +
          '">' +
          escapeHtml(t) +
          "</button>";
        i += t.length;
      } else {
        const ch = plain[i];
        if (ch === "\n") out += "<br>";
        else out += escapeHtml(ch);
        i += 1;
      }
    }
    return out;
  }

  function bindHighlightClicks(root) {
    if (!root) return;
    root.querySelectorAll("[data-hl]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openWordSheet({
          text: btn.dataset.hl,
          kind: btn.dataset.kind,
          gloss: btn.dataset.gloss || "",
        });
      });
    });
  }

  function fillClassical(el, raw, highlights) {
    if (!el) return;
    const paras = paragraphBlocks(raw);
    if (!paras.length) {
      el.textContent = "";
      return;
    }
    el.innerHTML = paras
      .map((p) => "<p>" + wrapHighlights(p, highlights) + "</p>")
      .join("");
    if (highlights && highlights.length) {
      bindHighlightClicks(el);
    }
  }

  function renderClassicalText(raw, highlights) {
    fillClassical($("#pass-text"), raw, highlights);
  }

  function lookupJyutping(text) {
    const jp = state.jyutping || {};
    if (!text) return "";
    if (jp[text]) return jp[text];
    const parts = [];
    for (let i = 0; i < text.length; i++) {
      parts.push(jp[text[i]] || "?");
    }
    return parts.join(" ");
  }

  function resolveGloss(hl, passage) {
    if (hl && hl.gloss) return hl.gloss;
    const word = (hl && hl.text) || "";
    const kind = (hl && hl.kind) || "";
    const kindLabel = HL_KIND_LABEL[kind] || "";
    const notes = (passage && passage.guide && passage.guide.notes) || [];
    for (let i = 0; i < notes.length; i++) {
      const t = notes[i].text || "";
      if (word && t.indexOf(word) >= 0) {
        const parts = t.split(/[。；;]/);
        for (let j = 0; j < parts.length; j++) {
          if (parts[j].indexOf(word) >= 0) {
            const s = parts[j].trim();
            if (s) return s;
          }
        }
        return t;
      }
    }
    if (kindLabel) return kindLabel + "。見語譯／段旨。";
    return "見語譯／段旨";
  }

  function playCantonese(text) {
    if (!text) {
      toast("無可播放字詞");
      return;
    }
    if (!window.speechSynthesis) {
      toast("此裝置無法播放語音");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-HK";
      u.rate = 0.9;
      const voices = window.speechSynthesis.getVoices() || [];
      const pick =
        voices.find((v) => v.lang === "zh-HK") ||
        voices.find((v) =>
          /yue|cantonese|hong\s*kong|hk/i.test(v.name + " " + v.lang)
        ) ||
        voices.find((v) => /^zh/i.test(v.lang || ""));
      if (pick) u.voice = pick;
      u.onerror = function () {
        toast("播放失敗");
      };
      window.speechSynthesis.speak(u);
    } catch (_) {
      toast("播放失敗");
    }
  }

  function openWordSheet(hl) {
    const sheet = $("#word-sheet");
    if (!sheet) return;
    const p = state.currentPassage;
    const word = (hl && hl.text) || "";
    $("#ws-source").textContent = (p && p.source) || "本課注釋";
    $("#ws-word").textContent = word;
    $("#ws-jyut").textContent = lookupJyutping(word) || "暫無粵拼";
    $("#ws-gloss").textContent = resolveGloss(hl, p);
    sheet.dataset.speak = word;
    sheet.classList.remove("hidden");
    sheet.hidden = false;
  }

  function hideWordSheet() {
    const sheet = $("#word-sheet");
    if (!sheet) return;
    sheet.classList.add("hidden");
    sheet.hidden = true;
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (_) {}
  }

  function setGuideOpen(open) {
    state.guideOpen = !!open;
    const plain = $("#pass-plain");
    const explain = $("#pass-explain");
    const btn = $("#btn-toggle-guide");
    const label = $("#btn-toggle-guide-label");
    if (btn) {
      btn.classList.toggle("is-open", state.guideOpen);
      btn.setAttribute("aria-expanded", state.guideOpen ? "true" : "false");
    }
    if (label) label.textContent = state.guideOpen ? "關閉解釋" : "顯示解釋";
    if (plain) plain.classList.toggle("hidden", state.guideOpen);
    if (explain) {
      if (state.guideOpen) {
        explain.classList.remove("hidden");
        explain.hidden = false;
      } else {
        explain.classList.add("hidden");
        explain.hidden = true;
        hideWordSheet();
      }
    }
    const p = state.currentPassage;
    if (!p) return;
    if (state.guideOpen) renderExplainTables(p);
    else renderClassicalText(p.text, null);
  }

  function noteForPara(guide, idx1) {
    const notes = (guide && guide.notes) || [];
    const hit = notes.find((n) => Number(n.para) === idx1);
    return hit && hit.text ? hit.text : "";
  }

  function renderExplainTables(p) {
    const box = $("#pass-explain");
    if (!box) return;
    const g = (p && p.guide) || null;
    if (!g) {
      box.innerHTML =
        '<p class="page-sub" style="margin:0">本篇解釋稍後補充。</p>';
      return;
    }
    const paras = paragraphBlocks(p.text || "");
    const sections = Array.isArray(g.sections) ? g.sections : null;
    const highlights = p.highlights || [];
    const dash = "—";
    box.innerHTML = paras
      .map((paraText, i) => {
        const sec = sections && sections[i] ? sections[i] : null;
        const label = (sec && sec.label) || "第" + (i + 1) + "段";
        let translation;
        let plain;
        let theme;
        if (sec) {
          translation = sec.translation || dash;
          plain = sec.plain || dash;
          theme = sec.theme || dash;
        } else if (i === 0) {
          translation = g.translation || dash;
          plain = g.plain || dash;
          theme = noteForPara(g, 1) || g.theme || dash;
        } else {
          translation = dash;
          plain = dash;
          theme = noteForPara(g, i + 1) || dash;
        }
        return (
          '<table class="explain-table" role="table"><tbody>' +
          '<tr><th scope="row">段落劃分</th><td>' +
          escapeHtml(label) +
          "</td></tr>" +
          '<tr><th scope="row">原文</th><td class="cell-classical">' +
          wrapHighlights(paraText, highlights) +
          "</td></tr>" +
          '<tr><th scope="row">語譯</th><td>' +
          escapeHtml(translation) +
          "</td></tr>" +
          '<tr><th scope="row">淺白解讀</th><td>' +
          escapeHtml(plain) +
          "</td></tr>" +
          '<tr><th scope="row">段旨</th><td>' +
          escapeHtml(theme) +
          "</td></tr>" +
          "</tbody></table>"
        );
      })
      .join("");
    bindHighlightClicks(box);
  }

  function preparePassageGuide(p) {
    const btn = $("#btn-toggle-guide");
    if (btn) btn.classList.toggle("hidden", !(p && p.guide));
  }

  /* ---------- Home ---------- */
  function renderHome() {
    const list = $("#grade-list");
    list.innerHTML = GRADES.map((g) => {
      const sub = g.coming ? "內容即將推出" : g.desc;
      return `<button type="button" class="nav-card" data-grade="${g.id}">
        <div class="icon-wrap"><img src="art/ui/icon_grade.png" alt="" /></div>
        <div class="body"><strong>${g.label}</strong><span>${sub}</span></div>
        <span class="chev">›</span>
      </button>`;
    }).join("");
    list.querySelectorAll("[data-grade]").forEach((btn) => {
      btn.addEventListener("click", () => {
        rememberGrade(btn.dataset.grade);
        openPassageList();
      });
    });
  }

  /* ---------- Knowledge (unified; grade UI retired) ---------- */
  /** Prefer s3 → s2 → s1 for explanation HTML; practice merges s1→s2→s3 by stem. */
  function buildUnifiedKnowledge(knowledge) {
    const unified = {};
    if (!knowledge) return unified;
    const topics = knowledge.topics || [];
    topics.forEach((meta) => {
      const tid = meta.id;
      let title = meta.title || tid;
      let html = "";
      for (const g of ["s3", "s2", "s1"]) {
        const t = knowledge[g] && knowledge[g][tid];
        if (t && t.html) {
          html = t.html;
          title = t.title || title;
          break;
        }
      }
      const practice = [];
      const seen = Object.create(null);
      for (const g of ["s1", "s2", "s3"]) {
        const t = knowledge[g] && knowledge[g][tid];
        if (!t || !Array.isArray(t.practice)) continue;
        t.practice.forEach((q) => {
          const stem = q && q.stem != null ? String(q.stem) : "";
          if (!stem || seen[stem]) return;
          seen[stem] = true;
          practice.push(q);
        });
      }
      unified[tid] = { title: title, html: html, practice: practice };
    });
    return unified;
  }

  function getUnifiedTopic(topicId) {
    return (state.unifiedKnowledge && state.unifiedKnowledge[topicId]) || null;
  }

  /** @deprecated knowledge no longer uses grade select; alias → list */
  function openKnowledgeGradeSelect() {
    openKnowledgeList();
  }

  /** @deprecated hub no longer splits knowledge/passage; keep alias for back nav */
  function openHub(_gradeId) {
    openKnowledgeList();
  }

  function openKnowledgeList() {
    if (!state.knowledge || !state.unifiedKnowledge) {
      toast("文言知識尚未載入");
      return;
    }
    const topics = (state.knowledge.topics || [])
      .slice()
      .sort((a, b) => a.order - b.order);
    const gk = state.unifiedKnowledge;
    $("#know-list-sub").textContent = "七個主題 · 掃讀與小練";
    const box = $("#knowledge-list");
    box.innerHTML = topics
      .map((t, i) => {
        const has = !!(gk[t.id] && (gk[t.id].html || (gk[t.id].practice && gk[t.id].practice.length)));
        return `<button type="button" class="list-row" data-topic="${t.id}" ${has ? "" : "disabled"}>
        <span class="num">${i + 1}.</span>
        <span class="label">${escapeHtml(t.title)}</span>
        <span class="chev">›</span>
      </button>`;
      })
      .join("");
    box.querySelectorAll("[data-topic]").forEach((btn) => {
      btn.addEventListener("click", () => openKnowledge(btn.dataset.topic));
    });
    show("knowledge-list");
  }

  const KNOW_DECO = {
    features: "art/knowledge/deco_features.png",
    "howto-read": "art/knowledge/deco_howto_read.png",
    particles: "art/knowledge/deco_particles.png",
    polysemy: "art/knowledge/deco_polysemy.png",
    "ancient-modern": "art/knowledge/deco_ancient_modern.png",
    "loan-chars": "art/knowledge/deco_loan_chars.png",
    "sentence-patterns": "art/knowledge/deco_sentence_patterns.png",
  };

  function openKnowledge(topicId) {
    state.knowledgeTopicId = topicId;
    const topic = getUnifiedTopic(topicId);
    if (!topic) {
      toast("此主題內容即將推出");
      return;
    }
    $("#know-title").textContent = topic.title;
    const deco = KNOW_DECO[topicId];
    const decoHtml = deco
      ? '<img class="know-deco" src="' +
        deco +
        '" alt="" width="720" height="240" />'
      : "";
    $("#know-content").innerHTML = decoHtml + (topic.html || "");

    const practiceBox = $("#know-practice");
    const practiceBody = $("#know-practice-body");
    if (practiceBody) {
      practiceBody.innerHTML = "";
      practiceBody.classList.add("hidden");
    }
    if (topic.practice && topic.practice.length) {
      practiceBox.classList.remove("hidden");
      const sub = $("#know-practice-sub");
      if (sub) {
        sub.textContent =
          "共 " + topic.practice.length + " 題 · 局內不重複 · 可連續操練";
      }
      const startBtn = $("#btn-start-know-quiz");
      if (startBtn) {
        startBtn.onclick = () => startKnowledgeQuiz(topicId);
      }
    } else {
      practiceBox.classList.add("hidden");
    }
    show("knowledge");
  }

  /* ---------- Passages ---------- */
  function openPassageList() {
    const list = (state.passages && state.passages[state.grade]) || [];
    $("#pass-list-sub").textContent =
      gradeLabel(state.grade) + " · 共 " + list.length + " 篇";
    const box = $("#passage-list");
    if (!list.length) {
      box.innerHTML = `<div class="placeholder-s3"><img src="art/ui/badge_coming_soon.png" alt="內容即將推出" /><p>文言篇章內容即將推出。<br/>請先研習文言知識，或選讀中一、中二篇章。</p></div>`;
    } else {
      box.innerHTML = list
        .map(
          (p, i) => `<button type="button" class="list-row" data-pid="${p.id}">
          <span class="num">${i + 1}.</span>
          <span class="label">${escapeHtml(p.title)}<br/><span class="meta">${escapeHtml(p.source)} · ${p.questions.length} 題</span></span>
          <span class="chev">›</span>
        </button>`
        )
        .join("");
      box.querySelectorAll("[data-pid]").forEach((btn) => {
        btn.addEventListener("click", () => openPassage(btn.dataset.pid));
      });
    }
    show("passage-list");
  }

  function openPassage(pid) {
    const list = state.passages[state.grade] || [];
    const p = list.find((x) => x.id === pid);
    if (!p) return;
    state.currentPassage = p;
    hideWordSheet();
    $("#pass-title").textContent = p.title;
    const src = $("#pass-source");
    if (src) src.textContent = p.source || "";
    preparePassageGuide(p);
    state.guideOpen = false;
    renderClassicalText(p.text, null);
    const plainBox = $("#pass-plain");
    if (plainBox) plainBox.classList.remove("hidden");
    const explain = $("#pass-explain");
    if (explain) {
      explain.innerHTML = "";
      explain.classList.add("hidden");
      explain.hidden = true;
    }
    const btn = $("#btn-toggle-guide");
    const label = $("#btn-toggle-guide-label");
    if (btn) {
      btn.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }
    if (label) label.textContent = "顯示解釋";
    show("passage");
  }

  /* ---------- Quiz (unified infinite pool) ---------- */
  function normalizePassageQuestion(p, qi, q) {
    return {
      kind: "passage",
      grade: state.grade,
      passageId: p.id,
      knowledgeId: "",
      questionId: p.id + "_q" + qi,
      stem: q.stem,
      options: (q.options || []).slice(),
      answer: q.answer,
      explain: q.explain || "",
      optionExplains: Array.isArray(q.optionExplains) ? q.optionExplains.slice() : null,
      tag: q.tag || "篇章練習",
      refLabel: "《" + p.title + "》",
      passageTitle: p.title,
      passageFullText: p.text || "",
      sourceLabel: gradeLabel(state.grade) + " · 《" + p.title + "》",
    };
  }

  function normalizeKnowledgeQuestion(topicId, topic, qi, q) {
    return {
      kind: "knowledge",
      grade: "",
      passageId: "",
      knowledgeId: topicId,
      questionId: topicId + "_q" + qi,
      stem: q.stem,
      options: (q.options || []).slice(),
      answer: q.answer,
      explain: q.explain || "",
      optionExplains: Array.isArray(q.optionExplains) ? q.optionExplains.slice() : null,
      tag: "知識小練",
      refLabel: topic.title,
      passageTitle: topic.title,
      passageFullText: "",
      sourceLabel: "文言知識 · " + topic.title,
    };
  }

  function normalizeVocabQuestion(q) {
    const word = q.targetWord || "";
    return {
      kind: "vocab",
      grade: "",
      passageId: "",
      knowledgeId: "",
      questionId: q.id,
      stem: "「" + word + "」在句中的意思是？",
      options: (q.options || []).slice(),
      answer: q.answer,
      explain: q.explain || "",
      optionExplains: Array.isArray(q.optionExplains) ? q.optionExplains.slice() : null,
      tag: "字詞考核",
      refLabel: q.source || "",
      sentence: q.sentence || "",
      targetWord: word,
      source: q.source || "",
      passageTitle: "文言字詞考核",
      passageFullText: q.sentence || "",
      sourceLabel: "字詞考核 · " + (q.source || ""),
    };
  }

  function normalizeBookmarkEntry(item) {
    return {
      kind: item.kind || item.type || "passage",
      grade: item.grade || "",
      passageId: item.passageId || "",
      knowledgeId: item.knowledgeId || "",
      questionId: item.questionId || item.id,
      stem: item.stem,
      options: (item.options || []).slice(),
      answer: item.answer != null ? item.answer : item.correctAnswer,
      explain: item.explain || item.explanation || "",
      optionExplains: Array.isArray(item.optionExplains) ? item.optionExplains.slice() : null,
      tag: item.tag || "書籤",
      refLabel: item.refLabel || item.sourceLabel || "",
      sentence: item.sentence || "",
      targetWord: item.targetWord || "",
      source: item.source || "",
      passageTitle: item.passageTitle || "",
      passageFullText: item.passageFullText || "",
      sourceLabel: item.sourceLabel || "",
    };
  }

  function currentQuizQuestion() {
    if (!state.quizOrder.length || state.quizCursor < 0) return null;
    if (state.quizCursor >= state.quizOrder.length) return null;
    const idx = state.quizOrder[state.quizCursor];
    return state.quizPool[idx] || null;
  }

  function bookmarkPayloadFromCurrent() {
    const q = currentQuizQuestion();
    if (!q) return null;
    return {
      kind: q.kind,
      grade: q.grade,
      passageId: q.passageId,
      knowledgeId: q.knowledgeId,
      questionId: q.questionId,
      stem: q.stem,
      options: q.options.slice(),
      answer: q.answer,
      explain: q.explain,
      optionExplains: q.optionExplains,
      tag: q.tag,
      refLabel: q.refLabel,
      sentence: q.sentence || "",
      targetWord: q.targetWord || "",
      source: q.source || "",
      passageTitle: q.passageTitle,
      passageFullText: q.passageFullText,
      sourceLabel: q.sourceLabel,
    };
  }

  function syncBookmarkButton() {
    const btn = $("#btn-quiz-bookmark");
    if (!btn) return;
    const payload = bookmarkPayloadFromCurrent();
    if (!payload) {
      btn.classList.remove("is-on");
      return;
    }
    btn.classList.toggle("is-on", isBookmarked(payload));
  }

  function beginQuizSession(kind, pool, meta) {
    if (!pool || !pool.length) {
      toast("暫無題目");
      return;
    }
    state.quizKind = kind;
    state.quizPool = pool;
    state.quizOrder = buildShuffledOrder(pool.length);
    state.quizCursor = 0;
    state.quizLocked = false;
    state.quizCorrect = 0;
    state.quizAnswered = 0;
    state.quizMeta = meta || {};
    state.quizMeta.reshuffled = false;

    $("#quiz-done").classList.add("hidden");
    $("#quiz-body").classList.remove("hidden");
    $("#explain-panel").classList.remove("show");
    $("#quiz-footer").classList.add("hidden");

    const titleEl = $("#quiz-title");
    if (titleEl) titleEl.textContent = (meta && meta.title) || "練習";

    renderQuestion();
    show("quiz");
  }

  function reshuffleQuizPool() {
    state.quizOrder = buildShuffledOrder(state.quizPool.length);
    state.quizCursor = 0;
    state.quizLocked = false;
    state.quizCorrect = 0;
    state.quizAnswered = 0;
    if (!state.quizMeta) state.quizMeta = {};
    state.quizMeta.reshuffled = true;
    $("#quiz-done").classList.add("hidden");
    $("#quiz-body").classList.remove("hidden");
    $("#explain-panel").classList.remove("show");
    $("#quiz-footer").classList.add("hidden");
    renderQuestion();
    toast("題庫已洗牌，繼續不重複操練");
  }

  function startQuiz() {
    const p = state.currentPassage;
    if (!p || !p.questions || !p.questions.length) {
      toast("本篇暫無練習題");
      return;
    }
    const pool = p.questions.map((q, qi) => normalizePassageQuestion(p, qi, q));
    beginQuizSession("passage", pool, {
      title: "篇章練習",
      back: "passage",
      doneBack: "passage-list",
    });
  }

  function startKnowledgeQuiz(topicId) {
    const topic = getUnifiedTopic(topicId);
    if (!topic || !topic.practice || !topic.practice.length) {
      toast("此主題暫無練習");
      return;
    }
    state.knowledgeTopicId = topicId;
    const pool = topic.practice.map((q, qi) =>
      normalizeKnowledgeQuestion(topicId, topic, qi, q)
    );
    beginQuizSession("knowledge", pool, {
      title: "知識小練",
      back: "knowledge",
      doneBack: "knowledge",
    });
  }

  function startVocabQuiz() {
    const raw =
      (state.vocabQuiz && state.vocabQuiz.questions) ||
      (Array.isArray(state.vocabQuiz) ? state.vocabQuiz : null);
    if (!raw || !raw.length) {
      toast("字詞考核題庫尚未載入");
      return;
    }
    const pool = raw.map(normalizeVocabQuestion);
    beginQuizSession("vocab", pool, {
      title: "文言字詞考核",
      back: "home",
      doneBack: "home",
    });
  }

  function startBookmarkQuiz(entry) {
    const q = normalizeBookmarkEntry(entry);
    beginQuizSession("bookmark", [q], {
      title: "書籤重做",
      back: "bookmarks",
      doneBack: "bookmarks",
      single: true,
    });
  }

  function renderQuestion() {
    const q = currentQuizQuestion();
    if (!q) {
      showQuizDone();
      return;
    }
    state.quizLocked = false;
    $("#explain-panel").classList.remove("show");
    $("#quiz-footer").classList.add("hidden");

    const total = state.quizOrder.length;
    const pos = state.quizCursor + 1;
    const isLast = pos >= total;
    const nextBtn = $("#btn-next");
    if (nextBtn) {
      nextBtn.textContent = isLast
        ? state.quizMeta && state.quizMeta.single
          ? "完成"
          : "本輪結束"
        : "下一題";
    }

    const tip =
      state.quizMeta && state.quizMeta.reshuffled && state.quizCursor === 0
        ? '<p class="reshuffle-tip">題庫已洗牌 · 本輪不重複</p>'
        : "";

    $("#quiz-meta").innerHTML =
      tip +
      `<span class="chip chip-orange">${escapeHtml(q.tag || "練習")}</span>` +
      `<span class="quiz-count">${pos} / ${total}</span>`;

    const letters = q.options.length === 3 ? ["A", "B", "C"] : LETTERS;
    const body = $("#quiz-body");
    let head = "";
    if (q.kind === "vocab") {
      const sent = escapeHtml(q.sentence || "");
      const tw = escapeHtml(q.targetWord || "");
      let marked = sent;
      if (tw && sent.indexOf(tw) >= 0) {
        marked = sent.replace(tw, '<span class="tw">' + tw + "</span>");
      }
      head =
        `<div class="vocab-sentence">${marked}</div>` +
        `<div class="vocab-source">${escapeHtml(q.source || q.refLabel || "")}</div>` +
        `<div class="vocab-ask">${escapeHtml(q.stem)}</div>`;
    } else {
      head =
        (q.refLabel
          ? `<div class="q-ref">${escapeHtml(q.refLabel)}</div>`
          : "") + `<div class="q-stem">${escapeHtml(q.stem)}</div>`;
    }
    body.innerHTML = head + `<div id="options"></div>`;

    const opts = body.querySelector("#options");
    q.options.forEach((opt, oi) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-card";
      btn.innerHTML = `<span class="letter">${letters[oi]}</span>
        <span class="opt-text">${escapeHtml(opt)}</span>
        <img class="mark" src="art/ui/mark_correct.png" alt="" data-mark="ok" />
        <img class="mark" src="art/ui/mark_wrong.png" alt="" data-mark="bad" style="display:none" />
        <span class="your-choice">你的選擇</span>`;
      btn.addEventListener("click", () => selectOption(oi, btn, opts, q));
      opts.appendChild(btn);
    });

    syncBookmarkButton();
  }

  function selectOption(oi, btn, opts, q) {
    if (state.quizLocked) return;
    state.quizLocked = true;
    const correct = oi === q.answer;
    state.quizAnswered += 1;
    if (correct) state.quizCorrect += 1;
    recordAnswer(correct);

    opts.querySelectorAll(".option-card").forEach((b) => {
      b.disabled = true;
    });

    if (correct) {
      btn.classList.add("correct");
      showMark(btn, true);
    } else {
      btn.classList.add("wrong");
      showMark(btn, false);
      const right = opts.children[q.answer];
      if (right) {
        right.classList.add("correct");
        showMark(right, true);
      }
      addWrong({
        type: q.kind === "vocab" ? "vocab" : q.kind === "knowledge" ? "knowledge" : "passage",
        grade: q.grade != null ? q.grade : state.grade || "",
        passageId: q.passageId || "",
        knowledgeId: q.knowledgeId || "",
        questionId: q.questionId,
        stem: q.kind === "vocab" ? (q.sentence || "") + " —— " + q.stem : q.stem,
        options: q.options.slice(),
        userAnswer: oi,
        correctAnswer: q.answer,
        explanation: q.explain,
        optionExplains: Array.isArray(q.optionExplains) ? q.optionExplains.slice() : null,
        tag: q.tag || "練習",
        passageTitle: q.passageTitle || "",
        passageFullText: q.passageFullText || "",
        sourceLabel: q.sourceLabel || "",
      });
    }

    fillExplainPanel($("#explain-panel"), q);
    $("#quiz-footer").classList.remove("hidden");
  }

  function showMark(btn, ok) {
    const okImg = btn.querySelector('[data-mark="ok"]');
    const badImg = btn.querySelector('[data-mark="bad"]');
    if (ok) {
      okImg.style.display = "block";
      badImg.style.display = "none";
    } else {
      okImg.style.display = "none";
      badImg.style.display = "block";
    }
  }

  function showQuizDone() {
    $("#quiz-body").classList.add("hidden");
    $("#explain-panel").classList.remove("show");
    $("#quiz-footer").classList.add("hidden");
    $("#quiz-done").classList.remove("hidden");
    const title = $("#quiz-done-title");
    if (title) {
      title.textContent =
        state.quizMeta && state.quizMeta.single ? "書籤題完成" : "本輪練習結束";
    }
    const answered = state.quizAnswered || 0;
    $("#quiz-score").textContent =
      answered > 0
        ? "本輪答對 " + state.quizCorrect + " / " + answered + " 題"
        : "尚未作答";
    const cont = $("#btn-done-continue");
    if (cont) {
      const single = !!(state.quizMeta && state.quizMeta.single);
      cont.classList.toggle("hidden", single || state.quizPool.length < 1);
      cont.textContent = "繼續練習（洗牌）";
    }
  }

  function nextQuestion() {
    if (state.quizCursor + 1 >= state.quizOrder.length) {
      showQuizDone();
      return;
    }
    state.quizCursor += 1;
    renderQuestion();
  }

  function endQuizRound() {
    showQuizDone();
  }

  function leaveQuiz() {
    const back = (state.quizMeta && state.quizMeta.back) || "home";
    if (back === "passage") show("passage");
    else if (back === "passage-list") openPassageList();
    else if (back === "knowledge") show("knowledge");
    else if (back === "bookmarks") openBookmarks();
    else show("home");
  }

  function leaveQuizDone() {
    const back = (state.quizMeta && state.quizMeta.doneBack) || "home";
    if (back === "passage-list") openPassageList();
    else if (back === "knowledge") show("knowledge");
    else if (back === "bookmarks") openBookmarks();
    else if (back === "passage") show("passage");
    else show("home");
  }

  /* ---------- Bookmarks UI ---------- */
  function openBookmarks() {
    renderBookmarkList();
    show("bookmarks");
  }

  function renderBookmarkList() {
    const list = loadBookmarks();
    const sub = $("#bm-sub");
    if (sub) sub.textContent = "本機共 " + list.length + " 題 · 點選回看重做";
    const box = $("#bm-list");
    if (!box) return;
    if (!list.length) {
      box.innerHTML =
        '<div class="placeholder-s3"><p>暫無書籤。<br/>答題時點右上角書籤即可收藏。</p></div>';
      return;
    }
    box.innerHTML = list
      .map((item) => {
        const stem = item.sentence
          ? item.sentence + "（" + (item.targetWord || "") + "）"
          : item.stem || "";
        const stemShort = stem.length > 48 ? stem.slice(0, 48) + "…" : stem;
        return `<article class="wrong-card" data-bmid="${escapeHtml(item.id)}">
          <button type="button" class="wrong-card-head" data-bm-open="${escapeHtml(item.id)}">
            <div class="wrong-card-main">
              <div class="wrong-badges">
                <span class="chip chip-orange">${escapeHtml(item.tag || "書籤")}</span>
              </div>
              <div class="wrong-stem">${escapeHtml(stemShort)}</div>
              <div class="wrong-meta">${escapeHtml(item.sourceLabel || item.refLabel || "")}</div>
            </div>
            <span class="chev">›</span>
          </button>
          <div class="wrong-actions" style="padding:0.5rem 0.75rem 0.75rem">
            <button type="button" class="link-btn" data-bm-redo="${escapeHtml(item.id)}">重做</button>
            <button type="button" class="link-btn danger" data-bm-del="${escapeHtml(item.id)}">移除</button>
          </div>
        </article>`;
      })
      .join("");

    box.querySelectorAll("[data-bm-open], [data-bm-redo]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.bmOpen || btn.dataset.bmRedo;
        const item = loadBookmarks().find((x) => x.id === id);
        if (item) startBookmarkQuiz(item);
      });
    });
    box.querySelectorAll("[data-bm-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        saveBookmarks(loadBookmarks().filter((x) => x.id !== btn.dataset.bmDel));
        renderBookmarkList();
        toast("已移除書籤");
      });
    });
  }

  /* ---------- Wrong book UI ---------- */
  function openWrongBook() {
    renderWrongList();
    show("wrong");
  }

  function renderWrongList() {
    const hideFixed = $("#wrong-hide-fixed") && $("#wrong-hide-fixed").checked;
    let list = loadWrongs();
    if (hideFixed) list = list.filter((x) => !x.corrected);
    $("#wrong-sub").textContent =
      "本機共 " + loadWrongs().length + " 題 · 答錯自動記入";
    const box = $("#wrong-list");
    if (!list.length) {
      box.innerHTML =
        '<div class="placeholder-s3"><p>暫無錯題。<br/>練習答錯後會自動出現於此。</p></div>';
      return;
    }
    box.innerHTML = list
      .map((item) => {
        const letters = item.options && item.options.length === 3 ? ["A", "B", "C"] : LETTERS;
        const userL = letters[item.userAnswer] || "?";
        const rightL = letters[item.correctAnswer] || "?";
        const userTxt = (item.options && item.options[item.userAnswer]) || "";
        const rightTxt = (item.options && item.options[item.correctAnswer]) || "";
        const stemShort =
          item.stem.length > 48 ? item.stem.slice(0, 48) + "…" : item.stem;
        return `<article class="wrong-card${item.corrected ? " fixed" : ""}" data-wid="${item.id}">
          <button type="button" class="wrong-card-head" data-toggle="${item.id}">
            <div class="wrong-card-main">
              <div class="wrong-badges">
                <span class="chip chip-orange">${escapeHtml(item.tag || "錯題")}</span>
                ${item.corrected ? '<span class="chip chip-green">已訂正</span>' : '<span class="chip chip-red">未訂正</span>'}
              </div>
              <div class="wrong-stem">${escapeHtml(stemShort)}</div>
              <div class="wrong-meta">${escapeHtml(item.sourceLabel || "")}</div>
            </div>
            <span class="chev">›</span>
          </button>
          <div class="wrong-detail hidden" id="wd-${item.id}">
            <div class="wrong-qa"><strong>你的答案</strong> ${userL}. ${escapeHtml(userTxt)}</div>
            <div class="wrong-qa ok"><strong>正確答案</strong> ${rightL}. ${escapeHtml(rightTxt)}</div>
            <div class="wrong-qa"><strong>解釋</strong> ${escapeHtml(item.explanation || "")}</div>
            <div class="wrong-actions">
              <button type="button" class="btn-outline" data-retest-one="${item.id}">重測本題</button>
              <button type="button" class="link-btn danger" data-del-wrong="${item.id}">刪除</button>
            </div>
          </div>
        </article>`;
      })
      .join("");

    box.querySelectorAll("[data-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.toggle;
        const detail = $("#wd-" + id);
        if (detail) detail.classList.toggle("hidden");
      });
    });
    box.querySelectorAll("[data-retest-one]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = loadWrongs().find((x) => x.id === btn.dataset.retestOne);
        if (item) startRetest([item]);
      });
    });
    box.querySelectorAll("[data-del-wrong]").forEach((btn) => {
      btn.addEventListener("click", () => {
        removeWrong(btn.dataset.delWrong);
        renderWrongList();
        toast("已刪除");
      });
    });
  }

  /* ---------- Retest ---------- */
  function startRetest(queue) {
    if (!queue || !queue.length) {
      toast("沒有可重測的題目");
      return;
    }
    state.retestQueue = queue.slice();
    state.retestIndex = 0;
    state.retestCorrect = 0;
    state.retestLocked = false;
    $("#retest-done").classList.add("hidden");
    $("#retest-body").classList.remove("hidden");
    $("#retest-explain").classList.remove("show");
    $("#retest-footer").classList.add("hidden");
    renderRetestQuestion();
    show("retest");
  }

  function renderRetestQuestion() {
    const item = state.retestQueue[state.retestIndex];
    if (!item) return;
    state.retestLocked = false;
    $("#retest-explain").classList.remove("show");
    $("#retest-footer").classList.add("hidden");
    $("#retest-progress").textContent =
      state.retestIndex + 1 + " / " + state.retestQueue.length;
    $("#btn-retest-next").textContent =
      state.retestIndex + 1 >= state.retestQueue.length ? "完成本輪" : "下一題";
    $("#btn-retest-prev").disabled = state.retestIndex === 0;

    const wrap = $("#retest-passage-wrap");
    if (item.type === "passage" && item.passageFullText) {
      wrap.classList.remove("hidden");
      fillClassical($("#retest-passage-text"), item.passageFullText);
    } else {
      wrap.classList.add("hidden");
      $("#retest-passage-text").innerHTML = "";
    }

    $("#retest-meta").innerHTML = `
      <span class="chip chip-orange">${escapeHtml(item.tag || "重測")}</span>
      <span class="quiz-count">${escapeHtml(item.sourceLabel || "")}</span>`;

    const letters =
      item.options && item.options.length === 3 ? ["A", "B", "C"] : LETTERS;
    const body = $("#retest-body");
    body.innerHTML = `
      <div class="q-ref">${item.passageTitle ? "《" + escapeHtml(item.passageTitle) + "》" : ""}</div>
      <div class="q-stem">${escapeHtml(item.stem)}</div>
      <div id="retest-options"></div>`;

    const opts = body.querySelector("#retest-options");
    (item.options || []).forEach((opt, oi) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-card";
      btn.innerHTML = `<span class="letter">${letters[oi]}</span>
        <span class="opt-text">${escapeHtml(opt)}</span>
        <img class="mark" src="art/ui/mark_correct.png" alt="" data-mark="ok" />
        <img class="mark" src="art/ui/mark_wrong.png" alt="" data-mark="bad" style="display:none" />
        <span class="your-choice">你的選擇</span>`;
      btn.addEventListener("click", () => selectRetest(oi, btn, opts, item));
      opts.appendChild(btn);
    });
  }

  function selectRetest(oi, btn, opts, item) {
    if (state.retestLocked) return;
    state.retestLocked = true;
    const correct = oi === item.correctAnswer;
    if (correct) {
      state.retestCorrect += 1;
      markCorrected(item.id);
    }
    recordAnswer(correct);

    opts.querySelectorAll(".option-card").forEach((b) => {
      b.disabled = true;
    });
    if (correct) {
      btn.classList.add("correct");
      showMark(btn, true);
    } else {
      btn.classList.add("wrong");
      showMark(btn, false);
      const right = opts.children[item.correctAnswer];
      if (right) {
        right.classList.add("correct");
        showMark(right, true);
      }
      /* keep in wrong book with updated user answer */
      addWrong(
        Object.assign({}, item, {
          userAnswer: oi,
          corrected: false,
          timestamp: Date.now(),
        })
      );
    }

    fillExplainPanel($("#retest-explain"), {
      explain: item.explanation || "",
      options: item.options || [],
      answer: item.correctAnswer,
      optionExplains: item.optionExplains || null,
    });
    $("#retest-footer").classList.remove("hidden");
  }

  function nextRetest() {
    if (state.retestIndex + 1 >= state.retestQueue.length) {
      $("#retest-body").classList.add("hidden");
      $("#retest-explain").classList.remove("show");
      $("#retest-footer").classList.add("hidden");
      $("#retest-passage-wrap").classList.add("hidden");
      $("#retest-done").classList.remove("hidden");
      $("#retest-score").textContent =
        "本輪答對 " +
        state.retestCorrect +
        " / " +
        state.retestQueue.length +
        " 題（答對已標為已訂正）";
      return;
    }
    state.retestIndex += 1;
    renderRetestQuestion();
  }

  function prevRetest() {
    if (state.retestIndex <= 0) return;
    state.retestIndex -= 1;
    renderRetestQuestion();
  }

  /* ---------- Settings ---------- */
  function openSettings() {
    applyFontScale(
      (function () {
        try {
          return localStorage.getItem(FONT_KEY) || "md";
        } catch (_) {
          return "md";
        }
      })()
    );
    show("settings");
  }

  /* ---------- Nav ---------- */
  document.querySelectorAll("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const go = btn.dataset.go;
      if (go === "home") show("home");
      else if (go === "hub" || go === "knowledge-grades") openKnowledgeList();
      else if (go === "knowledge-list") openKnowledgeList();
      else if (go === "passage-list") openPassageList();
    });
  });

  document.querySelectorAll("[data-toast]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (btn.classList.contains("tab") && !btn.dataset.toast) return;
      if (!btn.dataset.toast) return;
      /* only fire toast for explicit toast tabs / deco */
      if (btn.dataset.tab && ["wrong", "me", "home", "practice"].indexOf(btn.dataset.tab) >= 0 && !btn.dataset.toast)
        return;
      e.preventDefault();
      toast(btn.dataset.toast || "即將推出");
    });
  });

  document.querySelectorAll(".tabbar .tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      if (btn.dataset.toast) {
        toast(btn.dataset.toast);
        return;
      }
      if (tab === "home") {
        show("home");
        return;
      }
      if (tab === "practice") {
        const g = lastGrade();
        rememberGrade(g);
        openPassageList();
        return;
      }
      if (tab === "wrong") {
        openWrongBook();
        return;
      }
      if (tab === "bookmark") {
        openBookmarks();
        return;
      }
      if (tab === "me") {
        openSettings();
      }
    });
  });

  const gear = $("#btn-open-settings");
  if (gear) gear.addEventListener("click", openSettings);

  document.querySelectorAll(".font-opt").forEach((btn) => {
    btn.addEventListener("click", () => applyFontScale(btn.dataset.scale));
  });

  $("#btn-wrong-clear").addEventListener("click", () => {
    if (!loadWrongs().length) {
      toast("錯題本已是空的");
      return;
    }
    if (window.confirm("確定清空全部錯題？此操作無法復原。")) {
      clearWrongs();
      renderWrongList();
      toast("已清空");
    }
  });
  $("#btn-retest-all").addEventListener("click", () => {
    const hideFixed = $("#wrong-hide-fixed") && $("#wrong-hide-fixed").checked;
    let list = loadWrongs();
    if (hideFixed) list = list.filter((x) => !x.corrected);
    startRetest(list);
  });
  if ($("#wrong-hide-fixed")) {
    $("#wrong-hide-fixed").addEventListener("change", renderWrongList);
  }

  $("#btn-start-quiz").addEventListener("click", startQuiz);
  $("#btn-next").addEventListener("click", nextQuestion);
  const btnQuizEnd = $("#btn-quiz-end");
  if (btnQuizEnd) btnQuizEnd.addEventListener("click", endQuizRound);
  $("#btn-quiz-close").addEventListener("click", leaveQuiz);
  $("#btn-done-back").addEventListener("click", leaveQuizDone);
  const btnDoneCont = $("#btn-done-continue");
  if (btnDoneCont) btnDoneCont.addEventListener("click", reshuffleQuizPool);

  const btnBm = $("#btn-quiz-bookmark");
  if (btnBm) {
    btnBm.addEventListener("click", () => {
      const payload = bookmarkPayloadFromCurrent();
      if (!payload) return;
      toggleBookmark(payload);
      syncBookmarkButton();
    });
  }

  const btnHomeKnow = $("#btn-home-knowledge");
  if (btnHomeKnow) btnHomeKnow.addEventListener("click", openKnowledgeList);
  const btnHomeVocab = $("#btn-home-vocab");
  if (btnHomeVocab) btnHomeVocab.addEventListener("click", startVocabQuiz);
  const btnHomeBm = $("#btn-home-bookmarks");
  if (btnHomeBm) btnHomeBm.addEventListener("click", openBookmarks);
  const btnBmClear = $("#btn-bm-clear");
  if (btnBmClear) {
    btnBmClear.addEventListener("click", () => {
      if (!loadBookmarks().length) {
        toast("書籤已是空的");
        return;
      }
      if (window.confirm("確定清空全部書籤？此操作無法復原。")) {
        clearBookmarks();
        renderBookmarkList();
        toast("已清空書籤");
      }
    });
  }

  $("#btn-retest-close").addEventListener("click", openWrongBook);
  $("#btn-retest-next").addEventListener("click", nextRetest);
  $("#btn-retest-prev").addEventListener("click", prevRetest);
  $("#btn-retest-done-back").addEventListener("click", openWrongBook);

  const btnGuide = $("#btn-toggle-guide");
  if (btnGuide) {
    btnGuide.addEventListener("click", () => setGuideOpen(!state.guideOpen));
  }
  const wsClose = $("#ws-close");
  if (wsClose) wsClose.addEventListener("click", hideWordSheet);
  const wsMask = $("#ws-mask");
  if (wsMask) wsMask.addEventListener("click", hideWordSheet);
  const wsPlay = $("#ws-play");
  if (wsPlay) {
    wsPlay.addEventListener("click", () => {
      const sheet = $("#word-sheet");
      playCantonese(sheet && sheet.dataset.speak);
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideWordSheet();
  });

  /* ---------- Boot ---------- */
  initFontScale();
  Promise.all([
    fetch("data/passages.json").then((r) => r.json()),
    fetch("data/knowledge.json").then((r) => r.json()),
    fetch("data/jyutping.json").then((r) => r.json()).catch(() => ({})),
    fetch("data/vocab_quiz.json").then((r) => r.json()).catch(() => ({ questions: [] })),
  ])
    .then(([passages, knowledge, jyutping, vocabQuiz]) => {
      state.passages = passages;
      state.knowledge = knowledge;
      state.unifiedKnowledge = buildUnifiedKnowledge(knowledge);
      state.jyutping = jyutping || {};
      state.vocabQuiz = vocabQuiz || { questions: [] };
      renderHome();
      show("home");
    })
    .catch((err) => {
      console.error(err);
      $("#grade-list").innerHTML =
        '<p style="color:#E57373;padding:20px">無法載入資料，請重新整理。</p>';
    });
})();
