import express from "express";
import { addTemporaryScheme, normalizeSchemeForClient } from "../utils/schemeStore.js";

const router = express.Router();

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

router.post("/schemes", (req, res) => {
  const {
    scheme_name,
    category,
    benefits,
    eligibility,
    required_documents,
    application_url,
    source_urls,
    tags,
    eligibility_rules_extracted
  } = req.body;

  if (!scheme_name || !category || !benefits || !eligibility) {
    return res.status(400).json({ message: "Scheme name, category, benefits and eligibility are required" });
  }

  const scheme = {
    scheme_id: `temp-${slugify(scheme_name)}-${Date.now()}`,
    scheme_name,
    category: Array.isArray(category) ? category : String(category).split(",").map((item) => item.trim()).filter(Boolean),
    benefits,
    eligibility,
    required_documents,
    application_url,
    source_urls: String(source_urls || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    tags: String(tags || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    eligibility_rules_extracted: Array.isArray(eligibility_rules_extracted) ? eligibility_rules_extracted : [],
    status: "temporary",
    last_verified: new Date().toISOString().slice(0, 10)
  };

  const savedScheme = addTemporaryScheme(scheme);
  res.status(201).json({
    success: true,
    message: "Scheme added temporarily for this server session",
    scheme: normalizeSchemeForClient(savedScheme)
  });
});

export default router;
