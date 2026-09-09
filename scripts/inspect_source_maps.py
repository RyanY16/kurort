"""Render source PDFs and cache OCR with bounding boxes for route review."""
import json
from pathlib import Path
import pymupdf
import Vision
from Foundation import NSURL

out = Path('tmp/source-review')
out.mkdir(exist_ok=True)
for path in sorted(Path('tmp/kurortwalking_pdfs').glob('*.pdf')):
    if path.name == 'interview.pdf':
        continue
    target = out / (path.stem + '.json')
    if target.exists():
        continue
    doc = pymupdf.open(path)
    pages = []
    for index, page in enumerate(doc):
        image = out / f'{path.stem}-{index + 1}.png'
        page.get_pixmap(matrix=pymupdf.Matrix(2.5, 2.5)).save(image)
        request = Vision.VNRecognizeTextRequest.alloc().init()
        request.setRecognitionLevel_(Vision.VNRequestTextRecognitionLevelAccurate)
        request.setRecognitionLanguages_(['ja-JP', 'en-US'])
        request.setUsesLanguageCorrection_(False)
        request.setUsesCPUOnly_(True)
        handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(str(image.resolve())), {})
        ok, error = handler.performRequests_error_([request], None)
        if not ok:
            raise RuntimeError(str(error))
        rows = []
        for observation in request.results():
            item = observation.topCandidates_(1)[0]
            box = observation.boundingBox()
            rows.append({'text': str(item.string()), 'confidence': float(item.confidence()),
                         'box': [box.origin.x, 1 - box.origin.y - box.size.height, box.size.width, box.size.height]})
        pages.append({'page': index + 1, 'width': page.rect.width, 'height': page.rect.height, 'rows': rows})
    target.write_text(json.dumps(pages, ensure_ascii=False, indent=2))
    relevant = [r['text'] for p in pages for r in p['rows'] if any(word in r['text'].lower() for word in ['km', '全長', '累積', '距離'])]
    print(path.stem + ': ' + ' | '.join(relevant), flush=True)
