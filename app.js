let data=[];
const map=L.map('map',{zoomControl:true,worldCopyJump:true}).setView([45,8],4);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map);
let filter='all',markers=[];const clusterLayer=L.markerClusterGroup({showCoverageOnHover:false,spiderfyOnMaxZoom:true,disableClusteringAtZoom:12,maxClusterRadius:52,iconCreateFunction:clusterIcon});map.addLayer(clusterLayer);const panel=document.getElementById('panel'),detail=document.getElementById('detail');
function clusterIcon(cluster){const children=cluster.getAllChildMarkers();const counts={};children.forEach(m=>{const t=m.options.atlasType||'school';counts[t]=(counts[t]||0)+1});const dominant=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'school';const colors={school:'#0878d1',university:'#7836ce',language:'#f38b20',association:'#16a66c',teacher:'#eb218e'};const n=cluster.getChildCount();const size=n<10?38:n<100?44:50;return L.divIcon({html:'<div class="atlas-cluster" style="--cluster:'+colors[dominant]+';width:'+size+'px;height:'+size+'px"><span>'+n+'</span></div>',className:'atlas-cluster-wrap',iconSize:[size,size]})}
function icon(type){const c={school:'#0c72b8',university:'#7557c9',language:'#e69032',association:'#31a47c'}[type]||'#0c72b8';return L.divIcon({className:'',html:"<div class='atlas-marker' style='width:20px;height:20px;background:"+c+"'></div>",iconSize:[20,20]})}
function render(){clusterLayer.clearLayers();markers=[];const shown=data.filter(x=>filter==='all'||x.type===filter);shown.forEach(x=>{let m=L.marker([x.lat,x.lng],{icon:icon(x.type),atlasType:x.type}).on('click',()=>show(x));markers.push(m)});clusterLayer.addLayers(markers);const c=document.getElementById('count');const cc=document.getElementById('countries');if(c)c.textContent=data.length.toLocaleString();if(cc)cc.textContent=new Set(data.map(x=>x.country)).size;if(globeInstance)globeInstance.pointsData(shown)}
function show(x){const t=translations[currentLang];detail.innerHTML=`<div class='detail'><span class='tag'>${x.type}</span><h2>${x.name}</h2><div class='meta'>📍 ${x.city}, ${x.country}</div><span class='pill'>🇪🇸 ${x.program}</span><span class='pill'>${x.verified?t.verified:t.demo}</span><p style='color:#66768a;line-height:1.5'>${t.publicProfile}</p>${x.web?`<a class='website' target='_blank' href='${x.web}'>${t.visit}</a>`:''}</div>`;panel.style.display='block'}
document.querySelectorAll('.chips button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chips button').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;render()});
document.getElementById('close').onclick=()=>panel.style.display='none';document.getElementById('explore').onclick=()=>{document.getElementById('worldCard').classList.add('hidden');map.flyTo([46,8],5,{duration:1.2})};map.on('zoomstart',()=>document.getElementById('worldCard').classList.add('hidden'));
function search(){const q=document.getElementById('q').value.toLowerCase().trim();if(!q)return;const x=data.find(x=>[x.name,x.city,x.country].some(v=>v.toLowerCase().includes(q)));if(x){map.flyTo([x.lat,x.lng],10,{duration:1.2});show(x)}}document.getElementById('searchBtn').onclick=search;document.getElementById('q').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
const teacherCard=document.getElementById('teacherCard');
document.getElementById('joinBtn').onclick=()=>{teacherCard.classList.add('open');document.getElementById('worldCard').classList.add('hidden')};
document.getElementById('teacherClose').onclick=()=>teacherCard.classList.remove('open');
document.getElementById('teachersChip').onclick=(e)=>{e.stopPropagation();teacherCard.classList.add('open');document.querySelectorAll('.chips button').forEach(x=>x.classList.remove('active'));document.getElementById('teachersChip').classList.add('active')};

