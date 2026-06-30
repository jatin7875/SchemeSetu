import mongoose from "mongoose";

const eligibilityRulesSchema = new mongoose.Schema(
  {
    age_min: Number,
    age_max: Number,
    gender: String,
    state: String,
    income_limit: Number,
    eligible_castes: [String],
    requires_farmer: Boolean,
    requires_bpl: Boolean,
    requires_disability: Boolean,
    eligible_occupations: [String],
    education_level: String,
    ration_card_type: String,
    land_area_max: Number,
    land_area_min: Number,
    custom_rules: [mongoose.Schema.Types.Mixed]
  },
  { _id: false }
);

const schemeSchema = new mongoose.Schema(
  {
    scheme_id: { type: String, required: true, unique: true, index: true },
    scheme_name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: [{ type: String, trim: true }],
    scheme_level: { type: String, enum: ["central", "state", "centrally_sponsored", "unknown"], default: "unknown", index: true },
    state: { type: String, default: null, index: true },
    ministry_or_department: { type: String, default: "" },
    description: { type: String, default: "" },
    benefits: { type: String, default: "" },
    eligibility: { type: String, default: "" },
    eligibility_rules: { type: eligibilityRulesSchema, default: () => ({}) },
    required_documents: { type: String, default: "" },
    application_url: { type: String, default: "" },
    source_urls: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    status: { type: String, enum: ["active", "closed", "merged", "unknown"], default: "unknown", index: true },
    verification_status: {
      type: String,
      enum: ["draft", "needs_review", "verified", "outdated", "rejected"],
      default: "draft",
      index: true
    },
    last_verified: { type: Date, default: null },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
    data_source_id: { type: mongoose.Schema.Types.ObjectId, ref: "DataSource", default: null }
  },
  { timestamps: true }
);

schemeSchema.index({ scheme_name: "text", description: "text", benefits: "text", eligibility: "text", tags: "text" });

export default mongoose.models.Scheme || mongoose.model("Scheme", schemeSchema);
