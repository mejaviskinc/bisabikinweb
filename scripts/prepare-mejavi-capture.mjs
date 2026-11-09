// Capture-only helper. Connects to a local Chrome debugging target, not to the website API.
// Hides the site's legitimate loading overlay after its DOM is present, then resumes native video playback.
const endpoint='http://127.0.0.1:9223/json/list';
let target;
for(let attempt=0;attempt<40;attempt++){
 try{
  const response=await fetch(endpoint);
  const pages=await response.json();
  target=pages.find(p=>p.type==='page'&&/mejaviskincare\.co\.id|mejaviskinc\.github\.io/.test(p.url));
  if(target?.webSocketDebuggerUrl)break;
 }catch{}
 await new Promise(resolve=>setTimeout(resolve,500));
}
if(!target?.webSocketDebuggerUrl)throw Error('Chrome did not expose the Mejavi homepage in its remote-debugging pages');
const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{
 const fail=setTimeout(()=>reject(Error('Timed out connecting to local Chrome DevTools')),10000);
 socket.addEventListener('open',()=>{clearTimeout(fail);resolve()}, {once:true});
 socket.addEventListener('error',()=>{clearTimeout(fail);reject(Error('Chrome DevTools connection failed'))},{once:true});
});
const expression=`(()=>{
 const loader=document.getElementById('loader');
 if(loader){loader.classList.add('hide');loader.style.setProperty('display','none','important');}
 for(const el of document.querySelectorAll('.reveal'))el.classList.add('visible');
 const videos=[...document.querySelectorAll('video')];
 for(const video of videos){video.muted=true;video.autoplay=true;video.playsInline=true;video.play().catch(()=>{});}
 window.scrollTo(0,0);
 return {title:document.title,readyState:document.readyState,loaderHidden:!loader||getComputedStyle(loader).display==='none',heroVisible:!!document.querySelector('.hero'),videos:videos.length};
})()`;
const result=await new Promise((resolve,reject)=>{
 const timeout=setTimeout(()=>reject(Error('Site readiness evaluation timed out')),15000);
 const onMessage=e=>{
  try{const payload=JSON.parse(e.data);
   if(payload.id!==1)return;
   clearTimeout(timeout);
   socket.removeEventListener('message',onMessage);
   if(payload.error||payload.result?.exceptionDetails)reject(Error(JSON.stringify(payload.error||payload.result.exceptionDetails)));
   else resolve(payload.result?.result?.value||{});
  }catch(error){clearTimeout(timeout);reject(error)}
 };
 socket.addEventListener('message',onMessage);
 socket.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,returnByValue:true,awaitPromise:true}}));
});
socket.close();
if(!result?.heroVisible||!result?.loaderHidden)throw Error('Homepage hero not visible after loading overlay correction: '+JSON.stringify(result));
console.log('Actual Mejavi page ready to record:',JSON.stringify(result));
