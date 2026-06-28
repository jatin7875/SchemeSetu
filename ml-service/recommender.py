from pathlib import Path
import math

import joblib
import pandas as pd

from feature_engineering import FEATURE_NAMES, prepare_features

MODEL_FILE = Path(__file__).resolve().parent / "model.pkl"
_MODEL = None
_SENTENCE_MODEL = None


def load_model():
    global _MODEL
    if _MODEL is None:
        if not MODEL_FILE.exists():
            raise FileNotFoundError("model.pkl not found. Run: python train_model.py")
        _MODEL = joblib.load(MODEL_FILE)
    return _MODEL


def load_sentence_model():
    global _SENTENCE_MODEL
    if _SENTENCE_MODEL is None:
        from sentence_transformers import SentenceTransformer
        _SENTENCE_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    return _SENTENCE_MODEL


def profile_to_text(citizen_profile):
    return (
        f"{citizen_profile.get('age', '')} year old {citizen_profile.get('gender', '')} "
        f"from {citizen_profile.get('state', '')}, {citizen_profile.get('caste', '')} caste, "
        f"{citizen_profile.get('occupation', '')}, income {citizen_profile.get('annual_income', citizen_profile.get('annualIncome', ''))}, "
        f"BPL {citizen_profile.get('bpl_status', citizen_profile.get('bplStatus', ''))}, "
        f"farmer {citizen_profile.get('farmer_status', citizen_profile.get('farmerStatus', ''))}, "
        f"disability {citizen_profile.get('disability_status', citizen_profile.get('disabilityStatus', ''))}, "
        f"{citizen_profile.get('education_level', citizen_profile.get('educationLevel', ''))}"
    )


def scheme_to_text(scheme):
    category = scheme.get("category", "")
    if isinstance(category, list):
        category = " ".join(category)

    tags = scheme.get("tags", "")
    if isinstance(tags, list):
        tags = " ".join(tags)

    return " ".join(
        str(part or "")
        for part in [
            scheme.get("scheme_name"),
            category,
            scheme.get("benefits"),
            scheme.get("benefits_text"),
            scheme.get("eligibility"),
            scheme.get("eligibility_text"),
            tags
        ]
    )


def token_similarity_score(left_text, right_text):
    left_tokens = {token for token in left_text.lower().split() if len(token) > 2}
    right_tokens = {token for token in right_text.lower().split() if len(token) > 2}
    if not left_tokens or not right_tokens:
        return 0
    return round((len(left_tokens & right_tokens) / len(left_tokens | right_tokens)) * 100)


def cosine_similarity(left, right):
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    if left_norm == 0 or right_norm == 0:
        return 0
    return dot / (left_norm * right_norm)


def calculate_semantic_score(citizen_profile, scheme):
    profile_text = profile_to_text(citizen_profile)
    scheme_text = scheme_to_text(scheme)

    try:
        sentence_model = load_sentence_model()
        embeddings = sentence_model.encode([profile_text, scheme_text])
        similarity = cosine_similarity(embeddings[0], embeddings[1])
        return max(0, min(100, round(((similarity + 1) / 2) * 100)))
    except Exception:
        # If sentence-transformers or its model is unavailable, keep the service usable.
        return token_similarity_score(profile_text, scheme_text)


def predict_model_score(citizen_profile, scheme):
    model = load_model()
    features = pd.DataFrame([prepare_features(citizen_profile, scheme)], columns=FEATURE_NAMES)
    probability = model.predict_proba(features)[0][1]
    return round(float(probability) * 100)


def rank_schemes(citizen_profile, schemes):
    rankings = []

    for scheme in schemes:
        semantic_score = calculate_semantic_score(citizen_profile, scheme)
        model_score = None
        try:
            model_score = predict_model_score(citizen_profile, scheme)
        except Exception:
            model_score = None

        ml_score = semantic_score if model_score is None else round((0.5 * semantic_score) + (0.5 * model_score))

        rankings.append({
            "scheme_id": scheme.get("scheme_id"),
            "scheme_name": scheme.get("scheme_name"),
            "ml_score": ml_score,
            "semantic_score": semantic_score,
            "model_score": model_score
        })

    return sorted(rankings, key=lambda item: item["ml_score"], reverse=True)
