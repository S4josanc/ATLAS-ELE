#!/usr/bin/env python3
"""2026 official private/concertado school campuses in Catalonia and Valencia.
Input comes directly from the government directories; no inferred geolocations
or filler websites. Exclude all ambiguous sites and maintain the original IDs.
"""
import collections,csv,io,json,math,re,urllib.parse,urllib.request
from pathlib import Path
from import_madrid_castile_official import norm,number,website,host,addr_key,name_key,distinct_coordinate
CAT="https://analisi.transparenciacatalunya.cat/resource/kvmv-ahh4.json"
VAL="https://terramapas.icv.gva.es/12_Centros_wfs?request=GetFeature&service=WFS&version=2.0.0&typename=CentrosDocentesRegimen&outputformat=csv"
OUT=Path("data/spain-verified-cat-val-20261104.js")
REPORT=Path("audits/cat-val-20261104-report.json")
CAND=Path("audits/cat-val-20261104-accepted.json")
EXISTING=Path("audits/aragon-existing-map-data.json")
HTML=Path("index.html")
TAG="<script src='data/spain-verified-cat-val-20261104.js'></script>"
def get(url,maxbytes):
 req=urllib.request.Request(url,headers={"User-Agent":"ATLAS-ELE-2026-Verified-Official-Campus-Import/1.0"})
 with urllib.request.urlopen(req,timeout=135) as response:
  if response.status!=200:raise RuntimeError(f"official source HTTP {response.status}")
  data=response.read(maxbytes+1)
  if len(data)>maxbytes:raise RuntimeError("source exceeds safe bound "+url)
  return data
def httpurl(value):
 return website(value)
def postalok(s):
 return bool(re.fullmatch(r"\d{5}",str(s).strip()))
def schoollevels(row):
 # The certified directory's fields indicate actual primary or secondary education.
 return any(str(row.get(k) or "").strip().lower() not in ("","0","false","no") for k in ("epri","eso","batx"))
def normstreet(s):
 return norm(str(s).split(",")[0])
