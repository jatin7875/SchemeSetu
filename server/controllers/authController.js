import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AdminUser from "../models/AdminUser.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isMongoConnected, sendMongoUnavailable } from "../utils/checkMongoConnection.js";

function safeAdmin(admin) {
  return {
    id: admin._id.toString(),
    name: admin.name,
    email: admin.email,
    role: admin.role
  };
}

function setAuthCookie(res, token) {
  res.cookie?.("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function generateToken(admin) {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET is not configured");
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign(
    { id: admin._id.toString(), role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}

export const registerAdmin = asyncHandler(async (req, res) => {
  if (!isMongoConnected()) {
    return sendMongoUnavailable(res);
  }

  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const role = ["admin", "reviewer"].includes(req.body.role) ? req.body.role : "admin";

  if (!name) {
    return res.status(400).json({ success: false, message: "Name is required" });
  }

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ success: false, message: "Valid email is required" });
  }

  if (!password) {
    return res.status(400).json({ success: false, message: "Password is required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: "JWT_SECRET is not configured" });
  }

  const existingAdmin = await AdminUser.findOne({ email });
  if (existingAdmin) {
    return res.status(409).json({ success: false, message: "Admin already exists with this email" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await AdminUser.create({
    name,
    email,
    passwordHash,
    role,
    isActive: true
  });

  const token = generateToken(admin);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: "Admin registered successfully",
    token,
    admin: safeAdmin(admin)
  });
});

export const loginAdmin = asyncHandler(async (req, res) => {
  if (!isMongoConnected()) {
    return sendMongoUnavailable(res);
  }

  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ success: false, message: "Valid email is required" });
  }

  if (!password) {
    return res.status(400).json({ success: false, message: "Password is required" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: "JWT_SECRET is not configured" });
  }

  const admin = await AdminUser.findOne({ email });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  if (!admin.isActive) {
    return res.status(403).json({ success: false, message: "Admin account is inactive" });
  }

  const token = generateToken(admin);
  setAuthCookie(res, token);

  res.json({
    success: true,
    message: "Login successful",
    token,
    admin: safeAdmin(admin)
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, admin: safeAdmin(req.user || req.admin) });
});

export function logoutAdmin(req, res) {
  res.clearCookie?.("token");
  res.json({ success: true, message: "Logged out successfully" });
}
