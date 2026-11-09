import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Link,useParams,useNavigate} from 'react-router-dom';
import {ShoppingBag,Menu,X,ArrowRight,Plus,Minus,Trash2,Lock,LogOut,Package,ChevronLeft,ChevronRight} from 'lucide-react';
import {supabase} from './supabase';
import {demoProducts,money} from './data';
import './style.css';

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

function App(){
 const whatsappRouting=useWhatsAppRouting();
 const [products,setProducts]=useState(demoProducts),[cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('aura-cart')||'[]')}catch{return []}}),[menu,setMenu]=useState(false),[loading,setLoading]=useState(!!supabase);
 const refresh=async()=>{if(!supabase)return;setLoading(true);const {data,error}=await supabase.from('products').select('*').eq('active',true).order('created_at',{ascending:false});if(!error)setProducts(data||[]);else console.error(error);setLoading(false)};
 useEffect(()=>{refresh()},[]);
 useEffect(()=>localStorage.setItem('aura-cart',JSON.stringify(cart)),[cart]);
 const add=(product)=>{if(product.stock<=0)return;setCart(prev=>{const found=prev.find(x=>x.id===product.id);return found?prev.map(x=>x.id===product.id?{...x,qty:Math.min(x.qty+1,product.stock)}:x):[...prev,{id:product.id,qty:1}]})};
 const change=(id,delta)=>setCart(prev=>prev.map(x=>x.id===id?{...x,qty:Math.max(0,Math.min(x.qty+delta,products.find(p=>p.id===id)?.stock||0))}:x).filter(x=>x.qty>0));
 const items=cart.map(x=>({...x,product:products.find(p=>p.id===x.id)})).filter(x=>x.product&&x.product.active&&x.product.stock>0);
 const count=items.reduce((s,x)=>s+x.qty,0);
 return <><header className="header"><div className="topline">FRAGRANCE COLLECTION · ORDER ENQUIRIES VIA WHATSAPP</div><div className="nav wrap"><button className="icon mobile" aria-label="Toggle menu" onClick={()=>setMenu(!menu)}><Menu size={22}/></button><Link className="brand" to="/">SCENT <span>ATELIER</span></Link><nav className={menu?'open':''}><Link onClick={()=>setMenu(false)} to="/">Home</Link><Link onClick={()=>setMenu(false)} to="/shop">Shop All</Link><Link onClick={()=>setMenu(false)} to="/shop?category=Chanel">Chanel</Link><Link onClick={()=>setMenu(false)} to="/shop?category=Dior">Dior</Link><Link onClick={()=>setMenu(false)} to="/admin">Admin</Link></nav><Link to="/cart" className="bag"><ShoppingBag size={21}/><span>{count}</span></Link></div></header>
 <Routes><Route path="/" element={<Home products={products} loading={loading} add={add}/>}/><Route path="/shop" element={<Shop products={products} add={add}/>}/><Route path="/product/:id" element={<Detail products={products} add={add}/>}/><Route path="/cart" element={<Cart items={items} change={change}/>}/><Route path="/checkout" element={<WhatsAppCheckout items={items} routing={whatsappRouting}/>}/><Route path="/admin" element={<Admin refresh={refresh}/>}/><Route path="*" element={<section className="wrap section"><h1>Page not found</h1><Link to="/">Return home</Link></section>}/></Routes>
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
