import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const docs=readFileSync(new URL('../static-source/lib/legal-policies.ts',import.meta.url),'utf8');
const studio=readFileSync(new URL('../static-source/features/Studio.tsx',import.meta.url),'utf8');

test('legal routes all have dedicated Indonesian consumer-facing documents',()=>{
  for(const p of ["'/terms'","'/privacy'","'/refund'"]) assert.ok(docs.includes(p),p);
  for(const title of ['Syarat dan Ketentuan','Kebijakan Privasi','Kebijakan Pengembalian Dana dan Pembatalan']) assert.ok(docs.includes(title),title);
  assert.match(studio,/import \{legalDocuments,legalReviewedOn\} from '\.\.\/lib\/legal-policies'/);
  assert.match(studio,/legalDocuments\[path as keyof typeof legalDocuments\]/);
});

test('consumer rights and relevant current Indonesian rules are explained',()=>{
  for(const law of ['UU No. 8 Tahun 1999','UU No. 27 Tahun 2022','PP No. 80 Tahun 2019','Permendag No. 19 Tahun 2026']) assert.ok(docs.includes(law),law);
  assert.match(docs,/2 \(dua\) hari kerja/);
  assert.match(docs,/3 x 24 jam/);
  assert.match(docs,/kontrak/);
  assert.match(docs,/pengembalian/);
});

test('privacy, complaints and refund contact route remain accessible',()=>{
  assert.match(docs,/https:\/\/bisabikinweb\.site\/kontak\//);
  assert.match(docs,/persetujuan/);
  assert.match(docs,/cookie/);
  assert.match(docs,/retensi/);
  assert.match(studio,/\['\/privacy','Kebijakan Privasi'\]/);
  assert.match(studio,/\['\/refund','Pengembalian Dana'\]/);
  assert.match(studio,/aria-labelledby="legal-title"/);
});

test('no absolute no-refund waiver is introduced',()=>{
  assert.doesNotMatch(docs,/semua transaksi bersifat final dan tidak dapat dikembalikan/i);
  assert.doesNotMatch(docs,/no refunds under any circumstances/i);
});
