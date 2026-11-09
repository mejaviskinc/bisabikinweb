import React from 'react';
import {CalendarClock, CreditCard, Landmark, QrCode, ShieldCheck, Store, Wallet} from 'lucide-react';

/**
 * The CSS lives next to its rendered markup. The public site is statically
 * prerendered, so shipping markup and layout together prevents a stale CSS
 * asset from turning these payment methods into unstyled six-column text.
 */
const paymentStyles=`
#bbw-doku-methods{box-sizing:border-box;margin-top:44px;padding:36px 0 30px;border-top:1px solid var(--line,#293027);border-bottom:1px solid var(--line,#293027);color:var(--text,#f2f3ee)}
#bbw-doku-methods *{box-sizing:border-box}
#bbw-doku-methods .bbw-doku-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:25px;margin:0 0 23px}
#bbw-doku-methods .bbw-doku-kicker{display:block;margin-bottom:9px;color:var(--accent,#c3f85c);font:10px/1.4 monospace;letter-spacing:1.7px}
#bbw-doku-methods h3{margin:0;color:var(--text,#f2f3ee);font-size:clamp(24px,2.4vw,32px);font-weight:700;letter-spacing:-.045em;line-height:1.2}
#bbw-doku-methods .bbw-doku-intro{margin:0;max-width:365px;color:var(--muted,#99a096);font-size:12px;line-height:1.75}
#bbw-doku-methods .bbw-doku-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;width:100%}
#bbw-doku-methods .bbw-doku-card{display:flex;align-items:center;gap:14px;min-width:0;min-height:95px;padding:17px 18px;border:1px solid var(--line,#293027);border-radius:13px;background:var(--panel,#121713);box-shadow:0 8px 20px rgba(0,0,0,.07),inset 0 1px 0 rgba(255,255,255,.028)}
#bbw-doku-methods .bbw-doku-icon{display:grid;place-items:center;flex:0 0 42px;width:42px;height:42px;border-radius:10px;background:var(--soft,#202a1b);color:var(--accent,#c3f85c);border:1px solid color-mix(in srgb,var(--accent,#c3f85c) 18%,var(--line,#293027))}
#bbw-doku-methods .bbw-doku-copy{display:flex;min-width:0;flex:1;flex-direction:column;justify-content:center;gap:5px}
#bbw-doku-methods .bbw-doku-name{display:block;margin:0;color:var(--text,#f2f3ee);font-size:14px;font-weight:700;line-height:1.35;letter-spacing:-.018em}
#bbw-doku-methods .bbw-doku-detail{display:block;margin:0;color:var(--muted,#99a096);font-size:11px;line-height:1.6;overflow-wrap:break-word}
#bbw-doku-methods .bbw-doku-notice{display:flex;align-items:flex-start;gap:9px;margin:17px 0 0!important;color:var(--muted,#99a096);font-size:11px!important;line-height:1.65!important;max-width:860px}
#bbw-doku-methods .bbw-doku-notice svg{flex:0 0 16px;margin-top:1px;color:var(--accent,#c3f85c)}
@media(min-width:981px){#bbw-doku-methods .bbw-doku-card:hover{border-color:color-mix(in srgb,var(--accent,#c3f85c) 35%,var(--line,#293027))}}
@media(max-width:980px){#bbw-doku-methods .bbw-doku-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:640px){#bbw-doku-methods{margin-top:30px;padding:28px 0 24px}#bbw-doku-methods .bbw-doku-heading{display:block;margin-bottom:18px}#bbw-doku-methods .bbw-doku-intro{max-width:none;margin-top:12px}#bbw-doku-methods .bbw-doku-grid{grid-template-columns:minmax(0,1fr);gap:9px}#bbw-doku-methods .bbw-doku-card{min-height:82px;padding:14px 15px;gap:13px}#bbw-doku-methods .bbw-doku-icon{flex-basis:40px;width:40px;height:40px}}
`;

const methods=[
 {id:'qris',icon:QrCode,idName:'QRIS',enName:'QRIS',idDescription:'Scan dengan aplikasi yang mendukung QRIS.',enDescription:'Scan with a QRIS-compatible payment app.'},
 {id:'bank',icon:Landmark,idName:'Virtual Account',enName:'Virtual Account',idDescription:'Transfer melalui bank yang tersedia.',enDescription:'Pay through an available bank.'},
 {id:'wallet',icon:Wallet,idName:'Dompet Digital',enName:'Digital Wallet',idDescription:'OVO, DANA, ShopeePay, dan mitra lain.',enDescription:'OVO, DANA, ShopeePay and more.'},
 {id:'card',icon:CreditCard,idName:'Kartu Debit / Kredit',enName:'Debit / Credit Card',idDescription:'Pembayaran sesuai dukungan kartu.',enDescription:'Payments subject to card support.'},
 {id:'retail',icon:Store,idName:'Gerai Ritel',enName:'Retail Outlet',idDescription:'Gerai mitra yang tersedia di DOKU.',enDescription:'Participating DOKU retail partners.'},
 {id:'paylater',icon:CalendarClock,idName:'PayLater',enName:'PayLater',idDescription:'Cicilan jika kanal aktif dan memenuhi syarat.',enDescription:'Installments when enabled and eligible.'}
] as const;

export default function FooterPaymentMethods({english=false}:{english?:boolean}){
 return <section id="bbw-doku-methods" aria-labelledby="footer-payment-title">
  <style>{paymentStyles}</style>
  <div className="bbw-doku-heading">
   <div>
    <small className="bbw-doku-kicker">PAYMENT CHANNELS / DOKU</small>
    <h3 id="footer-payment-title">{english?'Pay securely with DOKU':'Metode Pembayaran via DOKU'}</h3>
   </div>
   <p className="bbw-doku-intro">{english
    ? 'Choose your available payment method directly on the official DOKU Checkout page.'
    : 'Pilih metode yang tersedia langsung di halaman resmi DOKU Checkout saat pembayaran.'}</p>
  </div>
  <div className="bbw-doku-grid" aria-label={english?'DOKU payment method categories':'Kategori pembayaran melalui DOKU'}>
   {methods.map(method=>{
    const Icon=method.icon;
    return <div className="bbw-doku-card" key={method.id}>
      <span className="bbw-doku-icon" aria-hidden="true"><Icon size={21} strokeWidth={1.75}/></span>
      <div className="bbw-doku-copy">
       <strong className="bbw-doku-name">{english?method.enName:method.idName}</strong>
       <span className="bbw-doku-detail">{english?method.enDescription:method.idDescription}</span>
      </div>
    </div>;
   })}
  </div>
  <p className="bbw-doku-notice">
   <ShieldCheck size={16} strokeWidth={1.8} aria-hidden="true"/>
   <span>{english
    ? 'Available methods depend on the channels enabled on our DOKU merchant account. Displayed categories are illustrative.'
    : 'Ketersediaan kanal mengikuti akun merchant DOKU. Kategori di atas adalah informasi, bukan jaminan semuanya aktif.'}</span>
  </p>
 </section>;
}
