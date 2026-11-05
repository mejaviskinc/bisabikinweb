import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';

const source=await readFile(new URL('../static-source/lib/supabase.ts',import.meta.url),'utf8');
const api=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const session={access_token:'test-token',user:{email:'admin@example.test'}};

test('merch photo is uploaded, saved, reloaded in public catalog, and removable',async()=>{
  const originalFetch=globalThis.fetch;
  const calls=[];
  let stored;
  globalThis.fetch=async(url,options={})=>{
    calls.push({url,options});
    if(url.includes('bbweb_admin_allowlist'))return Response.json([{email:'admin@example.test'}]);
    if(url.includes('/storage/v1/object/'))return Response.json({Key:'uploaded'});
    if(url.includes('bbweb_merchandise')&&options.method==='POST'){
      stored=JSON.parse(options.body);return Response.json([stored]);
    }
    if(url.includes('bbweb_merchandise'))return Response.json([stored]);
    return Response.json([]);
  };
  try{
    const image=await api.adminUploadMerchImage(session,new File(['photo'],'product.png',{type:'image/png'}),'Product / One');
    assert.match(image,/\/public\/bbweb-article-images\/merchandise\/product-one\/.*\.png$/);
    const upload=calls.find(x=>x.url.includes('/storage/v1/object/'));
    assert.equal(upload.options.headers.Authorization,'Bearer test-token');
    assert.equal(upload.options.headers['x-upsert'],'false');
    const [saved]=await api.adminSaveCollection(session,'merchandise',{id:'product-one',name:'One',image_url:image});
    assert.equal(saved.image_url,image);
    const content=await api.loadPublicContent();
    assert.equal(content.products[0].image,image);
    await api.adminSaveCollection(session,'merchandise',{...saved,image_url:''});
    assert.equal(stored.image_url,'');
  }finally{globalThis.fetch=originalFetch}
});

test('invalid, empty and oversized product photos fail before network requests',async()=>{
  const originalFetch=globalThis.fetch;
  globalThis.fetch=()=>{throw new Error('Unexpected network request')};
  try{
    await assert.rejects(api.adminUploadMerchImage(session,new File(['x'],'x.svg',{type:'image/svg+xml'})),/Format gambar/);
    await assert.rejects(api.adminUploadMerchImage(session,new File([],'empty.png',{type:'image/png'})),/kosong/);
    await assert.rejects(api.adminUploadMerchImage(session,new File([new Uint8Array(5*1024*1024+1)],'large.png',{type:'image/png'})),/maksimal 5 MB/);
  }finally{globalThis.fetch=originalFetch}
});

test('storage upload failures surface without saving product data',async()=>{
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async url=>url.includes('bbweb_admin_allowlist')?Response.json([{email:'admin@example.test'}]):Response.json({message:'Storage denied'},{status:403});
  try{await assert.rejects(api.adminUploadMerchImage(session,new File(['x'],'x.png',{type:'image/png'})),/Storage denied/)}finally{globalThis.fetch=originalFetch}
});
