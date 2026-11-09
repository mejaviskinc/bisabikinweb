import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const load=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const footer=load('../static-source/components/FooterPaymentMethods.tsx');
const studio=load('../static-source/features/Studio.tsx');
const ecommerce=load('../static-source/features/EcommerceShowcase.tsx');
const tokens=load('../static-source/design-system/tokens.css');
const primitives=load('../static-source/components/ui/UiPrimitives.tsx');

test('payment title, provider list and logos are preserved',()=>{
 assert.match(footer,/Metode Pembayaran/);
 assert.match(footer,/bbw-doku-title/);
 assert.match(footer,/bbw-payment-tile/);
 assert.match(footer,/id:"bca",name:"BCA"/);
 assert.match(footer,/id:"qris",name:"QRIS"/);
 assert.match(footer,/<img\s+key=/);
 assert.match(footer,/loading="lazy"/);
 assert.match(studio,/<FooterPaymentMethods\s*\/>/);
});

test('ecommerce keeps authentic Mejavi component and interactive preview toggle',()=>{
 assert.match(ecommerce,/MEJAVI_SITE='https:\/\/mejaviskincare\.co\.id\/'/);
 assert.match(ecommerce,/PortfolioVisual key=\{mode\}/);
 assert.match(ecommerce,/aria-pressed=\{mode==='mobile'\}/);
 assert.match(ecommerce,/aria-pressed=\{mode==='desktop'\}/);
 assert.match(ecommerce,/ec-mejavi-shell/);
});

test('scoped component design tokens retain existing brand colors',()=>{
 assert.match(tokens,/--ds-accent:var\(--accent,#c3f85c\)/);
 assert.match(tokens,/--ds-bg:var\(--bg,#080a09\)/);
 assert.match(primitives,/UiSection/);
 assert.match(primitives,/UiCard/);
 assert.match(primitives,/UiButtonLink/);
});
