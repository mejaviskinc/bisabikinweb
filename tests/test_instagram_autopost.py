import importlib.util, json, os, unittest
from pathlib import Path
from unittest.mock import patch
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("autopost", ROOT / "scripts/instagram_autopost.py")
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
sample = json.loads((ROOT / "social/instagram/examples/sample_queue.json").read_text())["items"][0]

class TestInstagramSafety(unittest.TestCase):
    def test_dry_run_without_token(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(p.main(["--dry-run", "--queue", str(ROOT / "social/instagram/examples/sample_queue.json"), "--date", "2026-11-04", "--slot", "09:00"]), 0)
    def test_sample_never_publishes(self):
        with self.assertRaises(p.SafeStop): p.eligible(sample, "2026-11-04", "09:00")
    def test_no_duplicate_slot(self):
        with self.assertRaises(p.SafeStop):
            p.find_item({"items":[sample, dict(sample, id="second-post")]}, "2026-11-04", "09:00")
    def test_empty_queue_fails_safe(self):
        with self.assertRaises(p.SafeStop):
            p.find_item({"items":[]}, "2026-11-04", "09:00")
    def test_rights_required(self):
        with self.assertRaises(p.SafeStop):
            p.eligible(dict(sample, rights_verified=False), "2026-11-04", "09:00", True)
    def test_https_required(self):
        with self.assertRaises(p.SafeStop):
            p.eligible(dict(sample, image_url="http://example.com/a.jpg"), "2026-11-04", "09:00", True)
    def test_publish_blocks_other_branches(self):
        with patch.dict(os.environ, {"IG_AUTOPUBLISH_ENABLED":"true", "GITHUB_REF":"refs/heads/feature"}, clear=True):
            with self.assertRaises(p.SafeStop): p.live_publish(sample)
    def test_publish_blocks_without_activation(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(p.SafeStop): p.live_publish(sample)

    def test_carousel_accepts_2_to_10_distinct_https_jpegs(self):
        for count in (2, 7, 10):
            item = dict(sample, simulation_only=False)
            item.pop("image_url")
            item["image_urls"] = [f"https://example.com/slide-{n}.jpg" for n in range(count)]
            self.assertEqual(len(p.media_urls(p.eligible(item, "2026-11-04", "09:00"))), count)

    def test_carousel_rejects_empty_oversized_duplicates_and_mixed_fields(self):
        base = dict(sample, simulation_only=False)
        base.pop("image_url")
        for urls in ([], ["https://example.com/a.jpg"], 
                     [f"https://example.com/{i}.jpg" for i in range(11)],
                     ["https://example.com/a.jpg"] * 2,
                     ["http://example.com/a.jpg", "https://example.com/b.jpg"],
                     ["https://example.com/a.png", "https://example.com/b.jpg"]):
            with self.subTest(urls=urls), self.assertRaises(p.SafeStop):
                p.eligible(dict(base, image_urls=urls), "2026-11-04", "09:00")
        with self.assertRaises(p.SafeStop):
            p.media_urls(dict(base, image_url="https://example.com/one.jpg",
                              image_urls=["https://example.com/two.jpg", "https://example.com/three.jpg"]))

    def test_carousel_publishes_one_parent_only(self):
        item = dict(sample, simulation_only=False)
        item.pop("image_url")
        item["image_urls"] = [f"https://example.com/slide-{i}.jpg" for i in range(7)]
        calls, children = [], []
        account_id = "123456789012"
        def fake_meta(method, path, token, params=None, stage="META_API"):
            calls.append((method, path, params, stage))
            if method == "GET" and path == account_id:
                return {"id": account_id, "username": "bisabikinweb.id"}
            if method == "GET":
                return {"status_code": "FINISHED"}
            if method == "POST" and path.endswith("/media_publish"):
                self.assertEqual(params, {"creation_id": "1999"})
                return {"id": "2999"}
            if method == "POST" and path.endswith("/media"):
                if params.get("media_type") == "CAROUSEL":
                    self.assertEqual(params["children"], ",".join(children))
                    self.assertEqual(params["caption"], item["caption"])
                    return {"id": "1999"}
                self.assertEqual(params.get("is_carousel_item"), "true")
                self.assertNotIn("caption", params)
                cid = str(1001 + len(children))
                children.append(cid)
                return {"id": cid}
            raise AssertionError("Unexpected Meta call " + repr((method, path, params)))
        env = {"IG_AUTOPUBLISH_ENABLED": "true", "GITHUB_REF": "refs/heads/main",
               "IG_ACCESS_TOKEN": "mock-token", "IG_USER_ID": account_id,
               "GITHUB_TOKEN": "mock-gh", "GITHUB_REPOSITORY": "mejaviskinc/bisabikinweb"}
        with patch.dict(os.environ, env, clear=True), \
             patch.object(p, "meta", side_effect=fake_meta), \
             patch.object(p, "github_state", return_value=({"entries": {}}, "sha0")), \
             patch.object(p, "write_state", side_effect=["sha1", "sha2"]) as write:
            p.live_publish(item)
            self.assertEqual(write.call_count, 2)
            self.assertEqual(write.call_args.args[2]["entries"][item["id"]]["status"], "published")
        self.assertEqual(len(children), 7)
        self.assertEqual(len([x for x in calls if x[1].endswith("/media_publish")]), 1)

    def test_permissions_fail_before_claiming(self):
        account_id = "123456789012"
        env = {"IG_AUTOPUBLISH_ENABLED": "true", "GITHUB_REF": "refs/heads/main",
               "IG_ACCESS_TOKEN": "mock-token", "IG_USER_ID": account_id,
               "GITHUB_TOKEN": "mock-gh", "GITHUB_REPOSITORY": "mejaviskinc/bisabikinweb"}
        with patch.dict(os.environ, env, clear=True), \
             patch.object(p, "meta", side_effect=p.SafeStop("PROFILE_ACCESS: Provider HTTP 400; code=200")), \
             patch.object(p, "github_state") as state:
            with self.assertRaisesRegex(p.SafeStop, "PROFILE_ACCESS"):
                p.live_publish(sample)
            state.assert_not_called()

if __name__ == "__main__":
    unittest.main()
