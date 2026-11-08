function projectThumb(title, accent = '#d9b887') {
  const safeTitle = title.replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" fill="#f7f3eb"/><circle cx="800" cy="90" r="180" fill="${accent}" opacity=".35"/><rect x="70" y="70" width="820" height="400" rx="28" fill="#fff" stroke="#ded7cb"/><rect x="70" y="70" width="820" height="46" rx="28" fill="#151515"/><circle cx="100" cy="93" r="6" fill="#d9b887"/><circle cx="120" cy="93" r="6" fill="#8c8c8c"/><circle cx="140" cy="93" r="6" fill="#8c8c8c"/><text x="110" y="235" font-family="Arial,sans-serif" font-size="52" font-weight="700" fill="#111">${safeTitle}</text><text x="110" y="285" font-family="Arial,sans-serif" font-size="22" fill="#6f6b64">Website project by BisaBikinWeb</text><rect x="110" y="330" width="180" height="44" rx="22" fill="#111"/><rect x="310" y="330" width="150" height="44" rx="22" fill="${accent}"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function avatarData(initials) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="#ead3aa"/><text x="80" y="96" text-anchor="middle" font-family="Arial,sans-serif" font-size="46" font-weight="700" fill="#111">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const CONFIG = {
  whatsappNumber: '',
  instagram: 'https://instagram.com/bisabikinweb',
  tiktok: '#'
};

const services = [
  { icon: 'building-2', title: 'Company Profile', desc: 'Website profesional untuk memperkenalkan perusahaan, layanan, portfolio, dan informasi bisnis.' },
  { icon: 'panel-top', title: 'Landing Page', desc: 'Website satu halaman untuk campaign, produk, event, atau meningkatkan conversion.' },
  { icon: 'store', title: 'Website UMKM', desc: 'Website profesional untuk bisnis kecil dan menengah agar lebih terpercaya di mata customer.' },
  { icon: 'shopping-bag', title: 'Online Store', desc: 'Website untuk menjual produk secara online dengan katalog, CTA, dan alur pembelian yang jelas.' },
  { icon: 'badge-check', title: 'Personal Branding', desc: 'Website untuk profesional, creator, consultant, atau public figure.' },
  { icon: 'house', title: 'Property Website', desc: 'Website untuk agent, developer, dan listing properti yang mudah dicari.' },
  { icon: 'utensils', title: 'Restaurant & Cafe', desc: 'Website dengan menu, lokasi, reservasi, jam operasional, dan kontak.' },
  { icon: 'blocks', title: 'Custom Website', desc: 'Website dengan fitur khusus sesuai alur kerja dan kebutuhan bisnis.' }
];

const advantages = [
  { icon: 'sparkles', title: 'Desain Modern', desc: 'Website dibuat mengikuti tren desain modern tanpa mengorbankan kenyamanan pengguna.' },
  { icon: 'smartphone', title: 'Mobile Responsive', desc: 'Tampilan optimal di smartphone, tablet, laptop, dan desktop.' },
  { icon: 'gauge', title: 'Fast Loading', desc: 'Struktur dan aset dioptimalkan agar website terasa cepat dibuka.' },
  { icon: 'search', title: 'SEO Friendly', desc: 'Struktur heading, metadata, dan halaman dibuat lebih mudah dikenali mesin pencari.' },
  { icon: 'shield-check', title: 'SSL Security', desc: 'Website disiapkan untuk HTTPS agar koneksi lebih aman dan dipercaya browser.' },
  { icon: 'settings-2', title: 'Mudah Dikelola', desc: 'Konten penting disusun agar lebih mudah diperbarui ketika bisnis berkembang.' },
  { icon: 'message-circle-more', title: 'WhatsApp Integration', desc: 'Customer dapat langsung menghubungi bisnis melalui CTA WhatsApp.' },
  { icon: 'headphones', title: 'Support', desc: 'Kami membantu setelah website selesai dibuat sesuai cakupan paket.' }
];

