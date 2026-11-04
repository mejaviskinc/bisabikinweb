import { access, cp, mkdir, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = process.cwd();
const source = resolve(root, process.env.BBWEB_SITE_DIST || 'site-dist');
const target = resolve(root, process.env.BBWEB_APP_DIST || 'app-dist');
const appSource = resolve(root, 'subdomains/app');

if (source === target) throw new Error('Folder sumber dan tujuan tidak boleh sama.');
await access(join(source, 'index.html'));
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

// Site app hanya memuat panel admin/seller dan aset yang dibutuhkan.
// Tidak menyalin artikel, berita, checkout, atau sitemap situs utama.
const entries = [
  'assets', 'brand',
  'admin', 'seller', 'autopost',
  'favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'og.svg'
];
for (const entry of entries) {
  const from = join(source, entry);
  try { await access(from); }
  catch { if (entry === 'admin' || entry === 'seller' || entry === 'assets') throw new Error('Build belum menghasilkan ' + entry); else continue; }
  await cp(from, join(target, entry), { recursive: true });
}
// Monitor artikel adalah konten publik, bukan modul dashboard.
await rm(join(target, 'assets/auto-artikel-monitor.js'), { force: true });
for (const file of ['index.html', '_headers', '_redirects', '404.html']) {
  await cp(join(appSource, file), join(target, file));
}
console.log('Portal subdomain selesai: ' + target);
