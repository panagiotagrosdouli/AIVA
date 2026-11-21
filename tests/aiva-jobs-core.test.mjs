import test from 'node:test';
import assert from 'node:assert/strict';
import {
 BOOKMARK_KEY,FEEDS,safeHttps,timestamp,normalizeJob,normalizeFeed,dedupeJobs,
 loadBookmarks,writeBookmarks,toggleBookmark,filterJobs,paginate,csvForJobs
} from '../aiva-jobs-core.mjs';

const base={title:'Senior Data Engineer',company:'Example Co',url:'https://example.com/jobs/123?utm_source=feed',description:'Work on <b>data</b> pipelines',location:['Greece'],published:1793506973000};
const now=1793506980000;
function storage(initial='[]'){
 const m=new Map([[BOOKMARK_KEY,initial]]);
 return {getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};
}
test('feed definitions are distinct and use same-origin paths',()=>{
 assert.equal(new Set(FEEDS.map(x=>x.id)).size,4);
 assert.ok(FEEDS.every(x=>x.path.startsWith('data/')));
});
test('rejects invalid links, expired dates in seconds and ms, and empty titles',()=>{
 assert.equal(safeHttps('javascript:alert(1)'),null);
 assert.equal(safeHttps('http://example.com'),null);
 assert.equal(normalizeJob({...base,url:'javascript:alert(1)'},'remote',now),null);
 assert.equal(normalizeJob({...base,title:' '},'remote',now),null);
 assert.equal(normalizeJob({...base,expires:Math.round((now-1000)/1000)},'remote',now),null);
 assert.equal(normalizeJob({...base,expires:now-1000},'remote',now),null);
 assert.ok(normalizeJob({...base,expires:now+1000},'remote',now));
});
test('normalization strips tags and deduplicates by canonical URL with employer priority',()=>{
 const remote=normalizeJob(base,'remote',now);
 const employer=normalizeJob({...base,url:'https://example.com/jobs/123',employer_verified_source:true},'employer',now);
 assert.equal(remote.description,'Work on data pipelines');
 const result=dedupeJobs([remote,employer]);
 assert.equal(result.length,1);
 assert.equal(result[0].feedId,'employer');
});
test('timestamps and stale snapshot metadata are not treated as live',()=>{
 assert.equal(timestamp(1793506973),1793506973000);
 assert.equal(timestamp('unparseable'),0);
 const feed=normalizeFeed({updated_at:new Date(now-3600000).toISOString(),jobs:[base]},'remote',now);
 assert.equal(feed.jobs.length,1);
 assert.equal(feed.ageHours,1);
 assert.throws(()=>normalizeFeed({foo:true},'remote'),/Invalid job feed/);
});
test('query terms, location, source, remote and bookmarks combine',()=>{
 const a=normalizeJob(base,'remote',now);
 const b=normalizeJob({...base,url:'https://example.com/jobs/456',title:'Product Designer',location:['Berlin, Germany'],remote:false},'employer',now);
 const list=[a,b];
 assert.deepEqual(filterJobs(list,{q:'data engineer',where:'greece',source:'remote'}),[a]);
 assert.deepEqual(filterJobs(list,{q:'designer',source:'employer'}),[b]);
 assert.deepEqual(filterJobs(list,{remoteOnly:true}),[a]);
 assert.deepEqual(filterJobs(list,{savedOnly:true},[b.url]),[b]);
 assert.equal(filterJobs(list,{q:'missing'}).length,0);
});
test('bookmark storage deduplicates, validates URLs and toggles safely',()=>{
 const s=storage('["http://bad.com","https://example.com/jobs/123","https://example.com/jobs/123"]');
 assert.deepEqual(loadBookmarks(s),['https://example.com/jobs/123']);
 assert.equal(toggleBookmark(s,'https://example.com/jobs/123').saved,false);
 assert.equal(toggleBookmark(s,'https://example.com/jobs/456').saved,true);
 assert.deepEqual(loadBookmarks(s),['https://example.com/jobs/456']);
 assert.deepEqual(writeBookmarks(s,['javascript:alert(1)','https://example.com/jobs/456']),['https://example.com/jobs/456']);
});
test('pagination bounds page and never returns an invalid page',()=>{
 assert.equal(paginate([],4).pages,0);
 assert.equal(paginate([1,2,3],9,2).page,2);
 assert.deepEqual(paginate([1,2,3],9,2).items,[3]);
});
test('CSV escapes quotes, strips newlines and neutralizes formula injection',()=>{
 const job=normalizeJob({...base,title:'=HYPERLINK("evil")',company:'Acme\nInc'},'remote',now);
 const csv=csvForJobs([job]);
 assert.match(csv,/"'=HYPERLINK\(""evil""\)"/);
 assert.ok(csv.includes('"Acme Inc"'));
});
