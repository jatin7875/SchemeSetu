import api from "../api.js";

export async function getAnalyticsDashboard() {
  const response = await api.get(`/analytics/dashboard?t=${Date.now()}`);
  return response.data;
}

export async function resetAnalytics() {
  const response = await api.delete("/analytics/reset");
  return response.data;
}
