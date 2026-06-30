import mongoose from "mongoose";

const citizenProfileSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    age: Number,
    gender: String,
    state: String,
    district: String,
    caste: String,
    annual_income: Number,
    occupation: String,
    disability_status: String,
    farmer_status: String,
    bpl_status: String,
    ration_card_type: String,
    education_level: String,
    land_area: Number
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.CitizenProfile || mongoose.model("CitizenProfile", citizenProfileSchema);
