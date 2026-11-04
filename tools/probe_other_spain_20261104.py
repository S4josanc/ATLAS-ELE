#!/usr/bin/env python3
import csv,io,urllib.request,collections,json
base="https://abertos.xunta.gal/catalogo/ensino-formacion/-/dataset/0257/centros-educativos-galicia/"
sources={
 "andalucia":"https://www.juntadeandalucia.es/datosabiertos/portal/dataset/e039df22-4b82-4d0d-9884-0ab5952e24e4/resource/b5924e81-0b53-4418-9d93-b1f39ba1ef65/download/da_centros.csv",
 "euskadi":"https://opendata.euskadi.eus/contenidos/ds_localizaciones/centros_docentes_no_universit/es_euskadi/adjuntos/dirgennouniv.csv",
 "galicia-acoruna":base+"001/descarga-directa-ficheiro.csv",
 "galicia-lugo":base+"003/descarga-directa-ficheiro.csv",
 "galicia-ourense":base+"005/descarga-directa-ficheiro.csv",
 "galicia-pontevedra":base+"007/descarga-directa-ficheiro.csv"}
for label,url in sources.items():
 try:
  req=urllib.request.Request(url,headers={"User-Agent":"ATLAS-ELE-2026-Official-Directory-Validation/1.0"})
  with urllib.request.urlopen(req,timeout=90) as response:
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
