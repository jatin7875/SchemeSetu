import fs from "fs/promises";
import Tesseract from "tesseract.js";

function normalizeText(value) {
  return String(value ?? "")
    .replace(/[|]/g, "I")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

function getProfileValue(profile, snakeKey, camelKey = snakeKey) {
  return profile?.[snakeKey] ?? profile?.[camelKey] ?? "";
}

function parseIndianAmount(value) {
  const text = normalizeLower(value).replace(/,/g, "");
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*lakh/);

  if (lakhMatch) {
    return Math.round(Number(lakhMatch[1]) * 100000);
  }

  const numberMatch = text.match(/(\d{4,}(?:\.\d+)?)/);
  return numberMatch ? Math.round(Number(numberMatch[1])) : null;
}

function normalizeCaste(value) {
  const text = normalizeLower(value);

  if (/\b(sc|scheduled caste)\b/.test(text)) return "SC";
  if (/\b(st|scheduled tribe)\b/.test(text)) return "ST";
  if (/\b(obc|other backward class)\b/.test(text)) return "OBC";
  if (/\b(general|open)\b/.test(text)) return "General";

  return value ? normalizeText(value).toUpperCase() : null;
}

function namesPartiallyMatch(extractedName, profileName) {
  const extractedParts = normalizeLower(extractedName).split(" ").filter(Boolean);
  const profileParts = normalizeLower(profileName).split(" ").filter(Boolean);

  return extractedParts.some((part) => profileParts.includes(part));
}

async function preprocessImage(filePath) {
  const processedPath = `${filePath}-processed.png`;

  try {
    const sharp = (await import("sharp")).default;
    await sharp(filePath)
      .grayscale()
      .normalize()
      .resize({ width: 1600, withoutEnlargement: false })
      .png()
      .toFile(processedPath);

    return { ocrPath: processedPath, processedPath };
  } catch (error) {
    // Preprocessing improves OCR, but Tesseract can still run on the original file if sharp fails.
    return { ocrPath: filePath, processedPath: null };
  }
}

export async function extractTextFromImage(filePath) {
  const result = await Tesseract.recognize(filePath, "eng");
  return result.data.text || "";
}

