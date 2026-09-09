export function publishedDistance(course) {
  const value = course.source_distance?.km ??
    (course.route_estimate?.method === "known_length_from_source_text" ? course.route_estimate.distance_km : null);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function walkingMinutes(course) {
  if (Number.isFinite(course.source_distance?.walking_minutes)) return course.source_distance.walking_minutes;
  const km = publishedDistance(course);
  return km === null ? null : Math.ceil(km / 3 * 60 / 5) * 5;
}

export function terrain(course) {
  return course.walking_profile?.hilliness?.level || "unknown";
}

export function matchesCourse(course, filters, searchText) {
  const km = publishedDistance(course);
  const query = (filters.query || "").trim().toLocaleLowerCase();
  if (query && !searchText.toLocaleLowerCase().includes(query)) return false;
  if (filters.area && course.prefecture_area !== filters.area) return false;
  if (filters.distance && (km === null || km > Number(filters.distance))) return false;
  if (filters.terrain === "gentle" && !["flat", "gentle"].includes(terrain(course))) return false;
  if (filters.terrain === "rolling" && terrain(course) !== "rolling") return false;
  if (filters.terrain === "hilly" && !["hilly", "mountain"].includes(terrain(course))) return false;
  if (filters.audience && course.walking_profile?.suitability?.[filters.audience]?.rating !== "good") return false;
  if (filters.published && km === null) return false;
  if (filters.mapped && !course.path_data?.route_polyline_available) return false;
  if (filters.savedOnly && !filters.saved.has(course.id)) return false;
  return true;
}
