import FooterPaymentMethods from '../components/FooterPaymentMethods';
import {useEffect, useState} from 'react';
import {ArrowUpRight, Check, Menu, MessageCircle, X} from 'lucide-react';
import {BrandShowcase, Logo, PortfolioVisual} from '../components/Visuals';
import {Consultation} from './Forms';
import {defaults} from '../lib/data';
import {whatsapp} from '../lib/client';
import {englishHref, englishServices, formatEnglishPrice, indonesianSwitchHref} from '../lib/languages.mjs';

const navigation = [
  ['Services', '/jasa'], ['Pricing', '/harga'], ['Online Store', '/jasa/ecommerce'],
  ['Portfolio', '/portfolio'], ['About', '/tentang'], ['Contact', '/kontak'],
];

const plans: Record<string, string[]> = {
  starter: ['Landing page or personal website', 'Responsive design', 'Consultation call to action', 'Basic SEO'],
  business: ['Multi-page company website', 'Portfolio and services', 'Inquiry form', 'Content tailored to your needs'],
  commerce: ['Product catalog and variants', 'Cart and checkout', 'Order management', 'Integrations based on your needs'],
  custom: ['Web app or internal system', 'User access controls', 'API integrations', 'Project scope by agreement'],
};

function Services() {
  return <div className="services-grid">{Object.entries(englishServices).map(([id, [name, description, features]]) =>
    <a className="service-card" href={englishHref('/jasa/' + id)} key={id}>
      <div className="service-top"><span className="service-icon" aria-hidden="true">{defaults.services.find((s: {id:string;icon:string})=>s.id===id)?.icon||'↗'}</span><ArrowUpRight size={20}/></div>
      <small>{defaults.services.find((s: {id:string;tag:string})=>s.id===id)?.tag}</small><h3>{name}</h3><p>{description}</p>
      <div className="service-features">{features.slice(0, 3).map(feature => <span key={feature}>{feature}</span>)}</div>
    </a>
  )}</div>;
}

function Pricing() {
  return <><div className="pricing-grid">{defaults.pricing.map((plan: {id: string; name: string; price: number | null; featured?: boolean}) =>
    <div className={'price-card ' + (plan.featured ? 'featured' : '')} key={plan.id}>
      <small>{plan.name.toUpperCase()}</small>
      <h3>{plan.price ? formatEnglishPrice(plan.price) : 'Request a quote'}</h3>
      <span className="price-note">{plan.price?'Starting price / project (IDR)':'Scope-based estimate'}</span>
      <div>{plans[plan.id].map(feature => <p className="price-feature" key={feature}><Check size={15}/>{feature}</p>)}</div>
      <a className={'btn '+(plan.featured?'primary':'')} href={englishHref('/kontak')+'?estimate='+encodeURIComponent('Website package: '+plan.name)}>Discuss this package <ArrowUpRight size={16}/></a>
    </div>
  )}</div><p className="pricing-disclaimer">Published prices are the same IDR amounts in both languages, not multiplied for English visitors. Other currencies, scope, revisions, domain, hosting, and integrations are agreed in a written quote.</p></>;
}

function Portfolio() {
  return <div className="portfolio-grid">{defaults.portfolio.map((project: {id:string;name:string;category:string;tag?:string;year?:string;live?:string;domain?:string}) =>
    <a className="project-card" key={project.id} href={project.live||'/portfolio/'+project.id+'/'} target={project.live?'_blank':undefined} rel={project.live?'noopener noreferrer':undefined}>
      <PortfolioVisual project={project}/>
      <div className="project-caption"><div><small>{project.tag||project.category}</small><h3>{project.name}</h3></div><span className="circle-link"><ArrowUpRight size={20}/></span></div>
    </a>
  )}</div>;
}

