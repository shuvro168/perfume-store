import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Link,useParams,useNavigate,useLocation} from 'react-router-dom';
import {ShoppingBag,ShoppingCart,Menu,X,ArrowRight,Plus,Minus,Trash2,ChevronLeft,ChevronRight} from 'lucide-react';
import {supabase} from './supabase';
import {demoProducts,money} from './data';
import './style.css';
import {trackPageView,trackEvent,productEvent,cartEvent,trackingOptedOut,setTrackingOptOut} from './metaPixel';

// Public routing configuration. API credentials must never be placed here.
const DEFAULT_WHATSAPP_NUMBER='85262659737';
const cleanWhatsAppNumber=value=>String(value||'').replace(/\D/g,'');
const isValidWhatsAppNumber=value=>/^\d{7,15}$/.test(cleanWhatsAppNumber(value));
function safeExternalWhatsAppUrl(value,message){
  try{
    const url=new URL(value);
    if(url.protocol!=='https:'||url.username||url.password)return null;
    // External redirect services must explicitly accept the `text` query parameter.
    url.searchParams.set('text',message);
    return url.toString();
  }catch{return null}
}
function useWhatsAppRouting(){
  const [routing,setRouting]=useState({mode:'fixed',fixed_number:DEFAULT_WHATSAPP_NUMBER,external_url:'',accounts:[],loading:!!supabase,error:''});
  useEffect(()=>{
    if(!supabase)return;
    let alive=true;
    const load=async()=>{
      try{
        const {data:settings,error:settingsError}=await supabase.from('whatsapp_settings').select('mode,fixed_number,external_url').eq('id',1).single();
        if(settingsError)throw settingsError;
        let accounts=[];
        if(settings.mode==='random'){
          const {data,error}=await supabase.from('whatsapp_accounts').select('id,phone_number').eq('enabled',true);
          if(error)throw error;
          accounts=(data||[]).filter(a=>isValidWhatsAppNumber(a.phone_number));
        }
        if(alive)setRouting({...settings,accounts,loading:false,error:''});
      }catch(error){
        console.error('WhatsApp routing configuration could not be loaded:',error);
        if(alive)setRouting(r=>({...r,loading:false,error:'WhatsApp contact details are temporarily unavailable. Please try again later.'}));
      }
    };
    load();
    return()=>{alive=false};
  },[]);
  return routing;
}
function whatsappDisplay(routing){
  if(routing.loading||routing.error)return 'Contact details loading';
  if(routing.mode==='fixed'&&isValidWhatsAppNumber(routing.fixed_number))return '+'+cleanWhatsAppNumber(routing.fixed_number);
  if(routing.mode==='random')return 'Assigned when you place an enquiry';
  if(routing.mode==='external')return 'Contact our team via WhatsApp';
  return 'Contact details unavailable';
}

