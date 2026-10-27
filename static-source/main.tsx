import React,{useEffect,useState} from 'react';
import {createRoot,hydrateRoot} from 'react-dom/client';
import Studio from './features/Studio';
import Admin from './features/Admin';
import AdsManager from './features/AdsManager';
import SellerDashboard from './features/SellerDashboard';
import Storefront from './features/Storefront';
import SellerAdmin from './features/SellerAdmin';
import PaymentGatewayAdmin from './features/PaymentGatewayAdmin';
import {defaults} from './lib/data';
import {mergeEditorialPosts} from './lib/editorial-posts.mjs';
import {loadPublicContent} from './lib/supabase';
import {isAdActive,loadPublicAd,safeAdHref,safeAdImages,type AdSettings} from './lib/ads';
import './styles.css';
import './features/admin.css';
import './features/admin-modules.css';
import './features/article-images.css';
import './features/ads.css';
import './features/ads-carousel.css';
import './features/admin-ads-menu.css';
import './features/seller.css';
import './features/storefront.css';
import './features/buyer.css';
import './features/payment-gateway.css';

const path=location.pathname.replace(/\/+$/,'')||'/';
function merchVariants(products:any[]){return (products||[]).filter(p=>Number.isSafeInteger(Number(p.price))&&Number(p.price)>0&&Number.isInteger(Number(p.stock))&&Number(p.stock)>0).map(p=>({id:p.id,product_id:p.id,size:'Standard',color:p.color||'Default',price:Number(p.price),stock:Number(p.stock),active:true}))}

