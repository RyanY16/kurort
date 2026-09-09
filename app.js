import { publishedDistance, walkingMinutes, terrain, matchesCourse } from "./course-utils.mjs";

const $ = (selector) => document.querySelector(selector);
function readPreference(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
const savedPreference = readPreference("kurort-saved", []);
const state = {
  courses: [], filtered: [], metadata: {}, markers: new Map(), map: null, clusters: null, tiles: null,
  routeFeatures: new Map(), pathLayers: new Map(), sourcePaths: null,
  selectedId: null, routeLayer: null, tab: "explore", listScroll: 0,
  lang: readPreference("kurort-language", "en") === "ja" ? "ja" : "en",
  saved: new Set(Array.isArray(savedPreference) ? savedPreference.filter(id => typeof id === "string") : [])
};
const translations = {
  en: {
    skip: "Skip to courses", brandSub: "Health walking, naturally.", explore: "Explore", saved: "Saved walks",
    eyebrow: "Walking course finder", title: "Find your kind of walk.", savedTitle: "Your next little escape.",
    loading: "Loading courses...", searchLabel: "Search courses", searchPlaceholder: "Town, region or course",
    region: "Region", allJapan: "All Japan", distance: "Distance", anyDistance: "Any distance",
    under2: "Up to 2 km", under3: "Up to 3 km", under5: "Up to 5 km", terrain: "Terrain",
    anyTerrain: "Any terrain", gentle: "Flat & gentle", rolling: "Rolling hills", hilly: "Hills & highlands",
    walkingWith: "Walking with", anyone: "Anyone", children: "Children", older: "Older adults",
    mappedOnly: "Routes drawn on the map", sourceTrace: "Approximate source trace", pendingTrace: "Route alignment pending",
    sourceTraceNote: "Traced from the source map and aligned to landmarks. Approximate placement, not a surveyed GPS track.",
    pendingTraceNote: "The published length is available. The route still needs landmark alignment before it can be drawn here.",
    alignmentSources: "Route alignment landmarks", downloadRoute: "Download this route (GeoJSON)", sourceTime: "Time stated in the source",
    routeLoadError: "Route lines could not be loaded. Refresh to retry; course details remain available.",
    publishedOnly: "Published distances only", walks: "walks", sort: "Sort courses", byRegion: "By region",
    shortest: "Shortest first", gentlest: "Gentlest first", reset: "Reset", guideSource: "Kurort course guide",
    back: "All results", share: "Copy course link", save: "Save walk", unsave: "Remove saved walk",
    mapTitle: "Japan, one walk at a time", fitResults: "Show all results", pinNote: "Approximate course locations",
    mapError: "Map tiles are unavailable. You can still browse the course list.", retry: "Retry",
    unknownDistance: "Distance unconfirmed", unknown: "Not confirmed", published: "Published in course source",
    time: "Walking time", minutes: "min", timeEstimate: "Estimate at 3 km/h, before rests",
    elevation: "Elevation change", elevationNote: "Cumulative figure from the map", inferred: "Inferred from description",
    terrainNote: "Terrain is inferred; steepest gradient is unknown.", suitability: "Who might enjoy this walk?",
    good: "Potential fit", ok: "Check conditions", caution: "Extra care needed", not_recommended: "Not recommended",
    suitabilityNote: "These are preliminary indications, not verified accessibility ratings. Individual ability, surface conditions and supervision matter.",
    why: "Why these indications?", places: "Along the way", pdf: "Open original course map",
    locationNote: "This pin marks the approximate course area. Confirm the start point on the official map.",
    original: "Official course name and description in Japanese",
    sources: "Sources & data notes", courseSource: "Original course PDF", guide: "Official course guide",
    methodSources: "Suitability methodology references", unconfirmedNote: "No verified length has been extracted for this route. Check the course PDF.",
    sourceLengthNote: "Distance comes from the source text or printed map legend. Walking time is a planning estimate and excludes breaks.",
    practical: "Before you set out", practicalNote: "Toilets, rest areas, step-free access and current closures have not been verified in this dataset. Check with the local guide or course operator, including seasonal and bear-related notices.",
    related: "More in this area", showSchematic: "Show unverified landmark sketch",
    schematicNote: "Illustrative points placed near the course area. They do not show the actual walking path or landmark coordinates.",
    noResults: "No walks match just yet.", noResultsCopy: "Try another region or a wider distance range.",
    noSaved: "A walk to look forward to.", noSavedCopy: "Your saved courses will be kept on this device.",
    exploreAll: "Explore all walks", loadError: "Courses could not be loaded.", loadErrorCopy: "Please retry when your connection is available.",
    filterDistanceNote: "Distance filters use published lengths; unconfirmed lengths are excluded.",
    filterAudienceNote: "Suitability is inferred from descriptions, not verified for every age or ability.",
    copied: "Course link copied", copyFailed: "Could not copy. The course link is in your address bar.",
    savedToast: "Walk saved on this device", removedToast: "Walk removed from saved", storageError: "Saved for this session only; browser storage is unavailable.",
    officialPdf: "Source PDF", zoomIn: "Zoom in", zoomOut: "Zoom out"
  },
  ja: {
    skip: "コース一覧へ", brandSub: "自然の中で、健康ウオーキング。", explore: "コースを探す", saved: "保存したコース",
    eyebrow: "クアオルト健康ウオーキング", title: "自分に合う道を見つけよう。", savedTitle: "次に歩きたい道。",
    loading: "コースを読み込み中...", searchLabel: "コース検索", searchPlaceholder: "地域名・コース名・見どころ",
    region: "地域", allJapan: "全国", distance: "距離", anyDistance: "すべての距離",
    under2: "2km以下", under3: "3km以下", under5: "5km以下", terrain: "起伏",
    anyTerrain: "すべての地形", gentle: "平坦・ゆるやか", rolling: "起伏あり", hilly: "坂・高原",
    walkingWith: "一緒に歩く人", anyone: "指定なし", children: "子ども", older: "高齢者",
    mappedOnly: "地図にルートを描画済み", sourceTrace: "出典から転記した概略ルート", pendingTrace: "ルートの位置合わせ待ち",
    sourceTraceNote: "出典マップの道筋をランドマークに合わせた概略図です。GPSで測量したルートではありません。",
    pendingTraceNote: "公表距離は確認済みです。地図上への描画にはランドマークとの位置合わせが必要です。",
    alignmentSources: "位置合わせのランドマーク", downloadRoute: "このルートをダウンロード（GeoJSON）", sourceTime: "出典に記載された時間",
    routeLoadError: "ルート線を読み込めませんでした。再読み込みしてください。コース詳細は利用できます。",
    publishedOnly: "公表距離があるコースのみ", walks: "コース", sort: "並べ替え", byRegion: "地域順",
    shortest: "距離が短い順", gentlest: "起伏が少ない順", reset: "リセット", guideSource: "クアオルトコースガイド",
    back: "検索結果へ", share: "コースのリンクをコピー", save: "コースを保存", unsave: "保存を解除",
    mapTitle: "一歩ずつ、日本を歩こう", fitResults: "検索結果を地図に表示", pinNote: "おおよそのコース位置",
    mapError: "地図を読み込めません。コース一覧は引き続き利用できます。", retry: "再試行",
    unknownDistance: "距離未確認", unknown: "未確認", published: "出典に記載された距離",
    time: "歩行時間", minutes: "分", timeEstimate: "時速3km・休憩を除く目安",
    elevation: "累積高度差", elevationNote: "マップに記載された数値", inferred: "説明文から推定",
    terrainNote: "起伏は説明文からの推定です。最大勾配は未確認です。", suitability: "どんな人に合いそう？",
    good: "適している可能性", ok: "現地条件を確認", caution: "十分な注意が必要", not_recommended: "推奨しません",
    suitabilityNote: "暫定的な目安であり、バリアフリーを保証する評価ではありません。個人の体力や路面状況、付き添いの有無によって異なります。",
    why: "この目安の理由", places: "道中の見どころ", pdf: "元のコースマップを開く",
    locationNote: "ピンはおおよそのコースエリアです。正式な出発地点は公式マップで確認してください。",
    original: "公式のコース名・説明", sources: "出典とデータについて", courseSource: "元のコースPDF",
    guide: "公式コースガイド", methodSources: "適性の判断に用いた参考資料",
    unconfirmedNote: "このコースの距離はまだ確認できていません。コースPDFでご確認ください。",
    sourceLengthNote: "距離は出典テキストまたはマップの凡例に基づきます。歩行時間は休憩を含まない計画用の目安です。",
    practical: "出発前の確認", practicalNote: "トイレ、休憩所、段差のないルート、現在の通行止めは未確認です。季節の注意事項やクマの出没情報も含め、現地のガイドや運営者に確認してください。",
    related: "同じ地域のコース", showSchematic: "未検証の地点スケッチを表示",
    schematicNote: "コース周辺に模式的に配置した地点です。実際の道筋や見どころの座標を示すものではありません。",
    noResults: "条件に合うコースがありません。", noResultsCopy: "地域を変えるか、距離の条件を広げてみてください。",
    noSaved: "次に歩きたいコースを。", noSavedCopy: "保存したコースは、この端末で確認できます。",
    exploreAll: "すべてのコースを見る", loadError: "コースを読み込めませんでした。", loadErrorCopy: "接続を確認し、もう一度お試しください。",
    filterDistanceNote: "距離の絞り込みは公表値のみを使います。未確認のコースは除きます。",
    filterAudienceNote: "適性は説明文からの推定で、すべての年齢や体力に対する確認済みの評価ではありません。",
    copied: "コースのリンクをコピーしました", copyFailed: "コピーできませんでした。アドレスバーのリンクをご利用ください。",
    savedToast: "この端末に保存しました", removedToast: "保存を解除しました", storageError: "ブラウザに保存できないため、このセッション中のみ有効です。",
    officialPdf: "出典PDF", zoomIn: "拡大", zoomOut: "縮小"
  }
};
const areaTranslations = new Map([
  ["青森県 青森市", "Aomori City, Aomori"],
  ["岩手県 北上市 “the campus 〜トロイカの森〜”（民間企業）", "Kitakami City, Iwate / the campus - Troika Forest"],
  ["岩手県 滝沢市", "Takizawa City, Iwate"],
  ["岩手県 一戸町", "Ichinohe Town, Iwate"],
  ["岩手県 岩手町", "Iwate Town, Iwate"],
  ["秋田県 三種町", "Mitane Town, Akita"],
  ["山形県 上山市", "Kaminoyama City, Yamagata"],
  ["山形県 天童市", "Tendo City, Yamagata"],
  ["山形県 西川町", "Nishikawa Town, Yamagata"],
  ["埼玉県 所沢市", "Tokorozawa City, Saitama"],
  ["埼玉県 横瀬町", "Yokoze Town, Saitama"],
  ["群馬県 上野村", "Ueno Village, Gunma"],
  ["新潟県 妙高市", "Myoko City, Niigata"],
  ["長野県 東御市", "Tomi City, Nagano"],
  ["石川県 珠洲市", "Suzu City, Ishikawa"],
  ["岐阜県 岐阜市", "Gifu City, Gifu"],
  ["岐阜県 岐阜市 都市型コース（クアの道®・シティ）", "Gifu City, Gifu / Urban Kurort City Course"],
  ["岐阜県 関市", "Seki City, Gifu"],
  ["岐阜県 美濃加茂市", "Minokamo City, Gifu"],
  ["岐阜県 飛騨市", "Hida City, Gifu"],
  ["岐阜県 下呂市", "Gero City, Gifu"],
  ["岐阜県 白川村", "Shirakawa Village, Gifu"],
  ["静岡県 小山町", "Oyama Town, Shizuoka"],
  ["愛知県 名古屋市緑区 都市型コース（クアの道®・シティ）", "Midori Ward, Nagoya, Aichi / Urban Kurort City Course"],
  ["愛知県 名古屋市中区 都市型コース（クアの道®・パーク）", "Naka Ward, Nagoya, Aichi / Urban Kurort Park Course"],
  ["愛知県 岡崎市", "Okazaki City, Aichi"],
  ["愛知県 豊橋市", "Toyohashi City, Aichi"],
  ["三重県 志摩市", "Shima City, Mie"],
  ["三重県志摩市", "Shima City, Mie"],
  ["滋賀県 高島市", "Takashima City, Shiga"],
  ["兵庫県 多可町", "Taka Town, Hyogo"],
  ["岡山県 新見市", "Niimi City, Okayama"],
  ["長崎県 西海市", "Saikai City, Nagasaki"],
  ["大分県 由布市", "Yufu City, Oita"],
  ["宮崎県 延岡市", "Nobeoka City, Miyazaki"]
]);


const t = (key) => translations[state.lang][key] || key;
const e = (value) => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const icon = (name) => '<i data-lucide="' + name + '" aria-hidden="true"></i>';
const local = (object, prefix) => object?.[prefix + "_" + state.lang] || object?.[prefix + "_en"] || "";
function icons() { window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } }); }
function area(course) { return state.lang === "en" ? areaTranslations.get(course.prefecture_area) || course.prefecture_area : course.prefecture_area; }
function distanceLabel(course) { const km = publishedDistance(course); return km === null ? t("unknownDistance") : local(course.source_distance,"display") || km + (state.lang === "ja" ? "km" : " km"); }
function terrainLabel(course) { return local(course.walking_profile?.hilliness, "label") || t("unknown"); }
function searchText(course) {
  return [course.course_name, course.prefecture_area, areaTranslations.get(course.prefecture_area),
    course.description_short, course.description, ...(course.visible_points_of_interest || []),
    course.walking_profile?.hilliness?.label_en, course.walking_profile?.hilliness?.label_ja].join(" ");
}
function filters() {
  return {
    query: $("#course-search").value, area: $("#area-filter").value, distance: $("#distance-filter").value,
    terrain: $("#terrain-filter").value, audience: $("#audience-filter").value,
    published: $("#published-filter").checked, mapped: $("#mapped-filter").checked, savedOnly: state.tab === "saved", saved: state.saved
  };
}
function storePreference(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
let toastTimer;
function toast(message) {
  $("#toast").textContent = message; $("#toast").hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $("#toast").hidden = true; }, 3500);
}
function saveCourse(id) {
  if (!state.courses.some(course => course.id === id)) return;
  const focusedSave = document.activeElement?.dataset.saveId;
  if (state.saved.has(id)) state.saved.delete(id); else state.saved.add(id);
  const stored = storePreference("kurort-saved", [...state.saved]);
  toast(t(stored ? (state.saved.has(id) ? "savedToast" : "removedToast") : "storageError"));
  applyFilter();
  if (state.selectedId) updateDetailSave();
  if (focusedSave) {
    const button = [...document.querySelectorAll("[data-save-id]")].find(node => node.dataset.saveId === focusedSave);
    (button || document.querySelector("[data-reset]") || $("#course-search")).focus({ preventScroll: true });
  }
}
function updateDetailSave() {
  const saved = state.saved.has(state.selectedId);
  $("#detail-save").classList.toggle("is-saved", saved);
  $("#detail-save").title = t(saved ? "unsave" : "save");
  $("#detail-save").setAttribute("aria-label", $("#detail-save").title);
  $("#detail-save").setAttribute("aria-pressed", String(saved));
}
function renderList() {
  $("#course-count").textContent = state.filtered.length;
  $("#saved-count").textContent = state.saved.size;
  $("#browse-title").textContent = t(state.tab === "saved" ? "savedTitle" : "title");
  const regionCount = new Set(state.courses.map(c => c.prefecture_area.split(/[県府都道]/)[0])).size;
  $("#inventory-summary").textContent = state.lang === "ja"
    ? state.courses.length + "コース · " + regionCount + "都府県"
    : state.courses.length + " walks across " + regionCount + " prefectures";
  $("#coverage-count").textContent = state.lang === "ja" ? "全国" : "JAPAN";
  $("#map-summary").textContent = state.lang === "ja"
    ? state.filtered.length + "コース · ルート描画済み " + state.filtered.filter(c => state.pathLayers.has(c.id)).length + "件"
    : state.filtered.length + " courses · " + state.filtered.filter(c => state.pathLayers.has(c.id)).length + " routes drawn";
  $("#fit-results").disabled = !state.filtered.length;
  if (!state.filtered.length) {
    const emptySaved = state.tab === "saved" && !state.saved.size;
    $("#course-list").innerHTML = '<div class="empty-state">' + icon(emptySaved ? "bookmark" : "search-x") +
      '<h3>' + t(emptySaved ? "noSaved" : "noResults") + '</h3><p>' + t(emptySaved ? "noSavedCopy" : "noResultsCopy") +
      '</p><button class="text-button" data-reset type="button">' + t(emptySaved ? "exploreAll" : "reset") + '</button></div>';
  } else {
    $("#course-list").innerHTML = state.filtered.map(course => {
      const saved = state.saved.has(course.id);
      return '<article class="course-row terrain-' + e(terrain(course)) + '">' +
        '<button type="button" class="course-open" data-course-id="' + e(course.id) + '">' +
        '<span class="course-area">' + e(area(course)) + '</span><span class="course-name" lang="ja">' + e(course.course_name) + '</span>' +
        '<span class="course-meta"><span>' + icon("route") + e(distanceLabel(course)) + '</span><span class="terrain-label">' +
        e(terrainLabel(course)) + '</span></span></button>' +
        '<button type="button" class="icon-button row-save ' + (saved ? "is-saved" : "") + '" data-save-id="' + e(course.id) +
        '" aria-pressed="' + saved + '" aria-label="' + e(t(saved ? "unsave" : "save") + ": " + course.course_name) +
        '" title="' + t(saved ? "unsave" : "save") + '">' + icon("bookmark") + '</button></article>';
    }).join("");
  }
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === state.tab);
    button.setAttribute("aria-pressed", String(button.dataset.tab === state.tab));
  });
  icons();
}
function popup(course) {
  return '<div class="popup-area">' + e(area(course)) + '</div><div class="popup-title" lang="ja">' + e(course.course_name) +
    '</div><div class="popup-meta">' + e(distanceLabel(course)) + ' · ' + e(terrainLabel(course)) + '</div>';
}
function markerIcon(course) {
  const path = window.lucide?.icons?.Footprints;
  const html = path ? window.lucide.createElement(path).outerHTML : "";
  return L.divIcon({
    className: "course-pin terrain-" + terrain(course) + (course.id === state.selectedId ? " selected" : ""),
    html, iconSize: [30,30], iconAnchor: [15,15], popupAnchor: [0,-15]
  });
}
function setupMap() {
  if (!window.L) { $("#map-error").hidden = false; return; }
  const bounds = L.latLngBounds([24,122], [46.8,146.5]);
  state.map = L.map("map", {
    maxBounds: bounds, maxBoundsViscosity: 1, minZoom: 4, maxZoom: 18,
    zoomControl: false, scrollWheelZoom: true, attributionControl: true
  }).setView([37,137.5], 5);
  state.zoomControl = L.control.zoom({ position: "bottomright" }).addTo(state.map);
  state.tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxNativeZoom: 19, maxZoom: 18, noWrap: true, bounds,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });
  state.tiles.on("tileerror", () => { $("#map-error").hidden = false; });
  state.tiles.on("loading", () => { $("#map-error").hidden = true; });
  state.tiles.addTo(state.map);
  state.clusters = L.markerClusterGroup ? L.markerClusterGroup({
    maxClusterRadius: 38, showCoverageOnHover: false,
    spiderfyDistanceMultiplier: 1.8, animate: !matchMedia("(prefers-reduced-motion: reduce)").matches,
    iconCreateFunction: cluster => L.divIcon({
      html: '<span>' + cluster.getChildCount() + '</span>',
      className: "course-cluster", iconSize: [44,44]
    })
  }) : L.layerGroup();
  state.clusters.addTo(state.map);
  state.sourcePaths = L.layerGroup().addTo(state.map);
  new ResizeObserver(() => state.map.invalidateSize({ pan: false })).observe($("#map"));
}
function addMarkers() {
  if (!state.map) return;
  for (const course of state.courses) {
    const marker = L.marker([course.map_pin.latitude, course.map_pin.longitude], {
      icon: markerIcon(course), title: course.course_name, alt: course.course_name
    }).bindPopup(popup(course), { autoPan: true });
    marker.on("click", () => selectCourse(course.id, false));
    state.markers.set(course.id, marker);
    const feature = state.routeFeatures.get(course.id);
    if (feature) {
      const path = L.geoJSON(feature, { style: { color: "#216d98", weight: 4, opacity: .9, dashArray: "8 5" } });
      path.on("click", () => selectCourse(course.id, false));
      path.bindTooltip(course.course_name);
      state.pathLayers.set(course.id, path);
    }
  }
}
function fitResults() {
  if (!state.map || !state.filtered.length) return;
  state.map.fitBounds(state.filtered.map(c => [c.map_pin.latitude, c.map_pin.longitude]), {
    paddingTopLeft: [38,100], paddingBottomRight: [50,80], maxZoom: 12, animate: false
  });
}
function applyFilter() {
  const f = filters();
  state.filtered = state.courses.filter(course => matchesCourse(course, f, searchText(course)));
  const order = $("#sort-order").value;
  const ranks = { flat: 0, gentle: 1, rolling: 2, hilly: 3, mountain: 4, unknown: 5 };
  state.filtered.sort((a,b) => {
    if (order === "distance") {
      const difference = (publishedDistance(a) ?? Infinity) - (publishedDistance(b) ?? Infinity);
      if (difference && !Number.isNaN(difference)) return difference;
    }
    if (order === "terrain" && ranks[terrain(a)] !== ranks[terrain(b)]) return ranks[terrain(a)] - ranks[terrain(b)];
    return a.map_pin.latitude === b.map_pin.latitude
      ? a.course_name.localeCompare(b.course_name, "ja") : b.map_pin.latitude - a.map_pin.latitude;
  });
  if (state.clusters) {
    state.clusters.clearLayers();
    for (const course of state.filtered) state.clusters.addLayer(state.markers.get(course.id));
    // A shared or related course can remain open outside the current filters.
    if (state.selectedId && !state.filtered.some(c => c.id === state.selectedId)) {
      state.clusters.addLayer(state.markers.get(state.selectedId));
    }
  }
  renderSourcePaths();
  $("#reset-filters").hidden = !(f.query || f.area || f.distance || f.terrain || f.audience || f.published || f.mapped);
  const notes = [];
  if (f.distance) notes.push(t("filterDistanceNote"));
  if (f.audience) notes.push(t("filterAudienceNote"));
  $("#filter-note").textContent = notes.join(" ");
  $("#filter-note").hidden = !notes.length;
  renderList();
}
function renderSourcePaths() {
  if (!state.sourcePaths) return;
  state.sourcePaths.clearLayers();
  const ids = new Set(state.filtered.map(c => c.id));
  if (state.selectedId) ids.add(state.selectedId);
  for (const id of ids) {
    const path = state.pathLayers.get(id);
    if (!path) continue;
    path.setStyle({ color: id === state.selectedId ? "#005478" : "#216d98", weight: id === state.selectedId ? 6 : 4 });
    state.sourcePaths.addLayer(path);
  }
}
function clearSketch() {
  state.routeLayer?.remove(); state.routeLayer = null;
}
function renderSketch(course) {
  clearSketch();
  const points = course.course_points || [];
  if (!state.map || !points.length) return;
  const layer = L.layerGroup();
  L.polyline(points.map(p => [p.latitude,p.longitude]), {
    color: "#986428", weight: 3, dashArray: "5 8", opacity: .7
  }).addTo(layer);
  for (const point of points) {
    L.marker([point.latitude,point.longitude], {
      icon: L.divIcon({ className: "point-number", html: e(point.order), iconSize: [22,22], iconAnchor: [11,11] }),
      title: point.name
    }).bindPopup('<strong>' + e(point.name) + '</strong><p>' + t("schematicNote") + '</p>').addTo(layer);
  }
  state.routeLayer = layer.addTo(state.map);
  state.map.fitBounds(points.map(p => [p.latitude,p.longitude]), { padding: [55,70], maxZoom: 13 });
}
function metric(name, label, value, note, small = false) {
  return '<div class="metric"><dt>' + icon(name) + e(label) + '</dt><dd' + (small ? ' class="small"' : "") + '>' +
    e(value) + '</dd>' + (note ? '<small>' + e(note) + '</small>' : "") + '</div>';
}
function renderSelected(course) {
  const distance = publishedDistance(course);
  const minutes = walkingMinutes(course);
  const elevation = course.source_distance?.elevation_difference_m ?? course.source_distance?.elevation_gain_m ?? course.route_estimate?.elevation_gain_m;
  const suitability = course.walking_profile?.suitability || {};
  const signals = local(suitability, "signals");
  const related = state.courses.filter(c => c.id !== course.id && c.prefecture_area === course.prefecture_area).slice(0,3);
  const sources = [
    { url: course.map_pdf_url, label: t("courseSource") },
    { url: course.source_page_url || "http://kurortwalking.com/#course", label: t("guide") }
  ];
  $("#selected-course").innerHTML =
    '<p class="course-area">' + e(area(course)) + '</p><h2 class="detail-title" tabindex="-1" lang="ja">' + e(course.course_name) + '</h2>' +
    (state.lang === "en" ? '<p class="original-note">' + t("original") + '</p>' : "") +
    '<p class="description" lang="ja">' + e(course.description_short || "") + '</p>' +
    '<dl class="metrics">' +
    metric("route", t("distance"), distanceLabel(course), distance === null ? "" : t("published"), distance === null) +
    metric("clock-3", t("time"), minutes === null ? t("unknown") : (state.lang === "ja" ? "約" : "~") + minutes + " " + t("minutes"), minutes === null ? "" : t(course.source_distance?.walking_minutes ? "sourceTime" : "timeEstimate"), minutes === null) +
    metric("mountain", t("elevation"), Number.isFinite(elevation) ? elevation + " m" : t("unknown"), Number.isFinite(elevation) ? t("elevationNote") : "", !Number.isFinite(elevation)) +
    metric("trending-up", t("terrain"), terrainLabel(course), t("inferred"), true) + '</dl>' +
    '<a class="primary-link" href="' + e(course.map_pdf_url) + '" target="_blank" rel="noopener">' + icon("map") + t("pdf") + icon("external-link") + '</a>' +
    '<p class="location-note">' + icon("map-pin") + '<span>' + t("locationNote") + '</span></p>' +
    '<div class="route-status ' + (state.routeFeatures.has(course.id) ? '' : 'pending') + '"><strong>' + t(state.routeFeatures.has(course.id) ? 'sourceTrace' : 'pendingTrace') + '</strong><p>' + t(state.routeFeatures.has(course.id) ? 'sourceTraceNote' : 'pendingTraceNote') + '</p>' +
    (state.routeFeatures.has(course.id) ? '<button type="button" class="text-button download-route" id="download-route">' + icon('download') + t('downloadRoute') + '</button>' : '') + '</div>' +
    '<h3 class="section-label">' + t("suitability") + '</h3>' +
    ["children","older_adults"].map(target => {
      const rating = suitability[target]?.rating || "ok";
      return '<div class="suitability-row"><span>' + t(target === "children" ? "children" : "older") +
        '</span><span class="rating ' + e(rating) + '">' + t(rating) + '</span></div>';
    }).join("") + '<p class="evidence-note">' + t("suitabilityNote") + '</p>' +
    '<details><summary>' + t("why") + '</summary><p>' + e(local(suitability, "note")) + '</p>' +
    (Array.isArray(signals) ? '<ul>' + signals.map(signal => '<li>' + e(signal) + '</li>').join("") + '</ul>' : "") + '</details>' +
    ((course.visible_points_of_interest || []).length ? '<h3 class="section-label">' + t("places") + '</h3><ul class="point-list" lang="ja">' +
      course.visible_points_of_interest.map(p => '<li>' + e(p) + '</li>').join("") + '</ul>' : "") +
    '<details><summary>' + t("practical") + '</summary><p>' + t("practicalNote") + '</p></details>' +
    '<details><summary>' + t("sources") + '</summary><p>' + t(distance === null ? "unconfirmedNote" : "sourceLengthNote") + '</p>' +
    '<p>' + t("terrainNote") + '</p><ul class="source-links">' +
    sources.map(s => '<li><a href="' + e(s.url) + '" target="_blank" rel="noopener">' + e(s.label) + '</a></li>').join("") +
    '</ul>' + (course.route_geometry?.control_sources?.length ? '<p>' + t('alignmentSources') + '</p><ul class="source-links">' +
      course.route_geometry.control_sources.map(url => '<li><a href="' + e(url) + '" target="_blank" rel="noopener">' + e(url) + '</a></li>').join('') + '</ul>' : '') +
    '<p>' + t("methodSources") + '</p><ul class="source-links">' +
    (state.metadata.suitability_methodology?.sources || []).map(s =>
      '<li><a href="' + e(s.url) + '" target="_blank" rel="noopener">' + e(local(s,"label") || s.label) + '</a></li>').join("") + '</ul></details>' +
    ((course.course_points || []).length ? '<label class="checkbox-row schematic-label"><input id="show-sketch" type="checkbox" /><span>' + t("showSchematic") +
      '</span></label><p class="schematic-note">' + t("schematicNote") + '</p>' : "") +
    (related.length ? '<h3 class="section-label">' + t("related") + '</h3>' + related.map(c =>
      '<button type="button" class="related-button" data-related-id="' + e(c.id) + '"><span lang="ja">' + e(c.course_name) +
      '</span><small>' + e(distanceLabel(c)) + ' · ' + e(terrainLabel(c)) + '</small></button>').join("") : "");
  $("#show-sketch")?.addEventListener("change", event => {
    if (event.target.checked) renderSketch(course); else clearSketch();
  });
  updateDetailSave(); icons();
  $("#download-route")?.addEventListener("click", () => {
    const feature = state.routeFeatures.get(course.id);
    if (!feature) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify({ type:'FeatureCollection', features:[feature] }, null, 2)], { type:'application/geo+json' }));
    const link = document.createElement('a'); link.href = url; link.download = course.id + '.geojson'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
