import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const component=readFileSync(new URL('../static-source/features/EcommerceShowcase.tsx',import.meta.url),'utf8');
const visuals=readFileSync(new URL('../static-source/components/Visuals.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../static-source/features/ecommerce-showcase.css',import.meta.url),'utf8');
const studio=readFileSync(new URL('../static-source/features/Studio.tsx',import.meta.url),'utf8');

test('E-commerce showcases the same authentic Mejavi screenshot component as portfolio',()=>{
 assert.match(component,/import \{PortfolioVisual\} from '\.\.\/components\/Visuals'/);
 assert.match(component,/<PortfolioVisual project=\{mejaviProject\}\/>/);
 assert.match(component,/https:\/\/mejaviskincare\.co\.id\//);
 assert.match(component,/SCREENSHOT WEBSITE ASLI/);
 assert.match(component,/Buka website asli/);
 assert.doesNotMatch(component,/<iframe\b/i);
 assert.doesNotMatch(component,/STUDIOGOODS|studio-goods\.example|mejaviProducts|ec-mejavi-page/i);
});

test('Portfolio Mejavi uses verified local screenshots and not cross-origin iframe',()=>{
 assert.match(visuals,/mejavi-home-desktop\.png/);
 assert.match(visuals,/mejaviScreenshotStage/);
 assert.match(visuals,/mejaviPreview\s*\? mejaviScreenshotStage<mejaviScreenshotUrls\.length/);
 assert.doesNotMatch(visuals,/mejaviPreview\s*\?\s*<iframe/);
 assert.match(styles,/\.ec-mejavi-shot-link/);
 assert.match(studio,/s\.id==='ecommerce'&&<EcommerceShowcase\/>/);
});
