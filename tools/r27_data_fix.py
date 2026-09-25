#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R2.7 data fix: pos/gloss, scrub 選「話術, add 原文+語譯, scrub knowledge grades."""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

POS_PARTICLE = {
    "之": "結構助詞", "乎": "語氣助詞", "者": "助詞", "也": "語氣助詞",
    "而": "連詞", "矣": "語氣助詞", "於": "介詞", "以": "介詞／連詞",
    "其": "代詞", "則": "連詞", "乃": "副詞", "焉": "助詞／兼詞",
    "且": "副詞", "或": "無定代詞", "故": "連詞", "遂": "副詞",
    "若": "連詞", "與": "語氣助詞", "夫": "助詞", "奚": "疑問代詞",
    "盍": "疑問副詞", "唯": "副詞", "嘗": "副詞", "必": "副詞",
    "悉": "副詞", "宜": "助動詞", "誠": "副詞", "輒": "副詞",
    "俄": "副詞", "偏": "副詞", "卒": "副詞", "非": "副詞",
    "所以": "固定結構", "卻": "動詞", "頓": "副詞", "堅": "形容詞作狀語",
}
POS_NOUN = {
    "囊", "爵", "牖", "牢", "薪", "喙", "鉗", "豎", "僕",
    "厲", "芧", "膏", "肓", "廩", "旬日",
}
POS_ADJ = {"鮮", "恭", "悖", "淫", "妖", "了了", "蕃", "足", "盛"}
POS_TONG = {
    "說": "通假字（通「悅」）", "鄉": "通假字（通「向」）",
    "禽": "通假字（通「擒」）", "被": "通假字（通「披」）", "辟": "通假字",
}


def infer_pos(text, kind, gloss):
    if kind == "tong":
        return POS_TONG.get(text, "通假字")
    if kind == "huo":
        return "詞類活用"
    if kind == "xu":
        return POS_PARTICLE.get(text, "虛詞")
    if text in POS_PARTICLE:
        return POS_PARTICLE[text]
    if text in POS_NOUN:
        return "名詞"
    if text in POS_ADJ:
        return "形容詞"
    if text == "予":
        return "代詞"
    g = gloss or ""
    if "樣子" in g:
        return "形容詞"
    if any(x in g for x in ("的人", "童僕", "袋子", "酒杯", "惡鬼", "橡實", "部位")):
        return "名詞"
    return "動詞"


def enrich_gloss(text, kind, gloss, notes_text):
    g = (gloss or "").strip()
    if not g and notes_text:
        for part in re.split(r"[。；;]", notes_text):
            if text and text in part:
                g = part.strip()
                break
    if not g:
        label = {"shi": "實詞", "xu": "虛詞", "tong": "通假", "huo": "活用"}.get(kind, "字詞")
        g = "「" + text + "」屬" + label + "，宜結合上下文推義；詳見本段語譯與段旨。"
    # Expand ultra-short 「X」：Y
    m = re.match(r"^「[^」]+」：(.+)$", g)
    if m and len(g) <= 16:
        mean = m.group(1).strip("。")
        g = mean + "（「" + text + "」在本句中的意思）。"
    if not g.endswith(("。", "）", "」")):
        g += "。"
    return g


def find_balanced_close(s, open_idx):
    """open_idx points at 「; return index after matching 」。"""
    depth = 0
    j = open_idx
    while j < len(s):
        if s[j] == "「":
            depth += 1
        elif s[j] == "」":
            depth -= 1
            if depth == 0:
                return j + 1
        j += 1
    return -1


def strip_xuan_formulas(s):
    """Remove 選「…」(不符|正確|不像) formulas; keep 應選 → 應判斷為."""
    if not s:
        return s
    # First: 應選「X」 → 應判斷為「X」 (avoid eating 選「)
    out = []
    i = 0
    while i < len(s):
        if s.startswith("應選「", i):
            close = find_balanced_close(s, i + 2)  # at 「 of 應選「
            # wait: "應選「" — 「 is at i+2
            close = find_balanced_close(s, i + 2)
            if close > 0:
                inner = s[i + 3 : close - 1]  # after 應選「
                out.append("應判斷為「" + inner + "」")
                i = close
                continue
        if s.startswith("選「", i):
            close = find_balanced_close(s, i + 1)  # 「 at i+1
            if close > 0:
                rest = s[close:]
                consumed = False
                for suf in ("不符。", "正確。", "不像。", "不符.", "正確.", "不像.", "不符", "正確", "不像"):
                    if rest.startswith(suf):
                        i = close + len(suf)
                        consumed = True
                        break
                if consumed:
                    continue
                # bare 選「…」 without suffix — still drop the formulaic prefix if at start of clause
                # only drop if at beginning or after 。；
                prev_ok = (i == 0) or (s[i - 1] in "。．；;\n")
                if prev_ok:
                    i = close
                    continue
        out.append(s[i])
        i += 1
    t = "".join(out)
    t = re.sub(r"[。．]{2,}", "。", t)
    return t.strip("。．；; \t") + ("。" if t.strip() and not t.strip().endswith(("。", "」", "）")) else "")


