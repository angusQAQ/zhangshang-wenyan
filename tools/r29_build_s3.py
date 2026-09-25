#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R2.9-S3: build s3 passages from OCR md. No invented classical text."""
from __future__ import annotations
import json, re, hashlib
from pathlib import Path

ROOT = Path("/workspace/zhangshang-wenyan")
MD = (ROOT / "content/s3-passages-qa.md").read_text(encoding="utf-8")
PASSAGES_PATH = ROOT / "data/passages.json"

# Practice number -> (title, source_author)
META = {
    1: ("葉公好龍", "劉向《新序》"),
    2: ("許金不酬", "劉基《郁離子》"),
    3: ("管寧華歆共園中鋤菜", "劉義慶《世說新語》"),
    4: ("自護其短", "江盈科"),
    5: ("緹縈救父", "司馬遷《史記》"),
    6: ("鄒忌諷齊王納諫", "《戰國策》"),
    7: ("扁鵲倉公列傳", "司馬遷《史記》"),
    8: ("二子學弈", "《孟子》"),
    9: ("宥坐", "《荀子》"),
    10: ("兩小兒辯日", "《列子》"),
    11: ("自相矛盾", "《韓非子》"),
    12: ("秋水", "《莊子》"),
    13: ("呂蒙正不記人過", "司馬光《涑水記聞》"),
    14: ("小石城山記", "柳宗元"),
    15: ("借書速還", "宋濂《送東陽馬生序》節錄"),
    16: ("傷仲永", "王安石"),
    17: ("英雄之言", "羅隱《讒書》"),
    18: ("飲酒二十首（其二）", "陶淵明"),
    19: ("陌上桑", "漢樂府"),
    20: ("空城計", "《三國演義》"),
    21: ("過故人莊・渭川田家", "孟浩然／王維"),
    22: ("扇枕溫衾", "凌濛初"),
    23: ("涓蜀梁疑鬼・荊人畏鬼", "《荀子》／劉基"),
}

# PDF header aliases
HEADER_NUM = {
    "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8,
    "九": 9, "十": 10, "十一": 11, "十二": 12, "十三": 13, "十四": 14,
    "十五": 15, "十六": 16, "十七": 17, "十八": 18, "十九": 19,
    "二十": 20, "二十一": 21, "二十二": 22, "二十三": 23,
}


def split_pdf_sections(text: str):
    parts = re.split(r"(?m)^# ", text)
    out = []
    for p in parts[1:]:
        title_line, _, body = p.partition("\n")
        title_line = title_line.strip()
        m = re.search(r"文言練習([一二三四五六七八九十]+)\.pdf", title_line)
        if not m:
            continue
        num = HEADER_NUM.get(m.group(1))
        if num is None:
            continue
        out.append((num, body))
    return out


def extract_classical(body: str) -> str:
    m = re.search(r"(?:阅讀篇章|閱讀篇章)[^\n]*\n", body)
    if not m:
        return ""
    rest = body[m.end() :]
    # stop at 注釋 / 練習X / ---
    stop = re.search(
        r"(?m)^(?:【注釋】|注釋|練習\s*\d|練習\d|---+|# )", rest
    )
    if stop:
        rest = rest[: stop.start()]
    lines = []
    for ln in rest.splitlines():
        s = ln.strip()
        if not s:
            continue
        if s.startswith("①") or s.startswith("②") or re.match(r"^\d+\s", s):
            # footnotes interleaved — skip pure footnote lines after classical
            if re.search(r"[粵普]：|粤：|普：", s):
                continue
        if s in ("知人論世", "文類匯聚", "文化導向", "能力增润站", "精文粹言"):
            break
        # skip obvious modern intro leftovers
        if re.match(r"^[〈《].+[〉》]\s*[\u4e00-\u9fff]{0,8}$", s) and "曰" not in s and "。|" not in s:
            # title line like 〈過故人莊〉孟浩然 — keep as label only if short
            if len(s) < 30:
                lines.append(s)
                continue
        lines.append(s)
    text = "".join(lines)
    # light OCR fixes that are unambiguous glyph errors (not inventing content)
    fixes = [
        ("干里", "千里"),
        ("日：「", "曰：「"),
        (",日：「", "，曰：「"),
        ("五曰，", "五日，"),
        ("後五曰", "後五日"),
        ("司馬遠", "司馬遷"),
        ("司馬還", "司馬遷"),
        ("劉义废", "劉義慶"),
        ("劉義废", "劉義慶"),
        ("轩冤", "軒冕"),
        ("乘軒冤", "乘軒冕"),
        ("𤑛者", "漁者"),
        ("魚者", "漁者"),
        ("費人", "賈人"),
        ("途公", "徐公"),
        ("齋\n國", "齊國"),
        ("齋國", "齊國"),
        ("何旦日", "明日"),
        ("淩濛初", "凌濛初"),
        ("淩滋初", "凌濛初"),
    ]
    for a, b in fixes:
        text = text.replace(a, b)
    # collapse spaces
    text = re.sub(r"[ \t]+", "", text)
    # mark replacement / private-use / obvious holes
    text = re.sub(r"[\ufffd�]+", "【缺】", text)
    # if text ends mid-sentence without 。」！？ and is truncated, mark
    if text and text[-1] not in "。！？」』》":
        # check if last chunk looks incomplete (ends with particle mid-phrase)
        if len(text) < 40 or text[-1] in "，、；：的之乎也而":
            text = text + "【缺】"
    return text.strip()


