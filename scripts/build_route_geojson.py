"""Place reviewed PDF linework using recorded map controls, retaining provenance."""
import json
import math
from pathlib import Path
import numpy as np
from skimage.transform import SimilarityTransform
from PIL import Image, ImageDraw

ROOT = Path('.')
inventory_path = ROOT / 'data/japan_kurort_path_inventory.json'
inventory = json.loads(inventory_path.read_text())
configs = json.loads((ROOT / 'data/route-alignments.json').read_text())
features = []
reviews = ROOT / 'tmp/route-alignment-review'
reviews.mkdir(exist_ok=True)

for course in inventory['courses']:
    course.pop('course_points',None)
    course.pop('route_geometry',None)
    course['path_data']['route_polyline_available'] = False
    course['path_data']['route_polyline_status'] = 'awaiting_landmark_alignment'
    cfg = configs.get(course['id'])
    if not cfg:
        continue
    width,height = cfg['reference_size']
    if 'manual_lines' in cfg:
        lines = cfg['manual_lines']
        reference = ROOT / 'tmp/ocr/oita.png'
    else:
        trace = json.loads((ROOT / 'data/source-traces' / (cfg['source'] + '.json')).read_text())
        lines = [[[x / trace['width'] * width, y / trace['height'] * height] for x,y in line]
                 for group in cfg['groups'] for line in trace['groups'].get(group,[])]
        reference = ROOT / 'tmp/source-review' / (cfg['source'] + '-1.png')
    for left, top, right, bottom in cfg.get('exclude_boxes', []):
        lines = [line for line in lines if not all(left <= x <= right and top <= y <= bottom for x,y in line)]
    lines = lines + cfg.get('supplemental_lines', [])
    controls = cfg['controls']
    lon0,lat0 = controls[0]['coordinate']
    meters_lon = 111320 * math.cos(math.radians(lat0))
    meters_lat = 111132
    if cfg['method'] == 'two_landmarks':
        src = np.array([[p['pixel'][0],-p['pixel'][1]] for p in controls])
        dst = np.array([[(p['coordinate'][0]-lon0)*meters_lon,(p['coordinate'][1]-lat0)*meters_lat] for p in controls])
        transform = SimilarityTransform()
        if not transform.estimate(src,dst): raise ValueError('Cannot align ' + course['id'])
        def project(points): return transform(np.array([[x,-y] for x,y in points]))
    else:
        scale = cfg['scale']['meters']/cfg['scale']['pixels']
        north = cfg['scale']['north']
        if north not in ('page_up', 'page_down'):
            raise ValueError('Unsupported north direction: ' + north)
        scale *= -1 if north == 'page_down' else 1
        anchor = controls[0]['pixel']
        def project(points): return np.array([[(x-anchor[0])*scale, (anchor[1]-y)*scale] for x,y in points])
    geographic = []
    network_m = 0
    for line in lines:
        points = project(line)
        network_m += float(np.linalg.norm(np.diff(points,axis=0),axis=1).sum())
        geographic.append([[round(lon0+x/meters_lon,7),round(lat0+y/meters_lat,7)] for x,y in points])
    checks = []
    for check in cfg.get('check_points',[]):
        estimated = project([check['pixel']])[0]
        actual = [(check['coordinate'][0]-lon0)*meters_lon,(check['coordinate'][1]-lat0)*meters_lat]
        checks.append({**check,'residual_m':round(float(np.linalg.norm(estimated-actual)),1)})
    if checks and max(c['residual_m'] for c in checks) > 100:
        raise ValueError('Control check failed: ' + course['id'])
    geometry = {'type':'MultiLineString','coordinates':geographic}
    properties = {
        'course_id':course['id'],'name':course['course_name'],'source_url':course['map_pdf_url'],'source_page':1,
        'published_distance_km':course['source_distance']['km'],'source_distance_approximate':course['source_distance']['approximate'],
        'alignment_method':cfg['method'],'status':'approximate_source_trace','verified_for_navigation':False,
        'linework_length_km':round(network_m/1000,3),'control_points':controls,'independent_checks':checks,
        'source_scale':cfg.get('scale'),
        'distance_note':'Printed distance is the walking distance. Linework length may differ because out-and-back segments, source-map generalization and small extraction gaps are not a measured GPS track.'
    }
    features.append({'type':'Feature','id':course['id'],'properties':properties,'geometry':geometry})
    course['path_data'].update({'route_polyline_available':True,'route_polyline_status':'approximate_source_trace','geojson_url':'data/japan_kurort_routes.geojson','verified_for_navigation':False})
    course['route_geometry'] = {'status':'approximate_source_trace','source_url':course['map_pdf_url'],'alignment_method':cfg['method'],'control_sources':list(dict.fromkeys(p['source'] for p in controls)),'linework_length_km':round(network_m/1000,3),'independent_check_error_m': max([c['residual_m'] for c in checks],default=None)}
    first = geographic[0][0]
    course['map_pin'].update({'longitude':first[0],'latitude':first[1],'precision':'source_trace_area','label':course['course_name'],'verified_for_navigation':False,'note':'Course area from the aligned source trace; not necessarily the start point.'})
    preview = Image.open(reference).convert('RGB').resize((width,height))
    draw = ImageDraw.Draw(preview)
    for line in lines: draw.line([tuple(p) for p in line],fill=(240,0,160),width=3)
    for control in controls:
        x,y = control['pixel']
        draw.ellipse((x-7,y-7,x+7,y+7),fill=(0,170,240),outline='white',width=2)
    preview.save(reviews/(course['id']+'.jpg'))
    print(course['id'],round(network_m/1000,3),'km linework; published',course['source_distance']['km'],'km',checks)

collection = {'type':'FeatureCollection','name':'Source-traced Kurort courses','features':features}
(ROOT/'data/japan_kurort_routes.geojson').write_text(json.dumps(collection,ensure_ascii=False,separators=(',',':')))
inventory['metadata']['georeferenced_route_count'] = len(features)
inventory['metadata']['route_geometry_note'] = 'Only source traces with recorded geographic controls are drawn. Unaligned source-page linework is not geographic route data. All current traces are approximate and unverified for navigation.'
inventory['metadata']['course_points_note'] = 'Artificial schematic points removed; source-traced lines are kept separately in japan_kurort_routes.geojson.'
inventory_path.write_text(json.dumps(inventory,ensure_ascii=False,indent=2))
