import { formatDateTime, formatPercentage, getStatusFromScore } from "../../utils/analyticsFormatters.js";

function getStatusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function RecentApplicationsTable({ applications = [] }) {
  if (!applications.length) {
    return (
      <section className="chart-card recent-applications-card">
        <div className="chart-card-header">
          <div>
            <h2>Recent Applications</h2>
            <p>Latest 5 submitted citizen profiles</p>
          </div>
        </div>
        <div className="empty-chart">
          <strong>No analytics data yet</strong>
          <span>Submit citizen profiles to generate insights.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="chart-card recent-applications-card">
      <div className="chart-card-header">
        <div>
          <h2>Recent Applications</h2>
          <p>Latest 5 submitted citizen profiles</p>
        </div>
      </div>
      <div className="recent-table-wrapper">
        <table className="recent-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>State</th>
              <th>Occupation</th>
              <th>Top Scheme</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.slice(0, 5).map((application) => {
              const status = application.status || getStatusFromScore(application.top_score);

              return (
                <tr key={application.id || application.timestamp}>
                  <td>{formatDateTime(application.timestamp)}</td>
                  <td>{application.state}</td>
                  <td>{application.occupation}</td>
                  <td className="scheme-cell">{application.top_scheme}</td>
                  <td>{formatPercentage(application.top_score)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(status)}`}>{status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default RecentApplicationsTable;
