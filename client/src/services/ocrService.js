import api from "../api.js";

export async function verifyDocument(file, citizenProfile) {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("citizenProfile", JSON.stringify(citizenProfile));

  const response = await api.post("/ocr/verify-document", formData);

  return response.data;
}