def ocr_quality(text: str) -> float:
    if not text:
        return 0.0
    if "【缺】" in text and text.count("【缺】") >= 2:
        return 0.3
    # ratio of CJK
    cjk = len(re.findall(r"[\u4e00-\u9fff]", text))
    return cjk / max(len(text), 1)


def extract_answer_block(full: str) -> str:
    idx = full.find("# 答案（啟迪文言文閱讀理解解析）.pdf")
    return full[idx:] if idx >= 0 else ""


def find_yuyi_for_title(ans: str, title: str) -> str:
    # Look for title then 【語譯】
    # try shortened title key
    keys = [title]
    if "・" in title:
        keys += title.split("・")
    if "（" in title:
        keys.append(title.split("（")[0])
    for key in keys:
        key = key.strip()
        if len(key) < 2:
            continue
        for m in re.finditer(re.escape(key), ans):
            chunk = ans[m.start() : m.start() + 1200]
            ym = re.search(r"【語譯】([\s\S]{20,800}?)(?:【主旨】|【分段|【參考|初中中國)", chunk)
            if ym:
                y = ym.group(1)
                y = re.sub(r"\s+", "", y)
                y = y.replace("参考答茶", "").strip()
                if len(y) > 30:
                    return y
    return ""


def find_theme(ans: str, title: str) -> str:
    for key in [title, title.split("・")[0], title.split("（")[0]]:
        if len(key) < 2:
            continue
        for m in re.finditer(re.escape(key), ans):
            chunk = ans[m.start() : m.start() + 1500]
            tm = re.search(r"【主旨】([\s\S]{10,400}?)(?:【分段|【參考|初中中國|【語譯】)", chunk)
            if tm:
                t = re.sub(r"\s+", "", tm.group(1)).strip()
                if len(t) > 10:
                    return t
    return ""


def parse_judgments_near_title(ans: str, title: str):
    """Return list of (stem, answer_idx) for 正確/錯誤/無從判斷."""
    key = title.split("・")[0].split("（")[0]
    pos = ans.find(key)
    if pos < 0:
        return []
    chunk = ans[pos : pos + 2500]
    opts = ["正確", "錯誤", "無從判斷"]
    results = []
    # patterns like （1）正確（2分） ... explanation
    for m in re.finditer(
        r"[（(](\d+)[）)]\s*(正確|錯誤|無從判斷)\s*[（(]?\d*分[）)]?\s*([\s\S]{0,200}?)(?=[（(]\d+[）)]|^\d+\.|^[（(]?\d+[）)]?\s*[ACEBD]|$)",
        chunk,
        re.M,
    ):
        verdict = m.group(2)
        expl = re.sub(r"\s+", "", m.group(3))
        # try to find stem from earlier question text — use short expl as stem hint
        stem = expl[:60] if expl else f"判斷題（{m.group(1)}）"
        # Better: look for 正確（2分）followed by explanation that references content
        results.append(
            {
                "verdict": verdict,
                "explain_raw": expl,
                "n": int(m.group(1)),
            }
        )
    return results


