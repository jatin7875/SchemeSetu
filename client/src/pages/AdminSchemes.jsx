import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import LoadingState from "../components/ui/LoadingState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Select from "../components/ui/Select.jsx";
import { getAdminSchemes, verifyAdminScheme } from "../services/adminService.js";

function AdminSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState("needs_review");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSchemes() {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminSchemes({ verification_status: verificationStatus, limit: 50 });
      setSchemes(response.schemes || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load admin schemes.");
    } finally {
      setLoading(false);
    }
  }

  async function updateVerification(id, verification_status, status = "active") {
    await verifyAdminScheme(id, { verification_status, status });
    await loadSchemes();
  }

  useEffect(() => {
    loadSchemes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationStatus]);

  if (loading) return <LoadingState title="Loading scheme records" message="Preparing admin verification list." cards={4} />;
  if (error) return <ErrorState title="Unable to load admin schemes" message={error} onRetry={loadSchemes} />;

  return (
    <section className="page-stack">
      <PageHeader
        breadcrumb="Home / Admin / Schemes"
        eyebrow="Admin Verification"
        title="Scheme management"
        subtitle="Review imported and manually entered scheme records before public use."
        actions={<Button as={Link} to="/admin/import" variant="secondary">Import</Button>}
      />
      <Card title="Review filters">
        <Select label="Verification status" value={verificationStatus} onChange={(event) => setVerificationStatus(event.target.value)}>
          <option value="needs_review">Needs review</option>
          <option value="draft">Draft</option>
          <option value="verified">Verified</option>
          <option value="outdated">Outdated</option>
          <option value="rejected">Rejected</option>
        </Select>
      </Card>
      <div className="recommendations-list">
        {schemes.map((scheme) => (
          <Card key={scheme.scheme_id} title={scheme.scheme_name} subtitle={scheme.ministry_or_department || "Department not specified"}>
            <div className="badge-row">
              <Badge variant="category">{scheme.scheme_level || "unknown"}</Badge>
              <Badge variant="warning">{scheme.verification_status || "draft"}</Badge>
            </div>
            <p className="detail-copy">{scheme.eligibility || "Eligibility text not available."}</p>
            <div className="button-row">
              <Button size="sm" as={Link} variant="secondary" to={`/admin/schemes/${scheme.id || scheme._id || scheme.scheme_id}/edit`}>Edit</Button>
              <Button size="sm" type="button" onClick={() => updateVerification(scheme.id || scheme._id || scheme.scheme_id, "verified", "active")}>Mark verified</Button>
              <Button size="sm" type="button" variant="secondary" onClick={() => updateVerification(scheme.id || scheme._id || scheme.scheme_id, "outdated", "active")}>Outdated</Button>
              <Button size="sm" type="button" variant="danger" onClick={() => updateVerification(scheme.id || scheme._id || scheme.scheme_id, "rejected", "closed")}>Reject</Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default AdminSchemes;
