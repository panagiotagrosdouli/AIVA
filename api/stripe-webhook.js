import Stripe from 'stripe';
import {admin,respond} from './_lib.js';
export const config={api:{bodyParser:false}};
async function rawBody(req){const chunks=[];for await(const chunk of req)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk));return Buffer.concat(chunks)}
export default async function handler(req,res){
 if(req.method!=='POST')return respond(res,405,{error:'Method not allowed'});
 if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_WEBHOOK_SECRET)return respond(res,503,{error:'Webhook not configured'});
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);let event;
 try{event=stripe.webhooks.constructEvent(await rawBody(req),req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET)}
 catch(e){return respond(res,400,{error:'Invalid webhook signature'})}
 try{
 const db=admin();
 // Persistent deduplication: identical events are harmless on retry.
 const {data:already}=await db.from('stripe_events').select('id').eq('id',event.id).maybeSingle();if(already)return respond(res,200,{received:true});
 if(event.type==='customer.subscription.created'||event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){
   const sub=event.data.object;
   const {data:owner,error:lookupError}=await db.from('billing_customers').select('user_id').eq('stripe_customer_id',sub.customer).maybeSingle();
   if(lookupError)throw lookupError;
   if(owner){
     const plan=sub.items.data[0]?.price?.id===process.env.STRIPE_PRICE_BUSINESS?'business':sub.items.data[0]?.price?.id===process.env.STRIPE_PRICE_PRO?'pro':'unknown';
     const {error}=await db.from('subscriptions').upsert({stripe_subscription_id:sub.id,user_id:owner.user_id,plan,status:sub.status,updated_at:new Date().toISOString()},{onConflict:'stripe_subscription_id'});if(error)throw error;
   }
 }
 const {error}=await db.from('stripe_events').insert({id:event.id,type:event.type});if(error&&error.code!=='23505')throw error;
 return respond(res,200,{received:true});
 }catch(e){console.error('webhook processing failed',e);return respond(res,500,{error:'Retry later'})}
}
