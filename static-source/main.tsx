import React,{useEffect,useState} from 'react';
import {hydrateRoot} from 'react-dom/client';
import Studio from './features/Studio';
import Admin from './features/Admin';
import {defaults} from './lib/data';
import {loadPublicContent} from './lib/supabase';
import './styles.css';
import './features/admin.css';
import './features/admin-modules.css';

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
  return <Studio key={version} initial={data} initialVariants={[]} path={path} user={null} isAdmin={false}/>;
}

const app=path.startsWith('/admin')?<Admin/>:<PublicClient/>;
hydrateRoot(document.getElementById('root')!,app);
