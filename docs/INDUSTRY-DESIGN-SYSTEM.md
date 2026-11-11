# BisaBikinWeb Industry-Adaptive Design System

## Implemented

This repository now contains a pure blueprint generator for 17 industries, including distinct hero archetypes, page flows, essential features, fonts, photography directions, SEO schema suggestions, fallback color palettes and safety rules. It extends the existing 8-category demo catalog without replacing payment, data, SEO or publishing systems.

Files:
- static-source/lib/industry-design-system.mjs: sector registry, matching, blueprint validation and generation.
- static-source/features/WebsiteLiveDemo.tsx: renders industry tokens, hero variation and three priority modules in the real demos.
- static-source/features/WebsiteStore.tsx: applies consistent industry tokens to catalog previews.
- static-source/features/industry-blueprint.css: responsive styles scoped to demos.
- scripts/export-industry-blueprints.mjs: CLI generator.
- tests/industry-design-system.test.mjs: 60-demo and sector tests.

## Generate a new client blueprint

~~~sh
node scripts/export-industry-blueprints.mjs --industry skincare --name "Mejavi Skin+" --slug mejavi
node scripts/export-industry-blueprints.mjs --industry travel --name "GoJogja Travel" --slug gojogja-travel
~~~

Read the JSON output before development. Its navigationFlow describes suggested page priorities; hero gives photography/layout direction; tokens supply scoped CSS variables; features are requirements, not working integrations. Production features must be checked with the client, as reflected in their requires-integration-check status.

Export blueprints for all 60 established demos:

~~~sh
node scripts/export-industry-blueprints.mjs --all > industry-blueprints.json
~~~

This is a local read-only export, not a deployment action.

## Industry differentiation

Fashion gets a campaign-led direction, collections, lookbook, size guide, and customer care. Travel prioritizes destinations, itineraries, facilities and booking inquiries. Export prioritizes supplier capabilities, specifications, quality evidence, international trade process and RFQ. Healthcare requires real practitioner credentials, medical service information and safe appointment requests.

A broad catalog category may be narrowed by an explicit industry value in the business record. Certain existing demo slugs also map to precise verticals, such as botanika-care (skincare), karsa-architecture (construction), and aksa-logistics (logistics). Their existing categories and working URLs remain unchanged.

## Production and safety

This phase adds a coherent industry styling system and sector-specific priority cards to current demos, but does not claim to transform the 60 demos into 60 completely independent codebases. Existing core pages and demo interactions are preserved. This phased approach avoids breaking checkout, historical designs or backend services.

- Never fake reviews, inventory, verified certifications, practitioner qualifications, booked reservations or paid orders.
- Use the client's real brand assets and licensed imagery, not generated documentation presented as real.
- Keep fictional public demo sites noindex and clearly label all transaction simulation.
- No change to CNAME, Hostinger DNS, production checkout, Supabase secrets or publishing workflows.
- Review responsive layouts, checkout, browser behavior and test results before merging.

## Test commands

~~~sh
node --test tests/industry-design-system.test.mjs tests/website-industry-differentiation.test.mjs tests/website-demos-60.test.mjs
npm test
npm run build
~~~

Use the existing Playwright preview QA when the browser testing environment is available.
