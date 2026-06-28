from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from recommender import MODEL_FILE, rank_schemes
from rule_extractor import extract_rules_from_text

app = FastAPI(title="SchemeSetu ML Service")


class PredictRequest(BaseModel):
    citizen_profile: Dict[str, Any]
    schemes: List[Dict[str, Any]]


class RuleExtractionRequest(BaseModel):
    text: str


@app.get("/")
def health_check():
    return {"message": "SchemeSetu ML Service is running"}


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": MODEL_FILE.exists()
    }


@app.post("/recommend")
def recommend(request: PredictRequest):
    try:
        rankings = rank_schemes(request.citizen_profile, request.schemes)
        return {
            "success": True,
            "rankings": rankings
        }
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {error}")


@app.post("/predict")
def predict(request: PredictRequest):
    return recommend(request)


@app.post("/extract-rules")
def extract_rules(request: RuleExtractionRequest):
    return {
        "success": True,
        "rules": extract_rules_from_text(request.text)
    }
