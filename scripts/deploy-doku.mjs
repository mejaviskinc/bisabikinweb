// Run from the repository root. Tokens are read only from the environment.
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
// Never deploy into a guessed project. The operator must verify the destination.
const project=process.env.SUPABASE_PROJECT_REF || '';
const apply=process.argv.includes('--apply');
const allowShared=process.argv.includes('--allow-shared-project');
if(process.argv.some(x=>x.startsWith('--')&&!['--apply','--help','--allow-shared-project'].includes(x)))throw Error('Unknown option');
if(process.argv.includes('--help')){
 console.log('SUPABASE_ACCESS_TOKEN must be set in the environment.\nSUPABASE_PROJECT_REF must be set explicitly to the verified project.\nnode scripts/deploy-doku.mjs          # read-only preflight\nnode scripts/deploy-doku.mjs --apply  # apply runtime patch and deploy backend\nShared projects with gn_* tables require manual review and --allow-shared-project.\nDOKU credentials must be installed separately in Supabase Secrets.');process.exit(0);
}
if(!project)throw Error('SUPABASE_PROJECT_REF is required. Verify the correct production project before running.');
if(!/^[a-z]{20}$/.test(project))throw Error('Invalid Supabase project reference.');
const token=process.env.SUPABASE_ACCESS_TOKEN;
if(!token){console.error('SUPABASE_ACCESS_TOKEN is missing. Set it securely in your environment; do not put it in source code.');process.exit(1)}
async function management(path,body){
 const response=await fetch('https://api.supabase.com/v1/projects/'+project+path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 if(!response.ok)throw Error('Supabase management request failed ('+response.status+'). Check access to project '+project+'.');
 return response.json();
}
// GoO ninks (gn_*) data was observed in the proposed target: fail closed.
const shared=await management('/database/query',{query:"select table_name from information_schema.tables where table_schema='public' and table_name like 'gn_%' limit 10"});
if(shared.length&&!allowShared)throw Error('Shared project contains gn_* tables. Review project ownership and data isolation before deploying. --allow-shared-project requires deliberate approval.');
const columns=await management('/database/query',{query:"select table_name,column_name,data_type from information_schema.columns where table_schema='public' and table_name in ('bbweb_orders','bbweb_merch_payments')"});
const required={bbweb_orders:['id','total','currency','payment_status','status','inventory_state'],bbweb_merch_payments:['id','order_id','provider','merchant_order_id','amount','currency','environment','status','paid_at']};
for(const [table,names] of Object.entries(required))for(const name of names)if(!columns.some(x=>x.table_name===table&&x.column_name===name))throw Error('Missing column '+table+'.'+name+'. No changes applied.');
const provider=columns.find(x=>x.table_name==='bbweb_merch_payments'&&x.column_name==='provider');
if(!['text','character varying'].includes(provider.data_type))throw Error('Provider uses a non-text type. Review DOKU compatibility before deployment.');
const constraints=await management('/database/query',{query:"select pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='public.bbweb_merch_payments'::regclass and contype='c'"});
if(constraints.some(x=>/\bprovider\b/i.test(x.definition)&&!/'doku'/i.test(x.definition)))throw Error('Provider constraint does not explicitly allow doku. Review the constraint; history must not be rewritten.');
const functions=await management('/functions');
const slugs=['bbweb-payment-admin','bbweb-payment-status','bbweb-customer-api','bbweb-merch-checkout'];
for(const slug of slugs)if(!functions.some(x=>x.slug===slug||x.name===slug))throw Error('Missing existing function '+slug+'. Confirm the project before deploying.');
const originals=await management('/database/query',{query:"select proname,pg_get_function_identity_arguments(oid) as args from pg_proc where pronamespace='public'::regnamespace and proname in ('bbweb_reserve_merch_order','bbweb_commit_merch_order')"});
for(const name of ['bbweb_reserve_merch_order','bbweb_commit_merch_order'])if(!originals.some(x=>x.proname===name&&/^p_order_id uuid$/.test(x.args)))throw Error('Unexpected existing RPC signature: '+name+'. Review schema before deploying.');
console.log('Project, payment columns, provider checks and existing function signatures passed preflight.');
if(!apply){console.log('No changes applied. Review existing reserve/commit function behavior and run sandbox acceptance before publishing frontend.');process.exit(0)}
// Discover CLI support before modifying the database.
for(const args of [['--version'],['functions','deploy','--help']]){
 const check=spawnSync('supabase',args,{encoding:'utf8'});
 if(check.status!==0)throw Error('Install Supabase CLI and verify functions deploy support before deployment.');
 if(args.includes('deploy')&&(!check.stdout.includes('--use-api')||!check.stdout.includes('--no-verify-jwt')))throw Error('Supabase CLI lacks required deployment flags.');
}
await management('/database/query',{query:await readFile(new URL('../supabase/patches/doku_payment_runtime.sql',import.meta.url),'utf8')});
const ready=await management('/database/query',{query:"select has_function_privilege('anon','public.bbweb_claim_doku_payment(uuid,text,text)','EXECUTE') as anon_claim,has_function_privilege('authenticated','public.bbweb_apply_doku_payment(uuid,text,numeric,text,text,text)','EXECUTE') as user_apply"});
if(ready[0]?.anon_claim!==false||ready[0]?.user_apply!==false)throw Error('Runtime grants failed verification. No functions deployed.');
// Deploy webhook and readers before enabling new DOKU checkout creation.
for(const slug of ['bbweb-doku-webhook',...slugs]){
 const existing=functions.find(x=>x.slug===slug||x.name===slug);
 const args=['functions','deploy',slug,'--project-ref',project,'--use-api'];
 if(slug==='bbweb-doku-webhook'||existing?.verify_jwt===false)args.push('--no-verify-jwt');
 const result=spawnSync('supabase',args,{stdio:'inherit',env:process.env});
 if(result.status!==0)throw Error('Deployment stopped at '+slug+'. Resume after resolving the error; do not publish the frontend yet.');
}
console.log('Backend deployment completed. Configure DOKU secrets and notification URL, then complete sandbox acceptance before merging frontend changes.');
