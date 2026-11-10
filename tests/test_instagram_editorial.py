"""Safety checks for the new editorial queue; no Meta credentials or publication."""
import copy
import datetime as dt
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import instagram_editorial as e


class EditorialSafetyTests(unittest.TestCase):
    def setUp(self):
        # Synthetic fixtures only; removed editorial drafts must not be retained.
        self.items = []
        rows = [
            ("10:20", "pemerintah", "analysis", "PEMERINTAH"),
            ("12:30", "teknologi", "news", "TEKNOLOGI"),
            ("18:30", "edukasi", "education", "EDUKASI WEB"),
        ]
        for slot, slug, kind, category in rows:
            self.items.append({
                "id": "test-editorial-20261111-" + slug,
                "date": "2026-11-11",
                "slot": slot,
                "category": category,
                "type": kind,
                "headline": "Judul pengujian konten " + slug,
                "summary": "Ringkasan sintetis untuk menguji kelayakan konten editorial.",
                "caption": "Caption pengujian orisinal untuk kategori " + slug + ".",
                "source_url": "https://example.org/testing/" + slug,
                "source_published": "2026-11-10",
                "expires_on": "2026-11-12",
                "status": "approved",
                "fact_checked": True,
                "rights_verified": True,
                "rights_note": "Simulasi tes; tidak dipublikasikan.",
                "reviewed_on": "2026-11-10"
            })

    def test_deleted_editorial_bank_is_empty_and_safe(self):
        bank = json.loads((ROOT / "social/instagram/editorial/content.json").read_text(encoding="utf-8"))
        self.assertEqual(bank["items"], [])
        e.validate(bank["items"])
        self.assertIsNone(e.select(bank["items"], {}, dt.datetime(2026, 11, 11, 10, 37, tzinfo=e.TZ)))

    def test_reviewed_queue_validates(self):
        e.validate(self.items)
        self.assertEqual(len(self.items), 3)

    def test_no_duplicate_id(self):
        data = self.items + [copy.deepcopy(self.items[0])]
        with self.assertRaisesRegex(e.SafeStop, "Duplicate"):
            e.validate(data)

    def test_no_duplicate_slot_even_with_distinct_id(self):
        row = copy.deepcopy(self.items[0])
        row["id"] = "bbweb-editorial-different"
        row["headline"] = "Judul berbeda untuk jadwal sama"
        row["caption"] = row["caption"] + " tambahan"
        with self.assertRaisesRegex(e.SafeStop, "Duplicate"):
            e.validate(self.items + [row])

    def test_unapproved_cannot_publish(self):
        self.items[0]["status"] = "draft"
        with self.assertRaisesRegex(e.SafeStop, "Unreviewed"):
            e.validate(self.items)

    def test_unsupported_rights_cannot_publish(self):
        self.items[0]["rights_verified"] = False
        with self.assertRaisesRegex(e.SafeStop, "Unreviewed"):
            e.validate(self.items)

    def test_no_more_than_three_daily(self):
        extra = copy.deepcopy(self.items[0])
        extra.update({
            "id": "bbweb-editorial-fourth-test",
            "slot": "15:00",
            "headline": "Ini contoh judul pengujian posting tambahan",
            "caption": "Ini contoh caption pengujian yang berbeda dari seluruh data lama."
        })
        with self.assertRaisesRegex(e.SafeStop, "More than 3"):
            e.validate(self.items + [extra])

    def test_expired_news_rejected(self):
        self.items[1]["source_published"] = "2026-11-01"
        with self.assertRaisesRegex(e.SafeStop, "older than 72h"):
            e.validate(self.items)

    def test_first_due_and_claimed_skipped(self):
        now = dt.datetime(2026, 11, 11, 10, 37, tzinfo=e.TZ)
        first = e.select(self.items, {}, now)
        self.assertEqual(first["id"], "test-editorial-20261111-pemerintah")
        claimed = {first["id"]: {"status": "claimed"}}
        self.assertIsNone(e.select(self.items, claimed, now))
        noon = dt.datetime(2026, 11, 11, 12, 37, tzinfo=e.TZ)
        self.assertEqual(e.select(self.items, claimed, noon)["category"], "TEKNOLOGI")

    def test_no_future_or_stale_catchup(self):
        self.assertIsNone(e.select(self.items, {}, dt.datetime(2026, 11, 11, 9, 37, tzinfo=e.TZ)))
        self.assertIsNone(e.select(self.items, {}, dt.datetime(2026, 11, 11, 23, 0, tzinfo=e.TZ)))

    def test_validation_never_attempts_upload(self):
        with patch.object(e, "render_editorial_image") as render, patch.object(e, "upload_original_image") as upload:
            e.validate(self.items)
            render.assert_not_called()
            upload.assert_not_called()


if __name__ == "__main__":
    unittest.main()
