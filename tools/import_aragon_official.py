#!/usr/bin/env python3
"""Conservative bulk import from Government of Aragón official geospatial school dataset.
Only new, individually located private/concertado school sites with an official URL.
The government's coordinates are cross-validated against its independent ETRS89 UTM fields.
All ambiguous/incomplete rows are logged as pending instead of published.
"""
from __future__ import annotations
import collections,csv,io,json,math,re,unicodedata,urllib.request,urllib.parse
from pathlib import Path
from pyproj import Transformer, Geod

SOURCE="https://opendata.aragon.es/GA_OD_Core/download?resource_id=167&formato=csv"
OUT=Path("data/spain-verified-aragon-20261104-bulk.js")
AUDIT=Path("audits/aragon-bulk-20261104-audit.json")
EXISTING=Path("audits/aragon-existing-map-data.json")
HTML=Path("index.html")
SNIPPET="<script src='data/spain-verified-aragon-20261104-bulk.js'></script>"
transformer=Transformer.from_crs("EPSG:25830","EPSG:4326",always_xy=True)
geod=Geod(ellps="WGS84")
def norm(v):
    s=unicodedata.normalize("NFKD",str(v or "")).lower()
    s="".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]","",s)
def host(url):
    try:return (urllib.parse.urlparse(url).hostname or "").removeprefix("www.").lower()
    except (TypeError,ValueError):return ""
def official_web(value):
    u=str(value or "").strip().split()[0] if str(value or "").strip() else ""
    if not u:return ""
    if u.startswith("//"):u="https:"+u
    if "://" not in u:u="https://"+u
    try:
        p=urllib.parse.urlparse(u)
        if p.scheme not in ("http","https") or not p.hostname or "." not in p.hostname:return ""
        if p.username or p.password or p.hostname.lower() in ("facebook.com","www.facebook.com","google.com","twitter.com","x.com"):return ""
        return u
    except ValueError:return ""
def parse_float(value):
    try:return float(str(value).strip().replace(",","."))
    except (ValueError,TypeError):return None
def row_key(name,city,country="Spain"):return (norm(name),norm(city),norm(country))
def addr_key(address,city,country="Spain"):
    # Compare street+number independent of postcode in existing records.
    street=address.split(",")[0]
    return (norm(street),norm(city),norm(country))
def reject(log,why,row):
    log[why]+=1
    return False
