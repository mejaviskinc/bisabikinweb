export const englishPages = {
  '/': ['Website Development Services for Businesses Worldwide', 'BisaBikinWeb designs company websites, online stores, and custom web apps for Indonesian and international businesses. Discuss your project remotely from anywhere.'],
  '/jasa': ['Website Design & Development Services for Businesses', 'Explore company website design, e-commerce development, landing pages, custom web apps, and maintenance. Request a tailored remote project consultation.'],
  '/harga': ['Website Development Pricing & Project Packages', 'Compare starting package prices and scope for business websites, online stores, and custom projects. Request an international quote before committing.'],
  '/portfolio': ['Website Design Portfolio: E-commerce & Business Sites', 'Explore real websites from BisaBikinWeb across fashion, skincare, furniture, travel, and business services, with project examples and a consultation option.'],
  '/tentang': ['About BisaBikinWeb | Remote Website Development Studio', 'Meet BisaBikinWeb, a Yogyakarta-based website development studio offering remote project collaboration for businesses in Indonesia and internationally.'],
  '/kontak': ['Contact BisaBikinWeb | Website Project Consultation', 'Discuss a website project from anywhere. Send your goals, business country, requirements, approximate budget, and timeline by WhatsApp or email.'],
};

export const englishServices = {
  'landing-page': ['Landing Page', 'A focused page designed to help visitors take action on a single offer.', ['Responsive design', 'WhatsApp call to action', 'Basic SEO', 'Optional analytics', 'Speed optimization']],
  'company-profile': ['Company Website', 'Give customers one place to learn about your company, your work, and how to get in touch.', ['Company profile', 'Services and portfolio', 'Team page', 'Contact form', 'Basic SEO']],
  ecommerce: ['Online Store', 'Give your customers a place to browse products and check out on your own website.', ['Product catalog and variants', 'Shopping cart', 'Order management', 'Stock and discounts', 'Payment integration by agreement']],
  portfolio: ['Personal and Portfolio Website', 'Present your work and make it easy for prospective clients to contact you.', ['Project gallery', 'Personal profile', 'Inquiry form', 'Social links']],
  'custom-website': ['Custom Web App', 'Build a browser-based tool around your workflow, from bookings and inventory to dashboards.', ['Requirements analysis', 'Custom dashboard', 'Access controls', 'System integrations']],
  maintenance: ['Website Maintenance', 'Keep your website up to date while you focus on running your business.', ['Content updates', 'Bug fixes', 'Backups according to your plan', 'Performance tuning', 'Security checks']],
};

for (const [id, [name, description]] of Object.entries(englishServices)) {
  englishPages['/jasa/' + id] = [name + ' Development and Support', description];
}

export function hasEnglishPage(path) {
  return Object.hasOwn(englishPages, path);
}

export function englishHref(path) {
  return path === '/' ? '/en/' : '/en' + path + '/';
}

// Fixed pricing reference: Bank Indonesia JISDOR, 4 November 2026.
const rupiahPerUsDollar = 18_140;
const internationalPriceMultiplier = 3.5;
const usd = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});

export function formatEnglishPrice(priceInRupiah) {
  return usd.format(priceInRupiah * internationalPriceMultiplier / rupiahPerUsDollar);
}