function PublicClient(){
  const [data,setData]=useState(defaults);
  const [ad,setAd]=useState<AdSettings|null>(null);
  const [version,setVersion]=useState(0);
  useEffect(()=>{
    let active=true;
    Promise.all([loadPublicContent(),loadPublicAd()]).then(([remote,advert])=>{
      if(!active)return;
      const next={
        ...defaults,
        settings:{...defaults.settings,...(remote.settings||{})},
        portfolio:remote.portfolio?.length
          ? [...remote.portfolio, ...defaults.portfolio.filter((p:any)=>!remote.portfolio.some((r:any)=>r.id===p.id))]
          : defaults.portfolio,
        services:remote.services?.length?remote.services:defaults.services,
        pricing:remote.pricing?.length?remote.pricing:defaults.pricing,
        products:remote.products?.length?remote.products:defaults.products,
        articles:mergeEditorialPosts(remote.articles?.length?remote.articles:defaults.articles)
      };
      setData(next);setAd(advert);setVersion(1);
    });
    return()=>{active=false};
  },[]);

  useEffect(()=>{
    const frame=requestAnimationFrame(()=>{
      const visuals=[...document.querySelectorAll<HTMLElement>('.article-card .article-visual')];
      visuals.forEach(el=>{el.style.backgroundImage='';el.classList.remove('has-cover')});
      (data.articles||[]).forEach((article:any,index:number)=>{
        const image=String(article.image||article.cover_image_url||'');
        if(/^https:\/\//i.test(image)&&visuals[index]){visuals[index].style.backgroundImage=`url(${JSON.stringify(image)})`;visuals[index].classList.add('has-cover')}
      });
      document.querySelectorAll('.article-detail-cover').forEach(node=>node.remove());
      if(path.startsWith('/artikel/')){
        const id=path.split('/').filter(Boolean)[1];
        const article=(data.articles||[]).find((a:any)=>a.id===id);
        const image=String(article?.image||article?.cover_image_url||'');
        const detail=document.querySelector('.article-detail');
        if(detail&&/^https:\/\//i.test(image)){
          const img=document.createElement('img');img.className='article-detail-cover';img.src=image;img.alt=article?.title?`Cover artikel ${article.title}`:'Cover artikel';img.loading='eager';img.decoding='async';
          const author=detail.querySelector('.article-author');if(author)detail.insertBefore(img,author);else detail.prepend(img);
        }
      }
    });
    return()=>cancelAnimationFrame(frame);
  },[data,version]);

  useEffect(()=>{
    const existing=document.querySelector('.bbweb-ad-host');existing?.remove();
    if(path!=='/'||!isAdActive(ad))return;
    const hero=document.querySelector('.hero');if(!hero||!ad)return;
    const images=safeAdImages(ad.ad_images?.length?ad.ad_images:(ad.ad_image_url?[ad.ad_image_url]:[]));
    const slides=images.length?images:[''];
    const href=safeAdHref(ad.ad_url);
    const host=document.createElement('section');host.className='bbweb-ad-host';host.setAttribute('aria-label','Iklan dan promosi');
    const carousel=document.createElement('div');carousel.className='bbweb-ad-carousel';
    const viewport=document.createElement('div');viewport.className='bbweb-ad-viewport';viewport.tabIndex=0;viewport.setAttribute('aria-roledescription','carousel');
    const track=document.createElement('div');track.className='bbweb-ad-track';

    function makeCopy(){
      const copy=document.createElement('div');copy.className='bbweb-ad-copy';
      const label=document.createElement('span');label.className='bbweb-ad-label';label.textContent=ad!.ad_label||'IKLAN';copy.appendChild(label);
      if(ad!.ad_title){const title=document.createElement('h3');title.textContent=ad!.ad_title;copy.appendChild(title)}
      if(ad!.ad_description){const desc=document.createElement('p');desc.textContent=ad!.ad_description;copy.appendChild(desc)}
      if(href&&ad!.ad_cta){const link=document.createElement('a');link.className='bbweb-ad-cta';link.href=href;link.textContent=ad!.ad_cta+' ↗';if(href.startsWith('https://')){link.target='_blank';link.rel='sponsored noopener noreferrer'}copy.appendChild(link)}
      return copy;
    }

    slides.forEach((image,index)=>{
      const slide=document.createElement('article');slide.className='bbweb-ad-slide';slide.setAttribute('aria-label',`Iklan ${index+1} dari ${slides.length}`);slide.style.scrollSnapAlign='start';
      if(image){const img=document.createElement('img');img.src=image;img.alt=ad.ad_title||`Iklan ${index+1}`;img.loading=index===0?'eager':'lazy';img.decoding='async';slide.appendChild(img)}
      const shade=document.createElement('div');shade.className='bbweb-ad-shade';slide.appendChild(shade);slide.appendChild(makeCopy());track.appendChild(slide);
    });
    viewport.appendChild(track);carousel.appendChild(viewport);

    let index=0;let timer=0;let raf=0;
    const dots:HTMLButtonElement[]=[];
    function syncDots(){dots.forEach((dot,i)=>{dot.classList.toggle('active',i===index);dot.setAttribute('aria-current',i===index?'true':'false')})}
    function goTo(next:number,behavior:ScrollBehavior='smooth'){index=(next+slides.length)%slides.length;viewport.scrollTo({left:index*viewport.clientWidth,behavior});syncDots()}
    function stopAuto(){if(timer){window.clearInterval(timer);timer=0}}
    function startAuto(){if(slides.length<2)return;stopAuto();timer=window.setInterval(()=>goTo(index+1),5000)}

    if(slides.length>1){
      const prev=document.createElement('button');prev.type='button';prev.className='bbweb-ad-arrow prev';prev.setAttribute('aria-label','Iklan sebelumnya');prev.textContent='‹';prev.addEventListener('click',()=>{goTo(index-1);startAuto()});
      const next=document.createElement('button');next.type='button';next.className='bbweb-ad-arrow next';next.setAttribute('aria-label','Iklan berikutnya');next.textContent='›';next.addEventListener('click',()=>{goTo(index+1);startAuto()});
      const dotWrap=document.createElement('div');dotWrap.className='bbweb-ad-dots';
      slides.forEach((_,i)=>{const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label',`Buka iklan ${i+1}`);dot.addEventListener('click',()=>{goTo(i);startAuto()});dotWrap.appendChild(dot);dots.push(dot)});
      carousel.append(prev,next,dotWrap);syncDots();startAuto();
      viewport.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{const nextIndex=Math.round(viewport.scrollLeft/Math.max(1,viewport.clientWidth));if(nextIndex!==index&&nextIndex>=0&&nextIndex<slides.length){index=nextIndex;syncDots()}})},{passive:true});
      carousel.addEventListener('mouseenter',stopAuto);carousel.addEventListener('mouseleave',startAuto);carousel.addEventListener('focusin',stopAuto);carousel.addEventListener('focusout',startAuto);viewport.addEventListener('touchstart',stopAuto,{passive:true});viewport.addEventListener('touchend',startAuto,{passive:true});
    }

    host.appendChild(carousel);hero.insertAdjacentElement('afterend',host);
    const onResize=()=>goTo(index,'auto');window.addEventListener('resize',onResize);
    return()=>{stopAuto();cancelAnimationFrame(raf);window.removeEventListener('resize',onResize);host.remove()};
  },[ad,version]);

  return <Studio key={version} initial={data} initialVariants={merchVariants(data.products)} path={path} user={null} isAdmin={false} catalogReady={version>0}/>;
}

