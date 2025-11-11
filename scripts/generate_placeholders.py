from __future__ import annotations

from pathlib import Path
from typing import Iterable, Tuple

from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = Path(__file__).resolve().parents[1] / "assets" / "img" / "fighters"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CANVAS = (640, 800)
TITLE_FONT_SIZE = 64
TAG_FONT_SIZE = 28
BACKGROUND_COLORS = [
    ("#0ea5e9", "#0b1220"),
    ("#e11d48", "#121a2b"),
    ("#9333ea", "#111827"),
    ("#14b8a6", "#0b1220"),
    ("#f97316", "#121a2b"),
    ("#64748b", "#0b1220"),
]

FIGHTER_LABELS: Iterable[Tuple[str, str]] = [
    ("placeholder", "UFC"),
    ("alexandre-pantoja", "Pantoja"),
    ("brandon-royval", "Royval"),
    ("sean-omalley", "O'Malley"),
    ("merab-dvalishvili", "Merab"),
    ("ilia-topuria", "Topuria"),
    ("max-holloway", "Holloway"),
    ("islam-makhachev", "Makhachev"),
    ("arman-tsarukyan", "Tsarukyan"),
    ("leon-edwards", "Edwards"),
    ("belal-muhammad", "Belal"),
    ("dricus-du-plessis", "Du Plessis"),
    ("israel-adesanya", "Adesanya"),
    ("alex-pereira", "Pereira"),
    ("magomed-ankalaev", "Ankalaev"),
    ("jon-jones", "Jon Jones"),
    ("tom-aspinall", "Aspinall"),
    ("zhang-weili", "Zhang"),
    ("yan-xiaonan", "Yan"),
    ("alexa-grasso", "Grasso"),
    ("valentina-shevchenko", "Shevchenko"),
    ("raquel-pennington", "Pennington"),
    ("julianna-pena", "Peña"),
]

DIVISION_DIR = Path(__file__).resolve().parents[1] / "assets" / "img" / "divisions"
DIVISION_DIR.mkdir(parents=True, exist_ok=True)

DIVISION_BANNERS: Iterable[Tuple[str, str, str]] = [
    ("mens-flyweight", "Men’s Flyweight", "125 lb"),
    ("mens-bantamweight", "Men’s Bantamweight", "135 lb"),
    ("mens-featherweight", "Men’s Featherweight", "145 lb"),
    ("mens-lightweight", "Men’s Lightweight", "155 lb"),
    ("mens-welterweight", "Men’s Welterweight", "170 lb"),
    ("mens-middleweight", "Men’s Middleweight", "185 lb"),
    ("mens-light-heavyweight", "Men’s Light Heavyweight", "205 lb"),
    ("mens-heavyweight", "Men’s Heavyweight", "265 lb"),
    ("womens-strawweight", "Women’s Strawweight", "115 lb"),
    ("womens-flyweight", "Women’s Flyweight", "125 lb"),
    ("womens-bantamweight", "Women’s Bantamweight", "135 lb"),
]


def blended_background(width: int, height: int, start: str, end: str) -> Image.Image:
    base = Image.new("RGB", (width, height), end)
    overlay = Image.new("RGB", (width, height), start)
    mask = Image.new("L", (width, height))
    for y in range(height):
        intensity = int(255 * (1 - y / height))
        for x in range(width):
            mask.putpixel((x, y), intensity)
    base.paste(overlay, (0, 0), mask)
    return base


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    try:
        return ImageFont.truetype("DejaVuSans-Bold.ttf", size)
    except OSError:
        return ImageFont.load_default()


