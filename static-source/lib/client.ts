export async function api(path:string,data?:any):Promise<any>{if(path==='event')return {ok:true};throw new Error('Fitur ini tersedia melalui tim Bisabikinweb. Hubungi WhatsApp 0882003740969.')}
export function event(_name:string){}
export function whatsapp(number:string,text:string){const digits=number.replace(/\D/g,'');const international=digits.startsWith('0')?'62'+digits.slice(1):digits;return 'https://wa.me/'+international+'?text='+encodeURIComponent(text);}
