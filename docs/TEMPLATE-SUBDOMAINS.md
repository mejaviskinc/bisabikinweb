# Template1–Template60 subdomain architecture

## Goal
Serve each demo website on its own public HTTPS hostname:
`template1.bisabikinweb.site` through `template60.bisabikinweb.site`.

This is a **reverse-proxy host**, not an HTTP redirect to `/demo/slug`; the hostname remains `templateN.bisabikinweb.site` while the website works (including client-side navigation).

## What is already implemented
- Permanent number-to-slug lookup in `static-source/lib/template-subdomains.mjs`. Never reorder it casually.
- `static-source/main.tsx` selects the demo based on hostname for hydration.
- Checkout, login and consultation remain on `https://bisabikinweb.site` for secure session and DOKU payment continuity.
- Cloudflare Worker `cloudflare/template-router.mjs` serves corresponding SSR HTML from GitHub Pages, and proxies same-origin static assets. It does **not** proxy user login or payment paths through a demo host.
- `cloudflare/wrangler.json` declares **exactly 60 specific routes**. Existing `app`, `shop`, `media` and root domain traffic are not intercepted.
- `scripts/provision-template-dns.mjs` can dry-run or create precisely 60 DNS CNAME records without touching others.
- `TEMPLATE_SUBDOMAINS_READY=false` intentionally preserves existing working `/demo/.../` links **until** all 60 subdomains have working DNS, SSL, Worker routing and HTTP checks.

## Deployment dependency — NOT done from GitHub code alone
The GitHub connector manages code, not Cloudflare DNS/Workers or your domain registrar. Do not claim these subdomains are live until authenticated DNS/Workers deployment has happened and HTTPS checks passed.

1. Verify which DNS provider is authoritative for `bisabikinweb.site`. If it is not Cloudflare, move zone management only after faithfully copying and validating all existing A/AAAA/CNAME/TXT/MX/DMARC/DKIM/SPF records and DNSSEC settings. Do not change nameservers casually — it could break the website, email, existing subdomains and authentication.
2. Add the zone to Cloudflare and confirm it is active. Do not replace `bisabikinweb.site` hosting; GitHub Pages remains the origin.
3. Create a scoped Cloudflare API token with **Zone DNS Edit**, **Workers Scripts Edit**, and **Workers Routes Edit** for this zone/account. Store in GitHub Actions secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` (32 hex), and `CLOUDFLARE_ACCOUNT_ID`. **Never put secret values in source code or chat.**
4. Run dry-run: `node scripts/provision-template-dns.mjs`. Inspect 60 CNAME records.
5. Provision records (only with authorization): `node scripts/provision-template-dns.mjs --apply`. Existing conflicting records cause a hard error, never an overwrite.
6. Deploy router: `npx wrangler@4 deploy --config cloudflare/wrangler.json` from repo root, or use the manual GitHub workflow with `activate` checked. These routes match only template1..60.
7. Verify SSL and full rendered content on all 60 hostnames. Check at minimum `https://template1.bisabikinweb.site/`, `https://template9.bisabikinweb.site/`, `https://template60.bisabikinweb.site/`. Confirm no redirects to apex for demo page, correct different brands, images/CSS loaded, internal navigation works, account/checkout redirects to main site, no 404/525/certificate error.
8. **Only after confirmation**, set `TEMPLATE_SUBDOMAINS_READY=true` in the mapping module via reviewed PR, rerun all tests and site deployment, and verify catalog links on production.
9. If any new subdomain fails: keep the readiness flag false, revert Worker routes if needed, and retain original working `https://bisabikinweb.site/demo/<slug>/` addresses.

## Why exactly 60 DNS names and routes
- We do not use a wildcard catch-all route. It might intercept `app`, `shop`, or `media` unintentionally.
- We do not point wildcard CNAMEs at `github.io`: GitHub Pages only supports a specific custom hostname per configuration and warns against wildcard DNS takeover risks.
- We do not create 60 new websites or clone code; all demo content is already present in the main GitHub Pages build.
- Cloudflare Worker Free usage and limits should be reviewed for traffic volume.

## Security, SEO and operational notes
- Templates are explicitly fictional demonstrations; they do not process real payments or submit forms.
- Demo domains intentionally return `X-Robots-Tag: noindex, nofollow` to prevent 60 duplicate sites competing with the main website. The existing demo SEO noindex metadata remains intact.
- The router rejects non-GET/HEAD HTTP methods and does not forward incoming cookies to the origin.
- Use HTTPS only. If SSL certificate issuance is pending, do not publicize URLs.
- Purchase/consultation buttons must open the primary domain so buyer authentication, email OTP and DOKU payment stay in one security context.
- The mappings are pinned to the existing 60 demos in their order at implementation time; changes to identity require migration review.

## Verification
`npm test`, `npm run build`, `npm run test:output`.
`tests/template-subdomains.test.mjs` exercises 60 different names, routing, asset proxy, blocked methods, no-index, zero cookie forwarding, and purchase redirect.

## Example mapping
- template1: Teras Rona (UMKM)
- template9: Meridian Advisory (Company Profile)
- template60: Kreativa Learning (Pendidikan)

All other entries are defined in `static-source/lib/template-subdomains.mjs`.
