const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
async function load({source=fs.readFileSync(path.join(root,'app.js'),'utf8'), mutate=()=>{}, requestedId=''}={}) {
  const errors=[],opened=[],flights=[];
  const context={window:{location:{search:requestedId?'?institution='+encodeURIComponent(requestedId):''}},console:{info(){},warn(){},error(...a){errors.push(a)}},URLSearchParams,Uint8Array,atob,DecompressionStream,Response,Blob,
    fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,'data/pilot-city-points.json'),'utf8'))}),
    document:{querySelectorAll:()=>[]},render(){},globeInstance:null,map:{flyTo:(...args)=>flights.push(args)},show:x=>opened.push(x)};
  vm.createContext(context);
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const [,src] of html.matchAll(/<script src=['"](data\/[^'"?]+)[^'"]*['"]/g)) vm.runInContext(fs.readFileSync(path.join(root,src),'utf8'),context);
  mutate(context);
  const start=source.includes('function atlasFedeleId(')?source.indexOf('function atlasFedeleId('):source.indexOf('async function loadPublicMapData(){');
  const end=source.indexOf('\nloadPublicMapData();',start);
  await vm.runInContext('let data=[];'+source.slice(start,end)+'\nloadPublicMapData().then(()=>{globalThis.records=data})',context);
  const fatal=errors.filter(x=>x[0]!=='[ATLAS] packed master failed');
  if(fatal.length)throw new Error(errors.map(x=>x.map(v=>v?.stack||String(v)).join(' ')).join('\n'));
  return {warnings:errors,records:context.records,window:context.window,opened,flights};
}
module.exports={load,root};
