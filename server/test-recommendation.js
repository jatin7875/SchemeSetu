import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

const sampleProfile = {
  age: 21,
  gender: "male",
  state: "Maharashtra",
  district: "Nagpur",
  caste: "OBC",
  annual_income: 120000,
  occupation: "student",
  disability_status: "no",
  farmer_status: "no",
  bpl_status: "yes",
  ration_card_type: "yellow",
  education_level: "undergraduate"
};

const requiredFields = [
  "scheme_id",
  "scheme_name",
  "category",
  "benefits",
  "eligibility",
  "required_documents",
  "application_url",
  "source_urls",
  "rule_score",
  "eligibility_match",
  "ml_score",
  "profile_relevance",
  "final_score",
  "status",
  "matched_conditions",
  "failed_conditions"
];

function pass(message) {
  console.log(`✅ ${message}`);
}

function fail(message, error) {
  console.error(`❌ ${message}`);
  if (error?.response) {
    console.error(`Status: ${error.response.status}`);
    console.error(JSON.stringify(error.response.data, null, 2));
  } else {
    console.error(error?.message || error);
  }
  process.exitCode = 1;
}

async function testBackendHealth() {
  const response = await axios.get(`${API_BASE_URL}/`);
  if (!response.data.message) throw new Error("Backend health message missing");
  pass("Backend health passed");
}

async function testSchemesApi() {
  const response = await axios.get(`${API_BASE_URL}/api/schemes?limit=5`);
  const schemes = response.data.schemes || response.data;
  if (!Array.isArray(schemes) || schemes.length === 0) {
    throw new Error("No schemes loaded from API");
  }
  pass(`Schemes loaded (${schemes.length} returned)`);
}

async function testRecommendationApi() {
  const response = await axios.post(`${API_BASE_URL}/api/recommend`, sampleProfile);
  const recommendations = response.data.recommendations || [];

  if (response.data.success !== true) {
    throw new Error("Recommendation response success should be true");
  }

  if (!Array.isArray(recommendations)) {
    throw new Error("Recommendations should be an array");
  }

  if (recommendations.length === 0) {
    pass("Recommendation API passed with no matches");
    return [];
  }

  for (let index = 1; index < recommendations.length; index += 1) {
    if (Number(recommendations[index - 1].final_score) < Number(recommendations[index].final_score)) {
      throw new Error("Recommendations are not sorted by final_score descending");
    }
  }

  pass("Recommendation API passed");
  pass("Recommendations sorted by final_score");
  return recommendations;
}

function testRequiredFields(recommendations) {
  if (!recommendations.length) return;
  const first = recommendations[0];
  const missing = requiredFields.filter((field) => !(field in first));
  if (missing.length > 0) {
    throw new Error(`Recommendation missing fields: ${missing.join(", ")}`);
  }
  pass("Required fields present");
}

function testMlFallbackSafety(recommendations) {
  recommendations.forEach((item) => {
    if (!Number.isFinite(Number(item.final_score))) {
      throw new Error(`final_score is invalid for ${item.scheme_id}`);
    }
    if (item.ml_score === null && Number(item.final_score) !== Number(item.rule_score)) {
      throw new Error(`ML fallback final_score should equal rule_score for ${item.scheme_id}`);
    }
  });
  pass("ML fallback safe");
}

async function run() {
  try {
    await testBackendHealth();
    await testSchemesApi();
    const recommendations = await testRecommendationApi();
    testMlFallbackSafety(recommendations);
    testRequiredFields(recommendations);
  } catch (error) {
    fail("Recommendation test failed", error);
  }
}

run();
