import React from 'react';

/**
 * Informational payment-channel display. The actual payment options available to
 * the buyer are determined by the active checkout/payment gateway.
 */
const paymentChannels = [
  {label:'BSI', detail:'Bank Syariah Indonesia', tone:'bsi'},
  {label:'BNI', detail:'Virtual Account', tone:'bni'},
  {label:'BRIVA', detail:'BRI Virtual Account', tone:'briva'},
  {label:'Alfamart', detail:'Retail payment', tone:'alfamart'},
  {label:'CIMB NIAGA', detail:'Bank transfer', tone:'cimb'},
  {label:'Maybank', detail:'Bank transfer', tone:'maybank'},
  {label:'Indomaret', detail:'Retail payment', tone:'indomaret'},
  {label:'Danamon', detail:'Bank transfer', tone:'danamon'},
  {label:'PermataBank', detail:'Bank transfer', tone:'permata'},
  {label:'Bank Muamalat', detail:'Bank transfer', tone:'muamalat'},
  {label:'sinarmas', detail:'Bank transfer', tone:'sinarmas'},
  {label:'mandiri', detail:'Virtual Account', tone:'mandiri'},
  {label:'BCA', detail:'Virtual Account', tone:'bca'},
  {label:'QRIS', detail:'QR payment', tone:'qris'},
  {label:'OVO', detail:'E-wallet', tone:'ovo'},
  {label:'PayPal', detail:'Online payment', tone:'paypal'}
] as const;

export default function FooterPaymentMethods({english=false}:{english?:boolean}) {
  return <section className="footer-payment" aria-labelledby="footer-payment-title">
    <div className="footer-payment-heading">
      <div>
        <small>PAYMENT CHANNELS</small>
        <h3 id="footer-payment-title">{english?'Payment Methods':'Metode Pembayaran'}</h3>
      </div>
      <p>{english
        ? 'Available payment methods are confirmed at checkout.'
        : 'Metode yang aktif mengikuti pilihan yang tersedia saat checkout.'}</p>
    </div>
    <div className="footer-payment-grid" aria-label={english?'Payment channel logos':'Logo kanal pembayaran'}>
      {paymentChannels.map(({label,detail,tone})=>
        <span className={`footer-payment-logo payment-${tone}`} key={tone}
          role="img" aria-label={`${label} — ${detail}`}>
          <strong>{label}</strong><small>{detail}</small>
        </span>
      )}
    </div>
  </section>;
}
