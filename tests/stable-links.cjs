// Run with: node tests/stable-links.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('app.js','utf8');
const match=app.match(/function atlasStableInstitutionKey\(x\)\{[\s\S]*?\n\}/);
assert.ok(match,'Stable key function must exist');
const key=vm.runInNewContext('('+match[0]+')');
const a={id:'ES-FEDELE-A-100',name:'Academia Ñ',city:'Madrid',country:'Spain',type:'language',address:'Calle Mayor 1'};
const b={...a,id:'ES-FEDELE-A-900'};
assert.equal(key(a),key(b),'Changing legacy array index must not change public URL');
assert.notEqual(key(a),key({...a,city:'Sevilla'}),'Different institution locations must differ');
const pilot=JSON.parse(fs.readFileSync('data/pilot-city-points.json','utf8')).institutions;
const keys=pilot.map(key);
assert.equal(new Set(keys).size,keys.length,'Pilot stable keys must be unique');
assert.ok(app.includes('x.id===requestedId')&&app.includes('atlasStableInstitutionKey(x)===requestedId'),'Both legacy and stable URLs must resolve');
console.log('PASS: legacy ID independence, location differentiation, unique pilot keys, backward-compatible lookup');
