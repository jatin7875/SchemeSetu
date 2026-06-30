import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { isMongoConnected } from "../config/db.js";
import AnalyticsEvent from "../models/AnalyticsEvent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const analyticsPath = path.resolve(__dirname, "../../data/analytics.json");

function getProfileValue(profile, snakeKey, camelKey = snakeKey) {
  return profile?.[snakeKey] ?? profile?.[camelKey] ?? "";
}

function sanitizeCitizenProfile(profile) {
  return {
    age: Number(getProfileValue(profile, "age")) || null,
    gender: getProfileValue(profile, "gender"),
    state: getProfileValue(profile, "state"),
    district: getProfileValue(profile, "district"),
    caste: getProfileValue(profile, "caste"),
    annual_income: Number(getProfileValue(profile, "annual_income", "annualIncome")) || null,
    occupation: getProfileValue(profile, "occupation"),
    disability_status: getProfileValue(profile, "disability_status", "disabilityStatus"),
    farmer_status: getProfileValue(profile, "farmer_status", "farmerStatus"),
    bpl_status: getProfileValue(profile, "bpl_status", "bplStatus"),
    ration_card_type: getProfileValue(profile, "ration_card_type", "rationCardType"),
    education_level: getProfileValue(profile, "education_level", "educationLevel")
  };
}

function sanitizeRecommendation(recommendation) {
  return {
    scheme_id: recommendation.scheme_id,
    scheme_name: recommendation.scheme_name,
    category: recommendation.category,
    rule_score: recommendation.rule_score ?? recommendation.match_score ?? 0,
    ml_score: recommendation.ml_score ?? null,
    final_score: recommendation.final_score ?? recommendation.match_score ?? 0,
    status: recommendation.status,
    matched_conditions: recommendation.matched_conditions || [],
    failed_conditions: recommendation.failed_conditions || []
  };
}

async function ensureAnalyticsFile() {
  await fs.mkdir(path.dirname(analyticsPath), { recursive: true });

  try {
    await fs.access(analyticsPath);
  } catch (error) {
    await fs.writeFile(analyticsPath, "[]\n");
  }
}

export async function readAnalyticsEvents() {
  if (isMongoConnected()) {
    const events = await AnalyticsEvent.find().sort({ createdAt: -1 }).lean();
    return events.map((event) => ({
      id: event._id.toString(),
      timestamp: event.createdAt?.toISOString?.() || event.createdAt,
      citizen_profile: event.citizen_profile || {},
      recommendations: event.recommendations || []
    }));
  }

  try {
    await ensureAnalyticsFile();
    const raw = await fs.readFile(analyticsPath, "utf-8");
    const parsed = raw.trim() ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    await ensureAnalyticsFile();
    await fs.writeFile(analyticsPath, "[]\n");
    return [];
  }
}

export async function appendAnalyticsEvent(event) {
  if (isMongoConnected()) {
    const safeEvent = {
      event_type: event.event_type || "recommendation_generated",
      citizen_profile_id: event.citizen_profile_id || null,
      recommendation_id: event.recommendation_id || null,
      citizen_profile: sanitizeCitizenProfile(event.citizen_profile || {}),
      recommendations: (event.recommendations || []).map(sanitizeRecommendation)
    };
    const saved = await AnalyticsEvent.create(safeEvent);
    return {
      id: saved._id.toString(),
      timestamp: saved.createdAt?.toISOString?.(),
      ...safeEvent
    };
  }

  await ensureAnalyticsFile();
  const events = await readAnalyticsEvents();
  const safeEvent = {
    id: event.id || Date.now().toString(),
    timestamp: event.timestamp || new Date().toISOString(),
    citizen_profile: sanitizeCitizenProfile(event.citizen_profile || {}),
    recommendations: (event.recommendations || []).map(sanitizeRecommendation)
  };

  events.push(safeEvent);
  await fs.writeFile(analyticsPath, `${JSON.stringify(events, null, 2)}\n`);
  return safeEvent;
}

export const writeAnalyticsEvent = appendAnalyticsEvent;

export async function resetAnalyticsEvents() {
  if (isMongoConnected()) {
    await AnalyticsEvent.deleteMany({});
    return;
  }

  await ensureAnalyticsFile();
  await fs.writeFile(analyticsPath, "[]\n");
}

function applyAnalyticsFilters(events, filters = {}) {
  const stateFilter = String(filters.state || "").trim().toLowerCase();
  const categoryFilter = String(filters.category || "").trim().toLowerCase();
  const fromDate = filters.from ? new Date(filters.from) : null;
  const toDate = filters.to ? new Date(filters.to) : null;

  return events.filter((event) => {
    const eventDate = event.timestamp ? new Date(event.timestamp) : null;
    const eventState = String(event.citizen_profile?.state || "").trim().toLowerCase();

    if (stateFilter && eventState !== stateFilter) {
      return false;
    }

    if (fromDate && eventDate && eventDate < fromDate) {
      return false;
    }

    if (toDate && eventDate && eventDate > toDate) {
      return false;
    }

    if (categoryFilter) {
      return (event.recommendations || []).some((scheme) => {
        return getRecommendationCategories(scheme.category)
          .some((category) => category.toLowerCase() === categoryFilter);
      });
    }

    return true;
  });
}

function topCounts(countMap, keyName, limit = 10) {
  return Array.from(countMap.entries())
    .map(([key, count]) => ({ [keyName]: key, count }))
    .sort((a, b) => b.count - a.count || String(a[keyName]).localeCompare(String(b[keyName])))
    .slice(0, limit);
}

