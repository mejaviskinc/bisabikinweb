import React,{useState} from 'react';
import {ShieldCheck} from 'lucide-react';

/** Authentic payment brands: artwork served by DOKU's official site or Commons.
 * These are informational examples, not confirmation of merchant activation.
 */
const paymentStyles=`#bbw-doku-methods{margin-top:42px;padding:34px 0 31px;border-top:1px solid var(--line,#293027);border-bottom:1px solid var(--line,#293027);color:var(--text,#f2f3ee)}
#bbw-doku-methods *{box-sizing:border-box}
#bbw-doku-methods .bbw-doku-head{display:flex;align-items:flex-end;justify-content:space-between;gap:26px;margin:0 0 25px}
#bbw-doku-methods .bbw-doku-eyebrow{display:block;margin-bottom:9px;color:var(--accent,#c3f85c);font:10px/1.4 monospace;letter-spacing:1.55px}
#bbw-doku-methods .bbw-doku-head h3{margin:0;color:var(--text,#f2f3ee);font-size:clamp(24px,2.5vw,34px);font-weight:700;letter-spacing:-.05em;line-height:1.18}
#bbw-doku-methods .bbw-doku-intro{max-width:365px;margin:0;color:var(--muted,#999);font-size:12px;line-height:1.75}
#bbw-doku-methods .bbw-payment-group{margin:0 0 25px}
#bbw-doku-methods .bbw-payment-group:last-of-type{margin-bottom:18px}
#bbw-doku-methods .bbw-payment-group h4{margin:0 0 12px;color:var(--muted,#a5aca2);font-size:11px;font-weight:650;letter-spacing:.055em;text-transform:uppercase}
#bbw-doku-methods .bbw-payment-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}
#bbw-doku-methods .bbw-payment-tile{display:flex;min-width:0;min-height:118px;flex-direction:column;align-items:center;justify-content:center;gap:9px;padding:13px;border:1px solid var(--line,#293027);border-radius:12px;background:rgba(170,180,170,.045);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}
#bbw-doku-methods .bbw-payment-plate{width:100%;height:60px;display:flex;justify-content:center;align-items:center;overflow:hidden;padding:10px 16px;border-radius:8px;background:#fff;border:1px solid rgba(15,23,15,.09)}
#bbw-doku-methods .bbw-payment-plate img{display:block;width:auto;max-width:100%;height:auto;max-height:38px;object-fit:contain;filter:none!important;opacity:1!important}
#bbw-doku-methods .bbw-payment-fallback{display:block;color:#222;font-size:13px;font-weight:700;text-align:center}
#bbw-doku-methods .bbw-payment-name{display:block;max-width:100%;color:var(--text,#f2f3ee);font-size:11px;line-height:1.35;font-weight:600;text-align:center;white-space:normal}
#bbw-doku-methods .bbw-doku-note{display:flex;align-items:flex-start;gap:9px;max-width:830px;margin:18px 0 0!important;color:var(--muted,#999);font-size:11px!important;line-height:1.65!important}
#bbw-doku-methods .bbw-doku-note svg{flex:0 0 16px;margin-top:1px;color:var(--accent,#c3f85c)}
@media(min-width:981px){#bbw-doku-methods .bbw-payment-tile:hover{border-color:color-mix(in srgb,var(--accent,#c3f85c) 36%,var(--line,#293027))}}
@media(max-width:1020px){#bbw-doku-methods .bbw-payment-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:640px){#bbw-doku-methods{margin-top:30px;padding:28px 0 24px}#bbw-doku-methods .bbw-doku-head{display:block;margin-bottom:23px}#bbw-doku-methods .bbw-doku-intro{max-width:100%;margin-top:12px}#bbw-doku-methods .bbw-payment-group{margin-bottom:21px}#bbw-doku-methods .bbw-payment-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}#bbw-doku-methods .bbw-payment-tile{min-height:108px;padding:10px;gap:8px}#bbw-doku-methods .bbw-payment-plate{height:55px;padding:9px}#bbw-doku-methods .bbw-payment-plate img{max-height:33px}}`;
const paymentGroups=[
  {id:"bank",titleId:"Transfer Bank / Virtual Account",titleEn:"Bank Transfer / Virtual Account",methods:[
   {id:"bca",name:"BCA",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/685cf08fec80ea69f98ffc47_BCA.svg","https://commons.wikimedia.org/wiki/Special:FilePath/Bank_Central_Asia.svg"]},
   {id:"bri",name:"BRI",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/685cf08f9a70db9eb895a0c9_BRI.svg","https://commons.wikimedia.org/wiki/Special:FilePath/BRI_2025.svg"]},
   {id:"bni",name:"BNI",logos:["https://commons.wikimedia.org/wiki/Special:FilePath/Bank_Negara_Indonesia_logo_(2004).svg"]},
   {id:"mandiri",name:"Mandiri",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/685cf08f68772b42adf098d6_Mandiri.svg","https://commons.wikimedia.org/wiki/Special:FilePath/Bank_Mandiri_logo_2016.svg"]},
   {id:"permata",name:"PermataBank",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/686238a89ce7caa52f29712f_Permata_Bank_%282024%29.svg","https://commons.wikimedia.org/wiki/Special:FilePath/Permata_Bank_(2024).svg"]},
   {id:"cimb",name:"CIMB Niaga",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/686237bca2e535d57ffd0025_CIMB_Niaga_logo.svg","https://commons.wikimedia.org/wiki/Special:FilePath/CIMB_Niaga_logo.svg"]},
   {id:"danamon",name:"Danamon",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/685cf08f37cd92b5b1c32cdb_Danamon.svg","https://commons.wikimedia.org/wiki/Special:FilePath/Danamon_(2024).svg"]},
   {id:"maybank",name:"Maybank",logos:["https://commons.wikimedia.org/wiki/Special:FilePath/Logo_wordmark_Bank_Maybank_Indonesia.png"]}
  ]},
  {id:"ewallet",titleId:"QRIS & Dompet Digital",titleEn:"QRIS & Digital Wallets",methods:[
   {id:"qris",name:"QRIS",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/6768ffe4b3a0965dc1ecc385_QRIS-logo.webp","https://commons.wikimedia.org/wiki/Special:FilePath/Logo_QRIS.svg"]},
   {id:"ovo",name:"OVO",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/68623c58e1c01aef5100a121_ovo.svg","https://commons.wikimedia.org/wiki/Special:FilePath/Logo_ovo_purple.svg"]},
   {id:"dana",name:"DANA",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/6768ffe4b3a0965dc1ecc393_new-dana.webp","https://commons.wikimedia.org/wiki/Special:FilePath/Logo_Dana_Wiki.svg"]},
   {id:"shopeepay",name:"ShopeePay",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/6862418f4fb6a03bfcc54fb1_shopepayy.svg"]},
   {id:"linkaja",name:"LinkAja",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/68623b263c1cb23c4bc00c71_LinkAja.svg"]}
  ]},
  {id:"other",titleId:"Kartu, Gerai Ritel & PayLater",titleEn:"Cards, Retail & PayLater",methods:[
   {id:"visa",name:"Visa",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/6768ffe4b3a0965dc1ecc38b_visa.webp","https://commons.wikimedia.org/wiki/Special:FilePath/Visa_2021.svg"]},
   {id:"mastercard",name:"Mastercard",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/686231d2575eb6d6404b672d_Mastercard-logo.svg","https://commons.wikimedia.org/wiki/Special:FilePath/Mastercard-logo.svg"]},
   {id:"alfamart",name:"Alfamart",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/676269d10457c811d860a488_alfamart.webp","https://commons.wikimedia.org/wiki/Special:FilePath/Alfamart_logo.svg"]},
   {id:"indomaret",name:"Indomaret",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/686242316e76cc843140874f_Indomaret.svg","https://commons.wikimedia.org/wiki/Special:FilePath/Indomaret.svg"]},
   {id:"akulaku",name:"Akulaku",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/676269d143ac7f2dae749bf6_akulaku.webp"]},
   {id:"indodana",name:"Indodana",logos:["https://cdn.prod.website-files.com/674ab654de930b217c6389c1/6768ffe4b3a0965dc1ecc367_indodana.webp"]}
  ]}
] as const;

function PaymentBrand({method}:{method:(typeof paymentGroups)[number]['methods'][number]}){
 const [index,setIndex]=useState(0);
 return <div className="bbw-payment-tile" aria-label={method.name}>
  <div className="bbw-payment-plate">
   {index<method.logos.length
    ? <img key={method.id+'-'+index} src={method.logos[index]} alt={method.name+' logo'}
       loading="lazy" decoding="async" referrerPolicy="no-referrer"
       onError={()=>setIndex(i=>Math.min(i+1,method.logos.length))}/>
    : <span className="bbw-payment-fallback">{method.name}</span>}
  </div>
  <span className="bbw-payment-name">{method.name}</span>
 </div>;
}

export default function FooterPaymentMethods({english=false}:{english?:boolean}){
 return <section id="bbw-doku-methods" aria-labelledby="footer-payment-title">
  <style>{paymentStyles}</style>
  <header className="bbw-doku-head">
   <div>
    <small className="bbw-doku-eyebrow">PAYMENT CHANNELS / DOKU</small>
    <h3 id="footer-payment-title">{english?'Payment Methods via DOKU':'Metode Pembayaran via DOKU'}</h3>
   </div>
   <p className="bbw-doku-intro">{english
    ? 'Original payment provider logos, arranged by category. Final payment options are provided by DOKU Checkout.'
    : 'Logo resmi penyedia pembayaran, dikelompokkan agar mudah dibaca. Pilihan akhir tersedia saat checkout di DOKU.'}</p>
  </header>
  {paymentGroups.map(group=><div className="bbw-payment-group" key={group.id}>
   <h4>{english?group.titleEn:group.titleId}</h4>
   <div className="bbw-payment-grid">{group.methods.map(method=><PaymentBrand method={method} key={method.id}/>)}</div>
  </div>)}
  <p className="bbw-doku-note"><ShieldCheck size={16} aria-hidden="true"/>
   <span>{english
    ? 'Brand marks are owned by their respective owners. Listed channels are examples only; actual availability follows the merchant account settings in DOKU Checkout.'
    : 'Logo adalah merek milik masing-masing pemilik. Daftar ini bersifat informasi; metode yang aktif mengikuti pengaturan merchant pada DOKU Checkout.'}</span>
  </p>
 </section>;
}
