// Read-only source audit. Run locally: node audits/check-data.mjs
import {readFileSync, writeFileSync} from 'node:fs';
import {inflateSync, inflateRawSync, gunzipSync} from 'node:zlib';
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
const packedStatus={availableIndices:Object.keys(parts).filter(k=>parts[k]),decoded:false,error:null,records:0};
if(!parts[0]){packedStatus.error='Missing fragment index 0: supplied files contain indices 1–7 only';}
else {try{const b64=parts.join('');const bytes=Buffer.from(b64,'base64');let decoded;for(const fn of [inflateSync,inflateRawSync,gunzipSync]){try{decoded=fn(bytes).toString('utf8');break}catch{}}if(!decoded)throw new Error('Unsupported compression');const rows=JSON.parse(decoded);if(!Array.isArray(rows))throw new Error('Decoded result is not an array');arrays.push(['packed',rows]);packedStatus.decoded=true;packedStatus.records=rows.length}catch(e){packedStatus.error=e.message}}
const pilot=JSON.parse(readFileSync('data/pilot-city-points.json','utf8'));arrays.unshift(['pilot',(pilot.institutions||[]).map(x=>[x.id,x.name,x.type,x.city,x.country,x.lat,x.lng])]);
const placeKey=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const cityAliases={viena:'vienna',wien:'vienna'};
const canonicalCity=v=>cityAliases[placeKey(v)]||placeKey(v);
const seen=new Map(),invalid=[],collisions=[];

for(const [source,rows] of arrays){if(!Array.isArray(rows)){console.warn('Missing source:',source);continue}
 for(const a of rows){if(!Array.isArray(a))continue;
  const [id,name,type,city,country,lat,lng]=a;
  if(!id||!name||!type||!city||!country||lat===null||lng===null||lat===''||lng===''||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))||Math.abs(Number(lat))>90||Math.abs(Number(lng))>180||(Number(lat)===0&&Number(lng)===0))invalid.push({source,id,name});
  if(seen.has(id))collisions.push({id,first:seen.get(id).source,second:source,firstName:seen.get(id).name,secondName:name,samePlace:canonicalCity(seen.get(id).city)===canonicalCity(city)&&placeKey(seen.get(id).country)===placeKey(country)});
  else seen.set(id,{source,name,city,country});
 }
 console.log(source,rows.length,'records');
}
const report={packedStatus,scripts:scripts.length,uniqueIds:seen.size,idCollisions:collisions.length,conflictingPlaces:collisions.filter(x=>!x.samePlace).length,invalidRecords:invalid.length,collisions,invalid};
writeFileSync('audits/data-audit-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,collisions:collisions.slice(0,30),invalid:invalid.slice(0,30)},null,2));
if(packedStatus.error||report.conflictingPlaces||invalid.length)process.exitCode=1;
// Duplicate IDs may intentionally enrich existing institutions. Review them manually.
// Not covered: runtime FEDELE additions and full browser merges.
