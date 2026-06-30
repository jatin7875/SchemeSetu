import express from "express";
import multer from "multer";
import ImportJob from "../models/ImportJob.js";
import { isMongoConnected } from "../config/db.js";
import { protectAdmin } from "../middleware/authMiddleware.js";
import { importSchemeRecords, parseCsvRecords } from "../services/importService.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(protectAdmin);

function requireMongo(req, res, next) {
  if (!isMongoConnected()) {
    return res.status(503).json({
      success: false,
      message: "Import workflow requires MongoDB. Set MONGO_URI and restart the backend."
    });
  }
  next();
}

router.post("/schemes/json", requireMongo, upload.single("file"), async (req, res, next) => {
  try {
    const records = req.file
      ? JSON.parse(req.file.buffer.toString("utf-8"))
      : req.body.records;
    const normalizedRecords = Array.isArray(records) ? records : records?.schemes;

    if (!Array.isArray(normalizedRecords)) {
      return res.status(400).json({ success: false, message: "JSON import must contain an array of scheme records" });
    }

    const job = await importSchemeRecords(normalizedRecords, {
      importType: "json",
      fileName: req.file?.originalname || "request-body.json",
      adminId: req.admin._id
    });

    res.status(201).json({ success: true, job });
  } catch (error) {
    next(error);
  }
});

router.post("/schemes/csv", requireMongo, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "CSV file is required" });
    }

    const records = parseCsvRecords(req.file.buffer.toString("utf-8"));
    const job = await importSchemeRecords(records, {
      importType: "csv",
      fileName: req.file.originalname,
      adminId: req.admin._id
    });

    res.status(201).json({ success: true, job });
  } catch (error) {
    next(error);
  }
});

router.get("/jobs", requireMongo, async (req, res, next) => {
  try {
    const jobs = await ImportJob.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, jobs });
  } catch (error) {
    next(error);
  }
});

router.get("/jobs/:id", requireMongo, async (req, res, next) => {
  try {
    const job = await ImportJob.findById(req.params.id).lean();
    if (!job) {
      return res.status(404).json({ success: false, message: "Import job not found" });
    }
    res.json({ success: true, job });
  } catch (error) {
    next(error);
  }
});

export default router;
