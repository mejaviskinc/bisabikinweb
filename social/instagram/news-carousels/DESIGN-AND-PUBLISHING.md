# BisaBikinWeb · News Carousel Visual Contract (11 November 2026)

## User-approved reference
Owner supplied `Screen Shot 2026-11-11 at 01.04.05.png`, approximately 438×544, depicting a documentary photo of server racks at the top, a left-aligned **unchanged original BisaBikinWeb logo chip** at the photo boundary, and a lower white panel with a black bold multi-line news headline.

This is the approved news carousel design. Do not use the cream quote-post design instead.

### Render geometry for each of 3–5 slides (1080×1350 JPEG)
- **Documentary photograph:** full-bleed crop to x=0–1079, y=0–945. Never fabricate an event scene or replace a real news event with unrelated images presented as documentary.
- **White lower panel:** y=946–1349, #FFFFFF, no gradient, no decorative dividers, no extra logo of publishers.
- **BisaBikinWeb official logo chip:** x approximately 20–440, y≈840–932, overlaying photo boundary; preserve official company icon, wordmark, and tagline without redrawing/altering any glyph. The GitHub-owned logo source is `public-assets/brand/bisabikinweb-logo.svg`, originally from Canva. Use source artwork, not generic typed imitation. Maintain the original chip shape/colors.
- **Title/slide body text:** black or #101010 bold sans-serif (Inter Display Bold if available), left-aligned from x≈103 and y≈1008; 2–5 natural line wraps, generous whitespace.
- Exactly **3, 4, or 5 slides per news carousel**. Cover: headline; middle slides: independently verified facts and context; final slide: what to watch/what is confirmed, no invented calls-to-action or unsupported predictions.

### Sources and captions
Only official publisher/article URL, source name, article publication date and photo credits/licensing appear in **the Instagram caption**, not on artwork. Example fields: `source_name`, `source_url`, `published_at`, `photo_credit`, `photo_license`, `license_url`.

### Hard editorial / publication gates
1. Timestamp freshness: preference within 24h WIB, upper limit 72h. Content outside is archived/rejected, not repackaged as breaking news.
2. Each news item must be fact-checked against the original article and where material a primary statement; retain evidence URLs.
3. Only a relevant documentary photograph with commercial reuse permissions verifiably available can enter publishing. Media images from Detik/Kompas/ANTARA/BBC do NOT become reusable merely because they appear in RSS. Absent license: `NEEDS_IMAGE` or `DRAFT`, never `approved`.
4. No duplicate story/events, headlines, source URL, or prior claimed/published state.
5. Publishing quota: existing 200 one-image posts per 20 minutes and 60 carousels hourly share the same Meta account and rolling quota; DO NOT add this news bank to live publishing by default.
6. News research scheduled through `.github/workflows/instagram-news-carousel-daily.yml`. Output `social/instagram/news-carousels/latest.json` contains research candidates, not ready-to-publish carousels.
7. Preserve logo proportions, background, icon and tagline; no source logos, no AI imagery framed as real documentary photos.

### Status semantics
`DRAFT_RESEARCH` = feed candidate only; `NEEDS_VERIFICATION` = source article not fully checked; `NEEDS_IMAGE` = cannot prove photo usage rights; `DESIGN_REVIEW` = 3–5 rendered images need comparison to approved reference; `READY` = factual/source/rights/designed independently cleared; `PUBLISHED` = only confirmed by Meta `media_publish` numeric ID stored in state. GitHub Action success itself is not a publish confirmation.
