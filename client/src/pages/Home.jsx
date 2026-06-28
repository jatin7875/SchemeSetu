import { Link } from "react-router-dom";
import { BarChart3, CheckCircle2, ClipboardList, Database, FileCheck2, SearchCheck, Settings, UserRound } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";

const steps = [
  { icon: UserRound, title: "Create Profile", text: "Enter basic citizen details such as age, state, income and occupation." },
  { icon: SearchCheck, title: "Check Eligibility", text: "SchemeSetu compares the profile with stored eligibility rules." },
  { icon: ClipboardList, title: "Review Schemes", text: "See ranked schemes, match scores and reasons for each result." },
  { icon: FileCheck2, title: "Verify Documents", text: "Upload certificates to compare OCR details with the saved profile." }
];

const features = [
  { icon: CheckCircle2, title: "Eligibility Conditions", text: "Checks scheme conditions against profile attributes." },
  { icon: BarChart3, title: "Profile Match Ranking", text: "Ranks matching schemes using the saved profile and scheme features." },
  { icon: FileCheck2, title: "Document Check", text: "Reads uploaded document details and highlights matching or missing fields." },
  { icon: BarChart3, title: "Scheme Insights", text: "Shows recommendation trends, categories and recent submissions." },
  { icon: Settings, title: "Admin Scheme Management", text: "Lets admins add temporary schemes and extract eligibility rules." },
  { icon: Database, title: "Source Information", text: "Designed around scheme pages, PDFs and public datasets." }
];

const sources = ["myScheme.gov.in", "india.gov.in", "data.gov.in", "Ministry PDFs", "State e-District Portals"];

function Home() {
  return (
    <section className="home-page">
      <div className="portal-hero">
        <div className="portal-hero-copy">
          <span className="portal-badge">Citizen welfare scheme assistant</span>
          <h1>Find government schemes based on your profile</h1>
          <p>
            SchemeSetu helps citizens check eligibility conditions, view ranked scheme
            recommendations, and verify documents using official scheme information.
          </p>
          <div className="portal-actions">
            <Button as={Link} size="lg" to="/profile">Check Eligibility</Button>
            <Button as={Link} size="lg" to="/dashboard" variant="secondary">View Dashboard</Button>
          </div>
        </div>

        <div className="eligibility-visual" aria-label="Sample eligibility result preview">
          <div className="visual-card main-result-card">
            <div>
              <span>Profile</span>
              <strong>OBC, Maharashtra, undergraduate</strong>
            </div>
            <div className="visual-score-row">
              <span>Eligibility Match <b>86%</b></span>
              <ProgressBar value={86} />
            </div>
            <div className="visual-score-row">
              <span>Profile Relevance <b>79%</b></span>
              <ProgressBar value={79} tone="secondary" />
            </div>
            <div className="final-match-box">
              <span>Final Match</span>
              <strong>83% - Likely Eligible</strong>
            </div>
          </div>

          <div className="floating-portal-card card-one">20+ starter schemes</div>
          <div className="floating-portal-card card-two">Scheme source links</div>
          <div className="floating-portal-card card-three">OCR verification</div>
          <div className="floating-portal-card card-four">Analytics dashboard</div>
        </div>
      </div>

      <section className="content-section">
        <SectionHeader
          title="How SchemeSetu Works"
          subtitle="A simple flow for citizens and CSC operators to check scheme matches."
        />
        <div className="process-grid">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <Card className="process-card" key={title}>
              <span className="step-number">{index + 1}</span>
              <Icon size={22} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="content-section">
        <SectionHeader
          title="Platform Features"
          subtitle="Compact tools for eligibility checks, document verification and scheme administration."
        />
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <Card className="feature-card" key={title}>
              <Icon size={21} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="source-trust-section">
        <div>
          <SectionHeader
            eyebrow="Source-information focused"
            title="Built on scheme source information"
            subtitle="SchemeSetu is designed to work with government scheme pages, ministry PDFs and state portal records."
          />
          <p>
            Users should refer to the respective scheme source link before final submission.
          </p>
        </div>
        <div className="source-chip-grid">
          {sources.map((source) => <span key={source}>{source}</span>)}
        </div>
      </section>
    </section>
  );
}

export default Home;
