// Read-only candidate preflight. Run: node audits/check-pilot-candidates.mjs
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
const candidates=JSON.parse(readFileSync(process.argv[2]||'audits/pilot-candidates-2026-10-24.json','utf8'));
const html=readFileSync('index.html','utf8');
const files=[...html.matchAll(/<script\s+src=['"]([^'"]+)['"]/g)].map(m=>m[1].split('?')[0]).filter(p=>p.startsWith('data/')&&!p.includes('master-pack'));
const ctx={window:{}};vm.createContext(ctx);
for(const file of files)vm.runInContext(readFileSync(file,'utf8'),ctx,{filename:file,timeout:5000});
const w=ctx.window;
const arrays=[w.ATLAS_SPAIN,w.ATLAS_CENTRAL,w.ATLAS_GLOBAL,w.ATLAS_CERVANTES,w.ATLAS_ACCREDITED,w.ATLAS_UK_MASTER,w.ATLAS_UK_MASTER_2,w.ATLAS_UK_MASTER_3,w.ATLAS_UK_MASTER_4,w.ATLAS_UK_MASTER_5,w.ATLAS_UK_MASTER_6,w.ATLAS_MASTER_EUROPE,w.ATLAS_RECOVERY_20261006].filter(Array.isArray);
const pilot=JSON.parse(readFileSync('data/pilot-city-points.json','utf8')).institutions||[];
const known=[...arrays.flat().map(a=>({id:a[0],name:a[1],city:a[3],country:a[4],web:a[7]||''})),...pilot];
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const result=candidates.map(x=>{
 const sameName=known.filter(y=>norm(y.name)===norm(x.name));
 const sameCity=known.filter(y=>norm(y.city)===norm(x.city)&&norm(y.country)===norm(x.country));
 const sameUrl=known.filter(y=>y.web&&norm(y.web.replace(/^https?:\/\//,'').replace(/\/$/,''))===norm(String(x.web||'').replace(/^https?:\/\//,'').replace(/\/$/,'')));
 return {name:x.name,city:x.city,country:x.country,status:sameName.length||sameUrl.length?'possible_existing':'manual_review',nameMatches:sameName.map(y=>y.id),urlMatches:sameUrl.map(y=>y.id),sameCityRecords:sameCity.length};
});
writeFileSync('audits/pilot-candidate-review.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
