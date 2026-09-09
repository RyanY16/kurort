import fs from "node:fs";

const inventoryPath = "data/japan_kurort_path_inventory.json";

const splits = {
  akita_akita01: [
    {
      id: "akita_akita01_long",
      course_name: "森岳温泉石倉山コース ロングコース",
      length_km: 2.4,
      elevation_gain_m: 124,
      color: "green",
      pinOffset: [0.0012, -0.0012],
      description_short: "石倉山公園を長めに歩くロングコース"
    },
    {
      id: "akita_akita01_mountain",
      course_name: "森岳温泉石倉山コース 山コース",
      length_km: 2.2,
      elevation_gain_m: 116,
      color: "red",
      pinOffset: [0.0002, 0.0014],
      description_short: "石倉山公園の山側を活用するコース"
    },
    {
      id: "akita_akita01_marsh",
      course_name: "森岳温泉石倉山コース 沼コース",
      length_km: 2.1,
      elevation_gain_m: 71,
      color: "blue",
      pinOffset: [-0.0012, -0.0003],
      description_short: "石倉山公園の沼まわりを歩く短めのコース"
    }
  ],
  iwate_ichinohe_iwate_ichinohe_okunakayama: [
    {
      id: "iwate_ichinohe_iwate_ichinohe_okunakayama_yamanohibiki",
      course_name: "奥中山高原コース 山の響きコース",
      length_km: 1.95,
      elevation_gain_m: 102,
      color: "purple",
      pinOffset: [0.0013, 0.0006],
      description_short: "奥中山高原のゲレンデを歩く高原コース"
    },
    {
      id: "iwate_ichinohe_iwate_ichinohe_okunakayama_midorinosanpomichi",
      course_name: "奥中山高原コース 緑の散歩道コース",
      length_km: 1.78,
      elevation_gain_m: 70,
      color: "green",
      pinOffset: [-0.0011, -0.0007],
      description_short: "比較的緩やかな奥中山高原の散歩道コース"
    }
  ],
  gifu02_gifu01: [
    {
      id: "gifu02_gifu01_morinosanpomichi",
      course_name: "トヨタ白川郷自然學校コース 森の散歩道コース",
      length_km: 1.12,
      elevation_gain_m: 59,
      color: "green",
      pinOffset: [0.0008, -0.001],
      description_short: "白川郷自然學校周辺の短く手軽な森の散歩道コース"
    },
    {
      id: "gifu02_gifu01_shiratani",
      course_name: "トヨタ白川郷自然學校コース 白谷眺望コース",
      length_km: 2.11,
      elevation_gain_m: 110,
      color: "red",
      pinOffset: [0.0015, 0.001],
      description_short: "白谷方面の眺望を楽しむ中程度の森のコース"
    },
    {
      id: "gifu02_gifu01_tenbodai",
      course_name: "トヨタ白川郷自然學校コース 展望台コース",
      length_km: 2.49,
      elevation_gain_m: 107,
      color: "blue",
      pinOffset: [-0.0013, 0.0012],
      description_short: "展望台へ向かう、しっかり歩く白川郷自然學校コース"
    }
  ],
  aichi_nagoya_midori_aichi03_midoriku: [
    {
      id: "aichi_nagoya_midori_aichi03_midoriku_odaka_castle_sake",
      course_name: "自然と歴史を感じる大高コース 大高城跡・酒蔵コース",
      length_km: 3.03,
      elevation_gain_m: 30,
      color: "purple",
      pinOffset: [0.0008, -0.0013],
      description_short: "大高城跡と酒蔵のあるまちなみを巡る都市型コース"
    },
    {
      id: "aichi_nagoya_midori_aichi03_midoriku_washizu_marune",
      course_name: "自然と歴史を感じる大高コース 鷲津砦・丸根砦コース",
      length_km: 4.43,
      elevation_gain_m: 76,
      color: "green",
      pinOffset: [-0.0008, 0.0013],
      description_short: "鷲津砦跡と丸根砦跡を巡る大高の歴史コース"
    }
  ]
};

const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
const existingIds = new Set(inventory.courses.map((course) => course.id));
const nextCourses = [];
let splitCount = 0;

function cloneWithSplit(base, split) {
  const course = JSON.parse(JSON.stringify(base));
  const [latOffset, lngOffset] = split.pinOffset;

  course.id = split.id;
  course.course_name = split.course_name;
  course.description_short = split.description_short || base.description_short;
  course.description = `${split.description_short || base.description_short}。${base.description || ""}`.trim();
  course.route_variant_of = base.id;
  course.route_variant_source = "Printed route legend in original PDF map or source page text.";
  course.source_distance = {
    km: split.length_km,
    display_en: `${split.length_km} km`,
    display_ja: `${split.length_km}km`,
    elevation_gain_m: split.elevation_gain_m,
    source: "original_pdf_map"
  };
  course.map_pin = {
    ...base.map_pin,
    latitude: Number((base.map_pin.latitude + latOffset).toFixed(6)),
    longitude: Number((base.map_pin.longitude + lngOffset).toFixed(6)),
    label: split.course_name,
    precision: "approximate_subcourse_pin_from_source_map",
    verified_for_navigation: false,
    note: "Pin is offset within the same source map area so each printed subcourse can be clicked separately. It is not a navigation-grade start point."
  };
  course.path_data = {
    ...base.path_data,
    route_polyline_available: false,
    source_subcourse_color: split.color
  };

  return course;
}

for (const course of inventory.courses) {
  const courseSplits = splits[course.id];
  if (!courseSplits) {
    nextCourses.push(course);
    continue;
  }

  const alreadySplit = courseSplits.every((split) => existingIds.has(split.id));
  if (alreadySplit) {
    continue;
  }

  for (const split of courseSplits) {
    nextCourses.push(cloneWithSplit(course, split));
    splitCount += 1;
  }
}

inventory.courses = nextCourses;
inventory.metadata.count = nextCourses.length;
inventory.metadata.coordinate_count = nextCourses.filter((course) => course.map_pin).length;
inventory.metadata.multi_course_split_note =
  "Some source PDFs contain multiple printed route options. These have been split into separate prototype records with their own approximate pins and source-stated distance/elevation values where legible.";

fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
console.log(`Split ${splitCount} subcourse records. Dataset now has ${nextCourses.length} courses.`);
