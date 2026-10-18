'use client';
import React,{useEffect,useMemo,useState} from 'react';
import {ArrowUpRight,Eye,Globe,ImagePlus,Link2,Plus,Save,Trash2} from 'lucide-react';
import {sellerUploadImage,type SellerSession} from '../lib/seller';

const defaultConfig:any={tagline:'',headline:'',bio:'',avatar_url:'',cover_url:'',theme:'cream',accent_color:'#d7a96b',button_style:'pill',menu_items:[],links:[],show_products:true,show_articles:true,product_title:'Produk pilihan',article_title:'Artikel terbaru',layout:'centered'};
type Props={profile:any;session:SellerSession;busy:boolean;save:(payload:any)=>Promise<any>};
export default function SellerStorefrontEditor({profile,session,busy,save}:Props){
 const initial=useMemo(()=>({...defaultConfig,...(profile?.storefront_config||{}),menu_items:Array.isArray(profile?.storefront_config?.menu_items)?profile.storefront_config.menu_items:[],links:Array.isArray(profile?.storefront_config?.links)?profile.storefront_config.links:[]}),[profile?.id,profile?.updated_at,profile?.storefront_config]);
 const [form,setForm]=useState<any>(initial);
 const [slug,setSlug]=useState(String(profile?.storefront_slug||''));
 const [published,setPublished]=useState(Boolean(profile?.storefront_published));
 const [uploading,setUploading]=useState('');
 const [localError,setLocalError]=useState('');
 useEffect(()=>{setForm(initial);setSlug(String(profile?.storefront_slug||''));setPublished(Boolean(profile?.storefront_published));},[initial,profile?.storefront_slug,profile?.storefront_published]);
 const active=profile?.status==='active';
 const publicUrl='https://bisabikinweb.site/toko/'+slug+'/';
 function update(key:string,value:any){setForm((old:any)=>({...old,[key]:value}));}
 function updateRow(key:'menu_items'|'links',index:number,field:string,value:string){setForm((old:any)=>({...old,[key]:old[key].map((item:any,i:number)=>i===index?{...item,[field]:value}:item)}));}
 function addRow(key:'menu_items'|'links'){setForm((old:any)=>({...old,[key]:[...old[key],key==='menu_items'?{label:'',href:'#links'}:{label:'',url:'',description:''}]}));}
 function removeRow(key:'menu_items'|'links',index:number){setForm((old:any)=>({...old,[key]:old[key].filter((_:any,i:number)=>i!==index)}));}
 async function upload(field:'avatar_url'|'cover_url',event:React.ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];event.currentTarget.value='';if(!file)return;
  setUploading(field);setLocalError('');
  try{const url=await sellerUploadImage(file,session);update(field,url);}catch(e:any){setLocalError(e.message||'Upload gambar gagal.')}finally{setUploading('');}
 }
 async function submit(event:React.FormEvent){
  event.preventDefault();setLocalError('');
  if(!/^[a-z0-9](?:[a-z0-9-]{0,50}[a-z0-9])?$/.test(slug)){setLocalError('URL toko harus 1–52 karakter, huruf kecil, angka, dan tanda hubung tanpa spasi.');return;}
  if(form.menu_items.length>8||form.links.length>15){setLocalError('Maksimal 8 menu navigasi dan 15 tautan.');return;}
  await save({storefront_slug:slug,storefront_config:form,storefront_published:published});
 }
 const waDigits=String(profile?.phone||'').replace(/\D/g,'').replace(/^0/,'62');
 const previewLinks=(form.links||[]).filter((x:any)=>x.label&&x.url);
 return <div className="sd-storefront-builder">
  <div className="sd-section-top"><div><span className="sd-kicker">YOUR PAGE / LINK IN BIO</span><h2>Landing page toko</h2><p>Atur halaman publik toko seperti mini-website: profil, menu, tautan, produk, dan artikel.</p></div>{published&&active&&<a className="sd-btn" href={publicUrl} target="_blank" rel="noopener noreferrer"><Eye size={15}/>Lihat halaman live<ArrowUpRight size={14}/></a>}</div>
  {!active&&<div className="sd-note"><Globe size={17}/><span>Landing page bisa diedit setelah toko disetujui admin dan status seller aktif.</span></div>}
  {localError&&<div className="sd-alert error">{localError}</div>}
  <div className="sd-storefront-grid">
   <form className="sd-panel sd-form sd-storefront-form" onSubmit={submit}>
    <div className="sd-panel-head"><div><span className="sd-kicker">01 / PAGE IDENTITY</span><h2>Identitas & URL</h2><p>URL ini yang dibagikan ke bio Instagram, TikTok, WhatsApp, atau kartu nama.</p></div><Globe size={20}/></div>
    <label>URL unik toko<div className="sd-slug-field"><span>bisabikinweb.site/toko/</span><input required maxLength={52} value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').slice(0,52))}/><span>/</span></div><small>Gunakan nama brand yang mudah diingat. Jangan gunakan spasi.</small></label>
    <label>Headline utama<input maxLength={140} value={form.headline||''} onChange={e=>update('headline',e.target.value)} placeholder={profile.store_name||'Nama brand kamu'}/></label>
    <label>Tagline pendek<input maxLength={120} value={form.tagline||''} onChange={e=>update('tagline',e.target.value)} placeholder="Contoh: Everyday essentials, made with care"/></label>
    <label>Bio / deskripsi halaman<textarea rows={4} maxLength={700} value={form.bio||''} onChange={e=>update('bio',e.target.value)} placeholder="Ceritakan brand, nilai, produk, dan alasan orang perlu mengenal toko kamu."/></label>
    <div className="sd-two-col">
     <label>Tema halaman<select value={form.theme||'cream'} onChange={e=>update('theme',e.target.value)}><option value="cream">Cream editorial</option><option value="light">Putih minimal</option><option value="dark">Dark premium</option></select></label>
     <label>Warna aksen<input type="color" value={form.accent_color||'#d7a96b'} onChange={e=>update('accent_color',e.target.value)}/></label>
    </div>
    <div className="sd-two-col">
     <label>Bentuk tombol<select value={form.button_style||'pill'} onChange={e=>update('button_style',e.target.value)}><option value="pill">Pill</option><option value="rounded">Rounded</option><option value="square">Kotak</option></select></label>
     <label>Layout<select value={form.layout||'centered'} onChange={e=>update('layout',e.target.value)}><option value="centered">Centered / link-in-bio</option><option value="editorial">Editorial / brand page</option></select></label>
    </div>
    <div className="sd-two-col">
     <label>Foto profil / logo<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={Boolean(uploading)} onChange={e=>void upload('avatar_url',e)}/><small>{uploading==='avatar_url'?'Mengupload…':'JPG, PNG, WEBP, AVIF · maksimal 5 MB.'}</small></label>
     <label>Banner halaman<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={Boolean(uploading)} onChange={e=>void upload('cover_url',e)}/><small>{uploading==='cover_url'?'Mengupload…':'Banner lebar untuk bagian atas halaman.'}</small></label>
    </div>
    {(form.avatar_url||form.cover_url)&&<div className="sd-storefront-image-previews">{form.avatar_url&&<div><img className="avatar" src={form.avatar_url} alt="Foto profil"/><button type="button" className="sd-text-btn" onClick={()=>update('avatar_url','')}>Hapus foto profil</button></div>}{form.cover_url&&<div><img className="cover" src={form.cover_url} alt="Banner"/><button type="button" className="sd-text-btn" onClick={()=>update('cover_url','')}>Hapus banner</button></div>}</div>}
    <div className="sd-panel-head sd-inner-head"><div><span className="sd-kicker">02 / NAVIGATION</span><h2>Menu navigasi</h2><p>Menu tampil di bagian atas landing page. Tujuan bisa berupa #about, #links, #products, #articles, atau URL HTTPS.</p></div><Link2 size={19}/></div>
    {(form.menu_items||[]).map((item:any,index:number)=><div className="sd-storefront-row" key={'menu-'+index}><label>Label menu<input maxLength={40} value={item.label||''} onChange={e=>updateRow('menu_items',index,'label',e.target.value)} placeholder="Contoh: Produk"/></label><label>Tujuan / URL<input maxLength={500} value={item.href||''} onChange={e=>updateRow('menu_items',index,'href',e.target.value)} placeholder="#products atau https://..."/></label><button type="button" className="sd-icon-btn danger" onClick={()=>removeRow('menu_items',index)} aria-label="Hapus menu"><Trash2 size={15}/></button></div>)}
    <button type="button" className="sd-btn" disabled={(form.menu_items||[]).length>=8} onClick={()=>addRow('menu_items')}><Plus size={15}/>Tambah menu</button>
    <div className="sd-panel-head sd-inner-head"><div><span className="sd-kicker">03 / LINK BLOCKS</span><h2>Menu tautan / tombol</h2><p>Buat tombol ke WhatsApp, katalog, marketplace, formulir, sosial media, atau website eksternal.</p></div><Link2 size={19}/></div>
    {(form.links||[]).map((item:any,index:number)=><div className="sd-storefront-link-editor" key={'link-'+index}><div className="sd-storefront-row"><label>Nama tombol<input maxLength={80} value={item.label||''} onChange={e=>updateRow('links',index,'label',e.target.value)} placeholder="Contoh: Pesan via WhatsApp"/></label><button type="button" className="sd-icon-btn danger" onClick={()=>removeRow('links',index)} aria-label="Hapus tautan"><Trash2 size={15}/></button></div><label>URL tujuan<input type="url" maxLength={500} value={item.url||''} onChange={e=>updateRow('links',index,'url',e.target.value)} placeholder="https://..."/></label><label>Deskripsi kecil (opsional)<input maxLength={180} value={item.description||''} onChange={e=>updateRow('links',index,'description',e.target.value)} placeholder="Contoh: Konsultasi dan pemesanan"/></label></div>)}
    <button type="button" className="sd-btn" disabled={(form.links||[]).length>=15} onClick={()=>addRow('links')}><Plus size={15}/>Tambah tautan</button>
    <div className="sd-panel-head sd-inner-head"><div><span className="sd-kicker">04 / CONTENT SECTIONS</span><h2>Produk & artikel</h2><p>Pilih bagian yang ingin ditampilkan dan atur judulnya. Artikel dikelola melalui menu Artikel.</p></div><ImagePlus size={19}/></div>
    <label>Judul bagian produk<input maxLength={80} value={form.product_title||''} onChange={e=>update('product_title',e.target.value)} placeholder="Produk pilihan"/></label>
    <label>Judul bagian artikel<input maxLength={80} value={form.article_title||''} onChange={e=>update('article_title',e.target.value)} placeholder="Artikel terbaru"/></label>
    <label className="sd-checkbox-label"><input type="checkbox" checked={form.show_products!==false} onChange={e=>update('show_products',e.target.checked)}/><span>Tampilkan produk yang sudah disetujui admin dan aktif.</span></label>
    <label className="sd-checkbox-label"><input type="checkbox" checked={form.show_articles!==false} onChange={e=>update('show_articles',e.target.checked)}/><span>Tampilkan artikel yang sudah diterbitkan.</span></label>
    <label className="sd-checkbox-label sd-publish-toggle"><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/><span><b>Publikasikan landing page</b><small>Jika aktif, halaman dapat dibuka publik melalui URL toko. Seller harus berstatus aktif.</small></span></label>
    <button className="sd-btn primary" disabled={busy||!active||Boolean(uploading)}><Save size={16}/>{busy?'Menyimpan…':'Simpan & perbarui landing page'}</button>
    {published&&active&&<div className="sd-published-url"><span>URL publik</span><a href={publicUrl} target="_blank" rel="noopener noreferrer">{publicUrl}<ArrowUpRight size={14}/></a><button type="button" className="sd-btn" onClick={()=>void navigator.clipboard?.writeText(publicUrl)}>Salin URL</button></div>}
   </form>
   <aside className="sd-storefront-preview-wrap"><div className="sd-panel-head"><div><span className="sd-kicker">LIVE PREVIEW</span><h2>Preview tampilan</h2><p>Pratinjau mengikuti pengaturan saat ini sebelum disimpan.</p></div><Eye size={20}/></div><div className={'sd-storefront-preview theme-'+(form.theme||'cream')} style={{'--sf-accent':form.accent_color||'#d7a96b'} as React.CSSProperties}>
    {form.cover_url?<img className="sf-preview-cover" src={form.cover_url} alt="Banner preview"/>:<div className="sf-preview-cover sf-preview-cover-empty"/>}
    {form.avatar_url?<img className="sf-preview-avatar" src={form.avatar_url} alt="Logo preview"/>:<div className="sf-preview-avatar sf-preview-avatar-empty">{String(profile.store_name||'S').slice(0,1).toUpperCase()}</div>}
    <small>{form.tagline||profile.business_category||'YOUR BRAND / YOUR SPACE'}</small><h3>{form.headline||profile.store_name}</h3><p>{form.bio||profile.description||'Deskripsi brand akan tampil di sini.'}</p>
    {(form.menu_items||[]).length>0&&<nav>{form.menu_items.filter((x:any)=>x.label).map((item:any,i:number)=><span key={i}>{item.label}</span>)}</nav>}
    <div className="sf-preview-link-list">{previewLinks.length?previewLinks.map((item:any,i:number)=><div className="sf-preview-link" key={i}><b>{item.label}</b>{item.description&&<small>{item.description}</small>}</div>):<div className="sf-preview-link"><b>Link / CTA kamu</b><small>Tambahkan tautan untuk mulai membangun landing page.</small></div>}</div>
    <div className="sf-preview-sections">{form.show_products&&<span>Produk pilihan · {(dataProductsCount(profile,0))}</span>}{form.show_articles&&<span>{form.article_title||'Artikel terbaru'}</span>}</div>
   </div><div className="sd-note"><Globe size={16}/><span>Landing page publik hanya menampilkan produk yang sudah lolos review admin dan artikel berstatus terbit.</span></div></aside>
  </div>
 </div>;
}
function dataProductsCount(_profile:any,_count:number){return 'otomatis';}
