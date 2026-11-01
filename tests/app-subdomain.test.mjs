import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

test('app subdomain build isolates admin and seller from public content', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bbweb-subdomain-'));
  const source = join(dir, 'site-dist');
  const target = join(dir, 'app-dist');
  try {
    for (const path of ['admin/payments', 'seller', 'assets', 'brand', 'artikel', 'portfolio']) {
      await mkdir(join(source, path), {recursive: true});
    }
    await writeFile(join(source, 'index.html'), 'MAIN');
    await writeFile(join(source, 'admin/index.html'), 'ADMIN');
    await writeFile(join(source, 'admin/payments/index.html'), 'PAYMENT ADMIN');
    await writeFile(join(source, 'seller/index.html'), 'SELLER');
    await writeFile(join(source, 'assets/client.js'), 'console.log("test")');
    await writeFile(join(source, 'assets/auto-artikel-monitor.js'), 'editorial monitor');
    await writeFile(join(source, 'brand/bisabikinweb-logo.svg'), '<svg/>');
    await writeFile(join(source, 'artikel/index.html'), 'ARTICLES');
    await writeFile(join(source, 'portfolio/index.html'), 'PORTFOLIO');
    await writeFile(join(source, 'CNAME'), 'bisabikinweb.site');

    execFileSync(process.execPath, ['scripts/build-app.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, BBWEB_SITE_DIST: source, BBWEB_APP_DIST: target },
      stdio: 'pipe'
    });

    const portal = await readFile(join(target, 'index.html'), 'utf8');
    assert.match(portal, /href="\/admin\/"/);
    assert.match(portal, /href="\/seller\/"/);
    assert.match(portal, /noindex,nofollow/);
    assert.equal(await readFile(join(target, 'admin/index.html'), 'utf8'), 'ADMIN');
    assert.equal(await readFile(join(target, 'admin/payments/index.html'), 'utf8'), 'PAYMENT ADMIN');
    assert.equal(await readFile(join(target, 'seller/index.html'), 'utf8'), 'SELLER');
    assert.equal(await readFile(join(target, 'assets/client.js'), 'utf8'), 'console.log("test")');
    const topLevel = await readdir(target);
    assert.ok(!topLevel.includes('artikel'));
    assert.ok(!topLevel.includes('portfolio'));
    assert.ok(!(await readdir(join(target, 'assets'))).includes('auto-artikel-monitor.js'));
    assert.ok(!topLevel.includes('CNAME'));
    assert.ok(!topLevel.includes('sitemap.xml'));
    assert.match(await readFile(join(target, '_headers'), 'utf8'), /X-Robots-Tag: noindex, nofollow/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
