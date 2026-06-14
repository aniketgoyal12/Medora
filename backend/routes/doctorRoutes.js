import express from "express";
import {
  createDoctorProfile,
  getAllDoctors,
  getDoctorById,
  getMyDoctorProfile,
  updateMyDoctorProfile,
} from "../controllers/doctorController.js";

import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", auth, authorizeRoles("doctor"), createDoctorProfile);

router.get("/get", getAllDoctors);

router.get("/me", auth, authorizeRoles("doctor"), getMyDoctorProfile);

router.get("/:id", getDoctorById);

router.put(
  "/me",
  auth,
  authorizeRoles("doctor"),
  updateMyDoctorProfile,
);

export default router;
