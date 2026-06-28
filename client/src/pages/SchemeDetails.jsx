import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import api from "../api.js";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import LoadingState from "../components/ui/LoadingState.jsx";

function statusLabel(status) {
  return String(status || "not_eligible").replaceAll("_", " ");
}

function DetailSection({ title, children }) {
  return (
    <Card title={title}>
      <p className="detail-copy">{children || "Not available"}</p>
    </Card>
  );
}

function SchemeDetails() {
  const { id } = useParams();
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchScheme() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/schemes/${id}`);
      const savedRecommendations = JSON.parse(localStorage.getItem("recommendedSchemes") || "[]");
      const currentEvaluation = savedRecommendations.find((item) => item.scheme_id === id);
      setScheme({ ...response.data, ...currentEvaluation });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load scheme details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchScheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <LoadingState title="Loading scheme details" message="Fetching scheme information and saved evaluation data." cards={3} />;
  }

  if (error) {
    return <ErrorState title="Unable to load scheme details" message={error} onRetry={fetchScheme} />;
  }

  const categories = Array.isArray(scheme.category) ? scheme.category : [scheme.category || "General"];
  const sourceUrls = Array.isArray(scheme.source_urls) ? scheme.source_urls : [scheme.source_urls].filter(Boolean);
  const matchedConditions = scheme.matched_conditions || [];
  const failedConditions = scheme.failed_conditions || [];
  const ruleScore = scheme.rule_score ?? scheme.match_score;
  const mlScore = scheme.ml_score;
  const semanticScore = scheme.semantic_score;
  const modelScore = scheme.model_score;
  const finalScore = scheme.final_score ?? scheme.match_score;
  const hasEvaluation = typeof finalScore === "number";

  return (
    <article className="page-stack">
      <section className="scheme-detail-hero">
        <div>
          <p className="page-breadcrumb">Home / Recommendations / Scheme Details</p>
          <div className="badge-row">
            {categories.map((category) => <Badge key={category} variant="category">{category}</Badge>)}
            {hasEvaluation && <Badge variant={scheme.status}>{statusLabel(scheme.status)}</Badge>}
          </div>
          <h1>{scheme.scheme_name}</h1>
          <p>{scheme.benefits || "Benefit details are not available for this scheme."}</p>
        </div>

        {hasEvaluation && (
          <div className="detail-score-card">
            <strong>{finalScore}%</strong>
            <span>Final Score</span>
          </div>
        )}
      </section>

      {hasEvaluation && (
        <Card title="Eligibility Evaluation" subtitle="Scores from rule checks and ML ranking.">
          <div className="score-mini-grid detail-score-grid">
            <span>Rule <strong>{ruleScore ?? "N/A"}%</strong></span>
            <span>ML <strong>{mlScore === null || mlScore === undefined ? "N/A" : `${mlScore}%`}</strong></span>
            <span>Semantic <strong>{semanticScore === null || semanticScore === undefined ? "N/A" : `${semanticScore}%`}</strong></span>
            <span>Model <strong>{modelScore === null || modelScore === undefined ? "N/A" : `${modelScore}%`}</strong></span>
          </div>

          <div className="condition-preview-grid detail-condition-grid">
            <div>
              <h3><CheckCircle2 size={16} /> Matched conditions</h3>
              {matchedConditions.length > 0 ? (
                <ul className="condition-list matched">
                  {matchedConditions.map((condition) => <li key={condition}>{condition}</li>)}
                </ul>
              ) : <p>No matched conditions recorded.</p>}
            </div>
            <div>
              <h3><XCircle size={16} /> Failed conditions</h3>
              {failedConditions.length > 0 ? (
                <ul className="condition-list failed">
                  {failedConditions.map((condition) => <li key={condition}>{condition}</li>)}
                </ul>
              ) : <p>No failed conditions recorded.</p>}
            </div>
          </div>
        </Card>
      )}

      <div className="detail-grid modern-detail-grid">
        <DetailSection title="Benefits">{scheme.benefits}</DetailSection>
        <DetailSection title="Eligibility">{scheme.eligibility}</DetailSection>
        <DetailSection title="Required Documents">{scheme.required_documents}</DetailSection>
        <DetailSection title="Last Verified">{scheme.last_verified}</DetailSection>
      </div>

      <Card title="Source URLs" subtitle="Official source links stored for this scheme.">
        {sourceUrls.length > 0 ? (
          <ul className="source-link-list">
            {sourceUrls.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">{url}</a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-copy">Not available</p>
        )}
      </Card>

      <div className="button-row">
        {scheme.application_url ? (
          <Button as="a" href={scheme.application_url} target="_blank" rel="noreferrer" icon={ExternalLink}>
            Apply Now
          </Button>
        ) : (
          <Button type="button" disabled>Apply Now</Button>
        )}
        <Button as={Link} variant="secondary" to="/recommended" icon={ArrowLeft}>
          Back to Recommendations
        </Button>
      </div>
    </article>
  );
}

export default SchemeDetails;