def text_measure(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> Tuple[int, int]:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def draw_poster(slug: str, label: str, color_pair: Tuple[str, str]) -> None:
    bg = blended_background(CANVAS[0], CANVAS[1], color_pair[0], color_pair[1])

    accent = Image.new("RGBA", CANVAS, (225, 29, 72, 0))
    accent_draw = ImageDraw.Draw(accent)
    accent_draw.rounded_rectangle(
        (40, 80, CANVAS[0] - 40, CANVAS[1] - 80),
        radius=48,
        outline=(225, 29, 72, 90),
        width=4,
    )
    accent_draw.line((60, 160, CANVAS[0] - 60, 200), fill=(14, 165, 233, 120), width=6)
    accent_draw.line((60, CANVAS[1] - 160, CANVAS[0] - 60, CANVAS[1] - 200), fill=(14, 165, 233, 120), width=6)
    bg = Image.alpha_composite(bg.convert("RGBA"), accent)
    draw = ImageDraw.Draw(bg)

    title_font = load_font(TITLE_FONT_SIZE)
    tag_font = load_font(TAG_FONT_SIZE)

    tag_text = "UFC TWO PER DIVISION"
    tag_width, tag_height = text_measure(draw, tag_text, tag_font)
    draw.text(
        ((CANVAS[0] - tag_width) / 2, 120),
        tag_text,
        font=tag_font,
        fill=(199, 207, 220, 255),
    )

    label_width, label_height = text_measure(draw, label.upper(), title_font)
    draw.text(
        ((CANVAS[0] - label_width) / 2, (CANVAS[1] - label_height) / 2),
        label.upper(),
        font=title_font,
        fill=(230, 234, 242, 255),
    )

    output_path = OUTPUT_DIR / f"{slug}.webp"
    bg.convert("RGB").save(output_path, "WEBP", quality=90)
    print(f"Created {output_path.relative_to(Path.cwd())}")


def draw_banner(slug: str, title: str, weight: str, color_pair: Tuple[str, str]) -> None:
    width, height = 1200, 480
    bg = blended_background(width, height, color_pair[0], color_pair[1]).convert("RGBA")
    draw = ImageDraw.Draw(bg)

    frame = Image.new("RGBA", (width, height))
    frame_draw = ImageDraw.Draw(frame)
    frame_draw.rounded_rectangle(
        (30, 30, width - 30, height - 30),
        radius=60,
        outline=(225, 29, 72, 90),
        width=6,
        fill=(11, 18, 32, 120),
    )
    frame_draw.line((80, height - 120, width - 80, height - 90), fill=(14, 165, 233, 120), width=6)
    bg = Image.alpha_composite(bg, frame)
    draw = ImageDraw.Draw(bg)

    title_font = load_font(72)
    subtitle_font = load_font(32)

    title_width, title_height = text_measure(draw, title.upper(), title_font)
    draw.text(
        ((width - title_width) / 2, height / 2 - title_height),
        title.upper(),
        font=title_font,
        fill=(230, 234, 242, 255),
    )

    subtitle = f"Limit: {weight}"
    subtitle_width, subtitle_height = text_measure(draw, subtitle, subtitle_font)
    draw.text(
        ((width - subtitle_width) / 2, height / 2 + 20),
        subtitle,
        font=subtitle_font,
        fill=(199, 207, 220, 255),
    )

    output_path = DIVISION_DIR / f"{slug}.webp"
    bg.convert("RGB").save(output_path, "WEBP", quality=90)
    print(f"Created {output_path.relative_to(Path.cwd())}")


def main() -> None:
    colors_cycle = BACKGROUND_COLORS * (len(FIGHTER_LABELS) // len(BACKGROUND_COLORS) + 1)
    for (slug, label), colors in zip(FIGHTER_LABELS, colors_cycle, strict=False):
        draw_poster(slug, label, colors)

    banner_cycle = BACKGROUND_COLORS * (len(DIVISION_BANNERS) // len(BACKGROUND_COLORS) + 1)
    for (slug, title, weight), colors in zip(DIVISION_BANNERS, banner_cycle, strict=False):
        draw_banner(slug, title, weight, colors)


if __name__ == "__main__":
    main()