const pricing = [
  { name: 'STARTER', price: 'Rp800.000', desc: 'Cocok untuk UMKM dan personal brand yang ingin mulai tampil profesional.', features: ['Landing Page / Company Profile sederhana','Responsive Mobile','WhatsApp Button','Contact Form','Social Media Integration','SSL','Basic SEO','Support'], cta: 'Pilih Starter' },
  { name: 'BUSINESS', price: 'Hubungi Kami', desc: 'Untuk bisnis yang membutuhkan website multi-page dengan struktur lebih lengkap.', popular: true, features: ['Website Multi Page','Custom Design','Product / Service Pages','Portfolio','WhatsApp Integration','Contact Form','Google Maps','Basic SEO','Analytics','SSL','Support & Maintenance'], cta: 'Konsultasi Paket' },
  { name: 'CUSTOM', price: 'Custom', desc: 'Untuk perusahaan atau sistem khusus dengan alur, integrasi, dan fitur spesifik.', features: ['Custom Web Application','Dashboard','Authentication','Database','API Integration','Payment Integration','Admin Panel','Custom Feature','Maintenance'], cta: 'Diskusikan Project' }
];

const portfolios = [
  { id: 1, title: 'Mejavi Skin+', category: 'E-Commerce', image: projectThumb('Mejavi Skin+', '#d7b98b'), desc: 'Website skincare dengan katalog produk, detail ingredients, CTA pembelian, dan pengalaman mobile-first.', tech: ['HTML','CSS','JavaScript'], link: '#' },
  { id: 2, title: 'MEJAVI Warehouse', category: 'Web App', image: projectThumb('MEJAVI Warehouse', '#8d9ca8'), desc: 'Dashboard warehouse management untuk stok, inbound, outbound, barcode, laporan, dan role pengguna.', tech: ['React','Supabase','Dashboard'], link: '#' },
  { id: 3, title: 'GriyaLink', category: 'Company Profile', image: projectThumb('GriyaLink', '#b7a18a'), desc: 'Website properti untuk memperkenalkan layanan agent, listing, dan kontak calon customer.', tech: ['Responsive','SEO','WhatsApp'], link: '#' },
  { id: 4, title: 'densExport', category: 'Landing Page', image: projectThumb('densExport', '#c0aa80'), desc: 'Landing page komunitas buyer-supplier dengan fokus pada value proposition dan lead generation.', tech: ['Landing Page','CTA','Mobile'], link: '#' },
  { id: 5, title: 'Kedai Nusa', category: 'Company Profile', image: projectThumb('Kedai Nusa', '#9f8d78'), desc: 'Website cafe dengan menu, lokasi, jam buka, galeri, dan reservasi via WhatsApp.', tech: ['Menu','Maps','WhatsApp'], link: '#' },
  { id: 6, title: 'LokalHub Campaign', category: 'Landing Page', image: projectThumb('LokalHub', '#a7a089'), desc: 'Campaign landing page dengan struktur conversion-focused, social proof, dan CTA yang jelas.', tech: ['Campaign','SEO','Analytics'], link: '#' }
];

const processSteps = [
  ['01 — Konsultasi','Customer menjelaskan bisnis dan kebutuhan website.'],
  ['02 — Brief & Konsep','Kami menentukan struktur, desain, warna, dan fitur.'],
  ['03 — Development','Website mulai dibuat dan dioptimalkan untuk berbagai perangkat.'],
  ['04 — Review','Customer melakukan pengecekan dan revisi sesuai paket.'],
  ['05 — Launch','Website dipublikasikan ke domain dan hosting yang disepakati.'],
  ['06 — Support','Kami memberikan support setelah website aktif sesuai cakupan layanan.']
];

