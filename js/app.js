(function () {
  "use strict";

  const GRADES = [
    { id: "s1", label: "中一", desc: "文言知識與篇章" },
    { id: "s2", label: "中二", desc: "文言知識與篇章" },
    { id: "s3", label: "中三", desc: "文言知識可學 · 篇章即將推出" },
  ];

  const LETTERS = ["A", "B", "C", "D"];
  const LAST_GRADE_KEY = "zw_last_grade";
  const STATS_KEY = "zw_stats_v1";
  const FONT_KEY = "zw_font_scale";
  const WRONG_KEY = "zw_wrong_v1";

  const state = {
    grade: null,
    passages: null,
    knowledge: null,
    currentPassage: null,
    quizIndex: 0,
    quizLocked: false,
    quizCorrect: 0,
    quizTotal: 0,
    knowledgeTopicId: null,
    retestQueue: [],
    retestIndex: 0,
    retestLocked: false,
    retestCorrect: 0,
  };

  const $ = (sel) => document.querySelector(sel);
  const views = {
    home: $("#view-home"),
    hub: $("#view-hub"),
    "knowledge-list": $("#view-knowledge-list"),
    knowledge: $("#view-knowledge"),
    "passage-list": $("#view-passage-list"),
    passage: $("#view-passage"),
    quiz: $("#view-quiz"),
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
    document.documentElement.setAttribute("data-font", scale);
    try {
      localStorage.setItem(FONT_KEY, scale);
    } catch (_) {}
    document.querySelectorAll(".font-opt").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.scale === scale);
    });
  }

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

  function recordAnswer(ok) {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      const s = raw ? JSON.parse(raw) : { attempted: 0, correct: 0 };
      s.attempted = (Number(s.attempted) || 0) + 1;
      if (ok) s.correct = (Number(s.correct) || 0) + 1;
      localStorage.setItem(STATS_KEY, JSON.stringify(s));
    } catch (_) {}
  }

  /* ---------- Classical text (full, no truncate) ---------- */
  function fillClassical(el, raw) {
    if (!el) return;
    const text = String(raw == null ? "" : raw);
    const blocks = text.split(/\n\s*\n/).map((s) => s.replace(/^\n+|\n+$/g, ""));
    const meaningful = blocks.filter((b) => b.length > 0);
    if (meaningful.length > 1) {
      el.innerHTML = meaningful
        .map((p) => "<p>" + escapeHtml(p).replace(/\n/g, "<br>") + "</p>")
        .join("");
      return;
    }
    if (text.indexOf("\n") !== -1) {
      el.innerHTML = text
        .split("\n")
        .map((line) => (line.trim() ? "<p>" + escapeHtml(line) + "</p>" : ""))
        .join("");
      return;
    }
    const soft = softParagraphs(text);
    if (soft.length > 1) {
      el.innerHTML = soft.map((p) => "<p>" + escapeHtml(p) + "</p>").join("");
    } else {
      el.textContent = text;
    }
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

  function renderClassicalText(raw) {
    fillClassical($("#pass-text"), raw);
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
      btn.addEventListener("click", () => openHub(btn.dataset.grade));
    });
  }

  /* ---------- Hub ---------- */
  function openHub(gradeId) {
    rememberGrade(gradeId);
    $("#hub-title").textContent = gradeLabel(gradeId);
    const body = $("#hub-body");
    const hasKnowledge = !!(state.knowledge && state.knowledge[gradeId]);
    const passages = (state.passages && state.passages[gradeId]) || [];
    const passageReady = passages.length > 0;

    if (gradeId === "s3" && !hasKnowledge && !passageReady) {
      $("#hub-sub").textContent = "內容即將推出";
      body.innerHTML = `<div class="placeholder-s3">
        <img src="art/ui/badge_coming_soon.png" alt="內容即將推出" />
        <p>中三文言知識與篇章稍後補充。<br/>請先研習中一、中二內容。</p>
      </div>`;
      show("hub");
      return;
    }

    $("#hub-sub").textContent = passageReady
      ? "請選擇學習內容"
      : hasKnowledge
        ? "文言知識可學 · 篇章即將推出"
        : "請選擇學習內容";

    const knowDesc =
      gradeId === "s3"
        ? "進階虛詞、句式與活用等<br/>主題已按年級分級"
        : "特點、虛詞、句式、通假等";
    const passDesc = passageReady ? "字詞語譯 · 主旨 · 判斷題" : "內容即將推出";

    body.innerHTML = `
      <div class="card-list">
        <button type="button" class="mode-card" id="btn-mode-knowledge">
          <img class="mode-icon" src="art/ui/icon_knowledge.png" alt="" />
          <div class="body">
            <strong>文言知識</strong>
            <span>${knowDesc}</span>
          </div>
          <span class="chev">›</span>
        </button>
        <button type="button" class="mode-card" id="btn-mode-passage">
          <img class="mode-icon" src="art/ui/icon_passage.png" alt="" />
          <div class="body">
            <strong>文言篇章</strong>
            <span>${passDesc}</span>
          </div>
          <span class="chev">›</span>
        </button>
      </div>`;

    $("#btn-mode-knowledge").addEventListener("click", openKnowledgeList);
    $("#btn-mode-passage").addEventListener("click", openPassageList);
    show("hub");
  }

  /* ---------- Knowledge ---------- */
  function gradeKnowledge() {
    if (!state.knowledge || !state.grade) return null;
    return state.knowledge[state.grade] || null;
  }

  function openKnowledgeList() {
    const topics = (state.knowledge.topics || [])
      .slice()
      .sort((a, b) => a.order - b.order);
    const gk = gradeKnowledge();
    if (!gk) {
      toast("此年級知識尚未載入");
      return;
    }
    $("#know-list-sub").textContent =
      gradeLabel(state.grade) + " · 七個主題（按年級分級）";
    const box = $("#knowledge-list");
    box.innerHTML = topics
      .map((t, i) => {
        const has = !!gk[t.id];
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

  function openKnowledge(topicId) {
    state.knowledgeTopicId = topicId;
    const gradeData = gradeKnowledge();
    if (!gradeData) return;
    const topic = gradeData[topicId];
    if (!topic) {
      toast("此主題內容即將推出");
      return;
    }
    $("#know-title").textContent = topic.title;
    $("#know-content").innerHTML = topic.html;

    const practiceBox = $("#know-practice");
    const practiceBody = $("#know-practice-body");
    if (topic.practice && topic.practice.length) {
      practiceBox.classList.remove("hidden");
      practiceBody.innerHTML = "";
      topic.practice.forEach((q, qi) => {
        const wrap = document.createElement("div");
        wrap.style.marginBottom = "18px";
        wrap.innerHTML = `<p class="q-stem" style="font-size:15px;margin-bottom:10px">${qi + 1}. ${escapeHtml(q.stem)}</p>`;
        const opts = document.createElement("div");
        q.options.forEach((opt, oi) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "option-card";
          btn.innerHTML = `<span class="letter">${LETTERS[oi]}</span><span class="opt-text">${escapeHtml(opt)}</span>
            <img class="mark" src="art/ui/mark_correct.png" alt="" data-mark="ok" />
            <img class="mark" src="art/ui/mark_wrong.png" alt="" data-mark="bad" style="display:none" />
            <span class="your-choice">你的選擇</span>`;
          btn.addEventListener("click", () => {
            if (btn.dataset.locked) return;
            opts.querySelectorAll(".option-card").forEach((b) => {
              b.dataset.locked = "1";
              b.disabled = true;
            });
            const correct = oi === q.answer;
            recordAnswer(correct);
            if (correct) {
              btn.classList.add("correct");
              btn.querySelector('[data-mark="ok"]').style.display = "block";
              btn.querySelector('[data-mark="bad"]').style.display = "none";
            } else {
              btn.classList.add("wrong");
              btn.querySelector('[data-mark="ok"]').style.display = "none";
              btn.querySelector('[data-mark="bad"]').style.display = "block";
              const right = opts.children[q.answer];
              right.classList.add("correct");
              right.querySelector('[data-mark="ok"]').style.display = "block";
              right.querySelector('[data-mark="bad"]').style.display = "none";
              addWrong({
                type: "knowledge",
                grade: state.grade,
                knowledgeId: topicId,
                questionId: topicId + "_q" + qi,
                stem: q.stem,
                options: q.options.slice(),
                userAnswer: oi,
                correctAnswer: q.answer,
                explanation: q.explain,
                optionExplains: Array.isArray(q.optionExplains) ? q.optionExplains.slice() : null,
                tag: "知識小練",
                passageTitle: topic.title,
                passageFullText: "",
                sourceLabel: gradeLabel(state.grade) + " · " + topic.title,
              });
            }
            const exp = document.createElement("div");
            exp.className = "explain-panel show";
            exp.style.marginTop = "8px";
            exp.innerHTML = buildExplainHtml(q);
            wrap.appendChild(exp);
          });
          opts.appendChild(btn);
        });
        wrap.appendChild(opts);
        practiceBody.appendChild(wrap);
      });
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
      box.innerHTML = `<div class="placeholder-s3"><img src="art/ui/badge_coming_soon.png" alt="內容即將推出" /><p>文言篇章內容即將推出。<br/>請先研習本級文言知識，或選讀中一、中二篇章。</p></div>`;
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
    $("#pass-title").textContent = p.title;
    $("#pass-source").textContent = p.source;
    renderClassicalText(p.text);
    $("#pass-notes").textContent = p.notes ? "提要：" + p.notes : "";
    show("passage");
  }

  /* ---------- Quiz ---------- */
  function startQuiz() {
    const p = state.currentPassage;
    if (!p) return;
    state.quizIndex = 0;
    state.quizCorrect = 0;
    state.quizTotal = p.questions.length;
    state.quizLocked = false;
    $("#quiz-done").classList.add("hidden");
    $("#quiz-body").classList.remove("hidden");
    $("#explain-panel").classList.remove("show");
    $("#quiz-footer").classList.add("hidden");
    renderQuestion();
    show("quiz");
  }

  function renderQuestion() {
    const p = state.currentPassage;
    const q = p.questions[state.quizIndex];
    state.quizLocked = false;
    $("#explain-panel").classList.remove("show");
    $("#quiz-footer").classList.add("hidden");
    $("#btn-next").textContent =
      state.quizIndex + 1 >= state.quizTotal ? "完成本篇" : "下一題";
    $("#btn-prev").disabled = state.quizIndex === 0;

    $("#quiz-meta").innerHTML = `
      <span class="chip chip-orange">${escapeHtml(q.tag || "練習")}</span>
      <span class="quiz-count">${state.quizIndex + 1} / ${state.quizTotal}</span>`;

    const letters = q.options.length === 3 ? ["A", "B", "C"] : LETTERS;
    const body = $("#quiz-body");
    body.innerHTML = `
      <div class="q-ref">《${escapeHtml(p.title)}》</div>
      <div class="q-stem">${escapeHtml(q.stem)}</div>
      <div id="options"></div>`;

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
  }

  function selectOption(oi, btn, opts, q) {
    if (state.quizLocked) return;
    state.quizLocked = true;
    const correct = oi === q.answer;
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
      right.classList.add("correct");
      showMark(right, true);
      const p = state.currentPassage;
      addWrong({
        type: "passage",
        grade: state.grade,
        passageId: p.id,
        questionId: p.id + "_q" + state.quizIndex,
        stem: q.stem,
        options: q.options.slice(),
        userAnswer: oi,
        correctAnswer: q.answer,
        explanation: q.explain,
        optionExplains: Array.isArray(q.optionExplains) ? q.optionExplains.slice() : null,
        tag: q.tag || "練習",
        passageTitle: p.title,
        passageFullText: p.text,
        sourceLabel: gradeLabel(state.grade) + " · 《" + p.title + "》",
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

  function nextQuestion() {
    if (state.quizIndex + 1 >= state.quizTotal) {
      $("#quiz-body").classList.add("hidden");
      $("#explain-panel").classList.remove("show");
      $("#quiz-footer").classList.add("hidden");
      $("#quiz-done").classList.remove("hidden");
      $("#quiz-score").textContent =
        "答對 " + state.quizCorrect + " / " + state.quizTotal + " 題";
      return;
    }
    state.quizIndex += 1;
    renderQuestion();
  }

  function prevQuestion() {
    if (state.quizIndex <= 0) return;
    state.quizIndex -= 1;
    renderQuestion();
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
      else if (go === "hub") openHub(state.grade || lastGrade());
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
        openHub(g);
        return;
      }
      if (tab === "wrong") {
        openWrongBook();
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
  $("#btn-prev").addEventListener("click", prevQuestion);
  $("#btn-quiz-close").addEventListener("click", () => show("passage"));
  $("#btn-done-back").addEventListener("click", () => openPassageList());

  $("#btn-retest-close").addEventListener("click", openWrongBook);
  $("#btn-retest-next").addEventListener("click", nextRetest);
  $("#btn-retest-prev").addEventListener("click", prevRetest);
  $("#btn-retest-done-back").addEventListener("click", openWrongBook);

  /* ---------- Boot ---------- */
  initFontScale();
  Promise.all([
    fetch("data/passages.json").then((r) => r.json()),
    fetch("data/knowledge.json").then((r) => r.json()),
  ])
    .then(([passages, knowledge]) => {
      state.passages = passages;
      state.knowledge = knowledge;
      renderHome();
      show("home");
    })
    .catch((err) => {
      console.error(err);
      $("#grade-list").innerHTML =
        '<p style="color:#E57373;padding:20px">無法載入資料，請重新整理。</p>';
    });
})();
