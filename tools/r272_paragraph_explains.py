#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R2.7.2: paragraph explains — detail why right/wrong; cite 原文 only when needed; never 語譯."""
import json
import re
import statistics as st
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
YUANYI_LABEL = re.compile(r"(語譯／今釋|語譯/今釋|語譯：|今釋：|語譯「|今釋「|語譯／|今釋／)")


def find_close(s, i):
    d = 0
    j = i
    while j < len(s):
        if s[j] == "「":
            d += 1
        elif s[j] == "」":
            d -= 1
            if d == 0:
                return j + 1
        j += 1
    return -1


def strip_yuanyi(s):
    if not s:
        return s
    out = s
    for _ in range(20):
        hit = False
        for lab in ("語譯／今釋", "語譯/今釋", "語譯", "今釋"):
            i = out.find(lab)
            if i < 0:
                continue
            # don't strip inside「只讀語譯」
            if i > 0 and out[i - 1] == "「":
                continue
            j = i + len(lab)
            while j < len(out) and out[j] in "／/：: \t":
                j += 1
            if j < len(out) and out[j] == "「":
                c = find_close(out, j)
                end = c if c > 0 else len(out)
            else:
                m = re.search(r"[。．]", out[j:])
                end = j + m.end() if m else len(out)
            while end < len(out) and out[end] in "。．":
                end += 1
            out = out[:i] + out[end:]
            hit = True
            break
        if not hit:
            break
    return out


def tidy(s):
    s = strip_yuanyi(s or "")
    s = re.sub(r"應選「([^」]*)」", r"應判斷為「\1」", s)
    s = re.sub(r"[。．]{2,}", "。", s)
    s = re.sub(r"[；;]{2,}", "；", s)
    s = re.sub(r"：{2,}", "：", s)
    s = re.sub(r"\s+", "", s)
    return s.strip("。．；;，,：: \t")


def ensure(s):
    s = (s or "").strip()
    if not s:
        return ""
    if not s.endswith(("。", "！", "？", "」", "）")):
        s += "。"
    return s


def first_quote(text, maxlen=24, ban=None):
    """Pick a classical locator quote; never return an option label."""
    if not text:
        return ""
    ban = set(ban or [])
    m = re.search(r"原文「([^」]{2,%d})」" % maxlen, text)
    if m:
        q = m.group(1).strip()
        if q not in ban:
            return q
    for m in re.finditer(r"「([^」]{2,%d})」" % maxlen, text):
        q = m.group(1).strip()
        if q in ban:
            continue
        # skip formula wrappers' captured option
        start = m.start()
        pref = text[max(0, start - 4):start]
        if pref in ("答案取", "故選", "正確是", "選", "理解成"):
            continue
        if any(x in q for x in ("語譯", "今釋", "答案取", "錯在", "正確", "學生")):
            continue
        return q
    return ""


def peel(text, correct=""):
    """Remove r271 formula shells; keep reasoning clauses."""
    s = tidy(text)
    if not s:
        return ""
    s = re.sub(r"^答案取「[^」]+」。?", "", s)
    s = re.sub(r"。?故選「[^」]+」。?$", "", s)
    s = re.sub(r"。?故選此項。?$", "", s)
    s = re.sub(r"^錯在把文意理解成「[^」]+」；?", "", s)
    s = re.sub(r"^錯在把「[^」]+」理解成「[^」]+」；?", "", s)
    s = re.sub(r"學生易因[^。；]+而誤選。?$", "", s)
    # 原文「q」其實是：X  → keep X
    s = re.sub(r"原文「[^」]{1,40}」其實是[：:]?", "", s)
    # 原文「q」：X / 原文「q」X
    s = re.sub(r"原文「[^」]{1,40}」[：:]?", "", s)
    # vocab leftover: 中「說」取此義：...
    s = re.sub(r"^中「([^」]+)」取此義[：:]?", r"「\1」取此義：", s)
    s = re.sub(r"^中「([^」]+)」取「([^」]+)」義[，,]?故選此項", r"「\1」取「\2」義", s)
    s = re.sub(r"^中「([^」]+)」取「([^」]+)」義", r"「\1」取「\2」義", s)
    s = re.sub(r"此處並非此義[，,]?", "句中並非此義", s)
    if correct:
        s = s.replace(f"故選「{correct}」", "").replace(f"答案取「{correct}」", "")
    s = tidy(s)
    # truncate runaway
    if len(s) > 140:
        parts = [p.strip() for p in re.split(r"[。；]", s) if p.strip()]
        acc, out = 0, []
        for p in parts:
            out.append(p)
            acc += len(p)
            if acc >= 90 or len(out) >= 2:
                break
        s = "。".join(out)
    return s


