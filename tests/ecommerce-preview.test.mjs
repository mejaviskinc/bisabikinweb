import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const component=readFileSync(new URL('../static-source/features/EcommerceShowcase.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../static-source/features/ecommerce-showcase.css',import.meta.url),'utf8');
const studio=readFileSync(new URL('../static-source/features/Studio.tsx',import.meta.url),'utf8');

test('E-commerce preview uses official Mejavi assets, not an iframe',()=>{
 assert.match(component,/mejaviskinc\/mejavi-skin\/main\/site\//);
 assert.match(component,/Rawat kulitmu/);
 assert.match(component,/MEJAVI SKIN\+ \/ PREVIEW VISUAL/);
 assert.match(component,/mejaviProducts\.map/);
 assert.doesNotMatch(component,/<iframe\b/i);
 assert.doesNotMatch(component,/STUDIOGOODS|studio-goods\.example/i);
 assert.match(component,/Kunjungi website Mejavi/);
});
test('Responsive Mejavi preview is scoped to the e-commerce page',()=>{
 assert.match(component,/mode==='mobile'/);
 assert.match(styles,/\.ec-mejavi-mobile/);
 assert.match(studio,/s\.id==='ecommerce'&&<EcommerceShowcase\/>/);
});
