export const englishPages = {
  '/': ['Professional Website Development Across Indonesia', 'BisaBikinWeb creates professional websites for businesses across Indonesia, from landing pages and online stores to custom web applications.'],
  '/jasa': ['Website Development Services', 'Explore landing page design, company websites, e-commerce, portfolio sites, custom web applications, and website maintenance.'],
  '/harga': ['Website Packages and Pricing', 'Compare BisaBikinWeb website packages priced in US dollars. Find the right scope for your business and request a tailored quote.'],
  '/portfolio': ['Website Design and Development Portfolio', 'Explore selected BisaBikinWeb projects across beauty, fashion, furniture, travel, and business websites in Indonesia.'],
  '/tentang': ['About BisaBikinWeb Digital Studio', 'Meet BisaBikinWeb, an independent digital studio in Yogyakarta that builds websites around the needs of businesses and their customers.'],
  '/kontak': ['Contact and Free Website Consultation', 'Contact BisaBikinWeb on WhatsApp or by email to discuss your website goals, project requirements, budget, and preferred timeline.'],
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
