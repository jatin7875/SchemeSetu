import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import FormData from "form-data";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
const sampleImagePath = path.resolve(__dirname, "test-documents/sample-certificate.png");

const citizenProfile = {
  name: "Jatin Lanjewar",
  annual_income: 120000,
  caste: "OBC",
  disability_status: "no",
  farmer_status: "yes",
  land_area: 2.5
};

async function run() {
  if (!fs.existsSync(sampleImagePath)) {
    throw new Error("Sample image not found. Run: node server/utils/createTestDocumentImage.js");
  }

  const form = new FormData();
  form.append("document", fs.createReadStream(sampleImagePath));
  form.append("citizenProfile", JSON.stringify(citizenProfile));

  const response = await axios.post(`${API_BASE_URL}/api/ocr/verify-document`, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity
  });

  const result = response.data;
  if (result.success !== true) throw new Error("OCR API did not return success true");
  if (!result.raw_text) throw new Error("Raw text was empty");
  if (result.extracted_data.name !== "Jatin Lanjewar") throw new Error("Name was not extracted correctly");
  if (result.extracted_data.income !== 120000) throw new Error("Income was not extracted correctly");
  if (result.extracted_data.caste !== "OBC") throw new Error("Caste was not extracted correctly");
  if (result.verification.confidence_score < 80) throw new Error("Confidence score was below 80");

  console.log("PASS OCR API test passed");
  console.log("Raw text found");
  console.log(`Name extracted: ${result.extracted_data.name}`);
  console.log(`Income extracted: ${result.extracted_data.income}`);
  console.log(`Caste extracted: ${result.extracted_data.caste}`);
  console.log(`Confidence score: ${result.verification.confidence_score}`);
}

run().catch((error) => {
  console.error(`FAIL OCR API test failed: ${error.message}`);
  process.exit(1);
});
