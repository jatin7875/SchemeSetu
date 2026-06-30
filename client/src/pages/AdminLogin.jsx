import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { loginAdmin, registerAdmin } from "../services/authService.js";

function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "reviewer" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        await registerAdmin(form);
      } else {
        await loginAdmin({ email: form.email, password: form.password });
      }
      navigate("/admin/schemes");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to authenticate admin user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        breadcrumb="Home / Admin"
        eyebrow="Admin Access"
        title="Admin verification portal"
        subtitle="Sign in to manage scheme records, imports, reviews, and analytics."
      />
      <Card title={mode === "login" ? "Admin login" : "Create admin account"}>
        <form className="admin-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
          )}
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
          {error && <p className="error-message">{error}</p>}
          <div className="button-row">
            <Button type="submit" disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}</Button>
            <Button type="button" variant="secondary" onClick={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "First admin? Register" : "Back to login"}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}

export default AdminLogin;
