// Run from repository root: node audits/audit-verified-source.mjs
// Read-only source audit. Does not certify web uptime or real-world campus locations.
import {readdir,readFile} from 'node:fs/promises';
const dir='data';
const files=(await readdir(dir)).filter(n=>/^spain-verified-.*\.js$/.test(n)).sort();
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const groups={id:new Map(),nameCity:new Map(),addressCity:new Map(),exactURL:new Map(),coordinate:new Map()};
const errors=[],rows=[];
const add=(map,key,item)=>{if(!key)return;const a=map.get(key)||[];a.push(item);map.set(key,a)};
for(const file of files){
 const source=await readFile(dir+'/'+file,'utf8');
 const m=source.match(/\.push\(\.\.\.(\[[\s\S]*\])\);?\s*$/);
 if(!m){errors.push({file,reason:'Unparseable verified batch'});continue}
 let batch;try{batch=JSON.parse(m[1])}catch(e){errors.push({file,reason:'Invalid JSON array: '+e.message});continue}
 for(const a of batch){
  if(!Array.isArray(a)||a.length<12){errors.push({file,reason:'Invalid row schema'});continue}
  const [id,name,type,city,country,lat,lng,web,verified,address,precision,sourceURL]=a;
  const item={file,id,name,city,address,web,lat,lng};rows.push(item);
  if(!id||!name||!city||!address||!sourceURL||verified!==true)errors.push({file,id,reason:'Missing essential field'});
  if(!/\b\d{5}\b/.test(address))errors.push({file,id,reason:'Missing 5-digit postal code'});
  if(!/^https?:\/\/[^/\s]+/i.test(web||''))errors.push({file,id,reason:'Invalid website syntax'});
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<35||lat>45||lng< -10||lng>5)errors.push({file,id,reason:'Coordinates outside broad Spain bounds'});
  add(groups.id,String(id),item);
  add(groups.nameCity,norm(name)+'|'+norm(city)+'|'+norm(country),item);
  add(groups.addressCity,norm(address)+'|'+norm(city),item);
  add(groups.exactURL,String(web||'').toLowerCase().replace(/\/$/,''),item);
  add(groups.coordinate,lat+'|'+lng,item);
 }
}
const duplicates=Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,[...v].filter(([,items])=>items.length>1).map(([key,items])=>({key,items}))]));
const report={files:files.length,sourceRows:rows.length,distinctIDs:groups.id.size,errors,duplicateGroups:Object.fromEntries(Object.entries(duplicates).map(([k,v])=>[k,v.length])),duplicateSamples:Object.fromEntries(Object.entries(duplicates).map(([k,v])=>[k,v.slice(0,10)])),limitations:['No HTTP uptime checks','No independent geocoding','No fuzzy cross-dataset duplicate certification','Not a browser marker count']};
console.log(JSON.stringify(report,null,2));
if(errors.length||duplicates.id.length)process.exitCode=1;
