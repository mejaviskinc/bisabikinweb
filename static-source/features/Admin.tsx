'use client';
import {useEffect,useMemo,useState} from 'react';
import {ArrowUpRight,LogOut,Plus,RefreshCw,Save,Trash2} from 'lucide-react';
import './admin.css';
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

export default function Admin(){
  const [session,setSession]=useState<AdminSession|null>(null);
  const [booting,setBooting]=useState(true);
  const [mode,setMode]=useState<'login'|'signup'>('login');
  const [email,setEmail]=useState('bisabikinw3b@gmail.com');
  const [password,setPassword]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [tab,setTab]=useState<'leads'|'portfolio'|'settings'>('leads');
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

  async function handleAuth(e:any){
    e.preventDefault();
    setBusy(true);setError('');setMessage('');
    try{
      if(mode==='signup'){
        await signUp(email,password);
        setMessage('Akun dibuat. Jika Supabase mengirim email konfirmasi, konfirmasi dulu lalu kembali untuk login.');
        setMode('login');setPassword('');
        return;
      }
      const next=await signIn(email,password);
      await assertAdmin(next);
      setSession(next);
      await loadDashboard(next);
    }catch(err:any){
      setError(err.message||'Login gagal.');
    }finally{
      setBusy(false);
    }
  }

  async function handleLogout(){
    await signOut(session);
    setSession(null);setPassword('');setMessage('');setError('');
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
    try{
      await adminSaveSettings(session,settings);
      setMessage('Pengaturan website tersimpan.');
    }catch(err:any){setError(err.message||'Gagal menyimpan pengaturan.')}
    finally{setBusy(false)}
  }

  if(booting){
    return <section className="admin-page"><div className="admin-loading">Memuat admin Bisabikinweb…</div></section>;
  }

  if(!session){
    return <section className="admin-page">
      <div className="admin-login-wrap">
        <div className="admin-login">
          <div className="admin-brand">
            <span className="admin-brand-mark">{'{ }'}</span>
            <div><strong>Bisabikinweb Admin</strong><small>Supabase-secured dashboard</small></div>
          </div>
          <h1>{mode==='login'?'Masuk admin.':'Buat akun admin.'}</h1>
          <p>Akses hanya diberikan ke email owner yang sudah masuk allowlist database.</p>
          {error&&<div className="admin-error">{error}</div>}
          {message&&<div className="admin-success">{message}</div>}
          <form className="admin-form" onSubmit={handleAuth}>
            <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
            <label>Password<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='login'?'current-password':'new-password'}/></label>
            <button className="admin-btn primary" disabled={busy}>
              {busy?'Memproses…':mode==='login'?'Login':'Buat akun'} <ArrowUpRight size={16}/>
            </button>
          </form>
          <div className="admin-login-switch">
            <span>{mode==='login'?'Belum pernah membuat akun?':'Sudah punya akun?'}</span>
            <button type="button" onClick={()=>{setMode(mode==='login'?'signup':'login');setError('');setMessage('')}}>
              {mode==='login'?'Buat akun admin pertama':'Kembali ke login'}
            </button>
          </div>
          <div className="admin-note">Email admin yang diizinkan saat ini: <b>bisabikinw3b@gmail.com</b>. Akun lain tetap tidak dapat membaca data admin karena dibatasi RLS.</div>
        </div>
      </div>
    </section>;
  }

  return <section className="admin-page">
    <div className="admin-shell">
      <div className="admin-topbar">
        <div>
          <small className="eyebrow">BISABIKINWEB / ADMIN</small>
          <h1>Studio dashboard.</h1>
          <p>{session.user?.email}</p>
        </div>
        <div className="admin-actions">
          <a className="admin-btn" href="/" target="_blank" rel="noreferrer">Lihat website <ArrowUpRight size={15}/></a>
          <button className="admin-btn" onClick={handleRefresh} disabled={busy}><RefreshCw size={15}/>Refresh</button>
          <button className="admin-btn danger" onClick={handleLogout}><LogOut size={15}/>Logout</button>
        </div>
      </div>

      {error&&<div className="admin-error">{error}</div>}
      {message&&<div className="admin-success">{message}</div>}

      <div className="admin-tabs">
        <button className={tab==='leads'?'active':''} onClick={()=>setTab('leads')}>Leads</button>
        <button className={tab==='portfolio'?'active':''} onClick={()=>setTab('portfolio')}>Portfolio</button>
        <button className={tab==='settings'?'active':''} onClick={()=>setTab('settings')}>Pengaturan Website</button>
      </div>

      {tab==='leads'&&<>
        <div className="admin-stats">
          <div className="admin-stat"><strong>{stats.all}</strong><span>Total lead</span></div>
          <div className="admin-stat"><strong>{stats.new}</strong><span>Baru</span></div>
          <div className="admin-stat"><strong>{stats.proposal}</strong><span>Proposal</span></div>
          <div className="admin-stat"><strong>{stats.won}</strong><span>Won</span></div>
        </div>
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div><h2>Inquiry website</h2><p>Lead dari form konsultasi tersimpan di Supabase sebelum diarahkan ke WhatsApp.</p></div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Tanggal</th><th>Customer</th><th>Kebutuhan</th><th>Pesan</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>{leads.map(lead=><tr key={lead.id}>
                <td>{new Date(lead.created_at).toLocaleString('id-ID')}</td>
                <td><strong>{lead.name}</strong><small>{lead.company||'-'} · {lead.phone}<br/>{lead.email}</small></td>
                <td><strong>{lead.website_type||'-'}</strong><small>{lead.budget||'-'}<br/>{lead.deadline||'Tanpa deadline'}</small></td>
                <td className="admin-lead-message">{lead.message||lead.features||'-'}</td>
                <td><select value={lead.status} onChange={e=>handleLeadStatus(lead.id,e.target.value)}>{['new','contacted','proposal','won','lost','spam'].map(status=><option key={status} value={status}>{status}</option>)}</select></td>
                <td><button className="admin-mini-btn" aria-label="Hapus lead" onClick={()=>handleLeadDelete(lead.id)}><Trash2 size={16}/></button></td>
              </tr>)}</tbody>
            </table>
            {!leads.length&&<div className="admin-empty">Belum ada lead.</div>}
          </div>
        </div>
      </>}

      {tab==='portfolio'&&<div className="admin-grid">
        <div className="admin-panel admin-list">
          <div className="admin-panel-head">
            <div><h2>Portfolio</h2><p>{portfolio.length} project</p></div>
            <button className="admin-btn primary" onClick={()=>{setProject({...blankProject});setMessage('')}}><Plus size={15}/>Baru</button>
          </div>
          {portfolio.map(item=><button key={item.id} className={project.id===item.id?'active':''} onClick={()=>{setProject({...item,features:Array.isArray(item.features)?item.features:[]});setMessage('')}}>
            <strong>{item.name}</strong><small>{item.domain||item.live} · {item.is_active?'Aktif':'Draft'}</small>
          </button>)}
        </div>
        <div className="admin-panel">
          <div className="admin-panel-head"><div><h2>{project.id?'Edit project':'Project baru'}</h2><p>Perubahan tampil di website publik setelah disimpan.</p></div></div>
          <form className="admin-form admin-form-grid" onSubmit={handleProjectSave}>
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
            <label className="admin-check wide"><input type="checkbox" checked={Boolean(project.is_active)} onChange={e=>setProject({...project,is_active:e.target.checked})}/>Tampilkan di website</label>
            <div className="admin-form-footer wide">
              <button className="admin-btn primary" disabled={busy}><Save size={15}/>Simpan project</button>
              {project.id&&portfolio.some(item=>item.id===project.id)&&<button type="button" className="admin-btn danger" onClick={handleProjectDelete}><Trash2 size={15}/>Hapus</button>}
            </div>
          </form>
        </div>
      </div>}

      {tab==='settings'&&<div className="admin-panel">
        <div className="admin-panel-head"><div><h2>Pengaturan website</h2><p>Kontak, headline, announcement, dan social links.</p></div></div>
        <form className="admin-form admin-form-grid" onSubmit={handleSettingsSave}>
          <label>WhatsApp<input value={settings.whatsapp||''} onChange={e=>setSettings({...settings,whatsapp:e.target.value})}/></label>
          <label>Email<input type="email" value={settings.email||''} onChange={e=>setSettings({...settings,email:e.target.value})}/></label>
          <label>Instagram<input value={settings.instagram||''} onChange={e=>setSettings({...settings,instagram:e.target.value})}/></label>
          <label>TikTok<input value={settings.tiktok||''} onChange={e=>setSettings({...settings,tiktok:e.target.value})}/></label>
          <label>Threads<input value={settings.threads||''} onChange={e=>setSettings({...settings,threads:e.target.value})}/></label>
          <label>LinkedIn<input value={settings.linkedin||''} onChange={e=>setSettings({...settings,linkedin:e.target.value})}/></label>
          <label className="wide">Announcement<input value={settings.announcement||''} onChange={e=>setSettings({...settings,announcement:e.target.value})}/></label>
          <label className="wide">Hero label<input value={settings.hero_label||''} onChange={e=>setSettings({...settings,hero_label:e.target.value})}/></label>
          <label className="wide">Headline<input value={settings.headline||''} onChange={e=>setSettings({...settings,headline:e.target.value})}/></label>
          <label className="wide">Deskripsi<textarea value={settings.description||''} onChange={e=>setSettings({...settings,description:e.target.value})}/></label>
          <div className="admin-form-footer wide"><button className="admin-btn primary" disabled={busy}><Save size={15}/>Simpan pengaturan</button></div>
        </form>
      </div>}
    </div>
  </section>;
}
