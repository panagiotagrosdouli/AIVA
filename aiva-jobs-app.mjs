import {
 FEEDS,PER_PAGE,normalizeFeed,dedupeJobs,loadBookmarks,toggleBookmark,filterJobs,
 paginate,csvForJobs,safeHttps
} from "./aiva-jobs-core.mjs";

const $=id=>document.getElementById(id);
const state={jobs:[],matches:[],page:1,feedResults:[],ready:false,saved:[],storageAvailable:true};
$("year").textContent=String(new Date().getFullYear());
const q=new URLSearchParams(location.search);
const allowedSources=new Set(["all",...FEEDS.map(f=>f.id)]);
const allowedSort=new Set(["recent","title","company"]);
$("query").value=(q.get("q")||"").slice(0,180);
$("where").value=(q.get("where")||"").slice(0,150);
$("source").value=allowedSources.has(q.get("source"))?q.get("source"):"all";
$("sort").value=allowedSort.has(q.get("sort"))?q.get("sort"):"recent";
$("remoteOnly").checked=q.get("remote")==="1";
$("savedOnly").checked=q.get("saved")==="1";

function message(text){$("message").textContent=text}
function element(tag,cls,content){
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(content!==undefined)n.textContent=String(content);
 return n;
}
function bookmarkRefresh(){
 state.saved=loadBookmarks(localStorage);
 $("savedCount").textContent="("+state.saved.length+")";
}
function currentFilters(){
 return {
  q:$("query").value.trim(),where:$("where").value.trim(),
  source:$("source").value,sort:$("sort").value,
  remoteOnly:$("remoteOnly").checked,savedOnly:$("savedOnly").checked
 };
}
function updateAddress(filters){
 const params=new URLSearchParams();
 if(filters.q)params.set("q",filters.q);
 if(filters.where)params.set("where",filters.where);
 if(filters.source!=="all")params.set("source",filters.source);
 if(filters.sort!=="recent")params.set("sort",filters.sort);
 if(filters.remoteOnly)params.set("remote","1");
 if(filters.savedOnly)params.set("saved","1");
 const query=params.toString();
 history.replaceState(null,"",location.pathname+(query?"?"+query:"")+location.hash);
}
function formatDate(value){
 if(!value)return "";
 try{return new Date(value).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"})}catch{return ""}
}
function feedStatuses(){
 const root=$("feedStatus");root.replaceChildren();
 for(const feed of FEEDS){
  const result=state.feedResults.find(r=>r.id===feed.id);
  const badge=element("span","feed-pill");
  badge.setAttribute("role","listitem");
  if(!result){badge.textContent=feed.name+" · loading";badge.dataset.state="loading"}
  else if(result.error){badge.textContent=feed.name+" · unavailable";badge.dataset.state="failed"}
  else if(result.stale){badge.textContent=feed.name+" · older snapshot ("+result.count+")";badge.dataset.state="stale"}
  else {badge.textContent=feed.name+" · "+result.count;badge.dataset.state="ready"}
  root.append(badge);
 }
}
function saveButton(job){
 const saved=state.saved.includes(job.url);
 const b=element("button","save-job",saved?"★ Saved":"☆ Save");
 b.type="button";b.dataset.saveUrl=job.url;
 b.setAttribute("aria-label",(saved?"Remove saved job: ":"Save job: ")+job.title);
 b.setAttribute("aria-pressed",String(saved));
 return b;
}
function cardFor(job){
 const card=element("article","job-card");
 const top=element("div","job-card-header");
 const source=element("span","job-source",job.employerVerified?"EMPLOYER BOARD":job.feedId==="remote"?"REMOTE LISTING":job.feedId==="europe"?"EUROPE JOB":"CURATED SOURCE");
 top.append(source,saveButton(job));
 const title=element("h3","",job.title);
 const company=element("p","job-company",job.company||"Employer not specified");
 const tags=[job.location.length?job.location.join(" · "):"Location: check source"];
 if(job.remote)tags.push("Remote · eligibility varies");
 const meta=element("p","job-meta",tags.join("  |  "));
 const desc=element("p","job-desc",job.description||"See the original posting for full details and eligibility.");
 const bottom=element("div","job-footer");
 const link=element("a","","View original listing ↗");
 link.href=job.url;link.target="_blank";link.rel="noopener noreferrer";
 const when=element("span","job-date",job.published?"Listed "+formatDate(job.published):"Confirm status at source");
 bottom.append(link,when);
 card.append(top,title,company,meta,desc,bottom);
 return card;
}
function draw(){
 const root=$("results");
 root.replaceChildren();
 const data=paginate(state.matches,state.page,PER_PAGE);
 state.page=data.page;
 $("resultHeading").textContent=state.matches.length+" matching "+(state.matches.length===1?"opportunity":"opportunities");
 $("resultMeta").textContent=state.ready
  ?"Showing "+(data.items.length?(data.page-1)*PER_PAGE+1:0)+"–"+Math.min(data.page*PER_PAGE,state.matches.length)+" · Results reflect imported snapshots"
  :"Loading sourced listings…";
 if(!data.items.length){
  const div=element("div","job-empty");
  const head=element("h3","",state.ready?"No matching jobs found.":"Loading job listings…");
  const p=element("p","",state.ready?"Try another keyword, remove a source filter, or broaden the location.":"Checking the connected source feeds.");
  div.append(head,p);
  if(state.ready){
   const reset=element("button","","Clear filters");
   reset.type="button";reset.addEventListener("click",clearFilters);
   div.append(reset);
  }
  root.append(div);
 }else{
  const fragment=document.createDocumentFragment();
  for(const job of data.items)fragment.append(cardFor(job));
  root.append(fragment);
 }
 $("pager").hidden=data.pages<=1;
 $("pageLabel").textContent="Page "+data.page+" of "+Math.max(data.pages,1);
 $("prev").disabled=data.page<=1;
 $("next").disabled=data.page>=data.pages;
 root.setAttribute("aria-busy","false");
}
function filter(resetPage=true){
 const options=currentFilters();
 if(resetPage)state.page=1;
 bookmarkRefresh();
 state.matches=filterJobs(state.jobs,options,state.saved);
 updateAddress(options);draw();
}
function clearFilters(){
 $("filtersForm").reset();
 $("sort").value="recent";
 filter();
 message("Filters cleared.");
}
function downloadSaved(){
 bookmarkRefresh();
 if(!state.saved.length){message("Save a job first to export your shortlist.");return}
 const byUrl=new Map(state.jobs.map(j=>[j.url,j]));
 const chosen=state.saved.map(url=>byUrl.get(url)||{
  title:"Saved source link",company:"",location:[],source:"Saved in browser",url
 });
 const blob=new Blob([csvForJobs(chosen)],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download="aiva-saved-jobs.csv";document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),500);
 message("Exported "+chosen.length+" saved links. CSV includes older saved URLs even if they are not in today's feeds.");
}
async function share(){
 const url=location.href;
 try{
  if(!navigator.clipboard?.writeText)throw Error("Clipboard unavailable");
  await navigator.clipboard.writeText(url);
  message("Search link copied. Filters are included in the URL.");
 }catch{message("Copy unavailable in this browser. You can copy the address from the browser bar.")}
}
$("results").addEventListener("click",event=>{
 const btn=event.target.closest("button[data-save-url]");
 if(!btn)return;
 try{
  const output=toggleBookmark(localStorage,btn.dataset.saveUrl);
  state.saved=output.urls;$("savedCount").textContent="("+state.saved.length+")";
  // Do not discard search results when save-only is active; intentionally re-filter.
  if($("savedOnly").checked)filter(false);
  else{
   btn.textContent=output.saved?"★ Saved":"☆ Save";
   btn.setAttribute("aria-pressed",String(output.saved));
   btn.setAttribute("aria-label",(output.saved?"Remove saved job: ":"Save job: ")+btn.closest(".job-card").querySelector("h3").textContent);
  }
  message(output.saved?"Job saved in this browser.":"Job removed from saved items.");
 }catch{state.storageAvailable=false;message("Browser storage is unavailable. Bookmarks cannot be saved on this device.")}
});
$("filtersForm").addEventListener("submit",e=>{e.preventDefault();filter();});
for(const id of ["query","where"])$(id).addEventListener("input",()=>filter());
for(const id of ["source","remoteOnly","savedOnly","sort"])$(id).addEventListener("change",()=>filter());
$("clearFilters").addEventListener("click",clearFilters);
$("exportSaved").addEventListener("click",downloadSaved);
$("shareSearch").addEventListener("click",share);
$("prev").addEventListener("click",()=>{if(state.page>1){state.page--;draw();$("resultHeading").scrollIntoView({block:"start"})}});
$("next").addEventListener("click",()=>{if(state.page*PER_PAGE<state.matches.length){state.page++;draw();$("resultHeading").scrollIntoView({block:"start"})}});
window.addEventListener("storage",event=>{if(event.key==="aiva-platform-saved-v1"){bookmarkRefresh();filter(false)}});
async function loadFeeds(){
 feedStatuses();bookmarkRefresh();draw();
 const outcomes=await Promise.all(FEEDS.map(async feed=>{
  try{
   const response=await fetch(feed.path,{cache:"no-cache"});
   if(!response.ok)throw Error("HTTP "+response.status);
   const value=normalizeFeed(await response.json(),feed.id);
   return {id:feed.id,name:feed.name,jobs:value.jobs,stale:!value.valid||value.ageHours>feed.maxAgeHours,count:value.jobs.length,error:null};
  }catch(error){return {id:feed.id,name:feed.name,jobs:[],stale:false,count:0,error:String(error.message||error)}}
 }));
 state.feedResults=outcomes;
 state.jobs=dedupeJobs(outcomes.flatMap(out=>out.jobs));
 state.ready=true;
 $("totalCount").textContent=state.jobs.length.toLocaleString();
 const whereList=$("locations"),names=new Set();
 for(const j of state.jobs)for(const place of j.location)if(place&&place.length<70)names.add(place);
 const fragment=document.createDocumentFragment();
 for(const name of [...names].sort().slice(0,500)){
  const item=document.createElement("option");item.value=name;fragment.append(item);
 }
 whereList.replaceChildren(fragment);
 feedStatuses();filter();
 const failures=outcomes.filter(o=>o.error).length,stale=outcomes.filter(o=>o.stale).length;
 message(state.jobs.length
  ?"Loaded "+state.jobs.length+" source-linked listings from "+(outcomes.length-failures)+" feeds."+
    (stale?" "+stale+" snapshot(s) are older than expected; verify at source.":"")+
    (failures?" "+failures+" feed(s) unavailable.":"")
  :"No usable jobs loaded. Check source feeds or try again later.");
}
loadFeeds();
