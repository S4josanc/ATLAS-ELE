const data=[
{name:'Barking Abbey School',type:'school',city:'London',country:'England',lat:51.536,lng:0.081,program:'Spanish GCSE',verified:true,web:'https://www.barkingabbeyschool.co.uk/'},
{name:'Vienna International School',type:'school',city:'Vienna',country:'Austria',lat:48.235,lng:16.42,program:'Spanish · Secondary',verified:true,web:'https://www.vis.ac.at/'},
{name:'Comenius University — Romance Studies',type:'university',city:'Bratislava',country:'Slovakia',lat:48.1486,lng:17.1077,program:'Spanish / Hispanic Studies',verified:true,web:'https://fphil.uniba.sk/krom/'},
{name:'Bilingválne gymnázium Žilina',type:'school',city:'Žilina',country:'Slovakia',lat:49.223,lng:18.739,program:'Spanish bilingual programme',verified:true,web:'https://gbza.eu/'},
{name:'TU Berlin — ZEMS',type:'university',city:'Berlin',country:'Germany',lat:52.52,lng:13.405,program:'Spanish courses',verified:true,web:'https://www.tu.berlin/en/zems/academics-teaching/spanish'},
{name:'Suomen espanjanopettajat ry',type:'association',city:'Helsinki',country:'Finland',lat:60.17,lng:24.94,program:'Spanish teachers association',verified:true,web:'https://www.suomenespanjanopettajat.fi/'},
{name:'FIAPE',type:'association',city:'Madrid',country:'International',lat:40.4168,lng:-3.7038,program:'International federation of Spanish teacher associations',verified:true,web:'https://fiape.org/'},
{name:'University of Debrecen — Spanish Studies',type:'university',city:'Debrecen',country:'Hungary',lat:47.5316,lng:21.6273,program:'Spanish Studies',verified:true,web:'https://www.unideb.hu/'},
{name:'AATSP',type:'association',city:'United States',country:'United States',lat:38.9,lng:-77.04,program:'Teachers of Spanish and Portuguese',verified:true,web:'https://www.aatsp.org/'},
{name:'Instituto bilingüe G.S. Rakovski',type:'school',city:'Burgas',country:'Bulgaria',lat:42.5048,lng:27.4626,program:'Spanish bilingual section',verified:true,web:''},
{name:'Spanish language centre',type:'language',city:'Paris',country:'France',lat:48.8566,lng:2.3522,program:'Spanish language courses',verified:false,web:''},
{name:'Spanish language centre',type:'language',city:'Rome',country:'Italy',lat:41.9028,lng:12.4964,program:'Spanish language courses',verified:false,web:''},
{name:'Spanish language centre',type:'language',city:'Warsaw',country:'Poland',lat:52.2297,lng:21.0122,program:'Spanish language courses',verified:false,web:''},
{name:'Spanish programme',type:'school',city:'New York',country:'United States',lat:40.7128,lng:-74.006,program:'Spanish programme',verified:false,web:''},
{name:'Spanish programme',type:'school',city:'Los Angeles',country:'United States',lat:34.0522,lng:-118.2437,program:'Spanish programme',verified:false,web:''}
];
const map=L.map('map',{zoomControl:true,worldCopyJump:true}).setView([45,8],4);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map);
let filter='all',markers=[];const panel=document.getElementById('panel'),detail=document.getElementById('detail');
function icon(type){const c={school:'#0c72b8',university:'#7557c9',language:'#e69032',association:'#31a47c'}[type]||'#0c72b8';return L.divIcon({className:'',html:"<div class='atlas-marker' style='width:20px;height:20px;background:"+c+"'></div>",iconSize:[20,20]})}
function render(){markers.forEach(m=>map.removeLayer(m));markers=[];const shown=data.filter(x=>filter==='all'||x.type===filter);shown.forEach(x=>{let m=L.marker([x.lat,x.lng],{icon:icon(x.type)}).addTo(map).on('click',()=>show(x));markers.push(m)});document.getElementById('count').textContent='5,338';document.getElementById('countries').textContent='20+'}
function show(x){detail.innerHTML=`<div class='detail'><span class='tag'>${x.type}</span><h2>${x.name}</h2><div class='meta'>📍 ${x.city}, ${x.country}</div><span class='pill'>🇪🇸 ${x.program}</span><span class='pill'>${x.verified?'✓ Verified':'≈ Demo location'}</span><p style='color:#66768a;line-height:1.5'>Public ATLAS ELE profile. Private/internal contact information is not exposed.</p>${x.web?`<a class='website' target='_blank' href='${x.web}'>Visit institution ↗</a>`:''}</div>`;panel.style.display='block'}
document.querySelectorAll('.chips button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chips button').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;render()});
document.getElementById('close').onclick=()=>panel.style.display='none';document.getElementById('explore').onclick=()=>{document.getElementById('worldCard').classList.add('hidden');map.flyTo([46,8],5,{duration:1.2})};map.on('zoomstart',()=>document.getElementById('worldCard').classList.add('hidden'));
function search(){const q=document.getElementById('q').value.toLowerCase().trim();if(!q)return;const x=data.find(x=>[x.name,x.city,x.country].some(v=>v.toLowerCase().includes(q)));if(x){map.flyTo([x.lat,x.lng],10,{duration:1.2});show(x)}}document.getElementById('searchBtn').onclick=search;document.getElementById('q').addEventListener('keydown',e=>{if(e.key==='Enter')search()});render();
const teacherCard=document.getElementById('teacherCard');
document.getElementById('joinBtn').onclick=()=>{teacherCard.classList.add('open');document.getElementById('worldCard').classList.add('hidden')};
document.getElementById('teacherClose').onclick=()=>teacherCard.classList.remove('open');
document.getElementById('teachersChip').onclick=(e)=>{e.stopPropagation();teacherCard.classList.add('open');document.querySelectorAll('.chips button').forEach(x=>x.classList.remove('active'));document.getElementById('teachersChip').classList.add('active')};
