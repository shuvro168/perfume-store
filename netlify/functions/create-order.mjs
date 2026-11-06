import {randomBytes,createHash,randomUUID} from 'node:crypto';
import {db,response,parse,fail} from './_shared.mjs';
const clean=(v,max=160)=>String(v||'').trim().slice(0,max);
export async function handler(event){if(event.httpMethod!=='POST')return response(405,{error:'Method not allowed'});try{
 const {customer,items}=parse(event);if(!customer||!Array.isArray(items)||!items.length||items.length>30)throw new Error('Invalid order');
 const email=clean(customer.email,254),country=clean(customer.country,2),postal=clean(customer.postal,20);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Valid email required');
 if(!['US','CA','GB','AU'].includes(country))throw new Error('Unsupported country');
 for(const key of ['firstName','lastName','address','city','region','postal'])if(!clean(customer[key]))throw new Error('Missing '+key);
 if(country==='US'&&!/^\d{5}(-\d{4})?$/.test(postal))throw new Error('Valid US ZIP required');
 const quantities=new Map();for(const x of items){if(typeof x.id!=='string'||!Number.isInteger(x.qty)||x.qty<1||x.qty>20)throw new Error('Invalid cart item');quantities.set(x.id,(quantities.get(x.id)||0)+x.qty)}
 if([...quantities.values()].some(q=>q>20))throw new Error('Quantity limit exceeded');
 const client=db();const ids=[...quantities.keys()];const {data:products,error}=await client.from('products').select('id,name,price,stock,active').in('id',ids);if(error)throw error;
 if(products?.length!==ids.length)throw new Error('A product is unavailable');
 const lines=products.map(x=>{const qty=quantities.get(x.id);if(!x.active||x.stock<qty||!Number.isFinite(Number(x.price)))throw new Error('A product is out of stock');return {product_id:x.id,product_name:x.name,quantity:qty,unit_price:Number(x.price),line_total:Math.round(Number(x.price)*100)*qty/100}});
 const subtotal=Math.round(lines.reduce((s,x)=>s+Math.round(x.line_total*100),0))/100;
 const token=randomBytes(32).toString('hex'),tokenHash=createHash('sha256').update(token).digest('hex');const id=randomUUID();
 const order={id,order_number:'SA-'+id.slice(0,8).toUpperCase(),status:'pending',currency:'USD',subtotal,customer_email:email,customer_details:{firstName:clean(customer.firstName),lastName:clean(customer.lastName),address:clean(customer.address),address2:clean(customer.address2),city:clean(customer.city),region:clean(customer.region),postal,country,phone:clean(customer.phone,40)},access_token_hash:tokenHash,payment_provider:null};
 const {error:insertError}=await client.from('orders').insert(order);if(insertError)throw insertError;
 const {error:linesError}=await client.from('order_items').insert(lines.map(x=>({...x,order_id:id})));if(linesError){await client.from('orders').delete().eq('id',id);throw linesError}
 return response(201,{id,orderNumber:order.order_number,accessToken:token,status:'pending'});
 }catch(e){return fail(e)}}
