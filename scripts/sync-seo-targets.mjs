import {readFile,writeFile} from 'node:fs/promises';
import {industryPages} from '../static-source/lib/industry-pages.mjs';
const file='seo/keyword-targets-600.json';
const data=JSON.parse(await readFile(file,'utf8'));
const modulePath='static-source/lib/seo-solutions.mjs';
const source=await readFile(modulePath,'utf8');
const original=JSON.parse(source.match(/export const keywordPages=(\[[^\n]+\]);/)[1]);
const byId=new Map(original.map(page=>[page.id,page]));
for(const row of data.keywords){
 if(row.intent.includes('price'))row.target_url='/harga/';
 else if(row.cluster==='nasional')row.target_url='/';
 else if(row.cluster==='industri'){
  const page=industryPages.find(item=>row.keyword.includes(item.match));
  if(page)row.target_url=row.intent==='informational'?'/portfolio/'+page.project+'/':page.path+'/';
 }
}
if(data.keywords.length!==600||new Set(data.keywords.map(row=>row.keyword)).size!==600)throw new Error('Expected 600 unique keywords');
await writeFile(file,JSON.stringify(data,null,2)+'\n');
const columns=['id','keyword','cluster','intent','target_url','priority','status'];
const quote=value=>'"'+String(value).replaceAll('"','""')+'"';
await writeFile('seo/keyword-targets-600.csv','id,kata_kunci,cluster,intent,target_url,prioritas,status\n'+data.keywords.map(row=>columns.map(key=>quote(row[key])).join(',')).join('\n')+'\n');
const pages=data.keywords.map(row=>{const existing=byId.get(row.id);if(!existing)throw new Error('Missing legacy path');return {id:row.id,keyword:row.keyword,cluster:row.cluster,intent:row.intent,target:row.target_url,priority:row.priority,path:existing.path}});
await writeFile(modulePath,source.replace(/export const keywordPages=\[[^\n]+\];/,'export const keywordPages='+JSON.stringify(pages)+';'));
const groups=Object.entries(Object.groupBy(data.keywords,row=>row.target_url));
const summary={total:600,destinations:groups.length,groups:groups.map(([target,rows])=>({target,count:rows.length,clusters:[...new Set(rows.map(row=>row.cluster))]}))};
await writeFile('seo/target-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log('Mapped',data.total,'keywords to',groups.length,'primary destinations; legacy brief URLs preserved.');
