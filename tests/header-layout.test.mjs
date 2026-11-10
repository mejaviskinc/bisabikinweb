import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('static-source/features/Studio.tsx');
const css=read('static-source/reference-navigation.css');

test('header keeps logo, desktop navigation, and working action buttons',()=>{
  assert.match(source,/className="reference-main-nav"/);
  assert.match(source,/className="nav-actions"/);
  assert.match(source,/aria-controls="mobile-primary-menu"/);
  assert.match(source,/aria-expanded=\{menu\}/);
  assert.match(source,/className="icon-button theme-toggle"/);
  assert.match(source,/className="icon-button search-toggle"/);
});

test('header follows the current theme and supports an active page indicator',()=>{
  assert.match(css,/var\(--panel\)/);
  assert.match(css,/var\(--text\)/);
  assert.match(css,/var\(--accent\)/);
  assert.match(css,/\.site-header \.reference-main-nav>a\.active::after/);
  assert.doesNotMatch(css,/background:\s*#fff\b/i);
});

test('mobile actions are intentionally compact and all hidden actions remain in menu',()=>{
  assert.match(css,/@media \(max-width:900px\)/);
  assert.match(css,/\.site-header \.nav-actions \.account-toggle/);
  assert.match(css,/\.site-header \.nav-actions \.theme-toggle/);
  assert.match(source,/className="mobile-menu-theme"/);
  assert.match(source,/Akun Saya/);
  assert.match(source,/mobile-menu-cta/);
  assert.match(css,/\.mobile-menu\.has-announcement \{top:106px\}/);
  assert.match(css,/\.site-header\.scrolled~\.mobile-menu \{top:72px\}/);
  assert.match(css,/@media \(max-width:650px\)/);
});
