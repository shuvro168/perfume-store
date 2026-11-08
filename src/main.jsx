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
       <p className="muted fine">Checkout is not yet enabled. Product details and availability are subject to verification.</p>
     </div>
   </div>
 </main>
}
function Cart({items,change}){const total=items.reduce((s,x)=>s+x.qty*x.product.price,0);return <main className="wrap section"><p className="eyebrow">YOUR SELECTION</p><h1 className="pagetitle">Shopping bag</h1>{items.length? <div className="cartlayout"><div>{items.map(x=><div className="cartrow" key={x.id}><img src={x.product.image_url||'/placeholder.svg'} alt=""/><div><Link to={'/product/'+x.id}><h3>{x.product.name}</h3></Link><p className="muted">{x.product.volume}</p><div className="quantity"><button onClick={()=>change(x.id,-1)} aria-label="Decrease"><Minus size={15}/></button>{x.qty}<button onClick={()=>change(x.id,1)} aria-label="Increase"><Plus size={15}/></button></div></div><strong>{money(x.product.price*x.qty)}</strong></div>)}</div><aside className="summary"><h3>Order summary</h3><div className="summaryline"><span>Subtotal</span><strong>{money(total)}</strong></div><p className="muted fine">Shipping and taxes will be calculated at checkout.</p><button className="btn dark wide" disabled>Checkout coming soon</button><Link to="/shop" className="underlink">Continue shopping</Link></aside></div>:<div className="empty"><ShoppingBag size={42}/><h2>Your bag is empty</h2><p>Find something you'll love.</p><Link className="btn dark" to="/shop">Explore fragrances <ArrowRight size={16}/></Link></div>}</main>}

createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
