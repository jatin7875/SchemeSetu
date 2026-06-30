export function validateSchemeRecord(record = {}) {
  const errors = [];

  if (!record.scheme_name && !record.name) {
    errors.push("scheme_name is required");
  }

  if (!record.benefits && !record.benefits_text) {
    errors.push("benefits is required");
  }

  if (!record.eligibility && !record.eligibility_text) {
    errors.push("eligibility is required");
  }

  if (record.status && !["active", "closed", "merged", "unknown"].includes(record.status)) {
    errors.push("status must be active, closed, merged or unknown");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
