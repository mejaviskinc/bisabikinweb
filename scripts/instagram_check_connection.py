#!/usr/bin/env python3
"""Read-only Instagram Graph API connection test; never creates or publishes media."""
import os
import re
import sys
from instagram_autopost import meta, SafeStop

def main():
    token=os.getenv("IG_ACCESS_TOKEN", "")
    user_id=os.getenv("IG_USER_ID", "")
    if not token or not re.fullmatch(r"\d{8,30}",user_id):
        print("CONNECTION_CHECK_FAILED: Add IG_ACCESS_TOKEN and numeric IG_USER_ID to GitHub Actions Secrets.",file=sys.stderr)
        return 2
    try:
        profile=meta("GET",user_id,token,{"fields":"id,username"})
        if str(profile.get("id")) != user_id or str(profile.get("username","")).lower() != "bisabikinweb.id":
            raise SafeStop("Authenticated Instagram account is not @bisabikinweb.id")
        print("CONNECTION_OK: @bisabikinweb.id profile verified. READ ONLY; publish permission not tested.")
        return 0
    except (SafeStop, KeyError, ValueError) as exc:
        print("CONNECTION_CHECK_FAILED: "+str(exc),file=sys.stderr)
        return 2

if __name__=="__main__":
    sys.exit(main())
