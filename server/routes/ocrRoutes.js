import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import multer from "multer";
import { verifyDocument } from "../services/ocrService.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../uploads");

await fs.mkdir(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error("Only JPG, JPEG and PNG files are supported for now");
      error.code = "INVALID_FILE_TYPE";
      return cb(error);
    }
    cb(null, true);
  }
});

router.post("/verify-document", upload.single("document"), async (req, res, next) => {
  const uploadedFile = req.file;

  try {
    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: "Document file is required" });
    }

    if (!req.body.citizenProfile) {
      return res.status(400).json({ success: false, message: "citizenProfile JSON is required" });
    }

    let citizenProfile;
    try {
      citizenProfile = JSON.parse(req.body.citizenProfile);
    } catch (error) {
      return res.status(400).json({ success: false, message: "Invalid citizenProfile JSON" });
    }

    const result = await verifyDocument(uploadedFile.path, citizenProfile);

    res.json({
      ...result,
      document_name: uploadedFile.originalname
    });
  } catch (error) {
    next(error);
  } finally {
    // Uploaded certificates are temporary and are deleted after OCR to avoid storing sensitive documents.
    if (uploadedFile?.path) {
      await fs.unlink(uploadedFile.path).catch(() => {});
    }
  }
});

export default router;
