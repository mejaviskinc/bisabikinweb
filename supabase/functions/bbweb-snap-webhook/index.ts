// SNAP Direct API is retired from the active payment flow by owner request.
// Keep the route fail-closed. Historical database rows are retained for audit.
Deno.serve((_req:Request)=>new Response(JSON.stringify({
 responseCode:'4102500',
 responseMessage:'DOKU SNAP Direct is disabled; use DOKU Checkout.'
}),{status:410,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}));
