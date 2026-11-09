/**
 * Explicit, immutable address-to-demo mapping: template1 .. template60.
 * Never reorder this array when editing the marketing catalog; URLs are permanent identifiers.
 * Existing /demo/{slug}/ URLs continue to work as a fallback.
 */
export const templateSlugOrder=Object.freeze([
  "teras-rona",
  "dapur-pagi",
  "arunika-florist",
  "roti-pagi",
  "karya-anyam",
  "saji-lokal",
  "eco-wash-studio",
  "aluna-pet-care",
  "meridian-advisory",
  "nusa-konstruksi",
  "satu-data-studio",
  "vertex-legal",
  "karsa-architecture",
  "lentera-people",
  "aksa-logistics",
  "visi-energi",
  "kaluna-living",
  "urban-peak-gear",
  "botanika-care",
  "nusa-paper-co",
  "gerak-sport",
  "lumi-lab-beauty",
  "sound-base",
  "kiddy-nest",
  "java-spice-link",
  "tropic-timber-works",
  "archipelago-coffee-trade",
  "nusantara-cocoa",
  "terra-botanicals",
  "seaharvest-global",
  "bamboo-origin",
  "loom-indonesia",
  "jelajah-jogja",
  "island-escape",
  "summit-trail",
  "city-roam",
  "bluewater-adventure",
  "heritage-routes",
  "nomad-horizon",
  "oren-coffee-house",
  "rasa-botanica",
  "hearth-bakery",
  "sajian-nusa",
  "pasta-and-co",
  "nami-sushi-bar",
  "rooted-brunch",
  "forma-apparel",
  "wastra-line",
  "mono-atelier",
  "cendana-studio",
  "motion-street",
  "linen-story",
  "aurora-objects",
  "cakrawala-academy",
  "code-future-camp",
  "bahasa-kita",
  "grow-montessori",
  "study-lab",
  "musik-kecil",
  "kreativa-learning"
]);

const TEMPLATE_HOST_RE=/^template([1-9]|[1-5][0-9]|60)\.bisabikinweb\.site$/i;
const templateBySlug=new Map(templateSlugOrder.map((slug,i)=>[slug,i+1]));

/** Hostname lookup is exact: template0 / template61 / lookalikes must not resolve. */
export function templateDemoForHostname(hostname){
 const match=TEMPLATE_HOST_RE.exec(String(hostname||'').trim().toLowerCase());
 if(!match)return null;
 const number=Number(match[1]);
 return {number,slug:templateSlugOrder[number-1],hostname:'template'+number+'.bisabikinweb.site'};
}
export function templateAddressForSlug(slug){
 const number=templateBySlug.get(slug);
 return number?'https://template'+number+'.bisabikinweb.site/':null;
}
export function publicDemoUrl(slug,{subdomainsReady=false}={}){
 const target=templateAddressForSlug(slug);
 return subdomainsReady&&target?target:'https://bisabikinweb.site/demo/'+encodeURIComponent(slug)+'/';
}
/**
 * Do not switch links to templateN until DNS, HTTPS and Worker have been verified.
 * The hostname router can be rolled out before changing marketing links.
 */
export const TEMPLATE_SUBDOMAINS_READY=false;
