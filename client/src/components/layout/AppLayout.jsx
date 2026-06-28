import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <div className="gov-strip">
        <span>SchemeSetu | Government Scheme Eligibility & Decision Support</span>
        <span>Student Project Demo - Verify details on official portals</span>
      </div>
      <Navbar />
      <main className="app-main">{children}</main>
      <Footer />
    </div>
  );
}

export default AppLayout;
