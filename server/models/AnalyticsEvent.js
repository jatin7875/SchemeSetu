import mongoose from "mongoose";

const analyticsEventSchema = new mongoose.Schema(
  {
    event_type: { type: String, default: "recommendation_generated", index: true },
    citizen_profile_id: { type: mongoose.Schema.Types.ObjectId, ref: "CitizenProfile", default: null },
    recommendation_id: { type: mongoose.Schema.Types.ObjectId, ref: "Recommendation", default: null },
    citizen_profile: mongoose.Schema.Types.Mixed,
    recommendations: [mongoose.Schema.Types.Mixed]
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.AnalyticsEvent || mongoose.model("AnalyticsEvent", analyticsEventSchema);
