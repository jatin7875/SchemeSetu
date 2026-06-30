import mongoose from "mongoose";

const adminUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "reviewer"], default: "admin" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.AdminUser || mongoose.model("AdminUser", adminUserSchema);
