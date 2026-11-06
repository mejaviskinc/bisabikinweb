// 600 deterministic visual compositions: 12 hero layouts × 10 editorial layouts × 5 content treatments.
// Site header/footer, colors, fonts, nav, CTAs and accessibility remain inherited from BisaBikinWeb.
// Distinct layout combinations and individual line-art shapes; not 600 unrelated brand identities.
export const HERO_LAYOUTS=12;
export const STORY_LAYOUTS=10;
export const CARD_LAYOUTS=5;
export const SEO_DESIGN_TOTAL=HERO_LAYOUTS*STORY_LAYOUTS*CARD_LAYOUTS;
export function seoPageDesign(page){
 const id=Number(page?.id);
 if(!Number.isInteger(id)||id<1||id>SEO_DESIGN_TOTAL)throw new Error('Unknown SEO page ID '+id);
 const n=id-1;
 const hero=n%HERO_LAYOUTS;
 const story=Math.floor(n/HERO_LAYOUTS)%STORY_LAYOUTS;
 const cards=Math.floor(n/(HERO_LAYOUTS*STORY_LAYOUTS))%CARD_LAYOUTS;
 return {
  hero,story,cards,
  signature:'H'+String(hero+1).padStart(2,'0')+'-S'+String(story+1).padStart(2,'0')+'-C'+String(cards+1).padStart(2,'0'),
  art:{
   axis:24+(n*23)%65,
   x:38+(n*29)%95,
   y:22+(n*17)%53,
   radius:13+(n*7)%19,
   stretch:45+(n*19)%85
  }
 };
}
