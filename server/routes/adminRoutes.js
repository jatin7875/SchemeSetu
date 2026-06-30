import express from "express";
import mongoose from "mongoose";
import Scheme from "../models/Scheme.js";
import { isMongoConnected } from "../config/db.js";
import { protectAdmin } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/adminMiddleware.js";
import { addTemporaryScheme, normalizeSchemeForClient } from "../utils/schemeStore.js";
import { normalizeSchemeRecord, slugify } from "../utils/schemeNormalizer.js";
import { validateSchemeRecord } from "../utils/validateSchemeRecord.js";

const router = express.Router();

function adminSchemeQuery(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { scheme_id: id }, { slug: id }] };
  }
  return { $or: [{ scheme_id: id }, { slug: id }] };
}

router.use(protectAdmin);

router.get("/schemes", async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: "Admin scheme management requires MongoDB" });
    }

    const query = {};
    ["verification_status", "status", "scheme_level", "state"].forEach((field) => {
      if (req.query[field]) query[field] = req.query[field];
    });
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const [schemes, total] = await Promise.all([
      Scheme.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Scheme.countDocuments(query)
    ]);

    res.json({
      success: true,
      schemes: schemes.map(normalizeSchemeForClient),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/schemes/:id", async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: "Admin scheme management requires MongoDB" });
    }

    const scheme = await Scheme.findOne(adminSchemeQuery(req.params.id)).lean();
    if (!scheme) {
      return res.status(404).json({ success: false, message: "Scheme not found" });
    }

    res.json({ success: true, scheme: normalizeSchemeForClient(scheme) });
  } catch (error) {
    next(error);
  }
});

router.post("/schemes", async (req, res, next) => {
  const {
    scheme_name,
    category,
    benefits,
    eligibility,
    required_documents,
    application_url,
    source_urls,
    tags,
    eligibility_rules_extracted
  } = req.body;

  try {
    const payload = {
      ...req.body,
      scheme_name,
      category,
      benefits,
      eligibility,
      required_documents,
      application_url,
      source_urls,
      tags,
      eligibility_rules: req.body.eligibility_rules || eligibility_rules_extracted || req.body.eligibility_rules_extracted
    };

    const validation = validateSchemeRecord(payload);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.errors.join(", "), errors: validation.errors });
    }

    if (!isMongoConnected()) {
      const scheme = {
        ...payload,
        scheme_id: `temp-${slugify(scheme_name)}-${Date.now()}`,
        status: "unknown",
        verification_status: "draft",
        last_verified: new Date().toISOString().slice(0, 10)
      };
      const savedScheme = addTemporaryScheme(scheme);
      return res.status(201).json({
        success: true,
        message: "MongoDB is unavailable. Scheme added temporarily for this server session.",
        scheme: normalizeSchemeForClient(savedScheme)
      });
    }

    const normalized = normalizeSchemeRecord(payload, {
      verification_status: req.body.verification_status || "draft",
      created_by: req.admin._id,
      updated_by: req.admin._id
    });
    const savedScheme = await Scheme.create(normalized);
    res.status(201).json({
      success: true,
      message: "Scheme created and queued for verification",
      scheme: normalizeSchemeForClient(savedScheme)
    });
  } catch (error) {
    next(error);
  }
});

router.put("/schemes/:id", async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: "Updating schemes requires MongoDB" });
    }

    const normalized = normalizeSchemeRecord(req.body, { updated_by: req.admin._id });
    delete normalized.scheme_id;
    const scheme = await Scheme.findOneAndUpdate(adminSchemeQuery(req.params.id), normalized, {
      new: true,
      runValidators: true
    });

    if (!scheme) {
      return res.status(404).json({ success: false, message: "Scheme not found" });
    }

    res.json({ success: true, message: "Scheme updated", scheme: normalizeSchemeForClient(scheme) });
  } catch (error) {
    next(error);
  }
});

router.delete("/schemes/:id", requireRole("admin"), async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: "Deleting schemes requires MongoDB" });
    }

    const scheme = await Scheme.findOneAndUpdate(
      adminSchemeQuery(req.params.id),
      { status: "closed", verification_status: "rejected", updated_by: req.admin._id },
      { new: true }
    );

    if (!scheme) {
      return res.status(404).json({ success: false, message: "Scheme not found" });
    }

    res.json({ success: true, message: "Scheme closed and rejected", scheme: normalizeSchemeForClient(scheme) });
  } catch (error) {
    next(error);
  }
});

router.patch("/schemes/:id/verify", async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: "Verifying schemes requires MongoDB" });
    }

    const verificationStatus = req.body.verification_status || "verified";
    if (!["draft", "needs_review", "verified", "outdated", "rejected"].includes(verificationStatus)) {
      return res.status(400).json({ success: false, message: "Invalid verification_status" });
    }

    const scheme = await Scheme.findOneAndUpdate(
      adminSchemeQuery(req.params.id),
      {
        verification_status: verificationStatus,
        status: req.body.status || "active",
        last_verified: verificationStatus === "verified" ? new Date() : undefined,
        updated_by: req.admin._id
      },
      { new: true }
    );

    if (!scheme) {
      return res.status(404).json({ success: false, message: "Scheme not found" });
    }

    res.json({ success: true, message: `Scheme marked as ${verificationStatus}`, scheme: normalizeSchemeForClient(scheme) });
  } catch (error) {
    next(error);
  }
});

export default router;
