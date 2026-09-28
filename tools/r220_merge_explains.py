#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R2.20: merge optionExplains into one prose explain; drop optionExplains."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def tidy(s: str) -> str:
    s = (s or "").strip()
    s = re.sub(r"\s+", "", s)
    s = re.sub(r"[。．]{2,}", "。", s)
    s = re.sub(r"[；;]{2,}", "；", s)
    s = re.sub(r"([？！])。", r"\1", s)
    return s.strip("。．；;，,：: \t")


def ensure(s: str) -> str:
    s = tidy(s)
    if not s:
        return ""
    if not s.endswith(("。", "！", "？", "」", "）")):
        s += "。"
    return s


def find_close(s: str, i: int) -> int:
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


def strip_xuan_shells(s: str) -> str:
    t = s or ""
    # 選「…」不對／正確／不像
    while True:
        m = re.search(r"選「", t)
        if not m:
            break
        i = m.start()
        j = find_close(t, i + 1)
        if j < 0:
            break
        rest = t[j:]
        mm = re.match(r"(不對|正確|不像)[。．]?", rest)
        if mm and (i == 0 or t[i - 1] in "。．；;\n"):
            t = t[:i] + rest[mm.end() :]
            continue
        break
    t = re.sub(r"^正確是「[^」]*」[。．]?", "", t)
    return t


def strip_boilerplate(s: str, correct: str = "") -> str:
    t = tidy(s)
    if not t:
        return ""
    t = strip_xuan_shells(t)
    t = re.sub(r"宜回看「[^」]{1,60}」再判[。．]?", "", t)
    t = re.sub(r"學生常因[^。；]+而誤選[，,]?正解應為「[^」]*」[。．]?", "", t)
    t = re.sub(r"學生常因[^。；]+而誤選[。．]?", "", t)
    t = re.sub(r"正解應為「[^」]*」[。．]?", "", t)
    t = re.sub(r"宜據原文明示句判斷，勿臆測文外情節[。．]?", "", t)
    if correct:
        t = re.sub(re.escape(f"正確是「{correct}」") + r"[。．]?", "", t)
    return tidy(t)


def is_thin_reason(body: str) -> bool:
    """True if body is mostly a cite dump without real wrong-option rationale."""
    if not body:
        return True
    b = body
    # strip 原文／依據句子 cites
    b2 = re.sub(r"(原文|依據句子)[：:]?「[^」]*」", "", b)
    b2 = re.sub(r"可作依據", "", b2)
    b2 = tidy(b2)
    if len(b2) < 6:
        return True
    if b2.startswith("原文") and len(b2) < 12:
        return True
    return False


def wrong_reason(raw: str, opt: str, correct: str, base_explain: str) -> str:
    body = strip_boilerplate(raw, correct)
    # Remove duplicate of correct explain body
    be = tidy(base_explain)
    if body and be and (body in be or be in body):
        # keep only unique bits
        for clause in re.split(r"[。．]", be):
            c = tidy(clause)
            if c and c in body:
                body = body.replace(c, "")
        body = tidy(body)

    if is_thin_reason(body):
        # synthesize from option vs correct
        if not opt:
            return ""
        if "未有說明" in opt or "文中未" in opt or "無從判斷" in opt:
            return f"「{opt}」不成立，因原文已有明示，並非未交代"
        if correct and ("通" in be or "解作" in be or "取" in be):
            return f"「{opt}」並非「{correct}」之義"
        return f"「{opt}」與題意／原文關鍵不符，不能取代「{correct}」" if correct else f"「{opt}」與題意不符"

    # Drop leading "原文：…" if that's the whole useful bit after thin check failed partially
    # Frame with option
    if opt and f"「{opt}」" not in body:
        if body.startswith(("並非", "不是", "非", "文中", "原文", "句中", "題", "與", "該", "此", "錯", "宜", "放")):
            # 「毛蟲」原文明確… → better: 「毛蟲」不對，因原文明確…
            if body.startswith(("原文", "文中", "句中")):
                return f"「{opt}」不成立，因{body}"
            return f"「{opt}」{body}"
        return f"「{opt}」不成立：{body}"
    return body


