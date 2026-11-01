import test from 'node:test';
import assert from 'node:assert/strict';
import {editorialPosts,mergeEditorialPosts} from '../static-source/lib/editorial-posts.mjs';
import {isNewsArticle} from '../static-source/lib/news.mjs';

test('published SEO article has a stable slug, date and substantive content',()=>{
 const post=editorialPosts.find(p=>p.id==='jasa-pembuatan-website-profesional');
 assert.ok(post);
 assert.ok(post.title.includes('Jasa Pembuatan Website'));
 assert.equal(post.category,'Bisnis dan Teknologi');
 assert.ok(post.body.length>=20);
 assert.ok(new Date(post.published_at).getTime()>0);
 assert.equal(isNewsArticle(post),false);
});
test('bundled editorial article survives Supabase payload without duplicate slugs',()=>{
 const remote=[{id:'remote-article',title:'Remote article'}];
 const combined=mergeEditorialPosts(remote);
 assert.ok(combined.some(article=>article.id==='remote-article'));
 assert.equal(combined.filter(article=>article.id==='jasa-pembuatan-website-profesional').length,1);
 const override={id:'jasa-pembuatan-website-profesional',title:'Edit from CMS'};
 const merged=mergeEditorialPosts([override]);
 assert.equal(merged.find(article=>article.id===override.id).title,'Edit from CMS');
 assert.equal(merged.filter(article=>article.id===override.id).length,1);
});


test('all 40 Instagram-referenced news have unique locally-hosted SVG covers',async()=>{
 const {readFile}=await import('node:fs/promises');
 const {fileURLToPath}=await import('node:url');
 const titles=new Set();
 const items=editorialPosts.filter(p=>p.id==='bnpb-delapan-langkah-siaga-musim-hujan-2026'||(p.sort_order>=200&&p.sort_order<240));
 assert.equal(items.length,40);
 for(const post of items){
  assert.equal(isNewsArticle(post),true);
  assert.ok(post.image.startsWith('https://bisabikinweb.site/berita-covers/'));
  assert.ok(post.image.endsWith('/'+post.id+'.svg'));
  assert.equal(post.cover_image_url,post.image);
  assert.ok(!titles.has(post.title)); titles.add(post.title);
  const rel='public-assets/'+new URL(post.image).pathname.replace(/^\\//,'');
  const svg=await readFile(rel,'utf8');
  assert.ok(svg.includes('<svg')&&svg.includes('Ilustrasi editorial'));
  assert.ok(!svg.includes('<script')&&!svg.includes('onload='));
 }
});
