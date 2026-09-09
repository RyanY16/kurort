"""Extract printed route ribbons in PDF coordinates; never invent geographic placement."""
import json
from pathlib import Path
import numpy as np
import pymupdf as pdf
from scipy.ndimage import label
from skimage.morphology import skeletonize
from skimage.measure import approximate_polygon

OUT = Path('data/source-traces')
OUT.mkdir(exist_ok=True)
REVIEW = Path('tmp/source-review')
SCALE = 3

def color_name(rgb):
    if not rgb or len(rgb) != 3:
        return None
    r,g,b = rgb
    if g > .4 and g > r * 1.4 and g > b * 1.2:
        return 'green'
    if b > .4 and b > r * 1.35 and b > g * 1.12:
        return 'blue'
    if r > .55 and r > g * 1.5 and r > b * 1.2:
        return 'red'
    if r > .4 and b > .4 and g < min(r,b) * .8:
        return 'purple'
    return None

def draw_shape(page, drawing):
    shape = page.new_shape()
    for item in drawing['items']:
        if item[0] == 'l': shape.draw_line(item[1], item[2])
        elif item[0] == 'c': shape.draw_bezier(*item[1:])
        elif item[0] == 're': shape.draw_rect(item[1])
        elif item[0] == 'qu': shape.draw_quad(item[1])
    shape.finish(fill=(0,0,0) if drawing['fill'] else None, color=(0,0,0) if drawing['color'] else None,
                 width=drawing['width'] or 0, closePath=bool(drawing['closePath']), even_odd=drawing['even_odd'])
    shape.commit()

def lines_from_mask(mask):
    labels, count = label(mask)
    sizes = np.bincount(labels.ravel())
    mask = np.isin(labels, np.flatnonzero(sizes >= 35)[1:])
    skeleton = skeletonize(mask)
    pixels = set(zip(*np.nonzero(skeleton)))
    neighbors = {p: [q for dy in [-1,0,1] for dx in [-1,0,1]
                       if (dy or dx) and (q := (p[0]+dy,p[1]+dx)) in pixels] for p in pixels}
    visited = set()
    paths = []
    # Junctions first, then cycles. Every source segment is retained once.
    starts = sorted(pixels, key=lambda p: len(neighbors[p]) == 2)
    for start in starts:
        for nxt in neighbors[start]:
            edge = tuple(sorted((start,nxt)))
            if edge in visited: continue
            visited.add(edge)
            path = [start,nxt]
            prev, current = start,nxt
            while len(neighbors[current]) == 2:
                following = [p for p in neighbors[current] if p != prev][0]
                edge = tuple(sorted((current,following)))
                if edge in visited: break
                visited.add(edge)
                path.append(following)
                prev,current = current,following
            if len(path) >= 8:
                points = np.array([[x/SCALE,y/SCALE] for y,x in path])
                paths.append(approximate_polygon(points, tolerance=.45).round(3).tolist())
    return paths

report = []
for path in sorted(Path('tmp/kurortwalking_pdfs').glob('*.pdf')):
    if path.stem == 'interview': continue
    doc = pdf.open(path)
    page = doc[0]
    rows = json.loads((REVIEW / (path.stem + '.json')).read_text())[0]['rows']
    graph = [r['box'][1] for r in rows if '高低差グラフ' in r['text'] and r['box'][1] > .35]
    bottom = min(graph) if graph else .78
    if path.stem == 'aichi-nagoya__aichi-nagoya_nakaku': bottom = 1
    masks = {}
    candidates = []
    for index, drawing in enumerate(page.get_drawings()):
        color = color_name(drawing['fill'] or drawing['color'])
        rect = drawing['rect']
        if not color or len(drawing['items']) < 10: continue
        if max(rect.width/page.rect.width,rect.height/page.rect.height) < .1: continue
        if rect.y0/page.rect.height >= bottom or rect.y1/page.rect.height < .06: continue
        if path.stem == 'aichi-nagoya__aichi-nagoya_nakaku' and rect.x0/page.rect.width > .5: continue
        clean = pdf.open()
        target = clean.new_page(width=page.rect.width, height=page.rect.height)
        draw_shape(target,drawing)
        pix = target.get_pixmap(matrix=pdf.Matrix(SCALE,SCALE), colorspace=pdf.csGRAY)
        mask = np.frombuffer(pix.samples,dtype=np.uint8).reshape(pix.height,pix.width) < 140
        area = mask.sum() / SCALE**2
        if area / max(rect.width*rect.height,1) > .24: continue
        mask[int(bottom*pix.height):] = False
        masks[color] = mask if color not in masks else masks[color] | mask
        candidates.append({'drawing':index,'color':color,'bounds':list(rect),'area':float(area)})
    groups = {color:lines_from_mask(mask) for color,mask in masks.items()}
    groups = {color:lines for color,lines in groups.items() if lines}
    record = {
        'source_pdf':str(path), 'page':1, 'coordinate_system':'pdf_points_top_left',
        'width':page.rect.width,'height':page.rect.height,
        'status':'source_shapes_extracted_georeferencing_pending' if groups else 'manual_trace_required',
        'groups':groups,'candidates':candidates,
        'note':'Source-page geometry only. Not geographic coordinates. Color groups and completeness require review before publication as paths.'
    }
    (OUT / (path.stem + '.json')).write_text(json.dumps(record,separators=(',',':')))
    report.append({'source':path.stem,'groups':{c:len(lines) for c,lines in groups.items()},'status':record['status']})
    print(path.stem, report[-1]['groups'], flush=True)
Path('data/source-trace-status.json').write_text(json.dumps(report,indent=2))
