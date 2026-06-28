import express from "express";
import { getAllSchemes, getTemporarySchemes } from "../utils/schemeStore.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const schemes = await getAllSchemes();
    const categoryCounts = {};

    schemes.forEach((scheme) => {
      const categories = Array.isArray(scheme.category) ? scheme.category : [scheme.category || "Uncategorized"];
      categories.forEach((category) => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    });

    res.json({
      total_schemes: schemes.length,
      category_counts: categoryCounts,
      total_temporary_admin_added_schemes: getTemporarySchemes().length
    });
  } catch (error) {
    next(error);
  }
});

export default router;
