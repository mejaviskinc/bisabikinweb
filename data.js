function projectThumb(title, accent = '#d9b887') {
  const safeTitle = title.replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" fill="#f7f3eb"/><circle cx="800" cy="90" r="180" fill="${accent}" opacity=".35"/><rect x="70" y="70" width="820" height="400" rx="28" fill="#fff" stroke="#ded7cb"/><rect x="70" y="70" width="820" height="46" rx="28" fill="#151515"/><circle cx="100" cy="93" r="6" fill="#d9b887"/><circle cx="120" cy="93" r="6" fill="#8c8c8c"/><circle cx="140" cy="93" r="6" fill="#8c8c8c"/><text x="110" y="235" font-family="Arial,sans-serif" font-size="52" font-weight="700" fill="#111">${safeTitle}</text><text x="110" y="285" font-family="Arial,sans-serif" font-size="22" fill="#6f6b64">Website project by BisaBikinWeb</text><rect x="110" y="330" width="180" height="44" rx="22" fill="#111"/><rect x="310" y="330" width="150" height="44" rx="22" fill="${accent}"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function avatarData(initials) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="#ead3aa"/><text x="80" y="96" text-anchor="middle" font-family="Arial,sans-serif" font-size="46" font-weight="700" fill="#111">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const CONFIG = {
  // Isi nomor WhatsApp tanpa tanda +, contoh: 6281234567890.
  // Jika dikosongkan, tombol tetap membuka WhatsApp dengan pesan siap kirim.
  whatsappNumber: '',
  instagram: 'https://instagram.com/bisabikinweb',
  tiktok: '#'
};

const services = [
  { icon: 'building-2', title: 'Company Profile', desc: 'Website profesional untuk memperkenalkan perusahaan, layanan, portfolio, dan informasi bisnis.' },
  { icon: 'panel-top', title: 'Landing Page', desc: 'Website satu halaman untuk campaign, produk, event, atau meningkatkan conversion.' },
  { icon: 'store', title: 'Website UMKM', desc: 'Website profesional untuk bisnis kecil dan menengah agar lebih terpercaya di mata customer.' },
  { icon: 'shopping-bag', title: 'Online Store', desc: 'Website untuk menjual produk secara online dengan katalog, CTA, dan alur pembelian yang jelas.' },
  { icon: 'badge-check', title: 'Personal Branding', desc: 'Website untuk profesional, creator, consultant, atau public figure.' },
  { icon: 'house', title: 'Property Website', desc: 'Website untuk agent, developer, dan listing properti yang mudah dicari.' },
  { icon: 'utensils', title: 'Restaurant & Cafe', desc: 'Website dengan menu, lokasi, reservasi, jam operasional, dan kontak.' },
  { icon: 'blocks', title: 'Custom Website', desc: 'Website dengan fitur khusus sesuai alur kerja dan kebutuhan bisnis.' }
];

const advantages = [
  { icon: 'sparkles', title: 'Desain Modern', desc: 'Website dibuat mengikuti tren desain modern tanpa mengorbankan kenyamanan pengguna.' },
  { icon: 'smartphone', title: 'Mobile Responsive', desc: 'Tampilan optimal di smartphone, tablet, laptop, dan desktop.' },
  { icon: 'gauge', title: 'Fast Loading', desc: 'Struktur dan aset dioptimalkan agar website terasa cepat dibuka.' },
  { icon: 'search', title: 'SEO Friendly', desc: 'Struktur heading, metadata, dan halaman dibuat lebih mudah dikenali mesin pencari.' },
  { icon: 'shield-check', title: 'SSL Security', desc: 'Website disiapkan untuk HTTPS agar koneksi lebih aman dan dipercaya browser.' },
  { icon: 'settings-2', title: 'Mudah Dikelola', desc: 'Konten penting disusun agar lebih mudah diperbarui ketika bisnis berkembang.' },
  { icon: 'message-circle-more', title: 'WhatsApp Integration', desc: 'Customer dapat langsung menghubungi bisnis melalui CTA WhatsApp.' },
  { icon: 'headphones', title: 'Support', desc: 'Kami membantu setelah website selesai dibuat sesuai cakupan paket.' }
];

const pricing = [
  {
    name: 'STARTER', price: 'Rp800.000', desc: 'Cocok untuk UMKM dan personal brand yang ingin mulai tampil profesional.',
    features: ['Landing Page / Company Profile sederhana','Responsive Mobile','WhatsApp Button','Contact Form','Social Media Integration','SSL','Basic SEO','Support'],
    cta: 'Pilih Starter'
  },
  {
    name: 'BUSINESS', price: 'Hubungi Kami', desc: 'Untuk bisnis yang membutuhkan website multi-page dengan struktur lebih lengkap.', popular: true,
    features: ['Website Multi Page','Custom Design','Product / Service Pages','Portfolio','WhatsApp Integration','Contact Form','Google Maps','Basic SEO','Analytics','SSL','Support & Maintenance'],
    cta: 'Konsultasi Paket'
  },
  {
    name: 'CUSTOM', price: 'Custom', desc: 'Untuk perusahaan atau sistem khusus dengan alur, integrasi, dan fitur spesifik.',
    features: ['Custom Web Application','Dashboard','Authentication','Database','API Integration','Payment Integration','Admin Panel','Custom Feature','Maintenance'],
    cta: 'Diskusikan Project'
  }
];

