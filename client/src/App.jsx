import { Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import Home from "./pages/Home.jsx";
import CitizenProfileForm from "./pages/CitizenProfileForm.jsx";
import RecommendedSchemes from "./pages/RecommendedSchemes.jsx";
import SchemeDetails from "./pages/SchemeDetails.jsx";
import AdminAddScheme from "./pages/AdminAddScheme.jsx";
import AdminImport from "./pages/AdminImport.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminSchemeEdit from "./pages/AdminSchemeEdit.jsx";
import AdminSchemes from "./pages/AdminSchemes.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DocumentVerification from "./pages/DocumentVerification.jsx";
import AnalyticsDashboard from "./pages/AnalyticsDashboard.jsx";
import { isAdminAuthenticated } from "./services/authService.js";

function ProtectedAdminRoute({ children }) {
  return isAdminAuthenticated() ? children : <Navigate to="/admin/login" replace />;
}

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<CitizenProfileForm />} />
        <Route path="/recommended" element={<RecommendedSchemes />} />
        <Route path="/scheme/:id" element={<SchemeDetails />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/schemes" element={<ProtectedAdminRoute><AdminSchemes /></ProtectedAdminRoute>} />
        <Route path="/admin/schemes/new" element={<ProtectedAdminRoute><AdminAddScheme /></ProtectedAdminRoute>} />
        <Route path="/admin/schemes/:id/edit" element={<ProtectedAdminRoute><AdminSchemeEdit /></ProtectedAdminRoute>} />
        <Route path="/admin/add-scheme" element={<ProtectedAdminRoute><AdminAddScheme /></ProtectedAdminRoute>} />
        <Route path="/admin/import" element={<ProtectedAdminRoute><AdminImport /></ProtectedAdminRoute>} />
        <Route path="/admin/review" element={<ProtectedAdminRoute><AdminSchemes /></ProtectedAdminRoute>} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/verify-document" element={<DocumentVerification />} />
        <Route path="/analytics" element={<ProtectedAdminRoute><AnalyticsDashboard /></ProtectedAdminRoute>} />
      </Routes>
    </AppLayout>
  );
}

export default App;
