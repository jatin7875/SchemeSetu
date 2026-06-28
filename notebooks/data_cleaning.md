# SchemeSetu Data Cleaning Notes

## 1. Scheme JSON cleanup

The local `data/schemes.json` file is the source of truth for Phase 4. Each scheme keeps its original descriptive fields and now also includes an `eligibility_rules` object.

The normalized fields used by the rule engine and ML service are:

- `age_min`
- `age_max`
- `gender`
- `state`
- `income_limit`
- `eligible_castes`
- `requires_farmer`
- `requires_bpl`
- `requires_disability`
- `eligible_occupations`
- `education_level`

`null` means the condition is not applicable. `any` means the scheme does not restrict that field.

## 2. Citizen profile CSV

If `data/citizen_profiles.csv` is missing, `ml-service/train_model.py` creates synthetic sample profiles with age, gender, state, caste, income, occupation, disability, farmer, BPL, ration-card and education fields.

These synthetic rows are only for Phase 4 development and should be replaced with verified historical data later.
