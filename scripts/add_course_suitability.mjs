import fs from "node:fs";

const inventoryPath = "data/japan_kurort_path_inventory.json";

const methodologySources = [
  {
    id: "kurortwalking_course_guide",
    label: "Kurort Health Walking Course Guide",
    url: "http://kurortwalking.com/",
    use: "Primary source for course descriptions, map PDFs, guide comments, and visible points of interest."
  },
  {
    id: "nagoya_midori_kurort",
    label: "Nagoya Midori Ward Kurort Health Walking page",
    url: "https://www.city.nagoya.jp/midori/miryoku/1024819/1024843/1040794/1048361.html",
    use: "Source for the general Kurort walking principle: not competing on speed/distance, aiming for 55-60% exercise intensity and a heart-rate target of 160 minus age."
  },
  {
    id: "gifu_ugokute_effects",
    label: "Gifu City Ugokute - Kurort walking effects",
    url: "https://www.city.gifu.lg.jp/ugokute/3000048/3000094/3000098/index.html",
    use: "Source for the value of guide advice, safe walking, health checks, and natural features such as forest bathing, views, water sounds, and birdsong."
  },
  {
    id: "gifu_course_fitness_levels",
    label: "Gifu City Kurort course fitness levels",
    url: "https://www.city.gifu.lg.jp/kenko/kenkouzukuri/1004257/1038575/1004261/index.html",
    use: "Source for using distance, cumulative elevation difference, and speed as practical route difficulty signals."
  },
  {
    id: "kurort_quality_standards",
    label: "Japan Kurort Research Institute - Kurort quality standards",
    url: "https://kurort.co.jp/about/",
    use: "Source for treating natural environment, climate, road-surface slope/change, safety measures, and trained guides as core course-quality signals."
  },
  {
    id: "myoko_city_kurort",
    label: "Myoko City Kurort Health Walking page",
    url: "https://www.city.myoko.niigata.jp/docs/65353.html",
    use: "Source showing municipal course pages can add useful signals such as self-guided availability, guide availability, and seasonal/usage conditions."
  },
  {
    id: "workersdoctors_course_selection",
    label: "Workers Doctors Kurort course selection article",
    url: "https://www.workersdoctors.co.jp/column/healthcare/kurorthealthworking/",
    use: "Secondary heuristic source for using course length and elevation difference when selecting a plan; cites examples around 1.5 km as easier and 3.3 km/126 m as intermediate."
  }
];

const knownLengths = {
  aichi_nagoya_midori_aichi03_midoriku: {
    display_en: "3.03 km / 4.43 km options",
    display_ja: "3.03km / 4.43kmのコースあり",
    confidence: "source_page"
  },
  aichi_nagoya_midori_aichi03_midoriku_okehazama: {
    display_en: "About 5 km, plus short option",
    display_ja: "約5km、ショートコースあり",
    confidence: "source_page"
  }
};

const overrides = {
  hyogo_hyogo01: {
    hilliness: "gentle",
    older_adults: "good",
    children: "good",
    reason_en: "The source text explicitly says it is easy for older adults and people without exercise habits.",
    reason_ja: "出典文に、運動習慣がない方や高齢者にも歩きやすい静かなコースとあります。"
  },
  okayama_okayama01: {
    hilliness: "hilly",
    older_adults: "caution",
    children: "caution",
    reason_en: "The source text notes strong slopes in places.",
    reason_ja: "出典文に、かなり傾斜が強い場所があるとあります。"
  },
  gifu03_hida_alps: {
    hilliness: "hilly",
    older_adults: "caution",
    children: "caution",
    reason_en: "The course is described as suitable for people who want a solid workout in a highland forest.",
    reason_ja: "高地の森を歩く、しっかり運動したい人向けのコースと説明されています。"
  },
  niigata_myoko_niigata_myoko_sasagamine: {
    hilliness: "hilly",
    older_adults: "caution",
    children: "caution",
    reason_en: "The course is in a 1,300 m highland area inside a national park.",
    reason_ja: "国立公園内、標高1300mの高原コースです。"
  },
  nagano_toumi_nagano_tomi_yunomarukogen: {
    hilliness: "hilly",
    older_adults: "caution",
    children: "caution",
    reason_en: "The route is in a highland area around 1,750 m with mountain scenery.",
    reason_ja: "標高1750m前後の高原エリアで、山岳的な環境です。"
  },
  mie_mie02: {
    hilliness: "gentle",
    older_adults: "good",
    children: "good",
    reason_en: "The source mentions children and beginners can join nearby activities, and the route is park/coast based.",
    reason_ja: "公園・海岸を中心としたコースで、周辺体験は子どもや初心者も参加可能とされています。"
  },
  aichi_nagoya_aichi_nagoya_nakaku: {
    hilliness: "flat",
    older_adults: "good",
    children: "good",
    reason_en: "Urban park route in central Nagoya with easy access and limited natural-terrain risk.",
    reason_ja: "名古屋中心部の都市公園コースで、アクセスしやすく自然路面のリスクは低めです。"
  }
};

