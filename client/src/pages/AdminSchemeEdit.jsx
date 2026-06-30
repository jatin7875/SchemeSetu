import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Wand2 } from "lucide-react";
import api from "../api.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Input from "../components/ui/Input.jsx";
import LoadingState from "../components/ui/LoadingState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Select from "../components/ui/Select.jsx";
import Textarea from "../components/ui/Textarea.jsx";
import { getAdminScheme, updateAdminScheme, verifyAdminScheme } from "../services/adminService.js";

const emptyForm = {
  scheme_name: "",
  category: "",
  scheme_level: "unknown",
  state: "",
  ministry_or_department: "",
  benefits: "",
  eligibility: "",
  required_documents: "",
  application_url: "",
  source_urls: "",
  tags: "",
  status: "unknown",
  verification_status: "needs_review"
};

function toForm(scheme) {
  return {
    ...emptyForm,
    ...scheme,
    category: Array.isArray(scheme.category) ? scheme.category.join(", ") : scheme.category || "",
    source_urls: Array.isArray(scheme.source_urls) ? scheme.source_urls.join(", ") : scheme.source_urls || "",
    tags: Array.isArray(scheme.tags) ? scheme.tags.join(", ") : scheme.tags || ""
  };
}

function AdminSchemeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [rulesText, setRulesText] = useState("{}");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function loadScheme() {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminScheme(id);
      const scheme = response.scheme;
      setForm(toForm(scheme));
      setRulesText(JSON.stringify(scheme.eligibility_rules || {}, null, 2));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load scheme for editing.");
    } finally {
      setLoading(false);
    }
  }

  async function saveScheme(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const eligibilityRules = JSON.parse(rulesText || "{}");
      await updateAdminScheme(id, { ...form, eligibility_rules: eligibilityRules });
      setMessage("Scheme updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update scheme. Check JSON rules before saving.");
    } finally {
      setSaving(false);
    }
  }

  async function extractRules() {
    setExtracting(true);
    setError("");
    try {
      const response = await api.post("/extract-rules", { text: form.eligibility });
      setRulesText(JSON.stringify(response.data.rules || [], null, 2));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to extract rules.");
    } finally {
      setExtracting(false);
    }
  }

  async function changeVerification(verification_status, status = form.status) {
    setSaving(true);
    setError("");
    try {
      await verifyAdminScheme(id, { verification_status, status });
      navigate("/admin/schemes");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update verification status.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadScheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <LoadingState title="Loading scheme" message="Preparing review form." cards={4} />;
  if (error && !form.scheme_name) return <ErrorState title="Unable to load scheme" message={error} onRetry={loadScheme} />;

  return (
    <section className="page-stack">
      <PageHeader
        breadcrumb="Home / Admin / Edit Scheme"
        eyebrow="Scheme Review"
        title="Edit scheme record"
        subtitle="Review source details, eligibility text, and structured rules before verification."
        actions={<Button as={Link} to="/admin/schemes" variant="secondary">Back</Button>}
      />
      <form className="admin-form" onSubmit={saveScheme}>
        <Card title="Scheme details">
          <div className="form-section-grid">
            <Input label="Scheme name" name="scheme_name" value={form.scheme_name} onChange={handleChange} required />
            <Input label="Category" name="category" value={form.category} onChange={handleChange} />
            <Select label="Scheme level" name="scheme_level" value={form.scheme_level} onChange={handleChange}>
              <option value="central">Central</option>
              <option value="state">State</option>
              <option value="centrally_sponsored">Centrally sponsored</option>
              <option value="unknown">Unknown</option>
            </Select>
            <Input label="State" name="state" value={form.state || ""} onChange={handleChange} />
            <Input label="Ministry / Department" name="ministry_or_department" value={form.ministry_or_department || ""} onChange={handleChange} />
            <Select label="Status" name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="merged">Merged</option>
              <option value="unknown">Unknown</option>
            </Select>
          </div>
        </Card>
        <Card title="Public content">
          <Textarea label="Benefits" name="benefits" value={form.benefits || ""} onChange={handleChange} />
          <Textarea label="Eligibility" name="eligibility" value={form.eligibility || ""} onChange={handleChange} />
          <Textarea label="Required documents" name="required_documents" value={form.required_documents || ""} onChange={handleChange} />
          <Input label="Application URL" name="application_url" value={form.application_url || ""} onChange={handleChange} />
          <Input label="Source URLs" name="source_urls" value={form.source_urls || ""} onChange={handleChange} />
        </Card>
        <Card title="Eligibility rules" actions={<Button type="button" variant="secondary" size="sm" onClick={extractRules} disabled={extracting} icon={Wand2}>{extracting ? "Extracting..." : "Extract Rules"}</Button>}>
          <Textarea label="Rules JSON" value={rulesText} onChange={(event) => setRulesText(event.target.value)} rows={12} />
        </Card>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
        <div className="sticky-form-actions">
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
          <Button type="button" variant="secondary" disabled={saving} onClick={() => changeVerification("verified", "active")}>Mark verified</Button>
          <Button type="button" variant="secondary" disabled={saving} onClick={() => changeVerification("outdated", "active")}>Mark outdated</Button>
          <Button type="button" variant="danger" disabled={saving} onClick={() => changeVerification("rejected", "closed")}>Reject</Button>
        </div>
      </form>
    </section>
  );
}

export default AdminSchemeEdit;
