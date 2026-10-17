"""Ingest Europe-wide on-site/hybrid/remote jobs from Arbeitnow.
Official public endpoint: https://www.arbeitnow.com/api/job-board-api
Always attribute provider, retain original URL; confirm commercial rights before monetized reuse.
Run independently from other source importers; never overwrite a good snapshot on failures.
"""
import json
import pathlib
import re
import urllib.request
from datetime import datetime, timezone
from urllib.parse import urlsplit

ENDPOINT = "https://www.arbeitnow.com/api/job-board-api"
OUTPUT = pathlib.Path("data/europe_jobs.json")
MAX_PAGES = 3

def valid_https(value):
    if not isinstance(value, str) or len(value) > 2000:
        return False
    p = urlsplit(value)
    return p.scheme == "https" and bool(p.hostname)

def get_page(page):
    request = urllib.request.Request(
        f"{ENDPOINT}?page={page}",
        headers={"Accept": "application/json", "User-Agent": "AIVA-JobDiscovery/1.0 (source-attributed)"},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)

def normalise(job):
    title = str(job.get("title") or "").strip()
    company = str(job.get("company_name") or "").strip()
    url = job.get("url")
    if not title or not valid_https(url):
        return None
    description = re.sub(r"<[^>]*>", " ", str(job.get("description") or ""))
    description = re.sub(r"\\s+", " ", description).strip()[:1000]
    location = str(job.get("location") or "").strip()
    raw_tags = job.get("tags") or []
    tags = [str(x)[:60] for x in raw_tags[:15]] if isinstance(raw_tags, list) else []
    return {
        "id": "arbeitnow:" + str(job.get("slug") or url),
        "title": title[:240], "company": company[:200], "url": url,
        "description": description, "location": [location] if location else [],
        "remote": job.get("remote") is True,
        "tags": tags,
        "published": int(job["created_at"]) * 1000 if isinstance(job.get("created_at"), (int, float)) else None,
        "expires": None,
        "source": "Arbeitnow", "source_url": "https://www.arbeitnow.com/",
    }

def main():
    jobs = {}
    successful_pages = 0
    for page in range(1, MAX_PAGES + 1):
        try:
            data = get_page(page)
            items = data.get("data")
            if not isinstance(items, list):
                raise ValueError("Unexpected API response")
            successful_pages += 1
            for raw in items:
                if not isinstance(raw, dict):
                    continue
                result = normalise(raw)
                if result:
                    jobs[result["url"]] = result
            if not items:
                break
        except Exception as exc:
            print(f"Arbeitnow page {page} failed: {exc}")
            if not successful_pages:
                raise RuntimeError("No source pages reachable; existing snapshot unchanged") from exc
            break
    if not jobs:
        raise RuntimeError("No valid source jobs; keeping previous snapshot")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({"updated_at": datetime.now(timezone.utc).isoformat(), "source": "Arbeitnow",
        "coverage": "Mostly Europe; mixed remote, hybrid and on-site", "jobs": list(jobs.values())},
        ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Arbeitnow records: {len(jobs)} from {successful_pages} pages")

if __name__ == "__main__":
    main()
