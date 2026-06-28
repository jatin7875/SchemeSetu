import { useCallback, useEffect, useState } from "react";
import StatCard from "../components/dashboard/StatCard.jsx";
import EmptyState from "../components/dashboard/EmptyState.jsx";
import RecentApplicationsTable from "../components/dashboard/RecentApplicationsTable.jsx";
import MostRecommendedChart from "../components/charts/MostRecommendedChart.jsx";
import RejectionReasonChart from "../components/charts/RejectionReasonChart.jsx";
import StateWiseChart from "../components/charts/StateWiseChart.jsx";
import IncomeGroupChart from "../components/charts/IncomeGroupChart.jsx";
import MatchDistributionChart from "../components/charts/MatchDistributionChart.jsx";
import CategoryWiseChart from "../components/charts/CategoryWiseChart.jsx";
import { getAnalyticsDashboard, resetAnalytics } from "../services/analyticsService.js";
import { formatCount, formatDateTime } from "../utils/analyticsFormatters.js";

function LoadingSkeleton() {
  return (
    <>
      <div className="skeleton-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="skeleton-card" key={index} />
        ))}
      </div>
      <div className="skeleton-chart-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="skeleton-chart-card" key={index} />
        ))}
      </div>
    </>
  );
}

function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getAnalyticsDashboard();
      setAnalytics(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load analytics dashboard.");
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadAnalytics();

    const intervalId = window.setInterval(() => {
      loadAnalytics({ silent: true });
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [loadAnalytics]);

  async function handleReset() {
    const confirmed = window.confirm("Reset all local analytics data?");
    if (!confirmed) {
      return;
    }

    try {
      await resetAnalytics();
      localStorage.removeItem("analytics_updated_at");
      await loadAnalytics();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset analytics data.");
    }
  }

  if (loading) {
    return (
      <section className="analytics-dashboard">
        <div className="section-heading analytics-hero">
          <div>
            <p className="page-breadcrumb">Home / Analytics</p>
            <p className="eyebrow">Analytics</p>
            <h1>Analytics Dashboard</h1>
            <p className="section-copy">Loading live recommendation activity.</p>
          </div>
        </div>
        <LoadingSkeleton />
      </section>
    );
  }

  if (error) {
    return (
      <section className="analytics-dashboard">
        <div className="dashboard-error">
          <h1>Unable to load analytics</h1>
          <p>{error}</p>
          <button className="button" type="button" onClick={() => loadAnalytics()}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  const summary = analytics?.summary || {};
  const hasApplications = Number(summary.total_applications || 0) > 0;

  return (
    <section className="analytics-dashboard">
      <div className="section-heading analytics-hero">
        <div>
          <p className="page-breadcrumb">Home / Analytics</p>
          <p className="eyebrow">Analytics</p>
          <h1>Analytics Dashboard</h1>
          <p className="section-copy">Real-time insights from citizen scheme recommendations.</p>
          <p className="last-updated">Last updated: {analytics?.last_updated ? formatDateTime(analytics.last_updated) : "Not updated yet"}</p>
        </div>

        <div className="analytics-actions">
          <button className="button secondary" type="button" onClick={() => loadAnalytics({ silent: true })} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button className="button danger" type="button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {!hasApplications && (
        <EmptyState
          title="No analytics data yet"
          message="Submit a citizen profile from the profile form to generate recommendations and populate this dashboard."
        />
      )}

      <div className="stats-grid">
        <StatCard label="Total applications" value={formatCount(summary.total_applications)} helper="Citizen profiles submitted" accent="teal" icon="A" />
        <StatCard label="Total recommendations" value={formatCount(summary.total_recommendations)} helper="Schemes returned by engine" accent="slate" icon="R" />
        <StatCard label="Average final score" value={`${summary.average_final_score || 0}%`} helper="Rule and ML blended score" accent="saffron" icon="S" />
        <StatCard label="Likely eligible" value={formatCount(summary.likely_eligible_count)} helper="High scoring recommendations" accent="green" icon="L" />
        <StatCard label="Partially eligible" value={formatCount(summary.partially_eligible_count)} helper="Needs closer verification" accent="amber" icon="P" />
        <StatCard label="Not eligible" value={formatCount(summary.not_eligible_count)} helper="Low scoring recommendations" accent="red" icon="N" />
      </div>

      <div className="analytics-grid">
        <MostRecommendedChart data={analytics?.most_recommended_schemes || []} />
        <CategoryWiseChart data={analytics?.category_wise_recommendations || []} />
        <RejectionReasonChart data={analytics?.common_rejection_reasons || []} />
        <StateWiseChart data={analytics?.state_wise_applications || []} />
        <IncomeGroupChart data={analytics?.income_group_analysis || []} />
        <MatchDistributionChart data={analytics?.scheme_match_distribution || []} />
      </div>

      <RecentApplicationsTable applications={analytics?.recent_applications || []} />
    </section>
  );
}

export default AnalyticsDashboard;