function WhatsAppMark(){return <svg viewBox="0 0 32 32" width="33" height="33" aria-hidden="true"><path fill="currentColor" d="M16 2.5A13.4 13.4 0 0 0 4.4 22.6L2.5 29.5l7.1-1.9A13.5 13.5 0 1 0 16 2.5Zm0 24.5a11 11 0 0 1-5.6-1.5l-.4-.2-4.2 1.1 1.1-4.1-.3-.4a11 11 0 1 1 9.4 4.6Zm6.1-8.2c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.7-1.7-1-1-1.7-2.1-1.9-2.4-.2-.3 0-.5.2-.7l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6l-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.1 1.4 3.3c.2.2 2.4 3.7 5.8 5.1.8.4 1.5.6 2 .7.8.2 1.6.2 2.2.1.7-.1 1.9-.8 2.2-1.6.3-.8.3-1.5.2-1.6-.1-.1-.3-.2-.6-.4Z"/></svg>}
function SupportWidgets({routing,count}){
 const [popupSettings,setPopupSettings]=useState({enabled:true,show_count:false,contact_count:'999+',contact_message:'customers have contacted our team',show_demo_label:true});
 useEffect(()=>{let active=true;if(!supabase)return;supabase.from('support_popup_settings').select('enabled,show_count,contact_count,contact_message,show_demo_label').eq('id',1).maybeSingle().then(({data,error})=>{if(active&&data&&!error)setPopupSettings(data)});return()=>{active=false}},[]);
 const [open,setOpen]=useState(false);
 const [dismissed,setDismissed]=useState(()=>{try{return sessionStorage.getItem('sa-support-dismissed')==='1'}catch{return false}});
 const [notice,setNotice]=useState('');
 const location=useNavigate();
 const route=window.location.pathname;
 useEffect(()=>{if(!popupSettings.enabled||dismissed||route.startsWith('/checkout')||route==='/cart')return;const timer=setTimeout(()=>setOpen(true),20000);return()=>clearTimeout(timer)},[dismissed,route,popupSettings.enabled]);
 const close=()=>{setOpen(false);setDismissed(true);try{sessionStorage.setItem('sa-support-dismissed','1')}catch{}};
 const contact=()=>{
  if(routing.loading){setNotice('Contact details are loading. Please try again shortly.');return}
  if(routing.error){setNotice(routing.error);return}
  const message='Hello SCENT ATELIER, I have a question about a fragrance or an order.';
  let url=null;
  if(routing.mode==='fixed'&&isValidWhatsAppNumber(routing.fixed_number))url='https://wa.me/'+cleanWhatsAppNumber(routing.fixed_number)+'?text='+encodeURIComponent(message);
  if(routing.mode==='random'){
   const valid=(routing.accounts||[]).filter(a=>isValidWhatsAppNumber(a.phone_number));
   if(valid.length)url='https://wa.me/'+cleanWhatsAppNumber(valid[Math.floor(Math.random()*valid.length)].phone_number)+'?text='+encodeURIComponent(message);
  }
  if(routing.mode==='external')url=safeExternalWhatsAppUrl(routing.external_url,message);
  if(!url){setNotice('WhatsApp support is temporarily unavailable. Please try again later.');return}
  trackEvent('Contact',{contact_method:'WhatsApp',contact_context:open?'support_popup':'floating_button'});
   window.open(url,'_blank','noopener,noreferrer');close();
 };
 return <>
  <div className="sa-floating-actions"><button type="button" className="sa-float sa-float-whatsapp" onClick={contact} aria-label="Contact us on WhatsApp" title="WhatsApp support"><WhatsAppMark/></button><Link to="/cart" className="sa-float sa-float-cart" aria-label={`Shopping cart, ${count} items`} title="View shopping cart"><ShoppingCart size={30} strokeWidth={2.1}/>{count>0&&<span className="sa-cart-count">{count>99?'99+':count}</span>}</Link></div>
  {open&&!dismissed&&<div className="sa-support-popup" role="dialog" aria-label="Order assistance" aria-modal="false"><button className="sa-support-close" type="button" aria-label="Close support invitation" onClick={close}><X size={18}/></button><div className="sa-support-head"><span className="sa-support-logo"><WhatsAppMark/></span><div><strong>SCENT ATELIER</strong><small>Customer Support</small></div></div><h3>Need help with your order?</h3><p>Questions about a fragrance, shipping or your order? Our team is happy to help.</p>{popupSettings.show_count&&<p className="sa-demo-social-proof"><span>{popupSettings.contact_count} {popupSettings.contact_message}</span>{popupSettings.show_demo_label&&<small>Demo preview · illustrative figure</small>}</p>}<button className="sa-support-cta" type="button" onClick={contact}><WhatsAppMark/> Chat with us on WhatsApp</button><small className="sa-support-foot">We're here to help you shop with confidence.</small></div>}
  {notice&&<div className="sa-support-notice" role="alert">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notice">×</button></div>}
 </>;
}
function PrivacyChoices(){
 const [optedOut,setOptedOut]=useState(()=>trackingOptedOut());
 return <button type="button" className="sa-privacy-link" onClick={()=>{const next=!optedOut;setTrackingOptOut(next);setOptedOut(next);window.location.reload()}} aria-label="Toggle advertising tracking opt-out">{optedOut?'Enable optional advertising tracking':'Do not sell or share my personal information'}</button>;
}
function PixelPageViews(){
 const location=useLocation();
 useEffect(()=>{trackPageView()},[location.pathname,location.search]);
 return null;
}
function App(){
 const whatsappRouting=useWhatsAppRouting();
 const [products,setProducts]=useState(demoProducts),[cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('aura-cart')||'[]')}catch{return []}}),[menu,setMenu]=useState(false),[loading,setLoading]=useState(!!supabase);
 const refresh=async()=>{if(!supabase)return;setLoading(true);const {data,error}=await supabase.from('products').select('*').eq('active',true).order('created_at',{ascending:false});if(!error)setProducts(data||[]);else console.error(error);setLoading(false)};
 useEffect(()=>{refresh()},[]);
 useEffect(()=>localStorage.setItem('aura-cart',JSON.stringify(cart)),[cart]);
 const add=(product)=>{if(product.stock<=0)return;const existing=cart.find(x=>x.id===product.id);if(existing&&existing.qty>=product.stock)return;trackEvent('AddToCart',productEvent(product));setCart(prev=>{const found=prev.find(x=>x.id===product.id);return found?prev.map(x=>x.id===product.id?{...x,qty:Math.min(x.qty+1,product.stock)}:x):[...prev,{id:product.id,qty:1}]})};
 const change=(id,delta)=>setCart(prev=>prev.map(x=>x.id===id?{...x,qty:Math.max(0,Math.min(x.qty+delta,products.find(p=>p.id===id)?.stock||0))}:x).filter(x=>x.qty>0));
 const items=cart.map(x=>({...x,product:products.find(p=>p.id===x.id)})).filter(x=>x.product&&x.product.active&&x.product.stock>0);
 const count=items.reduce((s,x)=>s+x.qty,0);
 return <><header className="header"><div className="topline">FRAGRANCE COLLECTION · ORDER ENQUIRIES VIA WHATSAPP</div><div className="nav wrap"><button className="icon mobile" aria-label="Toggle menu" onClick={()=>setMenu(!menu)}><Menu size={22}/></button><Link className="brand" to="/">SCENT <span>ATELIER</span></Link><nav className={menu?'open':''}><Link onClick={()=>setMenu(false)} to="/">Home</Link><Link onClick={()=>setMenu(false)} to="/shop">Shop All</Link><Link onClick={()=>setMenu(false)} to="/shop?category=Chanel">Chanel</Link><Link onClick={()=>setMenu(false)} to="/shop?category=Dior">Dior</Link></nav><Link to="/cart" className="bag"><ShoppingBag size={21}/><span>{count}</span></Link></div></header>
 <PixelPageViews/>
 <Routes><Route path="/" element={<Home products={products} loading={loading} add={add}/>}/><Route path="/shop" element={<Shop products={products} add={add}/>}/><Route path="/product/:id" element={<Detail products={products} add={add}/>}/><Route path="/cart" element={<Cart items={items} change={change}/>}/><Route path="/checkout" element={<WhatsAppCheckout items={items} routing={whatsappRouting}/>}/><Route path="/admin/*" element={<section className="wrap section"><h1>Page not found</h1><Link to="/">Return home</Link></section>}/><Route path="*" element={<section className="wrap section"><h1>Page not found</h1><Link to="/">Return home</Link></section>}/></Routes>
 <SupportWidgets routing={whatsappRouting} count={count}/>
 <PrivacyChoices/>
 <footer><div className="wrap footergrid"><div><Link className="brand" to="/">SCENT <span>ATELIER</span></Link><p>Designer fragrances, curated in one place.</p></div><div><b>Explore</b><Link to="/shop">All fragrances</Link><Link to="/cart">Your bag</Link></div><div><b>Information</b><p>Orders: WhatsApp {whatsappDisplay(whatsappRouting)}</p><p>Shipping and returns policies coming soon.</p></div></div><div className="wrap footnote">© {new Date().getFullYear()} SCENT ATELIER · Orders are confirmed personally via WhatsApp. No online payments are collected.</div></footer></>;
}
function galleryImages(p){return [...new Set([...(Array.isArray(p.images)?p.images:[]),p.image_url].filter(Boolean))].slice(0,8)}
function Gallery({p,detail=false}){
  const images=galleryImages(p);
  const [index,setIndex]=useState(0);
  const [zoom,setZoom]=useState(false);
  const start=useRef(null);
  const ignoreClick=useRef(false);
  const current=Math.min(index,Math.max(images.length-1,0));
  useEffect(()=>{setIndex(0);setZoom(false)},[p.id]);
  const change=(delta)=>{
    if(images.length<2)return;
    setIndex(i=>(i+delta+images.length)%images.length);
  };
  const onPointerDown=(e)=>{
    if(images.length<2||e.target.closest('button'))return;
    if(e.pointerType==='mouse'&&e.button!==0)return;
    start.current={x:e.clientX,y:e.clientY,id:e.pointerId};
  };
  const onPointerUp=(e)=>{
    const s=start.current;
    start.current=null;
    if(!s||s.id!==e.pointerId)return;
    const dx=e.clientX-s.x;
    const dy=e.clientY-s.y;
    if(Math.abs(dx)>=45&&Math.abs(dx)>Math.abs(dy)*1.2){
      ignoreClick.current=true;
      change(dx<0?1:-1);
      window.setTimeout(()=>{ignoreClick.current=false},250);
    }
  };
  return <div className={detail?'gallery detailgallery':'gallery cardgallery'}>
    <div className="gallerymain"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={()=>{start.current=null}}>
      <img src={images[current]||'/placeholder.svg'}
        alt={`${p.name} — image ${current+1}`}
        draggable="false" loading="lazy"
        onClick={e=>{if(ignoreClick.current){e.stopPropagation();return}if(detail)setZoom(true)}}/>
      {images.length>1&&<>
        <button type="button" className="galleryarrow prev"
          aria-label="Previous image" onClick={()=>change(-1)}><ChevronLeft size={19}/></button>
        <button type="button" className="galleryarrow next"
          aria-label="Next image" onClick={()=>change(1)}><ChevronRight size={19}/></button>
        <span className="gallerycount">{current+1} / {images.length}</span>
      </>}
    </div>
    {detail&&images.length>1&&<div className="gallerythumbs" aria-label="Product image thumbnails">
      {images.map((url,i)=><button key={url} type="button"
        className={i===current?'chosen':''} aria-label={`Show image ${i+1}`}
        aria-pressed={i===current} onClick={()=>setIndex(i)}>
        <img src={url} alt={`${p.name} thumbnail ${i+1}`} loading="lazy"/>
      </button>)}
    </div>}
    {zoom&&<div className="galleryzoom" role="dialog" aria-modal="true"
      aria-label="Enlarged product image" onClick={()=>setZoom(false)}>
      <button type="button" className="zoomclose" onClick={()=>setZoom(false)}
        aria-label="Close"><X/></button>
      <img src={images[current]} alt={p.name} onClick={e=>e.stopPropagation()}/>
    </div>}
  </div>;
}
function ProductCard({p,add}){const navigate=useNavigate();const openProduct=e=>{if(e.target.closest('button, a, input, select, textarea'))return;navigate('/product/'+p.id)};return <article className="product sa-clickable-product" onClick={openProduct} onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){e.preventDefault();navigate('/product/'+p.id)}}} role="link" tabIndex={0} aria-label={'View details for '+p.name}><Gallery p={p}/><div className="productmeta"><span>{p.category} · {p.volume}</span><Link to={'/product/'+p.id}><h3>{p.name}</h3></Link><div className="productbottom"><strong>{money(p.price)}</strong><button disabled={p.stock<=0} onClick={()=>add(p)} className="smalladd" aria-label={'Add '+p.name+' to bag'}><Plus size={18}/></button></div></div></article>}
function Home({products,loading,add}){return <><section className="hero"><div className="heroimage"/><div className="wrap heroinside"><div className="herotext"><p className="eyebrow">DESIGNER FRAGRANCES</p><h1>Discover<br/>your next<br/><em>signature scent.</em></h1><p>Explore a curated selection of fragrances from iconic houses. All listed at $49, with availability confirmed before checkout.</p><Link className="btn dark" to="/shop">Explore the collection <ArrowRight size={17}/></Link></div></div></section><section className="wrap section"><div className="sectionheading"><div><p className="eyebrow">CURATED FOR YOU</p><h2>Featured fragrances</h2></div><Link className="underlink" to="/shop">View all fragrances <ArrowRight size={17}/></Link></div><div className="products">{products.filter(p=>p.featured).slice(0,4).map(p=><ProductCard key={p.id} p={p} add={add}/>)}</div>{loading&&<p>Loading products…</p>}</section><section className="statement"><p className="eyebrow">THE COLLECTION</p><h2>Many houses.<br/><em>One destination.</em></h2><p>Discover a growing selection of designer and niche fragrances.</p></section></>}
function Shop({products,add}){const initial=new URLSearchParams(window.location.search).get('category')||'All';const [category,setCategory]=useState(initial);const [limit,setLimit]=useState(8);useEffect(()=>{setCategory(new URLSearchParams(window.location.search).get('category')||'All');setLimit(8)},[window.location.search]);const categories=['All',...new Set(products.map(p=>p.category))];const filtered=products.filter(p=>category==='All'||p.category===category);return <main className="wrap section"><p className="eyebrow">DISCOVER YOUR SIGNATURE</p><h1 className="pagetitle">The collection</h1><p className="muted">Discover fragrances by brand. Product sizes and availability are being verified.</p><div className="filters">{categories.map(c=><button key={c} className={category===c?'selected':''} onClick={()=>{setCategory(c);setLimit(8)}}>{c}</button>)}</div><div className="products">{filtered.slice(0,limit).map(p=><ProductCard key={p.id} p={p} add={add}/>)}</div>{filtered.length>limit&&<div className="sa-load-more"><button type="button" className="btn outline" onClick={()=>setLimit(n=>n+8)}>VIEW MORE PRODUCTS ({filtered.length-limit} remaining)</button></div>}{!filtered.length&&<p>No products found.</p>}</main>}
// Editorial experience cards and customer reviews are intentionally separate.
function ProductInsights({productId}){
 const [cards,setCards]=useState([]),[reviews,setReviews]=useState([]),[photos,setPhotos]=useState({});
 const [settings,setSettings]=useState({max_display_reviews:99,enabled:true});
 const [cardIndex,setCardIndex]=useState(0),[reviewIndex,setReviewIndex]=useState(0);
 const [expandedReviews,setExpandedReviews]=useState({}),[expandedCards,setExpandedCards]=useState({});
 const [photoPreview,setPhotoPreview]=useState(null),[error,setError]=useState('');
 const [reviewPaused,setReviewPaused]=useState(false);
 useEffect(()=>{
  let active=true;
  setCards([]);setReviews([]);setPhotos({});setCardIndex(0);setReviewIndex(0);
  setExpandedReviews({});setExpandedCards({});setError('');
  if(!supabase)return;
  (async()=>{
   const results=await Promise.all([
    supabase.from('product_experience_cards').select('id,content,position').eq('product_id',productId).order('position',{ascending:true}).limit(1000),
    supabase.from('product_reviews').select('id,customer_name,avatar_url,rating,review_text,verified_purchase,created_at').eq('product_id',productId).eq('status','published').order('created_at',{ascending:false}).limit(1000),
    supabase.from('review_settings').select('max_display_reviews,enabled').eq('id',1).maybeSingle()
   ]);
   if(!active)return;
   if(!results[0].error)setCards(results[0].data||[]);
   else console.error('Experience cards:',results[0].error);
   if(!results[2].error&&results[2].data)setSettings(results[2].data);
   if(results[1].error){console.error('Customer reviews:',results[1].error);setError('Customer reviews are temporarily unavailable.');return}
   const rows=results[1].data||[];setReviews(rows);
   if(rows.length){
    const {data,error:photoError}=await supabase.from('review_images').select('review_id,image_url,position').in('review_id',rows.map(r=>r.id)).order('position',{ascending:true});
    if(!active)return;
    if(photoError)console.error('Review photos:',photoError);
    else{const grouped={};(data||[]).forEach(item=>{(grouped[item.review_id]??=[]).push(item.image_url)});setPhotos(grouped)}
   }
  })();
  return()=>{active=false};
 },[productId]);
 const visibleReviews=settings.enabled?reviews.slice(0,Math.max(1,Number(settings.max_display_reviews)||99)):[];
 const anyReviewExpanded=Object.values(expandedReviews).some(Boolean);
 const anyCardExpanded=Object.values(expandedCards).some(Boolean);
 useEffect(()=>{
  if(cards.length<2||anyCardExpanded)return;
  const timer=window.setInterval(()=>setCardIndex(i=>(i+1)%cards.length),5000);
  return()=>window.clearInterval(timer);
 },[cards.length,productId,anyCardExpanded]);
 if(!cards.length&&!visibleReviews.length&&!error)return null;
 const card=cards[cardIndex%Math.max(1,cards.length)];
 const shownReviews=visibleReviews.length>1?[...visibleReviews,...visibleReviews]:visibleReviews;
 const reviewCount=visibleReviews.length;
 const toggleReview=id=>setExpandedReviews(x=>({...x,[id]:!x[id]}));
 const toggleCard=id=>setExpandedCards(x=>({...x,[id]:!x[id]}));
 return <div className="sa-insights-v2">
 <style>{`
 .sa-insights-v2{margin:66px 0 26px;display:grid;gap:22px}
 .sa-insights-v2 .sa-section{border:1px solid #e6ded2;background:#faf8f5;padding:clamp(22px,3vw,36px);min-width:0}
 .sa-insights-v2 .sa-kicker{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#967e60;margin:0 0 9px}
 .sa-insights-v2 h2{font:400 clamp(25px,3vw,34px) Georgia,serif;color:#26211c;margin:0}
 .sa-insights-v2 .sa-section-head{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:22px;flex-wrap:wrap}
  .sa-insights-v2 .sa-review-viewport{overflow:hidden;width:100%;min-width:0}
 .sa-insights-v2 .sa-review-grid{display:flex;align-items:stretch;gap:14px;width:max-content;animation:sa-reviews-left var(--sa-duration,30s) linear infinite;will-change:transform}
 .sa-insights-v2 .sa-review-grid.sa-still{animation:none}
 .sa-insights-v2 .sa-review-grid.sa-paused{animation-play-state:paused}
 @keyframes sa-reviews-left{from{transform:translateX(0)}to{transform:translateX(calc(-50% - 7px))}}
 .sa-insights-v2 .sa-review-card{width:clamp(245px,27vw,315px);flex:0 0 clamp(245px,27vw,315px);background:#fff;border:1px solid #e6ded2;padding:20px;min-width:0;display:flex;flex-direction:column;gap:12px}
 .sa-insights-v2 .sa-review-head{display:flex;align-items:center;gap:10px}
 .sa-insights-v2 .sa-avatar{width:43px;height:43px;flex:none;border-radius:50%;overflow:hidden;background:#e9dfd1;display:grid;place-items:center;font:20px Georgia,serif}
 .sa-insights-v2 .sa-avatar img{width:100%;height:100%;object-fit:cover}
 .sa-insights-v2 .sa-name{font-size:13px;font-weight:600;overflow-wrap:anywhere}
 .sa-insights-v2 .sa-stars{color:#b28a46;letter-spacing:2px;font-size:16px;line-height:1.4}
 .sa-insights-v2 .sa-review-text,.sa-insights-v2 .sa-experience-text{font-size:13px;line-height:1.85;color:#544b42;white-space:pre-line;overflow-wrap:anywhere;margin:0}
 .sa-insights-v2 .sa-clamp{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden}
 .sa-insights-v2 .sa-expand{background:none;border:0;color:#927046;text-decoration:underline;cursor:pointer;padding:2px 0;font:inherit;font-size:12px;align-self:flex-start}
 .sa-insights-v2 .sa-review-photos{display:flex;gap:8px;overflow-x:auto;max-width:100%;padding-bottom:3px}
 .sa-insights-v2 .sa-photo-button{border:0;padding:0;background:none;cursor:zoom-in;flex:none}
 .sa-insights-v2 .sa-photo-button img{width:88px;height:88px;object-fit:cover;border-radius:2px;display:block}
 .sa-insights-v2 .sa-foot{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:20px;padding-top:14px;border-top:1px solid #e6ded2;color:#84776b;font-size:12px}
 .sa-insights-v2 .sa-nav{display:flex;gap:8px}
 .sa-insights-v2 .sa-nav button{border:1px solid #d8cbbc;background:transparent;width:34px;height:34px;display:grid;place-items:center;cursor:pointer;color:#5b4b3b}
 .sa-insights-v2 .sa-experience{max-width:100%}
 .sa-insights-v2 .sa-photo-modal{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:grid;place-items:center;padding:30px;cursor:zoom-out}
 .sa-insights-v2 .sa-photo-modal img{max-width:92vw;max-height:86vh;object-fit:contain}
 .sa-insights-v2 .sa-photo-close{position:absolute;right:22px;top:18px;background:white;border:0;padding:10px 14px;cursor:pointer}

 @media(max-width:540px){.sa-insights-v2 .sa-review-card{width:260px;flex-basis:260px;padding:17px}}
 @media(prefers-reduced-motion:reduce){.sa-insights-v2 .sa-review-grid{animation:none!important}.sa-insights-v2 .sa-review-viewport{overflow-x:auto}}
 `}</style>
 {(reviewCount>0||error)&&<section className="sa-section" aria-label="Customer reviews">
  <div className="sa-section-head"><div><p className="sa-kicker">From our customers</p><h2>Customer Reviews</h2></div>{reviewCount>0&&<span className="sa-stars" aria-label="Customer star ratings">★★★★★</span>}</div>
  {error&&<p role="status">{error}</p>}
  <div className="sa-review-viewport" onMouseEnter={()=>setReviewPaused(true)} onMouseLeave={()=>setReviewPaused(false)} onFocusCapture={()=>setReviewPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setReviewPaused(false)}} onTouchStart={()=>setReviewPaused(true)} onTouchEnd={()=>setReviewPaused(false)}>
  <div className={'sa-review-grid'+(reviewCount<2?' sa-still':'')+((reviewPaused||anyReviewExpanded||photoPreview)?' sa-paused':'')} style={{'--sa-duration':`${Math.max(1,reviewCount)*5}s`}}>{shownReviews.map((r,i)=><article key={`${r.id}-${i}`} className="sa-review-card" aria-hidden={i>=reviewCount?'true':undefined}>
   <div className="sa-review-head"><div className="sa-avatar">{r.avatar_url?<img src={r.avatar_url} alt="" loading="lazy"/>:(r.customer_name||'C').charAt(0).toUpperCase()}</div><div><div className="sa-name">{r.customer_name}</div><div className="sa-stars" aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(Math.max(0,Math.min(5,r.rating)))}{'☆'.repeat(Math.max(0,5-r.rating))}</div></div></div>
   <div><p className={'sa-review-text'+(expandedReviews[r.id]?'':' sa-clamp')}>{r.review_text}</p>{(r.review_text||'').length>110&&<button type="button" className="sa-expand" aria-expanded={!!expandedReviews[r.id]} tabIndex={i>=reviewCount?-1:0} onClick={()=>toggleReview(r.id)}>{expandedReviews[r.id]?'Show less':'Read more'}</button>}</div>
   {(photos[r.id]||[]).length>0&&<div className="sa-review-photos">{photos[r.id].map((url,i)=><button className="sa-photo-button" type="button" key={i} tabIndex={i>=reviewCount?-1:0} onClick={()=>setPhotoPreview(url)} aria-label={`Open customer product photo ${i+1}`}><img src={url} alt={`Customer product photo ${i+1}`} loading="lazy"/></button>)}</div>}
  </article>)}</div></div>
  {reviewCount>0&&<div className="sa-foot"><span>{reviewCount>=100?'99+':reviewCount} customer {reviewCount===1?'review':'reviews'} · Scrolls right to left · 5 seconds per card</span></div>}
 </section>}
 {cards.length>0&&<section className="sa-section sa-experience" aria-label="Fragrance experience">
  <div className="sa-section-head"><div><p className="sa-kicker">Discover the scent</p><h2>Fragrance Experience</h2></div></div>
  <p className={'sa-experience-text'+(expandedCards[card.id]?'':' sa-clamp')}>{card.content}</p>
  {(card.content||'').length>110&&<button className="sa-expand" type="button" aria-expanded={!!expandedCards[card.id]} onClick={()=>toggleCard(card.id)}>{expandedCards[card.id]?'Show less':'Read more'}</button>}
  <div className="sa-foot"><span>{cardIndex+1} / {cards.length} · Fragrance notes &amp; impressions · Rotates every 5 seconds</span>{cards.length>1&&<div className="sa-nav"><button type="button" aria-label="Previous experience" onClick={()=>setCardIndex(i=>(i-1+cards.length)%cards.length)}><ChevronLeft size={16}/></button><button type="button" aria-label="Next experience" onClick={()=>setCardIndex(i=>(i+1)%cards.length)}><ChevronRight size={16}/></button></div>}</div>
 </section>}
 {photoPreview&&<div className="sa-photo-modal" role="dialog" aria-modal="true" aria-label="Customer product photo" onClick={()=>setPhotoPreview(null)}><button type="button" className="sa-photo-close" onClick={()=>setPhotoPreview(null)}>Close ×</button><img src={photoPreview} alt="Customer product photo enlarged"/></div>}
 </div>;
}

