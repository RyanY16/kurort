import fs from "node:fs";

const inventoryPath = "data/japan_kurort_path_inventory.json";
const csvPath = "data/japan_kurort_path_inventory.csv";

const pins = {
  aomori_aomori01: [40.891134, 140.862468, "浅虫温泉駅周辺"],
  iwate_kitakami_iwate_kitakami_thecampus: [39.3306, 141.1129, "北上市 the campus / トロイカの森周辺"],
  iwate_takizawa_iwate_takizawa_sogokoen: [39.742, 141.076, "滝沢総合公園周辺"],
  iwate_takizawa_iwate_takizawa_kurakakeainosawa: [39.817, 141.018, "鞍掛山・相の沢牧野周辺"],
  iwate_ichinohe_iwate_ichinohe_park: [40.213, 141.302, "一戸町総合運動公園周辺"],
  iwate_ichinohe_iwate_ichinohe_okunakayama: [40.061, 141.214, "奥中山高原周辺"],
  iwate_iwate_iwate_iwate_park: [39.972, 141.212, "岩手町総合運動公園周辺"],
  iwate_iwate_iwate_iwate_ishigami: [39.973, 141.218, "石神の丘美術館周辺"],
  akita_akita01: [40.103, 140.064, "森岳温泉・石倉山周辺"],
  akita_akita03: [40.045, 140.083, "琴丘地区周辺"],
  akita_akita02: [40.102, 140.006, "釜谷浜海水浴場周辺"],
  yamagata02_kaminoyama: [38.153, 140.278, "上山温泉・上山市中心部周辺"],
  yamagata01_yamagata01: [38.361, 140.374, "舞鶴山公園周辺"],
  yamagata01_yamagata02: [38.31, 140.385, "若松寺・若松観音周辺"],
  yamagata01_yamagata03: [38.426, 140.437, "天童高原周辺"],
  yamagata03_yamagata01: [38.548, 140.019, "一本ブナ・月山山麓周辺"],
  saitama01_saitama01: [35.773, 139.441, "荒幡富士特別緑地保全地区周辺"],
  saitama01_saitama02: [35.768, 139.42, "上山口堀口天満天神社周辺"],
  saitama02_saitama01: [35.984, 139.11, "花咲山公園周辺"],
  saitama02_saitama02: [35.979, 139.107, "根古屋城址周辺"],
  gunma_ueno_gunma01_michinoeki: [36.085, 138.779, "道の駅上野周辺"],
  gunma_ueno_gunma01_kawanoeki: [36.087, 138.76, "川の駅上野周辺"],
  niigata_myoko_niigata_myoko_forestwalk: [36.872, 138.178, "妙高高原・いもり池周辺"],
  niigata_myoko_niigata_myoko_sasagamine: [36.866, 138.079, "笹ヶ峰高原周辺"],
  nagano_toumi_nagano_tomi_yunomarukogen: [36.425, 138.421, "湯の丸高原周辺"],
  nagano_toumi_nagano_tomi_geijutsumura: [36.348, 138.349, "芸術むら公園周辺"],
  ishikawa_ishikawa01: [37.442, 137.263, "鉢ヶ崎海岸周辺"],
  ishikawa_ishikawa02: [37.526, 137.302, "木ノ浦海岸周辺"],
  gifu01_gifu01: [35.465, 136.797, "百々ヶ峰・ながら川ふれあいの森周辺"],
  gifu01_gifu02: [35.434, 136.782, "金華山・岐阜公園周辺"],
  gifu_gifucity_gifu01_city_shimizugawa: [35.411, 136.758, "金公園・岐阜駅・清水川周辺"],
  gifu_gifucity_gifu01_city_bairin: [35.42, 136.766, "柳ケ瀬・粕森公園・梅林公園周辺"],
  gifu04_seki01: [35.49, 136.914, "安桜山公園周辺"],
  gifu04_seki02: [35.716, 136.792, "板取株杉の森周辺"],
  gifu_minokamo_gifu_minokamo01_map: [35.444, 137.014, "太田宿・逍遙こみち周辺"],
  gifu_minokamo_gifu_minokamo02_map: [35.467, 137.06, "下米田さくらの森周辺"],
  gifu03_gifu01: [36.237, 137.19, "飛騨古川 朝霧の森周辺"],
  gifu03_gifu02: [36.236, 137.191, "飛騨古川 森林公園周辺"],
  gifu03_hida_alps: [36.295, 137.24, "飛騨市アルプス展望エリア周辺"],
  gifu_gero_gifu_gero_gassho: [35.811, 137.244, "下呂温泉合掌村周辺"],
  gifu_gero_gifu_gero_shimi: [35.753, 137.272, "四美地区周辺"],
  gifu02_gifu01: [36.259, 136.892, "トヨタ白川郷自然學校周辺"],
  shizuoka_shizuoka01: [35.362, 138.868, "須走・富士山眺望エリア周辺"],
  shizuoka_shizuoka02: [35.336, 138.986, "足柄古道・銚子ヶ淵周辺"],
  aichi_nagoya_midori_aichi03_midoriku_takinomizu: [35.091, 136.973, "滝ノ水公園周辺"],
  aichi_nagoya_midori_aichi03_midoriku_tokushige: [35.095, 137.0, "徳重支所・神沢池周辺"],
  aichi_nagoya_midori_aichi03_midoriku_okehazama: [35.052, 136.97, "桶狭間古戦場公園周辺"],
  aichi_nagoya_midori_aichi03_midoriku_arimatsu: [35.066, 136.971, "有松旧東海道周辺"],
  aichi_nagoya_midori_aichi03_midoriku_narumi: [35.08, 136.954, "鳴海宿・成海神社周辺"],
  aichi_nagoya_midori_aichi03_midoriku: [35.068, 136.94, "大高城跡・大高地区周辺"],
  aichi_nagoya_aichi_nagoya_nakaku: [35.171, 136.909, "久屋大通公園周辺"],
  aichi_aichi01: [34.956, 137.158, "岡崎城公園周辺"],
  aichi_aichi02: [35.025, 137.33, "岡崎市下山地区周辺"],
  aichi_toyohashi_aichi_toyohashi_iwaya: [34.741, 137.435, "岩屋緑地周辺"],
  aichi_toyohashi_aichi_toyohashi_takashi: [34.723, 137.386, "高師緑地周辺"],
  mie_mie01: [34.311, 136.812, "横山展望台・横山天空周辺"],
  mie_mie02: [34.278, 136.807, "ともやま公園周辺"],
  shiga_shiga01: [35.355, 135.925, "森林公園くつきの森周辺"],
  shiga_shiga02: [35.358, 135.914, "グリーンパーク想い出の森周辺"],
  hyogo_hyogo01: [35.066, 134.927, "エーデルささゆり周辺"],
  hyogo_hyogo02: [35.039, 134.898, "なか・やちよの森公園周辺"],
  okayama_okayama01: [34.976, 133.47, "新見富士周辺"],
  okayama_okayama02: [34.943, 133.568, "満奇洞周辺"],
  nagasaki_saikai_nagasaki_saikai_shihondo: [32.994, 129.663, "四本堂公園周辺"],
  nagasaki_saikai_nagasaki_saikai_isanoura: [33.01, 129.76, "伊佐ノ浦公園周辺"],
  nagasaki_saikai_nagasaki_saikai_kyuragi: [32.995, 129.723, "久良木森林浴の森周辺"],
  nagasaki_saikai_nagasaki_saikai_ooshima: [33.003, 129.632, "大島若人の森周辺"],
  oita_oita01: [33.257, 131.348, "大杵社・由布院周辺"],
  miyazaki_miyazaki01: [32.589, 131.655, "金堂ヶ池・西階運動公園周辺"],
  miyazaki_miyazaki02: [32.701, 131.802, "ビーチの森すみえ・須美江海水浴場周辺"]
};

