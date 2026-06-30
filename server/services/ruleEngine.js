import { evaluateAllSchemes } from "../utils/eligibilityEngine.js";

export function evaluateSchemesWithRules(citizenProfile, schemes) {
  return evaluateAllSchemes(citizenProfile, schemes).map((scheme) => ({
    ...scheme,
    rule_score: scheme.match_score,
    status: scheme.status,
    matched_conditions: scheme.matched_conditions || [],
    failed_conditions: scheme.failed_conditions || []
  }));
}
