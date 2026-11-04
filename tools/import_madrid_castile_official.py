#!/usr/bin/env python3
"""Conservative batch of private/concertado/international school campuses from
the official 2026 Madrid and Castilla y León non-university school directories.
Only active, unique school sites with complete postal address, official website,
and government geospatial coordinates. Never synthesize coordinates.
Review candidates are excluded, not counted.
"""
from __future__ import annotations
import csv,io,json,math,re,unicodedata,urllib.parse,urllib.request,collections
from pathlib import Path
from pyproj import Transformer, Geod
SOURCE_MADRID="https://datos.comunidad.madrid/dataset/c750856d-3166-4dac-8e80-d1b824c968b5/resource/28d60557-1d73-4281-ab08-6cfd3b2f5f83/download/centros_educativos.csv"
SOURCE_CYL="https://datosabiertos.jcyl.es/web/jcyl/risp/es/educacion/centrosdocentes/1284200521439.csv"
OUT=Path("data/spain-verified-regional-20261104.js")
AUDIT=Path("audits/regional-20261104-quality-report.json")
CAND=Path("audits/regional-20261104-accepted.json")
EXISTING=Path("audits/aragon-existing-map-data.json")
HTML=Path("index.html")
TAG="<script src='data/spain-verified-regional-20261104.js'></script>"
TRANSFORM=Transformer.from_crs("EPSG:25830","EPSG:4326",always_xy=True)
GEO=Geod(ellps="WGS84")
def norm(value):
    s=unicodedata.normalize("NFKD",str(value or "")).lower()
    return re.sub(r"[^a-z0-9]","", "".join(x for x in s if not unicodedata.combining(x)))
def website(value):
    s=str(value or "").strip().replace("\u200b","")
    if not s or any(x in s for x in [" ","@","<",">",";","\\"]):return ""
    if s.startswith("//"):s="https:"+s
    if "://" not in s:s="https://"+s
    try:
        p=urllib.parse.urlparse(s)
        host=(p.hostname or "").lower().removeprefix("www.")
        if p.scheme not in ("http","https") or not host or "." not in host or p.username or p.password:return ""
        if host in ("facebook.com","instagram.com","twitter.com","x.com","maps.google.com","google.com") or host.endswith(".facebook.com"):return ""
        return s
    except ValueError:return ""
def host(value):
    try:return (urllib.parse.urlparse(str(value or "")).hostname or "").lower().removeprefix("www.")
    except (ValueError,TypeError):return ""
def number(value):
    try:
        s=str(value).strip()
        if s.lower() in ("", "none","nan","null"):return None
        x=float(s.replace(",","."))
        return x if math.isfinite(x) else None
    except (ValueError,TypeError):return None
def read_csv(url):
    req=urllib.request.Request(url,headers={"User-Agent":"ATLAS-ELE-Official-Regional-Campus-Verification/1.0","Accept":"text/csv,*/*"})
    with urllib.request.urlopen(req,timeout=120) as response:
        if response.status!=200:raise RuntimeError("Source HTTP failure "+url)
        b=response.read(18000000)
    if len(b)<100000:raise RuntimeError("Official CSV looks truncated")
    text=None
    for encoding in ("utf-8-sig","utf-8","cp1252","latin1"):
        try:text=b.decode(encoding);break
        except UnicodeError:pass
    try:sep=csv.Sniffer().sniff(text[:10000],delimiters=",;\t").delimiter
    except csv.Error:sep=";"
    rows=list(csv.DictReader(io.StringIO(text),delimiter=sep))
    if len(rows)<1000:raise RuntimeError("Official source has unexpectedly few rows")
    return rows
def addr_key(street,city,country="Spain"):
    return (norm(str(street).split(",")[0]),norm(city),norm(country))
def name_key(name,city,country="Spain"):
    return (norm(name),norm(city),norm(country))
def within_utm(x,y):
    return 250000<x<700000 and 4200000<y<4700000
def distinct_coordinate(lat,lon,known,city):
    # Reject close collocations where recorded school buildings look
    # like duplicate campuses, rather than creating a second physical site.
    for oldlat,oldlon,oldcity in known:
        if norm(oldcity)!=norm(city):continue
        _,_,meters=GEO.inv(oldlon,oldlat,lon,lat)
        if abs(meters)<8:return False
    return True
