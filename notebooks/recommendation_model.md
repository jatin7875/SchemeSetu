# SchemeSetu Recommendation Model Notes

## 1. Feature creation

`ml-service/feature_engineering.py` converts each citizen-profile and scheme pair into numeric features such as:

- age and annual income
- encoded gender, caste and occupation
- state match
- farmer, BPL and disability flags
- scheme requirement flags
- income, age, caste, occupation and education match checks

## 2. Temporary training labels

Real click or approval labels are not available in Phase 4. The training script creates temporary labels from rule-like checks:

- label `1` when the temporary rule score is at least 80
- label `0` otherwise

This keeps ML output aligned with the rule engine until real labels are available.

## 3. Model

The default model is Logistic Regression wrapped in a scikit-learn pipeline with `StandardScaler`.

The model is saved to `ml-service/model.pkl` using `joblib`.

## 4. Final score

The Node backend combines scores as:

`final_score = round((0.6 * rule_score) + (0.4 * ml_score))`

If the ML service is unavailable, the backend uses the rule score as the final score.
