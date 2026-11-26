#!/usr/bin/env python3
"""Offline validation of each new carousel slide; does not publish."""
from pathlib import Path
import json
import io
from PIL import Image
from instagram_carousel60_publish_one import get_master, image_jpeg
def main():
    root=Path("social/instagram/carousels")
    items=json.loads((root/"2026-11-25-hundred.json").read_text(encoding="utf-8"))["items"]
    old=json.loads((root/"2026-11-10-sixty.json").read_text(encoding="utf-8"))["items"]
    assert len(items)==100
    assert len({x["id"] for x in items})==100
    texts=[s.strip().casefold() for x in items for s in x["slides"]]
    assert len(texts)==len(set(texts))==364
    assert not set(texts).intersection(s.strip().casefold() for x in old for s in x["slides"])
    base=get_master()
    for i,x in enumerate(items,1):
        assert x["id"]==f"bbweb-carousel100-20261125-{i:03d}" and x["number"]==i
        assert x["slide_count"]==len(x["slides"]) and 3<=len(x["slides"])<=5
        assert 10<=len(x["caption"])<=2200
        for s in x["slides"]:
            assert 18<=len(s.strip())<=260
            with Image.open(io.BytesIO(image_jpeg(base,s))) as im:
                assert im.size==(1080,1350) and im.format=="JPEG"
                im.verify()
        if i%10==0: print(f"VALIDATED_CAROUSEL {i}/100",flush=True)
    print("VALIDATED_100_CAROUSELS_364_SLIDES_NO_PUBLICATION",flush=True)
if __name__=="__main__": main()
