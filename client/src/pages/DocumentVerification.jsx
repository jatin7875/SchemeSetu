import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import { verifyDocument } from "../services/ocrService.js";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";

function statusLabel(status) {
  return String(status || "rejected").replaceAll("_", " ");
}

function formatBytes(bytes = 0) {
  if (!bytes) return "0 KB";
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function getSavedProfile() {
  const saved = localStorage.getItem("citizenProfile");
  return saved ? JSON.parse(saved) : null;
}

function FieldList({ title, items, variant }) {
  return (
    <Card title={title}>
      {items?.length ? (
        <ul className={`condition-list ${variant || ""}`}>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="muted-text">None</p>
      )}
    </Card>
  );
}

function DocumentVerification() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(() => {
    const saved = localStorage.getItem("latestDocumentVerification");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const citizenProfile = getSavedProfile();

  const previewUrl = useMemo(() => {
    if (!file || !file.type.startsWith("image/")) {
      return "";
    }
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Please choose a certificate image first.");
      return;
    }

    if (!citizenProfile) {
      setError("Please fill the citizen profile before verifying a document.");
      return;
    }

    setLoading(true);
    try {
      const verificationResult = await verifyDocument(file, citizenProfile);
      setResult(verificationResult);
      localStorage.setItem("latestDocumentVerification", JSON.stringify(verificationResult));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to verify the document.");
    } finally {
      setLoading(false);
    }
  }

  const extractedData = result?.extracted_data || {};
  const verification = result?.verification;

  return (
    <section className="page-stack">
      <PageHeader
        breadcrumb="Home / Verify Document"
        eyebrow="Document Verification"
        title="Verify certificate details"
        subtitle="Upload income, caste, disability, or land documents and compare extracted details with your saved citizen profile."
      />

      <Card className="notice-card">
        <p>Uploaded files are processed temporarily for OCR and are not stored permanently.</p>
      </Card>

      {!citizenProfile && (
        <EmptyState
          title="Citizen profile required"
          message="Create or save a citizen profile before running document verification."
          action={<Button as={Link} size="sm" to="/profile">Go to Profile</Button>}
        />
      )}

      <div className="verification-layout">
        <Card title="Upload document" subtitle="Accepted formats: JPG, JPEG, PNG.">
          <form className="upload-form" onSubmit={handleSubmit}>
            <label className="upload-dropzone">
              <UploadCloud size={32} />
              <strong>{file ? file.name : "Choose or drop certificate image"}</strong>
              <span>{file ? formatBytes(file.size) : "Use a clear, straight image for better OCR."}</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>

            {previewUrl && <img className="document-preview" src={previewUrl} alt="Selected document preview" />}
            {error && <p className="error-message">{error}</p>}

            <div className="form-actions">
              <Button type="submit" disabled={loading || !citizenProfile}>
                {loading ? "Verifying..." : "Verify Document"}
              </Button>
              <Button as={Link} variant="secondary" size="sm" to="/profile">
                Edit Profile
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Citizen profile preview" subtitle="Document data is compared with this saved profile.">
          {citizenProfile ? (
            <div className="profile-summary-grid compact">
              <span><strong>Name</strong>{citizenProfile.name || "Not set"}</span>
              <span><strong>State</strong>{citizenProfile.state || "Not set"}</span>
              <span><strong>District</strong>{citizenProfile.district || "Not set"}</span>
              <span><strong>Income</strong>Rs {citizenProfile.annual_income || 0}</span>
              <span><strong>Caste</strong>{citizenProfile.caste || "Not set"}</span>
              <span><strong>Disability</strong>{citizenProfile.disability_status || "Not set"}</span>
            </div>
          ) : (
            <p className="muted-text">No saved citizen profile found.</p>
          )}
        </Card>
      </div>

      <Card title="Tips for better OCR" subtitle="Small improvements can significantly improve extraction accuracy.">
        <ul className="tips-grid">
          <li>Upload a clear image.</li>
          <li>Avoid blur and shadows.</li>
          <li>Keep the document straight.</li>
          <li>Use good lighting.</li>
          <li>Crop unnecessary background.</li>
        </ul>
      </Card>

      {verification && (
        <section className="page-stack">
          <Card title="Verification Result">
            <div className="verification-result-grid">
              <span><strong>Status</strong><Badge variant={verification.overall_status}>{statusLabel(verification.overall_status)}</Badge></span>
              <span><strong>Confidence score</strong>{verification.confidence_score}%</span>
              <span><strong>Document</strong>{result.document_name}</span>
            </div>
          </Card>

          <Card title="Extracted Data" subtitle="Empty values are shown as Not found.">
            <div className="data-table modern-data-table">
              {["name", "income", "caste", "disability_pct", "land_area"].map((key) => (
                <div key={key}>
                  <span>{key.replaceAll("_", " ")}</span>
                  <strong>{extractedData[key] === null || extractedData[key] === "" || extractedData[key] === undefined ? "Not found" : String(extractedData[key])}</strong>
                </div>
              ))}
            </div>
          </Card>

          <div className="detail-grid modern-detail-grid">
            <FieldList title="Matched Fields" items={verification.matched_fields} variant="matched" />
            <FieldList title="Mismatched Fields" items={verification.mismatched_fields} variant="failed" />
            <FieldList title="Missing Fields" items={verification.missing_fields} />
          </div>

          <details className="ui-card">
            <summary>Raw OCR Text</summary>
            <pre className="raw-text">{result.raw_text}</pre>
          </details>
        </section>
      )}
    </section>
  );
}

export default DocumentVerification;
