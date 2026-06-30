import api from "./api.js";

export async function verifyDocument(file, citizenProfile, documentType = "unknown") {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("citizenProfile", JSON.stringify(citizenProfile));
  formData.append("documentType", documentType);

  const response = await api.post("/ocr/verify-document", formData);

  return response.data;
}
