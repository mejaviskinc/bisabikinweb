'use client';
import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,ExternalLink,LockKeyhole,RefreshCw,CheckCircle2} from 'lucide-react';
import {merchOrderStatus} from '../lib/client';

function safeDokuUrl(value:unknown){
 try{const url=new URL(String(value||''));return url.protocol==='https:'&&!url.username&&!url.password&&
 ['checkout.doku.com','jokul.doku.com','sandbox.doku.com'].includes(url.hostname)?url.href:''}catch{return ''}
}
function savedOrderToken(orderNo:string){
 try{const pending=JSON.parse(localStorage.getItem('bbw_pending_order')||'null');return pending?.order_no===orderNo&&/^[a-f0-9]{64}$/.test(pending.token||'')?pending.token:''}catch{return ''}
}
/** Compatibility route for pre-rollback payment links. New checkouts redirect directly to DOKU. */
export default function PaymentPage(){
 const [orderNo,setOrderNo]=useState(''),[url,setUrl]=useState(''),[status,setStatus]=useState('Memeriksa pesanan…'),[loading,setLoading]=useState(true),[paid,setPaid]=useState(false);
 useEffect(()=>{
  let active=true;
  (async()=>{
   const no=new URLSearchParams(location.search).get('id')||'';
   setOrderNo(no);
   const token=savedOrderToken(no);
   if(!no||!token){setStatus('Token checkout tidak ditemukan. Periksa pesanan melalui halaman pelacakan atau hubungi admin.');setLoading(false);return}
   try{
    const result=await merchOrderStatus(no,token);
    if(!active)return;
    if(result?.order?.order_no!==no)throw new Error('Nomor pesanan tidak cocok.');
    if(result.order.payment_status==='paid'){setPaid(true);setStatus('Pesanan sudah lunas.');return}
    if(['refunded','partial_refund'].includes(result.order.payment_status)){setStatus('Pembayaran sudah dikembalikan.');return}
    const next=safeDokuUrl(result.order.payment?.redirect_url);
    if(!next){setStatus('Tautan pembayaran DOKU tidak tersedia. Periksa status pesanan atau hubungi admin.');return}
    setUrl(next);setStatus('Mengalihkan ke halaman DOKU Checkout…');
    location.assign(next);
   }catch(e:any){if(active)setStatus(String(e?.message||'Status pembayaran belum tersedia.'))}
   finally{if(active)setLoading(false)}
  })();
  return()=>{active=false};
 },[]);
 return <section className="bbw-payment-page">
  <div className="bbw-payment-top"><a href="/merch/"><ArrowLeft size={16}/> Kembali ke merchandise</a><span><LockKeyhole size={14}/> DOKU CHECKOUT</span></div>
  <header className="bbw-payment-heading"><span className="eyebrow">BISABIKINWEB / PEMBAYARAN</span><h1>Pembayaran<br/><em>melalui DOKU.</em></h1><p>Halaman ini hanya digunakan untuk mengalihkan tautan pembayaran lama ke DOKU Checkout resmi.</p></header>
  <div className="bbw-payment-state" role="status">
   {loading?<RefreshCw size={25}/>:paid?<CheckCircle2 size={25}/>:<LockKeyhole size={25}/>}
   <h2>{paid?'Pembayaran berhasil':'Status pembayaran'}</h2>
   <p>{status}</p>
   {orderNo&&<small>Nomor pesanan: <strong>{orderNo}</strong></small>}
   {url&&!paid&&<a href={url} className="btn primary" rel="noopener noreferrer">Buka DOKU Checkout <ExternalLink size={16}/></a>}
   <a href={orderNo?'/track-order/?id='+encodeURIComponent(orderNo):'/track-order/'} className="text-link">Lacak status pesanan <ArrowRight size={17}/></a>
  </div>
 </section>;
}