def main():
    request=urllib.request.Request(SOURCE,headers={"User-Agent":"ATLAS-ELE-Official-Centres/1.0","Accept":"text/csv"})
    with urllib.request.urlopen(request,timeout=90) as response:
        raw=response.read(20000000)
        if response.status!=200:raise RuntimeError("Official source HTTP != 200")
    text=raw.decode("utf-8-sig")
    src=list(csv.DictReader(io.StringIO(text)))
    if not src or not ({"idcentrorc","nombre_cen","naturaleza","direccion","codpostal","localidad","latitud","longitud","coordx","coordy","web"}<=set(src[0])):
        raise RuntimeError("Unexpected official data schema: abort, never guess")
    old=json.loads(EXISTING.read_text(encoding="utf8"))
    seen_id=set();seen_name=set();seen_address=set();seen_host=set()
    for r in old:
        if not isinstance(r,list) or len(r)<8:continue
        rid,n,t,city,country,lat,lon,web=r[:8]
        if norm(rid):seen_id.add(norm(rid))
        if norm(n):seen_name.add(row_key(n,city,country))
        if len(r)>9 and r[9]:seen_address.add(addr_key(str(r[9]),city,country))
        if host(web):seen_host.add((host(web),norm(city),norm(country)))
    accepted=[];reasons=collections.Counter();candidates=0
    seen_official=set()
    for r in src:
        nature=norm(r.get("naturaleza"))
        if not any(k in nature for k in ("privad","concertad")):continue
        kind=norm(r.get("tipo_centr"))
        if not any(w in kind for w in ("colegio","primaria","secundaria","bachillerato","educacionespecial","internacional","britanico","liceo")):
            reasons["not_school_level"]+=1;continue
        if ("infantil" in kind and not any(w in kind for w in ("primaria","secundaria","bachillerato","colegio"))):
            reasons["infant_only"]+=1;continue
        candidates+=1
        code=str(r.get("idcentrorc") or "").strip()
        name=str(r.get("nombre_cen") or "").strip()
        city=str(r.get("localidad") or "").strip()
        street=str(r.get("direccion") or "").strip()
        postal=str(r.get("codpostal") or "").strip()
        web=official_web(r.get("web"))
        if not re.fullmatch(r"\d{7,9}",code) or not name or not city or len(street)<5 or not re.fullmatch(r"\d{5}",postal):
            reasons["identity_or_address_incomplete"]+=1;continue
        if not web:reasons["official_website_missing"]+=1;continue
        if code in seen_official:reasons["duplicate_source_code"]+=1;continue
        seen_official.add(code)
        lat=parse_float(r.get("latitud"));lon=parse_float(r.get("longitud"))
        utmx=parse_float(r.get("coordx"));utmy=parse_float(r.get("coordy"))
        if None in (lat,lon,utmx,utmy) or not (39.7<lat<43.8 and -2.5<lon<1.1):
            reasons["missing_or_outside_region_coordinates"]+=1;continue
        if not (550000<utmx<825000 and 4400000<utmy<4800000):
            reasons["utm_coordinates_unplausible"]+=1;continue
        project_lon,project_lat=transformer.transform(utmx,utmy)
        _,_,distance=geod.inv(lon,lat,project_lon,project_lat)
        if not math.isfinite(distance) or distance>100:
            reasons["conflicting_gov_utm_vs_lonlat"]+=1;continue
        rid="ES-AR-"+code
        address=street+", "+postal+" "+city+", Aragón, España"
        h=host(web);nk=row_key(name,city);ak=addr_key(street,city);hk=(h,norm(city),norm("Spain"))
        if norm(rid) in seen_id or nk in seen_name or ak in seen_address or hk in seen_host:
            reasons["already_exists_or_ambiguous_same_campus"]+=1;continue
        # An address-level coordinate must be corroborated by both governmental coordinate systems.
        accepted.append([rid,name,"school",city,"Spain",round(lat,8),round(lon,8),web,True,address,"address",SOURCE])
        seen_id.add(norm(rid));seen_name.add(nk);seen_address.add(ak);seen_host.add(hk)
    report={
       "source":SOURCE,"source_total":len(src),"private_concertado_school_candidates":candidates,
       "existing_index_records_inspected":len(old),"accepted":len(accepted),
       "pending_by_reason":dict(sorted(reasons.items())),
       "method":"Official Aragón CSV; private school; campus address+postcode+school website present; UTM EPSG:25830 vs WGS84 within 100 m; cross-map ID/name/address/site dedup.",
       "accepted_ids":[r[0] for r in accepted],
       "not_an_independent_evaluation_of_spanish_teaching":True
    }
    AUDIT.parent.mkdir(exist_ok=True)
    AUDIT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    Path("audits/aragon-bulk-20261104-candidates.json").write_text(json.dumps(accepted,ensure_ascii=False),encoding="utf8")
    print(json.dumps({k:v for k,v in report.items() if k!="accepted_ids"},ensure_ascii=False),flush=True)
    if not accepted:print("NO APPROVED NEW RECORDS; no changes made");return
    OUT.write_text("// Government of Aragón geospatial centre registry (CC BY 4.0), downloaded and validated on 2026-11-04.\n// Campus WGS84 and EPSG:25830 UTM coordinates agree within 100 metres; only private/concertado schools.\n// Address and web from official dataset; no municipal centroids.\nwindow.ATLAS_VERIFIED_SPAIN_20261027=window.ATLAS_VERIFIED_SPAIN_20261027||[];\nwindow.ATLAS_VERIFIED_SPAIN_20261027.push(..."+json.dumps(accepted,ensure_ascii=False,separators=(",",":"))+");\n",encoding="utf8")
    index=HTML.read_text(encoding="utf8")
    if SNIPPET not in index:
        anchor="<script src='data/recovery-20261006.js"
        if index.count(anchor)!=1:raise RuntimeError("HTML script anchor missing/multiple")
        index=index.replace(anchor,SNIPPET+anchor)
        HTML.write_text(index,encoding="utf8")
    print("PREPARED",len(accepted),"OFFICIAL ENTRIES; not yet published",flush=True)
if __name__=="__main__":main()
