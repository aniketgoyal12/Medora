import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  verifyEmail,
  resendOTP,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  refreshToken,
  logOut,
  assignRole,
} from "../controllers/authController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", auth, getMe);
router.post("/verify-email", verifyEmail);
router.post("/resend-OTP", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logOut);
router.put("/assign-role", auth, authorizeRoles("admin", "superAdmin"), assignRole);

export default router;
