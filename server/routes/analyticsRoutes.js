import express from "express";
import { generateAnalyticsSummary, resetAnalyticsEvents } from "../services/analyticsService.js";

const router = express.Router();

router.get("/dashboard", async (req, res, next) => {
  try {
    const summary = await generateAnalyticsSummary(req.query);
    res.set("Cache-Control", "no-store");
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

router.delete("/reset", async (req, res, next) => {
  try {
    await resetAnalyticsEvents();
    res.json({ success: true, message: "Analytics data reset successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
