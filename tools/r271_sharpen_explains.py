#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R2.7.1: sharpen explain/optionExplains — cite 原文「…」, ban 語譯 dump fluff."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# vernacular markers — reject as 原文 quotes
VERNACULAR_MARKERS = (
    "的", "了", "嗎", "吧", "呢", "這蟲", "有一隻", "他的", "她的",
    "不是", "如果", "必定會", "外出狩獵", "向左右", "勸諫的人",
    "現代", "眼睛", "語譯",
)


def find_balanced_close(s, open_idx):
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


def strip_yuanyi_aggressive(s):
    """Remove 語譯／今釋 dumps even when nested quotes are broken."""
    if not s:
        return s
    labels = ("語譯／今釋", "語譯/今釋", "語譯", "今釋")
    out = s
    changed = True
    while changed:
        changed = False
        for lab in labels:
            i = out.find(lab)
            if i < 0:
                continue
            j = i + len(lab)
            while j < len(out) and out[j] in "／/：: \t":
                if out.startswith("今釋", j):
                    j += 2
                    continue
                j += 1
            end = -1
            if j < len(out) and out[j] == "「":
                close = find_balanced_close(out, j)
                if close > 0:
                    end = close
                else:
                    # broken nesting: cut at next 。 before 故選/答案/錯在/學生/原文 or last 。
                    # scan forward, track rough depth, stop at 。 when depth<=1 and next looks structural
                    depth = 0
                    k = j
                    while k < len(out):
                        ch = out[k]
                        if ch == "「":
                            depth += 1
                        elif ch == "」":
                            depth = max(0, depth - 1)
                        elif ch in "。．" and depth <= 1:
                            # peek ahead
                            nxt = out[k + 1 : k + 8]
                            if (
                                not nxt
                                or nxt.startswith(("故選", "答案", "錯在", "學生", "原文", "；", ";"))
                                or (depth == 0)
                            ):
                                end = k + 1
                                break
                        k += 1
                    if end < 0:
                        # fallback: delete to end or to 故選
                        m = re.search(r"故選|答案取|錯在|學生易", out[j:])
                        end = j + m.start() if m else len(out)
            else:
                # no opening quote — delete label through next 。
                m = re.search(r"[。．]", out[j:])
                end = j + m.end() if m else len(out)
            if end > i:
                # swallow trailing 。
                while end < len(out) and out[end] in "。．":
                    end += 1
                out = out[:i] + out[end:]
                changed = True
                break
    return out


def strip_xuan(s):
    if not s:
        return s
    s = re.sub(r"應選「([^」]*)」", r"應判斷為「\1」", s)
    out = []
    i = 0
    while i < len(s):
        if s.startswith("選「", i):
            close = find_balanced_close(s, i + 1)
            if close > 0:
                rest = s[close:]
                consumed = False
                for suf in ("不符。", "正確。", "不像。", "不符", "正確", "不像"):
                    if rest.startswith(suf):
                        i = close + len(suf)
                        consumed = True
                        break
                if consumed:
                    continue
                if i == 0 or s[i - 1] in "。．；;\n":
                    i = close
                    continue
        out.append(s[i])
        i += 1
    return re.sub(r"[。．]{2,}", "。", "".join(out)).strip()


def strip_yuanwen_label(s):
    """Remove leading/inline 原文：「…」。 / 原文例：「…」。 labels (keep body elsewhere)."""
    if not s:
        return s
    out = s
    for lab in ("原文例", "原文"):
        while True:
            i = out.find(lab)
            if i < 0:
                break
            j = i + len(lab)
            while j < len(out) and out[j] in "：: \t":
                j += 1
            if j < len(out) and out[j] == "「":
                close = find_balanced_close(out, j)
                if close > 0:
                    while close < len(out) and out[close] in "。．":
                        close += 1
                    out = out[:i] + out[close:]
                    continue
            break
    return out


def is_vernacular(q):
    if not q:
        return True
    if any(m in q for m in VERNACULAR_MARKERS):
        return True
    # mostly CJK classical is fine; if has many modern particles
    return False


def in_passage(q, passage_text):
    if not q or not passage_text:
        return False
    if q in passage_text:
        return True
    # allow short fragment match
    if len(q) >= 4 and q[:4] in passage_text:
        return True
    if len(q) >= 2 and q[:2] in passage_text and len(q) <= 8:
        return True
    return False


