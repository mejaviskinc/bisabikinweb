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

test('header has only one route-based underline with no permanently highlighted Portfolio',()=>{
  assert.doesNotMatch(css,/reference-main-nav>a\[href="\/portfolio\/"\]:not\(\.active\)::before/);
  assert.doesNotMatch(css,/site-nav-dropdown\[open\]>summary::after/);
  assert.match(css,/reference-main-nav>a\.active::after/);
  assert.match(css,/site-nav-dropdown\.active>summary::after/);
  assert.match(css,/mobile-menu-links>a\[aria-current="page"\]/);
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

test('desktop menu keeps service flyout and directs Media to the newsroom',()=>{
  assert.match(source,/const headerNav:HeaderLink\[\]/);
  assert.match(source,/label:'Layanan'/);
  assert.match(source,/label:'Media',href:'https:\/\/media\.bisabikinweb\.site\/'/);
  assert.doesNotMatch(source,/label:'Media',href:[^\n]*children:/);
  assert.match(source,/site-nav-dropdown-panel/);
  assert.match(source,/site-nav-flyout/);
  assert.match(css,/\.site-nav-submenu:focus-within/);
  assert.match(css,/\.site-header \.reference-main-nav \.site-nav-dropdown-panel/);
});

test('mobile menu exposes the same groups via native disclosure controls',()=>{
  assert.match(source,/className="mobile-menu-group"/);
  assert.match(source,/className="mobile-menu-subgroup"/);
  assert.match(css,/\.mobile-menu \.mobile-menu-group>summary/);
  assert.match(css,/@media \(max-width:900px\)/);
});

test('navigation motion is short, consistent, and accessible',()=>{
  assert.match(css,/@keyframes bbw-nav-dropdown-enter/);
  assert.match(css,/@keyframes bbw-nav-flyout-enter/);
  assert.match(css,/@keyframes bbw-mobile-navigation-enter/);
  assert.match(css,/@keyframes bbw-mobile-accordion-enter/);
  assert.match(css,/site-nav-dropdown\[open\]>.site-nav-dropdown-panel/);
  assert.match(css,/site-nav-submenu\[open\]>.site-nav-flyout/);
  assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css,/animation:none !important/);
  assert.match(css,/transition:none !important/);
  assert.doesNotMatch(css,/reference-main-nav>a\[href="\/portfolio\/"\]:not\(\.active\)::before/);
});
