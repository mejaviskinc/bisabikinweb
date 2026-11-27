import datetime as dt
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
from instagram_growth import TZ, audit, rank, numeric_metric, collect

class GrowthTests(unittest.TestCase):
    def test_audit_cap_and_claims(self):
        now=dt.datetime(2026,11,27,18,tzinfo=TZ)
        entries={str(i):{"status":"published","claimed_at":"2026-11-27T02:00:00+00:00"} for i in range(6)}
        entries["pending"]={"status":"claimed","claimed_at":"2026-11-27T02:00:00+00:00"}
        entries["bad"]={"status":"published","claimed_at":"invalid"}
        result=audit(entries,now)
        self.assertEqual(result["today"],6)
        self.assertEqual(result["remaining_target"],0)
        self.assertEqual(result["unknown_timestamp"],1)
        self.assertFalse(result["enforced"])
    def test_missing_is_not_zero(self):
        self.assertIsNone(numeric_metric({"unavailable":"HTTP_400"},"views"))
        self.assertEqual(numeric_metric({"data":[{"name":"views","values":[{"value":0}]}]},"views"),0)
    def test_rank_comparable_only(self):
        rows=[{"id":str(i),"format":"news","age_hours":48,"slot_wib":"12:30","metrics":{"views":v,"reach":10,"shares":1,"saved":1}} for i,v in enumerate([10,20,40])]
        rows.append({"id":"new","format":"news","age_hours":2,"slot_wib":"12:30","metrics":{"views":1000}})
        self.assertEqual(rank(rows)[0]["id"],"2")
        self.assertEqual(rank(rows)[0]["views_vs_median"],2)
        self.assertEqual(rank(rows[:2]),[])
    def test_read_only_sample_dedup(self):
        class Fake:
            def verify(self): pass
            def get(self,path,**params):
                self_path=path
                assert self_path.endswith("/insights")
                return {"data":[{"name":params["metric"],"values":[{"value":1}]}]}
        rec={"status":"published","claimed_at":"2026-11-26T02:00:00+00:00","instagram_media_id":"1234567890"}
        result=collect({"news-one":rec,"news-two":rec},dt.datetime(2026,11,27,18,tzinfo=TZ),Fake(),20)
        self.assertEqual(result["sampled"],1)
        self.assertEqual(result["views_available"],1)
        self.assertIsNone(result["account_views"])

if __name__=="__main__": unittest.main()