def misread(opt, correct, stem=""):
    o = opt or ""
    blob = (correct or "") + (stem or "")
    if any(x in o for x in ("卻是", "冷卻", "拒絕", "弊端", "敝舊", "元旦", "坦白", "說話", "遊說", "解說", "更加")):
        return "以今義或音近義硬套文言"
    if any(x in o for x in ("一日", "五日", "百日", "早晨")) and any(x in blob for x in ("十日", "旬", "旦")):
        return "對時間詞望文生義"
    if "未有說明" in o or "文中未" in o:
        return "忽略原文明示句"
    if any(x in o for x in ("威脅", "取笑", "仇敵")):
        return "自行腦補情節"
    if "只讀語譯" in o:
        return "以為讀譯文即可過關"
    if o and correct and abs(len(o) - len(correct)) <= 2:
        return "近義干擾、張冠李戴"
    return "未扣題幹與原文關鍵"


def join_para(parts):
    parts = [p.strip("。．；;：: ") for p in parts if p and p.strip("。．；;：: ")]
    if not parts:
        return ""
    out = parts[0]
    for p in parts[1:]:
        if out.endswith(("因", "於", "是", "為", "即")):
            out += p
        else:
            out += "。" + p
    return ensure(out.replace("。。", "。").replace("：。", "。"))


def para_correct(raw, correct, stem="", sentence="", options=None):
    ban = list(options or [])
    if correct:
        ban.append(correct)
    q = first_quote(raw, ban=ban)
    if sentence and len(sentence) <= 30:
        q = sentence
    body = peel(raw, correct)
    if body in (correct, f"「{correct}」", f"可知該為{correct}"):
        body = ""

    parts = [f"正確是「{correct}」"]
    cite = False
    if q and len(q) <= 28 and q not in ban:
        if sentence and q == sentence:
            parts.append(f"依據句子「{q}」")
            cite = True
        elif any(k in (stem or "") for k in ("意思", "指", "解作", "詞性", "哪", "甚麼", "什麼", "為何", "原因")):
            parts.append(f"原文「{q}」可作依據")
            cite = True
        elif body and ("解作" in body or "指" in body or "通" in body or "可知" in body or "即" in body):
            parts.append(f"原文「{q}」可作依據")
            cite = True
        elif not body:
            parts.append(f"原文「{q}」可作依據")
            cite = True

    if body:
        b = body
        if cite and q and b.startswith(f"「{q}」"):
            b = b[len(q) + 2 :].lstrip("：:。")
        if b:
            parts.append(b)
    else:
        parts.append("此項切合題意與文中關鍵，能直接回答所問")
    return join_para(parts)


def para_wrong(raw, opt, correct, stem="", sentence="", options=None):
    ban = list(options or []) + ([correct, opt] if correct or opt else [])
    q = first_quote(raw, ban=ban)
    if sentence and len(sentence) <= 30:
        q = sentence
    body = peel(raw, correct)
    if body and q and (body == q or body == f"「{q}」"):
        body = ""
    if body.startswith("句中並非此義") and len(body) < 12:
        body = "句中用法並非此義"

    parts = [f"選「{opt}」不對"]
    if body:
        if not body.startswith(("錯", "因", "此", "並", "原", "「", "句", "文", "題", "放", "與", "該")):
            parts.append("錯位在於" + body)
        else:
            parts.append(body)
    else:
        parts.append(f"文意不支持把關鍵理解成「{opt}」")

    if q and len(q) <= 22 and q not in ban:
        blob = "。".join(parts)
        if f"「{q}」" not in blob and (sentence or len(q) <= 14):
            parts.append(f"宜回看「{q}」再判")

    parts.append(f"學生常因{misread(opt, correct, stem)}而誤選，正解應為「{correct}」")
    return join_para(parts)


