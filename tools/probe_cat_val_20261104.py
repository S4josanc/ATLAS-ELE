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