function updateUrl() {
  const url = new URL(location.href);
  if (state.selectedId) url.searchParams.set("course", state.selectedId); else url.searchParams.delete("course");
  url.searchParams.set("lang", state.lang);
  history.replaceState(null, "", url);
}
function selectCourse(id, shouldZoom = true) {
  const course = state.courses.find(c => c.id === id);
  if (!course) return;
  clearSketch();
  const previous = state.selectedId;
  if (!previous) state.listScroll = $("#course-list").scrollTop;
  state.selectedId = id;
  $("#browse-panel").hidden = true;
  $("#detail-panel").hidden = false;
  renderSelected(course);
  renderSourcePaths();
  $("#selected-course").scrollTop = 0;
  if (previous && state.markers.has(previous)) state.markers.get(previous).setIcon(markerIcon(state.courses.find(c => c.id === previous)));
  const marker = state.markers.get(id);
  if (marker) {
    state.clusters.addLayer(marker);
    marker.setIcon(markerIcon(course));
    if (shouldZoom) {
      const route = state.pathLayers.get(id);
      if (route) state.map.fitBounds(route.getBounds(), { paddingTopLeft:[45,110], paddingBottomRight:[60,85], maxZoom:16, animate:false });
      else state.map.setView(marker.getLatLng(), 13, { animate: false });
      if (state.clusters.zoomToShowLayer) state.clusters.zoomToShowLayer(marker, () => marker.openPopup());
      else marker.openPopup();
    } else marker.openPopup();
  }
  updateUrl();
  $(".detail-title").focus({ preventScroll: true });
  if (matchMedia("(max-width:720px)").matches) $(".explorer").scrollIntoView({ block: "start" });
}
function closeDetails(focus = true) {
  const previous = state.selectedId;
  state.selectedId = null; clearSketch();
  $("#detail-panel").hidden = true; $("#browse-panel").hidden = false;
  state.map?.closePopup();
  if (previous && state.markers.has(previous)) state.markers.get(previous).setIcon(markerIcon(state.courses.find(c => c.id === previous)));
  updateUrl(); applyFilter();
  $("#course-list").scrollTop = state.listScroll;
  if (focus) {
    const button = [...document.querySelectorAll("[data-course-id]")].find(b => b.dataset.courseId === previous);
    (button || $("#course-search")).focus({ preventScroll: true });
  }
}
function resetFilters(explore = false) {
  $("#course-search").value = "";
  for (const id of ["area-filter","distance-filter","terrain-filter","audience-filter"]) $("#" + id).value = "";
  $("#published-filter").checked = false; $("#sort-order").value = "region";
  $("#mapped-filter").checked = false;
  if (explore) state.tab = "explore";
  applyFilter(); fitResults();
}
function applyLanguage() {
  document.documentElement.lang = state.lang;
  document.title = state.lang === "ja" ? "クアオルト日本 | 自分に合う道" : "Kurort Japan | Find Your Walk";
  document.querySelectorAll("[data-i18n]").forEach(node => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(node => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-title]").forEach(node => {
    node.title = t(node.dataset.i18nTitle); node.setAttribute("aria-label", node.title);
  });
  document.querySelectorAll("[data-lang]").forEach(button => {
    button.classList.toggle("active", button.dataset.lang === state.lang);
    button.setAttribute("aria-pressed", String(button.dataset.lang === state.lang));
  });
  const selectedArea = $("#area-filter").value;
  $("#area-filter").innerHTML = '<option value="">' + t("allJapan") + '</option>' +
    [...new Set(state.courses.map(c => c.prefecture_area))].map(value => '<option value="' + e(value) + '">' + e(area({ prefecture_area: value })) + '</option>').join("");
  $("#area-filter").value = selectedArea;
  for (const course of state.courses) state.markers.get(course.id)?.setPopupContent(popup(course));
  if (state.selectedId) { clearSketch(); renderSelected(state.courses.find(c => c.id === state.selectedId)); }
  $(".leaflet-control-zoom-in")?.setAttribute("aria-label", t("zoomIn"));
  $(".leaflet-control-zoom-out")?.setAttribute("aria-label", t("zoomOut"));
  applyFilter(); updateUrl(); icons();
}
async function loadCourses() {
  try {
    const response = await fetch("data/japan_kurort_path_inventory.json");
    if (!response.ok) throw new Error("Dataset unavailable");
    const data = await response.json();
    state.metadata = data.metadata || {};
    state.courses = data.courses.filter(c => Number.isFinite(c.map_pin?.latitude) && Number.isFinite(c.map_pin?.longitude));
    try {
      const routeResponse = await fetch("data/japan_kurort_routes.geojson");
      if (!routeResponse.ok) throw new Error('Route data unavailable');
      const routes = await routeResponse.json();
      state.routeFeatures = new Map(routes.features.map(feature => [feature.properties.course_id,feature]));
    } catch { toast(t('routeLoadError')); }
    state.saved = new Set([...state.saved].filter(id => state.courses.some(c => c.id === id)));
    addMarkers(); applyLanguage(); fitResults();
  } catch (error) {
    console.error(error);
    $("#course-list").innerHTML = '<div class="empty-state"><h3>' + t("loadError") + '</h3><p>' + t("loadErrorCopy") +
      '</p><button type="button" class="text-button" id="retry-data">' + t("retry") + '</button></div>';
    $("#inventory-summary").textContent = t("loadError");
    $("#retry-data").addEventListener("click", loadCourses);
  }
}
const initialUrl = new URL(location.href);
const initialCourse = initialUrl.searchParams.get("course");
if (["en","ja"].includes(initialUrl.searchParams.get("lang"))) state.lang = initialUrl.searchParams.get("lang");
state.selectedId = null;
$("#course-search").addEventListener("input", applyFilter);
for (const id of ["area-filter","distance-filter","terrain-filter","audience-filter","published-filter","mapped-filter"]) {
  $("#" + id).addEventListener("change", () => { applyFilter(); fitResults(); });
}
$("#sort-order").addEventListener("change", applyFilter);
$("#reset-filters").addEventListener("click", () => resetFilters());
$("#fit-results").addEventListener("click", fitResults);
$("#retry-map").addEventListener("click", () => { $("#map-error").hidden = true; state.tiles?.redraw(); });
$("#back-button").addEventListener("click", () => closeDetails());
$("#detail-save").addEventListener("click", () => saveCourse(state.selectedId));
$("#share-button").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(location.href); toast(t("copied")); } catch { toast(t("copyFailed")); }
});
document.querySelectorAll("[data-lang]").forEach(button => button.addEventListener("click", () => {
  state.lang = button.dataset.lang; storePreference("kurort-language", state.lang); applyLanguage();
}));
document.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => {
  state.tab = button.dataset.tab; closeDetails(false); resetFilters(); fitResults();
}));
$("#course-list").addEventListener("click", event => {
  const save = event.target.closest("[data-save-id]");
  const course = event.target.closest("[data-course-id]");
  if (save) saveCourse(save.dataset.saveId);
  else if (course) selectCourse(course.dataset.courseId);
  else if (event.target.closest("[data-reset]")) resetFilters(state.tab === "saved" && !state.saved.size);
});
$("#selected-course").addEventListener("click", event => {
  const related = event.target.closest("[data-related-id]");
  if (related) selectCourse(related.dataset.relatedId);
});
document.addEventListener("keydown", event => { if (event.key === "Escape" && state.selectedId) closeDetails(); });
setupMap();
icons();
await loadCourses();
if (initialCourse) selectCourse(initialCourse);
