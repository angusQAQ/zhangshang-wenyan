#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R2.10 NOA: hero teach cards + interactive chrome from logo_master."""
from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

ROOT = Path(__file__).resolve().parents[1]
TEACH = ROOT / "art/knowledge/teach"
UI = ROOT / "art/ui"
TEACH.mkdir(parents=True, exist_ok=True)

OLIVE = (122, 143, 106, 255)
OLIVE_DARK = (90, 110, 78, 255)
OLIVE_MID = (150, 170, 130, 255)
OLIVE_LIGHT = (234, 244, 229, 255)
CREAM = (251, 247, 238, 255)
CREAM2 = (245, 238, 224, 255)
PANEL = (248, 246, 240, 255)
INK = (55, 58, 52, 255)
MUTED = (120, 118, 110, 255)
SOFT_ORANGE = (230, 150, 60, 255)
ORANGE_FILL = (255, 240, 218, 255)
SOFT_PURPLE = (130, 100, 180, 255)
PURPLE_FILL = (241, 232, 251, 255)
SOFT_TEAL = (78, 142, 149, 255)
TEAL_FILL = (228, 242, 243, 255)
SOFT_PINK = (196, 92, 122, 255)
PINK_FILL = (253, 226, 232, 255)
WHITE = (255, 255, 255, 255)
GOLD = (212, 168, 80, 255)
SKY = (210, 228, 220, 255)

FONT_R = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
FONT_B = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
# NotoSansCJK TTC: SC=0 JP=1 KR=2 TC? — try index that renders TC well; 0 usually works for CJK glyphs
TC_IDX = 0


def F(size: int, bold: bool = False):
    path = FONT_B if bold else FONT_R
    return ImageFont.truetype(path, size, index=TC_IDX)


def extract_hero() -> Image.Image:
    logo = Image.open(UI / "logo_master.png").convert("RGBA")
    w, h = logo.size
    cx, cy, r = w // 2, h // 2, int(w * 0.43)
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(logo, (0, 0), mask)
    crop = out.crop((36, 28, 476, 468))
    # soft vignette already circular
    crop.save(TEACH / "_hero_extract.png")
    (UI / "logo_master.png")  # keep
    return crop


def paste_hero(canvas, hero, center, size, shadow=True):
    hh = hero.resize((size, size), Image.Resampling.LANCZOS)
    x = int(center[0] - size / 2)
    y = int(center[1] - size / 2)
    if shadow:
        sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh)
        ox, oy = center[0], center[1] + size * 0.44
        sd.ellipse(
            (ox - size * 0.3, oy - size * 0.055, ox + size * 0.3, oy + size * 0.075),
            fill=(70, 60, 40, 50),
        )
        sh = sh.filter(ImageFilter.GaussianBlur(8))
        canvas.alpha_composite(sh)
    canvas.alpha_composite(hh, (x, y))


