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

if __name__ == "__main__":
    unittest.main()
