import { useState } from "react";
import { Wand2 } from "lucide-react";
import api from "../api.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Select from "../components/ui/Select.jsx";
import Textarea from "../components/ui/Textarea.jsx";

const initialForm = {
  scheme_name: "",
  category: "",
  scheme_level: "",
  state: "",
  ministry_or_department: "",
  benefits: "",
  eligibility: "",
  required_documents: "",
  application_url: "",
  source_urls: "",
  tags: ""
};

function AdminAddScheme() {
  const [formData, setFormData] = useState(initialForm);
  const [extractedRulesText, setExtractedRulesText] = useState("[]");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [jsonError, setJsonError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleReset() {
    setFormData(initialForm);
    setExtractedRulesText("[]");
    setMessage("");
    setError("");
    setJsonError("");
  }

  function parseRulesJson() {
    try {
      const parsed = JSON.parse(extractedRulesText || "[]");
      setJsonError("");
      return Array.isArray(parsed) ? parsed : [];
    } catch (parseError) {
      setJsonError("Extracted rules JSON is invalid.");
      return null;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const eligibilityRulesExtracted = parseRulesJson();
    if (!eligibilityRulesExtracted) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/admin/schemes", {
        ...formData,
        eligibility_rules_extracted: eligibilityRulesExtracted
      });
      setMessage(response.data.message || "Scheme added temporarily.");
      setFormData(initialForm);
      setExtractedRulesText("[]");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add scheme.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExtractRules() {
    setMessage("");
    setError("");

    if (!formData.eligibility.trim()) {
      setError("Please enter eligibility text before extracting rules.");
      return;
    }

    setExtracting(true);
    try {
      const response = await api.post("/extract-rules", { text: formData.eligibility });
      setExtractedRulesText(JSON.stringify(response.data.rules || [], null, 2));
      setJsonError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to extract rules.");
    } finally {
      setExtracting(false);
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        breadcrumb="Home / Admin / Add Scheme"
        eyebrow="Scheme Administration"
        title="Add scheme record"
        subtitle="Enter scheme details, review official source links, and extract eligibility rules from plain text."
      />

      <form className="admin-form" onSubmit={handleSubmit}>
        <Card title="A. Scheme Identity" subtitle="Add the official name and classification details.">
          <div className="form-section-grid">
            <Input label="Scheme name" name="scheme_name" value={formData.scheme_name} onChange={handleChange} required />
            <Input label="Category" name="category" value={formData.category} onChange={handleChange} placeholder="Education, Scholarship" required />
            <Select label="Scheme level" name="scheme_level" value={formData.scheme_level} onChange={handleChange}>
              <option value="">Select level</option>
              <option value="central">Central</option>
              <option value="state">State</option>
              <option value="centrally_sponsored">Centrally sponsored</option>
            </Select>
            <Input label="State" name="state" value={formData.state} onChange={handleChange} placeholder="Maharashtra" />
            <Input label="Ministry / Department" name="ministry_or_department" value={formData.ministry_or_department} onChange={handleChange} />
          </div>
        </Card>

        <Card title="B. Eligibility Information" subtitle="Paste the official eligibility text exactly as available from the source.">
          <div className="form-section-grid single">
            <Textarea label="Eligibility text" name="eligibility" value={formData.eligibility} onChange={handleChange} required />
          </div>
        </Card>

        <Card title="C. Benefits and Documents" subtitle="Record citizen benefits and required supporting documents.">
          <div className="form-section-grid single">
            <Textarea label="Benefits" name="benefits" value={formData.benefits} onChange={handleChange} required />
            <Textarea label="Required documents" name="required_documents" value={formData.required_documents} onChange={handleChange} />
          </div>
        </Card>

        <Card title="D. Source and Verification" subtitle="Add official links and searchable tags for review.">
          <div className="form-section-grid single">
            <Input label="Application URL" name="application_url" type="url" value={formData.application_url} onChange={handleChange} />
            <Input label="Source URLs" name="source_urls" value={formData.source_urls} onChange={handleChange} placeholder="Comma separated URLs" />
            <Input label="Tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="farmer, scholarship, women" />
          </div>
        </Card>

        <Card
          title="E. Extracted Rules"
          subtitle="Extract rules from eligibility text, then review or edit JSON before saving."
          actions={<Button type="button" variant="secondary" onClick={handleExtractRules} disabled={extracting} icon={Wand2}>{extracting ? "Extracting..." : "Extract Rules"}</Button>}
        >
          <Textarea
            label="Extracted rules JSON"
            className="json-field"
            value={extractedRulesText}
            onChange={(event) => setExtractedRulesText(event.target.value)}
            error={jsonError}
            rows={10}
          />
          <pre className="json-preview-box">{extractedRulesText}</pre>
        </Card>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        <div className="sticky-form-actions">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Add Scheme"}
          </Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </form>
    </section>
  );
}

export default AdminAddScheme;