const explicitSourceSignals = {
  hyogo_hyogo01: {
    en: ["Official guide text explicitly says this course is easy for older adults and people without exercise habits."],
    ja: ["公式ガイド文に、運動習慣がない方や高齢者にも歩きやすいとあります。"]
  },
  okayama_okayama01: {
    en: ["Official guide text notes that some sections have quite strong slopes."],
    ja: ["公式ガイド文に、かなり傾斜が強い場所があるとあります。"]
  },
  gifu03_hida_alps: {
    en: ["Official guide text describes this as a course for people who want a solid workout."],
    ja: ["公式ガイド文に、しっかり運動したい人向けのコースとあります。"]
  },
  niigata_myoko_niigata_myoko_sasagamine: {
    en: ["Official guide text describes a 1,300 m highland course inside a national park."],
    ja: ["公式ガイド文に、国立公園内の標高1300mの高原コースとあります。"]
  },
  nagano_toumi_nagano_tomi_yunomarukogen: {
    en: ["Official guide text references a highland training area around 1,750 m."],
    ja: ["公式ガイド文に、標高1750mの高地トレーニング施設がある高原エリアとあります。"]
  },
  mie_mie02: {
    en: ["Official guide text mentions children and beginners can join nearby sea-kayak eco tours."],
    ja: ["公式ガイド文に、周辺のシーカヤック体験は子ども・初心者も参加可能とあります。"]
  }
};

const hillinessLabels = {
  flat: { en: "Mostly flat", ja: "ほぼ平坦" },
  gentle: { en: "Gentle", ja: "ゆるやか" },
  rolling: { en: "Rolling", ja: "起伏あり" },
  hilly: { en: "Hilly", ja: "坂・傾斜多め" },
  mountain: { en: "Mountain/highland", ja: "山・高原" }
};

const suitabilityLabels = {
  good: { en: "Good fit", ja: "向いている" },
  ok: { en: "Usually OK", ja: "概ね可" },
  caution: { en: "Use caution", ja: "注意して可" },
  not_recommended: { en: "Not recommended", ja: "非推奨" }
};

