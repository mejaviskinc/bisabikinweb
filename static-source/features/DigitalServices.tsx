import {ArrowUpRight, Smartphone, Wifi, Zap, Gamepad2, Receipt, Plane, Layers} from 'lucide-react';
import './digital-services.css';

const services = [
  {name:'Pulsa', icon:Smartphone, group:'Kebutuhan harian', description:'Isi ulang pulsa untuk komunikasi dan kebutuhan sehari-hari.'},
  {name:'Paket Data', icon:Wifi, group:'Kebutuhan harian', description:'Pilihan paket internet untuk tetap terhubung, bekerja, dan berkarya.'},
  {name:'Token Listrik', icon:Zap, group:'Kebutuhan harian', description:'Isi ulang listrik prabayar untuk rumah dan tempat usaha.'},
  {name:'Voucher Game', icon:Gamepad2, group:'Hiburan', description:'Pilihan voucher dan top up untuk game favorit kamu.'},
  {name:'Bayar Tagihan', icon:Receipt, group:'Kebutuhan harian', description:'Rencana layanan pembayaran tagihan dalam satu tempat.'},
  {name:'Tiket Pesawat & Hotel', icon:Plane, group:'Perjalanan', description:'Rencanakan perjalanan dengan pilihan penerbangan dan penginapan melalui mitra.'},
];

export default function DigitalServices(){
  return <section className="section digital-page">
    <div className="breadcrumbs"><a href="/">Home</a><span>/</span><span>Layanan Digital</span></div>
    <div className="digital-intro">
      <div className="page-intro">
        <span className="eyebrow">BISABIKINWEB / LAYANAN DIGITAL</span>
        <h1>Kebutuhan digital.<br/><em>Satu tempat.</em></h1>
        <p>Dari pulsa sampai rencana perjalanan. Kami sedang menyiapkan layanan untuk menemani aktivitas kamu setiap hari.</p>
        <a className="btn primary" href="#pilihan-layanan">Jelajahi layanan <ArrowUpRight size={18}/></a>
      </div>
      <aside className="digital-status" aria-labelledby="digital-status-title">
        <Layers size={30} aria-hidden="true"/>
        <span className="digital-badge">Segera hadir</span>
        <h2 id="digital-status-title">Sedang kami siapkan.</h2>
        <p>Layanan belum menerima transaksi. Pilihan produk, harga, dan pembayaran akan tersedia setelah layanan diaktifkan.</p>
        <a className="text-link" href="/kontak?estimate=Saya%20ingin%20menanyakan%20layanan%20digital%20BisaBikinWeb">Tanya tim kami <ArrowUpRight size={16}/></a>
      </aside>
    </div>
    <div className="section-heading" id="pilihan-layanan">
      <div><span className="eyebrow">PILIHAN LAYANAN</span><h2>Buat sehari-hari.<br/>Sampai pergi jauh.</h2></div>
      <p>Kenali layanan yang sedang kami persiapkan.</p>
    </div>
    <div className="digital-grid">
      {services.map(({name,icon:Icon,group,description})=><article className="digital-card" key={name}>
        <div className="digital-card-top"><span className="digital-icon"><Icon size={24} aria-hidden="true"/></span><span className="digital-badge">Segera hadir</span></div>
        <small>{group}</small><h3>{name}</h3><p>{description}</p>
        <a className="text-link" href={'/kontak?estimate='+encodeURIComponent('Saya ingin menanyakan rencana layanan '+name+' di BisaBikinWeb.')} aria-label={'Tanya tentang '+name}>Tanya layanan <ArrowUpRight size={16}/></a>
      </article>)}
    </div>
    <div className="digital-note"><span className="eyebrow">ADA YANG INGIN DITANYAKAN?</span><h2>Kita ngobrol dulu.</h2><p>Hubungi tim untuk informasi rencana layanan digital dan kebutuhan bisnis kamu.</p><a className="btn" href="/kontak">Hubungi BisaBikinWeb <ArrowUpRight size={18}/></a></div>
  </section>;
}
