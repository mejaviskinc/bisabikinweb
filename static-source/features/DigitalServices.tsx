'use client';
import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,CheckCircle2,Gamepad2,Smartphone,Wifi,Zap,Gift,ShieldCheck,RefreshCw} from 'lucide-react';
import {customerGetSession} from '../lib/customer';
import './digital-services.css';

const API='https://kdlrobdzlxpjlkxbvzsd.supabase.co/functions/v1/bbweb-digital-orders';
const PUBLISHABLE_KEY='sb_publishable_Xy3TI3nbOGglkk5xy6uAsA_ytlPYhv-';
type Service='game'|'pulsa'|'data'|'pln'|'voucher';
const services=[
 {id:'game' as Service,name:'Top Up Game',icon:Gamepad2,desc:'Mobile Legends, Free Fire, PUBG, Roblox, dan game lainnya.',label:'Game',choices:['Mobile Legends','Free Fire','PUBG Mobile','Roblox','Valorant','Genshin Impact','Game lainnya'],target:'User ID game',hint:'Masukkan User ID sesuai akun game.'},
 {id:'pulsa' as Service,name:'Pulsa',icon:Smartphone,desc:'Isi ulang untuk operator seluler Indonesia.',label:'Operator',choices:['Telkomsel','Indosat','XL','AXIS','Tri','Smartfren'],target:'Nomor HP tujuan',hint:'Contoh: 081234567890'},
 {id:'data' as Service,name:'Paket Data',icon:Wifi,desc:'Paket internet sesuai nomor dan operator.',label:'Operator',choices:['Telkomsel','Indosat','XL','AXIS','Tri','Smartfren'],target:'Nomor HP tujuan',hint:'Contoh: 081234567890'},
 {id:'pln' as Service,name:'Token Listrik',icon:Zap,desc:'Permintaan token listrik prabayar PLN.',label:'Produk',choices:['Token listrik PLN'],target:'Nomor meter / ID pelanggan',hint:'Nomor meter / ID pelanggan 10–13 digit'},
 {id:'voucher' as Service,name:'Voucher Digital',icon:Gift,desc:'Voucher game, hiburan, atau produk digital lainnya.',label:'Voucher',choices:['Google Play','Steam Wallet','Voucher game','Produk digital lainnya'],target:'Email / nomor penerima',hint:'Email atau nomor yang akan menerima voucher'}
];
async function request(action:string,data:Record<string,unknown>={}) {
 const session=await customerGetSession();
 if(!session?.access_token)throw Error('Silakan masuk ke akun pembeli terlebih dahulu.');
 const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',apikey:PUBLISHABLE_KEY,Authorization:'Bearer '+session.access_token},body:JSON.stringify({action,...data}),cache:'no-store'});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(String(result.error||'Permintaan belum dapat disimpan.'));
 return result;
}
export default function DigitalServices(){
 const [selected,setSelected]=useState<Service|null>(null);
 const [product,setProduct]=useState(''),[nominal,setNominal]=useState(''),[target,setTarget]=useState(''),[serverId,setServerId]=useState(''),[name,setName]=useState(''),[phone,setPhone]=useState(''),[note,setNote]=useState(''),[agreed,setAgreed]=useState(false);
 const [logged,setLogged]=useState<boolean|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState<any>(null),[orders,setOrders]=useState<any[]>([]);
 const [idempotency,setIdempotency]=useState('');
 const service=services.find(s=>s.id===selected);
 useEffect(()=>{const p=new URLSearchParams(window.location.search).get('layanan');if(services.some(s=>s.id===p)){setSelected(p as Service)}setIdempotency(crypto.randomUUID());customerGetSession().then(s=>{setLogged(Boolean(s));if(s){setName(s.user?.user_metadata?.full_name||'');setPhone(s.user?.user_metadata?.phone||'')}}).catch(()=>setLogged(false));},[]);
 useEffect(()=>{if(selected)document.getElementById('digital-order-form')?.scrollIntoView({behavior:'smooth',block:'start'});},[selected]);
 function choose(id:Service){setSelected(id);setProduct('');setNominal('');setTarget('');setServerId('');setNote('');setAgreed(false);setReceipt(null);setError('');history.replaceState(null,'','/layanan-digital/?layanan='+id);}
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(!selected||!service||busy)return;setBusy(true);setError('');try{
  const result=await request('create_order',{service:selected,product_name:(product+' — '+nominal).trim(),target_primary:target.trim(),target_secondary:serverId.trim(),buyer_name:name.trim(),buyer_phone:phone.trim(),note:note.trim(),accepted_terms:agreed,idempotency_key:idempotency});
  setReceipt(result.order);setIdempotency(crypto.randomUUID());setOrders(prev=>[{order_no:result.order.order_no,service:selected,product_name:product+' — '+nominal,status:'requested',payment_status:'not_invoiced',created_at:new Date().toISOString()},...prev.filter(o=>o.order_no!==result.order.order_no)]);
 }catch(e:any){setError(String(e?.message||'Pengiriman form gagal.'))}finally{setBusy(false)}}
 async function loadOrders(){setBusy(true);setError('');try{const result=await request('my_orders');setOrders(result.orders||[])}catch(e:any){setError(String(e?.message||'Gagal memuat pesanan.'))}finally{setBusy(false)}}
 return <section className="section digital-page">
  <div className="breadcrumbs"><a href="/">Home</a><span>/</span><span>Layanan Digital</span></div>
  <div className="digital-intro">
   <div className="page-intro"><span className="eyebrow">BISABIKINWEB / DIGITAL SERVICES</span><h1>Pilih layanan.<br/><em>Isi formnya.</em></h1><p>Top up game, pulsa, paket data, token listrik, dan voucher digital. Pilih kebutuhanmu, lalu isi form langsung di BisaBikinWeb.</p><a className="btn primary" href="#pilihan-layanan">Pilih layanan <ArrowUpRight size={17}/></a></div>
   <aside className="digital-status"><ShieldCheck size={30} aria-hidden="true"/><span className="digital-badge">Pemesanan bertahap</span><h2>Semua dalam satu website.</h2><p>Form permintaan bisa diisi lewat akun pembeli. Harga final, pembayaran DOKU, dan pengiriman produk baru diaktifkan setelah koneksi supplier diverifikasi. Jangan transfer sebelum menerima invoice resmi.</p></aside>
  </div>
  <div className="section-heading" id="pilihan-layanan"><div><span className="eyebrow">PILIH KATEGORI</span><h2>Mau beli apa<br/><em>hari ini?</em></h2></div><p>Ketuk kategori untuk membuka form yang sesuai.</p></div>
  <div className="digital-grid">{services.map(s=><article className={'digital-card'+(selected===s.id?' selected':'')} key={s.id}>
   <div className="digital-card-top"><span className="digital-icon"><s.icon size={24} aria-hidden="true"/></span><span className="digital-badge">{selected===s.id?'Dipilih':'Form online'}</span></div>
   <small>LAYANAN DIGITAL</small><h3>{s.name}</h3><p>{s.desc}</p><button type="button" className="digital-choose" onClick={()=>choose(s.id)}>Pilih layanan <ArrowRight size={16}/></button>
  </article>)}</div>
  {service&&<section className="digital-order" id="digital-order-form" aria-labelledby="digital-order-heading">
   <div className="digital-order-head"><div><span className="eyebrow">FORM PEMBELIAN / {service.name.toUpperCase()}</span><h2 id="digital-order-heading">Isi data tujuan.</h2><p>Permintaan akan masuk ke admin Layanan Digital. Belum ada tagihan maupun pengiriman otomatis sebelum produk diaktifkan.</p></div><button type="button" className="digital-back" onClick={()=>{setSelected(null);history.replaceState(null,'','/layanan-digital/');setReceipt(null)}}><ArrowLeft size={16}/> Ganti layanan</button></div>
   {receipt?<div className="digital-success" role="status"><CheckCircle2 size={36}/><h3>Permintaan tersimpan!</h3><p>Nomor: <strong>{receipt.order_no}</strong></p><p>Status: menunggu tinjauan admin. Belum ada pembayaran yang ditagihkan.</p><button className="btn" type="button" onClick={()=>{setReceipt(null);setProduct('');setNominal('');setTarget('');setAgreed(false)}}>Buat permintaan lagi</button></div>:
   <div className="digital-order-layout"><form className="digital-form" onSubmit={submit}>
    {logged===false&&<div className="digital-alert">Masuk ke <a href="/account/">akun pembeli</a> untuk mengirim permintaan dan melihat riwayat.</div>}
    <div className="digital-form-row"><label>{service.label}<select required value={product} onChange={e=>setProduct(e.target.value)}><option value="">Pilih {service.label.toLowerCase()}</option>{service.choices.map(c=><option key={c} value={c}>{c}</option>)}</select></label><label>Nominal / produk yang diinginkan<input required minLength={2} maxLength={80} value={nominal} onChange={e=>setNominal(e.target.value)} placeholder={selected==='game'?'Contoh: 86 Diamond':selected==='data'?'Contoh: 10 GB':selected==='pln'?'Contoh: Rp50.000':'Tulis nominal atau jenis produk'}/></label></div>
    <div className="digital-form-row"><label>{service.target}<input required minLength={4} maxLength={100} value={target} onChange={e=>setTarget(e.target.value)} placeholder={service.hint}/></label>{selected==='game'&&<label>Server ID (jika ada)<input maxLength={100} value={serverId} onChange={e=>setServerId(e.target.value)} placeholder="Contoh: 1234"/></label>}</div>
    <div className="digital-form-row"><label>Nama pembeli<input required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label><label>Nomor WhatsApp pembeli<input required type="tel" maxLength={32} autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="08xxxxxxxxxx"/></label></div>
    <label>Catatan tambahan (opsional)<textarea rows={3} maxLength={500} value={note} onChange={e=>setNote(e.target.value)} placeholder="Tuliskan informasi tambahan untuk admin."/></label>
    <label className="digital-consent"><input type="checkbox" required checked={agreed} onChange={e=>setAgreed(e.target.checked)}/> <span>Saya memastikan data tujuan benar dan menyetujui <a href="/terms/">Syarat & Ketentuan</a> dan <a href="/privacy/">Kebijakan Privasi</a>.</span></label>
    {error&&<div className="digital-alert" role="alert">{error}</div>}
    <button className="btn primary" type="submit" disabled={busy||!logged||!idempotency}>{busy?'Menyimpan permintaan…':'Kirim permintaan pembelian'} <ArrowUpRight size={17}/></button>
   </form><aside className="digital-summary"><span className="eyebrow">RINGKASAN</span><h3>{service.name}</h3><p>{product||'Belum dipilih'}</p><p>{nominal||'Nominal belum diisi'}</p><div><small>Total pembayaran</small><strong>Menunggu konfirmasi harga</strong></div><p className="digital-small">Bukan halaman pembayaran. Tidak ada pemotongan saldo maupun pengiriman otomatis.</p></aside></div>}
  </section>}
  <section className="digital-history"><div><span className="eyebrow">AKUN CUSTOMER</span><h2>Riwayat permintaan</h2><p>Lihat nomor dan status permintaan pembelianmu.</p></div><button className="btn" type="button" onClick={loadOrders} disabled={busy}>{busy?'Memuat…':<><RefreshCw size={15}/> Muat riwayat</>}</button>{orders.length>0&&<div className="digital-history-list">{orders.map(o=><article key={o.order_no}><strong>{o.order_no}</strong><span>{o.product_name}</span><small>{o.status==='requested'?'Menunggu admin':o.status==='reviewing'?'Ditinjau':o.status==='cancelled'?'Dibatalkan':o.status} · Belum ditagihkan</small></article>)}</div>}</section>
 </section>;
}
