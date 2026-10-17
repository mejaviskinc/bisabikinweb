const SUPABASE_FUNCTIONS='https://iyhwephcrxeqwiemhppw.supabase.co/functions/v1';
const SUPABASE_KEY='sb_publishable_0QZOXv00GKp6ecUi2L-FLA_YvsQrzy3';

async function functionPost(path:string,data:any):Promise<any>{
  const response=await fetch(`${SUPABASE_FUNCTIONS}/${path}`,{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_KEY},body:JSON.stringify(data),credentials:'omit',cache:'no-store'});
  const text=await response.text();
  let payload:any={};
  if(text){try{payload=JSON.parse(text)}catch{payload={error:text}}}
  if(!response.ok){const error:any=new Error(payload?.error||`Request gagal (${response.status})`);error.code=payload?.code||'';error.payload=payload;throw error}
  return payload;
}

export async function merchCheckout(data:any){return functionPost('bbweb-merch-checkout',data)}
export async function merchShippingRates(data:any){return functionPost('bbweb-merch-checkout',{...data,action:'shipping_rates'})}
export async function merchOrderStatus(orderNo:string,token:string){return functionPost('bbweb-payment-status',{order_no:orderNo,token})}
export async function api(path:string,data?:any):Promise<any>{if(path==='event')return {ok:true};throw new Error('Fitur ini tersedia melalui tim Bisabikinweb. Hubungi WhatsApp 0882003740969.')}
export function event(_name:string){}
export function whatsapp(number:string,text:string){const digits=number.replace(/\D/g,'');const international=digits.startsWith('0')?'62'+digits.slice(1):digits;return 'https://wa.me/'+international+'?text='+encodeURIComponent(text);}