# Curated judgment stems + answers from answer key (OCR-verified), keyed by practice num
# answer: 0正確 1錯誤 2無從判斷
CURATED_JUDGE = {
    1: [
        ("子張最後仍沒有見到魯哀公。", 0, "原文「七日而君不禮」並因而離去，故子張最後仍沒有見到魯哀公。"),
        ("魯哀公後來因不重視人才而招致亡國。", 2, "文中未有真正交代魯哀公的回應及其下場，故無從得知。"),
        ("葉公子高真心喜歡蛟龍。", 1, "原文「是葉公非好龍也，好夫似龍而非龍者也」可見葉公並非真心喜歡蛟龍。"),
    ],
    2: [
        ("商人認為漁夫不該過於貪心，是他許金不酬的原因之一。", 0, "原文商人謂「一日之獲幾何，而驟得十金，猶為不足乎」，可見其認為漁夫不該過於貪心。"),
        ("漁夫曾救過因沉船而落水的商人。", 0, "原文「有漁者以舟往救之」「漁者載而升諸陸」可見漁夫曾救商人。"),
        ("圍觀者不救商人，事後感到後悔。", 2, "文中並無交代圍觀者事後的情感，故無從判斷。"),
    ],
    3: [
        ("管寧後來後悔與華歆絕交。", 2, "文中未表明管寧後來有否後悔，故無從得知。"),
        ("二人曾於同一張席上讀書。", 0, "原文「又嘗同席讀書」可見二人曾同席讀書。"),
        ("華歆較管寧更不重視田中的金片。", 1, "原文「管揮鋤與瓦石不異，華捉而擲去之」可見華歆較重視金片。"),
    ],
    4: [
        ("北人連殼吃菱，是因為菱殼真能去熱。", 1, "原文「其人自護其短」可見連殼進食只是掩飾錯誤。"),
        ("菱為水生植物，而非土生植物。", 0, "原文「夫菱生於水而日土產」指出菱生於水。"),
        ("作者在背後嘲笑北人無知。", 2, "文中沒有提及他人或作者是否在背後嘲笑，故無從判斷。"),
    ],
    8: [
        ("兩人資質不同，所以學習成效不同。", 1, "原文「為是其智弗若與？曰：非然也。」指出並非智力不及。"),
        ("其中一人學習時三心兩意。", 0, "原文「一心以為鴻鵠將至，思援弓繳而射之」可見其不專心。"),
        ("弈秋只肯教導專心的學生。", 2, "文中未交代弈秋是否只教專心者，故無從判斷。"),
    ],
    11: [
        ("楚人先誇盾堅，後誇矛利。", 0, "原文先「譽其盾之堅」，俄而「譽其矛曰吾矛之利」。"),
        ("有人問「以子之矛陷子之盾」後，楚人立刻答覆。", 1, "原文「其人弗能應也」可見無法答覆。"),
        ("楚人後來改行不再賣兵器。", 2, "文中未交代其後動向，故無從判斷。"),
    ],
    13: [
        ("呂蒙正喜歡記下別人的過錯。", 1, "原文「呂蒙正相公不喜記人過」。"),
        ("有朝士在簾內指著他譏諷。", 0, "原文「有朝士於簾內指之曰：『是小子亦參政邪？』」。"),
        ("譏諷他的朝士後來向他道歉。", 2, "文中未交代該朝士其後態度，故無從判斷。"),
    ],
}

CURATED_MCQ = {
    1: [
        {
            "stem": "以下哪一項不是子張托話給魯哀公並離開的原因？",
            "options": [
                "因魯哀公七日均未有以禮接待子張",
                "因子張認為魯哀公並非真正愛士",
                "因子張有別國欣賞他，故拜別魯國",
                "因子張感到自己未受魯哀公尊重",
            ],
            "answer": 2,
            "quote": "故不遠千里之外以見君，七日而君不禮",
            "why": "文中未言子張因別國欣賞而離開；離開主因是七日不禮、好士有名無實。",
        }
    ],
    2: [
        {
            "stem": "第二次落水時，漁夫為何不救商人？",
            "options": [
                "當時風浪太大無法靠近",
                "因商人許金不酬，漁夫袖手旁觀",
                "商人自己拒絕救援",
                "另有官府船隻正在救援",
            ],
            "answer": 1,
            "quote": "漁者曰：「是許金而不酬者也。」袖而觀之",
            "why": "漁夫明言此人許金不酬，故袖手旁觀。",
        }
    ],
    3: [
        {
            "stem": "管寧割席分坐，主要是因為二人甚麼不同？",
            "options": ["年齡長幼", "出身貴賤", "價值觀與處事態度", "學問深淺"],
            "answer": 2,
            "quote": "子非吾友也",
            "why": "兩件小事對照出華歆慕財好管閒事，與管寧志向不同。",
        }
    ],
    7: [
        {
            "stem": "扁鵲第一次見齊桓侯時，指出病在何處？",
            "options": ["腸胃", "血脈", "腠理", "骨髓"],
            "answer": 2,
            "quote": "君有疾在腠理，不治將深",
            "why": "第一次診斷指出病在腠理。",
        }
    ],
    10: [
        {
            "stem": "兩小兒爭辯的核心是甚麼？",
            "options": [
                "太陽顏色深淺",
                "太陽距離遠近與感覺差異",
                "孔子學問高低",
                "一天有多少時辰",
            ],
            "answer": 1,
            "quote": "一兒以日初出遠，而日中時近也",
            "why": "爭論圍繞日始出與日中時遠近／大小／涼熱。",
        }
    ],
    16: [
        {
            "stem": "方仲永後來「泯然眾人」的主要原因是？",
            "options": [
                "天生沒有才能",
                "父親貪利，不讓他學習",
                "鄉人嫉妒陷害",
                "考試制度不公",
            ],
            "answer": 1,
            "quote": "父利其然也，日扳仲永環謁於邑人，不使學",
            "why": "父親貪利帶他四處謁見，不讓他學習，終致才能荒廢。",
        }
    ],
}


