import { Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import Home from "./pages/Home.jsx";
import CitizenProfileForm from "./pages/CitizenProfileForm.jsx";
import RecommendedSchemes from "./pages/RecommendedSchemes.jsx";
import SchemeDetails from "./pages/SchemeDetails.jsx";
import AdminAddScheme from "./pages/AdminAddScheme.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DocumentVerification from "./pages/DocumentVerification.jsx";
import AnalyticsDashboard from "./pages/AnalyticsDashboard.jsx";

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<CitizenProfileForm />} />
        <Route path="/recommended" element={<RecommendedSchemes />} />
        <Route path="/scheme/:id" element={<SchemeDetails />} />
        <Route path="/admin/add-scheme" element={<AdminAddScheme />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/verify-document" element={<DocumentVerification />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
