"""Check curated direct-employer vacancies and drop closed / unverifiable entries.

HTTP 404/410 -> immediately remove; valid 200 -> refresh verified_on.
Transient 403/429/5xx/network problems -> retain at most seven days since last verification.
Fail closed for fresh public listings, with no made-up confirmation of availability.
"""
import json
import pathlib
import urllib.error
import urllib.request
from datetime import date, datetime, timezone

PATH = pathlib.Path("data/curated_jobs.json")
MAX_UNVERIFIED_DAYS = 7
USER_AGENT = "AIVA-DirectEmployerJobs/1.0"

def check(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"}, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            # 2xx alone cannot prove the posting accepts applications, but checks source reachability.
            return "reachable" if 200 <= response.status < 300 else "uncertain"
    except urllib.error.HTTPError as exc:
        return "gone" if exc.code in (404, 410) else "uncertain"
    except (OSError, TimeoutError):
        return "uncertain"

def filter_records(payload, today=None, checker=check):
    today = today or date.today()
    kept = []
    results = {"reachable": 0, "gone": 0, "uncertain": 0, "stale": 0}
    for job in payload.get("jobs", []):
        if not isinstance(job, dict):
            continue
        expiry = job.get("expires")
        if expiry:
            try:
                exp = datetime.fromisoformat(str(expiry).replace("Z", "+00:00"))
                if exp.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
                    results["gone"] += 1
                    continue
            except (ValueError, TypeError):
                pass
        verified = job.get("verified_on", "")
        try:
            age = (today - date.fromisoformat(verified)).days
        except (ValueError, TypeError):
            age = MAX_UNVERIFIED_DAYS + 1
        status = checker(job["url"])
        results[status] += 1
        if status == "gone":
            continue
        if status == "reachable":
            job["verified_on"] = today.isoformat()
            kept.append(job)
        elif age <= MAX_UNVERIFIED_DAYS:
            kept.append(job)
        else:
            results["stale"] += 1
    return kept, results

def main():
    payload = json.loads(PATH.read_text(encoding="utf-8"))
    original = payload.get("jobs", [])
    if not isinstance(original, list):
        raise ValueError("Invalid curated feed")
    jobs, results = filter_records(payload)
    if jobs != original:
        payload["jobs"] = jobs
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Curated jobs: {len(jobs)} retained; lifecycle results: {results}")

if __name__ == "__main__":
    main()
