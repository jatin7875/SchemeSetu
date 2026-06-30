import api from "./api.js";

export function getStoredAdmin() {
  const raw = localStorage.getItem("adminUser");
  return raw ? JSON.parse(raw) : null;
}

export function isAdminAuthenticated() {
  return Boolean(localStorage.getItem("adminToken"));
}

export async function loginAdmin(credentials) {
  const response = await api.post("/auth/admin/login", credentials);
  if (response.data.token) {
    localStorage.setItem("adminToken", response.data.token);
    localStorage.setItem("adminUser", JSON.stringify(response.data.admin));
  }
  return response.data;
}

export async function registerAdmin(payload) {
  const response = await api.post("/auth/admin/register", payload);
  if (response.data.token) {
    localStorage.setItem("adminToken", response.data.token);
    localStorage.setItem("adminUser", JSON.stringify(response.data.admin));
  }
  return response.data;
}

export async function getCurrentAdmin() {
  const response = await api.get("/auth/me");
  return response.data;
}

export async function logoutAdmin() {
  await api.post("/auth/logout").catch(() => {});
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
}