const testimonials = [
  { name: 'Ayu Pratama', business: 'Owner, Brand Lokal', image: avatarData('AP'), text: 'Proses komunikasinya jelas dan hasil website jadi jauh lebih rapi daripada hanya mengandalkan media sosial. Tampilan mobile-nya juga enak dilihat.' },
  { name: 'Raka Mahendra', business: 'Founder, UMKM Kuliner', image: avatarData('RM'), text: 'Yang paling membantu adalah struktur informasinya. Customer sekarang bisa langsung lihat layanan, lokasi, dan kontak tanpa harus tanya satu per satu.' },
  { name: 'Nadia Putri', business: 'Personal Brand', image: avatarData('NP'), text: 'Desainnya terasa profesional tetapi tetap sederhana. Website juga mudah dibuka dari HP dan CTA WhatsApp sangat membantu untuk inquiry.' }
];

const faqs = [
  ['Berapa harga membuat website?','Harga website mulai dari sekitar Rp800 ribuan dan dapat menyesuaikan fitur serta kebutuhan project.'],
  ['Berapa lama pembuatan website?','Tergantung jumlah halaman, desain, dan fitur yang dibutuhkan. Estimasi akan dijelaskan setelah brief project diterima.'],
  ['Apakah website bisa dibuka di HP?','Ya. Semua website dibuat responsive agar tampil optimal di smartphone, tablet, laptop, dan desktop.'],
  ['Apakah mendapatkan domain?','Domain dan hosting dapat disesuaikan dengan paket yang dipilih.'],
  ['Apakah bisa revisi?','Ya, revisi diberikan sesuai paket dan ruang lingkup project yang disepakati.'],
  ['Apakah BisaBikinWeb menyediakan maintenance?','Ya, tersedia layanan maintenance website sesuai kebutuhan.'],
  ['Apakah bisa membuat website custom?','Bisa. Kami dapat membuat website dan web application dengan fitur khusus sesuai kebutuhan bisnis.']
];

