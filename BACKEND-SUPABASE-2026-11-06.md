# BisaBikinWeb — New Supabase backend (6 November 2026)

## Verified environment
- **Supabase project ref:** `kdlrobdzlxpjlkxbvzsd`
- Browser clients point at `https://kdlrobdzlxpjlkxbvzsd.supabase.co` using its **publishable API key only**.
- The old `iyhwephcrxeqwiemhppw` project was NOT accessible, NOT deleted, and **no historical data was imported**.
- The new project also contains GoO ninks `gn_*` tables. These must never be dropped, overwritten, or renamed by BisaBikinWeb migrations.
- 22 public `bbweb_*` tables, 11 public `bbweb_*` RPCs, 3 image buckets. Every `bbweb_*` table has RLS enabled.
- Six active Edge Functions:
  - `bbweb-seller-api`
  - `bbweb-customer-api`
  - `bbweb-payment-admin`
  - `bbweb-payment-status`
  - `bbweb-merch-checkout`
  - `bbweb-doku-webhook`
- Note: the installed checkout and DOKU-related functions were compiled from draft PR #21, with a guard that refuses checkout **before** storing an order when DOKU credentials are absent. Do not overwrite these with the Midtrans function code on `main`; reconcile PR #21 before future backend deployment.
- Frontend library source files under `static-source/lib/` now use the new project. Client-side session keys were changed for admin, customer and seller to invalidate the old Supabase sessions.

## Database history
Supabase's migration history records the following applied 2026-11-06 migrations:
1. `bbweb_core_backend_initial`
2. `bbweb_commerce_orders_finance`
3. `bbweb_storage_verified_admin_payment_fields`
4. `bbweb_atomic_inventory_checkout_primitives`
5. `bbweb_create_merch_order_atomic`
6. `bbweb_storage_seller_rls_permissions_hardening`
7. `bbweb_doku_safe_runtime_rpcs`
8. `bbweb_payment_audit_fields_indexes`
9. `bbweb_seller_refund_and_ledger_release_triggers`
10. `bbweb_withdrawal_rpc_response_compatibility`

These migrations have **already been applied directly to the connected database** via the Supabase connector; do not blindly reapply the older partial SQL migration files present in the GitHub repo. Any new environment should first obtain a reviewed source-of-truth schema export or database migration snapshot.

## Security and access
- Public read: active services, portfolio, pricing, published articles, active merchandise, testimonials, site settings.
- Public lead form: insert only for valid new website leads.
- Admin: a confirmed Supabase Auth user with an explicitly allowlisted email. The currently allowlisted address is `bisabikinw3b@gmail.com`; it did not yet have a corresponding account in this new project's Auth at the time of the review. Create and verify it through the existing Admin registration UI, then log in with the **new** account, not the old project's credentials.
- Seller/customer sensitive records and financial tables: service-role server-only. Do not expose service-role or `sb_secret_` keys to browsers or GitHub.
- Three storage buckets: `bbweb-article-images`, `bbweb-seller-articles`, `bbweb-seller-products`. Uploads are constrained by RLS, folder ownership, type and size.
- Edge Functions with public request entry points perform their own origin validation and/or bearer-session checks, random order-token checks, and webhook signature verification as appropriate; gateway JWT verification is intentionally off.
- The shared Supabase project also has advisory warnings for unrelated legacy objects (including `public.rls_auto_enable` being executable by unauthenticated roles). Review those separately before exposing new legacy features; this migration did not change them.

## Validation completed
A rollback-only transactional database smoke test passed all of: order creation; duplicate checkout idempotency; reserve stock; release/restock; re-reservation; repeat settlement without double-counting. All smoke-test writes were rolled back, and current `bbweb_orders`, `bbweb_merchandise`, and `bbweb_merch_payments` remain empty.
No real DOKU payment or full customer login / seller signup test has passed yet.

## Steps required before accepting real payments
1. In the NEW Supabase project, set Edge Function secrets `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, and `DOKU_ENV=sandbox`. Do not send secrets over chat or commit to GitHub.
2. Verify DOKU sandbox checkout, invoice/amount validation, signed notification, expiry, and stock settlement on the new system.
3. Configure DOKU notification URL `https://kdlrobdzlxpjlkxbvzsd.supabase.co/functions/v1/bbweb-doku-webhook` after verifying that the merchant DOKU account is configured to use this endpoint.
4. Only after approval and sandbox verification switch `DOKU_ENV=production` and use the production merchant credentials.
5. Reconcile draft PR #21 with the current `main` branch before merging; main still contains older Midtrans Edge Function source files, even though the deployed backend is using the DOKU draft versions.

Website live deployment and DOKU production payment success have **not** been independently confirmed.
