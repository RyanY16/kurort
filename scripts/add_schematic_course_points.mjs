import fs from "node:fs";

const inventoryPath = "data/japan_kurort_path_inventory.json";

const knownDistancesKm = {
  aichi_nagoya_midori_aichi03_midoriku_okehazama: 5.0,
  iwate_takizawa_iwate_takizawa_kurakakeainosawa: 2.8,
  gifu01_gifu01: 3.15,
  gifu03_hida_alps: 3.94,
  nagasaki_saikai_nagasaki_saikai_isanoura: 4.3
};

function toRad(value) {
  return (value * Math.PI) / 180;
}

function haversineKm(a, b) {
  const earthRadiusKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function cleanPointName(value) {
  return String(value || "")
    .replace(/（[^）]*写真[^）]*）/g, "")
    .replace(/（MAP[^）]*）/g, "")
    .replace(/（地点[^）]*）/g, "")
    .replace(/。.*$/g, "")
    .replace(/、.*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function offsetsFor(count, hilliness) {
  const radiusByHilliness = {
    flat: 0.003,
    gentle: 0.005,
    rolling: 0.0075,
    hilly: 0.011,
    mountain: 0.016
  };
  const radius = radiusByHilliness[hilliness] || 0.02;
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(count, 1)) * Math.PI * 1.65;
    const scale = index % 2 === 0 ? 1 : 0.72;
    return {
      latitude: Math.sin(angle) * radius * scale,
      longitude: Math.cos(angle) * radius * scale * 1.15
    };
  });
}

const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));

for (const course of inventory.courses) {
  const pin = course.map_pin;
  const pointNames = (course.visible_points_of_interest || [])
    .map(cleanPointName)
    .filter(Boolean)
    .slice(0, 8);

  const baseName = course.map_pin?.label || course.course_name;
  const names = [baseName, ...pointNames];
  const offsets = offsetsFor(names.length, course.walking_profile?.hilliness?.level);

  const points = names.map((name, index) => ({
    order: index + 1,
    name,
    latitude: Number((pin.latitude + offsets[index].latitude).toFixed(6)),
    longitude: Number((pin.longitude + offsets[index].longitude).toFixed(6)),
    role: index === 0 ? "course_start_or_base_area" : "source_visible_point",
    precision: "schematic_near_course_pin",
    verified_for_navigation: false
  }));

  let lineDistance = 0;
  for (let index = 1; index < points.length; index += 1) {
    lineDistance += haversineKm(points[index - 1], points[index]);
  }

  const sourceDistanceKm = course.source_distance?.km || knownDistancesKm[course.id];
  const estimatedDistanceKm = sourceDistanceKm ?? Number((lineDistance * 1.25).toFixed(1));

  course.course_points = points;
  course.route_estimate = {
    distance_km: Number(estimatedDistanceKm.toFixed(2)),
    display_en: sourceDistanceKm
      ? `${Number(estimatedDistanceKm.toFixed(2))} km`
      : `${Number(estimatedDistanceKm.toFixed(1))} km approx.`,
    display_ja: sourceDistanceKm
      ? `${Number(estimatedDistanceKm.toFixed(2))}km`
      : `約${Number(estimatedDistanceKm.toFixed(1))}km`,
    elevation_gain_m: course.source_distance?.elevation_gain_m || null,
    elevation_display_en: course.source_distance?.elevation_gain_m
      ? `${course.source_distance.elevation_gain_m} m cumulative elevation gain`
      : "",
    elevation_display_ja: course.source_distance?.elevation_gain_m
      ? `累積高度差${course.source_distance.elevation_gain_m}m`
      : "",
    method: sourceDistanceKm
      ? "known_length_from_source_text"
      : "schematic_distance_from_course_points",
    confidence: sourceDistanceKm ? "medium" : "low",
    note_en: sourceDistanceKm
      ? "Distance is based on source text or a legible printed legend in the original PDF map."
      : "Estimated from schematic landmark points because the PDF route map is not georeferenced. Use for comparison only, not navigation.",
    note_ja: sourceDistanceKm
      ? "出典テキスト、または元PDFマップ内で読める凡例の距離を使用しています。"
      : "PDFルート図が地理座標付きではないため、模式的な地点から推定しています。比較用で、ナビ用ではありません。"
  };

  if (course.walking_profile?.distance) {
    course.walking_profile.distance.km = sourceDistanceKm || null;
    course.walking_profile.distance.display_en = course.route_estimate.display_en;
    course.walking_profile.distance.display_ja = course.route_estimate.display_ja;
    course.walking_profile.distance.confidence = course.route_estimate.confidence;
  }
}

inventory.metadata.course_points_note =
  "course_points are a schematic point layer generated from course base pins and visible source landmarks. They are suitable for prototype interaction and comparison, but not for navigation-grade route drawing.";

fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
console.log(`Added schematic course points to ${inventory.courses.length} courses`);