function getWhatsAppUrl(message = 'Halo BisaBikinWeb, saya ingin konsultasi pembuatan website.') {
  const text = encodeURIComponent(message);
  return CONFIG.whatsappNumber ? `https://wa.me/${CONFIG.whatsappNumber}?text=${text}` : `https://wa.me/?text=${text}`;
}
function renderServices(){document.querySelector('#serviceGrid').innerHTML=services.map((item,i)=>`<article class="service-card reveal" style="transition-delay:${Math.min(i,3)*70}ms"><div class="icon-box"><i data-lucide="${item.icon}"></i></div><h3>${item.title}</h3><p>${item.desc}</p></article>`).join('')}
function renderAdvantages(){document.querySelector('#whyGrid').innerHTML=advantages.map((item,i)=>`<article class="why-card reveal" style="transition-delay:${Math.min(i,3)*70}ms"><div class="icon-box"><i data-lucide="${item.icon}"></i></div><h3>${item.title}</h3><p>${item.desc}</p></article>`).join('')}
function renderPricing(){document.querySelector('#pricingGrid').innerHTML=pricing.map((item,i)=>`<article class="price-card ${item.popular?'featured':''} reveal" style="transition-delay:${i*80}ms">${item.popular?'<span class="popular-badge">MOST POPULAR</span>':''}<div class="price-name">${item.name}</div><h3>${item.price}</h3><p class="price-desc">${item.desc}</p><hr><ul>${item.features.map(f=>`<li>${f}</li>`).join('')}</ul><a class="btn ${item.popular?'btn-cream':'btn-light'}" data-wa="${item.cta}" href="#kontak">${item.cta}</a></article>`).join('')}
function renderPortfolioFilters(){const categories=['All',...new Set(portfolios.map(p=>p.category))];document.querySelector('#portfolioFilters').innerHTML=categories.map((cat,i)=>`<button class="filter-btn ${i===0?'active':''}" data-filter="${cat}">${cat}</button>`).join('')}
function renderPortfolios(filter='All'){const list=filter==='All'?portfolios:portfolios.filter(p=>p.category===filter);document.querySelector('#portfolioGrid').innerHTML=list.map((p,i)=>`<article class="portfolio-card reveal in-view" data-portfolio-id="${p.id}" style="transition-delay:${Math.min(i,2)*70}ms"><div class="portfolio-image"><img src="${p.image}" alt="Screenshot project ${p.title}" loading="lazy"></div><div class="portfolio-body"><div class="portfolio-meta">${p.category.toUpperCase()}</div><h3>${p.title}</h3><p>${p.desc}</p><div class="portfolio-footer"><span class="tech-mini">${p.tech.join(' • ')}</span><span class="portfolio-link">Detail →</span></div></div></article>`).join('')}
function renderProcess(){document.querySelector('#processGrid').innerHTML=processSteps.map(([title,desc],i)=>`<article class="process-card reveal" style="transition-delay:${Math.min(i,2)*70}ms"><div class="process-number">STEP ${String(i+1).padStart(2,'0')}</div><h3>${title}</h3><p>${desc}</p></article>`).join('')}
let testimonialIndex=0;let testimonialTimer;
function renderTestimonials(){const track=document.querySelector('#testimonialTrack');track.innerHTML=testimonials.map(t=>`<article class="testimonial-card"><div class="avatar"><img src="${t.image}" alt="Foto ilustrasi ${t.name}" loading="lazy"></div><div><div class="rating">★★★★★</div><blockquote>“${t.text}”</blockquote><div class="testimonial-person"><strong>${t.name}</strong><span>${t.business}</span></div></div></article>`).join('');document.querySelector('#testimonialDots').innerHTML=testimonials.map((_,i)=>`<button class="carousel-dot ${i===0?'active':''}" data-testi="${i}" aria-label="Lihat testimonial ${i+1}"></button>`).join('');updateTestimonial()}
function updateTestimonial(){document.querySelector('#testimonialTrack').style.transform=`translateX(-${testimonialIndex*100}%)`;document.querySelectorAll('.carousel-dot').forEach((d,i)=>d.classList.toggle('active',i===testimonialIndex))}
function goTestimonial(delta){testimonialIndex=(testimonialIndex+delta+testimonials.length)%testimonials.length;updateTestimonial();resetTestimonialTimer()}
function resetTestimonialTimer(){clearInterval(testimonialTimer);testimonialTimer=setInterval(()=>goTestimonial(1),6000)}
function renderFaqs(){document.querySelector('#faqList').innerHTML=faqs.map(([q,a],i)=>`<article class="faq-item ${i===0?'open':''}"><button class="faq-q" aria-expanded="${i===0?'true':'false'}"><span>${q}</span><span>+</span></button><div class="faq-a" style="${i===0?'max-height:160px':''}"><p>${a}</p></div></article>`).join('')}
function initIcons(){if(window.lucide)window.lucide.createIcons()}
function initNavigation(){const header=document.querySelector('#siteHeader');const toggle=document.querySelector('#menuToggle');const menu=document.querySelector('#mobileMenu');const updateHeader=()=>header.classList.toggle('scrolled',window.scrollY>18);updateHeader();window.addEventListener('scroll',updateHeader,{passive:true});toggle.addEventListener('click',()=>{const open=!menu.classList.contains('open');menu.classList.toggle('open',open);toggle.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open)});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');toggle.classList.remove('open');toggle.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open')}))}
function initWhatsApp(){document.querySelectorAll('[data-wa]').forEach(link=>{link.addEventListener('click',e=>{e.preventDefault();window.open(getWhatsAppUrl(`Halo BisaBikinWeb, saya tertarik dengan: ${link.dataset.wa}. Boleh konsultasi?`),'_blank','noopener')})});const float=document.querySelector('#whatsappFloat');float.href=getWhatsAppUrl('Halo BisaBikinWeb, saya ingin konsultasi pembuatan website.');float.target='_blank';float.rel='noopener';document.querySelectorAll('[data-social="tiktok"]').forEach(a=>a.href=CONFIG.tiktok)}
function initPortfolio(){document.querySelector('#portfolioFilters').addEventListener('click',e=>{const btn=e.target.closest('[data-filter]');if(!btn)return;document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderPortfolios(btn.dataset.filter)});document.querySelector('#portfolioGrid').addEventListener('click',e=>{const card=e.target.closest('[data-portfolio-id]');if(!card)return;openPortfolio(Number(card.dataset.portfolioId))});document.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click',closePortfolio));document.addEventListener('keydown',e=>{if(e.key==='Escape')closePortfolio()})}
function openPortfolio(id){const p=portfolios.find(item=>item.id===id);if(!p)return;document.querySelector('#modalImage').src=p.image;document.querySelector('#modalImage').alt=`Screenshot ${p.title}`;document.querySelector('#modalCategory').textContent=p.category;document.querySelector('#modalTitle').textContent=p.title;document.querySelector('#modalDescription').textContent=p.desc;document.querySelector('#modalTech').innerHTML=p.tech.map(t=>`<span>${t}</span>`).join('');const link=document.querySelector('#modalLink');link.href=p.link;link.style.display=p.link==='#'?'none':'inline-flex';const modal=document.querySelector('#portfolioModal');modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open')}
function closePortfolio(){const modal=document.querySelector('#portfolioModal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
function initFaq(){document.querySelector('#faqList').addEventListener('click',e=>{const button=e.target.closest('.faq-q');if(!button)return;const item=button.parentElement;const answer=item.querySelector('.faq-a');const opening=!item.classList.contains('open');document.querySelectorAll('.faq-item').forEach(f=>{f.classList.remove('open');f.querySelector('.faq-q').setAttribute('aria-expanded','false');f.querySelector('.faq-a').style.maxHeight='0px'});if(opening){item.classList.add('open');button.setAttribute('aria-expanded','true');answer.style.maxHeight=answer.scrollHeight+'px'}})}
function initForm(){const form=document.querySelector('#consultForm');const status=document.querySelector('#formStatus');form.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form);const message=['Halo BisaBikinWeb, saya ingin konsultasi website.','',`Nama: ${data.get('nama')||'-'}`,`Nama Bisnis: ${data.get('bisnis')||'-'}`,`WhatsApp: ${data.get('whatsapp')||'-'}`,`Email: ${data.get('email')||'-'}`,`Jenis Website: ${data.get('jenis')||'-'}`,`Estimasi Budget: ${data.get('budget')||'-'}`,'',`Deskripsi Project:\n${data.get('deskripsi')||'-'}`].join('\n');status.textContent='Membuka WhatsApp dengan detail konsultasi...';window.open(getWhatsAppUrl(message),'_blank','noopener');setTimeout(()=>status.textContent='Jika WhatsApp belum terbuka, pastikan browser mengizinkan pop-up.',1200)})}
function initReveal(){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))}
function initStats(){const stats=document.querySelectorAll('[data-count]');let started=false;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!started){started=true;stats.forEach(el=>animateCount(el,Number(el.dataset.count)));observer.disconnect()}},{threshold:.3});const section=document.querySelector('.stats-grid');if(section)observer.observe(section)}
function animateCount(el,target){let start=0;const duration=1100;const t0=performance.now();function frame(now){const p=Math.min((now-t0)/duration,1);const eased=1-Math.pow(1-p,3);el.textContent=Math.round(start+(target-start)*eased);if(p<1)requestAnimationFrame(frame)}requestAnimationFrame(frame)}
function initBackTop(){const btn=document.querySelector('#backTop');window.addEventListener('scroll',()=>btn.classList.toggle('show',window.scrollY>700),{passive:true});btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}))}
function initTestimonialControls(){document.querySelector('#testiPrev').addEventListener('click',()=>goTestimonial(-1));document.querySelector('#testiNext').addEventListener('click',()=>goTestimonial(1));document.querySelector('#testimonialDots').addEventListener('click',e=>{const btn=e.target.closest('[data-testi]');if(!btn)return;testimonialIndex=Number(btn.dataset.testi);updateTestimonial();resetTestimonialTimer()});resetTestimonialTimer()}
function hideLoader(){window.addEventListener('load',()=>setTimeout(()=>document.querySelector('#loader').classList.add('hidden'),300));setTimeout(()=>document.querySelector('#loader').classList.add('hidden'),1800)}
renderServices();renderAdvantages();renderPricing();renderPortfolioFilters();renderPortfolios();renderProcess();renderTestimonials();renderFaqs();
document.addEventListener('DOMContentLoaded',()=>{initIcons();initNavigation();initWhatsApp();initPortfolio();initFaq();initForm();initReveal();initStats();initBackTop();initTestimonialControls();hideLoader()});

