import json
import sys
from urllib import request, error

BASE_URL = "http://localhost:8000"


def post_json(path, payload):
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        f"{BASE_URL}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def get_json(path):
    with request.urlopen(f"{BASE_URL}{path}", timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def assert_condition(condition, message):
    if not condition:
        raise AssertionError(message)


def run_test(name, fn):
    try:
        fn()
        print(f"PASS {name} passed")
    except Exception as exc:
        print(f"FAIL {name} failed: {exc}")
        return False
    return True


def test_root():
    data = get_json("/")
    assert_condition("message" in data, "Root endpoint must return message")


def test_health():
    data = get_json("/health")
    assert_condition(data.get("status") == "healthy", "Health status should be healthy")
    assert_condition("model_loaded" in data, "Health response should include model_loaded")


def test_recommendation():
    data = post_json(
        "/recommend",
        {
            "citizen_profile": {
                "age": 21,
                "gender": "male",
                "state": "Maharashtra",
                "district": "Nagpur",
                "caste": "OBC",
                "annual_income": 120000,
                "occupation": "student",
                "disability_status": "no",
                "farmer_status": "no",
                "bpl_status": "yes",
                "ration_card_type": "yellow",
                "education_level": "undergraduate",
            },
            "schemes": [
                {
                    "scheme_id": "test_scheme",
                    "scheme_name": "OBC Student Scholarship",
                    "category": "Education",
                    "benefits": "Financial support for OBC students",
                    "eligibility": "OBC students with annual income below 2.5 lakh are eligible.",
                    "tags": ["student", "obc", "scholarship", "education"],
                }
            ],
        },
    )
    rankings = data.get("rankings", [])
    assert_condition(data.get("success") is True, "Recommendation success should be true")
    assert_condition(len(rankings) == 1, "Expected one ranking")
    assert_condition(0 <= rankings[0].get("ml_score", -1) <= 100, "ml_score should be 0-100")


def test_rule_extraction():
    data = post_json(
        "/extract-rules",
        {
            "text": "Applicant age should be between 18 and 60 years. Annual income should not exceed Rs. 2 lakh."
        },
    )
    rules = data.get("rules", [])
    assert_condition(data.get("success") is True, "Rule extraction success should be true")
    assert_condition(any(rule.get("attribute") == "age" and rule.get("operator") == ">=" for rule in rules), "Missing age >= rule")
    assert_condition(any(rule.get("attribute") == "annual_income" and rule.get("value") == 200000 for rule in rules), "Missing income rule")


if __name__ == "__main__":
    tests = [
        ("ML root", test_root),
        ("ML health", test_health),
        ("ML recommendation", test_recommendation),
        ("Rule extraction", test_rule_extraction),
    ]
    results = [run_test(name, fn) for name, fn in tests]
    sys.exit(0 if all(results) else 1)
