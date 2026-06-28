import express from "express";
import { getAllSchemes } from "../utils/schemeStore.js";
import { evaluateAllSchemes } from "../utils/eligibilityEngine.js";
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
      const ruleScore = scheme.match_score;
      const mlRanking = mlScoreBySchemeId.get(scheme.scheme_id);
      const mlScore = mlRanking ? Number(mlRanking.ml_score) : null;
      const finalScore = mlScore === null
        ? ruleScore
        : Math.round((0.6 * ruleScore) + (0.4 * mlScore));

      return {
        ...scheme,
        rule_score: ruleScore,
        ml_score: mlScore,
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

    const schemes = await getAllSchemes();
    const ruleRecommendations = evaluateAllSchemes(req.body, schemes);
    const mlRankings = await getMLRankings(req.body, schemes);
    const recommendations = mergeRuleAndMLScores(ruleRecommendations, mlRankings);

    appendAnalyticsEvent({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      citizen_profile: req.body,
      recommendations
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
      recommendations
    });
  } catch (error) {
    next(error);
  }
});

export default router;