def main():
 old=json.loads(EXISTING.read_text(encoding="utf8"))
 ids=set();names=set();addresses=set();webs=set();coords=[]
 for a in old:
  if not isinstance(a,list) or len(a)<8:continue
  rid,name,typ,city,country,lat,lon,url=a[:8]
  ids.add(norm(rid));names.add(name_key(name,city,country))
  if len(a)>9 and a[9]:addresses.add((normstreet(a[9]),norm(city),norm(country)))
  if host(url):webs.add((host(url),norm(city),norm(country)))
  if len(a)>10 and a[10] in ("exact","address") and isinstance(lat,(int,float)) and isinstance(lon,(int,float)):
   coords.append((lat,lon,city))
 accepted=[];counts=collections.Counter();pending=collections.Counter();samples=collections.defaultdict(list)
 def reject(region,reason,code,name):
  pending[region+":"+reason]+=1
  if len(samples[reason])<8:samples[reason].append([region,code,name])
 def consider(region,code,name,city,postal,street,lat,lon,web,source):
  code=str(code or "").strip();name=str(name or "").strip();city=str(city or "").strip()
  postal=str(postal or "").strip();street=str(street or "").strip()
  if not re.fullmatch(r"\d{8}",code) or not name or not city or not postalok(postal) or len(normstreet(street))<6:
   reject(region,"missing_name_address_code",code,name);return
  if (not isinstance(lat,(int,float)) or not isinstance(lon,(int,float)) or
      not math.isfinite(lat) or not math.isfinite(lon) or
      not (37.0<lat<43.0 and -2.0<lon<3.6)):
   reject(region,"missing_or_outside_coordinates",code,name);return
  if region=="cat" and not(40.4<lat<42.95 and 0.0<lon<3.4):
   reject(region,"outside_catalonia",code,name);return
  if region=="val" and not(37.5<lat<41.0 and -1.75<lon<1.0):
   reject(region,"outside_valencia",code,name);return
  web=httpurl(web)
  if not web:
   reject(region,"missing_school_website",code,name);return
  rid="ES-"+("CT" if region=="cat" else "VC")+"-"+code
  nk=name_key(name,city);ak=(normstreet(street),norm(city),norm("Spain"));wk=(host(web),norm(city),norm("Spain"))
  if norm(rid) in ids or nk in names or ak in addresses or wk in webs:
   reject(region,"duplicated_existing_or_shared_school_domain",code,name);return
  if not distinct_coordinate(lat,lon,coords,city):
   reject(region,"same_verified_site_coordinate",code,name);return
  address=f"{street}, {postal} {city}, "+("Catalunya" if region=="cat" else "Comunitat Valenciana")+", España"
  a=[rid,name,"school",city,"Spain",round(lat,7),round(lon,7),web,True,address,"address",source]
  accepted.append(a)
  ids.add(norm(rid));names.add(nk);addresses.add(ak);webs.add(wk);coords.append((lat,lon,city))
  counts[region+":accepted"]+=1
 # Socrata current academic year, not historical repetitions.
 latest_url=CAT+"?"+urllib.parse.urlencode({"$select":"curs,count(*) as total","$group":"curs","$order":"curs DESC","$limit":3})
 years=json.loads(get(latest_url,1000000));latest=str(years[0]["curs"])
 if not latest.startswith("2026/"):raise RuntimeError("Unexpected Catalonia academic year: "+latest)
 url=CAT+"?"+urllib.parse.urlencode({"$where":"curs='"+latest+"'","$limit":15000})
 cat=json.loads(get(url,26000000))
 if len(cat)<5000:raise RuntimeError("Catalonia directory unexpectedly small")
 if len({str(x.get("codi_centre")) for x in cat})!=len(cat):raise RuntimeError("Catalonia 2026 codes repeat: reject whole batch")
 for r in cat:
  if norm(r.get("nom_naturalesa"))!="privat":continue
  if not schoollevels(r):continue
  counts["cat:priority_candidates"]+=1
  consider("cat",r.get("codi_centre"),r.get("denominaci_completa"),
   r.get("nom_municipi"),r.get("codi_postal"),r.get("adre_a"),
   number(r.get("coordenades_geo_y")),number(r.get("coordenades_geo_x")),r.get("url"),
   "https://analisi.transparenciacatalunya.cat/d/kvmv-ahh4")
 # Use GVA's geospatial WFS rather than postcode/city centroids.
 b=get(VAL,14000000)
 try:t=b.decode("utf-8-sig")
 except UnicodeError:t=b.decode("cp1252")
 try:delimiter=csv.Sniffer().sniff(t[:15000],delimiters=",;\t").delimiter
 except csv.Error:delimiter=";"
 val=list(csv.DictReader(io.StringIO(t),delimiter=delimiter))
 if len(val)<3000:raise RuntimeError("Valencia map directory unexpectedly small")
 valid_ids=collections.Counter(str(x.get("codcen") or "").strip() for x in val if str(x.get("desc_estado") or "").strip().upper()=="ALTA")
 for r in val:
  if norm(r.get("regimen")) not in ("privado","concertado"):continue
  if str(r.get("desc_estado") or "").strip().upper()!="ALTA":continue
  gen=norm(r.get("dgenerica_cas"))
  if not any(term in gen for term in ("educacionprimaria","educacionsecundaria","bachillerato","colegio")):continue
  counts["val:priority_candidates"]+=1
  code=str(r.get("codcen") or "").strip()
  if valid_ids[code]>1:
   reject("val","multiple_active_sites_same_code",code,r.get("despecifica"));continue
  consider("val",code,r.get("despecifica") or r.get("dlibre"),
   r.get("localidad_oficial") or r.get("noms_mun"),r.get("codpos"),
   r.get("direccion"),number(r.get("latitud")),number(r.get("longitud")),
   r.get("web"),VAL)
 REPORT.parent.mkdir(exist_ok=True)
 report={"date":"2026-11-04","academic_year":latest,"sources":[CAT,VAL],
  "official_source_records":{"catalonia":len(cat),"valencia_wfs":len(val)},
  "all_map_source_rows_indexed":len(old),"candidate_counts":dict(counts),
  "accepted_source_rows":len(accepted),"pending_reasons":dict(pending),
  "pending_examples":dict(samples),
  "policy":"Only currently indexed private/concertado schools offering primary/secondary education, with eight-digit official centre code, complete street and postcode, institutional website, and government campus coordinates. Conservative cross-map and within-batch checks. Missing or ambiguous records excluded. Not a certification of older unrelated map records."}
 REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
 CAND.write_text(json.dumps(accepted,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
 print("BULK QUALITY",json.dumps({k:v for k,v in report.items() if k not in ("pending_examples",)},ensure_ascii=False),flush=True)
 if len(accepted)==0:
  print("NOTHING ELIGIBLE; no publication");return
 OUT.write_text("// Official Catalonia 2026/27 and Valencia government geographic school directories. Verified private/concertado site-level addresses, school websites and coordinates.\nwindow.ATLAS_VERIFIED_SPAIN_20261027=window.ATLAS_VERIFIED_SPAIN_20261027||[];\nwindow.ATLAS_VERIFIED_SPAIN_20261027.push(..."+json.dumps(accepted,ensure_ascii=False,separators=(",",":"))+");\n",encoding="utf8")
 html=HTML.read_text(encoding="utf8")
 if TAG not in html:
  anchor="<script src='data/recovery-20261006.js"
  if html.count(anchor)!=1:raise RuntimeError("Unknown loader location: do not publish")
  HTML.write_text(html.replace(anchor,TAG+anchor),encoding="utf8")
 print("STAGED EXACT PRIVATE SCHOOL CANDIDATES",len(accepted),flush=True)
if __name__=="__main__":main()