def rr(draw, box, radius, fill=None, outline=None, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def notebook(W, H):
    img = Image.new("RGBA", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    for y in range(52, H - 20, 30):
        d.line([(72, y), (W - 28, y)], fill=(228, 220, 205, 160), width=1)
    for y in range(56, H - 40, 48):
        d.ellipse((16, y, 44, y + 28), fill=(218, 210, 196, 255), outline=OLIVE[:3] + (100,), width=2)
        d.ellipse((22, y + 6, 38, y + 22), fill=CREAM)
    # soft outer frame
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rounded_rectangle((6, 6, W - 7, H - 7), radius=32, outline=OLIVE[:3] + (70,), width=4)
    img = Image.alpha_composite(img, overlay)
    return img


def title_pill(draw, xy, text, fill=OLIVE, fg=WHITE, fsize=34):
    f = F(fsize, True)
    bb = f.getbbox(text)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    px, py = 22, 11
    x, y = xy
    box = (x, y, x + tw + px * 2, y + th + py * 2)
    rr(draw, box, 20, fill=fill)
    draw.text((x + px, y + py - bb[1] - 1), text, font=f, fill=fg)
    return box


def pill(draw, xy, text, fill=OLIVE_LIGHT, fg=OLIVE_DARK, fsize=24, outline=None, radius=14):
    f = F(fsize, True)
    bb = f.getbbox(text)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    px, py = 14, 7
    x, y = xy
    box = (x, y, x + tw + px * 2, y + th + py * 2)
    rr(draw, box, radius, fill=fill, outline=outline or OLIVE[:3] + (140,), width=2)
    draw.text((x + px, y + py - bb[1]), text, font=f, fill=fg)
    return box


def text_c(draw, xy, text, fsize=22, fill=INK, bold=False):
    draw.text(xy, text, font=F(fsize, bold), fill=fill)


def soft_panel(draw, box, fill=PANEL, outline=OLIVE[:3] + (80,), radius=22):
    rr(draw, box, radius, fill=fill, outline=outline, width=2)


def icon_circle(draw, cx, cy, r, fill, outline=None):
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill, outline=outline, width=3 if outline else 0)


def draw_scroll(draw, x, y, w, h):
    # rolled scroll
    rr(draw, (x, y, x + w, y + h), 10, fill=(245, 230, 200, 255), outline=GOLD, width=2)
    for i in range(3):
        yy = y + 18 + i * 16
        draw.line([(x + 14, yy), (x + w - 14, yy)], fill=(210, 185, 140, 200), width=2)
    # rollers
    draw.ellipse((x - 8, y + 4, x + 10, y + h - 4), fill=GOLD, outline=(180, 140, 50, 255), width=2)
    draw.ellipse((x + w - 10, y + 4, x + w + 8, y + h - 4), fill=GOLD, outline=(180, 140, 50, 255), width=2)


def draw_magnifier(draw, cx, cy, r=36):
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=OLIVE_DARK, width=5)
    draw.ellipse((cx - r + 6, cy - r + 6, cx + r - 10, cy + r - 10), fill=(220, 235, 240, 120))
    # handle
    ang = math.radians(45)
    x1 = cx + r * 0.7 * math.cos(ang)
    y1 = cy + r * 0.7 * math.sin(ang)
    x2 = cx + (r + 34) * math.cos(ang)
    y2 = cy + (r + 34) * math.sin(ang)
    draw.line([(x1, y1), (x2, y2)], fill=OLIVE_DARK, width=8)


def draw_brush(draw, x, y):
    # brush + holder
    draw.rounded_rectangle((x, y, x + 18, y + 90), 4, fill=(60, 50, 40, 255))
    draw.polygon([(x - 4, y), (x + 22, y), (x + 9, y - 28)], fill=(40, 40, 40, 255))
    draw.rounded_rectangle((x - 2, y + 90, x + 20, y + 118), 3, fill=GOLD)


def draw_book(draw, x, y, w=70, h=90, cover=(120, 150, 170, 255)):
    rr(draw, (x, y, x + w, y + h), 6, fill=cover, outline=OLIVE_DARK, width=2)
    draw.line([(x + 10, y + 8), (x + 10, y + h - 8)], fill=WHITE[:3] + (180,), width=3)
    for i in range(3):
        draw.line([(x + 22, y + 28 + i * 16), (x + w - 12, y + 28 + i * 16)], fill=WHITE[:3] + (140,), width=2)


def save(img: Image.Image, path: Path):
    img.save(path, "PNG", optimize=True)
    print(f"  wrote {path.relative_to(ROOT)} {img.size}")


# ───────────── cards ─────────────

def card_features(hero):
    W, H = 1200, 780
    img = notebook(W, H)
    d = ImageDraw.Draw(img)
    title_pill(d, (90, 36), "文言文的特點", fill=OLIVE)
    text_c(d, (420, 52), "單音・省略・語序", 26, MUTED)

    soft_panel(d, (90, 120, 1110, 700), fill=(255, 255, 255, 200))

    # hero center-left with scroll + magnifier
    paste_hero(img, hero, (340, 420), 380)
    d = ImageDraw.Draw(img)
    draw_scroll(d, 480, 280, 130, 90)
    draw_magnifier(d, 640, 250, 42)

    # three feature icons on right
    features = [
        ("單音", "一字一義多", ORANGE_FILL, SOFT_ORANGE, 720, 220),
        ("省略", "省主語／賓語", OLIVE_LIGHT, OLIVE, 720, 380),
        ("語序", "異於白話", TEAL_FILL, SOFT_TEAL, 720, 540),
    ]
    for title, sub, fill, edge, x, y in features:
        rr(d, (x, y, x + 340, y + 120), 20, fill=fill, outline=edge, width=3)
        icon_circle(d, x + 50, y + 60, 32, WHITE, edge)
        text_c(d, (x + 38, y + 44), title[0], 28, edge, True)
        text_c(d, (x + 100, y + 28), title, 30, INK, True)
        text_c(d, (x + 100, y + 68), sub, 22, MUTED)
    save(img, TEACH / "hero_features.png")


