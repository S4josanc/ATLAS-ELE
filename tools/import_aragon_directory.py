#!/usr/bin/env python3
"""Import verified private/concertado school campuses from the 2026 Aragón
government centre directory (full current CSV export with campus map links).
Evidence is additionally screened against the independent Aragón geospatial table
for code/postcode and site-coordinate discrepancies. Never infer locations.
"""
import collections,csv,io,json,math,re,ssl,urllib.request,urllib.parse,unicodedata
from pathlib import Path
from pyproj import Transformer,Geod

DIRECTORY="https://centrosdocentes.catedu.es/ee/php/export/export_centros.php?"
GEODATA="https://opendata.aragon.es/GA_OD_Core/download?resource_id=167&formato=csv"
OUT=Path("data/spain-verified-aragon-20261104-directory.js")
AUDIT=Path("audits/aragon-directory-20261104-report.json")
CAND=Path("audits/aragon-directory-20261104-candidates.json")
EXISTING=Path("audits/aragon-existing-map-data.json")
INDEX=Path("index.html")
TAG="<script src='data/spain-verified-aragon-20261104-directory.js'></script>"
geod=Geod(ellps="WGS84")
transform=Transformer.from_crs(25830,4326,always_xy=True)
def norm(v):
    s=unicodedata.normalize("NFKD",str(v or "")).lower()
    s="".join(x for x in s if not unicodedata.combining(x))
    return re.sub(r"[^a-z0-9]","",s)
def normal_street(v):
    s=str(v or "").lower().strip()
    s=re.sub(r"^\s*(?:c/|cl\.?|calle)\s*", "calle ",s)
    s=re.sub(r"^\s*(?:avda?\.?|avenida)\s*", "avenida ",s)
    s=re.sub(r"^\s*(?:paseo|pº?\.?)\s*", "paseo ",s)
    return norm(s.split(",")[0])
def host(value):
    try:return (urllib.parse.urlparse(value).hostname or "").removeprefix("www.").lower()
    except (ValueError,TypeError):return ""
def school_url(value):
    value=str(value or "").strip()
    if not value or any(x in value for x in ("@"," ","<",">")):return ""
    if value.startswith("//"):value="https:"+value
    if "://" not in value:value="https://"+value
    try:
        p=urllib.parse.urlparse(value)
        if p.scheme not in ("https","http") or not p.hostname or "." not in p.hostname:return ""
        if p.username or p.password or host(value) in ("facebook.com","google.com","instagram.com","x.com"):return ""
        return value
    except ValueError:return ""
def campus_coordinates(mapurl):
    p=urllib.parse.urlparse(str(mapurl or ""))
    if p.hostname not in ("google.com","www.google.com") or not p.path.startswith("/maps"):return None
    q=urllib.parse.parse_qs(p.query).get("q",[""])[0]
    match=re.fullmatch(r"\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*",q)
    if not match:return None
    lat,lon=map(float,match.groups())
    if not(39.7<lat<43.8 and -2.5<lon<1.1):return None
    if len(match.group(1).split(".")[-1])<4 or len(match.group(2).split(".")[-1])<4:return None
    return lat,lon
def csv_source(url,unsafe_tls=False):
    request=urllib.request.Request(url,headers={"User-Agent":"ATLAS-ELE-Audit/1.0","Accept":"text/csv"})
    context=ssl._create_unverified_context() if unsafe_tls else None
    with urllib.request.urlopen(request,timeout=100,context=context) as response:
        if response.status!=200:raise RuntimeError("Dataset returned non-200 HTTP")
        raw=response.read(15000000)
    if len(raw)<10000:raise RuntimeError("Dataset suspiciously small; abort")
    sample=raw.decode("utf-8-sig")
    delimiter=";" if sample.splitlines()[0].count(";")>sample.splitlines()[0].count(",") else ","
    return list(csv.DictReader(io.StringIO(sample),delimiter=delimiter))
def add_why(reasons,code):
    reasons[code]+=1
