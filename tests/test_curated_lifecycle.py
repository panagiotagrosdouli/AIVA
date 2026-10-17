import unittest
from datetime import date, timedelta
from scripts.verify_curated_jobs import filter_records

class CuratedLifecycleTests(unittest.TestCase):
    def job(self, days_old=0):
        return {"url":"https://example.com/job","verified_on":(date(2026,10,17)-timedelta(days=days_old)).isoformat()}
    def test_remove_gone(self):
        rows,_=filter_records({"jobs":[self.job()]},date(2026,10,17),lambda url:"gone")
        self.assertEqual(rows,[])
    def test_refresh_reachable(self):
        rows,_=filter_records({"jobs":[self.job(9)]},date(2026,10,17),lambda url:"reachable")
        self.assertEqual(rows[0]["verified_on"],"2026-10-17")
    def test_transient_failure_grace(self):
        rows,_=filter_records({"jobs":[self.job(6)]},date(2026,10,17),lambda url:"uncertain")
        self.assertEqual(len(rows),1)
    def test_drop_unverified_stale(self):
        rows,_=filter_records({"jobs":[self.job(8)]},date(2026,10,17),lambda url:"uncertain")
        self.assertEqual(rows,[])
if __name__=="__main__": unittest.main()
