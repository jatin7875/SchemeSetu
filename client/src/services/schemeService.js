import api from "./api.js";

export async function getSchemes(params = {}) {
  const response = await api.get("/schemes", { params });
  return response.data.schemes || response.data;
}

export async function getSchemeById(id) {
  const response = await api.get(`/schemes/${id}`);
  return response.data.scheme || response.data;
}
