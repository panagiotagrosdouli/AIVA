"""Sync real remote job listings from Himalayas into the static AIVA site.
No generated/demo listings. Empty or failed requests preserve last successful data.
Source: https://himalayas.app/docs/remote-jobs-api
"""
import json
import pathlib
import urllib.request
from datetime import datetime, timezone

OUT = pathlib.Path("data/jobs.json")
API = "https://himalayas.app/jobs/api?limit=20"
request = urllib.request.Request(API, headers={"User-Agent": "AIVA-Opportunity-Directory/1.0", "Accept": "application/json"})
with urllib.request.urlopen(request, timeout=35) as response:
    payload = json.load(response)
jobs = payload.get("jobs")
if not isinstance(jobs, list) or not jobs:
    raise RuntimeError("Feed empty or invalid; preserving previous data")
records = []
for job in jobs:
    url = job.get("applicationLink") or job.get("url") or ""
    title = job.get("title", "")
    if not (isinstance(url, str) and url.startswith("https://") and title):
        continue
    records.append({
        "id": str(job.get("guid") or job.get("id") or url),
        "title": title,
        "company": job.get("companyName", ""),
        "url": url,
        "description": job.get("excerpt", "") or "",
        "location": job.get("locationRestrictions") or [],
        "published": job.get("pubDate") or "",
        "source": "Himalayas",
    })
if not records:
    raise RuntimeError("No valid jobs found; preserving last successful data")
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps({"updated_at": datetime.now(timezone.utc).isoformat(), "jobs": records}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Saved {len(records)} live-sourced job links to {OUT}")
