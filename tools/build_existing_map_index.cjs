// Produce an over-inclusive index of ALL existing source records for conservative
// cross-map duplicate screening (including hidden/packed source fragments).
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),zlib=require('node:zlib');
const sandbox={window:{}};vm.createContext(sandbox);
let errors=[];
for(const filename of fs.readdirSync('data').filter(x=>x.endsWith('.js')&&x!=='master-loader.js')){
  try{vm.runInContext(fs.readFileSync(path.join('data',filename),'utf8'),sandbox,{filename,timeout:3000})}
  catch(e){errors.push(filename+': '+e.message)}
}
if(errors.length)throw Error('Cannot safely index all sources: '+errors.join('; '));
const windows=sandbox.window;
const arr=Object.values(windows).filter(Array.isArray).flatMap(a=>a.filter(r=>Array.isArray(r)&&r.length>=8&&typeof r[5]==='number'&&typeof r[6]==='number'));
const fragments=windows.ATLAS_PACKED_PARTS||[];
if(fragments.length){
  if(!fragments.every(x=>typeof x==='string'))throw Error('Malformed packed fragments');
  const packed=JSON.parse(zlib.inflateSync(Buffer.from(fragments.join(''),'base64')).toString('utf8'));
  for(const a of packed){if(Array.isArray(a)&&a.length>=8)arr.push(a)}
}
const pilot=JSON.parse(fs.readFileSync('data/pilot-city-points.json','utf8')).institutions||[];
for(const x of pilot){arr.push([x.id,x.name,x.type,x.city,x.country,x.lat,x.lng,x.web||'',x.verified||false,x.address||''])}
fs.mkdirSync('audits',{recursive:true});
fs.writeFileSync('audits/aragon-existing-map-data.json',JSON.stringify(arr));
console.log('Existing source tuples',arr.length,'packed fragments',fragments.length,'pilot',pilot.length);
