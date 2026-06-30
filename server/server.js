import "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import schemeRoutes from "./routes/schemeRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import ocrRoutes from "./routes/ocrRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import extractRulesRoutes from "./routes/extractRulesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import importRoutes from "./routes/importRoutes.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
};

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(apiLimiter);

app.get("/", (req, res) => {
  res.json({ message: "SchemeSetu backend running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "SchemeSetu API is running" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/schemes", schemeRoutes);
app.use("/api/recommend", recommendationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/extract-rules", extractRulesRoutes);
app.use("/api/import", importRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
  } catch (error) {
    console.error(`Database startup failed: ${error.message}`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`SchemeSetu backend URL: http://localhost:${PORT}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Please stop the process or set PORT=${PORT + 1} in .env`);
      process.exit(1);
    }

    console.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason?.message || reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error.message);
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
});
