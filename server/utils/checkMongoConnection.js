import mongoose from "mongoose";

export function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

export function sendMongoUnavailable(res) {
  return res.status(503).json({
    success: false,
    message: "Authentication service unavailable. MongoDB is not connected."
  });
}
