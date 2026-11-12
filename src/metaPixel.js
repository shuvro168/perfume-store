// SCENT ATELIER Meta Pixel: browser-only events, never records a paid order.
// Respect the browser's Global Privacy Control signal; obtain any additional
// consent required by applicable law before enabling advertising tracking.
const PIXEL_ID='29645706435116337';
let initialized=false;
export function trackingOptedOut(){try{return localStorage.getItem('sa-ad-tracking-optout')==='1'}catch{return false}}
export function setTrackingOptOut(value){try{localStorage.setItem('sa-ad-tracking-optout',value?'1':'0')}catch{}}

function allowed(){
  return typeof window!=='undefined' &&
    typeof navigator!=='undefined' &&
    navigator.globalPrivacyControl!==true &&
    window.localStorage?.getItem('sa-ad-tracking-optout')!=='1';
}
function init(){
  if(!allowed())return false;
  if(initialized)return true;
  if(typeof window.fbq==='function'){initialized=true;return true}
  /* Meta's standard asynchronous pixel bootstrap. */
  const f=window;const b=document;const e='script';
  const q=f.fbq=function(){q.callMethod?q.callMethod.apply(q,arguments):q.queue.push(arguments)};
  if(!f._fbq)f._fbq=q;
  q.push=q;q.loaded=true;q.version='2.0';q.queue=[];
  const t=b.createElement(e);t.async=true;t.src='https://connect.facebook.net/en_US/fbevents.js';
  const first=b.getElementsByTagName(e)[0];first.parentNode.insertBefore(t,first);
  f.fbq('init',PIXEL_ID);
  initialized=true;
  return true;
}
export function trackPageView(){
  if(init())window.fbq('track','PageView');
}
export function trackEvent(name,parameters={}){
  if(init())window.fbq('track',name,parameters);
}
export function productEvent(p){
  return {content_ids:[String(p.id)],content_type:'product',contents:[{id:String(p.id),quantity:1,item_price:Number(p.price)}],value:Number(p.price),currency:'USD'};
}
export function cartEvent(items){
  return {content_ids:items.map(x=>String(x.id)),content_type:'product',
    contents:items.map(x=>({id:String(x.id),quantity:x.qty,item_price:Number(x.product.price)})),
    value:items.reduce((sum,x)=>sum+x.qty*Number(x.product.price),0),currency:'USD',
    num_items:items.reduce((sum,x)=>sum+x.qty,0)};
}
