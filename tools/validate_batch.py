#!/usr/bin/env python3
"""Validate candidate ATLAS ELE institutions before any publication.
Usage: python3 tools/validate_batch.py candidates.json existing.json
Inputs are arrays of ATLAS records [id,name,type,city,country,lat,lng,web,verified,address,precision,source].
This tool validates supplied evidence; it does NOT independently verify source truth.
"""
import json,sys,re,unicodedata,urllib.parse
def norm(s):
 s=unicodedata.normalize("NFKD",str(s or "")).casefold()
 return re.sub(r"[^a-z0-9]","", "".join(c for c in s if not unicodedata.combining(c)))
def domain(s):
 p=urllib.parse.urlparse(s or "")
 return (p.hostname or "").removeprefix("www.")
def validate(candidates,existing):
 errors=[]; seen_ids=set();seen_places=set();seen_web=set()
 for r in existing:
  if len(r)<8: continue
  seen_ids.add(norm(r[0]));seen_places.add((norm(r[1]),norm(r[3]),norm(r[4])))
  if len(r)>9 and r[9]:seen_places.add((norm(r[9]),norm(r[3]),norm(r[4])))
  if r[7]:seen_web.add((domain(r[7]),norm(r[3])))
 accepted=[]
 for idx,r in enumerate(candidates):
  why=[]
  if not isinstance(r,list) or len(r)<12: errors.append([idx,["missing required fields"]]);continue
  id,name,typ,city,country,lat,lng,web,verified,address,precision,source=r[:12]
  if not all(isinstance(x,str) and x.strip() for x in (id,name,city,country,web,address,source)):why.append("missing identity/address/source")
  if not isinstance(lat,(int,float)) or not isinstance(lng,(int,float)) or not(-90<=lat<=90 and -180<=lng<=180):why.append("invalid coordinates")
  if precision not in ("exact","address"):why.append("location not address-level")
  if verified is not True:why.append("not marked verified")
  if urllib.parse.urlparse(web).scheme not in ("http","https") or not domain(web):why.append("invalid official website URL")
  if urllib.parse.urlparse(source).scheme not in ("http","https"):why.append("invalid evidence URL")
  if not re.search(r"\d",address):why.append("address lacks number/postal code")
  if norm(id) in seen_ids:why.append("duplicate ID")
  if (norm(name),norm(city),norm(country)) in seen_places or (norm(address),norm(city),norm(country)) in seen_places:why.append("duplicate institution/address")
  if (domain(web),norm(city)) in seen_web:why.append("possible duplicate website in city; manual campus review")
  if why:errors.append([idx,why]);continue
  accepted.append(r);seen_ids.add(norm(id));seen_places.add((norm(name),norm(city),norm(country)));seen_places.add((norm(address),norm(city),norm(country)));seen_web.add((domain(web),norm(city)))
 print(json.dumps({"input":len(candidates),"accepted":len(accepted),"rejected":len(errors),"errors":errors},ensure_ascii=False,indent=2))
 return 1 if errors else 0
if __name__=="__main__":
 if len(sys.argv)!=3:sys.exit("Usage: validate_batch.py candidates.json existing.json")
 with open(sys.argv[1],encoding="utf8") as f:c=json.load(f)
 with open(sys.argv[2],encoding="utf8") as f:e=json.load(f)
 sys.exit(validate(c,e))
