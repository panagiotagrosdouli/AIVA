"""Daily sync of currently published international remote jobs from Himalayas.
The API is paginated; use its documented cursor, check expiry and preserve the old
snapshot if the remote endpoint is unavailable. Attribution and source links retained.
"""
import json
import pathlib
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

OUT = pathlib.Path("data/jobs.json")
ENDPOINT = "https://himalayas.app/jobs/api"
MAX_PAGES = 15  # max 300 recent jobs, within free public API limits

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent":"AIVA-Opportunity-Discovery/1.0", "Accept":"application/json"})
    with urllib.request.urlopen(req, timeout=35) as response:
        return json.load(response)

def timestamp_ms(value):
    try:
        number = float(value)
        return int(number * (1000 if number < 10000000000 else 1))
    except (ValueError, TypeError):
        return None

seen, records, cursor = set(), [], None
now_ms = int(time.time() * 1000)
for page in range(MAX_PAGES):
    params = {"limit": 20}
    if cursor: params["cursor"] = cursor
    payload = fetch(ENDPOINT + "?" + urllib.parse.urlencode(params))
    jobs = payload.get("jobs")
    if not isinstance(jobs, list):
        raise RuntimeError("Invalid remote API response: keeping prior snapshot")
    for job in jobs:
        url = job.get("applicationLink")
        guid = str(job.get("guid") or "")
        title = str(job.get("title") or "").strip()
        expiry = timestamp_ms(job.get("expiryDate"))
        if not (url and url.startswith("https://") and title and guid) or guid in seen:
            continue
        if expiry and expiry <= now_ms:
            continue
        seen.add(guid)
        locations = job.get("locationRestrictions") or []
        names = [x.get("name", x.get("alpha2","")) if isinstance(x, dict) else str(x) for x in locations]
        records.append({
            "id": guid,
            "title": title,
            "company": job.get("companyName") or "",
            "url": url,
            "description": job.get("excerpt") or "",
            "location": names,
            "published": timestamp_ms(job.get("pubDate")),
            "expires": expiry,
            "source": "Himalayas",
        })
    cursor = payload.get("nextCursor")
    if not cursor or not jobs:
        break
    time.sleep(0.5)
if not records:
    raise RuntimeError("No valid job listings: previous snapshot preserved")
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps({"updated_at":datetime.now(timezone.utc).isoformat(),"source":"Himalayas","jobs":records},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Updated", len(records), "verified-source job records")
