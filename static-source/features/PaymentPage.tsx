'use client';
import {useCallback,useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,Clock3,Copy,ExternalLink,LockKeyhole,RefreshCw,ShieldCheck,ShoppingBag,Wallet,AlertCircle} from 'lucide-react';
import {merchOrderStatus} from '../lib/client';
import {money} from '../lib/data';
declare global {interface Window {loadJokulCheckout?:(url:string)=>void}}
function getSavedToken(id:string){try{const p=JSON.parse(localStorage.getItem('bbw_pending_order')||'null');return p?.order_no===id&&/^[a-f0-9]{64}$/.test(p.token||'')?p.token:''}catch{return ''}}
function trustedLink(link:any,env:any){try{const u=new URL(String(link));return u.protocol==='https:'&&!u.username&&!u.password&&(env==='production'?['checkout.doku.com','jokul.doku.com'].includes(u.hostname):u.hostname==='sandbox.doku.com')}catch{return false}}
let loadedScript:Promise<void>|null=null;
function loadDokuScript(env:string){if(window.loadJokulCheckout)return Promise.resolve();if(!loadedScript){loadedScript=new Promise<void>((yes,no)=>{const script=document.createElement('script');script.async=true;script.src=env==='production'?'https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js':'https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js';script.onload=()=>window.loadJokulCheckout?yes():no(new Error('Modul DOKU tidak tersedia.'));script.onerror=()=>no(new Error('Gagal memuat layanan pembayaran DOKU.'));document.head.appendChild(script)}).catch(e=>{loadedScript=null;throw e})}return loadedScript}
export default function PaymentPage(){
 const [id,setId]=useState(''),[token,setToken]=useState(''),[entered,setEntered]=useState('');
 const [order,setOrder]=useState<any>(null),[busy,setBusy]=useState(true),[payBusy,setPayBusy]=useState(false);
 const [error,setError]=useState(''),[now,setNow]=useState(Date.now()),[copied,setCopied]=useState(false);
 const load=useCallback(async(orderNo:string,secret:string,quiet=false)=>{
  if(!orderNo||!/^[a-f0-9]{64}$/.test(secret))return;
  if(!quiet)setBusy(true);
  try{const r=await merchOrderStatus(orderNo,secret);if(r?.order?.order_no!==orderNo)throw new Error('Nomor pesanan tidak cocok.');setOrder(r.order);setError('');if(r.order.payment_status==='paid'){try{localStorage.removeItem('bbw_cart');localStorage.removeItem('bbw_checkout_token_v2')}catch{}}}
  catch(e:any){if(!quiet)setOrder(null);setError(String(e?.message||'Gagal memeriksa status pembayaran.'))}
  finally{if(!quiet)setBusy(false)}
 },[]);
 useEffect(()=>{const no=new URLSearchParams(location.search).get('id')||'';const secret=getSavedToken(no);setId(no);setToken(secret);if(no&&secret)void load(no,secret);else{setError(no?'Masukkan token rahasia checkout untuk membuka pembayaran.':'Mulai pembayaran melalui keranjang belanja.');setBusy(false)}},[load]);
 useEffect(()=>{if(!id||!token||order?.payment_status==='paid'||order?.payment_status==='refunded')return;const timer=setInterval(()=>{setNow(Date.now());if(!document.hidden)void load(id,token,true)},15000);return()=>clearInterval(timer)},[id,token,order?.payment_status,load]);
 const payment=order?.payment;
 const available=Boolean(order&&payment&&['created','pending','authorized','failed'].includes(payment.status)&&trustedLink(payment.redirect_url,payment.environment)&&!['paid','refunded','partial_refund'].includes(order.payment_status));
 const paid=order?.payment_status==='paid';
 const seconds=order?.reserved_until?Math.max(0,Math.floor((Date.parse(order.reserved_until)-now)/1000)):null;
 async function pay(){if(!available||payBusy)return;setPayBusy(true);setError('');try{await loadDokuScript(payment.environment);if(!window.loadJokulCheckout)throw new Error('Tidak dapat membuka DOKU.');window.loadJokulCheckout(payment.redirect_url)}catch(e:any){setError(e?.message||'Gagal membuka DOKU. Silakan buka tautan alternatif.')}finally{setPayBusy(false)}}
 function recover(e:React.FormEvent){e.preventDefault();const secret=entered.trim().toLowerCase();if(!/^[a-f0-9]{64}$/.test(secret)){setError('Token harus berisi 64 karakter heksadesimal.');return}try{localStorage.setItem('bbw_pending_order',JSON.stringify({order_no:id,token:secret,createdAt:Date.now()}))}catch{}setToken(secret);setEntered('');void load(id,secret)}
 async function copy(){try{await navigator.clipboard.writeText(id);setCopied(true);setTimeout(()=>setCopied(false),1600)}catch{}}
 return <section className="bbw-payment-page">
  <div className="bbw-payment-top"><a href="/merch/"><ArrowLeft size={16}/> Kembali ke merchandise</a><span><LockKeyhole size={14}/> TRANSAKSI TERLINDUNGI</span></div>
  <header className="bbw-payment-heading"><span className="eyebrow">BISABIKINWEB / SECURE CHECKOUT</span><h1>Selesaikan<br/><em>pembayaran.</em></h1><p>Pembayaran dengan identitas BisaBikinWeb. Status transaksi diverifikasi secara otomatis melalui server dan DOKU.</p></header>
  {busy?<div className="bbw-payment-state"><RefreshCw size={23}/> Memuat detail pesanan…</div>:!order?<div className="bbw-payment-state"><AlertCircle size={26}/><h2>Detail belum tersedia</h2><p role="alert">{error}</p>{id&&<form onSubmit={recover}><label htmlFor="pay-token">Token checkout rahasia</label><input id="pay-token" type="password" autoComplete="off" placeholder="64 karakter" required value={entered} onChange={e=>setEntered(e.target.value)}/><button className="btn primary">Cari pembayaran <ArrowRight size={16}/></button></form>}<a href="/checkout/">Kembali ke checkout ↗</a></div>:
   <div className="bbw-payment-grid">
    <article className="bbw-payment-card bbw-payment-main">
     <div className="bbw-payment-card-head"><div><span className="eyebrow">STATUS TRANSAKSI</span><h2>{paid?'Pembayaran berhasil':order.payment_status==='refunded'?'Pembayaran dikembalikan':'Menunggu pembayaran'}</h2></div><span className={'bbw-payment-pill '+(paid?'is-paid':'')}>{paid?'LUNAS':String(payment?.status||order.payment_status||'pending').replaceAll('_',' ').toUpperCase()}</span></div>
     {paid?<div className="bbw-payment-success"><CheckCircle2 size={28}/><div><b>Pembayaran terkonfirmasi</b><p>Pesanan akan diproses oleh tim kami.</p></div></div>:<div className="bbw-payment-channel"><Wallet size={27}/><div><b>DOKU — Pembayaran aman</b><p>QRIS, Virtual Account, dan metode lain tersedia sesuai kanal yang diaktifkan merchant.</p></div></div>}
     {!paid&&seconds!==null&&<p className="bbw-payment-clock"><Clock3 size={16}/>{seconds>0?'Reservasi stok: '+String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0'):'Reservasi stok sudah berakhir. Periksa status sebelum mencoba lagi.'}</p>}
     {error&&<p role="alert" className="bbw-payment-error">{error}</p>}
     {!paid&&!['refunded','partial_refund'].includes(order.payment_status)&&<><button className="btn primary bbw-payment-submit" disabled={!available||payBusy} onClick={()=>void pay()}>{available?(payBusy?'Membuka DOKU…':'Lanjutkan pembayaran'):'Pembayaran belum tersedia'} <ArrowRight size={18}/></button>{available&&<a className="bbw-payment-fallback" href={payment.redirect_url} target="_blank" rel="noopener noreferrer">Buka DOKU di tab baru <ExternalLink size={14}/></a>}{!available&&<p className="bbw-payment-help">Belum ada instruksi pembayaran aktif. Jangan transfer ke rekening pribadi. Hubungi admin bila pembayaran tidak muncul.</p>}</>}
     <div className="bbw-payment-divider"/><div className="bbw-payment-actions"><button type="button" onClick={()=>void load(id,token)}><RefreshCw size={16}/> Periksa status</button><a href={'/track-order/?id='+encodeURIComponent(id)}>Lacak pesanan <ArrowRight size={16}/></a></div>
     <p className="bbw-payment-notice"><ShieldCheck size={17}/> BisaBikinWeb tidak akan meminta PIN, OTP, atau kata sandi bank. Persetujuan pembayaran dilakukan lewat DOKU.</p>
    </article>
    <aside className="bbw-payment-card bbw-payment-summary">
     <span className="eyebrow">RINGKASAN PESANAN</span><div className="bbw-payment-order-no"><b>{order.order_no}</b><button type="button" onClick={()=>void copy()}><Copy size={15}/>{copied?'Tersalin':'Salin'}</button></div><small>{order.created_at?new Date(order.created_at).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):''}</small>
     <div className="bbw-payment-divider"/><div className="bbw-payment-items">{Array.isArray(order.items)&&order.items.map((it:any,i:number)=><div key={String(it.productId||i)}><ShoppingBag size={17}/><span><b>{it.name||'Merchandise'}</b><small>{it.quantity||1} × {money(Number(it.price||0))}</small></span><strong>{money(Number(it.lineTotal||Number(it.price||0)*Number(it.quantity||1)))}</strong></div>)}</div>
     <div className="bbw-payment-divider"/><dl className="bbw-payment-totals"><div><dt>Subtotal</dt><dd>{money(Number(order.subtotal||0))}</dd></div><div><dt>Diskon</dt><dd>−{money(Number(order.discount||0))}</dd></div><div><dt>Ongkir</dt><dd>{Number(order.shipping_amount||0)?money(Number(order.shipping_amount)):'Dikonfirmasi terpisah'}</dd></div></dl><div className="bbw-payment-total"><span>Total produk</span><strong>{money(Number(order.total||0))}</strong></div><p className="bbw-payment-help">Nominal diverifikasi oleh server. Ongkir yang belum disepakati tidak termasuk total ini.</p>
    </aside>
   </div>}
 </section>
}
