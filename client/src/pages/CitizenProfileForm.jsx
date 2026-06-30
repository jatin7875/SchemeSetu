import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, SearchCheck, Trash2 } from "lucide-react";
import { getRecommendations } from "../services/recommendationService.js";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Select from "../components/ui/Select.jsx";

const initialProfile = {
  name: "",
  age: "",
  gender: "",
  state: "",
  district: "",
  caste: "",
  annual_income: "",
  occupation: "",
  disability_status: "",
  farmer_status: "",
  bpl_status: "",
  ration_card_type: "",
  education_level: "",
  land_area: ""
};

function getSavedProfile() {
  const saved = localStorage.getItem("citizenProfile");
  if (!saved) {
    return initialProfile;
  }

  const parsed = JSON.parse(saved);
  return {
    ...initialProfile,
    ...parsed,
    annual_income: parsed.annual_income ?? parsed.annualIncome ?? "",
    disability_status: parsed.disability_status ?? parsed.disabilityStatus ?? "",
    farmer_status: parsed.farmer_status ?? parsed.farmerStatus ?? "",
    bpl_status: parsed.bpl_status ?? parsed.bplStatus ?? "",
    ration_card_type: parsed.ration_card_type ?? parsed.rationCardType ?? "",
    education_level: parsed.education_level ?? parsed.educationLevel ?? ""
  };
}

function validateProfile(profile) {
  const errors = {};

  if (!profile.age || Number.isNaN(Number(profile.age))) {
    errors.age = "Age must be a number.";
  }

  if (!profile.annual_income || Number.isNaN(Number(profile.annual_income))) {
    errors.annual_income = "Annual income must be a number.";
  }

  ["gender", "state", "district", "occupation"].forEach((field) => {
    if (!String(profile[field] || "").trim()) {
      errors[field] = "This field is required.";
    }
  });

  return errors;
}

function CitizenProfileForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(getSavedProfile);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleClear() {
    setFormData(initialProfile);
    setFieldErrors({});
    setError("");
    setMessage("Form cleared.");
    localStorage.removeItem("citizenProfile");
    localStorage.removeItem("recommendedSchemes");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const errors = validateProfile(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      localStorage.setItem("citizenProfile", JSON.stringify(formData));
      const response = await getRecommendations(formData);
      localStorage.setItem("recommendedSchemes", JSON.stringify(response.recommendations || []));
      localStorage.setItem("analytics_updated_at", Date.now().toString());
      setMessage("Profile saved. Opening recommendations...");
      window.setTimeout(() => navigate("/recommended", {
        state: {
          recommendations: response.recommendations || [],
          message: response.message || ""
        }
      }), 350);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to get recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        breadcrumb="Home / Profile"
        eyebrow="Citizen Profile"
        title="Citizen profile"
        subtitle="Enter citizen details to check eligibility conditions and view recommended schemes."
      />

      <div className="profile-stepper" aria-label="Profile form sections">
        <span className="active">1. Personal</span>
        <span>2. Economic</span>
        <span>3. Social</span>
        <span>4. Education</span>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <Card title="Personal Details" subtitle="Basic identity and location information.">
          <div className="form-section-grid">
            <Input label="Full name" name="name" value={formData.name} onChange={handleChange} placeholder="Citizen name" />
            <Input label="Age" name="age" type="number" min="0" value={formData.age} onChange={handleChange} error={fieldErrors.age} required />
            <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange} error={fieldErrors.gender} required>
              <option value="">Select gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </Select>
            <Input label="State" name="state" value={formData.state} onChange={handleChange} placeholder="Maharashtra" error={fieldErrors.state} required />
            <Input label="District" name="district" value={formData.district} onChange={handleChange} placeholder="Nagpur" error={fieldErrors.district} required />
          </div>
        </Card>

        <Card title="Social Category" subtitle="These details help match caste, BPL, ration-card and disability-linked schemes.">
          <div className="form-section-grid">
            <Select label="Caste" name="caste" value={formData.caste} onChange={handleChange}>
              <option value="">Select caste category</option>
              <option value="General">General</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="OBC">OBC</option>
              <option value="EWS">EWS</option>
            </Select>
            <Select label="BPL status" name="bpl_status" value={formData.bpl_status} onChange={handleChange}>
              <option value="">Select status</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
            <Select label="Ration card type" name="ration_card_type" value={formData.ration_card_type} onChange={handleChange}>
              <option value="">Select ration card type</option>
              <option value="none">None</option>
              <option value="yellow">Yellow</option>
              <option value="AAY">AAY</option>
              <option value="BPL">BPL</option>
              <option value="PHH">PHH</option>
              <option value="APL">APL</option>
            </Select>
            <Select label="Disability status" name="disability_status" value={formData.disability_status} onChange={handleChange}>
              <option value="">Select status</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
          </div>
        </Card>

        <Card title="Economic Details" subtitle="Income and occupation are used by most eligibility rules.">
          <div className="form-section-grid">
            <Input label="Annual income" name="annual_income" type="number" min="0" value={formData.annual_income} onChange={handleChange} placeholder="120000" error={fieldErrors.annual_income} required />
            <Select label="Occupation" name="occupation" value={formData.occupation} onChange={handleChange} error={fieldErrors.occupation} required>
              <option value="">Select occupation</option>
              <option value="farmer">Farmer</option>
              <option value="student">Student</option>
              <option value="msme_owner">MSME owner</option>
              <option value="self_employed">Self employed</option>
              <option value="salaried">Salaried</option>
              <option value="unemployed">Unemployed</option>
              <option value="artisan">Artisan</option>
              <option value="unorganised_sector">Unorganised sector</option>
            </Select>
            <Select label="Farmer status" name="farmer_status" value={formData.farmer_status} onChange={handleChange}>
              <option value="">Select status</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
            {formData.farmer_status === "yes" && (
              <Input label="Land area in acres" name="land_area" type="number" min="0" step="0.01" value={formData.land_area} onChange={handleChange} placeholder="2.5" />
            )}
          </div>
        </Card>

        <Card title="Education Details" subtitle="Used for scholarship and student-linked recommendations.">
          <div className="form-section-grid">
            <Select label="Education level" name="education_level" value={formData.education_level} onChange={handleChange}>
              <option value="">Select education level</option>
              <option value="school">School</option>
              <option value="post-matric">Post-matric</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="graduate">Graduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="none">No formal education</option>
            </Select>
          </div>
        </Card>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        <div className="sticky-form-actions">
          <Button type="submit" disabled={loading} icon={SearchCheck}>
            {loading ? "Checking..." : "Check Eligible Schemes"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setFormData(getSavedProfile())} icon={RotateCcw}>
            Reset
          </Button>
          <Button type="button" variant="ghost" onClick={handleClear} icon={Trash2}>
            Clear Form
          </Button>
        </div>
      </form>
    </section>
  );
}

export default CitizenProfileForm;
