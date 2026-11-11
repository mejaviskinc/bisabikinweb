/**
 * BisaBikinWeb Industry-Adaptive Design System v1.
 * Pure, deterministic planning layer. No network calls, no payment credentials,
 * no DOM writes and no invented business facts.
 * Designed to coexist with the existing 60 demo records and sector experiences.
 */
const system=(label,personality,hero,sections,features,photography,cta,fonts,radius,spacing,seoType)=>({
  label,personality,hero,sections,features,photography,cta,fonts,radius,spacing,seoType
});
export const INDUSTRY_DESIGN_SYSTEM=Object.freeze({
  umkm:system('UMKM & Lifestyle','hangat, dekat, autentik','split-editorial',['hero','product-or-service','brand-story','benefits','faq','contact'],['katalog','layanan lokal','WhatsApp atau formulir permintaan'],'foto produk nyata dan aktivitas bisnis','Lihat produk atau layanan',["Arial, Helvetica, sans-serif","Georgia, 'Times New Roman', serif"],'12px','76px','LocalBusiness'),
  'company-profile':system('Company Profile','profesional, jelas, tepercaya','architectural-grid',['hero','services','capabilities','portfolio','process','contact'],['profil perusahaan','layanan','portofolio','konsultasi proyek'],'dokumentasi tim, proyek, dan kantor yang terverifikasi','Konsultasi proyek',["Arial, Helvetica, sans-serif","Arial, Helvetica, sans-serif"],'4px','96px','Organization'),
  'toko-online':system('E-Commerce','kurasi produk, mudah dibeli','product-spotlight',['hero','collections','products','product-detail','policies','contact'],['katalog','varian produk','keranjang','checkout ketika sudah terhubung'],'foto produk detail dengan konteks penggunaan','Lihat koleksi',["Arial, Helvetica, sans-serif","Arial, Helvetica, sans-serif"],'10px','76px','Store'),
  ekspor:system('Export & Manufacturing','otoritatif, presisi, internasional','industrial-split',['hero','capabilities','catalog','quality','trade-process','rfq'],['spesifikasi','MOQ','RFQ','dokumen mutu terverifikasi'],'foto fasilitas dan produk pemasok yang sudah diizinkan','Request RFQ',["Arial, Helvetica, sans-serif","Arial, Helvetica, sans-serif"],'3px','100px','Organization'),
  travel:system('Travel & Tourism','imersif, inspiratif, mudah direncanakan','cinematic-landscape',['hero','destinations','tour-packages','itinerary','inclusions','booking-inquiry'],['paket wisata','itinerary','tanggal dan peserta','permintaan booking'],'foto asli destinasi dan aktivitas','Jelajahi perjalanan',["Arial, Helvetica, sans-serif","Georgia, 'Times New Roman', serif"],'14px','92px','TravelAgency'),
  restoran:system('Restaurant & Cafe','hangat, menggugah selera, sosial','food-editorial',['hero','signature-menu','menu','story','location-hours','reservation-inquiry'],['menu','bahan dan alergen','jam operasional','permintaan reservasi'],'foto makanan dan suasana restoran nyata','Jelajahi menu',["Arial, Helvetica, sans-serif","Georgia, 'Times New Roman', serif"],'12px','72px','Restaurant'),
  fashion:system('Fashion & Apparel','editorial, eksklusif, ekspresif','campaign-editorial',['hero','new-collection','lookbook','products','size-guide','customer-care'],['lookbook','varian ukuran','size guide','keranjang'],'fotografi fashion editorial dan detail bahan','Lihat koleksi',["Arial, Helvetica, sans-serif","Georgia, 'Times New Roman', serif"],'2px','98px','ClothingStore'),
  pendidikan:system('Education','informatif, ramah, terarah','learning-modular',['hero','programs','outcomes','curriculum','mentors','enrollment-inquiry'],['program','kurikulum','jadwal','pendaftaran'],'foto lingkungan belajar dan pengajar yang diizinkan','Lihat program',["Arial, Helvetica, sans-serif","Arial, Helvetica, sans-serif"],'14px','80px','EducationalOrganization'),
  skincare:system('Beauty & Skincare','bersih, sensorial, informatif','beauty-product',['hero','skin-concerns','ingredients','routines','products','faq'],['ingredients','cara pakai','katalog','sertifikasi terverifikasi'],'foto produk makro dan tekstur; hindari klaim hasil yang dibuat-buat','Kenali produk',["Arial, Helvetica, sans-serif","Georgia, 'Times New Roman', serif"],'16px','88px','Store'),
  hotel:system('Hotel & Hospitality','tenang, mewah, pengalaman','hospitality-cinematic',['hero','rooms','facilities','experiences','location','availability-inquiry'],['tipe kamar','fasilitas','permintaan ketersediaan','reservasi setelah integrasi'],'foto asli kamar dan fasilitas','Lihat pilihan kamar',["Arial, Helvetica, sans-serif","Georgia, 'Times New Roman', serif"],'12px','92px','Hotel'),
  property:system('Property & Real Estate','arsitektural, transparan, premium','architectural-grid',['hero','properties','filters','details','neighborhood','viewing-inquiry'],['listing','filter','galeri','jadwal survei'],'foto properti asli beserta status listing','Jelajahi properti',["Arial, Helvetica, sans-serif","Arial, Helvetica, sans-serif"],'5px','92px','RealEstateAgent'),
  healthcare:system('Healthcare & Clinic','tenang, aman, aksesibel','care-trust',['hero','services','doctors','care-process','faq','appointment-inquiry'],['layanan','dokter terverifikasi','permintaan jadwal','kontak darurat jelas'],'foto fasilitas asli; jangan mengarang kredensial atau kesaksian pasien','Lihat layanan',["Arial, Helvetica, sans-serif","Arial, Helvetica, sans-serif"],'14px','78px','MedicalClinic'),
  technology:system('Technology & SaaS','modern, fokus produk, sistematis','product-demo',['hero','product-demo','features','integrations','pricing','start'],['demo produk','fitur','integrasi','harga'],'tampilan produk asli atau mockup berlabel','Lihat demo produk',["Arial, Helvetica, sans-serif","Arial, Helvetica, sans-serif"],'10px','88px','SoftwareApplication'),
  logistics:system('Logistics & Supply Chain','efisien, tepat, dapat diandalkan','industrial-split',['hero','coverage','services','tracking-info','process','rfq'],['cakupan','layanan','permintaan ongkir','pelacakan jika terhubung'],'foto armada dan aktivitas operasional nyata','Minta penawaran',["Arial, Helvetica, sans-serif","Arial, Helvetica, sans-serif"],'4px','88px','Organization'),
  automotive:system('Automotive','dinamis, teknis, percaya diri','campaign-editorial',['hero','vehicles','specifications','gallery','financing-info','test-drive-inquiry'],['listing kendaraan','spesifikasi','galeri','permintaan test drive'],'foto kendaraan asli yang ditawarkan','Lihat kendaraan',["Arial, Helvetica, sans-serif","Arial, Helvetica, sans-serif"],'6px','86px','AutoDealer'),
  finance:system('Finance & Consulting','tegas, kredibel, terukur','trust-minimal',['hero','services','methodology','case-studies','compliance','consultation'],['layanan','metodologi','studi kasus berizin','konsultasi'],'grafik bersumber dan foto tim asli; jangan mengarang return','Jadwalkan konsultasi',["Arial, Helvetica, sans-serif","Arial, Helvetica, sans-serif"],'5px','92px','FinancialService'),
  construction:system('Construction & Architecture','material, presisi, portofolio','architectural-grid',['hero','portfolio','capabilities','process','team','project-inquiry'],['portofolio','proses proyek','galeri','konsultasi'],'dokumentasi proyek nyata dengan izin','Diskusikan proyek',["Arial, Helvetica, sans-serif","Georgia, 'Times New Roman', serif"],'3px','96px','GeneralContractor')
});
const aliases=Object.freeze({'e-commerce':'toko-online',ecommerce:'toko-online',online_store:'toko-online',beauty:'skincare',clinic:'healthcare',kafe:'restoran',restaurant:'restoran',hotel:'hotel',realestate:'property',saas:'technology',manufacturer:'ekspor','company':'company-profile',education:'pendidikan',export:'ekspor',tourism:'travel'});
const slugDesignOverrides=Object.freeze({'botanika-care':'skincare','lumi-lab-beauty':'skincare','nusa-konstruksi':'construction','karsa-architecture':'construction','aksa-logistics':'logistics','satu-data-studio':'technology'});
export function resolveDesignIndustry(input={}){
  const explicit=String(input.industry||'').trim().toLowerCase();
  const selected=INDUSTRY_DESIGN_SYSTEM[explicit]?explicit:aliases[explicit];
  if(selected)return selected;
  const known=slugDesignOverrides[String(input.slug||'').toLowerCase()];
  if(known)return known;
  const category=String(input.category||'').trim().toLowerCase();
  return INDUSTRY_DESIGN_SYSTEM[category]?category:(aliases[category]||'umkm');
}
function slugHash(str){let h=2166136261;for(const char of str){h=Math.imul(h^char.charCodeAt(0),16777619)}return h>>>0}
const hex=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
const defaultPalettes=Object.freeze({
  umkm:{ink:'#242820',paper:'#f7f4ec',accent:'#d7e1b7',deep:'#4a6844'},
  fashion:{ink:'#1c1a18',paper:'#f8f5f0',accent:'#ded2c4',deep:'#524838'},
  skincare:{ink:'#28372f',paper:'#faf8f4',accent:'#e4d8d5',deep:'#56645c'},
  technology:{ink:'#13243b',paper:'#f4f7fa',accent:'#c6e6ff',deep:'#274e82'},
  travel:{ink:'#16362d',paper:'#f8f5ed',accent:'#d2e7d9',deep:'#235e55'},
  'company-profile':{ink:'#182738',paper:'#f6f8fb',accent:'#cddce9',deep:'#365777'},
  'toko-online':{ink:'#2b2429',paper:'#fbf8f7',accent:'#e9cfd6',deep:'#6b485c'},
  ekspor:{ink:'#102f40',paper:'#f4f7f5',accent:'#d7e6e6',deep:'#295972'},
  restoran:{ink:'#39241b',paper:'#faf4ed',accent:'#eacdb2',deep:'#805136'},
  pendidikan:{ink:'#292654',paper:'#f7f7fd',accent:'#e2ddff',deep:'#5950a1'},
  hotel:{ink:'#302923',paper:'#faf7f0',accent:'#e8dac5',deep:'#766148'},
  property:{ink:'#26302b',paper:'#f5f7f4',accent:'#d9dfd2',deep:'#51675a'},
  healthcare:{ink:'#193e46',paper:'#f5faf9',accent:'#d1ece9',deep:'#336c72'},
  logistics:{ink:'#203140',paper:'#f6f8fa',accent:'#d4e2e9',deep:'#456579'},
  automotive:{ink:'#211f24',paper:'#f3f3f5',accent:'#e0dce6',deep:'#544d66'},
  finance:{ink:'#192834',paper:'#f7f9fa',accent:'#d4e2e6',deep:'#3f6572'},
  construction:{ink:'#282c29',paper:'#f6f5f0',accent:'#dfd8c9',deep:'#6d6659'}
});
/**
 * @param {{title?:string,name?:string,slug?:string,category?:string,industry?:string,layout?:number,palette?:object}} business
 * @param {{demo?:boolean}} options
 */
