(function () {
  "use strict";

  const GRADES = [
    { id: "s1", label: "中一", desc: "文言知識與篇章" },
    { id: "s2", label: "中二", desc: "文言知識與篇章" },
    { id: "s3", label: "中三", desc: "文言知識可學；篇章即將推出" },
  ];

  const LETTERS = ["A", "B", "C", "D"];
  const LAST_GRADE_KEY = "zw_last_grade";
  const STATS_KEY = "zw_stats_v1";

  const PREVIEW_TOPICS = [
    { id: "features", label: "特點", icon: "art/ui/icon_line_book.png" },
    { id: "howto-read", label: "閱讀", icon: "art/ui/icon_line_doc.png" },
    { id: "particles", label: "虛詞", icon: "art/ui/icon_line_chat.png" },
    { id: "polysemy", label: "多義", icon: "art/ui/icon_line_list.png" },
    { id: "ancient-modern", label: "古今", icon: "art/ui/icon_line_pencil.png" },
    { id: "loan-chars", label: "通假", icon: "art/ui/icon_line_mail.png" },
    { id: "sentence-patterns", label: "句式", icon: "art/ui/icon_line_bookmark.png" },
    { id: "__practice__", label: "練習", icon: "art/ui/icon_line_list.png" },
  ];

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
  };

  function show(name) {
    Object.keys(views).forEach((k) => {
      views[k].classList.toggle("active", k === name);
    });
    const quizMode = name === "quiz";
    $("#app").classList.toggle("quiz-mode", quizMode);
    window.scrollTo(0, 0);
    syncTab(name);
  }

  function syncTab(name) {
    let tab = "home";
    if (name === "knowledge-list" || name === "knowledge") tab = "practice";
    else if (
      name === "hub" ||
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

  /* Full passage body: never truncate; prefer paragraph markup */
  function renderClassicalText(raw) {
    const el = $("#pass-text");
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
        .map((line) => {
          if (!line.trim()) return "";
          return "<p>" + escapeHtml(line) + "</p>";
        })
        .join("");
      return;
    }

    /* No newlines: soft-split on dialogue／句號邊界，字符一個不丟 */
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
      if (
        (ch === "。" || ch === "！" || ch === "？") &&
        (next === "" || next === "「" || next === "（" || /[^\s」）]/.test(next))
      ) {
        /* break after sentence if next starts new speaker or clause length enough */
        if (buf.length >= 28 && (next === "「" || next === "" || /[A-Za-z一-龥]/.test(next))) {
          if (next === "「" || buf.length >= 40) {
            parts.push(buf);
            buf = "";
          }
        }
      }
    }
    if (buf) parts.push(buf);
    /* Verify no character loss */
    if (parts.join("") !== text) return [text];
    return parts.length ? parts : [text];
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

    const knowDesc = gradeId === "s3"
      ? "進階虛詞、句式與活用等<br/>主題已按年級分級"
      : "特點、虛詞、句式、通假等";
    const passDesc = passageReady
      ? "字詞語譯 · 主旨 · 判斷題"
      : "內容即將推出";

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
      </div>
      ${hasKnowledge ? renderPreviewGridHtml() : ""}`;

    $("#btn-mode-knowledge").addEventListener("click", openKnowledgeList);
    $("#btn-mode-passage").addEventListener("click", openPassageList);
    bindPreviewGrid(body);
    show("hub");
  }

  function renderPreviewGridHtml() {
    return `<h3 class="preview-label">知識主題預覽</h3>
      <div class="topic-preview" id="topic-preview">
        ${PREVIEW_TOPICS.map(
          (t) => `<button type="button" class="topic-cell" data-preview="${t.id}">
            <img src="${t.icon}" alt="" />
            <span>${t.label}</span>
          </button>`
        ).join("")}
      </div>`;
  }

  function bindPreviewGrid(root) {
    const box = root.querySelector("#topic-preview");
    if (!box) return;
    box.querySelectorAll("[data-preview]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.preview;
        if (id === "__practice__") {
          openKnowledgeList();
          return;
        }
        openKnowledge(id);
      });
    });
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
            }
            const exp = document.createElement("div");
            exp.className = "explain-panel show";
            exp.style.marginTop = "8px";
            exp.innerHTML = `<h4>解釋</h4><p>${escapeHtml(q.explain)}</p>`;
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

  function recordAnswer(ok) {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      const s = raw ? JSON.parse(raw) : { attempted: 0, correct: 0 };
      s.attempted = (Number(s.attempted) || 0) + 1;
      if (ok) s.correct = (Number(s.correct) || 0) + 1;
      localStorage.setItem(STATS_KEY, JSON.stringify(s));
    } catch (_) {}
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
    }

    $("#explain-text").textContent = q.explain;
    $("#explain-panel").classList.add("show");
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
      if (btn.dataset.tab === "practice" || btn.dataset.tab === "home") return;
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
      }
    });
  });

  $("#btn-start-quiz").addEventListener("click", startQuiz);
  $("#btn-next").addEventListener("click", nextQuestion);
  $("#btn-prev").addEventListener("click", prevQuestion);
  $("#btn-quiz-close").addEventListener("click", () => show("passage"));
  $("#btn-done-back").addEventListener("click", () => openPassageList());

  /* ---------- Boot ---------- */
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
