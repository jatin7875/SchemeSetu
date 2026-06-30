import api from "./api.js";

export async function getAdminSchemes(params = {}) {
  const response = await api.get("/admin/schemes", { params });
  return response.data;
}

export async function getAdminScheme(id) {
  const response = await api.get(`/admin/schemes/${id}`);
  return response.data;
}

export async function createAdminScheme(payload) {
  const response = await api.post("/admin/schemes", payload);
  return response.data;
}

export async function updateAdminScheme(id, payload) {
  const response = await api.put(`/admin/schemes/${id}`, payload);
  return response.data;
}

export async function verifyAdminScheme(id, payload = {}) {
  const response = await api.patch(`/admin/schemes/${id}/verify`, payload);
  return response.data;
}

export async function importSchemesJson(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/import/schemes/json", formData);
  return response.data;
}

export async function importSchemesCsv(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/import/schemes/csv", formData);
  return response.data;
}

export async function getImportJobs() {
  const response = await api.get("/import/jobs");
  return response.data;
}
