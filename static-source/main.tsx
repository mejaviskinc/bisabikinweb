import React,{useEffect,useState} from 'react';
import {hydrateRoot} from 'react-dom/client';
import Studio from './features/Studio';
import Admin from './features/Admin';
import {defaults} from './lib/data';
import {loadPublicContent} from './lib/supabase';
import './styles.css';
import './features/admin.css';
import './features/admin-modules.css';
import './features/article-images.css';

const path=location.pathname.replace(/\/+$/,'')||'/';

function PublicClient(){
  const [data,setData]=useState(defaults);
  const [version,setVersion]=useState(0);
  useEffect(()=>{
    let active=true;
    loadPublicContent().then(remote=>{
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
      setData(next);setVersion(1);
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

  return <Studio key={version} initial={data} initialVariants={[]} path={path} user={null} isAdmin={false}/>;
}

const app=path.startsWith('/admin')?<Admin/>:<PublicClient/>;
hydrateRoot(document.getElementById('root')!,app);
