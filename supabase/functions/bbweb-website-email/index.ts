// Transactional email worker for website orders. No browser access or public mail-sending API.
// Required secret: HOSTINGER_MAIL_API_TOKEN (Hostinger Panel scoped to bussines@bisabikinweb.site).
const SENDER='bussines@bisabikinweb.site';
const MAILBOX_ID='AC5774d7c90567091132114c549377';
const SITE='https://bisabikinweb.site';
const esc=(x:unknown)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const cash=(n:unknown)=>n==null?'Menunggu penawaran':new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n));
const clean=(s:unknown)=>String(s??'').trim();
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
function serviceKey(){
 const modern=Deno.env.get('SUPABASE_SECRET_KEYS');
 if(modern){try{const obj=JSON.parse(modern);const item=obj?.default||Object.values(obj||{})[0];if(typeof item==='string'&&item)return item}catch{}}
 return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||Deno.env.get('SUPABASE_SECRET_KEY')||'';
}
async function database(path:string,method='GET',body?:unknown){
 const root=Deno.env.get('SUPABASE_URL')||'',token=serviceKey();
 if(!root||!token)throw Error('SUPABASE_BACKEND_UNAVAILABLE');
 const headers=new Headers({apikey:token,Accept:'application/json'});
 if(!token.startsWith('sb_secret_'))headers.set('Authorization','Bearer '+token);
 if(body!==undefined){headers.set('Content-Type','application/json');headers.set('Prefer',method==='PATCH'?'return=minimal':'return=representation')}
 const r=await fetch(root+'/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error('DATABASE_HTTP_'+r.status);
 return r.status===204?null:r.json().catch(()=>null);
}
function emailContent(item:any,order:any,isSandbox:boolean,paymentDetails:any=null){
 const admin=item.recipient_role==='admin',paid=item.event_type==='payment_paid',quoteReady=item.event_type==='quote_ready';
 const headline=paid?(isSandbox?'Pembayaran uji coba tercatat.':'Pembayaran berhasil dikonfirmasi.'):quoteReady?'Penawaran harga website sudah siap.':'Pesanan website sudah kami terima.';
 const heading=admin?(paid?'Pemberitahuan penjualan website':quoteReady?'Penawaran final website telah diterbitkan':'Pesanan website baru masuk'):headline;
 const intro=admin?'Ada aktivitas pesanan website yang membutuhkan pemantauan tim BisaBikinWeb.':paid
  ?'Pembayaran website telah tercatat pada sistem. Tim kami akan menindaklanjuti konsultasi desain dan kebutuhan domain.':quoteReady
  ?'Penawaran dan harga final siap ditinjau di dashboard pelanggan. Periksa detail paket dan domain, setujui penawaran, lalu lanjutkan pembayaran melalui DOKU. Ini belum merupakan bukti pembayaran.'
  :'Terima kasih sudah memilih BisaBikinWeb. Brief pesananmu tersimpan dan akan diperiksa tim sebelum kami menerbitkan penawaran final.';
 const subject=(isSandbox?'[SANDBOX / UJI COBA] ':'')+'BisaBikinWeb — '+(paid?'Konfirmasi pembayaran':quoteReady?'Penawaran website siap ditinjau':'Konfirmasi pesanan')+' '+clean(order.order_no);
 const lines=[
  ['Nomor pesanan',order.order_no],['Nama klien',order.full_name],['Nama bisnis',order.company],
  ['Email klien',order.email],['WhatsApp',order.phone],['Industri',order.category],
  ['Paket',order.package_slug],['Desain',order.template_slug||'Custom / belum dipilih'],
  ['Domain diinginkan',order.requested_domain||'Belum ditentukan'],
  ...(paid&&paymentDetails?.merchant_order_id?[['Nomor invoice DOKU',paymentDetails.merchant_order_id]]:[]),
  [paid?'Total pembayaran':quoteReady?'Penawaran final':'Harga awal',(paid||quoteReady)?cash(order.quoted_total):cash(order.base_price_snapshot)]
 ];
 const rows=lines.map(([label,value])=>'<tr><td style="padding:11px 16px;border-bottom:1px solid #e6e9df;color:#60675b;font-size:13px;vertical-align:top;width:42%">'+esc(label)+'</td><td style="padding:11px 16px;border-bottom:1px solid #e6e9df;color:#1a1e18;font-size:13px;font-weight:600;vertical-align:top;overflow-wrap:anywhere">'+esc(value)+'</td></tr>').join('');
 const flag=isSandbox?'<div style="padding:12px 16px;background:#fff3db;color:#795000;font-size:12px;border-radius:8px;margin:18px 0">Ini simulasi DOKU sandbox, bukan bukti pembayaran uang sungguhan.</div>':'';
 const html='<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'+
 '<body style="margin:0;padding:0;background:#e9ebe5;font-family:Arial,Helvetica,sans-serif;color:#1a1e18">'+
 '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;padding:28px 12px;background:#e9ebe5"><tr><td align="center">'+
 '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden">'+
 '<tr><td style="background:#080a09;padding:30px 34px 34px;color:#f2f3ee">'+
 '<div style="font-size:21px;font-weight:800;letter-spacing:-0.8px">BisaBikinWeb<span style="color:#c3f85c">↗</span></div>'+
 '<div style="font-size:10px;letter-spacing:2px;color:#a7ae9f;margin-top:7px">BUILD YOUR DIGITAL PRESENCE</div>'+
 '<div style="height:3px;width:54px;background:#c3f85c;margin:28px 0 21px"></div>'+
 '<div style="font-size:11px;color:#c3f85c;letter-spacing:1px;font-weight:700">'+(paid?'PAYMENT CONFIRMATION':quoteReady?'WEBSITE QUOTATION':'WEBSITE ORDER')+'</div>'+
 '<h1 style="font-size:30px;line-height:1.18;margin:10px 0 12px;font-weight:700;color:#f2f3ee">'+esc(heading)+'</h1>'+
 '<p style="font-size:14px;line-height:1.75;color:#b9c0b3;margin:0">'+esc(intro)+'</p></td></tr>'+
 '<tr><td style="padding:26px 26px 18px">'+flag+
 '<div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#596057;margin:0 0 14px">RINGKASAN PESANAN</div>'+
 '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e6e9df;border-radius:10px;border-collapse:separate;border-spacing:0">'+rows+'</table>'+
 '<div style="margin:25px 0 18px"><a href="'+SITE+'/client/dashboard/" style="display:inline-block;background:#c3f85c;color:#18220b;padding:15px 21px;text-decoration:none;font-size:13px;font-weight:700;border-radius:7px">'+(quoteReady?'Tinjau & setujui penawaran':'Lihat detail proyek')+' ↗</a></div>'+ 
 '<p style="font-size:12px;line-height:1.7;color:#666d60">Untuk layanan pelanggan dan konsultasi, balas email ini atau kunjungi website resmi BisaBikinWeb. Kami tidak pernah meminta PIN, OTP, atau kata sandi melalui email.</p>'+
 '</td></tr><tr><td style="background:#f5f5ef;padding:25px 32px;border-top:1px solid #e6e9df">'+
 '<div style="color:#222820;font-size:12px;font-weight:700">PT GHAZALI DIGITAL INDONESIA</div>'+
 '<div style="font-size:11px;line-height:1.8;color:#6a7264;margin-top:5px">BisaBikinWeb — '+esc(SENDER)+'<br>Jl. Jogja–Purworejo KM 5, Cengkawakrejo, Banyuurip, Purworejo, Jawa Tengah 54171<br><a href="'+SITE+'" style="color:#3d6622">'+SITE+'</a></div>'+
 '<p style="margin:12px 0 0;font-size:10px;color:#858b80">Email transaksional terkait pesanan website, bukan pesan promosi massal.</p>'+
 '</td></tr></table></td></tr></table></body></html>';
 const text=[heading,intro,isSandbox?'PERHATIAN: Ini transaksi sandbox / uji coba, bukan pembayaran nyata.':'','',
  ...lines.map(([k,v])=>k+': '+clean(v)), '', 'Lihat detail proyek: '+SITE+'/client/dashboard/',
  'Pengirim: '+SENDER,'PT GHAZALI DIGITAL INDONESIA'].join('\n');
 return {subject,html,text};
}
async function sendMail(to:string,mail:{subject:string,html:string,text:string},apiToken:string){
 const response=await fetch('https://api.mail.hostinger.com/api/v1/mailboxes/'+encodeURIComponent(MAILBOX_ID)+'/send',{
  method:'POST',headers:{Authorization:'Bearer '+apiToken,'Content-Type':'application/json',Accept:'application/json'},
  body:JSON.stringify({to:[to],subject:mail.subject,html:mail.html,text:mail.text,displayName:'BisaBikinWeb'}),
  signal:AbortSignal.timeout(15000)
 });
 if(response.status!==204)throw Error('HOSTINGER_MAIL_HTTP_'+response.status);
}
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 const secret=serviceKey(),authorization=req.headers.get('authorization')||'';
 if(!secret||authorization!=='Bearer '+secret)return reply({error:'Unauthorized'},401);
 const apiToken=Deno.env.get('HOSTINGER_MAIL_API_TOKEN')||'';
 if(!apiToken)return reply({configured:false,message:'HOSTINGER_MAIL_API_TOKEN not set; notifications remain queued.'},503);
 let input:any;try{input=await req.json()}catch{return reply({error:'Invalid JSON'},400)}
 const orderId=clean(input?.order_id);
 if(orderId&&!/^[a-f0-9-]{36}$/i.test(orderId))return reply({error:'Invalid order id'},400);
 let sent=0,failed=0;
 try{
  const claim=await database('rpc/bbweb_claim_website_email_jobs','POST',{p_order_id:orderId||null,p_max:8});
  const jobs=Array.isArray(claim)?claim:[];
  for(const job of jobs){
   try{
    const orders=await database('bbweb_website_orders?select=id,order_no,full_name,email,phone,company,category,package_slug,template_slug,requested_domain,base_price_snapshot,quoted_total,status,payment_status&id=eq.'+encodeURIComponent(job.order_id)+'&limit=1');
    const order=Array.isArray(orders)?orders[0]:null;
    if(!order||job.event_type==='payment_paid'&&order.payment_status!=='paid')throw Error('ORDER_STATUS_NOT_VERIFIED');
    if(job.event_type==='quote_ready'&&(!['proposal','awaiting_payment'].includes(order.status)||!(Number(order.quoted_total)>0)))throw Error('QUOTE_NOT_READY');
    let sandbox=false,paymentDetails:any=null;
    if(job.event_type==='payment_paid'){
     const payments=await database('bbweb_website_payments?select=environment,status,merchant_order_id,paid_at&order_id=eq.'+encodeURIComponent(order.id)+'&limit=1');
     const payment=Array.isArray(payments)?payments[0]:null;
     if(!payment||payment.status!=='paid')throw Error('PAYMENT_NOT_VERIFIED');
     sandbox=payment.environment!=='production';paymentDetails=payment;
    }
    const mail=emailContent(job,order,sandbox,paymentDetails);
    await sendMail(job.recipient_email,mail,apiToken);
    await database('bbweb_website_email_outbox?id=eq.'+encodeURIComponent(job.id)+'&status=eq.sending','PATCH',{status:'sent',sent_at:new Date().toISOString(),last_error:''});
    sent++;
   }catch(error){
    const message=String(error instanceof Error?error.message:error).slice(0,100);
    const delayMs=Math.min(3600000,60000*2**Math.min(Number(job.attempts)||1,6));
    await database('bbweb_website_email_outbox?id=eq.'+encodeURIComponent(job.id)+'&status=eq.sending','PATCH',{
     status:'pending',last_error:message,next_attempt_at:new Date(Date.now()+delayMs).toISOString()
    }).catch(()=>{});
    failed++;console.error('Website email delivery failed',message);
   }
  }
  return reply({ok:true,sent,failed});
 }catch(error){console.error('Website email processing failed',String(error).slice(0,100));return reply({error:'Email service unavailable'},503)}
});