const portfolios = [
  {
    id: 1, title: 'Mejavi Skin+', category: 'E-Commerce', image: projectThumb('Mejavi Skin+', '#d7b98b'),
    desc: 'Website skincare dengan katalog produk, detail ingredients, CTA pembelian, dan pengalaman mobile-first.',
    tech: ['HTML','CSS','JavaScript'], link: '#'
  },
  {
    id: 2, title: 'MEJAVI Warehouse', category: 'Web App', image: projectThumb('MEJAVI Warehouse', '#8d9ca8'),
    desc: 'Dashboard warehouse management untuk stok, inbound, outbound, barcode, laporan, dan role pengguna.',
    tech: ['React','Supabase','Dashboard'], link: '#'
  },
  {
    id: 3, title: 'GriyaLink', category: 'Company Profile', image: projectThumb('GriyaLink', '#b7a18a'),
    desc: 'Website properti untuk memperkenalkan layanan agent, listing, dan kontak calon customer.',
    tech: ['Responsive','SEO','WhatsApp'], link: '#'
  },
  {
    id: 4, title: 'densExport', category: 'Landing Page', image: projectThumb('densExport', '#c0aa80'),
    desc: 'Landing page komunitas buyer-supplier dengan fokus pada value proposition dan lead generation.',
    tech: ['Landing Page','CTA','Mobile'], link: '#'
  },
  {
    id: 5, title: 'Kedai Nusa', category: 'Company Profile', image: projectThumb('Kedai Nusa', '#9f8d78'),
    desc: 'Website cafe dengan menu, lokasi, jam buka, galeri, dan reservasi via WhatsApp.',
    tech: ['Menu','Maps','WhatsApp'], link: '#'
  },
  {
    id: 6, title: 'LokalHub Campaign', category: 'Landing Page', image: projectThumb('LokalHub', '#a7a089'),
    desc: 'Campaign landing page dengan struktur conversion-focused, social proof, dan CTA yang jelas.',
    tech: ['Campaign','SEO','Analytics'], link: '#'
  }
];

const processSteps = [
  ['01 — Konsultasi','Customer menjelaskan bisnis dan kebutuhan website.'],
  ['02 — Brief & Konsep','Kami menentukan struktur, desain, warna, dan fitur.'],
  ['03 — Development','Website mulai dibuat dan dioptimalkan untuk berbagai perangkat.'],
  ['04 — Review','Customer melakukan pengecekan dan revisi sesuai paket.'],
  ['05 — Launch','Website dipublikasikan ke domain dan hosting yang disepakati.'],
  ['06 — Support','Kami memberikan support setelah website aktif sesuai cakupan layanan.']
];

const testimonials = [
  { name: 'Ayu Pratama', business: 'Owner, Brand Lokal', image: avatarData('AP'), text: 'Proses komunikasinya jelas dan hasil website jadi jauh lebih rapi daripada hanya mengandalkan media sosial. Tampilan mobile-nya juga enak dilihat.' },
  { name: 'Raka Mahendra', business: 'Founder, UMKM Kuliner', image: avatarData('RM'), text: 'Yang paling membantu adalah struktur informasinya. Customer sekarang bisa langsung lihat layanan, lokasi, dan kontak tanpa harus tanya satu per satu.' },
  { name: 'Nadia Putri', business: 'Personal Brand', image: avatarData('NP'), text: 'Desainnya terasa profesional tetapi tetap sederhana. Website juga mudah dibuka dari HP dan CTA WhatsApp sangat membantu untuk inquiry.' }
];

const faqs = [
  ['Berapa harga membuat website?','Harga website mulai dari sekitar Rp800 ribuan dan dapat menyesuaikan fitur serta kebutuhan project.'],
  ['Berapa lama pembuatan website?','Tergantung jumlah halaman, desain, dan fitur yang dibutuhkan. Estimasi akan dijelaskan setelah brief project diterima.'],
  ['Apakah website bisa dibuka di HP?','Ya. Semua website dibuat responsive agar tampil optimal di smartphone, tablet, laptop, dan desktop.'],
  ['Apakah mendapatkan domain?','Domain dan hosting dapat disesuaikan dengan paket yang dipilih.'],
  ['Apakah bisa revisi?','Ya, revisi diberikan sesuai paket dan ruang lingkup project yang disepakati.'],
  ['Apakah BisaBikinWeb menyediakan maintenance?','Ya, tersedia layanan maintenance website sesuai kebutuhan.'],
  ['Apakah bisa membuat website custom?','Bisa. Kami dapat membuat website dan web application dengan fitur khusus sesuai kebutuhan bisnis.']
];

