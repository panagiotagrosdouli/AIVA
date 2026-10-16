import {admin,requireUser,respond} from './_lib.js';
const kinds=new Set(['job','internship','scholarship','grant','fellowship','startup_program']);
export default async function handler(req,res){
 if(!['GET','POST'].includes(req.method))return respond(res,405,{error:'Method not allowed'});
 try{
 const user=await requireUser(req);if(!user)return respond(res,401,{error:'Sign in required'});
 const db=admin();
 if(req.method==='GET'){
   const {data:members,error:memberError}=await db.from('organization_members').select('organization_id').eq('user_id',user.id);if(memberError)throw memberError;
   if(!members.length)return respond(res,200,{opportunities:[]});
   const {data,error}=await db.from('opportunities').select('id,organization_id,title,kind,status,created_at').in('organization_id',members.map(m=>m.organization_id)).limit(100);
   if(error)throw error;return respond(res,200,{opportunities:data});
 }
 const body=req.body||{};
 const {data:member,error:membershipError}=await db.from('organization_members').select('role').eq('user_id',user.id).eq('organization_id',body.organization_id).maybeSingle();
 if(membershipError)throw membershipError;
 if(!member||!['owner','editor'].includes(member.role))return respond(res,403,{error:'Not an authorized organization editor'});
 if(typeof body.title!=='string'||body.title.trim().length<3||body.title.length>240||!kinds.has(body.kind)||typeof body.original_url!=='string'||!/^https:\/\//i.test(body.original_url)||body.original_url.length>2000||typeof body.description!=='string'||body.description.length>10000)return respond(res,400,{error:'Invalid opportunity'});
 const {data,error}=await db.from('opportunities').insert({organization_id:body.organization_id,title:body.title.trim(),kind:body.kind,original_url:body.original_url,description:body.description,source_name:'Employer submitted',status:'pending'}).select('id,status').single();
 if(error)throw error;return respond(res,201,{opportunity:data});
 }catch(e){console.error('employer API failed',e);return respond(res,500,{error:'Request failed'})}
}
