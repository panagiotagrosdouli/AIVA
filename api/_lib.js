import {createClient} from '@supabase/supabase-js';
export function admin(){if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Database not configured');return createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})}
export async function requireUser(req){const token=(req.headers.authorization||'').match(/^Bearer (.+)$/i)?.[1];if(!token)return null;const {data,error}=await admin().auth.getUser(token);return error?null:data.user}
export function respond(res,status,data){res.status(status).setHeader('Cache-Control','no-store').json(data)}
export function origin(req){const allowed=(process.env.APP_ORIGIN||'').replace(/\/$/,'');if(!/^https:\/\//.test(allowed))throw Error('APP_ORIGIN must be HTTPS');return allowed}
