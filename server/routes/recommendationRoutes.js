import express from "express";
import { loadSchemesForRecommendation } from "../utils/loadSchemes.js";
import { isMongoConnected } from "../config/db.js";
import CitizenProfile from "../models/CitizenProfile.js";
import Recommendation from "../models/Recommendation.js";
import { evaluateSchemesWithRules } from "../services/ruleEngine.js";
import { getMLRankings } from "../services/mlService.js";
import { appendAnalyticsEvent } from "../services/analyticsService.js";

const router = express.Router();

function getProfileValue(profile, snakeKey, camelKey = snakeKey) {
  return profile?.[snakeKey] ?? profile?.[camelKey];
}

function validateCitizenProfile(profile) {
  const errors = [];
  const age = Number(getProfileValue(profile, "age"));
  const annualIncome = Number(getProfileValue(profile, "annual_income", "annualIncome"));

  if (!Number.isFinite(age)) {
    errors.push("age must be a number");
  }

  if (!Number.isFinite(annualIncome)) {
    errors.push("annual_income must be a number");
  }

  ["gender", "state", "district", "occupation"].forEach((field) => {
    if (!String(getProfileValue(profile, field) ?? "").trim()) {
      errors.push(`${field} is required`);
    }
  });

  return errors;
}

function getStatus(score) {
  if (score >= 80) {
    return "likely_eligible";
  }

  if (score >= 50) {
    return "partially_eligible";
  }

  return "not_eligible";
}

function mergeRuleAndMLScores(ruleRecommendations, mlRankings) {
  const mlScoreBySchemeId = new Map(mlRankings.map((ranking) => [ranking.scheme_id, ranking]));

  return ruleRecommendations
    .map((scheme) => {
      const ruleScore = Number(scheme.rule_score ?? scheme.match_score ?? 0);
      const mlRanking = mlScoreBySchemeId.get(scheme.scheme_id);
      const mlScoreValue = mlRanking ? Number(mlRanking.ml_score) : null;
      const mlScore = Number.isFinite(mlScoreValue) ? mlScoreValue : null;
      const finalScore = mlScore !== null
        ? Math.round((0.6 * ruleScore) + (0.4 * mlScore))
        : ruleScore;

      return {
        ...scheme,
        rule_score: ruleScore,
        eligibility_match: ruleScore,
        ml_score: mlScore,
        profile_relevance: mlScore,
        semantic_score: mlRanking?.semantic_score ?? null,
        model_score: mlRanking?.model_score ?? null,
        final_score: finalScore,
        match_score: finalScore,
        status: getStatus(finalScore)
      };
    })
    .filter((scheme) => scheme.final_score > 0)
    .sort((a, b) => b.final_score - a.final_score || a.scheme_name.localeCompare(b.scheme_name));
}

function sanitizeCitizenProfile(profile) {
  return {
    name: getProfileValue(profile, "name"),
    age: Number(getProfileValue(profile, "age")),
    gender: getProfileValue(profile, "gender"),
    state: getProfileValue(profile, "state"),
    district: getProfileValue(profile, "district"),
    caste: getProfileValue(profile, "caste"),
    annual_income: Number(getProfileValue(profile, "annual_income", "annualIncome")),
    occupation: getProfileValue(profile, "occupation"),
    disability_status: getProfileValue(profile, "disability_status", "disabilityStatus"),
    farmer_status: getProfileValue(profile, "farmer_status", "farmerStatus"),
    bpl_status: getProfileValue(profile, "bpl_status", "bplStatus"),
    ration_card_type: getProfileValue(profile, "ration_card_type", "rationCardType"),
    education_level: getProfileValue(profile, "education_level", "educationLevel"),
    land_area: Number(getProfileValue(profile, "land_area", "landArea")) || null
  };
}

function recommendationItems(recommendations) {
  return recommendations.map((item) => ({
    scheme_id: item.scheme_id,
    scheme_name: item.scheme_name,
    category: item.category,
    rule_score: item.rule_score,
    eligibility_match: item.eligibility_match,
    ml_score: item.ml_score,
    profile_relevance: item.profile_relevance,
    final_score: item.final_score,
    status: item.status,
    matched_conditions: item.matched_conditions || [],
    failed_conditions: item.failed_conditions || []
  }));
}

router.post("/", async (req, res, next) => {
  try {
    const validationErrors = validateCitizenProfile(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(", "),
        errors: validationErrors
      });
    }

    const citizenPayload = sanitizeCitizenProfile(req.body);
    const citizenProfile = isMongoConnected() ? await CitizenProfile.create(citizenPayload) : null;
    const schemes = await loadSchemesForRecommendation();
    if (schemes.length === 0) {
      const message = process.env.NODE_ENV === "production"
        ? "No verified schemes available. Please import schemes first."
        : "No schemes available. Please check data/schemes.json.";
      return res.status(process.env.NODE_ENV === "production" ? 503 : 200).json({
        success: process.env.NODE_ENV !== "production",
        total_recommended: 0,
        recommendations: [],
        message
      });
    }
    const ruleRecommendations = evaluateSchemesWithRules(req.body, schemes);
    const mlRankings = await getMLRankings(req.body, schemes);
    const recommendations = mergeRuleAndMLScores(ruleRecommendations, mlRankings);
    const items = recommendationItems(recommendations);
    const recommendationDoc = isMongoConnected()
      ? await Recommendation.create({
          citizen_profile_id: citizenProfile?._id || null,
          recommendations: items,
          top_scheme_id: recommendations[0]?.scheme_id || null,
          average_score: recommendations.length
            ? Math.round(recommendations.reduce((sum, item) => sum + Number(item.final_score || 0), 0) / recommendations.length)
            : 0
        })
      : null;
    const mlUnavailable = mlRankings.length === 0;

    appendAnalyticsEvent({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      citizen_profile_id: citizenProfile?._id || null,
      recommendation_id: recommendationDoc?._id || null,
      citizen_profile: citizenPayload,
      recommendations: items
    }).then((event) => {
      if (process.env.NODE_ENV !== "production") {
        console.log(`Analytics event saved: ${event.id}`);
      }
    }).catch((error) => {
      console.log("Analytics logging failed", error.message);
    });

    res.json({
      success: true,
      total_recommended: recommendations.length,
      message: mlUnavailable ? "ML ranking unavailable, rule-based results shown" : "Recommendations generated successfully",
      citizen_profile_id: citizenProfile?._id || null,
      recommendation_id: recommendationDoc?._id || null,
      recommendations
    });
  } catch (error) {
    next(error);
  }
});

export default router;
