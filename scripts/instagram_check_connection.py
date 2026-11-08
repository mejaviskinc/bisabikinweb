#!/usr/bin/env python3
"""Read-only diagnostics for BisaBikinWeb's Instagram publishing connection.

No publishing, no media containers, and no tokens are printed. This checks
the two official Meta login API hosts without changing the publishing host.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

USERNAME = "bisabikinweb.id"
VERSION = os.getenv("IG_GRAPH_VERSION", "v26.0")
ID_PATTERN = re.compile(r"[0-9]{8,30}")


def query(host, path, token, fields=None):
    params = urllib.parse.urlencode({"fields": fields}) if fields else ""
    url = "https://" + host + "/" + VERSION + "/" + path + (("?" + params) if params else "")
    request = urllib.request.Request(
        url, headers={"Authorization": "Bearer " + token, "Accept": "application/json"}, method="GET"
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as reply:
            result = json.load(reply)
        return result, "OK"
    except urllib.error.HTTPError as exc:
        try:
            detail = json.loads(exc.read(16000)).get("error", {})
            code = detail.get("code") if isinstance(detail.get("code"), int) else "unknown"
            subcode = detail.get("error_subcode") if isinstance(detail.get("error_subcode"), int) else "none"
        except (ValueError, TypeError, AttributeError):
            code, subcode = "unknown", "none"
        return None, "HTTP_" + str(exc.code) + "_META_" + str(code) + "_SUB_" + str(subcode)
    except (urllib.error.URLError, TimeoutError, ValueError, OSError):
        return None, "NETWORK_ERROR"


def main():
    token = os.getenv("IG_ACCESS_TOKEN", "").strip()
    user_id = os.getenv("IG_USER_ID", "").strip()
    configured = urllib.parse.urlparse(os.getenv("IG_GRAPH_BASE", "https://graph.facebook.com")).hostname
    if not token:
        print("DIAG_FAIL: IG_ACCESS_TOKEN secret is missing")
        return 2
    if not ID_PATTERN.fullmatch(user_id):
        print("DIAG_FAIL: IG_USER_ID secret missing or not a numeric professional Instagram ID")
        return 2
    if not re.fullmatch(r"v[0-9]+\.0", VERSION):
        print("DIAG_FAIL: IG_GRAPH_VERSION invalid")
        return 2
    if configured not in ("graph.facebook.com", "graph.instagram.com"):
        print("DIAG_FAIL: IG_GRAPH_BASE host unsupported")
        return 2

    print("DIAG_CONFIG: configured_host=" + configured + ", version=" + VERSION)
    matches = []
    for host in ("graph.facebook.com", "graph.instagram.com"):
        profile, status = query(host, user_id, token, "id,username")
        good = bool(profile and str(profile.get("id")) == user_id and
                    str(profile.get("username", "")).lower() == USERNAME)
        print("DIAG_PROFILE: host=" + host + ", result=" + ("ACCOUNT_MATCH" if good else status if not profile else "ACCOUNT_MISMATCH"))
        if good:
            matches.append(host)

    instagram_me, ig_status = query("graph.instagram.com", "me", token, "id,username")
    ig_match = bool(instagram_me and str(instagram_me.get("username", "")).lower() == USERNAME)
    print("DIAG_IG_LOGIN: result=" + ("ACCOUNT_MATCH" if ig_match else ig_status if not instagram_me else "OTHER_ACCOUNT"))
    if ig_match and str(instagram_me.get("id")) != user_id:
        print("DIAG_ACTION: IG_USER_ID must match the account connected by Instagram Login")

    fb_me, fb_status = query("graph.facebook.com", "me", token, "id,name")
    print("DIAG_FB_LOGIN: result=" + ("TOKEN_ACCEPTED" if fb_me else fb_status))
    if fb_me:
        grants, grant_status = query("graph.facebook.com", "me/permissions", token)
        if grants and isinstance(grants.get("data"), list):
            relevant = {r.get("permission"): r.get("status") for r in grants["data"]
                        if isinstance(r, dict) and
                        (str(r.get("permission", "")).startswith("instagram") or
                         str(r.get("permission", "")).startswith("pages_"))}
            print("DIAG_FB_SCOPES: " + json.dumps(relevant, sort_keys=True))
            if relevant.get("instagram_content_publish") != "granted":
                print("DIAG_ACTION: Facebook Login requires granted instagram_content_publish")
        else:
            print("DIAG_FB_SCOPES: " + grant_status + "; cannot confirm publish permission")

    if matches:
        print("DIAG_RESULT: MATCHED_HOST=" + matches[0])
        if configured not in matches:
            print("DIAG_ACTION: configured host may not match token login flow; do not publish until corrected")
            return 2
        print("DIAG_RESULT: profile identity OK; publish permission still needs verification")
        return 0

    print("DIAG_FAIL: neither configured Instagram user endpoint authenticates; do not publish")
    print("DIAG_ACTION: reconnect the Meta integration with account-specific publish permissions, and verify IG_USER_ID")
    return 2


if __name__ == "__main__":
    sys.exit(main())
