// Run from the repository root with: node audits/capture-effective-inventory.mjs
// Captures actual browser-visible map records, not the larger unlinked master DB.
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 try{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=path.resolve(root,'.'+name);
  if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403);res.end();return}
  const file=target===root?path.join(root,'index.html'):target;
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
  res.end(bytes);
 }catch(err){res.writeHead(404);res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const jsErrors=[],failedRequests=[];
 page.on('pageerror',error=>jsErrors.push(String(error)));
 page.on('requestfailed',request=>{if(!request.url().includes('tile.openstreetmap.org'))failedRequests.push(request.url()+': '+request.failure()?.errorText)});
 await page.route(/tile\.openstreetmap\.org/,route=>route.abort());
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>{
  const el=document.querySelector('[data-live-stat="institutions"] strong');
  return el&&/^\d/.test(el.textContent.trim());
 },null,{timeout:90000});
 const metrics=await page.evaluate(()=>{
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const records=data.map(x=>({id:x.id,name:x.name,city:x.city,country:x.country,address:x.address,web:x.web,precision:x.precision,lat:x.lat,lng:x.lng,type:x.type}));
  const groups=new Map();
  for(const x of records){
   const key=[norm(x.name),norm(x.city),norm(x.country)].join('|');
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push(x.id);
  }
  const duplicatedNames=[...groups].filter(([_,ids])=>ids.length>1).map(([key,ids])=>({key,ids}));
  const ids=records.map(x=>x.id);
  const byPrecision={};
  for(const x of records)byPrecision[x.precision||'unknown']=(byPrecision[x.precision||'unknown']||0)+1;
  const verified=window.ATLAS_VERIFIED_SPAIN_20261027||[];
  const schoolName=v=>norm(v).replace(/^(colegio|centro educativo|escuela|ceip)\s+/,'');
  const domain=v=>String(v||'').replace(/^https?:\/\//i,'').replace(/^www\./i,'').split('/')[0].toLowerCase();
  const checked=verified.map(a=>{
   const x=records.filter(y=>norm(y.city)===norm(a[3])&&norm(y.country)===norm(a[4])&&(
    schoolName(y.name)===schoolName(a[1])||(domain(y.web)&&domain(y.web)===domain(a[7]))||(y.address&&norm(y.address)===norm(a[9]))
   ));
   const siteMatched=x.filter(y=>norm(y.address)===norm(a[9])&&Math.abs(y.lat-a[5])<0.000001&&Math.abs(y.lng-a[6])<0.000001&&domain(y.web)===domain(a[7]));
   return {id:a[0],name:a[1],matched:x.length,correctCoordinatesAndAddress:siteMatched.length===1&&x.length===1,finalIds:siteMatched.map(y=>y.id)};
  });
  const mapMarkers=typeof markers==='undefined'?null:markers.length;
  const statText=document.querySelector('[data-live-stat="institutions"] strong')?.textContent||'';
  return {
   capturedAt:new Date().toISOString(),mapRecords:records.length,mapMarkers,
   displayedCount:Number(statText.replace(/[^0-9]/g,'')),uniqueIDs:new Set(ids).size,
   uniqueNameCityCountryKeys:groups.size,potentialDuplicateNameGroups:duplicatedNames.length,
   duplicateNamesSample:duplicatedNames.slice(0,30),
   spanishSchools:records.filter(x=>x.country==='Spain'&&x.type==='school').length,
   countryCount:new Set(records.map(x=>x.country)).size,precision:byPrecision,
   recordsWithAddress:records.filter(x=>!!x.address).length,
   recordsWithWebsite:records.filter(x=>/^https?:\/\//i.test(String(x.web||''))).length,
   recordsWithAddressWebsiteAndCoordinates:records.filter(x=>!!x.address&&/^https?:\/\//i.test(String(x.web||''))&&Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lng))&&Math.abs(Number(x.lat))>0.001&&Math.abs(Number(x.lng))>0.001).length,
   countryBreakdown:Object.entries(records.reduce((acc,x)=>{const key=x.country||'Unknown';acc[key]=(acc[key]||0)+1;return acc;},{})).sort((a,b)=>b[1]-a[1]).map(([country,count])=>({country,count})),
   packedMasterFragments:(window.ATLAS_PACKED_PARTS||[]).map(v=>typeof v==='string'?v.length:0),
   verifiedBatch:window.ATLAS_VERIFIED_SPAIN_STATS||null,
   verifiedCoordinatesAndAddresses:checked
  };
 });
 metrics.jsErrors=jsErrors;
 metrics.failedRequests=failedRequests;
 await mkdir(path.join(root,'audits'),{recursive:true});
 await writeFile(path.join(root,'audits','effective-inventory.json'),JSON.stringify(metrics,null,2)+'\n');
 console.log('EFFECTIVE INVENTORY',JSON.stringify({
  capturedAt:metrics.capturedAt,mapRecords:metrics.mapRecords,mapMarkers:metrics.mapMarkers,
  displayedCount:metrics.displayedCount,uniqueIDs:metrics.uniqueIDs,
  uniqueNameCityCountryKeys:metrics.uniqueNameCityCountryKeys,
  potentialDuplicateNameGroups:metrics.potentialDuplicateNameGroups,
  spanishSchools:metrics.spanishSchools,recordsWithAddress:metrics.recordsWithAddress,recordsWithWebsite:metrics.recordsWithWebsite,recordsWithAddressWebsiteAndCoordinates:metrics.recordsWithAddressWebsiteAndCoordinates,
  verifiedBatch:metrics.verifiedBatch,
  packedMasterFragments:metrics.packedMasterFragments,
  jsErrors:jsErrors.slice(0,6),failedRequests:failedRequests.slice(0,6)
 }));
 if(metrics.mapRecords!==metrics.mapMarkers||metrics.mapRecords!==metrics.displayedCount)throw Error('Map marker count does not match the rendered count.');
 const expectedVerified=metrics.verifiedCoordinatesAndAddresses.length;
 if(expectedVerified<12||metrics.verifiedBatch?.sourceRows!==expectedVerified||metrics.verifiedBatch.skipped!==0||metrics.verifiedBatch.added+metrics.verifiedBatch.enriched!==expectedVerified)throw Error('Verified school records were missing or ambiguous.');
 if(metrics.verifiedCoordinatesAndAddresses.some(x=>!x.correctCoordinatesAndAddress))throw Error('A verified school is missing or not at its government-supplied coordinates.');
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
