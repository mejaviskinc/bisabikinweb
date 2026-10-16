function getWhatsAppUrl(message = 'Halo BisaBikinWeb, saya ingin konsultasi pembuatan website.') {
  const text = encodeURIComponent(message);
  return CONFIG.whatsappNumber
    ? `https://wa.me/${CONFIG.whatsappNumber}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

function renderServices() {
  document.querySelector('#serviceGrid').innerHTML = services.map((item, i) => `
    <article class="service-card reveal" style="transition-delay:${Math.min(i,3)*70}ms">
      <div class="icon-box"><i data-lucide="${item.icon}"></i></div>
      <h3>${item.title}</h3><p>${item.desc}</p>
    </article>`).join('');
}

function renderAdvantages() {
  document.querySelector('#whyGrid').innerHTML = advantages.map((item, i) => `
    <article class="why-card reveal" style="transition-delay:${Math.min(i,3)*70}ms">
      <div class="icon-box"><i data-lucide="${item.icon}"></i></div>
      <h3>${item.title}</h3><p>${item.desc}</p>
    </article>`).join('');
}

function renderPricing() {
  document.querySelector('#pricingGrid').innerHTML = pricing.map((item, i) => `
    <article class="price-card ${item.popular ? 'featured' : ''} reveal" style="transition-delay:${i*80}ms">
      ${item.popular ? '<span class="popular-badge">MOST POPULAR</span>' : ''}
      <div class="price-name">${item.name}</div>
      <h3>${item.price}</h3>
      <p class="price-desc">${item.desc}</p>
      <hr>
      <ul>${item.features.map(f => `<li>${f}</li>`).join('')}</ul>
      <a class="btn ${item.popular ? 'btn-cream' : 'btn-light'}" data-wa="${item.cta}" href="#kontak">${item.cta}</a>
    </article>`).join('');
}

function renderPortfolioFilters() {
  const categories = ['All', ...new Set(portfolios.map(p => p.category))];
  document.querySelector('#portfolioFilters').innerHTML = categories.map((cat, i) => `
    <button class="filter-btn ${i === 0 ? 'active' : ''}" data-filter="${cat}">${cat}</button>`).join('');
}

function renderPortfolios(filter = 'All') {
  const list = filter === 'All' ? portfolios : portfolios.filter(p => p.category === filter);
  document.querySelector('#portfolioGrid').innerHTML = list.map((p, i) => `
    <article class="portfolio-card reveal in-view" data-portfolio-id="${p.id}" style="transition-delay:${Math.min(i,2)*70}ms">
      <div class="portfolio-image"><img src="${p.image}" alt="Screenshot project ${p.title}" loading="lazy"></div>
      <div class="portfolio-body">
        <div class="portfolio-meta">${p.category.toUpperCase()}</div>
        <h3>${p.title}</h3><p>${p.desc}</p>
        <div class="portfolio-footer"><span class="tech-mini">${p.tech.join(' • ')}</span><span class="portfolio-link">Detail →</span></div>
      </div>
    </article>`).join('');
}

function renderProcess() {
  document.querySelector('#processGrid').innerHTML = processSteps.map(([title, desc], i) => `
    <article class="process-card reveal" style="transition-delay:${Math.min(i,2)*70}ms">
      <div class="process-number">STEP ${String(i+1).padStart(2,'0')}</div><h3>${title}</h3><p>${desc}</p>
    </article>`).join('');
}

let testimonialIndex = 0;
let testimonialTimer;
function renderTestimonials() {
  const track = document.querySelector('#testimonialTrack');
  track.innerHTML = testimonials.map(t => `
    <article class="testimonial-card">
      <div class="avatar"><img src="${t.image}" alt="Foto ilustrasi ${t.name}" loading="lazy"></div>
      <div><div class="rating">★★★★★</div><blockquote>“${t.text}”</blockquote><div class="testimonial-person"><strong>${t.name}</strong><span>${t.business}</span></div></div>
    </article>`).join('');
  document.querySelector('#testimonialDots').innerHTML = testimonials.map((_,i) => `<button class="carousel-dot ${i===0?'active':''}" data-testi="${i}" aria-label="Lihat testimonial ${i+1}"></button>`).join('');
  updateTestimonial();
}
function updateTestimonial(){
  document.querySelector('#testimonialTrack').style.transform = `translateX(-${testimonialIndex*100}%)`;
  document.querySelectorAll('.carousel-dot').forEach((d,i)=>d.classList.toggle('active', i===testimonialIndex));
}
function goTestimonial(delta){testimonialIndex=(testimonialIndex+delta+testimonials.length)%testimonials.length;updateTestimonial();resetTestimonialTimer()}
function resetTestimonialTimer(){clearInterval(testimonialTimer);testimonialTimer=setInterval(()=>goTestimonial(1),6000)}

function renderFaqs() {
  document.querySelector('#faqList').innerHTML = faqs.map(([q,a], i) => `
    <article class="faq-item ${i===0?'open':''}">
      <button class="faq-q" aria-expanded="${i===0?'true':'false'}"><span>${q}</span><span>+</span></button>
      <div class="faq-a" style="${i===0?'max-height:160px':''}"><p>${a}</p></div>
    </article>`).join('');
}

function initIcons(){ if(window.lucide) window.lucide.createIcons(); }

function initNavigation(){
  const header=document.querySelector('#siteHeader');
  const toggle=document.querySelector('#menuToggle');
  const menu=document.querySelector('#mobileMenu');
  const updateHeader=()=>header.classList.toggle('scrolled',window.scrollY>18);
  updateHeader();window.addEventListener('scroll',updateHeader,{passive:true});
  toggle.addEventListener('click',()=>{
    const open=!menu.classList.contains('open');
    menu.classList.toggle('open',open);toggle.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open);
  });
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');toggle.classList.remove('open');toggle.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open')}));
}

function initWhatsApp(){
  document.querySelectorAll('[data-wa]').forEach(link=>{
    link.addEventListener('click',e=>{e.preventDefault();window.open(getWhatsAppUrl(`Halo BisaBikinWeb, saya tertarik dengan: ${link.dataset.wa}. Boleh konsultasi?`),'_blank','noopener')});
  });
  const float=document.querySelector('#whatsappFloat');
  float.href=getWhatsAppUrl('Halo BisaBikinWeb, saya ingin konsultasi pembuatan website.');float.target='_blank';float.rel='noopener';
  document.querySelectorAll('[data-social="tiktok"]').forEach(a=>a.href=CONFIG.tiktok);
}

function initPortfolio(){
  document.querySelector('#portfolioFilters').addEventListener('click',e=>{
    const btn=e.target.closest('[data-filter]');if(!btn)return;
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderPortfolios(btn.dataset.filter);
  });
  document.querySelector('#portfolioGrid').addEventListener('click',e=>{
    const card=e.target.closest('[data-portfolio-id]');if(!card)return;openPortfolio(Number(card.dataset.portfolioId));
  });
  document.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click',closePortfolio));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closePortfolio()});
}
function openPortfolio(id){
  const p=portfolios.find(item=>item.id===id);if(!p)return;
  document.querySelector('#modalImage').src=p.image;document.querySelector('#modalImage').alt=`Screenshot ${p.title}`;
  document.querySelector('#modalCategory').textContent=p.category;document.querySelector('#modalTitle').textContent=p.title;document.querySelector('#modalDescription').textContent=p.desc;
  document.querySelector('#modalTech').innerHTML=p.tech.map(t=>`<span>${t}</span>`).join('');
  const link=document.querySelector('#modalLink');link.href=p.link;link.style.display=p.link==='#'?'none':'inline-flex';
  const modal=document.querySelector('#portfolioModal');modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');
}
function closePortfolio(){const modal=document.querySelector('#portfolioModal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}

function initFaq(){
  document.querySelector('#faqList').addEventListener('click',e=>{
    const button=e.target.closest('.faq-q');if(!button)return;const item=button.parentElement;const answer=item.querySelector('.faq-a');const opening=!item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(f=>{f.classList.remove('open');f.querySelector('.faq-q').setAttribute('aria-expanded','false');f.querySelector('.faq-a').style.maxHeight='0px'});
    if(opening){item.classList.add('open');button.setAttribute('aria-expanded','true');answer.style.maxHeight=answer.scrollHeight+'px'}
  });
}

function initForm(){
  const form=document.querySelector('#consultForm');const status=document.querySelector('#formStatus');
  form.addEventListener('submit',e=>{
    e.preventDefault();const data=new FormData(form);const message=[
      'Halo BisaBikinWeb, saya ingin konsultasi website.','',
      `Nama: ${data.get('nama')||'-'}`,`Nama Bisnis: ${data.get('bisnis')||'-'}`,`WhatsApp: ${data.get('whatsapp')||'-'}`,`Email: ${data.get('email')||'-'}`,`Jenis Website: ${data.get('jenis')||'-'}`,`Estimasi Budget: ${data.get('budget')||'-'}`,'',`Deskripsi Project:\n${data.get('deskripsi')||'-'}`
    ].join('\n');
    status.textContent='Membuka WhatsApp dengan detail konsultasi...';window.open(getWhatsAppUrl(message),'_blank','noopener');
    setTimeout(()=>status.textContent='Jika WhatsApp belum terbuka, pastikan browser mengizinkan pop-up.',1200);
  });
}

function initReveal(){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}}),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
}

function initStats(){
  const stats=document.querySelectorAll('[data-count]');let started=false;
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!started){started=true;stats.forEach(el=>animateCount(el,Number(el.dataset.count)));observer.disconnect()}},{threshold:.3});
  const section=document.querySelector('.stats-grid');if(section)observer.observe(section);
}
function animateCount(el,target){let start=0;const duration=1100;const t0=performance.now();function frame(now){const p=Math.min((now-t0)/duration,1);const eased=1-Math.pow(1-p,3);el.textContent=Math.round(start+(target-start)*eased);if(p<1)requestAnimationFrame(frame)}requestAnimationFrame(frame)}

function initBackTop(){
  const btn=document.querySelector('#backTop');window.addEventListener('scroll',()=>btn.classList.toggle('show',window.scrollY>700),{passive:true});btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
}

function initTestimonialControls(){
  document.querySelector('#testiPrev').addEventListener('click',()=>goTestimonial(-1));document.querySelector('#testiNext').addEventListener('click',()=>goTestimonial(1));
  document.querySelector('#testimonialDots').addEventListener('click',e=>{const btn=e.target.closest('[data-testi]');if(!btn)return;testimonialIndex=Number(btn.dataset.testi);updateTestimonial();resetTestimonialTimer()});resetTestimonialTimer();
}

function hideLoader(){window.addEventListener('load',()=>setTimeout(()=>document.querySelector('#loader').classList.add('hidden'),300));setTimeout(()=>document.querySelector('#loader').classList.add('hidden'),1800)}

renderServices();renderAdvantages();renderPricing();renderPortfolioFilters();renderPortfolios();renderProcess();renderTestimonials();renderFaqs();

document.addEventListener('DOMContentLoaded',()=>{
  initIcons();initNavigation();initWhatsApp();initPortfolio();initFaq();initForm();initReveal();initStats();initBackTop();initTestimonialControls();hideLoader();
});