def pick_quote(passage_text, stem, *bodies):
    """Prefer classical quote that appears in passage / stem."""
    text = passage_text or ""
    candidates = []
    for src in (stem,) + bodies:
        for q in re.findall(r"「([^」]{2,40})」", src or ""):
            candidates.append(q)
        for q in re.findall(r"『([^』]{2,40})』", src or ""):
            candidates.append(q)
    # rank: in passage & not vernacular > in stem > others
    ranked = []
    for q in candidates:
        q = q.strip()
        if len(q) < 2 or is_vernacular(q):
            continue
        score = 0
        if in_passage(q, text):
            score += 5
        if stem and q in stem:
            score += 3
        if 2 <= len(q) <= 24:
            score += 1
        ranked.append((score, -len(q), q))
    ranked.sort(reverse=True)
    if ranked and ranked[0][0] >= 3:
        return ranked[0][2][:28]
    # fall back: first classical sentence from passage that overlaps stem keywords
    if text:
        stem_chars = set(re.findall(r"[\u4e00-\u9fff]", stem or ""))
        best = ("", 0)
        for sent in re.split(r"[。！？\n]", text):
            s = sent.strip()
            if len(s) < 4:
                continue
            overlap = len(stem_chars & set(s))
            if overlap > best[1]:
                best = (s[:28], overlap)
        if best[0]:
            return best[0]
        for sent in re.split(r"[。！？\n]", text):
            s = sent.strip()
            if len(s) >= 4:
                return s[:28]
    # last resort: non-vernacular candidate
    for score, _, q in ranked:
        return q[:28]
    return ""


def clean_reason(s):
    if not s:
        return ""
    s = strip_xuan(s)
    s = strip_yuanyi_aggressive(s)
    s = strip_yuanwen_label(s)
    s = re.sub(
        r"與題幹所問不符，也對不上原文關鍵；正解是「[^」]*」；?",
        "",
        s,
    )
    s = re.sub(r"與題幹所問不符[，,]?也對不上原文關鍵[；;]?", "", s)
    s = re.sub(r"正解是「[^」]*」；?", "", s)
    s = re.sub(r"此項與文意不符。?", "", s)
    s = re.sub(r"此項與要點不符。?", "", s)
    s = re.sub(r"此項正確[，,]?切合文意。?", "", s)
    s = re.sub(r"此項正確。?", "", s)
    s = re.sub(r"故此項不正確。?", "", s)
    s = re.sub(r"故此項正確。?", "", s)
    s = re.sub(r"見「[^」]{1,40}」", "", s)
    s = re.sub(r"句中「([^」]+)」取「([^」]+)」義，?", r"「\1」取「\2」義", s)
    s = re.sub(r"此處「([^」]+)」並非「([^」]+)」之義，?", r"「\1」並非「\2」義", s)
    # remove leftover 語譯 word alone
    s = s.replace("語譯", "").replace("今釋", "")
    s = re.sub(r"[。．]{2,}", "。", s)
    s = re.sub(r"[；;]{2,}", "；", s)
    s = re.sub(r"\s+", "", s)
    s = s.strip("。．；;，, \t")
    return s


def guess_misread(opt, correct_opt, stem):
    o = opt or ""
    c = correct_opt or ""
    if any(x in o for x in ("卻是", "冷卻", "拒絕", "弊端", "弊病", "敝舊", "元旦", "坦白", "說話", "遊說", "解說")):
        return "古今義或通假混淆"
    if any(x in o for x in ("一日", "五日", "百日", "早晨")) and any(
        x in (c + stem) for x in ("十日", "日子", "天", "旬", "旦")
    ):
        return "時間詞望文生義"
    if "未有說明" in o or "文中未" in o:
        return "忽略原文明示句"
    if any(x in o for x in ("威脅", "取笑", "仇敵")):
        return "自行腦補情節"
    if "只讀語譯" in o or "語譯" in o:
        return "以為讀譯文即可"
    if o and c and abs(len(o) - len(c)) <= 2:
        return "近義干擾或張冠李戴"
    return "未緊扣原文關鍵"


def ensure_period(s):
    s = (s or "").strip()
    if not s:
        return ""
    if not s.endswith(("。", "！", "？", "」", "）")):
        s += "。"
    return s


