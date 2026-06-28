import express from "express";
import { getAllSchemes, normalizeSchemeForClient } from "../utils/schemeStore.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const schemes = await getAllSchemes();
    res.json(schemes.map(normalizeSchemeForClient));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const schemes = await getAllSchemes();
    const scheme = schemes.find((item) => item.scheme_id === req.params.id);

    if (!scheme) {
      return res.status(404).json({ message: "Scheme not found" });
    }

    res.json(normalizeSchemeForClient(scheme));
  } catch (error) {
    next(error);
  }
});

export default router;
