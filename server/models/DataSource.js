import mongoose from "mongoose";

const dataSourceSchema = new mongoose.Schema(
  {
    source_name: { type: String, required: true },
    source_type: {
      type: String,
      enum: ["myscheme", "india_gov", "data_gov", "ministry_pdf", "state_edistrict", "manual"],
      default: "manual",
      index: true
    },
    source_url: String,
    department: String,
    state: String,
    last_checked: Date,
    status: { type: String, default: "active" },
    notes: String
  },
  { timestamps: true }
);

export default mongoose.models.DataSource || mongoose.model("DataSource", dataSourceSchema);
