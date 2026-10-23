// Read-only source audit. Run locally: node audits/check-data.mjs
import {readFileSync, writeFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import vm from 'node:vm';
const html=readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script\s+src=['"]([^'"]+)['"]/g)].map(m=>m[1].split('?')[0]).filter(p=>p.startsWith('data/'));
const context={window:{}};vm.createContext(context);
for(const filename of scripts){vm.runInContext(readFileSync(filename,'utf8'),context,{filename,timeout:5000})}
const w=context.window;
const arrays=[
 ['spain',w.ATLAS_SPAIN],['central',w.ATLAS_CENTRAL],['global',w.ATLAS_GLOBAL],
 ['cervantes',w.ATLAS_CERVANTES],['accredited',w.ATLAS_ACCREDITED],
 ...['ATLAS_UK_MASTER','ATLAS_UK_MASTER_2','ATLAS_UK_MASTER_3','ATLAS_UK_MASTER_4','ATLAS_UK_MASTER_5','ATLAS_UK_MASTER_6'].map((k,i)=>['uk-'+(i+1),w[k]]),
 ['europe',w.ATLAS_MASTER_EUROPE],['recovery',w.ATLAS_RECOVERY_20261006]
];
const parts=w.ATLAS_PACKED_PARTS||[];
const expectedParts=7;const fragments=parts.slice(1,expectedParts+1);if(fragments.length!==expectedParts||fragments.some(p=>typeof p!=='string'||!p.length)){console.error('Packed data incomplete: expected parts 1–7');process.exitCode=1}else{try{arrays.push(['packed',JSON.parse(inflateSync(Buffer.from(fragments.join(''),'base64')).toString('utf8'))])}catch(e){console.error('Packed data decode failed:',e.message);process.exitCode=1}}
const pilot=JSON.parse(readFileSync('data/pilot-city-points.json','utf8'));arrays.unshift(['pilot',(pilot.institutions||[]).map(x=>[x.id,x.name,x.type,x.city,x.country,x.lat,x.lng])]);
const seen=new Map(),invalid=[],collisions=[];

for(const [source,rows] of arrays){if(!Array.isArray(rows)){console.warn('Missing source:',source);continue}
 for(const a of rows){if(!Array.isArray(a))continue;
  const [id,name,type,city,country,lat,lng]=a;
  if(!id||!name||!city||!country||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))||Math.abs(Number(lat))>90||Math.abs(Number(lng))>180)invalid.push({source,id,name});
  if(seen.has(id))collisions.push({id,first:seen.get(id).source,second:source,firstName:seen.get(id).name,secondName:name,samePlace:seen.get(id).city===city&&seen.get(id).country===country});
  else seen.set(id,{source,name,city,country});
 }
 console.log(source,rows.length,'records');
}
const report={scripts:scripts.length,uniqueIds:seen.size,idCollisions:collisions.length,conflictingPlaces:collisions.filter(x=>!x.samePlace).length,invalidRecords:invalid.length,collisions,invalid};
writeFileSync('audits/data-audit-results.json',JSON.stringify(report,null,2)+'\\n');
console.log(JSON.stringify({...report,collisions:collisions.slice(0,30),invalid:invalid.slice(0,30)},null,2));
if(report.conflictingPlaces||invalid.length)process.exitCode=1;
// Duplicate IDs may intentionally enrich existing institutions. Review them manually.
// Not covered: runtime FEDELE additions and full browser merges.
