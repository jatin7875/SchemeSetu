import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import schemeRoutes from "./routes/schemeRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import ocrRoutes from "./routes/ocrRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import extractRulesRoutes from "./routes/extractRulesRoutes.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "SchemeSetu backend running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "SchemeSetu API is running" });
});

app.use("/api/schemes", schemeRoutes);
app.use("/api/recommend", recommendationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/extract-rules", extractRulesRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.message);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File size must be 5MB or less" });
  }
  if (err.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: err.message || "Something went wrong on the server" });
});

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