def merge_explain(q: dict) -> bool:
    oes = q.get("optionExplains")
    had = isinstance(oes, list) and any((x or "").strip() for x in oes)
    opts = q.get("options") or []
    ans = q.get("answer")
    correct = ""
    if isinstance(ans, int) and 0 <= ans < len(opts):
        correct = opts[ans] or ""

    base = tidy(q.get("explain") or "")
    if not base and had and isinstance(ans, int) and 0 <= ans < len(oes):
        raw_ok = oes[ans] or ""
        body = strip_boilerplate(raw_ok, correct) or tidy(raw_ok)
        if correct and not body.startswith("正確是"):
            base = tidy(f"正確是「{correct}」。{body}")
        else:
            base = body

    wrong_bits = []
    seen = set()
    if had and isinstance(ans, int):
        for i, opt in enumerate(opts):
            if i == ans:
                continue
            raw = oes[i] if i < len(oes) else ""
            wr = wrong_reason(raw or "", opt or "", correct, base)
            wr = tidy(wr)
            if not wr or wr in seen:
                continue
            # skip near-duplicates
            if any(wr in s or s in wr for s in seen if len(s) > 8):
                continue
            seen.add(wr)
            wrong_bits.append(wr)

    if wrong_bits:
        wrong_blob = "；".join(ensure(w).rstrip("。") for w in wrong_bits)
        if base:
            merged = ensure(ensure(base).rstrip("。？！") + ("？" if base.endswith("？") else "。") + "其餘選項方面，" + wrong_blob)
            # fix double
            merged = re.sub(r"([。？！])其餘", r"\1其餘", merged)
            # if base ended with ？ we may have stripped wrong — rebuild carefully
            if base.endswith("？") or base.endswith("！"):
                merged = ensure(base + "其餘選項方面，" + wrong_blob)
            else:
                merged = ensure(ensure(base).rstrip("。") + "。其餘選項方面，" + wrong_blob)
        else:
            merged = ensure("其餘選項方面，" + wrong_blob)
    else:
        merged = ensure(base) if base else (ensure(f"正確是「{correct}」") if correct else "")

    merged = re.sub(r"選「([^」]*)」不對[。．]?", r"「\1」並不成立。", merged)
    merged = re.sub(r"([？！])。", r"\1", merged)
    merged = re.sub(r"[。．]{2,}", "。", merged)
    merged = ensure(merged)

    changed = (q.get("explain") or "") != merged or "optionExplains" in q
    q["explain"] = merged
    if "optionExplains" in q:
        del q["optionExplains"]
    return changed


def walk_passages(data: dict) -> int:
    n = 0
    for g in ("s1", "s2", "s3"):
        for p in data.get(g) or []:
            for q in p.get("questions") or []:
                if merge_explain(q):
                    n += 1
    return n


def walk_knowledge(data: dict) -> int:
    n = 0
    for g in ("s1", "s2", "s3"):
        block = data.get(g) or {}
        if not isinstance(block, dict):
            continue
        for _tid, topic in block.items():
            if not isinstance(topic, dict):
                continue
            features = topic.get("features")
            if isinstance(features, dict):
                for q in features.get("practice") or []:
                    if merge_explain(q):
                        n += 1
            for q in topic.get("practice") or []:
                if merge_explain(q):
                    n += 1
    return n


def walk_vocab(data: dict) -> int:
    n = 0
    for q in data.get("questions") or []:
        if merge_explain(q):
            n += 1
    return n


def count_oes(obj) -> int:
    c = 0
    if isinstance(obj, dict):
        if "optionExplains" in obj:
            c += 1
        for v in obj.values():
            c += count_oes(v)
    elif isinstance(obj, list):
        for v in obj:
            c += count_oes(v)
    return c


def main() -> None:
    path = ROOT / "data" / "passages.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    n_p = walk_passages(data)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"passages.json merged={n_p} remaining_oes={count_oes(data)}")

    path = ROOT / "data" / "knowledge.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    n_k = walk_knowledge(data)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"knowledge.json merged={n_k} remaining_oes={count_oes(data)}")

    path = ROOT / "data" / "vocab_quiz.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    n_v = walk_vocab(data)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"vocab_quiz.json merged={n_v} remaining_oes={count_oes(data)}")

    p = json.loads((ROOT / "data" / "passages.json").read_text(encoding="utf-8"))
    v = json.loads((ROOT / "data" / "vocab_quiz.json").read_text(encoding="utf-8"))
    k = json.loads((ROOT / "data" / "knowledge.json").read_text(encoding="utf-8"))
    print("--- P", p["s1"][0]["questions"][0]["explain"])
    print("--- P2", p["s2"][6]["questions"][4]["explain"])
    print("--- V", v["questions"][0]["explain"])
    # knowledge sample
    feat = None
    for g in ("s1", "s2", "s3"):
        for tid, topic in (k.get(g) or {}).items():
            if isinstance(topic, dict):
                pr = (topic.get("features") or {}).get("practice") if isinstance(topic.get("features"), dict) else None
                pr = pr or topic.get("practice") or []
                if pr:
                    feat = pr[0]
                    break
        if feat:
            break
    print("--- K", (feat or {}).get("explain", "")[:300])
    print(f"TOTAL_MERGED={n_p + n_k + n_v}")


if __name__ == "__main__":
    main()
