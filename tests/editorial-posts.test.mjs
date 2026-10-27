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
