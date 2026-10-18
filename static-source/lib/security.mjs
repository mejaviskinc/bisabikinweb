export function safeHttpsUrl(value,allowedOrigins){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return '';if(allowedOrigins&&!allowedOrigins.includes(u.origin))return '';return u.href}catch{return ''}}
function parseList(raw){if(typeof raw!=='string'||raw.length>100000)return [];try{const x=JSON.parse(raw);return Array.isArray(x)?x.slice(0,100):[]}catch{return []}}
export function restoreWishlist(raw,products){const ids=new Set(products.map(p=>p.id));return [...new Set(parseList(raw).filter(x=>typeof x==='string'&&ids.has(x)))]}
export function restoreCart(raw,variants,products){
  const seen=new Set();
  return parseList(raw).flatMap(x=>{
    if(!x||typeof x.variantId!=='string'||x.variantId.length>180||seen.has(x.variantId)||!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>20)return [];
    const v=variants.find(v=>v.id===x.variantId&&v.active&&Number.isSafeInteger(v.price)&&v.price>0&&Number.isInteger(v.stock)&&v.stock>=x.quantity);
    const p=v&&products.find(p=>p.id===v.product_id);
    if(v&&p){seen.add(v.id);return [{variantId:v.id,product:p,price:v.price,color:v.color,size:v.size,quantity:x.quantity}]}
    // If catalog loading failed or stock changed, retain a sanitized display-only copy.
    // Checkout still validates product IDs, price, and stock on the server.
    const cached=x.product&&typeof x.product==='object'?x.product:null;
    const id=typeof cached?.id==='string'?cached.id.trim().slice(0,160):'';
    const name=typeof cached?.name==='string'?cached.name.trim().slice(0,200):'';
    const price=Number(x.price);
    if(!/^[a-zA-Z0-9_-]{1,160}$/.test(id)||!name||!Number.isSafeInteger(price)||price<=0)return [];
    const field=(value,max,fallback='')=>typeof value==='string'?value.slice(0,max):fallback;
    const cachedProduct={
      id,name,collection:field(cached.collection,100,'CORE'),type:field(cached.type,80,'item'),
      color:field(cached.color,80,'Default'),print:field(cached.print,1000),
      description:field(cached.description,2000),image:safeHttpsUrl(cached.image),
      image_url:safeHttpsUrl(cached.image_url),price,badge:field(cached.badge,100),
      material:field(cached.material,1000),care:field(cached.care,1500),
      shipping:field(cached.shipping,1500),returns:field(cached.returns,1500),
      stock:Number.isInteger(cached.stock)&&cached.stock>=0?Math.min(cached.stock,100000):0
    };
    seen.add(x.variantId);
    return [{variantId:x.variantId,product:cachedProduct,price,color:field(x.color,80,cachedProduct.color),size:field(x.size,80,'Standard'),quantity:x.quantity,needsValidation:true}];
  })
}
