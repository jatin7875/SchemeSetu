import jwt from "jsonwebtoken";
import AdminUser from "../models/AdminUser.js";
import { isMongoConnected } from "../utils/checkMongoConnection.js";

function getToken(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return req.cookies?.token || null;
}

export async function protectAdmin(req, res, next) {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Authentication service unavailable. MongoDB is not connected."
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ success: false, message: "JWT_SECRET is not configured" });
    }

    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const admin = await AdminUser.findById(decoded.id).select("-passwordHash");
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: "Invalid admin session" });
    }

    req.user = admin;
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}
