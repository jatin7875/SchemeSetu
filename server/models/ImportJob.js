import mongoose from "mongoose";

const importJobSchema = new mongoose.Schema(
  {
    file_name: String,
    import_type: { type: String, enum: ["json", "csv", "manual", "pdf_text"], required: true },
    status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending", index: true },
    total_records: { type: Number, default: 0 },
    inserted_count: { type: Number, default: 0 },
    updated_count: { type: Number, default: 0 },
    failed_count: { type: Number, default: 0 },
    error_messages: [String],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null }
  },
  { timestamps: true }
);

export default mongoose.models.ImportJob || mongoose.model("ImportJob", importJobSchema);
