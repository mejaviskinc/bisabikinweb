'use client';
import React, { useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Clock3, Heart, LogOut, MapPin, Package, RefreshCw, ShieldCheck, ShoppingBag, UserRound, Wallet } from 'lucide-react';
import { customerApi, customerGetSession, customerSendPasswordReset, customerSignIn, customerSignOut, customerSignUp, type CustomerSession } from '../lib/customer';
import { money } from '../lib/data';
import { ProductCard } from './Commerce';

const emptyAddress = { address: '', district: '', city: '', province: '', postcode: '' };
const emptyProfile = { full_name: '', phone: '', company: '', default_shipping_address: emptyAddress };
const stamp = (value: string) => value ? new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const paymentLabels: Record<string, string> = { unpaid: 'Belum dibayar', pending: 'Menunggu pembayaran', created: 'Menyiapkan pembayaran', paid: 'Pembayaran berhasil', authorized: 'Menunggu konfirmasi', payment_error: 'Pembayaran bermasalah', failed: 'Pembayaran gagal', expired: 'Kedaluwarsa', cancelled: 'Dibatalkan', refunded: 'Dikembalikan', partial_refund: 'Refund sebagian' };
const orderLabels: Record<string, string> = { new: 'Pesanan baru', waiting_payment: 'Menunggu pembayaran', paid: 'Sudah dibayar', processing: 'Sedang diproses', ready: 'Siap dikirim', packed: 'Dikemas', shipped: 'Dalam pengiriman', completed: 'Selesai', payment_error: 'Perlu pembayaran ulang', expired: 'Kedaluwarsa', cancelled: 'Dibatalkan', refunded: 'Refund', partial_refund: 'Refund sebagian' };
const statusClass = (value: string) => String(value || 'pending').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
const verified = (session: CustomerSession) => Boolean(session.user?.email_confirmed_at || session.user?.confirmed_at);

