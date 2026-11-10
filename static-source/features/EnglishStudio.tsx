import FooterPaymentMethods from '../components/FooterPaymentMethods';
import {useEffect, useState} from 'react';
import {ArrowUpRight, Menu, X} from 'lucide-react';
import {Logo} from '../components/Visuals';
import {defaults} from '../lib/data';
import {whatsapp} from '../lib/client';
import {englishHref, englishServices, formatEnglishPrice} from '../lib/languages.mjs';

const navigation = [
  ['Services', '/jasa'], ['Portfolio', '/portfolio'], ['Pricing', '/harga'],
  ['About', '/tentang'], ['Contact', '/kontak'],
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
      <div className="service-top"><span className="service-icon service-text-icon" aria-hidden="true">WEB</span><ArrowUpRight size={20}/></div>
      <h3>{name}</h3><p>{description}</p>
      <div className="service-features">{features.slice(0, 3).map(feature => <span key={feature}>{feature}</span>)}</div>
    </a>
  )}</div>;
}

function Pricing() {
  return <><div className="pricing-grid">{defaults.pricing.map((plan: {id: string; name: string; price: number | null; featured?: boolean}) =>
    <div className={'price-card ' + (plan.featured ? 'featured' : '')} key={plan.id}>
      <small>{plan.name.toUpperCase()}</small>
      <h3>{plan.price ? formatEnglishPrice(plan.price) : 'Request a quote'}</h3>
      {plan.price && <span className="price-note">Starting price in USD per project</span>}
      <div>{plans[plan.id].map(feature => <p className="price-feature" key={feature}>{feature}</p>)}</div>
      <a className="btn" href={englishHref('/kontak')}>Discuss this package <ArrowUpRight size={16}/></a>
    </div>
  )}</div><p className="pricing-disclaimer">Your proposal covers scope, revisions, domain, hosting, and integration costs. We agree on the final price before work starts.</p></>;
}

function Portfolio() {
  return <div className="services-grid">{defaults.portfolio.map((project: {id: string; name: string; category: string; domain?: string; live?: string}) => {
    const details = <><small>{project.category}</small><h3>{project.name}</h3>{project.domain && <p>{project.domain}</p>}</>;
    return project.live?.startsWith('https://')
      ? <a className="service-card" href={project.live} key={project.id} target="_blank" rel="noopener noreferrer">{details}<span className="text-link">Visit website <ArrowUpRight size={16}/></span></a>
      : <div className="service-card" key={project.id}>{details}</div>;
  })}</div>;
}

function EnglishContent({path}: {path: string}) {
  const service = path.startsWith('/jasa/') ? englishServices[path.slice('/jasa/'.length) as keyof typeof englishServices] : undefined;
  const contact = englishHref('/kontak');
  if (service) {
    const [name, description, features] = service;
    return <section className="section service-detail">
      <div className="breadcrumbs"><a href={englishHref('/jasa')}>Services</a><span>/</span>{name}</div>
      <div className="page-intro"><h1>{name}<em>↗</em></h1><p>{description}</p></div>
      <h2>Available features</h2><ul>{features.map(feature => <li key={feature}>{feature}</li>)}</ul>
      <div className="case-study-links"><h2>Planning a project from another country?</h2><p>We coordinate website briefs, design reviews, and project updates remotely. Share your business country, preferred language, required pages, integrations, budget range, and timeline. Your proposal sets out the agreed scope and delivery process.</p><div className="seo-related"><a href={englishHref('/portfolio')}>See selected work <ArrowUpRight size={15}/></a><a href={englishHref('/harga')}>Compare starting prices <ArrowUpRight size={15}/></a></div></div>
      <a className="btn primary" href={contact}>Discuss your project <ArrowUpRight size={17}/></a>
    </section>;
  }
  if (path === '/kontak') {
    const {email, whatsapp: phone} = defaults.settings;
    return <section className="section">
      <div className="page-intro"><span className="eyebrow">FREE WEBSITE CONSULTATION</span><h1>Tell us what you want to <em>build.</em></h1>
        <p>We welcome remote project inquiries from Indonesia and other countries. Tell us your business location, goals, required pages or integrations, preferred language, approximate budget, and timeline. We will discuss availability and confirm the scope before any project begins.</p></div>
      <div className="hero-actions"><a className="btn primary" href={whatsapp(phone, 'Hello BisaBikinWeb, I would like to discuss a website project.')}>Chat on WhatsApp <ArrowUpRight size={17}/></a>
        <a className="btn" href={'mailto:' + email}>Email the studio <ArrowUpRight size={17}/></a></div>
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
  return <><section className="section">
    <div className="page-intro"><span className="eyebrow">INDEPENDENT DIGITAL STUDIO · INDONESIA</span>
      <h1>Professional websites <em>for growing businesses.</em></h1>
      <p>We design and build responsive company websites, online stores, and custom web apps. Based in Yogyakarta, Indonesia, our studio welcomes remote website projects from businesses worldwide, with scope and delivery agreed before work begins.</p></div>
    <div className="hero-actions"><a className="btn primary" href={contact}>Free consultation <ArrowUpRight size={17}/></a>
      <a className="btn" href={englishHref('/portfolio')}>View portfolio <ArrowUpRight size={17}/></a></div>
  </section><section className="section services-section"><div className="section-heading"><h2>Website services</h2></div><Services/></section>
  <section className="section pricing-section"><div className="section-heading"><h2>Website packages</h2></div><Pricing/></section></>;
}

export default function EnglishStudio({path}: {path: string}) {
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    try {
      document.documentElement.dataset.theme = localStorage.getItem('bbw_theme') === 'light' ? 'light' : 'dark';
    } catch {}
  }, []);
  const links = navigation.map(([name, route]) => <a href={englishHref(route)} key={route} aria-current={path === route ? 'page' : undefined}>{name}</a>);
  return <><a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header">
      <a href="/en/" aria-label="BisaBikinWeb home"><Logo/></a>
      <nav aria-label="Main navigation">{links}</nav>
      <div className="nav-actions">
        <a className="icon-button language-switch" href={path === '/' ? '/' : path + '/'} lang="id" hrefLang="id" aria-label="Bahasa Indonesia">ID</a>
        <button className="icon-button mobile-menu-button" type="button" aria-expanded={menu} aria-controls="english-navigation" aria-label={menu ? 'Close menu' : 'Open menu'} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button>
      </div>
    </header>
    {menu && <div className="mobile-menu" id="english-navigation"><div className="mobile-menu-links">{links}</div></div>}
    <main id="main"><EnglishContent path={path}/></main>
    <footer className="site-footer"><div className="footer-top"><div><a href="/en/"><Logo/></a><p>Independent digital studio in Yogyakarta.</p></div>
      <div className="footer-links"><div><small>THE STUDIO</small>{links}</div><div><small>IN INDONESIAN</small>
        <a href="/artikel/">Articles (ID)</a><a href="/berita/">News (ID)</a><a href="/merch/">Merchandise (ID)</a><a href="/privacy/">Privacy policy (ID)</a>
      </div></div></div><FooterPaymentMethods english/></footer>
  </>;
}