function EnglishContent({path}: {path: string}) {
  const service = path.startsWith('/jasa/') ? englishServices[path.slice('/jasa/'.length) as keyof typeof englishServices] : undefined;
  const contact = englishHref('/kontak');
  if (service) {
    const [name, description, features] = service;
    return <section className="section service-detail">
      <div className="breadcrumbs"><a href={englishHref('/jasa')}>Services</a><span>/</span>{name}</div>
      <div className="page-intro"><h1>{name}<em>↗</em></h1><p>{description}</p></div>
      <div className="service-detail-grid"><h2>Features for your<br/>website project.</h2><div>{features.map((feature,i) => <div className="feature-line" key={feature}><span>0{i+1}</span><h3>{feature}</h3><Check size={20}/></div>)}</div></div>
      <div className="case-study-links"><h2>Planning a project from another country?</h2><p>We coordinate website briefs, design reviews, and project updates remotely. Share your business country, preferred language, required pages, integrations, budget range, and timeline. Your proposal sets out the agreed scope and delivery process.</p><div className="seo-related"><a href={englishHref('/portfolio')}>See selected work <ArrowUpRight size={15}/></a><a href={englishHref('/harga')}>Compare starting prices <ArrowUpRight size={15}/></a></div></div>
      <a className="btn primary" href={contact}>Discuss your project <ArrowUpRight size={17}/></a>
    </section>;
  }
  if (path === '/kontak') {
    const {email, whatsapp: phone} = defaults.settings;
    return <section className="section contact-page">
      <div><span className="eyebrow">YOUR NEXT BIG THING STARTS HERE.</span><h1>Tell us.<br/>We'll <em>build it.</em></h1>
        <p>We welcome remote projects from Indonesia and other countries. Share your business location, the pages or features you need, your budget range, and preferred launch date.</p>
        <div className="contact-notes"><p><Check size={17}/>Free initial consultation</p><p><Check size={17}/>No technical background required</p><p><Check size={17}/>Written scope before a project begins</p></div>
        <a className="text-link" href={whatsapp(phone,'Hello BisaBikinWeb, I would like to discuss a website project.')}><MessageCircle size={18}/>Chat on WhatsApp <ArrowUpRight size={17}/></a>
        <p><a href={'mailto:'+email}>{email}</a></p>
      </div>
      <Consultation locale="en"/>
    </section>;
  }
  if (path === '/tentang') return <section className="section about-page">
    <div className="page-intro"><span className="eyebrow">YOGYAKARTA, INDONESIA</span><h1>Websites for people <em>building a business.</em></h1>
      <p>BisaBikinWeb is an independent digital studio based in Yogyakarta, Indonesia. We collaborate remotely with small businesses, brands, and companies in Indonesia and internationally to build websites that communicate clearly and help visitors take the next step.</p></div>
    <div className="about-statement"><span className="about-statement-label">HOW WE WORK.</span><div><p>We start with your business goals, agree on the pages and features, then design, build, and test the website before launch.</p>
      <a className="text-link" href={contact}>Talk to the studio <ArrowUpRight size={17}/></a></div></div>
  </section>;
  if (path === '/jasa') return <section className="section">
    <div className="page-intro"><span className="eyebrow">WEBSITE DEVELOPMENT</span><h1>What can we <em>build for you?</em></h1>
      <p>From company websites and online stores to custom web apps, choose a service aligned with your business goals. We discuss requirements and manage website projects remotely with clients in Indonesia and abroad.</p></div><Services/><div className="case-study-links"><h2>How remote website projects work</h2><p>Share your brief and existing brand materials. We clarify the pages, features, language, timelines, and any third-party integrations; agree on the scope; review the design together; and test the agreed experience before launch.</p><div className="seo-related"><a href={englishHref('/portfolio')}>Explore example projects <ArrowUpRight size={15}/></a><a href={englishHref('/harga')}>View website packages <ArrowUpRight size={15}/></a><a href={contact}>Request a project quote <ArrowUpRight size={15}/></a></div></div>
  </section>;
  if (path === '/harga') return <section className="section pricing-section">
    <div className="page-intro"><span className="eyebrow">WEBSITE PACKAGES</span><h1>Choose a package <em>that fits.</em></h1>
      <p>Compare indicative starting prices in US dollars and discuss a written quote for your specific website, location, and required integrations. Pricing and scope are confirmed before work begins.</p></div><Pricing/><div className="case-study-links"><h2>Need an estimate for your business?</h2><p>Tell us whether you need a company profile, online store, landing page, or custom web app, and which country your business operates in. We can clarify scope and third-party fees during consultation.</p><div className="seo-related"><a href={englishHref('/jasa')}>Compare services <ArrowUpRight size={15}/></a><a href={contact}>Request a tailored quote <ArrowUpRight size={15}/></a></div></div>
  </section>;
  if (path === '/portfolio') return <section className="section work-section">
    <div className="page-intro"><span className="eyebrow">SELECTED WORK</span><h1>Our website <em>portfolio.</em></h1>
      <p>Explore selected live websites in fashion, beauty, furniture, travel, and business services. Project descriptions below are examples, not guarantees of commercial results.</p></div><Portfolio/><div className="case-study-links"><h2>Learn more about the projects</h2><p>The detailed case studies are currently in Indonesian; the live sites can be explored directly.</p><div className="seo-related"><a href="/portfolio/mejavi-skin/">Mejavi Skin+ case study (ID) <ArrowUpRight size={15}/></a><a href="/portfolio/gooninks/">GoO Ninks case study (ID) <ArrowUpRight size={15}/></a><a href="/portfolio/gojogja-travel/">GoJogja Travel case study (ID) <ArrowUpRight size={15}/></a><a href={contact}>Discuss a similar website <ArrowUpRight size={15}/></a></div></div>
  </section>;
  return <>
    <section className="hero">
      <div className="hero-top"><span className="eyebrow"><i className="status-dot"/>INDEPENDENT DIGITAL STUDIO · INDONESIA</span><span className="hero-availability">Remote projects worldwide <span>↗</span></span></div>
      <div className="hero-layout"><div className="hero-copy">
        <h1>Website development<br/>for growing businesses<br/><span>around the world.</span></h1>
        <p>We build professional websites, online stores, and custom web apps. Based in Yogyakarta, Indonesia, our studio works remotely with businesses worldwide, including companies across Indonesia.</p>
        <div className="hero-actions"><a className="btn primary" href={contact}>Start your website project <ArrowUpRight size={18}/></a><a className="btn plain" href={englishHref('/portfolio')}>Explore our work <ArrowUpRight size={17}/></a></div>
        <div className="hero-foot"><span>DESIGN · DEVELOPMENT · SUPPORT</span><span>INDONESIA / GLOBAL</span></div>
      </div><div className="hero-showcase"><BrandShowcase/></div></div>
    </section>
    <section className="section sitelink-hub" aria-labelledby="en-sitelinks-title">
      <div className="sitelink-heading"><span className="eyebrow">EXPLORE BISABIKINWEB</span><h2 id="en-sitelinks-title">Find the right website service.</h2><p>Compare services, see real projects, review pricing, and contact our team.</p></div>
      <nav className="sitelink-grid" aria-label="Main website services">
        {[
          ['Services','/jasa','Company websites, online stores, and custom web apps'],
          ['Pricing','/harga','Starting prices and project scope'],
          ['Online stores','/jasa/ecommerce','Product catalogs, ordering, and agreed integrations'],
          ['Portfolio','/portfolio','Examples of published website projects'],
          ['About us','/tentang','Our approach and remote project process'],
          ['Contact','/kontak','Request a tailored quote online']
        ].map(([label,route,description])=><a className="sitelink-card" key={route} href={englishHref(route)}><span>{label}</span><p>{description}</p><ArrowUpRight size={19} aria-hidden="true"/></a>)}
      </nav>
    </section>
    <section className="section services-section"><div className="section-heading"><div><span className="eyebrow">WHAT WE BUILD</span><h2>Professional website services.</h2><p>Explore services for different business needs.</p></div><a className="text-link" href={englishHref('/jasa')}>All services <ArrowUpRight size={17}/></a></div><Services/></section>
    <section className="section work-section"><div className="section-heading"><div><span className="eyebrow">SELECTED WORK</span><h2>Websites with a purpose.</h2><p>Real project examples you can explore.</p></div><a className="text-link" href={englishHref('/portfolio')}>Explore portfolio <ArrowUpRight size={17}/></a></div><Portfolio/></section>
    <section className="section pricing-section"><div className="section-heading"><div><span className="eyebrow">CLEAR PROJECT SCOPE</span><h2>Website packages & pricing.</h2><p>Identical published starting prices in both languages, quoted in IDR.</p></div><a className="text-link" href={englishHref('/harga')}>Pricing details <ArrowUpRight size={17}/></a></div><Pricing/></section>
    <section className="final-cta"><span className="eyebrow">LET'S MAKE IT HAPPEN.</span><h2>Ready to build<br/>something <em>useful?</em></h2><div><p>Share your business goals and we'll discuss a website plan that fits.</p><a className="btn primary" href={contact}>Talk to our studio <ArrowUpRight size={18}/></a></div></section>
  </>;
}

