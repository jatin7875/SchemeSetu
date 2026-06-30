import api from "./api.js";

export async function getRecommendations(profile) {
  if (import.meta.env.DEV) {
    console.log("Recommendation API URL:", `${api.defaults.baseURL}/recommend`);
  }
  const response = await api.post("/recommend", profile);
  return response.data;
}
