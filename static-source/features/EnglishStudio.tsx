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
      <div className="service-top"><span className="service-icon" aria-hidden="true">✳</span><ArrowUpRight size={20}/></div>
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
      <a className="btn primary" href={contact}>Discuss your project <ArrowUpRight size={17}/></a>
    </section>;
  }
  if (path === '/kontak') {
    const {email, whatsapp: phone} = defaults.settings;
    return <section className="section">
      <div className="page-intro"><span className="eyebrow">FREE WEBSITE CONSULTATION</span><h1>Tell us what you want to <em>build.</em></h1>
        <p>Share what your business does, what your website should achieve, and any budget or timeline you have in mind.</p></div>
      <div className="hero-actions"><a className="btn primary" href={whatsapp(phone, 'Hello BisaBikinWeb, I would like to discuss a website project.')}>Chat on WhatsApp <ArrowUpRight size={17}/></a>
        <a className="btn" href={'mailto:' + email}>Email the studio <ArrowUpRight size={17}/></a></div>
    </section>;
  }
  if (path === '/tentang') return <section className="section about-page">
    <div className="page-intro"><span className="eyebrow">YOGYAKARTA, INDONESIA</span><h1>Websites for people <em>building a business.</em></h1>
      <p>BisaBikinWeb is an independent digital studio in Yogyakarta. We help small businesses, personal brands, and companies build websites that make it easy for visitors to understand what they offer and take the next step.</p></div>
    <div className="about-statement"><span>✳</span><div><p>We start with your business goals, agree on the pages and features, then design, build, and test the website before launch.</p>
      <a className="text-link" href={contact}>Talk to the studio <ArrowUpRight size={17}/></a></div></div>
  </section>;
  if (path === '/jasa') return <section className="section">
    <div className="page-intro"><span className="eyebrow">WEBSITE DEVELOPMENT</span><h1>What can we <em>build for you?</em></h1>
      <p>From a single campaign page to an internal web app, choose the service that fits your goals.</p></div><Services/>
  </section>;
  if (path === '/harga') return <section className="section pricing-section">
    <div className="page-intro"><span className="eyebrow">WEBSITE PACKAGES</span><h1>Choose a package <em>that fits.</em></h1>
      <p>Compare starting prices in US dollars and features for your website project.</p></div><Pricing/>
  </section>;
  if (path === '/portfolio') return <section className="section work-section">
    <div className="page-intro"><span className="eyebrow">SELECTED WORK</span><h1>Our website <em>portfolio.</em></h1>
      <p>Explore selected projects in fashion, beauty, furniture, travel, and more.</p></div><Portfolio/>
  </section>;
  return <><section className="section">
    <div className="page-intro"><span className="eyebrow">INDEPENDENT DIGITAL STUDIO · INDONESIA</span>
      <h1>Professional websites <em>for growing businesses.</em></h1>
      <p>We design and build responsive company websites, online stores, and custom web apps. Based in Yogyakarta, we work with businesses across Indonesia.</p></div>
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
