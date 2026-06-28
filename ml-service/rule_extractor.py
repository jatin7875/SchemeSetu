import re


def split_sentences(text):
    normalized = re.sub(r"\bRs\.", "Rs", text or "", flags=re.IGNORECASE)
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+", normalized) if part.strip()]


def add_rule(rules, attribute, operator, value, unit, source_text):
    rule = {
        "attribute": attribute,
        "operator": operator,
        "value": value,
        "unit": unit,
        "source_text": source_text
    }

    if rule not in rules:
        rules.append(rule)


def parse_amount(value):
    text = str(value or "").lower().replace(",", "")
    lakh_match = re.search(r"(\d+(?:\.\d+)?)\s*lakh", text)
    if lakh_match:
        return round(float(lakh_match.group(1)) * 100000)

    number_match = re.search(r"\d+(?:\.\d+)?", text)
    return round(float(number_match.group(0))) if number_match else None


def extract_age_rules(text):
    rules = []
    for sentence in split_sentences(text):
        lower = sentence.lower()
        between = re.search(r"(?:age|aged).*?between\s+(\d{1,3})\s+(?:and|to|-)\s+(\d{1,3})", lower)
        if between:
            add_rule(rules, "age", ">=", int(between.group(1)), "years", sentence)
            add_rule(rules, "age", "<=", int(between.group(2)), "years", sentence)

        minimum = re.search(r"(?:minimum age|min age|age must be above|age should be above|above)\s+(\d{1,3})", lower)
        if minimum:
            add_rule(rules, "age", ">=", int(minimum.group(1)), "years", sentence)

        maximum = re.search(r"(?:maximum age|max age|not be older than|older than|below)\s+(\d{1,3})", lower)
        if maximum and "income" not in lower:
            add_rule(rules, "age", "<=", int(maximum.group(1)), "years", sentence)

    return rules


def extract_income_rules(text):
    rules = []
    for sentence in split_sentences(text):
        lower = sentence.lower()
        if "income" not in lower:
            continue

        has_limit_phrase = re.search(r"not exceed|less than|below|up to|upto|maximum", lower)
        match = None
        if has_limit_phrase:
            match = re.search(r"(?:rs\.?|₹|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?\s*lakh|\d{4,}(?:,\d+)*)", lower)
        if not match:
            match = re.search(r"(?:rs\.?|₹|inr)\s*(\d+(?:,\d+)*(?:\.\d+)?\s*lakh|\d+(?:,\d+)*)", lower)

        if match:
            amount = parse_amount(match.group(1))
            if amount is not None:
                add_rule(rules, "annual_income", "<=", amount, "INR", sentence)

    return rules


def extract_gender_rules(text):
    rules = []
    for sentence in split_sentences(text):
        lower = sentence.lower()
        if re.search(r"\b(female|women|woman|girls|girl)\b", lower):
            add_rule(rules, "gender", "==", "female", None, sentence)
        elif "all genders" in lower:
            add_rule(rules, "gender", "in", ["male", "female", "other"], None, sentence)
    return rules


def extract_caste_rules(text):
    rules = []
    caste_values = []
    lower = (text or "").lower()

    if re.search(r"\bsc\b|scheduled caste", lower):
        caste_values.append("SC")
    if re.search(r"\bst\b|scheduled tribe", lower):
        caste_values.append("ST")
    if re.search(r"\bobc\b|other backward class", lower):
        caste_values.append("OBC")
    if re.search(r"\bgeneral\b", lower):
        caste_values.append("General")
    if re.search(r"\bews\b", lower):
        caste_values.append("EWS")

    if caste_values:
        source = next((sentence for sentence in split_sentences(text) if any(value.lower() in sentence.lower() for value in caste_values)), text)
        add_rule(rules, "caste", "in", caste_values, None, source)

    return rules


def extract_state_rules(text):
    rules = []
    states = ["Maharashtra", "Delhi", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Gujarat", "Karnataka", "Tamil Nadu"]
    for sentence in split_sentences(text):
        lower = sentence.lower()
        if "across india" in lower or "all india" in lower:
            add_rule(rules, "state", "==", "All India", None, sentence)
        for state in states:
            if state.lower() in lower and ("resident" in lower or "from" in lower or "eligible" in lower):
                add_rule(rules, "state", "==", state, None, sentence)
    return rules


def extract_farmer_rules(text):
    rules = []
    for sentence in split_sentences(text):
        if re.search(r"\b(farmer|farmers|landholding farmer|small and marginal farmers)\b", sentence.lower()):
            add_rule(rules, "farmer_status", "==", "yes", None, sentence)
    return rules


def extract_bpl_rules(text):
    rules = []
    for sentence in split_sentences(text):
        if re.search(r"\b(bpl|below poverty line|ews)\b", sentence.lower()):
            add_rule(rules, "bpl_status", "==", "yes", None, sentence)
    return rules


def extract_disability_rules(text):
    rules = []
    for sentence in split_sentences(text):
        lower = sentence.lower()
        if re.search(r"\b(disability|disabled|divyang|divyangjan)\b", lower):
            add_rule(rules, "disability_status", "==", "yes", None, sentence)
            percentage = re.search(r"(\d{1,3})\s*(?:%|percent)", lower)
            if percentage:
                add_rule(rules, "disability_percentage", ">=", int(percentage.group(1)), "%", sentence)
    return rules


def extract_occupation_rules(text):
    rules = []
    occupations = {
        "student": ["student", "students"],
        "farmer": ["farmer", "farmers"],
        "unorganised_sector": ["unorganized worker", "unorganised worker", "unorganised sector"],
        "self_employed": ["street vendor", "street vendors", "self employed", "self-employed"],
        "artisan": ["artisan", "craftsperson"]
    }

    for sentence in split_sentences(text):
        lower = sentence.lower()
        matched = [key for key, keywords in occupations.items() if any(keyword in lower for keyword in keywords)]
        if matched:
            add_rule(rules, "occupation", "in", matched, None, sentence)

    return rules


def extract_education_rules(text):
    rules = []
    education_values = {
        "undergraduate": ["undergraduate", "degree course"],
        "post-matric": ["post-matric", "class 9", "class 10", "class 11", "class 12"],
        "graduate": ["graduate"],
        "postgraduate": ["postgraduate", "post graduate"]
    }

    for sentence in split_sentences(text):
        lower = sentence.lower()
        matched = [key for key, keywords in education_values.items() if any(keyword in lower for keyword in keywords)]
        if matched:
            add_rule(rules, "education_level", "in", matched, None, sentence)

    return rules


def extract_rules_from_text(text):
    rules = []
    extractors = [
        extract_age_rules,
        extract_income_rules,
        extract_gender_rules,
        extract_caste_rules,
        extract_state_rules,
        extract_farmer_rules,
        extract_bpl_rules,
        extract_disability_rules,
        extract_occupation_rules,
        extract_education_rules
    ]

    for extractor in extractors:
        for rule in extractor(text):
            if rule not in rules:
                rules.append(rule)

    return rules