def main():
    records=csv_source(DIRECTORY,unsafe_tls=True)
    geo=csv_source(GEODATA)
    if not (len(records)>900 and {"naturaleza","codcentro","tipo_centro","nombre","direccion","cod_postal","localidad","web","emaps"}<=records[0].keys()):
        raise RuntimeError("Live government directory schema/record count unexpectedly changed: abort")
    if not (len(geo)>800 and {"idcentrorc","coordx","coordy","codpostal"}<=geo[0].keys()):
        raise RuntimeError("Independent government geospatial source changed: abort")
    geo_by_code={r["idcentrorc"].strip():r for r in geo if r.get("idcentrorc")}
    prior=json.loads(EXISTING.read_text(encoding="utf8"))
    ids=set();names=set();addresses=set();websites=set()
    for a in prior:
        if not isinstance(a,list) or len(a)<8:continue
        code,name,kind,city,country,lat,lon,web=a[:8]
        if norm(code):ids.add(norm(code))
        names.add((norm(name),norm(city),norm(country)))
        if len(a)>9 and a[9]:addresses.add((normal_street(str(a[9])),norm(city),norm(country)))
        if host(web):websites.add((host(web),norm(city),norm(country)))
    new=[];reasons=collections.Counter();skipped=[];school_candidates=0
    for r in records:
        nat=norm(r.get("naturaleza"))
        if nat not in ("privado","concertado"):continue
        kind=norm(r.get("tipo_centro"))
        if not any(x in kind for x in ("primaria","secundaria","educacionespecial","extranjeroenespana")):
            reasons["not_primary_secondary_special_or_international_school"]+=1;continue
        school_candidates+=1
        code=str(r.get("codcentro") or "").strip()
        name=str(r.get("nombre") or "").strip()
        city=str(r.get("localidad") or "").strip()
        street=str(r.get("direccion") or "").strip()
        postcode=str(r.get("cod_postal") or "").strip()
        site=school_url(r.get("web"))
        reason=""
        if not(re.fullmatch(r"\d{8}",code) and name and city and len(street)>=5 and re.fullmatch(r"\d{5}",postcode)):
            reason="incomplete_official_code_or_postal_address"
        elif not site:reason="missing_official_school_website"
        coords=campus_coordinates(r.get("emaps"))
        if not reason and not coords:reason="no_precise_official_campus_map_coordinate"
        # On overlapping codes, the independent geospatial table can reveal misplaced
        # current map pins, e.g. María Soriano is >600m discrepant; leave such rows pending.
        old=geo_by_code.get(code)
        if not reason and old:
            if old.get("codpostal","").strip()!=postcode:
                reason="postal_conflict_between_official_datasets"
            else:
                try:
                    ux=float(old["coordx"].replace(",","."));uy=float(old["coordy"].replace(",","."))
                    if not(550000<ux<825000 and 4400000<uy<4800000):
                        raise ValueError("outlier")
                    lon_proj,lat_proj=transform.transform(ux,uy)
                    _,_,meters=geod.inv(coords[1],coords[0],lon_proj,lat_proj)
                    if not math.isfinite(meters) or meters>150:reason="conflicting_official_campus_coordinates"
                except (TypeError,ValueError):reason="unverifiable_independent_geometry"
        rid="ES-AR-"+code
        nk=(norm(name),norm(city),norm("Spain"))
        ak=(normal_street(street),norm(city),norm("Spain"))
        wk=(host(site),norm(city),norm("Spain"))
        if not reason and (norm(rid) in ids or nk in names or ak in addresses or wk in websites):
            reason="already_present_or_possible_same_campus"
        if reason:
            add_why(reasons,reason)
            if len(skipped)<45:skipped.append({"code":code,"name":name,"reason":reason})
            continue
        address=f"{street}, {postcode} {city}, Aragón, España"
        lat,lon=coords
        new.append([rid,name,"school",city,"Spain",round(lat,8),round(lon,8),site,True,address,"address",DIRECTORY])
        ids.add(norm(rid));names.add(nk);addresses.add(ak);websites.add(wk)
    AUDIT.parent.mkdir(exist_ok=True)
    report={"official_directory_records":len(records),"independent_geodata_records":len(geo),"existing_source_rows_screened":len(prior),
            "private_concertado_eligible_schools":school_candidates,"new_validated_unique_campuses":len(new),
            "pending_by_reason":dict(reasons),"pending_examples":skipped,
            "accepted_ids":[a[0] for a in new],
            "source_url":DIRECTORY,"independent_source_url":GEODATA,
            "data_validation":"Current official 2026 contact and Google map lat/lon, postal address, institutional website, unique school code; available UTM geospatial coordinates must match within 150m. Arbitrary or ambiguous sites withheld.",
            "caution":"TLS certificate of current official directory lacks trusted issuer on GitHub runner; public CSV fetched read-only on the confirmed catedu.es official host, and geospatial secondary data was downloaded with TLS verification."}
    AUDIT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    CAND.write_text(json.dumps(new,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("AUDIT",json.dumps({k:v for k,v in report.items() if k not in ("pending_examples","accepted_ids")},ensure_ascii=False),flush=True)
    if not new:return
    OUT.write_text("// Official 2026 Aragón school directory; school-level map links and postal addresses. Public educational record data only.\n// Crosschecked against independent Government of Aragón campus UTM geolocations when available (<=150m) and across all existing institution arrays.\nwindow.ATLAS_VERIFIED_SPAIN_20261027=window.ATLAS_VERIFIED_SPAIN_20261027||[];\nwindow.ATLAS_VERIFIED_SPAIN_20261027.push(..."+json.dumps(new,ensure_ascii=False,separators=(",",":"))+");\n",encoding="utf8")
    html=INDEX.read_text(encoding="utf8")
    if TAG not in html:
        anchor="<script src='data/recovery-20261006.js"
        if html.count(anchor)!=1:raise RuntimeError("Unexpected index.html structure")
        INDEX.write_text(html.replace(anchor,TAG+anchor),encoding="utf8")
    print("PREPARED OFFICIAL DIRECTORY CAMPUS RECORDS",len(new),flush=True)
if __name__=="__main__":main()
