"""Import publicly listed employer vacancies, never inferred or fabricated.
Boards are opt-in via verified board identifiers in data/employer_boards.json.
Failed sources are logged; only published, linkable vacancies are kept.
"""
import json, pathlib, urllib.request, urllib.parse, datetime, re
CONFIG=pathlib.Path("data/employer_boards.json")
OUT=pathlib.Path("data/employer_jobs.json")
def retrieve(url):
    request=urllib.request.Request(url,headers={"User-Agent":"AIVA-Careers/1.0","Accept":"application/json"})
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.load(response)
def normalise(entry, provider, company):
    title=str(entry.get("title") or entry.get("text") or "").strip()
    link=entry.get("absolute_url") or entry.get("applyUrl") or entry.get("hostedUrl") or entry.get("jobUrl") or entry.get("applyUrl")
    if provider=="ashby": link=entry.get("applyUrl") or entry.get("jobUrl")
    if not isinstance(link,str) or not link.startswith("https://") or not title: return None
    location=entry.get("location")
    if isinstance(location,dict):location=location.get("name","")
    if not location: location=entry.get("categories",{}).get("location","") if isinstance(entry.get("categories"),dict) else ""
    description=entry.get("descriptionPlain") or entry.get("description") or entry.get("content") or ""
    if isinstance(description,str): description=re.sub("<[^>]+>"," ",description)
    return {"id":provider+":"+str(entry.get("id") or link),"title":title,"company":company,
            "url":link,"description":str(description)[:1100],"location":[str(location)] if location else [],
            "published":None,"expires":None,"source":provider.title()+" employer board",
            "employer_verified_source":True}
def fetch_board(board):
    provider=board["provider"];slug=urllib.parse.quote(board["slug"],safe="")
    if provider=="greenhouse":
        data=retrieve("https://boards-api.greenhouse.io/v1/boards/"+slug+"/jobs?content=true")
        return data.get("jobs",[])
    if provider=="lever":
        return retrieve("https://api.lever.co/v0/postings/"+slug+"?mode=json")
    if provider=="ashby":
        data=retrieve("https://api.ashbyhq.com/posting-api/job-board/"+slug)
        return [j for j in data.get("jobs",[]) if j.get("isListed",True)]
    raise ValueError("Unsupported provider")
def main():
    boards=json.loads(CONFIG.read_text(encoding="utf8"))["boards"]
    found={};success=[];fail=[]
    for board in boards:
        try:
            jobs=fetch_board(board)
            if not isinstance(jobs,list):raise ValueError("Unexpected API format")
            count=0
            for item in jobs:
                j=normalise(item,board["provider"],board["company"])
                if j and j["url"] not in found:found[j["url"]]=j;count+=1
            success.append({"company":board["company"],"provider":board["provider"],"roles":count})
        except Exception as exc: fail.append({"company":board["company"],"error":str(exc)[:160]})
    if not success: raise RuntimeError("No employer board reachable; preserving previous snapshot: "+str(fail))
    OUT.parent.mkdir(exist_ok=True,parents=True)
    OUT.write_text(json.dumps({"updated_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),
      "jobs":list(found.values()),"sources":success,"errors":fail},ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("Published employer jobs:",len(found),"Working boards:",len(success),"Errors:",fail)
if __name__=="__main__":main()
