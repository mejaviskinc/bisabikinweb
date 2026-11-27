# Growth autopost v1
This module runs beside the existing publishers; it never creates containers, publishes, edits or deletes posts, changes queues, or lifts design holds.

## Daily audit
GitHub Actions **Instagram Growth Audit (Read Only)** runs at about 08:17 WIB (GitHub schedules are best effort). It counts published state records from the last seven days, using actual published_at when present, otherwise claimed_at. It recommends a five-post daily target and slots 07:00, 10:00, 12:30, 16:30, 19:30 WIB. This is advisory: legacy streams remain unchanged.

## Private Meta Insights
The repository is public. No plaintext Insights are committed, uploaded, or printed. Configure a strong random secret IG_GROWTH_REPORT_KEY (at least 32 characters) in GitHub Actions secrets to opt in to encrypted reports. Existing IG_ACCESS_TOKEN and IG_USER_ID must have Insights access for @bisabikinweb.id. The daily job collects up to 20 distinct recent published media IDs, views/reach/shares/saves/likes/comments and Reels watch time where applicable. Unsupported metrics remain null. It ranks only within comparable format and age bands with at least three observations. These are lifetime media metrics, not account views for a date window. Account metrics, leads, non-follower reach and automated changes to publication cadence are not implemented yet.

Encrypted reports are stored for seven days. Download only the encrypted artifact, then decrypt locally using OpenSSL with the same secret via a private environment variable:
```sh
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in instagram-growth-report.enc -out report.json -pass env:IG_GROWTH_REPORT_KEY
```
Do not upload decrypted data to the repository. Alternatively run locally with Meta environment variables and an absolute private output path outside the repo:
```sh
python3 scripts/instagram_growth.py --live --output /tmp/bisabikinweb-private-growth.json
```
The output is created exclusively with mode 0600. Existing output is never overwritten.

Next phase: compare 7/30-day account-level data and historical snapshots in private storage, then apply a single cross-stream cap only after reviewing existing schedules and approved content.