export function buildIndustryBlueprint(business,options={}){
  if(!business||typeof business!=='object')throw new TypeError('Business configuration is required');
  const name=String(business.name||business.title||'').trim();
  if(!name)throw new Error('Business name/title is required');
  const industry=resolveDesignIndustry(business),profile=INDUSTRY_DESIGN_SYSTEM[industry];
  const defaultPalette=defaultPalettes[industry]||defaultPalettes.umkm;
  const raw=business.palette||{};
  const palette=Object.fromEntries(['ink','paper','accent','deep'].map(key=>[key,hex(raw[key])?raw[key]:defaultPalette[key]]));
  const slug=String(business.slug||name).toLowerCase();
  const variation=Number.isInteger(business.layout)?((business.layout%6)+6)%6:slugHash(slug)%6;
  const heroCompositions=['split','full-bleed','asymmetric','type-led','gallery-led','structured'];
  const demo=Boolean(options.demo);
  const fonts=profile.fonts;
  return {
    version:1,name,slug,industry,industryLabel:profile.label,brandPersonality:profile.personality,
    hero:{archetype:profile.hero,composition:heroCompositions[variation],photography:profile.photography},
    navigationFlow:[...profile.sections],features:profile.features.map(feature=>({name:feature,status:demo?'demo-or-specification':'requires-integration-check'})),
    primaryCta:profile.cta,seoSchemaType:profile.seoType,mode:demo?'demo':'production-blueprint',
    palette,
    tokens:{
      '--wd-ink':palette.ink,'--wd-accent':palette.accent,'--wd-paper':palette.paper,'--wd-deep':palette.deep,
      '--wd-body-font':fonts[0],'--wd-heading-font':fonts[1],
      '--wd-card-radius':profile.radius,'--wd-section-space':profile.spacing,
      '--wd-heading-tracking':industry==='fashion'?'-.045em':industry==='technology'?'-.055em':'-.06em'
    },
    safetyRules:['No fabricated certifications, reviews, inventory, prices or bookings','Use licensed/owned imagery','Demo interactions must be labeled and must not claim real transactions','Production payments/bookings require validated integration'],
  };
}
export function blueprintCssVariables(blueprint){
  if(!blueprint||!blueprint.tokens)throw new TypeError('Invalid blueprint');
  return {...blueprint.tokens};
}
export function validateIndustryBlueprint(blueprint){
  if(!blueprint||!INDUSTRY_DESIGN_SYSTEM[blueprint.industry])return ['Unknown industry'];
  const errors=[];
  if(!blueprint.name)errors.push('Missing brand name');
  if(!Array.isArray(blueprint.navigationFlow)||blueprint.navigationFlow.length<5)errors.push('Missing industry-specific page flow');
  if(!Array.isArray(blueprint.features)||blueprint.features.length<3)errors.push('Missing essential industry features');
  if(!blueprint.hero||!blueprint.hero.archetype)errors.push('Missing hero archetype');
  for(const key of ['ink','accent','paper','deep'])if(!hex(blueprint.palette?.[key]))errors.push('Invalid palette: '+key);
  return errors;
}
