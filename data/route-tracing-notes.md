# Source Route Coverage

The inventory contains 97 course variants from 70 source PDFs. Each variant has
a source-reported distance, including an approximate qualifier where printed.
Thirteen variants currently have geographically aligned source traces. The remaining
84 are not yet drawn as routes; their pins must not be treated as route starts.

## Provenance

- Original PDF links and printed distance evidence: `japan_kurort_path_inventory.json`.
- Geographic landmarks, source links, scale bars and orientation: `route-alignments.json`.
- Extracted source-page geometry: `source-traces/` (PDF coordinates, not geographic).
- Map-ready geometry and landmark provenance: `japan_kurort_routes.geojson`.
- Visual review overlays: `../tmp/route-alignment-review/`.

The mapped variants are Yufuin Ogosha, Nagoya Naka, Okazaki, Takashi Park,
Iwaya, Yokoyama, Edel Sasayuri, Naka-Yachiyo Forest, Makido, both Isanoura
variants, and the two Gifu city courses (Kin Park/Gifu Station/Shimizugawa and
Yanagase/Kasumikamori/Bairin Park).
Landmark references are linked individually in the alignment records and the
website's course details. Yufuin uses official Oita tourism locations and an
independent station check; other alignments use OpenStreetMap landmarks.

## Accuracy Limits

These are approximate traces of illustrated source maps, not surveyed GPS tracks.
One-landmark alignments use the printed scale and north arrow and have no
independent position check. Yokoyama's source has north pointing down.
Yufuin's independent station check has a 64.8 m residual; that is a single check,
not a bound on every point's error. Map distortion and missing short segments
remain possible, particularly around symbols and underground routes.

Displayed walking distance always comes from the source, not the length of the
extracted line network. Out-and-back sections may appear once in the geometry;
linework length therefore is not equivalent to distance walked. No trace is
verified for navigation or for accessibility or current safety conditions.

## Regeneration

Run `scripts/import_source_distances.mjs`, `scripts/add_course_suitability.mjs`,
`scripts/build_route_geojson.py`, then `scripts/export_course_csv.mjs` in that order.
The Python builder uses the tracing virtual environment under `tmp/tracing-venv`.
Do not run the old schematic-point or coarse-coordinate generators over these
results: they predate the source-alignment workflow.

Additional alignments require visual inspection, identifiable geographic
landmarks and source orientation/scale review before publication. Extracted
legend boxes must be excluded; visible missing source segments may be traced
manually and recorded in `supplemental_lines`.