function Detail({products,add}){
 const {id}=useParams(),p=products.find(x=>x.id===id);
 const [added,setAdded]=useState(false);
 useEffect(()=>setAdded(false),[id]);
 useEffect(()=>{if(p)trackEvent('ViewContent',productEvent(p))},[p?.id]);
 if(!p)return <main className="wrap section"><h1>Product not found</h1><Link to="/shop">Browse fragrances</Link></main>;
 const noteGroups=[['Top notes',p.top_notes],['Heart notes',p.heart_notes],['Base notes',p.base_notes]].filter(([,v])=>v);
 return <main className="wrap section luxury-detail-page">
   <Link className="back" to="/shop"><ChevronLeft size={17}/> Back to collection</Link>
   <div className="detail luxury-detail">
     <Gallery p={p} detail/>
     <div className="detailinfo luxury-detailinfo">
       <p className="eyebrow">{p.category.toUpperCase()}</p>
       <h1>{p.name}</h1>
       <div className="luxury-price"><strong>{money(p.price)}</strong>{Number(p.compare_at_price)>Number(p.price)&&<del>{money(p.compare_at_price)}</del>}</div>
       <p className="luxury-spec">{p.concentration||'Fragrance'} <span>·</span> {p.volume}</p>
       {p.description&&<section className="luxury-section"><h2>The fragrance</h2><p className="luxury-description">{p.description}</p></section>}
       {noteGroups.length>0&&<section className="luxury-section"><h2>Fragrance notes</h2><div className="luxury-notes">{noteGroups.map(([title,value])=><div key={title}><h3>{title}</h3><p>{value}</p></div>)}</div></section>}
       {(p.fragrance_family||p.gender||p.brand_country)&&<div className="luxury-facts">{p.fragrance_family&&<div><b>Family</b><span>{p.fragrance_family}</span></div>}{p.gender&&<div><b>Audience</b><span>{p.gender}</span></div>}{p.brand_country&&<div><b>Origin</b><span>{p.brand_country}</span></div>}</div>}
       {p.notes&&<p className="muted luxury-extra">{p.notes}</p>}
       <p className="luxury-stock">{p.stock>0?`${p.stock} available`:'Out of stock'}</p>
       <button className="btn dark wide" disabled={p.stock<=0} onClick={()=>{add(p);setAdded(true)}}>{added?'Added to bag ✓':'Add to bag'} <ShoppingBag size={18}/></button>
       <p className="muted fine">Availability, shipping and final pricing are confirmed with our team on WhatsApp.</p>
     </div>
   </div>
   <ProductInsights productId={p.id}/>
 </main>
}
function Cart({items,change}){const total=items.reduce((s,x)=>s+x.qty*x.product.price,0);return <main className="wrap section"><p className="eyebrow">YOUR SELECTION</p><h1 className="pagetitle">Shopping bag</h1>{items.length? <div className="cartlayout"><div>{items.map(x=><div className="cartrow" key={x.id}><img src={x.product.image_url||'/placeholder.svg'} alt=""/><div><Link to={'/product/'+x.id}><h3>{x.product.name}</h3></Link><p className="muted">{x.product.volume}</p><div className="quantity"><button onClick={()=>change(x.id,-1)} aria-label="Decrease"><Minus size={15}/></button>{x.qty}<button onClick={()=>change(x.id,1)} aria-label="Increase"><Plus size={15}/></button></div></div><strong>{money(x.product.price*x.qty)}</strong></div>)}</div><aside className="summary"><h3>Order summary</h3><div className="summaryline"><span>Subtotal</span><strong>{money(total)}</strong></div><p className="muted fine">Shipping, availability and final total are confirmed on WhatsApp.</p><Link className="btn dark wide" to="/checkout">Order via WhatsApp <ArrowRight size={16}/></Link><Link to="/shop" className="underlink">Continue shopping</Link></aside></div>:<div className="empty"><ShoppingBag size={42}/><h2>Your bag is empty</h2><p>Find something you'll love.</p><Link className="btn dark" to="/shop">Explore fragrances <ArrowRight size={16}/></Link></div>}</main>}

function WhatsAppCheckout({items,routing}){
  const checkoutTracked=useRef(false);
  useEffect(()=>{if(!checkoutTracked.current&&items.length){checkoutTracked.current=true;trackEvent('InitiateCheckout',cartEvent(items))}},[items]);
  const [assignedAccount,setAssignedAccount]=useState(null);
  const total=items.reduce((sum,x)=>sum+x.qty*Number(x.product.price),0);
  const message=['Hello SCENT ATELIER!','', 'I would like to enquire about ordering these fragrances:', '',...items.map((x,i)=>`${i+1}. ${x.product.name}${x.product.volume?' ('+x.product.volume+')':''}\n   Quantity: ${x.qty}\n   Listed price: ${money(x.product.price)} each\n   Line subtotal: ${money(x.qty*Number(x.product.price))}`),'',`Listed subtotal: ${money(total)}`,'','Please confirm availability, shipping costs, final total, and how to complete my purchase. Thank you!'].join('\n');
  // Pick once per checkout visit, keeping repeat clicks on the same account.
  useEffect(()=>{
    if(routing.mode!=='random'||routing.loading||routing.error){setAssignedAccount(null);return}
    setAssignedAccount(previous=>{
      const enabled=routing.accounts||[];
      if(previous&&enabled.some(a=>a.id===previous.id))return previous;
      if(!enabled.length)return null;
      const random=new Uint32Array(1);
      crypto.getRandomValues(random);
      return enabled[random[0]%enabled.length];
    });
  },[routing.mode,routing.loading,routing.error,routing.accounts]);
  let whatsappUrl=null;
  let displayedContact=whatsappDisplay(routing);
  if(!routing.loading&&!routing.error){
    if(routing.mode==='fixed'&&isValidWhatsAppNumber(routing.fixed_number)){
      whatsappUrl='https://wa.me/'+cleanWhatsAppNumber(routing.fixed_number)+'?text='+encodeURIComponent(message);
    }else if(routing.mode==='random'&&assignedAccount){
      whatsappUrl='https://wa.me/'+cleanWhatsAppNumber(assignedAccount.phone_number)+'?text='+encodeURIComponent(message);
      displayedContact='+'+cleanWhatsAppNumber(assignedAccount.phone_number);
    }else if(routing.mode==='external'){
      whatsappUrl=safeExternalWhatsAppUrl(routing.external_url,message);
    }
  }
 if(!items.length)return <main className="wrap section"><h1 className="pagetitle">Your bag is empty</h1><Link className="btn dark" to="/shop">Continue shopping</Link></main>;
 return <main className="wrap section checkoutpage"><p className="eyebrow">SCENT ATELIER · PERSONAL ORDERING</p><h1 className="pagetitle">Complete your enquiry</h1><div className="cartlayout"><section className="panel wa-order-panel"><h2>Order personally via WhatsApp</h2><p>Review your selection, then contact our team in one click. Your selected fragrances and quantities will be included automatically in the message.</p><p className="muted fine">No payment is collected on this website. Product availability, delivery costs, final pricing and payment arrangements will be confirmed with you directly.</p>{whatsappUrl?<a className="btn dark wide" href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={()=>trackEvent('Contact',{...cartEvent(items),contact_method:'WhatsApp',contact_context:'checkout'})}>Order via WhatsApp <ArrowRight size={17}/></a>:<button className="btn dark wide" type="button" disabled>Order via WhatsApp <ArrowRight size={17}/></button>}{!whatsappUrl&&<p className="error">{routing.error|| (routing.loading?"Loading WhatsApp contact details…":"No valid WhatsApp destination is configured. Please contact our team.")}</p>}<p className="muted fine">WhatsApp: {displayedContact}</p><Link to="/cart" className="underlink">← Back to shopping bag</Link></section><aside className="summary"><h3>Your selection</h3>{items.map(x=><div className="summaryline" key={x.id}><span>{x.product.name} × {x.qty}</span><strong>{money(x.qty*Number(x.product.price))}</strong></div>)}<div className="summaryline"><span>Listed subtotal</span><strong>{money(total)}</strong></div><p className="muted fine">Shipping and taxes are not included. This is an enquiry, not a paid order.</p></aside></div></main>;
}
async function orderRequest(id,token){const r=await fetch('/.netlify/functions/order-status?id='+encodeURIComponent(id),{headers:{'X-Order-Token':token||''}});const data=await r.json();if(!r.ok)throw new Error(data.error||'Order unavailable');return data}
function OrderStatus(){const {id}=useParams();const [order,setOrder]=useState(null),[error,setError]=useState('');const token=sessionStorage.getItem('sa-order-'+id)||'';
 const load=()=>orderRequest(id,token).then(setOrder).catch(e=>setError(e.message));useEffect(()=>{load()},[id]);
 return <main className="wrap section"><p className="eyebrow">TEST ORDER · NO REAL PAYMENT</p><h1 className="pagetitle">Order status</h1>{error&&<p className="error">{error}</p>}{order&&<div className="panel"><p><b>Order:</b> {order.order_number}</p><p><b>Status:</b> {order.status}</p><p><b>Subtotal:</b> {money(order.subtotal)}</p><p className="muted">Payment gateway is not connected. This order is NOT paid. Shipping and tax are not finalized.</p><Link className="btn dark" to={'/payment-demo/'+id}>View simulated payment page</Link> <button className="btn outline" onClick={load}>Refresh status</button></div>}</main>}
function DemoGateway(){const {id}=useParams();const navigate=useNavigate();return <main className="wrap section"><p className="eyebrow">SANDBOX · SIMULATION ONLY</p><h1 className="pagetitle">Payment gateway preview</h1><div className="panel"><h2>Third-party hosted checkout placeholder</h2><p className="muted">This is a visual simulation. No card details are collected, no payment is sent, and no order is marked as paid.</p><button className="btn dark" onClick={()=>navigate('/order/'+id)}>Return to order status</button></div></main>}
createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