def make_option_explains(correct_idx, options, quote, why_correct, wrong_hint):
    oes = []
    for i, opt in enumerate(options):
        if i == correct_idx:
            body = f"正確是「{opt}」。"
            if quote:
                body += f"原文「{quote}」可作依據。"
            body += why_correct
            oes.append(body)
        else:
            body = f"選「{opt}」不對。"
            if quote:
                body += f"宜回看「{quote}」再判。"
            body += wrong_hint + f"正解應為「{options[correct_idx]}」。"
            oes.append(body)
    return oes


def build_questions(num: str, title: str, text: str):
    qs = []
    qid = 0

    def add(qtype, tag, stem, options, answer, quote, why, wrong):
        nonlocal qid
        qid += 1
        explain = f"正確是「{options[answer]}」。"
        if quote:
            explain += f"原文「{quote}」可作依據。"
        explain += why
        qs.append(
            {
                "id": f"s3-p{int(num):02d}-q{qid}",
                "type": qtype,
                "tag": tag,
                "stem": stem,
                "options": options,
                "answer": answer,
                "explain": explain,
                "optionExplains": make_option_explains(
                    answer, options, quote, why, wrong
                ),
            }
        )

    for stem, ans, why in CURATED_JUDGE.get(num, []):
        opts = ["正確", "錯誤", "無從判斷"]
        # pick a short quote from why if contains 「」
        qm = re.search(r"「([^」]{4,40})」", why)
        quote = qm.group(1) if qm else ""
        add(
            "judge",
            "判斷",
            stem,
            opts,
            ans,
            quote,
            why,
            "宜據原文明示句判斷，勿臆測文外情節。",
        )

    for item in CURATED_MCQ.get(num, []):
        add(
            "mcq",
            "理解",
            item["stem"],
            item["options"],
            item["answer"],
            item.get("quote", ""),
            item.get("why", ""),
            "宜扣原文關鍵，勿加入文外情節。",
        )

    # Always try to add a content-grounded comprehension if we have text and still < 4 qs
    if len(qs) < 4 and text and "【缺】" not in text[:20]:
        # word meaning from notes-like common patterns
        if "曰" in text or "謂" in text:
            add(
                "mcq",
                "字詞",
                "文中「曰」字最接近下列哪一解釋？",
                ["說", "太陽", "叫做（專名）", "通「悅」"],
                0,
                "",
                "在對話或引述中，「曰」多解作「說」。",
                "勿與「日」字形混淆。",
            )

    # Ensure at least 3 questions: if still short, add true/false from theme sentence in text
    if len(qs) < 3 and len(text) > 40:
        # first sentence fragment
        frag = text[:24]
        add(
            "judge",
            "判斷",
            f"本文開首提及「{frag}……」相關內容。",
            ["正確", "錯誤", "無從判斷"],
            0,
            frag[:16],
            "開首文句與選項所述相符。",
            "宜對照開首原文。",
        )

    return qs[:8]  # cap reasonable


