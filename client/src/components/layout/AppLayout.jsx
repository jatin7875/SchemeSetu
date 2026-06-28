import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <div className="gov-strip">
        <span>SchemeSetu | Scheme Eligibility & Citizen Assistance Platform</span>
        <span>Guided workflow for scheme discovery and document preparation</span>
      </div>
      <Navbar />
      <main className="app-main">{children}</main>
      <Footer />
    </div>
  );
}

export default AppLayout;
