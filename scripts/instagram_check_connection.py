#!/usr/bin/env python3
"""Read-only Instagram Graph API connection & assigned-account discovery.

Never creates or publishes media. Never prints tokens.
"""
import os
import re
import sys
from instagram_autopost import meta, SafeStop

USERNAME = "bisabikinweb.id"
ID_PATTERN = re.compile(r"[0-9]{8,30}")

def main():
    token = os.getenv("IG_ACCESS_TOKEN", "").strip()
    supplied_id = os.getenv("IG_USER_ID", "").strip()
    if not token:
        print("CONNECTION_CHECK_FAILED: IG_ACCESS_TOKEN missing from Repository secrets.", file=sys.stderr)
        return 2
    try:
        # Unified Login system-user access tokens are expected to expose
        # Instagram accounts assigned to the business integration.
        if not ID_PATTERN.fullmatch(supplied_id):
            print("ID_FORMAT_INVALID: checking assigned Instagram accounts using your token (read-only).")
            response = meta("GET", "me/assigned_instagram_accounts", token, {"fields": "id,username"})
            accounts = response.get("data", [])
            if not isinstance(accounts, list):
                raise SafeStop("Unexpected assigned Instagram accounts response")
            matched = [a for a in accounts if isinstance(a, dict)
                       and str(a.get("username", "")).lower() == USERNAME
                       and ID_PATTERN.fullmatch(str(a.get("id", "")))]
            if len(matched) != 1:
                raise SafeStop("Account @bisabikinweb.id not assigned to this Unified Login token. Reconnect correct business portfolio and professional Instagram account.")
            supplied_id = str(matched[0]["id"])
            print("ACCOUNT_DISCOVERED: @bisabikinweb.id IG_USER_ID=" + supplied_id)
            print("ACTION_REQUIRED: Update Repository secret IG_USER_ID with this exact numeric ID, then rerun.")
            return 2

        profile = meta("GET", supplied_id, token, {"fields": "id,username"})
        if str(profile.get("id")) != supplied_id or str(profile.get("username", "")).lower() != USERNAME:
            raise SafeStop("Authenticated Instagram account is not @bisabikinweb.id")
        print("CONNECTION_OK: @bisabikinweb.id ID=" + supplied_id + " verified. READ ONLY; publish permission not tested.")
        return 0
    except (SafeStop, KeyError, TypeError, ValueError) as exc:
        print("CONNECTION_CHECK_FAILED: " + str(exc), file=sys.stderr)
        return 2

if __name__ == "__main__":
    sys.exit(main())
