// Hand-edited planning scenarios for every covered city or regency.
// They are examples of possible client needs, NOT claims of existing clients,
// unique businesses, commercial prevalence or physical BisaBikinWeb branches.
const typeIndex={b2b:0,shop:1,travel:2,wholesale:3,campaign:4,course:5,portfolio:6,food:7,contractor:8,community:9};
const rows=`Banda Aceh|travel|Operator city tour dapat memisahkan rute sejarah, durasi kunjungan, dan detail penjemputan agar pertanyaan wisatawan tidak bercampur.|rute, pertemuan, fasilitas
Lhokseumawe|wholesale|Pemasok kebutuhan kantor bisa menawarkan katalog perusahaan dengan jumlah minimum pesan dan permintaan harga khusus pembelian rutin.|spesifikasi, MOQ, kontak pengadaan
Langsa|shop|Penjual produk lokal dapat memisahkan paket hadiah dan pembelian satuan sehingga informasi kemasan dan ongkir mudah dibandingkan.|foto varian, kemasan, ongkir
Sabang|travel|Penyedia wisata laut dapat memberi detail kegiatan, alat yang disertakan, serta tata cara konfirmasi kondisi cuaca sebelum pemesanan.|paket, syarat keselamatan, jadwal
Bireuen|wholesale|Usaha makanan olahan bisa menyiapkan katalog pesanan reseller dengan pilihan kemasan serta cara mengajukan permintaan volume.|varian, kemasan, syarat reseller
Medan|b2b|Konsultan perusahaan dapat mengelompokkan layanan audit, pendampingan, dan pelatihan agar calon klien memahami perbedaan lingkupnya.|cakupan, profil, brief klien
Binjai|food|Katering dapat menunjukkan pilihan menu acara dan jumlah pesanan minimum sebelum calon pelanggan meminta penawaran tanggal.|menu, kapasitas aktual, ketentuan
Pematangsiantar|food|Usaha kuliner dapat menyediakan menu per kategori dan panduan pesanan untuk rombongan agar pelanggan tidak harus bertanya harga berulang.|foto menu, harga, pemesanan grup
Tebing Tinggi|wholesale|Distributor perlengkapan usaha bisa memberi formulir penawaran berbeda untuk pembelian grosir dan kebutuhan kantor per unit.|SKU, spesifikasi, batas pesanan
Sibolga|travel|Pengelola perjalanan pesisir dapat menampilkan rute keberangkatan, fasilitas, dan tahapan konfirmasi sebelum menerima uang muka.|rute, armada, konfirmasi
Deli Serdang|contractor|Kontraktor dapat menyusun layanan berdasarkan tipe pekerjaan dan mengumpulkan ukuran lokasi serta kebutuhan proyek dari calon klien.|portofolio berizin, lingkup, formulir
Padang|food|Usaha oleh-oleh dapat memisahkan produk siap santap dan produk kirim luar kota dengan informasi penyimpanan yang benar.|foto produk, daya simpan, pengiriman
Bukittinggi|travel|Pengelola tur kota bisa menyusun pilihan durasi setengah hari atau sehari dengan perincian biaya yang mudah dibaca.|rute, durasi, titik temu
Payakumbuh|shop|Produsen camilan dapat menjelaskan varian, berat bersih, dan paket reseller pada katalog yang mudah diperbarui.|label kemasan, foto, varian
Pariaman|travel|Penyedia kunjungan pantai dapat memberi informasi kegiatan, titik temu, dan kebijakan perubahan jadwal karena kondisi lapangan.|fasilitas, rute, syarat ubah jadwal
Solok|wholesale|Pelaku usaha produk kopi dapat menggunakan halaman setiap varian untuk memperjelas berat, asal bahan, dan permintaan penawaran.|asal produk, lot, ukuran
Pekanbaru|b2b|Perusahaan jasa operasional dapat menyajikan bidang layanan beserta persyaratan awal sehingga permintaan proposal lebih lengkap.|profil, studi kasus berizin, RFQ
Dumai|wholesale|Pemasok kebutuhan usaha bisa memisahkan katalog berdasarkan kategori industri dan memberikan pengajuan harga khusus volume.|spesifikasi, cakupan pengiriman, RFQ
Duri|contractor|Penyedia layanan perawatan fasilitas bisa menjelaskan prosedur kunjungan awal dan dokumen keamanan yang memang dimiliki.|ruang lingkup, prosedur, izin aktual
Siak|travel|Penyedia kunjungan sejarah dapat membuat panduan itinerary dengan waktu kunjungan dan peraturan destinasi tanpa menjanjikan jadwal tetap.|rute, dokumentasi, aturan
Bengkalis|wholesale|Pemasok kebutuhan pelayaran dapat menyusun daftar perlengkapan dan formulir permintaan harga untuk pembeli perusahaan.|SKU, syarat order, kontak
Batam|b2b|Pemasok komponen manufaktur dapat membuat katalog teknis yang mendukung pencarian berdasarkan ukuran dan jenis material.|spesifikasi, PDF teknis, RFQ
Tanjungpinang|travel|Operator perjalanan dapat memisahkan paket pulau dan kota dengan persyaratan keberangkatan yang mudah dibandingkan.|rute, fasilitas, ketentuan
Bintan|travel|Pengelola aktivitas wisata dapat menampilkan paket keluarga dan grup beserta batas usia atau persyaratan yang berlaku.|aktivitas, biaya termasuk, batasan
Karimun|wholesale|Pemasok kebutuhan kapal bisa membuat katalog yang meminta tujuan pengiriman dan waktu yang dibutuhkan sebelum konfirmasi stok.|SKU, tujuan, lead time
Natuna|travel|Operator perjalanan lintas pulau dapat menjelaskan tahapan pemesanan dan komponen transportasi yang membutuhkan konfirmasi.|titik keberangkatan, syarat, jadwal
Jambi|b2b|Usaha penyedia jasa dapat memisahkan layanan untuk perusahaan dan konsumen, lalu menyesuaikan formulir permintaan penawaran.|profil tim, lingkup, kontak
Sungai Penuh|travel|Pemandu kegiatan alam bisa membuat halaman per paket berisi tingkat kesulitan, perlengkapan yang perlu dibawa, dan syarat peserta.|rute, perlengkapan, syarat
Muaro Jambi|travel|Penyedia tur edukasi dapat mengatur pilihan kunjungan kelompok, durasi, serta informasi pendampingan sebelum reservasi.|durasi, fasilitas, kelompok
Bungo|wholesale|Pedagang bahan usaha dapat menyediakan formulir kebutuhan stok berkala agar tim penjualan menerima data sebelum membalas.|produk, satuan, minimum order
Palembang|food|Produsen pempek dapat membagi produk siap makan dan frozen beserta pilihan pengiriman serta panduan penyimpanan.|menu, kemasan, instruksi
Prabumulih|contractor|Penyedia pekerjaan teknis bisa menampilkan kategori pengerjaan dan formulir inspeksi awal untuk membantu menyusun estimasi.|jenis proyek, kebutuhan survei, portofolio
Lubuklinggau|shop|Toko perlengkapan rumah dapat menampilkan katalog berdasarkan ukuran dan fungsi agar pembeli tidak mengirim foto contoh satu per satu.|foto, ukuran, harga
Pagar Alam|travel|Pengelola kunjungan perkebunan atau alam dapat membuat jadwal contoh dengan ketentuan cuaca dan kapasitas sebenarnya.|rute, fasilitas, durasi
Ogan Ilir|shop|Perajin produk rumah tangga dapat memperlihatkan bahan, ukuran, dan pilihan pesanan khusus melalui halaman katalog.|foto detail, material, variasi
Pangkalpinang|food|Produsen oleh-oleh dapat membedakan pesanan retail, hampers, dan pengiriman antarkota dengan kemasan yang tepat.|varian, kemasan, ongkir
Sungailiat|travel|Operator kunjungan pantai dapat menjelaskan pilihan kegiatan dan transportasi sehingga calon tamu tahu bagian yang belum termasuk.|paket, fasilitas, ketentuan
Tanjungpandan|travel|Penyedia perjalanan dapat menampilkan daftar pulau tujuan, detail aktivitas, dan konfirmasi cuaca sebelum transaksi.|rute, fasilitas, titik kumpul
Belitung|travel|Penyedia tur pulau dapat menawarkan halaman paket menurut jumlah peserta dengan perincian transportasi yang transparan.|kapasitas, rute, jadwal
Bengkulu|shop|UMKM makanan dapat menyusun katalog varian dan jenis kemasan agar pelanggan memahami pilihan untuk dikirim.|foto, berat, ketentuan
Curup|wholesale|Produsen kopi skala kecil dapat menjelaskan proses, varian, dan permintaan jumlah pembelian untuk mitra usaha.|jenis produk, kemasan, volume
Kepahiang|wholesale|Pemasok produk pertanian dapat membuat katalog spesifikasi dengan jadwal pasokan yang selalu dikonfirmasi oleh pengelola.|grade, satuan, jadwal
Mukomuko|shop|Pengolah pangan dapat menampilkan jenis produk dan informasi bahan agar pembeli dapat memilih dengan tepat.|komposisi, kemasan, foto
Bandar Lampung|b2b|Perusahaan distribusi dapat memisahkan kategori produk berdasarkan pembeli toko dan pembeli proyek.|kategori, syarat grosir, kontak
Metro|course|Lembaga kursus dapat mengelompokkan program menurut usia atau tingkat dan menampilkan jadwal yang dapat diperbarui.|silabus, jadwal, harga
Pringsewu|shop|Produsen kerajinan dapat menyusun katalog berdasarkan ukuran dan material dengan penjelasan opsi pesanan khusus.|material, foto, ukuran
Kalianda|travel|Operator wisata dapat menyediakan panduan rute, titik temu, serta kebijakan pembatalan sebelum menerima pemesanan.|paket, titik temu, ketentuan
Kotabumi|wholesale|Pemasok kebutuhan usaha bisa memisahkan detail produk dan pengajuan harga grosir agar transaksi tidak membingungkan.|spesifikasi, MOQ, RFQ
Jakarta Pusat|b2b|Penyedia jasa profesional dapat menyusun profil tim dan kategori layanan untuk calon klien perusahaan yang membutuhkan proposal formal.|tim, kompetensi, contoh brief
Jakarta Selatan|portfolio|Studio kreatif bisa menampilkan proyek menurut jenis klien dan menjelaskan kontribusi setiap tim pada studi kasus.|proyek berizin, layanan, hasil
Jakarta Barat|shop|Distributor produk konsumen dapat membuat kategori grosir dan ritel berbeda dengan ketentuan harga serta pemesanan jelas.|katalog, stok, syarat
Jakarta Timur|contractor|Penyedia layanan properti dapat menampilkan contoh lingkup kerja dan formulir peninjauan kebutuhan.|portofolio izin, jenis pekerjaan, kontak
Jakarta Utara|wholesale|Distributor kebutuhan logistik dapat menyediakan katalog per kategori serta formulir untuk tujuan pengiriman dan jumlah barang.|SKU, satuan, tujuan
Kepulauan Seribu|travel|Operator wisata pulau dapat menjelaskan kapal, titik kumpul, biaya tambahan, dan aturan perubahan jadwal terkait kondisi pelayaran.|transportasi, rute, ketentuan
Tangerang|b2b|Pemasok atau pelaku manufaktur dapat mengelompokkan produk menurut kebutuhan pembeli serta memberikan formulir penawaran B2B.|spesifikasi, standar valid, RFQ
Tangerang Selatan|portfolio|Agensi layanan digital dapat membuat galeri studi kasus dengan catatan peran dan pendekatan yang dapat diverifikasi.|proyek berizin, layanan, brief
Serang|contractor|Penyedia jasa bangunan bisa membuat halaman pekerjaan dan checklist permintaan survei untuk klien awal.|layanan, lokasi proyek, bahan
Cilegon|wholesale|Supplier industri dapat menyusun halaman teknis komponen dan melampirkan dokumen yang sah untuk calon pembeli.|SKU, spesifikasi, sertifikasi valid
Pandeglang|travel|Penyedia wisata alam dapat menjelaskan jadwal dan syarat kunjungan agar wisatawan paham keterbatasan layanan.|itinerary, fasilitas, batasan
Lebak|shop|Produsen kriya dapat menampilkan cerita bahan serta katalog varian dan syarat pesanan yang dapat diubah.|foto, material, jumlah
Bandung|shop|Brand pakaian dapat menampilkan koleksi menurut musim dan menyediakan ukuran serta bahan pada tiap produk.|koleksi, size guide, bahan
Bekasi|wholesale|Pemasok kebutuhan produksi dapat membantu pembeli membandingkan spesifikasi dan meminta harga berdasarkan volume.|spec sheet, jumlah, RFQ
Bogor|food|Katering dan usaha makanan dapat memperjelas paket acara, ketentuan minimum pesanan, dan cakupan pengiriman.|menu, harga, jadwal
Depok|course|Lembaga pelatihan dapat menyajikan program, silabus, dan alur pendaftaran yang mudah dipakai dari ponsel.|program, jadwal, formulir
Cimahi|shop|Produsen apparel dapat menjelaskan pilihan desain, ukuran, dan minimum produksi sebelum meminta pesanan custom.|ukuran, desain, MOQ
Cirebon|shop|Penjual kriya dan produk mode dapat membuat katalog dengan detail material dan variasi agar pembeli tidak bergantung pada foto chat.|material, ukuran, varian
Sukabumi|travel|Penyedia wisata alam dapat menyusun rute perjalanan dengan informasi kebutuhan fisik serta hal yang termasuk paket.|rute, perlengkapan, ketentuan
Tasikmalaya|shop|Perajin aksesori dapat memperlihatkan pilihan ukuran, proses pemesanan, dan batasan custom order.|katalog, material, persyaratan
Karawang|wholesale|Supplier kebutuhan pabrik dapat membuat halaman per jenis komponen dengan spesifikasi dan prosedur RFQ.|katalog teknis, dimensi, RFQ
Semarang|b2b|Perusahaan distribusi dapat menyusun cakupan layanan dan proses permintaan harga untuk pembeli perusahaan.|layanan, cakupan valid, kontak
Surakarta (Solo)|shop|Pengusaha batik dapat menampilkan koleksi menurut teknik dan bahan, lalu menjelaskan perawatan dan pemesanan grosir.|koleksi, kain, syarat
Magelang|travel|Pengelola paket kunjungan dapat memisahkan wisata keluarga, edukasi, dan kelompok dengan durasi serta fasilitas berbeda.|paket, durasi, harga
Pekalongan|shop|Pembuat batik dapat membuat katalog motif dan teknik, dilengkapi opsi produksi custom dan persyaratan pemesanan.|motif, teknik, ukuran
Salatiga|course|Penyelenggara pelatihan dapat menampilkan kursus berdasarkan keterampilan dengan program dan jadwal yang dapat diperbarui.|silabus, jadwal, pendaftaran
Tegal|wholesale|Pemasok komponen usaha dapat menampilkan daftar produk berdasarkan bahan dan spesifikasi untuk memudahkan permintaan harga.|SKU, spesifikasi, volume
Purwokerto|food|Produsen kuliner dapat mengelompokkan produk untuk kirim dan ambil langsung dengan penjelasan ketahanan serta jadwal.|produk, kemasan, pengambilan
Cilacap|contractor|Penyedia jasa teknis dapat menjelaskan kategori pekerjaan dan kebutuhan informasi sebelum inspeksi lokasi.|lingkup, dokumen, konsultasi
Kudus|wholesale|Distributor bahan atau perlengkapan usaha dapat menampilkan kategori produk dan minimum order dengan transparan.|satuan, katalog, MOQ
Yogyakarta|travel|Penyedia wisata dapat menyusun halaman paket per durasi dan kegiatan dengan ketentuan yang tidak membingungkan.|itinerary, fasilitas, jadwal
Sleman|course|Penyelenggara kursus dapat menampilkan program sesuai target peserta dan jadwal pendaftaran yang mudah diperbarui.|silabus, lokasi kegiatan, harga
Bantul|shop|Perajin furnitur dapat membuat katalog menurut bahan, ukuran, dan opsi custom agar calon pembeli memberi spesifikasi sejak awal.|dimensi, finishing, waktu produksi
Kulon Progo|travel|Penyedia pengalaman desa dapat menjelaskan aktivitas, titik temu, dan pilihan paket kelompok tanpa menjanjikan fasilitas yang belum ada.|aktivitas, fasilitas, syarat
Gunungkidul|travel|Operator wisata alam dapat menjelaskan tingkat aktivitas, rute, dan kebijakan perubahan cuaca sebelum meminta reservasi.|rute, perlengkapan, ketentuan
Surabaya|wholesale|Distributor B2B dapat menawarkan katalog teknis dengan formulir RFQ terpisah dari pertanyaan pelanggan umum.|spesifikasi, kontak, volume
Malang|course|Kursus kreatif dapat memisahkan kelas pemula dan lanjutan, lengkap dengan materi dan jadwal yang mudah dicari.|kurikulum, jadwal, biaya
Sidoarjo|wholesale|Pelaku usaha produksi dapat menjelaskan spesifikasi, batas pesanan, dan jenis kemasan untuk calon pembeli grosir.|SKU, kemasan, MOQ
Gresik|contractor|Penyedia layanan pemeliharaan dapat menunjukkan kategori pekerjaan dan bukti kompetensi yang benar.|lingkup, prosedur, bukti izin
Kediri|shop|Produsen makanan dapat menyusun katalog berdasarkan kemasan dan jenis pengiriman untuk menjaga ekspektasi pelanggan.|varian, komposisi, cara simpan
Madiun|food|Penyedia katering dapat menampilkan menu paket dan jumlah minimum pesanan untuk kegiatan atau pertemuan.|menu, harga, kapasitas
Jember|wholesale|Produsen produk agro dapat menjelaskan grade, kemasan, dan proses permintaan sampel untuk mitra dagang.|grade, kemasan, syarat
Banyuwangi|travel|Operator tur dapat menyajikan tingkat aktivitas, titik keberangkatan, dan detail yang termasuk paket sebelum reservasi.|rute, transportasi, perlengkapan
Probolinggo|travel|Penyedia paket kunjungan dapat menjelaskan titik jemput, fasilitas, dan perbedaan perjalanan reguler serta privat.|itinerary, waktu, fasilitas
Mojokerto|contractor|Perusahaan jasa teknis bisa menyediakan kategori layanan dan contoh tahapan proyek untuk memudahkan brief calon klien.|layanan, tahapan, syarat
Denpasar|travel|Pengelola kegiatan wisata dapat menawarkan paket berdasarkan minat dengan pembatasan kapasitas dan kebijakan reservasi.|paket, jadwal, pembatalan
Badung|travel|Penyedia penginapan atau kegiatan dapat menjelaskan fasilitas, pilihan paket, dan kebijakan pembatalan secara transparan.|fasilitas, kapasitas, refund
Kuta|travel|Penyedia tur dapat memisahkan layanan privat dan grup agar tamu memahami transportasi dan biaya tambahan.|pilihan paket, jadwal, transportasi
Ubud|portfolio|Studio kreatif atau penyelenggara lokakarya dapat menampilkan karya dan jadwal kelas dengan cara pendaftaran yang jelas.|portofolio, jadwal, formulir
Gianyar|shop|Perajin dapat menampilkan material, ukuran, serta proses custom order pada galeri produk yang mudah dipakai pembeli.|foto detail, ukuran, waktu
Singaraja|travel|Operator tur wilayah utara dapat menyajikan contoh itinerary dan catatan transportasi tanpa menyatakan waktu tempuh pasti.|rute, kegiatan, pertemuan
Tabanan|travel|Penyedia agrowisata dapat menjelaskan aktivitas, kapasitas kunjungan, dan aturan kelompok sebelum konfirmasi.|fasilitas, kegiatan, jadwal
Mataram|shop|Toko produk kerajinan dapat menampilkan pilihan kain dan suvenir dengan informasi bahan, varian, dan harga.|foto, jenis, bahan
Lombok Barat|travel|Pengelola pengalaman wisata bisa menjelaskan perbedaan paket setengah hari dan sehari serta titik keberangkatan.|durasi, aktivitas, ketentuan
Lombok Tengah|travel|Penyedia wisata atau homestay dapat memperjelas fasilitas, jadwal check-in, serta ketentuan pemesanan.|fasilitas, jadwal, pemesanan
Bima|wholesale|Pemasok produk lokal dapat menyusun katalog dengan satuan, pengemasan, dan syarat pembelian untuk mitra usaha.|katalog, satuan, minimum
Sumbawa|travel|Operator kegiatan luar ruang dapat menjelaskan perlengkapan, rute, dan syarat peserta yang perlu dikonfirmasi.|aktivitas, perlengkapan, ketentuan
Kupang|b2b|Penyedia jasa perusahaan dapat memisahkan layanan dan memberi contoh formulir brief sebelum penawaran dikirim.|layanan, kontak, lingkup
Labuan Bajo|travel|Operator perjalanan dapat memisahkan paket kapal dan darat serta menyatakan ketentuan keselamatan dan perubahan cuaca.|rute, fasilitas, kebijakan
Maumere|travel|Penyedia pengalaman perjalanan dapat menyusun paket berdasarkan lama kunjungan dan kebutuhan transportasi peserta.|jadwal, fasilitas, titik temu
Ende|travel|Penyedia wisata dapat menyajikan itinerary dan persyaratan kegiatan dengan keterangan biaya yang termasuk atau belum.|rute, biaya, persyaratan
Atambua|wholesale|Pelaku perdagangan dapat menampilkan katalog produk dan prosedur permintaan penawaran sesuai volume pembelian.|jenis produk, satuan, syarat
Pontianak|food|Usaha kuliner dapat memisahkan menu pesanan harian dan paket acara, termasuk cara pengambilan.|menu, harga, pemesanan
Singkawang|food|Pembuat produk kuliner dapat menampilkan komposisi dan pilihan kemasan, plus ketentuan pengiriman pesanan besar.|produk, label, kapasitas
Ketapang|wholesale|Pemasok bahan usaha dapat menampilkan spesifikasi, jumlah pesanan, dan tujuan pengiriman dalam satu formulir RFQ.|satuan, detail, lokasi
Sintang|community|Organisasi lokal dapat menyajikan program kegiatan dan kanal kontak pengurus, dengan pengarsipan agenda yang jelas.|program, jadwal, kontak
Palangka Raya|b2b|Penyedia jasa regional dapat menjelaskan batas cakupan layanan dan alur proposal tanpa mengarang kantor cabang.|cakupan aktual, layanan, formulir
Sampit|wholesale|Supplier barang usaha dapat menyusun kategori katalog dan menyebut ketersediaan yang harus dikonfirmasi sebelum pembayaran.|SKU, satuan, pengiriman
Pangkalan Bun|travel|Operator wisata alam dapat merinci program kunjungan, persyaratan peserta, dan kebijakan perubahan jadwal.|aktivitas, izin valid, aturan
Kuala Kapuas|wholesale|Penyedia bahan usaha dapat mengumpulkan kebutuhan spesifikasi dan jumlah sebelum memberikan penawaran.|spesifikasi, pesanan, kontak
Banjarmasin|shop|Penjual produk kreatif dapat menyediakan katalog berdasarkan varian dan ukuran dengan pilihan pesanan grosir.|produk, ukuran, syarat
Banjarbaru|b2b|Penyedia layanan kantor dapat menjelaskan skema layanan dan prosedur pengajuan penawaran untuk institusi.|layanan, paket, pengadaan
Martapura|shop|Penjual perhiasan dan produk kriya dapat menyediakan foto detail, spesifikasi material, dan informasi keaslian yang valid.|foto detail, material, dokumen
Batulicin|contractor|Penyedia jasa teknis dapat menjelaskan pekerjaan yang diterima dan alur estimasi berdasarkan informasi awal.|jenis pekerjaan, syarat survei, kontak
Kotabaru|travel|Penyedia aktivitas pesisir dapat menyusun rencana perjalanan dan syarat pembatalan jika jadwal berubah.|rute, fasilitas, jadwal
Samarinda|b2b|Penyedia jasa untuk perusahaan dapat membuat profil layanan dan formulir brief proyek yang memuat kebutuhan sebenarnya.|lingkup, spesifikasi, kontak
Balikpapan|wholesale|Supplier jasa dan barang proyek dapat membuat katalog teknis serta formulir RFQ yang menanyakan lokasi pengiriman.|produk, spesifikasi, RFQ
Bontang|contractor|Penyedia pemeliharaan dapat memisahkan layanan inspeksi dan perbaikan disertai persyaratan yang dapat diverifikasi.|lingkup, bukti kerja, prosedur
Tenggarong|community|Organisasi atau pengelola kegiatan dapat membuat agenda dan arsip program yang dapat diperbarui tanpa coding.|acara, program, kontak
Penajam Paser Utara|contractor|Kontraktor dapat mengelompokkan layanan lapangan dan menyiapkan formulir permintaan survei sebelum estimasi.|cakupan, jenis proyek, lokasi
Tarakan|wholesale|Distributor kebutuhan usaha dapat menyusun katalog dan menjelaskan ketentuan konfirmasi pengiriman antarwilayah.|kategori, spesifikasi, tujuan
Tanjung Selor|b2b|Usaha layanan profesional dapat menampilkan profil kerja dan panduan meminta proposal sesuai jenis pekerjaan.|profil, lingkup, kontak
Nunukan|wholesale|Pelaku perdagangan dapat menyertakan tujuan pengiriman, jumlah, dan kontak pemesan pada formulir penawaran.|jumlah, tujuan, satuan
Malinau|travel|Penyedia perjalanan alam dapat menjelaskan syarat peserta, panduan perlengkapan, dan rute contoh tanpa janji ketersediaan.|rute, perlengkapan, aturan
Manado|travel|Operator wisata laut dapat membagi paket menurut aktivitas dan keahlian peserta, berikut ketentuan keselamatan.|paket, perlengkapan, syarat
Bitung|wholesale|Pemasok produk perikanan dapat memberi kategori produk dan permintaan volume dengan informasi penyimpanan yang tepat.|jenis, kemasan, volume
Tomohon|travel|Penyedia wisata dapat menampilkan kegiatan dan jadwal contoh untuk tamu keluarga atau kelompok kecil.|aktivitas, fasilitas, jadwal
Kotamobagu|food|Usaha kuliner dapat menampilkan paket acara dan menu harian dengan ketentuan pemesanan yang dibedakan.|menu, harga, minimum
Gorontalo|shop|Produsen produk lokal dapat menyiapkan katalog berdasarkan varian dan ukuran serta kanal tanya stok.|foto, ukuran, stok
Limboto|course|Lembaga pelatihan dapat memisahkan program untuk pemula dan lanjutan, lengkap dengan jadwal pendaftaran.|silabus, jadwal, formulir
Tilamuta|wholesale|Pemasok pangan dapat menerangkan kualitas produk dan volume pembelian yang diperlukan dalam permintaan harga.|grade, satuan, kapasitas
Palu|b2b|Penyedia layanan bisnis dapat membuat halaman penawaran per jenis layanan dan menjelaskan kontak tim.|profil, layanan, kontak
Poso|travel|Operator wisata alam dapat membuat itinerary yang menyatakan aktivitas, durasi, dan aturan kunjungan.|rute, kegiatan, ketentuan
Luwuk|wholesale|Supplier barang untuk usaha dapat menampilkan spesifikasi per kategori serta proses permintaan sampel jika tersedia.|katalog, spesifikasi, kontak
Tolitoli|shop|Produsen pangan dapat membedakan jenis kemasan dan ukuran agar pelanggan tahu pilihan yang bisa dipesan.|produk, label, harga
Mamuju|b2b|Penyedia layanan profesional dapat mengarahkan pengunjung ke jenis layanan dan formulir konsultasi yang benar.|profil, layanan, brief
Majene|course|Lembaga kursus bisa memperjelas program, format kelas, dan jadwal pendaftaran sehingga pertanyaan tidak berulang.|silabus, jadwal, syarat
Polewali|shop|Penjual produk lokal dapat menampilkan katalog dengan varian dan ketentuan pengiriman sebelum pembayaran.|produk, foto, pengemasan
Makassar|b2b|Penyedia jasa perusahaan dapat menampilkan studi kasus berizin, bidang layanan, dan cara meminta proposal.|lingkup, bukti kerja, proposal
Parepare|wholesale|Distributor barang dapat memisahkan katalog menurut kebutuhan pembeli grosir dan eceran agar permintaan lebih terarah.|SKU, MOQ, pengiriman
Palopo|food|Usaha kuliner dapat menampilkan menu dan paket acara dengan penjelasan cara memesan terlebih dahulu.|menu, harga, jadwal
Gowa|shop|Penjual produk kreatif dapat menyusun varian dan permintaan custom sehingga calon pembeli menyiapkan detail sebelum bertanya.|katalog, ukuran, foto
Maros|travel|Penyedia aktivitas alam dapat memberi halaman paket dengan rincian rute, perlengkapan, dan syarat peserta.|rute, kegiatan, keselamatan
Bone|wholesale|Produsen produk usaha dapat menampilkan katalog dengan syarat grosir serta cara meminta penawaran khusus volume.|grade, kemasan, jumlah
Bulukumba|travel|Penyedia wisata pesisir dapat merinci titik keberangkatan, pilihan kegiatan, dan aturan perubahan jadwal.|aktivitas, transportasi, syarat
Kendari|b2b|Penyedia jasa bisnis dapat memisahkan paket layanan serta jalur permintaan penawaran untuk institusi.|layanan, profil, kontak
Baubau|travel|Operator kunjungan sejarah dapat menyusun itinerary dan informasi titik pertemuan yang dapat diperiksa calon tamu.|rute, durasi, fasilitas
Kolaka|wholesale|Pemasok peralatan usaha dapat memberi katalog dan prosedur permintaan harga menurut ukuran pesanan.|SKU, satuan, estimasi
Raha|food|Produsen makanan dapat menjelaskan kemasan, daya simpan aktual, dan cara memesan untuk dikirim.|foto, label, pengiriman
Wakatobi|travel|Penyedia aktivitas laut dapat menampilkan tingkat pengalaman yang dibutuhkan dan rincian fasilitas sebelum konfirmasi.|paket, keselamatan, fasilitas
Ambon|travel|Penyedia tur lokal dapat memisahkan pilihan kegiatan dengan rencana rute dan ketentuan transportasi.|paket, titik temu, ketentuan
Tual|wholesale|Penjual produk laut dapat memberi katalog ukuran kemasan dan syarat pengiriman yang sesuai.|produk, ukuran, pengiriman
Masohi|community|Pengelola komunitas dapat membuat agenda kegiatan dan direktori program yang mudah diperbarui.|agenda, penanggung jawab, arsip
Saumlaki|travel|Operator wisata dapat menjelaskan transportasi, aktivitas, serta kebutuhan konfirmasi sebelum berangkat.|rute, perizinan valid, kegiatan
Ternate|travel|Penyedia tur dapat membuat pilihan kunjungan kota dan alam dengan perincian transportasi.|itinerary, paket, biaya
Tidore|shop|Pengrajin dapat menampilkan katalog produk sesuai material dan proses pemesanan khusus.|foto, bahan, ukuran
Sofifi|b2b|Penyedia jasa kantor dapat menawarkan daftar layanan dan formulir pengajuan kebutuhan institusi.|profil, layanan, kontak
Tobelo|travel|Penyedia aktivitas pesisir dapat menampilkan paket dan titik keberangkatan agar tamu tahu informasi sebelum reservasi.|rute, fasilitas, jadwal
Labuha|wholesale|Pemasok produk pangan dapat menampilkan kualitas, varian, dan permintaan volume pembelian.|jenis, ukuran, syarat
Jayapura|b2b|Usaha jasa dapat menyampaikan cakupan operasional yang benar, profil, dan alur permintaan penawaran.|profil, cakupan, kontak
Sentani|travel|Penyedia wisata sekitar danau dapat menjelaskan fasilitas, titik temu, dan syarat peserta yang diperlukan.|kegiatan, rute, persyaratan
Biak|travel|Penyedia perjalanan bahari dapat menyusun halaman paket dengan aturan keselamatan dan kebutuhan konfirmasi cuaca.|aktivitas, perlengkapan, ketentuan
Sarmi|community|Organisasi lokal dapat memublikasikan agenda dan informasi kontak untuk memudahkan koordinasi kegiatan.|kegiatan, penanggung jawab, kontak
Manokwari|b2b|Penyedia jasa regional dapat menunjukkan jenis layanan dan cakupan operasional yang benar dalam profil bisnis.|profil, batas layanan, kontak
Fakfak|wholesale|Produsen pangan dapat menyusun katalog dengan informasi bahan dan permintaan harga berdasarkan volume.|produk, asal valid, kemasan
Kaimana|travel|Penyedia aktivitas alam dapat menyajikan rincian perjalanan dan prosedur konfirmasi sebelum memesan.|rute, fasilitas, syarat
Bintuni|contractor|Penyedia pekerjaan teknis dapat memperjelas layanan dan syarat inspeksi sebelum mengirim estimasi.|lingkup, prosedur, bukti izin
Sorong|b2b|Jasa perjalanan atau transportasi dapat membuat profil layanan, cakupan sebenarnya, serta cara meminta penawaran.|layanan, cakupan, kontak
Aimas|wholesale|Distributor perlengkapan dapat menyediakan katalog dan formulir penawaran berdasarkan kuantitas.|spesifikasi, jumlah, tujuan
Raja Ampat|travel|Operator wisata dapat menjelaskan aktivitas, ketentuan konservasi, biaya termasuk dan belum, serta syarat pemesanan.|rute, perizinan aktual, fasilitas
Teminabuan|community|Pengelola kegiatan dapat membuat arsip program dan halaman kontak yang mudah diakses melalui ponsel.|agenda, kegiatan, kontak
Merauke|wholesale|Produsen agro dapat memberi katalog yang menjelaskan kelas produk dan cara meminta penawaran volume.|spesifikasi, satuan, pemasok
Tanah Merah|b2b|Penyedia jasa dapat menjelaskan bidang pekerjaan dan batas cakupan sebelum klien meminta proposal.|layanan, profil, kebutuhan
Agats|community|Pengelola kegiatan dapat memublikasikan program, dokumentasi berizin, dan kontak untuk informasi lebih lanjut.|agenda, materi, pengelola
Nabire|b2b|Penyedia jasa perusahaan dapat memisahkan lingkup pekerjaan dan memberi alur pengajuan penawaran yang rapi.|cakupan, prosedur, kontak
Timika|contractor|Pemasok jasa proyek dapat memaparkan kategori layanan dan dokumen yang boleh dipublikasikan untuk calon klien.|layanan, spesifikasi, bukti valid
Paniai|community|Organisasi lokal dapat menyiapkan jadwal program serta informasi layanan dalam halaman yang ringan untuk ponsel.|agenda, program, kontak
Wamena|shop|Produsen produk kreatif dapat memanfaatkan katalog ringan dengan foto terkompresi dan permintaan pesanan langsung.|produk, foto ringan, kontak
Oksibil|community|Pengelola komunitas dapat menampilkan program dan informasi penting lewat halaman sederhana yang mudah dipakai.|program, jadwal, kontak
Tiom|community|Pengurus organisasi dapat memublikasikan agenda, informasi layanan, dan kanal kontak dalam tampilan yang ringan.|kegiatan, pengurus, kontak
Elelim|community|Penyelenggara program dapat menyediakan arsip informasi dan cara menghubungi pengelola tanpa formulir panjang.|agenda, program, kontak`;
export const cityEditorial=Object.fromEntries(rows.trim().split('\n').map((line,i)=>{
 const fields=line.split('|');if(fields.length!==4)throw Error('Invalid locality editorial line '+(i+1));
 const [city,type,scenario,assets]=fields;
 if(typeIndex[type]===undefined)throw Error('Unknown locality type '+type);
 return [city,{city,type,topicIndex:typeIndex[type],scenario,assets:assets.split(',').map(x=>x.trim()),reviewed:true}];
}));