export function extractFieldsFromText(rawText) {
  const cleanText = normalizeText(rawText);
  const lowerText = normalizeLower(rawText);

  const nameMatch =
    cleanText.match(/(?:applicant\s+name|beneficiary\s+name|name)\s*[:\-]?\s*([a-zA-Z .']{3,80}?)(?=\s+(?:annual|family|income|caste|category|disability|land|area|certificate|date|$))/i) ||
    cleanText.match(/certified\s+that\s+(?:shri|smt|kumari|mr|mrs|ms)?\.?\s*([a-zA-Z .']{3,80}?)(?=\s+(?:annual|family|income|caste|category|disability|land|area|certificate|date|$))/i);

  const incomeContextMatch =
    cleanText.match(/(?:annual\s+income|family\s+income|income(?:\s+certificate)?|income\s+should\s+not\s+exceed)\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?\s*lakh|[\d,]+(?:\.\d+)?)/i) ||
    cleanText.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d+)?\s*lakh|[\d,]+(?:\.\d+)?)(?=.*income)/i) ||
    cleanText.match(/([\d.]+)\s*lakh/i);

  const casteMatch =
    cleanText.match(/(?:caste\s+category|caste|category)\s*[:\-]?\s*(scheduled caste|scheduled tribe|other backward class|general|obc|sc|st)\b/i) ||
    cleanText.match(/belongs\s+to\s+(scheduled caste|scheduled tribe|other backward class|general|obc|sc|st)\s+category/i) ||
    lowerText.match(/\b(scheduled caste|scheduled tribe|other backward class|obc|sc|st)\b/i);

  const disabilityMatch =
    cleanText.match(/(?:disability\s+percentage|percentage\s+of\s+disability|disability|disabled|divyang)\s*[:\-]?[^\d]{0,30}(\d{1,3})\s*(?:%|percent)?/i) ||
    cleanText.match(/(\d{1,3})\s*(?:%|percent)\s*(?:disability|disabled)/i);

  const landMatch = cleanText.match(/(?:land\s+area|total\s+land\s+holding|area|land)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(acre|acres|hectare|hectares|ha)\b/i);

  let landArea = null;
  if (landMatch) {
    const numericArea = Number(landMatch[1]);
    const unit = normalizeLower(landMatch[2]);
    landArea = unit.startsWith("hectare") || unit === "ha"
      ? Number((numericArea * 2.471).toFixed(2))
      : numericArea;
  }

  return {
    name: nameMatch ? normalizeText(nameMatch[1]).replace(/[.,]$/, "") : null,
    income: incomeContextMatch ? parseIndianAmount(incomeContextMatch[1]) : null,
    caste: casteMatch ? normalizeCaste(casteMatch[1] || casteMatch[0]) : null,
    disability_percentage: disabilityMatch ? Number(disabilityMatch[1]) : null,
    land_area: landArea
  };
}

export function compareWithCitizenProfile(extractedData, citizenProfile) {
  const matchedFields = [];
  const mismatchedFields = [];
  const missingFields = [];
  let matchedCount = 0;
  let totalApplicableFields = 0;

  const profileName = getProfileValue(citizenProfile, "name");
  if (profileName) {
    totalApplicableFields += 1;
    if (!extractedData.name) {
      missingFields.push("Name not found");
    } else if (normalizeLower(extractedData.name) === normalizeLower(profileName)) {
      matchedCount += 1;
      matchedFields.push("Name matches profile");
    } else if (namesPartiallyMatch(extractedData.name, profileName)) {
      matchedCount += 0.5;
      matchedFields.push("Name partially matches profile");
    } else {
      mismatchedFields.push("Name does not match profile");
    }
  }

  const profileIncome = Number(getProfileValue(citizenProfile, "annual_income", "annualIncome"));
  if (Number.isFinite(profileIncome) && profileIncome > 0) {
    totalApplicableFields += 1;
    if (extractedData.income === null) {
      missingFields.push("Income not found");
    } else if (Math.abs(Number(extractedData.income) - profileIncome) <= 5000) {
      matchedCount += 1;
      matchedFields.push("Income matches profile");
    } else {
      mismatchedFields.push("Income does not match profile");
    }
  }

  const profileCaste = getProfileValue(citizenProfile, "caste");
  if (profileCaste) {
    totalApplicableFields += 1;
    if (!extractedData.caste) {
      missingFields.push("Caste not found");
    } else if (normalizeCaste(extractedData.caste) === normalizeCaste(profileCaste)) {
      matchedCount += 1;
      matchedFields.push("Caste matches profile");
    } else {
      mismatchedFields.push("Caste does not match profile");
    }
  }

  if (normalizeLower(getProfileValue(citizenProfile, "disability_status", "disabilityStatus")) === "yes") {
    totalApplicableFields += 1;
    if (extractedData.disability_percentage === null) {
      missingFields.push("Disability percentage not found");
    } else if (Number(extractedData.disability_percentage) >= 40) {
      matchedCount += 1;
      matchedFields.push("Disability percentage meets minimum requirement");
    } else {
      mismatchedFields.push("Disability percentage is below 40%");
    }
  }

  if (normalizeLower(getProfileValue(citizenProfile, "farmer_status", "farmerStatus")) === "yes") {
    totalApplicableFields += 1;
    const profileLandArea = Number(getProfileValue(citizenProfile, "land_area", "landArea"));
    if (extractedData.land_area === null) {
      missingFields.push("Land area not found");
    } else if (!Number.isFinite(profileLandArea) || Math.abs(Number(extractedData.land_area) - profileLandArea) <= 0.2) {
      matchedCount += 1;
      matchedFields.push("Land area matches profile");
    } else {
      mismatchedFields.push("Land area does not match profile");
    }
  }

  const confidenceScore = totalApplicableFields > 0
    ? Math.round((matchedCount / totalApplicableFields) * 100)
    : 0;

  return {
    overall_status: confidenceScore >= 80 ? "verified" : confidenceScore >= 50 ? "needs_review" : "rejected",
    matched_fields: matchedFields,
    mismatched_fields: mismatchedFields,
    missing_fields: missingFields,
    confidence_score: confidenceScore
  };
}

export async function verifyDocument(filePath, citizenProfile) {
  const { ocrPath, processedPath } = await preprocessImage(filePath);

  try {
    const rawText = await extractTextFromImage(ocrPath);
    if (!normalizeText(rawText)) {
      throw new Error("OCR could not extract text from the uploaded document");
    }

    const extractedData = extractFieldsFromText(rawText);
    const verification = compareWithCitizenProfile(extractedData, citizenProfile);

    return {
      success: true,
      raw_text: rawText,
      extracted_data: extractedData,
      verification
    };
  } finally {
    if (processedPath) {
      await fs.unlink(processedPath).catch(() => {});
    }
  }
}
