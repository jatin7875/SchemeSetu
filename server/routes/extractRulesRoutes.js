import express from "express";
import { extractRulesFromText } from "../services/aiService.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.status(400).json({ success: false, message: "text is required" });
    }

    const rules = await extractRulesFromText(text);
    res.json({ success: true, rules });
  } catch (error) {
    next(error);
  }
});

export default router;
