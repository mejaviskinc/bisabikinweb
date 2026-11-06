import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {keywordPages} from '../static-source/lib/seo-solutions.mjs';
import {seoStories} from '../static-source/lib/seo-story-content.mjs';
assert.equal(seoStories.length,600,'600 individual stories required');
for(const field of ['title','scene','challenge','pivot','signature','result','question'])assert.equal(new Set(seoStories.map(s=>s[field])).size,600,'Duplicate story component: '+field);
const host='https://bisabikinweb.site';
assert.equal(keywordPages.length,600);
assert.equal(new Set(keywordPages.map(page=>page.path)).size,600);
const sitemap=await readFile('site-dist/sitemap.xml','utf8');
assert.ok(sitemap.includes('<loc>'+host+'/solusi/</loc>'),'Hub sitemap');
const index=await readFile('site-dist/solusi/index.html','utf8');
assert.ok(index.includes('600 kebutuhan website.')&&index.includes('Cari panduan website'));
assert.ok(index.includes('href="'+keywordPages[0].path+'/'));
for(const page of keywordPages){
 const file='site-dist'+page.path+'/index.html';
 assert.ok((await stat(file)).size>3500,'Page missing: '+file);
 const html=await readFile(file,'utf8');
 assert.ok(html.includes('name="robots" content="noindex,nofollow"'),'Draft should noindex: '+file);
 assert.ok(html.includes('<title>'+page.keyword[0].toUpperCase()+page.keyword.slice(1)+' | BisaBikinWeb.id</title>'),'Wrong title: '+file);
 assert.ok(html.includes('href="'+page.target+'"'),'Canonical service link missing: '+file);
 assert.ok(html.includes('Checklist sebelum memesan website'),'Helpful planning content missing: '+file);
 const story=seoStories[page.id-1];
 assert.equal(story.id,page.id,'Wrong story for '+file);
 assert.ok(html.includes('skenario ilustratif, bukan pengalaman klien'),'Disclosure missing in '+file);
 assert.ok(html.includes('CIRI KHAS HALAMAN INI'),'Story identity missing in '+file);
 for(const field of ['title','scene','challenge','pivot','signature','result','question'])
  assert.ok(html.includes(story[field]),'Missing unique story '+field+' in '+file);
 assert.ok(html.includes('href="/solusi/"'),'Hub breadcrumb missing: '+file);
 assert.ok(!sitemap.includes('<loc>'+host+page.path+'/</loc>'),'Draft indexed too early: '+file);
}
console.log('600 unique professional consultation pages, indexed hub, draft noindex and links verified.');