export default function BuyerDashboard({ wish, products, toggleWish }: { wish: string[]; products: any[]; toggleWish: (id: string) => void }) {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyOrder, setBusyOrder] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [tab, setTab] = useState<'overview' | 'orders' | 'profile' | 'favorites'>('overview');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [profile, setProfile] = useState<any>(emptyProfile);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadDashboard = async (s: CustomerSession) => {
    const result = await customerApi('dashboard', {}, s.access_token);
    const next = result.profile || {};
    setProfile({
      ...emptyProfile,
      ...next,
      default_shipping_address: { ...emptyAddress, ...(next.default_shipping_address || {}) }
    });
    setOrders(Array.isArray(result.orders) ? result.orders : []);
    return result;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await customerGetSession();
        if (!alive) return;
        if (s) {
          setSession(s);
          setEmail(s.user?.email || '');
          await loadDashboard(s);
        }
      } catch (e: any) {
        if (alive) setError(e?.message || 'Gagal memuat sesi akun.');
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'reset') {
        if (!email.trim()) throw new Error('Masukkan email akun terlebih dahulu.');
        await customerSendPasswordReset(email);
        setMessage('Jika email terdaftar, tautan pemulihan password akan dikirim. Periksa inbox dan folder spam.');
        return;
      }
      if (mode === 'signup') {
        if (password.length < 8) throw new Error('Password minimal 8 karakter.');
        if (registerName.trim().length < 2) throw new Error('Nama lengkap minimal 2 karakter.');
        if (registerPhone.replace(/\D/g, '').length < 8) throw new Error('Nomor WhatsApp belum valid.');
        const result = await customerSignUp(email, password, { full_name: registerName.trim(), phone: registerPhone.trim() });
        if (result.session && verified(result.session)) {
          setSession(result.session);
          await loadDashboard(result.session);
          setTab('overview');
          setMessage('Akun berhasil dibuat. Profil pembeli siap digunakan.');
        } else {
          if (result.session) await customerSignOut(result.session);
          setMode('login');
          setMessage('Akun berhasil didaftarkan. Buka email untuk verifikasi, lalu login di sini sebelum menggunakan dashboard pembeli.');
        }
        return;
      }
      const s = await customerSignIn(email, password);
      if (!verified(s)) {
        await customerSignOut(s);
        throw new Error('Email belum diverifikasi. Buka tautan verifikasi yang dikirim ke email, lalu login kembali.');
      }
      setSession(s);
      await loadDashboard(s);
      setTab('overview');
      setMessage('Berhasil login. Riwayat pesanan dan profil sudah dimuat.');
    } catch (e: any) {
      setError(e?.message || 'Autentikasi gagal. Periksa email dan password.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await customerApi('save_profile', { profile }, session.access_token);
      setProfile({ ...emptyProfile, ...(result.profile || profile), default_shipping_address: { ...emptyAddress, ...((result.profile || profile).default_shipping_address || {}) } });
      setOrders(Array.isArray(result.orders) ? result.orders : orders);
      setMessage('Profil dan alamat pengiriman berhasil disimpan.');
    } catch (e: any) {
      setError(e?.message || 'Profil gagal disimpan.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRetryPayment(orderNo: string) {
    if (!session) return;
    setBusyOrder(orderNo); setError(''); setMessage('');
    try {
      const result = await customerApi('retry_payment', { order_no: orderNo }, session.access_token);
      if (result.redirect_url) { location.assign(result.redirect_url); return; }
      if (result.paid) {
        await loadDashboard(session);
        setMessage('Pesanan ini sudah dibayar. Status terbaru sudah diperbarui.');
      }
    } catch (e: any) {
      setError(e?.message || 'Tautan pembayaran belum bisa dibuat.');
    } finally {
      setBusyOrder('');
    }
  }

  async function refresh() {
    if (!session) return;
    setBusy(true); setError(''); setMessage('');
    try { await loadDashboard(session); setMessage('Status pesanan diperbarui dari server.'); }
    catch (e: any) { setError(e?.message || 'Gagal memperbarui data.'); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    await customerSignOut(session);
    setSession(null); setOrders([]); setProfile(emptyProfile); setPassword(''); setMessage('Kamu sudah logout.');
    setBusy(false);
  }

  const unpaid = orders.filter(o => o.payment_status !== 'paid' && !['cancelled', 'refunded', 'partial_refund', 'completed'].includes(o.status)).length;
  const paid = orders.filter(o => o.payment_status === 'paid').length;

  if (booting) return <section className="section buyer-section"><div className="buyer-loading"><RefreshCw size={19}/> Memuat dashboard pembeli…</div></section>;

  return <section className="section buyer-section">
    <div className="page-intro buyer-intro">
      <span className="eyebrow">BISABIKINWEB.ID / CUSTOMER SPACE</span>
      <h1>{session ? 'Halo, ' + (profile.full_name || session.user?.user_metadata?.full_name || 'pembeli') + '.' : 'Akun pembeli.'}</h1>
      <p>{session ? 'Satu tempat untuk profil, alamat pengiriman, riwayat pesanan, dan status pembayaran.' : 'Login atau buat akun supaya detail pesanan dan pembayaran tersimpan di satu tempat.'}</p>
    </div>

    {!session ? <div className="buyer-auth-grid">
      <div className="buyer-panel buyer-auth-story">
        <span className="buyer-mark"><UserRound size={22}/></span>
        <span className="eyebrow">YOUR SHOPPING SPACE</span>
        <h2>Belanja lebih rapi.<br/><em>Pesanan gampang dilacak.</em></h2>
        <div className="buyer-benefit"><Package size={18}/><span><b>Riwayat pesanan</b><small>Lihat item, total, dan status pesanan.</small></span></div>
        <div className="buyer-benefit"><ShieldCheck size={18}/><span><b>Akun lebih aman</b><small>Verifikasi email dan sesi login terpisah dari admin.</small></span></div>
        <div className="buyer-benefit"><MapPin size={18}/><span><b>Alamat tersimpan</b><small>Isi data pengiriman sekali, gunakan lagi saat checkout.</small></span></div>
      </div>
      <form className="consult-form buyer-auth-form" onSubmit={handleAuth}>
        <div className="buyer-form-heading"><span className="eyebrow">{mode === 'signup' ? 'CREATE CUSTOMER ACCOUNT' : mode === 'reset' ? 'RESET PASSWORD' : 'WELCOME BACK'}</span><h2>{mode === 'signup' ? 'Buat akun pembeli' : mode === 'reset' ? 'Pulihkan password' : 'Login pembeli'}</h2></div>
        {mode === 'signup' && <>
          <label>Nama lengkap *<input value={registerName} onChange={e => setRegisterName(e.target.value)} required minLength={2} maxLength={120} autoComplete="name"/></label>
          <label>Nomor WhatsApp *<input value={registerPhone} onChange={e => setRegisterPhone(e.target.value)} required minLength={8} maxLength={40} type="tel" autoComplete="tel"/></label>
        </>}
        <label>Email *<input value={email} onChange={e => setEmail(e.target.value)} required type="email" maxLength={254} autoComplete="email"/></label>
        {mode !== 'reset' && <label>Password *<input value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={128} type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}/><small>Minimal 8 karakter. Gunakan password unik.</small></label>}
        {error && <p className="error" role="alert">{error}</p>}
        {message && <p className="info-box" role="status">{message}</p>}
        <button className="btn primary buyer-submit" disabled={busy}>{busy ? 'Memproses…' : mode === 'signup' ? 'Daftar akun' : mode === 'reset' ? 'Kirim tautan reset' : 'Login'} <ArrowUpRight size={17}/></button>
        <div className="buyer-auth-links">
          {mode === 'login' && <button type="button" className="text-link" onClick={() => { setMode('reset'); setError(''); setMessage(''); }}>Lupa password?</button>}
          {mode !== 'login' && <button type="button" className="text-link" onClick={() => { setMode('login'); setError(''); setMessage(''); }}>Kembali ke login</button>}
          {mode !== 'signup' && <button type="button" className="text-link" onClick={() => { setMode('signup'); setError(''); setMessage(''); }}>Buat akun baru</button>}
          {mode === 'signup' && <button type="button" className="text-link" onClick={() => { setMode('login'); setError(''); setMessage(''); }}>Sudah punya akun? Login</button>}
        </div>
        <p className="buyer-privacy-note">Jangan bagikan password, OTP, PIN, atau data kartu kepada siapa pun. Pembayaran tetap diproses di halaman resmi Midtrans.</p>
      </form>
    </div> : <div className="buyer-dashboard">
      <div className="buyer-toolbar">
        <div><span className="buyer-account-email">{session.user?.email}</span><span className="buyer-verified"><CheckCircle2 size={14}/> Email terverifikasi</span></div>
        <div className="buyer-toolbar-actions"><button type="button" className="btn buyer-secondary" onClick={refresh} disabled={busy}><RefreshCw size={16}/> Refresh</button><button type="button" className="btn buyer-secondary" onClick={logout} disabled={busy}><LogOut size={16}/> Logout</button></div>
      </div>
      <nav className="buyer-tabs" aria-label="Menu dashboard pembeli">
        <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}><Wallet size={16}/> Ringkasan</button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}><Package size={16}/> Pesanan <span>{orders.length}</span></button>
        <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}><UserRound size={16}/> Profil & alamat</button>
        <button className={tab === 'favorites' ? 'active' : ''} onClick={() => setTab('favorites')}><Heart size={16}/> Favorit <span>{wish.length}</span></button>
      </nav>
      {error && <p className="error buyer-alert" role="alert">{error}</p>}
      {message && <p className="info-box buyer-alert" role="status">{message}</p>}

      {tab === 'overview' && <>
        <div className="buyer-stats">
          <article className="buyer-stat"><span><Package size={17}/></span><small>Total pesanan</small><strong>{orders.length}</strong><p>Semua pesanan akun ini</p></article>
          <article className="buyer-stat"><span><Clock3 size={17}/></span><small>Menunggu pembayaran</small><strong>{unpaid}</strong><p>Pesanan yang belum lunas</p></article>
          <article className="buyer-stat"><span><CheckCircle2 size={17}/></span><small>Berhasil dibayar</small><strong>{paid}</strong><p>Konfirmasi berasal dari server</p></article>
        </div>
        <div className="buyer-section-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Pesanan terbaru</h2></div><button type="button" className="text-link" onClick={() => setTab('orders')}>Lihat semua <ArrowUpRight size={16}/></button></div>
        {orders.slice(0, 3).length ? <div className="buyer-order-list">{orders.slice(0, 3).map(order => <OrderCard key={order.id} order={order} busyOrder={busyOrder} onRetry={handleRetryPayment}/>)}</div> : <EmptyOrders/>}
      </>}

      {tab === 'orders' && <>
        <div className="buyer-section-heading"><div><span className="eyebrow">ORDER HISTORY</span><h2>Riwayat pesanan</h2><p>Data dan status pembayaran dibaca dari server.</p></div><button type="button" className="btn buyer-secondary" onClick={refresh} disabled={busy}><RefreshCw size={16}/> Perbarui</button></div>
        {orders.length ? <div className="buyer-order-list">{orders.map(order => <OrderCard key={order.id} order={order} busyOrder={busyOrder} onRetry={handleRetryPayment}/>)}</div> : <EmptyOrders/>}
      </>}

      {tab === 'profile' && <div className="buyer-panel buyer-profile-panel">
        <div className="buyer-section-heading"><div><span className="eyebrow">CUSTOMER DETAILS</span><h2>Profil & alamat pengiriman</h2><p>Alamat disimpan untuk memudahkan checkout berikutnya.</p></div><MapPin size={20}/></div>
        <form className="consult-form buyer-profile-form" onSubmit={handleSaveProfile}>
          <div className="form-grid">
            <label>Nama lengkap *<input value={profile.full_name} onChange={e => setProfile((p: any) => ({ ...p, full_name: e.target.value }))} required minLength={2} maxLength={120} autoComplete="name"/></label>
            <label>Email akun<input value={session.user?.email || ''} readOnly disabled/></label>
            <label>Nomor WhatsApp *<input value={profile.phone} onChange={e => setProfile((p: any) => ({ ...p, phone: e.target.value }))} required minLength={8} maxLength={40} type="tel" autoComplete="tel"/></label>
            <label>Nama perusahaan (opsional)<input value={profile.company} onChange={e => setProfile((p: any) => ({ ...p, company: e.target.value }))} maxLength={160} autoComplete="organization"/></label>
          </div>
          <h3 className="buyer-address-title">Alamat utama</h3>
          <div className="form-grid">
            <label>Alamat lengkap<textarea value={profile.default_shipping_address.address} onChange={e => setProfile((p: any) => ({ ...p, default_shipping_address: { ...p.default_shipping_address, address: e.target.value } }))} rows={3} maxLength={700} autoComplete="street-address"/></label>
            <label>Kecamatan<input value={profile.default_shipping_address.district} onChange={e => setProfile((p: any) => ({ ...p, default_shipping_address: { ...p.default_shipping_address, district: e.target.value } }))} maxLength={120}/></label>
            <label>Kabupaten / kota<input value={profile.default_shipping_address.city} onChange={e => setProfile((p: any) => ({ ...p, default_shipping_address: { ...p.default_shipping_address, city: e.target.value } }))} maxLength={120} autoComplete="address-level2"/></label>
            <label>Provinsi<input value={profile.default_shipping_address.province} onChange={e => setProfile((p: any) => ({ ...p, default_shipping_address: { ...p.default_shipping_address, province: e.target.value } }))} maxLength={120} autoComplete="address-level1"/></label>
            <label>Kode pos<input value={profile.default_shipping_address.postcode} onChange={e => setProfile((p: any) => ({ ...p, default_shipping_address: { ...p.default_shipping_address, postcode: e.target.value } }))} maxLength={6} inputMode="numeric" autoComplete="postal-code"/></label>
          </div>
          <p className="buyer-profile-help">Nama, email, dan WhatsApp dipakai untuk detail pesanan. Alamat wajib dilengkapi saat checkout.</p>
          <button className="btn primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan profil'} <ArrowUpRight size={17}/></button>
        </form>
      </div>}

      {tab === 'favorites' && <>
        <div className="buyer-section-heading"><div><span className="eyebrow">SAVED FOR LATER</span><h2>Produk favorit</h2><p>Wishlist saat ini disimpan di perangkat ini.</p></div><ShoppingBag size={20}/></div>
        {products.filter(p => wish.includes(p.id)).length ? <div className="product-grid">{products.filter(p => wish.includes(p.id)).map(p => <ProductCard key={p.id} p={p} wish={wish} toggleWish={toggleWish}/>)}</div> : <div className="buyer-empty"><Heart size={25}/><h3>Belum ada favorit</h3><p>Simpan produk dari halaman merch untuk melihatnya di sini.</p><a className="btn primary" href="/merch/">Jelajahi merch <ArrowUpRight size={17}/></a></div>}
      </>}
    </div>}
  </section>;
}

