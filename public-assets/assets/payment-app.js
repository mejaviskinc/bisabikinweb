const SUPABASE_FUNCTIONS='https://iyhwephcrxeqwiemhppw.supabase.co/functions/v1';
const SUPABASE_KEY='sb_publishable_0QZOXv00GKp6ecUi2L-FLA_YvsQrzy3';
const packages={
  starter:{name:'Starter',amount:800000,desc:'Landing page / personal website dengan fondasi profesional.'},
  business:{name:'Business',amount:1500000,desc:'Company profile multi halaman untuk bisnis yang butuh ruang lebih.'},
  commerce:{name:'Commerce',amount:3500000,desc:'Website commerce dengan katalog, cart, checkout, dan pengelolaan pesanan.'}
};
const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
const qs=s=>document.querySelector(s);

async function post(path,data){
  const response=await fetch(`${SUPABASE_FUNCTIONS}/${path}`,{
    method:'POST',
    headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},
    body:JSON.stringify(data)
  });
  const text=await response.text();
  let payload={};
  if(text){try{payload=JSON.parse(text)}catch{payload={error:text}}}
  if(!response.ok){const error=new Error(payload.error||`Request gagal (${response.status})`);error.code=payload.code||'';throw error}
  return payload;
}

function updatePackage(){
  const code=qs('#packageCode').value;
  const item=packages[code]||packages.starter;
  qs('#packageSummary').textContent=`${item.name} — ${item.desc}`;
  qs('#totalAmount').textContent=rupiah(item.amount);
}

function setFormStatus(message,type=''){
  const el=qs('#formStatus');
  el.textContent=message||'';
  el.dataset.type=type;
}

function safeDate(value){
  if(!value)return '—';
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(date);
}

const statusCopy={
  created:['DIBUAT','Transaksi sudah dibuat dan menunggu proses pembayaran.'],
  pending:['MENUNGGU PEMBAYARAN','Pembayaran belum selesai atau masih menunggu konfirmasi provider.'],
  paid:['LUNAS','Pembayaran sudah terverifikasi. Tim Bisabikinweb dapat melanjutkan proses sesuai scope project.'],
  authorized:['TEROTORISASI','Pembayaran sudah diotorisasi dan menunggu penyelesaian transaksi.'],
  failed:['GAGAL','Pembayaran gagal diproses. Silakan hubungi admin jika membutuhkan tautan pembayaran baru.'],
  cancelled:['DIBATALKAN','Transaksi dibatalkan.'],
  expired:['KEDALUWARSA','Batas waktu pembayaran telah habis.'],
  refunded:['REFUND','Pembayaran telah dikembalikan.'],
  partial_refund:['REFUND SEBAGIAN','Sebagian pembayaran telah dikembalikan.']
};

async function loadStatus(orderId,token){
  const button=qs('#refreshStatus');
  button.disabled=true;
  qs('#statusMessage').textContent='Memeriksa status terbaru…';
  try{
    const result=await post('bbweb-payment-status',{order_id:orderId,token});
    const order=result.order;
    const copy=statusCopy[order.status]||[String(order.status||'UNKNOWN').toUpperCase(),'Status transaksi sedang diperbarui.'];
    const badge=qs('#statusBadge');
    badge.textContent=copy[0];
    badge.dataset.status=order.status||'';
    qs('#statusOrder').textContent=order.order_id||'—';
    qs('#statusPackage').textContent=order.package_name||order.package_code||'—';
    qs('#statusAmount').textContent=rupiah(order.amount);
    qs('#statusMethod').textContent=(order.payment_type||'Belum dipilih').replaceAll('_',' ');
    qs('#statusUpdated').textContent=safeDate(order.updated_at);
    qs('#statusMessage').textContent=copy[1];
  }catch(error){
    qs('#statusMessage').textContent=error.message||'Status pembayaran tidak dapat diperiksa.';
  }finally{button.disabled=false}
}

function initStatusMode(params){
  const orderId=params.get('order_id');
  const token=params.get('token');
  if(!orderId||!token)return false;
  qs('#checkoutPanel').hidden=true;
  qs('#statusPanel').hidden=false;
  qs('#statusOrder').textContent=orderId;
  qs('#refreshStatus').addEventListener('click',()=>loadStatus(orderId,token));
  loadStatus(orderId,token);
  return true;
}

function initCheckout(params){
  const requested=params.get('package');
  if(requested&&packages[requested])qs('#packageCode').value=requested;
  updatePackage();
  qs('#packageCode').addEventListener('change',updatePackage);
  qs('#paymentForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    const button=qs('#payButton');
    button.disabled=true;
    setFormStatus('Membuat transaksi aman…');
    const data=Object.fromEntries(new FormData(form));
    try{
      const result=await post('bbweb-payment-create',{
        package_code:data.package_code,
        customer_name:data.customer_name,
        customer_email:data.customer_email,
        customer_phone:data.customer_phone,
        business_name:data.business_name,
        project_note:data.project_note,
        accepted_terms:qs('#acceptedTerms').checked
      });
      setFormStatus('Transaksi dibuat. Mengarahkan ke Midtrans…','success');
      if(!result.redirect_url)throw new Error('Tautan pembayaran tidak tersedia.');
      location.assign(result.redirect_url);
    }catch(error){
      if(error.code==='PAYMENT_NOT_CONFIGURED')setFormStatus('Sistem payment gateway sudah terpasang, tetapi akun merchant Midtrans belum diaktifkan. Hubungi admin Bisabikinweb.','error');
      else setFormStatus(error.message||'Pembayaran belum dapat dibuat. Silakan coba lagi.','error');
      button.disabled=false;
    }
  });
}

const params=new URLSearchParams(location.search);
if(!initStatusMode(params))initCheckout(params);