def card_howto_read(hero):
    W, H = 1200, 780
    img = notebook(W, H)
    d = ImageDraw.Draw(img)
    title_pill(d, (90, 36), "如何閱讀", fill=OLIVE)
    text_c(d, (340, 52), "五步路徑", 26, MUTED)
    soft_panel(d, (90, 120, 1110, 700), fill=(255, 255, 255, 200))

    steps = ["斷句", "釋詞", "通譯", "章旨", "賞析"]
    # path curve
    pts = [(180, 520), (360, 280), (560, 520), (760, 280), (960, 480)]
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i + 1]], fill=OLIVE_MID, width=8)
        # dashed overlay feel: small white gaps drawn as dots along? keep solid soft
    for i, (p, label) in enumerate(zip(pts, steps), 1):
        r = 48
        icon_circle(d, p[0], p[1], r, WHITE, OLIVE)
        icon_circle(d, p[0], p[1], r - 8, OLIVE_LIGHT)
        f = F(28, True)
        bb = f.getbbox(str(i))
        d.text((p[0] - (bb[2] - bb[0]) / 2, p[1] - 18), str(i), font=f, fill=OLIVE_DARK)
        text_c(d, (p[0] - 28, p[1] + 58), label, 24, INK, True)

    paste_hero(img, hero, (560, 400), 300)
    save(img, TEACH / "hero_howto-read.png")


def card_particles(hero):
    W, H = 1200, 780
    img = notebook(W, H)
    d = ImageDraw.Draw(img)
    title_pill(d, (90, 36), "文言虛詞", fill=OLIVE)
    text_c(d, (340, 52), "點浮粒・識用法", 26, MUTED)
    soft_panel(d, (90, 120, 1110, 700), fill=(255, 255, 255, 200))

    paste_hero(img, hero, (320, 430), 360)
    d = ImageDraw.Draw(img)
    # pointing hand hint: small arrow from hero to pills
    d.line([(480, 360), (560, 280)], fill=OLIVE, width=4)
    d.polygon([(560, 280), (545, 268), (548, 292)], fill=OLIVE)

    pills = [
        ("而", 620, 200, ORANGE_FILL, SOFT_ORANGE),
        ("也", 820, 180, OLIVE_LIGHT, OLIVE),
        ("者", 980, 260, TEAL_FILL, SOFT_TEAL),
        ("乎", 700, 360, PURPLE_FILL, SOFT_PURPLE),
        ("之", 900, 400, PINK_FILL, SOFT_PINK),
        ("於", 780, 520, ORANGE_FILL, SOFT_ORANGE),
        ("其", 980, 540, OLIVE_LIGHT, OLIVE),
    ]
    for ch, x, y, fill, edge in pills:
        r = 48
        icon_circle(d, x, y, r + 4, WHITE, edge)
        icon_circle(d, x, y, r, fill)
        f = F(36, True)
        bb = f.getbbox(ch)
        d.text((x - (bb[2] - bb[0]) / 2, y - 22), ch, font=f, fill=edge)
    text_c(d, (600, 640), "點色塊揭用法", 22, MUTED)
    save(img, TEACH / "hero_particles.png")


