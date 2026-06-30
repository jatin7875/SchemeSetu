import mongoose from "mongoose";

const recommendationItemSchema = new mongoose.Schema(
  {
    scheme_id: String,
    scheme_name: String,
    category: mongoose.Schema.Types.Mixed,
    rule_score: Number,
    ml_score: { type: Number, default: null },
    final_score: Number,
    status: String,
    matched_conditions: [String],
    failed_conditions: [String]
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    citizen_profile_id: { type: mongoose.Schema.Types.ObjectId, ref: "CitizenProfile", default: null },
    recommendations: [recommendationItemSchema],
    top_scheme_id: String,
    average_score: Number
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.Recommendation || mongoose.model("Recommendation", recommendationSchema);
