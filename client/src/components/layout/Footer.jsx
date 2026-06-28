import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <section>
          <h2>SchemeSetu</h2>
          <p>
            SchemeSetu is a decision-support platform for discovering government schemes based on
            citizen profile information.
          </p>
        </section>

        <section>
          <h2>Quick Links</h2>
          <nav className="footer-links" aria-label="Footer quick links">
            <Link to="/profile">Profile</Link>
            <Link to="/recommended">Recommendations</Link>
            <Link to="/verify-document">Verify Document</Link>
            <Link to="/analytics">Analytics</Link>
          </nav>
        </section>

        <section>
          <h2>Data Sources</h2>
          <ul className="footer-list">
            <li>myScheme.gov.in</li>
            <li>india.gov.in</li>
            <li>data.gov.in</li>
            <li>Ministry PDFs</li>
            <li>State e-District portals</li>
          </ul>
        </section>

        <section>
          <h2>Disclaimer</h2>
          <p>
            SchemeSetu is a student project/demo. It does not replace official government
            eligibility verification. Always confirm scheme details on official government portals
            before applying.
          </p>
        </section>
      </div>

      <div className="footer-disclaimer">
        <p>Built with MERN + FastAPI ML | SchemeSetu Project</p>
        <span>2026 SchemeSetu</span>
      </div>
    </footer>
  );
}

export default Footer;
