#!/usr/bin/env node
/**
 * Export a design blueprint without modifying production websites, DNS or data.
 *
 * Examples:
 * node scripts/export-industry-blueprints.mjs --industry skincare --name "Mejavi Skin+" --slug mejavi
 * node scripts/export-industry-blueprints.mjs --all > industry-blueprints.json
 */
import {websiteDemos} from '../static-source/lib/website-demos.mjs';
import {INDUSTRY_DESIGN_SYSTEM,buildIndustryBlueprint,validateIndustryBlueprint} from '../static-source/lib/industry-design-system.mjs';
const args=process.argv.slice(2);
const value=(flag)=>{const i=args.indexOf(flag);return i===-1?'':String(args[i+1]||'').trim()};
const all=args.includes('--all');
const help=args.includes('--help')||args.includes('-h');
if(help||(!all&&!args.includes('--industry'))){
 console.log('Usage: node scripts/export-industry-blueprints.mjs --industry <industry> --name <brand> [--slug <slug>]');
 console.log('       node scripts/export-industry-blueprints.mjs --all  (export 60 existing demo plans)');
 console.log('Industries: '+Object.keys(INDUSTRY_DESIGN_SYSTEM).join(', '));
 process.exit(help?0:1);
}
if(all){
 const sites=websiteDemos.map(business=>buildIndustryBlueprint(business,{demo:true}));
 for(const site of sites){const errors=validateIndustryBlueprint(site);if(errors.length)throw new Error(site.slug+': '+errors.join('; '))}
 console.log(JSON.stringify({schema:1,count:sites.length,mode:'demo',sites},null,2));
}else{
 const industry=value('--industry'),name=value('--name'),slug=value('--slug');
 if(!INDUSTRY_DESIGN_SYSTEM[industry])throw new Error('Unknown industry: '+industry);
 if(!name)throw new Error('Provide --name <brand>');
 const blueprint=buildIndustryBlueprint({name,slug:slug||name,industry});
 const errors=validateIndustryBlueprint(blueprint);
 if(errors.length)throw new Error(errors.join('; '));
 console.log(JSON.stringify(blueprint,null,2));
}