const translations={
en:{tagline:'THE GLOBAL MAP OF SPANISH TEACHING',searchPlaceholder:'Search for a country, city, institution or teacher…',search:'Search',topExplore:'Explore',menu:'Menu',all:'▦ All',school:'▣ Schools',university:'◆ Universities',language:'● Language Schools',association:'● Associations',teachers:'● Teachers',more:'More',add:'Add place',teacherCta:'Put yourself on the map',eyebrow:'SPANISH TEACHING WORLDWIDE',headline:'Explore a world<br>connected by Spanish.',desc:'Discover schools, universities, language centres and professional communities teaching Spanish around the globe.',institutions:'institutions',countries:'countries',growth:'A growing community',atlasTeachers:'ATLAS teachers',exploreMap:'Explore the map ↓',teacherHeart:'TEACHERS ARE THE HEART OF ATLAS ELE',put:'Put yourself<br>on the map.',teacherDesc:'Are you a Spanish teacher? Join the global community and choose how you want to appear: by institution, city, country — or stay private.',privacy:'🔒 Your email will never appear publicly.',registration:'Teacher registration coming next →',mapped:'mapped',community:'Community-powered',legend:['School','University','Language school','Association','Teacher'],moreItems:['Official institutions','Instituto Cervantes','Publishers','Teacher training','Communities','Events & conferences','ELE projects'],visit:'Visit institution ↗',publicProfile:'Public ATLAS ELE profile. Private/internal contact information is not exposed.',verified:'✓ Verified',demo:'≈ Demo location'},
es:{tagline:'EL MAPA MUNDIAL DE LA ENSEÑANZA DEL ESPAÑOL',searchPlaceholder:'Busca un país, ciudad, institución o profesor…',search:'Buscar',topExplore:'Explorar',menu:'Menú',all:'▦ Todo',school:'▣ Colegios',university:'◆ Universidades',language:'● Academias',association:'● Asociaciones',teachers:'● Profesores',more:'Más',add:'Añadir centro',teacherCta:'Ponte en el mapa',eyebrow:'LA ENSEÑANZA DEL ESPAÑOL EN EL MUNDO',headline:'Explora un mundo<br>conectado por el español.',desc:'Descubre colegios, universidades, academias y comunidades profesionales que enseñan español en todo el mundo.',institutions:'instituciones',countries:'países',growth:'Una comunidad en crecimiento',atlasTeachers:'profesores ATLAS',exploreMap:'Explorar el mapa ↓',teacherHeart:'LOS PROFESORES SON EL CORAZÓN DE ATLAS ELE',put:'Ponte<br>en el mapa.',teacherDesc:'¿Eres profesor de español? Únete a la comunidad global y decide cómo quieres aparecer: por institución, ciudad, país o de forma privada.',privacy:'🔒 Tu correo electrónico nunca aparecerá públicamente.',registration:'Registro de profesores próximamente →',mapped:'en el mapa',community:'Impulsado por la comunidad',legend:['Colegio','Universidad','Academia','Asociación','Profesor'],moreItems:['Instituciones oficiales','Instituto Cervantes','Editoriales','Formación de profesores','Comunidades','Eventos y congresos','Proyectos ELE'],visit:'Visitar institución ↗',publicProfile:'Perfil público de ATLAS ELE. La información de contacto privada o interna no se muestra.',verified:'✓ Verificado',demo:'≈ Ubicación aproximada'}
};
let currentLang=localStorage.getItem('atlasLang')||((navigator.language||'').toLowerCase().startsWith('es')?'es':'en');
function applyLanguage(lang){
 currentLang=lang;localStorage.setItem('atlasLang',lang);document.documentElement.lang=lang;const t=translations[lang];
 document.getElementById('tagline').textContent=t.tagline;document.getElementById('q').placeholder=t.searchPlaceholder;document.getElementById('searchBtn').textContent=t.search;
 document.getElementById('topExplore').textContent=t.topExplore;document.getElementById('menuLabel').textContent=t.menu;const ml=document.getElementById('moreLabel');if(ml)ml.textContent=t.more;
 const mainBtns=[...document.querySelectorAll('.chips > button, .chips > .moreWrap > #moreChip')];const labels=[t.all,t.school,t.university,t.language,t.association,t.teachers];labels.forEach((v,i)=>{if(mainBtns[i])mainBtns[i].innerHTML=v});
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
const typeColors={school:'#0878d1',university:'#7836ce',language:'#f38b20',association:'#16a66c',teacher:'#eb218e'};
function initGlobe(){
 if(globeInstance)return;
 const el=document.getElementById('globeView');
 globeInstance=Globe()(el)
  .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
  .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
  .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
  .pointsData(data)
  .pointLat(d=>d.lat).pointLng(d=>d.lng).pointColor(d=>typeColors[d.type]||'#0878d1')
  .pointAltitude(.018).pointRadius(.42)
  .pointLabel(d=>'<div class="globe-tooltip"><b>'+d.name+'</b><small>📍 '+d.city+', '+d.country+'<br>🇪🇸 '+d.program+'</small></div>')
  .onPointClick(d=>show(d));
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
  const spain=(window.ATLAS_SPAIN||[]).map(a=>({id:a[0],name:a[1],type:a[2],city:a[3],country:a[4],lat:a[5],lng:a[6],web:a[7]||'',verified:a[8],precision:'city',program:'Spanish / ELE'}));
  const central=(window.ATLAS_CENTRAL||[]).map(a=>({id:a[0],name:a[1],type:a[2],city:a[3],country:a[4],lat:a[5],lng:a[6],web:a[7]||'',verified:a[8],precision:'city',program:'Spanish / ELE'}));
  const byId=new Map();pilot.forEach(x=>byId.set(x.id,x));spain.forEach(x=>byId.set(x.id,x));central.forEach(x=>byId.set(x.id,x));data=[...byId.values()];
  render();
  const hs=document.querySelectorAll('.headlineStats strong');if(hs[0])hs[0].textContent=data.length.toLocaleString();if(hs[1])hs[1].textContent=new Set(data.map(x=>x.country)).size;
  const ms=document.querySelectorAll('.mini-stats strong');if(ms[0])ms[0].textContent=data.length.toLocaleString();if(ms[1])ms[1].textContent=new Set(data.map(x=>x.country)).size;
  if(globeInstance)globeInstance.pointsData(data);
 }catch(e){console.error('ATLAS ELE data load failed',e)}
}
loadPublicMapData();
