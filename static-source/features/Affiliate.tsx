import React,{useEffect,useMemo,useState} from 'react';
import {ArrowUpRight,Copy,Gift,ShieldCheck,Users,Wallet,CheckCircle2} from 'lucide-react';
import {customerGetSession,type CustomerSession} from '../lib/customer';
import {affiliateApi} from '../lib/affiliate-api';
import './affiliate.css';

const rupiah=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n||0);
const labels:Record<string,string>={pending:'Dalam peninjauan',active:'Aktif',rejected:'Ditolak',suspended:'Ditangguhkan',approved:'Siap dicairkan',paid:'Sudah dicairkan',reversed:'Dibatalkan'};
type Commission={id:string,commission_amount:number,status:string,created_at:string,eligible_at:string};
export default function Affiliate(){
 const [session,setSession]=useState<CustomerSession|null>(null);
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false);
 const [data,setData]=useState<any>(null),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [form,setForm]=useState({display_name:'',whatsapp:'',promotion_channel:''});
 const [accepted,setAccepted]=useState(false);
 useEffect(()=>{let mounted=true;(async()=>{try{
  const s=await customerGetSession();
  if(!mounted)return;
  setSession(s);
  if(s){const result=await affiliateApi('me',{},s.access_token);if(mounted)setData(result);}
 }catch(e:any){if(mounted)setError(String(e?.message||'Dashboard belum bisa dimuat.'))}
 finally{if(mounted)setReady(true)}})();return()=>{mounted=false};},[]);
 const affiliate=data?.affiliate;
 const commissions:Commission[]=Array.isArray(data?.commissions)?data.commissions:[];
 const amounts=useMemo(()=>commissions.reduce((acc,c)=>{if(c.status==='pending')acc.pending+=Number(c.commission_amount);if(c.status==='approved')acc.approved+=Number(c.commission_amount);if(c.status==='paid')acc.paid+=Number(c.commission_amount);return acc;},{pending:0,approved:0,paid:0}),[commissions]);
 const url=affiliate?.status==='active'&&affiliate?.referral_code?'https://bisabikinweb.site/beli-website/?ref='+encodeURIComponent(affiliate.referral_code):'';
 async function apply(e:React.FormEvent){
  e.preventDefault();if(!session||busy)return;
  setBusy(true);setError('');setMessage('');
  try{
   await affiliateApi('apply',{...form,accepted_terms:accepted},session.access_token);
   const refreshed=await affiliateApi('me',{},session.access_token);setData(refreshed);
   setMessage('Pendaftaran diterima. Tim akan meninjau akun sebelum kode referral diaktifkan.');
  }catch(e:any){setError(String(e?.message||'Pendaftaran gagal.'))}
  finally{setBusy(false)}
 }
 async function copyLink(){if(!url)return;try{await navigator.clipboard.writeText(url);setMessage('Link referral berhasil disalin.');}catch{setMessage('Salin link dari kolom di bawah secara manual.');}}
 return <div className="aff-page">
  <section className="aff-hero section"><div className="aff-hero-grid"><div>
   <span className="aff-kicker"><span/> BISABIKINWEB / PARTNER PROGRAM</span>
   <h1>Kenalkan website.<br/><em>Dapatkan komisi.</em></h1>
   <p>Jadi mitra pemasaran BisaBikinWeb. Bagikan link referral ke calon klien yang membutuhkan website profesional. Setiap pembelian jasa yang valid berpeluang menghasilkan komisi untukmu.</p>
   <div className="aff-actions"><a href="#daftar-affiliate" className="btn primary">Gabung Affiliate <ArrowUpRight size={18}/></a><a href="#cara-kerja" className="btn">Lihat cara kerja</a></div>
   <div className="aff-hero-foot">Tidak ada biaya pendaftaran <span>·</span> Pencairan manual dan terverifikasi</div>
  </div><aside className="aff-earn-card"><div className="aff-earn-top"><Gift size={22}/><span>REKOMENDASI WEBSITE YANG BERHASIL</span></div><div className="aff-earn-number">10<span>%</span></div><div className="aff-earn-label">Komisi penjualan baru</div><div className="aff-earn-example"><span>Contoh nilai jasa Rp3.000.000</span><strong>Komisi Rp300.000</strong></div><small>Perkiraan sebelum potongan pajak yang berlaku. Basis komisi adalah nilai jasa yang memenuhi syarat, bukan otomatis seluruh tagihan.</small></aside></div></section>
  <section id="cara-kerja" className="section aff-how"><div className="aff-heading"><span className="eyebrow">HOW IT WORKS</span><h2>Empat langkah,<br/><em>satu kesempatan baru.</em></h2></div><div className="aff-steps">{[
   ['01','Daftar mitra','Gunakan akun BisaBikinWeb yang sudah terverifikasi untuk mengajukan keanggotaan.'],
   ['02','Dapatkan link','Setelah disetujui admin, kode dan link referral unik muncul di dashboard.'],
   ['03','Ajak calon klien','Bagikan ke relasi yang benar-benar membutuhkan website. Kode akan dibawa ke formulir pemesanan.'],
   ['04','Dapat komisi','Order yang dibayar di lingkungan produksi akan dicatat. Setelah masa validasi 14 hari, admin meninjau komisi dan mengatur pencairan.']
  ].map(([n,title,desc])=><article className="aff-step" key={n}><span>{n}</span><h3>{title}</h3><p>{desc}</p></article>)}</div></section>
  <section className="section aff-trust"><div><ShieldCheck size={24}/><strong>Transparan sejak awal</strong><p>Komisi 10% untuk klien baru yang memenuhi syarat. Tidak berlaku untuk transaksi sendiri, pesanan batal/refund, atau penjualan yang tidak tercatat dengan referral.</p></div><div><Wallet size={24}/><strong>Pencairan terkontrol</strong><p>Minimum akumulasi komisi disetujui Rp100.000. Jadwal pencairan bulanan dan bukti transfer diberikan setelah pemeriksaan.</p></div><div><Users size={24}/><strong>Promosi yang etis</strong><p>Dilarang spam, klaim palsu, menyamar sebagai staf resmi, memakai iklan menyesatkan, atau mengumpulkan data calon pembeli tanpa izin.</p></div></section>
  <section id="daftar-affiliate" className="section aff-join"><div className="aff-heading"><span className="eyebrow">PARTNER DASHBOARD</span><h2>Mulai dari sini.</h2><p>Gunakan akun pelanggan BisaBikinWeb agar data dan komisi hanya terlihat oleh pemilik akun.</p></div>
   {!ready?<div className="aff-panel" role="status">Memeriksa akun dan status mitra…</div>:
   !session?<div className="aff-panel"><h3>Masuk atau buat akun dulu</h3><p>Pendaftaran mitra memerlukan akun dengan email yang sudah dikonfirmasi. Setelah login, kembali ke halaman ini.</p><a href="/account/" className="btn primary">Login / Daftar Akun <ArrowUpRight size={17}/></a></div>:
   !affiliate?<form className="aff-panel aff-form" onSubmit={apply}><h3>Daftar Affiliate Partner</h3><p>Tim akan meninjau informasi promosi sebelum mengaktifkan kode referral.</p>
    <label>Nama mitra<input required minLength={2} maxLength={120} value={form.display_name} onChange={e=>setForm({...form,display_name:e.target.value})} placeholder="Nama lengkap atau nama bisnis" autoComplete="name"/></label>
    <label>Nomor WhatsApp<input required minLength={7} maxLength={32} value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} placeholder="08xxxxxxxxxx" autoComplete="tel"/></label>
    <label>Media promosi utama<input required minLength={2} maxLength={120} value={form.promotion_channel} onChange={e=>setForm({...form,promotion_channel:e.target.value})} placeholder="Instagram, website, komunitas, dll"/></label>
    <label className="aff-check"><input type="checkbox" required checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>Saya setuju promosi dengan jujur, tidak melakukan spam, dan memahami bahwa komisi hanya dibayar atas transaksi sah setelah verifikasi serta pemotongan pajak yang berlaku.</span></label>
    <button type="submit" className="btn primary" disabled={busy||!accepted}>{busy?'Mengirim…':'Kirim Pendaftaran'} <ArrowUpRight size={17}/></button>
   </form>:
   <div className="aff-panel"><div className="aff-dashboard-head"><div><small>MITRA TERDAFTAR</small><h3>{affiliate.display_name}</h3></div><span className={'aff-status '+affiliate.status}>{labels[affiliate.status]||affiliate.status}</span></div>
    {url?<><p>Bagikan link resmi berikut kepada calon pelanggan. Komisi dicatat ketika pembeli menyelesaikan pembayaran yang memenuhi syarat.</p><div className="aff-link"><input aria-label="Link referral" readOnly value={url}/><button className="btn primary" type="button" onClick={copyLink}><Copy size={16}/> Salin</button></div><div className="aff-stats"><div><small>Menunggu validasi</small><strong>{rupiah(amounts.pending)}</strong></div><div><small>Siap dicairkan</small><strong>{rupiah(amounts.approved)}</strong></div><div><small>Sudah dicairkan</small><strong>{rupiah(amounts.paid)}</strong></div></div>{amounts.approved>=100000&&<p>Saldo memenuhi batas minimum pencairan. Hubungi tim BisaBikinWeb untuk verifikasi rekening dan jadwal transfer.</p>}</>:
    <p>{affiliate.status==='pending'?'Pendaftaran sedang ditinjau. Link referral akan tersedia setelah disetujui.':affiliate.status==='rejected'?'Pengajuan belum disetujui. Hubungi tim untuk klarifikasi.':'Akun mitra ditangguhkan. Hubungi tim untuk pemeriksaan.'}</p>}
    {commissions.length>0&&<div className="aff-table-wrap"><table className="aff-table"><thead><tr><th>Tanggal</th><th>Komisi</th><th>Status</th></tr></thead><tbody>{commissions.map(c=><tr key={c.id}><td>{new Date(c.created_at).toLocaleDateString('id-ID')}</td><td>{rupiah(c.commission_amount)}</td><td>{labels[c.status]||c.status}</td></tr>)}</tbody></table></div>}
   </div>}
   {error&&<p className="aff-error" role="alert">{error}</p>}{message&&<p className="aff-notice" role="status"><CheckCircle2 size={16}/>{message}</p>}
  </section>
  <section className="section aff-faq"><h2>Aturan singkat program</h2><div><details><summary>Bagaimana referral dihitung?</summary><p>Gunakan link kode unik. Kode referral disimpan secara lokal hingga 30 hari dalam browser calon pembeli dan dikirim saat pemesanan website. Penggunaan kode pada order tidak menjamin komisi apabila transaksi tidak sah.</p></details><details><summary>Kapan komisi masuk?</summary><p>Komisi awal tercatat setelah pembayaran produksi diverifikasi server. Komisi dapat disetujui admin setelah minimal 14 hari dan pemeriksaan biaya jasa, refund, serta potensi penyalahgunaan.</p></details><details><summary>Apa yang tidak mendapatkan komisi?</summary><p>Self-referral, klien yang sebelumnya sudah membeli website, pesanan tanpa kode valid, transaksi refund, biaya pihak ketiga, serta aktivitas promosi yang melanggar aturan.</p></details><details><summary>Bagaimana pajak dan pembayaran komisi?</summary><p>Pembayaran dilakukan manual setelah saldo disetujui mencapai Rp100.000, biasanya dalam siklus bulanan. Komisi merupakan penghasilan yang dapat dikenai pemotongan pajak sesuai ketentuan Indonesia. Metode transfer diverifikasi secara privat bersama admin.</p></details></div></section>
 </div>;
}
