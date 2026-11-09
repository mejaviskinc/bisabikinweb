import React from 'react';

/** Display supported DOKU Checkout channel categories without claiming merchant activation. */
const categories=[
 {name:'QRIS',description:'Scan melalui aplikasi pembayaran yang mendukung QRIS.'},
 {name:'Virtual Account',description:'Transfer bank, misalnya BCA, BRI, BNI, atau Mandiri.'},
 {name:'E-wallet',description:'OVO, DANA, atau ShopeePay jika tersedia.'},
 {name:'Kartu debit / kredit',description:'Pembayaran kartu yang didukung DOKU dan bank penerbit.'},
 {name:'Gerai ritel',description:'Pembayaran melalui gerai mitra apabila kanal aktif.'}
] as const;

export default function DokuPaymentChannels(){
 return <div className="doku-channel-overview" aria-label="Kategori metode pembayaran DOKU">
  <div className="doku-channel-grid">
   {categories.map(channel=><div key={channel.name} className="doku-channel-card">
    <strong>{channel.name}</strong>
    <small>{channel.description}</small>
   </div>)}
  </div>
  <p className="doku-channel-disclaimer">Metode di atas adalah kategori yang didukung DOKU, bukan jaminan semuanya sudah aktif. Pilihan pembayaran final akan tampil di halaman DOKU Checkout sesuai kanal yang diaktifkan pada akun merchant.</p>
 </div>;
}