def card_polysemy(hero):
    W, H = 1200, 780
    img = notebook(W, H)
    d = ImageDraw.Draw(img)
    title_pill(d, (90, 36), "一詞多義", fill=OLIVE)
    text_c(d, (340, 52), "一字多解", 26, MUTED)
    soft_panel(d, (90, 120, 1110, 700), fill=(255, 255, 255, 200))

    # big 之
    icon_circle(d, 380, 360, 90, ORANGE_FILL, SOFT_ORANGE)
    f = F(72, True)
    bb = f.getbbox("之")
    d.text((380 - (bb[2] - bb[0]) / 2, 360 - 44), "之", font=f, fill=SOFT_ORANGE)

    # split lines to 3 bubbles
    bubbles = [
        ("代詞", "他／她／它", 700, 220, PURPLE_FILL, SOFT_PURPLE),
        ("結構助詞", "的", 880, 380, OLIVE_LIGHT, OLIVE),
        ("往・到", "動詞", 700, 560, TEAL_FILL, SOFT_TEAL),
    ]
    for label, sub, x, y, fill, edge in bubbles:
        d.line([(460, 360), (x - 80, y)], fill=edge[:3] + (160,), width=3)
        rr(d, (x - 90, y - 50, x + 130, y + 50), 22, fill=fill, outline=edge, width=3)
        text_c(d, (x - 70, y - 36), label, 28, INK, True)
        text_c(d, (x - 70, y + 4), sub, 22, MUTED)

    # hero looking enlightened on left-bottomish
    paste_hero(img, hero, (220, 520), 280)
    d = ImageDraw.Draw(img)
    # small sparkles near head
    for sx, sy in [(300, 320), (160, 340), (250, 300)]:
        d.ellipse((sx, sy, sx + 10, sy + 10), fill=GOLD)
    text_c(d, (140, 660), "先懵再明", 22, MUTED)
    save(img, TEACH / "hero_polysemy.png")


def card_ancient_modern(hero):
    W, H = 1200, 780
    img = notebook(W, H)
    d = ImageDraw.Draw(img)
    title_pill(d, (90, 36), "古今詞義", fill=OLIVE)
    text_c(d, (340, 52), "詞義會變", 26, MUTED)
    soft_panel(d, (90, 120, 1110, 700), fill=(255, 255, 255, 200))

    # left ancient panel
    rr(d, (120, 180, 420, 620), 24, fill=ORANGE_FILL, outline=SOFT_ORANGE, width=3)
    text_c(d, (200, 210), "古義", 32, SOFT_ORANGE, True)
    draw_brush(d, 250, 320)
    text_c(d, (180, 520), "毛筆・典籍", 24, MUTED)

    # right modern
    rr(d, (780, 180, 1080, 620), 24, fill=TEAL_FILL, outline=SOFT_TEAL, width=3)
    text_c(d, (860, 210), "今義", 32, SOFT_TEAL, True)
    draw_book(d, 900, 320, 80, 100, cover=SOFT_TEAL)
    text_c(d, (840, 520), "現代課本", 24, MUTED)

    # center arrow 義變
    d.polygon([(460, 380), (740, 380), (740, 350), (800, 400), (740, 450), (740, 420), (460, 420)], fill=OLIVE)
    f = F(28, True)
    bb = f.getbbox("義變")
    d.text((580 - (bb[2] - bb[0]) / 2, 385), "義變", font=f, fill=WHITE)

    paste_hero(img, hero, (600, 560), 260)
    save(img, TEACH / "hero_ancient-modern.png")


def card_loan_chars(hero):
    W, H = 1200, 780
    img = notebook(W, H)
    d = ImageDraw.Draw(img)
    title_pill(d, (90, 36), "通假字", fill=OLIVE)
    text_c(d, (300, 52), "音近・形近互通", 26, MUTED)
    soft_panel(d, (90, 120, 1110, 700), fill=(255, 255, 255, 200))

    # two character cards
    def char_card(cx, cy, ch, sub, fill, edge):
        rr(d, (cx - 100, cy - 110, cx + 100, cy + 110), 24, fill=fill, outline=edge, width=3)
        f = F(72, True)
        bb = f.getbbox(ch)
        d.text((cx - (bb[2] - bb[0]) / 2, cy - 70), ch, font=f, fill=edge)
        text_c(d, (cx - 40, cy + 50), sub, 24, MUTED)

    char_card(280, 380, "女", "本字", ORANGE_FILL, SOFT_ORANGE)
    char_card(920, 380, "汝", "通假", TEAL_FILL, SOFT_TEAL)

    # bridge arc
    for t in range(0, 101, 2):
        ang = math.pi * (1 - t / 100)
        x = 600 + 280 * math.cos(ang)
        y = 280 + 80 * math.sin(ang)
        d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=OLIVE_MID)
    # bridge deck
    d.arc((320, 200, 880, 480), 200, 340, fill=OLIVE, width=6)
    pill(d, (540, 200), "互通", fill=OLIVE, fg=WHITE, fsize=26, outline=OLIVE)

    paste_hero(img, hero, (600, 500), 300)
    d = ImageDraw.Draw(img)
    text_c(d, (480, 660), "主人翁架橋連結", 22, MUTED)
    save(img, TEACH / "hero_loan-chars.png")


