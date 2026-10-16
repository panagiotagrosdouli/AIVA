import Stripe from 'stripe';
import {admin,requireUser,respond,origin} from './_lib.js';
export default async function handler(req,res){
 if(req.method!=='POST')return respond(res,405,{error:'Method not allowed'});
 try{
 const user=await requireUser(req);if(!user)return respond(res,401,{error:'Sign in required'});
 const plan=req.body?.plan;const prices={pro:process.env.STRIPE_PRICE_PRO,business:process.env.STRIPE_PRICE_BUSINESS};
 if(!Object.hasOwn(prices,plan)||!/^price_/.test(prices[plan]||''))return respond(res,400,{error:'Plan is unavailable'});
 if(!process.env.STRIPE_SECRET_KEY)return respond(res,503,{error:'Billing is not configured'});
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
 const {data:existing,error:dbError}=await admin().from('billing_customers').select('stripe_customer_id').eq('user_id',user.id).maybeSingle();
 if(dbError)throw dbError;
 let customer=existing?.stripe_customer_id;
 if(!customer){
   const created=await stripe.customers.create({email:user.email,metadata:{aiva_user_id:user.id}});
   customer=created.id;
   const {error}=await admin().from('billing_customers').upsert({user_id:user.id,stripe_customer_id:customer},{onConflict:'user_id'});
   if(error)throw error;
 }
 const base=origin(req);
 const session=await stripe.checkout.sessions.create({mode:'subscription',customer,line_items:[{price:prices[plan],quantity:1}],success_url:base+'/account.html?checkout=success',cancel_url:base+'/account.html?checkout=cancel',client_reference_id:user.id,subscription_data:{metadata:{aiva_user_id:user.id,plan}},metadata:{aiva_user_id:user.id,plan}});
 return respond(res,200,{url:session.url});
 }catch(e){console.error('checkout failed',e);return respond(res,500,{error:'Checkout unavailable'})}
}
