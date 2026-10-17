'use client';
import {useEffect,useMemo,useState} from 'react';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Globe2,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  X
} from 'lucide-react';
import type {AdminSession} from '../lib/supabase';
import {
  adminDeleteLead,
  adminDeletePortfolio,
  adminGetSettings,
  adminListLeads,
  adminListPortfolio,
  adminSavePortfolio,
  adminSaveSettings,
  adminUpdateLead,
  assertAdmin,
  getSession,
  signIn,
  signOut,
  signUp
} from '../lib/supabase';

const blankProject={
  id:'',name:'',domain:'',category:'Company Profile',tag:'BUSINESS / WEBSITE',
  description:'',live:'https://',theme:'trade',technology:'Website',features:[],
  sort_order:100,is_active:true
};

const emptySettings={
  whatsapp:'62882003740969',email:'bisabikinw3b@gmail.com',instagram:'',tiktok:'',
  threads:'',linkedin:'',announcement:'',hero_label:'INDEPENDENT DIGITAL STUDIO · INDONESIA',
  headline:'',description:''
};

const leadStatuses=['new','contacted','proposal','won','lost','spam'];
const statusLabel:any={new:'Baru',contacted:'Dihubungi',proposal:'Proposal',won:'Won',lost:'Lost',spam:'Spam'};
type Page='overview'|'leads'|'portfolio'|'settings';