const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));

for (const course of inventory.courses) {
  const pin = pins[course.id];
  if (!pin) {
    course.map_pin = null;
    continue;
  }

  course.map_pin = {
    latitude: pin[0],
    longitude: pin[1],
    label: pin[2],
    coordinate_system: "WGS84",
    precision: "approximate_course_or_start_area",
    use_case: "Japan overview map marker",
    verified_for_navigation: false,
    note: "Pin is suitable for placing the course on a Japan map. It is not a traced walking path or navigation-grade start point."
  };

  course.path_data = {
    ...course.path_data,
    map_pin_available: true,
    route_polyline_available: false,
    route_polyline_status: "not_traced_from_pdf_yet"
  };
}

inventory.metadata.coordinate_note =
  "map_pin coordinates are approximate WGS84 pins for Japan-map display. Full course polylines are not available from the source HTML and need tracing from PDF maps.";
inventory.metadata.coordinate_count = inventory.courses.filter((course) => course.map_pin).length;

fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));

const cols = [
  "id",
  "prefecture_area",
  "course_name",
  "latitude",
  "longitude",
  "pin_label",
  "precision",
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
      course.map_pin?.label,
      course.map_pin?.precision,
      course.path_data?.route_polyline_available,
      course.map_pdf_url,
      course.description_short
    ].map(csv).join(",")
  );
}

fs.writeFileSync(csvPath, lines.join("\n"));
console.log(`Updated ${inventory.metadata.coordinate_count}/${inventory.courses.length} course pins`);
