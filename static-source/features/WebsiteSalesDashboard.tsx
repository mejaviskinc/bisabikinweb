'use client';
import {useEffect,useMemo,useState} from 'react';
import {ArrowUpRight,BriefcaseBusiness,Check,ClipboardList,Download,Inbox,Search,RefreshCw,Save,ShoppingCart} from 'lucide-react';
import type {AdminSession} from '../lib/supabase';
import {adminUpdateLead} from '../lib/supabase';
import {websiteStoreApi} from '../lib/website-store-api';
import {websiteCategories,websiteStatusLabel,rupiah} from '../lib/website-store';

type Props={session:AdminSession;consultationLeads:any[]};
type WebsiteOrder={id:string;order_no:string;full_name:string;email:string;phone:string;company:string;category:string;
 package_slug:string;template_slug:string|null;requested_domain:string;domain_status:string;reference_url:string;
 brief:string;base_price_snapshot:number|null;quoted_total:number|null;status:string;payment_status:string;
 created_at:string;updated_at:string;payment?:{merchant_order_id:string;amount:number;status:string;environment:string;transaction_status:string;payment_type:string;paid_at:string|null}|null};
const PAGE_SIZE=100;
const orderStages=['requested','reviewing','proposal','awaiting_payment','in_progress','client_review','revision','completed','cancelled'];
const domainStages=['unchecked','manual_review','available','unavailable','registered'];
const leadStatuses=['new','contacted','proposal','won','lost','spam'];
const leadLabels:Record<string,string>={new:'Baru',contacted:'Dihubungi',proposal:'Penawaran',won:'Deal',lost:'Tidak jadi',spam:'Spam'};
const paymentLabels:Record<string,string>={not_invoiced:'Belum dibuat invoice',pending:'Menunggu pembayaran terverifikasi',paid:'Terverifikasi lunas',failed:'Gagal',refunded:'Refund'};
const idDate=(v:string)=>{const d=new Date(v);return Number.isNaN(d.getTime())?'-':d.toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})};
const validHttp=(v:any)=>{try{const u=new URL(String(v||''));return u.protocol==='https:'?u.href:''}catch{return ''}};
const categoryLabel=(slug:any)=>websiteCategories.find(c=>c.slug===slug)?.label||String(slug||'Tidak ditentukan');
const sourceLabel=(o:WebsiteOrder)=>o.template_slug?'Desain katalog':o.package_slug==='custom'?'Website custom':'Paket website';
function exportOrders(rows:WebsiteOrder[]){
 const headers=['Nomor pesanan','Tanggal','Sumber','Kategori','Desain','Paket','Nama','Bisnis','Email','WhatsApp','Domain','Status proyek','Status pembayaran','Harga mulai','Penawaran','Brief'];
 const body=rows.map(o=>[o.order_no,idDate(o.created_at),sourceLabel(o),categoryLabel(o.category),o.template_slug||'',o.package_slug,o.full_name,o.company,o.email,o.phone,o.requested_domain||'',websiteStatusLabel[o.status]||o.status,paymentLabels[o.payment_status]||o.payment_status,o.base_price_snapshot??'',o.quoted_total??'',o.brief]);
 const csv='\ufeff'+[headers,...body].map(row=>row.map(value=>'"'+String(value??'').replace(/"/g,'""').replace(/^[=+\-@]/,'\'$&')+'"').join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob);
 const anchor=document.createElement('a');anchor.href=url;anchor.download='bisabikinweb-pesanan-website-'+new Date().toISOString().slice(0,10)+'.csv';anchor.click();URL.revokeObjectURL(url);
}

export default function WebsiteSalesDashboard({session,consultationLeads}:Props){
 const [orders,setOrders]=useState<WebsiteOrder[]>([]);
 const [templates,setTemplates]=useState<any[]>([]);
 const [packages,setPackages]=useState<any[]>([]);
 const [total,setTotal]=useState(0),[nextOffset,setNextOffset]=useState<number|null>(null);
 const [loading,setLoading]=useState(true),[paging,setPaging]=useState(false),[saving,setSaving]=useState(false);
 const [error,setError]=useState(''),[success,setSuccess]=useState('');
 const [doku,setDoku]=useState<{configured:boolean;environment:string;webhook_url:string}|null>(null);
 const [tab,setTab]=useState<'orders'|'leads'>('orders');
 const [search,setSearch]=useState(''),[status,setStatus]=useState('all'),[category,setCategory]=useState('all'),[source,setSource]=useState('all');
 const [selected,setSelected]=useState<WebsiteOrder|null>(null),[note,setNote]=useState('');
 const [leadRows,setLeadRows]=useState<any[]>(consultationLeads);
 const [leadStatusBusy,setLeadStatusBusy]=useState<string|null>(null);
 useEffect(()=>setLeadRows(consultationLeads),[consultationLeads]);
 async function refresh(){
  setLoading(true);setError('');setSuccess('');
  try{
   const [data,settings]=await Promise.all([websiteStoreApi('admin_list',{offset:0},session.access_token),websiteStoreApi('admin_doku_config',{},session.access_token).catch(()=>null)]);
   if(settings)setDoku(settings);
   setOrders(data.orders||[]);setTemplates(data.templates||[]);setPackages(data.packages||[]);
   setTotal(Number(data.total_orders??(data.orders||[]).length));setNextOffset(data.next_offset??null);
   setSelected(prev=>prev?(data.orders||[]).find((o:WebsiteOrder)=>o.id===prev.id)||null:null);
  }catch(err:any){setError(String(err.message||'Pesanan website gagal dimuat.'))}finally{setLoading(false)}
 }
 useEffect(()=>{void refresh()},[session.access_token]);
 async function loadMore(){
  if(nextOffset===null||paging)return;setPaging(true);setError('');
  try{
   const data=await websiteStoreApi('admin_list',{offset:nextOffset},session.access_token);
   setOrders(rows=>[...rows,...(data.orders||[]).filter((o:WebsiteOrder)=>!rows.some(existing=>existing.id===o.id))]);
   setTotal(Number(data.total_orders??total));setNextOffset(data.next_offset??null);
  }catch(e:any){setError(String(e.message||'Gagal memuat pesanan berikutnya.'))}finally{setPaging(false)}
 }
 const titles=useMemo(()=>Object.fromEntries(templates.map(x=>[x.slug,x.title])),[templates]);
 const packageNames=useMemo(()=>Object.fromEntries(packages.map(x=>[x.slug,x.name])),[packages]);
 const pending=orders.filter(o=>['requested','reviewing','proposal'].includes(o.status)).length;
 const filtered=useMemo(()=>orders.filter(o=>{
  const text=[o.order_no,o.full_name,o.email,o.phone,o.company,o.template_slug,titles[o.template_slug||''],o.package_slug,o.requested_domain,o.brief].join(' ').toLowerCase();
  return (!search||text.includes(search.toLowerCase().trim()))&&(status==='all'||o.status===status)&&(category==='all'||o.category===category)&&(source==='all'||(source==='demo'&&!!o.template_slug)||(source==='custom'&&o.package_slug==='custom')||(source==='package'&&!o.template_slug&&o.package_slug!=='custom'));
 }),[orders,search,status,category,source,titles]);
 const filteredLeads=useMemo(()=>leadRows.filter(l=>[l.name,l.company,l.email,l.phone,l.website_type,l.message].join(' ').toLowerCase().includes(search.toLowerCase().trim())),[leadRows,search]);
 async function saveOrder(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!selected||saving)return;setSaving(true);setError('');setSuccess('');
  try{
   const result=await websiteStoreApi('admin_update_order',{id:selected.id,status:selected.status,domain_status:selected.domain_status,quoted_total:selected.quoted_total,note},session.access_token);
   const updated=result.order as WebsiteOrder;
   setOrders(rows=>rows.map(row=>row.id===selected.id?{...row,...updated}:row));
   setSelected(prev=>prev?.id===selected.id?{...prev,...updated}:prev);
   setNote('');setSuccess('Status pengerjaan dan penawaran berhasil disimpan. Status pembayaran tidak diubah.');
  }catch(err:any){setError(String(err.message||'Pembaruan gagal.'))}finally{setSaving(false)}
 }
 async function changeLeadStatus(row:any,newStatus:string){
  setLeadStatusBusy(row.id);setError('');
  try{await adminUpdateLead(session,row.id,newStatus);setLeadRows(rows=>rows.map(l=>l.id===row.id?{...l,status:newStatus}:l))}
  catch(e:any){setError(String(e.message||'Status konsultasi gagal diubah.'))}
  finally{setLeadStatusBusy(null)}
 }
 const currentTitle=selected?.template_slug?titles[selected.template_slug]||selected.template_slug:'Tanpa desain katalog';
 const selectedDemo=selected?.template_slug?'https://bisabikinweb.site/demo/'+encodeURIComponent(selected.template_slug)+'/':'';
 return <div className="admin-website-sales">
  <section className="wsa-top"><div><span className="admin-section-kicker">WEBSITE COMMERCE / PESANAN JASA</span><h2>Seluruh penjualan website</h2><p>Pesanan dari 60 desain demo, paket website, dan website custom disimpan di Supabase. Konsultasi ditampilkan terpisah agar tidak dianggap pembayaran atau pesanan.</p></div><div className="wsa-top-actions"><a href="/admin/website-store/" className="admin-btn">Kelola desain & paket <ArrowUpRight size={15}/></a><button type="button" className="admin-btn" disabled={loading} onClick={()=>void refresh()}><RefreshCw size={15}/> Refresh</button></div></section>
  <div className="wsa-stats">
   <div><span>Pesanan Website</span><strong>{total}</strong><small>Seluruh jenis dan paket</small></div>
   <div><span>Perlu Ditindaklanjuti</span><strong>{pending}{nextOffset!==null?'+':''}</strong><small>Pesanan yang sudah dimuat</small></div>
   <div><span>Konsultasi</span><strong>{leadRows.length}</strong><small>Calon pelanggan, bukan order</small></div>
   <div><span>DOKU Checkout</span><strong>{doku?.configured?'Aktif':doku?'Belum siap':'—'}</strong><small>{doku?'Mode '+doku.environment:'Memeriksa konfigurasi...'}</small></div>
  </div>
  <div className="wsa-tabs" role="tablist" aria-label="Jenis permintaan jasa website">
   <button type="button" role="tab" aria-selected={tab==='orders'} onClick={()=>{setTab('orders');setSearch('')}}>Pesanan website <span>{total}</span></button>
   <button type="button" role="tab" aria-selected={tab==='leads'} onClick={()=>{setTab('leads');setSearch('')}}>Permintaan konsultasi <span>{leadRows.length}</span></button>
  </div>
  {error&&<div className="admin-alert error" role="alert">{error}</div>}{success&&<div className="admin-alert success" role="status">{success}</div>}
  <div className="wsa-toolbar"><label><Search size={17}/><input type="search" aria-label="Cari pesanan atau konsultasi" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama, nomor order, domain, desain..."/></label>
   {tab==='orders'&&<><select aria-label="Filter jenis pembelian" value={source} onChange={e=>setSource(e.target.value)}><option value="all">Semua jenis pembelian</option><option value="demo">60 desain demo</option><option value="package">Paket website</option><option value="custom">Website custom</option></select><select aria-label="Filter kategori website" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Semua kategori</option>{websiteCategories.map(c=><option value={c.slug} key={c.slug}>{c.label}</option>)}</select><select aria-label="Filter status website" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Semua status</option>{orderStages.map(stage=><option key={stage} value={stage}>{websiteStatusLabel[stage]||stage}</option>)}</select></>}
  </div>
  {tab==='orders'?<div className="wsa-orders-grid"><section className="wsa-list admin-panel">
    <div className="wsa-list-heading"><div><h3>Daftar pesanan jasa website</h3><p>{loading?'Memuat pesanan...':'Menampilkan '+filtered.length+' dari '+total+' pesanan (memuat '+orders.length+' data)'}</p></div><button type="button" className="admin-btn" disabled={!filtered.length} onClick={()=>exportOrders(filtered)}><Download size={15}/> CSV ditampilkan</button></div>
    {filtered.map(o=><button type="button" key={o.id} className={'wsa-order-row'+(selected?.id===o.id?' active':'')} onClick={()=>{setSelected({...o});setNote('');setSuccess('')}}><span><strong>{o.order_no}</strong><small>{idDate(o.created_at)}</small></span><b>{o.company||o.full_name}</b><small>{sourceLabel(o)} · {categoryLabel(o.category)}</small><span className="wsa-row-status">{websiteStatusLabel[o.status]||o.status}</span></button>)}
    {!loading&&!filtered.length&&<div className="wsa-empty">Belum ada pesanan yang cocok. Pelanggan harus mengirim brief melalui formulir pemesanan untuk masuk sebagai order.</div>}
    {nextOffset!==null&&<button className="admin-btn wsa-more" type="button" disabled={paging} onClick={()=>void loadMore()}>{paging?'Memuat...':'Muat 100 pesanan berikutnya'} <ArrowUpRight size={14}/></button>}
   </section><section className="wsa-detail admin-panel">{selected?<><div className="wsa-detail-title"><div><span className="admin-section-kicker">DETAIL PESANAN</span><h3>{selected.order_no}</h3><p>{idDate(selected.created_at)}</p></div><span className="wsa-status-pill">{websiteStatusLabel[selected.status]||selected.status}</span></div>
    <div className="wsa-detail-grid"><div><small>Jenis Pembelian</small><strong>{sourceLabel(selected)}</strong></div><div><small>Kategori</small><strong>{categoryLabel(selected.category)}</strong></div><div><small>Nama Desain</small><strong>{currentTitle}</strong>{selectedDemo&&<a href={selectedDemo} target="_blank" rel="noopener noreferrer">Lihat demo <ArrowUpRight size={12}/></a>}</div><div><small>Paket Website</small><strong>{packageNames[selected.package_slug]||selected.package_slug}</strong></div><div><small>Nama Pelanggan</small><strong>{selected.full_name}</strong></div><div><small>Nama Bisnis</small><strong>{selected.company}</strong></div><div><small>Email</small><a href={'mailto:'+selected.email}>{selected.email}</a></div><div><small>WhatsApp</small><span>{selected.phone}</span></div><div><small>Domain Permintaan</small><span>{selected.requested_domain||'Belum diminta'}</span></div><div><small>Status Domain</small><span>{selected.domain_status}</span></div><div><small>Harga Awal</small><strong>{rupiah(selected.base_price_snapshot)}</strong></div><div><small>Status Pembayaran</small><strong>{paymentLabels[selected.payment_status]||selected.payment_status}</strong></div><div><small>DOKU Invoice</small><strong>{selected.payment?.merchant_order_id||'Belum dibuat'}</strong></div><div><small>Status Transaksi DOKU</small><strong>{selected.payment?.status||'Belum ada transaksi'}</strong><span>{selected.payment?.environment?'Mode: '+selected.payment.environment:''}</span></div></div>
    {selected.payment&&<div className="wsa-doku-record"><strong>DOKU Checkout</strong><p>Invoice: {selected.payment.merchant_order_id} · Nominal: {rupiah(Number(selected.payment.amount))} · Mode: {selected.payment.environment.toUpperCase()}</p><p>Status provider: {selected.payment.transaction_status||selected.payment.status}{selected.payment.paid_at?' · Terverifikasi '+idDate(selected.payment.paid_at):''}</p></div>}
    <div className="wsa-brief"><small>Brief yang dikirim pelanggan</small><p>{selected.brief}</p>{validHttp(selected.reference_url)&&<a href={validHttp(selected.reference_url)} target="_blank" rel="noopener noreferrer">Buka referensi desain <ArrowUpRight size={13}/></a>}</div>
    <form className="wsa-update-form" onSubmit={saveOrder}><h4>Perbarui penawaran dan pengerjaan</h4><label>Status proyek<select value={selected.status} onChange={e=>setSelected({...selected,status:e.target.value})}>{orderStages.map(x=><option key={x} value={x} disabled={x==='awaiting_payment'&&selected.status!=='awaiting_payment'}>{websiteStatusLabel[x]||x}</option>)}</select></label><label>Pengecekan domain<select value={selected.domain_status} onChange={e=>setSelected({...selected,domain_status:e.target.value})}>{domainStages.map(x=><option value={x} key={x}>{x}</option>)}</select></label><label>Nilai penawaran (Rp)<input type="number" min="0" step="1" value={selected.quoted_total??''} onChange={e=>setSelected({...selected,quoted_total:e.target.value===''?null:Number(e.target.value)})}/></label><label>Catatan perkembangan untuk pelanggan<textarea maxLength={2000} rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Catatan yang akan masuk riwayat proyek..."/></label><button type="submit" className="admin-btn primary" disabled={saving}><Save size={16}/>{saving?'Menyimpan...':'Simpan progres'}</button><p className="wsa-payment-note">Paket <strong>Starter, Business, dan Commerce</strong> langsung menuju DOKU setelah pelanggan menyelesaikan formulir. Harga otomatis diambil dari katalog server dan tidak boleh diubah setelah pesanan dibuat. Paket <strong>Custom</strong> masih melalui penawaran dan persetujuan klien. Invoice dikunci saat DOKU Checkout dibuat. Status lunas hanya berasal dari notifikasi DOKU yang terverifikasi.</p></form>
   </>:<div className="wsa-empty"><ClipboardList size={28}/><h3>Detail pesanan</h3><p>Pilih order pada daftar sebelah kiri untuk melihat semua data pelanggan, desain, paket, domain, brief, dan status.</p></div>}</section></div>:
  <section className="admin-panel wsa-leads"><div className="wsa-list-heading"><div><h3>Konsultasi dan permintaan penawaran awal</h3><p>Ini calon pelanggan dari formulir konsultasi. Belum menjadi order pembelian website.</p></div><a className="admin-btn" href="/kontak/" target="_blank" rel="noopener noreferrer">Lihat formulir <ArrowUpRight size={14}/></a></div>
   {filteredLeads.map(lead=><article className="wsa-lead-card" key={lead.id}><div><small>{idDate(lead.created_at)} · {lead.website_type||'Website belum ditentukan'}</small><h4>{lead.name} — {lead.company||'Nama bisnis belum ada'}</h4><p>{lead.message||'Tidak ada catatan tambahan.'}</p><p>{lead.email} · {lead.phone} · Budget: {lead.budget||'Belum ditentukan'}</p></div><label>Status konsultasi<select disabled={leadStatusBusy===lead.id} value={lead.status} onChange={e=>void changeLeadStatus(lead,e.target.value)}>{leadStatuses.map(s=><option key={s} value={s}>{leadLabels[s]}</option>)}</select></label></article>)}
   {!filteredLeads.length&&<div className="wsa-empty">Belum ada konsultasi yang cocok.</div>}
   <p className="wsa-payment-note">Permintaan konsultasi tetap berada di database Leads. Tidak dibuatkan order fiktif atau status pembayaran palsu.</p>
  </section>}
 </div>;
}
