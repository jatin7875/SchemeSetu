export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File size must be 5MB or less" });
  }

  if (err.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.code === 11000) {
    if (err.keyPattern?.email || err.keyValue?.email) {
      return res.status(409).json({ success: false, message: "Admin already exists with this email" });
    }
    return res.status(409).json({ success: false, message: "Duplicate record already exists" });
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.publicMessage || err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" && err.stack ? { stack: err.stack } : {})
  });
}
