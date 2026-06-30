import express from "express";
import { findSchemeById, normalizeSchemeForClient, paginateSchemes } from "../utils/schemeStore.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await paginateSchemes({ ...req.query, publicOnly: true });
    res.json({
      success: true,
      schemes: result.items.map(normalizeSchemeForClient),
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const scheme = await findSchemeById(req.params.id);

    if (!scheme) {
      return res.status(404).json({ success: false, message: "Scheme not found" });
    }

    res.json({ success: true, scheme: normalizeSchemeForClient(scheme) });
  } catch (error) {
    next(error);
  }
});

export default router;
