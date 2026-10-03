let data=[];
const map=L.map('map',{zoomControl:true,worldCopyJump:true}).setView([45,8],4);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map);
let filter='all',markers=[];const clusterLayer=L.markerClusterGroup({showCoverageOnHover:false,spiderfyOnMaxZoom:true,disableClusteringAtZoom:15,maxClusterRadius:(z)=>z>=13?28:z>=10?38:52,iconCreateFunction:clusterIcon});map.addLayer(clusterLayer);const panel=document.getElementById('panel'),detail=document.getElementById('detail');
function clusterIcon(cluster){const children=cluster.getAllChildMarkers();const counts={};children.forEach(m=>{const t=m.options.atlasType||'school';counts[t]=(counts[t]||0)+1});const dominant=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'school';const colors={school:'#0878d1',university:'#7836ce',language:'#f38b20',association:'#16a66c',teacher:'#eb218e',cervantes:'#d92525'};const n=cluster.getChildCount();const size=n<10?38:n<100?44:50;return L.divIcon({html:'<div class="atlas-cluster" style="--cluster:'+colors[dominant]+';width:'+size+'px;height:'+size+'px"><span>'+n+'</span></div>',className:'atlas-cluster-wrap',iconSize:[size,size]})}
function icon(type){const c={school:'#0c72b8',university:'#7557c9',language:'#e69032',association:'#31a47c'}[type]||'#0c72b8';return L.divIcon({className:'',html:"<div class='atlas-marker' style='width:20px;height:20px;background:"+c+"'></div>",iconSize:[20,20]})}
function render(){clusterLayer.clearLayers();markers=[];const shown=data.filter(x=>filter==='all'||x.type===filter);shown.forEach(x=>{let m=L.marker([x.lat,x.lng],{icon:icon(x.type),atlasType:x.type}).on('click',()=>show(x));markers.push(m)});clusterLayer.addLayers(markers);const c=document.getElementById('count');const cc=document.getElementById('countries');if(c)c.textContent=data.length.toLocaleString();if(cc)cc.textContent=new Set(data.map(x=>x.country)).size;if(globeInstance)globeInstance.pointsData(getGlobePoints(shown))}
function show(x){const t=translations[currentLang];detail.innerHTML=`<div class='detail'><span class='tag'>${x.type}</span><h2>${x.name}</h2><div class='meta'>📍 ${x.city}, ${x.country}</div><span class='pill'>🇪🇸 ${x.program}</span><span class='pill'>${x.verified?t.verified:t.demo}</span><p style='color:#66768a;line-height:1.5'>${t.publicProfile}</p>${x.web?`<a class='website' target='_blank' href='${x.web}'>${t.visit}</a>`:''}</div>`;panel.style.display='block'}
document.querySelectorAll('.chips button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chips button').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;render()});
document.getElementById('close').onclick=()=>panel.style.display='none';document.getElementById('explore').onclick=()=>{document.getElementById('worldCard').classList.add('hidden');map.flyTo([46,8],5,{duration:1.2})};map.on('zoomstart',()=>document.getElementById('worldCard').classList.add('hidden'));
const countryAliases={'espana':'Spain','spain':'Spain','eslovaquia':'Slovakia','slovakia':'Slovakia','alemania':'Germany','germany':'Germany','austria':'Austria','francia':'France','france':'France','italia':'Italy','italy':'Italy','reino unido':'United Kingdom','united kingdom':'United Kingdom','inglaterra':'United Kingdom','estados unidos':'United States','eeuu':'United States','usa':'United States','united states':'United States','canada':'Canada','rusia':'Russia','russia':'Russia','china':'China','india':'India','brasil':'Brazil','brazil':'Brazil','mexico':'Mexico','australia':'Australia','polonia':'Poland','poland':'Poland','hungria':'Hungary','hungary':'Hungary','chequia':'Czechia','republica checa':'Czechia','czechia':'Czechia','rumania':'Romania','romania':'Romania','bulgaria':'Bulgaria','portugal':'Portugal','irlanda':'Ireland','ireland':'Ireland','suiza':'Switzerland','switzerland':'Switzerland','suecia':'Sweden','sweden':'Sweden','noruega':'Norway','norway':'Norway','finlandia':'Finland','finland':'Finland','dinamarca':'Denmark','denmark':'Denmark','islandia':'Iceland','iceland':'Iceland','belgica':'Belgium','belgium':'Belgium','paises bajos':'Netherlands','netherlands':'Netherlands','grecia':'Greece','greece':'Greece','turquia':'Türkiye','turkey':'Türkiye','japon':'Japan','japan':'Japan','corea del sur':'South Korea','south korea':'South Korea','marruecos':'Morocco','morocco':'Morocco','argelia':'Algeria','algeria':'Algeria','egipto':'Egypt','egypt':'Egypt','sudafrica':'South Africa','south africa':'South Africa','nueva zelanda':'New Zealand','new zealand':'New Zealand','cuba':'Cuba'};
function normSearch(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function fitRecords(rows,maxZoom=7){if(!rows.length)return false;const bounds=L.latLngBounds(rows.map(x=>[x.lat,x.lng]));if(rows.length===1)map.flyTo([rows[0].lat,rows[0].lng],Math.min(maxZoom,10));else map.flyToBounds(bounds.pad(.18),{maxZoom,duration:1.1});return true}
function search(){const raw=document.getElementById('q').value.trim();if(!raw)return;const q=normSearch(raw),canonical=countryAliases[q]||null;const countries=canonical?data.filter(x=>x.country===canonical):data.filter(x=>normSearch(x.country)===q);if(countries.length){panel.style.display='none';fitRecords(countries,6);return}const cities=data.filter(x=>normSearch(x.city)===q);if(cities.length){panel.style.display='none';fitRecords(cities,12);return}const hit=data.find(x=>normSearch(x.name)===q)||data.find(x=>normSearch(x.name).includes(q));if(hit){map.flyTo([hit.lat,hit.lng],15,{duration:1.1});show(hit)}}
document.getElementById('searchBtn').onclick=search;document.getElementById('q').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
const teacherCard=document.getElementById('teacherCard');
document.getElementById('joinBtn').onclick=()=>{teacherCard.classList.add('open');document.getElementById('worldCard').classList.add('hidden')};
document.getElementById('teacherClose').onclick=()=>teacherCard.classList.remove('open');
document.getElementById('teachersChip').onclick=(e)=>{e.stopPropagation();teacherCard.classList.add('open');document.querySelectorAll('.chips button').forEach(x=>x.classList.remove('active'));document.getElementById('teachersChip').classList.add('active')};

const translations={
en:{tagline:'THE GLOBAL MAP OF SPANISH TEACHING',searchPlaceholder:'Search for a country, city, institution or teacher…',search:'Search',admin:'Admin',contact:'Contact',contactTitle:'Contact',contactText:'Questions, corrections or collaboration ideas? Get in touch with ATLAS ELE.',contactName:'Name',contactEmail:'Email',contactSubject:'Subject',contactMessage:'Message',contactSend:'Send message →',contactOr:'Prefer email?',all:'▦ All',school:'▣ Schools',university:'◆ Universities',language:'● Language Schools',association:'● Associations',cervantes:'● Cervantes',teachers:'● Teachers',more:'More',add:'Add place',teacherCta:'Put yourself on the map',eyebrow:'SPANISH TEACHING WORLDWIDE',headline:'Explore a world<br>connected by Spanish.',desc:'Discover schools, universities, language centres and professional communities teaching Spanish around the globe.',institutions:'institutions',countries:'countries',growth:'A growing community',atlasTeachers:'ATLAS teachers',exploreMap:'Explore the map ↓',teacherHeart:'TEACHERS ARE THE HEART OF ATLAS ELE',put:'Put yourself<br>on the map.',teacherDesc:'Are you a Spanish teacher? Join the global community and choose how you want to appear: by institution, city, country — or stay private.',privacy:'🔒 Your email will never appear publicly.',registration:'Teacher registration coming next →',mapped:'mapped',community:'Community-powered',legend:['School','University','Language school','Association','Cervantes','Teacher'],moreItems:['Official institutions','Instituto Cervantes','Publishers','Teacher training','Communities','Events & conferences','ELE projects'],visit:'Visit institution ↗',publicProfile:'Public ATLAS ELE profile. Private/internal contact information is not exposed.',verified:'✓ Verified',demo:'≈ Demo location'},
es:{tagline:'EL MAPA MUNDIAL DE LA ENSEÑANZA DEL ESPAÑOL',searchPlaceholder:'Busca un país, ciudad, institución o profesor…',search:'Buscar',admin:'Admin',contact:'Contacto',contactTitle:'Contacto',contactText:'¿Preguntas, correcciones o ideas para colaborar? Escríbenos a ATLAS ELE.',contactName:'Nombre',contactEmail:'Correo electrónico',contactSubject:'Asunto',contactMessage:'Mensaje',contactSend:'Enviar mensaje →',contactOr:'¿Prefieres el correo?',all:'▦ Todo',school:'▣ Centros escolares',university:'◆ Universidades',language:'● Academias',association:'● Asociaciones',cervantes:'● Cervantes',teachers:'● Profesores',more:'Más',add:'Añadir centro',teacherCta:'Ponte en el mapa',eyebrow:'LA ENSEÑANZA DEL ESPAÑOL EN EL MUNDO',headline:'Explora un mundo<br>conectado por el español.',desc:'Descubre colegios, universidades, academias y comunidades profesionales que enseñan español en todo el mundo.',institutions:'instituciones',countries:'países',growth:'Una comunidad en crecimiento',atlasTeachers:'profesores ATLAS',exploreMap:'Explorar el mapa ↓',teacherHeart:'LOS PROFESORES SON EL CORAZÓN DE ATLAS ELE',put:'Ponte<br>en el mapa.',teacherDesc:'¿Eres profesor de español? Únete a la comunidad global y decide cómo quieres aparecer: por institución, ciudad, país o de forma privada.',privacy:'🔒 Tu correo electrónico nunca aparecerá públicamente.',registration:'Registro de profesores próximamente →',mapped:'en el mapa',community:'Impulsado por la comunidad',legend:['Centro escolar','Universidad','Academia','Asociación','Cervantes','Profesor'],moreItems:['Instituciones oficiales','Instituto Cervantes','Editoriales','Formación de profesores','Comunidades','Eventos y congresos','Proyectos ELE'],visit:'Visitar institución ↗',publicProfile:'Perfil público de ATLAS ELE. La información de contacto privada o interna no se muestra.',verified:'✓ Verificado',demo:'≈ Ubicación aproximada'}
};
let currentLang=localStorage.getItem('atlasLang')||((navigator.language||'').toLowerCase().startsWith('es')?'es':'en');
function applyLanguage(lang){
 currentLang=lang;localStorage.setItem('atlasLang',lang);document.documentElement.lang=lang;const t=translations[lang];
 document.getElementById('tagline').textContent=t.tagline;document.getElementById('q').placeholder=t.searchPlaceholder;document.getElementById('searchBtn').textContent=t.search;
 document.getElementById('adminLabel').textContent=t.admin;document.getElementById('contactLabel').textContent=t.contact;
 const ct={contactTitle:'contactTitle',contactText:'contactText',contactName:'contactNameLabel',contactEmail:'contactEmailLabel',contactSubject:'contactSubjectLabel',contactMessage:'contactMessageLabel',contactSend:'contactSend',contactOr:'contactOrText'};Object.entries(ct).forEach(([k,id])=>{const el=document.getElementById(id);if(el&&t[k])el.textContent=t[k]});const ml=document.getElementById('moreLabel');if(ml)ml.textContent=t.more;
 const mainBtns=[...document.querySelectorAll('.chips > button, .chips > .moreWrap > #moreChip')];const labels=[t.all,t.school,t.university,t.language,t.association,t.cervantes,t.teachers];labels.forEach((v,i)=>{if(mainBtns[i])mainBtns[i].innerHTML=v});
 document.getElementById('moreChip').innerHTML='••• <span id="moreLabel">'+t.more+'</span>';
 const addLabel=document.querySelector('.iconAction label');if(addLabel)addLabel.textContent=t.add;const joinStrong=document.querySelector('#joinBtn strong');if(joinStrong)joinStrong.innerHTML=lang==='es'?'Ponte en<br>el mapa':'Put yourself<br>on the map';
 const wc=document.getElementById('worldCard');wc.querySelector('.eyebrow').textContent=t.eyebrow;wc.querySelector('h1').innerHTML=t.headline;wc.querySelector('p').textContent=t.desc;const ms=wc.querySelectorAll('.mini-stats small');ms[0].textContent=t.institutions;ms[1].textContent=t.countries;ms[2].textContent=t.atlasTeachers;document.getElementById('explore').textContent=t.exploreMap;
 const tc=document.getElementById('teacherCard');tc.querySelector('.eyebrow').textContent=t.teacherHeart;tc.querySelector('h2').innerHTML=t.put;tc.querySelector('p').textContent=t.teacherDesc;tc.querySelector('.privacy').textContent=t.privacy;tc.querySelector('.teacher-cta').textContent=t.registration;
 const hs=document.querySelectorAll('.headlineStats small');if(hs[0])hs[0].textContent=t.institutions;if(hs[1])hs[1].textContent=t.countries;if(hs[2])hs[2].textContent=t.growth;
 const legends=document.querySelectorAll('.legend span');legends.forEach((el,i)=>{const dot=el.querySelector('i');if(dot&&t.legend[i])el.innerHTML=dot.outerHTML+t.legend[i]});
 const moreLabels=document.querySelectorAll('.moreMenu button span');moreLabels.forEach((el,i)=>{if(t.moreItems[i])el.textContent=t.moreItems[i]});
 const stats=document.querySelector('.stats');if(stats)stats.innerHTML='<span class="live"></span><b id="count">5,338</b> '+t.mapped+' <span>·</span> <b id="countries">20+</b> '+t.countries+' <span>·</span> '+t.community;
 // Selector shows the language you can switch TO.
 document.getElementById('langFlag').textContent=lang==='en'?'🇪🇸':'🇬🇧';document.getElementById('langCode').textContent=lang==='en'?'ES':'EN';
 document.getElementById('langSwitch').title=lang==='en'?'Cambiar a español':'Switch to English';
 document.title=lang==='es'?'ATLAS ELE — El mapa mundial de la enseñanza del español':'ATLAS ELE — The global map of Spanish teaching';
}
document.getElementById('langSwitch').onclick=()=>applyLanguage(currentLang==='en'?'es':'en');applyLanguage(currentLang);

const moreMenu=document.getElementById('moreMenu');
document.getElementById('moreChip').addEventListener('click',e=>{e.stopPropagation();moreMenu.classList.toggle('open')});
document.addEventListener('click',e=>{if(!e.target.closest('.moreWrap'))moreMenu.classList.remove('open')});

let globeInstance=null;
const typeColors={school:'#0878d1',university:'#7836ce',language:'#f38b20',association:'#16a66c',teacher:'#eb218e',cervantes:'#d92525'};
function getGlobePoints(source=data){
 const groups=new Map();
 source.forEach(x=>{const key=(+x.lat).toFixed(4)+'|'+(+x.lng).toFixed(4);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x)});
 return [...groups.values()].map(items=>{if(items.length===1)return {...items[0],count:1,items};const counts={};items.forEach(x=>counts[x.type]=(counts[x.type]||0)+1);const type=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];return {...items[0],type,count:items.length,items,name:items.length+' places'}});
}
function initGlobe(){
 if(globeInstance)return;
 const el=document.getElementById('globeView');
 globeInstance=Globe()(el)
  .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
  .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
  .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
  .pointsData(getGlobePoints())
  .pointLat(d=>d.lat).pointLng(d=>d.lng).pointColor(d=>typeColors[d.type]||'#0878d1')
  .pointAltitude(d=>.004+Math.min(d.count||1,20)*.00035).pointRadius(d=>.09+Math.min(Math.sqrt(d.count||1)*.035,.16))
  .pointResolution(10)
  .pointLabel(d=>'<div class="globe-tooltip"><b>'+((d.count||1)>1?(d.count+' places'):d.name)+'</b><small>📍 '+d.city+', '+d.country+((d.count||1)>1?'<br>Click to explore this cluster':'<br>🇪🇸 '+d.program)+'</small></div>')
  .onPointClick(d=>{if((d.count||1)>1){setViewMode('2d');map.flyTo([d.lat,d.lng],12,{duration:1.1})}else show(d)});
 globeInstance.controls().autoRotate=true;globeInstance.controls().autoRotateSpeed=.32;
 globeInstance.pointOfView({lat:28,lng:8,altitude:2.15},1200);
 const resize=()=>{globeInstance.width(el.clientWidth).height(el.clientHeight)};resize();window.addEventListener('resize',resize);
}
function setViewMode(mode){
 const is3=mode==='3d';document.body.classList.toggle('globe-mode',is3);document.getElementById('globeView').classList.toggle('active',is3);
 document.getElementById('map2d').classList.toggle('active',!is3);document.getElementById('globe3d').classList.toggle('active',is3);
 if(is3){initGlobe();setTimeout(()=>{const el=document.getElementById('globeView');globeInstance.width(el.clientWidth).height(el.clientHeight)},50)}else{setTimeout(()=>map.invalidateSize(),50)}
}
document.getElementById('globe3d').onclick=()=>setViewMode('3d');
document.getElementById('map2d').onclick=()=>setViewMode('2d');

