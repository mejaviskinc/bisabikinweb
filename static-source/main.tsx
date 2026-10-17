import React,{useEffect,useState} from 'react';
import {createRoot,hydrateRoot} from 'react-dom/client';
import Studio from './features/Studio';
import Admin from './features/Admin';
import AdsManager from './features/AdsManager';
import {defaults} from './lib/data';
import {loadPublicContent} from './lib/supabase';
import {isAdActive,loadPublicAd,safeAdHref,safeAdImage,type AdSettings} from './lib/ads';
import './styles.css';
import './features/admin.css';
import './features/admin-modules.css';
import './features/article-images.css';
import './features/ads.css';

const path=location.pathname.replace(/\/+$/,'')||'/';

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
        portfolio:remote.portfolio?.length?remote.portfolio:defaults.portfolio,
        services:remote.services?.length?remote.services:defaults.services,
        pricing:remote.pricing?.length?remote.pricing:defaults.pricing,
        products:remote.products?.length?remote.products:defaults.products,
        articles:remote.articles?.length?remote.articles:defaults.articles
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
    const host=document.createElement('section');host.className='bbweb-ad-host';host.setAttribute('aria-label','Iklan');
    const card=document.createElement('div');const image=safeAdImage(ad.ad_image_url);card.className='bbweb-ad-card'+(image?' has-image':'');
    if(image){const media=document.createElement('div');media.className='bbweb-ad-media';const img=document.createElement('img');img.src=image;img.alt=ad.ad_title||'Iklan';img.loading='lazy';img.decoding='async';media.appendChild(img);card.appendChild(media)}
    const copy=document.createElement('div');copy.className='bbweb-ad-copy';
    const label=document.createElement('span');label.className='bbweb-ad-label';label.textContent=ad.ad_label||'IKLAN';copy.appendChild(label);
    const title=document.createElement('h3');title.textContent=ad.ad_title;copy.appendChild(title);
    if(ad.ad_description){const desc=document.createElement('p');desc.textContent=ad.ad_description;copy.appendChild(desc)}
    const href=safeAdHref(ad.ad_url);if(href&&ad.ad_cta){const link=document.createElement('a');link.className='bbweb-ad-cta';link.href=href;link.textContent=ad.ad_cta+' ↗';if(href.startsWith('https://')){link.target='_blank';link.rel='sponsored noopener noreferrer'}copy.appendChild(link)}
    card.appendChild(copy);host.appendChild(card);hero.insertAdjacentElement('afterend',host);
    return()=>host.remove();
  },[ad,version]);

  return <Studio key={version} initial={data} initialVariants={[]} path={path} user={null} isAdmin={false}/>;
}

function AdminWithAdsMenu(){
  useEffect(()=>{
    const install=()=>{
      const nav=document.querySelector<HTMLElement>('.admin-nav');
      if(!nav||nav.querySelector('[data-admin-ads-menu]'))return false;
      const labels=nav.querySelectorAll<HTMLElement>('.admin-nav-label');
      const systemLabel=labels.length>1?labels[1]:null;
      const link=document.createElement('a');link.href='/admin/iklan';link.className='admin-ads-menu';link.dataset.adminAdsMenu='true';
      const icon=document.createElement('span');icon.className='admin-ads-menu-icon';icon.textContent='AD';
      const text=document.createElement('span');text.textContent='Iklan';
      const arrow=document.createElement('span');arrow.className='admin-ads-menu-arrow';arrow.textContent='↗';
      link.append(icon,text,arrow);
      if(systemLabel)nav.insertBefore(link,systemLabel);else nav.appendChild(link);
      return true;
    };
    if(install())return;
    const observer=new MutationObserver(()=>{if(install())observer.disconnect()});observer.observe(document.getElementById('root')||document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[]);
  return <Admin/>;
}

const app=path.startsWith('/admin/iklan')?<AdsManager/>:path.startsWith('/admin')?<AdminWithAdsMenu/>:<PublicClient/>;
const root=document.getElementById('root')!;
if(path.startsWith('/admin'))createRoot(root).render(app);else hydrateRoot(root,app);