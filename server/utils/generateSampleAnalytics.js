import { getAllSchemes } from "./schemeStore.js";
import { evaluateAllSchemes } from "./eligibilityEngine.js";
import { writeAnalyticsEvent, resetAnalyticsEvents } from "../services/analyticsService.js";

const states = ["Maharashtra", "Delhi", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Gujarat"];
const castes = ["General", "OBC", "SC", "ST", "EWS"];
const occupations = ["student", "farmer", "self_employed", "artisan", "unorganised_sector", "salaried"];
const genders = ["male", "female", "other"];
const educationLevels = ["school", "post-matric", "undergraduate", "graduate", "none"];

function buildProfile(index) {
  const occupation = occupations[index % occupations.length];

  return {
    age: 18 + ((index * 5) % 55),
    gender: genders[index % genders.length],
    state: states[index % states.length],
    district: `District ${index + 1}`,
    caste: castes[index % castes.length],
    annual_income: 60000 + ((index * 45000) % 900000),
    occupation,
    disability_status: index % 9 === 0 ? "yes" : "no",
    farmer_status: occupation === "farmer" ? "yes" : "no",
    bpl_status: index % 3 === 0 ? "yes" : "no",
    ration_card_type: index % 3 === 0 ? "yellow" : "APL",
    education_level: educationLevels[index % educationLevels.length]
  };
}

async function generateSampleAnalytics() {
  const schemes = await getAllSchemes();
  await resetAnalyticsEvents();

  for (let index = 0; index < 30; index += 1) {
    const profile = buildProfile(index);
    const recommendations = evaluateAllSchemes(profile, schemes).slice(0, 12).map((scheme, schemeIndex) => ({
      ...scheme,
      rule_score: scheme.match_score,
      ml_score: Math.max(0, Math.min(100, scheme.match_score + ((index + schemeIndex) % 17) - 8)),
      final_score: Math.max(0, Math.min(100, Math.round((0.6 * scheme.match_score) + (0.4 * (scheme.match_score + ((index + schemeIndex) % 17) - 8)))))
    }));

    await writeAnalyticsEvent({
      id: `sample-${index + 1}`,
      timestamp: new Date(Date.now() - index * 86400000).toISOString(),
      citizen_profile: profile,
      recommendations
    });
  }

  console.log("Created 30 sample analytics events in data/analytics.json");
}

generateSampleAnalytics().catch((error) => {
  console.error(error);
  process.exit(1);
});
