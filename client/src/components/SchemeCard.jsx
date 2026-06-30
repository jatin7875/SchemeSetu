import { Link } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import Badge from "./ui/Badge.jsx";
import Button from "./ui/Button.jsx";
import ProgressBar from "./ui/ProgressBar.jsx";

function statusLabel(status) {
  return String(status || "not_eligible").replaceAll("_", " ");
}

function scoreText(score) {
  return score === null || score === undefined ? "N/A" : `${score}%`;
}

function SchemeCard({ scheme }) {
  const categories = Array.isArray(scheme.category) ? scheme.category : String(scheme.category || "General").split(",");
  const shortBenefit = (scheme.benefits || scheme.benefits_text || "Benefit details not available").slice(0, 170);
  const matchedConditions = scheme.matched_conditions || scheme.match_reasons || [];
  const failedConditions = scheme.failed_conditions || [];
  const status = scheme.status || "not_eligible";
  const ruleScore = scheme.rule_score ?? scheme.eligibility_match ?? scheme.match_score ?? 0;
  const mlScore = scheme.ml_score ?? scheme.profile_relevance;
  const semanticScore = scheme.semantic_score;
  const modelScore = scheme.model_score;
  const finalScore = scheme.final_score ?? scheme.match_score ?? ruleScore;

  return (
    <article className="recommendation-card">
      <div className="recommendation-card-main">
        <div className="scheme-card-top">
          <div>
            <div className="badge-row">
              {categories.slice(0, 3).map((category) => (
                <Badge key={category.trim()} variant="category">{category.trim()}</Badge>
              ))}
            </div>
            <h2>{scheme.scheme_name}</h2>
          </div>
          <Badge variant={status}>{statusLabel(status)}</Badge>
        </div>

        <p className="scheme-benefit">{shortBenefit}{shortBenefit.length >= 170 ? "..." : ""}</p>

        <div className="score-panel">
          <div className="final-score">
            <strong>{scoreText(finalScore)}</strong>
            <span>Recommendation Score</span>
          </div>
          <div className="score-progress" aria-label={`Recommendation score ${finalScore}%`}>
            <ProgressBar value={finalScore} label={`Recommendation score ${finalScore}%`} />
          </div>
        </div>

        <div className="score-mini-grid">
          <span>Eligibility Match <strong>{scoreText(ruleScore)}</strong></span>
          <span>Profile Relevance <strong>{scoreText(mlScore)}</strong></span>
          <span>Scheme Similarity <strong>{scoreText(semanticScore)}</strong></span>
          <span>Profile Fit <strong>{scoreText(modelScore)}</strong></span>
        </div>
      </div>

      <div className="condition-preview-grid">
        <div>
          <h3><CheckCircle2 size={16} /> Matched</h3>
          {matchedConditions.length > 0 ? (
            <ul className="condition-list matched">
              {matchedConditions.slice(0, 3).map((condition) => (
                <li key={condition}>{condition}</li>
              ))}
            </ul>
          ) : (
            <p>No matched conditions recorded.</p>
          )}
        </div>
        <div>
          <h3><XCircle size={16} /> Failed</h3>
          {failedConditions.length > 0 ? (
            <ul className="condition-list failed">
              {failedConditions.slice(0, 3).map((condition) => (
                <li key={condition}>{condition}</li>
              ))}
            </ul>
          ) : (
            <p>No failed conditions recorded.</p>
          )}
        </div>
      </div>

      <Button as={Link} variant="secondary" size="sm" to={`/scheme/${scheme.scheme_id}`}>
        View Details
      </Button>
    </article>
  );
}

export default SchemeCard;
