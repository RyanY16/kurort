import fs from "node:fs";

const inventory = JSON.parse(fs.readFileSync("data/japan_kurort_path_inventory.json", "utf8"));
const csvPath = "data/japan_kurort_path_inventory.csv";

const cols = [
  "id",
  "prefecture_area",
  "course_name",
  "latitude",
  "longitude",
  "length_en",
  "length_ja",
  "elevation_gain_m",
  "route_variant_of",
  "distance_method",
  "hilliness_en",
  "hilliness_ja",
  "children_en",
  "children_ja",
  "children_rating",
  "older_adults_en",
  "older_adults_ja",
  "older_adults_rating",
  "suitability_confidence",
  "suitability_note_en",
  "suitability_note_ja",
  "suitability_signals_en",
  "suitability_signals_ja",
  "route_polyline_available",
  "map_pdf_url",
  "description_short"
];

function csv(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

const lines = [cols.join(",")];
for (const course of inventory.courses) {
  lines.push(
    [
      course.id,
      course.prefecture_area,
      course.course_name,
      course.map_pin?.latitude,
      course.map_pin?.longitude,
      course.route_estimate?.display_en || course.walking_profile?.distance?.display_en,
      course.route_estimate?.display_ja || course.walking_profile?.distance?.display_ja,
      course.source_distance?.elevation_gain_m ?? course.route_estimate?.elevation_gain_m,
      course.route_variant_of,
      course.route_estimate?.method,
      course.walking_profile?.hilliness?.label_en,
      course.walking_profile?.hilliness?.label_ja,
      course.walking_profile?.suitability?.children?.label_en,
      course.walking_profile?.suitability?.children?.label_ja,
      course.walking_profile?.suitability?.children?.rating,
      course.walking_profile?.suitability?.older_adults?.label_en,
      course.walking_profile?.suitability?.older_adults?.label_ja,
      course.walking_profile?.suitability?.older_adults?.rating,
      course.walking_profile?.suitability?.confidence,
      course.walking_profile?.suitability?.note_en,
      course.walking_profile?.suitability?.note_ja,
      course.walking_profile?.suitability?.signals_en?.join(" | "),
      course.walking_profile?.suitability?.signals_ja?.join(" | "),
      course.path_data?.route_polyline_available,
      course.map_pdf_url,
      course.description_short
    ].map(csv).join(",")
  );
}

fs.writeFileSync(csvPath, lines.join("\n"));
console.log(`Exported ${inventory.courses.length} rows to ${csvPath}`);