def scrub_grade_words(s):
    if not s:
        return s
    repls = [
        (r"程度說明：中[一二三]・[^<]*", ""),
        (r"中一、中二、中三", ""),
        (r"中一、中二", "前階段"),
        (r"中二、中三", "後階段"),
        (r"相對中一", "相對基礎階段"),
        (r"與中一差異", "與基礎差異"),
        (r"非中一優先", "並非優先項目"),
        (r"屬中二以後", "屬進階內容"),
        (r"中二以後", "進階階段"),
        (r"中二加深", "進階"),
        (r"中一入門", "基礎"),
        (r"中三銜接", "綜合"),
        (r"中一先記", "宜先記"),
        (r"中一記住", "宜記"),
        (r"中一先練", "宜先練"),
        (r"中一先穩", "宜先穩"),
        (r"中一先", "宜先"),
        (r"中一只", "宜只"),
        (r"中一已", "已可"),
        (r"中一對", "學習時對"),
        (r"中一宜", "宜"),
        (r"中一階段", "基礎階段"),
        (r"中一目標", "學習目標"),
        (r"中一用", "可用"),
        (r"中一閱讀", "閱讀"),
        (r"中一學習", "學習"),
        (r"中一正確", "正確"),
        (r"中一", "基礎階段"),
        (r"中二重點", "重點"),
        (r"中二相對", "相對而言"),
        (r"中二在", "進一步在"),
        (r"中二把", "宜把"),
        (r"中二改", "宜改"),
        (r"中二聚焦", "宜聚焦"),
        (r"中二不只", "不只"),
        (r"中二訓練", "宜訓練"),
        (r"中二「", "「"),
        (r"中二仍", "仍"),
        (r"中二要", "要"),
        (r"中二詞義", "詞義"),
        (r"中二虛詞", "虛詞"),
        (r"中二", "進階階段"),
        (r"中三要把", "要把"),
        (r"中三核心", "核心"),
        (r"中三", "綜合階段"),
    ]
    out = s
    for pat, rep in repls:
        out = re.sub(pat, rep, out)
    out = re.sub(r"<p class=\"level-badge\"><strong>\s*</strong></p>", "", out)
    return out


def scrub_knowledge_html(html):
    if not html:
        return html
    html = re.sub(r'<p class="level-badge"><strong>程度說明：[^<]*</strong></p>', "", html)
    html = scrub_grade_words(html)
    html = html.replace(">中一記住<", ">宜記<").replace(">中一先記<", ">宜先記<")
    html = re.sub(r"程度說明：[^<]*", "", html)
    # also remove bare 入門／加深／銜接 as standalone tier words in leftover badges
    return html


def pick_quote(passage_text, stem, explain, oe_body):
    text = passage_text or ""
    for src in (oe_body, explain, stem):
        for q in re.findall(r"「([^」]{2,30})」", src or ""):
            if q in text:
                return q
            if len(q) >= 2 and q[:2] in text:
                i = text.find(q[:2])
                frag = text[i : i + 28]
                cut = re.search(r"[。！？；]", frag)
                if cut:
                    frag = frag[: cut.start()]
                if frag.strip():
                    return frag.strip()
    for sent in re.split(r"[。！？]", text):
        s = sent.strip()
        if len(s) >= 4:
            return s[:28]
    return (text[:24] or "").strip()


def section_trans_for_quote(passage, quote):
    guide = passage.get("guide") or {}
    sections = guide.get("sections") or []
    text = passage.get("text") or ""
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    if sections and len(paras) != len(sections):
        paras = [p.strip() for p in text.split("\n") if p.strip()]
    idx = 0
    if quote and paras:
        for i, para in enumerate(paras):
            if quote in para or (len(quote) >= 2 and quote[:2] in para):
                idx = i
                break
    def short(tr):
        tr = (tr or "").strip()
        if not tr or tr == "—":
            return ""
        if len(tr) > 48:
            cut = re.search(r"[。！？]", tr[12:48])
            tr = tr[: 12 + cut.start() + 1] if cut else tr[:48] + "……"
        return tr
    if sections and idx < len(sections):
        tr = short(sections[idx].get("translation"))
        if tr:
            return tr
    if sections:
        for sec in sections:
            tr = short(sec.get("translation"))
            if tr:
                return tr
    return short(guide.get("translation"))


