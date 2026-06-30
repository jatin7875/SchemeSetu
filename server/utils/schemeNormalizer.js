export function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeSchemeRecord(record = {}, options = {}) {
  const schemeName = record.scheme_name || record.name || "";
  const schemeId = record.scheme_id || slugify(schemeName);
  const sourceUrls = record.source_urls || [record.official_source_url, record.myscheme_url, record.source_url];

  return {
    scheme_id: schemeId,
    scheme_name: schemeName,
    slug: record.slug || slugify(`${schemeId}-${schemeName}`),
    category: asArray(record.category),
    scheme_level: record.scheme_level || "unknown",
    state: record.state || null,
    ministry_or_department: record.ministry_or_department || "",
    description: record.description || record.description_text || "",
    benefits: record.benefits || record.benefits_text || "",
    eligibility: record.eligibility || record.eligibility_text || "",
    eligibility_rules: record.eligibility_rules || {},
    required_documents: record.required_documents || record.documents_required_text || "",
    application_url: record.application_url || record.official_source_url || record.myscheme_url || "",
    source_urls: asArray(sourceUrls),
    tags: asArray(record.tags),
    status: record.status || "unknown",
    verification_status: options.verification_status || record.verification_status || "needs_review",
    last_verified: normalizeDate(record.last_verified || record.source_date || record.launch_date),
    created_by: options.created_by || record.created_by || null,
    updated_by: options.updated_by || record.updated_by || null,
    data_source_id: options.data_source_id || record.data_source_id || null
  };
}

export function normalizeSchemeForApi(scheme) {
  const raw = typeof scheme?.toObject === "function" ? scheme.toObject() : scheme;
  return {
    ...raw,
    id: raw?._id?.toString?.() || raw?.id,
    category: Array.isArray(raw?.category) ? raw.category : asArray(raw?.category),
    benefits: raw?.benefits ?? raw?.benefits_text ?? "",
    eligibility: raw?.eligibility ?? raw?.eligibility_text ?? "",
    required_documents: raw?.required_documents ?? raw?.documents_required_text ?? "",
    application_url: raw?.application_url ?? raw?.official_source_url ?? raw?.myscheme_url ?? "",
    source_urls: raw?.source_urls ?? [raw?.official_source_url, raw?.myscheme_url].filter(Boolean)
  };
}
