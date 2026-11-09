import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const component=readFileSync(new URL('../static-source/features/EcommerceShowcase.tsx',import.meta.url),'utf8');
const visuals=readFileSync(new URL('../static-source/components/Visuals.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../static-source/features/ecommerce-showcase.css',import.meta.url),'utf8');
const globalStyles=readFileSync(new URL('../static-source/styles.css',import.meta.url),'utf8');
const studio=readFileSync(new URL('../static-source/features/Studio.tsx',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/capture-mejavi-preview.yml',import.meta.url),'utf8');

test('E-commerce reuses authentic Mejavi video preview from portfolio, with desktop/mobile controls',()=>{
 assert.match(component,/import \{PortfolioVisual\} from '\.\.\/components\/Visuals'/);
 assert.match(component,/<PortfolioVisual key=\{mode\} project=\{\{\.\.\.mejaviProject,previewMode:mode\}\}\/>/);
 assert.match(component,/https:\/\/mejaviskincare\.co\.id\//);
 assert.match(component,/VIDEO WEBSITE ASLI/);
 assert.match(component,/mode==='mobile'/);
 assert.match(component,/Buka website asli/);
 assert.doesNotMatch(component,/<iframe\b/i);
 assert.doesNotMatch(component,/STUDIOGOODS|studio-goods\.example|mejaviProducts|ec-mejavi-page/i);
});

test('Portfolio video is silent, looped, inline, automatically played, with original screenshot fallback',()=>{
 assert.match(visuals,/mejavi-home-'\+mejaviMode\+'\.mp4'/);
 assert.match(visuals,/autoPlay muted loop playsInline/);
 assert.match(visuals,/poster=\{mejaviPoster\}/);
 assert.match(visuals,/onError=\{\(\)=>setMejaviVideoFailed\(true\)\}/);
 assert.match(visuals,/mejavi-home-'\+mejaviMode\+'\.png'/);
 assert.match(globalStyles,/\.portfolio-site-preview \.portfolio-live-video/);
 assert.match(styles,/\.ec-mejavi-shot-link/);
 assert.match(studio,/s\.id==='ecommerce'&&<EcommerceShowcase\/>/);
 assert.doesNotMatch(visuals,/mejaviPreview\s*\?\s*<iframe/);
});

test('Capture workflow records the website in MP4 from original public site',()=>{
 assert.match(workflow,/mejaviskincare\.co\.id/);
 assert.match(workflow,/ffmpeg/);
 assert.match(workflow,/Xvfb/);
 assert.match(workflow,/mejavi-home-\$\{format\}\.mp4/);
 assert.match(workflow,/ffprobe/);
});
