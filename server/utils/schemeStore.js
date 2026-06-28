import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemesPath = path.resolve(__dirname, "../../data/schemes.json");

const temporarySchemes = [];

export async function readSchemesFromFile() {
  const raw = await fs.readFile(schemesPath, "utf-8");
  return JSON.parse(raw);
}

export async function getAllSchemes() {
  const fileSchemes = await readSchemesFromFile();
  return [...fileSchemes, ...temporarySchemes];
}

export function addTemporaryScheme(scheme) {
  temporarySchemes.push(scheme);
  return scheme;
}

export function getTemporarySchemes() {
  return temporarySchemes;
}

export function normalizeSchemeForClient(scheme) {
  return {
    ...scheme,
    category: Array.isArray(scheme.category) ? scheme.category : [scheme.category].filter(Boolean),
    benefits: scheme.benefits ?? scheme.benefits_text ?? "",
    eligibility: scheme.eligibility ?? scheme.eligibility_text ?? "",
    required_documents: scheme.required_documents ?? scheme.documents_required_text ?? "",
    application_url: scheme.application_url ?? scheme.official_source_url ?? scheme.myscheme_url ?? "",
    source_urls:
      scheme.source_urls ??
      [scheme.official_source_url, scheme.myscheme_url].filter(Boolean),
    last_verified: scheme.last_verified ?? scheme.launch_date ?? null
  };
}