def rewrite_correct(reason, quote, correct_opt):
    reason = clean_reason(reason)
    # strip leading 答案取 if we'll rebuild
    reason = re.sub(r"^答案取「[^」]+」。?", "", reason).strip("。；;")
    reason = re.sub(r"。?故選「[^」]+」。?$", "", reason).strip("。；;")
    # if reason still starts with awkward 「quote」寫明：
    reason = re.sub(r"^寫明[：:]?", "", reason)

    bits = []
    if correct_opt:
        bits.append(f"答案取「{correct_opt}」")
    if quote:
        if reason:
            # avoid duplicating quote inside reason opener
            r = reason
            if r.startswith(f"原文「{quote}」"):
                bits.append(r)
            elif f"「{quote}」" in r:
                bits.append(r)
            else:
                bits.append(f"原文「{quote}」{('：' if not r.startswith(('可', '已', '直', '點', '寫')) else '')}{r}")
        else:
            bits.append(f"原文「{quote}」可證")
    elif reason:
        bits.append(reason)
    else:
        bits.append("切合文意與原句")
    text = "。".join(b.rstrip("。") for b in bits if b)
    if correct_opt and "故選" not in text:
        text = text.rstrip("。") + f"。故選「{correct_opt}」"
    # tidy double colons / awkward
    text = text.replace("：：", "：").replace("。。", "。")
    text = re.sub(r"原文「([^」]+)」：可知", r"原文「\1」可知", text)
    text = re.sub(r"原文「([^」]+)」：關鍵", r"原文「\1」。關鍵", text)
    return ensure_period(text)


def rewrite_wrong(reason, quote, opt, correct_opt, stem):
    reason = clean_reason(reason)
    reason = re.sub(r"^錯在把文意理解成「[^」]+」；?", "", reason).strip("。；;")
    mis = guess_misread(opt, correct_opt, stem)
    if reason.startswith("錯在"):
        if quote and f"「{quote}」" not in reason:
            reason = reason.rstrip("。") + f"；原文「{quote}」可對照"
        return ensure_period(reason)

    bits = [f"錯在把文意理解成「{opt}」"]
    if quote:
        if reason and len(reason) >= 4:
            short = reason if len(reason) <= 40 else reason[:40].rstrip("，,；;") + "……"
            # avoid starting short with vernacular leftovers
            bits.append(f"原文「{quote}」其實是{short}")
        else:
            bits.append(f"原文「{quote}」並不支持此解")
    elif reason:
        short = reason if len(reason) <= 40 else reason[:40] + "……"
        bits.append(short)
    bits.append(f"學生易因{mis}而誤選")
    text = "；".join(b.rstrip("。；;") for b in bits if b)
    return ensure_period(text)


def rewrite_question(q, passage_text="", kind="pass"):
    opts = q.get("options") or []
    ans = q.get("answer")
    if ans is None or not opts:
        return
    correct_opt = opts[ans] if 0 <= ans < len(opts) else ""
    stem = q.get("stem") or ""
    raw_explain = q.get("explain") or ""
    oes = list(q.get("optionExplains") or [])

    quote = pick_quote(passage_text, stem, raw_explain, *oes)
    if kind == "vocab" and q.get("sentence"):
        quote = q["sentence"]

    core_ex = clean_reason(raw_explain)
    if not core_ex and oes and 0 <= ans < len(oes):
        core_ex = clean_reason(oes[ans] or "")
    q["explain"] = rewrite_correct(core_ex, quote, correct_opt)

    new_oes = []
    for i, opt in enumerate(opts):
        raw = oes[i] if i < len(oes) else ""
        oq = pick_quote(passage_text, stem, raw, raw_explain, quote) or quote
        if kind == "vocab" and q.get("sentence"):
            oq = q["sentence"]
        if i == ans:
            core = clean_reason(raw) or core_ex
            new_oes.append(rewrite_correct(core, oq, opt))
        else:
            new_oes.append(rewrite_wrong(raw, oq, opt, correct_opt, stem))
    q["optionExplains"] = new_oes


def fix_passages():
    path = ROOT / "data" / "passages.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    n = 0
    for g in ("s1", "s2", "s3"):
        for p in data.get(g) or []:
            text = p.get("text") or ""
            for q in p.get("questions") or []:
                rewrite_question(q, passage_text=text, kind="pass")
                n += 1
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"passages.json OK ({n})")