def ensure_orig_trans(body, quote, trans, is_correct):
    body = (body or "").strip()
    has_orig = "原文" in body
    has_trans = ("語譯" in body) or ("今釋" in body)
    parts = []
    if quote and not has_orig:
        parts.append("原文：「" + quote + "」。")
    if trans and not has_trans:
        parts.append("語譯：「" + trans + "」。")
    if body:
        if body.startswith("原文") or body.startswith("語譯"):
            return body if (has_trans or not trans) else (body + ("語譯：「" + trans + "」。" if trans else ""))
        parts.append(body)
    else:
        parts.append("此項正確。" if is_correct else "此項與文意不符。")
    out = "".join(parts)
    out = re.sub(r"[。．]{2,}", "。", out)
    return out


def rewrite_passage_oe(oe, is_correct, passage, stem, explain):
    body = strip_xuan_formulas(oe or "")
    # strip_xuan may leave empty
    body = body.strip()
    if body in ("。", ""):
        body = "此項正確，切合文意。" if is_correct else "此項與文意不符。"
    quote = pick_quote(passage.get("text") or "", stem, explain, body)
    trans = section_trans_for_quote(passage, quote)
    return ensure_orig_trans(body, quote, trans, is_correct)


def extract_knowledge_example(topic_html, stem, explain, body):
    for src in (body, explain, stem, topic_html or ""):
        # 目＝眼睛
        m = re.search(r"([\u4e00-\u9fff]{1,4})＝([^<；，。、]{1,12})", src or "")
        if m:
            return m.group(1), m.group(2)
    for src in (body, explain, stem, topic_html or ""):
        for q in re.findall(r"「([^」]{1,16})」", src or ""):
            # skip option-like long phrases
            if len(q) <= 12 and "選" not in q:
                gloss = ""
                if topic_html:
                    m = re.search(re.escape(q) + r"＝([^<；，。、]{1,12})", topic_html)
                    if m:
                        gloss = m.group(1)
                return q, gloss
    return "", ""


def rewrite_knowledge_oe(oe, is_correct, topic_html, stem, explain):
    body = scrub_grade_words(strip_xuan_formulas(oe or ""))
    if body in ("。", ""):
        body = "此項正確。" if is_correct else "此項與要點不符。"
    quote, gloss = extract_knowledge_example(topic_html, stem, explain, body)
    has_orig = "原文" in body
    has_trans = ("語譯" in body) or ("今釋" in body)
    parts = []
    if quote and not has_orig:
        parts.append("原文例：「" + quote + "」。")
    if not has_trans:
        if gloss:
            parts.append("語譯／今釋：「" + gloss + "」。")
        elif explain:
            short = scrub_grade_words(explain.strip())
            if len(short) > 40:
                short = short[:40] + "……"
            parts.append("語譯／今釋：「" + short + "」。")
    if body.startswith("原文") or body.startswith("語譯"):
        out = body
    else:
        parts.append(body)
        out = "".join(parts)
    out = scrub_grade_words(out)
    # final safety: remove any remaining 選「…」不符/正確/不像
    out = strip_xuan_formulas(out)
    return out.strip()


def fix_passages():
    path = ROOT / "data" / "passages.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    for grade in ("s1", "s2", "s3"):
        for p in data.get(grade) or []:
            notes = (p.get("guide") or {}).get("notes") or []
            notes_text = "。".join(n.get("text") or "" for n in notes)
            words = []
            new_hls = []
            for h in p.get("highlights") or []:
                text = h.get("text") or ""
                kind = h.get("kind") or "shi"
                gloss = enrich_gloss(text, kind, h.get("gloss"), notes_text)
                pos = infer_pos(text, kind, gloss)
                nh = dict(h)
                nh["gloss"] = gloss
                nh["pos"] = pos
                new_hls.append(nh)
                words.append({"word": text, "pos": pos, "meaning": gloss, "kind": kind})
            p["highlights"] = new_hls
            if not p.get("guide"):
                p["guide"] = {}
            p["guide"]["words"] = words
            for q in p.get("questions") or []:
                oes = q.get("optionExplains")
                if not oes:
                    continue
                new_oes = []
                for i, oe in enumerate(oes):
                    new_oes.append(
                        rewrite_passage_oe(
                            oe, i == q.get("answer"), p, q.get("stem"), q.get("explain")
                        )
                    )
                q["optionExplains"] = new_oes
                ex = q.get("explain") or ""
                if ex and "語譯" not in ex:
                    quote = pick_quote(p.get("text") or "", q.get("stem"), ex, "")
                    tr = section_trans_for_quote(p, quote)
                    if tr:
                        q["explain"] = ex.rstrip("。") + "。語譯：「" + tr + "」。"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("passages.json OK")


