#!/usr/bin/env python3
"""Lightweight pre-deployment checks for the static AIVA website."""
from html.parser import HTMLParser
from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGES = ["index.html", "career.html", "account.html", "platform.html"]
class Scripts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
        self.active = False
        self.buffer = []
        self.links = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "script" and "src" not in a and a.get("type","text/javascript") in ("text/javascript","module"):
            self.active = True
            self.buffer = []
            self.kind = a.get("type","text/javascript")
        if tag == "a" and "href" in a:
            self.links.append(a["href"])
    def handle_data(self, data):
        if self.active:
            self.buffer.append(data)
    def handle_endtag(self, tag):
        if tag == "script" and self.active:
            self.scripts.append((self.kind,"".join(self.buffer)))
            self.active = False

issues = []
for name in PAGES:
    file = ROOT / name
    if not file.exists():
        issues.append(f"Missing page {name}")
        continue
    p = Scripts()
    p.feed(file.read_text(encoding="utf-8"))
    for href in p.links:
        href = href.split("#")[0].split("?")[0]
        if href and not href.startswith(("http://","https://","mailto:","tel:","#","javascript:")) and not (ROOT / href).exists():
            issues.append(f"{name}: missing local link {href}")
    for i,(kind,code) in enumerate(p.scripts):
        cmd = ["node","--check"] + (["--input-type=module"] if kind=="module" else [])
        try:
            proc = subprocess.run(cmd,input=code,text=True,capture_output=True,check=False)
        except FileNotFoundError:
            issues.append("Node.js is required for JavaScript syntax verification")
            break
        if proc.returncode:
            issues.append(f"{name}: inline script {i}: {proc.stderr.strip()}")

for name in ("data/jobs.json","data/employer_jobs.json"):
    try:
        data = json.loads((ROOT / name).read_text(encoding="utf-8"))
        assert isinstance(data.get("jobs"),list)
        assert isinstance(data.get("updated_at"),str)
        for job in data["jobs"][:100]:
            assert isinstance(job,dict)
    except (OSError,ValueError,AssertionError) as exc:
        issues.append(f"{name}: invalid feed structure ({exc})")

if issues:
    print("\n".join("FAIL: "+i for i in issues),file=sys.stderr)
    sys.exit(1)
print("OK: page links, inline JavaScript syntax and imported feed structure")
