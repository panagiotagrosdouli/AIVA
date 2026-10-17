"""Fixture tests for Europe job normalisation: no network requests."""
import unittest
from scripts.sync_europe_jobs import normalise

class EuropeJobTests(unittest.TestCase):
    def test_valid_record(self):
        r=normalise({"slug":"abc","title":"Mechanical Engineer","company_name":"Example","url":"https://example.org/job","location":"Berlin","remote":False,"tags":["Engineering"],"description":"<p>Build systems</p>","created_at":1760000000})
        self.assertEqual(r["source"],"Arbeitnow")
        self.assertEqual(r["location"],["Berlin"])
        self.assertFalse(r["remote"])
        self.assertEqual(r["description"],"Build systems")
    def test_drops_invalid_link(self):
        self.assertIsNone(normalise({"title":"Unknown","url":"javascript:alert(1)"}))
        self.assertIsNone(normalise({"title":"","url":"https://example.org"}))
    def test_handles_missing_fields(self):
        r=normalise({"title":"Nurse","url":"https://example.org/nurse"})
        self.assertEqual(r["tags"],[])
        self.assertEqual(r["location"],[])
if __name__=="__main__":
    unittest.main()
