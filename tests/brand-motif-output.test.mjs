import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {websiteDemos} from '../static-source/lib/website-demos.mjs';
const base=['site-dist/index.html','site-dist/en/index.html','site-dist/beli-website/index.html','site-dist/kontak/index.html','site-dist/tentang/index.html'];
const files=[...base,...websiteDemos.map(d=>'site-dist/demo/'+d.slug+'/index.html'),...websiteDemos.map(d=>'site-dist/desain/'+d.slug+'/index.html')];
const motif=/[\u2733\u2731\u2734\u274b\u2735\u273a]|&#(?:x2733|10035);/iu;
for(const file of files){
 const html=readFileSync(file,'utf8');
 assert.doesNotMatch(html,motif,'Asterisk logo must be absent: '+file);
}
console.log('Verified that the asterisk logo is absent from '+files.length+' public HTML pages, including all 60 demos and their sales pages.');
