import mongoose from "mongoose";

const ocrVerificationSchema = new mongoose.Schema(
  {
    citizen_profile_id: { type: mongoose.Schema.Types.ObjectId, ref: "CitizenProfile", default: null },
    document_type: { type: String, default: "unknown" },
    extracted_data: mongoose.Schema.Types.Mixed,
    verification: mongoose.Schema.Types.Mixed
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.OcrVerification || mongoose.model("OcrVerification", ocrVerificationSchema);
