const fs = require('node:fs');
const assert = require('node:assert/strict');
const pilot = JSON.parse(fs.readFileSync('data/pilot-city-points.json','utf8'));
const rows = pilot.institutions || [];
const issues = [];
const seen = new Set();
for (const [index, x] of rows.entries()) {
  if (!x.id || !x.name || !x.city || !x.country) issues.push({index, issue:'missing required identity field'});
  if (seen.has(x.id)) issues.push({index,id:x.id,issue:'duplicate ID'});
  seen.add(x.id);
  if (!Number.isFinite(x.lat) || !Number.isFinite(x.lng) || Math.abs(x.lat)>90 || Math.abs(x.lng)>180)
    issues.push({index,id:x.id,issue:'invalid coordinate'});
}
const summary = {
  actualRecords: rows.length,
  declaredRecords: pilot.meta?.records ?? null,
  metadataCountMismatch: pilot.meta?.records !== rows.length,
  missingAddress: rows.filter(x=>!x.address).length,
  missingWebsite: rows.filter(x=>!x.web).length,
  exactWithoutAddress: rows.filter(x=>x.precision==='exact'&&!x.address).length,
  issues
};
fs.mkdirSync('audit-output',{recursive:true});
fs.writeFileSync('audit-output/pilot-quality.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
assert.equal(issues.length,0,'Structural errors in pilot data');