def fix_knowledge():
    path = ROOT / "data" / "knowledge.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    n = 0
    for g in ("s1", "s2", "s3"):
        for tid, topic in (data.get(g) or {}).items():
            if not isinstance(topic, dict):
                continue
            html = topic.get("html") or ""
            plain = re.sub(r"<[^>]+>", "", html)
            # classical examples often like 目＝眼睛 — build mini corpus of left sides
            examples = re.findall(r"([\u4e00-\u9fff]{1,4})＝", plain)
            corpus = "。".join(examples) + "。" + plain
            for q in topic.get("practice") or []:
                rewrite_question(q, passage_text=corpus, kind="know")
                n += 1
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"knowledge.json OK ({n})")


def fix_vocab():
    path = ROOT / "data" / "vocab_quiz.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    n = 0
    for q in data.get("questions") or []:
        sentence = q.get("sentence") or ""
        word = q.get("targetWord") or ""
        opts = q.get("options") or []
        ans = q.get("answer")
        raw_ex = q.get("explain") or ""
        ex = clean_reason(raw_ex)
        # keep gloss substance
        if not ex:
            ex = strip_yuanyi_aggressive(strip_xuan(raw_ex)).strip()
        correct = opts[ans] if ans is not None and 0 <= ans < len(opts) else ""
        if sentence and word and correct:
            q["explain"] = ensure_period(
                f"答案取「{correct}」。原文「{sentence}」中「{word}」取此義"
                + (f"：{ex}" if ex and ex not in correct else "")
            )
            # avoid double
            q["explain"] = re.sub(r"：答案取", "。", q["explain"])
            q["explain"] = re.sub(r"[。．]{2,}", "。", q["explain"])
        else:
            q["explain"] = ensure_period(ex or "見句中用法。")
        new_oes = []
        for i, opt in enumerate(opts):
            if i == ans:
                new_oes.append(
                    ensure_period(
                        f"答案取「{opt}」。原文「{sentence}」中「{word}」取「{opt}」義，故選此項"
                    )
                )
            else:
                mis = guess_misread(opt, correct, sentence)
                new_oes.append(
                    ensure_period(
                        f"錯在把「{word}」理解成「{opt}」；原文「{sentence}」此處並非此義，學生易因{mis}而誤選"
                    )
                )
        q["optionExplains"] = new_oes
        n += 1
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"vocab_quiz.json OK ({n})")


def verify():
    p = json.loads((ROOT / "data" / "passages.json").read_text(encoding="utf-8"))
    k = json.loads((ROOT / "data" / "knowledge.json").read_text(encoding="utf-8"))
    v = json.loads((ROOT / "data" / "vocab_quiz.json").read_text(encoding="utf-8"))

    def all_fields():
        for g in ("s1", "s2", "s3"):
            for it in p.get(g) or []:
                text = it.get("text") or ""
                for q in it.get("questions") or []:
                    yield "P", text, q
            for tid, t in (k.get(g) or {}).items():
                for q in t.get("practice") or []:
                    yield "K", "", q
        for q in v.get("questions") or []:
            yield "V", q.get("sentence") or "", q

    yuanyi = vern_as_orig = longish = empty = no_cq = 0
    total = 0
    samples = []
    for kind, ptext, q in all_fields():
        fields = [q.get("explain") or ""] + list(q.get("optionExplains") or [])
        for text in fields:
            total += 1
            if "語譯" in text or "今釋" in text:
                yuanyi += 1
                if yuanyi <= 3:
                    print("YUANYI LEFT:", text[:160])
            if not text.strip():
                empty += 1
            if len(text) > 150:
                longish += 1
            for m in re.finditer(r"原文「([^」]+)」", text):
                qot = m.group(1)
                if is_vernacular(qot) and (not ptext or qot not in ptext):
                    vern_as_orig += 1
                    if vern_as_orig <= 5:
                        print("VERN:", qot[:50])
            if "「" not in text:
                no_cq += 1
        if kind == "P" and len(samples) < 3:
            samples.append(q)

    print(
        f"fields={total} 語譯殘={yuanyi} 白話當原文={vern_as_orig} len>150={longish} empty={empty} 無引號={no_cq}"
    )
    for q in samples:
        print("====", q.get("stem"))
        print("EX:", q.get("explain"))
        for i, oe in enumerate(q.get("optionExplains") or []):
            print(f"OE{i}:", oe)


if __name__ == "__main__":
    fix_passages()
    fix_knowledge()
    fix_vocab()
    verify()
