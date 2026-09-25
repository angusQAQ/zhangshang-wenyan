#!/usr/bin/env node
/**
 * R2.6.1 — ensure every passage guide.sections[i].translation is non-empty
 * and sections.length === paragraphBlocks(text).length.
 * If missing/empty/"—", split guide.translation (and plain/theme) by sentence.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PASSAGES = path.join(ROOT, "data", "passages.json");

function paragraphBlocks(raw) {
  const text = String(raw == null ? "" : raw);
  const blocks = text.split(/\n\s*\n/).map((s) => s.replace(/^\n+|\n+$/g, ""));
  const meaningful = blocks.filter((b) => b.length > 0);
  if (meaningful.length > 1) return meaningful;
  if (text.indexOf("\n") !== -1) {
    return text.split("\n").filter((line) => line.trim());
  }
  return softParagraphs(text);
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

function nonEmpty(s) {
  const t = s == null ? "" : String(s).trim();
  if (!t || t === "—" || t === "－" || t === "-") return "";
  return t;
}

function splitBySentence(full, n) {
  const text = String(full || "").trim();
  const target = Math.max(1, n | 0);
  if (!text) return Array.from({ length: target }, () => "");
  if (target === 1) return [text];
  const sentences = [];
  let buf = "";
  for (let i = 0; i < text.length; i++) {
    buf += text[i];
    if ("。！？".indexOf(text[i]) !== -1) {
      sentences.push(buf);
      buf = "";
    }
  }
  if (buf) sentences.push(buf);
  if (sentences.length <= 1) {
    const out = [];
    const step = Math.max(1, Math.ceil(text.length / target));
    for (let i = 0; i < target; i++) {
      out.push(text.slice(i * step, i === target - 1 ? text.length : (i + 1) * step) || text);
    }
    return out;
  }
  const out = Array.from({ length: target }, () => "");
  const per = Math.max(1, Math.ceil(sentences.length / target));
  let si = 0;
  for (let i = 0; i < target; i++) {
    const chunk = sentences.slice(si, i === target - 1 ? sentences.length : si + per);
    out[i] = chunk.join("") || text;
    si += per;
  }
  for (let i = 0; i < out.length; i++) if (!out[i]) out[i] = text;
  return out;
}

function ensureSections(p) {
  const g = p.guide || (p.guide = {});
  const paras = paragraphBlocks(p.text || "");
  const n = Math.max(1, paras.length);
  let sections = Array.isArray(g.sections) ? g.sections.slice() : [];
  let changed = false;

  if (sections.length !== n) {
    changed = true;
    const transParts = splitBySentence(g.translation || "", n);
    const plainParts = splitBySentence(g.plain || "", n);
    const themeParts = splitBySentence(g.theme || "", n);
    const next = [];
    for (let i = 0; i < n; i++) {
      const prev = sections[i] || {};
      next.push({
        label: prev.label || "第" + (i + 1) + "段",
        translation: nonEmpty(prev.translation) || transParts[i] || "",
        plain: nonEmpty(prev.plain) || plainParts[i] || "",
        theme: nonEmpty(prev.theme) || themeParts[i] || "",
      });
    }
    sections = next;
  }

  const needFill = sections.some((s) => !nonEmpty(s.translation));
  if (needFill) {
    changed = true;
    const transParts = splitBySentence(g.translation || "", sections.length);
    sections = sections.map((s, i) => ({
      ...s,
      label: s.label || "第" + (i + 1) + "段",
      translation: nonEmpty(s.translation) || transParts[i] || nonEmpty(g.translation) || "（本段語譯待補）",
      plain: nonEmpty(s.plain) || s.plain || "",
      theme: nonEmpty(s.theme) || s.theme || "",
    }));
  }

  /* final assert: every translation non-empty */
  sections = sections.map((s, i) => {
    if (!nonEmpty(s.translation)) {
      changed = true;
      return { ...s, translation: nonEmpty(g.translation) || "（本段語譯待補）" };
    }
    return s;
  });

  g.sections = sections;
  return changed;
}

function main() {
  const data = JSON.parse(fs.readFileSync(PASSAGES, "utf8"));
  let fixed = 0;
  let total = 0;
  const report = [];
  for (const grade of ["s1", "s2", "s3"]) {
    const list = data[grade] || [];
    for (const p of list) {
      total++;
      const before = JSON.stringify((p.guide && p.guide.sections) || null);
      const changed = ensureSections(p);
      const secs = p.guide.sections;
      const paras = paragraphBlocks(p.text || "");
      const empty = secs.filter((s) => !nonEmpty(s.translation)).length;
      const ok =
        secs.length === paras.length &&
        empty === 0 &&
        !(secs.length > 1 && nonEmpty(secs[0].translation) === nonEmpty(p.guide.translation));
      if (changed) fixed++;
      report.push({
        id: p.id,
        secs: secs.length,
        paras: paras.length,
        empty,
        changed,
        s0IsFull:
          secs.length > 1 &&
          nonEmpty(secs[0].translation) === nonEmpty(p.guide.translation),
        okAlign: secs.length === paras.length && empty === 0,
      });
      if (before === JSON.stringify(secs) && !changed) {
        /* no-op */
      }
    }
  }
  fs.writeFileSync(PASSAGES, JSON.stringify(data, null, 2) + "\n", "utf8");
  const bad = report.filter((r) => !r.okAlign || r.s0IsFull);
  console.log(JSON.stringify({ total, fixed, bad: bad.length, report }, null, 2));
  if (bad.length) {
    console.error("FAIL: some passages still misaligned or sec0===full");
    process.exit(1);
  }
  console.log("OK: all passages sections aligned with non-empty per-section translation");
}

main();
