"""Cache explicit landmark lookups, respecting Nominatim's single-request rate."""
import json
import sys
import time
import urllib.parse
import urllib.request
import subprocess
from pathlib import Path

cache = Path('tmp/source-review/landmark-lookups.json')
results = json.loads(cache.read_text()) if cache.exists() else {}
for query in sys.argv[1:]:
    if query not in results:
        params = urllib.parse.urlencode({'q':query,'format':'json','countrycodes':'jp','limit':4})
        output = subprocess.check_output(['curl','-f','-sS','--max-time','30','-H','User-Agent: KurortCourseResearch/1.0 (source-map alignment)',
                                          'https://nominatim.openstreetmap.org/search?' + params])
        results[query] = json.loads(output)
        cache.write_text(json.dumps(results,ensure_ascii=False,indent=2))
        time.sleep(1.2)
    print(query, json.dumps([{k:r.get(k) for k in ['name','lat','lon','class','type','osm_type','osm_id','display_name']} for r in results[query]],ensure_ascii=False),flush=True)
