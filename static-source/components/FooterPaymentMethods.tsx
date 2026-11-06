import React from 'react';

/**
 * Informational channel logos (not a guarantee that every option is activated).
 * Assets link to the matching Wikimedia Commons brand-mark files and DOKU's
 * published OVO image. Keep the logo artwork intact and identify each brand.
 * Trademarks belong to their respective owners.
 */
const paymentChannels = [
  {label:'BSI', detail:'Bank Syariah Indonesia', file:'Bank_Syariah_Indonesia.svg'},
  {label:'BNI VA', detail:'BNI Virtual Account', file:'Bank_Negara_Indonesia_logo_(2004).svg'},
  {label:'BRIVA', detail:'BRI Virtual Account', file:'BRI_2025.svg'},
  {label:'Alfamart', detail:'Retail payment', file:'Alfamart_logo.svg'},
  {label:'CIMB Niaga', detail:'Bank transfer', file:'CIMB_Niaga_logo.svg'},
  {label:'Maybank', detail:'Bank transfer', file:'Logo_wordmark_Bank_Maybank_Indonesia.png'},
  {label:'Indomaret', detail:'Retail payment', file:'Indomaret.svg'},
  {label:'Danamon', detail:'Bank transfer', file:'Danamon_(2024).svg'},
  {label:'PermataBank', detail:'Bank transfer', file:'Permata_Bank_(2024).svg'},
  {label:'Bank Muamalat', detail:'Bank transfer', file:'Muamalat_Logo.png'},
  {label:'Bank Sinarmas', detail:'Bank transfer', file:'Bank_Sinarmas.png'},
  {label:'Mandiri VA', detail:'Mandiri Virtual Account', file:'Bank_Mandiri_logo_2016.svg'},
  {label:'BCA VA', detail:'BCA Virtual Account', file:'Bank_Central_Asia.svg'},
  {label:'QRIS', detail:'QR payment', file:'Logo_QRIS.svg'},
  {label:'OVO', detail:'E-wallet', src:'https://cdn.prod.website-files.com/674ab654de930b217c6389c1/6768ffe4b3a0965dc1ecc388_ovo.avif'},
  {label:'PayPal', detail:'Online payment', file:'PayPal_logo.svg'}
] as const;

function logoUrl(item:(typeof paymentChannels)[number]) {
  return 'src' in item
    ? item.src
    : 'https://commons.wikimedia.org/wiki/Special:FilePath/'+item.file;
}

export default function FooterPaymentMethods({english=false}:{english?:boolean}) {
  return <section className="footer-payment" aria-labelledby="footer-payment-title">
    <div className="footer-payment-heading">
      <div>
        <small>PAYMENT CHANNELS</small>
        <h3 id="footer-payment-title">{english?'Payment Methods':'Metode Pembayaran'}</h3>
      </div>
      <p>{english
        ? 'Actual payment options are confirmed at checkout.'
        : 'Metode yang aktif mengikuti pilihan yang tersedia saat checkout.'}</p>
    </div>
    <div className="footer-payment-grid" aria-label={english?'Payment channel logos':'Logo kanal pembayaran'}>
      {paymentChannels.map(item=>
        <div className="footer-payment-logo" key={item.label} role="group"
          aria-label={`${item.label} — ${item.detail}`}>
          <img src={logoUrl(item)} alt={item.label}
            loading="lazy" decoding="async" referrerPolicy="no-referrer"
            onError={(event)=>event.currentTarget.parentElement?.classList.add('payment-image-unavailable')}/>
          <span className="footer-payment-name">{item.label}</span>
        </div>
      )}
    </div>
    <p className="footer-payment-credit">{english?'Logos belong to their respective owners.':'Logo merupakan merek milik masing-masing pemilik.'} <a href="https://commons.wikimedia.org/wiki/File:Muamalat_Logo.png" target="_blank" rel="noopener noreferrer">Muamalat / Wikimedia Commons (CC BY-SA 4.0)</a>.</p>
  </section>;
}
