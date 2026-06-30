import fs from "fs/promises";
import path from "path";
import { isMongoConnected } from "../config/db.js";
import Scheme from "../models/Scheme.js";
import { normalizeSchemeForApi } from "./schemeNormalizer.js";

function uniqueBySchemeId(schemes) {
  const seen = new Set();
  return schemes.filter((scheme) => {
    const key = scheme.scheme_id || scheme._id?.toString?.();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function readJsonSchemes() {
  const candidatePaths = [
    path.resolve(process.cwd(), "../data/schemes.json"),
    path.resolve(process.cwd(), "data/schemes.json"),
    path.resolve(process.cwd(), "../../data/schemes.json")
  ];

  for (const schemesPath of candidatePaths) {
    try {
      const raw = await fs.readFile(schemesPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        console.log(`Using local JSON fallback schemes: ${parsed.length}`);
        return parsed.map(normalizeSchemeForApi);
      }
    } catch (error) {
      // Try the next likely path. The backend can be started from project root or /server.
    }
  }

  console.warn("Local JSON fallback schemes could not be loaded from data/schemes.json");
  return [];
}

export async function loadSchemesForRecommendation(filters = {}) {
  if (isMongoConnected()) {
    const mongoSchemes = await Scheme.find({
      status: "active",
      verification_status: "verified",
      ...filters
    }).sort({ scheme_name: 1 }).lean();

    console.log(`Schemes loaded from MongoDB: ${mongoSchemes.length}`);
    if (mongoSchemes.length > 0) {
      return mongoSchemes.map(normalizeSchemeForApi);
    }

    if (process.env.NODE_ENV === "production") {
      return [];
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return uniqueBySchemeId(await readJsonSchemes());
  }

  return [];
}

export async function loadSchemesForPublicList(filters = {}) {
  const schemes = await loadSchemesForRecommendation(filters);
  return schemes.filter((scheme) => {
    if (filters.status && scheme.status !== filters.status) return false;
    if (filters.scheme_level && scheme.scheme_level !== filters.scheme_level) return false;
    if (filters.state && scheme.state && scheme.state !== filters.state) return false;
    if (filters.category) {
      const categories = Array.isArray(scheme.category) ? scheme.category : [scheme.category];
      if (!categories.includes(filters.category)) return false;
    }
    if (filters.search) {
      const haystack = [
        scheme.scheme_name,
        scheme.description,
        scheme.benefits,
        scheme.eligibility,
        scheme.ministry_or_department
      ].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(String(filters.search).toLowerCase())) return false;
    }
    return true;
  });
}