function initMiniGlobe(){
 const el=document.getElementById('miniGlobe'); if(!el || typeof Globe!=='function') return;
 try{
  const g=Globe()(el)
   .width(58).height(58)
   .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
   .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
   .backgroundColor('rgba(0,0,0,0)')
   .showAtmosphere(true).atmosphereColor('#7ad9ff').atmosphereAltitude(.12);
  g.pointOfView({lat:20,lng:-10,altitude:1.75},0);
  const ctl=g.controls();ctl.autoRotate=true;ctl.autoRotateSpeed=.8;ctl.enableZoom=false;ctl.enablePan=false;ctl.enableRotate=false;
 }catch(e){ el.textContent='🌍'; el.style.fontSize='42px'; el.style.display='grid'; el.style.placeItems='center'; }
}
initMiniGlobe();

async function loadPublicMapData(){
 try{
  const r=await fetch('data/pilot-city-points.json?v=2',{cache:'no-store'});if(!r.ok)throw new Error('data '+r.status);
  const payload=await r.json();const pilot=(payload.institutions||[]).map(x=>({...x,program:x.program||'Spanish / ELE',verified:x.verified??false,web:x.web||''}));
  const spain=(window.ATLAS_SPAIN||[]).map(a=>({id:a[0],name:a[1],type:a[2],city:a[3],country:a[4],lat:a[5],lng:a[6],web:a[7]||'',verified:a[8],address:a[9]||'',precision:a[10]||'city',program:'Spanish / ELE'}));
  const central=(window.ATLAS_CENTRAL||[]).map(a=>({id:a[0],name:a[1],type:a[2],city:a[3],country:a[4],lat:a[5],lng:a[6],web:a[7]||'',verified:a[8],precision:'city',program:'Spanish / ELE'}));
  const globalSeed=(window.ATLAS_GLOBAL||[]).map(a=>({id:a[0],name:a[1],type:a[2],city:a[3],country:a[4],lat:a[5],lng:a[6],web:a[7]||'',verified:a[8],precision:'city',program:'Spanish / ELE'}));const cervantes=(window.ATLAS_CERVANTES||[]).map(a=>({id:a[0],name:a[1],type:'cervantes',city:a[3],country:a[4],lat:a[5],lng:a[6],web:a[7]||'',verified:true,precision:'city',program:'Instituto Cervantes network'}));const accredited=(window.ATLAS_ACCREDITED||[]).map(a=>({id:a[0],name:a[1],type:a[2],city:a[3],country:a[4],lat:a[5],lng:a[6],web:a[7]||'',verified:a[8],address:a[9]||'',precision:'address',program:'Spanish / ELE',accreditation:'Instituto Cervantes Accredited'}));const ukMaster=(window.ATLAS_UK_MASTER||[]).map(a=>({id:a[0],name:a[1],type:a[2],city:a[3],country:a[4],lat:a[5],lng:a[6],web:a[7]||'',verified:a[8],precision:'region',program:'Spanish / MFL'}));const ukMaster2=(window.ATLAS_UK_MASTER_2||[]).map(a=>({id:a[0],name:a[1],type:a[2],city:a[3],country:a[4],lat:a[5],lng:a[6],web:a[7]||'',verified:a[8],precision:'region',program:'Spanish / MFL'}));const ukMaster3=(window.ATLAS_UK_MASTER_3||[]).map(a=>({id:a[0],name:a[1],type:a[2],city:a[3],country:a[4],lat:a[5],lng:a[6],web:a[7]||'',verified:a[8],precision:'region',program:'Spanish / MFL'}));const ukMaster4=(window.ATLAS_UK_MASTER_4||[]).map(a=>({id:a[0],name:a[1],type:a[2],city:a[3],country:a[4],lat:a[5],lng:a[6],web:a[7]||'',verified:a[8],precision:'region',program:'Spanish / MFL'}));const ukMaster5=(window.ATLAS_UK_MASTER_5||[]).map(a=>({id:a[0],name:a[1],type:a[2],city:a[3],country:a[4],lat:a[5],lng:a[6],web:a[7]||'',verified:a[8],precision:'region',program:'Spanish / MFL'}));
  const byId=new Map();
  const precisionRank={unknown:0,country:1,region:2,city:3,address:4,exact:5};
  function mergeRecord(x,source){
    const old=byId.get(x.id);
    if(!old){byId.set(x.id,{...x,_source:source});return}
    const oldRank=precisionRank[old.precision||'unknown']||0,newRank=precisionRank[x.precision||'unknown']||0;
    if(newRank>oldRank){console.info('[ATLAS] upgraded location',x.id,old.precision,'→',x.precision,source);byId.set(x.id,{...old,...x,_source:source});return}
    if(newRank===oldRank){
      const merged={...old};
      for(const [k,v] of Object.entries(x)){if((merged[k]===undefined||merged[k]===null||merged[k]==='')&&v!==undefined&&v!==null&&v!=='')merged[k]=v}
      byId.set(x.id,merged);console.warn('[ATLAS] duplicate ID kept first location',x.id,old._source,'vs',source);return
    }
    console.warn('[ATLAS] protected higher-precision location',x.id,old.precision,'from',x.precision,source);
  }
  pilot.forEach(x=>mergeRecord(x,'pilot'));spain.forEach(x=>mergeRecord(x,'spain'));central.forEach(x=>mergeRecord(x,'central-europe'));globalSeed.forEach(x=>{if(/(?:Instituto|Aula|Extensión|Antena|Cátedra) Cervantes/i.test(x.name))x.type='cervantes';mergeRecord(x,'global-seed')});cervantes.forEach(x=>mergeRecord(x,'cervantes-2025'));accredited.forEach(x=>mergeRecord(x,'cervantes-accredited'));ukMaster.forEach(x=>mergeRecord(x,'uk-master'));ukMaster2.forEach(x=>mergeRecord(x,'uk-master-2'));ukMaster3.forEach(x=>mergeRecord(x,'uk-master-3'));ukMaster4.forEach(x=>mergeRecord(x,'uk-master-4'));ukMaster5.forEach(x=>mergeRecord(x,'uk-master-5'));data=[...byId.values()];
  render();
  const hs=document.querySelectorAll('.headlineStats strong');if(hs[0])hs[0].textContent=data.length.toLocaleString();if(hs[1])hs[1].textContent=new Set(data.map(x=>x.country)).size;
  const ms=document.querySelectorAll('.mini-stats strong');if(ms[0])ms[0].textContent=data.length.toLocaleString();if(ms[1])ms[1].textContent=new Set(data.map(x=>x.country)).size;
  if(globeInstance)globeInstance.pointsData(getGlobePoints());
 }catch(e){console.error('ATLAS ELE data load failed',e)}
}
loadPublicMapData();

