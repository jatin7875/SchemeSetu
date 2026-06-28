import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export async function getMLRankings(citizenProfile, schemes) {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/recommend`,
      {
        citizen_profile: citizenProfile,
        schemes
      },
      {
        timeout: 120000
      }
    );

    return response.data.rankings || [];
  } catch (error) {
    console.warn(`ML service unavailable. Falling back to rule scores only: ${error.message}`);
    return [];
  }
}

export async function getMLRecommendations(citizenProfile, schemes) {
  return getMLRankings(citizenProfile, schemes);
}

export async function extractRulesFromText(text) {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/extract-rules`,
      { text },
      { timeout: 3000 }
    );

    return response.data.rules || [];
  } catch (error) {
    console.warn(`Rule extraction unavailable: ${error.message}`);
    return [];
  }
}

export async function checkMLServiceHealth() {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 2000 });
    return response.data;
  } catch (error) {
    return {
      status: "unavailable",
      model_loaded: false
    };
  }
}
