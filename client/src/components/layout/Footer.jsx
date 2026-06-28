import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <section>
          <h2>SchemeSetu</h2>
          <p>
            SchemeSetu helps citizens discover relevant welfare schemes, check eligibility
            conditions, and prepare required documents through a guided digital workflow.
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
          <h2>Scheme Categories</h2>
          <ul className="footer-list">
            <li>Education and scholarships</li>
            <li>Health and insurance</li>
            <li>Agriculture and livelihood</li>
            <li>Housing and social welfare</li>
          </ul>
        </section>

        <section>
          <h2>Contact / Support</h2>
          <p>Use the source link on each scheme page before final submission.</p>
          <p>Support channel: SchemeSetu assistance desk</p>
        </section>

        <section>
          <h2>Information Note</h2>
          <p>
            Scheme information is presented for citizen assistance. Users should refer to the
            respective scheme source link before final submission.
          </p>
        </section>
      </div>

      <div className="footer-note">
        <p>Scheme information is presented for citizen assistance. Review source information before final submission.</p>
        <span>© 2026 SchemeSetu. All rights reserved.</span>
      </div>
    </footer>
  );
}

export default Footer;
