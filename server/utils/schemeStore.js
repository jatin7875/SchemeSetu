import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { isMongoConnected } from "../config/db.js";
import Scheme from "../models/Scheme.js";
import { normalizeSchemeForApi } from "./schemeNormalizer.js";
import { loadSchemesForPublicList } from "./loadSchemes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemesPath = path.resolve(__dirname, "../../data/schemes.json");

const temporarySchemes = [];

export async function readSchemesFromFile() {
  const raw = await fs.readFile(schemesPath, "utf-8");
  return JSON.parse(raw);
}

function buildSchemeQuery(filters = {}, publicOnly = false) {
  const query = {};

  if (publicOnly) {
    query.status = "active";
    query.verification_status = "verified";
  }

  ["category", "state", "scheme_level", "status", "verification_status"].forEach((field) => {
    if (filters[field]) {
      query[field] = field === "category" ? { $in: [filters[field]] } : filters[field];
    }
  });

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  return query;
}

function filterFileSchemes(schemes, filters = {}, publicOnly = false) {
  const search = String(filters.search || "").toLowerCase();
  return schemes.filter((scheme) => {
    if (publicOnly && scheme.status && scheme.status !== "active") return false;
    if (filters.status && scheme.status !== filters.status) return false;
    if (filters.scheme_level && scheme.scheme_level !== filters.scheme_level) return false;
    if (filters.state && scheme.state && scheme.state !== filters.state) return false;
    if (filters.category) {
      const categories = Array.isArray(scheme.category) ? scheme.category : [scheme.category];
      if (!categories.includes(filters.category)) return false;
    }
    if (search) {
      const haystack = [
        scheme.scheme_name,
        scheme.description,
        scheme.benefits_text,
        scheme.eligibility_text,
        scheme.ministry_or_department
      ].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export async function getAllSchemes(filters = {}) {
  if (isMongoConnected()) {
    return Scheme.find(buildSchemeQuery(filters)).sort({ scheme_name: 1 }).lean();
  }

  const fileSchemes = await readSchemesFromFile();
  return filterFileSchemes([...fileSchemes, ...temporarySchemes], filters);
}

export async function getPublicSchemes(filters = {}) {
  return loadSchemesForPublicList(filters);
}

export async function paginateSchemes(filters = {}) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  if (isMongoConnected() && !filters.publicOnly) {
    const query = buildSchemeQuery(filters, filters.publicOnly);
    const [items, total] = await Promise.all([
      Scheme.find(query).sort({ scheme_name: 1 }).skip(skip).limit(limit).lean(),
      Scheme.countDocuments(query)
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  const filtered = filters.publicOnly ? await getPublicSchemes(filters) : await getAllSchemes(filters);
  return {
    items: filtered.slice(skip, skip + limit),
    pagination: {
      page,
      limit,
      total: filtered.length,
      pages: Math.ceil(filtered.length / limit)
    }
  };
}

export async function findSchemeById(id) {
  if (isMongoConnected()) {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { scheme_id: id }, { slug: id }] }
      : { $or: [{ scheme_id: id }, { slug: id }] };
    return Scheme.findOne(query).lean();
  }

  const schemes = await getAllSchemes();
  return schemes.find((item) => item.scheme_id === id || item.slug === id);
}

export function addTemporaryScheme(scheme) {
  temporarySchemes.push(scheme);
  return scheme;
}

export function getTemporarySchemes() {
  return temporarySchemes;
}

export function normalizeSchemeForClient(scheme) {
  return normalizeSchemeForApi(scheme);
}