function textFor(course) {
  return [
    course.course_name,
    course.description_short,
    course.description,
    ...(course.visible_points_of_interest || [])
  ].join(" ");
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function inferHilliness(course) {
  const text = textFor(course);
  if (includesAny(text, ["高原", "標高", "山頂", "山々を一望", "富士山", "アルプス", "ゲレンデ"])) {
    return "mountain";
  }
  if (includesAny(text, ["強い", "傾斜", "坂", "城址", "金華山", "百々ヶ峰", "安桜山", "展望台", "古道", "天空"])) {
    return "hilly";
  }
  if (includesAny(text, ["森", "里山", "丘", "眺望", "自然學校", "森林", "緑地", "公園"])) {
    return "rolling";
  }
  if (includesAny(text, ["海岸", "砂浜", "温泉街", "都市型", "久屋大通", "岐阜駅", "柳ケ瀬"])) {
    return "gentle";
  }
  return "rolling";
}

function inferSuitability(course, hilliness) {
  const text = textFor(course);
  const urbanOrPark = includesAny(text, ["都市型", "公園", "緑地", "温泉街", "駅", "総合公園", "久屋大通"]);
  const naturalCaution = includesAny(text, ["山", "高原", "古道", "洞", "強い", "傾斜", "吊り橋", "森林浴", "海岸", "砂浜"]);

  let children = "ok";
  let older = "ok";

  if (hilliness === "flat" || (hilliness === "gentle" && urbanOrPark)) {
    children = "good";
    older = "good";
  } else if (hilliness === "mountain" || hilliness === "hilly") {
    children = naturalCaution ? "caution" : "ok";
    older = "caution";
  } else if (urbanOrPark) {
    children = "good";
    older = "ok";
  }

  return { children, older };
}

function inferredSignals(course, hilliness, children, older) {
  const text = textFor(course);
  const signals = { en: [], ja: [] };
  const explicit = explicitSourceSignals[course.id];
  if (explicit) {
    signals.en.push(...explicit.en);
    signals.ja.push(...explicit.ja);
  }

  if (course.route_estimate?.method === "known_length_from_source_text") {
    const distance = course.route_estimate.distance_km;
    const band =
      distance <= 1.5
        ? ["short", "短め"]
        : distance <= 3.5
          ? ["moderate", "中程度"]
          : distance <= 5
            ? ["longer", "やや長め"]
            : ["long", "長め"];
    signals.en.push(`Published distance: ${band[0]} (${distance} km).`);
    signals.ja.push(`公表距離: ${band[1]}（${distance}km）。`);
  }

  if (includesAny(text, ["都市型", "駅", "久屋大通", "岐阜駅", "柳ケ瀬"])) {
    signals.en.push("Urban/access signal: likely easier to reach and easier to exit early.");
    signals.ja.push("都市・アクセス面の信号: 行きやすく、途中離脱もしやすい可能性があります。");
  }
  if (includesAny(text, ["公園", "緑地", "総合公園", "運動公園"])) {
    signals.en.push("Park setting signal: likely clearer paths and more predictable facilities than remote nature routes.");
    signals.ja.push("公園系の信号: 山道より道や施設を把握しやすい可能性があります。");
  }
  if (includesAny(text, ["トイレ", "休憩", "あずま屋", "ビジターセンター", "道の駅", "川の駅", "温泉"])) {
    signals.en.push("Facility signal: public description mentions rest, visitor, station, roadside-station, or hot-spring facilities.");
    signals.ja.push("施設の信号: 休憩・案内・道の駅・温泉などの施設が説明に出ています。");
  }
  if (includesAny(text, ["高原", "標高", "山頂", "山々", "アルプス", "富士山", "ゲレンデ"])) {
    signals.en.push("Highland/mountain signal: weather, temperature, and fatigue risk can be higher.");
    signals.ja.push("山・高原の信号: 天候・気温・疲労リスクが高くなる可能性があります。");
  }
  if (includesAny(text, ["強い", "傾斜", "坂", "古道", "城址", "金華山", "百々ヶ峰", "安桜山", "天空", "展望台"])) {
    signals.en.push("Slope signal: hills, viewpoints, old paths, or strong slopes appear in the source description.");
    signals.ja.push("坂・起伏の信号: 展望地・古道・強い傾斜などが説明に出ています。");
  }
  if (includesAny(text, ["海岸", "砂浜", "干潟", "吊り橋", "洞", "渓流", "森林浴"])) {
    signals.en.push("Surface/nature signal: coastal, sandy, bridge, cave, stream, or forest-bathing terrain may need extra caution.");
    signals.ja.push("路面・自然環境の信号: 海岸・砂浜・吊り橋・洞窟・渓流・森林などは注意が必要です。");
  }

  signals.en.push(`Result: children = ${suitabilityLabels[children].en}; older adults = ${suitabilityLabels[older].en}.`);
  signals.ja.push(`判定: 子ども = ${suitabilityLabels[children].ja}、高齢者 = ${suitabilityLabels[older].ja}。`);

  return signals;
}

function reasonFor(course, hilliness, children, older) {
  const text = textFor(course);
  if (includesAny(text, ["都市型", "公園", "緑地", "総合公園"])) {
    return {
      en: "Park or urban setting makes this easier to access, though local slopes and distance still matter.",
      ja: "公園・都市型のためアクセスしやすい一方、現地の坂や距離は確認が必要です。"
    };
  }
  if (hilliness === "mountain") {
    return {
      en: "Highland or mountain setting; better for confident walkers and guided outings.",
      ja: "山・高原環境のため、歩き慣れた人やガイド同行向けです。"
    };
  }
  if (hilliness === "hilly") {
    return {
      en: "Includes slopes, viewpoints, or old paths, so pace and rests should be planned.",
      ja: "坂・展望地・古道などを含むため、ペースと休憩計画が必要です。"
    };
  }
  if (children === "good" || older === "good") {
    return {
      en: "Gentler route character; still check the official PDF for exact distance and footing.",
      ja: "比較的ゆるやかな性格のコースです。正確な距離や足元は公式PDFで確認してください。"
    };
  }
  return {
    en: "Suitability is inferred from public route descriptions; confirm exact distance, surface, and weather before walking.",
    ja: "公開説明からの推定です。歩く前に正確な距離・路面・天候を確認してください。"
  };
}

const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));

