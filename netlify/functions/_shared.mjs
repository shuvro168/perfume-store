import {createClient} from '@supabase/supabase-js';
export function response(code,data){return {statusCode:code,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(data)}}
export function db(){if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Server database not configured');return createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})}
export function parse(event){if((event.body||'').length>16000)throw new Error('Request too large');return JSON.parse(event.body||'{}')}
export function fail(e){console.error('Order API error',e);return response(e.message==='Server database not configured'?503:400,{error:e.message==='Server database not configured'?'Order service not configured':String(e.message).slice(0,180)})}
