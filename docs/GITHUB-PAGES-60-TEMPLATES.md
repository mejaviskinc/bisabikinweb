# 60 demo websites on GitHub Pages — no Cloudflare or paid hosting

## Verified current state (10 Nov 2026)
- Hostinger nameservers: `lunar.dns-parking.com` and `solar.dns-parking.com`.
- DNS check found **60/60** `templateN.bisabikinweb.site` CNAME records pointing to `mejaviskinc.github.io`.
- Documentation IP placeholder `192.0.2.1` is gone.
- HTTPS still fails with `ERR_TLS_CERT_ALTNAME_INVALID` on template1, template9, template17, and template60, because repository-level GitHub Pages custom domains have not been configured.
- The linked GitHub account currently has **no** `bisabikinweb-template1` through `bisabikinweb-template60` repositories.
- Existing 60 demos remain online at `https://bisabikinweb.site/demo/<slug>/` as working fallbacks. The template site's first fold and React app must not be substituted with screenshots.

## Files already prepared
- `scripts/build-template-pages.mjs` creates 60 complete static sites from one source build.
- `tests/template-pages-packages.test.mjs` verifies 60 unique titles, CNAME, compiled JS/CSS, anti-duplication noindex, and the original demo URL compatibility.
- GitHub Actions **Export 60 GitHub Pages template sites** generates download-ready `template1.tar.gz` ... `template60.tar.gz` in one artifact for review or manual upload.
- `scripts/publish-template-pages.sh --check` performs a **read-only bundle preflight** without a token, then `--publish` creates/updates only the named 60 PUBLIC repos and confirms each custom Pages domain through GitHub API read-back. Publishing stops on a missing/incorrect token, private repo, wrong owner or unrecognized existing files.
- GitHub API transient errors are retried with pauses, with an eight-second delay between repos to reduce secondary rate limits; reruns resume safely without a force push. It never manages Hostinger DNS.
- GitHub Actions **Publish 60 GitHub Pages template sites (manual approval)** is manual-only, has a Boolean confirmation, never runs on push, and refuses to overwrite repositories without a matching ownership marker. It can safely resume partial publication.

## Owner action required once
1. On GitHub, create a short-lived token **under the `mejaviskinc` account** authorized to create PUBLIC repositories, push content, and edit Pages settings. GitHub REST Pages settings update requires a classic PAT with `repo` scope, or a suitable fine-grained token granted access to **all repositories (including newly created ones)** and Repository creation, Contents write, Administration write, and Pages write permissions. Prefer least privilege and a short expiration.
2. Store it in the `mejaviskinc/bisabikinweb` repository **Settings → Secrets and variables → Actions → New repository secret** as `TEMPLATE_PAGES_PAT`. Do NOT paste the token into chat, an issue, source code or PR.
3. In **Actions**, choose **Publish 60 GitHub Pages template sites (manual approval)** on the `main` branch; check the explicit `publish` box and run it. If the secret is absent, the workflow will **fail before creating a repository**, with a clear diagnostic. If the token belongs to a different GitHub account, publication will also stop. Once permitted, the workflow creates or updates `bisabikinweb-template1` through `bisabikinweb-template60`.
4. The workflow publishes each standalone `index.html`, assets, `CNAME`, `robots.txt`, `.nojekyll`, and compatibility `/demo/<slug>/`; then configures GitHub Pages custom domain to `templateN.bisabikinweb.site`.
5. Allow GitHub to provision each TLS certificate, open all 60 HTTPS URLs, and verify distinct brands and functionality. The SSL option can take time to become enabled. Never use insecure HTTP as the public demo.
6. **Only after live HTTPS verification**, change `TEMPLATE_SUBDOMAINS_READY` in `static-source/lib/template-subdomains.mjs` to `true`, build/deploy main catalog, and verify every catalog link.
7. Revoke the short-lived token after completion if no future automated update is required, or rotate/manage it securely for later updates.

## Important safeguards
- Existing DNS and mail records stay untouched. Do not point subdomains at `192.0.2.1` or enable Cloudflare routes.
- The primary `bisabikinweb.site` stays on its existing GitHub Pages repository.
- 60 distinct sites require 60 distinct Pages configurations (GitHub Pages only allows one custom CNAME per site).
- Brand sites are fictional showcases, without real account checkout or payments; CTAs route to the main domain for genuine purchases.
- The standalone demo pages use noindex to prevent competing with the original product catalog.
- The publishing script refuses to overwrite an existing public repository with an unrelated or mismatching marker. If a repo has a README created by the owner, review and clear it rather than removing safety checks.
- Build and publication logs must be inspected for any GitHub rate limiting. Reruns are idempotent and do not force-push.

## Suggested verification URLs
- `https://template1.bisabikinweb.site/` — Teras Rona, UMKM
- `https://template9.bisabikinweb.site/` — Meridian Advisory, Company Profile
- `https://template17.bisabikinweb.site/` — Kaluna Living, E-Commerce
- `https://template60.bisabikinweb.site/` — Kreativa Learning, Education

Source inventory: `docs/template-subdomain-map.csv`.

## Troubleshooting 2026-11-10 attempted activation
The previous workflow run stopped at the first permission preflight with `TEMPLATE_PAGES_PAT secret is not configured`. This is **not a failure of the 60 website bundles** and cannot be fixed by adjusting the CNAME records. The latest run should use the workflow on `main`, with the secret added as a *repository* secret (or an environment secret on `template-sites-production`). The GitHub Actions `GITHUB_TOKEN` is limited to the source repository and cannot create 60 sibling repositories automatically. Never place a personal token in the git history or the chat.
