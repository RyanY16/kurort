import fs from 'node:fs';

const inventoryPath = 'data/japan_kurort_path_inventory.json';
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
// Values read from the printed legends. Each entry is [km, printed elevation m].
const values = {
  'aichi-nagoya-midori/aichi03_midoriku_arimatsu': [3.02,64],
  'aichi-nagoya-midori/aichi03_midoriku_narumi': [2.79,54],
  'aichi-nagoya-midori/aichi03_midoriku_okehazama': [5.08,61],
  'aichi-nagoya-midori/aichi03_midoriku_takinomizu': [4.40,93],
  'aichi-nagoya-midori/aichi03_midoriku_tokushige': [3.50,52],
  'aichi-nagoya/aichi-nagoya_nakaku': [2.77,43],
  'aichi-toyohashi/aichi_toyohashi_iwaya': [1.47,84],
  'aichi-toyohashi/aichi_toyohashi_takashi': [2.97,44],
  'aichi/aichi01': [1.92,44], 'aichi/aichi02': [2.34,104],
  'akita/akita03': [3.1,106], 'aomori/aomori01': [4.2,null],
  'gifu-gero/gifu_gero_gassho': [2.58,105], 'gifu-gero/gifu_gero_shimi': [2.54,128],
  'gifu-gifucity/gifu01_city_bairin': [4.02,36], 'gifu-gifucity/gifu01_city_shimizugawa': [4.32,27],
  'gifu-minokamo/gifu-minokamo01_map': [2.81,47], 'gifu-minokamo/gifu-minokamo02_map': [3.10,169],
  'gifu01/gifu01': [3.15,134], 'gifu01/gifu02': [2.32,68],
  'gifu03/gifu01': [1.77,76], 'gifu03/gifu02': [1.26,61], 'gifu03/hida_alps': [3.94,175],
  'gifu04/seki01': [3.15,74], 'gifu04/seki02': [1.19,58],
  'gunma-ueno/gunma01_kawanoeki': [2.43,100], 'gunma-ueno/gunma01_michinoeki': [2.26,136],
  'hyogo/hyogo01': [1.29,78], 'hyogo/hyogo02': [3.23,124],
  'ishikawa/ishikawa02': [2.5,138],
  'iwate-ichinohe/iwate_ichinohe_park': [3.39,93],
  'iwate-iwate/iwate_iwate_park': [2.16,49],
  'iwate-iwate/iwate_iwate_ishigami': [3.05,80],
  'iwate-kitakami/iwate_kitakami_thecampus': [1.61,63],
  'iwate-takizawa/iwate_takizawa_kurakakeainosawa': [2.78,83],
  'iwate-takizawa/iwate_takizawa_sogokoen': [3.21,73],
  'mie/mie01': [2.08,124], 'mie/mie02': [1.84,50],
  'miyazaki/miyazaki01': [1.79,80], 'miyazaki/miyazaki02': [2.53,81],
  'nagano-toumi/nagano_tomi_geijutsumura': [1.82,50],
  'nagano-toumi/nagano_tomi_yunomarukogen': [2.67,106],
  'nagasaki-saikai/nagasaki_saikai_isanoura': [2.1,73],
  'nagasaki-saikai/nagasaki_saikai_kyuragi': [1.81,80],
  'nagasaki-saikai/nagasaki_saikai_ooshima': [2.28,100],
  'nagasaki-saikai/nagasaki_saikai_shihondo': [1.83,74],
  'niigata-myoko/niigata_myoko_forestwalk': [2.6,62],
  'niigata-myoko/niigata_myoko_sasagamine': [4.24,111],
  'oita/oita01': [3,null], 'okayama/okayama01': [2.06,180], 'okayama/okayama02': [1.51,108],
  'saitama01/saitama01': [1.5,77], 'saitama01/saitama02': [1.39,71],
  'saitama02/saitama01': [2.62,60], 'saitama02/saitama02': [2.30,87],
  'shiga/shiga01': [2,79], 'shiga/shiga02': [2.23,83],
  'shizuoka/shizuoka01': [3.5,77], 'shizuoka/shizuoka02': [2.94,141],
  'yamagata01/yamagata02': [1.9,168], 'yamagata01/yamagata03': [3.5,199],
  'yamagata03/yamagata01': [3.3,126]
};
const replacements = {
  akita_akita02: [['windmill','釜谷浜サンセットコース 風車コース',3.1,44],['pine','釜谷浜サンセットコース 松林コース',3.2,60]],
  ishikawa_ishikawa01: [['satoyama','鉢ケ崎コース 里山コース',2.5,24],['satoumi','鉢ケ崎コース 里海コース',1.8,13]],
  yamagata01_yamagata01: [['course1','舞鶴山コース コース1',2.5,108],['course2','舞鶴山コース コース2',0.8,25],['course3','舞鶴山コース コース3',1.4,72]],
  yamagata02_kaminoyama: [
    ['nishiyama','西山コース',3.1,110],['kokuzo_kitazeki','虚空蔵山コース 北堰コース',3.7,86],
    ['kokuzo_summit','虚空蔵山コース 山頂コース',5.1,170],['hayama','葉山コース',2.6,129],
    ['sankichi_summit','三吉山コース 山頂コース',2.7,274],['sankichi_middle','三吉山コース 中腹コース',1.8,150],
    ['zao_bodaira','蔵王高原坊平コース',3.6,190],['zao_tairagura','蔵王高原坊平たいらぐらコース',2.62,75],
    ['oshimizu_juhyo','お清水・樹氷原コース',3.2,310]
  ]
};
const additions = {
  aichi_nagoya_midori_aichi03_midoriku_okehazama: [['short','桶狭間コース ショートコース',2.61,36]],
  aichi_nagoya_midori_aichi03_midoriku_takinomizu: [['short','滝ノ水コース ショートコース',2.97,57]],
  iwate_ichinohe_iwate_ichinohe_park: [['short_s1_s2','一戸町総合運動公園コース S1・S2利用',1.95,36],['short_s2','一戸町総合運動公園コース S2利用',2.71,65]],
  iwate_iwate_iwate_iwate_ishigami: [['museum','石神の丘アートコース 美術館スタート',1.62,41]],
  iwate_kitakami_iwate_kitakami_thecampus: [['short','the campus 縄文の森コース ショート',1.14,40]],
  mie_mie02: [['jiro','ともやま公園 次郎六郎コース',0.56,9]],
  nagasaki_saikai_nagasaki_saikai_isanoura: [['optional','伊佐ノ浦公園 オプションコース',2.2,37]],
  gifu04_seki01: [['viewpoint','安桜山 展望台オプションコース',0.61,41]]
};
function sourceKey(course) { return new URL(course.map_pdf_url).pathname.replace('/file/','').replace('.pdf',''); }
function sourceEvidence(course) {
  const file = 'tmp/source-review/' + sourceKey(course).replace('/', '__') + '.json';
  return JSON.parse(fs.readFileSync(file, 'utf8')).flatMap(p => p.rows.filter(r => /km|累積|高度差|高低差|全長/.test(r.text)).map(r => ({ page:p.page, text:r.text, bounding_box:r.box })));
}
function assign(course, km, elevation) {
  const approximate = ['aomori/aomori01','oita/oita01'].includes(sourceKey(course));
  const range = sourceKey(course) === 'yamagata02/kaminoyama' || ['yamagata01/yamagata01','yamagata01/yamagata02','yamagata03/yamagata01'].includes(sourceKey(course));
  course.source_distance = {
    km, approximate, display_en: (approximate ? 'About ' : '') + km + ' km',
    display_ja: (approximate ? '約' : '') + km + 'km',
    elevation_gain_m: range ? null : elevation, elevation_difference_m: elevation,
    elevation_kind: elevation === null ? 'not_stated' : range ? 'height_difference' : 'cumulative_height_difference',
    source: 'original_pdf_map', source_url: course.map_pdf_url, page: 1,
    extraction_method: 'printed_legend_review', evidence: sourceEvidence(course)
  };
  course.route_estimate = {
    distance_km: km, display_en: course.source_distance.display_en, display_ja: course.source_distance.display_ja,
    elevation_gain_m: range ? null : elevation, method: 'known_length_from_source_text', confidence: 'source_legend',
    note_en: 'Distance is printed in the source PDF; it was not calculated from the prototype landmarks.',
    note_ja: '距離は出典PDFの記載値で、模式的な地点から計算したものではありません。'
  };
  if (course.id === 'aomori_aomori01') course.source_distance.walking_minutes = 150;
}
function variant(base, spec) {
  const [suffix, name, km, elevation] = spec;
  const existing = inventory.courses.find(c => c.id === base.id + '_' + suffix);
  const c = existing || structuredClone(base);
  c.id = base.id + '_' + suffix;
  c.course_name = name;
  c.route_variant_of = base.id;
  c.route_variant_source = base.map_pdf_url;
  c.source_variant_label = name;
  // Do not invent a separate start coordinate just to separate markers; clusters handle overlap.
  c.map_pin = {...base.map_pin, label: name, verified_for_navigation:false};
  c.path_data = {...base.path_data, route_polyline_available:false, route_polyline_status:'awaiting_georeferencing'};
  delete c.route_geometry;
  delete c.course_points;
  if (base.id === 'yamagata02_kaminoyama') {
    c.map_pin.precision = 'municipality_overview_only';
    c.map_pin.note = 'This source sheet covers separate areas. A landmark-based course location is still needed.';
  }
  assign(c, km, elevation);
  return c;
}
const result = [];
const generatedIds = new Set(Object.entries({...replacements,...additions}).flatMap(([id, specs]) => specs.map(spec => id + '_' + spec[0])));
for (const course of inventory.courses) {
  if (generatedIds.has(course.id)) continue;
  if (replacements[course.id]) {
    result.push(...replacements[course.id].map(spec => variant(course, spec)));
    continue;
  }
  const value = values[sourceKey(course)];
  if (value) assign(course, ...value);
  else if (course.source_distance) assign(course, course.source_distance.km, course.source_distance.elevation_difference_m ?? course.source_distance.elevation_gain_m);
  result.push(course);
  if (additions[course.id]) result.push(...additions[course.id].map(spec => variant(course, spec)));
}
// On reruns, replaced parents are absent; retain their already imported children.
for (const course of inventory.courses) if (generatedIds.has(course.id) && !result.some(c => c.id === course.id)) result.push(course);
inventory.courses = result;
inventory.metadata.count = result.length;
inventory.metadata.coordinate_count = result.filter(c => c.map_pin).length;
inventory.metadata.source_distance_count = result.filter(c => c.source_distance).length;
inventory.metadata.source_distance_reviewed_on = '2026-09-08';
inventory.metadata.source_distance_note = 'Printed lengths from all 70 source PDFs. Subroute distances remain separate; segment-only annotations are not added to the full length. Printed height differences are not automatically treated as cumulative ascent.';
inventory.metadata.source_segments = [
  {course_id:'gifu_gero_gifu_gero_gassho',label:'下呂温泉合掌村内',km:1.24,elevation_m:52,relationship:'section_of_main_route'},
  {course_id:'gifu01_gifu02',label:'金華山山頂',km:0.7,elevation_m:54,relationship:'summit_section_shown_separately'},
  {course_id:'iwate_iwate_iwate_iwate_ishigami',label:'運動強度を高めたいときのオプション',km:0.26,elevation_m:15,relationship:'optional_extension'}
];
fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
console.log('Imported printed lengths for ' + inventory.metadata.source_distance_count + '/' + result.length + ' courses.');