export function getMostRecommendedSchemes(events) {
  const counts = new Map();
  const names = new Map();

  events.forEach((event) => {
    event.recommendations?.forEach((scheme) => {
      counts.set(scheme.scheme_id, (counts.get(scheme.scheme_id) || 0) + 1);
      names.set(scheme.scheme_id, scheme.scheme_name);
    });
  });

  return Array.from(counts.entries())
    .map(([schemeId, count]) => ({
      scheme_id: schemeId,
      scheme_name: names.get(schemeId) || schemeId,
      count
    }))
    .sort((a, b) => b.count - a.count || a.scheme_name.localeCompare(b.scheme_name))
    .slice(0, 10);
}

export function getMostCommonRejectionReasons(events) {
  const counts = new Map();

  events.forEach((event) => {
    event.recommendations?.forEach((scheme) => {
      scheme.failed_conditions?.forEach((reason) => {
        counts.set(reason, (counts.get(reason) || 0) + 1);
      });
    });
  });

  return topCounts(counts, "reason");
}

export function getStateWiseApplications(events) {
  const counts = new Map();

  events.forEach((event) => {
    const state = event.citizen_profile?.state || "Unknown";
    counts.set(state, (counts.get(state) || 0) + 1);
  });

  return topCounts(counts, "state", 50);
}

function getIncomeGroup(income) {
  const amount = Number(income) || 0;

  if (amount <= 100000) return "Below Rs 1L";
  if (amount <= 250000) return "Rs 1L - Rs 2.5L";
  if (amount <= 500000) return "Rs 2.5L - Rs 5L";
  if (amount <= 800000) return "Rs 5L - Rs 8L";
  return "Above Rs 8L";
}

function getRecommendationCategories(category) {
  if (Array.isArray(category)) {
    return category.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(category || "Uncategorized")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getCategoryWiseRecommendations(events) {
  const counts = new Map();

  events.forEach((event) => {
    event.recommendations?.forEach((scheme) => {
      const categories = getRecommendationCategories(scheme.category);
      categories.forEach((category) => {
        counts.set(category, (counts.get(category) || 0) + 1);
      });
    });
  });

  return topCounts(counts, "category", 20);
}

export function getRecentApplications(events, limit = 5) {
  return [...events]
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, limit)
    .map((event) => {
      const topRecommendation = [...(event.recommendations || [])]
        .sort((a, b) => Number(b.final_score || 0) - Number(a.final_score || 0))[0];

      return {
        id: event.id,
        timestamp: event.timestamp,
        state: event.citizen_profile?.state || "Unknown",
        occupation: event.citizen_profile?.occupation || "Unknown",
        top_scheme: topRecommendation?.scheme_name || "No recommendation",
        top_score: Number(topRecommendation?.final_score || 0)
      };
    });
}

export function getIncomeGroupAnalysis(events) {
  const groups = ["Below Rs 1L", "Rs 1L - Rs 2.5L", "Rs 2.5L - Rs 5L", "Rs 5L - Rs 8L", "Above Rs 8L"];
  const counts = new Map(groups.map((group) => [group, 0]));

  events.forEach((event) => {
    const group = getIncomeGroup(event.citizen_profile?.annual_income);
    counts.set(group, (counts.get(group) || 0) + 1);
  });

  return groups.map((group) => ({ income_group: group, count: counts.get(group) || 0 }));
}

function getScoreRange(score) {
  const value = Number(score) || 0;

  if (value <= 25) return "0-25%";
  if (value <= 50) return "26-50%";
  if (value <= 75) return "51-75%";
  return "76-100%";
}

export function getSchemeMatchDistribution(events) {
  const ranges = ["0-25%", "26-50%", "51-75%", "76-100%"];
  const counts = new Map(ranges.map((range) => [range, 0]));

  events.forEach((event) => {
    event.recommendations?.forEach((scheme) => {
      const range = getScoreRange(scheme.final_score);
      counts.set(range, (counts.get(range) || 0) + 1);
    });
  });

  return ranges.map((range) => ({ range, count: counts.get(range) || 0 }));
}

export async function generateAnalyticsSummary(filters = {}) {
  const events = applyAnalyticsFilters(await readAnalyticsEvents(), filters);
  const recommendations = events.flatMap((event) => event.recommendations || []);
  const totalFinalScore = recommendations.reduce((sum, scheme) => sum + Number(scheme.final_score || 0), 0);
  const latestEvent = [...events].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))[0];

  return {
    success: true,
    last_updated: latestEvent?.timestamp || null,
    summary: {
      total_applications: events.length,
      total_recommendations: recommendations.length,
      average_final_score: recommendations.length ? Math.round(totalFinalScore / recommendations.length) : 0,
      likely_eligible_count: recommendations.filter((scheme) => scheme.status === "likely_eligible").length,
      partially_eligible_count: recommendations.filter((scheme) => scheme.status === "partially_eligible").length,
      not_eligible_count: recommendations.filter((scheme) => scheme.status === "not_eligible").length
    },
    most_recommended_schemes: getMostRecommendedSchemes(events),
    common_rejection_reasons: getMostCommonRejectionReasons(events),
    state_wise_applications: getStateWiseApplications(events),
    income_group_analysis: getIncomeGroupAnalysis(events),
    scheme_match_distribution: getSchemeMatchDistribution(events),
    category_wise_recommendations: getCategoryWiseRecommendations(events),
    recent_applications: getRecentApplications(events)
  };
}
