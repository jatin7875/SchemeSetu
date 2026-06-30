import express from "express";
import { protectAdmin } from "../middleware/authMiddleware.js";
import { getMe, loginAdmin, logoutAdmin, registerAdmin } from "../controllers/authController.js";

const router = express.Router();

router.post("/admin/register", registerAdmin);
router.post("/admin/login", loginAdmin);
router.get("/me", protectAdmin, getMe);
router.post("/logout", logoutAdmin);

export default router;
