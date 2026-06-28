import { normalizeSchemeForClient } from "./schemeStore.js";

function textFromScheme(scheme) {
  const category = Array.isArray(scheme.category) ? scheme.category.join(" ") : scheme.category || "";
  const tags = Array.isArray(scheme.tags) ? scheme.tags.join(" ") : scheme.tags || "";
  return [
    category,
    tags,
    scheme.target_beneficiaries,
    scheme.eligibility_text,
    scheme.eligibility,
    scheme.state,
    scheme.scheme_level
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function eligibilityTextFromScheme(scheme) {
  return [scheme.target_beneficiaries, scheme.eligibility_text, scheme.eligibility]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function containsAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function addMatch(matches, points, reason) {
  matches.score += points;
  matches.reasons.push(reason);
}

export function recommendSchemes(citizenProfile, schemes) {
  const profile = citizenProfile || {};

  return schemes
    .map((scheme) => {
      const text = textFromScheme(scheme);
      const eligibilityText = eligibilityTextFromScheme(scheme);
      const matches = { score: 0, reasons: [] };
      const categoryText = Array.isArray(scheme.category) ? scheme.category.join(", ") : scheme.category || "";

      if (profile.farmerStatus === "yes" && containsAny(text, ["farmer", "agriculture", "kisan", "cultivable", "landholding"])) {
        addMatch(matches, 3, "Farmer profile matches agriculture or Kisan scheme keywords.");
      }

      if (profile.bplStatus === "yes" && containsAny(eligibilityText, ["bpl", "poor", "economically weaker", "ews", "deprivation", "vulnerable"])) {
        addMatch(matches, 3, "BPL or low-income status matches poverty or EWS eligibility keywords.");
      }

      if (profile.disabilityStatus === "yes" && containsAny(eligibilityText, ["disability", "disabled", "divyang", "divyangjan", "persons with disabilities"])) {
        addMatch(matches, 3, "Disability status matches disability-related scheme keywords.");
      }

      if ((profile.occupation || "").toLowerCase() === "student" && containsAny(text, ["education", "scholarship", "student", "post-matric", "school", "college"])) {
        addMatch(matches, 3, "Student occupation matches education or scholarship keywords.");
      }

      if ((profile.gender || "").toLowerCase() === "female" && containsAny(eligibilityText, ["women", "woman", "girl", "female", "widow"])) {
        addMatch(matches, 2, "Female gender matches women or girl beneficiary keywords.");
      }

      const caste = (profile.caste || "").toUpperCase();
      const casteKeywords = {
        SC: ["sc", "scheduled caste", "scheduled castes"],
        ST: ["st", "scheduled tribe", "scheduled tribes"],
        OBC: ["obc", "other backward class", "other backward classes"]
      };
      if (casteKeywords[caste] && containsAny(eligibilityText, casteKeywords[caste])) {
        addMatch(matches, 2, `${caste} category matches caste-based eligibility keywords.`);
      }

      const income = Number(profile.annualIncome);
      if (!Number.isNaN(income) && income > 0 && income <= 250000 && containsAny(eligibilityText, ["income", "bpl", "ews", "poor", "economically weaker"])) {
        addMatch(matches, 2, "Annual income appears low and the scheme mentions income or economic weakness.");
      }

      const rationCard = (profile.rationCardType || "").toLowerCase();
      if (rationCard && rationCard !== "none" && containsAny(eligibilityText, [rationCard, "ration card", "antyodaya", "aay", "priority household", "phh"])) {
        addMatch(matches, 2, "Ration card type matches ration-card eligibility keywords.");
      }

      const state = (profile.state || "").toLowerCase().trim();
      const schemeState = (scheme.state || "").toLowerCase().trim();
      const isCentral = (scheme.scheme_level || "").toLowerCase() === "central";
      if (state && (isCentral || (schemeState && schemeState === state))) {
        addMatch(matches, 1, isCentral ? "Central scheme can be considered for the selected state." : "Citizen state matches the scheme state.");
      }

      if (profile.educationLevel && containsAny(text, [profile.educationLevel, "education", "student", "scholarship"])) {
        addMatch(matches, 1, "Education level matches education-related scheme keywords.");
      }

      const normalized = normalizeSchemeForClient(scheme);
      return {
        ...normalized,
        category: normalized.category,
        match_score: matches.score,
        match_reasons: matches.reasons,
        category_label: categoryText
      };
    })
    .filter((scheme) => scheme.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score || a.scheme_name.localeCompare(b.scheme_name));
}