/* Admin-controlled promotional popup: Website Settings > Pop-up promosi */
(function(){
  var URL='https://iyhwephcrxeqwiemhppw.supabase.co';
  var KEY='sb_publishable_0QZOXv00GKp6ecUi2L-FLA_YvsQrzy3';
  function start(){
    fetch(URL+'/rest/v1/bbweb_site_settings?select=announcement,whatsapp&id=eq.1&limit=1',{headers:{apikey:KEY,Accept:'application/json'},cache:'no-store'})
      .then(function(r){return r.ok?r.json():[];})
      .then(function(rows){
        if(!Array.isArray(rows)||!rows.length||!String(rows[0].announcement||'').trim())return;
        try{if(Number(sessionStorage.getItem('bbweb_promo_closed_until')||0)>Date.now())return;}catch(e){}
        window.setTimeout(function(){
          if(document.getElementById('bbweb-promo-overlay'))return;
          var overlay=document.createElement('div');overlay.id='bbweb-promo-overlay';overlay.className='bbweb-promo-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
          overlay.innerHTML='<div class="bbweb-promo-card"><button class="bbweb-promo-close" aria-label="Tutup promosi" type="button">&times;</button><span class="bbweb-promo-kicker">PROMO KHUSUS</span><h2>Ada penawaran menarik untuk bisnismu!</h2><p class="bbweb-promo-copy"></p><a class="bbweb-promo-cta" target="_blank" rel="noopener noreferrer">Tanya Promo via WhatsApp ↗</a><small>BisaBikinWeb · Website profesional untuk bisnismu</small></div>';
          var style=document.createElement('style');
          style.textContent='.bbweb-promo-overlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;isolation:isolate;overflow:auto;padding:max(18px,env(safe-area-inset-top)) 18px max(18px,env(safe-area-inset-bottom));background:radial-gradient(ellipse at 16% 16%,rgba(140,159,242,.31),transparent 54%),radial-gradient(ellipse at 88% 82%,rgba(238,177,147,.24),transparent 56%),rgba(18,21,30,.59);-webkit-backdrop-filter:blur(11px);backdrop-filter:blur(11px);}.bbweb-promo-card{position:relative;isolation:isolate;box-sizing:border-box;width:min(100%,560px);max-height:min(88vh,760px);max-height:min(88dvh,760px);overflow-y:auto;padding:48px 44px 34px;color:#161d2b;background:linear-gradient(134deg,rgba(255,255,255,.91) 0%,rgba(248,249,255,.83) 45%,rgba(255,242,235,.81) 100%);border:1px solid rgba(255,255,255,.79);border-radius:28px;box-shadow:0 35px 110px rgba(4,9,28,.28),inset 0 1px rgba(255,255,255,.83);-webkit-backdrop-filter:blur(26px) saturate(145%);backdrop-filter:blur(26px) saturate(145%);animation:bbweb-promo-arrive .32s cubic-bezier(.2,.8,.2,1) both;}.bbweb-promo-card::before{content:\'\';position:absolute;z-index:-1;pointer-events:none;width:280px;height:280px;right:-110px;top:-135px;border-radius:50%;background:radial-gradient(circle,rgba(150,160,245,.28),rgba(150,160,245,0) 73%);}.bbweb-promo-close{position:absolute;z-index:2;right:19px;top:18px;display:grid;place-items:center;width:42px;height:42px;border:1px solid rgba(67,75,101,.13);border-radius:50%;background:rgba(255,255,255,.69);color:#303647;font-size:27px;line-height:1;transition:background .2s ease,transform .2s ease;}.bbweb-promo-close:hover,.bbweb-promo-close:focus-visible{background:rgba(255,255,255,.96);transform:rotate(90deg);}.bbweb-promo-kicker{display:inline-block;max-width:calc(100% - 38px);margin-bottom:22px;padding:9px 13px;border:1px solid rgba(80,87,139,.13);border-radius:99px;background:linear-gradient(110deg,rgba(229,233,255,.85),rgba(255,238,232,.8));color:#52557c;font-size:10px;font-weight:800;letter-spacing:.11em;line-height:1.4;}.bbweb-promo-card h2{margin:0 0 18px;color:#182033;font-size:clamp(29px,4.2vw,39px);font-weight:800;letter-spacing:-.045em;line-height:1.13;text-wrap:balance;}.bbweb-promo-copy{margin:0 0 28px;color:#454c5c;font-size:16px;line-height:1.75;white-space:pre-line;overflow-wrap:anywhere;}.bbweb-promo-cta{display:flex;align-items:center;justify-content:center;gap:14px;width:100%;min-height:56px;padding:15px 20px;border:1px solid rgba(33,37,58,.13);border-radius:14px;background:linear-gradient(110deg,#1d2437 0%,#3b4268 100%);box-shadow:0 12px 28px rgba(37,47,85,.18);color:#fff;font-size:15px;font-weight:750;text-align:center;text-decoration:none;transition:filter .2s ease,transform .2s ease,box-shadow .2s ease;}.bbweb-promo-cta:hover,.bbweb-promo-cta:focus-visible{color:white;filter:brightness(1.13);transform:translateY(-2px);box-shadow:0 16px 32px rgba(37,47,85,.25);}.bbweb-promo-card small{display:block;margin-top:19px;color:#656c7d;font-size:11px;line-height:1.55;text-align:center;}@keyframes bbweb-promo-arrive{from{opacity:0;transform:translateY(18px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}@media (max-width:600px){.bbweb-promo-overlay{padding:max(14px,env(safe-area-inset-top)) 14px max(14px,env(safe-area-inset-bottom));}.bbweb-promo-card{padding:44px 24px 27px;border-radius:23px;}.bbweb-promo-card h2{font-size:clamp(27px,7.2vw,34px);}.bbweb-promo-copy{font-size:15px;}.bbweb-promo-kicker{margin-bottom:18px;font-size:9px;}.bbweb-promo-close{right:12px;top:12px;width:38px;height:38px;}}@media (prefers-reduced-motion:reduce){.bbweb-promo-card{animation:none;}.bbweb-promo-cta,.bbweb-promo-close{transition:none;}}';
          document.head.appendChild(style);overlay.querySelector('.bbweb-promo-copy').textContent=String(rows[0].announcement).trim();
          var phone=String(rows[0].whatsapp||'').replace(/[^0-9]/g,'');overlay.querySelector('.bbweb-promo-cta').href=phone?'https://wa.me/'+phone+'?text='+encodeURIComponent('Halo BisaBikinWeb, saya tertarik dengan promo di website.'):'https://bisabikinweb.site/#kontak';
          function close(){overlay.remove();try{sessionStorage.setItem('bbweb_promo_closed_until',String(Date.now()+86400000));}catch(e){}}
          overlay.querySelector('.bbweb-promo-close').addEventListener('click',close);overlay.addEventListener('click',function(e){if(e.target===overlay)close();});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.getElementById('bbweb-promo-overlay'))close();});document.body.appendChild(overlay);
        },1800);
      }).catch(function(){});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
