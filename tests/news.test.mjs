import test from 'node:test';
import assert from 'node:assert/strict';
import {isNewsArticle,isFreshNewsArticle,getFreshNewsArticles,makeNewsSitemap} from '../static-source/lib/news.mjs';

const now=Date.parse('2026-10-27T12:00:00Z');
const news={id:'contoh-kabar',title:'Kabar ekonomi & bisnis <Indonesia>',category:'Berita: Ekonomi',author_type:'editorial',published_at:'2026-10-27T10:00:00Z'};
test('berita redaksi dan kategori berita diidentifikasi dengan tepat',()=>{
  assert.equal(isNewsArticle(news),true);
  assert.equal(isNewsArticle({...news,category:'Website Bisnis'}),false);
  assert.equal(isNewsArticle({...news,author_type:'seller'}),false);
});
test('hanya berita terbit 48 jam terakhir yang masuk sitemap',()=>{
  assert.equal(isFreshNewsArticle(news,now),true);
  assert.equal(isFreshNewsArticle({...news,published_at:'2026-10-24T10:00:00Z'},now),false);
  assert.equal(isFreshNewsArticle({...news,published_at:'2026-10-28T10:00:00Z'},now),false);
  assert.equal(isFreshNewsArticle({...news,published_at:null},now),false);
});
test('format sitemap news aman dan tidak memuat seller atau artikel edukasi',()=>{
 const xml=makeNewsSitemap([news,{...news,id:'seller',author_type:'seller'},{...news,id:'panduan',category:'SEO'},{...news,id:'lama',published_at:'2026-10-22T10:00:00Z'}],{origin:'https://bisabikinweb.site',now});
 assert.match(xml,/xmlns:news="http:\/\/www.google.com\/schemas\/sitemap-news\/0.9"/);
 assert.match(xml,/<news:language>id<\/news:language>/);
 assert.match(xml,/2026-10-27T10:00:00.000Z/);
 assert.match(xml,/Kabar ekonomi &amp; bisnis &lt;Indonesia&gt;/);
 assert.match(xml,/https:\/\/bisabikinweb.site\/artikel\/contoh-kabar\//);
 assert.doesNotMatch(xml,/seller|panduan|lama/);
});

test('only eligible news articles cause a News Sitemap to be published',()=>{
 const nonNews={id:'seo',title:'Jasa pembuatan website',category:'Bisnis dan Teknologi',published_at:'2026-10-27T10:00:00Z'};
 assert.equal(getFreshNewsArticles([nonNews],now).length,0);
 assert.equal(getFreshNewsArticles([news,nonNews],now).length,1);
 assert.equal(getFreshNewsArticles([{...news,published_at:'2026-10-24T10:00:00Z'}],now).length,0);
});
