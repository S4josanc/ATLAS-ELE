// Read-only source audit. Run locally: node audits/check-data.mjs
import {readFileSync} from 'node:fs';
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
const seen=new Map(),invalid=[],collisions=[];
for(const [source,rows] of arrays){if(!Array.isArray(rows)){console.warn('Missing source:',source);continue}
 for(const a of rows){if(!Array.isArray(a))continue;
  const [id,name,type,city,country,lat,lng]=a;
  if(!id||!name||!city||!country||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))||Math.abs(Number(lat))>90||Math.abs(Number(lng))>180)invalid.push({source,id,name});
  if(seen.has(id))collisions.push({id,first:seen.get(id),second:source});
  else seen.set(id,source);
 }
 console.log(source,rows.length,'records');
}
console.log(JSON.stringify({scripts:scripts.length,uniqueIds:seen.size,idCollisions:collisions.length,invalidRecords:invalid.length,collisions:collisions.slice(0,30),invalid:invalid.slice(0,30)},null,2));
if(collisions.length||invalid.length)process.exitCode=1;
// Exclusions: FEDELE enrichment added dynamically by app.js; pilot JSON; runtime merges.
// Review duplicated IDs manually: the app can intentionally enrich a pre-existing record.
