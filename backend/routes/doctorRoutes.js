import express from "express";
import {
  createDoctorProfile,
  getAllDoctors,
  getDoctorById,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  uploadDoctorProfileImage
} from "../controllers/doctorController.js";
import {imageUpload} from "../middleware/uploadMiddleware.js";

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

router.patch(
  "/profile-image",
  auth,
  authorizeRoles("doctor"),
  imageUpload.single("profileImage"),
  uploadDoctorProfileImage
);


export default router;