def fix_knowledge():
    path = ROOT / "data" / "knowledge.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    for grade in ("s1", "s2", "s3"):
        for tid, topic in (data.get(grade) or {}).items():
            if not isinstance(topic, dict):
                continue
            if topic.get("html"):
                topic["html"] = scrub_knowledge_html(topic["html"])
            if topic.get("title"):
                topic["title"] = scrub_grade_words(topic["title"])
            for q in topic.get("practice") or []:
                if q.get("stem"):
                    q["stem"] = scrub_grade_words(q["stem"])
                if q.get("explain"):
                    q["explain"] = scrub_grade_words(strip_xuan_formulas(q["explain"]))
                if q.get("options"):
                    q["options"] = [scrub_grade_words(o) for o in q["options"]]
                oes = q.get("optionExplains")
                if not oes:
                    continue
                q["optionExplains"] = [
                    rewrite_knowledge_oe(
                        oe,
                        i == q.get("answer"),
                        topic.get("html") or "",
                        q.get("stem"),
                        q.get("explain"),
                    )
                    for i, oe in enumerate(oes)
                ]
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("knowledge.json OK")


def fix_vocab():
    path = ROOT / "data" / "vocab_quiz.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    for q in data.get("questions") or []:
        sentence = q.get("sentence") or ""
        word = q.get("targetWord") or ""
        explain = strip_xuan_formulas(q.get("explain") or "").strip()
        if explain.endswith("。") is False and explain:
            explain += "。"
        q["explain"] = explain
        trans = explain
        if len(trans) > 40:
            trans = trans[:40] + "……"
        opts = q.get("options") or []
        ans = q.get("answer")
        oes = []
        for i, opt in enumerate(opts):
            if i == ans:
                oes.append(
                    "原文：「"
                    + sentence
                    + "」。語譯／釋義：「"
                    + trans
                    + "」。句中「"
                    + word
                    + "」取「"
                    + opt
                    + "」義，故此項正確。"
                )
            else:
                oes.append(
                    "原文：「"
                    + sentence
                    + "」。語譯／釋義：「"
                    + trans
                    + "」。此處「"
                    + word
                    + "」並非「"
                    + opt
                    + "」之義，故此項不正確。"
                )
        q["optionExplains"] = oes
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("vocab_quiz.json OK")


def verify():
    p = json.loads((ROOT / "data" / "passages.json").read_text(encoding="utf-8"))
    k = json.loads((ROOT / "data" / "knowledge.json").read_text(encoding="utf-8"))
    v = json.loads((ROOT / "data" / "vocab_quiz.json").read_text(encoding="utf-8"))
    bp, bk, bv = (json.dumps(x, ensure_ascii=False) for x in (p, k, v))
    print("選「 counts P/K/V", bp.count("選「"), bk.count("選「"), bv.count("選「"))
    print("knowledge 中一/二/三", bk.count("中一"), bk.count("中二"), bk.count("中三"))
    print("knowledge 程度說明", bk.count("程度說明"))
    # check all OE have 原文 and 語譯
    miss = 0
    total = 0
    for g in ("s1", "s2", "s3"):
        for it in p.get(g) or []:
            for q in it.get("questions") or []:
                for oe in q.get("optionExplains") or []:
                    total += 1
                    if "原文" not in oe or "語譯" not in oe:
                        miss += 1
    print("passage OE missing 原文/語譯", miss, "/", total)
    miss = total = 0
    for g in ("s1", "s2", "s3"):
        for tid, t in (k.get(g) or {}).items():
            for q in t.get("practice") or []:
                for oe in q.get("optionExplains") or []:
                    total += 1
                    if "原文" not in oe or ("語譯" not in oe and "今釋" not in oe):
                        miss += 1
                        if miss <= 3:
                            print(" miss sample", oe[:100])
    print("knowledge OE missing", miss, "/", total)
    print("sample hl", p["s1"][0]["highlights"][0])
    print("sample oe", p["s1"][0]["questions"][0]["optionExplains"][0][:140])
    # leftover 選「 samples
    if "選「" in bp:
        i = bp.index("選「")
        print("P leftover", bp[i - 20 : i + 60])
    if "選「" in bk:
        i = bk.index("選「")
        print("K leftover", bk[i - 20 : i + 60])


if __name__ == "__main__":
    fix_passages()
    fix_knowledge()
    fix_vocab()
    verify()
