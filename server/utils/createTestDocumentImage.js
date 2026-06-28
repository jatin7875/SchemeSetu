import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, "../test-documents");
const outputPath = path.join(outputDir, "sample-certificate.png");

const lines = [
  "GOVERNMENT OF MAHARASHTRA",
  "INCOME AND CASTE CERTIFICATE",
  "Certificate No: TEST-2026-001",
  "Applicant Name: Jatin Lanjewar",
  "Annual Income: Rs. 120000",
  "Caste Category: OBC",
  "Disability Percentage: 0%",
  "Land Area: 2.5 acre",
  "This certificate is issued for testing purpose only.",
  "Date: 27-06-2026"
];

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    "\"": "&quot;"
  }[char]));
}

async function createTestDocumentImage() {
  await fs.mkdir(outputDir, { recursive: true });

  const textNodes = lines
    .map((line, index) => {
      const size = index < 2 ? 34 : 28;
      const weight = index < 2 ? "700" : "500";
      return `<text x="70" y="${80 + index * 58}" font-family="Arial" font-size="${size}" font-weight="${weight}" fill="#111827">${escapeXml(line)}</text>`;
    })
    .join("");

  const svg = `
    <svg width="1400" height="760" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <rect x="35" y="35" width="1330" height="690" fill="none" stroke="#111827" stroke-width="3"/>
      ${textNodes}
    </svg>
  `;

  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  console.log(`Created test document: ${outputPath}`);
}

createTestDocumentImage().catch((error) => {
  console.error(error);
  process.exit(1);
});
