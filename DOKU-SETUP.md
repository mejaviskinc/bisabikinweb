# DOKU Checkout rollout — not activated

This branch replaces checkout for new merchandise orders with DOKU Checkout (non-SNAP). Historical Midtrans records retain their original provider and reconciliation. Website-service enquiries remain on the existing consultation flow.

## Required access

The live frontend uses Supabase project `iyhwephcrxeqwiemhppw`. None of the currently connected Supabase accounts expose that project. Do not deploy to another project with a similar name.

Set server-only secrets in that project: `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `DOKU_ENV=sandbox` (later `production`). Keep existing Supabase and historical Midtrans secrets. Never commit credentials or place them in the frontend.

## Preflight before rollout

Inspect the live `bbweb_merch_payments` definition, constraints, indexes and `bbweb_commit_merch_order` RPC. Confirm `provider='doku'` is accepted; do not relabel historical payments. Confirm commit is atomic/idempotent, supports late payment after reservation expiry without double stock deduction or double seller settlement, and does not regress processing/shipped orders on repeated notifications.

Checkout creation must have a database-enforced unique active attempt per order before activation. The current read-before-insert guard alone cannot serialize concurrent requests. Add an atomic claim RPC or a unique partial index after inspecting existing records and recovering any duplicate active attempts. Failed DOKU attempts may still settle on the same hosted page and must remain claimed. Reconcile unknown attempts before allowing a fresh invoice. This database work is blocked on access to the actual project and is a release blocker.

Deploy `_shared/doku.ts` with each dependent function:
- `bbweb-doku-webhook` (`verify_jwt=false`; verifies DOKU HMAC itself)
- `bbweb-merch-checkout` (retain existing gateway authentication settings)
- `bbweb-payment-admin` (retains admin authorization)
- `bbweb-payment-status`
- `bbweb-customer-api`

Register this exact notification URL in DOKU:
`https://iyhwephcrxeqwiemhppw.supabase.co/functions/v1/bbweb-doku-webhook`

The signed Request-Target must be `/functions/v1/bbweb-doku-webhook`. The public URL is used because Supabase's internal function URL can be rewritten. DOKU retries can be delayed, so notification authentication does not impose a short timestamp window. Replay safety relies on immutable invoice+amount matching and idempotent settlement, plus guards against paid/refunded status regression.

The checkout return URL contains the order number only; the existing browser pending-order token opens tracking. Returning from DOKU never marks an order paid. Admin/buyer status checks sign GET requests, verify invoice and exact IDR amount, and preserve provider environment. Poll only after at least 60 seconds; apply additional server-side throttling before rollout.

## Sandbox acceptance before merge

Test success, pending, expired, failed-then-success on the same invoice, duplicate and concurrent webhook delivery, amount mismatch, invalid signature, callback without a webhook, lost create response, concurrent checkout, and late payment after stock release. Confirm stock and seller ledger settle once. Check enabled channels against the merchant account. Supported UI groups are QRIS, VA, OVO/ShopeePay, cards and Alfa; availability depends on account activation.

Deploy the frontend only after the backend and database acceptance checks pass. Do not merge this branch while the backend is still Midtrans.

References:
- https://developers.doku.com/accept-payments/doku-checkout/integration-guide/backend-integration
- https://developers.doku.com/get-started-with-doku-api/signature-component/non-snap/signature-component-from-request-header
- https://developers.doku.com/get-started-with-doku-api/check-status-api/non-snap
