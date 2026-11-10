#!/usr/bin/env python3
"""Render the owner's official BisaBikinWeb logo as ONE intact SVG image.

No manual wordmark, tagline, brace crops or redrawn letterforms. Any failure
to render the original owner asset stops production instead of substituting.
"""
from __future__ import annotations
import io
from pathlib import Path
import subprocess
from PIL import Image

OWNER_LOGO = Path("public-assets/brand/bisabikinweb-logo.svg")
LOGO_WIDTH = 394

def official_news_logo() -> Image.Image:
    svg = OWNER_LOGO.read_bytes()
    if not (b'<svg' in svg[:200] and b'canva-source' in svg):
        raise RuntimeError("Official Canva SVG logo unavailable; do not redraw it")
    result = subprocess.run(
        ["rsvg-convert", "--format=png", "--width", str(LOGO_WIDTH)],
        input=svg, capture_output=True, check=True, timeout=20,
    )
    with Image.open(io.BytesIO(result.stdout)) as rendered:
        output=rendered.convert("RGBA")
    if not 78 <= output.height <= 90 or output.width != LOGO_WIDTH:
        raise RuntimeError("Original SVG viewBox/proportions changed unexpectedly")
    alpha = output.getchannel("A")
    if alpha.getextrema()[1] < 200 or alpha.getbbox() is None:
        raise RuntimeError("Original logo appears missing from renderer")
    return output