for (const course of inventory.courses) {
  const override = overrides[course.id];
  const hilliness = override?.hilliness || inferHilliness(course);
  const suitability = inferSuitability(course, hilliness);
  const children = override?.children || suitability.children;
  const older = override?.older_adults || suitability.older;
  const reason = override
    ? { en: override.reason_en, ja: override.reason_ja }
    : reasonFor(course, hilliness, children, older);
  const published = course.route_estimate?.method === "known_length_from_source_text" ? course.route_estimate : null;
  const length = published || knownLengths[course.id] || {
    display_en: "Check official map PDF",
    display_ja: "公式マップPDFで確認",
    confidence: "not_extracted_from_image_pdf"
  };

  const signals = inferredSignals(course, hilliness, children, older);

  course.walking_profile = {
    distance: {
      km: published?.distance_km ?? null,
      display_en: length.display_en,
      display_ja: length.display_ja,
      confidence: length.confidence
    },
    hilliness: {
      level: hilliness,
      label_en: hillinessLabels[hilliness].en,
      label_ja: hillinessLabels[hilliness].ja,
      confidence: override ? "source_or_manual_review" : "inferred_from_course_description"
    },
    suitability: {
      children: {
        rating: children,
        label_en: suitabilityLabels[children].en,
        label_ja: suitabilityLabels[children].ja
      },
      older_adults: {
        rating: older,
        label_en: suitabilityLabels[older].en,
        label_ja: suitabilityLabels[older].ja
      },
      confidence: override ? "source_or_manual_review" : "inferred_from_course_description",
      signals_en: signals.en,
      signals_ja: signals.ja,
      methodology_source_ids: methodologySources.map((source) => source.id),
      course_source_links: [
        {
          label_en: "Original course map PDF",
          label_ja: "元のコースマップPDF",
          url: course.map_pdf_url
        },
        {
          label_en: "Kurort walking course guide",
          label_ja: "クアオルト健康ウオーキングコースガイド",
          url: course.source_page_url || "http://kurortwalking.com/"
        }
      ],
      note_en: reason.en,
      note_ja: reason.ja
    }
  };
}

inventory.metadata.suitability_methodology = {
  summary:
    "Suitability tags combine explicit source wording where available, estimated distance band, hilliness/terrain keywords, park/urban/facility signals, and conservative caution for highland, hilly, coastal, sandy, cave, bridge, and forest routes.",
  children_rating_rule:
    "good for park/urban/gentle routes; ok for ordinary rolling routes; caution for hilly, mountain, coastal, sandy, cave, bridge, or long routes unless source text explicitly says children/beginners are suitable.",
  older_adults_rating_rule:
    "good for flat/gentle and accessible-looking park/urban routes; ok for ordinary rolling routes; caution for hilly, highland/mountain, rough-surface, coastal, or long routes unless source text explicitly says older adults can walk it easily.",
  sources: methodologySources
};

inventory.metadata.walking_profile_note =
  "Distance is exact only where source-page text exposed it. Most map PDFs are image/vector based, so distance and elevation should be extracted during a later PDF tracing pass. Hilliness and suitability are conservative inferences from public descriptions and points of interest.";

fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
console.log(`Added walking profiles to ${inventory.courses.length} courses`);