export default function EnglishStudio({path}: {path: string}) {
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    try {
      document.documentElement.dataset.theme = localStorage.getItem('bbw_theme') === 'light' ? 'light' : 'dark';
    } catch {}
  }, []);
  const links = navigation.map(([name, route]) => <a href={englishHref(route)} key={route} aria-current={path===route||path.startsWith(route+'/')?'page':undefined}>{name}</a>);
  return <><a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header">
      <a href="/en/" aria-label="BisaBikinWeb home"><Logo/></a>
      <nav aria-label="Main navigation">{links.slice(0,5)}<a href="/beli-website/" lang="id" title="Website catalog is currently in Indonesian">Catalog (ID)</a><a href="/artikel/" lang="id" title="Articles are currently in Indonesian">Articles (ID)</a></nav>
      <div className="nav-actions">
        <a className="icon-button language-switch" href={indonesianSwitchHref(path)} lang="id" hrefLang="id" aria-label="Lihat halaman ini dalam Bahasa Indonesia" title="Bahasa Indonesia — same page">ID</a><a className="btn nav-cta" href={englishHref('/kontak')}>Free consultation <ArrowUpRight size={16}/></a>
        <button className="icon-button mobile-menu-button" type="button" aria-expanded={menu} aria-controls="english-navigation" aria-label={menu ? 'Close menu' : 'Open menu'} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button>
      </div>
    </header>
    {menu && <div className="mobile-menu" id="english-navigation"><div className="mobile-menu-links">{links}<a href="/beli-website/" lang="id">Website catalog (Indonesian)</a><a href="/artikel/" lang="id">Articles (Indonesian)</a></div></div>}
    <main id="main"><EnglishContent path={path}/></main>
    <footer className="site-footer"><div className="footer-top"><div><a href="/en/"><Logo/></a><p>Independent digital studio in Yogyakarta.</p></div>
      <div className="footer-links"><div><small>THE STUDIO</small>{links}</div><div><small>IN INDONESIAN</small>
        <a href="/beli-website/" lang="id">Website catalog (ID)</a><a href="/artikel/" lang="id">Articles (ID)</a><a href="/berita/" lang="id">News (ID)</a><a href="/merch/">Merchandise (ID)</a><a href="/privacy/">Privacy policy (ID)</a>
      </div></div></div><FooterPaymentMethods english/></footer>
  </>;
}
