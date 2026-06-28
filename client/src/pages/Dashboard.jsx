import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, FileCheck2, PlusCircle, SearchCheck } from "lucide-react";
import api from "../api.js";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import LoadingState from "../components/ui/LoadingState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";

function buildRecommendationStats(recommendations) {
  if (!recommendations.length) {
    return {
      totalRecommendations: 0,
      averageFinalScore: 0,
      likelyEligible: 0,
      partiallyEligible: 0,
      notEligible: 0,
      recent: []
    };
  }

  const sum = recommendations.reduce((total, item) => total + Number(item.final_score || item.match_score || 0), 0);

  return {
    totalRecommendations: recommendations.length,
    averageFinalScore: Math.round(sum / recommendations.length),
    likelyEligible: recommendations.filter((scheme) => scheme.status === "likely_eligible").length,
    partiallyEligible: recommendations.filter((scheme) => scheme.status === "partially_eligible").length,
    notEligible: recommendations.filter((scheme) => scheme.status === "not_eligible").length,
    recent: recommendations.slice(0, 5)
  };
}

function StatTile({ label, value, helper, icon: Icon, tone = "slate" }) {
  return (
    <Card className={`dashboard-tile tone-${tone}`}>
      <div className="tile-icon"><Icon size={20} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </Card>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recommendationStats, setRecommendationStats] = useState(buildRecommendationStats([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latestVerification = (() => {
    const saved = localStorage.getItem("latestDocumentVerification");
    return saved ? JSON.parse(saved) : null;
  })();

  async function fetchDashboard() {
    setLoading(true);
    setError("");
    try {
      const savedProfile = localStorage.getItem("citizenProfile");
      const [dashboardResponse, recommendResponse] = await Promise.all([
        api.get("/dashboard"),
        savedProfile
          ? api.post("/recommend", JSON.parse(savedProfile))
          : Promise.resolve({ data: { recommendations: JSON.parse(localStorage.getItem("recommendedSchemes") || "[]") } })
      ]);

      const recommendations = recommendResponse.data.recommendations || [];
      localStorage.setItem("recommendedSchemes", JSON.stringify(recommendations));
      setStats(dashboardResponse.data);
      setRecommendationStats(buildRecommendationStats(recommendations));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <LoadingState title="Loading dashboard" message="Preparing scheme and recommendation overview." cards={6} />;
  }

  if (error) {
    return <ErrorState title="Unable to load dashboard" message={error} onRetry={fetchDashboard} />;
  }

  const categoryEntries = Object.entries(stats.category_counts || {}).sort((a, b) => b[1] - a[1]).slice(0, 12);

  return (
    <section className="page-stack">
      <PageHeader
        breadcrumb="Home / Dashboard"
        eyebrow="Dashboard"
        title="SchemeSetu overview"
        subtitle="Review scheme coverage, recommendation outcomes, and recent verification activity."
        actions={<Button type="button" variant="secondary" size="sm" onClick={fetchDashboard}>Refresh</Button>}
      />

      <div className="dashboard-grid">
        <StatTile label="Total schemes" value={stats.total_schemes} helper="Schemes in local dataset" icon={BarChart3} tone="slate" />
        <StatTile label="Total recommendations" value={recommendationStats.totalRecommendations} helper="For current saved profile" icon={SearchCheck} tone="teal" />
        <StatTile label="Likely eligible" value={recommendationStats.likelyEligible} helper="High-scoring matches" icon={SearchCheck} tone="green" />
        <StatTile label="Partially eligible" value={recommendationStats.partiallyEligible} helper="Needs closer review" icon={SearchCheck} tone="amber" />
        <StatTile label="Not eligible" value={recommendationStats.notEligible} helper="Low-scoring matches" icon={SearchCheck} tone="red" />
        <StatTile label="Average recommendation score" value={`${recommendationStats.averageFinalScore}%`} helper="Combined profile match score" icon={BarChart3} tone="saffron" />
      </div>

      <div className="dashboard-two-column">
        <Card title="Recent Recommendations" subtitle="Top recommendations for the current saved citizen profile.">
          {recommendationStats.recent.length ? (
            <div className="recent-recommendation-list">
              {recommendationStats.recent.map((scheme) => (
                <Link key={scheme.scheme_id} to={`/scheme/${scheme.scheme_id}`}>
                  <span>{scheme.scheme_name}</span>
                  <Badge variant={scheme.status}>{String(scheme.status || "not_eligible").replaceAll("_", " ")}</Badge>
                  <strong>{scheme.final_score ?? scheme.match_score ?? 0}%</strong>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted-text">No recommendations generated yet.</p>
          )}
        </Card>

        <Card title="Top Scheme Categories" subtitle="Most common categories in the scheme dataset.">
          <div className="category-pill-grid">
            {categoryEntries.map(([category, count]) => (
              <span key={category}>
                {category}
                <strong>{count}</strong>
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="dashboard-two-column">
        <Card title="Recommendation Score Summary" subtitle="Quick interpretation of the saved profile results.">
          <div className="score-summary-bars">
            <span><b>Likely eligible</b><i style={{ width: `${recommendationStats.totalRecommendations ? (recommendationStats.likelyEligible / recommendationStats.totalRecommendations) * 100 : 0}%` }} /></span>
            <span><b>Partially eligible</b><i style={{ width: `${recommendationStats.totalRecommendations ? (recommendationStats.partiallyEligible / recommendationStats.totalRecommendations) * 100 : 0}%` }} /></span>
            <span><b>Not eligible</b><i style={{ width: `${recommendationStats.totalRecommendations ? (recommendationStats.notEligible / recommendationStats.totalRecommendations) * 100 : 0}%` }} /></span>
          </div>
        </Card>

        <Card title="Quick Actions" subtitle="Jump to common SchemeSetu workflows.">
          <div className="quick-action-grid">
            <Button as={Link} size="sm" to="/profile" icon={SearchCheck}>Check Eligibility</Button>
            <Button as={Link} size="sm" to="/verify-document" variant="secondary" icon={FileCheck2}>Verify Document</Button>
            <Button as={Link} size="sm" to="/admin/add-scheme" variant="secondary" icon={PlusCircle}>Add Scheme</Button>
            <Button as={Link} size="sm" to="/analytics" variant="secondary" icon={BarChart3}>View Analytics</Button>
          </div>
        </Card>
      </div>

      <Card title="Latest Document Check" subtitle="Most recent document verification saved in this browser.">
        {latestVerification?.verification ? (
          <div className="profile-summary-grid">
            <span><strong>Document</strong>{latestVerification.document_name}</span>
            <span><strong>Status</strong><Badge variant={latestVerification.verification.overall_status}>{latestVerification.verification.overall_status.replaceAll("_", " ")}</Badge></span>
            <span><strong>Document confidence</strong>{latestVerification.verification.confidence_score}%</span>
          </div>
        ) : (
          <p className="muted-text">No document has been verified yet.</p>
        )}
      </Card>
    </section>
  );
}

export default Dashboard;