def card_sentence_patterns(hero):
    W, H = 1200, 780
    img = notebook(W, H)
    d = ImageDraw.Draw(img)
    title_pill(d, (90, 36), "文言常見句式", fill=OLIVE)
    text_c(d, (420, 52), "使動・意動…", 26, MUTED)
    soft_panel(d, (90, 120, 1110, 700), fill=(255, 255, 255, 200))

    # two boards
    rr(d, (160, 200, 480, 520), 24, fill=ORANGE_FILL, outline=SOFT_ORANGE, width=4)
    text_c(d, (260, 240), "使動", 44, SOFT_ORANGE, True)
    text_c(d, (210, 330), "A 讓 B 去做", 28, INK)
    text_c(d, (220, 400), "外在結果", 24, MUTED)

    rr(d, (720, 200, 1040, 520), 24, fill=PURPLE_FILL, outline=SOFT_PURPLE, width=4)
    text_c(d, (820, 240), "意動", 44, SOFT_PURPLE, True)
    text_c(d, (770, 330), "心裡當成", 28, INK)
    text_c(d, (790, 400), "內心結果", 24, MUTED)

    paste_hero(img, hero, (600, 480), 320)
    d = ImageDraw.Draw(img)
    # small VS badge
    icon_circle(d, 600, 280, 36, OLIVE)
    text_c(d, (580, 262), "對", 28, WHITE, True)
    save(img, TEACH / "hero_sentence-patterns.png")


def card_shi_dong(hero):
    W, H = 1100, 720
    img = notebook(W, H)
    d = ImageDraw.Draw(img)
    title_pill(d, (90, 36), "使動", fill=SOFT_ORANGE)
    text_c(d, (260, 52), "A 讓 B 去做", 26, MUTED)
    soft_panel(d, (80, 110, 1020, 660), fill=(255, 255, 255, 210))

    # A = hero
    paste_hero(img, hero, (260, 360), 300)
    d = ImageDraw.Draw(img)
    icon_circle(d, 260, 540, 28, OLIVE_LIGHT, OLIVE)
    text_c(d, (250, 524), "A", 28, OLIVE_DARK, True)

    # arrow 使
    d.polygon([(420, 340), (620, 340), (620, 310), (700, 370), (620, 430), (620, 400), (420, 400)], fill=SOFT_ORANGE)
    f = F(30, True)
    bb = f.getbbox("使")
    d.text((520 - (bb[2] - bb[0]) / 2, 350), "使", font=f, fill=WHITE)

    # B simple friendly figure (teal blob with face) — keep as partner, hero is A
    bx, by = 820, 340
    icon_circle(d, bx, by, 70, TEAL_FILL, SOFT_TEAL)
    # face
    d.ellipse((bx - 18, by - 10, bx - 8, by), fill=INK)
    d.ellipse((bx + 8, by - 10, bx + 18, by), fill=INK)
    d.arc((bx - 20, by + 4, bx + 20, by + 28), 20, 160, fill=INK, width=3)
    d.ellipse((bx - 28, by + 8, bx - 16, by + 20), fill=(240, 160, 150, 200))
    d.ellipse((bx + 16, by + 8, bx + 28, by + 20), fill=(240, 160, 150, 200))
    icon_circle(d, bx, by + 110, 28, TEAL_FILL, SOFT_TEAL)
    text_c(d, (bx - 10, by + 94), "B", 28, SOFT_TEAL, True)

    rr(d, (760, 520, 980, 600), 16, fill=ORANGE_FILL, outline=SOFT_ORANGE, width=2)
    text_c(d, (800, 540), "去做 X", 28, SOFT_ORANGE, True)

    pill(d, (120, 600), "重點：讓對方行動", fill=WHITE, fg=OLIVE_DARK, fsize=22, outline=OLIVE)
    pill(d, (520, 600), "結果在外面發生", fill=SOFT_ORANGE, fg=WHITE, fsize=22, outline=SOFT_ORANGE)
    save(img, TEACH / "hero_shi_dong.png")


