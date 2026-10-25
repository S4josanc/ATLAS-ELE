// Validate a proposed batch without changing live data.
// Usage: node audits/validate-new-centres.mjs path/to/batch.json
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const filename=process.argv[2];
if(!filename){console.error('Usage: node audits/validate-new-centres.mjs batch.json');process.exit(2)}
const batch=JSON.parse(readFileSync(filename,'utf8'));
if(!Array.isArray(batch)){console.error('Batch must be a JSON array');process.exit(2)}
const html=readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script\s+src=['"]([^'"]+)['"]/g)].map(m=>m[1].split('?')[0]).filter(p=>p.startsWith('data/')&&!p.includes('master-pack'));
const context={window:{}};vm.createContext(context);
for(const f of scripts)vm.runInContext(readFileSync(f,'utf8'),context,{filename:f,timeout:5000});
const w=context.window;
const raw=[...(w.ATLAS_SPAIN||[]),...(w.ATLAS_CENTRAL||[]),...(w.ATLAS_GLOBAL||[]),...(w.ATLAS_CERVANTES||[]),...(w.ATLAS_ACCREDITED||[]),...(w.ATLAS_UK_MASTER||[]),...(w.ATLAS_UK_MASTER_2||[]),...(w.ATLAS_UK_MASTER_3||[]),...(w.ATLAS_UK_MASTER_4||[]),...(w.ATLAS_UK_MASTER_5||[]),...(w.ATLAS_UK_MASTER_6||[]),...(w.ATLAS_MASTER_EUROPE||[]),...(w.ATLAS_RECOVERY_20261006||[])];
const pilot=JSON.parse(readFileSync('data/pilot-city-points.json','utf8')).institutions||[];
const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const ids=new Set([...raw.map(x=>x[0]),...pilot.map(x=>x.id)]);
const identity=new Set([...raw.map(x=>[x[1],x[3],x[4]]),...pilot.map(x=>[x.name,x.city,x.country])].map(a=>a.map(normalize).join('|')));
const errors=[],seenIds=new Set(),seenIdentity=new Set();
// Fail closed for publication: the seven packed fragments cannot currently be verified.
// Empty batches remain valid for smoke tests, but non-empty additions require a complete baseline.
if(batch.length)errors.push('BASELINE_INCOMPLETE: packed institution data not decoded; new centres cannot be certified against all existing IDs');
for(const [i,x] of batch.entries()){
 const at=i+1;
 if(!x||typeof x!=='object'||Array.isArray(x)){errors.push('row '+at+': expected object');continue}
 const {id,name,type,city,country,lat,lng,web}=x;
 const key=[name,city,country].map(normalize).join('|');
 if(!/^[A-Z][A-Z0-9-]{3,64}$/.test(String(id||'')))errors.push('row '+at+': invalid stable ID format');
 if(!name||!city||!country||!type)errors.push('row '+at+': missing name, type, city or country');
 if(ids.has(id)||seenIds.has(id))errors.push('row '+at+': ID already used: '+id);
 if(identity.has(key)||seenIdentity.has(key))errors.push('row '+at+': possible duplicate institution: '+name+' / '+city+' / '+country);
 if(lat===null||lat===undefined||lng===null||lng===undefined||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))||Math.abs(Number(lat))>90||Math.abs(Number(lng))>180||(Number(lat)===0&&Number(lng)===0))errors.push('row '+at+': invalid coordinates');
 if(web){try{const u=new URL(web);if(!['https:','http:'].includes(u.protocol))throw Error()}catch{errors.push('row '+at+': website must be an absolute http(s) URL')}}
 seenIds.add(id);seenIdentity.add(key);
}
console.log(JSON.stringify({batchRows:batch.length,checkedAgainstUncompressed:raw.length+pilot.length,errors},null,2));
if(errors.length)process.exitCode=1;
