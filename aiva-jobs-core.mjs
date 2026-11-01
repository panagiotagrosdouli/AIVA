/**
 * AIVA job discovery primitives. Browser + Node-compatible; no third-party SDK.
 * All listings come from attributed source feeds, never invented or live-verified.
 */
export const BOOKMARK_KEY = "aiva-platform-saved-v1";
export const FEEDS = Object.freeze([
 {id:"remote",name:"Himalayas · remote",path:"data/jobs.json",maxAgeHours:96},
 {id:"employer",name:"Direct employer boards",path:"data/employer_jobs.json",maxAgeHours:96},
 {id:"europe",name:"Arbeitnow · Europe",path:"data/europe_jobs.json",maxAgeHours:96},
 {id:"curated",name:"Curated official links",path:"data/curated_jobs.json",maxAgeHours:24*45},
]);
export const PER_PAGE = 12;
export function safeHttps(value){
 try{const u=new URL(value);return u.protocol==="https:"&&u.hostname?u.href:null}catch{return null}
}
export function timestamp(value){
 if(typeof value==="number"&&Number.isFinite(value))return value>0?(value<1e11?value*1000:value):0;
 if(typeof value!=="string"||!value.trim())return 0;
 const n=Date.parse(value);return Number.isFinite(n)?n:0;
}
export function plain(value,limit=1000){
 return String(value??"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,limit);
}
const lower=x=>String(x??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase();
export function normalizeJob(raw,source,now=Date.now()){
 if(!raw||typeof raw!=="object"||typeof raw.title!=="string"||!raw.title.trim())return null;
 const url=safeHttps(raw.url);if(!url)return null;
 const expiry=timestamp(raw.expires);
 if(raw.expires&&(!expiry||expiry<=now))return null;
 const location=Array.isArray(raw.location)?raw.location:typeof raw.location==="string"?[raw.location]:[];
 const locations=[...new Set(location.filter(v=>typeof v==="string").map(v=>plain(v,130)).filter(Boolean))].slice(0,12);
 const feedId=FEEDS.some(f=>f.id===source)?source:"remote";
 return {
  id:String(raw.id||url),url,title:plain(raw.title,240),
  company:plain(raw.company||"",160),
  description:plain(raw.description||"",440),
  location:locations,
  source:plain(raw.source||FEEDS.find(f=>f.id===feedId)?.name||feedId,130),
  feedId,
  published:timestamp(raw.published),
  expires:expiry,
  remote:raw.remote===true||feedId==="remote",
  employerVerified:raw.employer_verified_source===true,
  tags:Array.isArray(raw.tags)?raw.tags.filter(x=>typeof x==="string").map(x=>plain(x,50)).slice(0,8):[],
 };
}
export function dedupeJobs(jobs){
 const seen=new Map(),priority={employer:4,curated:3,remote:2,europe:1};
 for(const job of jobs){
  // Strip tracking from the matching key; preserve the original link for applying.
  const uri=new URL(job.url);
  const key=(uri.hostname.toLowerCase()+uri.pathname.replace(/\/$/,"")).toLowerCase();
  const existing=seen.get(key);
  if(!existing||(priority[job.feedId]||0)>(priority[existing.feedId]||0))seen.set(key,job);
 }
 return [...seen.values()];
}
export function normalizeFeed(payload,source,now=Date.now()){
 if(!payload||!Array.isArray(payload.jobs))throw Error("Invalid job feed");
 const jobs=payload.jobs.map(j=>normalizeJob(j,source,now)).filter(Boolean);
 const updatedAt=timestamp(payload.updated_at);
 return {jobs,updatedAt,valid:!!updatedAt,ageHours:updatedAt?Math.max(0,(now-updatedAt)/36e5):Infinity};
}
export function loadBookmarks(storage){
 try{
  const parsed=JSON.parse(storage.getItem(BOOKMARK_KEY)||"[]");
  if(!Array.isArray(parsed))return [];
  return [...new Set(parsed.filter(v=>typeof v==="string").map(safeHttps).filter(Boolean))].slice(0,500);
 }catch{return []}
}
export function writeBookmarks(storage,urls){
 const unique=[...new Set(urls.filter(v=>typeof v==="string").map(safeHttps).filter(Boolean))].slice(0,500);
 storage.setItem(BOOKMARK_KEY,JSON.stringify(unique));
 return unique;
}
export function toggleBookmark(storage,url){
 const safe=safeHttps(url);if(!safe)throw Error("Invalid source link");
 const old=loadBookmarks(storage);
 const saved=old.includes(safe);
 const next=saved?old.filter(x=>x!==safe):[safe,...old];
 return {saved:!saved,urls:writeBookmarks(storage,next)};
}
export function filterJobs(jobs,options={},savedUrls=[]){
 const q=lower(options.q||"").trim();
 const tokens=q.split(/\s+/).filter(Boolean);
 const where=lower(options.where||"").trim();
 const source=options.source||"all",sort=options.sort||"recent";
 const saved=new Set(savedUrls);
 const found=jobs.filter(j=>{
  if(source!=="all"&&j.feedId!==source)return false;
  if(options.remoteOnly&&!j.remote)return false;
  if(options.savedOnly&&!saved.has(j.url))return false;
  if(where&&!j.location.some(loc=>lower(loc).includes(where)))return false;
  if(tokens.length){
   const hay=lower([j.title,j.company,j.description,j.source,...j.tags].join(" "));
   if(!tokens.every(t=>hay.includes(t)))return false;
  }
  return true;
 });
 found.sort((a,b)=>{
  if(sort==="title")return a.title.localeCompare(b.title)||a.url.localeCompare(b.url);
  if(sort==="company")return a.company.localeCompare(b.company)||a.title.localeCompare(b.title);
  return b.published-a.published||a.title.localeCompare(b.title);
 });
 return found;
}
export function paginate(items,page=1,pageSize=PER_PAGE){
 const pages=Math.ceil(items.length/pageSize);
 const current=Math.max(1,Math.min(pages||1,Math.trunc(Number(page)||1)));
 return {page:current,pages,items:items.slice((current-1)*pageSize,current*pageSize)};
}
export function csvForJobs(jobs){
 const quote=v=>'"'+String(v??"").replace(/"/g,'""').replace(/\r?\n/g," ")+'"';
 const rows=[["Title","Company","Location","Source","URL"],...jobs.map(j=>[j.title,j.company,j.location.join(" / "),j.source,j.url])];
 // Defend against spreadsheet formula injection in user-controlled feed fields.
 return "\ufeff"+rows.map(row=>row.map(v=>quote(/^[=+@\-\t\r]/.test(String(v))?"'"+v:v)).join(",")).join("\r\n")+"\r\n";
}
