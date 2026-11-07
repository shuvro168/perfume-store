import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Link,useParams,useNavigate} from 'react-router-dom';
import {ShoppingBag,Menu,X,ArrowRight,Plus,Minus,Trash2,Lock,LogOut,Package,ChevronLeft,ChevronRight} from 'lucide-react';
import {supabase} from './supabase';
import {demoProducts,money} from './data';
import './style.css';

function App(){
 const [products,setProducts]=useState(demoProducts),[cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('aura-cart')||'[]')}catch{return []}}),[menu,setMenu]=useState(false),[loading,setLoading]=useState(!!supabase);
 const refresh=async()=>{if(!supabase)return;setLoading(true);const {data,error}=await supabase.from('products').select('*').eq('active',true).order('created_at',{ascending:false});if(!error)setProducts(data||[]);else console.error(error);setLoading(false)};
 useEffect(()=>{refresh()},[]);
 useEffect(()=>localStorage.setItem('aura-cart',JSON.stringify(cart)),[cart]);
 const add=(product)=>{if(product.stock<=0)return;setCart(prev=>{const found=prev.find(x=>x.id===product.id);return found?prev.map(x=>x.id===product.id?{...x,qty:Math.min(x.qty+1,product.stock)}:x):[...prev,{id:product.id,qty:1}]})};
 const change=(id,delta)=>setCart(prev=>prev.map(x=>x.id===id?{...x,qty:Math.max(0,Math.min(x.qty+delta,products.find(p=>p.id===id)?.stock||0))}:x).filter(x=>x.qty>0));
 const items=cart.map(x=>({...x,product:products.find(p=>p.id===x.id)})).filter(x=>x.product&&x.product.active&&x.product.stock>0);
 const count=items.reduce((s,x)=>s+x.qty,0);
 return <><header className="header"><div className="topline">FRAGRANCE COLLECTION · ORDER ENQUIRIES VIA WHATSAPP</div><div className="nav wrap"><button className="icon mobile" aria-label="Toggle menu" onClick={()=>setMenu(!menu)}><Menu size={22}/></button><Link className="brand" to="/">SCENT <span>ATELIER</span></Link><nav className={menu?'open':''}><Link onClick={()=>setMenu(false)} to="/">Home</Link><Link onClick={()=>setMenu(false)} to="/shop">Shop All</Link><Link onClick={()=>setMenu(false)} to="/shop?category=Chanel">Chanel</Link><Link onClick={()=>setMenu(false)} to="/shop?category=Dior">Dior</Link><Link onClick={()=>setMenu(false)} to="/admin">Admin</Link></nav><Link to="/cart" className="bag"><ShoppingBag size={21}/><span>{count}</span></Link></div></header>
 <Routes><Route path="/" element={<Home products={products} loading={loading} add={add}/>}/><Route path="/shop" element={<Shop products={products} add={add}/>}/><Route path="/product/:id" element={<Detail products={products} add={add}/>}/><Route path="/cart" element={<Cart items={items} change={change}/>}/><Route path="/checkout" element={<WhatsAppCheckout items={items}/>}/><Route path="/admin" element={<Admin refresh={refresh}/>}/><Route path="*" element={<section className="wrap section"><h1>Page not found</h1><Link to="/">Return home</Link></section>}/></Routes>
 <footer><div className="wrap footergrid"><div><Link className="brand" to="/">SCENT <span>ATELIER</span></Link><p>Designer fragrances, curated in one place.</p></div><div><b>Explore</b><Link to="/shop">All fragrances</Link><Link to="/cart">Your bag</Link></div><div><b>Information</b><p>Orders: WhatsApp +852 6265 9737</p><p>Shipping and returns policies coming soon.</p></div></div><div className="wrap footnote">© {new Date().getFullYear()} SCENT ATELIER · Orders are confirmed personally via WhatsApp. No online payments are collected.</div></footer></>;
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
        onClick={()=>{if(detail&&!ignoreClick.current)setZoom(true)}}/>
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
function ProductCard({p,add}){return <article className="product"><Gallery p={p}/><div className="productmeta"><span>{p.category} · {p.volume}</span><Link to={'/product/'+p.id}><h3>{p.name}</h3></Link><div className="productbottom"><strong>{money(p.price)}</strong><button disabled={p.stock<=0} onClick={()=>add(p)} className="smalladd" aria-label={'Add '+p.name+' to bag'}><Plus size={18}/></button></div></div></article>}
function Home({products,loading,add}){return <><section className="hero"><div className="heroimage"/><div className="wrap heroinside"><div className="herotext"><p className="eyebrow">DESIGNER FRAGRANCES</p><h1>Discover<br/>your next<br/><em>signature scent.</em></h1><p>Explore a curated selection of fragrances from iconic houses. All listed at $49, with availability confirmed before checkout.</p><Link className="btn dark" to="/shop">Explore the collection <ArrowRight size={17}/></Link></div></div></section><section className="wrap section"><div className="sectionheading"><div><p className="eyebrow">CURATED FOR YOU</p><h2>Featured fragrances</h2></div><Link className="underlink" to="/shop">View all fragrances <ArrowRight size={17}/></Link></div><div className="products">{products.filter(p=>p.featured).slice(0,4).map(p=><ProductCard key={p.id} p={p} add={add}/>)}</div>{loading&&<p>Loading products…</p>}</section><section className="statement"><p className="eyebrow">THE COLLECTION</p><h2>Many houses.<br/><em>One destination.</em></h2><p>Discover a growing selection of designer and niche fragrances.</p></section></>}
function Shop({products,add}){const initial=new URLSearchParams(window.location.search).get('category')||'All';const [category,setCategory]=useState(initial);useEffect(()=>setCategory(new URLSearchParams(window.location.search).get('category')||'All'),[window.location.search]);const categories=['All',...new Set(products.map(p=>p.category))];return <main className="wrap section"><p className="eyebrow">DISCOVER YOUR SIGNATURE</p><h1 className="pagetitle">The collection</h1><p className="muted">Discover fragrances by brand. Product sizes and availability are being verified.</p><div className="filters">{categories.map(c=><button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="products">{products.filter(p=>category==='All'||p.category===category).map(p=><ProductCard key={p.id} p={p} add={add}/>)}</div>{!products.length&&<p>No products yet.</p>}</main>}
function Detail({products,add}){
 const {id}=useParams(),p=products.find(x=>x.id===id);
 const [added,setAdded]=useState(false);
 useEffect(()=>setAdded(false),[id]);
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
 </main>
}
function Cart({items,change}){const total=items.reduce((s,x)=>s+x.qty*x.product.price,0);return <main className="wrap section"><p className="eyebrow">YOUR SELECTION</p><h1 className="pagetitle">Shopping bag</h1>{items.length? <div className="cartlayout"><div>{items.map(x=><div className="cartrow" key={x.id}><img src={x.product.image_url||'/placeholder.svg'} alt=""/><div><Link to={'/product/'+x.id}><h3>{x.product.name}</h3></Link><p className="muted">{x.product.volume}</p><div className="quantity"><button onClick={()=>change(x.id,-1)} aria-label="Decrease"><Minus size={15}/></button>{x.qty}<button onClick={()=>change(x.id,1)} aria-label="Increase"><Plus size={15}/></button></div></div><strong>{money(x.product.price*x.qty)}</strong></div>)}</div><aside className="summary"><h3>Order summary</h3><div className="summaryline"><span>Subtotal</span><strong>{money(total)}</strong></div><p className="muted fine">Shipping, availability and final total are confirmed on WhatsApp.</p><Link className="btn dark wide" to="/checkout">Order via WhatsApp <ArrowRight size={16}/></Link><Link to="/shop" className="underlink">Continue shopping</Link></aside></div>:<div className="empty"><ShoppingBag size={42}/><h2>Your bag is empty</h2><p>Find something you'll love.</p><Link className="btn dark" to="/shop">Explore fragrances <ArrowRight size={16}/></Link></div>}</main>}

// Smart Product Import: parses JSON or labelled multiline text, without external services.
const IMPORT_KEYS={
 'product name':'name','name':'name','title':'name','brand':'category','category':'category',
 'volume':'volume','size':'volume','price':'price','price (usd)':'price','stock':'stock','inventory':'stock',
 'sku':'sku','barcode':'barcode','brand country':'brand_country','country of origin':'brand_country',
 'concentration':'concentration','gender':'gender','gender / audience':'gender','fragrance family':'fragrance_family',
 'top notes':'top_notes','heart notes':'heart_notes','middle notes':'heart_notes','base notes':'base_notes',
 'fragrance notes':'notes','notes':'notes','description':'description','product description':'description',
 'seo title':'seo_title','seo description':'seo_description','compare-at price':'compare_at_price',
 'compare-at price (usd)':'compare_at_price','availability status':'product_status',
 'image url':'image_url','image urls':'images','images':'images','published':'active','featured':'featured'
};
function parseProductImport(raw){
 const text=raw.trim();if(!text)throw new Error('Paste product information first.');
 let input;
 if(text.startsWith('{')){try{input=JSON.parse(text)}catch{throw new Error('Invalid JSON. Check quotation marks and commas.')}}
 else{
  input={};let last=null;
  for(const line of text.split(/\r?\n/)){
   const m=line.match(/^\s*(?:[-*]\s*)?([^:：]{2,55})\s*[:：]\s*(.*)$/);
   if(m){const key=m[1].replace(/\*\*/g,'').trim();const val=m[2].trim();if(IMPORT_KEYS[key.toLowerCase()]||Object.values(IMPORT_KEYS).includes(key)){input[key]=val;last=key}else last=null}
   else if(last&&line.trim())input[last]+='\n'+line.trim();
  }
 }
 if(!input||Array.isArray(input)||typeof input!=='object')throw new Error('Expected one product object.');
 const result={};
 for(const [rawKey,value] of Object.entries(input)){
  const key=IMPORT_KEYS[rawKey.toLowerCase().trim()]|| (Object.values(IMPORT_KEYS).includes(rawKey)?rawKey:null);
  if(!key||value===null||value===undefined||value==='')continue;
  if(key==='images'){
   const urls=Array.isArray(value)?value:String(value).split(/[\n,]+/);
   result.images=urls.map(v=>String(v).trim()).filter(v=>/^https?:\/\//i.test(v)).slice(0,8);
  }else if(key==='active'||key==='featured')result[key]=value===true||String(value).toLowerCase()==='true'||String(value).toLowerCase()==='yes';
  else if(key==='price'||key==='compare_at_price')result[key]=String(value).replace(/[$,]/g,'').trim();
  else if(key==='stock')result[key]=String(value).trim();
  else result[key]=String(value).trim();
 }
 if(result.image_url&&/^https?:\/\//i.test(result.image_url))result.images=[...new Set([result.image_url,...(result.images||[])])].slice(0,8);
 if(result.images?.length)result.image_url=result.images[0];
 if(!Object.keys(result).length)throw new Error('No matching fields found. Use labels like Product name: and Brand:.');
 if(result.price!==undefined&&(!Number.isFinite(Number(result.price))||Number(result.price)<0))throw new Error('Price must be a valid non-negative number.');
 if(result.stock!==undefined&&(!Number.isInteger(Number(result.stock))||Number(result.stock)<0))throw new Error('Stock must be a non-negative whole number.');
 return result;
}

const WHATSAPP_NUMBER='85262659737';
function WhatsAppCheckout({items}){
 const total=items.reduce((sum,x)=>sum+x.qty*Number(x.product.price),0);
 const message=['Hello SCENT ATELIER!','', 'I would like to enquire about ordering these fragrances:', '',...items.map((x,i)=>`${i+1}. ${x.product.name}${x.product.volume?' ('+x.product.volume+')':''}\n   Quantity: ${x.qty}\n   Listed price: ${money(x.product.price)} each\n   Line subtotal: ${money(x.qty*Number(x.product.price))}`),'',`Listed subtotal: ${money(total)}`,'','Please confirm availability, shipping costs, final total, and how to complete my purchase. Thank you!'].join('\n');
 const whatsappUrl='https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent(message);
 if(!items.length)return <main className="wrap section"><h1 className="pagetitle">Your bag is empty</h1><Link className="btn dark" to="/shop">Continue shopping</Link></main>;
 return <main className="wrap section checkoutpage"><p className="eyebrow">SCENT ATELIER · PERSONAL ORDERING</p><h1 className="pagetitle">Complete your enquiry</h1><div className="cartlayout"><section className="panel wa-order-panel"><h2>Order personally via WhatsApp</h2><p>Review your selection, then contact our team in one click. Your selected fragrances and quantities will be included automatically in the message.</p><p className="muted fine">No payment is collected on this website. Product availability, delivery costs, final pricing and payment arrangements will be confirmed with you directly.</p><a className="btn dark wide" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Order via WhatsApp <ArrowRight size={17}/></a><p className="muted fine">WhatsApp: +852 6265 9737</p><Link to="/cart" className="underlink">← Back to shopping bag</Link></section><aside className="summary"><h3>Your selection</h3>{items.map(x=><div className="summaryline" key={x.id}><span>{x.product.name} × {x.qty}</span><strong>{money(x.qty*Number(x.product.price))}</strong></div>)}<div className="summaryline"><span>Listed subtotal</span><strong>{money(total)}</strong></div><p className="muted fine">Shipping and taxes are not included. This is an enquiry, not a paid order.</p></aside></div></main>;
}
async function orderRequest(id,token){const r=await fetch('/.netlify/functions/order-status?id='+encodeURIComponent(id),{headers:{'X-Order-Token':token||''}});const data=await r.json();if(!r.ok)throw new Error(data.error||'Order unavailable');return data}
function OrderStatus(){const {id}=useParams();const [order,setOrder]=useState(null),[error,setError]=useState('');const token=sessionStorage.getItem('sa-order-'+id)||'';
 const load=()=>orderRequest(id,token).then(setOrder).catch(e=>setError(e.message));useEffect(()=>{load()},[id]);
 return <main className="wrap section"><p className="eyebrow">TEST ORDER · NO REAL PAYMENT</p><h1 className="pagetitle">Order status</h1>{error&&<p className="error">{error}</p>}{order&&<div className="panel"><p><b>Order:</b> {order.order_number}</p><p><b>Status:</b> {order.status}</p><p><b>Subtotal:</b> {money(order.subtotal)}</p><p className="muted">Payment gateway is not connected. This order is NOT paid. Shipping and tax are not finalized.</p><Link className="btn dark" to={'/payment-demo/'+id}>View simulated payment page</Link> <button className="btn outline" onClick={load}>Refresh status</button></div>}</main>}
function DemoGateway(){const {id}=useParams();const navigate=useNavigate();return <main className="wrap section"><p className="eyebrow">SANDBOX · SIMULATION ONLY</p><h1 className="pagetitle">Payment gateway preview</h1><div className="panel"><h2>Third-party hosted checkout placeholder</h2><p className="muted">This is a visual simulation. No card details are collected, no payment is sent, and no order is marked as paid.</p><button className="btn dark" onClick={()=>navigate('/order/'+id)}>Return to order status</button></div></main>}
function AdminOrders(){const [orders,setOrders]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(true);const load=async()=>{setBusy(true);try{if(!supabase)throw new Error('Supabase is not configured');const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error('Sign in at /admin first');const r=await fetch('/.netlify/functions/admin-orders',{headers:{Authorization:'Bearer '+session.access_token}});const d=await r.json();if(!r.ok)throw new Error(d.error);setOrders(d.orders)}catch(e){setError(e.message)}finally{setBusy(false)}};useEffect(()=>{load()},[]);return <main className="wrap section"><p className="eyebrow">ADMIN · TEST ORDERS</p><h1 className="pagetitle">Order management</h1><p className="muted">Read-only order list. No manual paid confirmation is enabled without a verified provider transaction.</p><button className="btn outline" onClick={load}>Refresh orders</button>{busy&&<p>Loading…</p>}{error&&<p className="error">{error}</p>}{orders.map(o=><div className="panel" key={o.id}><strong>{o.order_number}</strong><p>{o.status} · {money(o.subtotal)} · {new Date(o.created_at).toLocaleString()}</p><p className="muted">{o.customer_email}</p></div>)}</main>}
function Admin({refresh}){const [session,setSession]=useState(null),[authorized,setAuthorized]=useState(false),[busy,setBusy]=useState(true),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[products,setProducts]=useState([]),[editing,setEditing]=useState(null),[saving,setSaving]=useState(false),[files,setFiles]=useState([]);const blank={name:'',category:'',price:'49',volume:'',notes:'',description:'',image_url:'',images:[],stock:0,active:true,featured:false,sku:'',concentration:'',gender:'',fragrance_family:'',top_notes:'',heart_notes:'',base_notes:'',brand_country:'',barcode:'',compare_at_price:'',product_status:'in_stock',seo_title:'',seo_description:''};const [form,setForm]=useState(blank);const [importText,setImportText]=useState(''),[importPreview,setImportPreview]=useState(null),[importError,setImportError]=useState('');
 const check=async(s)=>{setSession(s);setAuthorized(false);if(!s){setBusy(false);return}const {data,error}=await supabase.from('admins').select('user_id').eq('user_id',s.user.id).maybeSingle();setAuthorized(!error&&!!data);setBusy(false)};
 useEffect(()=>{if(!supabase){setBusy(false);return}supabase.auth.getSession().then(({data})=>check(data.session));const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>{check(s)});return()=>subscription.unsubscribe()},[]);
 const load=async()=>{const {data,error}=await supabase.from('products').select('*').order('created_at',{ascending:false});if(error)setError(error.message);else setProducts(data||[])};
 useEffect(()=>{if(authorized)load()},[authorized]);
 const login=async(e)=>{e.preventDefault();setError('');setBusy(true);const {error}=await supabase.auth.signInWithPassword({email,password});if(error){setError(error.message);setBusy(false)}};
 const logout=async()=>{await supabase.auth.signOut();setAuthorized(false);setSession(null)};
  const save=async(e)=>{e.preventDefault();setError('');setSaving(true);try{let images=[...(form.images||[])];if(!images.length&&form.image_url)images=[form.image_url];if(images.length+files.length>8)throw new Error('Maximum 8 images per product.');for(const file of files){if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)||file.size>5*1024*1024)throw new Error('Each image must be JPG, PNG, WebP or GIF, under 5 MB.');const ext=file.name.split('.').pop().toLowerCase();const path=`${crypto.randomUUID()}.${ext}`;const {error:uploadError}=await supabase.storage.from('product-images').upload(path,file,{contentType:file.type});if(uploadError)throw uploadError;images.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl)}const payload={...form,images,image_url:images[0]||'',price:Number(form.price),stock:Number(form.stock),compare_at_price:form.compare_at_price===''?null:Number(form.compare_at_price),sku:form.sku.trim()||null};if(!payload.name||!Number.isFinite(payload.price)||payload.price<0||(payload.compare_at_price!==null&&(!Number.isFinite(payload.compare_at_price)||payload.compare_at_price<0))||!Number.isInteger(payload.stock)||payload.stock<0)throw new Error('Check name, price and stock.');const {error:dbError}=editing?await supabase.from('products').update(payload).eq('id',editing):await supabase.from('products').insert(payload);if(dbError)throw dbError;setEditing(null);setForm(blank);setFiles([]);await load();await refresh()}catch(e){setError(e.message)}finally{setSaving(false)}};
  const edit=(p)=>{setEditing(p.id);setForm({name:p.name,category:p.category,price:p.price,volume:p.volume,notes:p.notes||'',description:p.description||'',image_url:p.image_url||'',images:galleryImages(p),stock:p.stock,active:p.active,featured:p.featured,sku:p.sku||'',concentration:p.concentration||'',gender:p.gender||'',fragrance_family:p.fragrance_family||'',top_notes:p.top_notes||'',heart_notes:p.heart_notes||'',base_notes:p.base_notes||'',brand_country:p.brand_country||'',barcode:p.barcode||'',compare_at_price:p.compare_at_price??'',product_status:p.product_status||'in_stock',seo_title:p.seo_title||'',seo_description:p.seo_description||''});setFiles([]);window.scrollTo({top:0,behavior:'smooth'})};
  const previewImport=()=>{try{setImportPreview(parseProductImport(importText));setImportError('')}catch(e){setImportPreview(null);setImportError(e.message)}};
 const applyImport=()=>{if(!importPreview)return;setForm(prev=>({...prev,...importPreview,active:editing?prev.active:false,featured:editing?prev.featured:false}));setImportPreview(null);setImportError('');};
 const moveImage=(i,d)=>{const next=[...(form.images||[])];const j=i+d;if(j<0||j>=next.length)return;[next[i],next[j]]=[next[j],next[i]];setForm({...form,images:next,image_url:next[0]||''})};
 const remove=async(p)=>{if(!window.confirm(`Delete ${p.name}?`))return;const {error}=await supabase.from('products').delete().eq('id',p.id);if(error)setError(error.message);else{await load();await refresh()}};
 if(!supabase)return <main className="wrap section admin"><Lock/><h1>Admin setup required</h1><p>Storefront demo mode is active. Configure Supabase environment variables and run the SQL setup to enable the admin dashboard.</p><p>See README.md in the project.</p></main>;
 if(busy)return <main className="wrap section">Checking administrator access…</main>;
 if(!session)return <main className="wrap section admin"><Lock size={30}/><h1>Administrator login</h1><p className="muted">Authorized store managers only.</p><form className="adminform" onSubmit={login}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn dark wide">Sign in</button></form>{error&&<p className="error">{error}</p>}</main>;
 if(!authorized)return <main className="wrap section admin"><Lock/><h1>Access denied</h1><p>This account is not an administrator.</p><button className="btn dark" onClick={logout}>Sign out</button></main>;
 return <main className="wrap section"><div className="sectionheading"><div><p className="eyebrow">STORE MANAGEMENT</p><h1 className="pagetitle">Products</h1></div><button className="textbutton" onClick={logout}><LogOut size={17}/> Sign out</button></div>{error&&<p className="error">{error}</p>}<div className="adminlayout"><section className="panel"><h2>{editing?'Edit fragrance':'Add a fragrance'}</h2><form className="adminform" onSubmit={save}><div className="smart-import"><h3>Smart Product Import · 一键填充</h3><p className="muted">Paste a full product listing as labelled text or JSON. Preview before applying. This does not save or publish automatically.</p><textarea rows="7" value={importText} onChange={e=>{setImportText(e.target.value);setImportPreview(null)}} placeholder={'Product name: Baccarat Rouge 540 Eau de Parfum\nBrand: Maison Francis Kurkdjian\nVolume: 70 ml\nPrice (USD): 49.00\nStock: 0\nConcentration: Eau de Parfum\nDescription: ...'}/><div className="import-actions"><button type="button" className="btn outline" onClick={previewImport}>Preview import / 预览</button><button type="button" className="btn outline" onClick={()=>{setImportText('');setImportPreview(null);setImportError('')}}>Clear</button></div>{importError&&<p className="error">{importError}</p>}{importPreview&&<div className="import-preview"><p><strong>{Object.keys(importPreview).length} fields recognized.</strong> Review before applying:</p><dl>{Object.entries(importPreview).map(([k,v])=><React.Fragment key={k}><dt>{k}</dt><dd>{Array.isArray(v)?v.join(', '):String(v).slice(0,250)}</dd></React.Fragment>)}</dl><button type="button" className="btn dark wide" onClick={applyImport}>Fill form fields / 填入表单</button></div>}</div><label>Product name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><div className="formtwo"><label>Brand<input required placeholder="e.g. Dior" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label><label>Volume<input required value={form.volume} onChange={e=>setForm({...form,volume:e.target.value})}/></label></div><div className="formtwo"><label>Price (USD)<input type="number" step="0.01" min="0" required value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><label>Stock<input type="number" step="1" min="0" required value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label></div><label>SKU<input value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/></label><label>Barcode (optional)<input value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})}/></label><label>Brand country<input value={form.brand_country} onChange={e=>setForm({...form,brand_country:e.target.value})}/></label><label>Concentration (EDP / EDT / Parfum)<input value={form.concentration} onChange={e=>setForm({...form,concentration:e.target.value})}/></label><label>Gender / audience<input value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}/></label><label>Fragrance family<input value={form.fragrance_family} onChange={e=>setForm({...form,fragrance_family:e.target.value})}/></label><label>Top notes<input value={form.top_notes} onChange={e=>setForm({...form,top_notes:e.target.value})}/></label><label>Heart notes<input value={form.heart_notes} onChange={e=>setForm({...form,heart_notes:e.target.value})}/></label><label>Base notes<input value={form.base_notes} onChange={e=>setForm({...form,base_notes:e.target.value})}/></label><label>SEO title<input value={form.seo_title} onChange={e=>setForm({...form,seo_title:e.target.value})}/></label><label>Compare-at price (USD, optional)<input type="number" min="0" step="0.01" value={form.compare_at_price} onChange={e=>setForm({...form,compare_at_price:e.target.value})}/></label><label>Availability status<select value={form.product_status} onChange={e=>setForm({...form,product_status:e.target.value})}><option value="in_stock">In stock</option><option value="out_of_stock">Out of stock</option><option value="preorder">Preorder</option></select></label><label>SEO description<textarea rows="3" value={form.seo_description} onChange={e=>setForm({...form,seo_description:e.target.value})}/></label><label>Fragrance notes<input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><label>Description<textarea rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label>Image URL (optional, add to gallery)<input type="url" placeholder="https://..." value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value,images:e.target.value?[...new Set([...(form.images||[]),e.target.value])].slice(0,8):(form.images||[])})}/></label><div className="image-manager">{(form.images||[]).map((url,i)=><div className="managed-image" key={i}><img src={url} alt={`Image ${i+1}`}/><div><button type="button" onClick={()=>moveImage(i,-1)} disabled={i===0}>←</button><button type="button" onClick={()=>moveImage(i,1)} disabled={i===form.images.length-1}>→</button><button type="button" onClick={()=>{const images=form.images.filter((_,j)=>j!==i);setForm({...form,images,image_url:images[0]||''})}}>Remove</button></div></div>)}</div><label>Upload additional product images (up to 8 total)<input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setFiles(Array.from(e.target.files||[]))}/></label>{files.length>0&&<p className="muted">{files.length} new image(s) selected</p>}<label className="check"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Published</label><label className="check"><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/> Featured on home</label><button className="btn dark wide" disabled={saving}>{saving?'Saving…':editing?'Save changes':'Create product'}</button>{editing&&<button type="button" className="btn outline wide" onClick={()=>{setEditing(null);setForm(blank);setFiles([])}}>Cancel editing</button>}</form></section><section className="panel"><h2>All products ({products.length})</h2>{products.map(p=><div className="adminproduct" key={p.id}><img src={p.image_url||'/placeholder.svg'} alt=""/><div><b>{p.name}</b><p className="muted fine">{money(p.price)} · Stock {p.stock} · {p.active?'Live':'Draft'}</p><button className="textbutton" onClick={()=>edit(p)}>Edit</button><button className="textbutton danger" onClick={()=>remove(p)}>Delete</button></div></div>)}{!products.length&&<p className="muted">No products yet. Add your first fragrance.</p>}</section></div></main>
}

createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