function AdminWithAdsMenu(){
  useEffect(()=>{
    const install=()=>{
      const nav=document.querySelector<HTMLElement>('.admin-nav');
      if(!nav)return false;
      const labels=nav.querySelectorAll<HTMLElement>('.admin-nav-label');
      const systemLabel=labels.length>1?labels[1]:null;
      if(!nav.querySelector('[data-admin-ads-menu]')){
        const link=document.createElement('a');link.href='/admin/iklan';link.className='admin-ads-menu';link.dataset.adminAdsMenu='true';
        const icon=document.createElement('span');icon.className='admin-ads-menu-icon';icon.textContent='AD';
        const text=document.createElement('span');text.textContent='Iklan';
        const arrow=document.createElement('span');arrow.className='admin-ads-menu-arrow';arrow.textContent='↗';
        link.append(icon,text,arrow);if(systemLabel)nav.insertBefore(link,systemLabel);else nav.appendChild(link);
      }
      if(!nav.querySelector('[data-admin-sellers-menu]')){
        const link=document.createElement('a');link.href='/admin/sellers';link.className='admin-ads-menu';link.dataset.adminSellersMenu='true';
        const icon=document.createElement('span');icon.className='admin-ads-menu-icon';icon.textContent='SLR';
        const text=document.createElement('span');text.textContent='Sellers & Withdraw';
        const arrow=document.createElement('span');arrow.className='admin-ads-menu-arrow';arrow.textContent='↗';
        link.append(icon,text,arrow);if(systemLabel)nav.insertBefore(link,systemLabel);else nav.appendChild(link);
      }
      if(!nav.querySelector('[data-admin-payments-menu]')){
        const link=document.createElement('a');link.href='/admin/payments/';link.className='admin-ads-menu';link.dataset.adminPaymentsMenu='true';
        const icon=document.createElement('span');icon.className='admin-ads-menu-icon';icon.textContent='PAY';
        const text=document.createElement('span');text.textContent='Payment Gateway';
        const arrow=document.createElement('span');arrow.className='admin-ads-menu-arrow';arrow.textContent='↗';
        link.append(icon,text,arrow);if(systemLabel)nav.insertBefore(link,systemLabel);else nav.appendChild(link);
      }
      return Boolean(nav.querySelector('[data-admin-ads-menu]')&&nav.querySelector('[data-admin-sellers-menu]')&&nav.querySelector('[data-admin-payments-menu]'));
    };
    if(install())return;
    const observer=new MutationObserver(()=>{if(install())observer.disconnect()});observer.observe(document.getElementById('root')||document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[]);
  return <Admin/>;
}

const storefrontMatch=path.match(/^\/toko\/([a-z0-9-]+)$/i);
const app=path==='/seller'?<SellerDashboard/>:path.startsWith('/admin/sellers')?<SellerAdmin/>:path.startsWith('/admin/iklan')?<AdsManager/>:path.startsWith('/admin/payments')?<PaymentGatewayAdmin/>:path.startsWith('/admin')?<AdminWithAdsMenu/>:storefrontMatch?<Storefront slug={storefrontMatch[1].toLowerCase()}/>:<PublicClient/>;
const root=document.getElementById('root')!;
if(path.startsWith('/admin')||path==='/seller'||storefrontMatch)createRoot(root).render(app);else hydrateRoot(root,app);