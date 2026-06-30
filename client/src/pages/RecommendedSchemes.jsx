import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { RefreshCw, Search } from "lucide-react";
import SchemeCard from "../components/SchemeCard.jsx";
import { getRecommendations } from "../services/recommendationService.js";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Input from "../components/ui/Input.jsx";
import LoadingState from "../components/ui/LoadingState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Select from "../components/ui/Select.jsx";

function parseSavedProfile() {
  const savedProfile = localStorage.getItem("citizenProfile");
  return savedProfile ? JSON.parse(savedProfile) : null;
}

function getCategoryList(recommendations) {
  const categories = new Set();
  recommendations.forEach((scheme) => {
    const values = Array.isArray(scheme.category) ? scheme.category : String(scheme.category || "").split(",");
    values.map((item) => item.trim()).filter(Boolean).forEach((item) => categories.add(item));
  });
  return Array.from(categories).sort();
}

function RecommendedSchemes() {
  const location = useLocation();
  const [recommendations, setRecommendations] = useState(() => {
    if (Array.isArray(location.state?.recommendations)) {
      return location.state.recommendations;
    }
    const saved = localStorage.getItem("recommendedSchemes");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score_desc");
  const [searchTerm, setSearchTerm] = useState("");
  const profile = parseSavedProfile();

  async function fetchRecommendations() {
    if (!profile) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await getRecommendations(profile);
      setRecommendations(response.recommendations || []);
      localStorage.setItem("recommendedSchemes", JSON.stringify(response.recommendations || []));
      localStorage.setItem("analytics_updated_at", Date.now().toString());
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load recommendations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecommendations();
    // Recommendations should refresh when this page opens for the saved profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => getCategoryList(recommendations), [recommendations]);
  const filteredRecommendations = useMemo(() => {
    return recommendations
      .filter((scheme) => statusFilter === "all" || scheme.status === statusFilter)
      .filter((scheme) => {
        if (categoryFilter === "all") {
          return true;
        }
        const values = Array.isArray(scheme.category) ? scheme.category : String(scheme.category || "").split(",");
        return values.map((item) => item.trim()).includes(categoryFilter);
      })
      .filter((scheme) => scheme.scheme_name.toLowerCase().includes(searchTerm.trim().toLowerCase()))
      .sort((a, b) => {
        const scoreA = Number(a.final_score ?? a.match_score ?? a.rule_score ?? a.eligibility_match ?? 0);
        const scoreB = Number(b.final_score ?? b.match_score ?? b.rule_score ?? b.eligibility_match ?? 0);
        if (sortBy === "score_asc") return scoreA - scoreB;
        if (sortBy === "name") return a.scheme_name.localeCompare(b.scheme_name);
        return scoreB - scoreA;
      });
  }, [recommendations, statusFilter, categoryFilter, sortBy, searchTerm]);

  const bestMatch = recommendations.reduce((best, item) => {
    const score = Number(item.final_score ?? item.match_score ?? item.rule_score ?? item.eligibility_match ?? 0);
    return Math.max(best, score);
  }, 0);
  const likelyEligibleCount = recommendations.filter((scheme) => scheme.status === "likely_eligible").length;

  if (!profile) {
    return (
      <section className="page-stack">
        <PageHeader
          breadcrumb="Home / Recommendations"
          eyebrow="Recommendations"
          title="Recommended schemes"
          subtitle="Schemes ranked using eligibility conditions and recommendation scoring."
        />
        <EmptyState
          title="Citizen profile needed"
          message="Fill the profile form first so SchemeSetu can calculate scheme matches."
          action={<Button as={Link} to="/profile">Go to Profile</Button>}
        />
      </section>
    );
  }

  if (loading && recommendations.length === 0) {
    return <LoadingState title="Loading recommendations" message="Ranking schemes for the saved citizen profile." cards={4} />;
  }

  if (error && recommendations.length === 0) {
    return <ErrorState title="Unable to load recommendations" message={error} onRetry={fetchRecommendations} />;
  }

  return (
    <section className="page-stack">
      <PageHeader
        breadcrumb="Home / Recommendations"
        eyebrow="Recommendations"
        title="Recommended schemes"
        subtitle="Schemes ranked using eligibility conditions and recommendation scoring."
        actions={<Button type="button" variant="secondary" onClick={fetchRecommendations} disabled={loading} icon={RefreshCw}>{loading ? "Refreshing..." : "Refresh"}</Button>}
      />

      {error && <p className="error-message">{error}</p>}

      <div className="summary-grid">
        <Card className="summary-card"><span>Total recommendations</span><strong>{recommendations.length}</strong></Card>
        <Card className="summary-card"><span>Best match score</span><strong>{bestMatch}%</strong></Card>
        <Card className="summary-card"><span>Likely eligible</span><strong>{likelyEligibleCount}</strong></Card>
      </div>

      <Card title="Citizen Profile Summary" subtitle="Current saved profile used for ranking.">
        <div className="profile-summary-grid">
          <span><strong>State</strong>{profile.state || "Not set"}</span>
          <span><strong>District</strong>{profile.district || "Not set"}</span>
          <span><strong>Age</strong>{profile.age || "Not set"}</span>
          <span><strong>Occupation</strong>{profile.occupation || "Not set"}</span>
          <span><strong>Income</strong>Rs {profile.annual_income || 0}</span>
          <span><strong>Category</strong>{profile.caste || "Not set"}</span>
        </div>
      </Card>

      <Card title="Filters" subtitle="Narrow results without recalculating recommendations.">
        <div className="filter-grid">
          <Input label="Search by scheme name" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search schemes" icon={Search} />
          <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="likely_eligible">Likely eligible</option>
            <option value="partially_eligible">Partially eligible</option>
            <option value="not_eligible">Not eligible</option>
          </Select>
          <Select label="Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </Select>
          <Select label="Sort by" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="score_desc">Highest score first</option>
            <option value="score_asc">Lowest score first</option>
            <option value="name">Scheme name</option>
          </Select>
        </div>
      </Card>

      {filteredRecommendations.length === 0 ? (
        <EmptyState
          title="No schemes found for this profile"
          message="Try changing profile details or clearing the filters."
          action={<Badge variant="warning">No matching results</Badge>}
        />
      ) : (
        <div className="recommendations-list">
          {filteredRecommendations.map((scheme) => (
            <SchemeCard key={scheme.scheme_id} scheme={scheme} />
          ))}
        </div>
      )}
    </section>
  );
}

export default RecommendedSchemes;
