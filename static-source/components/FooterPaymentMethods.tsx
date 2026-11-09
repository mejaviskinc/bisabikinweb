import React from 'react';
import {CalendarClock, CreditCard, Landmark, QrCode, ShieldCheck, Store, Wallet} from 'lucide-react';

/**
 * Payment categories supported by DOKU. Categories do not imply that every
 * individual merchant channel is activated. DOKU Checkout is the source of
 * truth for available payment choices.
 */
const paymentCategories=[
  {
    id:'qris',
    icon:QrCode,
    nameId:'QRIS',nameEn:'QRIS',
    detailId:'Bayar dengan aplikasi yang mendukung QRIS.',
    detailEn:'Pay with a QRIS-compatible payment app.'
  },
  {
    id:'virtual-account',
    icon:Landmark,
    nameId:'Virtual Account',nameEn:'Virtual Account',
    detailId:'Transfer melalui bank yang tersedia.',
    detailEn:'Transfer through an available bank.'
  },
  {
    id:'e-wallet',
    icon:Wallet,
    nameId:'Dompet Digital',nameEn:'E-Wallet',
    detailId:'OVO, DANA, ShopeePay, dan mitra lainnya.',
    detailEn:'OVO, DANA, ShopeePay and other providers.'
  },
  {
    id:'cards',
    icon:CreditCard,
    nameId:'Kartu Debit / Kredit',nameEn:'Debit / Credit Cards',
    detailId:'Pembayaran kartu sesuai dukungan penerbit.',
    detailEn:'Card payments, subject to issuer support.'
  },
  {
    id:'retail',
    icon:Store,
    nameId:'Gerai Ritel',nameEn:'Retail Outlets',
    detailId:'Alfamart, Indomaret, dan gerai mitra.',
    detailEn:'Alfamart, Indomaret and participating outlets.'
  },
  {
    id:'paylater',
    icon:CalendarClock,
    nameId:'PayLater',nameEn:'PayLater',
    detailId:'Opsi cicilan jika diaktifkan dan memenuhi syarat.',
    detailEn:'Installments if enabled and eligible.'
  }
] as const;

export default function FooterPaymentMethods({english=false}:{english?:boolean}){
 return <section className="footer-payment" aria-labelledby="footer-payment-title">
   <div className="footer-payment-heading">
     <div>
       <small>{english?'PAYMENT METHODS / DOKU':'METODE BAYAR / DOKU'}</small>
       <h3 id="footer-payment-title">{english?'Payment Methods via DOKU':'Metode Pembayaran via DOKU'}</h3>
     </div>
     <p>{english
       ? 'A secure checkout, with payment options provided by DOKU according to the active merchant channels.'
       : 'Pembayaran melalui DOKU Checkout, dengan pilihan sesuai kanal yang aktif pada akun merchant.'}</p>
   </div>
   <div className="footer-payment-grid" aria-label={english?'DOKU payment method categories':'Kategori metode pembayaran DOKU'}>
     {paymentCategories.map(item=>{
       const Icon=item.icon;
       return <div className="footer-payment-channel" key={item.id}>
         <span className="footer-payment-icon" aria-hidden="true"><Icon size={22} strokeWidth={1.75}/></span>
         <div className="footer-payment-copy">
           <strong className="footer-payment-name">{english?item.nameEn:item.nameId}</strong>
           <span className="footer-payment-description">{english?item.detailEn:item.detailId}</span>
         </div>
       </div>
     })}
   </div>
   <p className="footer-payment-note">
     <ShieldCheck size={16} strokeWidth={1.8} aria-hidden="true"/>
     <span>{english
       ? 'Categories are examples, not a guarantee of activation. Your final choices and instructions appear on the official DOKU Checkout page.'
       : 'Kategori di atas bukan jaminan semua kanal aktif. Metode dan instruksi pembayaran final ditampilkan pada halaman resmi DOKU Checkout.'}</span>
   </p>
 </section>;
}
