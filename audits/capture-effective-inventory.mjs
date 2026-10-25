import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 let loaded=false;for(let attempt=0;attempt<15&&!loaded;attempt++){try{await page.goto('http://127.0.0.1:8765/?atlasAuditExport=1',{waitUntil:'domcontentloaded',timeout:10000});loaded=true}catch(e){if(attempt===14)throw e;await new Promise(resolve=>setTimeout(resolve,300))}}
 await page.waitForFunction(()=>Array.isArray(window.ATLAS_AUDIT_SNAPSHOT),{timeout:45000});
 const rows=await page.evaluate(()=>window.ATLAS_AUDIT_SNAPSHOT);
 const ids=new Set(),duplicates=[];
 for(const row of rows){if(ids.has(row.id))duplicates.push(row.id);ids.add(row.id)}
 const report={count:rows.length,uniqueIds:ids.size,duplicateIds:[...new Set(duplicates)],pageErrors:errors,rows};
 writeFileSync('audits/effective-inventory.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({count:report.count,uniqueIds:report.uniqueIds,duplicateIds:report.duplicateIds,pageErrors:errors},null,2));
 if(duplicates.length||errors.length)process.exitCode=1;
}catch(e){console.error('Inventory capture failed:',e.message);process.exitCode=1}
finally{await browser?.close();server.kill()}