const adminPanel=document.getElementById('adminPanel');
document.getElementById('adminBtn').onclick=()=>{adminPanel.classList.add('open');teacherCard.classList.remove('open');document.getElementById('adminInstitutions').textContent=data.length.toLocaleString();document.getElementById('adminCountries').textContent=new Set(data.map(x=>x.country)).size};
document.getElementById('adminClose').onclick=()=>adminPanel.classList.remove('open');

const contactPanel=document.getElementById('contactPanel');
document.getElementById('contactBtn').onclick=()=>{contactPanel.classList.add('open');adminPanel.classList.remove('open');teacherCard.classList.remove('open')};
document.getElementById('contactClose').onclick=()=>contactPanel.classList.remove('open');

document.getElementById('contactForm').addEventListener('submit',e=>{e.preventDefault();const name=document.getElementById('contactName').value.trim(),email=document.getElementById('contactEmail').value.trim(),subject=document.getElementById('contactSubject').value.trim(),message=document.getElementById('contactMessage').value.trim();const body=(currentLang==='es'?'Nombre: ':'Name: ')+name+'\nEmail: '+email+'\n\n'+message;window.location.href='mailto:info@atlasele.org?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body)});

const adminWorkspace=document.getElementById('adminWorkspace'),adminGrid=document.querySelector('.adminGrid');
function openAdminWorkspace(mode){
 adminPanel.classList.add('workspace');adminWorkspace.classList.add('open');
 if(mode==='institutions'||mode==='quality'){document.getElementById('adminWorkTitle').textContent=mode==='quality'?'Data quality':'Institutions';document.getElementById('adminWorkSub').textContent=mode==='quality'?'Review location precision and records':'Search and edit public map records';renderAdminRows(mode)}
 if(mode==='export'){document.getElementById('adminWorkTitle').textContent='Export data';document.getElementById('adminWorkSub').textContent='Filter and select exactly what you want';adminWorkspace.querySelector('.adminControls').style.display='none';renderExportBuilder()}
}
function closeAdminWorkspace(){adminPanel.classList.remove('workspace');adminWorkspace.classList.remove('open');adminWorkspace.querySelector('.adminControls').style.display='grid'}
document.getElementById('adminBack').onclick=closeAdminWorkspace;
document.querySelectorAll('.adminGrid button').forEach(b=>b.onclick=()=>{const m=b.dataset.admin;if(['institutions','quality','export'].includes(m))openAdminWorkspace(m)});
function renderAdminRows(mode='institutions'){
 const q=document.getElementById('adminSearch').value.toLowerCase(),typ=document.getElementById('adminType').value;
 let rows=data.filter(x=>(typ==='all'||x.type===typ)&&(!q||[x.name,x.city,x.country,x.id].some(v=>(v||'').toLowerCase().includes(q))));
 if(mode==='quality')rows=rows.sort((a,b)=>(a.precision==='exact'?1:0)-(b.precision==='exact'?1:0));
 document.getElementById('adminTable').innerHTML=rows.slice(0,300).map(x=>'<div class="adminRow"><div><strong>'+x.name+'</strong><small>'+x.city+', '+x.country+' · '+(x.precision||'unknown')+'</small></div><span class="type">'+x.type+'</span><button data-edit="'+x.id+'">✎</button></div>').join('');
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editAdminRecord(b.dataset.edit));
}
document.getElementById('adminSearch').oninput=()=>renderAdminRows();document.getElementById('adminType').onchange=()=>renderAdminRows();
function editAdminRecord(id){const x=data.find(r=>r.id===id);if(!x)return;document.getElementById('adminTable').innerHTML='<div class="adminEdit"><label>Name<input id="aeName" value="'+escAttr(x.name)+'"></label><label>City<input id="aeCity" value="'+escAttr(x.city)+'"></label><label>Country<input id="aeCountry" value="'+escAttr(x.country)+'"></label><label>Address<input id="aeAddress" value="'+escAttr(x.address||'')+'"></label><label>Latitude<input id="aeLat" type="number" step="any" value="'+x.lat+'"></label><label>Longitude<input id="aeLng" type="number" step="any" value="'+x.lng+'"></label><label>Website<input id="aeWeb" value="'+escAttr(x.web||'')+'"></label><div class="adminEditActions"><button class="adminSave" id="aeSave">Save locally</button><button class="adminDelete" id="aeDelete">Remove locally</button></div></div>';document.getElementById('aeSave').onclick=()=>{Object.assign(x,{name:document.getElementById('aeName').value,city:document.getElementById('aeCity').value,country:document.getElementById('aeCountry').value,address:document.getElementById('aeAddress').value,lat:+document.getElementById('aeLat').value,lng:+document.getElementById('aeLng').value,web:document.getElementById('aeWeb').value,precision:'exact'});render();renderAdminRows()};document.getElementById('aeDelete').onclick=()=>{data=data.filter(r=>r.id!==id);render();renderAdminRows()}}
function escAttr(v){return String(v??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
function exportFields(){return ['id','name','type','city','country','address','lat','lng','precision','web','verified','program']}
let exportSelected=new Set();
function renderExportBuilder(){
 const countries=[...new Set(data.map(x=>x.country))].sort();
 adminWorkspace.querySelector('.adminTable').innerHTML='<div class="exportBuilder"><div class="exportFilters"><select id="exType"><option value="all">All types</option><option value="school">Schools</option><option value="university">Universities</option><option value="language">Language schools</option><option value="official">Official institutions</option><option value="association">Associations</option><option value="teacher">Teachers</option></select><select id="exCountry"><option value="all">All countries</option>'+countries.map(x=>'<option>'+x+'</option>').join('')+'</select><input id="exCity" placeholder="City"><input id="exSearch" placeholder="Search name…"></div><div class="exportActions"><button id="exAll">Select visible</button><button id="exNone">Clear all</button><strong id="exCount">0 selected</strong></div><div class="exportList" id="exportList"></div><div class="exportDownload"><button class="exportXlsx" id="downloadXlsx">⇩ Excel (.xlsx)</button><button class="exportCsv" id="downloadCsv">⇩ CSV</button></div></div>';
 ['exType','exCountry'].forEach(id=>document.getElementById(id).onchange=renderExportList);['exCity','exSearch'].forEach(id=>document.getElementById(id).oninput=renderExportList);
 document.getElementById('exAll').onclick=()=>{getExportVisible().forEach(x=>exportSelected.add(x.id));renderExportList()};document.getElementById('exNone').onclick=()=>{exportSelected.clear();renderExportList()};
 document.getElementById('downloadCsv').onclick=downloadSelectedCsv;document.getElementById('downloadXlsx').onclick=downloadSelectedXlsx;renderExportList();
}
function getExportVisible(){const typ=document.getElementById('exType')?.value||'all',country=document.getElementById('exCountry')?.value||'all',city=(document.getElementById('exCity')?.value||'').toLowerCase(),q=(document.getElementById('exSearch')?.value||'').toLowerCase();return data.filter(x=>(typ==='all'||x.type===typ)&&(country==='all'||x.country===country)&&(!city||(x.city||'').toLowerCase().includes(city))&&(!q||(x.name||'').toLowerCase().includes(q)))}
function renderExportList(){const rows=getExportVisible(),el=document.getElementById('exportList');if(!el)return;el.innerHTML=rows.map(x=>'<label class="exportItem"><input type="checkbox" data-ex="'+x.id+'" '+(exportSelected.has(x.id)?'checked':'')+'><span><strong>'+x.name+'</strong><small>'+x.city+', '+x.country+'</small></span><em>'+x.type+'</em></label>').join('');el.querySelectorAll('[data-ex]').forEach(cb=>cb.onchange=()=>{cb.checked?exportSelected.add(cb.dataset.ex):exportSelected.delete(cb.dataset.ex);updateExportCount()});updateExportCount()}
function updateExportCount(){const e=document.getElementById('exCount');if(e)e.textContent=exportSelected.size+' selected'}
function selectedExportData(){return data.filter(x=>exportSelected.has(x.id))}
function downloadSelectedCsv(){const selected=selectedExportData();if(!selected.length)return;const fields=exportFields(),rows=[fields.join(','),...selected.map(x=>fields.map(f=>'"'+String(x[f]??'').replace(/"/g,'""')+'"').join(','))];const blob=new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ATLAS_ELE_Selected_Data.csv';a.click();URL.revokeObjectURL(a.href)}
function downloadSelectedXlsx(){const selected=selectedExportData();if(!selected.length)return;const fields=exportFields(),rows=selected.map(x=>Object.fromEntries(fields.map(f=>[f,x[f]??''])));const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'ATLAS ELE');XLSX.writeFile(wb,'ATLAS_ELE_Selected_Data.xlsx')}
