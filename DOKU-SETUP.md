# DOKU Checkout rollout — not activated

This branch replaces checkout for new merchandise orders with DOKU Checkout (non-SNAP). Historical Midtrans records retain their original provider and reconciliation. Website-service enquiries remain on the existing consultation flow.

## Required access

**Migration blocked — source access unavailable (6 November 2026):** The live frontend uses `iyhwephcrxeqwiemhppw`, but none of the connected Supabase accounts can access it. The connected projects `kdlrobdzlxpjlkxbvzsd`, `etahuzvozoomklsqepyt`, and `nbkszvcaaitualyonkcw` each have **zero `bbweb_%` tables and zero `bbweb_%` RPCs**. The previously suggested target `kdlrobdzlxpjlkxbvzsd` is **not empty**: it contains seven GoO ninks `gn_%` tables and one Auth user. Do not treat it as an approved replacement without verifying tenancy and obtaining authorization. **Do not deploy DOKU or switch production until the original source database or a verified backup is available.**

Only after confirming the real live or migrated project, set server-only secrets in that project: `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `DOKU_ENV=sandbox` (later `production`). Keep existing Supabase and historical Midtrans secrets. Never commit credentials or place them in the frontend.

## Preflight before rollout

First obtain authorized access to the source project and migrate its existing payment schema, users, merchandise, orders, articles, files and related data to the approved destination. Validate row counts and ownership/RLS, and inspect the source and migrated `bbweb_merch_payments` definition, constraints, indexes and `bbweb_commit_merch_order` RPC. Confirm `provider='doku'` is accepted; do not relabel historical payments. Confirm commit is atomic/idempotent, supports late payment after reservation expiry without double stock deduction or double seller settlement, and does not regress processing/shipped orders on repeated notifications.

The additive patch `supabase/patches/doku_payment_runtime.sql` provides:
- `bbweb_claim_doku_payment`: locks the order before creating a payment attempt; initial checkout and buyer continuation share this claim. Existing uncertain/failed attempts remain claimed until reconciled.
- `bbweb_apply_doku_payment`: locks the order and payment and commits payment/stock/seller settlement atomically. Repeated success does not call the existing settlement RPC twice or regress a shipped order. Refunded state cannot regress.
- `bbweb_take_doku_poll_slot`: database-backed polling limit of one request per payment per 60 seconds.

These functions use SECURITY INVOKER and are executable only by service_role. The poll table enables RLS with no client grants. If released stock cannot be reacquired for a late success, settlement rolls back, DOKU receives a retryable error, and admin must reconcile the paid invoice manually. The existing reserve/commit RPC implementations still need inspection in the actual project before live activation; local tests use realistic stub implementations, not a copy of the unavailable live database.

## Backend deployment helper

Install Supabase CLI. Set `SUPABASE_ACCESS_TOKEN` securely and `SUPABASE_PROJECT_REF` explicitly to the verified project; the script has **no default target**. Then run from the repository root:

```sh
node scripts/deploy-doku.mjs
node scripts/deploy-doku.mjs --apply
```

The first command only checks project/schema compatibility and is expected to **fail** until the correct `bbweb_*` schema and RPCs have been migrated. If `gn_*` tables are detected, deployment is blocked unless shared-project tenancy has been carefully reviewed and `--allow-shared-project` was deliberately supplied. Do not use this override to bypass missing order data. The second applies the additive runtime patch and deploys only the five affected functions, preserving existing JWT settings and deploying the signed webhook without gateway JWT verification. It does not configure DOKU credentials or publish the frontend. If provider constraints do not allow DOKU, deployment stops for schema review rather than rewriting payment history.

Deploy `_shared/doku.ts` with each dependent function:
- `bbweb-doku-webhook` (`verify_jwt=false`; verifies DOKU HMAC itself)
- `bbweb-merch-checkout` (retain existing gateway authentication settings)
- `bbweb-payment-admin` (retains admin authorization)
- `bbweb-payment-status`
- `bbweb-customer-api`

After deploying the verified backend, register a notification URL in DOKU (not before):
`https://<verified-project-ref>.supabase.co/functions/v1/bbweb-doku-webhook`

Replace `<verified-project-ref>` with the confirmed `SUPABASE_PROJECT_REF`. Do not register the candidate target URL by default.

The signed Request-Target must be `/functions/v1/bbweb-doku-webhook`. The public URL is used because Supabase's internal function URL can be rewritten. DOKU retries can be delayed, so notification authentication does not impose a short timestamp window. Replay safety relies on immutable invoice+amount matching and idempotent settlement, plus guards against paid/refunded status regression.

The checkout return URL contains the order number only; the existing browser pending-order token opens tracking. Returning from DOKU never marks an order paid. Admin/buyer status checks sign GET requests, verify invoice and exact IDR amount, and preserve provider environment. Poll only after at least 60 seconds; the database slot prevents repeated requests from multiple function instances.

## Sandbox acceptance before merge

Test success, pending, expired, failed-then-success on the same invoice, duplicate and concurrent webhook delivery, amount mismatch, invalid signature, callback without a webhook, lost create response, concurrent checkout, and late payment after stock release. Confirm stock and seller ledger settle once. Check enabled channels against the merchant account. Supported UI groups are QRIS, VA, OVO/ShopeePay, cards and Alfa; availability depends on account activation.

Deploy the frontend only after the backend and database acceptance checks pass. Do not merge this branch while the backend is still Midtrans.

References:
- https://developers.doku.com/accept-payments/doku-checkout/integration-guide/backend-integration
- https://developers.doku.com/get-started-with-doku-api/signature-component/non-snap/signature-component-from-request-header
- https://developers.doku.com/get-started-with-doku-api/check-status-api/non-snap

## Langkah pemasangan API DOKU

Setelah proyek sumber dapat diakses, verifikasi proyek tujuan, pindahkan data dan skema `bbweb_*`, lalu pasang backend pada tujuan yang telah disetujui:
1. Buka Supabase → Edge Functions → Secrets.
2. Isi `DOKU_CLIENT_ID` dan `DOKU_SECRET_KEY` dari akun Sandbox DOKU.
3. Isi `DOKU_ENV` dengan `sandbox`.
4. Pada pengaturan notifikasi pembayaran DOKU, pasang URL webhook di atas.
5. Uji pembayaran sandbox; pastikan pesanan, stok dan saldo seller berubah sekali.
6. Sesudah lolos pengujian dan akun produksi aktif, ganti kedua kredensial dengan kredensial produksi dan `DOKU_ENV=production`. Rekonsiliasi transaksi sandbox sebelum berganti mode.

Jangan masukkan Secret Key ke kode frontend atau commit GitHub. Draft ini belum mengubah gateway website live.
