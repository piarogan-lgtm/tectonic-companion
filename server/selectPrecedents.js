import fs from "fs";

const precedents = JSON.parse(
  fs.readFileSync(new URL("./knowledge/precedents.json", import.meta.url))
);

function normalise(text) {
  return String(text || "").toLowerCase();
}

function includesAny(text, keywords) {
  const lower = normalise(text);
  return keywords.some((keyword) => lower.includes(keyword));
}

function scoreArrayField(field = [], keywords = [], weight = 1) {
  let score = 0;

  for (const item of field) {
    const lowerItem = normalise(item);

    for (const keyword of keywords) {
      if (lowerItem.includes(keyword)) {
        score += weight;
      }
    }
  }

  return score;
}

export function selectTopPrecedents(userPrompt, maxResults = 8) {
  const prompt = normalise(userPrompt);

  const detailKeywords = [
    "roof", "eave", "eaves", "gutter", "fascia", "flashing",
    "threshold", "door", "sliding", "window", "sill", "head",
    "deck", "balustrade", "cladding", "screen", "opening",
    "joinery", "junction", "wall", "plinth", "base", "stair",
    "platform", "facade", "edge", "reveal"
  ];

  const materialKeywords = [
    "timber", "hardwood", "spotted gum", "blackbutt", "ironbark",
    "steel", "stainless steel", "metal", "zinc", "corten",
    "concrete", "stone", "sandstone", "limestone", "brick",
    "masonry", "glass", "plywood"
  ];

  const environmentalKeywords = [
    "coastal", "wind", "rain", "water", "weather", "drainage",
    "ventilation", "solar", "sun", "shade", "thermal", "durability",
    "exposure", "tropical", "temperate", "alpine", "bushfire"
  ];

  const tectonicKeywords = [
    "expressed", "tectonic", "refined", "minimal", "layered",
    "lightweight", "mass", "heavy", "craft", "precision",
    "transition", "threshold", "durable", "robust", "honest"
  ];

  const allKeywords = [
    ...detailKeywords,
    ...materialKeywords,
    ...environmentalKeywords,
    ...tectonicKeywords
  ].filter((keyword) => prompt.includes(keyword));

  const scored = precedents.map((precedent) => {
    let score = 0;

    score += scoreArrayField(precedent.detail_types, allKeywords, 4);
    score += scoreArrayField(precedent.materials, allKeywords, 3);
    score += scoreArrayField(precedent.categories, allKeywords, 2);
    score += scoreArrayField(precedent.environmental_themes, allKeywords, 3);
    score += scoreArrayField(precedent.tectonic_themes, allKeywords, 3);
    score += scoreArrayField(precedent.key_features, allKeywords, 2);
    score += scoreArrayField(precedent.junction_lessons, allKeywords, 2);
    score += scoreArrayField(precedent.material_transitions, allKeywords, 2);

    if (
      includesAny(precedent.location, [
        "australia",
        "nsw",
        "new south wales",
        "victoria",
        "queensland",
        "tasmania"
      ]) &&
      includesAny(prompt, [
        "australia",
        "nsw",
        "new south wales",
        "victoria",
        "queensland",
        "tasmania"
      ])
    ) {
      score += 3;
    }

    if (
      includesAny(prompt, ["coastal", "salt", "wind-driven rain"]) &&
      includesAny(
        [
          ...(precedent.categories || []),
          ...(precedent.environmental_themes || []),
          precedent.why_relevant || ""
        ].join(" "),
        ["coastal", "exposure", "durability", "weather"]
      )
    ) {
      score += 4;
    }

    if (
      includesAny(prompt, ["timber", "hardwood", "spotted gum", "blackbutt"]) &&
      includesAny(
        [
          ...(precedent.materials || []),
          ...(precedent.categories || []),
          ...(precedent.tectonic_themes || [])
        ].join(" "),
        ["timber", "craft", "lightweight"]
      )
    ) {
      score += 3;
    }

    if (
      includesAny(prompt, ["stone", "masonry", "plinth", "base", "mass"]) &&
      includesAny(
        [
          ...(precedent.materials || []),
          ...(precedent.tectonic_themes || []),
          ...(precedent.material_transitions || [])
        ].join(" "),
        ["stone", "brick", "masonry", "mass", "heavy", "plinth", "base"]
      )
    ) {
      score += 3;
    }

    if (
      includesAny(prompt, ["threshold", "transition", "door", "deck"]) &&
      includesAny(
        [
          ...(precedent.detail_types || []),
          ...(precedent.junction_lessons || [])
        ].join(" "),
        ["threshold", "deck", "transition", "opening"]
      )
    ) {
      score += 4;
    }

    return { ...precedent, score };
  });

  const topMatches = scored
    .sort((a, b) => b.score - a.score)
    .filter((precedent) => precedent.score > 0)
    .slice(0, maxResults);

  if (topMatches.length > 0) {
    return topMatches;
  }

  return precedents.slice(0, maxResults).map((precedent) => ({
    ...precedent,
    score: 0
  }));
}

export function getPrecedentCatalog() {
  return precedents.map((precedent) => ({
    name: precedent.name,
    architect: precedent.architect,
    location: precedent.location,
    building_type: precedent.building_type,
    categories: precedent.categories || [],
    materials: precedent.materials || [],
    detail_types: precedent.detail_types || [],
    tectonic_themes: precedent.tectonic_themes || []
  }));
}