def card_yi_dong(hero):
    W, H = 1100, 720
    img = notebook(W, H)
    d = ImageDraw.Draw(img)
    title_pill(d, (90, 36), "意動", fill=SOFT_PURPLE)
    text_c(d, (260, 52), "以之為…（心裡當成）", 26, MUTED)
    soft_panel(d, (80, 110, 1020, 660), fill=(255, 255, 255, 210))

    paste_hero(img, hero, (300, 380), 340)
    d = ImageDraw.Draw(img)

    # thought bubble
    rr(d, (560, 200, 960, 420), 40, fill=PURPLE_FILL, outline=SOFT_PURPLE, width=3)
    # bubble tail
    d.ellipse((500, 400, 540, 440), fill=PURPLE_FILL, outline=SOFT_PURPLE, width=2)
    d.ellipse((470, 440, 495, 465), fill=PURPLE_FILL, outline=SOFT_PURPLE, width=2)
    text_c(d, (620, 250), "以之為美", 36, SOFT_PURPLE, True)
    text_c(d, (640, 320), "★ 認定", 28, INK)

    pill(d, (560, 500), "重點：主觀認定", fill=WHITE, fg=SOFT_PURPLE, fsize=22, outline=SOFT_PURPLE)
    pill(d, (560, 570), "結果在心裡發生", fill=SOFT_PURPLE, fg=WHITE, fsize=22, outline=SOFT_PURPLE)
    save(img, TEACH / "hero_yi_dong.png")


def card_compare(hero):
    W, H = 1200, 780
    img = notebook(W, H)
    d = ImageDraw.Draw(img)
    title_pill(d, (90, 36), "使動 vs 意動", fill=OLIVE)
    text_c(d, (420, 52), "對照一目了然", 26, MUTED)
    soft_panel(d, (80, 110, 1120, 720), fill=(255, 255, 255, 210))

    # left 使動
    rr(d, (110, 150, 560, 680), 24, fill=ORANGE_FILL, outline=SOFT_ORANGE, width=3)
    pill(d, (200, 180), "使動", fill=SOFT_ORANGE, fg=WHITE, fsize=30, outline=SOFT_ORANGE)
    text_c(d, (200, 260), "讓別人去做", 28, INK, True)
    paste_hero(img, hero, (280, 420), 220)
    d = ImageDraw.Draw(img)
    # small B
    icon_circle(d, 450, 400, 40, TEAL_FILL, SOFT_TEAL)
    d.line([(360, 400), (410, 400)], fill=SOFT_ORANGE, width=5)
    d.polygon([(410, 390), (430, 400), (410, 410)], fill=SOFT_ORANGE)
    rr(d, (400, 460, 520, 510), 12, fill=WHITE, outline=SOFT_ORANGE, width=2)
    text_c(d, (420, 470), "行動", 22, SOFT_ORANGE, True)
    pill(d, (180, 560), "外在結果", fill=SOFT_ORANGE, fg=WHITE, fsize=24, outline=SOFT_ORANGE)
    text_c(d, (150, 630), "例：死之＝使他死", 22, MUTED)

    # right 意動
    rr(d, (640, 150, 1090, 680), 24, fill=PURPLE_FILL, outline=SOFT_PURPLE, width=3)
    pill(d, (760, 180), "意動", fill=SOFT_PURPLE, fg=WHITE, fsize=30, outline=SOFT_PURPLE)
    text_c(d, (740, 260), "心裡當成", 28, INK, True)
    paste_hero(img, hero, (860, 420), 220)
    d = ImageDraw.Draw(img)
    rr(d, (760, 330, 1020, 420), 18, fill=WHITE, outline=SOFT_PURPLE, width=2)
    text_c(d, (790, 350), "以之為美 ★", 24, SOFT_PURPLE, True)
    pill(d, (740, 560), "內心結果", fill=SOFT_PURPLE, fg=WHITE, fsize=24, outline=SOFT_PURPLE)
    text_c(d, (700, 630), "例：奇之＝以之為奇", 22, MUTED)

    # center 對
    icon_circle(d, 600, 400, 34, OLIVE)
    text_c(d, (580, 382), "對", 28, WHITE, True)
    save(img, TEACH / "hero_compare_shi_yi.png")


# ───────────── chrome ─────────────

