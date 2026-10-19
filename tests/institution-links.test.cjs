const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {load}=require('./loader.cjs');
const baseline=require('./fixtures/institutions-before.json');
const identities=require('./fixtures/fedele-identities.json');
const plain=x=>JSON.parse(JSON.stringify(x));
const groups=w=>Object.entries(w).filter(([k,v])=>k.startsWith('ATLAS_FEDELE_')&&Array.isArray(v));
const signature=x=>[x.name,x.city,x.country,x.lat,x.lng];
function assertLinks(records){
  assert.equal(new Set(records.map(x=>x.id)).size,records.length,'IDs must be unique');
  for(const before of baseline.positionalRecords){
    const after=records.find(x=>x.id===before.id);
    assert.ok(after,'Missing '+before.id);
    assert.deepEqual(signature(after),signature(before),'Wrong destination '+before.id);
  }
}
test('migration preserves every field of every institution, not only coordinates',async()=>{
  const result=await load();
  assert.equal(result.records.length,baseline.count);
  assert.equal(createHash('sha256').update(JSON.stringify(result.records)).digest('hex'),baseline.sha256);
  assertLinks(result.records);
  // Known pre-existing deployment issue is visible, never silently excluded from the audit.
  assert.equal(result.warnings.length,1);
  assert.equal(result.warnings[0][0],'[ATLAS] packed master failed');
});
test('all FEDELE source rows carry their reviewed permanent identity',async()=>{
  const result=await load();
  const actual=groups(result.window).flatMap(([source,rows])=>rows.map(a=>({source,id:a.institutionId,name:a[0],city:a[2],country:a[3]})));
  assert.deepEqual(plain(actual),identities);
  for(const a of actual)assert.ok(result.records.some(x=>x.id===a.id));
  assert.equal(actual.length,131);
  assert.equal(baseline.positionalRecords.length,48);
});
test('adding earlier base and FEDELE records cannot retarget existing links',async()=>{
  const result=await load({mutate:c=>{
    c.window.ATLAS_SPAIN.unshift(['TEST-BASE','New base centre','language','Madrid','Spain',40,-3]);
    c.window.ATLAS_FEDELE_ANDALUCIA.unshift(Object.assign(['New FEDELE centre','language','Test city','Spain',36,-4,''],{institutionId:'INST-test-new'}));
  }});
  assertLinks(result.records);
  assert.equal(result.records.length,baseline.count+2);
  assert.ok(result.records.some(x=>x.id==='INST-test-new'));
});
test('reordering source rows and moving FEDELE rows between source groups preserves destinations',async()=>{
  const result=await load({mutate:c=>{
    for(const [key,value] of Object.entries(c.window))if(Array.isArray(value)&&!key.includes('PACKED'))value.reverse();
    const from=c.window.ATLAS_FEDELE_INTERNATIONAL;
    c.window.ATLAS_FEDELE_AUDIT_MISSING.push(from.pop());
  }});
  assertLinks(result.records);
  assert.equal(result.records.length,baseline.count);
});
test('database updates keep identities even when name, city, website and coordinates change',async()=>{
  const before=baseline.positionalRecords[0];
  const result=await load({requestedId:before.id,mutate:c=>{
    for(const [,rows] of groups(c.window))for(const a of rows)if(a.institutionId===before.id){a[0]='Updated institution';a[2]='Updated city';a[4]=37;a[5]=-5;a[6]='https://example.org/updated';}
  }});
  assert.equal(result.opened.length,1);
  assert.equal(result.opened[0].id,before.id);
  assert.equal(result.opened[0].name,'Updated institution');
  assert.deepEqual(plain(result.flights[0][0]),[37,-5]);
});
test('each of the 48 historical positional URLs opens the correct actual profile',async()=>{
  for(const before of baseline.positionalRecords){
    const result=await load({requestedId:before.id});
    assert.equal(result.opened.length,1,before.id);
    assert.deepEqual(signature(result.opened[0]),signature(before));
    assert.deepEqual(plain(result.flights[0][0]),[before.lat,before.lng]);
  }
});
test('unchanged explicit IDs and unknown URLs resolve safely',async()=>{
  const stable=identities.find(x=>!baseline.positionalRecords.some(b=>b.id===x.id));
  const known=await load({requestedId:stable.id});assert.equal(known.opened[0].id,stable.id);
  const unknown=await load({requestedId:'ES-FEDELE-A-DOES-NOT-EXIST'});assert.equal(unknown.opened.length,0);assert.equal(unknown.flights.length,0);
});
test('sharing uses the stored identity and encodes the direct URL',async()=>{
  const vm=require('node:vm'),source=fs.readFileSync('app.js','utf8');let copied;
  const start=source.indexOf('async function atlasShareInstitution('),end=source.indexOf('\nfunction show(',start);
  const c={URL,navigator:{clipboard:{writeText:async x=>{copied=x}}},window:{isSecureContext:true,location:{origin:'https://atlasele.com',pathname:'/atlas/'},alert(){}}};
  vm.createContext(c);vm.runInContext(source.slice(start,end),c);
  await c.atlasShareInstitution({id:'INST-permanent & one',name:'Test'});
  const link=copied.split('\n').at(-1);assert.equal(new URL(link).searchParams.get('institution'),'INST-permanent & one');assert.equal(new URL(link).pathname,'/atlas/');
});
test('missing source identity fails explicitly rather than allocating a positional ID',async()=>{
  await assert.rejects(load({mutate:c=>{delete c.window.ATLAS_FEDELE_ANDALUCIA[0].institutionId;}}),/requires a permanent institutionId/);
  assert.doesNotMatch(fs.readFileSync('app.js','utf8'),/id:[^,\n]*data\.length/);
});
test('loading an updated, valid packed database cannot shift FEDELE identities',async()=>{
  const packed=require('node:zlib').deflateSync(JSON.stringify([['TEST-PACKED','New packed centre','language','Paris','France',48,2,'',true,'city']])).toString('base64');
  const result=await load({mutate:c=>{c.window.ATLAS_PACKED_PARTS=Array.from({length:8},(_,i)=>packed.slice(Math.floor(i*packed.length/8),Math.floor((i+1)*packed.length/8)));}});
  assert.equal(result.warnings.length,0);
  assertLinks(result.records);
  assert.equal(result.records.length,baseline.count+1);
});
