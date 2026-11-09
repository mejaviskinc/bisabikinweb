// Website demo information architecture. All brands are fictional examples.
// Exported routes are used by the static prerenderer and the React demo.
export const demoExperiences = {
  umkm: {
    label:'UMKM & Local Brands', eyebrow:'Made for everyday living', catalog:'produk', catalogLabel:'Produk', secondary:'layanan', secondaryLabel:'Layanan', story:'cerita', storyLabel:'Cerita kami', contact:'kontak', contactLabel:'Hubungi', request:'Konsultasi pesanan', inquiry:'Konsultasi produk', intro:'Pilihan lokal yang dirancang untuk melengkapi keseharian.', detailLabel:'Detail produk', detailSections:['Pilihan produk','Cara memesan','Informasi pengiriman'], qualities:['Pilihan yang mudah dipahami','Detail produk yang transparan','Pemesanan dengan pendampingan'],
    secondaryTitle:'Layanan yang dekat dengan keseharian', secondaryText:'Kenali cara kami membantu memilih produk, menyiapkan pesanan, dan menjawab pertanyaan sebelum pembelian.', questions:['Produk atau kebutuhan','Jumlah yang dibutuhkan','Lokasi pengiriman'], gallery:'Cerita di balik produk'
  },
  'company-profile': {
    label:'Business & Professional Services', eyebrow:'Built with intention', catalog:'layanan', catalogLabel:'Layanan', secondary:'proyek', secondaryLabel:'Proyek', story:'perusahaan', storyLabel:'Perusahaan', contact:'kontak', contactLabel:'Kontak', request:'Diskusikan proyek', inquiry:'Permintaan penawaran', intro:'Pendekatan profesional untuk kebutuhan organisasi yang terus berkembang.',detailLabel:'Ruang lingkup layanan', detailSections:['Lingkup pekerjaan','Alur konsultasi','Hasil yang disepakati'], qualities:['Pemahaman kebutuhan','Proses kerja terstruktur','Komunikasi yang terarah'],
    secondaryTitle:'Pendekatan pada setiap proyek',secondaryText:'Setiap pekerjaan dimulai dari kebutuhan, dilanjutkan dengan penentuan ruang lingkup, dan diselesaikan melalui evaluasi bersama.',questions:['Jenis proyek','Perkiraan kebutuhan','Target penyelesaian'],gallery:'Perspektif proyek'
  },
  'toko-online': {
    label:'Online Shopping',eyebrow:'Objects for better days',catalog:'shop',catalogLabel:'Belanja',secondary:'panduan',secondaryLabel:'Panduan',story:'tentang',storyLabel:'Tentang',contact:'kontak',contactLabel:'Bantuan',request:'Lihat keranjang',inquiry:'Tanya produk',intro:'Temukan barang pilihan dengan informasi produk yang mudah ditelusuri.',detailLabel:'Detail produk',detailSections:['Deskripsi produk','Pilihan dan ukuran','Pengiriman & pengembalian'],qualities:['Katalog mudah dicari','Detail belanja jelas','Pengalaman belanja nyaman'],
    secondaryTitle:'Panduan berbelanja',secondaryText:'Temukan informasi pemilihan produk, cara menentukan varian, serta alur pesanan sebelum melanjutkan.',questions:['Produk yang diminati','Warna atau ukuran','Pertanyaan pengiriman'],gallery:'Pilihan untuk kebutuhanmu'
  },
  ekspor: {
    label:'International B2B Sourcing',eyebrow:'Origin matters',catalog:'products',catalogLabel:'Products',secondary:'capabilities',secondaryLabel:'Capabilities',story:'about',storyLabel:'About us',contact:'rfq',contactLabel:'Request RFQ',request:'Request quotation',inquiry:'Ask about product',intro:'Explore sourcing options and submit your requirements for a commercial quotation.',detailLabel:'Product information',detailSections:['Product specifications','Sample & MOQ inquiry','Trade documentation'],qualities:['Product-focused catalog','Clear commercial inquiry','Specification review'],
    secondaryTitle:'Sourcing capabilities',secondaryText:'Review product availability, sample requests, packaging requirements and shipment details with the sales team before committing to a trade.',questions:['Product / specification','Estimated volume','Destination country'],gallery:'Source with clarity'
  },
  travel: {
    label:'Tours & Experiences',eyebrow:'The journey begins here',catalog:'paket',catalogLabel:'Paket wisata',secondary:'destinasi',secondaryLabel:'Destinasi',story:'tentang',storyLabel:'Tentang',contact:'booking',contactLabel:'Rencana trip',request:'Rencanakan perjalanan',inquiry:'Tanya perjalanan',intro:'Rancang perjalanan dengan pilihan aktivitas, durasi, dan informasi paket yang jelas.',detailLabel:'Rencana perjalanan',detailSections:['Rangkaian kegiatan','Termasuk & belum termasuk','Syarat perjalanan'],qualities:['Itinerary yang mudah dibaca','Informasi peserta dan durasi','Permintaan trip yang fleksibel'],
    secondaryTitle:'Cerita dari setiap destinasi',secondaryText:'Temukan inspirasi tempat, suasana perjalanan, dan pilihan aktivitas sebelum merencanakan waktu keberangkatan.',questions:['Paket yang diinginkan','Tanggal keberangkatan','Jumlah peserta'],gallery:'Moments worth traveling for'
  },
  restoran: {
    label:'Food & Dining',eyebrow:'Gather around the table',catalog:'menu',catalogLabel:'Menu',secondary:'galeri',secondaryLabel:'Galeri',story:'cerita',storyLabel:'Cerita',contact:'reservasi',contactLabel:'Reservasi',request:'Request reservasi',inquiry:'Tanya menu',intro:'Jelajahi hidangan, suasana, dan informasi kunjungan sebelum datang.',detailLabel:'Tentang menu',detailSections:['Deskripsi hidangan','Bahan & alergen','Pilihan pemesanan'],qualities:['Menu digital terkini','Informasi lokasi dan layanan','Permintaan tempat yang jelas'],
    secondaryTitle:'Suasana yang mengundang',secondaryText:'Lihat karakter ruang makan, inspirasi menu, dan suasana yang ingin dibangun oleh restoran ini.',questions:['Tanggal kunjungan','Jam kedatangan','Jumlah tamu'],gallery:'At the table'
  },
  fashion: {
    label:'Fashion & Collections',eyebrow:'A new way to wear',catalog:'koleksi',catalogLabel:'Koleksi',secondary:'lookbook',secondaryLabel:'Lookbook',story:'label',storyLabel:'Our label',contact:'kontak',contactLabel:'Kontak',request:'Lihat shopping bag',inquiry:'Tanya ukuran',intro:'Koleksi bergaya dengan detail bahan, pilihan ukuran, dan kisah desain.',detailLabel:'Product details',detailSections:['Material & detail','Size & fit guide','Care instructions'],qualities:['Koleksi terkurasi','Panduan ukuran dan warna','Kisah di balik koleksi'],
    secondaryTitle:'The lookbook',secondaryText:'Temukan cara memadukan koleksi dan memahami bahasa visual brand melalui kurasi editorial.',questions:['Item yang diminati','Ukuran yang dicari','Pertanyaan material'],gallery:'Style notes'
  },
  pendidikan: {
    label:'Education & Learning',eyebrow:'Learn something meaningful',catalog:'program',catalogLabel:'Program',secondary:'pengajar',secondaryLabel:'Pengajar',story:'akademi',storyLabel:'Akademi',contact:'daftar',contactLabel:'Pendaftaran',request:'Konsultasi program',inquiry:'Tanya program',intro:'Jelajahi program belajar, silabus, dan pilihan jadwal sebelum mendaftar.',detailLabel:'Detail program',detailSections:['Materi yang dipelajari','Format dan jadwal','Cara bergabung'],qualities:['Program belajar terstruktur','Informasi pengajar','Alur pendaftaran jelas'],
    secondaryTitle:'Belajar bersama pendamping yang tepat',secondaryText:'Pelajari pendekatan belajar, format kelas, dan cara memilih program berdasarkan kebutuhan peserta.',questions:['Program yang diminati','Tingkat kemampuan','Pilihan waktu kelas'],gallery:'Learning stories'
  }
};
export const brandStories = {
 'teras-rona':'Teras Rona menyatukan objek dekoratif, tekstur alami, dan ide penataan untuk sudut rumah yang lebih personal.',
 'dapur-pagi':'Dapur Pagi menghadirkan inspirasi sajian rumahan bagi pertemuan keluarga, agenda kantor, dan momen kebersamaan.',
 'arunika-florist':'Arunika Florist memberi ruang untuk merayakan perasaan melalui rangkaian bunga dan pesan yang personal.',
 'roti-pagi':'Roti Pagi berangkat dari ide sederhana: roti hangat, bahan yang mudah dikenali, dan ritual pagi yang menyenangkan.',
 'karya-anyam':'Karya Anyam mempertemukan kerajinan serat alami dengan kebutuhan rumah modern yang menghargai detail.',
 'saji-lokal':'Saji Lokal menempatkan cita rasa Indonesia dan cerita bahan lokal dalam satu etalase yang mudah dijelajahi.',
 'eco-wash-studio':'Eco Wash Studio menyajikan pilihan perawatan pakaian dan kain dengan informasi layanan yang ringkas dan jelas.',
 'aluna-pet-care':'Aluna Pet Care berfokus pada pengalaman perawatan hewan yang tenang dan komunikasi yang ramah bagi pemilik.',
 'meridian-advisory':'Meridian Advisory mengeksplorasi cara menyusun keputusan dan strategi pertumbuhan bisnis secara terarah.',
 'nusa-konstruksi':'Nusa Konstruksi menunjukkan bagaimana rencana bangunan diterjemahkan menjadi ruang lingkup, proses, dan hasil kerja.',
 'satu-data-studio':'Satu Data Studio menghubungkan pertanyaan bisnis dengan visualisasi data dan solusi digital yang relevan.',
 'vertex-legal':'Vertex Legal menawarkan pendekatan komunikasi hukum bisnis yang tertata, mudah diakses, dan tidak berlebihan.',
 'karsa-architecture':'Karsa Architecture menelusuri dialog antara fungsi ruang, bentuk bangunan, dan kehidupan penggunanya.',
 'lentera-people':'Lentera People memandang pertumbuhan organisasi sebagai kolaborasi antara talenta dan kebutuhan bisnis.',
 'aksa-logistics':'Aksa Logistics menata informasi perjalanan barang, penyimpanan, dan kebutuhan pengiriman bisnis.',
 'visi-energi':'Visi Energi mengangkat efisiensi dan eksplorasi solusi energi yang dapat direncanakan secara terukur.',
 'kaluna-living':'Kaluna Living memilih objek rumah yang mengutamakan bentuk sederhana dan detail yang terasa dekat.',
 'urban-peak-gear':'Urban Peak Gear merangkum kebutuhan perjalanan dan aktivitas luar ruang dalam pilihan perlengkapan fungsional.',
 'botanika-care':'Botanika Care mengutamakan penyajian komposisi, panduan penggunaan, dan informasi produk skincare yang jelas.',
 'nusa-paper-co':'Nusa Paper Co. merayakan kebiasaan mencatat, menggambar, dan menyusun ide melalui pilihan alat tulis.',
 'gerak-sport':'Gerak Sport menghadirkan pilihan perlengkapan yang menemani rutinitas latihan dan gerak sehari-hari.',
 'lumi-lab-beauty':'Lumi Lab Beauty mengeksplorasi warna, tekstur, dan pilihan kosmetik dengan panduan produk yang transparan.',
 'sound-base':'Sound Base memudahkan perbandingan pilihan perangkat audio lewat informasi kebutuhan dan fitur.',
 'kiddy-nest':'Kiddy Nest menghadirkan pilihan kebutuhan anak dengan perhatian pada informasi usia dan penggunaan.',
 'java-spice-link':'Java Spice Link introduces Indonesian spice varieties through origin, product grades, and trade requirements.',
 'tropic-timber-works':'Tropic Timber Works presents timber components for buyers who need dimensions, material information, and sourcing discussions.',
 'archipelago-coffee-trade':'Archipelago Coffee Trade brings coffee origins, processing profiles, and sourcing conversations together.',
 'nusantara-cocoa':'Nusantara Cocoa creates a clear starting point for cocoa buyers to discuss product grades and applications.',
 'terra-botanicals':'Terra Botanicals introduces botanical ingredients, preparation forms, and supply requirements for B2B buyers.',
 'seaharvest-global':'SeaHarvest Global presents a seafood export catalog focused on product detail and commercial requests.',
 'bamboo-origin':'Bamboo Origin explores functional bamboo products with clear information for international buyers.',
 'loom-indonesia':'Loom Indonesia shares the textures, techniques, and sourcing details of Indonesian textile products.',
 'jelajah-jogja':'Jelajah Jogja mempertemukan jalan-jalan kota, warisan budaya, dan pilihan perjalanan untuk berbagai kebutuhan.',
 'island-escape':'Island Escape menonjolkan pengalaman pulau tropis, kegiatan laut, dan perjalanan santai.',
 'summit-trail':'Summit Trail dirancang bagi wisatawan yang mencari pengalaman alam dengan informasi persiapan yang jelas.',
 'city-roam':'City Roam membawa pengalaman menjelajah kota melalui rute budaya, kuliner, dan sudut-sudut menarik.',
 'bluewater-adventure':'Bluewater Adventure menghadirkan inspirasi perjalanan laut dengan perhatian pada aktivitas dan keselamatan.',
 'heritage-routes':'Heritage Routes menyusun pengalaman wisata budaya dari cerita tempat, jejak sejarah, dan pertemuan lokal.',
 'nomad-horizon':'Nomad Horizon menggabungkan inspirasi liburan dan kebutuhan bekerja fleksibel dari destinasi pilihan.',
 'oren-coffee-house':'Oren Coffee House merayakan waktu singgah, kopi, dan percakapan sehari-hari.',
 'rasa-botanica':'Rasa Botanica mengangkat inspirasi hidangan segar dan suasana makan yang dekat dengan unsur alam.',
 'hearth-bakery':'Hearth Bakery mempertemukan aroma roti panggang dan pilihan pastry untuk setiap momen.',
 'sajian-nusa':'Sajian Nusa mengangkat menu Indonesia dalam suasana yang hangat dan mudah dijelajahi.',
 'pasta-co':'Pasta & Co menghadirkan pilihan pasta dan makanan pendamping untuk santap yang bersahabat.',
 'nami-sushi-bar':'Nami Sushi Bar menyajikan inspirasi menu Jepang dengan pendekatan visual yang rapi.',
 'rooted-brunch':'Rooted Brunch menampilkan pilihan sarapan panjang, kopi, dan waktu berkumpul yang santai.',
 'forma-apparel':'Forma Apparel membangun koleksi essentials yang mudah dipadukan untuk berbagai suasana.',
 'wastra-line':'Wastra Line memandang wastra sebagai bagian dari cerita gaya yang terus berkembang.',
 'mono-atelier':'Mono Atelier mengeksplorasi siluet, struktur, dan gaya minimal yang bertahan lebih dari satu musim.',
 'cendana-studio':'Cendana Studio menggabungkan grafis, pakaian santai, dan cerita keseharian kreatif.',
 'motion-street':'Motion Street merangkum energi streetwear dengan potongan pakaian yang berani.',
 'linen-story':'Linen Story memadukan material alami dan desain ringan untuk gaya sehari-hari.',
 'aurora-objects':'Aurora Objects membingkai aksesori sebagai detail kecil yang mampu membentuk penampilan.',
 'cakrawala-academy':'Cakrawala Academy membantu calon peserta memahami arah belajar dan pilihan pengembangan karier.',
 'code-future-camp':'Code Future Camp mengajak peserta memahami pemrograman melalui latihan dan proyek bertahap.',
 'bahasa-kita':'Bahasa Kita menghadirkan ruang belajar bahasa dengan latihan percakapan dan materi yang mudah diikuti.',
 'grow-montessori':'Grow Montessori mengenalkan pendekatan belajar anak melalui eksplorasi dan aktivitas sesuai tahap perkembangan.',
 'study-lab':'Study Lab menata pembelajaran sains, matematika, dan persiapan ujian dalam program yang dapat dibandingkan.',
 'musik-kecil':'Musik Kecil mempertemukan anak dan pemula dengan latihan alat musik dalam suasana menyenangkan.',
 'kreativa-learning':'Kreativa Learning menjadi ruang eksplorasi menggambar, desain, dan keterampilan kreatif.'
};
export const demoSlug = value => String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const demoItemPath = (demo,item) => '/demo/'+demo.slug+'/'+demoExperiences[demo.category].catalog+'/'+demoSlug(item.name);
export const demoRouteList = demo => {
 const site=demoExperiences[demo.category];
 return ['',site.catalog,site.secondary,site.story,site.contact,...demo.offerings.map(item=>site.catalog+'/'+demoSlug(item.name)),...(demo.category==='fashion'||demo.category==='toko-online'?['checkout']:[])];
};
