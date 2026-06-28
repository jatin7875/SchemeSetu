import csv
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from feature_engineering import FEATURE_NAMES, prepare_features

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
SCHEMES_FILE = DATA_DIR / "schemes.json"
PROFILES_FILE = DATA_DIR / "citizen_profiles.csv"
MODEL_FILE = Path(__file__).resolve().parent / "model.pkl"


def generate_sample_profiles():
    states = ["Maharashtra", "Karnataka", "Uttar Pradesh", "Tamil Nadu", "Rajasthan"]
    districts = ["Nagpur", "Pune", "Bengaluru", "Lucknow", "Chennai", "Jaipur"]
    castes = ["General", "OBC", "SC", "ST", "EWS"]
    genders = ["male", "female", "other"]
    occupations = ["student", "farmer", "self_employed", "artisan", "unorganised_sector", "salaried", "unemployed"]
    education_levels = ["school", "post-matric", "undergraduate", "graduate", "postgraduate", "none"]
    ration_cards = ["none", "yellow", "BPL", "AAY", "PHH", "APL"]

    rows = []
    for index in range(120):
      rows.append({
          "age": 8 + (index * 7) % 68,
          "gender": genders[index % len(genders)],
          "state": states[index % len(states)],
          "district": districts[index % len(districts)],
          "caste": castes[index % len(castes)],
          "annual_income": 50000 + (index * 17000) % 650000,
          "occupation": occupations[index % len(occupations)],
          "disability_status": "yes" if index % 11 == 0 else "no",
          "farmer_status": "yes" if occupations[index % len(occupations)] == "farmer" else "no",
          "bpl_status": "yes" if index % 4 in [0, 1] else "no",
          "ration_card_type": ration_cards[index % len(ration_cards)],
          "education_level": education_levels[index % len(education_levels)]
      })

    DATA_DIR.mkdir(exist_ok=True)
    with PROFILES_FILE.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} sample citizen profiles at {PROFILES_FILE}")


def load_schemes():
    with SCHEMES_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def load_profiles():
    if not PROFILES_FILE.exists():
        generate_sample_profiles()

    return pd.read_csv(PROFILES_FILE)


def temporary_label_from_features(features):
    feature_map = dict(zip(FEATURE_NAMES, features))
    important_checks = [
        feature_map["state_match"],
        feature_map["income_within_limit"],
        feature_map["age_within_limit"],
        feature_map["caste_match"],
        feature_map["occupation_match"],
        feature_map["education_match"]
    ]

    if feature_map["scheme_requires_farmer"] == 1:
        important_checks.append(feature_map["is_farmer"])

    if feature_map["scheme_requires_bpl"] == 1:
        important_checks.append(feature_map["is_bpl"])

    if feature_map["scheme_requires_disability"] == 1:
        important_checks.append(feature_map["has_disability"])

    rule_score = round((sum(important_checks) / len(important_checks)) * 100)
    return 1 if rule_score >= 80 else 0


def build_training_data(profiles, schemes):
    rows = []
    labels = []

    for profile in profiles.to_dict(orient="records"):
        for scheme in schemes:
            features = prepare_features(profile, scheme)
            rows.append(features)
            labels.append(temporary_label_from_features(features))

    return pd.DataFrame(rows, columns=FEATURE_NAMES), labels


def train_model():
    schemes = load_schemes()
    profiles = load_profiles()
    features, labels = build_training_data(profiles, schemes)

    if len(set(labels)) < 2:
        raise ValueError("Training labels need at least two classes. Add more varied synthetic profiles.")

    test_size = 0.2 if len(features) >= 50 else 0.3
    x_train, x_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=test_size,
        random_state=42,
        stratify=labels
    )

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(max_iter=1000))
    ])
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    accuracy = accuracy_score(y_test, predictions)
    joblib.dump(model, MODEL_FILE)

    print(f"Trained Logistic Regression model on {len(features)} profile-scheme pairs")
    print(f"Accuracy: {accuracy:.2f}")
    print(f"Saved model to {MODEL_FILE}")


if __name__ == "__main__":
    train_model()
