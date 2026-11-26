#!/usr/bin/env python3
"""Apply explicitly owner-uploaded studio revisions; no Meta calls or publication."""
import base64
import hashlib
import io
import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path("social/instagram")
INBOX = ROOT / "studio-inbox"
QUEUES = ("quotes_200_queue.json", "quotes_300_queue.json", "queue.json")
PREFIX = "https://raw.githubusercontent.com/mejaviskinc/bisabikinweb/main/"
MAX_BYTES = 20_000_000

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def prepare(data, queues, entries):
    if not isinstance(data, dict) or data.get("schema") != 1 or data.get("approved") is not True or data.get("rights_confirmed") is not True:
        raise ValueError("Explicit owner approval and image rights required")
    ident, caption = data.get("id"), data.get("caption")
    if not isinstance(ident, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{3,75}", ident):
        raise ValueError("Invalid queue ID")
    if ident in entries:
        raise ValueError("Already claimed or published; revision refused")
    if not isinstance(caption, str) or not 10 <= len(caption) <= 2200:
        raise ValueError("Caption length must be 10–2200")
    matches = [(name, row) for name, q in queues.items() for row in q["items"] if row.get("id") == ident]
    if len(matches) != 1:
        raise ValueError("Queue ID must occur exactly once")
    name, row = matches[0]
    if row.get("status") != "approved" or row.get("fact_checked") is not True or row.get("rights_verified") is not True:
        raise ValueError("Original item is not eligible")
    # Preserve source, caption and all editorial metadata for news unless the
    # owner explicitly verifies changed content. Never invent verification.
    if caption != row["caption"] and data.get("caption_verified") is not True:
        raise ValueError("Changed caption requires explicit fact confirmation")
    pages = data.get("jpeg_pages")
    if not isinstance(pages, list) or not 1 <= len(pages) <= 10:
        raise ValueError("One image or 2–10 carousel images required")
    images = []
    for encoded in pages:
        if not isinstance(encoded, str) or len(encoded) > 11_000_000:
            raise ValueError("Image exceeds limit")
        raw = base64.b64decode(encoded, validate=True)
        if not raw or len(raw) > 8_000_000:
            raise ValueError("JPEG exceeds 8 MB")
        with Image.open(io.BytesIO(raw)) as im:
            if im.format != "JPEG" or im.mode != "RGB" or not 320 <= im.width <= 1440 or not 4/5 <= im.width / im.height <= 1.91:
                raise ValueError("Unsupported JPEG size, mode or feed ratio")
            im.verify()
        images.append(raw)
    if len({hashlib.sha256(x).digest() for x in images}) != len(images):
        raise ValueError("Duplicate carousel slides")
    with Image.open(io.BytesIO(images[0])) as im:
        size = im.size
    for raw in images[1:]:
        with Image.open(io.BytesIO(raw)) as im:
            if im.size != size:
                raise ValueError("Carousel slides must share dimensions")
    version = hashlib.sha256(b"".join(hashlib.sha256(x).digest() for x in images) + caption.encode()).hexdigest()[:24]
    paths = [ROOT / "rendered" / "studio" / ident / version / f"{i:02d}.jpg" for i in range(1, len(images)+1)]
    new = dict(row)
    new.pop("image_url", None)
    new.pop("image_urls", None)
    urls = [PREFIX + str(p) for p in paths]
    if len(urls) == 1:
        new["image_url"] = urls[0]
    else:
        new["image_urls"] = urls
    new["caption"] = caption
    new["studio_revision"] = version
    return name, row, new, list(zip(paths, images))

def main():
    if not INBOX.exists():
        return
    for package in sorted(INBOX.glob("*.json")):
        try:
            if package.stat().st_size > MAX_BYTES:
                raise ValueError("Package exceeds 20 MB")
            queues = {n: load(ROOT/n) for n in QUEUES if (ROOT/n).is_file()}
            entries = load(ROOT/"state.json")["entries"]
            name, old, new, files = prepare(load(package), queues, entries)
            for path, raw in files:
                if path.exists() and path.read_bytes() != raw:
                    raise ValueError("Existing asset differs; cannot overwrite")
            for path, raw in files:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(raw)
            queue = queues[name]
            queue["items"] = [new if r["id"] == old["id"] else r for r in queue["items"]]
            (ROOT/name).write_text(json.dumps(queue, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
            package.unlink()
            print("REVISION_APPLIED", new["id"], new["studio_revision"])
        except (ValueError, OSError, KeyError, TypeError) as exc:
            # Rejected files stay in inbox for manual inspection. No queue change.
            print("REVISION_REJECTED", package.name, str(exc))
            raise SystemExit(1)

if __name__ == "__main__":
    main()
