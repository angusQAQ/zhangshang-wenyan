(function () {
  "use strict";

  const GRADES = [
    { id: "s1", label: "中一", desc: "文言知識與篇章" },
    { id: "s2", label: "中二", desc: "文言知識與篇章" },
    { id: "s3", label: "中三", desc: "內容即將推出", coming: true },
  ];

  const LETTERS = ["A", "B", "C", "D"];

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
    window.scrollTo(0, 0);
  }

  function gradeLabel(id) {
    const g = GRADES.find((x) => x.id === id);
    return g ? g.label : id;
  }

  /* ---------- Home ---------- */
  function renderHome() {
    const list = $("#grade-list");
    list.innerHTML = GRADES.map((g) => {
      if (g.coming) {
        return `<button type="button" class="nav-card" data-grade="${g.id}">
          <div class="icon-wrap"><img src="art/ui/icon_grade.png" alt="" /></div>
          <div class="body"><strong>${g.label}</strong><span>${g.desc}</span></div>
          <img class="coming-badge" src="art/ui/badge_coming_soon.png" alt="內容即將推出" />
        </button>`;
      }
      return `<button type="button" class="nav-card" data-grade="${g.id}">
        <div class="icon-wrap"><img src="art/ui/icon_grade.png" alt="" /></div>
        <div class="body"><strong>${g.label}</strong><span>${g.desc}</span></div>
        <span class="chev">›</span>
      </button>`;
    }).join("");

    list.querySelectorAll("[data-grade]").forEach((btn) => {
      btn.addEventListener("click", () => openHub(btn.dataset.grade));
    });
  }

  /* ---------- Hub ---------- */
  function openHub(gradeId) {
    state.grade = gradeId;
    $("#hub-title").textContent = gradeLabel(gradeId);
    const body = $("#hub-body");

    if (gradeId === "s3") {
      $("#hub-sub").textContent = "內容即將推出";
      body.innerHTML = `<div class="placeholder-s3">
        <img src="art/ui/badge_coming_soon.png" alt="內容即將推出" />
        <p>中三文言知識與篇章稍後補充。<br/>請先研習中一、中二內容。</p>
      </div>`;
      show("hub");
      return;
    }

    $("#hub-sub").textContent = "請選擇學習內容";
    body.innerHTML = `
      <div class="card-list">
        <button type="button" class="mode-card" id="btn-mode-knowledge">
          <img class="mode-icon" src="art/ui/icon_knowledge.png" alt="" />
          <div class="body">
            <strong>文言知識</strong>
            <span>特點、虛詞、句式、通假等<br/>以文字說明，可附小練</span>
          </div>
          <span class="chev">›</span>
        </button>
        <button type="button" class="mode-card" id="btn-mode-passage">
          <img class="mode-icon" src="art/ui/icon_passage.png" alt="" />
          <div class="body">
            <strong>文言篇章</strong>
            <span>選篇閱讀與選擇題練習<br/>字詞語譯、主旨、判斷題</span>
          </div>
          <span class="chev">›</span>
        </button>
      </div>`;
    $("#btn-mode-knowledge").addEventListener("click", openKnowledgeList);
    $("#btn-mode-passage").addEventListener("click", openPassageList);
    show("hub");
  }

  /* ---------- Knowledge ---------- */
  function openKnowledgeList() {
    const topics = state.knowledge.topics.slice().sort((a, b) => a.order - b.order);
    $("#know-list-sub").textContent = gradeLabel(state.grade) + " · 七個主題";
    const box = $("#knowledge-list");
    box.innerHTML = topics
      .map(
        (t, i) => `<button type="button" class="list-row" data-topic="${t.id}">
        <span class="num">${i + 1}.</span>
        <span class="label">${t.title}</span>
        <span class="chev">›</span>
      </button>`
      )
      .join("");
    box.querySelectorAll("[data-topic]").forEach((btn) => {
      btn.addEventListener("click", () => openKnowledge(btn.dataset.topic));
    });
    show("knowledge-list");
  }

  function openKnowledge(topicId) {
    state.knowledgeTopicId = topicId;
    const gradeData = state.knowledge[state.grade];
    const topic = gradeData[topicId];
    if (!topic) return;
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

  /* ---------- Passages ---------- */
  function openPassageList() {
    const list = state.passages[state.grade] || [];
    $("#pass-list-sub").textContent = gradeLabel(state.grade) + " · 共 " + list.length + " 篇";
    const box = $("#passage-list");
    if (!list.length) {
      box.innerHTML = `<div class="placeholder-s3"><img src="art/ui/badge_coming_soon.png" alt="" /><p>內容即將推出</p></div>`;
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
    $("#pass-text").textContent = p.text;
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
    $("#quiz-progress").textContent = state.quizIndex + 1 + " / " + state.quizTotal;
    $("#explain-panel").classList.remove("show");
    $("#quiz-footer").classList.add("hidden");
    $("#btn-next").textContent =
      state.quizIndex + 1 >= state.quizTotal ? "完成本篇" : "下一題";

    const letters = q.options.length === 3 ? ["A", "B", "C"] : LETTERS;
    const body = $("#quiz-body");
    body.innerHTML = `
      <span class="q-tag">${escapeHtml(q.tag || "練習")}</span>
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

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- Nav bindings ---------- */
  document.querySelectorAll("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const go = btn.dataset.go;
      if (go === "home") show("home");
      else if (go === "hub") openHub(state.grade);
      else if (go === "knowledge-list") openKnowledgeList();
      else if (go === "passage-list") openPassageList();
    });
  });

  $("#btn-start-quiz").addEventListener("click", startQuiz);
  $("#btn-next").addEventListener("click", nextQuestion);
  $("#btn-quiz-close").addEventListener("click", () => {
    show("passage");
  });
  $("#btn-done-back").addEventListener("click", () => {
    openPassageList();
  });

  /* ---------- Boot ---------- */
  Promise.all([
    fetch("data/passages.json").then((r) => r.json()),
    fetch("data/knowledge.json").then((r) => r.json()),
  ])
    .then(([passages, knowledge]) => {
      state.passages = passages;
      state.knowledge = knowledge;
      renderHome();
    })
    .catch((err) => {
      console.error(err);
      $("#grade-list").innerHTML =
        '<p style="color:#E57373;padding:20px">無法載入資料，請重新整理。</p>';
    });
})();
