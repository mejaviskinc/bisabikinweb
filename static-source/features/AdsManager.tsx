'use client';
import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowUpRight,Eye,ImagePlus,LogOut,RefreshCw,Save,Trash2} from 'lucide-react';
import {adminDeleteArticleImage,adminUploadArticleImage,assertAdmin,getSession,signIn,signOut,type AdminSession} from '../lib/supabase';
import {adminLoadAd,adminSaveAd,defaultAd,isAdActive,safeAdHref,safeAdImage,type AdSettings} from '../lib/ads';

function toInput(value:string|null){if(!value)return '';const d=new Date(value);if(Number.isNaN(d.getTime()))return '';const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);return local.toISOString().slice(0,16)}
function toIso(value:string){if(!value)return null;const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString()}

export default function AdsManager(){
  const [session,setSession]=useState<AdminSession|null>(null);
  const [booting,setBooting]=useState(true);
  const [busy,setBusy]=useState(false);
  const [email,setEmail]=useState('bisabikinw3b@gmail.com');
  const [password,setPassword]=useState('');
  const [ad,setAd]=useState<AdSettings>(defaultAd);
  const [pendingDeleteUrls,setPendingDeleteUrls]=useState<string[]>([]);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  const status=useMemo(()=>{
    if(!ad.ad_enabled)return 'Nonaktif';
    const now=Date.now(),start=ad.ad_start_at?Date.parse(ad.ad_start_at):NaN,end=ad.ad_end_at?Date.parse(ad.ad_end_at):NaN;
    if(Number.isFinite(start)&&now<start)return 'Terjadwal';
    if(Number.isFinite(end)&&now>end)return 'Berakhir';
    return isAdActive(ad)?'Tayang':'Belum siap';
  },[ad]);

  async function load(current:AdminSession){const next=await adminLoadAd(current);setAd(next);setPendingDeleteUrls([])}
  useEffect(()=>{let active=true;(async()=>{const current=await getSession();if(!active)return;if(current){try{await assertAdmin(current);if(!active)return;setSession(current);await load(current)}catch(err:any){await signOut(current);if(active)setError(err.message||'Sesi admin tidak valid.')}}if(active)setBooting(false)})();return()=>{active=false}},[]);

  async function login(e:any){e.preventDefault();setBusy(true);setError('');setMessage('');try{const current=await signIn(email,password);await assertAdmin(current);setSession(current);await load(current);setPassword('')}catch(err:any){setError(err.message||'Login gagal.')}finally{setBusy(false)}}
  async function logout(){await signOut(session);setSession(null);setPassword('');setMessage('')}
  async function refresh(){if(!session)return;setBusy(true);setError('');try{await load(session);setMessage('Data iklan diperbarui.')}catch(err:any){setError(err.message||'Gagal memuat iklan.')}finally{setBusy(false)}}
  async function save(e:any){e.preventDefault();if(!session)return;setBusy(true);setError('');setMessage('');try{const next=await adminSaveAd(session,ad);setAd(next);const stale=[...new Set(pendingDeleteUrls)].filter(url=>url&&url!==next.ad_image_url);for(const url of stale){try{await adminDeleteArticleImage(session,url)}catch{}}setPendingDeleteUrls([]);setMessage('Iklan berhasil disimpan dan akan dibaca website publik.')}catch(err:any){setError(err.message||'Gagal menyimpan iklan.')}finally{setBusy(false)}}
  async function uploadPhoto(e:any){
    const input=e.currentTarget as HTMLInputElement;const file=input.files?.[0];if(!file||!session)return;
    setBusy(true);setError('');setMessage('');
    try{const previous=ad.ad_image_url;const url=await adminUploadArticleImage(session,file,'ads');if(previous&&previous!==url)setPendingDeleteUrls(current=>[...current,previous]);setAd(current=>({...current,ad_image_url:url}));setMessage('Foto iklan berhasil diupload. Klik “Simpan Iklan” untuk menerapkannya ke website.')}catch(err:any){setError(err.message||'Gagal mengupload foto iklan.')}finally{input.value='';setBusy(false)}
  }
  function removePhoto(){
    if(!ad.ad_image_url)return;const currentUrl=ad.ad_image_url;setPendingDeleteUrls(current=>[...current,currentUrl]);setAd(current=>({...current,ad_image_url:''}));setError('');setMessage('Foto dihapus dari draft iklan. Klik “Simpan Iklan” untuk menerapkan perubahan.')
  }

  if(booting)return <section className="ads-admin ads-auth"><div className="ads-loading">Memuat Ads Manager…</div></section>;
  if(!session)return <section className="ads-admin ads-auth"><div className="ads-login"><span className="ads-kicker">BISABIKINWEB / ADS</span><h1>Ads Manager</h1><p>Masuk dengan akun admin Bisabikinweb.</p>{error&&<div className="ads-alert error">{error}</div>}<form onSubmit={login}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label><label>Password<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></label><button className="ads-button primary" disabled={busy}>{busy?'Memproses…':'Masuk'} <ArrowUpRight size={16}/></button></form><a className="ads-back" href="/admin/"><ArrowLeft size={16}/>Kembali ke Admin</a></div></section>;

  const href=safeAdHref(ad.ad_url);const image=safeAdImage(ad.ad_image_url);
  return <section className="ads-admin"><header className="ads-header"><div><a className="ads-back" href="/admin/"><ArrowLeft size={16}/>Admin</a><span className="ads-kicker">PROMOTION / HOMEPAGE</span><h1>Ads Manager</h1><p>Kelola satu slot iklan yang tampil otomatis setelah hero di beranda.</p></div><div className="ads-header-actions"><span className={`ads-status ${status.toLowerCase().replace(/\s/g,'-')}`}>{status}</span><button className="ads-button" onClick={refresh} disabled={busy}><RefreshCw size={15}/>Refresh</button><button className="ads-button" onClick={logout}><LogOut size={15}/>Logout</button></div></header>
  <main className="ads-layout"><section className="ads-panel"><div className="ads-panel-head"><div><span className="ads-kicker">EDITOR</span><h2>Konten iklan</h2><p>Perubahan disimpan ke Supabase dan dibaca website publik.</p></div></div>{error&&<div className="ads-alert error">{error}</div>}{message&&<div className="ads-alert success">{message}</div>}<form className="ads-form" onSubmit={save}><label className="ads-toggle"><input type="checkbox" checked={ad.ad_enabled} onChange={e=>setAd({...ad,ad_enabled:e.target.checked})}/><span><strong>Aktifkan iklan</strong><small>Matikan untuk menyembunyikan banner tanpa menghapus konten.</small></span></label><div className="ads-grid"><label>Label<input maxLength={40} value={ad.ad_label} onChange={e=>setAd({...ad,ad_label:e.target.value})}/></label><label>Teks tombol<input maxLength={80} value={ad.ad_cta} onChange={e=>setAd({...ad,ad_cta:e.target.value})}/></label><label className="wide">Judul<input required maxLength={180} value={ad.ad_title} onChange={e=>setAd({...ad,ad_title:e.target.value})}/></label><label className="wide">Deskripsi<textarea maxLength={600} value={ad.ad_description} onChange={e=>setAd({...ad,ad_description:e.target.value})}/></label><label className="wide">Link tujuan<input placeholder="/kontak atau https://..." value={ad.ad_url} onChange={e=>setAd({...ad,ad_url:e.target.value})}/><small>Gunakan halaman internal seperti /kontak atau URL HTTPS.</small></label><div className="wide ads-image-upload"><div className="ads-image-upload-head"><div><strong>Foto iklan</strong><small>Upload langsung dari perangkat. JPG, PNG, WEBP, GIF, atau AVIF · maksimal 5 MB.</small></div>{image&&<button type="button" className="ads-button danger" onClick={removePhoto} disabled={busy}><Trash2 size={15}/>Hapus foto</button>}</div><label className="ads-file-picker"><ImagePlus size={20}/><span>{busy?'Memproses foto…':'Pilih / Tambah Foto'}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={uploadPhoto} disabled={busy}/></label>{image&&<div className="ads-image-thumb"><img src={image} alt="Foto iklan yang dipilih"/><span>Foto siap dipakai pada iklan.</span></div>}</div><label className="wide">Atau URL gambar<input placeholder="https://..." value={ad.ad_image_url} onChange={e=>setAd({...ad,ad_image_url:e.target.value})}/><small>Bisa tetap menggunakan URL HTTPS jika gambar sudah tersedia online.</small></label><label>Mulai tayang<input type="datetime-local" value={toInput(ad.ad_start_at)} onChange={e=>setAd({...ad,ad_start_at:toIso(e.target.value)})}/></label><label>Berakhir<input type="datetime-local" value={toInput(ad.ad_end_at)} onChange={e=>setAd({...ad,ad_end_at:toIso(e.target.value)})}/></label></div><div className="ads-form-footer"><span>Slot iklan hanya tampil di homepage.</span><button className="ads-button primary" disabled={busy}><Save size={15}/>{busy?'Menyimpan…':'Simpan Iklan'}</button></div></form></section>
  <aside className="ads-panel ads-preview-panel"><div className="ads-panel-head"><div><span className="ads-kicker"><Eye size={13}/> LIVE PREVIEW</span><h2>Preview banner</h2><p>Tampilan mengikuti tema website publik.</p></div></div><div className={`bbweb-ad-card ads-preview ${image?'has-image':''}`}>{image&&<div className="bbweb-ad-media"><img src={image} alt="Preview iklan"/></div>}<div className="bbweb-ad-copy"><span className="bbweb-ad-label">{ad.ad_label||'IKLAN'}</span><h3>{ad.ad_title||'Judul iklan'}</h3><p>{ad.ad_description||'Deskripsi iklan akan tampil di sini.'}</p>{href&&<a className="bbweb-ad-cta" href={href} onClick={e=>e.preventDefault()}>{ad.ad_cta||'Lihat Selengkapnya'}<ArrowUpRight size={16}/></a>}</div></div><div className="ads-preview-note"><strong>Status: {status}</strong><span>{ad.ad_start_at?'Mulai '+new Date(ad.ad_start_at).toLocaleString('id-ID'):'Tanpa tanggal mulai'}</span><span>{ad.ad_end_at?'Selesai '+new Date(ad.ad_end_at).toLocaleString('id-ID'):'Tanpa tanggal berakhir'}</span></div></aside></main></section>;
}