def school_type(raw):
    t=norm(raw)
    if "educacionespecial" in t or "educacionespecial" in t:return True
    if "extranjer" in t and "espana" in t:return True
    return any(s in t for s in ("primaria","secundaria","bachillerato","colegio","institutointernacional"))
def run():
    madrid=read_csv(SOURCE_MADRID);cyl=read_csv(SOURCE_CYL)
    if not({"CODIGO","CENTRO","TITULARIDAD","TIPO_EXT","CDTPVIA","DOMICILIO","NMVIAL","CDPOSTAL","MUNICIPIO","UTM_X","UTM_Y","WEB","SITUACIÓN"}<=madrid[0].keys()):raise RuntimeError("Madrid header mismatch")
    if not({"CÓDIGO","NATURALEZA","DENOMINACIÓN GENÉRICA","DENOMINACIÓN ESPECÍFICA","VÍA","NOMBRE DE LA VÍA","NÚMERO","NÚMERO(EXT)","LOCALIDAD","C.POSTAL","WEB","COORD. LATITUD","COORD. LONGITUD","SITUACIÓN"}<=cyl[0].keys()):raise RuntimeError("Castilla header mismatch")
    old=json.loads(EXISTING.read_text(encoding="utf-8"))
    existing_ids=set();existing_names=set();existing_addresses=set();existing_web_hosts=set()
    known_coords=[]
    for r in old:
        if not isinstance(r,list) or len(r)<8:continue
        rid,name,kind,city,country,lat,lon,url=r[:8]
        existing_ids.add(norm(rid))
        existing_names.add(name_key(name,city,country))
        if len(r)>9 and r[9]:existing_addresses.add(addr_key(r[9],city,country))
        if host(url):existing_web_hosts.add((host(url),norm(city),norm(country)))
        if len(r)>10 and r[10] in ("address","exact") and isinstance(lat,(int,float)) and isinstance(lon,(int,float)):
            known_coords.append((lat,lon,city))
    accepted=[];reasons=collections.Counter();counts=collections.Counter()
    samples=collections.defaultdict(list)
    def pending(reason,source,rid,name):
        reasons[source+":"+reason]+=1
        if len(samples[reason])<12:samples[reason].append({"source":source,"code":rid,"name":name})
    def evaluate(source,rid,name,city,postal,street,lat,lon,web):
        if not re.fullmatch(r"\d{8}",rid) or not name or not city or not re.fullmatch(r"\d{5}",postal) or len(street)<7:
            pending("missing_identity_or_postal_address",source,rid,name);return
        if len(norm(street))<5:
            pending("ambiguous_street",source,rid,name);return
        if not web:
            pending("no_official_website",source,rid,name);return
        if lat is None or lon is None or not (39.0<lat<43.5 and -7.8<lon<-2.7):
            pending("invalid_or_missing_campus_coordinates",source,rid,name);return
        id="ES-"+("MD" if source=="madrid" else "CYL")+"-"+rid
        nk=name_key(name,city);ak=addr_key(street,city);wk=(host(web),norm(city),norm("Spain"))
        if norm(id) in existing_ids or nk in existing_names or ak in existing_addresses or wk in existing_web_hosts:
            pending("duplicate_or_ambiguous_existing_campus",source,rid,name);return
        if not distinct_coordinate(lat,lon,known_coords,city):
            pending("same_coordinates_as_another_verified_campus",source,rid,name);return
        address=f"{street}, {postal} {city}, "+("Comunidad de Madrid" if source=="madrid" else "Castilla y León")+", España"
        rec=[id,name,"school",city,"Spain",round(lat,7),round(lon,7),web,True,address,"address",SOURCE_MADRID if source=="madrid" else SOURCE_CYL]
        accepted.append(rec)
        existing_ids.add(norm(id));existing_names.add(nk);existing_addresses.add(ak);existing_web_hosts.add(wk)
        known_coords.append((lat,lon,city))
        counts[source+":accepted"]+=1
    for r in madrid:
        if str(r.get("SITUACIÓN") or "").strip().upper()!="ALTA" or "PRIVAD" not in str(r.get("TITULARIDAD") or "").upper():continue
        if not school_type(r.get("TIPO_EXT")):continue
        counts["madrid:school_candidates"]+=1
        rid=str(r.get("CODIGO") or "").strip()
        name=str(r.get("CENTRO") or "").strip()
        city=str(r.get("MUNICIPIO") or "").strip()
        postal=str(r.get("CDPOSTAL") or "").strip()
        street=" ".join(str(r.get(k) or "").strip() for k in ("CDTPVIA","DOMICILIO","NMVIAL")).strip()
        url=website(r.get("WEB"))
        x=number(r.get("UTM_X"));y=number(r.get("UTM_Y"))
        if x is None or y is None or not within_utm(x,y):
            pending("invalid_or_missing_utm", "madrid",rid,name);continue
        lon,lat=TRANSFORM.transform(x,y)
        if not (39.7<lat<41.3 and -4.8<lon<-2.8):
            pending("utm_outside_madrid_region","madrid",rid,name);continue
        evaluate("madrid",rid,name,city,postal,street,lat,lon,url)
    for r in cyl:
        if str(r.get("SITUACIÓN") or "").strip().upper()!="ALTA" or "PRIVAD" not in str(r.get("NATURALEZA") or "").upper():continue
        if not school_type(r.get("DENOMINACIÓN GENÉRICA")):continue
        counts["cyl:school_candidates"]+=1
        rid=str(r.get("CÓDIGO") or "").strip()
        name=str(r.get("DENOMINACIÓN ESPECÍFICA") or "").strip()
        city=str(r.get("LOCALIDAD") or "").strip()
        postal=str(r.get("C.POSTAL") or "").strip()
        num=str(r.get("NÚMERO") or "").strip() or str(r.get("NÚMERO(EXT)") or "").strip()
        street=" ".join([str(r.get("VÍA") or "").strip(),str(r.get("NOMBRE DE LA VÍA") or "").strip(),num]).strip()
        lat=number(r.get("COORD. LATITUD"));lon=number(r.get("COORD. LONGITUD"))
        if not (lat is not None and lon is not None and 40.0<lat<43.5 and -7.8<lon<-2.7):
            pending("missing_or_outside_region_coordinates","cyl",rid,name);continue
        evaluate("cyl",rid,name,city,postal,street,lat,lon,website(r.get("WEB")))
    AUDIT.parent.mkdir(parents=True,exist_ok=True)
    report={"sources":[SOURCE_MADRID,SOURCE_CYL],
            "official_source_rows":{"madrid":len(madrid),"cyl":len(cyl)},
            "existing_source_rows_indexed":len(old),
            "eligible_school_candidates":{"madrid":counts["madrid:school_candidates"],"cyl":counts["cyl:school_candidates"]},
            "accepted_validated_new_campuses":{"madrid":counts["madrid:accepted"],"cyl":counts["cyl:accepted"],"total":len(accepted)},
            "pending_by_reason":dict(reasons),
            "pending_examples":dict(samples),
            "validation":"Only active private schools (including concertados) with official 2026 center code, postal address, official institutional URL, regional government campus UTM or published lat/lon and strong duplication checks against every existing source. Each original ID preserved. No city centroids or guessed coordinates."}
    AUDIT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    CAND.write_text(json.dumps(accepted,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("QUALITY AUDIT",json.dumps({k:v for k,v in report.items() if k not in ("pending_examples",)},ensure_ascii=False),flush=True)
    if not accepted:print("NO ELIGIBLE NEW VERIFIED CAMPUS; no changes");return
    OUT.write_text("// Official Community of Madrid and Castilla y León 2026 school directories; active private/concertado school locations only.\n// Sites have postal addresses, institution websites, government UTM/lat-lon site positions, and conservative duplicate checks.\nwindow.ATLAS_VERIFIED_SPAIN_20261027=window.ATLAS_VERIFIED_SPAIN_20261027||[];\nwindow.ATLAS_VERIFIED_SPAIN_20261027.push(..."+json.dumps(accepted,ensure_ascii=False,separators=(",",":"))+");\n",encoding="utf8")
    html=HTML.read_text(encoding="utf8")
    if TAG not in html:
        anchor="<script src='data/recovery-20261006.js"
        if html.count(anchor)!=1:raise RuntimeError("Unknown HTML script structure: refuse to publish")
        HTML.write_text(html.replace(anchor,TAG+anchor),encoding="utf8")
    print("VERIFIED BULK FILE READY",len(accepted),flush=True)
if __name__=="__main__":run()
