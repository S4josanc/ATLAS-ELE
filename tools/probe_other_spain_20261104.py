#!/usr/bin/env python3
import csv,io,urllib.request,collections,json
base="https://abertos.xunta.gal/catalogo/ensino-formacion/-/dataset/0257/centros-educativos-galicia/"
sources={"euskadi":"https://opendata.euskadi.eus/contenidos/ds_localizaciones/centros_docentes_no_universit/es_euskadi/adjuntos/dirgennouniv.csv"}
for label,url in sources.items():
 try:
  req=urllib.request.Request(url,headers={"User-Agent":"ATLAS-ELE-2026-Official-Directory-Validation/1.0"})
  with urllib.request.urlopen(req,timeout=15) as response:
   b=response.read(10000000)
   if len(b)>=10000000:raise RuntimeError("oversized")
  t=None
  for enc in ("utf-8-sig","cp1252","latin1"):
   try:t=b.decode(enc);break
   except UnicodeError:continue
  try:sep=csv.Sniffer().sniff(t[:12000],delimiters=",;\t|").delimiter
  except csv.Error:sep=";"
  rows=list(csv.DictReader(io.StringIO(t),delimiter=sep))
  if rows and len(rows[0])<3:
   sep=";" if sep!=";" else ","
   rows=list(csv.DictReader(io.StringIO(t),delimiter=sep))
  names=list(rows[0]) if rows else []
  print("REGION",label,"ROWS",len(rows),"FIELDS",json.dumps(names,ensure_ascii=False))
  if rows:
   print("EXAMPLE",label,json.dumps([{k:str(v)[:120] for k,v in a.items() if any(x in k.lower() for x in ("web","url","tit","tipo","natur","coord","utm","lat","lon","sistema","codig","codigo","codi","x","y","concert"))} for a in rows[:3]],ensure_ascii=False))
   print("POPULAR",label,json.dumps({k:collections.Counter(str(x.get(k,"")).strip() for x in rows).most_common(7) for k in names if any(t in k.lower() for t in ("titular","naturaleza","tipo_centro","régimen","regimen"))},ensure_ascii=False))
 except Exception as e:print("ERROR",label,repr(e))

try:
 import urllib.request,csv,io
 req=urllib.request.Request(sources["euskadi"],headers={"User-Agent":"ATLAS-ELE-2026-Directory-Audit"})
 with urllib.request.urlopen(req,timeout=20) as r:b=r.read(2000000)
 for enc in ("utf-8-sig","cp1252","latin1"):
  try:t=b.decode(enc);break
  except UnicodeError:pass
 for sep in (";",",","\t"):
  rows=list(csv.DictReader(io.StringIO(t),delimiter=sep))
  if rows and len(rows[0])>15:break
 print("EUSKADI COUNTS",json.dumps({"total":len(rows),"private_owner_groups":collections.Counter(str(a.get("DTITUC") or "").strip() for a in rows).most_common(25),"school_types":collections.Counter(str(a.get("DGENRC") or "").strip() for a in rows).most_common(35),"no_website":sum(not str(a.get("PAGINA") or "").strip() for a in rows),"valid_school_web":sum(str(a.get("PAGINA") or "").startswith(("http","www")) for a in rows),"coordinates_nonblank":sum(bool(a.get("COOR_X") and a.get("COOR_Y")) for a in rows),"postal_nonblank":sum(bool(a.get("CPOS")) for a in rows),"unique_codes":len(set(a.get("CCEN") for a in rows))},ensure_ascii=False))
 print("EUSKADI PRIVATE EXAMPLES",json.dumps([{k:r.get(k) for k in ("CCEN","NOM","DGENRC","DTITUC","DOMI","CPOS","MUNI","DMUNIC","DEPE","PAGINA","COOR_X","COOR_Y")} for r in rows if "DEPART" not in str(r.get("DTITUC"))][:15],ensure_ascii=False))
except Exception as e:print("EUSKADI STATS ERROR",repr(e))