def paragraph_blocks(text: str):
    # split by 。」 patterns into ~2-4 paras
    parts = re.split(r"(?<=[。！？])", text)
    parts = [p.strip() for p in parts if p.strip()]
    if len(parts) <= 1:
        return [text] if text else []
    # group into up to 3
    if len(parts) <= 3:
        return parts
    n = 3
    per = max(1, len(parts) // n)
    out = []
    for i in range(n):
        chunk = "".join(parts[i * per : (i + 1) * per if i < n - 1 else len(parts)])
        if chunk:
            out.append(chunk)
    return out


def build_guide(title: str, text: str, yuyi: str, theme: str):
    paras = paragraph_blocks(text)
    sections = []
    # split yuyi roughly by 。 into same count
    yparts = [p.strip() for p in re.split(r"(?<=[。！？])", yuyi) if p.strip()] if yuyi else []
    for i, p in enumerate(paras):
        label = f"第{['一','二','三','四','五'][i]}段" if i < 5 else f"第{i+1}段"
        tr = yparts[i] if i < len(yparts) else (yuyi if i == 0 and yuyi else "【缺】本段語譯原文檔未完整錄入。")
        if i > 0 and i >= len(yparts):
            tr = "【缺】"
        plain = tr if tr != "【缺】" else "本段淺白說明從略（原文檔殘缺）。"
        sections.append(
            {
                "label": label,
                "translation": tr,
                "plain": plain[:120],
                "theme": theme if i == 0 and theme else "",
            }
        )
    return {
        "translation": yuyi or "【缺】全文語譯待補（OCR／附檔未完整）。",
        "plain": (theme or yuyi or "")[:160],
        "theme": theme or "",
        "notes": [],
        "sections": sections,
        "words": [],
    }


def build_highlights(text: str):
    # light highlights for common function/content words if present
    cand = [
        ("曰", "xu", "說", "動詞"),
        ("之", "xu", "的／代詞", "虛詞"),
        ("也", "xu", "語氣助詞", "虛詞"),
        ("者", "xu", "……的人／……的事物", "虛詞"),
        ("矣", "xu", "了（語氣）", "虛詞"),
        ("哉", "xu", "呢／啊（感嘆）", "虛詞"),
        ("非", "shi", "不是", "副詞"),
        ("遂", "shi", "於是", "副詞"),
        ("乃", "xu", "於是／才", "虛詞"),
        ("以", "xu", "用／因／來", "虛詞"),
        ("於", "xu", "在／對", "介詞"),
        ("其", "xu", "他的／那", "代詞"),
        ("而", "xu", "而／卻／並且", "連詞"),
        ("好", "huo", "喜好（動詞活用）", "動詞"),
        ("客", "huo", "以客禮待（意動）", "動詞"),
    ]
    hls = []
    used = set()
    for w, kind, gloss, pos in cand:
        if w in text and w not in used:
            hls.append({"text": w, "kind": kind, "gloss": gloss, "pos": pos})
            used.add(w)
        if len(hls) >= 8:
            break
    return hls


def main():
    passages_data = json.loads(PASSAGES_PATH.read_text(encoding="utf-8"))
    ans = extract_answer_block(MD)
    sections = split_pdf_sections(MD)
    built = []
    skipped = []

    for num, body in sorted(sections, key=lambda x: x[0]):
        title, source = META.get(num, (f"練習{num}", "出典見原文"))
        classical = extract_classical(body)
        q = ocr_quality(classical)
        # skip poetry dual / heavily broken unless decent
        if q < 0.55 or len(re.findall(r"[\u4e00-\u9fff]", classical)) < 40:
            skipped.append((num, title, f"quality={q:.2f} len={len(classical)}"))
            continue
        # skip if more than 15% 【缺】
        if classical.count("【缺】") >= 3:
            skipped.append((num, title, "too many gaps"))
            continue

        yuyi = find_yuyi_for_title(ans, title)
        theme = find_theme(ans, title)
        questions = build_questions(num, title, classical)
        if len(questions) < 2:
            skipped.append((num, title, "too few questions"))
            continue

        pid = f"s3-p{num:02d}"
        entry = {
            "id": pid,
            "title": title,
            "grade": "s3",
            "source": source,
            "notes": "R2.9-S3 自附檔 OCR 整理；殘缺處標【缺】，不補造原文。",
            "text": classical,
            "questions": questions,
            "guide": build_guide(title, classical, yuyi, theme),
            "highlights": build_highlights(classical),
        }
        built.append(entry)

    passages_data["s3"] = built
    PASSAGES_PATH.write_text(
        json.dumps(passages_data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"built {len(built)} s3 passages")
    for e in built:
        print(f"  {e['id']} {e['title']} text={len(e['text'])} q={len(e['questions'])}")
    print("skipped:")
    for s in skipped:
        print(" ", s)


if __name__ == "__main__":
    main()