def chrome_tap_hint_ring():
    s = 256
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = cy = s // 2
    r = 100
    # dashed circle
    for i in range(0, 360, 18):
        a0 = math.radians(i)
        a1 = math.radians(i + 10)
        pts = []
        for t in range(0, 11):
            a = a0 + (a1 - a0) * t / 10
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        if len(pts) > 1:
            d.line(pts, fill=OLIVE[:3] + (200,), width=6)
    # inner soft glow ring
    for rr_ in range(88, 96):
        d.ellipse((cx - rr_, cy - rr_, cx + rr_, cy + rr_), outline=OLIVE[:3] + (40,), width=1)
    save(img, UI / "tap_hint_ring.png")


def chrome_hotspot_dot():
    s = 128
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = cy = s // 2
    d.ellipse((16, 16, 112, 112), fill=WHITE)
    d.ellipse((24, 24, 104, 104), fill=OLIVE)
    # soft highlight
    d.ellipse((40, 36, 70, 60), fill=(255, 255, 255, 70))
    save(img, UI / "hotspot_dot.png")


def chrome_card_flip_hint():
    W, H = 220, 140
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # curved arrows suggesting flip
    d.arc((30, 30, 120, 110), 200, 340, fill=OLIVE, width=6)
    d.polygon([(105, 28), (125, 40), (100, 48)], fill=OLIVE)
    d.arc((100, 30, 190, 110), 20, 160, fill=OLIVE_MID, width=6)
    d.polygon([(115, 112), (95, 100), (120, 92)], fill=OLIVE_MID)
    # optional 翻
    f = F(28, True)
    bb = f.getbbox("翻")
    d.text((W / 2 - (bb[2] - bb[0]) / 2, H / 2 - 18), "翻", font=f, fill=OLIVE_DARK)
    save(img, UI / "card_flip_hint.png")


def chrome_immersive_panel_bg():
    W, H = 800, 480
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rr(d, (0, 0, W - 1, H - 1), 36, fill=CREAM, outline=OLIVE[:3] + (100,), width=3)
    # subtle inner
    rr(d, (16, 16, W - 17, H - 17), 28, fill=None, outline=OLIVE_LIGHT, width=2)
    # soft top shine
    shine = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shine)
    sd.ellipse((-40, -80, W + 40, 160), fill=(255, 255, 255, 50))
    img = Image.alpha_composite(img, shine)
    save(img, UI / "immersive_panel_bg.png")


def chrome_btn_reveal():
    W, H = 360, 72
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rr(d, (0, 0, W - 1, H - 1), 36, fill=OLIVE)
    # soft top highlight
    d.rounded_rectangle((8, 6, W - 9, H // 2), radius=28, fill=(255, 255, 255, 35))
    save(img, UI / "btn_reveal.png")


def legend_knowledge_dots():
    W, H = 900, 120
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rr(d, (0, 0, W - 1, H - 1), 20, fill=CREAM, outline=OLIVE[:3] + (80,), width=2)
    items = [
        ("意", SOFT_PURPLE, PURPLE_FILL),
        ("使", SOFT_ORANGE, ORANGE_FILL),
        ("tip", OLIVE, OLIVE_LIGHT),
    ]
    x = 40
    for label, edge, fill in items:
        icon_circle(d, x + 22, H // 2, 20, fill, edge)
        text_c(d, (x + 55, H // 2 - 16), label, 28, INK, True)
        x += 280
    save(img, UI / "legend_knowledge_dots.png")


def main():
    print("R2.10 hero teach art — GenerateImage unavailable; PIL composite from logo_master")
    # ensure ref copy
    ref = TEACH / "_ref_hero.png"
    if not ref.exists():
        Image.open(UI / "logo_master.png").save(ref)
    else:
        # refresh
        Image.open(UI / "logo_master.png").save(ref)
    hero = extract_hero()
    print("hero extracted", hero.size)

    card_features(hero)
    card_howto_read(hero)
    card_particles(hero)
    card_polysemy(hero)
    card_ancient_modern(hero)
    card_loan_chars(hero)
    card_sentence_patterns(hero)
    card_shi_dong(hero)
    card_yi_dong(hero)
    card_compare(hero)

    chrome_tap_hint_ring()
    chrome_hotspot_dot()
    chrome_card_flip_hint()
    chrome_immersive_panel_bg()
    chrome_btn_reveal()
    legend_knowledge_dots()
    print("DONE")


if __name__ == "__main__":
    main()
