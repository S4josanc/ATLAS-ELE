#!/usr/bin/env python3
"""Inspect current official Spanish school datasets; does not publish records."""
import csv,io,json,urllib.request,urllib.parse,unicodedata,collections
def get(url,limit=26000000):
 req=urllib.request.Request(url,headers={"User-Agent":"ATLAS-ELE-Official-Campus-Audit/1.0","Accept":"application/json,text/csv,*/*"})
 with urllib.request.urlopen(req,timeout=110) as response:
  data=response.read(limit+1)
  if len(data)>limit:raise RuntimeError("file over safe size limit")
  return data
def report(source,rows):
 if not rows:return
 fields=list(rows[0])
 counts={k:sum(1 for x in rows if str(x.get(k) or "").strip()) for k in fields}
 print("PROBE",source,"rows",len(rows),"columns",json.dumps(fields,ensure_ascii=False))
 print("NONEMPTY",json.dumps(counts,ensure_ascii=False))
 for r in rows[:2]:
  print("SAMPLE",json.dumps({k:str(v)[:100] for k,v in r.items() if any(x in k.lower() for x in ("cod","natur","web","coord","geo","adre","municip","titular","nom","lat","lon"))},ensure_ascii=False))
try:
 url="https://analisi.transparenciacatalunya.cat/api/views/kvmv-ahh4.json"
 d=json.loads(get(url,2000000))
 print("CAT_META",json.dumps({"rowsUpdatedAt":d.get("rowsUpdatedAt"),"rowCount":d.get("rowCount"),"columns":[(v.get("name"),v.get("fieldName")) for v in d.get("columns",[])]},ensure_ascii=False))
except Exception as e:print("ERROR CAT META",repr(e))
try:
 url="https://analisi.transparenciacatalunya.cat/resource/kvmv-ahh4.json?%24limit=2000&%24order=%3Aid"
 data=json.loads(get(url,10000000))
 report("catalonia-sample",data)
except Exception as e:print("ERROR CAT RECORDS",repr(e))
for label,url in [
 ("valencia", "https://dadesobertes.gva.es/dataset/68eb1d94-76d3-4305-8507-e1aab7717d0e/resource/1aa53c3a-4639-41aa-ac85-d58254c428c0/download/centros-docentes-de-la-comunitat-valenciana.csv"),
 ("valencia-wfs", "https://terramapas.icv.gva.es/12_Centros_wfs?request=GetFeature&service=WFS&version=2.0.0&typename=CentrosDocentesRegimen&outputformat=csv")]:
 try:
  b=get(url)
  t=next((b.decode(enc) for enc in ("utf-8-sig","cp1252","latin1") if True),None)
  try:sep=csv.Sniffer().sniff(t[:10000],delimiters=";,\t").delimiter
  except:sep=";"
  rows=list(csv.DictReader(io.StringIO(t),delimiter=sep))
  report(label,rows)
 except Exception as e:print("ERROR",label,repr(e))

# Additional source-level precision and ownership counts for safe batch planning.
from collections import Counter
import re
def summary(rows,label,ownerkey,websitekey,latkey,lonkey):
 def validurl(x):
  if isinstance(x,dict):x=x.get("url","")
  return str(x or "").lower().startswith(("http://","https://"))
 def validgeo(x,y):
  try:return 35<float(x)<44 and -2<float(y)<5
  except:return False
 print("OWNERS",label,Counter(str(r.get(ownerkey)) for r in rows).most_common(15))
 print("EXAMPLES",label,json.dumps([{k:r.get(k) for k in (ownerkey,websitekey,latkey,lonkey,"regimen","desc_estado","dgenerica_cas","denominacion_generica_es","curs","any") if k in r} for r in rows[:6]],ensure_ascii=False))
 print("WEBSITES",label,"valid_http",sum(validurl(r.get(websitekey)) for r in rows),"valid_geo",sum(validgeo(r.get(latkey),r.get(lonkey)) for r in rows))
try:
 url="https://analisi.transparenciacatalunya.cat/resource/kvmv-ahh4.json?"+urllib.parse.urlencode({"$select":"curs,count(*) as total","$group":"curs","$order":"curs DESC","$limit":25})
 data=json.loads(get(url,2000000))
 print("CAT_YEAR_COUNTS",json.dumps(data,ensure_ascii=False))
 latest=str(data[0]["curs"])
 url="https://analisi.transparenciacatalunya.cat/resource/kvmv-ahh4.json?"+urllib.parse.urlencode({"$where":"curs='"+latest+"'","$limit":15000})
 data=json.loads(get(url,16000000))
 summary(data,"cat-latest-"+latest,"nom_naturalesa","url","coordenades_geo_y","coordenades_geo_x")
 print("CAT latest",len(data),"unique codes",len(set(str(x.get("codi_centre")) for x in data)))
except Exception as e:print("ERROR CAT STATS",repr(e))
for label,url in [
("valencia-WFS","https://terramapas.icv.gva.es/12_Centros_wfs?request=GetFeature&service=WFS&version=2.0.0&typename=CentrosDocentesRegimen&outputformat=csv")]:
 try:
  raw=get(url)
  t=raw.decode("utf-8-sig")
  try:sep=csv.Sniffer().sniff(t[:10000],delimiters=";,\\t").delimiter
  except:sep=";"
  rows=list(csv.DictReader(io.StringIO(t),delimiter=sep))
  summary(rows,label,"regimen","web","latitud","longitud")
  print("VAL_STATES",Counter(r.get("desc_estado") for r in rows))
 except Exception as e:print("ERROR VAL STATS",repr(e))