export default function Admin(){
  const [session,setSession]=useState<AdminSession|null>(null);
  const [booting,setBooting]=useState(true);
  const [mode,setMode]=useState<'login'|'signup'>('login');
  const [email,setEmail]=useState('bisabikinw3b@gmail.com');
  const [password,setPassword]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [page,setPage]=useState<Page>('overview');
  const [menuOpen,setMenuOpen]=useState(false);
  const [leads,setLeads]=useState<any[]>([]);
  const [portfolio,setPortfolio]=useState<any[]>([]);
  const [settings,setSettings]=useState<any>(emptySettings);
  const [project,setProject]=useState<any>({...blankProject});
  const [busy,setBusy]=useState(false);

  const stats=useMemo(()=>({
    all:leads.length,
    new:leads.filter(x=>x.status==='new').length,
    proposal:leads.filter(x=>x.status==='proposal').length,
    won:leads.filter(x=>x.status==='won').length
  }),[leads]);

  const pageTitle={overview:'Overview',leads:'Leads',portfolio:'Portfolio',settings:'Pengaturan Website'}[page];
  const pageDescription={
    overview:'Ringkasan aktivitas Bisabikinweb dan data terbaru.',
    leads:'Kelola inquiry dan progres calon customer dari form website.',
    portfolio:'Atur project yang tampil di halaman portfolio publik.',
    settings:'Ubah kontak, headline, announcement, dan social link website.'
  }[page];

  async function loadDashboard(s:AdminSession){
    const [leadRows,projectRows,siteSettings]=await Promise.all([
      adminListLeads(s),adminListPortfolio(s),adminGetSettings(s)
    ]);
    setLeads(Array.isArray(leadRows)?leadRows:[]);
    setPortfolio(Array.isArray(projectRows)?projectRows:[]);
    if(siteSettings)setSettings(siteSettings);
  }

  useEffect(()=>{
    let active=true;
    (async()=>{
      const current=await getSession();
      if(!active)return;
      if(current){
        try{
          await assertAdmin(current);
          if(!active)return;
          setSession(current);
          await loadDashboard(current);
        }catch(err:any){
          await signOut(current);
          if(active)setError(err.message||'Sesi admin tidak valid.');
        }
      }
      if(active)setBooting(false);
    })();
    return()=>{active=false};
  },[]);

  function navigate(next:Page){setPage(next);setMenuOpen(false);setError('');setMessage('')}

  async function handleAuth(e:any){
    e.preventDefault();
    setBusy(true);setError('');setMessage('');
    try{
      if(mode==='signup'){
        await signUp(email,password);
        setMessage('Akun dibuat. Jika ada email konfirmasi Supabase, konfirmasi dulu lalu kembali untuk login.');
        setMode('login');setPassword('');
        return;
      }
      const next=await signIn(email,password);
      await assertAdmin(next);
      setSession(next);
      await loadDashboard(next);
    }catch(err:any){setError(err.message||'Login gagal.')}
    finally{setBusy(false)}
  }

  async function handleLogout(){
    await signOut(session);
    setSession(null);setPassword('');setMessage('');setError('');setMenuOpen(false);
  }

  async function handleRefresh(){
    if(!session)return;
    setBusy(true);setError('');
    try{await loadDashboard(session)}
    catch(err:any){setError(err.message||'Gagal memuat data.')}
    finally{setBusy(false)}
  }

  async function handleLeadStatus(id:string,status:string){
    if(!session)return;
    try{
      await adminUpdateLead(session,id,status);
      setLeads(rows=>rows.map(row=>row.id===id?{...row,status}:row));
    }catch(err:any){setError(err.message||'Gagal memperbarui lead.')}
  }

  async function handleLeadDelete(id:string){
    if(!session||!window.confirm('Hapus lead ini?'))return;
    try{
      await adminDeleteLead(session,id);
      setLeads(rows=>rows.filter(row=>row.id!==id));
    }catch(err:any){setError(err.message||'Gagal menghapus lead.')}
  }

  async function handleProjectSave(e:any){
    e.preventDefault();
    if(!session)return;
    setBusy(true);setError('');setMessage('');
    try{
      const saved=await adminSavePortfolio(session,project);
      const item=Array.isArray(saved)&&saved[0]?saved[0]:project;
      setPortfolio(rows=>[...rows.filter(row=>row.id!==item.id),item].sort((a,b)=>a.sort_order-b.sort_order));
      setProject({...item,features:Array.isArray(item.features)?item.features:[]});
      setMessage('Project berhasil disimpan.');
    }catch(err:any){setError(err.message||'Gagal menyimpan project.')}
    finally{setBusy(false)}
  }

  async function handleProjectDelete(){
    if(!session||!project.id||!window.confirm('Hapus project ini?'))return;
    try{
      await adminDeletePortfolio(session,project.id);
      setPortfolio(rows=>rows.filter(row=>row.id!==project.id));
      setProject({...blankProject});
      setMessage('Project dihapus.');
    }catch(err:any){setError(err.message||'Gagal menghapus project.')}
  }

  async function handleSettingsSave(e:any){
    e.preventDefault();
    if(!session)return;
    setBusy(true);setError('');setMessage('');
    try{await adminSaveSettings(session,settings);setMessage('Pengaturan website tersimpan.')}
    catch(err:any){setError(err.message||'Gagal menyimpan pengaturan.')}
    finally{setBusy(false)}
  }

  function LeadRows({items,compact=false}:{items:any[],compact?:boolean}){
    return <>
      <div className="admin-lead-desktop">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Customer</th><th>Kebutuhan</th><th>{compact?'Masuk':'Pesan'}</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>{items.map(lead=><tr key={lead.id}>
              <td><strong>{lead.name||'Tanpa nama'}</strong><small>{lead.company||'-'} · {lead.phone||'-'}<br/>{lead.email||'-'}</small></td>
              <td><strong>{lead.website_type||'-'}</strong><small>{lead.budget||'-'} · {lead.deadline||'Tanpa deadline'}</small></td>
              <td className="admin-lead-message">{compact?new Date(lead.created_at).toLocaleDateString('id-ID'):(lead.message||lead.features||'-')}</td>
              <td><select value={lead.status||'new'} onChange={e=>handleLeadStatus(lead.id,e.target.value)}>{leadStatuses.map(status=><option key={status} value={status}>{statusLabel[status]}</option>)}</select></td>
              <td><button className="admin-icon-btn danger" aria-label="Hapus lead" onClick={()=>handleLeadDelete(lead.id)}><Trash2 size={16}/></button></td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
      <div className="admin-lead-mobile">{items.map(lead=><article className="admin-lead-card" key={lead.id}>
        <div className="admin-lead-card-top"><div><strong>{lead.name||'Tanpa nama'}</strong><span>{lead.website_type||'Inquiry website'}</span></div><span className={`admin-status ${lead.status||'new'}`}>{statusLabel[lead.status||'new']}</span></div>
        <div className="admin-lead-card-meta"><span>{lead.phone||'-'}</span><span>{lead.email||'-'}</span><span>{lead.budget||'-'}</span></div>
        {!compact&&<p>{lead.message||lead.features||'Tidak ada pesan.'}</p>}
        <div className="admin-lead-card-actions"><select value={lead.status||'new'} onChange={e=>handleLeadStatus(lead.id,e.target.value)}>{leadStatuses.map(status=><option key={status} value={status}>{statusLabel[status]}</option>)}</select><button className="admin-icon-btn danger" onClick={()=>handleLeadDelete(lead.id)}><Trash2 size={16}/></button></div>
      </article>)}</div>
      {!items.length&&<div className="admin-empty">Belum ada lead.</div>}
    </>;
  }

  if(booting)return <section className="admin-page admin-auth-page"><div className="admin-loading"><span className="admin-loader"/>Memuat Bisabikinweb Admin…</div></section>;

  if(!session)return <section className="admin-page admin-auth-page">
    <div className="admin-login-wrap"><div className="admin-login">
      <div className="admin-brand"><span className="admin-brand-mark">B</span><div><strong>Bisabikinweb</strong><small>Admin Studio</small></div></div>
      <div className="admin-login-heading"><span>SECURE ADMIN</span><h1>{mode==='login'?'Welcome back.':'Create admin.'}</h1><p>Masuk untuk mengelola lead, portfolio, dan konten utama website.</p></div>
      {error&&<div className="admin-alert error">{error}</div>}
      {message&&<div className="admin-alert success">{message}</div>}
      <form className="admin-form" onSubmit={handleAuth}>
        <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
        <label>Password<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='login'?'current-password':'new-password'}/></label>
        <button className="admin-btn primary wide-btn" disabled={busy}>{busy?'Memproses…':mode==='login'?'Masuk ke dashboard':'Buat akun admin'}<ArrowUpRight size={16}/></button>
      </form>
      <div className="admin-login-switch"><span>{mode==='login'?'Belum punya akun admin?':'Sudah punya akun?'}</span><button type="button" onClick={()=>{setMode(mode==='login'?'signup':'login');setError('');setMessage('')}}>{mode==='login'?'Buat akun pertama':'Kembali ke login'}</button></div>
      <div className="admin-note">Akses admin dibatasi oleh Supabase RLS untuk <b>bisabikinw3b@gmail.com</b>.</div>
    </div></div>
  </section>;

  const recentLeads=leads.slice(0,5);

  return <section className="admin-page admin-app">
    <button className={`admin-overlay ${menuOpen?'show':''}`} aria-label="Tutup menu" onClick={()=>setMenuOpen(false)}/>
    <aside className={`admin-sidebar ${menuOpen?'open':''}`}>
      <div className="admin-sidebar-head"><a className="admin-logo" href="/admin/"><span>B</span><div><strong>Bisabikinweb</strong><small>Admin Studio</small></div></a><button className="admin-mobile-close" onClick={()=>setMenuOpen(false)}><X size={19}/></button></div>
      <nav className="admin-nav" aria-label="Admin navigation">
        <span className="admin-nav-label">WORKSPACE</span>
        <button className={page==='overview'?'active':''} onClick={()=>navigate('overview')}><LayoutDashboard size={18}/><span>Overview</span></button>
        <button className={page==='leads'?'active':''} onClick={()=>navigate('leads')}><Inbox size={18}/><span>Leads</span>{stats.new>0&&<b>{stats.new}</b>}</button>
        <button className={page==='portfolio'?'active':''} onClick={()=>navigate('portfolio')}><BriefcaseBusiness size={18}/><span>Portfolio</span></button>
        <button className={page==='settings'?'active':''} onClick={()=>navigate('settings')}><Settings size={18}/><span>Website Settings</span></button>
      </nav>
      <div className="admin-sidebar-bottom">
        <a className="admin-view-site" href="/" target="_blank" rel="noreferrer"><Globe2 size={17}/><span>Lihat website</span><ArrowUpRight size={14}/></a>
        <div className="admin-user-card"><div className="admin-avatar">B</div><div><strong>Owner</strong><small>{session.user?.email}</small></div><button aria-label="Logout" onClick={handleLogout}><LogOut size={17}/></button></div>
      </div>
    </aside>

    <main className="admin-main">
      <header className="admin-header">
        <div className="admin-header-left"><button className="admin-menu-btn" onClick={()=>setMenuOpen(true)}><Menu size={20}/></button><div><span>ADMIN / {page.toUpperCase()}</span><h1>{pageTitle}</h1><p>{pageDescription}</p></div></div>
        <div className="admin-header-actions"><button className="admin-btn" onClick={handleRefresh} disabled={busy}><RefreshCw size={15}/><span>Refresh</span></button><a className="admin-btn primary" href="/" target="_blank" rel="noreferrer">Live site<ArrowUpRight size={15}/></a></div>
      </header>

      <div className="admin-content">
        {error&&<div className="admin-alert error">{error}</div>}
        {message&&<div className="admin-alert success">{message}</div>}

        {page==='overview'&&<>
          <div className="admin-stats">
            <button onClick={()=>navigate('leads')} className="admin-stat"><span>Total Leads</span><strong>{stats.all}</strong><small>Semua inquiry website</small></button>
            <button onClick={()=>navigate('leads')} className="admin-stat"><span>Lead Baru</span><strong>{stats.new}</strong><small>Butuh follow-up</small></button>
            <button onClick={()=>navigate('leads')} className="admin-stat"><span>Proposal</span><strong>{stats.proposal}</strong><small>Sedang diproses</small></button>
            <button onClick={()=>navigate('portfolio')} className="admin-stat"><span>Portfolio</span><strong>{portfolio.filter(x=>x.is_active).length}</strong><small>Project aktif</small></button>
          </div>
          <div className="admin-overview-grid">
            <section className="admin-panel admin-recent-panel"><div className="admin-panel-head"><div><span className="admin-section-kicker">RECENT ACTIVITY</span><h2>Lead terbaru</h2><p>Inquiry terbaru yang masuk dari website.</p></div><button className="admin-text-btn" onClick={()=>navigate('leads')}>Lihat semua <ArrowUpRight size={14}/></button></div><LeadRows items={recentLeads} compact/></section>
            <aside className="admin-panel admin-quick-panel"><span className="admin-section-kicker">QUICK ACTIONS</span><h2>Kelola website</h2><p>Akses bagian yang paling sering digunakan.</p><button onClick={()=>navigate('portfolio')}><BriefcaseBusiness size={18}/><div><strong>Tambah portfolio</strong><small>Update project website</small></div><ArrowUpRight size={15}/></button><button onClick={()=>navigate('settings')}><Settings size={18}/><div><strong>Edit website</strong><small>Kontak & headline</small></div><ArrowUpRight size={15}/></button><a href="/" target="_blank" rel="noreferrer"><Globe2 size={18}/><div><strong>Buka live site</strong><small>bisabikinweb.site</small></div><ArrowUpRight size={15}/></a></aside>
          </div>
        </>}

        {page==='leads'&&<section className="admin-panel"><div className="admin-panel-head"><div><span className="admin-section-kicker">CUSTOMER INQUIRY</span><h2>Semua leads</h2><p>Data tersimpan di Supabase sebelum customer diarahkan ke WhatsApp.</p></div><span className="admin-count-pill">{leads.length} lead</span></div><LeadRows items={leads}/></section>}

        {page==='portfolio'&&<div className="admin-portfolio-layout">
          <section className="admin-panel admin-project-list"><div className="admin-panel-head"><div><span className="admin-section-kicker">PROJECTS</span><h2>Portfolio</h2><p>{portfolio.length} project tersimpan</p></div><button className="admin-btn primary" onClick={()=>{setProject({...blankProject});setMessage('')}}><Plus size={15}/>Project baru</button></div><div className="admin-project-items">{portfolio.map(item=><button key={item.id} className={project.id===item.id?'active':''} onClick={()=>{setProject({...item,features:Array.isArray(item.features)?item.features:[]});setMessage('')}}><span className={`admin-project-dot ${item.is_active?'live':'draft'}`}/><div><strong>{item.name}</strong><small>{item.domain||item.live}</small></div><span>{item.is_active?'Live':'Draft'}</span></button>)}</div></section>
          <section className="admin-panel admin-editor"><div className="admin-panel-head"><div><span className="admin-section-kicker">EDITOR</span><h2>{project.id?'Edit project':'Project baru'}</h2><p>Simpan untuk memperbarui portfolio publik.</p></div></div><form className="admin-form admin-form-grid" onSubmit={handleProjectSave}>
            <label>ID / slug<input required pattern="[a-z0-9-]+" value={project.id} onChange={e=>setProject({...project,id:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-')})}/></label>
            <label>Nama project<input required value={project.name} onChange={e=>setProject({...project,name:e.target.value})}/></label>
            <label>Domain<input value={project.domain} onChange={e=>setProject({...project,domain:e.target.value})}/></label>
            <label>Kategori<input value={project.category} onChange={e=>setProject({...project,category:e.target.value})}/></label>
            <label>Tag<input value={project.tag} onChange={e=>setProject({...project,tag:e.target.value})}/></label>
            <label>Live URL<input required type="url" value={project.live} onChange={e=>setProject({...project,live:e.target.value})}/></label>
            <label>Tema<select value={project.theme} onChange={e=>setProject({...project,theme:e.target.value})}><option value="trade">Trade</option><option value="warehouse">Warehouse</option><option value="beauty">Beauty</option></select></label>
            <label>Urutan<input type="number" value={project.sort_order} onChange={e=>setProject({...project,sort_order:Number(e.target.value)})}/></label>
            <label className="wide">Deskripsi<textarea value={project.description} onChange={e=>setProject({...project,description:e.target.value})}/></label>
            <label className="wide">Fitur, pisahkan koma<input value={(project.features||[]).join(', ')} onChange={e=>setProject({...project,features:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})}/></label>
            <label className="admin-check wide"><input type="checkbox" checked={Boolean(project.is_active)} onChange={e=>setProject({...project,is_active:e.target.checked})}/><span>Tampilkan project di website</span></label>
            <div className="admin-form-footer wide"><button className="admin-btn primary" disabled={busy}><Save size={15}/>Simpan project</button>{project.id&&portfolio.some(item=>item.id===project.id)&&<button type="button" className="admin-btn danger" onClick={handleProjectDelete}><Trash2 size={15}/>Hapus project</button>}</div>
          </form></section>
        </div>}

        {page==='settings'&&<section className="admin-panel admin-settings-panel"><div className="admin-panel-head"><div><span className="admin-section-kicker">PUBLIC WEBSITE</span><h2>Website settings</h2><p>Konten utama ini langsung dipakai website publik.</p></div></div><form className="admin-form admin-form-grid" onSubmit={handleSettingsSave}>
          <label>WhatsApp<input value={settings.whatsapp||''} onChange={e=>setSettings({...settings,whatsapp:e.target.value})}/></label>
          <label>Email<input type="email" value={settings.email||''} onChange={e=>setSettings({...settings,email:e.target.value})}/></label>
          <label>Instagram<input value={settings.instagram||''} onChange={e=>setSettings({...settings,instagram:e.target.value})}/></label>
          <label>TikTok<input value={settings.tiktok||''} onChange={e=>setSettings({...settings,tiktok:e.target.value})}/></label>
          <label>Threads<input value={settings.threads||''} onChange={e=>setSettings({...settings,threads:e.target.value})}/></label>
          <label>LinkedIn<input value={settings.linkedin||''} onChange={e=>setSettings({...settings,linkedin:e.target.value})}/></label>
          <label className="wide">Announcement<input value={settings.announcement||''} onChange={e=>setSettings({...settings,announcement:e.target.value})}/></label>
          <label className="wide">Hero label<input value={settings.hero_label||''} onChange={e=>setSettings({...settings,hero_label:e.target.value})}/></label>
          <label className="wide">Headline<textarea value={settings.headline||''} onChange={e=>setSettings({...settings,headline:e.target.value})}/></label>
          <label className="wide">Deskripsi<textarea value={settings.description||''} onChange={e=>setSettings({...settings,description:e.target.value})}/></label>
          <div className="admin-form-footer wide"><span className="admin-form-hint">Perubahan akan dibaca website publik dari Supabase.</span><button className="admin-btn primary" disabled={busy}><Save size={15}/>Simpan perubahan</button></div>
        </form></section>}
      </div>
    </main>
  </section>;
}
