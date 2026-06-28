import { normalizeSchemeForClient } from "./schemeStore.js";

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalizeText).filter(Boolean);
}

function getCitizenValue(citizen, snakeKey, camelKey = snakeKey) {
  return citizen?.[snakeKey] ?? citizen?.[camelKey] ?? "";
}

function getCitizenNumber(citizen, snakeKey, camelKey = snakeKey) {
  const value = getCitizenValue(citizen, snakeKey, camelKey);
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function hasRuleValue(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "boolean") {
    return value === true;
  }

  return true;
}

function getSchemeSearchText(scheme) {
  const category = Array.isArray(scheme.category) ? scheme.category.join(" ") : scheme.category;
  const tags = Array.isArray(scheme.tags) ? scheme.tags.join(" ") : scheme.tags;

  return [
    category,
    tags,
    scheme.eligibility,
    scheme.eligibility_text,
    scheme.target_beneficiaries
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function containsAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function isAnyRule(value) {
  return ["any", "all"].includes(normalizeText(value));
}

function educationMatches(citizenEducation, requiredEducation) {
  const citizenValue = normalizeText(citizenEducation);
  const requiredValue = normalizeText(requiredEducation);

  if (isAnyRule(requiredValue)) {
    return true;
  }

  if (requiredValue === "post-matric") {
    return ["post-matric", "undergraduate", "graduate", "postgraduate"].includes(citizenValue);
  }

  return citizenValue === requiredValue;
}

function getStatus(matchScore) {
  if (matchScore >= 80) {
    return "likely_eligible";
  }

  if (matchScore >= 50) {
    return "partially_eligible";
  }

  return "not_eligible";
}

function buildResult(scheme, matchedRules, totalApplicableRules, matchedConditions, failedConditions) {
  const normalizedScheme = normalizeSchemeForClient(scheme);
  const matchScore =
    totalApplicableRules > 0 ? Math.round((matchedRules / totalApplicableRules) * 100) : 0;

  return {
    ...normalizedScheme,
    category: Array.isArray(normalizedScheme.category)
      ? normalizedScheme.category.join(", ")
      : normalizedScheme.category,
    match_score: matchScore,
    status: getStatus(matchScore),
    matched_conditions: matchedConditions,
    failed_conditions: failedConditions,
    match_reasons: matchedConditions
  };
}

function evaluateStructuredRules(citizen, scheme, rules) {
  let matchedRules = 0;
  let totalApplicableRules = 0;
  const matchedConditions = [];
  const failedConditions = [];
  const hasMeaningfulRestriction = Boolean(
    hasRuleValue(rules.age_min) ||
      hasRuleValue(rules.age_max) ||
      hasRuleValue(rules.income_limit) ||
      (hasRuleValue(rules.gender) && !isAnyRule(rules.gender)) ||
      hasRuleValue(rules.eligible_castes) ||
      rules.requires_farmer === true ||
      rules.requires_bpl === true ||
      rules.requires_disability === true ||
      hasRuleValue(rules.eligible_occupations) ||
      (hasRuleValue(rules.education_level) && !isAnyRule(rules.education_level))
  );

  const age = getCitizenNumber(citizen, "age");
  if (hasRuleValue(rules.age_min) || hasRuleValue(rules.age_max)) {
    totalApplicableRules += 1;

    const minOk = !hasRuleValue(rules.age_min) || (age !== null && age >= Number(rules.age_min));
    const maxOk = !hasRuleValue(rules.age_max) || (age !== null && age <= Number(rules.age_max));

    if (age !== null && minOk && maxOk) {
      matchedRules += 1;
      matchedConditions.push("Age is within eligible range");
    } else {
      failedConditions.push("Age is not within eligible range");
    }
  }

  const annualIncome = getCitizenNumber(citizen, "annual_income", "annualIncome");
  if (hasRuleValue(rules.income_limit)) {
    totalApplicableRules += 1;

    if (annualIncome !== null && annualIncome <= Number(rules.income_limit)) {
      matchedRules += 1;
      matchedConditions.push("Income is within allowed limit");
    } else {
      failedConditions.push("Income is above limit");
    }
  }

  const citizenGender = normalizeText(getCitizenValue(citizen, "gender"));
  if (hasRuleValue(rules.gender) && !isAnyRule(rules.gender)) {
    totalApplicableRules += 1;

    if (citizenGender === normalizeText(rules.gender)) {
      matchedRules += 1;
      matchedConditions.push("Gender matches eligibility");
    } else {
      failedConditions.push("Gender does not match eligibility");
    }
  }

  const citizenCaste = normalizeText(getCitizenValue(citizen, "caste"));
  if (hasRuleValue(rules.eligible_castes)) {
    totalApplicableRules += 1;

    if (normalizeList(rules.eligible_castes).includes(citizenCaste)) {
      matchedRules += 1;
      matchedConditions.push("Caste category matches eligibility");
    } else {
      failedConditions.push("Caste category is not eligible");
    }
  }

  const citizenState = normalizeText(getCitizenValue(citizen, "state"));
  const schemeState = hasRuleValue(rules.state) ? rules.state : scheme.state;
  if (hasRuleValue(schemeState) && (normalizeText(schemeState) !== "all india" || hasMeaningfulRestriction)) {
    totalApplicableRules += 1;

    if (normalizeText(schemeState) === "all india" || citizenState === normalizeText(schemeState)) {
      matchedRules += 1;
      matchedConditions.push("Scheme is available in user's state");
    } else {
      failedConditions.push("Scheme is not available in user's state");
    }
  }

  if (rules.requires_farmer === true) {
    totalApplicableRules += 1;

    if (normalizeText(getCitizenValue(citizen, "farmer_status", "farmerStatus")) === "yes") {
      matchedRules += 1;
      matchedConditions.push("User is a farmer");
    } else {
      failedConditions.push("User is not a farmer");
    }
  }

  if (rules.requires_bpl === true) {
    totalApplicableRules += 1;

    if (normalizeText(getCitizenValue(citizen, "bpl_status", "bplStatus")) === "yes") {
      matchedRules += 1;
      matchedConditions.push("User has BPL status");
    } else {
      failedConditions.push("User is not BPL");
    }
  }

  if (rules.requires_disability === true) {
    totalApplicableRules += 1;

    if (normalizeText(getCitizenValue(citizen, "disability_status", "disabilityStatus")) === "yes") {
      matchedRules += 1;
      matchedConditions.push("User has disability status");
    } else {
      failedConditions.push("User does not have disability status");
    }
  }

  const citizenOccupation = normalizeText(getCitizenValue(citizen, "occupation"));
  if (hasRuleValue(rules.eligible_occupations)) {
    totalApplicableRules += 1;

    if (normalizeList(rules.eligible_occupations).includes(citizenOccupation)) {
      matchedRules += 1;
      matchedConditions.push(`Occupation matches ${citizenOccupation} eligibility`);
    } else {
      failedConditions.push("Occupation does not match eligibility");
    }
  }

  const citizenEducation = normalizeText(getCitizenValue(citizen, "education_level", "educationLevel"));
  if (hasRuleValue(rules.education_level) && !isAnyRule(rules.education_level)) {
    totalApplicableRules += 1;

    if (educationMatches(citizenEducation, rules.education_level)) {
      matchedRules += 1;
      matchedConditions.push("Education level matches eligibility");
    } else {
      failedConditions.push("Education level does not match eligibility");
    }
  }

  return buildResult(scheme, matchedRules, totalApplicableRules, matchedConditions, failedConditions);
}

function evaluateFallbackKeywords(citizen, scheme) {
  let matchedRules = 0;
  let totalApplicableRules = 0;
  const matchedConditions = [];
  const failedConditions = [];
  const text = getSchemeSearchText(scheme);

  // Fallback rules are intentionally simple and only run when structured rules are missing.
  if (normalizeText(getCitizenValue(citizen, "farmer_status", "farmerStatus")) === "yes") {
    totalApplicableRules += 1;
    if (containsAny(text, ["farmer", "agriculture", "kisan"])) {
      matchedRules += 1;
      matchedConditions.push("Farmer status matches scheme keywords");
    }
  }

  if (normalizeText(getCitizenValue(citizen, "bpl_status", "bplStatus")) === "yes") {
    totalApplicableRules += 1;
    if (containsAny(text, ["bpl", "poor", "economically weaker", "ews"])) {
      matchedRules += 1;
      matchedConditions.push("BPL or low-income status matches scheme keywords");
    }
  }

  if (normalizeText(getCitizenValue(citizen, "gender")) === "female") {
    totalApplicableRules += 1;
    if (containsAny(text, ["women", "girl", "female", "kanya"])) {
      matchedRules += 1;
      matchedConditions.push("Gender matches women or girl scheme keywords");
    }
  }

  if (normalizeText(getCitizenValue(citizen, "occupation")) === "student") {
    totalApplicableRules += 1;
    if (containsAny(text, ["student", "scholarship", "education"])) {
      matchedRules += 1;
      matchedConditions.push("Student occupation matches education scheme keywords");
    }
  }

  if (normalizeText(getCitizenValue(citizen, "disability_status", "disabilityStatus")) === "yes") {
    totalApplicableRules += 1;
    if (containsAny(text, ["disability", "divyang", "disabled"])) {
      matchedRules += 1;
      matchedConditions.push("Disability status matches scheme keywords");
    }
  }

  return buildResult(scheme, matchedRules, totalApplicableRules, matchedConditions, failedConditions);
}

export function evaluateSchemeEligibility(citizen, scheme) {
  const rules = scheme.eligibility_rules || {};
  const hasStructuredRules = Object.values(rules).some(hasRuleValue);

  if (hasStructuredRules) {
    return evaluateStructuredRules(citizen, scheme, rules);
  }

  return evaluateFallbackKeywords(citizen, scheme);
}

export function evaluateAllSchemes(citizen, schemes) {
  return schemes
    .map((scheme) => evaluateSchemeEligibility(citizen, scheme))
    .filter((scheme) => scheme.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score || a.scheme_name.localeCompare(b.scheme_name));
}
