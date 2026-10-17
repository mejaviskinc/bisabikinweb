# Security

Report suspected vulnerabilities privately to bisabikinw3b@gmail.com. Do not include customer records, passwords or API keys in public issues.

The public website is static. Consultation opens an encoded WhatsApp draft; it does not save customer data to GitHub. Admin and order data remain in a separate authenticated backend. Never place secrets in static-source, public-assets, localStorage or GitHub Pages output.

The build adds CSP via HTML meta, hashes required inline structured-data blocks, restricts embedded frames to Mejavi, disables object content, and sets no-referrer. Inline styles remain allowed for React layout. GitHub Pages meta policies cannot provide frame-ancestors, HSTS, or other response-header-only controls; those require a configurable hosting or edge layer. HTTPS is served by GitHub Pages.

Stored cart data is reconstructed from known product variants, and stored wishlist IDs are checked against the catalog. Browser storage is never an authority for payments or admin access.

Deployment uses a lockfile, npm ci without install scripts, immutable action SHAs, isolated build/deploy permissions, security regression checks and weekly Dependabot updates.