function EmptyOrders() {
  return <div className="buyer-empty"><Package size={27}/><h3>Belum ada pesanan</h3><p>Pesanan yang dibuat dengan email terverifikasi ini akan muncul di dashboard setelah checkout.</p><a className="btn primary" href="/merch/">Lihat merch <ArrowUpRight size={17}/></a></div>;
}

function OrderCard({ order, busyOrder, onRetry }: { order: any; busyOrder: string; onRetry: (orderNo: string) => void }) {
  const paymentStatus = order.payment_status === 'paid' ? 'paid' : (order.payment?.status || order.payment_status || 'unpaid');
  const activePayment = order.payment?.redirect_url && ['created', 'pending', 'authorized', 'unknown'].includes(order.payment?.status);
  const terminalOrder = ['completed', 'cancelled', 'refunded', 'partial_refund'].includes(order.status);
  const canRetry = !activePayment && order.payment_status !== 'paid' && !terminalOrder && order.status !== 'expired';
  const items = Array.isArray(order.items) ? order.items : [];
  return <article className="buyer-order-card">
    <div className="buyer-order-head"><div><span className="eyebrow">{order.order_no}</span><small>{stamp(order.created_at)}</small></div><div className="buyer-order-badges"><span className={'buyer-pill ' + statusClass(paymentStatus)}>{paymentLabels[paymentStatus] || paymentStatus}</span><span className={'buyer-pill ' + statusClass(order.status)}>{orderLabels[order.status] || order.status}</span></div></div>
    <div className="buyer-order-items">{items.map((item: any, i: number) => <div key={String(item.productId || item.sku || i)}><span>{item.quantity} × {item.name}</span><strong>{money(Number(item.price || 0) * Number(item.quantity || 0))}</strong></div>)}</div>
    <details className="buyer-shipping-detail"><summary><MapPin size={15}/> Detail pengiriman</summary><p>{[order.shipping_address?.address, order.shipping_address?.district, order.shipping_address?.city, order.shipping_address?.province, order.shipping_address?.postcode].filter(Boolean).join(', ') || 'Alamat tidak tersedia'}</p></details>
    <div className="buyer-order-footer"><div><small>Total pesanan</small><strong>{money(Number(order.total || 0))}</strong></div><div className="buyer-order-actions">{activePayment && <a className="btn primary" href={order.payment.redirect_url} target="_blank" rel="noopener noreferrer">Lanjutkan pembayaran <ArrowUpRight size={16}/></a>}{canRetry && <button type="button" className="btn primary" disabled={busyOrder === order.order_no} onClick={() => onRetry(order.order_no)}>{busyOrder === order.order_no ? 'Menyiapkan…' : 'Buat pembayaran'} <ArrowUpRight size={16}/></button>}</div></div>
  </article>;
}
