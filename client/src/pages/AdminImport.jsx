import { useEffect, useState } from "react";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { getImportJobs, importSchemesCsv, importSchemesJson } from "../services/adminService.js";

function AdminImport() {
  const [file, setFile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadJobs() {
    const response = await getImportJobs();
    setJobs(response.jobs || []);
  }

  async function handleImport(type) {
    if (!file) {
      setError("Select a JSON or CSV file first.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = type === "json" ? await importSchemesJson(file) : await importSchemesCsv(file);
      setMessage(`Import job ${response.job.status}: ${response.job.inserted_count} inserted, ${response.job.updated_count} updated.`);
      await loadJobs();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to import schemes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs().catch(() => {});
  }, []);

  return (
    <section className="page-stack">
      <PageHeader
        breadcrumb="Home / Admin / Import"
        eyebrow="Data Import"
        title="Import scheme records"
        subtitle="Upload JSON or CSV files. Imported records are saved for admin review before public recommendations."
      />
      <Card title="Upload file">
        <input type="file" accept=".json,.csv,application/json,text/csv" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        <div className="button-row">
          <Button type="button" disabled={loading} onClick={() => handleImport("json")}>Import JSON</Button>
          <Button type="button" variant="secondary" disabled={loading} onClick={() => handleImport("csv")}>Import CSV</Button>
        </div>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </Card>
      <Card title="Recent import jobs">
        {jobs.length ? (
          <div className="recent-recommendation-list">
            {jobs.map((job) => (
              <span key={job._id}>
                <strong>{job.file_name}</strong>
                {job.status} - {job.inserted_count} inserted, {job.updated_count} updated, {job.failed_count} failed
              </span>
            ))}
          </div>
        ) : (
          <p className="muted-text">No import jobs yet.</p>
        )}
      </Card>
    </section>
  );
}

export default AdminImport;
