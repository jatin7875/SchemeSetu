import express from "express";
import {
  generateAnalyticsSummary,
  resetAnalyticsEvents
} from "../services/analyticsService.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protectAdmin);

router.get("/dashboard", async (req, res, next) => {
  try {
    const summary = await generateAnalyticsSummary(req.query);
    res.set("Cache-Control", "no-store");
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

router.get("/recent", async (req, res, next) => {
  try {
    const summary = await generateAnalyticsSummary(req.query);
    res.json({ success: true, recent_applications: summary.recent_applications });
  } catch (error) {
    next(error);
  }
});

router.get("/state-wise", async (req, res, next) => {
  try {
    const summary = await generateAnalyticsSummary(req.query);
    res.json({ success: true, state_wise_applications: summary.state_wise_applications });
  } catch (error) {
    next(error);
  }
});

router.get("/income-groups", async (req, res, next) => {
  try {
    const summary = await generateAnalyticsSummary(req.query);
    res.json({ success: true, income_group_analysis: summary.income_group_analysis });
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