def rewrite_q(q, kind="pass"):
    opts = q.get("options") or []
    ans = q.get("answer")
    if ans is None or not opts:
        return
    correct = opts[ans] if 0 <= ans < len(opts) else ""
    stem = q.get("stem") or ""
    sentence = q.get("sentence") or ""
    raw = q.get("explain") or ""
    oes = list(q.get("optionExplains") or [])
    q["explain"] = para_correct(raw, correct, stem, sentence, opts)
    new = []
    for i, opt in enumerate(opts):
        raw_i = oes[i] if i < len(oes) else ""
        if i == ans:
            new.append(para_correct(raw_i or raw, opt, stem, sentence, opts))
        else:
            new.append(para_wrong(raw_i, opt, correct, stem, sentence, opts))
    q["optionExplains"] = new


def main():
    # passages
    path = ROOT / "data" / "passages.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    n = 0
    for g in ("s1", "s2", "s3"):
        for p in data.get(g) or []:
            for q in p.get("questions") or []:
                rewrite_q(q, "pass")
                n += 1
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"passages.json OK ({n})")

    path = ROOT / "data" / "knowledge.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    n = 0
    for g in ("s1", "s2", "s3"):
        for tid, topic in (data.get(g) or {}).items():
            if not isinstance(topic, dict):
                continue
            for q in topic.get("practice") or []:
                rewrite_q(q, "know")
                n += 1
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"knowledge.json OK ({n})")

    path = ROOT / "data" / "vocab_quiz.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    n = 0
    for q in data.get("questions") or []:
        rewrite_q(q, "vocab")
        n += 1
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"vocab_quiz.json OK ({n})")

    # verify
    label = bare = empty = total = 0
    lens = []
    samples = []

    def fields():
        p = json.loads((ROOT / "data" / "passages.json").read_text(encoding="utf-8"))
        k = json.loads((ROOT / "data" / "knowledge.json").read_text(encoding="utf-8"))
        v = json.loads((ROOT / "data" / "vocab_quiz.json").read_text(encoding="utf-8"))
        for g in ("s1", "s2", "s3"):
            for it in p.get(g) or []:
                for q in it.get("questions") or []:
                    yield "P", q
            for _, t in (k.get(g) or {}).items():
                if isinstance(t, dict):
                    for q in t.get("practice") or []:
                        yield "K", q
        for q in v.get("questions") or []:
            yield "V", q

    for kind, q in fields():
        for text in [q.get("explain") or ""] + list(q.get("optionExplains") or []):
            total += 1
            lens.append(len(text))
            if YUANYI_LABEL.search(text):
                label += 1
                print("LABEL", text[:100])
            if "語譯" in text or "今釋" in text:
                # allow 只讀語譯 once
                tmp = text.replace("只讀語譯", "")
                bare += tmp.count("語譯") + tmp.count("今釋")
                if bare and (tmp.count("語譯") or tmp.count("今釋")):
                    if bare <= 3:
                        print("BARE", text[:100])
            if not text.strip():
                empty += 1
        if kind in ("P", "V") and len(samples) < 4:
            samples.append((kind, q))

    print(
        f"fields={total} 標籤語譯今釋={label} bare殘={bare} empty={empty} "
        f"len mean={st.mean(lens):.0f} med={st.median(lens):.0f} min={min(lens)} max={max(lens)}"
    )
    for kind, q in samples:
        print("---", kind, q.get("id") or "")
        print(" EX:", q.get("explain"))
        ans = q.get("answer")
        oes = q.get("optionExplains") or []
        if oes:
            w = next((oes[i] for i in range(len(oes)) if i != ans), oes[0])
            print(" W :", w)
            if ans is not None and ans < len(oes):
                print(" OK:", oes[ans])


if __name__ == "__main__":
    main()
