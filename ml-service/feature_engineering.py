FEATURE_NAMES = [
    "age",
    "annual_income",
    "gender_encoded",
    "caste_encoded",
    "occupation_encoded",
    "state_match",
    "is_farmer",
    "is_bpl",
    "has_disability",
    "scheme_category_encoded",
    "scheme_requires_farmer",
    "scheme_requires_bpl",
    "scheme_requires_disability",
    "income_within_limit",
    "age_within_limit",
    "caste_match",
    "occupation_match",
    "education_match"
]

GENDER_MAP = {"male": 0, "female": 1, "other": 2}
CASTE_MAP = {"general": 0, "obc": 1, "sc": 2, "st": 3, "ews": 4, "ebc": 5, "dnt": 6}
OCCUPATION_MAP = {
    "student": 0,
    "farmer": 1,
    "self_employed": 2,
    "msme_owner": 3,
    "artisan": 4,
    "unorganised_sector": 5,
    "salaried": 6,
    "unemployed": 7
}
CATEGORY_MAP = {
    "agriculture": 1,
    "education": 2,
    "scholarship": 3,
    "health": 4,
    "housing": 5,
    "pension": 6,
    "insurance": 7,
    "women welfare": 8,
    "savings": 9,
    "credit": 10
}


def normalize_text(value):
    return str(value or "").strip().lower()


def normalize_list(value):
    if isinstance(value, list):
        return [normalize_text(item) for item in value if normalize_text(item)]

    if value:
        return [normalize_text(value)]

    return []


def get_profile_value(citizen_profile, snake_key, camel_key=None):
    camel_key = camel_key or snake_key
    return citizen_profile.get(snake_key, citizen_profile.get(camel_key, ""))


def yes_no(value):
    return 1 if normalize_text(value) == "yes" else 0


def get_scheme_rules(scheme):
    return scheme.get("eligibility_rules") or {}


def scheme_categories(scheme):
    category = scheme.get("category", "")
    return normalize_list(category)


def encode_category(scheme):
    categories = scheme_categories(scheme)
    for category in categories:
        if category in CATEGORY_MAP:
            return CATEGORY_MAP[category]
    return 0


def check_state_match(citizen_profile, scheme):
    citizen_state = normalize_text(get_profile_value(citizen_profile, "state"))
    rules = get_scheme_rules(scheme)
    scheme_state = normalize_text(rules.get("state") or scheme.get("state") or "All India")
    return 1 if scheme_state == "all india" or citizen_state == scheme_state else 0


def check_age_within_limit(citizen_profile, scheme):
    age = float(get_profile_value(citizen_profile, "age") or 0)
    rules = get_scheme_rules(scheme)
    age_min = rules.get("age_min")
    age_max = rules.get("age_max")

    if age_min is not None and age < float(age_min):
        return 0

    if age_max is not None and age > float(age_max):
        return 0

    return 1


def check_income_within_limit(citizen_profile, scheme):
    income = float(get_profile_value(citizen_profile, "annual_income", "annualIncome") or 0)
    income_limit = get_scheme_rules(scheme).get("income_limit")

    if income_limit is None:
        return 1

    return 1 if income <= float(income_limit) else 0


def education_matches(citizen_education, required_education):
    citizen_value = normalize_text(citizen_education)
    required_value = normalize_text(required_education)

    if not required_value or required_value in ["any", "all"]:
        return 1

    if required_value == "post-matric":
        return 1 if citizen_value in ["post-matric", "undergraduate", "graduate", "postgraduate"] else 0

    return 1 if citizen_value == required_value else 0


def prepare_features(citizen_profile, scheme):
    rules = get_scheme_rules(scheme)
    gender = normalize_text(get_profile_value(citizen_profile, "gender"))
    caste = normalize_text(get_profile_value(citizen_profile, "caste"))
    occupation = normalize_text(get_profile_value(citizen_profile, "occupation"))
    education = normalize_text(get_profile_value(citizen_profile, "education_level", "educationLevel"))

    eligible_castes = normalize_list(rules.get("eligible_castes"))
    eligible_occupations = normalize_list(rules.get("eligible_occupations"))

    caste_match = 1 if not eligible_castes or caste in eligible_castes else 0
    occupation_match = 1 if not eligible_occupations or occupation in eligible_occupations else 0

    return [
        float(get_profile_value(citizen_profile, "age") or 0),
        float(get_profile_value(citizen_profile, "annual_income", "annualIncome") or 0),
        GENDER_MAP.get(gender, -1),
        CASTE_MAP.get(caste, -1),
        OCCUPATION_MAP.get(occupation, -1),
        check_state_match(citizen_profile, scheme),
        yes_no(get_profile_value(citizen_profile, "farmer_status", "farmerStatus")),
        yes_no(get_profile_value(citizen_profile, "bpl_status", "bplStatus")),
        yes_no(get_profile_value(citizen_profile, "disability_status", "disabilityStatus")),
        encode_category(scheme),
        1 if rules.get("requires_farmer") is True else 0,
        1 if rules.get("requires_bpl") is True else 0,
        1 if rules.get("requires_disability") is True else 0,
        check_income_within_limit(citizen_profile, scheme),
        check_age_within_limit(citizen_profile, scheme),
        caste_match,
        occupation_match,
        education_matches(education, rules.get("education_level"))
    ]
